# AGENTS.md

This is the generic AI-agent entrypoint for Deploid. Tool-specific files such as `CLAUDE.md` may add tool guidance, but the shared project rules live under `ai/rules/`.

Before changing code or data, read:

1. `ai/rules/00-index.md`
2. `ai/rules/10-workflow.md`
3. The work-type rule file listed in `ai/rules/00-index.md`
4. The source-of-truth docs linked from that rule file

Important search note: `docs/` is listed in `.ignore` for Tailwind scanner safety. Many search tools that respect ignore files will not discover design docs unless called with an explicit path or `--no-ignore`.

When rules conflict, prefer:

1. Current code and type definitions
2. `ai/rules/00-index.md` and the referenced current source-of-truth docs
3. `CLAUDE.md` / `README.md`
4. Archived plans only for historical context

Do not use `docs/archive/` or unindexed one-off plans as current implementation rules unless the user explicitly names them.
