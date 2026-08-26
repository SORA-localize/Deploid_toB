import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Task 7 fix round 1 / Critical 1。
 *
 * `tests/content/revalidation.test.ts` は「webhookが200を返すこと」と「Postgresが更新された
 * こと」しか検証できない——`'use cache'` / `cacheTag` / `revalidateTag` はNext.jsの
 * request scope（cacheComponents runtime）の中でしか動作せず、Vitestから直接呼び出す形の
 * テストではその機構自体が発動しない（`node_modules/next/src/server/use-cache/*` を
 * request scope外から呼ぶと明示的に例外化することを実機確認済み）。「publishした内容が、
 * 本当にHTTP応答として返るキャッシュ済みHTMLへ反映されること」を検証できるのは、実際に
 * `next build && next start` したサーバーへ本物のHTTPリクエストを送るこのe2eテストだけ。
 *
 * 前提（`docs/reference/content-preview-runbook-v1.md` 参照）:
 * - `CONTENT_SOURCE=payload`・実throwaway Postgres（`content:import --bootstrap-admin`で
 *   `data/*.ts`相当の内容を投入済み）に対して `npm run build` 済みであること。
 * - `PAYLOAD_PUBLIC_SERVER_URL` がこのe2eサーバー自身のURL（`http://127.0.0.1:3399`、
 *   `playwright.config.ts`の`webServer`と同じport）を指していること——collectionの
 *   `afterChange`フックが自分自身の`/api/revalidate-content`へ通知できるようにするため。
 * - `REVALIDATION_SECRET` がこのサーバー起動時のprocess.envと、`updateContentForE2E.mts`を
 *   起動する側のprocess.envの両方で同じ値であること（署名の生成・検証がどちらも
 *   `process.env.REVALIDATION_SECRET`を参照するため）。
 *
 * 実行例:
 * ```
 * CONTENT_SOURCE=payload \
 * DATABASE_URL=postgresql://.../deploid_task7_e2e \
 * PAYLOAD_SECRET=... PAYLOAD_PUBLIC_SERVER_URL=http://127.0.0.1:3399 \
 * REVALIDATION_SECRET=... PREVIEW_TOKEN_SECRET=... \
 * npm run build && npm run test:e2e -- tests/e2e/cache-revalidation.spec.ts
 * ```
 *
 * このデータベースは**専用の使い捨てPostgres**であること。`tests/content/*.test.ts`の
 * destructive testと共有すると、そちらのbeforeAllが全collectionをdeleteして
 * import済みcontentを消してしまう（実機で発生した——`deploid_task7_vitest2`という
 * 共有throwaway DBへ`npx vitest run`を実行したところ、直前にimportした63件のrobots等が
 * 各testの`beforeAll`のdeleteで消え、後続のe2e検証ができなくなった。以後、
 * `deploid_task7_e2e`という完全に別のDBを使うことで回避した）。
 */

const ROBOT_STABLE_ID = 'fixture-robot-a';
const ROBOT_SLUG = 'fixture-robot-a';

/** `payload.config.ts`を読み込むため、必ずrepo rootをcwdにして実行する。 */
function updateRobotName(newName: string): void {
  execFileSync(
    'npx',
    ['tsx', 'tests/e2e/updateContentForE2E.mts', 'robots', ROBOT_STABLE_ID, 'name', newName],
    { cwd: REPO_ROOT, stdio: 'pipe', env: process.env },
  );
}

test.describe('publish revalidation reflects in real HTTP responses (Critical 1 proof)', () => {
  // 両testが同じrobot（unitree-g1）を更新するため、並列実行すると互いの更新を踏みうる
  // （実機で発生: workers=2でrace conditionが起き、片方のtestがもう片方の書き込みを拾って
  // しまい`toContain`が失敗した）。直列化してtest間の独立性を保つ。
  test.describe.configure({ mode: 'serial' });

  test.skip(
    process.env.CONTENT_SOURCE !== 'payload',
    'requires CONTENT_SOURCE=payload against a seeded throwaway Postgres — see file docblock for the exact invocation',
  );

  test('robot detail page HTML reflects a name change after the signed revalidation webhook fires', async ({ page }) => {
    const before = await page.goto(`/robots/${ROBOT_SLUG}`);
    expect(before?.status()).toBe(200);
    const originalHeading = await page.locator('h1').first().textContent();
    expect(originalHeading).toBeTruthy();

    const newName = `E2E Updated Name ${Date.now()}`;
    updateRobotName(newName);

    // `revalidateTag(tag, 'max')`はstale-while-revalidate profileの指定であり、次の1回の
    // 読み出しで即座に切り替わることを保証しない契約——ポーリングで「最終的に新しい値になる」
    // ことを確認する（brief Step 5 / reviewer Critical 1と同じ要求を、実HTTPレベルで行う）。
    await expect
      .poll(
        async () => {
          await page.goto(`/robots/${ROBOT_SLUG}`);
          return page.locator('h1').first().textContent();
        },
        { timeout: 30_000, intervals: [500, 1000, 2000] },
      )
      .toBe(newName);
  });

  test('the robot list page (a different cached view embedding the same robot) also reflects the update', async ({ page }) => {
    const uniqueName = `E2E List Update ${Date.now()}`;
    updateRobotName(uniqueName);

    // `/robots`（`CachedRobotsList`）はrobotsタグをcacheTag()しているため、同じ
    // `revalidateTag(contentTags.robots, 'max')`呼び出しで無効化されるはず——単一tagが
    // 複数の異なるcached viewを同時に無効化する、というfan-outの実際の動作を検証する。
    //
    // `/robots`はSuspense配下でストリーミングされる（`RobotsBrowser`）ため、`page.goto`直後の
    // 1回の読み取りだと初期HTML/streamingの途中を拾いうる。`page.goto`のたびに
    // `networkidle`を待ってから読む——これで「新しいrequestを送るたびのstale-while-
    // revalidate」（再navigationが必要）と「streaming完了待ち」（同一navigation内の待ち）の
    // 両方を満たす。
    await expect
      .poll(
        async () => {
          await page.goto('/robots');
          await page.waitForLoadState('networkidle');
          return page.locator('main').textContent();
        },
        { timeout: 30_000, intervals: [500, 1000, 2000] },
      )
      .toContain(uniqueName);
  });
});
