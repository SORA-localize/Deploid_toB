import { expect, test } from '@playwright/test';

// 各 index / detail route は「見える H1 をちょうど1つ」持つ。
// 0個だと文書構造が壊れ、2個以上だとスクリーンリーダーの見出しジャンプで
// どちらがページ主題か判別できなくなる。
const routes = [
  '/',
  '/robots',
  '/robots/unitree-g1',
  '/manufacturers',
  '/manufacturers/unitree',
  '/use-cases',
  '/use-cases/research-development',
  '/reports',
  '/compare',
] as const;

for (const route of routes) {
  test(`${route} exposes one visible h1`, async ({ page }) => {
    await page.goto(route);
    const headings = page.getByRole('heading', { level: 1 });
    await expect(headings).toHaveCount(1);
    await expect(headings).toBeVisible();
    await expect(headings).not.toHaveText('');
  });
}
