import { expect, test } from '@playwright/test';

test('robot filters update immediately and survive back/forward', async ({ page }) => {
  await page.goto('/robots');
  const before = await page.locator('[data-catalog-item]').count();
  // タブは role="tab" ではなく role="group" 内の button として実装されている
  // （PageTabBar参照）。アクセシブルネームには件数（例: 「物流、12件」）が入る。
  await page.getByRole('button', { name: /物流/ }).click();
  await expect(page).toHaveURL(/industry=logistics/);
  const filtered = await page.locator('[data-catalog-item]').count();
  expect(filtered).toBeLessThan(before);
  await page.goBack();
  await expect(page).not.toHaveURL(/industry=logistics/);
  await expect(page.locator('[data-catalog-item]')).toHaveCount(before);
  await page.goForward();
  await expect(page).toHaveURL(/industry=logistics/);
  await expect(page.locator('[data-catalog-item]')).toHaveCount(filtered);
});
