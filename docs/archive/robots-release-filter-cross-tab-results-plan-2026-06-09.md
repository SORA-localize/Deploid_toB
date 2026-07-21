# Robots Release Filter Cross-Tab Results Plan

Created: 2026-06-09
Status: planning only

## Purpose

Fix the robot listing UX where search or dropdown filters can match robots in the other release bucket, but the current `販売中` / `開発中` tab hides those matches.

This plan intentionally ignores model-generation/variant duplication such as `Digit` and `Digit v5`. That is a separate data-modeling problem.

## Problem Summary

Current user-facing issue:

- A user searches `1x` while the page is on the default `販売中` tab.
- `1X NEO` exists, but it has `deploymentStage: 'prototype'`.
- `prototype` is classified as `開発中`.
- The current page returns zero visible cards because the `release=active` view hides `preReleaseRobots`.

The user intent is usually:

> "Find 1X. I do not know whether it is listed as selling, pilot, prototype, or pre-release."

The current UI behaves as:

> "Search only inside the currently selected release bucket."

That makes valid results look missing.

## Existing Findings

Checked files:

- `ai_implementation_workflow_prompt.md`
- `lib/robotFilters.ts`
- `lib/display.ts`
- `lib/search.ts`
- `components/RobotsBrowser.tsx`
- `components/RobotsHeader.tsx`
- `components/PageTabBar.tsx`
- `components/EmptyState.tsx`
- `data/robots.ts`

Key current logic:

- `normalizeRobotFilters()` normalizes `release` to `'active'` unless `release=pre`.
- `filterRobots()` first applies structured filters and text search.
- It then splits the already-filtered results into:
  - `activeRobots`
  - `preReleaseRobots`
- It returns `filtered` as either `activeRobots` or `preReleaseRobots` based on `filters.release`.

Current release split source:

```ts
const preReleaseDeploymentStages: DeploymentStage[] = ['concept', 'prototype'];
```

So `1X NEO` with `deploymentStage: 'prototype'` is in `preReleaseRobots`.

## Design Decision

When search or any structured filter is active, release tabs should not hide valid matches in the other bucket.

Recommended behavior:

- No search/filter active:
  - Keep current tab behavior.
  - Default shows `販売中`.
  - User can switch to `開発中`.

- Search/filter active:
  - Show results across both release buckets.
  - Do not render release tabs as an interactive tablist, because clicking them would no longer change the card grid.
  - Render release counts as static contextual badges instead:
    - `販売中 n件`
    - `開発中 n件`
  - Render matching results in release-grouped sections:
    - `販売中`
    - `開発中`
  - If one section has no matches, either omit that section or show a compact "該当なし" line. Prefer omitting empty sections unless all results are empty.

Reasoning:

- Search/filter is an intent to find a robot across the catalog.
- Release bucket is metadata about readiness, not something most users know before searching.
- The current zero-result state is misleading when the other bucket has matches.
- The app already computes both `activeRobots` and `preReleaseRobots`; this can be fixed mostly in display logic.
- A `role="tab"` control must change the visible panel it controls. In cross-release mode the card list intentionally ignores `release`, so interactive tabs would be semantically misleading.

## Scope

Do in this change:

- Add an explicit derived flag for whether robot filters are active.
- Change robot list rendering so filtered/search mode displays both release buckets.
- Keep existing release URL behavior when no search/filter is active.
- In search/filter mode, replace the interactive release tablist with static counts.
- Keep current robot search document fields.
- Keep `Digit` / `Digit v5` generation duplication as-is.
- Keep manufacturer searchable dropdown behavior as-is.

Do not do in this change:

- Restructure robot data.
- Add model-family / generation fields.
- Change search ranking.
- Change robot card component behavior.
- Remove the global search bar.
- Replace release tabs with a new component unless strictly necessary.
- Change URL parameter names.

## Proposed Behavior Details

### Active Filter Definition

Treat the following as active filters:

- normalized query text is not empty
- `filters.industry !== null`
- `filters.task !== null`
- `filters.manufacturer !== 'all'`
- `filters.availability !== 'all'`

Do not count `filters.release` itself as an active filter for this behavior.

Use the same normalization semantics as search matching. Either:

- import and use `normalizeSearchText(filters.query) !== ''` for the active-filter check.

Recommended first pass:

- keep `filters.query` as the raw display value.
- do not normalize `query` in `normalizeRobotFilters()` because `filters.query` is passed directly to `SearchInput` as the visible input value.
- use `normalizeSearchText(filters.query) !== ''` only when deriving `hasActiveFilters`.
- This keeps URL strings such as `/robots?q=%20` from activating cross-release mode when search itself treats the query as empty, without changing visible input text such as `1X`, full-width characters, or user-entered spacing.

### Rendering Rules

If no active search/filter:

- Render only `filtered` from `filterRobots()` as today.
- Tabs behave as the primary display mode.

If active search/filter:

- Ignore `filters.release` for the card grid display.
- Render `activeRobots` and `preReleaseRobots` as separate groups.
- Use existing `RobotCard`.
- Show total result count based on `activeRobots.length + preReleaseRobots.length`.
- Show the total result count immediately above the grouped results.
- Include counts in each rendered section heading.
- Empty state only when both groups are empty.

### Header / Tabs

Do not keep `RobotsHeader` unchanged in filter mode.

Counts already reflect the search/filter result because `activeRobots` and `preReleaseRobots` are calculated after search/filter. That is good.

Required behavior:

- Add `isCrossReleaseMode` to `RobotsHeader`.
- When `isCrossReleaseMode` is false:
  - keep the current `PageTabBar` behavior.
  - `role="tab"` remains correct because each tab changes the visible grid.
- When `isCrossReleaseMode` is true:
  - do not render `PageTabBar`.
  - render non-interactive count badges or plain text using `activeCount` and `preCount`.
  - add explanatory copy such as:
    - `絞り込み中は販売中・開発中を横断して表示しています。`

Why:

- `PageTabBar` currently renders `role="tab"` buttons.
- In cross-release mode, clicking `release=active` or `release=pre` should not hide the other bucket.
- Therefore those controls must not be presented as operational tabs during cross-release display.

## Expected File Changes

Likely changed files:

- `components/RobotsBrowser.tsx`
- `components/RobotsHeader.tsx`
- `lib/uiText.ts`

Maybe changed files:

- `components/PageTabBar.tsx`
  - Prefer unchanged. Only change it if an existing uncommitted PageTabBar change must be integrated carefully.
- `lib/robotFilters.ts`
  - Prefer unchanged. Only change if a later implementation needs a separate normalized query field while preserving raw `query`.

Likely unchanged files:

- `data/robots.ts`
- `lib/search.ts`
- `lib/display.ts`
- `components/RobotCard.tsx`
- `components/SelectControl.tsx`
- `components/SearchInput.tsx`

## Implementation Steps

1. Pre-flight working tree check:

   ```bash
   git status --short
   ```

   Requirements:

   - Do not overwrite unrelated user changes.
   - If `components/PageTabBar.tsx` has existing uncommitted changes, inspect them before editing `RobotsHeader`.
   - Keep this plan's implementation scoped to robot release/filter display logic.

2. Baseline verification:

   ```bash
   npm run build
   ```

3. In `RobotsBrowser`, derive:

   ```ts
   const hasQueryFilter = normalizeSearchText(filters.query) !== '';
   const hasActiveFilters =
     hasQueryFilter ||
     filters.industry !== null ||
     filters.task !== null ||
     filters.manufacturer !== 'all' ||
     filters.availability !== 'all';
   ```

   Reuse `normalizeSearchText` from `lib/search.ts`.
   Do not use `filters.query !== ''` because whitespace-only queries should not activate cross-release mode.
   Do not normalize the returned `filters.query` value because it is the visible search input value.

4. Pass `isCrossReleaseMode={hasActiveFilters}` to `RobotsHeader`.

5. Update `RobotsHeader`:

   - normal mode: render current `PageTabBar`.
   - cross-release mode: render static count badges/text, not `role="tab"` controls.

6. Add a small local render helper or local section component for grouped robot cards.

7. For normal mode:
   - Keep current rendering path using `filtered`.

8. For active filter mode:
   - Render `activeRobots` and `preReleaseRobots` grouped.
   - If both are empty, show the existing `EmptyState`.
   - If one group is empty, omit it for now.
   - Render a result count line immediately before sections:
     - total: `activeRobots.length + preReleaseRobots.length`
     - use a new `uiText` helper or `uiText.common.results(total, true)`.
   - Include counts in section headings:
     - `販売中・限定販売（n件）`
     - `開発中・プロトタイプ（n件）`

9. Add Japanese UI copy in `lib/uiText.ts`:
   - `robots.filteredAcrossRelease`
   - `robots.activeSection`
   - `robots.preReleaseSection`
   - `robots.releaseCountSummary` or reuse section labels/counts if simpler.

10. Run:

   ```bash
   npm run build
   ```

11. Manual check on `/robots`.

## Manual Checklist

- `/robots` with no filters:
  - Default still shows `販売中`.
  - Switching to `開発中` still works.

- `/robots?q=1x` from default `販売中`:
  - `NEO` is visible in an `開発中` section.
  - The page does not show a misleading zero-result state.
  - Header does not render clickable release tabs that imply the grid can be narrowed.
  - Static release counts are visible.

- `/robots?q=倉庫`:
  - Matching `販売中` and `開発中` groups render if present.
  - Digit generation duplication is not addressed in this change.

- `/robots?manufacturer=onex`:
  - `NEO` is visible even if the release tab was previously `販売中`.

- `/robots?release=pre` with no other filters:
  - Still behaves as the existing `開発中` tab.

- `/robots?q=%20`:
  - Treated as no search/filter.
  - Does not enter cross-release mode.

- Active filter chips:
  - Existing chips still remove filters correctly.

## Risks And Mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Tabs look selected while both release groups are shown | High | Do not render interactive `PageTabBar` during cross-release mode. Render static count badges/text instead. |
| Whitespace query activates cross-release mode | Medium | Use `normalizeSearchText(filters.query) !== ''` for `hasActiveFilters` while preserving raw `filters.query` for display. Add manual check for `/robots?q=%20`. |
| Result count becomes confusing | Medium | Show total count above grouped results and include counts in section headings. |
| Duplicated card rendering code grows | Low | Use a small local render helper in `RobotsBrowser`, not a broad abstraction. |
| Release URL state conflicts with cross-tab display | Medium | Keep `release` in URL untouched, but make active filters take display precedence. Document this behavior in UI copy. |
| Users expect release tab click to narrow even during filter mode | Medium | Hide interactive release tabs in cross-release mode. If feedback asks for release narrowing, add explicit `すべて / 販売中 / 開発中` later. |
| Existing uncommitted shared UI changes are overwritten | Low | Start with `git status --short`; inspect PageTabBar-related changes before editing. |

## Alternative Considered

Add an explicit `すべて` release tab.

Pros:

- Conceptually clear.
- Users can intentionally search across all release buckets.

Cons:

- Adds a new URL state value and changes the release tab model.
- More scope than needed for the current "I searched but valid result is hidden" bug.
- Requires more design work around default state and counts.

Decision:

- Do not add `すべて` in this first pass.
- Use cross-release display only when search/filter intent is active.
- Make release counts static in cross-release mode so the UI does not expose non-functional tabs.

## Recommendation

Implement the minimal display-layer fix first.

This gives the user the expected result for `1x`, manufacturer filters, and other search/filter cases without restructuring data or changing the release taxonomy.
