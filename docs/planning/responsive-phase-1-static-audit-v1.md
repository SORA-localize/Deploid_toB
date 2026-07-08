# Responsive Phase 1 Static Audit v1

Created: 2026-07-04
Status: active / R-01 implemented, R-02 pending
Scope: Phase 0 の responsive surface inventory をもとにした、実装修正前の優先度付き静的監査

## 0. Purpose

Phase 0 (`responsive-surface-audit-targets-v1.md`) は「どこを見るか」を MECE に固定した。
この Phase 1 は「どこから直すべきか」を決めるための静的実装監査である。

この文書ではまだ UI 実装修正は行わない。まず、現行コードから以下を特定する。

- route / component / state ごとの高リスクなレスポンシブ不備
- browser screenshot で優先確認すべき状態
- 最初の修正commitに切り出しやすい実装単位

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

## 2. Priority Findings

### P0-01 Catalog browsers use 2 columns at the smallest widths

Affected matrix:

- M-02R, M-02M, M-02U, M-03, M-14, SS-16

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

- Mobile: use 1 column for 1 selected, 2 columns for 2+ selected, or a horizontally scrollable selected rail with stable card width.
- Desktop: keep dense comparison sheet at larger breakpoints.
- Ensure the detail dialog trigger, favorite, remove, and drag affordances remain reachable without relying on DnD.

First implementation task:

- T-06 as its own commit after catalog grids, because compare has route-specific interaction state.

### P0-03 Carousel controls are hover-first and lack primitive-level names

Affected matrix:

- M-01, M-05, M-08, M-16

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

- Put default `aria-label` on carousel primitive prev/next/dot buttons and allow caller override.
- Make controls visible on focus/touch and not only on hover.
- Disable autoplay/progress animation when `prefers-reduced-motion: reduce`.

First implementation task:

- T-05 before page-specific carousel styling, because primitive fixes affect home, reports, and robot detail.

### P1-01 Header mobile drawer is not a full focus-managed overlay

Affected matrix:

- M-15, SS-06, SS-08

Evidence:

- `components/Header.tsx:114` keeps the mobile nav mounted and moves it with transform.
- `components/Header.tsx:125` close button and `components/Header.tsx:156` theme toggle do not have explicit closed-state `tabIndex` or inert handling.
- Link items have `tabIndex` control, but the drawer as a composite overlay does not trap focus or restore focus.

Risk:

- Focus can escape behind the drawer.
- Short-height drawer behavior is not guaranteed.
- Closed drawer descendants need browser verification.

Recommended fix direction:

- Prefer a Dialog-like focus-managed drawer, or add explicit `inert`, focus trap, Escape close, and focus restore.
- Keep body scroll lock and breakpoint close behavior.

First implementation task:

- T-01.

### P1-02 Tab semantics are stronger than the keyboard implementation

Affected matrix:

- M-02R, M-02A, M-16

Evidence:

- `components/PageTabBar.tsx:32` declares `role="tablist"`.
- `components/PageTabBar.tsx:38` declares each button as `role="tab"`.
- No arrow-key or roving-tabindex behavior is implemented in `PageTabBar`.
- `components/UseCasesBrowser.tsx:121` implements only ArrowLeft/ArrowRight for its own tablist, not Home/End or activation semantics.

Risk:

- Browser tabs look like tabs semantically but behave like plain buttons.
- Keyboard behavior differs between `PageTabBar` and use-case tabs.

Recommended fix direction:

- Either implement shared tab keyboard behavior or remove `tablist/tab` roles where the control is a horizontal button filter.
- If keeping tabs: add ArrowLeft/Right, Home/End, focus management, disabled tab handling, and consistent activation.

First implementation task:

- T-03.

### P1-03 Long source titles and metadata lack overflow hardening

Affected matrix:

- M-05, M-06, M-07, M-08, M-12

Evidence:

- `components/SourceList.tsx:44` renders source titles as plain inline links.
- `components/SourceList.tsx:48` appends publisher/check date in another inline span.

Risk:

- Long source titles, publisher strings, or URLs can produce horizontal overflow in detail and static pages.
- The same component appears across robot, manufacturer, use-case, and article detail surfaces.

Recommended fix direction:

- Use block layout per source item.
- Add `break-words` / `overflow-wrap:anywhere` where source titles or publisher strings can be long.
- Keep source metadata visually secondary but not forced into the same inline row.

First implementation task:

- T-08.

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

### P1-06 Use-case task picker depends on HoverCard for secondary filtering

Affected matrix:

- M-02U, SS-14

Evidence:

- `components/UseCasesBrowser.tsx:220` renders task choices inside a Radix HoverCard portal.
- Touch users can select an industry by tapping the trigger, but task selection is hidden in the hover content unless HoverCard touch behavior is confirmed.

Risk:

- Users on coarse pointer may not discover or operate the second-level task filter.
- Keyboard behavior and collision behavior are route-specific, not shared with `SearchableDropdown`.

Recommended fix direction:

- On coarse pointer or small widths, render task filters inline after selecting an industry, or move them into a click-open popover with explicit keyboard behavior.
- Keep HoverCard only for fine-pointer preview behavior.

First implementation task:

- T-03 + T-05.

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

- T-07 or T-08 depending on whether it is solved with detail layout or media hardening.

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

## 3. Recommended Implementation Order

### R-01 Shared browser density and skeleton parity

Status: implemented in `ff76f7b` (`feat(responsive): unify browser grid density`).

Owners:

- O-03, O-05, O-11

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

### R-02 Interaction primitives: carousel, tabs, drawer

Status: next implementation batch.

Owners:

- O-01, O-02, O-07, O-12

Targets:

- Header mobile drawer
- PageTabBar
- carousel primitive labels and visible controls
- reduced-motion behavior for autoplay/progress

Why second:

- These are cross-route primitives. Fixing them early reduces repeated page-specific work.

Definition of done:

- Carousel controls have accessible names by default.
- Touch and keyboard users can discover carousel controls.
- `PageTabBar` semantics match keyboard behavior.
- Header drawer has focus containment and close/focus-restore behavior.

Start gate:

- Working tree must not contain unrelated data/article/navigation changes.
- R-02 should not modify catalog grid density unless a new visual regression is found.
- R-02 should be split into primitive-level commits if carousel, tabs, and drawer changes cannot be reviewed as one coherent interaction batch.

### R-03 Compare mobile model

Owners:

- O-09

Targets:

- Selected sheet grid
- mobile manufacturer selector
- detail dialog short-height behavior
- favorites and drag/drop fallback

Why third:

- Compare is route-specific and interaction-heavy. It should not be mixed with catalog grid cleanup.

Definition of done:

- Selected robots remain inspectable at W-01/W-02 for 1, 2, 3, invalid, deduped, and max-count fixtures.
- DnD is enhancement, not the only ergonomic workflow.

### R-04 Detail text/media overflow hardening

Owners:

- O-08, O-13

Targets:

- SourceList
- RelatedLinkList
- manufacturer guide tables and YouTube
- article hero height
- robot prev/next links

Why fourth:

- Detail pages already have acceptable macro layout; failures are likely local overflow/media issues.

Definition of done:

- G-01 through G-09 have no horizontal overflow at W-01/W-02.
- Source, table, YouTube, and tag sections wrap or scroll only where intentional.

### R-05 Home accessible mobile discovery

Owners:

- O-06, O-07

Targets:

- HomeContentNavigator mobile nav
- ManufacturerWorldMap mobile/keyboard equivalent
- featured rails

Why fifth:

- Home has bespoke interaction and visual media. It should be handled after shared primitives are settled.

Definition of done:

- Mobile users can reach the same primary links exposed visually.
- Keyboard users have a usable path through map-related manufacturer discovery.

### R-06 Browser screenshot automation setup

Owners:

- all surfaces

Targets:

- Add an explicit browser screenshot runner or documented manual capture protocol.
- Capture Phase 0 M-01 through M-18 at the required axes.

Why last in this phase:

- The current repo has no Playwright setup. Static findings can guide first fixes, but final acceptance needs screenshots.

Definition of done:

- W-01, W-02, W-05, W-07, dark mode, reduced motion, and short-height states have repeatable captures.

## 4. Screenshot Confirmation Queue

Run these first when browser capture is available:

| Queue ID | Route / State | Viewports | What To Confirm |
| --- | --- | --- | --- |
| Q-01 | `/robots` and active-chip stress URL | W-01, W-02, W-05 | card columns, filter controls, result count, skeleton parity |
| Q-02 | `/manufacturers?country=China&route=domestic-distributor` | W-01, W-02, W-05 | card columns, dropdown width, distributor popover |
| Q-03 | `/use-cases?industry=manufacturing&task=material-handling` | W-01, W-02, W-05 | task picker touch fallback and card density |
| Q-04 | `/compare?compare=unitree-g1,agility-digit,apptronik-apollo` | W-01, W-02, H-01 | selected sheet density and detail dialog |
| Q-05 | `/reports/unitree-manufacturer-guide` | W-01, W-02, W-07, P-04 | YouTube facade, lineup table, carousel/motion behavior |
| Q-06 | `/` | W-01, W-02, P-01, P-05 | mobile navigator accessibility and map fallback |
| Q-07 | any route with mobile drawer open | W-01, W-02, H-01, P-05 | focus trap, body scroll lock, theme toggle reachability |

## 5. Acceptance Criteria For Phase 1

Phase 1 is complete when:

- High-priority static findings are assigned to implementation batches.
- Every P0/P1 finding maps back to a Phase 0 task and matrix row.
- Browser confirmation queue exists for the riskiest states.
- Build remains green.
- No implementation fix is mixed into the audit report commit.
