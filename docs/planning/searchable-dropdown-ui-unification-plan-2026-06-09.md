# Searchable Dropdown UI Unification Plan

Created: 2026-06-09
Branch: `experiment/searchable-dropdown-ui-plan`
Status: planning only

## Purpose

Unify the visually inconsistent dropdown, search, and form-control UI around a reusable searchable dropdown pattern inspired by SmoothUI's `searchable-dropdown`, while preserving the existing catalog filtering behavior and URL state.

The goal is not to add decorative motion everywhere. The goal is to make the core controls feel intentional, consistent, keyboard-friendly, and less visually cheap.

## Existing Findings

Checked files:

- `ai_implementation_workflow_prompt.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/shadcn_migration_plan_v1.md`
- `docs/planning/sitewide-radix-color-system-plan-2026-06-03.md`
- `src/app/globals.css`
- `components/SearchInput.tsx`
- `components/SelectControl.tsx`
- `components/FormSelect.tsx`
- `components/ContactForm.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/UseCasesBrowser.tsx`

Current problems:

- `SearchInput` renders a raw `<input>` and does not reuse `components/ui/input.tsx`.
- `components/ui/input.tsx` uses `rounded-lg`, while `SearchInput`, `FormSelect`, and `ui/select` do not share a control-radius rule.
- `SelectControl` uses Radix/shadcn select, but `FormSelect` still uses a native `<select>` with separate styling.
- `ContactForm` repeats raw input and textarea classes instead of consuming shared form primitives.
- Light theme tokens make the site feel too white because `--card`, `--popover`, `--input-background`, and `--surface-raised` are all effectively white.
- Existing design docs intentionally allow rectangular data cards and rounded editorial media cards, but do not clearly define the radius for interactive controls.

## Design Decision

Use a searchable dropdown as the primary select/filter control, but do not remove all free-text search bars.

Reasoning:

- Dropdown filters such as manufacturer, industry, task, availability, country, and inquiry type benefit from internal search because they select from finite options.
- Catalog text search such as `/robots?q=...`, `/manufacturers?q=...`, and `/use-cases?q=...` is not the same interaction. Removing it would reduce discovery and break the current URL-filter model.
- Both interactions should share a visual primitive for the search field so they look related.

## SmoothUI Component Adaptation

The SmoothUI `searchable-dropdown` code is a useful starting point, but it must be adapted before sitewide use.

Required changes:

- Make the component controlled: `value`, `onValueChange`, and optional `defaultValue`.
- Do not store selected item as the only source of truth inside the component.
- Generate unique ARIA ids with `useId()` instead of fixed ids like `dropdown-items`.
- Match the existing option shape used by `SelectControlOption`.
- Support option descriptions, but keep them optional so current filters do not need extra data.
- Replace `hover:bg-primary` with a calmer token such as `hover:bg-muted` or `hover:bg-accent`.
- Use project tokens: `bg-popover`, `text-popover-foreground`, `border-border`, `ring-ring`, `bg-input-background`.
- Align radius through one rule for controls instead of hardcoding random `rounded-*` classes.
- Keep reduced-motion support.
- Keep portal positioning, but verify scroll, resize, sticky header, and mobile behavior.
- Avoid introducing new business logic into the UI component. URL updates stay in browser components through `useUrlFilters`.

## Component Strategy

New or updated primitives:

- `components/ui/search-field.tsx`
  - Shared search input visual primitive.
  - Supports icon, clear button, `type="search"`, `aria-label`, controlled value, and consistent focus/radius.

- `components/ui/searchable-dropdown.tsx`
  - Reusable controlled dropdown for finite option sets.
  - Inspired by SmoothUI, adapted to local tokens and accessibility requirements.
  - Accepts `items`, `value`, `onValueChange`, `placeholder`, `searchPlaceholder`, `emptyMessage`, `className`.

- `components/ui/textarea.tsx`
  - Shared textarea primitive for `ContactForm`.

- `components/ui/button.tsx`
  - Optional, only if the form submit and small actions need a shared style during this pass.

Existing wrappers:

- `components/SelectControl.tsx`
  - Keep the public props if possible.
  - Internally switch from Radix `Select` to `SearchableDropdown`.
  - Preserve current callers in `/robots` and `/manufacturers`.

- `components/SearchInput.tsx`
  - Replace internals with `SearchField`, then later delete if direct `SearchField` use becomes simpler.

- `components/FormSelect.tsx`
  - Either remove and use `SelectControl`, or rewrite as a thin form-aware wrapper around `SearchableDropdown`.
  - Must preserve `name`, `required`, and submitted value behavior for Formspree.

## Scope

Do in this experiment:

- Add reusable searchable dropdown and search field primitives.
- Convert `SelectControl` consumers to the new dropdown through the existing wrapper.
- Convert `SearchInput` internals to the shared search field.
- Convert `FormSelect` or replace it with the shared select wrapper.
- Convert raw `ContactForm` input/textarea styles to shared primitives.
- Make a minimal token/radius adjustment needed for controls.

Do not do in this experiment:

- Redesign data cards, page layouts, or hero sections.
- Replace the whole shadcn/Radix setup.
- Remove full-text catalog search from listing pages.
- Add unrelated animation libraries.
- Change URL parameter names or filter semantics.
- Change content data, labels, or search matching logic.

## Implementation Order

### Phase 1: Control Tokens

1. Define the interactive control radius policy.
2. Apply it to `ui/input`, `ui/select` if still used, `search-field`, and `searchable-dropdown`.
3. Adjust control surface colors only if needed:
   - Prefer `bg-input-background` for closed controls.
   - Prefer `bg-popover` for dropdown panels.
   - Avoid raw `#ffffff` in new control code.

### Phase 2: Search Field Primitive

1. Create `components/ui/search-field.tsx`.
2. Update `components/SearchInput.tsx` to consume it.
3. Verify `/robots`, `/manufacturers`, and `/use-cases` still update `q` through `useUrlFilters`.

### Phase 3: Searchable Dropdown Primitive

1. Add `components/ui/searchable-dropdown.tsx`.
2. Use `useId()` for generated ids.
3. Add controlled selection support.
4. Add keyboard behavior:
   - Enter/Space opens from trigger.
   - Escape closes and restores focus.
   - ArrowUp/ArrowDown moves active option.
   - Home/End jumps to first/last.
   - Enter selects active option.
5. Add outside-click handling without leaking listeners.
6. Keep `prefers-reduced-motion` support.

### Phase 4: SelectControl Migration

1. Update `components/SelectControl.tsx` to wrap `SearchableDropdown`.
2. Preserve the current `SelectControlOption` type and public props.
3. Verify current URL filter pages require no caller changes:
   - `components/RobotsBrowser.tsx`
   - `components/ManufacturersBrowser.tsx`

### Phase 5: Form Controls

1. Decide whether `FormSelect` remains as a form-aware wrapper or is removed.
2. Preserve form submission with a hidden input if `SearchableDropdown` itself is button-based.
3. Convert `ContactForm` raw inputs to shared primitives.
4. Add a shared textarea primitive if needed.

### Phase 6: White Surface Adjustment

1. Review `src/app/globals.css` light tokens.
2. Make only small changes needed for control and surface separation.
3. Keep data-card design rules intact:
   - catalog/business cards remain rectangular.
   - editorial/media cards may remain rounded.

### Phase 7: Manual UI Pass

1. Check desktop and mobile layouts.
2. Check dark mode.
3. Check keyboard-only operation.
4. Check dropdown z-index around sticky headers.
5. Check that dropdown portals do not clip inside scroll containers.

## Expected File Changes

Likely changed files:

- `src/app/globals.css`
- `components/SearchInput.tsx`
- `components/SelectControl.tsx`
- `components/FormSelect.tsx`
- `components/ContactForm.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx` only if retained and normalized

Likely new files:

- `components/ui/search-field.tsx`
- `components/ui/searchable-dropdown.tsx`
- `components/ui/textarea.tsx`
- `components/ui/button.tsx` only if needed

Likely unchanged files:

- `lib/useUrlFilters.ts`
- `lib/robotFilters.ts`
- `lib/manufacturerFilters.ts`
- `lib/search.ts`
- `lib/uiText.ts`
- `data/*`

## Risks And Mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Full-text search gets removed accidentally | High | Keep listing page `q` search; only replace the visual primitive. |
| Controlled URL filter state and dropdown internal state diverge | High | Make `SearchableDropdown` controlled and derive selected label from `value`. |
| Formspree select value no longer submits | High | Preserve `name` with native select or hidden input. Verify `/contact`. |
| ARIA id collisions with multiple dropdowns | Medium | Use `useId()` for trigger/list/input ids. |
| Dropdown clipped by layout containers | Medium | Keep portal rendering and verify scroll/resize positioning. |
| Mobile dropdown positioned off-screen | Medium | Clamp width/left to viewport or use CSS constraints after first visual check. |
| Motion feels flashy for B2B UI | Medium | Shorten animation, use reduced motion, avoid excessive blur/stagger. |
| Site becomes even whiter | Medium | Use `bg-popover`/`bg-input-background` tokens and review light surface values. |
| New component duplicates Radix behavior poorly | Medium | Keep the custom dropdown scoped to searchable finite-list filters; do not replace every popover/menu. |

## Validation Commands

Run after implementation:

```bash
npm run build
```

There is no configured `lint` or `typecheck` script in `package.json`; `npm run build` is the available TypeScript/build verification path.

Optional data sanity check, only if data files are touched:

```bash
npm run validate:data
```

## Manual Checklist

- `/robots`
  - free-text search still updates `q`
  - industry/task/manufacturer/availability dropdowns select and clear correctly
  - long option labels truncate cleanly
  - keyboard operation works

- `/manufacturers`
  - free-text search still updates `q`
  - country and consultation route dropdowns work

- `/use-cases`
  - free-text search still works
  - existing chip filters are unchanged

- `/contact`
  - text inputs, textarea, and inquiry type look consistent
  - inquiry type is submitted under the correct `name`
  - disabled/submitting state still works

- Global
  - light theme no longer feels like undifferentiated white panels
  - dark mode keeps readable contrast
  - mobile width 375px has no clipping
  - dropdown does not appear behind sticky headers
  - Escape closes the dropdown and restores focus

## Open Questions

- Should interactive controls use `rounded-md` for a tighter B2B feel, or `rounded-lg` to match the current shadcn input file?
- Should the dropdown search field filter by label only, or also by optional description and aliases?
- Should filters with fewer than 6 options still use searchable dropdowns, or should they use a simpler non-search select/chip UI?
- Should `components/ui/select.tsx` remain for non-searchable selects, or should this project standardize on one dropdown primitive for all finite selections?

## Recommendation

Proceed in small commits after this planning commit:

1. `SearchField` + `SearchInput` internal replacement.
2. Controlled `SearchableDropdown` primitive.
3. `SelectControl` migration.
4. `FormSelect` and `ContactForm` migration.
5. Minimal token/radius polish.

This preserves current behavior while allowing the new dropdown UI to be tested on the highest-impact pages first.
