# Compare Visual Noise Reduction Plan

Created: 2026-06-10
Status: planning only
Target page: `/compare`

## Purpose

Reduce the "visually noisy / awkward" feel of the `/compare` page while preserving the existing comparison workflow, drag-and-drop behavior, URL state, favorites state, and data model.

The main problem is not a broken interaction. The current UI works, but the visual hierarchy is too fragmented:

- Too many borders inside each comparison card.
- Too many nested background surfaces across the page.
- The comparison sheet header appears detached from the card grid.
- The right sidebar and center sheet use different visual rules.
- D&D insertion/placeholder states can look heavier than the actual cards.

This plan is intentionally scoped to visual structure and spacing. It does not change comparison data, sorting logic, favorite persistence, or URL semantics.

## Planning Inputs

This plan follows:

- `ai_implementation_workflow_prompt.md`
  - Existing Code First.
  - Minimal Correct Change.
  - Behavior Preservation.
  - Accessibility and responsive checks.
  - Explicit validation and manual confirmation.
- `docs/planning/ui-investigation-prompt-template.md`
  - Established container, spacing, typography, token, card, a11y, and EmptyState standards.
  - No raw colors.
  - Avoid over-rounded cards, glassmorphism, gradients, and decorative marketing patterns.

## Investigated Files

- `components/CompareClient.tsx`
  - Owns `/compare` page layout, left menu, center sheet, right favorites panel, D&D context, selected robot count, and clear-all action.
- `components/ComparisonRobotPanel.tsx`
  - Owns the comparison card surface, header, tabs, image area, basic rows, detailed rows, favorite/remove actions, and tab panels.
- `components/compare/CompareParts.tsx`
  - Owns drag overlay card and insertion preview card visual states.
- `components/SortableCompareCard.tsx`
  - Owns sortable wrapper, placeholder opacity, transform, and temporary z-index during drag.
- `components/FavoriteCard.tsx`
  - Owns favorite sidebar card surface and overlay click target.
- `src/app/globals.css`
  - Owns `.site-container`, `.card-data`, tokens, global focus-visible, and z-index tokens.
- `package.json`
  - Confirms available validation scripts: `npm run build`, `npm run validate:data`.

## Current Findings

| # | Category | Problem | Code location | Severity |
|---|---|---|---|---|
| 1 | Card borders | Card body rows use `border-b border-border`, same token family as the card outer border, making internal rules as strong as the card boundary. | `components/ComparisonRobotPanel.tsx:181`, `components/ComparisonRobotPanel.tsx:208` | Medium |
| 2 | Card hierarchy | Header, tablist, image, and rows are separated by consecutive `border-b border-border`, so the card reads as stacked table strips. | `components/ComparisonRobotPanel.tsx:64`, `components/ComparisonRobotPanel.tsx:122`, `components/ComparisonRobotPanel.tsx:167` | Medium |
| 3 | Row density | Basic/detail rows use `space-y-2` and `pb-1.5`, leaving little vertical breathing room between text and rules. | `components/ComparisonRobotPanel.tsx:176-184`, `components/ComparisonRobotPanel.tsx:204-212` | Medium |
| 4 | Header controls | Favorite/remove buttons use `gap-1` and `p-1.5`; the action group feels cramped relative to the title block. | `components/ComparisonRobotPanel.tsx:74`, `components/ComparisonRobotPanel.tsx:90-114` | Low |
| 5 | Image/metadata balance | The image area is fixed at `aspect-[4/3]`, while metadata is pushed down with `mt-auto`, which can over-weight the gray image block. | `components/ComparisonRobotPanel.tsx:167`, `components/ComparisonRobotPanel.tsx:176` | Medium |
| 6 | Center sheet hierarchy | The count/clear row is outside the sheet drop container, while the grid is inside `border bg-muted p-*`; visually this creates a detached header and a heavy gray box. | `components/CompareClient.tsx:433-479` | Medium |
| 7 | Box-in-box surfaces | Page background, center `bg-muted` sheet, card `bg-card`, card header `bg-muted`, image `bg-muted`, and right panel `bg-muted` create too many surface changes. | `components/CompareClient.tsx:328`, `components/CompareClient.tsx:476`, `components/ComparisonRobotPanel.tsx:62-167`, `components/CompareClient.tsx:559` | High |
| 8 | Center/right mismatch | Center sheet grid and right favorites panel use different container rules, making parallel work areas feel unrelated. | `components/CompareClient.tsx:433-596` | Medium |
| 9 | D&D preview weight | Insertion preview uses `min-h-[26rem]`, dashed ring border, multiple internal borders, and opacity; it can differ visually from the actual card footprint. | `components/compare/CompareParts.tsx:178-198` | Medium |
| 10 | Drag placeholder opacity | Sortable placeholder uses `opacity-40`; combined with layout preview and card shadows, this can read as flicker or gapping during movement. | `components/SortableCompareCard.tsx:43-45` | Watch |

## Design Direction

Use fewer hard dividers and rely more on spacing, muted text, and grouped surfaces.

Principles:

- Keep data-dense B2B feel. Do not turn comparison cards into marketing cards.
- Keep rectangular/low-radius cards. No `rounded-xl`, glassmorphism, gradients, or decorative shadows.
- Use tokenized colors only: `bg-card`, `bg-muted`, `border-border`, `border-border-subtle`, `text-muted-foreground`, etc.
- Prefer reducing borders over adding new color accents.
- Preserve semantic HTML: `article`, `dl`, `dt`, `dd`, `role="tab"`, `role="tabpanel"`.
- Preserve existing D&D state and keyboard behavior.

## Scope

Do in this change:

- Lighten comparison card internal dividers.
- Increase row vertical breathing room slightly.
- Separate tabs from the data area with spacing/surface hierarchy instead of repeated strong borders.
- Relax card header action spacing.
- Rebalance the image/metadata area without removing images.
- Reduce center sheet box weight and make count/clear read as part of the sheet header.
- Align center sheet and right favorites panel visual rules where feasible.
- Keep right-panel changes container-first; `FavoriteCard.tsx` is only a fallback if the mismatch remains after container/header/spacing alignment.
- Soften insertion preview to match the actual card footprint more closely.

Do not do in this change:

- Do not change `MAX_COMPARE_ROBOTS`.
- Do not change `compare` URL query format.
- Do not change `useFavorites` or localStorage behavior.
- Do not change robot/manufacturer data or display row generation helpers.
- Do not remove D&D, tabs, favorite buttons, or remove buttons.
- Do not add a new UI library.
- Do not introduce broad global token changes unless local token usage is impossible.
- Do not redesign the left manufacturer menu in this pass, except if center/right changes require a tiny alignment tweak.

## Component Strategy

### 1. `ComparisonRobotPanel`: card noise reduction

Planned changes:

- Outer card:
  - Keep `border border-border bg-card`.
  - Do not add larger radius or heavier shadow.
- Header:
  - Keep header `bg-muted` only if it helps drag affordance.
  - Reduce separator strength from a full `border-b border-border` to either `border-b border-border-subtle` or no border with stronger internal spacing.
  - Increase title/action spacing: `gap-3` -> `gap-4`, action group `gap-1` -> `gap-2`.
  - Keep action buttons keyboard focusable and preserve `onPointerDown` propagation guard.
- Tabs:
  - Avoid tablist + image + row borders all stacking.
  - Keep active tab indicator but reduce adjacent separators.
  - Consider `bg-muted` inactive tabs and `bg-card` active tabs, but avoid a heavy full-width rule directly below the tabs.
- Basic rows:
  - Keep `dl/dt/dd`.
  - Replace strong row `border-b border-border pb-1.5` with lighter separators or spacing-first layout:
    - Option A: `border-b border-border-subtle pb-2.5`.
    - Option B: no row borders, use `gap-y-2.5` and muted labels.
  - Preferred first pass: Option A, because users compare row-by-row and subtle separators preserve scanability.
- Detail rows:
  - Apply the same row rule as basic rows.
  - Reduce the `h4` divider strength or replace `border-b` with spacing.
- Image area:
  - Keep `object-contain`.
  - Consider changing `aspect-[4/3]` to a capped height with responsive aspect constraints, or reduce visual weight by using a softer background and removing the strong bottom border.
  - Do not crop robot images.

### 2. `CompareClient`: sheet and side panel hierarchy

Planned changes:

- Center sheet header:
  - Treat `comparisonSheet(count,max)` and clear-all as a compact sheet toolbar.
  - Place it visually closer to the card grid.
  - Avoid making it look like a separate strip floating above a heavy gray box.
- Center sheet container:
  - Reduce or remove `border border-border bg-muted` on the populated sheet wrapper.
  - Keep enough drop target styling for D&D feedback.
  - Prefer `bg-transparent` or a very light `bg-muted/50` style if supported by Tailwind token usage.
  - If the border is removed, keep active drop ring on the droppable wrapper.
- Right favorites panel:
  - Align container weight with left menu and center sheet.
  - Avoid making the right panel look like a separate card family from the center sheet.
  - First try to solve this in `CompareClient.tsx` by adjusting only the right panel container, header, and internal spacing.
  - `FavoriteCard.tsx` is a fallback change only: if the right panel remains visibly mismatched because `FavoriteCard` uses `card-data`, allow a local class adjustment that preserves the overlay click target, remove button, hover behavior, and `onSelect`/`onRemove` semantics.

### 3. `CompareParts`: D&D preview smoothing

Planned changes:

- `CompareInsertionPreviewCard`:
  - Reduce internal border count to match the real card after card changes.
  - Revisit `min-h-[26rem]`; prefer matching actual card min height or letting grid/card content define height.
  - Keep `aria-hidden`.
- `CompareDragOverlayCard`:
  - Keep transient shadow if helpful, but avoid making overlay visually heavier than the resting card.
  - Do not add new animation libraries.

### 4. `SortableCompareCard`: placeholder behavior

Planned changes:

- Do not change D&D logic in the first pass.
- After visual changes, manually verify whether `opacity-40` still causes gapping/flicker.
- If still awkward, consider a small visual-only change:
  - `opacity-40` -> `opacity-25` or a placeholder class that preserves the footprint with less visual content.

## Reused Existing Code

- `cn` from `@/lib/utils` for conditional class composition.
- Existing `uiText` labels and aria text.
- Existing `getComparisonCoreRows` and `getComparisonDetailRows`.
- Existing `ComparisonRobotPanel` structure, rather than a new card component.
- Existing D&D helpers in `lib/compare/dnd.ts`.
- Existing Tailwind tokens from `globals.css`.

## New Code

No new component is planned in the first implementation.

Optional local helper only if duplication becomes noisy:

- A local row class constant inside `ComparisonRobotPanel.tsx`, e.g. `comparisonRowClassName`, if the same row classes are repeated for basic and detail rows.

Do not add a shared design-system component in this pass. The pattern is currently specific to comparison cards and should prove itself locally first.

## Files To Change

| File | Planned change |
|---|---|
| `components/ComparisonRobotPanel.tsx` | Main card visual cleanup: separators, row padding, header/action spacing, tab/data transition, image area balance. |
| `components/CompareClient.tsx` | Center sheet toolbar/container hierarchy, center/right surface alignment, drop target visual weight. |
| `components/compare/CompareParts.tsx` | Insertion preview and drag overlay visual weight adjustments to match new card rules. |
| `components/SortableCompareCard.tsx` | Optional placeholder opacity tweak only if manual D&D verification still shows gapping/flicker. |
| `components/FavoriteCard.tsx` | Optional fallback only if right panel mismatch cannot be solved by container/header/spacing changes in `CompareClient.tsx`. |

Implementation note:

- `components/FavoriteCard.tsx` is listed because it is the fallback location for right-panel card mismatch.
- If implementation shows container-only changes are sufficient, leave `FavoriteCard.tsx` unchanged and record that explicitly in the final implementation summary.

## Files Not To Change

| File | Reason |
|---|---|
| `src/app/compare/page.tsx` | Suspense/data injection only; no visual issue lives here. |
| `lib/compare/dnd.ts` | D&D semantics and collision logic should remain unchanged. |
| `lib/useFavorites.ts` | Favorite persistence is behavior, not visual noise. |
| `lib/useUrlFilters.ts` | URL state is out of scope. |
| `lib/robotDisplay.ts` | Row content generation is out of scope; only presentation changes. |
| `data/*.ts` | No data changes required. |
| `components/EmptyState.tsx` | Empty state is not part of the reported card noise issue. |
| `src/app/globals.css` | Avoid global token changes unless local classes cannot solve the issue. |

## Implementation Order

1. Baseline verification:

   ```bash
   npm run build
   ```

2. Update `ComparisonRobotPanel.tsx` first:
   - Lighten header/tabs/image separators.
   - Increase row padding and/or move to subtler row dividers.
   - Adjust header action spacing.
   - Keep tab roles and `aria-*` unchanged.

3. Verify the card in isolation through static inspection:

   ```bash
   rg -n "border-b border-border|pb-1.5|gap-1|aspect-\\[4/3\\]|mt-auto" components/ComparisonRobotPanel.tsx
   ```

4. Update `CompareClient.tsx`:
   - Reduce populated sheet wrapper weight.
   - Make count/clear read as a sheet toolbar.
   - Keep `setNodeRef` and active drop ring on droppable wrappers.
   - Do not remove all sheet spacing: even if `border`/`bg-muted` are weakened, keep minimum outer padding around the grid, such as `p-2 sm:p-3`, so cards and insertion previews do not sit flush against the drop target edge.
   - Treat wrapper padding as drop-target breathing room; keep grid `gap-4` responsible for card-to-card spacing.
   - Do not change state update handlers.

5. Update `CompareParts.tsx`:
   - Match insertion preview visual weight to the revised card.
   - Revisit `min-h-[26rem]` only if it visibly differs from real cards.

6. Optional only after manual D&D check:
   - If placeholder/flicker remains, adjust `SortableCompareCard.tsx` placeholder opacity or visual placeholder class.
   - If right panel mismatch remains after `CompareClient.tsx` container changes, make the smallest local `FavoriteCard.tsx` class adjustment needed, preserving behavior and documenting why a container-only fix was insufficient.

7. Final verification:

   ```bash
   npm run build
   ```

   Optional static checks:

   ```bash
   rg -n "border-b border-border|border border-border bg-muted p-3|sm:p-4|min-h-\\[26rem\\]" components/ComparisonRobotPanel.tsx components/CompareClient.tsx components/compare/CompareParts.tsx
   rg -n "shadow-2xl|opacity-40" components/compare/CompareParts.tsx components/SortableCompareCard.tsx
   ```

   Interpretation:
   - First command checks likely cleanup targets. Any remaining match should be intentionally justified.
   - Second command checks watch items. `shadow-2xl` and `opacity-40` may remain if manual D&D review says they are acceptable.

## Impact Scope

User-visible changes:

- Comparison cards should feel calmer and less table-like.
- Rows should feel less cramped.
- Center sheet should feel less like a gray box containing cards.
- Center sheet and favorites panel should feel more related.
- D&D preview should feel closer to the resting card style.

Behavior preserved:

- Selecting robots from left menu.
- Clearing all selected robots.
- Removing selected robots.
- Favorite toggling.
- Dragging menu/favorite robots into the sheet.
- Sorting selected cards.
- URL query order.
- localStorage favorites.
- Keyboard tab behavior.

## Risks And Mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Row separators become too weak for comparison scanning. | Users compare values row-by-row. | Prefer subtle separators in first pass instead of removing all row dividers. |
| Drop target becomes unclear after reducing sheet border/background. | D&D relies on visible target feedback. | Preserve active `ring-2 ring-ring ring-offset-2` state on droppable wrappers. |
| Card height changes cause grid/D&D layout jumps. | D&D sorting relies on stable card footprints. | Change spacing incrementally; verify sorting and insertion preview after card changes. |
| Image area reduction makes robot images harder to inspect. | Robot image inspection is important. | Keep `object-contain`; do not crop; only reduce border/background weight first. |
| Tab accessibility regresses. | Tabs currently use roles and aria bindings. | Do not change tab state, ids, `role`, `aria-selected`, or keyboard handler. |
| Right sidebar alignment changes affect favorite card click targets. | Favorite cards have overlay buttons and remove controls. | Avoid changing `FavoriteCard` unless manual check shows panel mismatch cannot be solved in `CompareClient`. |
| D&D overlay stacking changes unexpectedly. | Drag overlay must remain visible above local surfaces. | Avoid z-index changes unless a verified overlap bug appears. |

## Manual Confirmation Checklist

- [ ] `/compare` loads without runtime errors.
- [ ] Comparison cards no longer read as heavy bordered tables.
- [ ] Basic rows remain easy to scan horizontally.
- [ ] Detailed tab rows remain readable and not cramped.
- [ ] Header action buttons have enough visual breathing room.
- [ ] Image area still shows robots clearly without cropping.
- [ ] Count/clear toolbar no longer makes cards feel pushed down.
- [ ] Center sheet no longer feels like a heavy gray box inside the page.
- [ ] Right favorites panel feels visually related to the center sheet.
- [ ] Empty sheet still accepts drops.
- [ ] Populated sheet still accepts drops.
- [ ] Sorting cards still works.
- [ ] Insertion preview does not cause obvious height jumps.
- [ ] Drag overlay remains visible and not heavier than the resting card.
- [ ] 375px width has no unexpected horizontal page scroll.
- [ ] Keyboard tab switching still works with Left/Right arrows.
- [ ] Keyboard focus can still reach comparison card drag handles/actions.
- [ ] Existing keyboard sortable behavior for comparison cards is not broken.
- [ ] Favorite and remove buttons remain focusable and clickable.

## Validation Commands

Required:

```bash
npm run build
```

Optional:

```bash
npm run validate:data
```

Static inspection:

```bash
rg -n "border-b border-border|border border-border bg-muted p-3|sm:p-4|min-h-\\[26rem\\]" components/ComparisonRobotPanel.tsx components/CompareClient.tsx components/compare/CompareParts.tsx
rg -n "shadow-2xl|opacity-40" components/compare/CompareParts.tsx components/SortableCompareCard.tsx
```

Interpretation:

- First command checks likely cleanup targets. Any remaining match should be intentionally justified.
- Second command checks watch items. `shadow-2xl` and `opacity-40` may remain if manual D&D review says they are acceptable.

Do not report optional/manual checks as completed unless actually run.

## Residual Risks

- This plan is based on code inspection plus the reported visual issues. It does not include screenshot-based measurement.
- The best balance between row separators and spacing is visual; one small follow-up may be needed after browser review.
- D&D gapping may have both visual and layout-timing causes. This plan treats the visual side first and avoids changing D&D logic unless necessary.
- Current worktree contains unrelated uncommitted/untracked files; implementation must stage only the files listed in this plan.
