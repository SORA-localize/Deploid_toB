import { expect, test } from '@playwright/test';

/**
 * Task 2（Payload統合）で `src/app` を `(frontend)` と `(payload)` の2つの独立 root layout に
 * 分割した際、どちらのlayoutにも一致しないURL（typo・古い外部リンク・crawlerなど）が
 * Next.jsの無地fallback（ブランドの無い404）に落ちる regression が一度発生した
 * （`src/app/global-not-found.tsx` + `next.config.ts` の `experimental.globalNotFound` で修正）。
 *
 * `tests/e2e/public-routes.spec.ts` は実routeが404 fallbackを見せていないことしか検証しない
 * ため、「本当にどのrouteにも一致しないURL」が正しくbrand付き404を見せることは
 * このfileが唯一のcoverage。
 */

const NOT_FOUND_HEADING = 'ページが見つかりません';
const HOME_CTA = 'ホームへ戻る';

test('a URL matching no route at all renders the branded 404, not Next.js default fallback', async ({
  page,
}) => {
  const response = await page.goto('/this-path-does-not-exist-at-all');
  expect(response?.status()).toBe(404);

  // 単一のhtml/bodyであること（(frontend)と(payload)のroot layoutが二重にnestしていない）。
  expect(await page.locator('html').count()).toBe(1);
  expect(await page.locator('body').count()).toBe(1);

  await expect(page.getByText(NOT_FOUND_HEADING)).toBeVisible();
  await expect(page.getByRole('link', { name: HOME_CTA })).toBeVisible();
  await expect(page).toHaveTitle(/404/);
});

test('a deeply nested unmatched URL also renders the branded 404', async ({ page }) => {
  const response = await page.goto('/foo/bar/baz/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByText(NOT_FOUND_HEADING)).toBeVisible();
});

test('notFound() called from within a real route still uses the frontend not-found page', async ({
  page,
}) => {
  // /robots/[slug] segment内でnotFound()を呼ぶケース。global-not-foundではなく
  // (frontend)/not-found.tsx を通る、従来通りのpathであることの回帰確認。
  await page.goto('/robots/this-slug-does-not-exist');
  await expect(page.getByText(NOT_FOUND_HEADING)).toBeVisible();
  await expect(page.getByRole('link', { name: HOME_CTA })).toBeVisible();
});
