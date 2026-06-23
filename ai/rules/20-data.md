# Data Rules

Use this file for data additions, data updates, article records, tags, specs, sources, and media metadata.

## Must Read

- `ai/rules/21-data-maintenance-workflow.md` - pre-edit gate for `data/*.ts`
- `docs/data/README.md` - data work entrypoint
- `docs/planning/data-maintenance-checklist-v1.md` - collection-specific checklists and publish gates
- `docs/planning/data-architecture-redesign-v1.md` - id/slug model and source-of-truth design
- `docs/planning/copyright_and_media_rights_policy_v1.md` - images, logos, quotes, rights
- `data/types.ts` - type-level source of truth
- `lib/validate.ts` - machine-enforced rules

For articles, also read:

- `docs/planning/editorial_style_guide_v1.md`

For tags and specs, inspect the code source of truth before editing:

- `lib/tagRegistry.ts`
- `lib/specSchema.ts`
- `lib/labels.ts`
- `lib/display.ts`

## Standing Rules

- References use immutable `id`; public URLs use mutable `slug`.
- Do not change an existing `id` to fix naming. Change `slug` and add the old value to `previousSlugs`.
- New records normally start as `publishStatus: 'draft'`.
- Do not invent facts from AI memory. Use official pages, press releases, or reliable reporting.
- Record sources with URL, checked date, and reliability.
- Unknown optional facts should be omitted or marked as confirmation-needed according to the existing data model.
- Use only registered tag values and spec keys. Add new registry entries first when needed.
- Pages should use `lib/data.ts`, not direct searches through `data/*.ts`.
- Run `npm run validate:data` after data changes. Run `npm run build` when UI/rendering can be affected.

## Data Work Gate

Before editing `data/*.ts`, follow `21-data-maintenance-workflow.md`. If any gate cannot be passed, stop and either research the source or ask the user.
