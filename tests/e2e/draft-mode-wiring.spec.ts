import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * task7-draft-mode-wiring-brief.md 検証項目: 「draft responseが共有cacheへ漏れないことの
 * 実HTTP e2e証明」。
 *
 * `tests/content/repository.contract.test.ts` / `tests/content/draft-mode-security.test.ts`は
 * それぞれ repository層 / session検証ロジックを実Postgresに対して検証しているが、
 * **`'use cache'` / `draftMode()` はNext.jsのrequest scope（cacheComponents runtime）の
 * 中でしか動作しない**ため、vitestからrepositoryやroute handlerを直接呼ぶ形のテストでは
 * この機構自体が発動しない（`tests/e2e/cache-revalidation.spec.ts`と同じ制約）。
 * 「draft modeを実際に有効化したrequestがdraft内容を返し、かつその結果が共有cacheへ
 * 書き込まれて他のrequestへ漏れないこと」を検証できるのは、実際に`next build && next start`
 * したサーバーへ本物のHTTPリクエストを送るこのe2eテストだけ。
 *
 * 前提（`docs/reference/content-preview-runbook-v1.md`参照）:
 * - `CONTENT_SOURCE=payload`・実throwaway Postgres（`content:import --bootstrap-admin`で
 *   `data/*.ts`相当の内容を投入済み）に対して`npm run build`済みであること。
 * - `PAYLOAD_PUBLIC_SERVER_URL`がこのe2eサーバー自身のURL（`http://127.0.0.1:3399`、
 *   `playwright.config.ts`の`webServer`と同じport）を指していること。
 * - `PREVIEW_TOKEN_SECRET`がこのサーバー起動時のprocess.envと、
 *   `mintPreviewTokenForE2E.mts`/`createDraftUpdateForE2E.mts`を起動する側のprocess.envの
 *   両方で同じ値であること（署名の生成・検証がどちらも`process.env.PREVIEW_TOKEN_SECRET`を
 *   参照するため）。
 *
 * このデータベースは**専用の使い捨てPostgres**であること
 * （`tests/e2e/cache-revalidation.spec.ts`のdocblockと同じ理由——`tests/content/*.test.ts`の
 * destructive testや他のe2e specと共有すると、互いの書き込みを踏む）。
 *
 * 実行例:
 * ```
 * CONTENT_SOURCE=payload \
 * DATABASE_URL=postgresql://.../deploid_task7draft_e2e \
 * PAYLOAD_SECRET=... PAYLOAD_PUBLIC_SERVER_URL=http://127.0.0.1:3399 \
 * REVALIDATION_SECRET=... PREVIEW_TOKEN_SECRET=... \
 * npm run build && npm run test:e2e -- tests/e2e/draft-mode-wiring.spec.ts
 * ```
 */

const ROBOT_STABLE_ID = 'fixture-robot-a';
const ROBOT_SLUG = 'fixture-robot-a';
/** `lib/content/previewTokens.ts`の`PREVIEW_SESSION_COOKIE_NAME`と同じ値。 */
const PREVIEW_SESSION_COOKIE_NAME = 'deploid-preview-session';

/** `payload.config.ts`を読み込むため、必ずrepo rootをcwdにして実行する。 */
function createPendingDraftNameUpdate(newName: string): void {
  execFileSync(
    'npx',
    ['tsx', 'tests/e2e/createDraftUpdateForE2E.mts', 'robots', ROBOT_STABLE_ID, 'name', newName],
    { cwd: REPO_ROOT, stdio: 'pipe', env: process.env },
  );
}

/**
 * stdoutへ出力されたtoken文字列だけを受け取る。`getPayload()`の初期化（dev-mode schema push
 * のspinner・Pinoのstartup WARNログ）がscriptのstdoutへ紛れ込むため、`mintPreviewTokenForE2E
 * .mts`が最後に書くtoken自身（改行を含まない1行）を、出力全体の**最後の非空行**として
 * 取り出す——スクリプト側で他のログをstderrへ倒すよりも、呼び出し側でこう抽出するほうが
 * Payload起動時ログの変化に対して頑健。
 */
function mintPreviewTokenFor(redirect: string): string {
  const raw = execFileSync('npx', ['tsx', 'tests/e2e/mintPreviewTokenForE2E.mts', redirect], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  }).toString('utf8');
  const lines = raw.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  const token = lines.at(-1);
  if (!token) throw new Error(`mintPreviewTokenForE2E.mts produced no output:\n${raw}`);
  return token;
}

test.describe('Draft Mode wiring: draft content never leaks into the shared cache (Critical proof)', () => {
  // 同じrobot（unitree-g1）を複数testで書き換えるため、並列実行すると互いの更新を踏みうる
  // （cache-revalidation.spec.tsと同じ理由）。直列化してtest間の独立性を保つ。
  test.describe.configure({ mode: 'serial' });

  test.skip(
    process.env.CONTENT_SOURCE !== 'payload',
    'requires CONTENT_SOURCE=payload against a seeded throwaway Postgres — see file docblock for the exact invocation',
  );

  test('draft mode disabled: a normal request never sees draft content', async ({ page }) => {
    const response = await page.goto(`/robots/${ROBOT_SLUG}`);
    expect(response?.status()).toBe(200);
    const heading = await page.locator('h1').first().textContent();
    expect(heading).toBeTruthy();
  });

  test(
    'a valid preview session shows a pending (unapproved) draft update; ' +
      'the cached/published response is unaffected before, during, and after — proving no cache leak',
    async ({ page, context, browser }) => {
      // 1. 現在の公開内容（baseline）を記録する。
      await page.goto(`/robots/${ROBOT_SLUG}`);
      const publishedName = await page.locator('h1').first().textContent();
      expect(publishedName).toBeTruthy();

      // 2. 公開中documentの上へ、未承認のdraft updateを積む（main rowは触らない ——
      //    brief必須修正1のシナリオ「既存publishedへの未承認draft更新」）。
      const draftName = `E2E Draft Preview ${Date.now()}`;
      createPendingDraftNameUpdate(draftName);

      // 3. draft mode無効の通常requestは、draft保存の直後でも常にpublished内容のまま
      //    （'use cache'関数の中でdraft判定を分岐していないことの直接証拠）。
      const stillPublished = await page.goto(`/robots/${ROBOT_SLUG}`);
      expect(stillPublished?.status()).toBe(200);
      expect(await page.locator('h1').first().textContent()).toBe(publishedName);

      // 4. 署名付きpreview token（経路2、マジックリンク）でdraft modeを有効化し、
      //    対象pageへredirectされる。`/api/draft-mode/enable`はGETで303を返し、
      //    Playwrightの`page.goto`はredirectを追って最終pageのresponseを返す。
      const token = mintPreviewTokenFor(`/robots/${ROBOT_SLUG}`);
      const draftResponse = await page.goto(
        `/api/draft-mode/enable?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(`/robots/${ROBOT_SLUG}`)}`,
      );
      expect(draftResponse?.status()).toBe(200);
      expect(await page.locator('h1').first().textContent()).toBe(draftName);

      // 5. draft responseはcacheしてよいことを示すheaderを一切持たない
      //    （draftMode()有効時、Next.js自身がresponseをdynamic・no-store扱いにする）。
      const cacheControl = draftResponse?.headers()['cache-control'] ?? '';
      expect(cacheControl).toMatch(/no-store/);

      // 6. draft modeのcookieを一切持たない、全く別のbrowser context（＝別のvisitor）から
      //    同じslugへアクセスしても、published内容のまま——draft renderが共有cacheへ
      //    書き込まれて他のrequestへ漏れていないことの直接証拠（最重要制約）。
      const freshContext = await browser.newContext();
      try {
        const freshPage = await freshContext.newPage();
        const freshResponse = await freshPage.goto(`/robots/${ROBOT_SLUG}`);
        expect(freshResponse?.status()).toBe(200);
        expect(await freshPage.locator('h1').first().textContent()).toBe(publishedName);
      } finally {
        await freshContext.close();
      }

      // 7. Next自身のdraft modeのcookie（__prerender_bypass）は有効なまま、この repoが独自に
      //    発行する session cookie（`deploid-preview-session`）だけを改ざんすると、
      //    毎request再検証する`getActivePreviewSession()`が拒否し、published内容へ
      //    fail-closedでfallbackする——「draft modeのcookieはあるが検証に失敗した」場合に
      //    draftを一切見せないことの直接証拠。
      const cookies = await context.cookies();
      const sessionCookie = cookies.find((cookie) => cookie.name === PREVIEW_SESSION_COOKIE_NAME);
      expect(sessionCookie).toBeTruthy();
      await context.addCookies([
        { ...sessionCookie!, value: `${sessionCookie!.value.slice(0, -4)}0000` },
      ]);
      const tamperedResponse = await page.goto(`/robots/${ROBOT_SLUG}`);
      expect(tamperedResponse?.status()).toBe(200);
      expect(await page.locator('h1').first().textContent()).toBe(publishedName);
    },
  );
});
