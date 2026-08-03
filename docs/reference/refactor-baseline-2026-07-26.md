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

## Phase 5 after

測定日 2026-08-02、branch `refactor/05-client-boundaries`。
「route固有JS」= そのrouteのfirst-load chunkから共有フロア（`/privacy`のchunk集合）を
引いた合計バイト数。共有フロアはPhase 5の対象外なので引いて測る。

| route | first-load総量 before | after | route固有JS before | after | 削減 | 削減率 |
|---|---:|---:|---:|---:|---:|---:|
| `/reports` | 1,825,083 | 719,545 | 1,233,689 | **131,150** | -1,102,539 | **-89.4%** |
| `/use-cases` | 859,601 | 716,411 | 268,207 | **128,016** | -140,191 | **-52.3%** |
| `/robots` | 917,181 | 773,675 | 325,787 | **185,280** | -140,507 | **-43.1%** |
| `/manufacturers` | 769,805 | 761,235 | 178,411 | **172,840** | -5,571 | **-3.1%** |
| `/compare` | 843,296 | — | 251,902 | 247,676 | -4,226 | -1.7% |

共有フロア: 591,394 → 588,395（9 chunk）。Phase 5では触っていない。

### RSC payload（view modelのJSONバイト数）

| collection | before | after |
|---|---:|---:|
| robots | 101,449 | 57,882 |
| manufacturers | 37,271 | 15,627 |
| useCases | — | 16,093（Task 7で新設） |
| articles | — | 56,415（Task 8で新設。`titleSegments`を含む） |

上限は `tests/unit/view-models/catalog-payload.test.ts` でgateしている。

### budget を 180,000 から 215,000 へ変更した理由

当初の180,000は着手前の`/manufacturers`の値（178,411）を借りたもので、計画書自身が
「同じ手法を適用すれば到達可能という以上の意味はない」と暫定値であることを明記していた。

実測の最大は`/robots` 185,280。内訳は Radix/shadcn 57,053 ＋ floating-ui 41,104 ＋
日本語UI文字列（`lib/tags`・`lib/labels`・`lib/uiText`）71,218 ＋ route entry 15,905 で、
**Phase 5の残タスクはどれもこれらを扱わない**。UI文字列をclientから剥がすには全client
componentを props経由へ作り替える必要があり、実測で78経路が参照している。Phase 5の
範囲を超えるため、Task 10の規定「実測最大値 + 15%」に従って215,000で確定した。

### 後続phase向けの記録

- **共有フロアの`3_4rbxe62x5-h.js`（67,853バイト）** は `sonner`（toast）・`lucide`・
  `@vercel/analytics` を含み、`src/app/layout.tsx` の `<Toaster />` により `/privacy` の
  ような静的ページにも配信されている。Phase 5の対象外だが、フロアのうち手を付けられる部分。
- **`motion/react` は dependencies から外せなかった。** catalog 4 routeからは消えたが、
  Home側の `lib/useTiltCardEffect.ts` / `components/FeaturedRobotCard.tsx` /
  `components/ui/encrypted-text.tsx` / `components/HomeContentNavigator.tsx` が使い続ける。
- **`/compare` のview model化（旧Task 9）は未実施。** `CompareClient` が raw `Robot[]` /
  `Manufacturer[]` を受け取る状態が残る。`/compare` にバイト上限は課しておらず削減効果も
  0だが、CMS移行の観点では対応が要る。後続phaseへ起票する。
- **catalog一覧の本文全文検索は失われた。** 検索対象は「cardが描画する文字列」と
  「facet選択肢のlabel」に限定した。サイト全体検索ページが存在しないため退避先が無い。
  復活させる場合はbuild時生成の静的JSONを`public/`へ置いてfetchする方式が候補。
