import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSitemapEntries } from '@/src/app/sitemap';

// Sitemapはcutover後のPayload repository経由で検証する。
//
// fix round 1（Task 7）: `sitemap()`本体（default export）は`'use cache'`を持つため、
// Vitestから直接呼ぶと「outside a request scope」で例外化する（`cacheLife`/`cacheTag`は
// Next.jsのrequest scopeの中でしか呼べない）。実際のデータ取得・組み立てロジックは
// cache directiveを持たない`buildSitemapEntries()`へ分離してあるので、そちらをテストする。
describe('sitemap', () => {
  beforeEach(() => {
    vi.stubEnv('CONTENT_SOURCE', 'payload');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('contains unique absolute URLs', async () => {
    const entries = await buildSitemapEntries();
    const urls = entries.map((entry) => entry.url);
    expect(urls.every((url) => URL.canParse(url))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
