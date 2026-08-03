---
status: plan
updated: 2026-08-03
---

# Phase 6 UI and Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 現行のeditorial broadsheet × product dashboard表現を維持しながら、見出し階層、tabs、carousel、keyboard、focus、responsive layoutを自動検証できる状態にする。

**Architecture:** list/detail/contextual headerのsemantic責務を固定し、見た目のsticky wrapperとは分離する。custom interactionはWAI-ARIAに沿ったbutton/tab/dialogへ揃え、動きはCSSまたはEmblaへ限定する。Playwrightでkeyboard/focus/axe/4 viewportを回帰対象にする。

**Tech Stack:** React 19、Radix UI、Embla Carousel、Playwright、axe-core、Tailwind CSS 4

## Global Constraints

- 全面リデザイン、ブランド色変更、URL変更を行わない。
- 全index/detail routeに一意なH1を1つだけ置く。
- hoverしないと読めない情報や実行できない操作を残さない。
- keyboardだけでtabs、carousel、drawer/dialog、paginationを操作できる。
- autoplayにはpause/resume controlを付ける。
- reduced motion時にautoplay、progress animation、非必須transitionを止める。
- 390 / 768 / 1280 / 1440pxでdocument overflowを許可しない。
- decorative animationを削減しても、情報密度とカード階層は維持する。

---

## Findings from Phase 1 review (not yet actioned)

Phase 1のレビュー中に見つかった、list page header block（breadcrumb + H1 +
description + search）に関する発見。File:lineはPhase 1完了時点（2026-07-28）の
working treeで検証済みで、後続の変更でずれる可能性がある。

- **F6-01**: `components/CompareClient.tsx:313-322`が`PageListHeader`を使わず
  独自headerを実装している。H1が`text-2xl md:text-3xl`（他ページの固定
  `text-2xl`より画面幅次第で大きくなる）、wrapperが`py-8`（Robots/
  Manufacturers/UseCasesは`py-5`、Reportsは`py-4`で、実際には3種類の値が混在）。
  Task 1のFile Structureに`CompareClient.tsx`が含まれていないため、この修正は
  範囲外。Task 1と同様のPageListHeader統一をCompareにも適用するかは別途判断。
- **F6-02**: Reports H1は選択中shelf tabに関わらず常に静的な「記事」。
  shelf別ラベルは`lib/articleShelves.ts`の`ARTICLE_SHELF_TABS`
  （すべて/ニュース/メーカー解説/ロボット解説/基礎知識）に既に存在し、動的H1化に
  転用できる。Task 1のスコープには含まれていない新規提案。
- **F6-03**（Task 1との関係に注意）: Reportsの`description`表示が不要では、
  という未確定のproduct opinionがある。Task 1 Step 2は`description`を明示的に
  保持する設計（`description={uiText.reports.description}`）になっているため、
  このopinionを採用するならTask 1 Step 2の設計変更が必要。矛盾したまま両方を
  計画に残さないこと。

F6-01とF6-02は今回のFile Structure（下記）に未反映のため、着手時に追加が必要。
Task 1 Step 2（Reportsへのaction prop追加）は既にこの計画自身が規定済みであり、
本sectionの対象外。

### 着手時の決定（2026-08-03）

着手前に現行コードへ照合し、未決だった2点を人間が決定した。

- **F6-01 → 採用。** `components/CompareClient.tsx:315-319` は現在も独自headerで、
  `py-8` ＋ `h1 text-2xl md:text-3xl`。他のlist pageは `PageListHeader`（既定 `mb-5`）を
  使う。**Compareも `PageListHeader` へ統一する。** 見出し階層を揃えるのは本phaseの
  目的そのものであり、範囲外にする理由がない。Task 1 の Files へ `CompareClient.tsx` を追加する。
- **F6-03 → 不採用（現状維持）。** Reports の `description` は残す。削除を支持する
  根拠が「未確定のproduct opinion」以上に示されていない。Task 1 Step 2 の設計
  （`description={uiText.reports.description}`）をそのまま実装する。**これで計画内の
  矛盾は解消した。**
- **F6-02 は本phaseでは扱わない。** Reports H1 の動的化（shelf別ラベル）は新規提案で
  あり、Global Constraint「全index/detail routeに一意なH1を1つだけ置く」を満たすのに
  必須ではない。後続phaseへ送る。

### 全タスクの現状突合（2026-08-03 実測）

Task 1 着手後、タスクごとに前提のずれが出たため、**残り全タスクを一度に現行コードへ突合した**。本計画は 2026-07-28 付で、Phase 4・5 とその間のレビュー結果を反映していない。

| Task | 判定 | 根拠（実測） |
|---|---|---|
| 1 | **完了**（`88bccd0` → `04d2ef2` → `f845272`） | H1 は着手時点で9 route とも通っていた。実際の作業は `/reports` と `/compare` の構造統一。着手後にユーザー指摘で検索窓の整列を2回直した |
| 2 | **実施しない** | 下記「Task 2 を実施しない理由」 |
| 3 | **完了**（`e59cdf8` + slide semantics） | `motion/react` 除去は Phase 5 Task 4 で完了済み。本体は pause/resume と現在位置の告知だった |
| 4 | **完了（対象は差し替え）** | 想定していた3ファイルは実測で全てPASS。実際の欠陥は追従バーで、`components/HeaderChrome.tsx` を修正した |
| 5 | **分割。5a 完了（2026-08-03）** | axe の閾値引き上げは現状 **218箇所**の違反で即座に赤くなる。下記参照 |
| 6 | **未着手（内容は確定済み）** | Tasks 1〜5 の結果を反映する。書く項目は Task 6 Step 1 に列挙した |

### e2e の navigation timeout（2026-08-03、再調査中に再発）

テストが59件へ増えた時点で、**3回に1回、毎回別のテストで** `page.goto` が 30秒 timeout する
現象が再発した（41件へ増やした際に `workers: 2` で一度収めたのと同じもの）。

原因はテスト対象の単一 `next start` プロセス。PPR の初回レンダリングは route ごとに実費が
かかり、複数 worker が同じ重い route へ**同時に初回アクセス**すると SSR が詰まる。

timeout を延ばして隠さず、`tests/warmRoutes.ts` を `globalSetup` に置いて
**計測前に各 route を1回ずつ順番に叩き、初回コストを払い切る**形にした。
4回連続で全通過し、実行時間も 38〜42秒 → 20〜22秒で安定した。

**Task 5a で visual regression（12枚 × 撮影）を足すと再び重くなる。** 落ちたらまずここを疑う。

### この突合表の読み方（2026-08-03、失敗の記録）

最初の突合コミット `2ae14c6` は **61行の追記のみで削除が0行**だった。判定基準が
「参照先のファイルが実在するか」であって「**書かれた作業が今も成立するか**」ではなかったため、
本文の矛盾がそのまま残った。Task 4 を「前提のずれなし」としたのがその例で、実際には
同じ文書内の Task 2 の決定（tab semantics を入れない）と正面から矛盾する test 例
（`role="tab"` + 矢印キー）が本文に残っていた。**誤った判定が次の作業範囲を汚染した。**

再調査（2026-08-03）で Task 1・3・5a と File Structure にも同じ腐りを確認し、本文ごと書き直した。
**以降、タスク完了時は「本文のコード例が実装と一致するか」を1行ずつ照合してから判定を書くこと。**

### Task 2 を実施しない理由（2026-08-03、人間が決定）

計画は `PageTabBar` へ `role=tablist` / `role=tab` / roving tabindex を入れるとしているが、**正本ドキュメントがこれを明確に禁じている。**

`docs/decisions/design_system_v1.md:305`:

> hover、focus、clickで選択し、Left/Right/Home/Endを使えるtab semantics（`role=tab` / `aria-selected` / roving tabindex）を持つ。**PageTabBarはページナビ（`aria-current`）でtab semanticsを持たないため流用しない。見た目だけ揃える。**

さらに PR #5（Phase 1）は「an earlier fix had briefly given it（tab semantics）」を `role="group"` + `aria-current` へ **restore した**と記録している。つまり**一度実施して差し戻された変更**である。

設計上の理由: `PageTabBar` が切り替えるのはページ内パネルではなく **URL が変わる絞り込み**（`/reports?kind=news` 等）。WAI-ARIA の tab/tablist は同一ページ内で tabpanel を差し替えるパターンを指し、ナビゲーションには `aria-current` を使うのが正しい。`role="tab"` を付けると支援技術の利用者は「パネルが切り替わる」と予期するが、実際にはページ遷移が起きる。

`design_system_v1.md:305` が tab semantics を求めているのは**ロボット詳細のスペックタブ**で、そちらは実際にパネルを差し替える。混同しないこと。

Global Constraint「keyboardだけでtabsを操作できる」は**既に満たされている**。タブは `<button>` で Tab キーで到達でき Enter/Space で選択できる。矢印キーは `role="group"` のナビゲーションでは必須ではない（roving tabindex は tablist / toolbar / radiogroup 用のパターン）。

**代替:** 現状のキーボード操作が壊れていないことを component テストで固定する（Task 4 に含める）。

### Task 3 の縮小（2026-08-03 実測）

- **`Removes: carousel primitiveの`motion/react`` は達成済み。** Phase 5 Task 4 で除去し、`components/uilayouts/carousel.tsx` の該当は 0 件
- **残る本体は pause/resume control と現在位置の告知。** 着手時点の `NewsHeroCarousel` は `Autoplay({ delay: 5000, stopOnInteraction: true })` を渡すだけで明示的な一時停止手段を持たず、`aria-live` も 0 件だった
- **計画の test 例が参照する `tests/fixtures/articleCatalogFixture` は存在しない。** また `NewsHeroCarousel` の props は Phase 5 Task 8 で `Article[]` から `ArticleCatalogItem[]` へ変わっている。→ **fixture は作らず、e2e で検証する形に変えた**（理由は Task 3 Step 1）

### Task 5 の分割（2026-08-03 実測）

計画は axe の閾値を critical から **serious** へ上げるとしているが、現状の実測は次のとおり。

| route | serious/critical |
|---|---:|
| `/robots` | 96 |
| `/manufacturers` | 85 |
| `/use-cases` | 17 |
| `/` | 16 |
| `/reports` | 3 |
| `/compare` | 1 |

**全件 `color-contrast`。合計218箇所。** そのまま gate 化すると赤いまま入る。Phase 5 が定めた「赤い gate や allowlist を持ち込まない」（違反0の状態で gate を入れる）に反する。

配色そのものの問題であり、`src/app/globals.css` のテーマトークンとデザインシステムに関わる。**テスト追加タスクの範囲を超える。**

したがって Task 5 を2つに分ける。

- **Task 5a（本phaseで実施）:** visual regression（390/768/1280/1440）を追加する。axe は現行の critical 閾値を維持し、対象 route に `/compare` を追加する（現状 critical は 0 件なので緑で入る）
- **Task 5b（後続phaseへ）:** `color-contrast` 218箇所の是正。テーマトークンの見直しを伴うため独立した計画が要る。**Phase 6 では閾値を上げない**

---

### Phase 4・5 完了により不要になった項目（2026-08-03 実測）

本計画は 2026-07-28 付で、Phase 4・5 より前に書かれている。着手時の実測で次が判明した。

| 計画の記述 | 現状 |
|---|---|
| `components/uilayouts/carousel.tsx`「motion削除」 | **Phase 5 Task 4 で完了済み**（`motion/react` 0件） |
| `components/NewsHeroCarousel.tsx` の motion 依存 | **Phase 5 Task 4 で完了済み**（0件。`lib/useMediaQuery.ts` へ置換） |
| `tests/components/` を新規作成 | **既存**（`catalog-url-state.test.tsx` / `google-analytics-page-view.test.tsx`）。追加は新規作成ではなくファイル追加 |
| `tests/e2e/accessibility.spec.ts` を新規作成 | 既存の `tests/e2e/accessibility-smoke.spec.ts` と重複する。**既存を拡張する**形にし、新規ファイルは作らない |

carousel と NewsHeroCarousel は motion 除去済みだが、着手時点で **autoplay の pause/resume control は未実装**だった。Task 3 はこの部分が本体として残り、`e59cdf8` で実装した。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| Path | Responsibility | 状態 |
|---|---|---|
| `components/CarouselAutoplayButton.tsx` | pause/resume control | 作成済（Task 3） |
| `tests/e2e/headings.spec.ts` | H1 uniqueness | 作成済（Task 1） |
| `tests/e2e/carousel-autoplay.spec.ts` | pause/resume・現在位置・slide semantics・reduced motion | 作成済（Task 3） |
| `tests/components/page-tab-bar.test.tsx` | `role="group"` + `aria-current` の固定（tab semantics の再導入を落とす。Task 2 の代替） | 作成済（Task 4） |
| `tests/e2e/keyboard-navigation.spec.ts` | tabs / carousel / pagination / 検索窓 | 作成済（Task 4） |
| `tests/e2e/focus-restoration.spec.ts` | menu / dialog / popover | 作成済（Task 4） |
| `tests/e2e/visual-regression.spec.ts` | 4 viewport screenshots | 作成済（Task 5a） |
| ~~`tests/components/news-hero-carousel.test.tsx`~~ | **作らなかった。** carousel は embla の実挙動（5秒待って進まない等）を見ないと検証にならず、jsdom では測れない。**e2e の `carousel-autoplay.spec.ts` で代替した** | — |
| ~~`tests/e2e/accessibility.spec.ts`~~ | **作らない。** 既存 `accessibility-smoke.spec.ts` を拡張する | — |

### 変更

| Path | Responsibility | 状態 |
|---|---|---|
| `components/PageListHeader.tsx` | 一覧ヘッダの正本。`description: ReactNode`・`headingId`・`items-center` 整列 | 変更済（Task 1） |
| `components/ReportsBrowser.tsx` | list H1/description/search。検索窓を見出し行へ、可視ラベルは持たせない | 変更済（Task 1） |
| `components/CompareClient.tsx` | list header統一（F6-01。**採用決定・Task 1 で完了**） | 変更済（Task 1） |
| `components/NewsHeroCarousel.tsx` | autoplay control・現在位置の告知・slide semantics | 変更済（Task 3） |
| `lib/uiText.ts` | carousel の文言（label / pause / resume / position） | 変更済（Task 3） |
| `components/HeaderChrome.tsx` | フォーカス保持中の追従バーを消さない | 変更済（Task 4） |
| `docs/decisions/design_system_v1.md` | interaction規則・一覧ヘッダ規則 | **未着手（Task 6）** |
| `docs/decisions/ui_architecture_and_development_policy_v1.md` | 実装後のheader/carousel規則 | **未着手（Task 6）** |
| ~~`components/PageTabBar.tsx`~~ | **変更しない**（Task 2 不実施） | — |
| ~~`components/ReportsHeader.tsx`~~ | **変更不要だった。** 元から contextual tabs だけを描画しており、Task 1 で触る必要がなかった | — |
| ~~`components/uilayouts/carousel.tsx`~~ | **変更不要だった。** motion 削除は Phase 5 で完了済み。slide semantics は `Slider` が `{...props}` を透過するため呼び出し側（`NewsHeroCarousel`）だけで足りた | — |
| ~~`components/Header.tsx`~~ | **変更しない**（Task 4 実測でPASS） | — |
| ~~`components/ComparisonRobotPanel.tsx`~~ | **変更しない**（Task 4 実測でPASS。Radix 既定で足りる） | — |
| ~~`components/ui/searchable-dropdown.tsx`~~ | **変更しない**（Task 4 実測でPASS） | — |
| ~~`src/app/globals.css`~~ | **触らない。** 本phaseで一度も変更しておらず、focus-visible / reduced-motion に不具合の実測がない（Task 4 で focus ring は全系統PASS、`motion-reduce:` は各所で機能）。配色は Task 5b。Task 5a の目視で問題が出たときだけ戻す | — |

---

### Task 1: headingとlist header構造を統一する

**Files:**
- Create: `tests/e2e/headings.spec.ts`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `components/PageListHeader.tsx`
- Modify: `components/CompareClient.tsx`（F6-01 の採用決定に伴う。当初 Files に無く、着手時に追加した）
- ~~Modify: `components/ReportsHeader.tsx`~~ — **変更不要だった**（元から contextual tabs だけを描画していた）

**Interfaces:**
- Produces: index/detail routeごとにvisible H1 1件

- [x] **Step 1: H1 uniqueness testを書く**

```ts
// tests/e2e/headings.spec.ts
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
  test(`${route} exposes one visible h1`, async ({ page }) => {
    await page.goto(route);
    const headings = page.getByRole('heading', { level: 1 });
    await expect(headings).toHaveCount(1);
    await expect(headings).toBeVisible();
    await expect(headings).not.toHaveText('');
  });
}
```

- [x] **Step 2: Reports layoutを標準list構造へ合わせる**

`ReportsHeader`はsticky contextual tabsだけを担当する。`ReportsBrowser`はheader直後の`site-container`にBreadcrumbsとPageListHeaderを置く。

```tsx
<div className="site-container py-5">
  <Breadcrumbs items={[{ label: uiText.reports.breadcrumb }]} />
  <PageListHeader
    title={uiText.reports.title}
    description={uiText.reports.description}
    action={
      <SearchInput
        id="reports-search"
        value={query}
        onChange={(nextQuery) =>
          updateParams({ q: nextQuery, [ARTICLE_PAGE_PARAM]: null }, 'replace')
        }
        placeholder={uiText.searchPlaceholders.reports}
      />
    }
  />
</div>
```

> **`label` を渡してはならない（`04d2ef2`）。** 当初この Step は
> `label={uiText.filters.keywordSearch}` を渡す例を載せていたが、**それが不具合の原因だった。**
> `PageListHeader` の行は見出しと action を揃えるので、可視ラベルを付けると
> **ラベルの行**が H1 と揃い、入力欄はその分（実測36px）下へ押し出される。
> `/reports` だけ検索窓が H1 より沈んで説明文へ食い込んで見えていた。
> 他3ページ（robots / manufacturers / use-cases）は元から `label` を渡していない。
> 支援技術には `SearchField` の `aria-label` が届くのでアクセシビリティは落ちない。

旧search専用border bandを削除する。heroとgridのcontainer幅は維持する。

- [x] **Step 3: PageListHeaderのsemantic contractを固定する**

```ts
interface PageListHeaderProps {
  title: string;
  /** 文字列なら <p> で描画。複数要素が要るときだけ node を渡す。 */
  description: ReactNode;
  headingId?: string;
  className?: string;
  action?: ReactNode;
}

export const pageListHeaderDescriptionClassName =
  'text-sm text-muted-foreground max-w-3xl leading-relaxed';
```

H1へ`id={headingId}`を渡し、wrapperを`<header>`へ変更する。nested landmarkを避けるため、呼び出し側で別`header`に入れない。

`description` が `string` ではなく `ReactNode` なのは、`/compare` が画面幅で本文を出し分けるため。
node を渡す側は `pageListHeaderDescriptionClassName` で体裁を揃える。

**整列は `sm:items-center`（`f845272`）。`items-baseline` は使わない。**
action に入るのは検索窓のようなコントロールで、最低タッチ領域 44px を満たすため実測45px あり、
H1 の 32px より 13px 高い。文字基準で揃えるとこの差が上3px・下10px と偏って配分され、
検索窓の下線だけが見出しより下へ垂れる。修正後は上下7pxずつ・中心のずれ0px。

- [x] **Step 4: testと全route smokeを実行する**

```bash
npm run build
npx playwright test tests/e2e/headings.spec.ts tests/e2e/public-routes.spec.ts
```

Expected: 全route H1 1件。

- [x] **Step 5: commit**

実際は3コミットに分かれた。着手後にユーザーが画面で気づいた整列崩れを2回直したため。

```
88bccd0  refactor: unify list page headings and header structure
04d2ef2  fix: drop the visible search label that pushed the reports search out of line
f845272  fix: center list page headings against their search control
```

**教訓:** 検索窓の整列崩れは全gate緑のまま出荷され、人間が画面を見て初めて見つかった。
H1 の**個数**は測っていたが**位置関係**は誰も測っていなかった。Task 5a の visual regression が
埋めるべき穴はここ。

---

### Task 2: 実施しない（2026-08-03 決定）

**この task は実施しない。** 詳細な理由は冒頭「Task 2 を実施しない理由」節。要約:

- `docs/decisions/design_system_v1.md:305` が「**PageTabBar はページナビ（`aria-current`）で tab semantics を持たないため流用しない**」と明記している
- PR #5（Phase 1）は、一度入れた tab semantics を `role="group"` + `aria-current` へ **restore した**と記録している。**一度実施して差し戻された変更**である
- `PageTabBar` が切り替えるのは URL が変わる絞り込みであり、同一ページ内で tabpanel を差し替える tab/tablist パターンには当たらない
- Global Constraint「keyboardだけでtabsを操作できる」は**既に満たされている**（`<button>` なので Tab で到達し Enter/Space で選択できる）

**代替として実施したこと（完了・`0c8d463`）:** `tests/components/page-tab-bar.test.tsx` を Task 4 で追加した。
`role="group"` であること、`role=tab` / `tablist` が **0件**であること、active に `aria-current="page"` が付き
`aria-selected` が付かないこと、全タブが `tabindex` を持たない（roving tabindex でない）こと、
`aria-disabled` のタブが `disabled` 属性を持たずフォーカス可能なままであることを assert する。6件。

方針そのものを変える場合（`PageTabBar` に tab semantics を持たせる）は `design_system_v1.md:305` の書き換えを伴うため、本計画の範囲外。

---

### Task 3: Carouselへpauseと現在位置を追加する

**Files:**
- Create: `components/CarouselAutoplayButton.tsx`
- Create: `tests/e2e/carousel-autoplay.spec.ts`
- Modify: `components/NewsHeroCarousel.tsx`
- Modify: `lib/uiText.ts`
- ~~Create: `tests/components/news-hero-carousel.test.tsx`~~ — **作らなかった**（下記 Step 1）
- ~~Modify: `components/uilayouts/carousel.tsx`~~ — **変更不要だった**（下記 Step 4・5）

**Interfaces:**
- Produces: visible pause/resume button、`aria-live=polite` current position、slide ごとの位置

> **`Removes: carousel primitiveの motion/react` は削除した。** Phase 5 Task 4 で除去済みで、`components/uilayouts/carousel.tsx` の該当は 0 件。

- [x] **Step 1: pause control testを e2e で書く**

> **当初の計画（component test + `articleCatalogFixture` + `@testing-library/user-event` 導入）は採らなかった。**
> 検証したいのは「停止したら本当に5秒たっても進まないか」「reduced motion で autoplay を積まないか」で、
> これは embla の実挙動そのもの。jsdom にはレイアウトもタイマー駆動の transform も無く、
> **測れないものをモックで測る形になる。** `user-event` の新規導入も不要になった（未導入のまま）。

`tests/e2e/carousel-autoplay.spec.ts` に4件。

1. 停止 → 6秒待って `aria-current` のドットが動かない → 再開でラベルが戻る
2. 現在位置が `aria-live` で `N件中1件目` と読める → ドット操作で `N件中3件目` へ
3. 各スライドが `role="group"` + `aria-roledescription="slide"` + 自分の位置を持つ
4. reduced motion では autoplay を積まないので**停止ボタン自体を描画しない**（操作対象が無い）

- [x] **Step 2: reduced motion のときは autoplay plugin を積まない**

```ts
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
const autoplayPlugins = useMemo(
  () => (prefersReducedMotion ? [] : [Autoplay({ delay: 5000, stopOnInteraction: true })]),
  [prefersReducedMotion],
);
```

> **当初の `useRef(Autoplay(...))` + `useEffect` で stop する形は採らなかった。**
> plugin を積んでから止めるより、積まない方が状態が1つ減る。停止ボタンも
> 「plugin が無ければ null を返す」だけで済む（操作対象が無いのにボタンを出さない）。

- [x] **Step 3: visible controlを追加する**

```tsx
// components/CarouselAutoplayButton.tsx
export function CarouselAutoplayButton({ className }: { className?: string }) {
  const { emblaApi } = useCarousel();
  const autoplay = emblaApi?.plugins()?.autoplay;
  const [isPlaying, setIsPlaying] = useState(true);
  // ...
  if (!autoplay) return null;   // reduced motion 等
}
```

> **props は `{ playing, onToggle }` ではなく `{ className }` だけ。**
> 当初案は親に state を持たせる形だったが、`<Carousel>` の context から `emblaApi` を
> 取れるので、親は `<CarouselAutoplayButton />` と置くだけでよい。
>
> **実装中に判明した重要な挙動（`e59cdf8`）:** embla の `autoplay:play` / `autoplay:stop`
> イベントが listener へ届かず、`stop()` は効いている（6.5秒進まない）のにボタンの表示だけが
> 古いまま残る事象を実測した。`useSyncExternalStore` でも `emblaApi.on(...)` でも再現。
> **クリックハンドラ内で state を直接更新する**ことで解決した。event 購読も残してあるが従。
> ここを「イベントに任せる」形へ戻すと表示が壊れる。

文言は `uiText.home.carousel` に置く。`自動再生を停止する` / `自動再生を再開する`
（当初案の `自動再生を停止` / `自動再生を開始` ではない）。表示は Pause / Play アイコン。

- [x] **Step 4: slide semanticsとcurrent announcementを追加する**

現在位置は `uiText.home.carousel.position` = `${total}件中${current}件目`
（当初案の `${index + 1} / ${count}` ではない。日本語UIに合わせた）。

```tsx
<p aria-live="polite" aria-atomic="true" className="sr-only">
  {uiText.home.carousel.position(selectedIndex + 1, total)}
</p>
```

slide semantics は **`Slider` が `{...props}` を透過するので呼び出し側だけで足りる**
（`carousel.tsx` の変更は不要だった）。全スライドが同時に DOM にあり、live region は
位置が「変わったとき」しか鳴らないため、1枚ずつが自分の位置を持つ。

```tsx
<Slider role="group" aria-roledescription="slide"
        aria-label={uiText.home.carousel.position(index + 1, reports.length)}>
```

> **dot button の `aria-label` は変更しない。** 当初案は `${index + 1}枚目を表示` としていたが、
> 既存の `スライド ${index + 1} へ` で用は足りており、変えると既存テストが落ちるだけで
> 利用者の得が無い。

- [x] ~~**Step 5: carousel primitiveからmotionを外す**~~

**Phase 5 Task 4 で完了済み。** `components/uilayouts/carousel.tsx` の `motion/react` は 0 件。

- [x] **Step 6: testを実行する**

```bash
npm run build
npx playwright test tests/e2e/carousel-autoplay.spec.ts tests/e2e/keyboard-navigation.spec.ts
```

- [x] **Step 7: commit**

```
e59cdf8  feat: add a pause control and position announcement to the hero carousel
```

slide semantics は再調査（2026-08-03）で本 Step のやり残しとして見つかり、後追いで実装した。

---

### Task 4: Focus restorationとkeyboard journeyを固定する

**Files:**
- Create: `tests/e2e/keyboard-navigation.spec.ts`
- Create: `tests/e2e/focus-restoration.spec.ts`
- Create: `tests/components/page-tab-bar.test.tsx`（Task 2 の代替）
- Modify: `components/HeaderChrome.tsx`（実測で見つかった唯一の欠陥）
- ~~Modify: `components/Header.tsx` / `components/ComparisonRobotPanel.tsx` / `components/ui/searchable-dropdown.tsx`~~ — **実測で全てPASS。変更しない**

**Interfaces:**
- Consumes: mobile menu、compare dialog、searchable dropdown、追従ヘッダ内の絞り込みタブ
- Produces: open時focus移動、Escape close、triggerへfocus restoration、フォーカス保持中の領域を消さない契約

- [x] **Step 1: focus E2Eを書く**

対象は3系統（モバイルメニュー＝自前実装、比較の詳細ドロワー＝Radix Dialog、検索つきドロップダウン＝Radix Popover）。
各系統で「開いたら中へfocusが入る」「Escapeでtriggerへ戻る」「選択後もtriggerへ戻る」を書く。

locatorの注意: Radix Select の trigger も `role="combobox"` を持つため、検索欄は
名前（`メーカーの選択肢を検索`）で特定しないと strict mode violation になる。

- [x] **Step 2: keyboard journeyを書く**

**計画時のtest例（`role="tab"` + 矢印キー）は使えない。** Task 2 を実施しないと決めたため、
絞り込みタブは `role="group"` + `aria-current` のままである。正しい操作系は
**Tab で到達し Enter で選ぶ**で、矢印キーではない。テストはその契約を検証する。
意味論そのものは `tests/components/page-tab-bar.test.tsx`（Task 2 の代替）が固定する。

もうひとつの前提ずれ: **記事の絞り込みタブは追従ヘッダの中だけにあり、
少しスクロールするまで DOM に存在しない**（`ContextualPageHeader` → `HeaderStickyBarSlot`）。
テストは実利用と同じく先にスクロールして出す。

- [x] **Step 3: 現行Radix/native focus behaviorを実測する**

```bash
npm run build
npx playwright test tests/e2e/focus-restoration.spec.ts tests/e2e/keyboard-navigation.spec.ts
```

結果（2026-08-03）。**Step 4 で想定していた3ファイルはいずれも欠陥なし。**

| surface | 実測 |
|---|---|
| モバイルメニュー（`Header.tsx`） | PASS。既存の `restoreFocusRef` + rAF で正しく戻る |
| 比較の詳細ドロワー（Radix Dialog） | PASS。Radix 既定の focus 復帰で足りる |
| 検索つきドロップダウン（Radix Popover） | PASS |
| 追従ヘッダ内の絞り込みタブ | **FAIL** |

- [x] **Step 4: focus欠陥を修正する**

実測で見つかった欠陥はひとつだけで、想定していた場所ではなかった。

**症状:** 記事一覧で絞り込みタブをキーボードで選ぶと、フォーカスが `body` へ落ちる。

```
選択前  scrollY 400   docHeight 1932   role=group 1個
選択後  scrollY 0     docHeight 1479   role=group 0個   activeElement BODY
```

**機序:** 絞り込むとヒーローが消える → scroll anchoring がページ先頭へ戻す → `scrollY` が 0 になり
追従バーが非表示条件に入る → 押したばかりのタブごと DOM から外れる。
キーボード利用者は絞り込むたびに文書の先頭から Tab をやり直すことになる。

**修正:** `components/HeaderChrome.tsx` の `HeaderStickyBarSlot` が、
**キーボードフォーカスを保持している間はバーを消さない**ようにする。
個別ページではなく追従バーの機構側で守る（全カタログページに効く）。

判定は `:focus-visible` に限る。クリックでもボタンはフォーカスを受け取るため、
単に「フォーカスがある」で判定するとマウス利用者にもバーが残り続ける。
両方向をテストで固定する（キーボード＝残す / ポインタ＝従来どおり消える）。

- [x] **Step 5: testsとcommit**

```bash
npm run check
git add components/HeaderChrome.tsx tests/e2e/focus-restoration.spec.ts \
        tests/e2e/keyboard-navigation.spec.ts tests/components/page-tab-bar.test.tsx
git commit -m "fix: keep the sticky filter bar alive while it holds keyboard focus"
```

**結果:** unit 59 passed / e2e 57 passed / lint 0 errors（既存warning 4件のみ）。

**Task 6 へ持ち越す観察:** 絞り込みタブの置き場所がページ間で揃っていない。
`/reports` は追従ヘッダの中だけ（先頭からは Tab で到達できない）、`/robots` は本文に直置き。
到達性の差は規定の空白から来ているので、Task 6 で扱う。

---

### Task 5a: 4 viewport visual regressionを追加する（axeの閾値は上げない）

**Files:**
- ~~Create: `tests/e2e/accessibility.spec.ts`~~ — **作らない。** 既存 `tests/e2e/accessibility-smoke.spec.ts` を拡張する
- Modify: `tests/e2e/accessibility-smoke.spec.ts`（`/compare` を対象に追加。閾値は critical のまま）
- Create: `tests/e2e/visual-regression.spec.ts`
- Create: `tests/e2e/visual-regression.spec.ts-snapshots/*`
- Modify: `playwright.config.ts`
- ~~Modify: `src/app/globals.css`~~ — 配色の是正は Task 5b。ここでは触らない

**Interfaces:**
- Produces: 390/768/1280/1440 visual snapshots、既存 axe gate への `/compare` 追加

> **axe の閾値は critical のまま維持する。** 計画は serious へ上げるとしていたが、実測で全6 route に
> `color-contrast` 違反が **218箇所**ある（`/robots` 96・`/manufacturers` 85・`/use-cases` 17・
> `/` 16・`/reports` 3・`/compare` 1）。そのまま gate 化すると赤いまま入り、Phase 5 が定めた
> 「違反0の状態で gate を入れる」に反する。配色は `src/app/globals.css` のテーマトークンの問題で、
> テスト追加タスクの範囲を超える。**Task 5b として後続phaseへ送る**（index の繰り越し表に起票済み）。
>
> **新規ファイル `tests/e2e/accessibility.spec.ts` は作らない。** 既存の
> `tests/e2e/accessibility-smoke.spec.ts` と重複するため、そちらへ `/compare` を足す。

- [x] **Step 1: 既存 axe gate に `/compare` を足す**

`tests/e2e/accessibility-smoke.spec.ts` の route 配列へ `/compare` を追加するだけ。
**閾値は `critical` のまま**で、`serious` へは上げない（理由は上のブロック）。
`/compare` の critical は現状 0 件なので緑で入る。

- [x] **Step 2: visual testを追加する**

```ts
// tests/e2e/visual-regression.spec.ts
import { expect, test } from '@playwright/test';

const viewports = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  for (const route of ['/', '/robots', '/reports'] as const) {
    test(`${route} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const filename = `${route === '/' ? 'home' : route.slice(1)}-${viewport.name}.png`;
      await expect(page.locator('main')).toHaveScreenshot(filename, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}
```

着手前に確認済み（2026-08-03）:

- `page.locator('main')` は成立する（`src/app/layout.tsx:66` に `<main id="main-content">`）
- `emulateMedia({ reducedMotion: 'reduce' })` で carousel は autoplay plugin を積まない（Task 3 Step 2）ため、
  スクリーンショットは常に1枚目で安定する。**これを外すと撮影ごとにスライドが変わって落ちる**
- `/reports` の1ページあたり件数は `useArticlesPerPage()` で画面幅により変わる。
  viewport ごとに baseline を持つので問題ないが、**同じ baseline を使い回さないこと**

- [x] **Step 3: baseline snapshotsをreview付きで生成する**

```bash
npm run build
npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
```

12枚を目視し、overflow、重なり、切れ、H1/search/tabs/mapの欠落がないことを確認してからcommitする。

**結果（2026-08-03、人間レビュー済み）:** Home・Reportsは4幅ともoverflow/重なり/切れ/欠落なし。
`/robots` のみ、768pxで`lib/catalogLayoutClasses.ts:3`のgrid-cols-2が1024pxまで据え置きのため、
390px/1280pxの約2倍（14714px対7013px/7090px）縦長になる点を発見。overflow等の4分類には
該当せず、独立した設計判断（列数breakpointの追加）が要るため**今回は直さないと人間が決定**。
index の繰り越し表（#7）に起票済み。

- [x] **Step 4: 目視で見つかった responsive 差分だけ修正する**

修正対象は overflow / 重なり / 切れ / 要素の欠落。

**`color-contrast` はここで直さない**（Task 5b。テーマトークンの見直しを伴う）。
新規色を直書きせず既存semantic tokenを使う。意図したvisual差分だけsnapshotを更新する。

**結果:** 修正対象の欠陥は見つからなかった（上記Step 3参照）。baselineをそのままcommitした。

- [x] **Step 5: full UI gateを実行する**

```bash
npm run check
```

Expected: 全test PASS。

**結果:** unit 59 passed / e2e 72 passed（既存59 + visual-regression 12 + `/compare` axe 1） / lint 0 errors（既存warning 4件のみ）。

- [x] **Step 6: commit**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: add accessibility and responsive visual gates"
```

**結果:** `playwright.config.ts` の変更は不要だった（既定設定のままで全12テスト安定）。
実際のcommitは `4929fc1`（test変更）+ `a74d92d`（docs: 未push記述の是正と繰り越し#7の起票）。

---

### Task 6: UI decision docsを実装へ合わせる

**Files:**
- Modify: `docs/decisions/ui_architecture_and_development_policy_v1.md`
- Modify: `docs/decisions/design_system_v1.md`

**Interfaces:**
- Consumes: Tasks 1〜5の実装
- Produces: current UI rules

- [ ] **Step 1: current rulesを更新する**

次をdecisionへ明記する。**このタスクの本体は「Task 1・4 で塞いだ実装のずれを、規定として書く」こと。**
規定が無いままだと同じずれがまた出る（実際 `/reports` と `/compare` は独自ヘッダを持っていた）。

- `PageListHeader`: 一覧ヘッダは必ずこれを使い、独自実装を作らない。構成は H1（24px）＋右に action ＋下に説明文
- **一覧ヘッダの整列（Task 1 で判明。現状 decision に記述ゼロ）**
  - 見出しと action は **箱の中央**（`items-center`）で揃える。`items-baseline` は使わない
  - 理由: action に入るのは検索窓などのコントロールで、最低タッチ領域 44px を満たすため実測45px あり、H1 の 32px より 13px 高い。文字基準で揃えるとこの差が上3px・下10px と偏り、検索窓の下線だけが見出しより下へ垂れる
  - 一覧の検索窓に可視ラベルを付けない（`aria-label` で代替）。ラベル分の高さがヘッダ行の整列を崩す
- `ContextualPageHeader`: sticky filter/tabs、H1を持たない
- **追従バーのフォーカス契約（Task 4 で判明）**
  - キーボードフォーカスを保持している領域を、スクロール量だけで消してはならない
  - 判定は `:focus-visible` に限る（クリックでもボタンはフォーカスを受け取るため、ポインタ利用者にバーが残り続けてしまう）
- `PageTabBar`: ページナビ semantics（`role="group"` + `aria-current`）。tab semantics は持たない
- **絞り込みタブの置き場所**: `/reports` は追従ヘッダの中だけ（先頭から Tab で到達できない）、`/robots` は本文に直置きで揃っていない。どちらを標準とするか決めて書く
- carousel: prev/next + pause/resume + current position
- card: pointer追従tiltをlist標準にしない
- focus: modal/popover close後はtriggerへ復元
- visual regression viewports: 390/768/1280/1440

存在しない旧Guides route/class名はcurrent sectionから削除し、履歴として必要なら`docs/reference/`へ移す。

- [ ] **Step 2: docs linkと全gateを実行する**

```bash
npm run check
git diff --check
```

- [ ] **Step 3: commit**

```bash
git add docs/decisions/ui_architecture_and_development_policy_v1.md docs/decisions/design_system_v1.md
git commit -m "docs: align ui policy with accessible interactions"
```

---

## Phase completion

```bash
npm run check
rg -n "motion/react" components/uilayouts/carousel.tsx components/NewsHeroCarousel.tsx
git diff --check
```

Expected: H1、keyboard、focus、axe、4 viewport testsがすべてPASSし、carousel primitiveのmotion import 0件。
