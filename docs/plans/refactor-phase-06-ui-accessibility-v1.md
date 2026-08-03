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
| 1 | **完了**（`88bccd0`） | H1 は着手時点で9 route とも通っていた。実際の作業は `/reports` と `/compare` の構造統一 |
| 2 | **実施しない** | 下記「Task 2 を実施しない理由」 |
| 3 | **縮小して実施** | `motion/react` 除去は Phase 5 Task 4 で完了済み。残るのは pause/resume と現在位置の告知 |
| 4 | **完了（対象は差し替え）** | 想定していた3ファイルは実測で全てPASS。実際の欠陥は追従バーで、`components/HeaderChrome.tsx` を修正した |
| 5 | **分割して実施** | axe の閾値引き上げは現状 **218箇所**の違反で即座に赤くなる。下記参照 |
| 6 | **実施** | Tasks 1〜5 の結果を反映する。内容は着手時に確定する |

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
- **残る本体は pause/resume control と現在位置の告知。** `components/NewsHeroCarousel.tsx:69` は `Autoplay({ delay: 5000, stopOnInteraction: true })` を渡すだけで明示的な一時停止手段を持たず、`aria-live` も 0 件
- **計画の test 例が参照する `tests/fixtures/articleCatalogFixture` は存在しない。** また `NewsHeroCarousel` の props は Phase 5 Task 8 で `Article[]` から `ArticleCatalogItem[]` へ変わっている。fixture は新しい型で作る

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

carousel と NewsHeroCarousel は motion 除去済みだが、**autoplay の pause/resume control は未実装**である（`components/NewsHeroCarousel.tsx:69` は `Autoplay({ delay: 5000, stopOnInteraction: true })` を渡すだけで、明示的な一時停止ボタンを持たない）。Task 3 はこの部分が本体として残る。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `components/CarouselAutoplayButton.tsx` | pause/resume control |
| `tests/components/page-tab-bar.test.tsx` | `role="group"` + `aria-current` の固定（tab semantics の再導入を落とす。Task 2 の代替） |
| `tests/components/news-hero-carousel.test.tsx` | pause/reduced motion |
| `tests/e2e/headings.spec.ts` | H1 uniqueness |
| `tests/e2e/keyboard-navigation.spec.ts` | tabs/carousel/pagination |
| `tests/e2e/focus-restoration.spec.ts` | menu/dialog/popover |
| ~~`tests/e2e/accessibility.spec.ts`~~ | **作らない。** 既存 `accessibility-smoke.spec.ts` を拡張する |
| `tests/e2e/visual-regression.spec.ts` | 4 viewport screenshots |

### 変更

| Path | Responsibility |
|---|---|
| ~~`components/PageTabBar.tsx`~~ | **変更しない**（Task 2 不実施） |
| `components/ReportsHeader.tsx` | contextual tabsのみ |
| `components/ReportsBrowser.tsx` | list H1/description/search |
| `components/CompareClient.tsx` | list header統一（F6-01。**採用決定・Task 1 で完了**） |
| `components/NewsHeroCarousel.tsx` | autoplay state/control |
| `components/uilayouts/carousel.tsx` | semantic slides/dots（motion削除は Phase 5 で完了済み） |
| ~~`components/Header.tsx`~~ | **変更しない**（Task 4 実測でPASS） |
| ~~`components/ComparisonRobotPanel.tsx`~~ | **変更しない**（Task 4 実測でPASS。Radix 既定で足りる） |
| ~~`components/ui/searchable-dropdown.tsx`~~ | **変更しない**（Task 4 実測でPASS） |
| `components/HeaderChrome.tsx` | フォーカス保持中の追従バーを消さない（Task 4 で実施） |
| `src/app/globals.css` | focus-visible/reduced-motion調整 |
| `docs/decisions/ui_architecture_and_development_policy_v1.md` | 実装後のheader/carousel規則 |
| `docs/decisions/design_system_v1.md` | interaction規則 |

---

### Task 1: headingとlist header構造を統一する

**Files:**
- Create: `tests/e2e/headings.spec.ts`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `components/ReportsHeader.tsx`
- Modify: `components/PageListHeader.tsx`

**Interfaces:**
- Produces: index/detail routeごとにvisible H1 1件

- [ ] **Step 1: H1 uniqueness testを書く**

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

- [ ] **Step 2: Reports layoutを標準list構造へ合わせる**

`ReportsHeader`はsticky contextual tabsだけを担当する。`ReportsBrowser`はheader直後の`site-container`にBreadcrumbsとPageListHeaderを置く。

```tsx
<ReportsHeader
  activeShelf={activeShelf}
  tabs={shelfTabs}
  onShelfSelect={updateShelf}
/>
<div className="site-container py-5">
  <Breadcrumbs items={[{ label: uiText.reports.breadcrumb }]} />
  <PageListHeader
    title={uiText.reports.title}
    description={uiText.reports.description}
    action={
      <SearchInput
        id="reports-search"
        label={uiText.filters.keywordSearch}
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

旧search専用border bandを削除する。heroとgridのcontainer幅は維持する。
（Phase 1 reviewでの現状確認: `ReportsBrowser.tsx:131`は本Stepの`action`未指定）

- [ ] **Step 3: PageListHeaderのsemantic contractを固定する**

`PageListHeader`へ任意の`headingId`を追加する。

```ts
interface PageListHeaderProps {
  title: string;
  description: string;
  headingId?: string;
  className?: string;
  action?: ReactNode;
}
```

H1へ`id={headingId}`を渡し、wrapperを`<header>`へ変更する。nested landmarkを避けるため、呼び出し側で別`header`に入れない。

- [ ] **Step 4: testと全route smokeを実行する**

```bash
npm run build
npm run test:e2e -- tests/e2e/headings.spec.ts tests/e2e/public-routes.spec.ts
```

Expected: 全route H1 1件。

- [ ] **Step 5: commit**

```bash
git add components/ReportsBrowser.tsx components/ReportsHeader.tsx components/PageListHeader.tsx tests/e2e/headings.spec.ts
git commit -m "fix: standardize reports list heading structure"
```

---

### Task 2: 実施しない（2026-08-03 決定）

**この task は実施しない。** 詳細な理由は冒頭「Task 2 を実施しない理由」節。要約:

- `docs/decisions/design_system_v1.md:305` が「**PageTabBar はページナビ（`aria-current`）で tab semantics を持たないため流用しない**」と明記している
- PR #5（Phase 1）は、一度入れた tab semantics を `role="group"` + `aria-current` へ **restore した**と記録している。**一度実施して差し戻された変更**である
- `PageTabBar` が切り替えるのは URL が変わる絞り込みであり、同一ページ内で tabpanel を差し替える tab/tablist パターンには当たらない
- Global Constraint「keyboardだけでtabsを操作できる」は**既に満たされている**（`<button>` なので Tab で到達し Enter/Space で選択できる）

**代替として実施すること:** 現状のキーボード操作が壊れていないことを固定する component test を **Task 4** で追加する。`role="group"` と `aria-current` を assert し、tab semantics へ戻す変更が入ったら落ちるようにする。

方針そのものを変える場合（`PageTabBar` に tab semantics を持たせる）は `design_system_v1.md:305` の書き換えを伴うため、本計画の範囲外。

---

### Task 3: Carouselへpauseと現在位置を追加する

**Files:**
- Create: `components/CarouselAutoplayButton.tsx`
- Create: `tests/components/news-hero-carousel.test.tsx`
- Modify: `components/NewsHeroCarousel.tsx`
- Modify: `components/uilayouts/carousel.tsx`

**Interfaces:**
- Produces: visible pause/resume button、`aria-live=polite` current position

> **`Removes: carousel primitiveの motion/react` は削除した。** Phase 5 Task 4 で除去済みで、`components/uilayouts/carousel.tsx` の該当は 0 件。
> **計画の test 例が参照する `tests/fixtures/articleCatalogFixture` は存在しない。** `NewsHeroCarousel` の props も Phase 5 Task 8 で `Article[]` から `ArticleCatalogItem[]` へ変わっているため、fixture は新しい型で作る。

- [ ] **Step 1: pause control testを書く**

```tsx
// tests/components/news-hero-carousel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import { articleCatalogFixture } from '../fixtures/articleCatalogFixture';

describe('NewsHeroCarousel', () => {
  it('lets the user pause and resume autoplay', async () => {
    const user = userEvent.setup();
    render(<NewsHeroCarousel reports={articleCatalogFixture} />);
    const pause = screen.getByRole('button', { name: '自動再生を停止' });
    await user.click(pause);
    expect(screen.getByRole('button', { name: '自動再生を開始' })).toBeVisible();
  });
});
```

Testing Libraryの`user-event`をPhase 1で未導入なら、このtaskで`npm install --save-dev @testing-library/user-event@^14`する。

- [ ] **Step 2: autoplay pluginをstable refにする**

```ts
const autoplay = useRef(
  Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
);
const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);

useEffect(() => {
  if (prefersReducedMotion) {
    autoplay.current.stop();
    setIsPlaying(false);
  }
}, [prefersReducedMotion]);
```

pluginsは`prefersReducedMotion ? [] : [autoplay.current]`。toggleは`play()`/`stop()`を呼びstateを同期する。

- [ ] **Step 3: visible controlを追加する**

```tsx
// components/CarouselAutoplayButton.tsx
interface CarouselAutoplayButtonProps {
  playing: boolean;
  onToggle: () => void;
}

export function CarouselAutoplayButton({
  playing,
  onToggle,
}: CarouselAutoplayButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? '自動再生を停止' : '自動再生を開始'}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 px-3 text-xs text-white backdrop-blur-md focus-visible:ring-2 focus-visible:ring-white"
    >
      {playing ? '停止' : '再生'}
    </button>
  );
}
```

Prev/nextと同じ常時visible control groupへ置く。

- [ ] **Step 4: slide semanticsとcurrent announcementを追加する**

`Slider`へ`role="group"`、`aria-roledescription="slide"`、`aria-label`を渡せるようにし、NewsHeroCarouselで`${index + 1} / ${reports.length}`を指定する。

```tsx
<span className="sr-only" aria-live="polite" aria-atomic="true">
  {selectedIndex + 1} / {count}
</span>
```

dot buttonは`aria-label={`${index + 1}枚目を表示`}`、`aria-current`を維持する。

- [ ] **Step 5: carousel primitiveからmotionを外す**

`components/uilayouts/carousel.tsx`の`AnimatePresence`と`motion` importを削除する。

- `SliderSnapDisplay`: 通常の`span`でcurrent numberを表示
- `SliderDotButton`: active markerを通常の`span` + `transition-colors`で表示

scale modeのEmbla tweenはDOM transform実装なので維持する。

- [ ] **Step 6: testとkeyboard E2Eを実行する**

```bash
npm run test -- tests/components/news-hero-carousel.test.tsx
npm run build
npm run test:e2e -- tests/e2e/keyboard-navigation.spec.ts
```

Expected: pause/resume、prev/next、ArrowLeft/RightがPASS。reduced motion contextでは「自動再生を開始」状態。

- [ ] **Step 7: commit**

```bash
git add components/CarouselAutoplayButton.tsx components/NewsHeroCarousel.tsx components/uilayouts/carousel.tsx tests/components/news-hero-carousel.test.tsx package.json package-lock.json
git commit -m "fix: add accessible carousel playback controls"
```

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
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/visual-regression.spec.ts`
- Create: `tests/e2e/visual-regression.spec.ts-snapshots/*`
- Modify: `playwright.config.ts`
- Modify: `src/app/globals.css`

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

- [ ] **Step 1: axe testを追加する**

```ts
// tests/e2e/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/robots', '/manufacturers', '/use-cases', '/reports', '/compare']) {
  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    const blocking = result.violations.filter(
      ({ impact }) => impact === 'serious' || impact === 'critical',
    );
    expect(blocking).toEqual([]);
  });
}
```

- [ ] **Step 2: visual testを追加する**

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

- [ ] **Step 3: baseline snapshotsをreview付きで生成する**

```bash
npm run build
npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
```

12枚を目視し、overflow、重なり、切れ、H1/search/tabs/mapの欠落がないことを確認してからcommitする。

- [ ] **Step 4: axe違反とresponsive差分を修正する**

修正優先:

1. missing label/name
2. color contrast
3. landmark/heading
4. focus-visible
5. overflow/clipping

新規色を直書きせず既存semantic tokenを使う。意図したvisual差分だけsnapshotを更新する。

- [ ] **Step 5: full UI gateを実行する**

```bash
npm run test:e2e -- tests/e2e/headings.spec.ts tests/e2e/keyboard-navigation.spec.ts tests/e2e/focus-restoration.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/mobile-overflow.spec.ts tests/e2e/visual-regression.spec.ts
```

Expected: 全test PASS。

- [ ] **Step 6: commit**

```bash
git add tests/e2e playwright.config.ts src/app/globals.css
git commit -m "test: add accessibility and responsive visual gates"
```

---

### Task 6: UI decision docsを実装へ合わせる

**Files:**
- Modify: `docs/decisions/ui_architecture_and_development_policy_v1.md`
- Modify: `docs/decisions/design_system_v1.md`

**Interfaces:**
- Consumes: Tasks 1〜5の実装
- Produces: current UI rules

- [ ] **Step 1: current rulesを更新する**

次をdecisionへ明記する。

- `PageListHeader`: index H1/description/action
- `ContextualPageHeader`: sticky filter/tabs、H1を持たない
- `PageTabBar`: ページナビ semantics（`role="group"` + `aria-current`）。tab semantics は持たない
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
