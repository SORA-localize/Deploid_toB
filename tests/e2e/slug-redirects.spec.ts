import { expect, test } from '@playwright/test';

const redirects = [
  ['/robots/unitree-r1', /\/robots\/unitree-r1-air$/],
  ['/use-cases/warehouse-picking', /\/use-cases\/warehouse-tote-material-handling$/],
] as const;

for (const [from, destination] of redirects) {
  test(`${from} redirects to its canonical slug`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(destination);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', destination);
  });
}
