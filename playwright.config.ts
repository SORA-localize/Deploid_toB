import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // 各 route の初回レンダリングを計測前に済ませる。詳細は tests/warmRoutes.ts。
  globalSetup: './tests/warmRoutes.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // CI の retries は「たまたま遅い1回」を救うためのもので、flaky を許容する枠ではない。
  // **緑でも `N flaky` の行を必ず読むこと。** 2026-08-06 に、この retries が2件の別問題を
  // 同時に隠していた:
  //   1. hydration race が1件から2件へ増えていたのに、緑に見えるため CI ログを精読するまで
  //      気づけなかった（原因は `waitUntil: 'domcontentloaded'`。除去して解消）
  //   2. `/robots` の visual-regression が毎回別の viewport で 5〜6% 差分を出していた
  //      （原因は lazy 画像の読み込みレース。撮影前に読み切らせて解消）
  // どちらも「retries が吸収しているから問題ない」と判断されて放置されていた。
  // flaky を見つけたら retries を増やすのではなく、原因を消すこと。
  retries: process.env.CI ? 2 : 0,
  // 並列度のボトルネックはCPUではなく、テスト対象である単一の `next start` プロセス。
  // worker を増やすと重いrouteのSSRが詰まり、実際の挙動とは無関係な navigation timeout が
  // 毎回別のテストで出る（2026-08-03、テストを41件へ増やした際に発生。--workers=1 なら
  // 各1〜2秒で全件通る）。ローカルもCIと同じ 2 に固定する。
  workers: 2,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3399',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // e2e専用ポート。dev serverの3000とぶつからないようにする。
    command: 'npm run start -- --hostname 127.0.0.1 --port 3399',
    url: 'http://127.0.0.1:3399',
    // 既存サーバを再利用しない。再利用すると、別のcheckout（親checkoutや他のworktree）が
    // 立てたサーバに当たり、いま書いたコードを一度もテストしないまま全件緑になる。
    // 2026-08-02に実際に発生した。ポートが塞がっていればエラーで止まるほうが安全。
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
