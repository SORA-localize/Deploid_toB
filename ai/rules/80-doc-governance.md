# Documentation Governance Rules

Use this file when creating, moving, or updating AI-facing rules, decisions, plans, reference docs, and archive entries.

## Document Roles

- `AGENTS.md`: generic AI-agent entrypoint. Keep it short.
- `ai/rules/`: AI-facing routing, guardrails, and work-type gates. Keep these concise.
- `docs/README.md`: human-facing PM dashboard. Lists what's currently in progress (mirrors `docs/plans/`), recent decisions (mirrors recent `docs/decisions/` updates), and the shelf map. Keep it short; it links out rather than duplicating content.
- `docs/decisions/`: current source-of-truth documents — design decisions, current specs, operating checklists, continuously-updated reference tools.
- `docs/plans/`: active, not-yet-fully-implemented plans. Move to `docs/archive/` immediately on completion.
- `docs/reference/`: background/historical documents kept for context, not standing rules. A doc lives here instead of `docs/archive/` only when a current `docs/decisions/` doc still cites it by name.
- `docs/archive/`: implemented, superseded, or otherwise no-longer-actionable documents. Content is frozen — do not edit archived docs except to fix a path when the archive folder itself moves.
- `README.md`: human-facing project overview, setup, commands, environment variables, and pointers.
- Tool-specific files such as `CLAUDE.md`: tool-specific guidance only. Shared rules belong in `AGENTS.md` and `ai/rules/`.

## Document Classes

Every doc under `docs/` belongs to exactly one shelf. Decide with one question at a time, in order:

1. "Should a new implementation or operating decision follow this?" → yes: `docs/decisions/`.
2. "Is this an in-progress plan that hasn't landed yet?" → yes: `docs/plans/`.
3. "Is this read only for historical/background context, and is it still cited by name from a `docs/decisions/` doc?" → yes: `docs/reference/`.
4. Otherwise: `docs/archive/`.

## Frontmatter

Every doc in `docs/decisions/`, `docs/plans/`, and `docs/reference/` carries:

```yaml
---
status: current | plan | reference
updated: YYYY-MM-DD
---
```

`status` must match the shelf (`current` for `docs/decisions/`, `plan` for `docs/plans/`, `reference` for `docs/reference/`). `updated` changes only when the content materially changes — bump it whenever you edit one of these docs. Large batch research artifacts (for example `docs/decisions/data/research/`) are exempt: they are a frozen, catalog-referenced corpus, not individually curated documents. `docs/archive/` docs are also exempt — do not add frontmatter retroactively when archiving a doc that never had it.

## Update Order

When changing a rule or policy:

1. Update current code/type definitions first when behavior or validation changes.
2. Update the detailed source-of-truth doc in `docs/decisions/`, and bump its `updated` frontmatter.
3. Update the relevant `ai/rules/` entrypoint or gate.
4. Update README/tool-specific pointers only as links or short summaries.
5. If a plan started or finished, update `docs/README.md`'s "いま動いているもの" table (add the row when it starts, remove it and move the doc to `docs/archive/` when it finishes). If a decision changed materially, check whether it should appear in the "最近の決定・反映" table.

## Duplication Policy

- Do not copy detailed policy text into README, `docs/README.md`, or tool-specific files.
- Short summaries and links are allowed.
- If two docs need the same rule, choose one source of truth and make the other point to it.
- Rule files should route and guard; long rationale belongs in source-of-truth docs.

## Moving Documents

- Moving a doc between shelves is a path change, not a content rewrite — keep them as separate commits when both are needed (move first, content changes after).
- After moving a doc, `rg --no-ignore -l '<old path>'` across `ai/`, `docs/`, `README.md`, `AGENTS.md`, `CLAUDE.md`, and relevant `data/*.ts`/`lib/*.ts` comments, and fix every live reference. Do not fix references inside `docs/archive/` — that content is frozen.
- Cross-references between docs use relative paths (`../decisions/foo.md`) when both docs live under `docs/`, except for root entrypoints (`AGENTS.md`, `README.md`, `CLAUDE.md`) and bare `data/*.ts`/`lib/*.ts` code paths, which are written repo-root-relative by convention throughout this project.

## Completion Rule

After a one-off plan is implemented:

- Move it to `docs/archive/`, or
- Reclassify it as background in `docs/reference/` with an explicit non-source-of-truth label (only if a current `docs/decisions/` doc still cites it), or
- Delete it only when the user explicitly asks and no reference value remains.

Do this at the point of completion, not later — a plan whose own status line says "done" while it still sits in `docs/plans/` is exactly the drift this shelf structure exists to prevent.
