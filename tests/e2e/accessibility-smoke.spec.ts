import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/robots', '/manufacturers', '/use-cases', '/reports']) {
  test(`${route} has no critical axe violations`, async ({ page }) => {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((item) => item.impact === 'critical')).toEqual([]);
  });
}
