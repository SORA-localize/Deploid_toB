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

## Reflected Review Findings

This revision reflects a plan audit after the initial planning commit.

Changes applied:

- Treat replacing Radix `Select` with a custom searchable dropdown as a high-risk accessibility change, not a medium-risk visual refactor.
- Do not make `SearchableDropdown` the default replacement for every `SelectControl` instance.
- Keep `FormSelect` as a native `<select>` in this experiment because it has only a small option set and native form submission semantics are valuable.
- Move previously open implementation questions into a Phase 0 decision table.
- Add the missing ARIA contract, disabled-item behavior, focus restoration, and scroll/resize positioning requirements.
- Add copy ownership requirements so dropdown placeholders, empty states, and aria labels do not introduce English defaults.
- Expand validation beyond `npm run build` to include baseline build, dev-server manual checks, keyboard checks, overlay checks, and `/contact` payload verification.

## Design Decision

Use a searchable dropdown as an opt-in control for finite option sets that genuinely benefit from search. Do not remove all free-text search bars, and do not replace every Radix select by default.

Reasoning:

- Dropdown filters such as manufacturer, industry, task, availability, and country can benefit from internal search when their option count is high enough.
- Catalog text search such as `/robots?q=...`, `/manufacturers?q=...`, and `/use-cases?q=...` is not the same interaction. Removing it would reduce discovery and break the current URL-filter model.
- Both interactions should share a visual primitive for the search field so they look related.
- Existing Radix `Select` already provides a tested accessibility foundation. A custom searchable dropdown must either use Radix primitives for the popup/listbox foundation or explicitly satisfy the ARIA and focus contract in this plan before it can replace `SelectControl`.

## Phase 0 Decisions

These decisions must be treated as fixed inputs before implementation starts.

| Topic | Decision | Reason |
|---|---|---|
| Select implementation | Keep `components/ui/select.tsx` and Radix `Select` for non-searchable finite selects. Add searchable dropdown as opt-in only. | Avoid throwing away Radix keyboard, portal, and ARIA behavior for small/simple selects. |
| `SelectControl` migration | Add a `searchable` path or separate searchable wrapper; do not convert all current `SelectControl` usages blindly. | Some filters have few options and do not need a searchable overlay. |
| First searchable candidates | Start with `/robots` manufacturer filter only. Other filters can opt in later only if they have 8 or more options and the isolated keyboard/focus/overlay checks have passed. | Search adds value mainly when scanning long lists, and one initial candidate keeps regression scope small. |
| `FormSelect` / `/contact` | Keep native `<select>` in this experiment. Do not implement `SearchableDropdown` on the inquiry/contact form. Only normalize visual tokens/radius if needed. | Native `name`, `defaultValue`, `required`, disabled fieldset behavior, and browser validation are safer for Formspree. The inquiry type has only a small option set and does not need search. |
| Control radius | Use `rounded-md` for interactive controls unless a component has a documented exception. Data cards remain rectangular. | Keeps controls modern without drifting into rounded marketing UI. |
| Dropdown search matching | Match `label`, optional `description`, and optional `keywords` when supplied. | Allows useful search without duplicating business logic in the UI component. |
| Few-option controls | Controls with fewer than 8 options stay non-searchable unless explicitly marked searchable. | Avoids unnecessary complexity and motion on simple filters. |
| Text ownership | User-visible placeholders, empty messages, and aria labels come from `lib/uiText.ts` or required wrapper props. | Prevents English defaults from leaking into Japanese UI. |

## SmoothUI Component Adaptation

The SmoothUI `searchable-dropdown` code is a useful reference, but it must be adapted before any production use. It is not a drop-in replacement for Radix `Select`.

Required changes:

- Make the component controlled for this experiment: `value` and `onValueChange` are required. Do not add `defaultValue` in this pass.
- Do not store selected item as the only source of truth inside the component.
- Generate unique ARIA ids with `useId()` instead of fixed ids like `dropdown-items`.
- Match the existing option shape used by `SelectControlOption`.
- Support option descriptions and optional search keywords, but keep them optional so current filters do not need extra data.
- Replace `hover:bg-primary` with a calmer token such as `hover:bg-muted` or `hover:bg-accent`.
- Use project tokens: `bg-popover`, `text-popover-foreground`, `border-border`, `ring-ring`, `bg-input-background`.
- Align radius through one rule for controls instead of hardcoding random `rounded-*` classes.
- Keep reduced-motion support.
- Keep portal positioning, but verify scroll, resize, sticky header, and mobile behavior.
- Avoid introducing new business logic into the UI component. URL updates stay in browser components through `useUrlFilters`.
- Prefer Radix primitives for popup and focus infrastructure if the implementation can support searchable behavior cleanly. If the component is fully custom, it must satisfy the ARIA contract below before replacing any existing Radix select.

## Accessibility Contract For Custom Searchable Dropdown

If the implementation is not built on a Radix combobox/popover/listbox primitive, the custom component must implement and manually verify this contract:

- Trigger:
  - `button` trigger with `aria-haspopup="listbox"`.
  - `aria-expanded` reflects open state.
  - `aria-controls` points to the generated listbox id when open.
  - Trigger label includes the field label and selected option.
- Search input:
  - Focus moves to the search input after opening.
  - Input uses `role="combobox"` or the implementation follows an equivalent ARIA 1.2 combobox/listbox pattern.
  - Input has `aria-expanded`, `aria-controls`, and `aria-activedescendant` when an option is active.
  - Input label comes from `uiText` or a required prop.
- Listbox and options:
  - List container uses `role="listbox"` and a unique id.
  - Options use `role="option"`, stable ids, and `aria-selected`.
  - Disabled options, if added later, use `aria-disabled` and are skipped by keyboard navigation.
  - Active option is scrolled into view when keyboard navigation moves it.
- Keyboard:
  - Enter/Space opens from trigger.
  - Escape closes, clears transient search text, and restores focus to the trigger.
  - ArrowUp/ArrowDown moves active option without moving DOM focus away from the input.
  - Home/End jumps to first/last enabled option.
  - Enter selects active option.
  - Tab follows normal browser focus order and closes the popup.
- Focus and closing:
  - Outside click closes the popup.
  - Resize/scroll listeners are removed on close and unmount.
  - Closing after selection restores focus predictably, unless the browser's native flow moves focus through form submission.

## Component Strategy

New or updated primitives:

- `components/ui/search-field.tsx`
  - Shared search input visual primitive.
  - Supports icon, clear button, `type="search"`, `aria-label`, controlled value, and consistent focus/radius.

- `components/ui/searchable-dropdown.tsx`
  - Reusable controlled dropdown for finite option sets.
  - Inspired by SmoothUI, adapted to local tokens and accessibility requirements.
  - Accepts `items`, `value`, `onValueChange`, `placeholder`, `searchPlaceholder`, `emptyMessage`, `clearSearchLabel`, `className`.
  - Does not accept `defaultValue` in this experiment; URL-backed filters use controlled state only.
  - Does not provide English user-facing defaults.

- `components/ui/textarea.tsx`
  - Shared textarea primitive for `ContactForm`.

- `components/ui/button.tsx`
  - Optional, only if the form submit and small actions need a shared style during this pass.

Existing wrappers:

- `components/SelectControl.tsx`
  - Keep the public props if possible.
  - Keep Radix `Select` as the default implementation.
  - Add an explicit searchable path only after the searchable dropdown passes the accessibility contract.
  - Preserve current callers in `/robots` and `/manufacturers`; searchable behavior should be opt-in.

- `components/SearchInput.tsx`
  - Replace internals with `SearchField`, then later delete if direct `SearchField` use becomes simpler.

- `components/FormSelect.tsx`
  - Keep native `<select>` in this experiment.
  - Normalize visual styling only if needed.
  - Do not use `SearchableDropdown` on `/contact` in this experiment.
  - Do not replace with a custom dropdown unless a future plan explicitly implements native form validation, `name`, `defaultValue`, `required`, disabled fieldset behavior, initial value sync, and Formspree payload verification.

## Scope

Do in this experiment:

- Add reusable searchable dropdown and search field primitives.
- Keep Radix select available and add searchable dropdown only as an opt-in path.
- Convert `SearchInput` internals to the shared search field.
- Keep `FormSelect` native and align its visual styling with the control tokens.
- Convert raw `ContactForm` input/textarea styles to shared primitives.
- Make a minimal token/radius adjustment needed for controls.

Do not do in this experiment:

- Redesign data cards, page layouts, or hero sections.
- Replace the whole shadcn/Radix setup.
- Replace every Radix `Select` usage with a custom dropdown.
- Replace native `FormSelect` during this experiment.
- Add searchable dropdown behavior to `/contact`.
- Remove full-text catalog search from listing pages.
- Add unrelated animation libraries.
- Change URL parameter names or filter semantics.
- Change content data, labels, or search matching logic.

## Implementation Order

### Phase 1: Baseline And Control Tokens

1. Run the baseline build before implementation:

   ```bash
   npm run build
   ```

2. Apply the Phase 0 radius decision to `ui/input`, retained `ui/select`, `search-field`, and the searchable dropdown.
3. Adjust control surface colors only if needed:
   - Prefer `bg-input-background` for closed controls.
   - Prefer `bg-popover` for dropdown panels.
   - Avoid raw `#ffffff` in new control code.
4. Add any new dropdown/search copy to `lib/uiText.ts` or require it from wrapper props.

### Phase 2: Search Field Primitive

1. Create `components/ui/search-field.tsx`.
2. It must support controlled value, clear action, icon placement, `aria-label`, disabled state, and consistent focus/radius.
3. Update `components/SearchInput.tsx` to consume it.
4. Verify `/robots`, `/manufacturers`, and `/use-cases` still update `q` through `useUrlFilters`.

### Phase 3: Searchable Dropdown Primitive

1. Add `components/ui/searchable-dropdown.tsx`.
2. Prefer Radix popup/focus primitives if they can support the desired searchable pattern. If the component is custom, implement the full accessibility contract above.
3. Use `useId()` for generated trigger, input, listbox, and option ids.
4. Add controlled selection support and derive selected label from `value`.
5. Add outside-click handling without leaking listeners.
6. Add scroll/resize positioning with viewport clamping for mobile.
7. Keep `prefers-reduced-motion` support and reduce blur/stagger if it feels too animated for the B2B UI.
8. Do not wire this component into existing filters until keyboard, focus, and overlay checks pass in isolation.

### Phase 4: SelectControl Opt-In Migration

1. Keep the existing Radix `SelectControl` behavior as the default.
2. Add a searchable path only through an explicit prop or a separate wrapper.
3. Preserve the current `SelectControlOption` type and public props.
4. First candidate is only the `/robots` manufacturer filter. Low-option filters remain Radix select.
5. Verify current URL filter pages require no caller changes unless a searchable opt-in prop is intentionally added:
   - `components/RobotsBrowser.tsx`
   - `components/ManufacturersBrowser.tsx`

### Phase 5: Form Controls

1. Keep `FormSelect` native in this experiment.
2. Normalize native select visual styling to the same control token/radius policy.
3. Convert `ContactForm` raw text inputs to shared primitives.
4. Add a shared textarea primitive if needed.
5. Verify disabled fieldset behavior still disables native controls.
6. Do not replace `FormSelect` with a button-based dropdown during this experiment.

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
6. Check `/contact` payload behavior if any form control implementation changed.

## Expected File Changes

Likely changed files:

- `src/app/globals.css`
- `components/SearchInput.tsx`
- `components/SelectControl.tsx`
- `components/FormSelect.tsx`
- `components/ContactForm.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx` only if retained and normalized
- `lib/uiText.ts`

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
- `data/*`

## Risks And Mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Replacing Radix select behavior with a custom component regresses accessibility | High | Keep Radix as default. Only opt into custom searchable dropdown after the full ARIA, keyboard, focus, and overlay contract passes manual checks. |
| Full-text search gets removed accidentally | High | Keep listing page `q` search; only replace the visual primitive. |
| Controlled URL filter state and dropdown internal state diverge | High | Make `SearchableDropdown` controlled and derive selected label from `value`. |
| Formspree select value no longer submits | High | Keep native `FormSelect` in this experiment. If replaced later, require validation, disabled, initial sync, and payload checks before merge. |
| ARIA id collisions with multiple dropdowns | High | Use `useId()` for trigger/list/input/option ids. Verify multiple dropdowns on `/robots`. |
| Dropdown clipped by layout containers | Medium | Keep portal rendering and verify scroll/resize positioning. |
| Mobile dropdown positioned off-screen | Medium | Clamp width/left to viewport or use CSS constraints after first visual check. |
| Motion feels flashy for B2B UI | Medium | Shorten animation, use reduced motion, avoid excessive blur/stagger. |
| Site becomes even whiter | Medium | Use `bg-popover`/`bg-input-background` tokens and review light surface values. |
| English UI text leaks into Japanese UI | Medium | Add copy to `lib/uiText.ts` or pass required Japanese props from wrappers. No English defaults in UI components. |
| New component duplicates Radix behavior poorly | High | Prefer Radix primitives for popup/focus infrastructure, or keep custom dropdown scoped to searchable finite-list filters only. |

## Validation Commands

Run before implementation to establish baseline:

```bash
npm run build
```

Run after each meaningful phase:

```bash
npm run build
```

There is no configured `lint` or `typecheck` script in `package.json`; `npm run build` is the available TypeScript/build verification path.

Optional data sanity check, only if data files are touched:

```bash
npm run validate:data
```

Run a dev server for manual checks:

```bash
npm run dev
```

## Manual Checklist

- `/robots`
  - free-text search still updates `q`
  - Radix select filters still work where not explicitly opted into searchable dropdown
  - searchable opt-in filters select and clear correctly
  - long option labels truncate cleanly
  - keyboard operation works: Enter, Space, Escape, ArrowUp, ArrowDown, Home, End, Tab
  - active option is announced through `aria-activedescendant` or the equivalent Radix behavior
  - multiple dropdowns do not share ids

- `/manufacturers`
  - free-text search still updates `q`
  - country and consultation route dropdowns work

- `/use-cases`
  - free-text search still works
  - existing chip filters are unchanged

- `/contact`
  - text inputs, textarea, and inquiry type look consistent
  - native inquiry type select remains enabled unless the fieldset is disabled
  - inquiry type is submitted under the correct `name`
  - required validation still works
  - disabled/submitting state still works
  - Formspree payload contains `inquiryType` when form submission is enabled

- Global
  - light theme no longer feels like undifferentiated white panels
  - dark mode keeps readable contrast
  - mobile width 375px has no clipping
  - dropdown does not appear behind sticky headers
  - Escape closes the dropdown and restores focus

## Recommendation

Proceed in small commits after this planning commit:

1. Baseline build and control token/radius normalization.
2. `SearchField` + `SearchInput` internal replacement.
3. Controlled searchable dropdown primitive in isolation.
4. Opt-in searchable `SelectControl` path for high-option filters only.
5. Native `FormSelect` styling and `ContactForm` input/textarea migration.
6. Minimal surface color polish.

This preserves current behavior while allowing the new dropdown UI to be tested on the highest-impact pages first.
