import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
] as const;

/**
 * 撮影前に lazy 画像を読み切らせる。
 *
 * カード画像は1枚目以外すべて `loading="lazy"`（`components/RobotCard.tsx`）。
 * `toHaveScreenshot` は要素全体を撮るために内部でスクロールするので、その最中に
 * 遅延読み込みが走り、**間に合った枚数が実行ごとに変わる**。結果として同じページから
 * 別のスクリーンショットが出る。
 *
 * 実測（2026-08-06、`/robots`）: 撮影時点で読み込み済みなのは 1440px で 112枚中29枚、
 * 768px で18枚だけだった。CI ではこれが `/robots` の visual-regression を断続的に
 * flaky にしており（1回目 5〜6% 差分 → retry で通過）、`retries: 2` が隠していた。
 *
 * ここで eager 化＋全高スクロール＋全 `complete` 待ちをすると 114/114 で収束する
 * （3回連続で同一、全12 route×viewport で 134〜934ms、タイムアウトなし）。
 * `complete` は失敗した読み込みでも true になるため、壊れた画像があっても停止しない。
 */
async function settleLazyImages(page: Page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'eager'));
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('img')).every((img) => img.complete),
    undefined,
    { timeout: 15_000 },
  );
}

for (const viewport of viewports) {
  for (const route of ['/', '/robots', '/reports'] as const) {
    test(`${route} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await settleLazyImages(page);
      const filename = `${route === '/' ? 'home' : route.slice(1)}-${viewport.name}.png`;
      await expect(page.locator('main')).toHaveScreenshot(filename, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}
