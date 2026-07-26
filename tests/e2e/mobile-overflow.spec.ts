import { expect, test } from '@playwright/test';

for (const route of ['/', '/robots', '/manufacturers', '/use-cases', '/reports', '/compare']) {
  test(`${route} has no document overflow at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    const sizes = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
  });
}
