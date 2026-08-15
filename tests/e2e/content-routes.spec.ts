import { expect, test } from '@playwright/test';

/**
 * content-platform-migration-plan-v1 Task 6 Step 1.
 *
 * ページがrepository（local / payload 両source）経由でcontentを読むようになった後も、
 * 主要な公開routeが両sourceで同じ形にレンダリングされることを確かめる回帰test。
 * `CONTENT_SOURCE=local` と `CONTENT_SOURCE=payload` それぞれで
 * `npm run build && npm run test:e2e -- tests/e2e/content-routes.spec.ts` を実行する
 * （両方PASSすることがTask 6の受け入れ条件）。
 */
for (const route of [
  '/',
  '/robots',
  '/manufacturers',
  '/use-cases',
  '/reports',
  '/compare',
  '/robots/unitree-g1',
]) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });
}
