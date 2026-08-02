import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // GitHub-hosted runners typically have 2 vCPUs; an unbounded worker count
  // (Playwright's local default scales with core count) can saturate the
  // single `next start` server under test and produce navigation timeouts
  // unrelated to any route's actual behavior. Cap CI only; local runs keep
  // Playwright's own default.
  workers: process.env.CI ? 2 : undefined,
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
