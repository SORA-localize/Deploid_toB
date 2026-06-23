# Documentation Governance Rules

Use this file when creating, moving, or updating AI-facing rules, planning documents, guides, and archive entries.

## Document Roles

- `AGENTS.md`: generic AI-agent entrypoint. Keep it short.
- `ai/rules/`: AI-facing routing, guardrails, and work-type gates. Keep these concise.
- `docs/planning/`: design decisions, current source-of-truth maps, and planning documents.
- `docs/data/`: data-maintenance guides and collection-specific operating notes.
- `README.md`: human-facing project overview, setup, commands, environment variables, and pointers.
- Tool-specific files such as `CLAUDE.md`: tool-specific guidance only. Shared rules belong in `AGENTS.md` and `ai/rules/`.

## Planning Document Classes

Every top-level `docs/planning/*.md` file should be represented in `docs/planning/README.md` as one of:

- Current source of truth: actively used for implementation decisions.
- Background/reference: useful historical context, not a standing rule.
- Active/unimplemented plan: a plan not yet fully reflected in code or source-of-truth docs.
- Archive candidate: completed, superseded, temporary, or no longer actionable.

Archive candidates should be moved to `docs/planning/archive/` unless the user explicitly wants them kept in place as background.

## Update Order

When changing a rule or policy:

1. Update current code/type definitions first when behavior or validation changes.
2. Update the detailed source-of-truth doc.
3. Update the relevant `ai/rules/` entrypoint or gate.
4. Update README/tool-specific pointers only as links or short summaries.
5. Register, reclassify, or archive planning documents in `docs/planning/README.md`.

## Duplication Policy

- Do not copy detailed policy text into README or tool-specific files.
- Short summaries and links are allowed.
- If two docs need the same rule, choose one source of truth and make the other point to it.
- Rule files should route and guard; long rationale belongs in source-of-truth docs.

## Completion Rule

After a one-off plan is implemented:

- Move it to `docs/planning/archive/`, or
- Reclassify it as background with an explicit non-source-of-truth label, or
- Delete it only when the user explicitly asks and no reference value remains.
