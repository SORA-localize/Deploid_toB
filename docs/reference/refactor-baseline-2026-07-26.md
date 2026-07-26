# Pre-migration Refactor Baseline — 2026-07-26

## Environment
- Commit: 926d30265709b70c079420c6dd6d87bc70a38f5c
- Node: v24.5.0
- npm: 11.4.2

## Gates
| Command | Result |
|---|---|
| npm run validate:data | pass |
| npm run build | pass |

## Output
- Generated routes: 157
- Home raw HTML bytes: 4206770
- Home world-map SVG data URI occurrences: 4
- TypeScript/TSX files: 180
- Client Components: 63

## Route first-load uncompressed JavaScript
| Route | Bytes |
|---|---:|
| /reports | 1121603 |
| /robots | 923085 |
| /manufacturers | 910306 |
| /use-cases | 861263 |
| / | 849132 |
| /compare | 843758 |
| /robots/[slug] | 826728 |
| /manufacturers/[slug] | 799783 |
| /reports/[slug] | 793399 |
| /contact | 663728 |
| /use-cases/[slug] | 641635 |
| /_not-found | 590897 |
| /about | 590897 |
| /for-manufacturers | 590897 |
| /privacy | 590897 |

## Data counts
| Collection | Count |
|---|---:|
| robots | 63 |
| manufacturers | 26 |
| articles | 34 |
| useCases | 44 |
| deployments | 11 |
