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
    restoreMocks: true,
  },
});
