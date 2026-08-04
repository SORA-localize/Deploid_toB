import { expect, test } from '@playwright/test';

/**
 * analytics ID を与えずにビルドしたとき、外部へ1本もリクエストが出ないことを固定する。
 *
 * unit test は parser の判定を見ているだけで、判定が実際に script の描画へ繋がっているかは
 * 見ていない。「フラグは false なのに script は出ている」を捕まえられるのはここだけ。
 *
 * CI は analytics ID を与えないので、この spec はそのまま通る。実 ID を持つ `.env.local` で
 * ローカル実行すると落ちる。その場合は Task 1 の手順どおり、ID を空にして build し直す。
 */
test('does not request analytics when public IDs are absent', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/googletagmanager|google-analytics|clarity\.ms|vercel-insights/.test(url)) {
      analyticsRequests.push(url);
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(analyticsRequests).toEqual([]);
});

test('does not inline analytics snippets when public IDs are absent', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();

  // インライン script は network request を出さないので、上のテストだけでは漏れる。
  expect(html).not.toContain('googletagmanager');
  expect(html).not.toContain('clarity.ms/tag');
  expect(html).not.toMatch(/G-[A-Z0-9]{6,}/);
});
