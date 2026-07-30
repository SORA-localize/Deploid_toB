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

const VIEWPORTS = [
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'desktop-wide', width: 1920, height: 1080 },
];

for (const viewport of VIEWPORTS) {
  test(`manufacturer points stay within the map stage bounds at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');

    const stage = page.locator('[data-world-map-stage]');
    const stageBox = await stage.boundingBox();
    expect(stageBox).not.toBeNull();

    const points = page.locator('[data-world-map-point]');
    const count = await points.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      const pointBox = await points.nth(i).boundingBox();
      expect(pointBox).not.toBeNull();
      if (!stageBox || !pointBox) continue;
      expect(pointBox.x).toBeGreaterThanOrEqual(stageBox.x - 1);
      expect(pointBox.y).toBeGreaterThanOrEqual(stageBox.y - 1);
      expect(pointBox.x + pointBox.width).toBeLessThanOrEqual(stageBox.x + stageBox.width + 1);
      expect(pointBox.y + pointBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height + 1);
    }
  });
}
