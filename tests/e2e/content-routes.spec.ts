import { expect, test } from '@playwright/test';

/**
 * content-platform-migration-plan-v1 Task 6 Step 1.
 *
 * ページがrepository（local / payload 両source）経由でcontentを読むようになった後も、
 * 主要な公開routeが両sourceで同じ形にレンダリングされることを確かめる回帰test。
 * `CONTENT_SOURCE=local` と `CONTENT_SOURCE=payload` それぞれで
 * `npm run build && npm run test:e2e -- tests/e2e/content-routes.spec.ts` を実行する
 * （両方PASSすることがTask 6の受け入れ条件）。
 *
 * fix round 2（reviewer High指摘への対応）: 横スクロール無しと`<main>`の可視性だけでは、
 * 対象routeが全て404（`src/app/global-not-found.tsx`にも`<main>`がある）でもテストが
 * 通ってしまう。HTTP statusを明示的に検証し、さらに`data/*.ts`由来の既知の実コンテンツ
 * （既知のrobot/manufacturer名、既知のuse case/article見出し、実データへのlink）が
 * 実際にrepository経由で描画されていることを確認する。既知の値の由来:
 * - Robot `unitree-g1`（`data/robots.ts`）: name `G1`, manufacturer `Unitree Robotics`
 * - UseCase `warehouse-tote-material-handling`（`data/useCases.ts`）: titleJa `倉庫内トート・軽量搬送`
 * - Article `surgie-unitree-g1-preclinical-surgery`（`data/articles.ts`）: titleJa に `Surgie` を含む
 *
 * `main.textContent()`（`innerText()`ではない）を使うのは、メーカー名の一部
 * （`ManufacturerLogoName`の`hideName`）が視覚的にはロゴへ置き換わりsr-onlyテキストとして
 * DOMに残る箇所があるため。ここで確認したいのは「正しいデータがDOMまで届いているか」で
 * あって視覚的な出し分けではないので、DOM上のテキストノードをそのまま見るtextContentが適切。
 */
interface RouteCheck {
  route: string;
  /** このrouteの`<main>`配下に、このprefixで始まるhrefのlinkが最低1つあることを確認する。 */
  linkPrefixes?: string[];
  /** `<main>`のtextContentに、この文字列がすべて含まれることを確認する。 */
  contains?: string[];
}

const ROUTE_CHECKS: RouteCheck[] = [
  // Home: featured robots / use cases / reports の各セクションが実データから描画されている
  // ことを、rankingに依存しない形（link件数）で確認する。
  { route: '/', linkPrefixes: ['/robots/', '/use-cases/', '/reports/'] },
  { route: '/robots', linkPrefixes: ['/robots/'], contains: ['Alpha One'] },
  { route: '/manufacturers', linkPrefixes: ['/manufacturers/'], contains: ['Alpha Robotics'] },
  { route: '/use-cases', linkPrefixes: ['/use-cases/'], contains: ['倉庫内トート搬送'] },
  { route: '/reports', linkPrefixes: ['/reports/'], contains: ['フィクスチャ分析記事'] },
  { route: '/compare', contains: ['Alpha One'] },
  { route: '/robots/fixture-robot-a', contains: ['Alpha One', 'Alpha Robotics'] },
];

for (const { route, linkPrefixes, contains } of ROUTE_CHECKS) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status(), `expected ${route} to respond 200`).toBe(200);

    const main = page.locator('main');
    await expect(main).toBeVisible();

    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBe(widths.client);

    for (const prefix of linkPrefixes ?? []) {
      // Payload sourceは実DB I/Oのため、PPRの動的部分が初期HTMLの直後に少し遅れて届くことがある
      // （local sourceは同期的なin-memory読み取りなのでほぼ即時）。`expect.poll`で
      // その到着を待ってから件数を確認する（1回読みだと稀に空のまま判定してしまう）。
      await expect
        .poll(() => main.locator(`a[href^="${prefix}"]`).count(), {
          message: `expected at least one link starting with "${prefix}" on ${route}`,
        })
        .toBeGreaterThan(0);
    }

    if (contains) {
      for (const needle of contains) {
        // `toContainText` はDOMのtextContentベースで自動リトライする。sr-only化された
        // メーカー名（`hideName`）も拾えて、かつPayload sourceのストリーミング到着待ちも兼ねる。
        await expect(main, `expected "${route}" main content to contain "${needle}"`).toContainText(needle);
      }
    }
  });
}
