import { expect, test } from '@playwright/test';

const NOT_FOUND_TEXT = 'ページが見つかりません';

// 期待H1は2026-07-26時点のuiText/dataに固定する。データ変更を伴う別作業で
// タイトルや機種名が正式変更された場合だけ、同じcommitでここも更新する。
const routes = [
  { path: '/', expectedH1: 'ヒューマノイド' },
  { path: '/robots', expectedH1: 'ロボット' },
  { path: '/robots/fixture-robot-a', expectedH1: 'Alpha One', canonical: '/robots/fixture-robot-a' },
  { path: '/manufacturers', expectedH1: 'メーカー' },
  { path: '/use-cases', expectedH1: '用途から探す' },
  { path: '/reports', expectedH1: '記事' },
  { path: '/compare', expectedH1: '比較' },
] as const;

for (const route of routes) {
  test(`${route.path} renders its own h1, not the not-found fallback`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('main')).toHaveCount(1);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(1);
    // Next.jsのPPRは、動的routeでnotFound()が呼ばれても静的shellが先に
    // 200を返すことがあるため、statusだけでなく画面内容そのものを検証する。
    await expect(heading).toContainText(route.expectedH1);
    await expect(page.getByText(NOT_FOUND_TEXT)).toHaveCount(0);

    if ('canonical' in route) {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${route.canonical}$`),
      );
    }
  });
}
