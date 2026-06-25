# Data Maintenance Workflow

Use this file after `20-data.md` when adding or updating records in `data/*.ts`.

This gate is specific to Deploid's data layer:

- `data/robots.ts`
- `data/manufacturers.ts`
- `data/articles.ts`
- `data/guides.ts`
- `data/useCases.ts`
- `data/deployments.ts`
- `data/articlePlacements.ts`

Purpose: let an AI agent add or update records without breaking the `id` / `slug` model, source requirements, registry usage, or image-rights rules.

## Operating Rules

- G1-G11 are the pre-edit gates. Do not edit files until every relevant gate can proceed.
- If a gate cannot proceed, stop and either research the source or ask the user.
- Read the referenced source-of-truth files. Do not replace them with memory or general knowledge.

## G1. Collection And Work Type

- Decide exactly one target collection: `robots` / `manufacturers` / `articles` / `guides` / `useCases` / `deployments` / `articlePlacements`.
- Decide whether this is a new record or an existing-record update using `docs/data/README.md` "更新か新規追加かの判断".
  - Same real-world entity with changed name, specs, price, status, or sources: update the existing record.
  - Officially separate model, generation, SKU, or legal entity: create a new record.
- If unclear, do not create a new record. Present both the update option and new-record option to the user.
- References: `docs/data/README.md`, `docs/planning/data-maintenance-checklist-v1.md`.

## G2. Source Evidence Before Editing

- Open and verify at least one official page, official press release, or reliable report.
- Only record facts supported by the verified source. Do not infer price, specs, distributor, or deployment state.
- Omit optional facts that cannot be confirmed. If a required field cannot be confirmed, return to G1 and ask the user.
- References: `docs/data/README.md`, `docs/planning/data-maintenance-checklist-v1.md`, `docs/planning/copyright_and_media_rights_policy_v1.md`.

## G3. ID And Slug

- For new records, choose a lowercase hyphenated alphanumeric `id`, and treat it as immutable.
- For new records, normally start with `id === slug`.
- Check for collisions in the relevant `data/*.ts` file.
- Do not duplicate the manufacturer name in robot `name` / `title` fields when `manufacturerId` already provides it.
- For slug changes, do not touch `id` or any `*Id` / `*Ids` references. Add the old slug to `previousSlugs`.
- References: `docs/planning/data-architecture-redesign-v1.md`, `docs/planning/data-maintenance-checklist-v1.md`.

## G4. Required Fields And Publish Gate

- Inspect `data/types.ts` for required fields on the target collection.
- Check the relevant publish gate in `docs/planning/data-maintenance-checklist-v1.md`.
- If publish requirements cannot be met, keep or set `publishStatus: 'draft'`.
- References: `data/types.ts`, `docs/planning/data-maintenance-checklist-v1.md`.

## G5. Reference Integrity

- All `manufacturerId`, `relatedRobotIds`, `candidateRobots[].robotId`, `supersededById`, and similar `*Id` / `*Ids` fields must point to existing immutable `id` values, not slugs.
- Confirm referenced records exist. `npm run validate:data` should catch misses, but do not rely on it as the first check.
- For symmetric relationships such as guides and use cases, update both sides when required by the current data model.
- References: `docs/planning/data-architecture-redesign-v1.md`, `docs/data/README.md`.

## G6. Sources, Reliability, And Freshness

- Do not leave `sources` empty when the collection requires sources.
- Each `sources[]` entry should include `title`, `url`, `checkedAt`, and `reliability` according to `data/types.ts`.
- Update record-level `reliability` and `updatedAt` to match the current edit.
- For volatile values such as price, distributor, and availability, set a shorter `nextReviewBy` when the model supports it.
- References: `data/types.ts`, `docs/planning/data-maintenance-checklist-v1.md`.

## G7. Specs, Tags, And Enums

- Use only spec keys registered in `lib/specSchema.ts`.
- Use only tag values registered in `lib/tagRegistry.ts`.
- Tag by axis, do not mix axes in one field. For articles: `industryTags` (kind `industry`), `regionTags` (kind `region`), `themeTags` (kind `theme`, required, 1-4). `theme` is the article's argument, not its industry or region.
- Do not tag company or robot names. Use `relatedManufacturerIds` / `relatedRobotIds`; non-entity companies are found via full-text search.
- `requiredCapabilities` must use `Capability` values, not tag registry values.
- When adding enum values, update the type definition plus `lib/labels.ts` and `lib/display.ts`.
- References: `lib/specSchema.ts`, `lib/tagRegistry.ts`, `lib/labels.ts`, `lib/display.ts`.

## G8. Images And Rights

- Every `ImageAsset` must include rights metadata required by `data/types.ts`.
- Do not publish images with unclear rights. Keep `src: ''` or leave the record in draft according to current conventions.
- Prefer local assets in `public/images/<collection>/...`; do not hotlink when a local asset should be used.
- References: `docs/planning/copyright_and_media_rights_policy_v1.md`, `docs/data/README.md`, `public/images/robots/README.md`.

## G9. Publish Status And Archive Behavior

- New records normally start as `publishStatus: 'draft'`.
- Existing-record updates should not change `publishStatus` unless that is the purpose of the task.
- Do not delete discontinued records by default. Use `publishStatus: 'archived'` and `supersededById` where appropriate.
- References: `docs/planning/data-maintenance-checklist-v1.md`, `docs/data/README.md`.

## G10. Verification

- Run `npm run validate:data` after data changes and confirm zero errors.
- Run `npm run build` when UI, rendering, generated routes, or public output can be affected.
- Do not report "問題なし" unless the stated verification actually ran.
- References: `README.md`, `docs/data/README.md`.

## G11. Completion Report

Report the following to the user:

- Changed files and added/updated record `id`s.
- Final `publishStatus`, and what remains before publishing if still draft.
- Facts confirmed by sources, and facts omitted or marked as confirmation-needed.
- Verification commands and results.
- Remaining user checks before publication, especially price, distributor, and image rights.

## Copy Checklist

```text
Before editing data/*.ts, verify each gate:

G1 Collection/work type:
- One target collection is selected.
- New record versus existing update is decided from docs/data/README.md.
- Ambiguous cases are brought to the user before creating a new id.

G2 Sources:
- At least one official or reliable source URL was opened and checked.
- Only confirmed facts will be recorded.

G3 ID/slug:
- New id is lowercase hyphenated alphanumeric and collision-free.
- New records normally start with id === slug.
- Slug changes keep id and references stable and add previousSlugs.

G4 Required fields:
- data/types.ts required fields were checked.
- Publish gates in data-maintenance-checklist-v1.md were checked.

G5 References:
- *Id/*Ids fields point to ids, not slugs.
- Referenced records exist.
- Symmetric references are updated where required.

G6 Sources/reliability:
- Required sources are non-empty and include title/url/checkedAt/reliability.
- reliability/updatedAt were updated as needed.

G7 Specs/tags/enums:
- Spec keys are registered in lib/specSchema.ts.
- Tag values are registered in lib/tagRegistry.ts.
- New enum values update types, labels, and display order.

G8 Images/rights:
- ImageAsset.rights is present where images are used.
- Unclear-rights images are not published.
- Local image placement follows docs/data/README.md.

G9 publishStatus:
- New records start as draft unless explicitly approved.
- Discontinued records are archived rather than deleted.

G10 Verification:
- npm run validate:data was run with zero errors.
- npm run build was run when UI/rendering can be affected.

G11 Report:
- Changed files, record ids, publishStatus, source-confirmed facts, omitted facts,
  verification results, and remaining publication checks are reported.
```
