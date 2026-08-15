import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sitemap from '@/src/app/sitemap';

// Task 6: sitemap()はrepository経由（`CONTENT_SOURCE`必須）になったため、CIのambient env
// （`.github/workflows/ci.yml` はjob levelでCONTENT_SOURCEを設定しない）に依存せず、
// このテストが明示的にlocalへ固定する。
describe('sitemap', () => {
  beforeEach(() => {
    vi.stubEnv('CONTENT_SOURCE', 'local');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('contains unique absolute URLs', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.every((url) => URL.canParse(url))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
