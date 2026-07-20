# Archive Policy For Agents

Use this file when deciding whether an old planning document should influence current work. For creating, classifying, or moving documents, also read `80-doc-governance.md`.

## Current Versus Historical

- `docs/planning/README.md` is the current planning map.
- `docs/archive/` contains implemented, migrated, or temporary plans.
- Archived docs are for context, not standing instructions.
- The two old data docs kept outside archive are explicitly background/non-source-of-truth:
  - `docs/planning/humanoid_data_management_guide_v1.md`
  - `docs/planning/humanoid_data_model_policy_v1.md`

## How To Use Old Plans

Use an archived or one-off plan only when:

- The user names it.
- You are investigating why a current implementation looks the way it does.
- A current source-of-truth doc links to it for background.

Do not use old plans to override current code, current validation, or the source-of-truth docs listed in `00-index.md`.

## Cleanup Rule

After a one-off plan is completed, either move it to `docs/archive/` or clearly label its status so future agents do not treat it as live policy.
