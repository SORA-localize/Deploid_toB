# Data Rules

Use this file for data additions, data updates, article records, tags, specs, sources, and media metadata.

Payload CMS + managed PostgreSQL is now live and is the sole content source after Task 9. Use the Payload editorial/API workflow; the former `data/*.ts` workflow has been retired.

Codex MCP note: a Payload MCP server (`lib/payload/mcp.ts`) and its editorial workflow (`.codex/content-workflow.md`) are available for controlled draft/edit workflows. Production publication remains subject to the Payload authorization gates.

## Must Read

- `ai/rules/21-data-maintenance-workflow.md` - evidence and rights gate for Payload content edits
- `docs/decisions/data/README.md` - data work entrypoint
- `docs/decisions/data-maintenance-checklist-v1.md` - collection-specific checklists and publish gates
- `docs/decisions/data-architecture-redesign-v1.md` - id/slug model and source-of-truth design
- `docs/decisions/copyright_and_media_rights_policy_v1.md` - images, logos, quotes, rights
- `lib/content/domainTypes.ts` - canonical domain types
- Payload collections/migrations and `scripts/verify-content-snapshot.mts` - schema and integrity gates

For articles, also read:

- `docs/decisions/editorial_style_guide_v1.md`
- `docs/decisions/news-automation-prompt-contract-v1.md` when the user pastes daily news output from ChatGPT Scheduled Tasks or asks for a weekly newsletter from local published articles

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
- Tags are split by axis (`industry` / `region` / `theme` / `task` / `use-case-domain`); keep each field to its own axis. Companies and robots are relations, not tags. See the header of `lib/tagRegistry.ts`.
- Pages should use the content repository, not direct collection access.
- Run the Payload integrity checks and `npm run build` when content/UI behavior can be affected.

## Data Work Gate

Before editing content, follow `21-data-maintenance-workflow.md`. If any evidence or rights gate cannot be passed, stop and either research the source or ask the user.
