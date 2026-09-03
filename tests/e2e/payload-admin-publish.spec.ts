import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Admin公開UIのe2e（`docs/plans/admin-publish-ui-plan-v1.md` Task 7）。
 *
 * ## このe2eでしか証明できないこと
 *
 * `tests/components/publish-from-approval.test.tsx` は `@payloadcms/ui` をmockしているので、
 * 「`submit()` を正しい形で呼ぶ」までしか言えない。**その `submit()` が本当にフォームの
 * 現在値を版として保存し、その版が公開されるか**は、実admin UI + 実Payload + 実Postgres が
 * 揃って初めて確かめられる。
 *
 * これが最重要なのは、この設計の失敗モードが**沈黙**だからである。公開処理を
 * 「fetchを1本投げるだけ」に書き換えると、編集内容は保存されないまま**古い内容が公開され、
 * エラーは何も出ない**。押した人には成功に見える。だから最初のテストは
 * 「編集した文字列が公開側で読めること」を直接見にいく。
 *
 * ## 前提
 *
 * `.github/workflows/content-e2e.yml` と同じ条件。`CONTENT_SOURCE=payload`、
 * 使い捨てPostgresへ `payload:migrate` + `seed:ci-site-settings` 済み、
 * `PAYLOAD_PUBLIC_SERVER_URL` がこのe2eサーバー自身（`http://127.0.0.1:3399`）を指すこと。
 *
 * 実行例:
 * ```
 * CONTENT_SOURCE=payload DATABASE_URL=postgresql://.../content_e2e_test \
 * PAYLOAD_SECRET=... PAYLOAD_PUBLIC_SERVER_URL=http://127.0.0.1:3399 \
 * npm run build && npm run test:e2e -- tests/e2e/payload-admin-publish.spec.ts
 * ```
 */

const MANUFACTURER_STABLE_ID = 'fixture-mfr-alpha';
/**
 * 検証エラーのテストは**別のdocument**を使う。必須項目を空にした下書きはそのまま残るので、
 * 公開のテストと同じdocumentを使うと、次回実行で公開テストが道連れで落ちる（実際に起きた）。
 */
const VALIDATION_STABLE_ID = 'fixture-mfr-beta';

/** このspecの中だけで使う使い捨てアカウント。パスワードは使い捨てDBの外へ出ない。 */
const PUBLISHER = { email: 'e2e-publisher@example.invalid', password: 'E2ePublisher!-0000' };
const DRAFT_WRITER = { email: 'e2e-draft-writer@example.invalid', password: 'E2eDraftWriter!-0000' };

/** `payload.config.ts` を読み込むため、必ずrepo rootをcwdにして実行する。 */
function ensureAdminUser(email: string, password: string, role: string): void {
  execFileSync('npx', ['tsx', 'tests/e2e/createAdminUserForE2E.mts', email, password, role], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
    env: process.env,
  });
}

async function login(page: import('@playwright/test').Page, email: string, password: string): Promise<void> {
  await page.goto('/admin/login');
  await page.locator('#field-email').fill(email);
  await page.locator('#field-password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  // ログイン後のリダイレクト先はPayloadのバージョンで変わりうる。`/admin/login` から
  // 離れたことだけを見る。
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 30_000 });
}

/** admin cookieを持つpage contextから、**公開済み**（draftではない）の値を読む。 */
async function readPublishedName(page: import('@playwright/test').Page): Promise<string | undefined> {
  const response = await page.request.get(
    `/api/manufacturers?where[stableId][equals]=${MANUFACTURER_STABLE_ID}&depth=0&limit=1`,
  );
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { docs?: Array<{ name?: string; id: string | number }> };
  return body.docs?.[0]?.name;
}

/**
 * 公開ボタンのlocator。`^` で始めるのは、Payloadの `Revert to published` が
 * `/publish/i` に一致して strict mode violation になるため（実測）。
 * adminの言語はブラウザ設定で切り替わるので、英語（`Publish` / `Publish changes`）と
 * 日本語（`公開` / `変更を公開`）の両方に一致させる。
 */
function publishButton(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: /^(publish|(変更を)?公開)/i });
}

/**
 * `draft=true` は**付けない**。付けるとPayloadはversion table（`_manufacturers_v`）を引き、
 * `where[stableId]` はそのtableのfield pathと噛み合わずに **0件を静かに返す**（実測）。
 * ここで欲しいのはdocumentのidだけで、idはdraftでもpublishedでも同じ。
 */
async function openEditPage(
  page: import('@playwright/test').Page,
  stableId: string = MANUFACTURER_STABLE_ID,
): Promise<void> {
  const response = await page.request.get(
    `/api/manufacturers?where[stableId][equals]=${stableId}&depth=0&limit=1`,
  );
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { docs?: Array<{ id: string | number }> };
  const id = body.docs?.[0]?.id;
  expect(id, `fixture manufacturer ${stableId} must exist`).toBeDefined();
  await page.goto(`/admin/collections/manufacturers/${id}`);
  await expect(page.locator('#field-name')).toBeVisible();
}

test.describe('Admin publish UI', () => {
  // 同じfixture manufacturerを複数testで書き換えるため直列化する
  // （`draft-mode-wiring.spec.ts` と同じ理由）。
  test.describe.configure({ mode: 'serial' });

  test.skip(
    process.env.CONTENT_SOURCE !== 'payload',
    'requires CONTENT_SOURCE=payload against a seeded throwaway Postgres — see file docblock',
  );

  test.beforeAll(() => {
    ensureAdminUser(PUBLISHER.email, PUBLISHER.password, 'content-publisher');
    ensureAdminUser(DRAFT_WRITER.email, DRAFT_WRITER.password, 'content-draft-writer');
  });

  test('publisher: 編集した内容そのものが公開される', async ({ page }) => {
    await login(page, PUBLISHER.email, PUBLISHER.password);
    await openEditPage(page);

    const editedName = `Alpha Robotics ${Date.now()}`;
    const before = await readPublishedName(page);
    expect(before).not.toBe(editedName);

    await page.locator('#field-name').fill(editedName);
    await publishButton(page).click();

    // 公開が反映されるまで待つ。ここで `before` のままなら、
    // 「保存せずに公開した」という**沈黙する失敗**が起きている。
    await expect
      .poll(() => readPublishedName(page), { timeout: 30_000 })
      .toBe(editedName);
  });

  test('publisher: 必須項目を空にすると、不足項目が名指しで表示される', async ({ page }) => {
    await login(page, PUBLISHER.email, PUBLISHER.password);
    await openEditPage(page, VALIDATION_STABLE_ID);

    // draft保存はfield検証を飛ばすので、ここは公開時の `PublishValidationError` を通る。
    await page.locator('#field-website').fill('');
    await publishButton(page).click();

    // `Something went wrong.` ではなく、**不足field名を含む文言**が出ること —— この計画の主目的。
    //
    // `getByText(/website/i)` では駄目。Websiteという**field labelが常に画面にある**ので、
    // 公開が何も表示しなくてもテストが緑になる。翻訳文ごと照合して、
    // `lib/payload/adminPublishMessages.ts` の文言が実際に描画されたことを確かめる。
    // adminの言語はブラウザ設定で変わるので日英どちらにも一致させる。
    await expect(
      page.getByText(/(Required fields are missing|公開に必要な項目が未入力です)[:：]\s*.*website/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('draft-writer: 公開ボタンが出ない', async ({ page }) => {
    await login(page, DRAFT_WRITER.email, DRAFT_WRITER.password);
    await openEditPage(page);

    // 下書き保存は出来るが、公開は出来ない。
    await expect(page.getByRole('button', { name: /save|保存/i }).first()).toBeVisible();
    await expect(publishButton(page)).toHaveCount(0);
  });
});
