import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/robots',
  '/robots/unitree-g1',
  '/manufacturers',
  '/use-cases',
  '/reports',
  '/compare',
] as const;

for (const route of routes) {
  test(`${route} renders one main landmark and one h1`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
}
