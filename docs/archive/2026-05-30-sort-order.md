# Sort Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ロボット一覧・メーカー一覧にユーザー選択可能な並び替えを追加し、サイトの趣旨（「判断する」= 導入可否の意思決定支援）に即したデフォルト順序を実装する。

**Architecture:** URL パラメータ `sort=` で並び順を管理する（既存フィルターと同じ `useUrlFilters` パターン）。ソート関数は `lib/display.ts` に集約。UI は既存 `FilterSelect` を流用し、新コンポーネントを増やさない。

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, `useUrlFilters` (既存フック)

---

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `lib/display.ts` | 修正 | `deploymentStageOrder`, `japanPresenceOrder`, `RobotSortKey`, `ManufacturerSortKey`, `sortRobots()`, `sortManufacturers()` を追加 |
| `lib/uiText.ts` | 修正 | robots/manufacturers にソートラベルを追加 |
| `components/RobotsBrowser.tsx` | 修正 | `sort` パラメータ読み取り、`sortRobots()` 適用、静的「更新順」テキストを `FilterSelect` に置換 |
| `components/ManufacturersBrowser.tsx` | 修正 | `sort` パラメータ読み取り、`sortManufacturers()` 適用、ソート `FilterSelect` を追加 |

---

## 設計メモ（コードを書く前に読む）

**ロボットのソートキー (`RobotSortKey`)**

| 値 | ラベル | 第1キー | 第2キー |
|---|---|---|---|
| `'stage'` | 提供段階順（デフォルト） | `deploymentStage` (production 優先) | `japanAvailability` |
| `'japan'` | 国内入手性順 | `japanAvailability` (official-japan 優先) | `name` |
| `'name'` | 名前順 | `name` (アルファベット) | — |

**メーカーのソートキー (`ManufacturerSortKey`)**

| 値 | ラベル | 第1キー | 第2キー |
|---|---|---|---|
| `'japan'` | 日本体制順（デフォルト） | `japanPresence` (office 優先) | `name` |
| `'name'` | 名前順 | `name` (アルファベット) | — |
| `'founded'` | 設立年順 | `foundedYear` (古い順、未設定は末尾) | `name` |

**既存コードの注意点**
- `RobotsBrowser` の `releaseCandidates` useMemo 内で `b.updatedAt.localeCompare(a.updatedAt)` でソートしている → ここを `sortRobots()` に置き換える
- `ManufacturersBrowser` の `filtered` は `manufacturers.filter(...)` のみで、現状ソートなし → filter 後に `sortManufacturers()` を適用する
- `deploymentStageOrder` は `lib/display.ts` に `DeploymentStage[]` として追加する（`data/types.ts` に既存の型を使う）
- `JapanPresence` 型は `lib/display.ts` の import に未追加のため追加が必要

---

### Task 1: `lib/display.ts` にソート定数と関数を追加

**Files:**
- Modify: `lib/display.ts`

- [ ] **Step 1: import に `JapanPresence`, `Manufacturer`, `Robot` を追加し、ソート定数・型・関数を末尾に追記する**

```typescript
// lib/display.ts — ファイル全体を以下に置き換える

import type {
  CompanyStatus,
  CompanyType,
  DeploymentStage,
  GuideStage,
  JapanAvailability,
  JapanPresence,
  Manufacturer,
  ReportType,
  Robot,
  RobotCategory,
} from '@/data/types';

export const robotCategoryOrder: RobotCategory[] = [
  'humanoid',
  'general-purpose-robot',
  'upper-body-humanoid',
  'mobile-manipulator',
  'other',
];

export const japanAvailabilityOrder: JapanAvailability[] = [
  'official-japan',
  'distributor-japan',
  'inquiry-required',
  'import-only',
  'unavailable',
  'unknown',
];

export const deploymentStageOrder: DeploymentStage[] = [
  'production',
  'limited-production',
  'pilot',
  'concept',
  'prototype',
  'internal-use',
  'discontinued',
];

export const japanPresenceOrder: JapanPresence[] = [
  'office',
  'distributor',
  'partner',
  'remote',
  'none',
  'unknown',
];

export const companyTypeOrder: CompanyType[] = [
  'manufacturer',
  'distributor',
  'integrator',
  'ai-os',
  'research',
];

export const companyStatusOrder: CompanyStatus[] = [
  'active',
  'stealth',
  'acquired',
  'inactive',
];

export const manufacturerCountryOrder = [
  'Japan',
  'USA',
  'China',
  'Germany',
  'Canada',
  'Spain',
  'Norway',
] as const;

export const guideStageOrder: GuideStage[] = ['learn', 'evaluate', 'act'];

export const reportTypeOrder: ReportType[] = [
  'analysis',
  'deployment-report',
  'interview',
  'event-report',
  'policy-update',
  'case-study',
  'news-brief',
];

const preReleaseDeploymentStages: DeploymentStage[] = ['concept', 'prototype'];

export function isPreReleaseDeploymentStage(stage: DeploymentStage) {
  return preReleaseDeploymentStages.includes(stage);
}

export function sortByDisplayOrder<T extends string>(
  values: readonly T[],
  order: readonly string[],
) {
  const orderIndex = new Map(order.map((value, index) => [value, index]));

  return [...values].sort((a, b) => {
    const aIndex = orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b, 'ja');
  });
}

// ─── ロボット並び替え ────────────────────────────────────────────

export type RobotSortKey = 'stage' | 'japan' | 'name';

export function sortRobots(robots: Robot[], sort: RobotSortKey): Robot[] {
  const stageIndex = new Map(deploymentStageOrder.map((s, i) => [s, i]));
  const availIndex = new Map(japanAvailabilityOrder.map((s, i) => [s, i]));

  return [...robots].sort((a, b) => {
    if (sort === 'stage') {
      const stageDiff =
        (stageIndex.get(a.deploymentStage) ?? 99) -
        (stageIndex.get(b.deploymentStage) ?? 99);
      if (stageDiff !== 0) return stageDiff;
      const availDiff =
        (availIndex.get(a.japanAvailability) ?? 99) -
        (availIndex.get(b.japanAvailability) ?? 99);
      if (availDiff !== 0) return availDiff;
      return a.name.localeCompare(b.name, 'en');
    }
    if (sort === 'japan') {
      const availDiff =
        (availIndex.get(a.japanAvailability) ?? 99) -
        (availIndex.get(b.japanAvailability) ?? 99);
      if (availDiff !== 0) return availDiff;
      return a.name.localeCompare(b.name, 'en');
    }
    // 'name'
    return a.name.localeCompare(b.name, 'en');
  });
}

// ─── メーカー並び替え ────────────────────────────────────────────

export type ManufacturerSortKey = 'japan' | 'name' | 'founded';

export function sortManufacturers(
  manufacturers: Manufacturer[],
  sort: ManufacturerSortKey,
): Manufacturer[] {
  const presenceIndex = new Map(japanPresenceOrder.map((s, i) => [s, i]));

  return [...manufacturers].sort((a, b) => {
    if (sort === 'japan') {
      const presenceDiff =
        (presenceIndex.get(a.japanPresence) ?? 99) -
        (presenceIndex.get(b.japanPresence) ?? 99);
      if (presenceDiff !== 0) return presenceDiff;
      return a.name.localeCompare(b.name, 'en');
    }
    if (sort === 'founded') {
      const aYear = a.foundedYear ?? 9999;
      const bYear = b.foundedYear ?? 9999;
      if (aYear !== bYear) return aYear - bYear;
      return a.name.localeCompare(b.name, 'en');
    }
    // 'name'
    return a.name.localeCompare(b.name, 'en');
  });
}
```

- [ ] **Step 2: ビルドを通す**

```bash
npm run build
```

Expected: `✓ Compiled successfully`（型エラーがなければOK）

- [ ] **Step 3: コミット**

```bash
git add lib/display.ts
git commit -m "feat(display): add sort constants and sortRobots/sortManufacturers functions"
```

---

### Task 2: `lib/uiText.ts` にソートラベルを追加

**Files:**
- Modify: `lib/uiText.ts`

- [ ] **Step 1: `robots` キーと `manufacturers` キーにソートラベルを追記する**

`lib/uiText.ts` の `robots` ブロック（現在 `sortByLatestRelease: '更新順'` がある）を以下に置き換える:

```typescript
  robots: {
    breadcrumb: 'ロボット',
    title: 'ロボット一覧',
    activeModels: (count: number) => `${count}件の公開・実証機`,
    preReleaseModels: (count: number) => `${count}件の構想・試作機`,
    sortLabel: '並び順',
    sortStage: '提供段階順',
    sortJapan: '国内入手性順',
    sortName: '名前順',
    mainImageMissing: 'メイン画像なし',
    specifications: '仕様',
    technicalSpecifications: '技術仕様',
    decision: '導入判断',
    applications: '用途メモ',
  },
```

`manufacturers` ブロック（現在 `models` で終わっている）に3行追加:

```typescript
  manufacturers: {
    breadcrumb: 'メーカー',
    title: 'メーカー一覧',
    profile: 'メーカープロフィール',
    factSheet: '基本情報',
    models: (count: number) => `${count}件の取扱機種`,
    sortLabel: '並び順',
    sortJapan: '日本体制順',
    sortName: '名前順',
    sortFounded: '設立年順',
  },
```

- [ ] **Step 2: ビルドを通す**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: コミット**

```bash
git add lib/uiText.ts
git commit -m "feat(uiText): add sort labels for robots and manufacturers"
```

---

### Task 3: `RobotsBrowser.tsx` にソートUIとロジックを追加

**Files:**
- Modify: `components/RobotsBrowser.tsx`

現状の問題:
- `releaseCandidates` が `b.updatedAt.localeCompare(a.updatedAt)` でソートされている（ハードコード）
- 右下の「更新順」は静的テキストで選択不可

- [ ] **Step 1: import に `RobotSortKey`, `sortRobots`, `deploymentStageOrder` を追加し、ファイル全体を以下に置き換える**

```typescript
'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { FilterSelect } from '@/components/FilterSelect';
import { RobotCard } from '@/components/RobotCard';
import { SearchInput } from '@/components/SearchInput';
import type { JapanAvailability, Manufacturer, Robot, RobotCategory } from '@/data/types';
import {
  isPreReleaseDeploymentStage,
  japanAvailabilityOrder,
  robotCategoryOrder,
  sortByDisplayOrder,
  sortRobots,
  type RobotSortKey,
} from '@/lib/display';
import { japanAvailabilityLabels, robotCategoryLabels } from '@/lib/labels';
import { createRobotSearchDocument, matchesSearchDocument } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface RobotsBrowserProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

export function RobotsBrowser({ robots, manufacturers }: RobotsBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();

  const manufacturerBySlug = useMemo(
    () => new Map(manufacturers.map((manufacturer) => [manufacturer.slug, manufacturer])),
    [manufacturers],
  );
  const searchDocuments = useMemo(
    () =>
      new Map(
        robots.map((robot) => [
          robot.slug,
          createRobotSearchDocument(robot, manufacturerBySlug.get(robot.manufacturerSlug)),
        ]),
      ),
    [robots, manufacturerBySlug],
  );
  const manufacturerFor = (slug: string) => manufacturerBySlug.get(slug);

  const types = useMemo(
    () => sortByDisplayOrder(Array.from(new Set(robots.map((r) => r.category))), robotCategoryOrder),
    [robots],
  );
  const avails = useMemo(
    () =>
      sortByDisplayOrder(
        Array.from(new Set(robots.map((r) => r.japanAvailability))),
        japanAvailabilityOrder,
      ),
    [robots],
  );

  const typeParam = getParam('type');
  const type =
    typeParam && types.includes(typeParam as RobotCategory) ? typeParam as RobotCategory : 'all';
  const manufacturerParam = getParam('manufacturer');
  const mfg = manufacturerParam && manufacturerBySlug.has(manufacturerParam) ? manufacturerParam : 'all';
  const availabilityParam = getParam('availability');
  const avail =
    availabilityParam && avails.includes(availabilityParam as JapanAvailability)
      ? availabilityParam as JapanAvailability
      : 'all';
  const release = getParam('release') === 'pre' ? 'pre' : 'active';
  const query = getParam('q') ?? '';
  const sortParam = getParam('sort');
  const sort: RobotSortKey =
    sortParam === 'japan' || sortParam === 'name' ? sortParam : 'stage';

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTypes },
      ...types.map((value) => ({ value, label: robotCategoryLabels[value] })),
    ],
    [types],
  );
  const manufacturerOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allManufacturers },
      ...[...manufacturers]
        .sort((a, b) => a.name.localeCompare(b.name, 'en'))
        .map((manufacturer) => ({
          value: manufacturer.slug,
          label: manufacturer.name,
        })),
    ],
    [manufacturers],
  );
  const availabilityOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allStatus },
      ...avails.map((value) => ({ value, label: japanAvailabilityLabels[value] })),
    ],
    [avails],
  );
  const sortOptions: Array<{ value: RobotSortKey; label: string }> = [
    { value: 'stage', label: uiText.robots.sortStage },
    { value: 'japan', label: uiText.robots.sortJapan },
    { value: 'name',  label: uiText.robots.sortName },
  ];

  const releaseCandidates = useMemo(() => {
    const filtered = robots.filter((r) => {
      const typeOk = type === 'all' || r.category === type;
      const mfgOk = mfg === 'all' || r.manufacturerSlug === mfg;
      const availOk = avail === 'all' || r.japanAvailability === avail;
      const queryOk = matchesSearchDocument(query, searchDocuments.get(r.slug));
      return typeOk && mfgOk && availOk && queryOk;
    });
    return sortRobots(filtered, sort);
  }, [robots, type, mfg, avail, query, sort, searchDocuments]);

  const activeRobots = useMemo(
    () => releaseCandidates.filter((robot) => !isPreReleaseDeploymentStage(robot.deploymentStage)),
    [releaseCandidates],
  );
  const preReleaseRobots = useMemo(
    () => releaseCandidates.filter((robot) => isPreReleaseDeploymentStage(robot.deploymentStage)),
    [releaseCandidates],
  );
  const filtered = release === 'active' ? activeRobots : preReleaseRobots;
  const releaseOptions: Array<{ value: 'active' | 'pre'; label: string }> = [
    { value: 'active', label: uiText.robots.activeModels(activeRobots.length) },
    { value: 'pre', label: uiText.robots.preReleaseModels(preReleaseRobots.length) },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs items={[{ label: uiText.robots.breadcrumb }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{uiText.robots.title}</h1>
          <p className="text-sm text-neutral-600 max-w-3xl">
            導入判断に必要なヒューマノイド機種のカタログ。メーカー、国内入手性、提供段階で絞り込み、現場に合う候補を探せます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder="機種名・メーカー・用途キーワードで検索"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
          <FilterSelect
            id="robot-type"
            label={uiText.filters.robotType}
            value={type}
            onChange={(nextType) => updateParams({ type: nextType === 'all' ? null : nextType })}
            options={typeOptions}
          />
          <FilterSelect
            id="robot-manufacturer"
            label={uiText.filters.manufacturer}
            value={mfg}
            onChange={(nextMfg) =>
              updateParams({ manufacturer: nextMfg === 'all' ? null : nextMfg })
            }
            options={manufacturerOptions}
          />
          <FilterSelect
            id="robot-availability"
            label={uiText.filters.availability}
            value={avail}
            onChange={(nextAvail) =>
              updateParams({ availability: nextAvail === 'all' ? null : nextAvail })
            }
            options={availabilityOptions}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <FilterChipGroup
            options={releaseOptions}
            value={release}
            onChange={(nextRelease) =>
              updateParams({ release: nextRelease === 'active' ? null : nextRelease })
            }
            ariaLabel={uiText.filters.releaseStatus}
            buttonClassName="px-3 py-1.5 text-xs"
          />
          <FilterSelect
            id="robot-sort"
            label={uiText.robots.sortLabel}
            value={sort}
            onChange={(nextSort) =>
              updateParams({ sort: nextSort === 'stage' ? null : nextSort })
            }
            options={sortOptions}
            className="w-40"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            message="条件に合う機種がありません。フィルタを調整してください。"
            variant="muted"
            size="large"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((robot) => {
              const manufacturer = manufacturerFor(robot.manufacturerSlug);
              return (
                <RobotCard
                  key={robot.slug}
                  robot={robot}
                  manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                  manufacturerLogo={manufacturer?.logo}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ビルドを通す**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: コミット**

```bash
git add components/RobotsBrowser.tsx
git commit -m "feat(robots): add sort selector — stage / japan / name"
```

---

### Task 4: `ManufacturersBrowser.tsx` にソートUIとロジックを追加

**Files:**
- Modify: `components/ManufacturersBrowser.tsx`

現状の問題:
- `filtered` は `manufacturers.filter(...)` のみで、ソートなし（データ挿入順）

- [ ] **Step 1: import に `ManufacturerSortKey`, `sortManufacturers` を追加し、ファイル全体を以下に置き換える**

```typescript
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterSelect } from '@/components/FilterSelect';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { SearchInput } from '@/components/SearchInput';
import { TagChip } from '@/components/TagChip';
import type { CompanyStatus, CompanyType, Manufacturer, Robot } from '@/data/types';
import {
  companyStatusOrder,
  companyTypeOrder,
  manufacturerCountryOrder,
  sortByDisplayOrder,
  sortManufacturers,
  type ManufacturerSortKey,
} from '@/lib/display';
import { companyStatusLabels, companyTypeLabels, japanPresenceLabels, TBD_LABEL } from '@/lib/labels';
import { createManufacturerSearchDocument, matchesSearchDocument } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface ManufacturersBrowserProps {
  manufacturers: Manufacturer[];
  robots: Robot[];
}

export function ManufacturersBrowser({ manufacturers, robots }: ManufacturersBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();

  const robotsByManufacturer = useMemo(() => {
    const byManufacturer = new Map<string, Robot[]>();
    robots.forEach((robot) => {
      const existing = byManufacturer.get(robot.manufacturerSlug) ?? [];
      existing.push(robot);
      byManufacturer.set(robot.manufacturerSlug, existing);
    });
    return byManufacturer;
  }, [robots]);

  const searchDocuments = useMemo(
    () =>
      new Map(
        manufacturers.map((manufacturer) => [
          manufacturer.slug,
          createManufacturerSearchDocument(
            manufacturer,
            robotsByManufacturer.get(manufacturer.slug) ?? [],
          ),
        ]),
      ),
    [manufacturers, robotsByManufacturer],
  );

  const countries = useMemo(
    () =>
      sortByDisplayOrder(
        Array.from(new Set(manufacturers.map((m) => m.country))),
        manufacturerCountryOrder,
      ),
    [manufacturers],
  );
  const types = useMemo(
    () =>
      sortByDisplayOrder(
        Array.from(new Set(manufacturers.map((m) => m.companyType))),
        companyTypeOrder,
      ),
    [manufacturers],
  );
  const statuses = useMemo(
    () =>
      sortByDisplayOrder(
        Array.from(new Set(manufacturers.map((m) => m.companyStatus))),
        companyStatusOrder,
      ),
    [manufacturers],
  );

  const countryParam = getParam('country');
  const country = countryParam && countries.includes(countryParam) ? countryParam : 'all';
  const typeParam = getParam('type');
  const type =
    typeParam && types.includes(typeParam as CompanyType) ? typeParam as CompanyType : 'all';
  const statusParam = getParam('status');
  const status =
    statusParam && statuses.includes(statusParam as CompanyStatus)
      ? statusParam as CompanyStatus
      : 'all';
  const query = getParam('q') ?? '';
  const sortParam = getParam('sort');
  const sort: ManufacturerSortKey =
    sortParam === 'name' || sortParam === 'founded' ? sortParam : 'japan';

  const countryOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allRegions },
      ...countries.map((value) => ({ value, label: value })),
    ],
    [countries],
  );
  const typeOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTypes },
      ...types.map((value) => ({ value, label: companyTypeLabels[value] })),
    ],
    [types],
  );
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allStatus },
      ...statuses.map((value) => ({ value, label: companyStatusLabels[value] })),
    ],
    [statuses],
  );
  const sortOptions: Array<{ value: ManufacturerSortKey; label: string }> = [
    { value: 'japan',   label: uiText.manufacturers.sortJapan },
    { value: 'name',    label: uiText.manufacturers.sortName },
    { value: 'founded', label: uiText.manufacturers.sortFounded },
  ];

  const robotCount = (slug: string) => robotsByManufacturer.get(slug)?.length ?? 0;

  const filtered = useMemo(() => {
    const base = manufacturers.filter(
      (m) =>
        (country === 'all' || m.country === country) &&
        (type === 'all' || m.companyType === type) &&
        (status === 'all' || m.companyStatus === status) &&
        matchesSearchDocument(query, searchDocuments.get(m.slug)),
    );
    return sortManufacturers(base, sort);
  }, [manufacturers, country, type, status, query, sort, searchDocuments]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs items={[{ label: uiText.manufacturers.breadcrumb }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            {uiText.manufacturers.title}
          </h1>
          <p className="text-sm text-neutral-600 max-w-3xl">
            ヒューマノイドの開発企業・代理店のディレクトリ。国・区分・ステータスで絞り込み、日本での供給体制を確認できます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder="メーカー名・地域・取扱機種で検索"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
          <FilterSelect
            id="manufacturer-country"
            label={uiText.filters.country}
            value={country}
            onChange={(nextCountry) =>
              updateParams({ country: nextCountry === 'all' ? null : nextCountry })
            }
            options={countryOptions}
          />
          <FilterSelect
            id="manufacturer-type"
            label={uiText.filters.companyType}
            value={type}
            onChange={(nextType) => updateParams({ type: nextType === 'all' ? null : nextType })}
            options={typeOptions}
          />
          <FilterSelect
            id="manufacturer-status"
            label={uiText.filters.status}
            value={status}
            onChange={(nextStatus) =>
              updateParams({ status: nextStatus === 'all' ? null : nextStatus })
            }
            options={statusOptions}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-neutral-500">
            {uiText.common.results(filtered.length, country !== 'all' || type !== 'all' || status !== 'all' || query !== '')}
          </p>
          <FilterSelect
            id="manufacturer-sort"
            label={uiText.manufacturers.sortLabel}
            value={sort}
            onChange={(nextSort) =>
              updateParams({ sort: nextSort === 'japan' ? null : nextSort })
            }
            options={sortOptions}
            className="w-40"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="条件に合うメーカーがありません。" variant="muted" size="large" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((manufacturer) => (
              <div
                key={manufacturer.slug}
                className="border border-neutral-300 bg-neutral-50 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="min-w-0 text-xl font-semibold text-neutral-900">
                      <ManufacturerLogoName
                        name={manufacturer.name.toUpperCase()}
                        logo={manufacturer.logo}
                        frameClassName="h-7 w-7"
                        imageClassName="h-5 w-5"
                      />
                    </h2>
                    <TagChip className="py-1 border-neutral-400 whitespace-nowrap">
                      {companyTypeLabels[manufacturer.companyType]}
                    </TagChip>
                  </div>

                  <div className="space-y-2 text-xs mb-6">
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">所在地</span>
                      <span className="text-neutral-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {manufacturer.hqCity
                          ? `${manufacturer.hqCity}, ${manufacturer.country}`
                          : manufacturer.country}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">取扱機種</span>
                      <span className="text-neutral-900">{robotCount(manufacturer.slug)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">日本での体制</span>
                      <span className="text-neutral-900">
                        {japanPresenceLabels[manufacturer.japanPresence]}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-neutral-500">設立</span>
                      <span className="text-neutral-900">
                        {manufacturer.foundedYear ?? TBD_LABEL}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/manufacturers/${manufacturer.slug}`}
                    className="flex items-center justify-between w-full px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors text-xs text-neutral-900"
                  >
                    <span>{uiText.common.viewProfile}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ビルドを通す**

```bash
npm run build
```

Expected: `✓ Compiled successfully`。`/robots` と `/manufacturers` のSSGページが全件生成されること。

- [ ] **Step 3: コミット・プッシュ**

```bash
git add components/ManufacturersBrowser.tsx
git commit -m "feat(manufacturers): add sort selector — japan / name / founded"
git push origin main
```

---

## セルフレビュー

### 1. Spec coverage
- [x] ロボット: stage/japan/name の3択 → Task 3
- [x] メーカー: japan/name/founded の3択 → Task 4
- [x] デフォルトが URL にパラメータを残さない（`sort=stage` / `sort=japan` はデフォルト値につき null を渡す） → Task 3/4
- [x] ソート定数の SSOT は `lib/display.ts` → Task 1
- [x] 新コンポーネント不要（既存 `FilterSelect` を流用） → Task 3/4

### 2. Placeholder scan
なし。全 Step に実際のコードを記載。

### 3. Type consistency
- `RobotSortKey` = `'stage' | 'japan' | 'name'` — Task 1 で定義、Task 3 で使用 ✓
- `ManufacturerSortKey` = `'japan' | 'name' | 'founded'` — Task 1 で定義、Task 4 で使用 ✓
- `sortRobots(robots: Robot[], sort: RobotSortKey)` — Task 1 で定義、Task 3 で使用 ✓
- `sortManufacturers(manufacturers: Manufacturer[], sort: ManufacturerSortKey)` — Task 1 で定義、Task 4 で使用 ✓
