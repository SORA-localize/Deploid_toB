---
status: plan
updated: 2026-08-01
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

### Catalog検索範囲（2026-07-31決定、2026-08-01改訂）

**原則:** catalog view modelの`searchText`は、**そのcardが実際に描画する文字列**と**その一覧のfacet選択肢のlabel**だけを対象とする。詳細ページにしか無い本文は一覧の検索対象にしない。id、slug、内部enum値は表示もfacet labelでもないため含めない（enumはlabel経由で引ける）。

`lib/search.ts`の`create*SearchDocument()`は本文fieldを`fields`に含む。これをそのまま連結してVMへ載せると上のGlobal Constraintに反する。実測値:

| route | VM全体 | うちsearchText | 本文除外時の削減 |
|---|---|---|---|
| `/robots`（57件） | 67,185字 | 28,357字（42.2%） | VM全体の **-27.7%** |
| `/manufacturers`（25件） | 24,171字 | 11,401字（47.2%） | VM全体の **-38.8%** |

したがってcatalogの`searchText`は`lib/search.ts`のsearch documentを再利用せず、`lib/catalog/search.ts`がcollectionごとに対象fieldを明示的に列挙して生成する。

**この表は実データ（`data/types.ts`の型定義とcard componentの描画内容）と突き合わせて作成すること。** 初版はrobots／manufacturersのみ実測で決め、use-cases／reportsを実データ確認なしに横展開した結果、存在しないfield名を書き、実際に存在する本文fieldを取りこぼした。

| collection | searchTextへ含める | 含めない |
|---|---|---|
| robots | 機種名（`nameJa`/`name`）、メーカー名、`distributorJapan`、category／stage／readiness／availability／mobility／procurementの各label、card facts（用途・サイズ・価格・稼働時間）の値、`industryTags`、`taskTags` | `summary`、`description`、`comparison.*`、`supportNote`、`safetyNote`、`vendorRiskNote`、`manufacturerId`（内部id） |
| manufacturers | 社名（`nameJa`/`name`）、`country`、`hqCity`、`foundedYear`、国内代理店名、取扱ロボット名、companyType／companyStatus／japanPresenceのlabel | `description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、代理店`note` |
| use-cases | `titleJa`/`title`、`subtitle`、`summary`（`UseCaseCard.tsx:68`が`subtitle ?? summary`を描画）、maturity label、代表ロボット名、`primaryIndustry`、`industryTags`、`taskTags` | `overview`、`whyItMatters`、`whyHardToday`、`environmentRequirements`、`japanDeploymentConditions`、`capabilityNotes`、`sources` |
| reports | `titleJa`/`title`、`summary`、種別label、`themeTags` | `whyItMatters`、`keyTakeaways`、`body`、`manufacturerGuideContent`、`sources` |

`UseCase`に`description`fieldは存在しない（実フィールドは`subtitle?`／`summary`／`overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`）。report側の本文は`body`／`manufacturerGuideContent`ではなく`whyItMatters`／`keyTakeaways`が`createReportSearchDocument`へ入っている。

reportsの`summary`を全件持つ理由は「cardに表示するから」では**ない**。`NewsCard`は`summary`を描画せず、描画するのは`NewsFeatureCard.tsx:54`と`NewsHeroCarousel.tsx:131`、つまりhero/featureに選ばれた数件だけである。それでも全件に持たせるのは、**placementがserver側で決まりVMの形をplacement依存にしたくないため、かつ記事数が少なく全件保持のコストが許容範囲だから**。この理由付けを誤ると、次に同じ判断をする人が誤って一般化する。

**受け入れるトレードオフ（2件、別々の劣化）:**

1. **本文検索の喪失。** 一覧の検索範囲は現行より狭くなる。現在は紹介文中の語（例「バッテリー」）でも部分一致でhitするが、今後はhitしない。**このサイトには全体検索ページが存在しない**（`src/app`に`search`ルート無し）ため、一覧から本文検索を外すとサイトから本文検索が完全に消える。退避先は無い。robots／manufacturersの現行実装は関連度ranking無しの単純部分一致（`lib/search.ts`の`matchesSearchDocument`）であり、注記中の一語が偶然一致した無関係なrecordが機種名一致と同列に並ぶ状態でもある。
2. **MiniSearchの喪失（reports／use-casesのみ、本文除外とは独立した劣化）。** `lib/searchIndex.ts`はMiniSearchを`prefix: true`、`fuzzy: 0.2`、`combineWith: 'AND'`、`Intl.Segmenter('ja')`の語境界分割で構成し、`ReportsBrowser.tsx:58`と`UseCasesBrowser.tsx:121`が使用している。Task 3はこれを`includes()`部分一致へ置換するため、**タイポ許容と日本語の語境界分割を失う**（例:「ロボット導入」で「ロボットの導入」がhitしなくなる）。これはsearchTextのfield絞り込みとは直交する判断であり（whitelist後のfieldだけをMiniSearchで索引することも技術的には可能）、first-load JS 30%削減のためMiniSearch（80KBのES module）をclient bundleから外す判断として**廃止を採用する**（2026-08-01決定）。

本文全文検索を復活させる場合、build時生成の静的JSONを`public/`へ置き検索窓focus時にfetchする方式が「API routeを追加しない」制約下でも成立する（first-load JSにもRSC payloadにも乗らない）。本phaseのscope外とし、後続phaseの独立taskとして起票する。

**検索窓placeholder:** `lib/uiText.ts`のrobots「ロボット名・メーカー・用途キーワードで検索」とmanufacturers「メーカー名・地域・取扱ロボットで検索」は本決定後の挙動と整合するため変更しない。reportsの「タイトル・トピック・キーワードで検索」は本文検索を想起させるため、Task 3で文言を再検討する。0件時の空状態文言も併せて確認する。

**CMS移行との関係:** whitelistを明示列挙する形にしておくと、将来PostgreSQLの全文検索（`tsvector`／`pg_trgm`）へ移る際に「どのcolumnを索引するか」の仕様がそのまま引き継げる。汎用search documentの再利用のままだと移行時に同じ判断をやり直すことになる。

**`lib/search.ts`／`lib/searchIndex.ts`の行き先:** catalogがこれらを使わなくなると`createReportSearchDocument`等の利用者が消える。Task 3完了時点で残存利用者を`rg`で洗い出し、削除するか後続phaseの削除対象として記録するかを決める。放置すると「2つの検索定義が併存し片方だけメンテされる」という次の事故の種になる。

### 制約のゲート設計

`searchText`の肥大は**Task 5の`check-client-budgets.mjs`では検知できない**。同scriptが見るのは`firstLoadUncompressedJsBytes`（JS chunkのサイズ）だが、server componentからclient componentへ渡るprops（VM）はJS chunkではなくRSC flight payloadに載るためである。実測でも、Task 2適用後の`/robots`のVMデータはJS chunkにもprerendered HTMLにも現れない（PPRでrequest時にstreamされる）。

したがって次の3層で守る。**「一番壊れやすい制約のゲートは、その制約に最初に触れるtaskへ置く」**をこのplanの構造ルールとする。

1. **payload文字数budget（Task 2で導入）** — `scripts/check-home-payload.mjs`（`.next/server/app/index.html`のバイト数をgateする既存の先例）と同形の`scripts/check-catalog-payload.mjs`を作る。何が増えても発火するため、field列挙の抜けに依存しない。
2. **import境界の遮断（Task 2で導入）** — `lib/viewModels/**`から`lib/search.ts`／`lib/searchIndex.ts`のimportを禁止する。今回の事故の根本原因は「汎用search documentの再利用」であり、ここを機械的に止めるのが最も効く。既存の`scripts/check-data-import-boundaries.mjs`と同形。
3. **正規化を揃えた本文値assertion（Task 2／3／5）** — 下記の通り両辺を同じ関数で正規化する。

**値assertionの正規化について（重要）:** `expect(JSON.stringify(vm)).not.toContain(rawText)`は**実測で7.9%取りこぼす**。現行の違反実装に対し12文字以上の本文値343件を検査したところ、343件すべてが実際にsearchTextへ含まれているのに、raw文字列比較で検出できたのは316件だった。原因は`createSearchDocument`→`uniqueSearchValues`が各値に`.normalize('NFKC').trim()`をかけるため、全角括弧・全角数字を含む本文が原文と一致しないこと（例「移動速度3.3m/s（潜在能力5m/s超）」）。加えて新builderは連結後に`normalizeSearchText`（`toLowerCase()`を含む）をかけるためASCIIを含む本文はほぼ全て素通りし、`JSON.stringify`のescape（`"`／`\n`／`\\`）でも一致しなくなる。必ず両辺を同じ関数で正規化し、JSON文字列ではなく`searchText`自体を対象にすること。

```ts
const haystack = normalizeSearchText(items.map((i) => i.filter.searchText).join(' '));
expect(haystack).not.toContain(normalizeSearchText(text));
```

### searchTextの重複排除

whitelist後の`searchText`は、その大半が**同じitem内に既にserialize済みのデータの重複**である（実測: robotsのwhitelist searchText 7,346字のうち、VMに存在しないのは3,065字のみ）。`searchText`をVMに持たせず、client側で`item.name`／`manufacturer.name`／`stage.label`／`facts.map((f) => f.value)`／`filter.industryTags`からhaystackを組み、VMに無い分（英語名、`taskTags`、`distributorJapan`、各label）だけを`searchExtra`として持たせれば、robotsでさらに約4,300字削減できる。57件×20field程度の`includes`は1キーストロークあたり無視できるコストであり、`useMemo`でitems単位にmemo化できる。

原則としても整合する。「cardに表示する情報を検索対象にする」なら、その情報は既にpropsにある。別fieldへ文字列copyを作るのは原則の自己矛盾である。Task 2で採用する。

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
- Create: `scripts/check-catalog-payload.mjs`
- Create: `tests/unit/view-models/robots.test.ts`
- Create: `tests/unit/view-models/manufacturers.test.ts`
- Modify: `scripts/check-data-import-boundaries.mjs`（`lib/viewModels/**`→`lib/search.ts`／`lib/searchIndex.ts`のimport禁止を追加）
- Modify: `package.json`（`check:catalog-payload`を追加し`check`へ組み込む）
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
    // JSON文字列ではなくsearchText自体を、両辺同じ関数で正規化して比較する。
    // raw文字列比較では実測7.9%取りこぼす（Global Constraints「制約のゲート設計」参照）。
    const haystack = normalizeSearchText(
      items.map((item) => item.filter.searchText).join(' '),
    );
    for (const robot of getRobots()) {
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
        expect(haystack).not.toContain(normalizeSearchText(text));
      }
    }
  });
});
```

Manufacturer testは`"sources"`、`"headquarters"`、`"description"`、`"notes"`がJSONに含まれないことをassertする。両testで`"sourceUrl"`と`"rights"`も含まれないことをassertし、表示用logo/imageだけがserializeされることを固定する。Manufacturer側にも同じ正規化済み本文値assertionを置き、`description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、代理店`note`の実値が現れないことを固定する。

短い文字列は他fieldと偶然一致しうるため、値assertionは12文字以上のものだけを対象とする。

このassertionは「今の型にある本文field」を人手で列挙しているため、fieldが増えても追随しない。そのためStep 2ではpayload budgetとimport境界も併せて導入する（下記Step 2b）。

- [ ] **Step 2b: payload budgetとimport境界を導入する**

`scripts/check-catalog-payload.mjs`を`scripts/check-home-payload.mjs`と同形で作る。5 factoryの出力を`JSON.stringify`し、collectionごとに文字数上限をgateする。初期値は本文除外後の実測値に約15%の余裕を足して設定し、実測値と併せてcommit messageへ残す。

`scripts/check-data-import-boundaries.mjs`へ、`lib/viewModels/**`が`lib/search.ts`／`lib/searchIndex.ts`をimportしないruleを追加する。今回の事故の根本原因は汎用search documentの再利用であり、これを機械的に止める。`lib/catalog/search.ts`は`normalizeSearchText`のためにimportしてよい（対象fieldを自前で列挙するfileであり、search documentは使わない）。

`package.json`へ`check:catalog-payload`を追加し、`check`のpipelineへ`check:home-payload`の直後に挿入する。

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

対象fieldはGlobal Constraintsの「Catalog検索範囲」表に従う。use-caseは`subtitle`／`summary`（`UseCaseCard`が`subtitle ?? summary`を描画）まで、reportは`summary`までを含め、`overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`／`keyTakeaways`／`body`／`manufacturerGuideContent`／`sources`は含めない。`UseCase`に`description`fieldは存在しない。

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

Task 2と同じく、両testに**正規化を揃えた**本文値assertionを置く（両辺`normalizeSearchText`、対象はJSON文字列ではなくsearch text自体）。

- use-case: `overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`
- article: `whyItMatters`／`keyTakeaways`／`body`／`manufacturerGuideContent`

`whyItMatters`と`keyTakeaways`が`createReportSearchDocument`の実際の本文fieldであり、初版planが挙げていた`body`／`manufacturerGuideContent`はそこに入っていない。両方をassertion対象に含める。

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

これはGlobal Constraintsの「受け入れるトレードオフ」2で決定済みの**独立した機能劣化**である。タイポ許容（`fuzzy: 0.2`）と`Intl.Segmenter('ja')`による日本語語境界分割を失うため、置換前後で代表queryの挙動差をこのtaskのcommit messageへ記録する。併せてreportsの検索placeholder（`lib/uiText.ts`の「タイトル・トピック・キーワードで検索」）が本文検索を想起させないか再検討し、0件時の空状態文言も確認する。

`MiniSearch`をclient graphから外した後、`lib/searchIndex.ts`と`lib/search.ts`の残存利用者を`rg`で洗い出す。利用者が消えるexportは、このtaskで削除するか後続phaseの削除対象として文書化するかを決める（放置すると検索定義が二重に残る）。

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

key名assertionに加えて、**本文値のaggregate assertion**も置く。全collectionの本文fieldから12文字以上の実値を集め、5 factoryいずれのsearch textにも現れないことを固定する。

- robot: `description`／`summary`／`comparison.*`／`supportNote`／`safetyNote`／`vendorRiskNote`
- manufacturer: `description`／`distributorNote`／`supportNote`／`procurementNote`／`vendorRiskNote`／代理店`note`
- use-case: `overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`
- article: `whyItMatters`／`keyTakeaways`／`body`／`manufacturerGuideContent`

比較は必ず**両辺を`normalizeSearchText`で正規化**し、JSON文字列ではなくsearch text自体を対象にする（raw文字列比較は実測7.9%取りこぼす。Global Constraints「制約のゲート設計」参照）。

このassertionは人手のfield列挙に依存するため単独では不十分であり、Task 2で導入した`check:catalog-payload`（文字数budget）と`check:data-boundaries`のimport禁止ruleと合わせて3層で守る。Task 5ではこの3つが`npm run check`に揃って組み込まれていることを確認する。

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
rg -n "from '@/lib/search'|from '@/lib/searchIndex'" lib/viewModels
```

Expected: 対象一覧で0件、`lib/viewModels`からのsearch module import 0件、4route client budget達成、catalog payload budget達成、URL back/forward E2E PASS。

`npm run check`のpipelineに`check:catalog-payload`（Task 2導入）と`check:client-budgets`（Task 5導入）の両方が含まれていることを確認する。前者はRSC payload、後者はJS chunkを測る別軸のgateであり、片方だけでは本phaseの制約を守れない。
