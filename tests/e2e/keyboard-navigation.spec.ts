import { expect, test } from '@playwright/test';

/**
 * ポインタ無しで主要操作が完結することを固定する。
 *
 * 絞り込みタブは `role="tablist"` ではなく `role="group"` + `aria-current` である
 * （URL が変わるナビゲーションであり、ページ内パネルの差し替えではないため）。
 * したがって矢印キーではなく **Tab で各タブへ到達し Enter で選ぶ** のが正しい操作系で、
 * ここではその契約を検証する。意味論そのものは
 * `tests/components/page-tab-bar.test.tsx` が固定している。
 *
 * **`waitUntil: 'domcontentloaded'` を指定しないこと**（既定の `load` を使う）。
 * `domcontentloaded` は hydration より早く発火するため、直後の `focus()` が
 * React の hydration に上書きされて「フォーカスが当たらない」flaky を生む
 * （積み残し登録簿 #9 の hydration race）。以前このファイルは、スクロールしてから
 * 追従バーの出現を待つヘルパーを挟んでおり、その待ちが偶然 hydration 待ちを
 * 兼ねていた。#5 対応でタブが常時 DOM に存在するようになりヘルパーを外したところ、
 * 隠れていた race がそのまま表面化して CI で 2 回 flaky になった（2026-08-06 実測）。
 */

test('reports filter tabs are reachable from the top of the page without scrolling', async ({ page }) => {
  // 積み残し登録簿 #5 の回帰ガード。以前はスクロールするまで DOM に存在しなかった
  // （ContextualPageHeader → HeaderStickyBarSlot 経由）。現在は本文内で position:sticky に
  // なっており（components/ReportsHeader.tsx）、ページ先頭・スクロール量0の時点で存在する。
  await page.goto('/reports');

  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('group', { name: '記事' })).toBeVisible();
});

test('reports filter tabs are reachable and selectable with the keyboard', async ({ page }) => {
  await page.goto('/reports');

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
  await page.goto('/reports');

  const tabs = page.getByRole('group', { name: '記事' }).getByRole('button');
  const target = tabs.nth(1);
  await target.focus();
  await page.keyboard.press('Enter');

  // 絞り込むとヒーローが消え、scroll anchoring がページ先頭へ戻す。タブ行は
  // position:sticky で常時マウントのため、以前のようにスクロール量だけを理由に
  // DOM から外れてフォーカスが body へ落ちることはない。
  await page.waitForTimeout(600);
  await expect(page.getByRole('group', { name: '記事' })).toBeVisible();
  await expect(target).toBeFocused();
});

test('a disabled filter tab is reachable but does not navigate', async ({ page }) => {
  await page.goto('/reports');

  // aria-disabled にしてあるので Tab では飛ばされず、理由を読み上げられる。
  const disabled = page.locator('[role="group"] button[aria-disabled="true"]').first();
  await disabled.focus();
  await expect(disabled).toBeFocused();

  const urlBefore = page.url();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(urlBefore);
});

test('the hero carousel can be advanced without a pointer', async ({ page }) => {
  await page.goto('/reports');

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
  await page.goto('/reports');

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
  await page.goto('/robots');

  const search = page.getByRole('searchbox').first();
  await search.focus();
  await search.fill('Unitree');
  await expect(page).toHaveURL(/q=Unitree/);
});
