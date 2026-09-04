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
 *
 * **配列ではなく `Record` にしてある。** `readonly ApprovableCollectionSlug[]` は
 * *部分集合*も受け付けるので、`ApprovableCollectionSlug` に新しいslugを足しても
 * ここへ書き忘れたことを型が検出できない（実測: `'articles'` を消しても `typecheck` は通った）。
 * その状態では、公開できるはずのcollectionが `unsupported-collection` で400になる。
 * `satisfies Record<ApprovableCollectionSlug, true>` なら**1件でも欠けるとtypecheckが落ちる**。
 */
const PUBLISHABLE_COLLECTIONS = {
  manufacturers: true,
  distributors: true,
  'robot-series': true,
  robots: true,
  'use-cases': true,
  deployments: true,
  articles: true,
} satisfies Record<ApprovableCollectionSlug, true>;

function isPublishableCollection(value: unknown): value is ApprovableCollectionSlug {
  return typeof value === 'string' && Object.hasOwn(PUBLISHABLE_COLLECTIONS, value);
}

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
  if (!isPublishableCollection(collection)) {
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
      collection,
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
