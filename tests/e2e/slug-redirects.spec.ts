import { expect, test } from '@playwright/test';

const redirects = [
  ['/robots/fixture-robot-a-old', /\/robots\/fixture-robot-a$/],
  ['/use-cases/fixture-usecase-one-old', /\/use-cases\/fixture-usecase-one$/],
] as const;

for (const [from, destination] of redirects) {
  test(`${from} redirects to its canonical slug`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(destination);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', destination);
  });
}
