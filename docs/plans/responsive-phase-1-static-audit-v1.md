# Responsive Phase 1 Static Audit v1

Created: 2026-07-04
Revised: 2026-07-08 (review passes: batch execution order, R-02 scope, P1-07 addition, evidence line re-verification; matrix cross-reference corrections, P1-02 implementation decisions, R-06 axis alignment; R-02 implementation notes; R-06 capture protocol; R-03/R-04/R-05 code implementation)
Status: active / Phase 1 code implemented; R-06 visual capture pass still pending for final acceptance
Scope: Phase 0 の responsive surface inventory をもとにした、静的監査と実装バッチの進行トラッカー

## 0. Purpose

Phase 0 (`responsive-surface-audit-targets-v1.md`) は「どこを見るか」を MECE に固定した。
この Phase 1 は「どこから直すべきか」を決めるための静的実装監査として作成し、R-01着手後は実装バッチの進行トラッカーも兼ねる。

初回作成時点では UI 実装修正を行わず、現行コードから以下を特定した。

- route / component / state ごとの高リスクなレスポンシブ不備
- browser screenshot で優先確認すべき状態
- 最初の修正commitに切り出しやすい実装単位

## 0.5 旧調査からの未消化事項（2026-07-20 転記）

`docs/archive/responsive-audit-2026-06-30.md`（本Phase 1の前身となった簡易調査、archive済み）の指摘のうち、2026-07-20時点のコードを再確認して残っているものを転記する。

- **H-1 モバイルナビゲーションドロワー固定幅**（未解決）: `components/Header.tsx` のドロワー幅が `w-72`（288px）固定のまま。320px未満の端末で横スクロールが発生しうる。修正案: `w-[min(288px,90vw)]`
- **M-4 StickyHeaderでモバイルにロボット/メーカー名が非表示**（未解決）: `components/RobotDetailStickyHeader.tsx` / `components/ManufacturerDetailStickyHeader.tsx` の名前表示が `hidden sm:block` のまま、モバイルで名前が一切表示されない
- **M-7 SelectControl/検索ドロップダウンのモバイル表示**（未解決）: `components/ui/searchable-dropdown.tsx` が `max-w-[calc(100vw-1rem)]` のままで、モバイルでほぼ全幅に広がる
- H-2（ComparisonRobotPanelのスペック値切り捨て）は解消済みを確認（比較UIが表形式へ再構成されたため該当コードごと消滅）。M-1〜M-3・M-5・M-6・L-1〜L-3は未再確認（優先度が低いため今回はH/M-4/M-7のみ再確認した）

## 1. Method And Limits

Inspected:

- Phase 0 matrix and owner table
- global shell, browser routes, cards, detail pages, compare, forms, carousel, home interactive surfaces
- current dirty worktree state as-is

Validation:

- `npm run build` passed.
- Data validation passed as part of `npm run build`.

Limits:

- This is a static audit. No Playwright/browser screenshot runner exists in the project yet.
- Findings marked `needs visual confirmation` should be verified at W-01/W-02/W-05/W-07 before finalizing CSS values.
- Existing responsive code is treated as suspect unless supported by current implementation structure.
- Evidence line numbers were re-verified against the working tree on 2026-07-08. P0-01 evidence reflects pre-R-01 code and is kept for the record; the current grid source of truth is `lib/catalogLayoutClasses.ts`.

## 2. Priority Findings

### P0-01 Catalog browsers use 2 columns at the smallest widths

Affected matrix:

- M-02R, M-02M, M-02U, M-03, M-14

Setup:

- SS-16

Evidence:

- `components/RobotsBrowser.tsx:107` uses `grid-cols-2` at base width.
- `components/RobotsBrowser.tsx:171` uses 2 filter columns at base width.
- `components/RobotsBrowser.tsx:208` uses the same 2-column grid for skeleton state.
- `components/ManufacturersBrowser.tsx:90`, `:121`, `:125` use 2 columns at base width for filters, skeleton, and cards.
- `components/UseCasesBrowser.tsx:290`, `:299` use 2 columns at base width for skeleton and cards.

Risk:

- At 320px and 360px, card width is below the content width needed for Japanese names, badges, favorite controls, and image placeholders.
- Skeleton layouts can pass while final cards fail, or vice versa, because each route currently passes grid class strings manually.

Recommended fix direction:

- Introduce shared catalog grid class helpers or local constants per browser so result grid and skeleton grid cannot diverge.
- Use 1 column at W-01/W-02 for data-heavy cards.
- Re-promote to 2 columns only where the actual card minimum width is defensible, not just because Tailwind has a breakpoint.
- Keep reports as the reference pattern for base `grid-cols-1`.

First implementation task:

- T-03 + T-04 + T-10 together, because filters, cards, and pending skeletons need matching breakpoints.

Implementation batch: R-01 (implemented).

### P0-02 Compare selected sheet is fixed to 3 columns on mobile

Affected matrix:

- M-09, M-10, M-11

Evidence:

- `components/CompareClient.tsx:548` uses `grid grid-cols-3` regardless of viewport.
- `ComparisonRobotPanel` uses an image-forward `aspect-[5/7]` panel, so 3 columns on W-01/W-02 makes selected robots hard to inspect and tap.

Risk:

- The core compare workflow degrades exactly when users need touch-first add/remove/inspect controls.
- The UI model assumes desktop density even though the route already has a mobile manufacturer selector.

Recommended fix direction:

- Mobile: prefer a horizontally scrollable selected rail with stable card width. The 2-column grid alternative must be judged against the max-count fixture (G-22, 20 robots), where stacked `aspect-[5/7]` panels make the page very long.
- Desktop: keep dense comparison sheet at larger breakpoints.
- Ensure the detail dialog trigger, favorite, remove, and drag affordances remain reachable without relying on DnD. Note: a tap add/remove path already exists via the mobile manufacturer selector (`components/CompareClient.tsx:384-399`), so the gap is inspect/remove ergonomics and sheet density, not a missing tap path.

First implementation task:

- T-06 as its own commit after catalog grids, because compare has route-specific interaction state.

Implementation batch: R-03.

### P0-03 Carousel controls are hover-first and lack primitive-level names

Affected matrix:

- M-01, M-02A, M-05, M-16

Evidence:

- `components/NewsHeroCarousel.tsx:64` always passes `Autoplay`.
- `components/NewsHeroCarousel.tsx:124` hides prev/next behind `group-hover`.
- `components/NewsHeroCarousel.tsx:137` uses `SliderDotButton`.
- `components/RobotImageCarousel.tsx:164` also hides prev/next behind `group-hover`.
- `components/uilayouts/carousel.tsx:383` and `:401` define prev/next buttons without default accessible labels.
- `components/uilayouts/carousel.tsx:493` renders dot buttons without accessible labels.

Risk:

- Touch users may not discover carousel controls.
- Keyboard and screen-reader users get unnamed buttons unless callers remember to pass names.
- Reduced motion users still get autoplay/progress behavior in `NewsHeroCarousel`.

Recommended fix direction:

- Put default `aria-label` on carousel primitive prev/next/dot buttons and allow caller override. Dots should also expose `aria-current` (or equivalent selected state).
- Name the primitive container: the wrapper is a focusable unnamed `div` with `tabIndex={0}` and arrow-key handling (`components/uilayouts/carousel.tsx:311-315`). Apply `role="region"` + `aria-roledescription="carousel"` + label per the APG carousel pattern.
- Reuse or consolidate the existing unused `CarouselIndicator` (`components/uilayouts/carousel.tsx:539+`) before inventing another dot-button implementation; it already contains an `aria-label` and `sr-only` text but lacks active-state exposure.
- Make controls visible on focus/touch and not only on hover. The hover-only visibility lives in the callers, not the primitive: `components/NewsHeroCarousel.tsx:124` and `components/RobotImageCarousel.tsx:164` (`opacity-0 group-hover:opacity-100`). Primitive label fixes alone do not satisfy touch discovery.
- Disable autoplay/progress animation when `prefers-reduced-motion: reduce`. `ProgressIndicators` couples a 5000ms CSS transition to the autoplay period (`components/NewsHeroCarousel.tsx:46-49`); autoplay and the indicator must be changed in the same commit or the bar fills without a slide change.
- With `loop: true`, embla never disables prev/next, so do not rely on `disabled` styling for those buttons.

First implementation task:

- T-05 before page-specific carousel styling, because primitive fixes affect home, reports, and robot detail.

Implementation batch: R-02.

### P1-01 Header mobile drawer is not a full focus-managed overlay

Affected matrix:

- M-15

Setup:

- SS-06, SS-08

Evidence:

- `components/Header.tsx:162-167` keeps the mobile nav mounted with `aria-hidden={!isMenuOpen}` and moves it with transform.
- `components/Header.tsx:173` close button and `components/Header.tsx:220` theme toggle stay focusable while the drawer is closed, so the closed drawer is `aria-hidden` with focusable descendants (an ARIA violation).
- Link items have `tabIndex` control, but the drawer as a composite overlay does not trap focus, restore focus, or close on Escape. The backdrop (`components/Header.tsx:155-160`) is click-only.

Risk:

- Focus can escape behind the drawer.
- Short-height drawer behavior is not guaranteed.
- Closed drawer descendants need browser verification.

Recommended fix direction:

- Prefer a Dialog-like focus-managed drawer, or add explicit `inert`, focus trap, Escape close, and focus restore. `inert` is the simplest fix for the closed state and is well supported in current browsers.
- Keep body scroll lock and breakpoint close behavior.

First implementation task:

- T-01.

Implementation batch: R-02.

### P1-02 Tab semantics are stronger than the keyboard implementation

Affected matrix:

- M-02R, M-02A, M-02U, M-16

Evidence:

- `components/PageTabBar.tsx:32` declares `role="tablist"`.
- `components/PageTabBar.tsx:38` declares each button as `role="tab"`.
- No arrow-key or roving-tabindex behavior is implemented in `PageTabBar`.
- `components/UseCasesBrowser.tsx:124-131` implements only ArrowLeft/ArrowRight for its own tablist, not Home/End or activation semantics.
- Neither implementation has `tabpanel` counterparts or `aria-controls`.
- `PageTabBar` tabs with descriptions are wrapped in `AnimatedTooltip` spans; in `UseCasesBrowser` the `role="tab"` buttons double as HoverCard triggers (`components/UseCasesBrowser.tsx:209-219`).

Risk:

- Browser tabs look like tabs semantically but behave like plain buttons.
- Keyboard behavior differs between `PageTabBar` and use-case tabs.
- `AnimatedTooltip` never shows on touch (`components/ui/AnimatedTooltip.tsx:82` gates on `hover: hover`), so tab descriptions are unreachable on coarse pointer. They are supplementary, but this must be a conscious acceptance, not an accident.

Decision (2026-07-08):

- Remove `tablist`/`tab` roles and express the active state with `aria-current`. These controls are URL filter navigation without tabpanels; retrofitting the full APG tab pattern onto two implementations (one tooltip-wrapped, one HoverCard-coupled) is higher risk than simplifying the semantics. Revisit only if a later finding requires true tab semantics.
- Use-case tabs currently collect focus targets with `querySelectorAll('[role="tab"]')` (`components/UseCasesBrowser.tsx:124`). Removing roles must include changing that selector to a stable data attribute or ref list in the same commit, otherwise arrow navigation silently becomes a no-op.
- Remove role-dependent ARIA at the same time: `aria-selected` and `tablist`'s `aria-label` should not remain on non-tab controls. Preserve useful count/description `aria-label` text and `aria-disabled` semantics where controls can be disabled.
- The touch-inaccessible `AnimatedTooltip` descriptions are accepted as supplementary help text for now; active labels and counts must remain available without the tooltip.

First implementation task:

- T-03.

Implementation batch: R-02 (together with P1-06, same component).

### P1-03 Long source titles and metadata lack overflow hardening

Affected matrix:

- M-05, M-06, M-07, M-08

Evidence:

- `components/SourceList.tsx:44` renders source titles as plain inline links.
- `components/SourceList.tsx:48` appends publisher/check date in another inline span.

Risk:

- Long source titles, publisher strings, or URLs can produce horizontal overflow in detail pages.
- The same component appears across robot, manufacturer, use-case, and article detail surfaces.

Recommended fix direction:

- Use block layout per source item.
- Add `break-words` / `overflow-wrap:anywhere` where source titles or publisher strings can be long.
- Keep source metadata visually secondary but not forced into the same inline row.

First implementation task:

- T-08.

Implementation batch: R-04.

### P1-04 Home mobile navigator is visible but intentionally hidden from assistive tech

Affected matrix:

- M-01

Evidence:

- `components/HomeContentNavigator.tsx:95` renders the mobile navigator with `aria-hidden="true"`.
- `components/HomeContentNavigator.tsx:102` also sets its links to `tabIndex={-1}`.

Risk:

- The only visible lg-down version of this navigator is not keyboard/screen-reader reachable.
- The desktop version is hidden at lg-down, so there is no equivalent accessible control on mobile.

Recommended fix direction:

- Make the mobile navigator a normal accessible nav/list.
- If the desktop preview panel should be the only semantic source, provide a separate mobile-accessible list with equivalent links and labels.

First implementation task:

- T-09.

Implementation batch: R-05.

### P1-05 World map points are hover/pointer-first

Affected matrix:

- M-01

Evidence:

- `components/ManufacturerMapCopy.tsx:154` sets map point links to `tabIndex={-1}`.
- The detailed info card is hidden on mobile in `ManufacturerMapStage`.

Risk:

- Keyboard users cannot explore manufacturer points.
- Mobile users get the animated map and CTA, but not the same point-level discovery.

Recommended fix direction:

- Add a keyboard-accessible list or carousel of represented manufacturers below the map on small screens.
- Keep map points non-focusable only if an equivalent accessible list exists.

First implementation task:

- T-09, after HomeContentNavigator.

Implementation batch: R-05.

### P1-06 Use-case task picker depends on HoverCard for secondary filtering

Affected matrix:

- M-02U

Setup:

- SS-14

Evidence:

- `components/UseCasesBrowser.tsx:204-266` renders task choices inside a Radix HoverCard portal.
- Radix HoverCard is hover/focus oriented and is not a touch disclosure primitive. Touch users can select an industry by tapping the trigger, but the second-level task choices remain undiscoverable without a separate touch/coarse-pointer path.

Risk:

- Users on coarse pointer may not discover or operate the second-level task filter.
- Keyboard behavior and collision behavior are route-specific, not shared with `SearchableDropdown`.

Recommended fix direction:

- On coarse pointer or small widths, render task filters inline after selecting an industry, or move them into a click-open popover with explicit keyboard behavior.
- Keep HoverCard only for fine-pointer preview behavior.

First implementation task:

- T-03 + T-05.

Implementation batch: R-02 (together with P1-02: the same buttons carry the tab roles and the HoverCard trigger).

### P1-07 Header desktop dropdown declares menu semantics without menu behavior

Affected matrix:

- M-15

Evidence:

- `components/Header.tsx:78` sets `aria-haspopup="menu"` on a plain navigation link.
- `components/Header.tsx:96` opens the dropdown via `group-hover` / `group-focus-within` only.
- `components/Header.tsx:98` declares `role="menu"` and `components/Header.tsx:106` declares `role="menuitem"`, with no arrow-key navigation, no Escape close, and no focus management.

Risk:

- Same semantics-stronger-than-implementation problem as P1-02, exposed at W-06 and wider.
- Screen-reader users are promised menu keyboard behavior that does not exist.

Recommended fix direction:

- Align with the P1-02 decision: remove `menu`/`menuitem`/`aria-haspopup` in favor of a plain disclosure list of links, or implement Escape close and arrow navigation if menu roles stay.

First implementation task:

- T-01.

Implementation batch: R-02 (same commit scope as the mobile drawer, both in `Header.tsx`).

### P2-01 Article hero height may dominate short mobile viewports

Affected matrix:

- M-08, M-17

Evidence:

- `src/app/reports/[slug]/page.tsx:171` uses `min-h-[400px]` at base width.
- `src/app/reports/[slug]/page.tsx:190` mirrors that minimum height for the content overlay.

Risk:

- On H-01 568px height, the article hero can consume most of the viewport before users see the next section.

Recommended fix direction:

- Use height rules constrained by viewport height, such as `min-h-[min(400px,75vh)]`, after screenshot confirmation.
- Preserve readability of hero copy and credit.

First implementation task:

- T-08.

Implementation batch: R-04. In the revised execution order, R-06 captures exist before R-04 starts, so the height values are chosen from screenshot evidence as this finding requires.

### P2-02 Motion-heavy card effects need a shared reduced-motion audit

Affected matrix:

- M-01, M-02R, M-02M, M-02U, M-10, M-16

Evidence:

- `useTiltCardEffect` uses reduced motion for tilt values, but cards still have shimmer/hover transform transitions.
- Compare layout animation uses Framer Motion during insertion preview.
- `NewsHeroCarousel` autoplay/progress is not reduced-motion-aware.

Risk:

- Reduced-motion support is partial and component-specific.

Recommended fix direction:

- Add a shared reduced-motion pass after structural responsive fixes.
- Disable decorative shimmer/scale/progress where motion is not required to understand state.

First implementation task:

- T-05 after carousel primitive fixes.

Implementation batch: split — carousel autoplay/progress in R-02, compare insertion-preview layout animation in R-03, remaining tilt/shimmer/card motion as the closing pass in R-05.

## 3. Recommended Implementation Order

Execution order (revised 2026-07-08): R-01 → R-02 → R-06 → R-03 → R-04 → R-05.

Batch IDs are stable identifiers and no longer encode execution order. R-06 was pulled forward because the definitions of done for R-03 and R-04 require W-01/W-02 captures, and P2-01 explicitly requires screenshot confirmation before choosing CSS values — leaving the capture setup last made those batches unacceptable by their own criteria. R-02 stays before R-06 because its acceptance is keyboard/focus/accessible-name verification, which does not depend on the capture runner. Subsections below appear in execution order.

### R-01 Shared browser density and skeleton parity

Status: implemented in `ff76f7b` (`feat(responsive): unify browser grid density`).

Owners:

- O-03, O-05, O-08, O-11

Targets:

- Robots, manufacturers, use-cases browser grids
- Reports browser grids
- Manufacturer detail related robot grid
- Filter control grids
- CardGridSkeleton and route-specific skeleton grids

Why first:

- This fixes the broadest W-01/W-02 layout risk.
- It also prevents pending-state regressions from diverging from final result grids.

Definition of done:

- W-01 and W-02 browser pages do not use base 2-column card grids for data-heavy cards.
- Skeleton and loaded grids share the same breakpoint model.
- Active filter stress URLs still fit without horizontal page overflow.

Implemented notes:

- `lib/catalogLayoutClasses.ts` is the breakpoint source for catalog browser grids and filter grids.
- Robots, manufacturers, use-cases, reports, route loading, Suspense fallback, pending skeletons, and manufacturer detail robot grids use the shared grid source where applicable.
- Verified after implementation with `npm run validate:data`, `git diff --check`, and `npm run build`.
- Manual browser checks remain useful before release, especially W-01/W-02 card density and tab-click pending transitions, but they are no longer blockers for starting R-02.

### R-02 Interaction primitives: carousel, tabs/filters, header

Status: implemented in `010bddf`, `8709068`, and `c2a5267`.

Owners:

- O-01, O-02, O-03, O-07, O-12

Targets:

- Header mobile drawer (P1-01)
- Header desktop dropdown menus (P1-07)
- `PageTabBar` and the use-cases tablist + HoverCard task picker (P1-02, P1-06)
- carousel primitive labels, container naming, and caller-level control visibility in `NewsHeroCarousel` and `RobotImageCarousel` (P0-03)
- reduced-motion behavior for carousel autoplay and progress indicators (P0-03, part of P2-02)

Decisions carried into this batch:

- Tab/menu roles are removed, not implemented (see P1-02 decision). Active state is expressed with `aria-current`; the Header dropdown becomes a plain disclosure list unless menu keyboard behavior is added.
- Use-cases filter keyboard navigation must move off `[role="tab"]` selectors in the same commit that removes tab roles.
- Tooltip-only tab descriptions are accepted as supplemental on coarse pointer; labels, counts, active state, and disabled state remain available without hover.

Why second:

- These are cross-route primitives. Fixing them early reduces repeated page-specific work.
- P1-06 is included here because the same use-cases buttons carry both the tab roles and the HoverCard trigger; splitting them across batches would touch the same code twice.

Definition of done:

- Carousel controls have accessible names by default; the container is a named region; dots expose `aria-label` and selected state.
- Carousel prev/next/dot controls are visible and operable on touch and keyboard on home, reports, and robot detail — including the caller-level `opacity-0 group-hover` CSS, not only the primitive.
- Autoplay and progress indication stop together under `prefers-reduced-motion: reduce`.
- `PageTabBar` and the use-cases filter controls share one semantics/keyboard model (post-decision: no tab roles, `aria-current` for active state).
- Role-dependent ARIA is cleaned up with the role change: no stray `aria-selected` on plain buttons, no orphaned `tablist` label, and count/disabled labels are preserved.
- The use-case task picker is operable on coarse pointer and keyboard without relying on HoverCard hover.
- Header drawer has focus containment, Escape close, focus restore, and no focusable descendants while closed (`inert` acceptable).
- Header desktop dropdown no longer declares unimplemented menu semantics.

Implemented notes:

- Carousel primitive and callers were updated in `010bddf` (`fix(carousel): improve responsive accessibility`).
- PageTabBar and use-case filter controls were updated in `8709068` (`fix(filters): use button semantics for category controls`).
- Header mobile drawer focus containment and closed-state focus exclusion were updated in `c2a5267` (`fix(header): trap focus in mobile navigation`).
- Verification: `npm run build` passed after the carousel/filter changes and again after the Header changes.

Start gate:

- Working tree must not contain unrelated data/article/navigation changes.
- R-02 should not modify catalog grid density unless a new visual regression is found.
- R-02 should be split into primitive-level commits; the natural split is (1) carousel primitive + callers, (2) tabs/filters + task picker, (3) header drawer + desktop dropdown.

### R-06 Browser screenshot automation setup

Status: implemented by `responsive-capture-protocol-v1.md`.

Owners:

- all surfaces

Targets:

- Add an explicit browser screenshot runner or documented manual capture protocol.
- Capture Phase 0 M-01 through M-18 at the required axes.

Why third (pulled forward from last, 2026-07-08):

- R-03 and R-04 definitions of done are stated in terms of W-01/W-02 rendering and cannot be accepted without captures.
- P2-01 requires screenshot confirmation before choosing hero height values in R-04.
- R-02 outcomes (focus, names, keyboard) are verified manually, so R-06 does not block R-02 — but its captures retroactively confirm R-01 and R-02 visual states via Q-01 through Q-08.

Definition of done:

- Phase 0 §6 required axes have repeatable captures: W-01, W-02, W-03, W-05, W-06, W-07, W-08; H-01/H-02/H-03 where specified; and P-01, P-03, P-04, P-05.
- The confirmation queue below documents any intentionally narrower route-specific captures; omissions from the full Phase 0 axis set require an explicit reason in the runner or capture protocol.

Implemented notes:

- `responsive-capture-protocol-v1.md` defines the manual capture route, output folder, filename format, Phase 0 M-01 through M-18 coverage, state setup notes, and Q-01 through Q-08 priority queue.
- Actual screenshot images remain outside git under `/private/tmp/deploid-responsive-captures/<YYYYMMDD>-<short-sha>/` unless a later review asks to preserve a failing-state sample.

### R-03 Compare mobile model

Status: code implemented in `5078ba7`; R-06 capture protocol should still be run for W-01/W-02 visual acceptance.

Owners:

- O-09

Targets:

- Selected sheet grid (P0-02)
- mobile manufacturer selector
- detail dialog short-height behavior
- favorites and drag/drop fallback
- reduced-motion behavior for the insertion-preview layout animation (`SHEET_LAYOUT_TRANSITION` usages in `CompareClient.tsx`, part of P2-02)

Why after R-06:

- Compare is route-specific and interaction-heavy. It should not be mixed with catalog grid cleanup.
- Its definition of done is stated at W-01/W-02, so the R-06 capture runner must exist first.

Implementation notes:

- Prefer the horizontally scrollable selected rail over a 2-column grid; judge against G-22 (20 robots), where stacked `aspect-[5/7]` panels make a 2-column page very long.
- Tap add/remove already works through the mobile manufacturer selector; the work is sheet density and inspect/remove ergonomics, not adding a tap path.

Definition of done:

- Selected robots remain inspectable at W-01/W-02 for 1, 2, 3, invalid, deduped, and max-count fixtures.
- DnD is enhancement, not the only ergonomic workflow.
- Insertion-preview layout animation is disabled under `prefers-reduced-motion: reduce`.

Implemented notes:

- Mobile selected robots now render as a horizontally scrollable rail at base width and return to the existing 3-column grid from `sm`.
- Compare detail dialog uses dynamic viewport height and reduced-motion-safe Radix animation classes.
- Insertion-preview layout animation and preview scale animation are disabled under reduced motion.

### R-04 Detail text/media overflow hardening

Status: code implemented in `a6e7417`; R-06 capture protocol should still be run for G-01 through G-09 W-01/W-02 visual acceptance.

Owners:

- O-08, O-13

Targets:

- SourceList
- RelatedLinkList
- manufacturer guide tables and YouTube
- article hero height (P2-01; height values chosen from R-06 captures; page-file surface)
- robot prev/next links (page-file surface)

Note: the page-file surfaces above are not owned by Phase 0 §7 component owners. They live in `src/app/reports/[slug]/page.tsx` and `src/app/robots/[slug]/page.tsx`, so R-04 tracks them explicitly here.

Why after R-03:

- Detail pages already have acceptable macro layout; failures are likely local overflow/media issues.
- The overflow definition of done is verified with R-06 captures at W-01/W-02.

Definition of done:

- G-01 through G-09 have no horizontal overflow at W-01/W-02.
- Source, table, YouTube, and tag sections wrap or scroll only where intentional.

Implemented notes:

- SourceList, RelatedLinkList, Markdown, and DefinitionList now use explicit long-token wrapping for detail text surfaces.
- Manufacturer guide lineup tables intentionally scroll horizontally at small widths; YouTube captions wrap and the facade has visible focus.
- Article hero height is capped by viewport height; robot prev/next links stack and wrap on mobile.

### R-05 Home accessible mobile discovery

Status: code implemented in `02fe437`; R-06 capture protocol should still be run for `/` W-01/W-02/P-01/P-05 and reduced-motion acceptance.

Owners:

- O-06, O-07

Targets:

- HomeContentNavigator mobile nav (P1-04)
- ManufacturerWorldMap mobile/keyboard equivalent (P1-05)
- featured rails
- closing reduced-motion pass for remaining decorative motion: tilt/shimmer card effects and any hover-scale transitions not covered by R-02/R-03 (rest of P2-02)

Why last:

- Home has bespoke interaction and visual media. It should be handled after shared primitives are settled.
- The reduced-motion closing pass belongs at the end so it sweeps whatever motion the earlier batches did not already gate.

Definition of done:

- Mobile users can reach the same primary links exposed visually.
- Keyboard users have a usable path through map-related manufacturer discovery.
- No decorative shimmer/scale/tilt motion plays under `prefers-reduced-motion: reduce` on home, browsers, or detail cards.

Implemented notes:

- HomeContentNavigator mobile links are no longer hidden from assistive technology or removed from tab order.
- Manufacturer map point links are keyboard-focusable on the primary map copy; duplicate map copies remain out of tab order.
- EncryptedText stops its scramble animation under reduced motion, and card shimmer/scale/accent-line motion is disabled or made instant under reduced motion across home, browser, and detail card surfaces.

## 4. Screenshot Confirmation Queue

Run these first when browser capture is available:

| Queue ID | Route / State | Viewports | What To Confirm |
| --- | --- | --- | --- |
| Q-01 | `/robots` and active-chip stress URL | W-01, W-02, W-05 | card columns, filter controls, result count, skeleton parity |
| Q-02 | `/manufacturers?country=China&route=domestic-distributor` | W-01, W-02, W-05 | card columns, dropdown width, distributor popover |
| Q-03 | `/use-cases?industry=manufacturing&task=material-handling` | W-01, W-02, W-05 | task picker touch fallback and card density |
| Q-04 | `/compare?compare=unitree-g1,agility-digit,apptronik-apollo` | W-01, W-02, H-01 | selected sheet density and detail dialog |
| Q-05 | `/reports/unitree-manufacturer-guide` | W-01, W-02, W-07, P-04 | YouTube facade, lineup table, source wrapping, article detail media/overflow behavior |
| Q-06 | `/` | W-01, W-02, P-01, P-05 | mobile navigator accessibility and map fallback |
| Q-07 | any route with mobile drawer open | W-01, W-02, H-01, P-05 | focus trap, body scroll lock, theme toggle reachability |
| Q-08 | any route with desktop nav dropdown open | W-06, W-07, P-05 | dropdown open via keyboard focus, Escape/close behavior, no stale menu semantics |

## 5. Acceptance Criteria For Phase 1

Phase 1 is complete when:

- High-priority static findings are assigned to implementation batches.
- Every P0/P1/P2 finding carries an explicit `Implementation batch: R-xx` line, so no finding depends only on Phase 0 task mapping.
- Every P0/P1 finding maps back to a Phase 0 task and matrix row.
- Browser confirmation queue exists for the riskiest states.
- Build remains green.
- No implementation fix is mixed into the audit report commit.

Batch coverage check (2026-07-08): P0-01→R-01, P0-02→R-03, P0-03→R-02, P1-01→R-02, P1-02→R-02, P1-03→R-04, P1-04→R-05, P1-05→R-05, P1-06→R-02, P1-07→R-02, P2-01→R-04, P2-02→R-02/R-03/R-05. No unassigned findings.
