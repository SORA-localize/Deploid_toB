import { expect, test } from '@playwright/test';

test('Payload admin login is mounted', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin/);
  // Payload 3.87.1's Login/CreateFirstUser views render no heading-role element at all
  // (confirmed by inspecting the hydrated DOM directly: zero <h1>-<h6> / role="heading" nodes).
  // The <title> ("Login - Payload" / "Create first user - Payload") and the visible submit
  // button are the version-stable signals that the real Payload admin view mounted, as opposed
  // to this app's own 404 page.
  //
  // 2026-09-04: `payload.config.ts` に `fallbackLanguage: 'ja'` を入れたため、admin の既定表示は
  // 日本語（「ログイン」「最初のユーザーを作成」）になった。言語スイッチャーで `en` にもできるので、
  // ここは日英どちらでも通るようにしておく。文言そのものではなく
  // 「Payload の login/create view が本当にmountされたか」を見たいだけなので、
  // どちらか一方に固定する必要はない。
  await expect(page).toHaveTitle(/welcome|login|create|ようこそ|ログイン|作成/i);
  await expect(page.getByRole('button', { name: /login|create|ログイン|作成/i })).toBeVisible();
});
