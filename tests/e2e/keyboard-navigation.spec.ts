import { expect, test } from '@playwright/test';

/**
 * ポインタ無しで主要操作が完結することを固定する。
 *
 * 絞り込みタブは `role="tablist"` ではなく `role="group"` + `aria-current` である
 * （URL が変わるナビゲーションであり、ページ内パネルの差し替えではないため）。
 * したがって矢印キーではなく **Tab で各タブへ到達し Enter で選ぶ** のが正しい操作系で、
 * ここではその契約を検証する。意味論そのものは
 * `tests/components/page-tab-bar.test.tsx` が固定している。
 */

/**
 * 記事の絞り込みタブは追従ヘッダの中だけにあり、少しスクロールするまで DOM に存在しない
 * （`components/ContextualPageHeader.tsx` → `HeaderStickyBarSlot`）。
 * キーボードでも Space / PageDown でスクロールできるので到達はできるが、
 * ページ先頭からは Tab だけでは辿り着けない。テストは実際の利用と同じく先にスクロールする。
 */
async function revealStickyFilterTabs(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect(page.getByRole('group', { name: '記事' })).toBeVisible();
}

test('reports filter tabs are reachable and selectable with the keyboard', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await revealStickyFilterTabs(page);

  const tabs = page.getByRole('group', { name: '記事' }).getByRole('button');
  await expect(tabs.first()).toHaveAttribute('aria-current', 'page');

  // roving tabindex を入れていないので、Tab は隣のタブへ進む。
  await tabs.first().focus();
  await page.keyboard.press('Tab');
  await expect(tabs.nth(1)).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/kind=news/);
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'page');
  await expect(tabs.first()).not.toHaveAttribute('aria-current', 'page');
});

test('selecting a filter tab does not destroy keyboard focus', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await revealStickyFilterTabs(page);

  const tabs = page.getByRole('group', { name: '記事' }).getByRole('button');
  const target = tabs.nth(1);
  await target.focus();
  await page.keyboard.press('Enter');

  // 絞り込むとヒーローが消え、scroll anchoring がページ先頭へ戻す。追従バーが
  // スクロール量だけで消えると、押したばかりのタブごとフォーカスが body へ落ちる。
  await page.waitForTimeout(600);
  await expect(page.getByRole('group', { name: '記事' })).toBeVisible();
  await expect(target).toBeFocused();
});

test('the sticky bar still hides on scroll for pointer users', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await revealStickyFilterTabs(page);

  // クリックでもボタンはフォーカスを受け取る。上の保護が `:focus-visible` 限定でないと、
  // マウス利用者にも追従バーが残り続けてしまう。
  await page.getByRole('group', { name: '記事' }).getByRole('button').nth(1).click();

  await expect(page).toHaveURL(/kind=news/);
  await expect(page.getByRole('group', { name: '記事' })).toHaveCount(0);
});

test('a disabled filter tab is reachable but does not navigate', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await revealStickyFilterTabs(page);

  // aria-disabled にしてあるので Tab では飛ばされず、理由を読み上げられる。
  const disabled = page.locator('[role="group"] button[aria-disabled="true"]').first();
  await disabled.focus();
  await expect(disabled).toBeFocused();

  const urlBefore = page.url();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(urlBefore);
});

test('the hero carousel can be advanced without a pointer', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });

  const status = page.locator('[aria-live="polite"]').filter({ hasText: /件中/ }).first();
  await expect(status).toHaveText(/^\d+件中1件目$/);

  // 自動送りを止めてから操作する。止めないと待っている間に位置が動く。
  await page.getByRole('button', { name: '自動再生を停止する' }).click();

  const next = page.getByRole('button', { name: '次のスライド' });
  await next.focus();
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(status).toHaveText(/^\d+件中2件目$/);
});

test('pagination can be operated without a pointer', async ({ page }) => {
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });

  const pagination = page.getByRole('navigation', { name: '記事一覧のページネーション' });
  await expect(pagination).toBeVisible();
  await expect(pagination.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');

  const next = pagination.getByRole('button', { name: '次のページ' });
  await next.focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/page=2/);
  await expect(pagination.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
});

test('the catalog search field is reachable from the page heading', async ({ page }) => {
  await page.goto('/robots', { waitUntil: 'domcontentloaded' });

  const search = page.getByRole('searchbox').first();
  await search.focus();
  await search.fill('Unitree');
  await expect(page).toHaveURL(/q=Unitree/);
});
