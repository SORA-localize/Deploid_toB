# AI Rules Index

This directory is the stable AI-facing rules hub for Deploid. It exists outside `docs/` because `docs/` is intentionally ignored by `.ignore`, which can hide source-of-truth documents from agent file discovery.

## Read Order

For every task:

1. `AGENTS.md`
2. This file
3. `10-workflow.md`
4. The work-type file below
5. The linked source-of-truth docs and current code

## Work-Type Routing

| Task type | Read next |
| --- | --- |
| Any implementation, refactor, review, or validation | `10-workflow.md` |
| `data/*.ts`, article records, sources, tags, specs, images | `20-data.md` |
| UI, layout, components, responsive behavior, design consistency | `30-ui-design.md` |
| Images, logos, citations, article text, copyright-sensitive content | `40-content-rights.md` |
| Old plans, migration notes, historical decisions | `90-archive-policy.md` |

## Current Source Of Truth

The current source-of-truth map is `docs/planning/README.md`. Treat its "(a) 正本・現行" group as current and its "(b) 参照・背景（旧／非正本）" group as background only.

Code-level truth wins over prose when the two differ:

- Data types: `data/types.ts`
- Data access and related-record resolution: `lib/data.ts`
- Data validation: `lib/validate.ts` and `scripts/validate-data.mjs`
- Tags: `lib/tagRegistry.ts`
- Spec keys: `lib/specSchema.ts`
- Labels and display order: `lib/labels.ts`, `lib/display.ts`
- UI text: `lib/uiText.ts`
- Theme tokens: `src/app/globals.css`
- Semantic tones: `lib/visualSemantics.ts`

## Search Rules

- Use explicit paths or `rg --no-ignore` when searching `docs/`.
- Do not assume `rg --files` is complete for documentation discovery.
- Prefer `docs/planning/README.md` and the rule files here over scanning random historical plans.

## Change Discipline

- Keep rule files as routing and guardrails, not full duplicates of long docs.
- If a detailed policy changes, update the source-of-truth doc and adjust links or summaries here.
- Archive or label one-off plans after completion so agents do not mistake them for standing policy.
