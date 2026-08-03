import { expect, test } from '@playwright/test';

// WCAG 2.2.2（Pause, Stop, Hide）。5秒間隔で自動送りする carousel には
// 明示的な停止手段が要る。あわせて現在位置を live region で伝える。

test('hero carousel can be paused and resumed', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  const dots = page.locator('button[aria-label^="スライド"]');
  await expect(dots.first()).toBeVisible();

  const pause = page.getByRole('button', { name: '自動再生を停止する' });
  await expect(pause).toBeVisible();

  // 停止すると 6 秒待っても選択が動かない（autoplay の delay は 5000ms）。
  await pause.click();
  const resume = page.getByRole('button', { name: '自動再生を再開する' });
  await expect(resume).toBeVisible();

  const activeBefore = await dots.evaluateAll((els) =>
    els.findIndex((el) => el.getAttribute('aria-current') === 'true'),
  );
  await page.waitForTimeout(6000);
  const activeAfter = await dots.evaluateAll((els) =>
    els.findIndex((el) => el.getAttribute('aria-current') === 'true'),
  );
  expect(activeAfter).toBe(activeBefore);

  // 再開するとボタンの意味が戻る。
  await resume.click();
  await expect(page.getByRole('button', { name: '自動再生を停止する' })).toBeVisible();
});

test('hero carousel announces the current position', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  const status = page.locator('[aria-live="polite"]').filter({ hasText: /件中/ }).first();
  await expect(status).toHaveText(/^\d+件中1件目$/);

  await page.getByRole('button', { name: '自動再生を停止する' }).click();
  await page.locator('button[aria-label^="スライド"]').nth(2).click();
  await expect(status).toHaveText(/^\d+件中3件目$/);
});

test('each slide carries its own position for screen readers', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });

  // 全スライドが同時に DOM にある。live region は位置が「変わったとき」しか鳴らないため、
  // 読み上げで線形に辿る利用者向けに1枚ずつが自分の位置を持つ。
  const slides = page.locator('[aria-roledescription="slide"]');
  const count = await slides.count();
  expect(count).toBeGreaterThan(1);

  await expect(slides.first()).toHaveAttribute('role', 'group');
  await expect(slides.first()).toHaveAttribute('aria-label', `${count}件中1件目`);
  await expect(slides.nth(1)).toHaveAttribute('aria-label', `${count}件中2件目`);
});

test.describe('reduced motion', () => {
  test('no autoplay control is rendered when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('button[aria-label^="スライド"]').first()).toBeVisible();
    // autoplay 自体を積まないため、停止ボタンも出さない（操作対象が無い）。
    await expect(page.getByRole('button', { name: /自動再生を/ })).toHaveCount(0);
  });
});
