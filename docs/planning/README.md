# Planning Documents

Last cleaned: 2026-06-23

このディレクトリは、Deploid の現在有効な設計判断と運用方針を置く場所です。
実装済みの一時計画や過去の移行計画は `docs/planning/archive/` に退避しています。

## まず読むもの

- `../../AGENTS.md` — 汎用AIエージェント入口
- `../../ai/rules/00-index.md` — 作業種別ごとの参照ルール
- `../../ai/rules/10-workflow.md` — AIに計画、実装、レビューを任せるときの共通手順
- `../../ai/rules/21-data-maintenance-workflow.md` — `data/*.ts` 追加・更新の事前確認ゲート
- `../data/README.md` — AIでデータ追加・更新を行うときの入口
- `data-maintenance-checklist-v1.md` — データ追加、slug変更、公開前確認、鮮度レビューの実行チェックリスト
- `data-architecture-redesign-v1.md` — id/slug分離、参照設計、正本管理、CMS移行を見据えたデータ設計
- `copyright_and_media_rights_policy_v1.md` — 画像、ロゴ、引用、出典、権利ステータスの運用方針
- `design_system_v1.md` — 現行UIのデザイン原則、semantic token、カード/レイアウト方針
- `editorial_style_guide_v1.md` — 記事本文の執筆方針（文体・NG表現・執筆ワークフロー・セクション別テンプレート）
- `article-sourcing-reference-v1.md` — 記事候補を探す段階の方針（許可/除外ソース、検索クエリ例）

## 現行の正本

- データ型: `../../data/types.ts`
- データ取得/関連解決: `../../lib/data.ts`
- データ検証: `../../lib/validate.ts` と `../../scripts/validate-data.mjs`
- タグ正本: `../../lib/tagRegistry.ts`
- スペック項目正本: `../../lib/specSchema.ts`
- enumラベル/表示順: `../../lib/labels.ts` と `../../lib/display.ts`
- UI文言: `../../lib/uiText.ts`
- 色・テーマtoken: `../../src/app/globals.css`
- semantic tone: `../../lib/visualSemantics.ts`

ページ実装から `data/*.ts` を直接検索せず、取得や関連解決は `lib/data.ts` 経由にします。

## 現在残している設計文書

### (a) 正本・現行

新しい実装判断ではこちらを参照する。

- `ai_fullstack_development_guardrails_v1.md` — AI実装時の安全策と自己監査
- `architecture_future_considerations_v1.md` — 将来検討
- `copyright_and_media_rights_policy_v1.md` — 権利、引用、メディア利用
- `editorial_style_guide_v1.md` — 記事執筆方針（文体・セクション別テンプレート・NG表現・ワークフロー）
- `article-sourcing-reference-v1.md` — 記事候補ソーシング方針（許可/除外ソース、検索クエリ）
- `data-architecture-redesign-v1.md` — データ構造設計（データ設計の正本）
- `data-maintenance-checklist-v1.md` — データ運用チェックリスト（データ運用の正本）
- `deployment_sites_research_prompt_2026-06-01.md` — 導入事例データ調査用プロンプト
- `design_system_v1.md` — デザインシステム
- `humanoid_media_IA_v1.md` — 情報設計
- `humanoid_media_build_notes_v1.md` — UI/コンテンツ品質メモ
- `humanoid_mvp_scope_decision_v1.md` — MVPスコープ判断
- `humanoid_platform_tech_stack_v1.md` — 技術スタック
- `launch-readiness-meta-plan-v1.md` — 公開前のメタ情報、SNS共有、計測、プライバシー、sitemap整備計画
- `ui_architecture_and_development_policy_v1.md` — UI構造と開発方針

### (b) 参照・背景（旧／非正本）

経緯・背景の参照用。運用やデータ設計の**正本ではない**。データ運用の正本は `../data/README.md` と `data-maintenance-checklist-v1.md`、データ設計の正本は `data-architecture-redesign-v1.md`。

- `humanoid_data_management_guide_v1.md` — データ運用の背景説明（旧ガイド）
- `humanoid_data_model_policy_v1.md` — データモデル設計指針（旧。現行は data-architecture-redesign）
- `responsive-design-implementation-plan.md` — レスポンシブ改善の包括計画（Breadcrumb、詳細ページの1カラム化、sticky/header、比較モバイル操作、横スクロール系UIなどは現行実装へ部分反映済み。今後はこの長大計画をそのまま実行せず、個別の崩れを再調査して小さい計画にする）

### (c) 未実装・作業計画

実装判断の正本ではなく、これから実行する整理・改善計画。完了後は archive へ移動するか、正本へ反映したうえで役割を更新する。

- `layout-and-data-structure-audit-plan-v1.md` — 全ページのテキスト表示レイアウトとデータ構造配置の調査実行計画
- `project-wide-refactor-implementation-plan-v1.md` — 全体リファクタリングの実装順、最小task、完了条件を定義した実行計画
- `reports-news-explainer-ia-plan-v1.md` — `/reports` をニュース・メーカー解説・ロボット解説・基礎知識の4棚へ整理する実行計画
- `usecase-evidence-model-refactor-plan-v1.md` — `/use-cases` の出典、導入事例、候補ロボット根拠をデータモデルと validator で保証する実行計画
- `editorial-methodology-review-2026-06-24.md` — 記事題材・切り口・書き方のレビュー用草案（未承認。承認後に editorial_style_guide へ反映）

実装完了で archive へ移動した計画: `archive/guides-retirement-plan-v1.md`（`/guides` 撤去、2026-06-28 実装）＋ 復活資産 `archive/guides-retirement-v1.md`。

## アーカイブ

`docs/planning/archive/` は実装済み・履歴参照用の計画書置き場です。
新しい実装判断では、まず現行コードと上記の正本を確認し、アーカイブ文書は経緯確認に限定して使います。

### (d) archive 移動対象

現時点で `docs/planning/` 直下に archive 移動待ちとして残している文書はありません。
