/**
 * `/admin/draft-list`（一括公開画面）の「選択したN件を公開」が叩くroute。
 *
 * 単発publish（`../route.ts`）と違い、公開意図tokenは要らない。一覧から選んだ最新の
 * draft versionをそのまま公開するだけで、単発publish特有の「編集フォームの保存→公開の間に
 * 割り込まれる」競合が存在しないため（詳細は`lib/payload/bulkPublishFromAdmin.ts`のdocblock）。
 *
 * 承認contextは発行しない（できない）。`approvedPublishContext` を import してよいのは
 * `publishApprovedVersion.ts` だけで、`scripts/check-publish-authorization-boundaries.mjs` が
 * `npm run check` で機械強制している。ここは必ず`bulkPublishFromAdmin()`経由で公開する。
 *
 * `export const runtime` は書かない（`../route.ts`と同じ理由、`cacheComponents: true`と非互換）。
 */
import { getPayload, type Payload } from 'payload';
import payloadConfig from '@/payload.config';
import { bulkPublishFromAdmin, type BulkPublishItemResult } from '@/lib/payload/bulkPublishFromAdmin';
import { authenticatePublisher, isSameOriginRequest } from '@/lib/payload/publishRequestAuth';
import { type AdminPublishErrorBody, mapPublishError } from '@/lib/payload/adminPublishErrors';
import { MAX_BULK_BODY_BYTES, parseBulkPublishRequestBody } from '@/lib/payload/parseBulkPublishRequest';

function json(status: number, body: AdminPublishErrorBody | { ok: true; results: BulkPublishItemResult[] }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}

/** `../route.ts`の`readBoundedText`と同じ形。上限だけ配列分広い`MAX_BULK_BODY_BYTES`を使う。 */
async function readBoundedText(request: Request): Promise<string | null> {
  const declared = request.headers.get('content-length');
  if (declared) {
    const n = Number.parseInt(declared, 10);
    if (Number.isFinite(n) && n > MAX_BULK_BODY_BYTES) return null;
  }
  const text = await request.text();
  return Buffer.byteLength(text, 'utf8') > MAX_BULK_BODY_BYTES ? null : text;
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return json(403, { ok: false, error: 'cross-origin-request-rejected' });
  }

  let payload: Payload;
  try {
    payload = await getPayload({ config: payloadConfig });
  } catch (error) {
    return json(...mapPublishError(error));
  }

  const auth = await authenticatePublisher(request, payload);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

  const raw = await readBoundedText(request);
  if (raw === null) return json(413, { ok: false, error: 'body-too-large' });

  const parsed = parseBulkPublishRequestBody(raw);
  if (!parsed.ok) return json(400, { ok: false, error: parsed.error });

  const results = await bulkPublishFromAdmin({
    payload,
    items: parsed.items,
    publisherUser: auth.user,
  });

  // 個別itemの失敗はresults配列の中身であり、request自体は成功しているので常に200。
  return json(200, { ok: true, results });
}
