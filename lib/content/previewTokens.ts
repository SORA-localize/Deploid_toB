/**
 * Draft Mode preview token / preview session（`docs/plans/content-platform-migration-plan-v1.md`
 * Task 7 Step 4）。
 *
 * `/api/draft-mode/enable` は次のどちらかだけを受け付ける:
 *
 * 1. Payloadへログイン済みで `content-draft-writer` 以上のuser（`verifyDraftWriterSession()`）。
 * 2. `PREVIEW_TOKEN_SECRET` でHMAC署名した5分以内のtoken（`mintPreviewToken()` /
 *    `consumePreviewToken()`）。payloadは `sub`・`exp`・128-bit nonce・allowlist済み相対redirect
 *    を持ち、nonceを `preview_nonces` tableで原子的に未使用→使用済みにする。
 *
 * どちらの経路でDraft Modeが有効化されても、以降のrequestは`getActivePreviewSession()`で
 * **毎回**再検証する（cookieが存在するだけではdraftを返さない）。userの場合はDBから
 * roleを都度読み直すため、cookie発行後にroleが失効すればすぐ拒否側へ倒れる
 * （JWTに埋め込まれた古いroleを信用しない）。
 *
 * fail-closed方針: secret未設定・署名不一致・期限切れ・nonce再利用・redirect allowlist外・
 * role不足——すべて明示的に拒否する分岐を通り、「分からなければ通す」分岐は無い。
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';
import { isContentDraftWriterOrAboveUser, type AdminRole } from '../payload/access';

// ─── 署名envelope（preview token・preview sessionで共有する形） ─────────────────

/** `base64url(JSON) + '.' + hex(HMAC-SHA256)`。JWTのような3partヘッダは持たない最小形。 */
function signEnvelope(payloadObject: unknown, secret: string): string {
  const json = JSON.stringify(payloadObject);
  const payloadB64 = Buffer.from(json, 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(payloadB64, 'utf8').digest('hex');
  return `${payloadB64}.${signature}`;
}

/**
 * fail-closed: 形式不正・secret未設定・署名不一致・JSONとして壊れている——すべて `null`。
 * 呼び出し側はこれを「無条件拒否」として扱う。
 */
function verifyEnvelope<T>(token: unknown, secret: string | undefined): T | null {
  if (!secret) return null;
  if (typeof token !== 'string' || token.length === 0) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, providedSignature] = parts;
  if (!/^[0-9a-f]+$/i.test(providedSignature)) return null;

  const expectedSignature = createHmac('sha256', secret).update(payloadB64, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  const providedBuf = Buffer.from(providedSignature, 'hex');
  if (expectedBuf.length !== providedBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, providedBuf)) return null;

  try {
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// ─── redirect allowlist（open redirect防止） ────────────────────────────────

const ALLOWED_PREVIEW_ROOTS = ['/', '/robots', '/manufacturers', '/use-cases', '/reports'] as const;
const MAX_DECODE_ROUNDS = 5;

/**
 * percent-encodingを最大 `MAX_DECODE_ROUNDS` 回、安定するまで繰り返し復号する。二重encode
 * （`%252e%252e` のような、1回の `decodeURIComponent` では `..` に化けない入力）を見逃さない
 * ため。壊れたpercent-encodingは即 `null`（fail-closed）。
 */
function fullyDecode(input: string): string | null {
  let current = input;
  for (let round = 0; round < MAX_DECODE_ROUNDS; round += 1) {
    let next: string;
    try {
      next = decodeURIComponent(current);
    } catch {
      return null;
    }
    // 各段階で traversal / backslash の兆候が出た時点で即座に弾く（最終形だけを見ない）。
    if (next.includes('..') || next.includes('\\')) return next;
    if (next === current) return next;
    current = next;
  }
  return current;
}

/**
 * 相対pathかつ許可rootの配下だけを許す。`//host`（protocol-relative）、絶対URL
 * （`scheme:`）、backslash、encoded traversalはすべて拒否する。
 */
export function isAllowedPreviewRedirect(rawPath: string): boolean {
  if (typeof rawPath !== 'string' || rawPath.length === 0) return false;
  if (rawPath.includes('\\')) return false;
  if (!rawPath.startsWith('/')) return false;
  if (rawPath.startsWith('//')) return false;

  const decoded = fullyDecode(rawPath);
  if (decoded === null) return false;
  if (decoded.includes('\\')) return false;
  if (decoded.includes('..')) return false;
  if (!decoded.startsWith('/')) return false;
  if (decoded.startsWith('//')) return false;
  // 復号後に scheme（"javascript:" 等）が現れたら拒否する。先頭は必ず "/" である前提の上で、
  // どこかに "scheme:" 相当のcolonが混入していないかも見ておく（多重decodeでの回避策）。
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return false;

  const pathOnly = decoded.split(/[?#]/, 1)[0]!;
  return ALLOWED_PREVIEW_ROOTS.some((root) => {
    if (root === '/') return pathOnly === '/';
    return pathOnly === root || pathOnly.startsWith(`${root}/`);
  });
}

// ─── preview token（Step 4-2: 外部viewer向けの5分token） ───────────────────────

const PREVIEW_TOKEN_TTL_MS = 5 * 60 * 1000;
const NONCE_BYTE_LENGTH = 16; // 128-bit

export interface PreviewTokenPayload {
  /** 発行対象の閲覧者識別子（brief「閲覧者」）。email等、監査ログ用の自由文字列。 */
  sub: string;
  /** unixミリ秒。発行から最大5分。 */
  exp: number;
  /** unixミリ秒。監査用（`exp` はこれ+TTLで、tokenの真の期限は署名対象の `exp` 自体）。 */
  iat: number;
  /** 128-bit nonce（32文字hex）。`preview_nonces` tableでの単回消費に使う。 */
  nonce: string;
  /** 許可rootの配下だけを許すredirect先の相対path。 */
  redirect: string;
}

export interface MintPreviewTokenArgs {
  payload: Payload;
  sub: string;
  redirect: string;
  /** テスト用の時刻差し替え。省略時は `Date.now()`。 */
  now?: number;
  /** テスト用のTTL差し替え（5分を超える値を渡しても常に5分へ丸められる — fail-closed）。 */
  ttlMs?: number;
}

/**
 * `content-publisher` が発行する5分tokenを作る。`redirect` はここでも検証する
 * （検証側だけに頼らない多重防御）。nonceは `preview_nonces` へ未使用として先に記録してから
 * 署名済みtokenを返す——record前にtokenだけ発行すると、DB書き込みに失敗した場合でも
 * 「有効に見えるが消費できないtoken」を渡してしまうため。
 */
export async function mintPreviewToken(args: MintPreviewTokenArgs): Promise<string> {
  const secret = process.env.PREVIEW_TOKEN_SECRET;
  if (!secret) {
    throw new Error('PREVIEW_TOKEN_SECRET is not set. Cannot mint a preview token without it.');
  }
  if (!isAllowedPreviewRedirect(args.redirect)) {
    throw new Error(`preview-redirect-not-allowed: "${args.redirect}" is not an allowlisted preview redirect target.`);
  }

  const now = args.now ?? Date.now();
  const ttlMs = Math.min(args.ttlMs ?? PREVIEW_TOKEN_TTL_MS, PREVIEW_TOKEN_TTL_MS);
  const exp = now + ttlMs;
  const nonce = randomBytes(NONCE_BYTE_LENGTH).toString('hex');

  await args.payload.db.drizzle.execute(sql`
    INSERT INTO "preview_nonces" ("nonce", "used", "created_at", "expires_at")
    VALUES (${nonce}, false, ${new Date(now).toISOString()}, ${new Date(exp).toISOString()})
  `);

  const tokenPayload: PreviewTokenPayload = { sub: args.sub, exp, iat: now, nonce, redirect: args.redirect };
  return signEnvelope(tokenPayload, secret);
}

export type ConsumePreviewTokenResult =
  | { ok: true; sub: string; redirect: string }
  | { ok: false; reason: 'malformed' | 'expired' | 'redirect-not-allowed' | 'nonce-reused-or-unknown' };

/**
 * tokenを検証し、nonceを原子的に消費する。**成功できるのは1回だけ**——2回目以降の呼び出しは
 * `nonce-reused-or-unknown` になる（DBの `UPDATE ... WHERE used = false` が0行しか
 * 更新できないため）。
 */
export async function consumePreviewToken(args: {
  payload: Payload;
  token: string;
  now?: number;
}): Promise<ConsumePreviewTokenResult> {
  const secret = process.env.PREVIEW_TOKEN_SECRET;
  const parsed = verifyEnvelope<PreviewTokenPayload>(args.token, secret);
  if (
    !parsed ||
    typeof parsed.sub !== 'string' ||
    typeof parsed.exp !== 'number' ||
    typeof parsed.nonce !== 'string' ||
    !/^[0-9a-f]{32}$/i.test(parsed.nonce) ||
    typeof parsed.redirect !== 'string'
  ) {
    return { ok: false, reason: 'malformed' };
  }

  const now = args.now ?? Date.now();
  if (now > parsed.exp) return { ok: false, reason: 'expired' };
  // 署名済みpayload自体の寿命が5分の上限を超えていたら、署名が有効でも拒否する
  // （`iat`/`exp`は署名対象なので改ざんでは動かせないが、発行ロジックのバグで5分を超える
  // tokenが署名されてしまった場合の多重防御）。
  if (typeof parsed.iat !== 'number' || parsed.exp - parsed.iat > PREVIEW_TOKEN_TTL_MS) {
    return { ok: false, reason: 'expired' };
  }
  if (!isAllowedPreviewRedirect(parsed.redirect)) return { ok: false, reason: 'redirect-not-allowed' };

  const result = await args.payload.db.drizzle.execute(sql`
    UPDATE "preview_nonces"
    SET "used" = true
    WHERE "nonce" = ${parsed.nonce} AND "used" = false AND "expires_at" > ${new Date(now).toISOString()}
    RETURNING "id"
  `);
  const consumedRowCount = Array.isArray((result as { rows?: unknown[] }).rows)
    ? (result as { rows: unknown[] }).rows.length
    : ((result as { rowCount?: number }).rowCount ?? 0);
  if (consumedRowCount !== 1) return { ok: false, reason: 'nonce-reused-or-unknown' };

  return { ok: true, sub: parsed.sub, redirect: parsed.redirect };
}

// ─── preview session（Draft Mode有効化後、毎requestで再検証する短命session） ───────

const PREVIEW_SESSION_TTL_MS = 60 * 60 * 1000; // 1時間。preview tokenの5分とは別の寿命。
export const PREVIEW_SESSION_COOKIE_NAME = 'deploid-preview-session';

export interface PreviewSessionPayload {
  kind: 'user' | 'token';
  /** kind==='user' のときはPayload admin document id、kind==='token' のときは token の `sub`。 */
  sub: string;
  exp: number;
}

function mintPreviewSessionCookieValue(payload: PreviewSessionPayload, secret: string): string {
  return signEnvelope(payload, secret);
}

export function mintUserPreviewSession(adminUserId: string | number, now = Date.now()): string {
  const secret = process.env.PREVIEW_TOKEN_SECRET;
  if (!secret) throw new Error('PREVIEW_TOKEN_SECRET is not set. Cannot mint a preview session.');
  return mintPreviewSessionCookieValue({ kind: 'user', sub: String(adminUserId), exp: now + PREVIEW_SESSION_TTL_MS }, secret);
}

export function mintTokenPreviewSession(sub: string, now = Date.now()): string {
  const secret = process.env.PREVIEW_TOKEN_SECRET;
  if (!secret) throw new Error('PREVIEW_TOKEN_SECRET is not set. Cannot mint a preview session.');
  return mintPreviewSessionCookieValue({ kind: 'token', sub, exp: now + PREVIEW_SESSION_TTL_MS }, secret);
}

export type ActivePreviewSession =
  | { ok: true; kind: 'user'; sub: string; role: AdminRole }
  | { ok: true; kind: 'token'; sub: string }
  | { ok: false; reason: 'missing' | 'malformed' | 'expired' | 'role-revoked-or-insufficient' };

/**
 * draft取得側が**毎request**呼ぶ検証関数。cookieの署名・期限を見るだけでなく、
 * `kind === 'user'` のときは`admins`documentをDBから読み直し、現在roleが
 * `content-draft-writer`以上かを確認する（JWTに埋め込まれた古いroleを信用しない）。
 * roleが失効していれば、cookie自体は壊れていなくても `role-revoked-or-insufficient` で拒否する。
 */
export async function getActivePreviewSession(
  cookieValue: string | undefined,
  payload: Payload,
  now = Date.now(),
): Promise<ActivePreviewSession> {
  if (!cookieValue) return { ok: false, reason: 'missing' };

  const secret = process.env.PREVIEW_TOKEN_SECRET;
  const parsed = verifyEnvelope<PreviewSessionPayload>(cookieValue, secret);
  if (!parsed || typeof parsed.exp !== 'number' || typeof parsed.sub !== 'string') {
    return { ok: false, reason: 'malformed' };
  }
  if (parsed.kind !== 'user' && parsed.kind !== 'token') return { ok: false, reason: 'malformed' };
  if (now > parsed.exp) return { ok: false, reason: 'expired' };

  if (parsed.kind === 'token') {
    return { ok: true, kind: 'token', sub: parsed.sub };
  }

  // kind === 'user': 毎回DBから現在のroleを読み直す。
  let currentUser: { role?: AdminRole } | null = null;
  try {
    currentUser = (await payload.findByID({
      collection: 'admins',
      id: parsed.sub,
      overrideAccess: true,
      depth: 0,
    })) as { role?: AdminRole } | null;
  } catch {
    currentUser = null;
  }
  if (!currentUser || !isContentDraftWriterOrAboveUser({ id: parsed.sub, role: currentUser.role })) {
    return { ok: false, reason: 'role-revoked-or-insufficient' };
  }
  return { ok: true, kind: 'user', sub: parsed.sub, role: currentUser.role! };
}

// ─── Payload session認証（Step 4-1: ログイン済みcontent-draft-writer以上） ──────────

export interface AuthenticatedDraftWriter {
  id: string | number;
  role: AdminRole;
}

/**
 * `/api/draft-mode/enable` 経路1: Payloadへログイン済みで `content-draft-writer` 以上のuser。
 * `payload.auth()` はrequestのcookie/headerからJWTを検証する（Payloadの標準auth strategy）。
 * ここでも埋め込まれたroleクレームだけで判断せず、**認証が返したuser documentのroleを
 * そのまま使う**（`payload.auth()` はDB由来のuser documentを返す実装であり、追加のDB読み直しは
 * 不要——「毎request検証」が必要なのは長寿命cookie/tokenを使う `getActivePreviewSession` 側）。
 */
export async function authenticateDraftWriter(
  request: Request,
  payload: Payload,
): Promise<AuthenticatedDraftWriter | null> {
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) return null;
  const role = (user as { role?: AdminRole }).role;
  if (!isContentDraftWriterOrAboveUser({ id: (user as { id: string | number }).id, role })) return null;
  return { id: (user as { id: string | number }).id, role: role! };
}
