import { expect, test } from '@playwright/test';

/**
 * content-platform-migration-plan-v1 Task 6 Step 1.
 *
 * ページがrepository経由でcontentを読むようになった後も、主要な公開routeが同じ形に
 * レンダリングされることを確かめる回帰test。
 *
 * **2026-08-28 更新**: Task 9 Step 7 で local source を撤去したため、`CONTENT_SOURCE=local`
 * での実行はできない（`lib/content/getContentRepository.ts` が起動時にthrowする）。
 * 実行方法は payload source のみ:
 *
 *   CONTENT_SOURCE=payload npm run build
 *   CONTENT_SOURCE=payload npm run test:e2e -- tests/e2e/content-routes.spec.ts
 *
 * **注意**: このspecは現在どのCI workflowからも実行されていない
 * （`npm run check` から `test:e2e` が外れており、`content-e2e.yml` は
 * `cache-revalidation` と `draft-mode-wiring` の2本しか実行しない）。
 * 計画書がTask 6 / Task 9 Step 4の受け入れ条件として指定したspecなので、
 * CI実行範囲の是正は未解決課題として
 * `docs/plans/content-platform-migration-factual-audit-v1.md` A-2 に記録している。
 *
 * fix round 2（reviewer High指摘への対応）: 横スクロール無しと`<main>`の可視性だけでは、
 * 対象routeが全て404（`src/app/global-not-found.tsx`にも`<main>`がある）でもテストが
 * 通ってしまう。HTTP statusを明示的に検証し、さらに既知の実コンテンツ
 * （既知のrobot/manufacturer名、既知のuse case見出し、実データへのlink）が
 * 実際にrepository経由で描画されていることを確認する。
 *
 * **2026-08-29 更新**: 既知の値の由来は`data/*.ts`（Task 9で削除済み）ではなく
 * `tests/fixtures/contentSnapshot.ts`。
 *
 * 旧`data/*.ts`のrobotは`nameJa`を持たず`name`（`G1`等）がそのまま出ていたため英語期待値で
 * 通っていた。fixtureは`name`と`nameJa`を**両方**持つので、同じ書き方だと落ちる。
 * - Robot `fixture-robot-a`: name `Alpha One` / nameJa `アルファワン`
 * - Manufacturer `fixture-mfr-alpha`: name `Alpha Robotics` / nameJa `アルファロボティクス`
 * - UseCase `fixture-usecase-one`: titleJa `倉庫内トート搬送`
 *
 * **ただし「日本語側へ一括で書き換える」は誤り。** 同じレコードでもsurfaceごとに使うfieldが
 * 違うことを実測で確認した:
 * - 一覧（`/robots`・`/manufacturers`）: メーカーは`nameJa`（`アルファロボティクス`）
 * - **詳細（`/robots/[slug]`）: メーカーは英語`name`（`Alpha Robotics`）**
 * - `/compare`: 初期表示はロボット未選択なので**ロボット名は出ない**。左メニューの
 *   メーカー名で到達を確認する
 * 期待値はsurfaceごとに実描画へ合わせること。ここを一律にすると、通っているように見えて
 * 実は別のsurfaceを検証していない状態になる。
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
  { route: '/robots', linkPrefixes: ['/robots/'], contains: ['アルファワン'] },
  { route: '/manufacturers', linkPrefixes: ['/manufacturers/'], contains: ['アルファロボティクス'] },
  { route: '/use-cases', linkPrefixes: ['/use-cases/'], contains: ['倉庫内トート搬送'] },
  { route: '/reports', linkPrefixes: ['/reports/'], contains: ['フィクスチャ分析記事'] },
  // `/compare` は初期表示ではロボットが1台も選択されていない（「比較シートにロボットが
  // ありません」）。したがってロボット名は出ない。DOMまでデータが届いていることは、
  // 左メニューのメーカー一覧に出るメーカー名で確認する。
  { route: '/compare', contains: ['アルファロボティクス'] },
  // 詳細ページはメーカー名を英語 `name` で描画する（一覧は `nameJa`）。同じレコードでも
  // surfaceごとに使うfieldが違うので、期待値もsurfaceごとに実描画へ合わせる。
  { route: '/robots/fixture-robot-a', contains: ['アルファワン', 'Alpha Robotics'] },
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
