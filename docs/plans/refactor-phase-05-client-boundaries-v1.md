---
status: plan
updated: 2026-07-31
---

# Phase 5 Client Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一覧・比較画面へraw domain record全体を渡す構造と、client filter後にRSCを再取得する二重処理を解消する。

**Architecture:** server pageでdisplay/filter用view modelを生成し、client browserは小さいserializable objectだけを受け取る。現在の件数ではclient filterを維持し、URL同期はHistory API + `useSyncExternalStore`で完結させる。cardの常時motion依存を外し、favorite、popover、carousel、DnDだけをclient interactionとして残す。

**Tech Stack:** React 19、Next.js App Router、History API、TypeScript、Vitest/Testing Library、Playwright

## Global Constraints

- DB query、server action、API route、async repositoryを追加しない。
- filter/share URLのparameter名と意味を維持する。
- browser back/forwardでfilter、compare選択、viewが復元される。
- raw `Robot`、`Manufacturer`、`UseCase`、`Article`配列をcatalog client propsへ渡さない。
- `sources`、`fieldEvidence`、本文、未使用mediaをcatalog view modelへ含めない。この制約は**key名だけでなく値の中身にも及ぶ**。本文をJSON keyとして持たなくても、連結済みのsearch textとして同じ文字列をclientへ送るのは違反とする。
- 現行件数ではpagination/filterをclientで完結する。
- `router.push`/`router.replace`によるfilterごとのRSC再取得を廃止する。
- cardの情報、リンク、favorite、compare、popover機能を維持する。
- `/reports`、`/robots`、`/manufacturers`、`/use-cases`のfirst-load JSをPhase 1 baselineから30%以上削減する。

### Catalog検索範囲（2026-07-31決定）

**原則:** catalog view modelの`searchText`は、**そのcardが表示する情報**と**その一覧が絞り込みに使うfacet**だけを対象とする。詳細ページにしか無い本文は一覧の検索対象にしない。

`lib/search.ts`の`create*SearchDocument()`は`description`、`comparison.*`、`supportNote`／`vendorRiskNote`等の本文fieldを`fields`に含む。これをそのまま連結してVMへ載せると、上のGlobal Constraintに反するうえ、first-load JS 30%削減目標とも正面衝突する。実測値:

| route | VM全体 | うちsearchText | 本文除外時の削減 |
|---|---|---|---|
| `/robots`（57件） | 67,185字 | 28,357字（42.2%） | VM全体の **-27.7%** |
| `/manufacturers`（25件） | 24,171字 | 11,401字（47.2%） | VM全体の **-38.8%** |

したがってcatalogの`searchText`は`lib/search.ts`のsearch documentを再利用せず、`lib/catalog/search.ts`がcollectionごとに対象fieldを明示的に列挙して生成する。対象は次の通り。

| collection | searchTextへ含める | 含めない |
|---|---|---|
| robots | 機種名（`nameJa`/`name`）、メーカー名、`manufacturerId`、`distributorJapan`、category／stage／readiness／availability／mobility／procurementの各label、card facts（用途・サイズ・価格・稼働時間）の値、`industryTags`、`taskTags` | `summary`、`description`、`comparison.*`、`supportNote`、`safetyNote`、`vendorRiskNote` |
| manufacturers | 社名（`nameJa`/`name`）、`country`、`hqCity`、`foundedYear`、国内代理店名、取扱ロボット名、companyType／companyStatus／japanPresenceのlabel | `description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、代理店`note` |
| use-cases | `title`、`description`（cardに表示するため対象）、maturity label、`robotNames`、`primaryIndustry`、`industryTags`、`taskTags` | `candidateRobots`の詳細、`capabilityNotes`、`sources` |
| reports | `title`、`summary`（cardに表示するため対象）、種別label、`themeTags` | `body`、`manufacturerGuideContent`、`sources` |

**受け入れるトレードオフ:** 一覧の検索範囲は現行より狭くなる。現在は紹介文中の語（例「バッテリー」）でも部分一致でhitするが、今後はhitしない。現行実装は関連度ranking無しの単純部分一致（`lib/search.ts`の`matchesSearchDocument`）であり、注記中の一語が偶然一致した無関係なrecordが機種名一致と同列に並ぶ状態でもある。本文全文検索を維持する場合はserver側の検索APIが必要になるが、本phaseは「API routeを追加しない」制約下にあるためscope外とし、将来の別planへ委ねる。検索窓のplaceholder（`lib/uiText.ts`の「ロボット名・メーカー・用途キーワードで検索」「メーカー名・地域・取扱ロボットで検索」）は本決定後の挙動と整合するため変更しない。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `lib/catalog/urlState.ts` | History API storeとReact hook |
| `lib/catalog/urlSearch.ts` | server/client共通の初期query serialize |
| `lib/catalog/search.ts` | 小規模catalog用normalized search、およびcollectionごとのcatalog searchText生成（対象fieldはここで明示列挙する。Task 2で作成しTask 3で拡張する） |
| `lib/viewModels/shared.ts` | serializable image/logo/fact型 |
| `lib/viewModels/logo.ts` | domain logoからdisplay logoへのserver変換 |
| `lib/viewModels/robots.ts` | robot list VM |
| `lib/viewModels/manufacturers.ts` | manufacturer list VM |
| `lib/viewModels/useCases.ts` | use-case list VM |
| `lib/viewModels/articles.ts` | report list/hero VM |
| `lib/viewModels/compare.ts` | compare VM |
| `lib/useMediaQuery.ts` | motion package不要のmedia query hook |
| `components/FavoriteButton.tsx` | favoriteだけのclient island |
| `components/compare/CompareMenu.tsx` | selection menu |
| `components/compare/CompareSheet.tsx` | comparison cards/table |
| `components/compare/CompareViewToggle.tsx` | view state |
| `tests/components/catalog-url-state.test.tsx` | push/replace/popstate |
| `tests/unit/view-models/*.test.ts` | serialization/filter contract |
| `tests/e2e/catalog-url-state.spec.ts` | URL共有とback/forward |
| `scripts/check-client-budgets.mjs` | route JS budget |

### 変更

| Path | Responsibility |
|---|---|
| `lib/useUrlParamUpdater.ts` | 削除。新storeへ置換 |
| `lib/robotFilters.ts` | Robot VMをfilter |
| `lib/manufacturerFilters.ts` | Manufacturer VMをfilter |
| `lib/useCaseFilters.ts` | UseCase VMをfilter |
| `lib/articleFilters.ts` | Article VMをfilter |
| `components/RobotCard.tsx` | Robot VM props、motion削除 |
| `components/ManufacturerCard.tsx` | Manufacturer VM props、motion削除 |
| `components/ManufacturerLogoName.tsx` | 解決済みdisplay logoを受付 |
| `components/UseCaseCard.tsx` | UseCase VM props、motion削除 |
| `components/NewsCard.tsx` | Article VM props |
| `components/NewsFeatureCard.tsx` | Article VM props |
| `components/NewsHeroCarousel.tsx` | Article VM props、motion hook削除 |
| `components/*Browser.tsx` | VM + local URL state |
| `components/CompareClient.tsx` | coordinatorへ縮小 |
| `components/ComparisonRobotPanel.tsx` | Compare VM props |
| `components/FavoriteCard.tsx` | Compare VM props |
| `src/app/{robots,manufacturers,use-cases,reports,compare}/page.tsx` | server VM生成 |
| `package.json` | client budget gate |

---

### Task 1: URL状態をHistory API storeへ置換する

**Files:**
- Create: `lib/catalog/urlState.ts`
- Create: `tests/components/catalog-url-state.test.tsx`
- Create: `tests/e2e/catalog-url-state.spec.ts`
- Delete: `lib/useUrlParamUpdater.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/ManufacturersBrowser.tsx`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `components/CompareClient.tsx`

**Interfaces:**
- Produces:
  - `useCatalogUrlState(initialSearch): { searchParams; updateParams }`
  - `updateCatalogUrl(updates, mode): void`
- Removes: `isPending`とfilter時のRSC navigation

- [ ] **Step 1: hook contract testを書く**

```tsx
// tests/components/catalog-url-state.test.tsx
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCatalogUrlState } from '@/lib/catalog/urlState';

describe('useCatalogUrlState', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/robots?q=old');
  });

  it('replaces a parameter without navigating the document', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => result.current.updateParams({ q: 'new', industry: 'logistics' }, 'replace'));
    expect(window.location.pathname).toBe('/robots');
    expect(window.location.search).toBe('?q=new&industry=logistics');
    expect(result.current.searchParams.get('q')).toBe('new');
  });

  it('deletes null and blank values', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => result.current.updateParams({ q: ' ', industry: null }));
    expect(window.location.search).toBe('');
  });

  it('reacts to popstate', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => {
      window.history.replaceState(null, '', '/robots?q=back');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.searchParams.get('q')).toBe('back');
  });
});
```

- [ ] **Step 2: testがmodule未存在で失敗することを確認する**

Run: `npm run test -- tests/components/catalog-url-state.test.tsx`

Expected: module not foundでFAIL。

- [ ] **Step 3: URL storeを実装する**

```ts
// lib/catalog/urlState.ts
'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type UrlParamValue = string | null | undefined;
export type UrlUpdateMode = 'push' | 'replace';

const URL_CHANGE_EVENT = 'deploid:urlchange';

function normalizeInitialSearch(initialSearch: string) {
  if (!initialSearch) return '';
  return initialSearch.startsWith('?') ? initialSearch : `?${initialSearch}`;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(URL_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(URL_CHANGE_EVENT, onStoreChange);
  };
}

function getBrowserSnapshot() {
  return window.location.search;
}

export function updateCatalogUrl(
  updates: Record<string, UrlParamValue>,
  mode: UrlUpdateMode = 'push',
) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    const normalized = value?.trim();
    if (!normalized) params.delete(key);
    else params.set(key, normalized);
  }
  const query = params.toString();
  const href = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  const method = mode === 'replace' ? 'replaceState' : 'pushState';
  window.history[method](window.history.state, '', href);
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
}

export function useCatalogUrlState(initialSearch: string) {
  const serverSnapshot = normalizeInitialSearch(initialSearch);
  const search = useSyncExternalStore(subscribe, getBrowserSnapshot, () => serverSnapshot);
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const updateParams = useCallback(updateCatalogUrl, []);
  return { searchParams, updateParams };
}
```

- [ ] **Step 4: browserを1つずつ移行する**

各browser propの`initialFilters`/`initialQuery`/`selectedIds`を`initialSearch: string`へ置換する。filterは毎renderで`searchParams`から正規化する。

```ts
const { searchParams, updateParams } = useCatalogUrlState(initialSearch);
const filters = normalizeRobotFilters({
  manufacturer: searchParams.get('manufacturer'),
  availability: searchParams.get('availability'),
  industry: searchParams.get('industry'),
  query: searchParams.get('q'),
  manufacturerValues,
  availabilityValues,
  industryValues,
});
```

`isPending`、`CardGridSkeleton`分岐を削除する。compareは`compare`と`view`を`searchParams`から毎render解決する。

- [ ] **Step 5: server pageからinitial searchを渡す**

各pageで既に取得しているparamsを次でserializeする。

```ts
// lib/catalog/urlSearch.ts
export function toInitialSearch(entries: Record<string, string | null>) {
  const params = new URLSearchParams();
  Object.entries(entries).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}
```

このhelperは`lib/catalog/urlSearch.ts`へ置き、server/clientどちらからも使えるpure functionにする。対象parameter以外を含めない。

- [ ] **Step 6: E2Eを書く**

```ts
// tests/e2e/catalog-url-state.spec.ts
import { expect, test } from '@playwright/test';

test('robot filters update immediately and survive back/forward', async ({ page }) => {
  await page.goto('/robots');
  const before = await page.locator('[data-catalog-item]').count();
  await page.getByRole('tab', { name: /物流/ }).click();
  await expect(page).toHaveURL(/industry=logistics/);
  const filtered = await page.locator('[data-catalog-item]').count();
  expect(filtered).toBeLessThan(before);
  await page.goBack();
  await expect(page).not.toHaveURL(/industry=logistics/);
  await expect(page.locator('[data-catalog-item]')).toHaveCount(before);
  await page.goForward();
  await expect(page).toHaveURL(/industry=logistics/);
  await expect(page.locator('[data-catalog-item]')).toHaveCount(filtered);
});
```

- [ ] **Step 7: old updaterを削除してgateを実行する**

```bash
rg -n "useUrlParamUpdater|useRouter\\(|router\\.(push|replace)" components lib
npm run test -- tests/components/catalog-url-state.test.tsx
npm run build
npm run test:e2e -- tests/e2e/catalog-url-state.spec.ts
```

Expected: catalog browser内のold updater/router navigation 0件、test PASS。

- [ ] **Step 8: commit**

```bash
git add lib/catalog lib/useUrlParamUpdater.ts components src/app tests/components tests/e2e/catalog-url-state.spec.ts
git commit -m "refactor: keep catalog filters in browser URL state"
```

---

### Task 2: Robot / Manufacturer一覧をview model化する

**Files:**
- Create: `lib/viewModels/shared.ts`
- Create: `lib/viewModels/robots.ts`
- Create: `lib/viewModels/manufacturers.ts`
- Create: `lib/catalog/search.ts`
- Create: `tests/unit/view-models/robots.test.ts`
- Create: `tests/unit/view-models/manufacturers.test.ts`
- Modify: `lib/robotFilters.ts`
- Modify: `lib/manufacturerFilters.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/ManufacturersBrowser.tsx`
- Modify: `components/RobotCard.tsx`
- Modify: `components/ManufacturerCard.tsx`
- Modify: `components/ManufacturerLogoName.tsx`
- Modify: `src/app/robots/page.tsx`
- Modify: `src/app/manufacturers/page.tsx`

**Interfaces:**
- Produces:
  - `createRobotCatalogItems(robots, manufacturers, useCases): RobotCatalogItem[]`
  - `createManufacturerCatalogItems(manufacturers, robots): ManufacturerCatalogItem[]`

- [ ] **Step 1: serializable VM typesを定義する**

```ts
// lib/viewModels/shared.ts
import type { ManufacturerLogoVariant } from '@/lib/manufacturerLogo';
import type { VisualTone } from '@/lib/visualSemantics';

export interface CatalogImage {
  src: string;
  alt: string;
}

export interface CatalogLogoAsset {
  src: string;
  alt: string;
  credit?: string;
  aspectRatio?: number;
}

export interface CatalogLogo {
  asset?: CatalogLogoAsset;
  resolvedVariant?: ManufacturerLogoVariant;
}

export interface CatalogTag {
  label: string;
  tone: VisualTone;
}

export interface CatalogFact {
  key: string;
  label: string;
  value: string;
  href?: string;
}
```

```ts
// lib/viewModels/logo.ts
import type { Manufacturer } from '@/data/types';
import {
  resolveManufacturerLogo,
  type ManufacturerLogoVariant,
} from '@/lib/manufacturerLogo';
import type { CatalogLogo } from './shared';

export function createCatalogLogo(
  manufacturer: Manufacturer | undefined,
  variant: ManufacturerLogoVariant,
): CatalogLogo {
  if (!manufacturer) return {};
  const { asset, resolvedVariant } = resolveManufacturerLogo(manufacturer, variant);
  return {
    asset: asset
      ? {
          src: asset.src,
          alt: asset.alt,
          credit: asset.credit,
          aspectRatio: asset.aspectRatio,
        }
      : undefined,
    resolvedVariant,
  };
}
```

```ts
// lib/viewModels/robots.ts
export interface RobotCatalogItem {
  id: string;
  slug: string;
  href: string;
  name: string;
  image?: CatalogImage;
  manufacturer: CatalogLogo & { id: string; name: string };
  stage: CatalogTag;
  facts: [CatalogFact, CatalogFact, CatalogFact, CatalogFact];
  filter: {
    manufacturerId: string;
    industryTags: string[];
    japanAvailability: string;
    deploymentStage: string;
    searchText: string;
  };
}
```

```ts
// lib/viewModels/manufacturers.ts
export interface ManufacturerCatalogItem {
  id: string;
  slug: string;
  href: string;
  name: string;
  website: string;
  logo: CatalogLogo;
  filter: {
    country: string;
    consultationRoute: string;
    searchText: string;
  };
  facts: {
    establishedRegion: string;
    representativeRobot: string;
    consultationRoute: string;
    distributors: Array<{ name: string; website?: string }>;
    distributorLabel: string;
    hasDistributor: boolean;
  };
}
```

- [ ] **Step 2: forbidden field testを書く**

```ts
// tests/unit/view-models/robots.test.ts
import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots, getUseCases } from '@/lib/data';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

describe('robot catalog view models', () => {
  const items = createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases());
  const json = JSON.stringify(items);

  it('exclude editorial evidence and full domain records', () => {
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"fieldEvidence"');
    expect(json).not.toContain('"comparison"');
    expect(json).not.toContain('"priceOffers"');
  });

  it('exclude body text content, not just its keys', () => {
    // key名の不在だけでは、連結済みsearch textとして本文が載っている場合を検出できない。
    // 実recordの本文値そのものがJSONに現れないことを固定する。
    const robots = getRobots();
    for (const robot of robots) {
      for (const text of [
        robot.description,
        robot.summary,
        robot.supportNote,
        robot.safetyNote,
        robot.vendorRiskNote,
        ...robot.comparison.strengths,
        ...robot.comparison.constraints,
        ...robot.comparison.bestFit,
        ...robot.comparison.notFit,
      ]) {
        if (!text || text.length < 12) continue;
        expect(json).not.toContain(text);
      }
    }
  });
});
```

Manufacturer testは`"sources"`、`"headquarters"`、`"description"`、`"notes"`がJSONに含まれないことをassertする。両testで`"sourceUrl"`と`"rights"`も含まれないことをassertし、表示用logo/imageだけがserializeされることを固定する。Manufacturer側にも同じ本文値assertionを置き、`description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、代理店`note`の実値がJSONに現れないことを固定する。

短い文字列は他fieldと偶然一致しうるため、値assertionは12文字以上のものだけを対象とする。

- [ ] **Step 3: server factoriesを実装する**

`createRobotCatalogItems`は既存helperをserverで呼ぶ。

```ts
export function createRobotCatalogItems(
  robots: readonly Robot[],
  manufacturers: readonly Manufacturer[],
  useCases: readonly UseCase[],
): RobotCatalogItem[] {
  const manufacturerById = new Map(manufacturers.map((item) => [item.id, item]));
  return robots.map((robot) => {
    const manufacturer = manufacturerById.get(robot.manufacturerId);
    const image = getRobotPrimaryImage(robot);
    const card = createRobotCardViewModel(robot, useCases);
    return {
      id: robot.id,
      slug: robot.slug,
      href: `/robots/${robot.slug}`,
      name: robot.nameJa ?? robot.name,
      image: image ? { src: image.src, alt: image.alt } : undefined,
      manufacturer: {
        id: robot.manufacturerId,
        name: manufacturer?.nameJa ?? manufacturer?.name ?? robot.manufacturerId,
        ...createCatalogLogo(manufacturer, 'combined'),
      },
      stage: {
        label: deploymentStageLabels[robot.deploymentStage],
        tone: getDeploymentStageTone(robot.deploymentStage),
      },
      facts: card.facts.map(({ key, label, value, href }) => ({ key, label, value, href })) as RobotCatalogItem['facts'],
      filter: {
        manufacturerId: robot.manufacturerId,
        industryTags: [...robot.industryTags],
        japanAvailability: robot.japanAvailability,
        deploymentStage: robot.deploymentStage,
        searchText: createRobotCatalogSearchText(robot, manufacturer, card.facts),
      },
    };
  });
}
```

`createCatalogLogo(manufacturer, variant)`は`resolveManufacturerLogo`をserverで呼び、`src`、`alt`、`credit`、`aspectRatio`、`resolvedVariant`だけを返す。Manufacturer factoryは`getDomesticDistributorDisplay`、`getManufacturerEstablishedRegionLabel`、`getManufacturerConsultationRoute`、`getRepresentativeRobotLabel`をserverで解決し、`ManufacturerCatalogItem`へ詰める。

`searchText`は`lib/search.ts`の`createRobotSearchDocument()`／`createManufacturerSearchDocument()`を**使わない**。それらの`fields`には本文が含まれ、Global Constraintの「Catalog検索範囲」に反するため。代わりに`lib/catalog/search.ts`へcollectionごとのbuilderを置き、対象fieldを直接列挙する。

```ts
// lib/catalog/search.ts
import { normalizeSearchText } from '@/lib/search';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  mobilityLabels,
  procurementLabels,
  robotCategoryLabels,
} from '@/lib/labels';
import type { Manufacturer, Robot } from '@/data/types';
import type { CatalogFact } from '@/lib/viewModels/shared';

function joinSearchText(parts: ReadonlyArray<string | number | undefined>) {
  return normalizeSearchText(parts.filter(Boolean).join(' '));
}

export function createRobotCatalogSearchText(
  robot: Robot,
  manufacturer: Manufacturer | undefined,
  facts: readonly CatalogFact[],
) {
  return joinSearchText([
    robot.nameJa,
    robot.name,
    manufacturer?.nameJa,
    manufacturer?.name,
    robot.manufacturerId,
    robot.distributorJapan,
    robotCategoryLabels[robot.category],
    deploymentStageLabels[robot.deploymentStage],
    buyerReadinessLabels[robot.buyerReadiness],
    japanAvailabilityLabels[robot.japanAvailability],
    robot.specs.mobility ? mobilityLabels[robot.specs.mobility] : undefined,
    ...robot.procurementModels.map((model) => procurementLabels[model]),
    ...facts.map((fact) => fact.value),
    ...robot.industryTags,
    ...robot.taskTags,
  ]);
}
```

`createManufacturerCatalogSearchText(manufacturer, robotsForManufacturer)`も同じ形で、社名、`country`、`hqCity`、`foundedYear`、国内代理店名、取扱ロボット名、companyType／companyStatus／japanPresenceのlabelだけを連結する。`description`や`*Note`は渡さない。

- [ ] **Step 4: filtersとcardsをVM入力へ変更する**

`filterRobots`、facet関数は`RobotCatalogItem`を受け、`item.filter.*`だけを見る。`RobotCard`は`item` propだけを受け、`getRobotPrimaryImage`やlabel/tone解決を呼ばない。

```tsx
interface RobotCardProps {
  item: RobotCatalogItem;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  mobileVisual?: boolean;
  eagerImage?: boolean;
}
```

`ManufacturerCard`も`item: ManufacturerCatalogItem`だけを受ける。`ManufacturerLogoName`には`resolvedLogo?: CatalogLogo` propを追加する。指定時は`resolveManufacturerLogo`を再実行せず`resolvedLogo.asset`を描画し、既存の`logo`/`logos` propsはdetail page向けに維持する。

- [ ] **Step 5: catalog cardのmotion依存を外す**

`RobotCard`と`ManufacturerCard`から`motion/react`と`useTiltCardEffect`を削除し、rootを通常の`div`へ変える。pointer追従glowを削除し、既存のCSS `hover:border`、shadow、shimmer、accent lineは維持する。

- [ ] **Step 6: server pagesでVMを生成する**

```tsx
const items = createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases());
return <RobotsBrowser items={items} initialSearch={initialSearch} />;
```

```tsx
const items = createManufacturerCatalogItems(getManufacturers(), getRobots());
return <ManufacturersBrowser items={items} initialSearch={initialSearch} />;
```

- [ ] **Step 7: testsとE2Eを実行する**

```bash
npm run test -- tests/unit/view-models/robots.test.ts tests/unit/view-models/manufacturers.test.ts
npm run build
npm run test:e2e -- tests/e2e/public-routes.spec.ts tests/e2e/catalog-url-state.spec.ts
```

Expected: VM JSONにforbidden fieldなし、一覧表示/favorite/filterがPASS。

- [ ] **Step 8: commit**

```bash
git add lib/viewModels lib/robotFilters.ts lib/manufacturerFilters.ts components/RobotCard.tsx components/ManufacturerCard.tsx components/ManufacturerLogoName.tsx components/RobotsBrowser.tsx components/ManufacturersBrowser.tsx src/app/robots/page.tsx src/app/manufacturers/page.tsx tests/unit/view-models
git commit -m "refactor: send catalog view models to robot and manufacturer clients"
```

---

### Task 3: Use case / Reports一覧をview model化する

**Files:**
- Modify: `lib/catalog/search.ts`（Task 2で作成済み。use-case／article用builderを追加する）
- Create: `lib/viewModels/useCases.ts`
- Create: `lib/viewModels/articles.ts`
- Create: `tests/unit/view-models/use-cases.test.ts`
- Create: `tests/unit/view-models/articles.test.ts`
- Modify: `lib/useCaseFilters.ts`
- Modify: `lib/articleFilters.ts`
- Modify: `lib/articlePlacements.ts`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `components/UseCaseCard.tsx`
- Modify: `components/NewsCard.tsx`
- Modify: `components/NewsFeatureCard.tsx`
- Modify: `components/NewsHeroCarousel.tsx`
- Modify: `src/app/use-cases/page.tsx`
- Modify: `src/app/reports/page.tsx`

**Interfaces:**
- Produces:
  - `createUseCaseCatalogItems(...)`
  - `createArticleCatalogItems(articles)`
  - `matchesCatalogSearch(searchText, query)`

- [ ] **Step 1: small catalog search contractを書く**

`matchesCatalogSearch`をTask 2で作成済みの`lib/catalog/search.ts`へ追加する。

```ts
// lib/catalog/search.ts（追記）
export function matchesCatalogSearch(searchText: string, query: string) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeSearchText(searchText);
  return terms.every((term) => haystack.includes(term));
}
```

use-case／article用のsearchText builderも同じfileへ追加する。robots／manufacturersと同様、`lib/search.ts`のsearch documentは再利用せず、対象fieldを直接列挙する。

```ts
export function createUseCaseCatalogSearchText(
  useCase: UseCase,
  robotNames: readonly string[],
) {
  return joinSearchText([
    useCase.titleJa ?? useCase.title,
    useCase.description, // cardに表示するため対象
    useCaseMaturityLabels[useCase.maturity],
    useCase.primaryIndustry,
    ...robotNames,
    ...useCase.industryTags,
    ...useCase.taskTags,
  ]);
}

export function createArticleCatalogSearchText(article: Article) {
  return joinSearchText([
    article.titleJa ?? article.title,
    article.summary, // cardに表示するため対象
    articleTypeLabels[article.type],
    ...article.themeTags,
  ]);
}
```

`description`／`summary`はcardが表示する情報のためsearchTextへ含める（Global Constraintの「Catalog検索範囲」表を参照）。`body`、`manufacturerGuideContent`、`capabilityNotes`、`sources`は含めない。

VM testで日本語、英語、メーカー名、複数語queryが現行代表recordへhitすることを固定する。typo fuzzy matchingは新contractに含めず、検索UIの説明も部分一致として扱う。

- [ ] **Step 2: VM typesを定義する**

```ts
export interface UseCaseCatalogItem {
  id: string;
  slug: string;
  href: string;
  title: string;
  description: string;
  maturity: CatalogTag & { value: string };
  evidence?: CatalogTag;
  robotNames: string[];
  filter: {
    primaryIndustry: string;
    industryTags: string[];
    taskTags: string[];
    searchText: string;
  };
}
```

```ts
export interface ArticleCatalogItem {
  id: string;
  slug: string;
  href: string;
  title: string;
  summary: string;
  publishedAt: string;
  label: string;
  typeTone: VisualTone;
  shelf: ArticleShelf;
  themeTags: string[];
  heroImage?: CatalogImage;
  searchText: string;
}
```

- [ ] **Step 3: factoriesとforbidden field testsを実装する**

Use case JSONに`candidateRobots`、`sources`、`capabilityNotes`がないことをassertする。Article JSONに`body`、`manufacturerGuideContent`、`sources`、`relatedRobotIds`がないことをassertする。

Factoryは既存のlabel、tone、media、evidence helperをserverで解決する。`getDisplayableAsset()`の戻り値は`{ src, alt }`へ写像し、rights/source metadataを含めない。filterの`searchText`はStep 1の`createUseCaseCatalogSearchText()`／`createArticleCatalogSearchText()`で生成する（`createUseCaseSearchDocument`／`createArticleSearchDocument`は本文を含むため使わない）。

Task 2と同じく、両testに本文値assertionを置く。use-caseは`capabilityNotes`、articleは`body`／`manufacturerGuideContent`の実値（12文字以上）がJSONに現れないことを固定する。

- [ ] **Step 4: placementsをserver引数化する**

`lib/articlePlacements.ts`から`localContentSnapshot` importを削除し、signatureを次へ変更する。

```ts
export function getArticleIndexPlacementReports<T extends { id: string; publishedAt: string }>({
  articles,
  placements,
  limits,
}: {
  articles: readonly T[];
  placements: readonly ArticlePlacement[];
  limits: Readonly<Record<ArticlePlacementSlot, number>>;
}) {
  // 現行のhero/feature selectionをTのidentityを保って返す
}
```

`src/app/reports/page.tsx`だけが`localContentSnapshot.articlePlacements`とlimitsを渡し、結果をArticle VMへ変換する。`ReportsBrowser`は`reports`、`heroReports`、`featureReports`の3つのVM配列を受け、placement moduleをimportしない。

- [ ] **Step 5: cards/browserをVMへ変更する**

UseCasesBrowserは`UseCaseCatalogItem[]`、ReportsBrowserは`ArticleCatalogItem[]`を受ける。検索は`matchesCatalogSearch(item.filter.searchText, query)`または`item.searchText`を使い、`create*SearchIndex`と`MiniSearch`をclient graphから外す。

UseCaseCardから`motion/react`と`useTiltCardEffect`を削除し、通常の`div`へ変更する。NewsHeroCarouselの`useReducedMotion`はTask 4の`useMediaQuery('(prefers-reduced-motion: reduce)')`へ置換する。

- [ ] **Step 6: testsとE2Eを実行する**

```bash
npm run test -- tests/unit/view-models/use-cases.test.ts tests/unit/view-models/articles.test.ts
npm run build
npm run test:e2e -- tests/e2e/public-routes.spec.ts tests/e2e/catalog-url-state.spec.ts
```

Expected: Reports/use-case search、tabs、pagination、hero placementが維持される。

- [ ] **Step 7: client graphを確認する**

```bash
rg -n "MiniSearch|createArticleSearchIndex|createUseCaseSearchIndex|motion/react" \
  components/ReportsBrowser.tsx components/UseCasesBrowser.tsx components/NewsHeroCarousel.tsx components/UseCaseCard.tsx
```

Expected: 0件。

- [ ] **Step 8: commit**

```bash
git add lib/catalog/search.ts lib/viewModels lib/useCaseFilters.ts lib/articleFilters.ts lib/articlePlacements.ts components/UseCasesBrowser.tsx components/ReportsBrowser.tsx components/UseCaseCard.tsx components/NewsCard.tsx components/NewsFeatureCard.tsx components/NewsHeroCarousel.tsx src/app/use-cases/page.tsx src/app/reports/page.tsx tests/unit/view-models
git commit -m "refactor: send catalog view models to reports and use cases"
```

---

### Task 4: Compareをview modelと責務別componentへ分割する

**Files:**
- Create: `lib/viewModels/compare.ts`
- Create: `lib/useMediaQuery.ts`
- Create: `components/compare/CompareMenu.tsx`
- Create: `components/compare/CompareSheet.tsx`
- Create: `components/compare/CompareViewToggle.tsx`
- Create: `tests/unit/view-models/compare.test.ts`
- Modify: `components/CompareClient.tsx`
- Modify: `components/ComparisonRobotPanel.tsx`
- Modify: `components/FavoriteCard.tsx`
- Modify: `components/compare/CompareParts.tsx`
- Modify: `src/app/compare/page.tsx`

**Interfaces:**
- Produces: `CompareRobotViewModel[]`
- `CompareClient`: URL/favorite state coordinator
- `CompareMenu`: search/selection
- `CompareSheet`: order/DnD/visual-spec rendering

- [ ] **Step 1: Compare VMを定義する**

```ts
// lib/viewModels/compare.ts
import type { ComparisonSpecGroup } from '@/lib/robotDisplay';
import type { CatalogImage, CatalogLogo } from './shared';

export interface CompareRobotViewModel {
  id: string;
  href: string;
  name: string;
  manufacturer: CatalogLogo & { id: string; name: string };
  image?: CatalogImage;
  searchText: string;
  specGroups: ComparisonSpecGroup[];
  comparison: {
    strengths: string[];
    constraints: string[];
    bestFit: string[];
    notFit: string[];
  };
}
```

`createCompareRobotViewModels(robots, manufacturers)`は`getComparisonSpecGroups`、`getRobotPrimaryImage`、manufacturer lookupをserverで実行する。

- [ ] **Step 2: forbidden field testを書く**

```ts
it('does not serialize raw evidence or pricing records', () => {
  const json = JSON.stringify(createCompareRobotViewModels(getRobots(), getManufacturers()));
  expect(json).not.toContain('"sources"');
  expect(json).not.toContain('"fieldEvidence"');
  expect(json).not.toContain('"priceOffers"');
  expect(json).not.toContain('"usageExampleSourceUrls"');
});
```

- [ ] **Step 3: child componentsをVM入力へ変更する**

`ComparisonRobotPanel`は`robot: CompareRobotViewModel`を受け、次を置換する。

- image: `robot.image`
- link: `robot.href`
- specs: `robot.specGroups`
- manufacturer: `robot.manufacturer`
- drawer lists: `robot.comparison`

`FavoriteCard`と`MenuRobotButton`もVMだけを受ける。

- [ ] **Step 4: coordinatorを3責務へ分ける**

`CompareClient`へ残すstate:

- `searchParams`から解決したselected IDs/view
- favorites
- `menuQuery`
- child callbackでURLを更新する関数

`CompareMenu`へ移す:

- manufacturer grouping
- menu search
- flyout/open state
- mobile manufacturer select

`CompareSheet`へ移す:

- ordered IDs
- DnD sensors/overlay
- selected cards
- visual/specs layout

`CompareViewToggle`へ移す:

- visual/specs button
- toast
- `onChange(view)`

各fileを250行未満にする。共有stateは新しいcontextへ隠さず、typed propsで渡す。

- [ ] **Step 5: media query hookを追加する**

```ts
// lib/useMediaQuery.ts
'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}
```

ComparisonRobotPanelのpointer判定とNewsHeroCarouselのreduced motionにこのhookを使う。

- [ ] **Step 6: pageからVMだけを渡す**

```tsx
const items = createCompareRobotViewModels(getRobots(), getManufacturers());
return <CompareClient items={items} initialSearch={toInitialSearch({ compare, view })} />;
```

- [ ] **Step 7: testsとcompare E2Eを実行する**

既存compare操作を次で固定する。

```ts
test('compare selection, view and order survive URL navigation', async ({ page }) => {
  await page.goto('/compare');
  await page.getByRole('button', { name: /Unitree G1/ }).click();
  await expect(page).toHaveURL(/compare=/);
  await page.getByRole('button', { name: /スペック/ }).click();
  await expect(page).toHaveURL(/view=specs/);
  await page.reload();
  await expect(page.getByRole('button', { name: /ビジュアル/ })).toBeVisible();
});
```

Run:

```bash
npm run test -- tests/unit/view-models/compare.test.ts
npm run build
npm run test:e2e -- tests/e2e/compare.spec.ts
```

- [ ] **Step 8: commit**

```bash
git add lib/viewModels/compare.ts lib/useMediaQuery.ts components/CompareClient.tsx components/ComparisonRobotPanel.tsx components/FavoriteCard.tsx components/compare src/app/compare/page.tsx tests/unit/view-models/compare.test.ts tests/e2e/compare.spec.ts
git commit -m "refactor: split compare client around display view models"
```

---

### Task 5: raw propsとclient budgetをhard gate化する

**Files:**
- Create: `scripts/check-client-budgets.mjs`
- Create: `tests/unit/view-models/catalog-serialization.test.ts`
- Modify: `package.json`
- Modify: `docs/reference/refactor-baseline-2026-07-26.md`

**Interfaces:**
- Consumes: `.next/diagnostics/route-bundle-stats.json`
- Produces: `npm run check:client-budgets`

- [ ] **Step 1: aggregate serialization testを書く**

```ts
const forbiddenKeys = [
  '"sources"',
  '"fieldEvidence"',
  '"body"',
  '"manufacturerGuideContent"',
  '"usageExampleSourceUrls"',
];

for (const [name, value] of Object.entries(catalogViewModelFixtures)) {
  it(`${name} excludes raw-only fields`, () => {
    const json = JSON.stringify(value);
    forbiddenKeys.forEach((key) => expect(json).not.toContain(key));
  });
}
```

`catalogViewModelFixtures`は実dataから5 factoryの結果を作る。

key名assertionに加えて、**本文値のaggregate assertion**も置く。全collectionの本文field（robot: `description`／`summary`／`comparison.*`／各note、manufacturer: `description`／各note、use-case: `capabilityNotes`、article: `body`／`manufacturerGuideContent`）から12文字以上の実値を集め、5 factoryいずれのJSONにも現れないことを固定する。これがGlobal Constraint「Catalog検索範囲」のhard gateであり、key名だけのassertionでは検出できない連結済みsearch text経由の流出を止める唯一の自動検査になる。

- [ ] **Step 2: client budget scriptを追加する**

```js
// scripts/check-client-budgets.mjs
import fs from 'node:fs';

const stats = JSON.parse(
  fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'),
);
const budgets = {
  '/reports': 785_122,
  '/robots': 646_159,
  '/manufacturers': 637_214,
  '/use-cases': 602_884,
};

let failed = false;
for (const [route, maxBytes] of Object.entries(budgets)) {
  const entry = stats.find((item) => item.route === route);
  if (!entry) {
    console.error(`[client-budget] missing route: ${route}`);
    failed = true;
    continue;
  }
  const actual = entry.firstLoadUncompressedJsBytes;
  console.log(`[client-budget] ${route}: ${actual}/${maxBytes}`);
  if (actual > maxBytes) failed = true;
}
if (failed) process.exitCode = 1;
```

BudgetsはPhase 1 baselineの30%削減値:

- reports: 1,121,603 → 785,122
- robots: 923,085 → 646,159
- manufacturers: 910,306 → 637,214
- use-cases: 861,263 → 602,884

- [ ] **Step 3: package scriptsへ追加する**

```json
{
  "check:client-budgets": "node scripts/check-client-budgets.mjs",
  "check": "npm run validate:data && npm run check:data-boundaries && npm run check:world-map-asset && npm run typecheck && npm run lint && npm run test && npm run build && npm run check:home-payload && npm run check:client-budgets && npm run test:e2e"
}
```

- [ ] **Step 4: source boundaryを検索する**

```bash
rg -n "interface (RobotsBrowser|ManufacturersBrowser|UseCasesBrowser|ReportsBrowser|CompareClient)Props" components
rg -n "(robots|manufacturers|useCases|reports): (Robot|Manufacturer|UseCase|Article)\\[\\]" components
```

Expected: 2つ目の検索結果0件。

- [ ] **Step 5: full gateとafter計測を実行する**

```bash
npm run check
node scripts/check-client-budgets.mjs
```

Expected: 4routeがbudget以下、全gate exit 0。

- [ ] **Step 6: baseline文書へafter値を記録する**

routeごとにbefore、after、bytes、percentageを記録する。RSC/HTMLについてもcatalog pageの`.next/server/app/**/index.html`実測値を併記する。

- [ ] **Step 7: commit**

```bash
git add scripts/check-client-budgets.mjs tests/unit/view-models/catalog-serialization.test.ts package.json docs/reference/refactor-baseline-2026-07-26.md
git commit -m "test: enforce catalog client budgets"
```

---

## Phase completion

```bash
npm run check
rg -n "useUrlParamUpdater|motion/react|MiniSearch" \
  components/{RobotsBrowser,ManufacturersBrowser,UseCasesBrowser,ReportsBrowser,RobotCard,ManufacturerCard,UseCaseCard}.tsx
rg -n "(robots|manufacturers|useCases|reports): (Robot|Manufacturer|UseCase|Article)\\[\\]" components
```

Expected: 対象一覧で0件、4route client budget達成、URL back/forward E2E PASS。
