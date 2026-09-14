import { describe, expect, it } from 'vitest';
import { MAX_BULK_ITEMS, parseBulkPublishRequestBody } from '@/lib/payload/parseBulkPublishRequest';

/**
 * `/api/admin/publish/bulk` のリクエストボディ検証。DB不要のユニットテスト
 * （`tests/content/admin-publish-route.test.ts`の`mapPublishError()`テストと同じ考え方——
 * 実装そのものを直接呼び、写像規則をテスト側へ書き写さない）。
 */

describe('parseBulkPublishRequestBody', () => {
  it('正しい形のbodyを受け入れる', () => {
    const result = parseBulkPublishRequestBody(
      JSON.stringify({
        items: [
          { collection: 'manufacturers', id: 'abc' },
          { collection: 'deployments', id: 42 },
        ],
      }),
    );
    expect(result).toEqual({
      ok: true,
      items: [
        { collection: 'manufacturers', id: 'abc' },
        { collection: 'deployments', id: 42 },
      ],
    });
  });

  it('JSONとして壊れていれば malformed-body', () => {
    expect(parseBulkPublishRequestBody('{not json')).toEqual({ ok: false, error: 'malformed-body' });
  });

  it('itemsが配列でなければ malformed-body', () => {
    expect(parseBulkPublishRequestBody(JSON.stringify({ items: 'nope' }))).toEqual({
      ok: false,
      error: 'malformed-body',
    });
  });

  it('itemsが空配列なら empty-items', () => {
    expect(parseBulkPublishRequestBody(JSON.stringify({ items: [] }))).toEqual({
      ok: false,
      error: 'empty-items',
    });
  });

  it('上限を超えたら too-many-items', () => {
    const items = Array.from({ length: MAX_BULK_ITEMS + 1 }, (_, i) => ({ collection: 'articles', id: i }));
    expect(parseBulkPublishRequestBody(JSON.stringify({ items }))).toEqual({
      ok: false,
      error: 'too-many-items',
    });
  });

  it('未登録のcollectionを含んでいれば invalid-item', () => {
    const result = parseBulkPublishRequestBody(
      JSON.stringify({ items: [{ collection: 'admins', id: 1 }] }),
    );
    expect(result).toEqual({ ok: false, error: 'invalid-item' });
  });

  it('idが欠けていれば invalid-item', () => {
    const result = parseBulkPublishRequestBody(
      JSON.stringify({ items: [{ collection: 'manufacturers' }] }),
    );
    expect(result).toEqual({ ok: false, error: 'invalid-item' });
  });

  it('idが空文字なら invalid-item', () => {
    const result = parseBulkPublishRequestBody(
      JSON.stringify({ items: [{ collection: 'manufacturers', id: '' }] }),
    );
    expect(result).toEqual({ ok: false, error: 'invalid-item' });
  });
});
