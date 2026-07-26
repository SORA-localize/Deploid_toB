import { describe, expect, it } from 'vitest';
import sitemap from '@/src/app/sitemap';

describe('sitemap', () => {
  it('contains unique absolute URLs', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.every((url) => URL.canParse(url))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
