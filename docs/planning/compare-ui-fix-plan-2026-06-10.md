# Compare Page UI Fix Plan

Created: 2026-06-10
Status: planning only
Target page: `/compare`

## Purpose

Bring the `/compare` page UI into alignment with the established Deploid UI standards while preserving the existing comparison behavior, drag-and-drop behavior, URL state, and favorites state.

This plan addresses only the UI issues found in the compare page investigation:

- Page heading scale and line-height.
- Page vertical rhythm.
- Sidebar heading role and visual treatment.
- Empty state reuse.
- Sticky sidebar stacking verification.

It does not redesign the comparison workflow, change D&D semantics, or modify robot/manufacturer data.

## Existing Findings

Checked files:

- `ai_implementation_workflow_prompt.md`
- `docs/planning/ui-investigation-prompt-template.md`
- `src/app/compare/page.tsx`
- `components/CompareClient.tsx`
- `components/compare/CompareParts.tsx`
- `components/ComparisonRobotPanel.tsx`
- `components/SortableCompareCard.tsx`
- `components/FavoriteCard.tsx`
- `components/EmptyState.tsx`
- `components/Breadcrumbs.tsx`
- `src/app/globals.css`
- `lib/uiText.ts`
- `lib/compare/dnd.ts`

Confirmed implementation facts:

- `/compare` page itself only wraps `CompareClient` in `Suspense`; the UI is in `components/CompareClient.tsx`.
- The page uses `.site-container`, matching the global container rule in `globals.css`.
- Current comparison state is URL-backed through `compare` query and local state synchronization in `CompareClient`.
- Favorites are backed by `useFavorites` and localStorage.
- D&D behavior is implemented through `@dnd-kit/core`, `@dnd-kit/sortable`, and helpers in `lib/compare/dnd.ts`.
- `EmptyState` already supports `message`, `variant`, `size`, `className`, `icon`, and `description`.
- Global focus-visible styling exists in `globals.css`.
- z-index tokens exist as `--z-overlay`, `--z-header`, `--z-dropdown`, `--z-modal`, and `--z-toast`; if z-index is needed, it should be consumed through `z-[var(--z-*)]`.

## Problem List

| # | Category | Problem | Location | Severity |
|---|---|---|---|---|
| 1 | Typography | h1 lacks `md:text-3xl` and `leading-tight`, unlike the established detail-page heading standard. | `components/CompareClient.tsx:332` | Medium |
| 2 | Spacing | Page wrapper uses `py-12`, which is larger than the established `py-8` detail-section rhythm and listing-page `py-5` pattern. | `components/CompareClient.tsx:328` | Low |
| 3 | Typography | Sidebar headings are semantic `h2` elements but styled as `text-xs`; they are neither standard section headings nor standard label headings. | `components/CompareClient.tsx:364`, `components/CompareClient.tsx:579` | Medium |
| 4 | Reuse | Main comparison empty state is custom markup instead of `EmptyState`. | `components/CompareClient.tsx:453-485` | Medium |
| 5 | Reuse | Favorites empty state is custom markup instead of `EmptyState`. | `components/CompareClient.tsx:587-595` | Low |
| 6 | z-index | Sticky sidebars have no explicit z-index. This is only a watch item unless an actual overlap bug is observed. | `components/CompareClient.tsx:359`, `components/CompareClient.tsx:573` | Watch |

## Reflected Review Findings

This revision reflects a plan audit after the initial draft.

Changes applied:

- Clarify that `EmptyState` owns `border`, `background`, and `padding`; the outer droppable wrapper should keep only ref, ring/transition, layout, and minimum-height responsibilities.
- Remove sticky sidebar z-index changes from the implementation scope because no actual stacking bug has been confirmed.
- Correct the sidebar heading rationale from "landmarks" to "page outline".
- Explicitly decide that empty-state titles do not need heading semantics in this pass; the page will follow the existing `EmptyState` paragraph-based contract.
- Strengthen the optional `rg` inspection so it checks the intended implementation results directly.

## Scope

Do in this change:

- Adjust `/compare` page heading class to match the established page heading scale.
- Normalize `/compare` page top/bottom spacing to a project-consistent value.
- Decide and apply one sidebar heading treatment.
- Replace the two custom empty states with `EmptyState`.
- Reuse existing icons and text from `lib/uiText.ts`; add no new copy unless strictly required.
- Preserve drag-and-drop, comparison order, URL query behavior, and favorite behavior.

Do not do in this change:

- Do not change `lib/compare/dnd.ts` behavior.
- Do not change `MAX_COMPARE_ROBOTS`.
- Do not change the `compare` URL parameter format.
- Do not change localStorage key or favorite persistence behavior.
- Do not redesign `ComparisonRobotPanel`.
- Do not introduce new UI libraries.
- Do not make broad design-system or global token changes.
- Do not add z-index to sticky sidebars unless implementation/manual verification reveals a real overlap issue.

## Design Decisions

### Page Heading

Use the established detail-page h1 pattern:

```tsx
text-2xl md:text-3xl font-semibold leading-tight
```

Reasoning:

- `/compare` is a top-level page, but it still has a standard page title and supporting paragraph.
- Other detail pages already use `text-2xl md:text-3xl font-semibold leading-tight`.
- This is a local class change with no behavioral side effects.

### Page Spacing

Change the page wrapper from `py-12` to `py-8`.

Reasoning:

- The established large-section rhythm is `py-8`.
- The compare page is an operational tool, so tighter spacing is preferable to a marketing-style opening gap.
- `Breadcrumbs` already contributes `mb-6`, and the title block contributes `mb-8`, so the page will not become cramped.

Alternative considered:

- `py-5 sm:py-8`, matching several listing pages.
- Rejected for this pass because `/compare` has a substantial three-column work area and should keep a little more vertical breathing room than dense list pages.

### Sidebar Headings

Treat the sidebar titles as compact section labels, not full content-section h2s.

Proposed class:

```tsx
text-xs font-medium uppercase tracking-wide text-muted-foreground
```

Reasoning:

- The sidebars are controls/supporting panels, not primary content sections.
- This matches the documented label-heading style.
- Keeping `h2` preserves the page outline without visually over-weighting side panels.

Risk:

- Japanese labels such as `メーカー` and `お気に入り` are not meaningfully uppercased, but `uppercase` is harmless and keeps consistency with the label-heading convention.

### Empty States

Use `EmptyState` for both empty areas:

- Main comparison sheet:
  - `message={uiText.comparison.emptyTitle}`
  - `description={uiText.comparison.emptyDescription(MAX_COMPARE_ROBOTS)}`
  - `variant="muted"`
  - `size="large"`
  - The outer droppable wrapper keeps `ref={setNodeRef}`, minimum height, centering/layout, transition, and active ring classes.
  - `EmptyState` owns the visible `border`, `background`, text alignment, and padding. Do not leave duplicate `border`, `bg-*`, `p-*`, or `sm:p-*` styling on the outer droppable wrapper.
- Favorites panel:
  - `message={uiText.favorites.empty}`
  - `description={uiText.favorites.emptySub}`
  - `variant="muted"`
  - Use the existing `Star` icon through `icon`.
  - Let `EmptyState` own the empty panel border/background/padding instead of wrapping it in another styled empty-state box.

Reasoning:

- `EmptyState` already supports the needed props.
- This removes duplicate empty-state structure without changing copy.
- The droppable ref and ring behavior must remain on the active drop area wrapper, not be lost during component replacement.
- `EmptyState` renders `message` as a paragraph, not a heading. This pass accepts that semantic change and aligns with the shared component contract; do not modify `EmptyState` just to preserve the previous local `h3`.

### Sticky z-index

Do not add z-index to the sticky sidebars in the initial implementation.

Reasoning:

- The current sidebars do not hardcode a z-index, and no actual overlap bug has been confirmed.
- `--z-overlay` is already used for the mobile navigation backdrop in `components/Header.tsx`; reusing it for local sticky panels could change stacking behavior with mobile nav, drag overlays, or other local UI.
- Tokenized z-index should be added only in response to a verified layering problem, not merely because a sticky element exists.

Verification condition:

- During manual checks, confirm sticky sidebars do not cover the global header and that `DragOverlay` remains visible while dragging.
- If a stacking bug is observed, document the exact overlap and choose an existing token that preserves this order: page content/sticky local panels below `DragOverlay` as needed, below mobile nav dropdown, and below global header/modal layers.

## Reused Existing Code

- `components/EmptyState.tsx`
  - Reused for comparison-sheet empty state and favorite empty state.
- `lib/uiText.ts`
  - Existing empty-state copy and aria copy remain the source of truth.
- `src/app/globals.css`
  - Existing `.site-container`, focus-visible rule, and z-index tokens remain the source of truth.
- `lucide-react`
  - Existing `Star` import can be reused for the favorites empty-state icon.

## New Code

No new component or helper is planned.

No new data type, URL parameter, constant, hook, or library is planned.

## Files To Change

| File | Planned change |
|---|---|
| `components/CompareClient.tsx` | Import `EmptyState`; adjust h1 class; change page wrapper spacing; align sidebar heading classes; replace two custom empty states while avoiding duplicate wrapper styling. |

## Files Not To Change

| File | Reason |
|---|---|
| `src/app/compare/page.tsx` | It only handles metadata, Suspense, and data injection. No UI issue lives here. |
| `components/compare/CompareParts.tsx` | D&D helper UI did not contain the target issues except drag overlay shadow, which is intentional transient feedback and out of scope. |
| `components/ComparisonRobotPanel.tsx` | Card internals and tab behavior are out of scope for this small UI alignment pass. |
| `components/SortableCompareCard.tsx` | D&D sorting wrapper is behavior-critical and not needed for the UI fixes. |
| `components/FavoriteCard.tsx` | Favorite card display is reused elsewhere and not required for the reported issues. |
| `components/EmptyState.tsx` | Existing props already cover this use case. Avoid broad common-component changes. |
| `lib/uiText.ts` | Existing copy appears sufficient. Add copy only if implementation reveals a missing label. |
| `lib/compare/dnd.ts` | D&D semantics are not part of this plan. |
| `data/*.ts` | No data changes are required. |

## Implementation Order

1. Run a baseline build:

   ```bash
   npm run build
   ```

2. Update `components/CompareClient.tsx` imports:
   - Add `EmptyState`.
   - Keep existing icons and D&D imports unchanged.

3. Normalize page-level classes:
   - `site-container py-12` -> `site-container py-8`.
   - h1 -> `text-2xl md:text-3xl font-semibold leading-tight text-foreground mb-2`.

4. Normalize sidebar heading classes:
   - Left sidebar h2 and right sidebar h2 use the label-heading class.
   - Preserve `h2` tags unless a later accessibility review recommends `span` plus labelled regions.

5. Replace main comparison empty state:
   - Keep the outer droppable element with `ref={setNodeRef}`, minimum height, centering/layout, transition, and active ring classes.
   - Remove duplicate outer `border`, `bg-muted`, `p-8`, and `sm:p-16` empty-state styling that would conflict with `EmptyState`.
   - Replace the inner custom icon/title/description markup with `EmptyState`.
   - Ensure the active drop target still has a visible ring.
   - Accept the shared `EmptyState` paragraph semantics for `message`; do not add a local `h3` or change `EmptyState` globally in this pass.

6. Replace favorites empty state:
   - Keep the loading placeholder while `!isMounted`.
   - Replace the empty favorites custom markup with `EmptyState`.
   - Pass `Star` as `icon`.
   - Do not wrap `EmptyState` in another styled empty-state container that duplicates border/background/padding.

7. Preserve sticky sidebar stacking unless a verified overlap bug appears:
   - Do not add `z-[var(--z-overlay)]` by default.
   - During manual verification, check header, mobile nav, and drag overlay stacking.

8. Run verification commands and manual checks.

## Impact Scope

User-visible changes:

- `/compare` title becomes slightly larger on medium and larger screens.
- `/compare` page top/bottom spacing becomes tighter.
- Sidebar titles become visually more like compact labels.
- Empty states become visually consistent with other pages.

Behavior preserved:

- Selecting robots from the manufacturer menu.
- Removing selected robots.
- Dragging from menu to sheet.
- Dragging favorites to sheet.
- Sorting cards inside the sheet.
- Dragging sheet cards to favorites.
- URL query `compare` order and sharing behavior.
- Favorite add/remove behavior and localStorage persistence.
- 9-item comparison limit.

## Risks And Mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Droppable empty sheet stops working after replacing custom markup. | The empty-state wrapper currently holds `setNodeRef`; losing it would break empty-sheet drops. | Keep `ref={setNodeRef}` on the same outer drop container and place `EmptyState` inside it. |
| EmptyState `size="large"` plus existing wrapper padding creates excessive spacing. | The current wrapper has `p-8 sm:p-16`, while `EmptyState` can also add `p-16`. | Move visual responsibility to `EmptyState`: border/background/padding live there; the outer droppable wrapper keeps only ref, min-height/layout, ring, and transition. |
| EmptyState replacement changes the empty title from `h3` to paragraph text. | The current local empty state uses a heading, while `EmptyState` renders `message` as `<p>`. | Accept this semantic change for consistency with the shared component. Do not broaden scope by changing `EmptyState` globally. |
| Sidebar h2 label styling weakens section discoverability. | Labels are smaller and muted. | Keep semantic `h2`; only change visual class. Manual check the page outline and visual hierarchy. |
| Sticky sidebar stacking issue remains undiscovered. | The plan does not add z-index by default. | Manual check header, mobile nav, and drag overlay stacking. Add z-index only in a follow-up or implementation note if a real bug is observed. |
| Build catches class or import mistakes only after edits. | This is a client component with multiple imports. | Run `npm run build`; if available and useful, run TypeScript check separately. |

## Validation Commands

Run after implementation:

```bash
npm run build
```

Optional static inspection:

```bash
rg -n "EmptyState|md:text-3xl|leading-tight|text-xs font-medium uppercase tracking-wide|z-\\[var\\(--z-overlay\\)\\]|p-8|sm:p-16|w-16 h-16|text-center py-8" components/CompareClient.tsx
```

Do not report optional checks as completed unless they were actually run.

## Manual Confirmation Checklist

- [ ] `/compare` loads without console/runtime errors.
- [ ] Breadcrumb, h1, and description spacing look balanced at desktop width.
- [ ] h1 is `text-2xl` on mobile and `md:text-3xl` on medium+ screens.
- [ ] 375px width has no unexpected horizontal page scroll.
- [ ] Manufacturer sidebar and favorites sidebar headings look like compact labels.
- [ ] Empty comparison sheet uses the shared empty-state visual and still accepts drops.
- [ ] Empty comparison sheet does not show double borders, double backgrounds, or excessive nested padding.
- [ ] Empty favorites panel uses the shared empty-state visual.
- [ ] Selecting a robot from the left menu still adds it to the comparison sheet.
- [ ] Dragging from left menu to sheet still works.
- [ ] Sorting selected comparison cards still works.
- [ ] Favorite add/remove still works.
- [ ] Sticky sidebars do not cover the global header at xl width.
- [ ] Drag overlay remains visible while dragging.

## Residual Risks

- This plan is code-reading based. It does not include screenshot or browser automation verification.
- The exact visual result of `EmptyState size="large"` inside the comparison sheet should be judged manually after implementation.
- Sticky sidebar z-index remains unchanged unless a real stacking bug is observed during implementation or manual testing.
- The compare page is an operational tool, so some deviations from detail-page typography may be acceptable by design. This plan intentionally chooses consistency over a custom tool-specific heading scale.
