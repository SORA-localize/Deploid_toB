import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'public/generated/**',
    'docs/**',
    // check:plan-snippets が計画書から抽出した一時ファイル。文脈を省いた断片なので
    // 未使用importなどの警告が必ず出る。型検査は tsconfig.plan-snippets.json 側で行う。
    '.plan-snippets/**',
    '.worktrees/**',
  ]),
]);
