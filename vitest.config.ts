import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // environmentMatchGlobs was removed in Vitest 4 (deprecated since 3.2).
    // Default environment is 'node'; component tests that need a DOM should
    // opt in per-file with a `// @vitest-environment jsdom` docblock.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // `tests/integration/**` (Task 8) boots a real `next dev` server as a child process against a
    // throwaway Postgres DB and talks real HTTP/JSON-RPC to `/api/mcp`. That's much slower and
    // heavier than the rest of the suite (which never starts a server), so it is excluded from the
    // default `npm run test` / `npm run check` run and has its own `npm run test:integration`
    // (`vitest.integration.config.ts`) instead — mirroring how `playwright.config.ts` already keeps
    // full-server e2e separate from this file's unit/Local-API suite.
    exclude: ['node_modules/**', 'tests/integration/**'],
    restoreMocks: true,
    // `tests/content/*.test.ts` (content-platform-migration Task 3+) each call `getPayload()`
    // in `beforeAll`, which triggers Payload's dev-mode schema push (drizzle-kit push) against
    // the shared local/CI Postgres — there is no committed migration yet (that's Task 3.5).
    // Running multiple such files concurrently (Vitest's default file parallelism) races that
    // push and produces spurious `constraint "..." does not exist` failures
    // (confirmed reproducible with `vitest run tests/content/` before this flag; confirmed fixed
    // by `--no-file-parallelism`). `npm run check`/CI invoke `npm run test` → `vitest run` with
    // no scoping, so the flag has to live here to actually protect CI, not just be a documented
    // recommendation. Applied suite-wide rather than scoped to `tests/content/` only: the whole
    // suite is small enough (a few seconds) that the serialization cost is negligible, and a
    // single root-level flag is far lower-risk than Vitest's newer multi-project config for a
    // one-line fix. Revisit (narrow to a `tests/content`-only project, or drop the multi-project
    // idea) if the wider suite grows enough for this to matter. Expected to become unnecessary
    // once Task 3.5 lands a committed, CI-applied migration — `getPayload()` won't push schema
    // at that point, so the race disappears at the root. Do not remove this before then.
    fileParallelism: false,
  },
});
