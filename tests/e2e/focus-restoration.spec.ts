import { expect, test } from '@playwright/test';

/**
 * 開いた overlay を閉じたとき、フォーカスは開いた場所へ戻さなければならない。
 * 戻さないとフォーカスは body へ落ち、キーボード利用者は Tab を先頭から押し直すことになる。
 *
 * 対象は3系統。
 * - モバイルメニュー（自前実装。`components/Header.tsx`）
 * - 比較の詳細ドロワー（Radix Dialog。`components/ComparisonRobotPanel.tsx`）
 * - 検索つきドロップダウン（Radix Popover。`components/ui/searchable-dropdown.tsx`）
 *
 * **`waitUntil: 'domcontentloaded'` を指定しないこと**（既定の `load` を使う）。
 * `domcontentloaded` は hydration より早く発火するため、直後の `click()` / `focus()` が
 * hydration に上書きされて flaky になる。このファイルの
 * `mobile menu › moves focus into the drawer on open` は実際に CI で恒常的に flaky だった
 * （死に窓の実測: ボタン可視 65ms → click 有効 119ms の 54ms）。2026-08-06 に全5 spec から
 * 除去して解消（旧・積み残し登録簿 #9）。retries で隠すのではなく原因を消すこと。
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe('mobile menu', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('moves focus into the drawer on open', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'ナビゲーションを開く' });
    await trigger.click();

    // 開いた直後は閉じるボタンへ移す。ドロワーの外に取り残さないため。
    await expect(page.getByRole('button', { name: 'ナビゲーションを閉じる' }).last()).toBeFocused();
  });

  test('restores focus to its trigger on Escape', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'ナビゲーションを開く' });
    await trigger.click();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('button', { name: 'ナビゲーションを開く' })).toBeFocused();
  });

  test('restores focus to its trigger when the close button is used', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ナビゲーションを開く' }).click();
    await page.getByRole('button', { name: 'ナビゲーションを閉じる' }).last().click();

    await expect(page.getByRole('button', { name: 'ナビゲーションを開く' })).toBeFocused();
  });

  test('traps Tab inside the drawer while it is open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ナビゲーションを開く' }).click();

    const drawer = page.locator('#site-mobile-navigation');
    // 閉じるボタンから Shift+Tab で末尾へ回り込み、ドロワーの外へ出ない。
    await page.keyboard.press('Shift+Tab');
    await expect(drawer.locator(':focus')).toHaveCount(1);
  });
});

test.describe('compare detail dialog', () => {
  test('restores focus to the card that opened it', async ({ page }) => {
    await page.goto('/compare?compare=unitree-g1');
    const trigger = page.getByRole('button', { name: /の詳細を見る|詳細/ }).first();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe('searchable dropdown', () => {
  // Radix Select の trigger も role="combobox" を持つので、名前で特定する。
  const searchFieldName = 'メーカーの選択肢を検索';

  test('focuses the search field on open and restores the trigger on Escape', async ({ page }) => {
    await page.goto('/robots');
    const trigger = page.locator('#robot-manufacturer-trigger');
    await trigger.click();

    // 開いたら検索欄へ。ここへ移さないと絞り込みの意味がない。
    const search = page.getByRole('combobox', { name: searchFieldName });
    await expect(search).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(search).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('restores the trigger after picking an option', async ({ page }) => {
    await page.goto('/robots');
    const trigger = page.locator('#robot-manufacturer-trigger');
    await trigger.click();

    await page.getByRole('combobox', { name: searchFieldName }).fill('Unitree');
    await page.getByRole('option').first().click();

    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});
