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
    // Payload (`migrate:create`) が生成するmigration。テンプレートが常に
    // `{ db, payload, req }` を分割代入するため、`payload`/`req` を使わないmigrationは
    // 必ず no-unused-vars 警告になる。生成物であり、lintを通すための手編集はしない
    // （Task 3.5: docs/reference/database-migration-runbook-v1.md）。
    'migrations/**',
  ]),
]);
