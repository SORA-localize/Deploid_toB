import { expect, test } from '@playwright/test';

const viewports = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  for (const route of ['/', '/robots', '/reports'] as const) {
    test(`${route} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const filename = `${route === '/' ? 'home' : route.slice(1)}-${viewport.name}.png`;
      await expect(page.locator('main')).toHaveScreenshot(filename, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}
