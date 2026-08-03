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
| `tests/components/page-tab-bar.test.tsx` | tab semantics/keyboard |
| `tests/components/news-hero-carousel.test.tsx` | pause/reduced motion |
| `tests/e2e/headings.spec.ts` | H1 uniqueness |
| `tests/e2e/keyboard-navigation.spec.ts` | tabs/carousel/pagination |
| `tests/e2e/focus-restoration.spec.ts` | menu/dialog/popover |
| `tests/e2e/accessibility.spec.ts` | serious/critical axe |
| `tests/e2e/visual-regression.spec.ts` | 4 viewport screenshots |

### 変更

| Path | Responsibility |
|---|---|
| `components/PageTabBar.tsx` | tablist、roving focus、hint |
| `components/ReportsHeader.tsx` | contextual tabsのみ |
| `components/ReportsBrowser.tsx` | list H1/description/search |
| `components/CompareClient.tsx` | list header統一（F6-01、要スコープ確定） |
| `components/NewsHeroCarousel.tsx` | autoplay state/control |
| `components/uilayouts/carousel.tsx` | semantic slides/dots、motion削除 |
| `components/Header.tsx` | focus testで見つかった欠陥だけ修正 |
| `components/ComparisonRobotPanel.tsx` | dialog focus contract |
| `components/ui/searchable-dropdown.tsx` | popover focus contract |
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

### Task 2: 横スクロールtabsをkeyboard対応にする

**Files:**
- Create: `tests/components/page-tab-bar.test.tsx`
- Modify: `components/PageTabBar.tsx`
- Modify: `components/ContextualPageHeader.tsx`

**Interfaces:**
- Produces: `role=tablist`、`role=tab`、roving `tabIndex`、Arrow/Home/End

- [ ] **Step 1: component testを書く**

```tsx
// tests/components/page-tab-bar.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageTabBar } from '@/components/PageTabBar';

const tabs = [
  { value: 'all', label: 'すべて' },
  { value: 'news', label: 'ニュース' },
  { value: 'analysis', label: '分析' },
] as const;

describe('PageTabBar', () => {
  it('exposes tab semantics and arrow navigation', () => {
    const onSelect = vi.fn();
    render(
      <PageTabBar
        tabs={tabs}
        activeValue="all"
        onSelect={onSelect}
        ariaLabel="記事分類"
      />,
    );
    const tablist = screen.getByRole('tablist', { name: '記事分類' });
    const all = screen.getByRole('tab', { name: 'すべて' });
    expect(tablist).toBeVisible();
    expect(all).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(all, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'ニュース' })).toHaveFocus();
  });
});
```

- [ ] **Step 2: 現行componentで失敗することを確認する**

Run: `npm run test -- tests/components/page-tab-bar.test.tsx`

Expected: `tablist`/`tab`が見つからずFAIL。

- [ ] **Step 3: semanticとroving focusを実装する**

`PageTabBar`で`ariaLabel`を捨てず、rootへ使う。

```tsx
const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
const enabledTabs = tabs
  .map((tab, tabIndex) => ({ tab, tabIndex }))
  .filter(({ tab }) => !tab.disabled);

const focusTab = (index: number) => {
  const normalized =
    ((index % enabledTabs.length) + enabledTabs.length) % enabledTabs.length;
  tabRefs.current[enabledTabs[normalized].tabIndex]?.focus();
};

<div
  role="tablist"
  aria-label={ariaLabel}
  aria-describedby={`${id}-hint`}
  className="flex flex-nowrap overflow-x-auto gap-0"
>
```

各button:

```tsx
role="tab"
aria-selected={isActive}
tabIndex={isActive ? 0 : -1}
ref={(node) => { tabRefs.current[index] = node; }}
onKeyDown={(event) => {
  const enabledIndex = enabledTabs.findIndex(({ tabIndex }) => tabIndex === index);
  if (event.key === 'ArrowRight') focusTab(enabledIndex + 1);
  if (event.key === 'ArrowLeft') focusTab(enabledIndex - 1);
  if (event.key === 'Home') focusTab(0);
  if (event.key === 'End') focusTab(enabledTabs.length - 1);
}}
```

Arrow/Home/Endでは`preventDefault()`する。focus移動だけでは選択せず、Enter/Space/clickで`onSelect`する。

- [ ] **Step 4: scroll hintを追加する**

```tsx
<p id={`${id}-hint`} className="sr-only">
  左右キーで項目間を移動し、Enterキーで選択できます。
</p>
```

`useId()`で安定したidを作る。ContextualPageHeaderのoverflow containerへ`overscroll-x-contain`を追加する。

- [ ] **Step 5: testsを実行する**

```bash
npm run test -- tests/components/page-tab-bar.test.tsx
npm run build
```

Expected: PASS。

- [ ] **Step 6: commit**

```bash
git add components/PageTabBar.tsx components/ContextualPageHeader.tsx tests/components/page-tab-bar.test.tsx
git commit -m "fix: add keyboard semantics to page tabs"
```

---

### Task 3: Carouselへpauseと現在位置を追加する

**Files:**
- Create: `components/CarouselAutoplayButton.tsx`
- Create: `tests/components/news-hero-carousel.test.tsx`
- Modify: `components/NewsHeroCarousel.tsx`
- Modify: `components/uilayouts/carousel.tsx`

**Interfaces:**
- Produces: visible pause/resume button、`aria-live=polite` current position
- Removes: carousel primitiveの`motion/react`

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
- Modify: `components/Header.tsx`
- Modify: `components/ComparisonRobotPanel.tsx`
- Modify: `components/ui/searchable-dropdown.tsx`

**Interfaces:**
- Consumes: mobile menu、compare dialog、searchable dropdown
- Produces: open時focus移動、Escape close、triggerへfocus restoration

- [ ] **Step 1: focus E2Eを書く**

```ts
// tests/e2e/focus-restoration.spec.ts
import { expect, test } from '@playwright/test';

test('mobile menu restores focus to its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /メニュー/ });
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('compare detail dialog restores focus', async ({ page }) => {
  await page.goto('/compare?compare=unitree-g1');
  const trigger = page.getByRole('button', { name: /詳細/ }).first();
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
```

searchable dropdownについてもtrigger click → option focus → Escape → trigger focusを追加する。

- [ ] **Step 2: keyboard journeyを書く**

```ts
// tests/e2e/keyboard-navigation.spec.ts
test('reports tabs and carousel work without pointer input', async ({ page }) => {
  await page.goto('/reports');
  const activeTab = page.getByRole('tab', { selected: true });
  await activeTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab').nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');

  const carousel = page.getByRole('region', { name: '注目記事カルーセル' });
  await carousel.focus();
  await page.keyboard.press('ArrowRight');
  await expect(carousel.locator('[aria-live="polite"]')).toContainText('2 /');
});
```

- [ ] **Step 3: 現行Radix/native focus behaviorを実測する**

```bash
npm run build
npm run test:e2e -- tests/e2e/focus-restoration.spec.ts tests/e2e/keyboard-navigation.spec.ts
```

PASSしたcomponentへ不要なcustom focus codeを足さない。FAILしたsurfaceだけ修正する。

- [ ] **Step 4: focus欠陥を修正する**

- Header: 既存`restoreFocusRef`を維持し、navigation clickだけ`restoreFocus:false`
- Dialog: Radix `onCloseAutoFocus`で`event.preventDefault()`後に保存triggerへfocus
- Searchable dropdown: `onCloseAutoFocus`でtrigger refへfocus
- portal contentには一意なTitle/Descriptionを設定

`setTimeout`でfocusを推測せず、Radix lifecycle eventまたは`requestAnimationFrame`を1回だけ使う。

- [ ] **Step 5: testsとcommit**

```bash
npm run test:e2e -- tests/e2e/focus-restoration.spec.ts tests/e2e/keyboard-navigation.spec.ts
git add components/Header.tsx components/ComparisonRobotPanel.tsx components/ui/searchable-dropdown.tsx tests/e2e
git commit -m "fix: guarantee keyboard focus restoration"
```

---

### Task 5: axeと4 viewport visual regressionを追加する

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/visual-regression.spec.ts`
- Create: `tests/e2e/visual-regression.spec.ts-snapshots/*`
- Modify: `playwright.config.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: serious/critical axe gate、390/768/1280/1440 visual snapshots

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
- `PageTabBar`: tablist + roving focus
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
