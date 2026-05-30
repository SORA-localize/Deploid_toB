# フィルタ・タグ再設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 非技術者（人事・調達・行政担当者）が使えるロボット一覧フィルタへ再設計する。業種・タスクタグをRobotに追加し、カテゴリフィルタを廃止、並び替えUIを削除して固定順序にし、ラベルを平易な日本語に統一する。

**Architecture:** 既存の `lib/tagRegistry.ts` + `lib/tags.ts` のタグシステムをそのまま拡張する（新コレクション不要）。`Robot` 型に `industryTags?: string[]` / `taskTags?: string[]` を追加し、`UseCase` と同じ構造で揃える。ソートはクライアント側で `sortRobots(filtered, 'stage')` を固定呼び出しし、UIからはソート選択を除去する。

**Tech Stack:** Next.js App Router, TypeScript, `lib/tagRegistry.ts`（タグ登録）, `lib/tags.ts`（タグ集計）, `lib/labels.ts`（enumラベル）, `lib/uiText.ts`（UIコピー）

**原則チェックリスト（実装者必読）**
- **DRY**: `toTagOptions()` は既存を再利用。新規ヘルパーは2関数のみ。
- **SSOT**: タグのラベルは `tagRegistry.ts` のみ。`labels.ts` は enum型のみ。`uiText.ts` はUIコピーのみ。
- **Type Safety**: `industryTags`/`taskTags` は `string[]`（tagRegistryに登録されたkeyのみを入れる運用）。
- **SoC**: フィルタロジック（純粋関数）とUIレンダリングは引き続き混在するが、本計画ではそれ以上の分離は行わない（Phase 4 refactorの対象）。
- **URL State**: 業種・タスクフィルタはURLパラメータ `industry` / `task` に載せ共有可能にする。
- **Responsive**: フィルタグリッドを `sm:grid-cols-2 xl:grid-cols-4` で4軸を収める。
- **Accessibility**: 既存 `FilterSelect` / `FilterChipGroup` のARIA実装をそのまま使う。

---

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `lib/tagRegistry.ts` | 修正 | industry/task タグ6件+8件追加 |
| `lib/labels.ts` | 修正 | deploymentStage / japanAvailability ラベルを平易化 |
| `lib/uiText.ts` | 修正 | sort関連削除、chip group文言更新、filterラベル追加 |
| `data/types.ts` | 修正 | Robot に `industryTags?: string[]` / `taskTags?: string[]` 追加 |
| `data/robots.ts` | 修正 | 26機種にタグ付け（industryTags + taskTags） |
| `lib/tags.ts` | 修正 | `getRobotIndustryTagOptions()` / `getRobotTaskTagOptions()` 追加 |
| `components/RobotsBrowser.tsx` | 修正 | category→industry/taskに差し替え、sort削除、固定sort適用 |
| `components/ManufacturersBrowser.tsx` | 修正 | sort UI削除、固定 `sortManufacturers(base,'japan')` 適用 |

---

## 設計メモ（コードを書く前に読む）

**タグ登録の命名規則**
- `value` はkebab-case英語（例: `healthcare-care`）。これがURLパラメータに入る。
- `label` は平易な日本語。非技術者が見てわかるもの。
- 既存エントリは削除しない（UseCaseデータが使用中の可能性）。

**「調査中」の扱い**
- `industryTags: []` / `taskTags: []`（空配列）= タグ未設定。業種・タスクフィルタでは「すべて」以外で非表示になる。これが「調査中」状態。
- 特別な `under-investigation` タグは設けない。

**固定ソート順（ロボット）**
`sortRobots(filtered, 'stage')` → deploymentStageOrder（production > limited-production > pilot > concept > prototype > internal-use > discontinued）の優先、次点で japanAvailability、最後に名前順。

**固定ソート順（メーカー）**
`sortManufacturers(base, 'japan')` → japanPresenceOrder（office > distributor > partner > remote > none > unknown）の優先、次点で名前順。

**フィルタUXの変化**
```
Before（ロボット）:
  Row1: [ロボット分類] [メーカー] [国内入手性]
  Row2: [公開・実証機 / 構想・試作機]  [並び順▼]

After（ロボット）:
  Row1: [業種] [タスク] [メーカー] [国内入手性]   ← sm:2col, xl:4col
  Row2: [商用・実証機 / 開発中・将来機種]
```

---

### Task 1: `lib/tagRegistry.ts` に新しい業種・タスクタグを追加

**Files:**
- Modify: `lib/tagRegistry.ts`

**現在の TagKind:**
```typescript
export type TagKind = 'report' | 'guide-topic' | 'industry' | 'task';
```
TagKindの変更は不要。

- [ ] **Step 1: 新しい industry / task エントリを追記する**

`lib/tagRegistry.ts` の `tagRegistry` 配列の末尾（`] as const satisfies...` の直前）に以下を追加:

```typescript
  // ─── industry: 新規追加 ─────────────────────────────────────────
  { kind: 'industry', value: 'healthcare-care',             label: '医療・介護' },
  { kind: 'industry', value: 'hospitality',                 label: 'ホテル・接客' },
  { kind: 'industry', value: 'retail',                      label: '小売・店舗' },
  { kind: 'industry', value: 'construction-infrastructure', label: '建設・インフラ' },
  { kind: 'industry', value: 'agriculture',                 label: '農業・食品生産' },
  { kind: 'industry', value: 'public-sector',               label: '公共・行政' },

  // ─── task: 新規追加 ─────────────────────────────────────────────
  { kind: 'task', value: 'assembly',           label: '組立・取付' },
  { kind: 'task', value: 'quality-inspection', label: '品質検査' },
  { kind: 'task', value: 'cleaning',           label: '清掃・衛生管理' },
  { kind: 'task', value: 'physical-assistance',label: '身体介助' },
  { kind: 'task', value: 'shelf-stocking',     label: '棚補充' },
  { kind: 'task', value: 'customer-service',   label: '接客・案内' },
  { kind: 'task', value: 'agricultural-work',  label: '農作業' },
  { kind: 'task', value: 'disaster-response',  label: '災害対応' },
```

- [ ] **Step 2: ビルドを通す**

```bash
cd /Users/hori/Desktop/Humanoid_curation_website/Deploid_toB && npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: コミット**

```bash
git add lib/tagRegistry.ts
git commit -m "feat(tagRegistry): add industry and task tags for humanoid robot use cases"
```

---

### Task 2: `lib/labels.ts` のラベルを平易化

**Files:**
- Modify: `lib/labels.ts`

対象: `deploymentStageLabels`（`PoC / 実証` など技術用語）と `japanAvailabilityLabels`（`日本正式展開` など曖昧表現）。他のラベルは変更しない。

- [ ] **Step 1: deploymentStageLabels を置き換える**

`lib/labels.ts:50-58` の `deploymentStageLabels` を以下に置き換える:

```typescript
export const deploymentStageLabels: Record<DeploymentStage, string> = {
  concept:            '構想段階',
  prototype:          '試作段階',
  pilot:              '実証展開中',
  'limited-production': '限定販売中',
  production:         '量産・商用化',
  'internal-use':     '自社利用のみ',
  discontinued:       '生産終了',
};
```

- [ ] **Step 2: japanAvailabilityLabels を置き換える**

`lib/labels.ts:68-75` の `japanAvailabilityLabels` を以下に置き換える:

```typescript
export const japanAvailabilityLabels: Record<JapanAvailability, string> = {
  'official-japan':    '国内正規販売あり',
  'distributor-japan': '国内代理店あり',
  'inquiry-required':  '要問い合わせ',
  'import-only':       '個人輸入のみ',
  unavailable:         '国内未対応',
  unknown:             '情報なし',
};
```

- [ ] **Step 3: ビルドを通す**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: コミット**

```bash
git add lib/labels.ts
git commit -m "fix(labels): plain Japanese for deploymentStage and japanAvailability"
```

---

### Task 3: `lib/uiText.ts` の整理

**Files:**
- Modify: `lib/uiText.ts`

3つの変更を1ファイルで行う:
1. `robots` ブロックからsort関連4キー削除、chip group文言更新
2. `manufacturers` ブロックからsort関連4キー削除
3. `common` に `allIndustries` / `allTasks` 追加
4. `filters` に `industry` / `task` ラベル追加

- [ ] **Step 1: `common` ブロックに2行追加**

`lib/uiText.ts` の `common` ブロックの `results:` の直前に追加:

```typescript
    allIndustries: 'すべての業種',
    allTasks: 'すべてのタスク',
```

- [ ] **Step 2: `filters` ブロックに2行追加**

`filters` ブロックの末尾（`taskTags:` の次の行）に追加:

```typescript
    industry: '業種',
    task: 'タスク',
```

- [ ] **Step 3: `robots` ブロックを書き換える**

`robots` ブロック全体を以下に置き換える（sort4キー削除、chip group文言更新）:

```typescript
  robots: {
    breadcrumb: 'ロボット',
    title: 'ロボット一覧',
    activeModels: (count: number) => `${count}件の商用・実証機`,
    preReleaseModels: (count: number) => `${count}件の開発中・将来機種`,
    mainImageMissing: 'メイン画像なし',
    specifications: '仕様',
    technicalSpecifications: '技術仕様',
    decision: '導入判断',
    applications: '用途メモ',
  },
```

- [ ] **Step 4: `manufacturers` ブロックを書き換える**

`manufacturers` ブロック全体を以下に置き換える（sort4キー削除）:

```typescript
  manufacturers: {
    breadcrumb: 'メーカー',
    title: 'メーカー一覧',
    profile: 'メーカープロフィール',
    factSheet: '基本情報',
    models: (count: number) => `${count}件の取扱機種`,
  },
```

- [ ] **Step 5: ビルドを通す**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`（sort参照が残っているとここでエラーになる）

- [ ] **Step 6: コミット**

```bash
git add lib/uiText.ts
git commit -m "refactor(uiText): remove sort labels, update chip group copy, add industry/task filter labels"
```

---

### Task 4: `data/types.ts` に Robot タグフィールドを追加

**Files:**
- Modify: `data/types.ts`

- [ ] **Step 1: Robot インターフェースに2フィールド追加**

`data/types.ts` の `Robot` インターフェースの `comparison:` フィールドの直前に追加:

```typescript
  /** 業種タグ（lib/tagRegistry.ts の kind:'industry' のvalue）。未設定=調査中扱い。 */
  industryTags?: string[];
  /** タスクタグ（lib/tagRegistry.ts の kind:'task' のvalue）。未設定=調査中扱い。 */
  taskTags?: string[];
  comparison: ComparisonProfile;
```

- [ ] **Step 2: ビルドを通す**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: コミット**

```bash
git add data/types.ts
git commit -m "feat(types): add industryTags and taskTags to Robot interface"
```

---

### Task 5: `data/robots.ts` の26機種にタグを付ける

**Files:**
- Modify: `data/robots.ts`

各ロボットオブジェクトに `industryTags` と `taskTags` を追加する。`comparison:` フィールドの直前に挿入する。

**タグ付け一覧（全26機種）:**

| slug | industryTags | taskTags |
|---|---|---|
| unitree-g1 | research, education | r-and-d, material-handling |
| figure-02 | manufacturing | assembly, material-handling, quality-inspection |
| unitree-h1 | research, education | r-and-d |
| apptronik-apollo | manufacturing, logistics | assembly, material-handling |
| agility-digit | logistics | material-handling, picking |
| onex-neo | research | r-and-d |
| figure-03 | manufacturing | assembly, material-handling, quality-inspection |
| unitree-h2 | research | r-and-d, material-handling |
| boston-dynamics-atlas | research, manufacturing | r-and-d, material-handling, assembly |
| tesla-optimus | manufacturing | assembly, material-handling, quality-inspection |
| sanctuary-phoenix | manufacturing, logistics | assembly, material-handling, picking |
| agibot-a2 | manufacturing, logistics | assembly, material-handling |
| ubtech-walker-s2 | manufacturing | quality-inspection, material-handling, assembly |
| fourier-gr2 | healthcare-care, research | physical-assistance, r-and-d |
| fourier-gr3 | healthcare-care, research | physical-assistance, r-and-d |
| booster-t1 | manufacturing, logistics, hospitality | material-handling, customer-service |
| kawasaki-kaleido | public-sector, construction-infrastructure | disaster-response, inspection |
| neura-4ne-1 | manufacturing, logistics | assembly, material-handling |
| kepler-k2 | logistics, manufacturing | material-handling, picking, assembly |
| leju-kuavo | research, education | r-and-d |
| pal-talos | research, education | r-and-d |
| unitree-r1 | logistics, retail, hospitality | material-handling, customer-service, shelf-stocking |
| agibot-a2-max | manufacturing | assembly, material-handling |
| ubtech-walker-s1 | manufacturing | quality-inspection, material-handling |
| booster-k1 | manufacturing, logistics | material-handling, assembly |
| pal-kangaroo | logistics, retail | material-handling, picking, shelf-stocking |

- [ ] **Step 1: 各ロボットオブジェクトに industryTags / taskTags を追加する**

各ロボットの `comparison:` フィールドの直前に、上記一覧に従って追加する。例（unitree-g1 の場合）:

```typescript
    industryTags: ['research', 'education'],
    taskTags: ['r-and-d', 'material-handling'],
    comparison: {
```

26機種すべてに同様に追加する。値はすべて `lib/tagRegistry.ts` に登録済みのkeyを使う。

- [ ] **Step 2: ビルドを通す**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: コミット**

```bash
git add data/robots.ts
git commit -m "feat(data): tag all 26 robots with industryTags and taskTags"
```

---

### Task 6: `lib/tags.ts` にロボット用タグオプション関数を追加

**Files:**
- Modify: `lib/tags.ts`

現在 `tags.ts` には `getUseCaseIndustryTagOptions` / `getUseCaseTaskTagOptions` がある。Robot用を同じパターンで追加する。

- [ ] **Step 1: Robot のimportを追加し、2関数を追記する**

`lib/tags.ts` の import を以下に更新（`Robot` を追加）:

```typescript
import type { Guide, Report, Robot, UseCase } from '@/data/types';
```

`getAllTagOptions` 関数の前に以下を追加:

```typescript
export function getRobotIndustryTagOptions(robots: readonly Robot[]) {
  return toTagOptions(
    robots.flatMap((robot) => robot.industryTags ?? []),
    'industry',
  );
}

export function getRobotTaskTagOptions(robots: readonly Robot[]) {
  return toTagOptions(
    robots.flatMap((robot) => robot.taskTags ?? []),
    'task',
  );
}
```

- [ ] **Step 2: ビルドを通す**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: コミット**

```bash
git add lib/tags.ts
git commit -m "feat(tags): add getRobotIndustryTagOptions and getRobotTaskTagOptions"
```

---

### Task 7: `components/RobotsBrowser.tsx` のフィルタ再設計

**Files:**
- Modify: `components/RobotsBrowser.tsx`

変更内容:
- category フィルタ → industry / task フィルタに差し替え
- sort UI（FilterSelect + URLパラメータ）を削除
- フィルタグリッドを `sm:grid-cols-2 xl:grid-cols-4` に変更
- releaseCandidates の sort を `sortRobots(filtered, 'stage')` 固定に

- [ ] **Step 1: ファイル全体を以下に置き換える**

```typescript
'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { FilterSelect } from '@/components/FilterSelect';
import { RobotCard } from '@/components/RobotCard';
import { SearchInput } from '@/components/SearchInput';
import type { JapanAvailability, Manufacturer, Robot } from '@/data/types';
import {
  isPreReleaseDeploymentStage,
  japanAvailabilityOrder,
  sortByDisplayOrder,
  sortRobots,
} from '@/lib/display';
import { japanAvailabilityLabels } from '@/lib/labels';
import { createRobotSearchDocument, matchesSearchDocument } from '@/lib/search';
import {
  getRobotIndustryTagOptions,
  getRobotTaskTagOptions,
  getTagLabel,
  matchesTag,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface RobotsBrowserProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

export function RobotsBrowser({ robots, manufacturers }: RobotsBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();

  const manufacturerBySlug = useMemo(
    () => new Map(manufacturers.map((m) => [m.slug, m])),
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

  const avails = useMemo(
    () =>
      sortByDisplayOrder(
        Array.from(new Set(robots.map((r) => r.japanAvailability))),
        japanAvailabilityOrder,
      ),
    [robots],
  );

  const industryParam = getParam('industry');
  const taskParam = getParam('task');
  const manufacturerParam = getParam('manufacturer');
  const mfg = manufacturerParam && manufacturerBySlug.has(manufacturerParam) ? manufacturerParam : 'all';
  const availabilityParam = getParam('availability');
  const avail =
    availabilityParam && avails.includes(availabilityParam as JapanAvailability)
      ? (availabilityParam as JapanAvailability)
      : 'all';
  const release = getParam('release') === 'pre' ? 'pre' : 'active';
  const query = getParam('q') ?? '';

  const industryOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allIndustries },
      ...getRobotIndustryTagOptions(robots).map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [robots],
  );
  const taskOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTasks },
      ...getRobotTaskTagOptions(robots).map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [robots],
  );
  const manufacturerOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allManufacturers },
      ...[...manufacturers]
        .sort((a, b) => a.name.localeCompare(b.name, 'en'))
        .map((m) => ({ value: m.slug, label: m.name })),
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

  const releaseCandidates = useMemo(() => {
    const filtered = robots.filter((r) => {
      const industryOk = matchesTag(r.industryTags ?? [], industryParam);
      const taskOk = matchesTag(r.taskTags ?? [], taskParam);
      const mfgOk = mfg === 'all' || r.manufacturerSlug === mfg;
      const availOk = avail === 'all' || r.japanAvailability === avail;
      const queryOk = matchesSearchDocument(query, searchDocuments.get(r.slug));
      return industryOk && taskOk && mfgOk && availOk && queryOk;
    });
    return sortRobots(filtered, 'stage');
  }, [robots, industryParam, taskParam, mfg, avail, query, searchDocuments]);

  const activeRobots = useMemo(
    () => releaseCandidates.filter((r) => !isPreReleaseDeploymentStage(r.deploymentStage)),
    [releaseCandidates],
  );
  const preReleaseRobots = useMemo(
    () => releaseCandidates.filter((r) => isPreReleaseDeploymentStage(r.deploymentStage)),
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
            導入判断に必要なヒューマノイド機種のカタログ。業種・タスク・メーカー・国内入手性で絞り込み、現場に合う候補を探せます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder="機種名・メーカー・用途キーワードで検索"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            id="robot-industry"
            label={uiText.filters.industry}
            value={industryParam ?? 'all'}
            onChange={(v) => updateParams({ industry: v === 'all' ? null : v })}
            options={industryOptions}
          />
          <FilterSelect
            id="robot-task"
            label={uiText.filters.task}
            value={taskParam ?? 'all'}
            onChange={(v) => updateParams({ task: v === 'all' ? null : v })}
            options={taskOptions}
          />
          <FilterSelect
            id="robot-manufacturer"
            label={uiText.filters.manufacturer}
            value={mfg}
            onChange={(v) => updateParams({ manufacturer: v === 'all' ? null : v })}
            options={manufacturerOptions}
          />
          <FilterSelect
            id="robot-availability"
            label={uiText.filters.availability}
            value={avail}
            onChange={(v) => updateParams({ availability: v === 'all' ? null : v })}
            options={availabilityOptions}
          />
        </div>

        <div className="mb-6">
          <FilterChipGroup
            options={releaseOptions}
            value={release}
            onChange={(nextRelease) =>
              updateParams({ release: nextRelease === 'active' ? null : nextRelease })
            }
            ariaLabel={uiText.filters.releaseStatus}
            buttonClassName="px-3 py-1.5 text-xs"
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
              const manufacturer = manufacturerBySlug.get(robot.manufacturerSlug);
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
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: コミット**

```bash
git add components/RobotsBrowser.tsx
git commit -m "feat(robots): replace category filter with industry/task tags, remove sort UI"
```

---

### Task 8: `components/ManufacturersBrowser.tsx` からソートUIを削除

**Files:**
- Modify: `components/ManufacturersBrowser.tsx`

- [ ] **Step 1: import から不要なものを削除する**

`components/ManufacturersBrowser.tsx` の import ブロックから以下を削除:

```typescript
  sortManufacturers,
  type ManufacturerSortKey,
```

- [ ] **Step 2: sort 関連の変数・オプション定義を削除する**

以下の行を削除（全3箇所）:

```typescript
  const sortParam = getParam('sort');
  const sort: ManufacturerSortKey =
    sortParam === 'name' || sortParam === 'founded' ? sortParam : 'japan';
```

```typescript
  const sortOptions: Array<{ value: ManufacturerSortKey; label: string }> = [
    { value: 'japan',   label: uiText.manufacturers.sortJapan },
    { value: 'name',    label: uiText.manufacturers.sortName },
    { value: 'founded', label: uiText.manufacturers.sortFounded },
  ];
```

- [ ] **Step 3: filtered の useMemo で固定 sort を適用する**

現在の `filtered` useMemo:

```typescript
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
```

以下に変更（`sort` 変数を `'japan'` 固定に、依存配列から `sort` を削除）:

```typescript
  const filtered = useMemo(() => {
    const base = manufacturers.filter(
      (m) =>
        (country === 'all' || m.country === country) &&
        (type === 'all' || m.companyType === type) &&
        (status === 'all' || m.companyStatus === status) &&
        matchesSearchDocument(query, searchDocuments.get(m.slug)),
    );
    return sortManufacturers(base, 'japan');
  }, [manufacturers, country, type, status, query, searchDocuments]);
```

importブロックに `sortManufacturers` を残す（固定呼び出しで使う）。

- [ ] **Step 4: JSXから sort FilterSelect とその周辺を削除し、件数表示を単純化する**

以下のブロック全体を削除:

```typescript
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
```

以下に差し替える:

```typescript
        <p className="mb-6 text-xs text-neutral-500">
          {uiText.common.results(filtered.length, country !== 'all' || type !== 'all' || status !== 'all' || query !== '')}
        </p>
```

- [ ] **Step 5: ビルドを通す**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 6: コミット・プッシュ**

```bash
git add components/ManufacturersBrowser.tsx
git commit -m "refactor(manufacturers): remove sort UI, apply fixed japan-first ordering"
git push origin main
```

---

## セルフレビュー

### 1. Spec coverage

- [x] 業種タグ（6件）追加 → Task 1
- [x] タスクタグ（8件）追加 → Task 1
- [x] deploymentStage ラベル平易化 → Task 2
- [x] japanAvailability ラベル平易化 → Task 2
- [x] sort UI削除（robots） → Task 3, 7
- [x] sort UI削除（manufacturers） → Task 3, 8
- [x] Robot型にindustryTags/taskTags追加 → Task 4
- [x] 26機種タグ付け → Task 5
- [x] getRobotIndustryTagOptions / getRobotTaskTagOptions → Task 6
- [x] RobotsBrowser フィルタ再設計（category廃止, industry/task追加） → Task 7
- [x] ManufacturersBrowser ソートUI削除 → Task 8
- [x] chip group文言更新（商用・実証機/開発中・将来機種） → Task 3
- [x] 「調査中」= 空配列 = フィルタ時に非表示の自然な挙動 → Task 5設計

### 2. Placeholder scan

なし。全Stepに実際のコードを記載。26機種タグ表はTask 5で具体値を全件記載済み。

### 3. Type consistency

- `industryTags?: string[]` / `taskTags?: string[]` — Task 4で定義、Task 5で入力、Task 6・7で使用 ✓
- `getRobotIndustryTagOptions(robots: readonly Robot[])` — Task 6で定義、Task 7で使用 ✓
- `matchesTag(values: readonly string[], selected: string | null | undefined)` — 既存関数、Task 7で使用 ✓
- `sortRobots(filtered, 'stage')` — 既存関数、Task 7で固定呼び出し ✓
- `sortManufacturers(base, 'japan')` — 既存関数、Task 8で固定呼び出し ✓
- `uiText.filters.industry` / `uiText.filters.task` — Task 3で追加、Task 7で使用 ✓
- `uiText.common.allIndustries` / `uiText.common.allTasks` — Task 3で追加、Task 7で使用 ✓
