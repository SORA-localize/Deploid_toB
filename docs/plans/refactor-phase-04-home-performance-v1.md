---
status: plan
updated: 2026-07-30
---

# Phase 4 Home Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Homeの約4.2MB HTMLとworld-map SVG 3重埋込みを解消し、同じメーカー・導入先情報を単一のkeyboard操作可能なmapで表示する。

**Architecture:** dotted-mapの背景SVGはdeterministicなbuild assetとして`public/generated/world-map.svg`へ1回だけ生成する。座標投影はserverで行い、clusteringとarc端点調整はpure functionへ分離する。client側は単一mapのactive pointだけを管理し、無限pan、複製DOM、常時`requestAnimationFrame`を廃止する。

**Tech Stack:** Next.js Server Components、React 19、dotted-map、TypeScript、Vitest、Playwright

## Global Constraints

- HomeのH1、subcopy、CTA、メーカーリンク、導入先表示を維持する。
- world-map SVGをHTML/RSCのdata URIへ埋め込まない。
- 同じpoint/arc/link DOMを複製しない。
- `unitree`、`agibot`等のslug固有分岐を追加しない。
- cluster ruleは入力順に依存しない。
- reduced motion時に連続animationを実行しない。
- Home raw HTMLは500,000 bytes未満をhard gateにする。
- 390pxと1440pxでdocument overflowを発生させない。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `scripts/generate-world-map-asset.mjs` | static SVGの生成・一致検査 |
| `scripts/check-home-payload.mjs` | build後HTML size/data URI gate |
| `public/generated/world-map.svg` | browser cache可能な背景asset |
| `lib/worldMap.ts` | point clustering、de-overlap、arc path |
| `lib/countryRegistry.ts` | country label / ISO alpha-3 |
| `tests/unit/world-map.test.ts` | cluster/order/geometry |
| `tests/unit/country-registry.test.ts` | country fallback |
| `tests/e2e/home-map.spec.ts` | keyboard/link/single map |

### 変更

| Path | Responsibility |
|---|---|
| `components/ManufacturerWorldMap.tsx` | projectionとserver view model |
| `components/ManufacturerMapStage.tsx` | 単一mapのactive state |
| `components/ManufacturerMapCopy.tsx` | 単一canvas、region辞書除去 |
| `src/app/globals.css` | 不要なpan animation/style削除 |
| `package.json` | asset生成とperformance gate |
| `docs/reference/refactor-baseline-2026-07-26.md` | after値 |

---

### Task 1: world-map SVGを静的asset化する

**Files:**
- Create: `scripts/generate-world-map-asset.mjs`
- Create: `public/generated/world-map.svg`
- Modify: `package.json`
- Test: `npm run check:world-map-asset`

**Interfaces:**
- Produces: `/generated/world-map.svg`
- Consumes: `dotted-map`

- [ ] **Step 1: generatorを追加する**

```js
// scripts/generate-world-map-asset.mjs
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import DottedMap from 'dotted-map';

const outputPath = path.join(process.cwd(), 'public/generated/world-map.svg');
const map = new DottedMap({ height: 100, grid: 'diagonal' });
const svg = `${map.getSVG({
  radius: 0.22,
  color: '#ffffff45',
  shape: 'circle',
  backgroundColor: 'transparent',
})}\n`;

if (process.argv.includes('--check')) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (current !== svg) {
    console.error('[world-map] generated asset is missing or stale');
    process.exitCode = 1;
  } else {
    console.log('[world-map] generated asset: OK');
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, svg);
  console.log(`[world-map] wrote ${path.relative(process.cwd(), outputPath)}`);
}
```

- [ ] **Step 2: scriptsを追加する**

```json
{
  "generate:world-map": "node scripts/generate-world-map-asset.mjs",
  "check:world-map-asset": "node scripts/generate-world-map-asset.mjs --check"
}
```

- [ ] **Step 3: missing assetでcheckが失敗することを確認する**

Run: `npm run check:world-map-asset`

Expected: `[world-map] generated asset is missing or stale`でFAIL。

- [ ] **Step 4: assetを生成して一致を確認する**

```bash
npm run generate:world-map
npm run check:world-map-asset
```

Expected: `public/generated/world-map.svg`が作られ、checkがexit 0。

- [ ] **Step 5: commit**

```bash
git add scripts/generate-world-map-asset.mjs public/generated/world-map.svg package.json
git commit -m "perf: generate cacheable world map asset"
```

---

### Task 2: geography ruleをpure moduleへ分離する

**Files:**
- Create: `lib/worldMap.ts`
- Create: `lib/countryRegistry.ts`
- Create: `tests/unit/world-map.test.ts`
- Create: `tests/unit/country-registry.test.ts`
- Modify: `components/ManufacturerWorldMap.tsx`
- Modify: `components/ManufacturerMapCopy.tsx`

**Interfaces:**
- Produces:
  - `clusterProjectedManufacturers(items, maxDistance): ProjectedManufacturer[][]`
  - `deOverlap(points, minDistance): Point[]`
  - `pushAway(points, fixed, minDistance): Point[]`
  - `createArcPath(start, end): string`
  - `getCountryDisplay(country): { name: string; alpha3: string }`

- [ ] **Step 1: cluster behavior testを書く**

```ts
// tests/unit/world-map.test.ts
import { describe, expect, it } from 'vitest';
import {
  HEADQUARTERS_CLUSTER_DISTANCE,
  clusterProjectedManufacturers,
  createArcPath,
} from '@/lib/worldMap';

const item = (slug: string, x: number, y: number) => ({
  slug,
  x,
  y,
});

describe('clusterProjectedManufacturers', () => {
  it('clusters nearby headquarters without slug-specific rules', () => {
    const clusters = clusterProjectedManufacturers(
      [
        item('unitree', 169.5, 41.5692),
        item('agibot', 171, 40.7032),
        item('distant', 120, 30),
      ],
      HEADQUARTERS_CLUSTER_DISTANCE,
    );
    expect(clusters.map((cluster) => cluster.map(({ slug }) => slug))).toEqual([
      ['agibot', 'unitree'],
      ['distant'],
    ]);
  });

  it('is independent of input order', () => {
    const input = [
      item('a', 10, 10),
      item('b', 11, 10),
      item('c', 12, 10),
    ];
    const forward = clusterProjectedManufacturers(input, 1.1);
    const reverse = clusterProjectedManufacturers([...input].reverse(), 1.1);
    expect(reverse).toEqual(forward);
  });

  it('creates a deterministic quadratic arc path', () => {
    expect(createArcPath({ x: 10, y: 20 }, { x: 30, y: 20 }))
      .toBe('M 10 20 Q 20 13 30 20');
  });
});
```

- [ ] **Step 2: country registry testを書く**

```ts
// tests/unit/country-registry.test.ts
import { describe, expect, it } from 'vitest';
import { getCountryDisplay } from '@/lib/countryRegistry';

describe('getCountryDisplay', () => {
  it('returns registered Japanese label and ISO code', () => {
    expect(getCountryDisplay('China')).toEqual({ name: '中国', alpha3: 'CHN' });
  });

  it('uses a deterministic fallback for an unknown country', () => {
    expect(getCountryDisplay('Brazil')).toEqual({ name: 'Brazil', alpha3: 'BRA' });
  });
});
```

- [ ] **Step 3: pure geometry moduleを作る**

```ts
// lib/worldMap.ts
export interface Point {
  x: number;
  y: number;
}

export interface ProjectedManufacturer extends Point {
  slug: string;
}

export const HEADQUARTERS_CLUSTER_DISTANCE = 1.8;
export const ARC_END_MIN_DISTANCE = 2.6;

export function clusterProjectedManufacturers<T extends ProjectedManufacturer>(
  items: readonly T[],
  maxDistance = HEADQUARTERS_CLUSTER_DISTANCE,
): T[][] {
  const sorted = [...items].sort((a, b) => a.slug.localeCompare(b.slug));
  const parent = sorted.map((_, index) => index);
  const find = (index: number): number =>
    parent[index] === index ? index : (parent[index] = find(parent[index]));
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  for (let left = 0; left < sorted.length; left += 1) {
    for (let right = left + 1; right < sorted.length; right += 1) {
      if (Math.hypot(sorted[left].x - sorted[right].x, sorted[left].y - sorted[right].y) <= maxDistance) {
        union(left, right);
      }
    }
  }
  const groups = new Map<number, T[]>();
  sorted.forEach((entry, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), entry]);
  });
  return [...groups.values()].sort((a, b) => a[0].slug.localeCompare(b[0].slug));
}

export function createArcPath(start: Point, end: Point) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const lift = Math.min(distance * 0.35, 26);
  const controlX = (start.x + end.x) / 2;
  const controlY = Math.min(start.y, end.y) - lift;
  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}
```

`deOverlap`と`pushAway`は現行関数をinput mutationしない形へ移す。先頭で`points.map(point => ({...point}))`を作り、そのcopyだけを動かして返す。

- [ ] **Step 4: country registryを作る**

```ts
// lib/countryRegistry.ts
const countries: Readonly<Record<string, { name: string; alpha3: string }>> = {
  USA: { name: '米国', alpha3: 'USA' },
  China: { name: '中国', alpha3: 'CHN' },
  Japan: { name: '日本', alpha3: 'JPN' },
  Germany: { name: 'ドイツ', alpha3: 'DEU' },
  Norway: { name: 'ノルウェー', alpha3: 'NOR' },
  Canada: { name: 'カナダ', alpha3: 'CAN' },
  Spain: { name: 'スペイン', alpha3: 'ESP' },
  France: { name: 'フランス', alpha3: 'FRA' },
  Israel: { name: 'イスラエル', alpha3: 'ISR' },
  Hungary: { name: 'ハンガリー', alpha3: 'HUN' },
};

export function getCountryDisplay(country: string) {
  return countries[country] ?? {
    name: country,
    alpha3: country.slice(0, 3).toUpperCase(),
  };
}
```

- [ ] **Step 5: server projectionをpure moduleへ接続する**

`ManufacturerWorldMap.tsx`から`CLUSTER_DIST`、`ARC_END_MIN`、`deOverlap`、`pushAway`、Unitree/Shanghai特例を削除する。projection後は次を使う。

```ts
const clusters = clusterProjectedManufacturers(
  projected.map((entry) => ({
    ...entry,
    slug: entry.input.slug,
  })),
);
```

各clusterの座標はmemberの平均を使う。member表示順は`slug.localeCompare`の結果を使い、特定メーカーを先頭にしない。背景はdata URIではなく固定pathを渡す。

```tsx
<ManufacturerMapStage
  mapAssetSrc="/generated/world-map.svg"
  points={points}
  heading={heading}
  subcopy={subcopy}
/>
```

- [ ] **Step 6: canvasをregistryへ接続する**

`ManufacturerMapCopy.tsx`の`REGION`と`region()`を削除し、`getCountryDisplay()`を使う。`arcPath()`は`createArcPath()`へ置換する。

- [ ] **Step 7: unit testとbuildを実行する**

```bash
npm run test -- tests/unit/world-map.test.ts tests/unit/country-registry.test.ts
npm run build
```

Expected: test PASS、build exit 0、sourceにslug固有cluster分岐が0件。

- [ ] **Step 8: commit**

```bash
git add lib/worldMap.ts lib/countryRegistry.ts tests/unit/world-map.test.ts tests/unit/country-registry.test.ts components/ManufacturerWorldMap.tsx components/ManufacturerMapCopy.tsx
git commit -m "refactor: generalize world map geography rules"
```

---

### Task 3: 複製mapと常時animationを単一canvasへ置換する

**Files:**
- Modify: `components/ManufacturerMapStage.tsx`
- Modify: `components/ManufacturerMapCopy.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/e2e/home-map.spec.ts`

**Interfaces:**
- Consumes: `mapAssetSrc: string`、`points: MapPoint[]`
- Produces: 単一の`[data-world-map-canvas]`、keyboardでactiveになるpoint link

- [ ] **Step 1: E2E contractを書く**

```ts
// tests/e2e/home-map.spec.ts
import { expect, test } from '@playwright/test';

test('home renders one cacheable world map', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-world-map-canvas]')).toHaveCount(1);
  await expect(page.locator('img[src="/generated/world-map.svg"]')).toHaveCount(1);
  await expect(page.locator('img[src^="data:image/svg+xml"]')).toHaveCount(0);
});

test('manufacturer points are keyboard reachable', async ({ page }) => {
  await page.goto('/');
  const point = page.locator('[data-world-map-point]').first();
  await point.focus();
  await expect(point).toBeFocused();
  await expect(page.locator('[data-world-map-detail]')).toBeVisible();
  await expect(point).toHaveAttribute('href', /\/manufacturers(?:\/|$)/);
});
```

- [ ] **Step 2: testが3 copiesまたは旧propで失敗することを確認する**

Run: `npm run build && npm run test:e2e -- tests/e2e/home-map.spec.ts`

Expected: single canvas selectorまたはstatic image assertionでFAIL。

- [ ] **Step 3: Stage propsとstateを縮小する**

`ManufacturerMapStageProps`:

```ts
interface ManufacturerMapStageProps {
  mapAssetSrc: string;
  points: MapPoint[];
  heading: string;
  subcopy: string;
}
```

保持するstateは`activeId`だけにする。削除対象:

- `copies`
- `panX`、`copyW`、`stageW`
- drag関連ref/event
- `interacting`、resume timer
- `rafId`、`lastSwitch`
- resize observer
- `requestAnimationFrame`
- auto active同期

`useReducedMotion()`のbooleanを`ManufacturerMapCopy`へ渡し、arc animation制御だけに使う。

- [ ] **Step 4: 単一canvasを描画する**

track/copies loopを次へ置換する。

```tsx
<div className="absolute inset-0 flex items-center justify-center overflow-hidden">
  <ManufacturerMapCopy
    mapAssetSrc={mapAssetSrc}
    points={points}
    activeId={activeId}
    reduceMotion={Boolean(prefersReducedMotion)}
    onActivate={setActiveId}
    onClear={() => setActiveId(null)}
  />
</div>
```

stage自体のcursor grab/active classとpointer drag handlerを削除する。CTA、見出し、detail cardのoverlayは維持する。

- [ ] **Step 5: canvas propsとsemantic markerを更新する**

`ManufacturerMapCopyProps`から`ariaHidden`と`onLinkClick`を削除し、`svgMap`を`mapAssetSrc`へ改名する。

```tsx
<div
  data-world-map-canvas
  className="relative h-full min-w-full aspect-[2/1] shrink-0"
>
  <img
    src={mapAssetSrc}
    alt=""
    aria-hidden="true"
    draggable={false}
    className="pointer-events-none h-full w-full object-fill opacity-90"
  />
```

各`Link`へ`data-world-map-point`を追加し、`tabIndex`の上書きを削除する。detail cardのrootへ`data-world-map-detail`を追加する。

- [ ] **Step 6: 不要CSSを削除する**

無限pan/drag/copy専用classがあれば削除する。`.manufacturer-card-enter`と`.manufacturer-arc-flow`は単一canvasでも使うため維持し、`@media (prefers-reduced-motion: reduce)`の停止規則を維持する。

- [ ] **Step 7: E2Eと全gateを実行する**

```bash
npm run build
npm run test:e2e -- tests/e2e/home-map.spec.ts tests/e2e/mobile-overflow.spec.ts
npm run check
```

Expected: single map、keyboard test、390px overflow、全gateがPASS。

- [ ] **Step 8: commit**

```bash
git add components/ManufacturerMapStage.tsx components/ManufacturerMapCopy.tsx src/app/globals.css tests/e2e/home-map.spec.ts
git commit -m "perf: render a single accessible world map"
```

---

### Task 4: Home payloadをhard gate化する

**Files:**
- Create: `scripts/check-home-payload.mjs`
- Modify: `package.json`
- Modify: `docs/reference/refactor-baseline-2026-07-26.md`

**Interfaces:**
- Consumes: `.next/server/app/index.html`
- Produces: `npm run check:home-payload`

- [ ] **Step 1: payload checkerを追加する**

```js
// scripts/check-home-payload.mjs
import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.join(process.cwd(), '.next/server/app/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const bytes = Buffer.byteLength(html);
const embeddedWorldMaps = (html.match(/data:image\/svg\+xml/g) ?? []).length;
const maxBytes = 500_000;

console.log(`[home-payload] html=${bytes} bytes, embedded-svg=${embeddedWorldMaps}`);

if (bytes >= maxBytes) {
  console.error(`[home-payload] expected HTML below ${maxBytes} bytes`);
  process.exitCode = 1;
}
if (embeddedWorldMaps !== 0) {
  console.error('[home-payload] expected zero embedded SVG data URIs');
  process.exitCode = 1;
}
```

- [ ] **Step 2: scriptsとcheck順を更新する**

```json
{
  "check:home-payload": "node scripts/check-home-payload.mjs",
  "check": "npm run validate:data && npm run check:data-boundaries && npm run check:world-map-asset && npm run typecheck && npm run lint && npm run test && npm run build && npm run check:home-payload && npm run test:e2e"
}
```

- [ ] **Step 3: performance gateを実行する**

```bash
npm run build
npm run check:home-payload
wc -c .next/server/app/index.html
```

Expected:

- HTML < 500,000 bytes
- embedded SVG data URI 0件
- static asset requestは`/generated/world-map.svg` 1件

- [ ] **Step 4: before/afterをbaseline文書へ追記する**

次の実測値を記録する。

```markdown
## Phase 4 after
- Home raw HTML bytes:
- Reduction:
- Embedded world-map SVG data URI occurrences: 0（before: 4）
- World map DOM copies: 1
- Continuous requestAnimationFrame loop: removed
```

- [ ] **Step 5: full gateとcommit**

```bash
npm run check
git add scripts/check-home-payload.mjs package.json docs/reference/refactor-baseline-2026-07-26.md
git commit -m "test: enforce home payload budget"
```

---

## Phase completion

```bash
npm run check
rg -n "unitreeCluster|shanghaiCluster|svgDataUri|requestAnimationFrame|setCopies" components lib
wc -c .next/server/app/index.html
```

Expected: forbidden実装0件、Home HTML < 500,000 bytes、single map E2E PASS。

---

## Follow-up（保留、Phase 4完了後に判明）

Phase 4完了・merge後、ユーザーから実機確認で次の指摘があった（2026-07-30）。

- **自動スクロール／ドラッグの削除は容量削減に必須ではなかった。** 4.2MB→326KBの主因はTask 1（SVGを3重inline data URIから単一static assetへ）であり、Task 3の「単一canvas化・複製DOM除去」は主にGlobal Constraint「同じpoint/arc/link DOMを複製しない」（アクセシビリティ・保守性目的）に基づく別軸の判断だった。よって、static asset化・単一DOM構造を維持したまま、何らかの形で連続的な動き（自動スクロールやドラッグ）を復活させることは技術的に可能。
- ユーザー意向: **動きは復活させたいが、Phase 5〜7がすべて完了してから着手する。** 旧実装（3コピーDOM + 手動pan/rAF）への回帰ではなく、単一canvas・単一DOM・static assetの制約を維持した新しい実装アプローチで再設計すること。
- 本Phase内では、見出し/CTA/detail cardがmap pointのz-indexより下に隠れる形での回帰（`z-[6]`のpointが`z-index:auto`のtext層より常に前面に出るCSS stacking挙動）が別途発見・修正済み（hotfixコミット、`refactor/04-home-performance`ブランチ）。この修正はアニメーション復活作業とは独立で、そのまま維持してよい。

次の一歩（Phase 7完了後）: 新規plan文書（`refactor-phase-08-home-map-motion-v1.md`等）を作成し、静的asset・単一DOM・アクセシビリティ制約を満たす形での動き復活を設計すること。
