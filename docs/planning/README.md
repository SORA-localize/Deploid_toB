# Planning Documents

Last cleaned: 2026-06-13

このディレクトリは、Deploid の現在有効な設計判断と運用方針を置く場所です。
実装済みの一時計画や過去の移行計画は `docs/planning/archive/` に退避しています。

## まず読むもの

- `../../ai_implementation_workflow_prompt.md` — AIに計画、実装、レビューを任せるときの共通手順（§8: データ実装＝`data/*.ts` 追加・更新の事前確認チェックリスト）
- `../data/README.md` — AIでデータ追加・更新を行うときの入口
- `data-maintenance-checklist-v1.md` — データ追加、slug変更、公開前確認、鮮度レビューの実行チェックリスト
- `data-architecture-redesign-v1.md` — id/slug分離、参照設計、正本管理、CMS移行を見据えたデータ設計
- `copyright_and_media_rights_policy_v1.md` — 画像、ロゴ、引用、出典、権利ステータスの運用方針
- `design_system_v1.md` — 現行UIのデザイン原則、semantic token、カード/レイアウト方針
- `editorial_style_guide_v1.md` — 記事本文の執筆方針（文体・NG表現・執筆ワークフロー・セクション別テンプレート）

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

## アーカイブ

`docs/planning/archive/` は実装済み・履歴参照用の計画書置き場です。
新しい実装判断では、まず現行コードと上記の正本を確認し、アーカイブ文書は経緯確認に限定して使います。
