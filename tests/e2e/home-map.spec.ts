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

test('hero heading paints above manufacturer points regardless of overlapping hitboxes', async ({ page }) => {
  // Point marker hitboxes (h-8 w-8) are intentionally larger than their visible
  // dot/badge and can geometrically overlap the heading's bounding box even when
  // everything renders correctly (the visible mark sits centered in a padded,
  // mostly-transparent tap target). A bounding-box-only check would therefore
  // false-positive on correct code. What actually matters is stacking order, so
  // assert it directly: the heading's positioned wrapper must have a higher
  // z-index than the point markers, guaranteeing the heading always paints on
  // top wherever a marker happens to be placed.
  await page.goto('/');

  const headingZIndex = await page.evaluate(() => {
    const heading = document.querySelector('[data-world-map-stage] h1');
    if (!heading) return null;
    let node: Element | null = heading;
    while (node && node !== document.body) {
      const z = getComputedStyle(node).zIndex;
      if (z !== 'auto') return Number(z);
      node = node.parentElement;
    }
    return null;
  });

  const pointZIndex = await page.evaluate(() => {
    const point = document.querySelector('[data-world-map-point]');
    return point ? Number(getComputedStyle(point).zIndex) : null;
  });

  expect(headingZIndex).not.toBeNull();
  expect(pointZIndex).not.toBeNull();
  expect(headingZIndex as number).toBeGreaterThan(pointZIndex as number);
});

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
