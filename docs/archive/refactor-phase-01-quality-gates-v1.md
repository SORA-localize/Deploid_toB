---
status: plan
updated: 2026-07-26
---

# Phase 1 Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 現行のデータ・URL・主要UI回帰を、localとGitHub Actionsの同じコマンドで検出できる安全網を作る。

**Architecture:** unit testはpure functionと現行data validationを検証し、Playwrightはproduction buildに対して公開route、redirect、sitemap、mobile overflowを検証する。PR品質ゲートは決定論的なcheckだけに限定し、外部source URLはretry付きscheduled workflowへ分離する。

**Tech Stack:** TypeScript 6、ESLint 9 flat config、Vitest、Testing Library、Playwright Chromium、axe-core、GitHub Actions

## Global Constraints

- アプリの表示、データ、URLはこのphaseで変更しない。
- lint errorを大量のdisable commentで隠さない。
- flakyな外部URL検査を`npm run check`へ含めない。
- E2Eは`next build`後の`next start`を対象にし、dev serverだけで通さない。
- `npm run check`はlocalとCIで同じ順序を使う。
- Node.jsは`package.json`どおり22.12.0以上を使う。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `eslint.config.mjs` | Next.js core-web-vitals / TypeScript lint |
| `vitest.config.ts` | `@/` alias、node/jsdom test環境 |
| `vitest.setup.ts` | jest-dom matcher |
| `playwright.config.ts` | production server、Chromium、artifact |
| `tests/unit/current-data.test.ts` | 現行validation baseline |
| `tests/unit/sitemap.test.ts` | sitemap URL一意性 |
| `tests/e2e/public-routes.spec.ts` | index/detail smoke |
| `tests/e2e/slug-redirects.spec.ts` | previous slug redirect |
| `tests/e2e/mobile-overflow.spec.ts` | 390px document overflow |
| `tests/e2e/accessibility-smoke.spec.ts` | 主要routeのaxe重大違反 |
| `.github/workflows/ci.yml` | PR/main品質ゲート |
| `.github/workflows/source-links.yml` | scheduled外部リンク監視 |

### 変更

| Path | Responsibility |
|---|---|
| `package.json` / `package-lock.json` | scriptsとdev dependencies |
| `docs/reference/refactor-baseline-2026-07-26.md` | Phase 0/1の再現可能な基準値 |

---

### Task 1: 再現可能なbaselineを記録する

**Files:**
- Create: `docs/reference/refactor-baseline-2026-07-26.md`

**Interfaces:**
- Consumes: `npm run validate:data`、`npm run build`、`.next/server/app/index.html`
- Produces: 後続phaseが比較する固定baseline

- [ ] **Step 1: cleanな依存状態で現行gateを実行する**

```bash
npm ci
npm run validate:data
npm run build
```

Expected: validationが`OK`、buildがexit 0、157ページを生成。

- [ ] **Step 2: source・buildの計測値を取得する**

```bash
find components lib src -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
rg -l "^['\"]use client['\"]" components lib src | wc -l
wc -c .next/server/app/index.html
rg -o "data:image/svg\\+xml" .next/server/app/index.html | wc -l
node -e 'const x=require("./.next/diagnostics/route-bundle-stats.json"); console.log(JSON.stringify(x,null,2))'
```

Expected: raw値をそのまま取得できる。監査時点の参考値はHome `4,206,770 bytes`、world-map data URI 3件、Client Component 63件。

- [ ] **Step 3: baseline文書を作る**

`docs/reference/refactor-baseline-2026-07-26.md`へ次を記録する。

```markdown
# Pre-migration Refactor Baseline — 2026-07-26

## Environment
- Commit: b2cdbe1
- Node: v24.5.0
- npm: 11.5.1

## Gates
| Command | Result |
|---|---|
| npm run validate:data | pass |
| npm run build | pass |
| npm run check:source-links | diagnostic only; external timeoutあり |

## Output
- Generated routes: 157
- Home raw HTML bytes: 4206770
- Home world-map SVG data URI occurrences: 4
- TypeScript/TSX files: 180
- Client Components: 63

## Route first-load uncompressed JavaScript
| Route | Bytes |
|---|---:|
| /reports | 1121603 |
| /robots | 923085 |
| /manufacturers | 910306 |
| /use-cases | 861263 |
| / | 849132 |
| /compare | 843758 |

## Route client gzip
`.next/diagnostics/route-bundle-stats.json`の値と上表が一致することを確認する。

## Data counts
| Collection | Count |
|---|---:|
| robots | 63 |
| manufacturers | 26 |
| articles | 34 |
| useCases | 44 |
| deployments | 11 |
```

Node/npmがbaseline再取得時に異なる場合は、その実行環境を追記し、上記既存baselineを上書きしない。

- [ ] **Step 4: commit**

```bash
git add docs/reference/refactor-baseline-2026-07-26.md
git commit -m "docs: record pre-refactor quality baseline"
```

---

### Task 2: ESLintとVitestを追加する

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `tests/unit/current-data.test.ts`
- Create: `tests/unit/sitemap.test.ts`

**Interfaces:**
- Consumes: `validateData(): { errors: string[]; warnings: string[] }`、`sitemap(): MetadataRoute.Sitemap`
- Produces: `npm run typecheck`、`npm run lint`、`npm run test`

- [ ] **Step 1: failing testを追加する**

```ts
// tests/unit/current-data.test.ts
import { describe, expect, it } from 'vitest';
import { validateData } from '@/lib/validate';

describe('current content baseline', () => {
  it('has no blocking validation errors', () => {
    expect(validateData().errors).toEqual([]);
  });
});
```

```ts
// tests/unit/sitemap.test.ts
import { describe, expect, it } from 'vitest';
import sitemap from '@/src/app/sitemap';

describe('sitemap', () => {
  it('contains unique absolute URLs', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.every((url) => URL.canParse(url))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
```

- [ ] **Step 2: test scriptがないことを確認する**

Run: `npm run test`

Expected: `Missing script: "test"`でFAIL。

- [ ] **Step 3: test/lint dependenciesを追加する**

```bash
npm install --save-dev eslint@^9 eslint-config-next@16.2.12 vitest@^4 @vitejs/plugin-react@^5 vite-tsconfig-paths@^6 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^28
```

- [ ] **Step 4: scriptsを追加する**

`package.json`の`scripts`へ追加する。

```json
{
  "typecheck": "tsc --noEmit --incremental false",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Vitest設定を追加する**

```ts
// vitest.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    environmentMatchGlobs: [['tests/components/**', 'jsdom']],
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: ESLint flat configを追加する**

```js
// eslint.config.mjs
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
  ]),
]);
```

- [ ] **Step 7: 新しいgateを実行し、既存lint errorを修正する**

```bash
npm run typecheck
npm run lint
npm run test
```

Expected: 3コマンドともexit 0。修正は型、安全なdependency配列、未使用import、semantic JSXに限定し、表示仕様を変更しない。

- [ ] **Step 8: commit**

```bash
git add package.json package-lock.json eslint.config.mjs vitest.config.ts vitest.setup.ts tests/unit
git commit -m "test: add static and unit quality gates"
```

---

### Task 3: production E2Eを追加する

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/public-routes.spec.ts`
- Create: `tests/e2e/slug-redirects.spec.ts`
- Create: `tests/e2e/mobile-overflow.spec.ts`
- Create: `tests/e2e/accessibility-smoke.spec.ts`

**Interfaces:**
- Consumes: production build at `http://127.0.0.1:3000`
- Produces: `npm run test:e2e`、`npm run check`

- [ ] **Step 1: E2E dependenciesを追加する**

```bash
npm install --save-dev @playwright/test@^1.58 @axe-core/playwright@^4
npx playwright install chromium
```

- [ ] **Step 2: Playwright設定を追加する**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: 公開route smoke testを書く**

```ts
// tests/e2e/public-routes.spec.ts
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/robots',
  '/robots/unitree-g1',
  '/manufacturers',
  '/use-cases',
  '/reports',
  '/compare',
] as const;

for (const route of routes) {
  test(`${route} renders one main landmark and one h1`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
}
```

このtestは現状の`/reports` H1欠落でFAILするため、Phase 1では`/reports`だけ既知失敗として除外せず、表示を変えない最小修正として`ReportsBrowser`に既存`uiText.reports`のH1/descriptionを追加する。Phase 6でheader構造とvisual hierarchyを再調整する。

- [ ] **Step 4: previous slug redirect testを書く**

```ts
// tests/e2e/slug-redirects.spec.ts
import { expect, test } from '@playwright/test';

const redirects = [
  ['/robots/unitree-r1', /\/robots\/unitree-r1-air$/],
  ['/use-cases/warehouse-picking', /\/use-cases\/warehouse-tote-material-handling$/],
] as const;

for (const [from, destination] of redirects) {
  test(`${from} redirects to its canonical slug`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(destination);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', destination);
  });
}
```

canonical slugは2026-07-26時点の`unitree-r1-air`と`warehouse-tote-material-handling`へ固定する。データ変更を伴う別作業でslugが正式変更された場合だけ、`previousSlugs`とredirect contractを同じcommitで更新する。

- [ ] **Step 5: mobile overflow testを書く**

```ts
// tests/e2e/mobile-overflow.spec.ts
import { expect, test } from '@playwright/test';

for (const route of ['/', '/robots', '/manufacturers', '/use-cases', '/reports', '/compare']) {
  test(`${route} has no document overflow at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    const sizes = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
  });
}
```

- [ ] **Step 6: axe smoke testを書く**

```ts
// tests/e2e/accessibility-smoke.spec.ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/robots', '/manufacturers', '/use-cases', '/reports']) {
  test(`${route} has no critical axe violations`, async ({ page }) => {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((item) => item.impact === 'critical')).toEqual([]);
  });
}
```

- [ ] **Step 7: scriptsを追加しproduction E2Eを実行する**

`package.json`:

```json
{
  "test:e2e": "playwright test",
  "check": "npm run validate:data && npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e"
}
```

Run: `npm run check`

Expected: 全工程exit 0。

- [ ] **Step 8: commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e components/ReportsBrowser.tsx
git commit -m "test: cover public routes with production e2e"
```

---

### Task 4: CIと外部リンク監視を分離する

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/source-links.yml`

**Interfaces:**
- Consumes: `npm run check`、`npm run check:source-links`
- Produces: deterministic PR check、non-blocking scheduled link report

- [ ] **Step 1: PR/main CIを追加する**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main, refactor/integration-20260726]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.12.0
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run check
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: scheduled source link workflowを追加する**

```yaml
# .github/workflows/source-links.yml
name: Source link monitor

on:
  schedule:
    - cron: '17 2 * * 1'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.12.0
          cache: npm
      - run: npm ci
      - name: Check external source links with retry
        run: |
          for attempt in 1 2 3; do
            npm run check:source-links && exit 0
            sleep $((attempt * 20))
          done
          exit 1
```

- [ ] **Step 3: workflowとlocal gateを検証する**

```bash
npm run check
git diff --check
rg -n "check:source-links" .github/workflows
```

Expected:

- `npm run check`がexit 0
- `check:source-links`は`source-links.yml`だけに存在
- `ci.yml`は外部URLへ依存しない

- [ ] **Step 4: commit**

```bash
git add .github/workflows
git commit -m "ci: add deterministic checks and link monitoring"
```

---

## Phase completion

```bash
npm ci
npm run check
git diff --check
git status -sb
```

実測結果を`docs/reference/refactor-baseline-2026-07-26.md`へ追記し、`refactor/01-quality-gates`をreviewする。
