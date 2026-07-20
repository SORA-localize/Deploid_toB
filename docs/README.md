# Deploid Docs

md を覗くだけで「今何が動いているか」「あの内容はどうなったか」が分かることを目的にした入口。人間（オーナー）はこの1枚から必要な文書へ潜る。AIエージェントの入口は `../AGENTS.md` → `../ai/rules/00-index.md`。

---

## いま動いているもの

`docs/plans/` にある実行中の計画。完了したら `docs/archive/` へ移す（このダッシュボードからも消える）。

| 計画 | 一言 | branch | 開始日 |
|---|---|---|---|
| [レスポンシブ対応](plans/responsive-phase-1-static-audit-v1.md) | Phase 1のコード実装は完了。R-06（実機スクリーンショットでの最終確認）が未実施 | 専用branchなし（mainへ直接実装） | 2026-07-03 |
| [ロボットデータ ファクトチェック反映](plans/robot-data-factcheck-impl-plan-2026-07-01.md) | Phase A/Bは完了。Phase Cは`marketAvailability`のみ実装済み、`scopeStatus`/`evidenceLevel`が未着手 | 未定（型変更のため別branch推奨のまま） | 2026-07-01 |
| [ロボットデータ R02統合](plans/robot-data-r02-integration-plan-v1.md) | 全61機再調査（DATA-R02）の反映。低リスクbatchは反映済み、個別conflict機（pal-kangaroo等）と最終回帰監査（R02-11）が残task | `data/robot-catalog-r01-rollout-20260716`（PR #3はmerge済み、残taskは別PRで継続） | 2026-07-17 |
| [ロボット画像・メーカーロゴ調達](plans/robot-image-sourcing-plan-v1.md) | Robot B1〜B6の読み取り専用調査は完了。台帳・許諾SSOTの実装が調査開始gateとして未着手 | 未定 | 2026-07-08 |

---

## 最近の決定・反映

`docs/decisions/` の直近更新（frontmatterの`updated`が新しい順、上位5件）。

| 日付 | 文書 | 内容 |
|---|---|---|
| 2026-07-19 | [著作権・商標・メディア権利対策ポリシー](decisions/copyright_and_media_rights_policy_v1.md) | 「権利不明素材は原則非公開」から「公式チャネル取得かつ禁止表示なしなら掲載」へ方針転換（§0） |
| 2026-07-17 | [Deploid Data Work Guide](decisions/data/README.md) | DATA-R02（全61機再調査）の成果物カタログを追加、`research/`配下に整理 |
| 2026-07-14 | [UIアーキテクチャ・開発方針](decisions/ui_architecture_and_development_policy_v1.md) | — |
| 2026-07-10 | [ニュース収集・記事化自動化データ契約](decisions/news-automation-prompt-contract-v1.md) | — |
| 2026-07-09 | [メーカーロゴ利用仕様](decisions/manufacturer-logo-usage-spec-v1.md) | — |

---

## 棚マップ

| 棚 | 役割 |
|---|---|
| [`docs/decisions/`](decisions/) | 恒久方針・現行仕様・運用チェックリスト・継続運用ツール。新しい実装判断はここを見る |
| [`docs/plans/`](plans/) | 進行中の作業計画。完了したら即 `docs/archive/` へ |
| [`docs/reference/`](reference/) | 背景・経緯・調査スナップショット。現在の運用ルールではない |
| [`docs/archive/`](archive/) | 実装済み・履歴参照用 |
| [`ai/rules/`](../ai/rules/) | AI向けルーティング・ガードレール（このダッシュボードとは別体系、現状維持） |

判定は1問で決める：「新しい実装・運用判断で従うべきか」→ decisions。「これから実行する作業か」→ plans。「過去の経緯・時点スナップショットとして読むか」→ reference。どれでもなければ archive。

### decisions の主要文書

- [`data-architecture-redesign-v1.md`](decisions/data-architecture-redesign-v1.md) — id/slug分離、参照設計、正本管理、CMS移行を見据えたデータ設計
- [`data-maintenance-checklist-v1.md`](decisions/data-maintenance-checklist-v1.md) — データ追加、slug変更、公開前確認、鮮度レビューの実行チェックリスト
- [`data/README.md`](decisions/data/README.md) — AIでデータ追加・更新を行うときの入口
- [`data/tagging.md`](decisions/data/tagging.md) — タグ追加・表記ゆれ防止
- [`copyright_and_media_rights_policy_v1.md`](decisions/copyright_and_media_rights_policy_v1.md) — 画像、ロゴ、引用、出典、権利ステータスの運用方針
- [`manufacturer-logo-usage-spec-v1.md`](decisions/manufacturer-logo-usage-spec-v1.md) — メーカーロゴのvariant、表示解決、素材受入の現行仕様
- [`design_system_v1.md`](decisions/design_system_v1.md) — デザイン原則、semantic token、カード/レイアウト方針
- [`ui_architecture_and_development_policy_v1.md`](decisions/ui_architecture_and_development_policy_v1.md) — UI構造と開発方針
- [`editorial_style_guide_v1.md`](decisions/editorial_style_guide_v1.md) — 記事執筆方針（題材選定・文体・NG表現・ワークフロー・セクション別テンプレート）
- [`article-sourcing-reference-v1.md`](decisions/article-sourcing-reference-v1.md) — 記事候補ソーシング方針（許可/除外ソース、検索クエリ）
- [`news-automation-prompt-contract-v1.md`](decisions/news-automation-prompt-contract-v1.md) — ChatGPT Scheduled Tasksの日次出力→記事データ変換契約
- [`robot-factcheck-research-prompt-2026-07-01.md`](decisions/robot-factcheck-research-prompt-2026-07-01.md) — 掲載データのファクトチェック用調査プロンプト（継続運用ツール、掲載変更のたびに更新）
- [`ai_fullstack_development_guardrails_v1.md`](decisions/ai_fullstack_development_guardrails_v1.md) — AI実装時の安全策と自己監査
- [`architecture_future_considerations_v1.md`](decisions/architecture_future_considerations_v1.md) — 現在のアーキ判断と将来見直しトリガー
- [`humanoid_platform_tech_stack_v1.md`](decisions/humanoid_platform_tech_stack_v1.md) — 技術スタック選定理由
- [`business-positioning-and-roadmap-2026-07.md`](decisions/business-positioning-and-roadmap-2026-07.md) — 事業ポジショニング・今後の動き方（随時書き換える現行文書）

### 現行の正本（コード側）

- データ型: `../data/types.ts`
- データ取得/関連解決: `../lib/data.ts`
- データ検証: `../lib/validate.ts` と `../scripts/validate-data.mjs`
- タグ正本: `../lib/tagRegistry.ts`
- スペック項目正本: `../lib/specSchema.ts`
- enumラベル/表示順: `../lib/labels.ts` と `../lib/display.ts`
- UI文言: `../lib/uiText.ts`
- 色・テーマtoken: `../src/app/globals.css`
- semantic tone: `../lib/visualSemantics.ts`

ページ実装から `data/*.ts` を直接検索せず、取得や関連解決は `lib/data.ts` 経由にする。

---

## 更新責務

- 計画を開始・完了したら「いま動いているもの」の表を更新する（完了時は行を消し、`docs/archive/`へ移動）。
- `docs/decisions/` の文書を改訂したら、その文書のfrontmatter `updated` を更新する。「最近の決定・反映」表は`updated`降順の目視転記のため、大きな改訂をしたら上位5件に入っているか確認する。
- 新しい正本文書を `docs/decisions/` に追加したら「decisions の主要文書」に追記する。
- 詳しい更新順序は `ai/rules/80-doc-governance.md` を参照。
