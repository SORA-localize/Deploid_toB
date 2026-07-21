# DATA-R02 implementation manifest report

Generated: 2026-07-17

## Scope

- R02 records: 61 / expected 61
- Spec decisions: 976 / expected 976
- This is a planning artifact only: no `data/*.ts`, UI, media, or publish status has changed.
- `set` means eligible for a reviewed implementation patch; it is not an automatic update.

## Action counts

- add-source: 114
- clear-after-review: 1
- hold-conflict: 28
- hold-source-inaccessible: 435
- hold-variant: 137
- merge-use-case-relation: 53
- preserve: 1240
- publish-status-proposal: 4
- replace-usage-example-urls: 53
- set: 188
- unsupported-schema: 339

## Guardrails

- Only current official evidence with a matching identity can become a `set` candidate.
- Family records never absorb variant-specific scalar values.
- `not-published` never deletes an existing value automatically.
- Price and usage examples still require the referenced URL to exist in `Robot.sources` before implementation.
- Procurement and `currentFeatures` are held when the present schema cannot preserve the evidence without loss.
- Approved lifecycle decisions remain proposals here; publish-status changes are a separate reviewed patch.

## Output

- `DATA-R02-IMPLEMENT-B01.json` through `DATA-R02-IMPLEMENT-B10.json`
- Regenerate with `npm run build:data-r02-manifest`.
