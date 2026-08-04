---
status: reference
updated: 2026-08-04
---

# 移行前リファクタリング 実測結果 v1

> このファイルは `scripts/write-refactor-results.mjs` が生成する。手で編集しない。
> 数字を更新するなら `npm run build` のあとに `node scripts/write-refactor-results.mjs`。

## 対象

CMS / DB移行は未実施。`data/*.ts` が引き続きデータの正本。

Phase 1（品質ゲート）から Phase 7（設定・セキュリティ・後片付け）までの結果。

## Before / After

**Phase 1〜7 全体**の before / after。before は 2026-07-26 の着手前実測
（[refactor-baseline-2026-07-26.md](refactor-baseline-2026-07-26.md)）であり、
Phase 7 単独の before ではない。例えば vulnerabilities は Phase 2 の時点で 0 になっている。

first-load JS は **共有フロアを含む総量**。gate（`scripts/check-client-budgets.mjs`）は
「route固有（総量 − 共有フロア）」と「共有フロア」を別々に測っており、指標が違う。
route ごとの増減を追うときは gate 側の数字を見ること。

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Runtime vulnerabilities | 13 | 0 | -100.0% |
| Home raw HTML bytes | 4,206,770 | 200,849 | -95.2% |
| Embedded map SVG data URI occurrences | 4 | 0 | -100.0% |
| Shared client floor bytes | 591,394 | 554,140 | -6.3% |
| /reports first-load JS | 1,121,603 | 686,982 | -38.7% |
| /robots first-load JS | 923,085 | 739,654 | -19.9% |
| /manufacturers first-load JS | 910,306 | 727,214 | -20.1% |
| /use-cases first-load JS | 861,263 | 682,390 | -20.8% |
| Client Components | 63 | 63 | 0.0% |

## 追加したゲート

`npm run check` が通す順に:

| Gate | 何を守るか |
|---|---|
| `validate:data` | 型・ラベル・参照整合 |
| `check:data-boundaries` | components / pages から `data/*.ts` を直接読まない |
| `check:client-imports` | Client Component の import 経路 |
| `check:world-map-asset` | 生成済み world map asset が最新 |
| `typecheck` | TypeScript |
| `lint` | ESLint（`--max-warnings 4`、現状維持が上限） |
| `check:plan-snippets` | 計画書のコード例が型検査を通る |
| `check:dead-code` | 未使用ファイル・依存（knip） |
| `check:docs` | Markdown のローカルリンク |
| `test` | unit（Vitest） |
| `build` | 本番ビルド |
| `check:home-payload` | Home HTML バイト数と埋め込み SVG |
| `check:bundle-content` | client bundle の内容 |
| `check:client-budgets` | 全 route の client JS と共有フロアの上限 |
| `test:e2e` | Playwright（a11y・キーボード・focus・視覚回帰・security header・analytics opt-in） |

**各ゲートは「赤にできること」を確認してから入れている。** 緑しか見ていないゲートは、
動いていることが確認されていないゲートと同じ（2026-08-03 の Phase 1〜6 監査、PR #15）。

## 残っている作業

未完了の項目は [`../decisions/deferred-work-register-v1.md`](../decisions/deferred-work-register-v1.md) が唯一の一覧。
**この文書には転記しない**（2か所に置くと必ず片方が腐る）。

CSP は `Content-Security-Policy-Report-Only` に留めている。enforce へ上げるのは
互換性を観測してからの別判断。

Payload CMS + managed PostgreSQL 移行は
[`../plans/content-platform-migration-plan-v1.md`](../plans/content-platform-migration-plan-v1.md) で別program。
ただし同計画は 2026-07-26 付で、**Phase 3・5・6 が作った層（`lib/data/`、`lib/viewModels/`、
`lib/catalog/`、分割後の `lib/validation/`）を反映していない**。着手時に必ず現行実装へ突合すること。
