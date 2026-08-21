/**
 * publish後のcache revalidation webhook（`docs/plans/content-platform-migration-plan-v1.md`
 * Task 7 Step 1・2）。
 *
 * `revalidateTag()`（`next/cache`）を実際に呼ぶ**唯一**の場所。`lib/payload/revalidationHook.ts`
 * （各collection / globalの `afterChange` フック）と、必要であれば運用スクリプトからの
 * 手動トリガーの、両方の入口をここへ収束させる。
 *
 * fail-closed: 署名が無い・secretが未設定・署名が一致しない・collection名がallowlist外・
 * bodyがJSONとして壊れている——どれも「とりあえず通す」ことはせず、401 または 400 で拒否する。
 */
import { revalidateTag } from 'next/cache';
import {
  contentTags,
  COLLECTION_TO_TAG_KEY,
  isRevalidatableCollectionSlug,
  REVALIDATE_SIGNATURE_HEADER,
  verifyRevalidationSignature,
} from '@/lib/content/cacheTags';

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get(REVALIDATE_SIGNATURE_HEADER);

  if (!verifyRevalidationSignature(rawBody, signatureHeader)) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  let parsedBody: unknown;
  try {
    parsedBody = rawBody.length > 0 ? JSON.parse(rawBody) : undefined;
  } catch {
    return jsonResponse(400, { error: 'invalid-json' });
  }

  const collection = (parsedBody as { collection?: unknown } | undefined)?.collection;
  if (!isRevalidatableCollectionSlug(collection)) {
    return jsonResponse(400, {
      error: 'unknown-collection',
      allowlist: Object.keys(COLLECTION_TO_TAG_KEY),
    });
  }

  const tagKey = COLLECTION_TO_TAG_KEY[collection];
  const tag = contentTags[tagKey];
  revalidateTag(tag, 'max');

  // 必須修正1（remediation group 5）: revalidateTag()を実際に呼んだ後、成功レスポンスを
  // 返す前に構造化ログを出す。Vercel Function logsへ出る形（console.log）にし、
  // `msg`・`collection`・`tagKey`・`tag`で検索できるようにする——「webhookは届いたが、
  // 実際にrevalidateTag()まで到達したか」をここで確認できるようにするため
  // （lib/payload/revalidationHook.tsの成功ログは「webhookを呼んだ」ことしか示さない）。
  console.log(JSON.stringify({ msg: 'revalidate-content-tag-invalidated', collection, tagKey, tag }));

  return jsonResponse(200, { ok: true, collection, tag });
}
