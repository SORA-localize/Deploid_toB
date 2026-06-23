# CLAUDE.md

This file provides Claude Code specific guidance for this repository.

## Project

Deploid is a Japanese B2B humanoid deployment-decision portal built with Next.js App Router, React, TypeScript, and Tailwind CSS.

## Shared Rules

Shared AI-agent rules live outside this file:

1. `AGENTS.md`
2. `ai/rules/00-index.md`
3. The work-type rule files routed from `00-index.md`
4. The linked source-of-truth docs and current code

Do not treat this file as a duplicate source of truth for data design, UI design, content rights, or implementation workflow.

## Claude Code Notes

- Use the repo's current code, types, and validation as the highest-priority truth.
- For data additions or updates, read `ai/rules/20-data.md` and `ai/rules/21-data-maintenance-workflow.md`.
- For UI work, read `ai/rules/30-ui-design.md`.
- For images, citations, article text, or rights-sensitive work, read `ai/rules/40-content-rights.md`.
- For documentation reorganization, read `ai/rules/80-doc-governance.md`.
- Commands and environment variables are documented in `README.md`.
