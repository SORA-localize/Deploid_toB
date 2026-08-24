import { expect, test } from '@playwright/test';

test('Payload admin login is mounted', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin/);
  // Payload 3.87.1's Login/CreateFirstUser views render no heading-role element at all
  // (confirmed by inspecting the hydrated DOM directly: zero <h1>-<h6> / role="heading" nodes).
  // The <title> ("Login - Payload" / "Create first user - Payload") and the visible submit
  // button are the version-stable signals that the real Payload admin view mounted, as opposed
  // to this app's own 404 page.
  await expect(page).toHaveTitle(/welcome|login|create/i);
  await expect(page.getByRole('button', { name: /login|create/i })).toBeVisible();
});
