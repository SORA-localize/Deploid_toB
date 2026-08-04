import { expect, test } from '@playwright/test';

/**
 * `<Toaster />` を root layout から `/compare` へ移した（Phase 7 Task 3、積み残し登録簿 #3）。
 *
 * toast は「呼んだのに何も出ない」形で壊れる。例外も型エラーも出ないので、build も
 * typecheck も緑のまま気づけない。Toaster の置き場所を変える以上、実際に出ることを
 * 固定しておく。
 */
test('shows a toast when the spec view is toggled', async ({ page }) => {
  await page.goto('/compare?compare=unitree-g1');

  const toggle = page.getByRole('switch', { name: 'スペック表示の切替' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  await expect(page.getByText('スペック表示', { exact: true })).toBeVisible();
});

/**
 * 逆側も見る。toast を使わない route へ Toaster が戻ってこないこと——つまり
 * sonner の runtime が共有フロアへ戻っていないことの、目に見える側の確認。
 */
test('does not mount the toaster outside compare', async ({ page }) => {
  // sonner の region は `<section aria-label="Notifications alt+T">` として出る。
  // `[data-sonner-toaster]` は inline CSS の文字列にも当たるので使わない。
  const toaster = (targetPage: typeof page) =>
    targetPage.getByRole('region', { name: /Notifications/i });

  await page.goto('/privacy');
  await expect(toaster(page)).toHaveCount(0);

  await page.goto('/compare');
  await expect(toaster(page)).toHaveCount(1);
});
