import { isPublishableCollection } from './adminPublishableCollections';
import type { ApprovableCollectionSlug } from './publishApprovedVersion';

/**
 * `/api/admin/publish/bulk` のリクエストボディ検証（DB非依存の純粋関数）。
 *
 * `src/app/api/admin/publish/route.ts` と同じ理由でrouteから切り出してある——テストが
 * 実装そのものを参照するようにし、写像規則をテスト側へ書き写して「検証したつもり」に
 * ならないようにする。
 */

export interface BulkPublishItemInput {
  collection: ApprovableCollectionSlug;
  id: string | number;
}

/** 1回の一括公開で受け付ける件数の上限。draft一覧の`limit`（各collection 100件）とも整合させる。 */
export const MAX_BULK_ITEMS = 200;

/** リクエストボディの最大byte数。単発publishの`MAX_BODY_BYTES`（8KB）は1件分の想定なので、
 *  配列である分だけ広げる。1件あたり100byte見ても200件で20KBに収まる計算。 */
export const MAX_BULK_BODY_BYTES = 64 * 1024;

export type ParseBulkPublishRequestResult =
  | { ok: true; items: BulkPublishItemInput[] }
  | { ok: false; error: 'malformed-body' | 'empty-items' | 'too-many-items' | 'invalid-item' };

function isValidId(value: unknown): value is string | number {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.length > 0;
}

export function parseBulkPublishRequestBody(raw: string): ParseBulkPublishRequestResult {
  let body: { items?: unknown };
  try {
    body = JSON.parse(raw) as { items?: unknown };
  } catch {
    return { ok: false, error: 'malformed-body' };
  }

  const { items } = body;
  if (!Array.isArray(items)) return { ok: false, error: 'malformed-body' };
  if (items.length === 0) return { ok: false, error: 'empty-items' };
  if (items.length > MAX_BULK_ITEMS) return { ok: false, error: 'too-many-items' };

  const parsed: BulkPublishItemInput[] = [];
  for (const raw of items) {
    const candidate = raw as { collection?: unknown; id?: unknown } | null;
    if (!candidate || typeof candidate !== 'object') return { ok: false, error: 'invalid-item' };
    if (!isPublishableCollection(candidate.collection)) return { ok: false, error: 'invalid-item' };
    if (!isValidId(candidate.id)) return { ok: false, error: 'invalid-item' };
    parsed.push({ collection: candidate.collection, id: candidate.id });
  }

  return { ok: true, items: parsed };
}
