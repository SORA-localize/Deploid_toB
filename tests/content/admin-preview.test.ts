/**
 * `lib/payload/adminPreview.ts` の純関数テスト。DB/Payload起動は不要
 * （`createAdminPreview()` が返す関数は `doc` と `req.user` だけを見る）。
 *
 * ドリフト防止: 生成したredirect先は必ず本物の `isAllowedPreviewRedirect()`
 * （`lib/content/previewTokens.ts`）に通す。許可rootの一覧をこのテスト側で
 * 再実装しない——`PREVIEW_ROOT_BY_COLLECTION` と `ALLOWED_PREVIEW_ROOTS` が
 * 将来ずれたら、このテストが機械的に落ちる。
 */
import type { PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import { createAdminPreview, PREVIEW_ROOT_BY_COLLECTION } from '../../lib/payload/adminPreview';
import { isAllowedPreviewRedirect } from '../../lib/content/previewTokens';
import type { AdminRole } from '../../lib/payload/access';

function fakeReq(role: AdminRole | undefined, id: string | number = 1): PayloadRequest {
  return { user: role ? { id, role } : null } as unknown as PayloadRequest;
}

function extractRedirect(url: string): string {
  const prefix = '/api/draft-mode/enable?redirect=';
  expect(url.startsWith(prefix)).toBe(true);
  return decodeURIComponent(url.slice(prefix.length));
}

describe('PREVIEW_ROOT_BY_COLLECTION', () => {
  it('covers exactly the 4 collections with a frontend detail page', () => {
    expect(Object.keys(PREVIEW_ROOT_BY_COLLECTION).sort()).toEqual(
      ['articles', 'manufacturers', 'robots', 'use-cases'].sort(),
    );
  });

  it('matches the literal frontend roots', () => {
    expect(PREVIEW_ROOT_BY_COLLECTION.manufacturers).toBe('/manufacturers');
    expect(PREVIEW_ROOT_BY_COLLECTION.robots).toBe('/robots');
    expect(PREVIEW_ROOT_BY_COLLECTION['use-cases']).toBe('/use-cases');
    expect(PREVIEW_ROOT_BY_COLLECTION.articles).toBe('/reports');
  });
});

describe('createAdminPreview', () => {
  const cases = Object.entries(PREVIEW_ROOT_BY_COLLECTION) as Array<
    [keyof typeof PREVIEW_ROOT_BY_COLLECTION, string]
  >;

  it.each(cases)('content-draft-writer+ gets a draft-mode/enable redirect for %s', (collection, root) => {
    for (const role of ['content-draft-writer', 'content-publisher', 'platform-admin'] as const) {
      const preview = createAdminPreview(collection);
      const url = preview({ slug: 'acme' }, { req: fakeReq(role) } as never) as string;
      const redirect = extractRedirect(url);
      expect(redirect).toBe(`${root}/acme`);
      expect(isAllowedPreviewRedirect(redirect)).toBe(true);
    }
  });

  it.each(cases)('content-reader / unauthenticated gets the plain frontend path for %s', (collection, root) => {
    for (const role of [undefined, 'content-reader'] as const) {
      const preview = createAdminPreview(collection);
      const url = preview({ slug: 'acme' }, { req: fakeReq(role) } as never) as string;
      expect(url).toBe(`${root}/acme`);
      expect(url.startsWith('/api/draft-mode/enable')).toBe(false);
      expect(isAllowedPreviewRedirect(url)).toBe(true);
    }
  });

  it.each(cases)('falls back to the bare root when slug is missing/blank for %s', (collection, root) => {
    const preview = createAdminPreview(collection);
    for (const doc of [{}, { slug: '' }, { slug: '   ' }, { slug: 42 }]) {
      const privilegedUrl = preview(doc, { req: fakeReq('content-publisher') } as never) as string;
      expect(extractRedirect(privilegedUrl)).toBe(root);

      const readerUrl = preview(doc, { req: fakeReq('content-reader') } as never) as string;
      expect(readerUrl).toBe(root);
      expect(isAllowedPreviewRedirect(readerUrl)).toBe(true);
    }
  });
});
