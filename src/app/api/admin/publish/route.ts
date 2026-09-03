/**
 * Admin UI の Publish ボタンが叩くroute（`docs/plans/admin-publish-ui-plan-v1.md` Task 4）。
 *
 * UIは「①`draft=true`で保存 → ②このrouteへPOST」の2段で動く。①が作ったversionにだけ
 * 公開意図tokenが刻まれており、`publishFromAdmin()` がそれを照合してから公開する。
 *
 * 承認contextは発行しない（できない）。`approvedPublishContext` を import してよいのは
 * `publishApprovedVersion.ts` だけで、`scripts/check-publish-authorization-boundaries.mjs` が
 * `npm run check` で機械強制している。ここは必ず service 経由で公開する。
 *
 * `export const runtime` は書かない。`next.config.ts` の `cacheComponents: true` と
 * route segment config の `runtime` は非互換（`audit-upload/session/route.ts:11-16` に実測記録）。
 */
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import type { ApprovableCollectionSlug } from '@/lib/payload/publishApprovedVersion';
import { publishFromAdmin } from '@/lib/payload/publishFromAdmin';
import { authenticatePublisher, isSameOriginRequest } from '@/lib/payload/publishRequestAuth';
import { type AdminPublishErrorBody, mapPublishError } from '@/lib/payload/adminPublishErrors';

/**
 * `ApprovableCollectionSlug` の実行時allowlist。型だけでは任意のslugが素通りするため、
 * `payload.find({ collection })` へ渡す前にここで閉じる。
 */
const PUBLISHABLE_COLLECTIONS: readonly ApprovableCollectionSlug[] = [
  'manufacturers',
  'distributors',
  'robot-series',
  'robots',
  'use-cases',
  'deployments',
  'articles',
];

/** body は `{ collection, id, publishIntentToken }` だけ。UUID + slug + id で十分収まる。 */
const MAX_BODY_BYTES = 8 * 1024;

function json(status: number, body: AdminPublishErrorBody | { ok: true; documentId: string | number }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}

/** `Content-Length` は任意headerなので、宣言があれば早期に、無ければ実読込で打ち切る。 */
async function readBoundedText(request: Request): Promise<string | null> {
  const declared = request.headers.get('content-length');
  if (declared) {
    const n = Number.parseInt(declared, 10);
    if (Number.isFinite(n) && n > MAX_BODY_BYTES) return null;
  }
  const text = await request.text();
  return Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES ? null : text;
}

export async function POST(request: Request): Promise<Response> {
  // `payload.config.ts` は `csrf` を設定しておらず、`extractJWT.js:21` が任意originの
  // cookieを受け入れる。公開は権限のある破壊的操作なので、ここで同一originを確かめる。
  if (!isSameOriginRequest(request)) {
    return json(403, { ok: false, error: 'cross-origin-request-rejected' });
  }

  const payload = await getPayload({ config: payloadConfig });

  const auth = await authenticatePublisher(request, payload);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

  const raw = await readBoundedText(request);
  if (raw === null) return json(413, { ok: false, error: 'body-too-large' });

  let body: { collection?: unknown; id?: unknown; publishIntentToken?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json(400, { ok: false, error: 'malformed-body' });
  }

  const collection = body.collection;
  if (typeof collection !== 'string' || !PUBLISHABLE_COLLECTIONS.includes(collection as ApprovableCollectionSlug)) {
    return json(400, { ok: false, error: 'unsupported-collection' });
  }
  const id = body.id;
  if ((typeof id !== 'string' || id.length === 0) && typeof id !== 'number') {
    return json(400, { ok: false, error: 'invalid-id' });
  }
  const publishIntentToken = body.publishIntentToken;
  if (typeof publishIntentToken !== 'string' || publishIntentToken.length === 0) {
    return json(400, { ok: false, error: 'missing-publish-intent-token' });
  }

  try {
    const result = await publishFromAdmin({
      payload,
      collection: collection as ApprovableCollectionSlug,
      id,
      publishIntentToken,
      publisherUser: auth.user,
    });
    // revalidationは `publishApprovedVersion` がcommit後に自分で通知する（`:182`）。ここでは何もしない。
    return json(200, { ok: true, documentId: result.documentId });
  } catch (error) {
    return json(...mapPublishError(error));
  }
}
