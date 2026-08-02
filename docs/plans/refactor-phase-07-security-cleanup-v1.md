---
status: plan
updated: 2026-07-26
---

# Phase 7 Security and Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** analyticsとproduction設定を明示的なopt-inへ変更し、app-level security headers、dead-code/docs gate、最終baseline比較を追加してprogramを完了する。

**Architecture:** public environment valuesはpure parserで検証し、IDが明示されたproduction buildだけanalyticsを描画する。security headersは安全な固定headerをenforceし、CSPはreport-onlyで互換性を観測する。root client依存をrouteへ局所化し、Knipとlocal docs link checkerで後退を防ぐ。

**Tech Stack:** Next.js 16、TypeScript、Vercel Analytics、GA4、Microsoft Clarity、Vitest、Playwright、Knip

## Global Constraints

- GA/Clarityの実IDをsource、`.env.example`、test snapshotへ書かない。
- analyticsは未設定時にnetwork requestを送信しない。
- productionで不正形式のanalytics IDを黙って受け入れない。
- CSPはこのphaseでenforceせず、`Content-Security-Policy-Report-Only`に限定する。
- header追加で画像、YouTube、Formspree、analytics、Vercel runtimeを壊さない。
- dead-code toolのfalse positiveを無言ignoreせず、理由を設定へコメントする。
- 外部source link checkは引き続きscheduledで、PR gateへ戻さない。
- program完了時にcurrent docsと実装を一致させる。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `lib/securityHeaders.mjs` | Next configとtestが共有するsecurity header値 |
| `tests/unit/env.test.ts` | env parserとopt-in |
| `tests/unit/security-headers.test.ts` | header構成 |
| `tests/e2e/security-headers.spec.ts` | production response |
| `tests/e2e/analytics-opt-in.spec.ts` | 未設定時の外部request 0件 |
| `knip.json` | dead-code entry/allowlist |
| `scripts/check-doc-links.mjs` | local Markdown link検査 |
| `scripts/write-refactor-results.mjs` | build/audit結果から最終報告を生成 |
| `docs/reference/pre-migration-refactor-results-v1.md` | before/afterと残課題 |

### 変更

| Path | Responsibility |
|---|---|
| `lib/env.ts` | pure parser、validation、analytics flags |
| `.env.example` | secret/IDなしの設定例 |
| `src/app/layout.tsx` | analytics conditional、root Toaster削除 |
| `components/AnalyticsScripts.tsx` | IDなしならnull |
| `components/CompareClient.tsx` | route-local Toaster |
| `next.config.mjs` | app-level headers |
| `package.json` / `package-lock.json` | knip/docs scripts、unused dependency削除 |
| `README.md` | commandsとenv contract |
| `docs/README.md` | program完了・current plans |
| `docs/plans/project-wide-refactor-roadmap-v2.md` | pre-migration完了値 |

---

### Task 1: Analyticsを明示opt-inへ変更する

**Files:**
- Create: `tests/unit/env.test.ts`
- Create: `tests/e2e/analytics-opt-in.spec.ts`
- Modify: `lib/env.ts`
- Modify: `.env.example`
- Modify: `components/AnalyticsScripts.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `README.md`

**Interfaces:**
- Produces:
  - `parsePublicEnv(source): PublicEnv`
  - `env.analyticsEnabled`
  - `env.vercelAnalyticsEnabled`

- [ ] **Step 1: env parser testを書く**

```ts
// tests/unit/env.test.ts
import { describe, expect, it } from 'vitest';
import { parsePublicEnv } from '@/lib/env';

describe('parsePublicEnv', () => {
  it('disables analytics when IDs are absent', () => {
    const env = parsePublicEnv({ NODE_ENV: 'production', VERCEL_ENV: 'production' });
    expect(env.gaMeasurementId).toBeNull();
    expect(env.clarityProjectId).toBeNull();
    expect(env.analyticsEnabled).toBe(false);
    expect(env.vercelAnalyticsEnabled).toBe(false);
  });

  it('enables configured analytics only in production runtime', () => {
    const env = parsePublicEnv({
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST1234',
      NEXT_PUBLIC_CLARITY_PROJECT_ID: 'clarity123',
      NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: 'true',
    });
    expect(env.analyticsEnabled).toBe(true);
    expect(env.vercelAnalyticsEnabled).toBe(true);
  });

  it('rejects invalid configured IDs in production', () => {
    expect(() =>
      parsePublicEnv({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_GA_MEASUREMENT_ID: 'invalid',
      }),
    ).toThrow('NEXT_PUBLIC_GA_MEASUREMENT_ID');
  });
});
```

- [ ] **Step 2: testが現行default IDで失敗することを確認する**

Run: `npm run test -- tests/unit/env.test.ts`

Expected: `parsePublicEnv`未存在またはdefault IDによりFAIL。

- [ ] **Step 3: pure env parserを実装する**

```ts
// lib/env.ts
type EnvSource = Readonly<Record<string, string | undefined>>;

function optional(source: EnvSource, key: string) {
  return source[key]?.trim() || null;
}

function parseBoolean(source: EnvSource, key: string) {
  return source[key]?.trim().toLowerCase() === 'true';
}

export function parsePublicEnv(source: EnvSource) {
  const isProd = source.NODE_ENV === 'production';
  const isVercelProduction = source.VERCEL_ENV === 'production';
  const isProductionRuntime = isProd && (isVercelProduction || !source.VERCEL_ENV);
  const gaMeasurementId = optional(source, 'NEXT_PUBLIC_GA_MEASUREMENT_ID');
  const clarityProjectId = optional(source, 'NEXT_PUBLIC_CLARITY_PROJECT_ID');
  const analyticsRequested = parseBoolean(source, 'NEXT_PUBLIC_ANALYTICS_ENABLED');

  if (isProductionRuntime && gaMeasurementId && !/^G-[A-Z0-9]+$/.test(gaMeasurementId)) {
    throw new Error('[env] NEXT_PUBLIC_GA_MEASUREMENT_ID must match G-[A-Z0-9]+');
  }
  if (isProductionRuntime && clarityProjectId && !/^[a-z0-9]+$/i.test(clarityProjectId)) {
    throw new Error('[env] NEXT_PUBLIC_CLARITY_PROJECT_ID must be alphanumeric');
  }
  if (isProductionRuntime && analyticsRequested && !gaMeasurementId && !clarityProjectId) {
    throw new Error('[env] NEXT_PUBLIC_ANALYTICS_ENABLED requires a GA or Clarity ID');
  }

  return {
    formspreeFormId: optional(source, 'NEXT_PUBLIC_FORMSPREE_FORM_ID'),
    gaMeasurementId,
    clarityProjectId,
    mediaUsagePolicy: optional(source, 'NEXT_PUBLIC_MEDIA_USAGE_POLICY'),
    isDev: source.NODE_ENV === 'development',
    isProd,
    isVercelProduction,
    isProductionRuntime,
    analyticsEnabled:
      isProductionRuntime &&
      analyticsRequested &&
      Boolean(gaMeasurementId || clarityProjectId),
    vercelAnalyticsEnabled:
      isProductionRuntime &&
      parseBoolean(source, 'NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED'),
  } as const;
}

export const env = parsePublicEnv(process.env);

if (env.isProductionRuntime && !env.formspreeFormId) {
  console.warn('[env] NEXT_PUBLIC_FORMSPREE_FORM_ID is not defined. Contact form will be disabled.');
}
```

- [ ] **Step 4: layoutをconditional renderingへ変更する**

```tsx
<AnalyticsScripts
  gaMeasurementId={env.gaMeasurementId}
  clarityProjectId={env.clarityProjectId}
  enabled={env.analyticsEnabled}
/>
{env.vercelAnalyticsEnabled ? <Analytics /> : null}
```

`AnalyticsScripts`は`!enabled || (!gaMeasurementId && !clarityProjectId)`で`null`を返す。

- [ ] **Step 5: exampleとREADMEから実ID/default説明を削除する**

`.env.example`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_FORMSPREE_FORM_ID=
NEXT_PUBLIC_MEDIA_USAGE_POLICY=reference-attributed
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_CLARITY_PROJECT_ID=
NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=false
```

READMEはGA/Clarityを「`NEXT_PUBLIC_ANALYTICS_ENABLED=true`かつID設定時だけproductionで有効」、Vercel Analyticsを「`true`かつproductionのみ有効」と記載する。

- [ ] **Step 6: network E2Eを書く**

```ts
// tests/e2e/analytics-opt-in.spec.ts
import { expect, test } from '@playwright/test';

test('does not request analytics when public IDs are absent', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/googletagmanager|google-analytics|clarity\.ms|vercel-insights/.test(url)) {
      analyticsRequests.push(url);
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(analyticsRequests).toEqual([]);
});
```

このE2Eはanalytics IDを与えないCI buildで実行する。実IDがあるlocal `.env.local`で実行する場合は、次の明示overrideでbuildする。

```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=false NEXT_PUBLIC_GA_MEASUREMENT_ID= NEXT_PUBLIC_CLARITY_PROJECT_ID= NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=false npm run build
```

- [ ] **Step 7: testsとcommit**

```bash
npm run test -- tests/unit/env.test.ts
npm run build
npm run test:e2e -- tests/e2e/analytics-opt-in.spec.ts
git add lib/env.ts .env.example components/AnalyticsScripts.tsx src/app/layout.tsx README.md tests/unit/env.test.ts tests/e2e/analytics-opt-in.spec.ts
git commit -m "fix: make analytics an explicit production opt-in"
```

---

### Task 2: Security headersとCSP report-onlyを追加する

**Files:**
- Create: `lib/securityHeaders.mjs`
- Create: `tests/unit/security-headers.test.ts`
- Create: `tests/e2e/security-headers.spec.ts`
- Modify: `next.config.mjs`

**Interfaces:**
- Produces: `securityHeaders: Array<{ key: string; value: string }>`

- [ ] **Step 1: header contract testを書く**

```ts
// tests/unit/security-headers.test.ts
import { describe, expect, it } from 'vitest';
import { securityHeaders } from '@/lib/securityHeaders.mjs';

describe('securityHeaders', () => {
  const headers = new Map(securityHeaders.map(({ key, value }) => [key, value]));

  it('sets baseline browser protections', () => {
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
    expect(headers.get('Content-Security-Policy-Report-Only')).toContain("default-src 'self'");
    expect(headers.has('Content-Security-Policy')).toBe(false);
  });
});
```

- [ ] **Step 2: header正本を作る**

```ts
// lib/securityHeaders.mjs
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://formspree.io",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://vitals.vercel-insights.com https://formspree.io",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

export const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
] as const;
```

- [ ] **Step 3: Next configへ全route headerを設定する**

```js
// next.config.mjs
import { securityHeaders } from './lib/securityHeaders.mjs';

const nextConfig = {
  // existing settings
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders],
      },
    ];
  },
};
```

- [ ] **Step 4: production response testを書く**

```ts
// tests/e2e/security-headers.spec.ts
import { expect, test } from '@playwright/test';

test('serves baseline security headers', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(response.headers()['permissions-policy']).toContain('camera=()');
  expect(response.headers()['content-security-policy-report-only']).toContain("default-src 'self'");
  expect(response.headers()['content-security-policy']).toBeUndefined();
});
```

- [ ] **Step 5: build/E2Eで互換性を確認する**

```bash
npm run test -- tests/unit/security-headers.test.ts
npm run build
npm run test:e2e -- tests/e2e/security-headers.spec.ts tests/e2e/public-routes.spec.ts
```

Expected: headers present、enforced CSP absent、画像/YouTube/Formspree routeの5xxなし。

- [ ] **Step 6: commit**

```bash
git add lib/securityHeaders.mjs next.config.mjs tests/unit/security-headers.test.ts tests/e2e/security-headers.spec.ts
git commit -m "feat: add application security headers"
```

---

### Task 3: RootのToasterをcompare routeへ局所化する

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `components/CompareClient.tsx`
- Test: `tests/e2e/compare.spec.ts`

**Interfaces:**
- Consumes: compareの`toast()` calls
- Produces: compare routeだけの`<Toaster />`

- [ ] **Step 1: toast利用箇所を確認する**

```bash
rg -n "from ['\"]sonner|<Toaster" components lib src
```

Expected: `toast()`はcompareだけ、`Toaster`はrootだけ。

- [ ] **Step 2: providerをrouteへ移す**

`src/app/layout.tsx`から`Toaster` import/renderを削除し、`CompareClient`のroot fragmentへ追加する。

```tsx
return (
  <>
    <div className="min-h-screen bg-background">
      {/* existing compare UI */}
    </div>
    <Toaster />
  </>
);
```

- [ ] **Step 3: compare toastと他route bundleを確認する**

```bash
npm run build
npm run test:e2e -- tests/e2e/compare.spec.ts
npm run check:client-budgets
```

Expected: share/view toastが表示され、non-compare routeのclient bytesが増えない。

- [ ] **Step 4: commit**

```bash
git add src/app/layout.tsx components/CompareClient.tsx
git commit -m "perf: scope toast runtime to compare"
```

---

### Task 4: Dead codeと不要依存を継続検査する

**Files:**
- Create: `knip.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: Knipでunusedと確認されたsource files

**Interfaces:**
- Produces: `npm run check:dead-code`

- [ ] **Step 1: Knipを追加する**

```bash
npm install --save-dev knip@^5
```

- [ ] **Step 2: Next.js entryとintentional tool依存を設定する**

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "src/app/**/{page,layout,route,loading,not-found,error,global-error,sitemap,robots,manifest}.{ts,tsx}",
    "scripts/*.mjs"
  ],
  "project": [
    "components/**/*.{ts,tsx}",
    "data/**/*.ts",
    "lib/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}"
  ],
  "ignoreDependencies": [
    "@tailwindcss/postcss",
    "tailwindcss",
    "tw-animate-css",
    "vercel"
  ]
}
```

Ignore理由:

- PostCSS/Tailwind 3件: CSS/build configから解決
- `vercel`: repository-local deploy/preview CLIとして意図的に保持

- [ ] **Step 3: first scanを実行する**

```bash
npx knip
```

Expected: Phase 5後に不要になった`minisearch`、旧search index、旧tilt hook等が候補として出る。

- [ ] **Step 4: unused itemを1群ずつ削除する**

削除順:

1. import 0件のsource file
2. import 0件のexport
3. runtime/development dependency

`minisearch`がsource import 0件なら:

```bash
npm uninstall minisearch
```

`motion`、`radix-ui`、`sonner`は残存importがある限り削除しない。public APIに見えても外部packageとして公開していないrepoなので、Knipでunusedなlocal exportは呼び出し検索後に削除する。

- [ ] **Step 5: scriptをquality gateへ追加する**

```json
{
  "check:dead-code": "knip",
  "check": "npm run validate:data && npm run check:data-boundaries && npm run check:world-map-asset && npm run typecheck && npm run lint && npm run test && npm run check:dead-code && npm run build && npm run check:home-payload && npm run check:client-budgets && npm run test:e2e"
}
```

- [ ] **Step 6: full gateとcommit**

```bash
npm run check:dead-code
npm run check
git add knip.json package.json package-lock.json components lib
git commit -m "chore: remove unused code and enforce dead-code checks"
```

---

### Task 5: Local docs link checkを追加する

**Files:**
- Create: `scripts/check-doc-links.mjs`
- Modify: `package.json`
- Modify: broken current Markdown links

**Interfaces:**
- Produces: `npm run check:docs`
- Ignores: external URL、mailto、fragment-only link

- [ ] **Step 1: checkerを実装する**

```js
// scripts/check-doc-links.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const starts = ['README.md', 'AGENTS.md', 'docs', 'ai'];

function markdownFiles(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return absolute.endsWith('.md') ? [absolute] : [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    markdownFiles(path.join(target, entry.name)),
  );
}

const failures = [];
for (const file of starts.flatMap(markdownFiles)) {
  const body = fs.readFileSync(file, 'utf8');
  const prose = body.replace(/```[\s\S]*?```/g, '');
  for (const match of prose.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, '');
    if (/^(https?:|mailto:|#)/.test(raw)) continue;
    const withoutAnchor = decodeURIComponent(raw.split('#')[0]);
    if (!withoutAnchor) continue;
    const target = path.resolve(path.dirname(file), withoutAnchor);
    if (!fs.existsSync(target)) {
      failures.push(`${path.relative(root, file)} -> ${raw}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Broken local Markdown links:\n${failures.map((item) => `  - ${item}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('[docs] local links: OK');
}
```

- [ ] **Step 2: checkerを実行してcurrent docsを修正する**

```bash
node scripts/check-doc-links.mjs
```

archive内の歴史的linkも、移動先が分かる場合は現pathへ修正する。削除済み成果物への意図的参照はcode formattingへ変え、broken Markdown linkとして残さない。

- [ ] **Step 3: quality gateへ追加する**

```json
{
  "check:docs": "node scripts/check-doc-links.mjs",
  "check": "npm run validate:data && npm run check:data-boundaries && npm run check:world-map-asset && npm run check:docs && npm run typecheck && npm run lint && npm run test && npm run check:dead-code && npm run build && npm run check:home-payload && npm run check:client-budgets && npm run test:e2e"
}
```

- [ ] **Step 4: full gateとcommit**

```bash
npm run check:docs
npm run check
git add scripts/check-doc-links.mjs package.json docs ai README.md AGENTS.md
git commit -m "docs: enforce local documentation links"
```

---

### Task 6: 最終baseline比較と文書archiveを行う

**Files:**
- Create: `scripts/write-refactor-results.mjs`
- Create: `docs/reference/pre-migration-refactor-results-v1.md`
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/plans/project-wide-refactor-roadmap-v2.md`
- Move:
  - `docs/plans/pre-migration-refactor-safety-design-v1.md`
  - `docs/plans/pre-migration-refactor-implementation-index-v1.md`
  - `docs/plans/refactor-phase-01-quality-gates-v1.md`
  - `docs/plans/refactor-phase-02-dependency-security-v1.md`
  - `docs/plans/refactor-phase-03-data-internals-v1.md`
  - `docs/plans/refactor-phase-04-home-performance-v1.md`
  - `docs/archive/refactor-phase-05-client-boundaries-v1.md`（Phase 5完了時にarchive済み）
  - `docs/plans/refactor-phase-06-ui-accessibility-v1.md`
  - `docs/plans/refactor-phase-07-security-cleanup-v1.md`
  - To: `docs/archive/`

**Interfaces:**
- Consumes: 全phaseの実測値
- Produces: current docsと履歴の分離

- [ ] **Step 1: clean installから最終gateを実行する**

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
```

Expected: 全gate green、critical 0、dependency監査文書と一致。

- [ ] **Step 2: final metrics writerを作る**

```js
// scripts/write-refactor-results.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const baseline = {
  vulnerabilities: 13,
  homeHtml: 4_206_770,
  embeddedSvg: 4,
  routes: {
    '/reports': 1_121_603,
    '/robots': 923_085,
    '/manufacturers': 910_306,
    '/use-cases': 861_263,
  },
  clientComponents: 63,
};

const html = fs.readFileSync('.next/server/app/index.html', 'utf8');
const homeHtml = Buffer.byteLength(html);
const embeddedSvg = (html.match(/data:image\/svg\+xml/g) ?? []).length;
const routeStats = JSON.parse(
  fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'),
);
const auditRun = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd: root,
  encoding: 'utf8',
});
const audit = JSON.parse(auditRun.stdout);
if (!audit.metadata?.vulnerabilities) {
  throw new Error('npm audit metadata is unavailable');
}

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(absolute);
    return /\.(ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

const sourceFiles = ['components', 'lib', 'src'].flatMap((directory) =>
  filesUnder(path.join(root, directory)),
);
const clientComponents = sourceFiles.filter((file) =>
  /^['"]use client['"];?/m.test(fs.readFileSync(file, 'utf8')),
).length;
const routeBytes = Object.fromEntries(
  Object.keys(baseline.routes).map((route) => {
    const item = routeStats.find((entry) => entry.route === route);
    if (!item) throw new Error(`missing route bundle stats: ${route}`);
    return [route, item.firstLoadUncompressedJsBytes];
  }),
);
const percent = (before, after) =>
  `${(((after - before) / before) * 100).toFixed(1)}%`;
const totalVulnerabilities = audit.metadata.vulnerabilities.total;

const rows = [
  ['Runtime vulnerabilities', baseline.vulnerabilities, totalVulnerabilities],
  ['Home raw HTML bytes', baseline.homeHtml, homeHtml],
  ['Embedded map SVG data URI occurrences', baseline.embeddedSvg, embeddedSvg],
  ...Object.entries(baseline.routes).map(([route, before]) => [
    `${route} first-load JS`,
    before,
    routeBytes[route],
  ]),
  ['Client Components', baseline.clientComponents, clientComponents],
];

const markdown = `# Pre-migration Refactor Results v1

## Scope
CMS / DB移行は未実施。\`data/*.ts\`が引き続き正本。

## Before / After
| Metric | Before | After | Change |
|---|---:|---:|---:|
${rows.map(([label, before, after]) => `| ${label} | ${before} | ${after} | ${percent(before, after)} |`).join('\n')}

## Added gates
validate、data boundaries、docs links、typecheck、lint、unit、dead code、build、home payload、client budgets、E2E、axe、visual regression。

## Remaining work
Payload CMS + managed PostgreSQL移行は\`content-platform-migration-plan-v1.md\`で別実施。CSP enforceはreport-only互換性確認後の別判断。
`;

fs.writeFileSync(
  path.join(root, 'docs/reference/pre-migration-refactor-results-v1.md'),
  markdown,
);
console.log('[refactor-results] wrote docs/reference/pre-migration-refactor-results-v1.md');
```

- [ ] **Step 3: final metricsとresults文書を生成する**

```bash
node scripts/check-home-payload.mjs
node scripts/check-client-budgets.mjs
node scripts/write-refactor-results.mjs
sed -n '1,220p' docs/reference/pre-migration-refactor-results-v1.md
```

Expected: report内のAfter/Changeはbuildとnpm auditから生成された数値で、Home SVGは0、4routeはbudget以下。

- [ ] **Step 4: READMEとroadmapをcurrent状態へ更新する**

- README command表へ全主要gateを追加
- READMEデータ説明はlocal TS正本のまま維持
- roadmapのpre-migration phaseを完了としてresultsへlink
- docs dashboardから実行中pre-migration行を削除
- Payload migrationは未着手のcurrent planとして残す
- Payload migration planのprerequisite linkを、archive済みindexではなくresults文書へ更新する

- [ ] **Step 5: 完了planをarchiveへ移す**

```bash
git mv docs/plans/pre-migration-refactor-safety-design-v1.md docs/archive/
git mv docs/plans/pre-migration-refactor-implementation-index-v1.md docs/archive/
git mv docs/plans/refactor-phase-01-quality-gates-v1.md docs/archive/
git mv docs/plans/refactor-phase-02-dependency-security-v1.md docs/archive/
git mv docs/plans/refactor-phase-03-data-internals-v1.md docs/archive/
git mv docs/plans/refactor-phase-04-home-performance-v1.md docs/archive/
# Phase 5 は完了時にarchive済み（2026-08-02）
git mv docs/plans/refactor-phase-06-ui-accessibility-v1.md docs/archive/
git mv docs/plans/refactor-phase-07-security-cleanup-v1.md docs/archive/
```

archive後に相対linkを`npm run check:docs`で修正する。
archive内plan同士のlinkは同階層のまま維持し、archiveから`docs/plans/content-platform-migration-plan-v1.md`へのlinkだけ`../plans/`経由へ更新する。

- [ ] **Step 6: 最終gateとcommit**

```bash
npm run check
git diff --check
git add README.md docs scripts/write-refactor-results.mjs
git commit -m "docs: complete pre-migration refactor program"
```

---

## Phase completion

```bash
npm ci
npm run check
npm audit --omit=dev
git status -sb
git diff --check refactor/integration-20260726...HEAD
```

全結果を`pre-migration-refactor-results-v1.md`へ記録し、CSP enforceとCMS / DB移行は別programとして残す。
