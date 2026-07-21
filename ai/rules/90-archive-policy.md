# Archive Policy For Agents

Use this file when deciding whether an old document should influence current work. For creating, classifying, or moving documents, also read `80-doc-governance.md`.

## Current Versus Historical

- `docs/README.md` is the current dashboard and shelf map.
- `docs/archive/` contains implemented, migrated, or temporary plans and superseded background docs.
- Archived docs are for context, not standing instructions.
- `docs/reference/` holds background/non-source-of-truth docs that are kept outside archive because a current `docs/decisions/` doc still cites them (for example `humanoid_data_management_guide_v1.md` and `humanoid_data_model_policy_v1.md`, cited by `docs/decisions/data-architecture-redesign-v1.md`). Treat everything in `docs/reference/` the same way as archive: context only, never a standing rule.

## How To Use Old Plans

Use an archived or one-off plan only when:

- The user names it.
- You are investigating why a current implementation looks the way it does.
- A current source-of-truth doc links to it for background.

Do not use old plans to override current code, current validation, or the source-of-truth docs listed in `00-index.md`.

## Cleanup Rule

After a one-off plan is completed, either move it to `docs/archive/` or clearly label its status so future agents do not treat it as live policy.
