import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Task 8: `tests/integration/mcp-endpoint.test.ts` 専用config。`vitest.config.ts`（既定の
 * `npm run test`）からは `tests/integration/**` を明示的に除外している——このsuiteは
 * `next dev` を子processとして実際に起動し、実HTTP越しにMCP JSON-RPCを話すため、他の
 * `tests/content/*.test.ts`（Local API + Postgresのみ）よりずっと重い。
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    fileParallelism: false,
    testTimeout: 120_000,
    // `next dev` の初回request(warm-up)がroute群のon-demand compileを引き起こし、実測で
    // 180秒を超えて `beforeAll` 自体がhook timeoutで落ちたことがある（このrepoは
    // richtext editor等を含み、初回compileが重い）。5分に広げる。
    hookTimeout: 300_000,
  },
});
