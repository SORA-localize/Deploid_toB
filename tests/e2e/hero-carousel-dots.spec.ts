import { expect, test } from '@playwright/test';

// SliderDotButton は motion の layoutId を CSS へ置換した際、indicator の位置を
// 定数（dotサイズ + gap）で計算すると呼び出し元の gap 上書きでずれる。
// NewsHeroCarousel は className="gap-1.5" を渡すため、実測 offset を使う実装が要る。
// このテストはその回帰を防ぐ。

test('hero carousel の dot indicator が active dot と重なる', async ({ page }) => {
  // reduced-motion で autoplay を止め、選択が勝手に進まないようにする。
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/reports');

  const dots = page.locator('button[aria-label^="スライド"]');
  await expect(dots.first()).toBeVisible(); // embla の初期化後に scrollSnaps が入る
  const count = await dots.count();
  expect(count).toBeGreaterThan(1);

  const indicator = dots.first().locator('..').locator('> div[aria-hidden="true"]');

  for (let index = 0; index < count; index += 1) {
    await dots.nth(index).click();
    await expect(dots.nth(index)).toHaveAttribute('aria-current', 'true');

    const dotOffset = await dots.nth(index).evaluate((el) => (el as HTMLElement).offsetLeft);
    const indicatorOffset = await indicator.evaluate(
      (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,
    );
    expect(Math.abs(indicatorOffset - dotOffset)).toBeLessThan(1);
  }
});

test('hero carousel は reduced-motion で transition と autoplay が止まる', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/reports');

  const dots = page.locator('button[aria-label^="スライド"]');
  await expect(dots.first()).toBeVisible();
  const indicator = dots.first().locator('..').locator('> div[aria-hidden="true"]');

  expect(await indicator.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe('none');

  await dots.nth(0).click();
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await page.waitForTimeout(6000); // autoplay の delay は 5000ms
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
});
