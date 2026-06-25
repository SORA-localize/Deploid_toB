# UI And Design Rules

Use this file for UI, layout, components, responsive behavior, interaction, visual polish, and design consistency.

## Must Read

- `docs/planning/design_system_v1.md` - visual system, layout, components, responsive rules
- `docs/planning/ui_architecture_and_development_policy_v1.md` - UI structure, component responsibility, data/UI boundaries
- `docs/planning/humanoid_media_build_notes_v1.md` - project design intent and anti-"AI feel" rules
- `src/app/globals.css` - theme tokens
- `lib/visualSemantics.ts` - semantic tone mapping

## Standing Rules

- Keep changes close to existing components, tokens, and helper APIs.
- Do not redesign broad surfaces while solving a narrow bug.
- Avoid "AI-feel" patterns: purple/blue gradient heroes, centered oversized generic copy, glassmorphism, decorative card piles, excessive radius or shadow, and content-free AI art.
- Use semantic tokens and `lib/visualSemantics.ts`; avoid ad hoc color literals.
- Keep data access, filtering, URL state, formatting, and business rules out of presentational components when existing boundaries support that.
- Faceted filters use `FacetFilterBar` + `lib/facetConfig.ts`: show option counts, disable 0-result options (computed from the other active facets), sync state via `useUrlParamUpdater`, and never auto-reset other facets. Lock dropdown panels to trigger width.
- Preserve accessibility: semantic HTML, labels, keyboard operation, focus states, and useful empty/error states.
- Verify responsive behavior for mobile and desktop when layout changes.

## Design Source Order

1. Current implementation and reusable components
2. `design_system_v1.md`
3. `ui_architecture_and_development_policy_v1.md`
4. Historical plans only when explicitly relevant
