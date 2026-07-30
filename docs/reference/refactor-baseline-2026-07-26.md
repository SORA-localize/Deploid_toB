---
status: reference
updated: 2026-07-28
---

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
| npm run check:source-links | diagnostic only; external timeoutあり |

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

## Route client gzip

Verification of `.next/diagnostics/route-bundle-stats.json`:
- All uncompressed byte counts match the "Route first-load uncompressed JavaScript" table above ✓
- The JSON file contains only `firstLoadUncompressedJsBytes` and `firstLoadChunkPaths` fields (no gzip-compressed sizes recorded)
- Uncompressed bytes are the raw JavaScript size before any transport compression

## Data counts
| Collection | Count |
|---|---:|
| robots | 63 |
| manufacturers | 26 |
| articles | 34 |
| useCases | 44 |
| deployments | 11 |

## Known issues (found during Phase 1 review, not fixed in Phase 1)

- **PPR dynamic detail routes return HTTP 200 for a nonexistent slug, not 404.**
  Confirmed empirically on `refactor/integration-20260726` (2026-07-27): requesting
  `/robots/<nonexistent-slug>` against a production build returns `HTTP 200` with the
  `not-found.tsx` boundary rendered in the body, while a route with no matching page at
  all (e.g. `/this-page-does-not-exist`) correctly returns `404`. The page component
  does call `notFound()` correctly (`src/app/robots/[slug]/page.tsx`); the status
  mismatch is caused by Next.js Partial Prerendering sending the static shell (and its
  200 status) before the dynamic segment resolves to the not-found boundary during
  streaming. This is a pre-existing platform behavior, not something introduced by
  Phase 1's diff. Confirmed (2026-07-28) to affect all other `[slug]` detail routes the
  same way: `/manufacturers/<nonexistent-slug>`, `/use-cases/<nonexistent-slug>`, and
  `/reports/<nonexistent-slug>` all return `HTTP 200` with the not-found body.
  Fixing the actual status code requires changing the route's rendering/PPR
  configuration, which is a rendering-strategy decision, not a Phase 1 (quality gates)
  change. Phase 1's own E2E gate was hardened instead (`tests/e2e/public-routes.spec.ts`)
  to assert each route's real H1 content and the absence of the not-found string, so the
  test suite itself cannot be fooled by this — but the underlying status-code behavior is
  still open. Candidate owner: a future phase touching rendering/PPR strategy (no
  existing phase 1–7 task currently claims this explicitly; closest is
  `refactor-phase-04-home-performance-v1.md`, which is scoped to Home only).

## Phase 4 after
- Home raw HTML bytes: 326367（before: 4206770）
- Reduction: 3880403 bytes（92.24%減）
- Embedded world-map SVG data URI occurrences: 0（before: 4）
- World map DOM copies: 1
- Continuous requestAnimationFrame loop: removed
