import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
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
