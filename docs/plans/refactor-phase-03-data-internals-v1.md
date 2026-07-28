---
status: plan
updated: 2026-07-26
---

# Phase 3 Data Internals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `data/*.ts`を正本として維持しつつ、物理import、公開ポリシー、関連解決、validationの責務を分離し、将来の保存先変更を局所化する。

**Architecture:** すべてのlocal collectionを`LocalContentSnapshot`へ集約し、`lib/data.ts`は既存の同期APIを保つfacadeとして残す。validatorはsnapshotを引数に取るpure functionへ変え、common、collection、cross-collectionへ分割する。CMS、DB、async repositoryは作らない。

**Tech Stack:** TypeScript 6、Vitest、現行`data/*.ts`、Node.js scripts

## Global Constraints

- `data/*.ts`のrecord内容、配列順、型の意味を変更しない。
- `lib/data.ts`の既存export名と同期戻り値を維持する。
- `validateData()`と`runValidationInDev()`の公開APIを維持する。
- warning/errorの文言、順序、severityを意図なく変更しない。
- type-only importは許可し、collection value importだけをlocal snapshotへ集約する。
- Payload、Postgres、generic repository、DI containerを追加しない。
- `fs`を使う画像実測validationはserver/node限定のcommon validatorとして維持する。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `lib/data/localContentSnapshot.ts` | `data/*.ts` value importの唯一の集約点 |
| `lib/data/contentSnapshot.ts` | `ContentSnapshot`型 |
| `lib/validation/types.ts` | result、collector、validation context |
| `lib/validation/common.ts` | date、URL、重複、source、image、tag共通規則 |
| `lib/validation/registry.ts` | label/order/spec/tag registry整合 |
| `lib/validation/robots.ts` | robot collection規則 |
| `lib/validation/manufacturers.ts` | manufacturer collection規則 |
| `lib/validation/useCases.ts` | use-case/candidate evidence規則 |
| `lib/validation/articles.ts` | article/guide/placement規則 |
| `lib/validation/deployments.ts` | deployment規則 |
| `lib/validation/crossCollection.ts` | 参照、公開状態、previous slug横断規則 |
| `lib/validation/validateContentSnapshot.ts` | validator orchestrator |
| `scripts/check-data-import-boundaries.mjs` | value import allowlist検査 |
| `tests/unit/data/content-snapshot.test.ts` | local snapshot contract |
| `tests/unit/validation/validation-parity.test.ts` | 分割前後の結果維持 |
| `tests/unit/validation/reference-errors.test.ts` | fixtureで参照errorを検証 |
| `tests/unit/display/use-case-maturity-order.test.ts` | 表示順registry |

### 変更

| Path | Responsibility |
|---|---|
| `lib/data.ts` | local snapshotを読む既存facade |
| `lib/validate.ts` | compatibility facade |
| `lib/articlePlacements.ts` | placement値をsnapshotから取得 |
| `lib/display.ts` | maturity表示順を集約 |
| `components/UseCasesBrowser.tsx` | local `MATURITY_ORDER`を削除 |
| `scripts/validate-data.mjs` | compatibility facade利用継続 |
| `scripts/build-data-r01-manifest.mjs` | snapshot経由 |
| `scripts/build-data-r02-manifest.mjs` | snapshot経由 |
| `scripts/check-source-links.mjs` | snapshot経由 |
| `package.json` | boundary checkを品質ゲートへ追加 |

---

### Task 1: LocalContentSnapshot境界を作る

**Files:**
- Create: `lib/data/contentSnapshot.ts`
- Create: `lib/data/localContentSnapshot.ts`
- Create: `tests/unit/data/content-snapshot.test.ts`
- Modify: `lib/data.ts`
- Modify: `lib/articlePlacements.ts`

**Interfaces:**
- Produces: `ContentSnapshot`、`localContentSnapshot`
- Preserves: `lib/data.ts`の全export

- [ ] **Step 1: snapshot contract testを書く**

```ts
// tests/unit/data/content-snapshot.test.ts
import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';

describe('localContentSnapshot', () => {
  it('exposes every current collection without changing identity', () => {
    expect(localContentSnapshot.robots).toHaveLength(63);
    expect(localContentSnapshot.manufacturers).toHaveLength(26);
    expect(localContentSnapshot.articles).toHaveLength(34);
    expect(localContentSnapshot.useCases).toHaveLength(44);
    expect(localContentSnapshot.deployments).toHaveLength(11);
    expect(localContentSnapshot.articlePlacements.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: testがmodule未存在で失敗することを確認する**

Run: `npm run test -- tests/unit/data/content-snapshot.test.ts`

Expected: `Cannot find module '@/lib/data/localContentSnapshot'`でFAIL。

- [ ] **Step 3: snapshot型を作る**

```ts
// lib/data/contentSnapshot.ts
import type {
  Article,
  ArticlePlacement,
  ArticlePlacementSlot,
  DeploymentSite,
  Manufacturer,
  Robot,
  UseCase,
} from '@/data/types';

export interface ContentSnapshot {
  readonly robots: readonly Robot[];
  readonly manufacturers: readonly Manufacturer[];
  readonly articles: readonly Article[];
  readonly useCases: readonly UseCase[];
  readonly deployments: readonly DeploymentSite[];
  readonly articlePlacements: readonly ArticlePlacement[];
  readonly articleIndexPlacementLimits: Readonly<Record<ArticlePlacementSlot, number>>;
}
```

- [ ] **Step 4: value importの集約点を作る**

```ts
// lib/data/localContentSnapshot.ts
import {
  articleIndexPlacementLimits,
  articlePlacements,
} from '@/data/articlePlacements';
import { articles } from '@/data/articles';
import { deployments } from '@/data/deployments';
import { manufacturers } from '@/data/manufacturers';
import { robots } from '@/data/robots';
import { useCases } from '@/data/useCases';
import type { ContentSnapshot } from '@/lib/data/contentSnapshot';

export const localContentSnapshot = {
  robots,
  manufacturers,
  articles,
  useCases,
  deployments,
  articlePlacements,
  articleIndexPlacementLimits,
} as const satisfies ContentSnapshot;
```

- [ ] **Step 5:既存facadeをsnapshotへ切り替える**

`lib/data.ts`先頭のcollection importを削除し、次へ置換する。

```ts
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';

const {
  articles,
  deployments,
  manufacturers,
  robots,
  useCases,
} = localContentSnapshot;
```

`published`、`visibleInDetail`、slug resolver、既存exportの実装はこのtaskで変更しない。readonly入力を受けるためhelperだけ次へ変更する。

```ts
const published = <T extends { publishStatus: string }>(items: readonly T[]) =>
  items.filter((item) => item.publishStatus === 'published');

const visibleInDetail = <T extends { publishStatus: string }>(items: readonly T[]) =>
  items.filter(
    (item) => item.publishStatus === 'published' || item.publishStatus === 'archived',
  );

const resolveBySlug = <T extends { slug: string; previousSlugs?: string[] }>(
  records: readonly T[],
  slug: string,
): SlugResolution<T> => {
  const record = records.find((item) => item.slug === slug);
  if (record) return { record };
  const moved = records.find((item) => item.previousSlugs?.includes(slug));
  return moved ? { redirectTo: moved.slug } : {};
};
```

- [ ] **Step 6: placement resolverをsnapshotへ切り替える**

`lib/articlePlacements.ts`の`articlePlacements`と`articleIndexPlacementLimits` value importを削除し、次を使う。

```ts
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';

const {
  articlePlacements,
  articleIndexPlacementLimits,
} = localContentSnapshot;
```

Phase 5でplacementをserver view modelへ移す際に、このsnapshot参照自体をclient graphから外す。

- [ ] **Step 7: gateを実行する**

```bash
npm run validate:data
npm run test -- tests/unit/data/content-snapshot.test.ts
npm run build
```

Expected: すべてexit 0、157ページ維持。

- [ ] **Step 8: commit**

```bash
git add lib/data lib/data.ts lib/articlePlacements.ts tests/unit/data
git commit -m "refactor: centralize local content snapshot"
```

---

### Task 2: Validatorをsnapshot injection可能にする

**Files:**
- Create: `lib/validation/types.ts`
- Create: `lib/validation/validateContentSnapshot.ts`
- Create: `tests/unit/validation/validation-parity.test.ts`
- Modify: `lib/validate.ts`

**Interfaces:**
- Consumes: `ContentSnapshot`
- Produces: `validateContentSnapshot(snapshot): ValidationResult`
- Preserves: `validateData(): ValidationResult`

- [ ] **Step 1: parity testを書く**

```ts
// tests/unit/validation/validation-parity.test.ts
import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { validateData } from '@/lib/validate';
import { validateContentSnapshot } from '@/lib/validation/validateContentSnapshot';

describe('validation compatibility', () => {
  it('keeps the current result byte-for-byte', () => {
    expect(validateContentSnapshot(localContentSnapshot)).toEqual(validateData());
  });
});
```

- [ ] **Step 2: testがnew function未存在で失敗することを確認する**

Run: `npm run test -- tests/unit/validation/validation-parity.test.ts`

Expected: moduleまたはexport未存在でFAIL。

- [ ] **Step 3: validation typesを作る**

```ts
// lib/validation/types.ts
export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface ValidationCollector extends ValidationResult {
  error(message: string): void;
  warn(message: string): void;
}

export function createValidationCollector(): ValidationCollector {
  const errors: string[] = [];
  const warnings: string[] = [];
  return {
    errors,
    warnings,
    error: (message) => errors.push(message),
    warn: (message) => warnings.push(message),
  };
}
```

- [ ] **Step 4: monolithをsnapshot引数へ変える**

まず`lib/validate.ts`内の現行`validateData`本文を、同ファイル内の内部関数へ機械的に移す。

```ts
function validateSnapshotMonolith(snapshot: ContentSnapshot): ValidationResult {
  const {
    articlePlacements,
    articles,
    deployments,
    manufacturers,
    robots,
    useCases,
  } = snapshot;

  // 既存validateData本文を、上記配列を参照する形でそのまま置く。
}

export function validateData(): ValidationResult {
  return validateSnapshotMonolith(localContentSnapshot);
}
```

このstepでは規則の分割、文言変更、順序変更をしない。

- [ ] **Step 5: injectable entry pointを作る**

```ts
// lib/validation/validateContentSnapshot.ts
import type { ContentSnapshot } from '@/lib/data/contentSnapshot';
import type { ValidationResult } from '@/lib/validation/types';
import { validateSnapshotMonolith } from '@/lib/validate';

export function validateContentSnapshot(snapshot: ContentSnapshot): ValidationResult {
  return validateSnapshotMonolith(snapshot);
}
```

移行中だけ`validateSnapshotMonolith`を`lib/validate.ts`からexportする。Task 3完了時にこの逆依存を削除する。

- [ ] **Step 6: parityを確認する**

```bash
npm run test -- tests/unit/validation/validation-parity.test.ts
npm run validate:data
```

Expected: test PASS、CLI出力とerror/warning件数が変更前と一致。

- [ ] **Step 7: commit**

```bash
git add lib/validate.ts lib/validation/types.ts lib/validation/validateContentSnapshot.ts tests/unit/validation
git commit -m "refactor: inject content snapshot into validation"
```

---

### Task 3: 共通規則とcollection validatorを分割する

**Files:**
- Create: `lib/validation/common.ts`
- Create: `lib/validation/registry.ts`
- Create: `lib/validation/robots.ts`
- Create: `lib/validation/manufacturers.ts`
- Create: `lib/validation/useCases.ts`
- Create: `lib/validation/articles.ts`
- Create: `lib/validation/deployments.ts`
- Create: `lib/validation/crossCollection.ts`
- Modify: `lib/validation/validateContentSnapshot.ts`
- Modify: `lib/validate.ts`
- Create: `tests/unit/validation/reference-errors.test.ts`

**Interfaces:**
- Produces:
  - `validateRegistries(collector): void`
  - `validateRobots(snapshot, collector): void`
  - `validateManufacturers(snapshot, collector): void`
  - `validateUseCases(snapshot, collector): void`
  - `validateArticles(snapshot, collector): void`
  - `validateDeployments(snapshot, collector): void`
  - `validateCrossCollection(snapshot, collector): void`

- [ ] **Step 1: broken reference fixture testを書く**

```ts
// tests/unit/validation/reference-errors.test.ts
import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { validateContentSnapshot } from '@/lib/validation/validateContentSnapshot';

describe('cross collection validation', () => {
  it('rejects a missing deployment manufacturer', () => {
    const snapshot = structuredClone(localContentSnapshot);
    snapshot.deployments[0].manufacturerId = 'missing-manufacturer';

    expect(validateContentSnapshot(snapshot).errors).toContain(
      `[missing] deployment "${snapshot.deployments[0].id}".manufacturerId -> "missing-manufacturer" は存在しません`,
    );
  });
});
```

- [ ] **Step 2: common helperのsignatureを固定する**

`lib/validation/common.ts`は次をexportし、既存文言をそのまま移す。

```ts
export const FRESHNESS_DAYS = 180;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function checkReference(args: {
  collector: ValidationCollector;
  kind: string;
  owner: string;
  field: string;
  id: string;
  ids: ReadonlySet<string>;
}): void;

export function checkDisplayableReference(args: {
  collector: ValidationCollector;
  kind: string;
  owner: string;
  field: string;
  id: string;
  allIds: ReadonlySet<string>;
  displayableIds: ReadonlySet<string>;
  displayableStatus: string;
}): void;

export function checkUniqueValues(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  values: readonly string[],
): void;

export function checkDate(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  value: string | undefined,
): void;

export function checkUrl(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  value: string | undefined,
): void;
```

`checkRequiredSources`、`checkImageAsset`、`checkTags`、`checkFreshness`も同じ形式でcollectorを第1引数にする。`fs`/`path` importは`common.ts`だけに置く。

- [ ] **Step 3: 既存loopを責務別ファイルへ移す**

行動単位:

1. label/order/spec/tagの完全性check → `registry.ts`
2. `for (const r of robots)` → `robots.ts`
3. `for (const m of manufacturers)` → `manufacturers.ts`
4. `for (const u of useCases)`とcandidate evidence → `useCases.ts`
5. `for (const article of articles)`とplacements → `articles.ts`
6. `for (const d of deployments)` → `deployments.ts`
7. ID/slug/previousSlugs、visible ID set、双方向参照 → `crossCollection.ts`

各関数は`ContentSnapshot`全体と`ValidationCollector`を受け取り、結果をreturnせずcollectorへ既存順で追加する。規則の書き換えと新規error追加はしない。

- [ ] **Step 4: orchestratorを完成する**

```ts
// lib/validation/validateContentSnapshot.ts
import type { ContentSnapshot } from '@/lib/data/contentSnapshot';
import { validateArticles } from './articles';
import { validateCrossCollection } from './crossCollection';
import { validateDeployments } from './deployments';
import { validateManufacturers } from './manufacturers';
import { validateRegistries } from './registry';
import { validateRobots } from './robots';
import { createValidationCollector } from './types';
import { validateUseCases } from './useCases';

export function validateContentSnapshot(snapshot: ContentSnapshot) {
  const collector = createValidationCollector();
  validateRegistries(collector);
  validateCrossCollection(snapshot, collector);
  validateArticles(snapshot, collector);
  validateRobots(snapshot, collector);
  validateManufacturers(snapshot, collector);
  validateUseCases(snapshot, collector);
  validateDeployments(snapshot, collector);
  return { errors: collector.errors, warnings: collector.warnings };
}
```

実際の呼出順はTask 2 parity testを通すため、現行monolithの出力順と一致する順へ並べる。

- [ ] **Step 5: compatibility facadeを縮小する**

```ts
// lib/validate.ts
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { validateContentSnapshot } from '@/lib/validation/validateContentSnapshot';
export type { ValidationResult } from '@/lib/validation/types';

export function validateData() {
  return validateContentSnapshot(localContentSnapshot);
}

let didRun = false;
export function runValidationInDev(): void {
  if (didRun) return;
  didRun = true;
  if (process.env.NODE_ENV === 'production') return;
  const { errors, warnings } = validateData();
  const total =
    localContentSnapshot.robots.length +
    localContentSnapshot.manufacturers.length +
    localContentSnapshot.useCases.length +
    localContentSnapshot.articles.length;
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`[data] referential integrity: OK (${total} records)`);
    return;
  }
  if (warnings.length > 0) {
    console.warn(`[data] warnings (${warnings.length}):\n${warnings.map((item) => `  - ${item}`).join('\n')}`);
  }
  if (errors.length > 0) {
    console.error(`[data] errors (${errors.length}) — build はゲートで失敗します:\n${errors.map((item) => `  - ${item}`).join('\n')}`);
  }
}
```

- [ ] **Step 6: parityとfixtureを実行する**

```bash
npm run test -- tests/unit/validation
npm run validate:data
npm run build
```

Expected: 全test PASS、現行warning/error順を維持、build 157ページ。

- [ ] **Step 7: commit**

```bash
git add lib/validate.ts lib/validation tests/unit/validation
git commit -m "refactor: split content validation by responsibility"
```

---

### Task 4: collection value importをsnapshotへ集約する

**Files:**
- Create: `scripts/check-data-import-boundaries.mjs`
- Modify: `scripts/build-data-r01-manifest.mjs`
- Modify: `scripts/build-data-r02-manifest.mjs`
- Modify: `scripts/check-source-links.mjs`
- Modify: `package.json`
- Test: `npm run check:data-boundaries`

**Interfaces:**
- Produces: `npm run check:data-boundaries`
- Allows: `lib/data/localContentSnapshot.ts`だけがcollection valueをimport

- [ ] **Step 1: boundary checkerを作る**

```js
// scripts/check-data-import-boundaries.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowed = new Set(['lib/data/localContentSnapshot.ts']);
const roots = ['components', 'lib', 'scripts', 'src'];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs']);
const valueImport =
  /import\s+(?!type\b)[^;]*from\s+['"](?:@\/data\/|\.\.\/data\/|\.\.\/\.\.\/data\/)(articles|articlePlacements|deployments|manufacturers|robots|useCases)(?:\.ts)?['"]/g;

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(absolute);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

const violations = roots
  .flatMap((directory) => filesUnder(path.join(root, directory)))
  .flatMap((absolute) => {
    const relative = path.relative(root, absolute);
    if (allowed.has(relative)) return [];
    return valueImport.test(fs.readFileSync(absolute, 'utf8')) ? [relative] : [];
  });

if (violations.length > 0) {
  console.error(`Direct data value imports are not allowed:\n${violations.map((file) => `  - ${file}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('[data-boundaries] OK');
}
```

正規表現のglobal stateをファイルごとに持ち越さないよう、実装では各file判定前に`valueImport.lastIndex = 0`を設定する。

- [ ] **Step 2: testを先に失敗させる**

Run: `node scripts/check-data-import-boundaries.mjs`

Expected: manifest/link scripts等の直接value importを列挙してFAIL。

- [ ] **Step 3: scriptsをsnapshotへ切り替える**

各scriptのcollection importを削除し、必要な配列を次から分割代入する。

```js
import { localContentSnapshot } from '../lib/data/localContentSnapshot.ts';

const {
  articles,
  deployments,
  manufacturers,
  robots,
  useCases,
} = localContentSnapshot;
```

manifestの出力形式、source link checkのtimeout/status判定は変更しない。

- [ ] **Step 4: package scriptとcheck順を更新する**

```json
{
  "check:data-boundaries": "node scripts/check-data-import-boundaries.mjs",
  "check": "npm run validate:data && npm run check:data-boundaries && npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e"
}
```

- [ ] **Step 5: boundaryと全gateを実行する**

```bash
npm run check:data-boundaries
npm run check
```

Expected: value import違反0、全gate exit 0。

- [ ] **Step 6: commit**

```bash
git add scripts package.json lib/articlePlacements.ts
git commit -m "refactor: enforce local data import boundary"
```

---

### Task 5: Use case maturity表示順をdomain registryへ移す

**Files:**
- Modify: `lib/display.ts`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `lib/validation/registry.ts`
- Create: `tests/unit/display/use-case-maturity-order.test.ts`

**Interfaces:**
- Produces: `useCaseMaturityOrder: readonly UseCaseMaturity[]`
- Consumes: `maturityLabels`

- [ ] **Step 1: order completeness testを書く**

```ts
// tests/unit/display/use-case-maturity-order.test.ts
import { describe, expect, it } from 'vitest';
import { useCaseMaturityOrder } from '@/lib/display';
import { maturityLabels } from '@/lib/labels';

describe('useCaseMaturityOrder', () => {
  it('contains every maturity exactly once', () => {
    expect(new Set(useCaseMaturityOrder)).toEqual(new Set(Object.keys(maturityLabels)));
    expect(new Set(useCaseMaturityOrder).size).toBe(useCaseMaturityOrder.length);
  });
});
```

- [ ] **Step 2: exportを追加する**

```ts
// lib/display.ts
import type { UseCaseMaturity } from '@/data/types';

export const useCaseMaturityOrder: readonly UseCaseMaturity[] = [
  'production-ready',
  'pilot-phase',
  'early-stage',
];
```

- [ ] **Step 3: componentのlocal定数を削除する**

`components/UseCasesBrowser.tsx`の`MATURITY_ORDER`を削除し、importした`useCaseMaturityOrder`をgroup loopで使う。

```ts
import { sortUseCases, useCaseMaturityOrder } from '@/lib/display';

for (const level of useCaseMaturityOrder) {
  const items = sortUseCases(filtered.filter((useCase) => useCase.maturityLevel === level));
  if (items.length > 0) entries.push([level, items]);
}
```

entries型は`[UseCaseMaturity, UseCase[]][]`へ変更する。

- [ ] **Step 4: registry validationへ追加する**

`validateRegistries`内で既存`checkLabelOrderSync`を使い、`maturityLabels`と`useCaseMaturityOrder`を検証する。

- [ ] **Step 5: testと全gateを実行する**

```bash
npm run test -- tests/unit/display/use-case-maturity-order.test.ts tests/unit/validation
npm run check
```

Expected: exit 0、用途一覧のsection順が従来と一致。

- [ ] **Step 6: commit**

```bash
git add lib/display.ts lib/validation/registry.ts components/UseCasesBrowser.tsx tests/unit/display
git commit -m "refactor: centralize use case maturity order"
```

---

## Phase completion

```bash
npm run check:data-boundaries
npm run test -- tests/unit/validation tests/unit/data tests/unit/display
npm run check
rg -n "^import (?!type).*data/(articles|articlePlacements|deployments|manufacturers|robots|useCases)" \
  --pcre2 --glob '*.{ts,tsx,mjs,js}' components lib scripts src
```

Expected: 最後の検索結果は`lib/data/localContentSnapshot.ts`だけ。`lib/validate.ts`は100行未満のcompatibility facadeになる。
