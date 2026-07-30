import { expect, test } from '@playwright/test';

test('home renders one cacheable world map', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-world-map-canvas]')).toHaveCount(1);
  await expect(page.locator('img[src="/generated/world-map.svg"]')).toHaveCount(1);
  await expect(page.locator('img[src^="data:image/svg+xml"]')).toHaveCount(0);
});

test('manufacturer points are keyboard reachable', async ({ page }) => {
  await page.goto('/');
  const point = page.locator('[data-world-map-point]').first();
  await point.focus();
  await expect(point).toBeFocused();
  await expect(page.locator('[data-world-map-detail]')).toBeVisible();
  await expect(point).toHaveAttribute('href', /\/manufacturers(?:\/|$)/);
});
