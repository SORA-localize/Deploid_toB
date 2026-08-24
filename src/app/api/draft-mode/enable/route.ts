/**
 * Draft Mode有効化（`docs/plans/content-platform-migration-plan-v1.md` Task 7 Step 4）。
 *
 * 受け付けるのは次のどちらかだけ:
 * 1. Payloadへログイン済みで `content-draft-writer` 以上のuser（`authenticateDraftWriter`）。
 * 2. `PREVIEW_TOKEN_SECRET` で署名した5分以内のtoken（`consumePreviewToken` —
 *    nonceを `preview_nonces` で原子的に消費する。2回目以降は必ず失敗する）。
 *
 * 未認証・期限切れ・署名改ざん・nonce再利用・allowlist外redirectのいずれでも、
 * Draft Mode cookieもpreview session cookieも発行しない（fail-closed）。
 *
 * **`next/headers` の `draftMode()` はNext.jsのrequest-scopeでしか呼べない**ため、それ以外の
 * 判断（署名検証・nonce消費・role確認・redirect allowlist）はすべて `lib/content/previewTokens.ts`
 * の純粋関数へ切り出してある。ここでの役目は「検証が全部通ったときだけ `draftMode().enable()`を
 * 呼び、Cookieを立てる」という薄い配線だけ。preview session cookie自体は `next/headers` の
 * `cookies()` を使わず、Responseの `set-cookie` headerを直接組み立てる（同じrequest-scope制約を
 * 避け、route単体のテスト可能性を保つため）。
 */
import { draftMode } from 'next/headers';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import {
  authenticateDraftWriter,
  consumePreviewToken,
  isAllowedPreviewRedirect,
  mintTokenPreviewSession,
  mintUserPreviewSession,
  PREVIEW_SESSION_COOKIE_NAME,
} from '@/lib/content/previewTokens';

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60; // previewTokens.tsのPREVIEW_SESSION_TTL_MSと揃える

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}

function sessionCookieHeader(value: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${PREVIEW_SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}${secure}`;
}

interface EnableRequestInput {
  token?: string;
  redirect?: string;
}

/** GET（クリック用マジックリンク: `?token=...&redirect=...`）とPOST（JSON body）の両方を受ける。 */
async function parseInput(request: Request): Promise<EnableRequestInput | null> {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return {
      token: url.searchParams.get('token') ?? undefined,
      redirect: url.searchParams.get('redirect') ?? undefined,
    };
  }
  const raw = await request.text();
  if (raw.length === 0) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { token, redirect } = parsed as Record<string, unknown>;
    return {
      token: typeof token === 'string' ? token : undefined,
      redirect: typeof redirect === 'string' ? redirect : undefined,
    };
  } catch {
    return null;
  }
}

async function handle(request: Request): Promise<Response> {
  const input = await parseInput(request);
  if (input === null) {
    return jsonResponse(400, { error: 'invalid-request' });
  }

  const payload = await getPayload({ config: payloadConfig });

  // 経路2: token。redirectはtoken自身が持つ署名済みの値だけを信用する
  // （requestが別途送ってきたredirectがあっても無視する——tokenの外の値で挙動を変えない）。
  if (typeof input.token === 'string' && input.token.length > 0) {
    const result = await consumePreviewToken({ payload, token: input.token });
    if (!result.ok) {
      return jsonResponse(401, { error: result.reason });
    }

    const sessionCookie = mintTokenPreviewSession(result.sub);
    const draft = await draftMode();
    draft.enable();
    return new Response(null, {
      status: 303,
      headers: {
        location: result.redirect,
        'set-cookie': sessionCookieHeader(sessionCookie),
        'cache-control': 'private, no-store',
      },
    });
  }

  // 経路1: Payloadへログイン済みでcontent-draft-writer以上。
  const writer = await authenticateDraftWriter(request, payload);
  if (!writer) {
    return jsonResponse(401, { error: 'unauthenticated' });
  }

  const requestedRedirect = input.redirect ?? '/';
  if (!isAllowedPreviewRedirect(requestedRedirect)) {
    return jsonResponse(400, { error: 'redirect-not-allowed' });
  }

  const sessionCookie = mintUserPreviewSession(writer.id);
  const draft = await draftMode();
  draft.enable();
  return new Response(null, {
    status: 303,
    headers: {
      location: requestedRedirect,
      'set-cookie': sessionCookieHeader(sessionCookie),
      'cache-control': 'private, no-store',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
