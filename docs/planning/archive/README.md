# Archived Planning Documents

Last cleaned: 2026-06-23

ここには、実装済み・移行済み・一時調査用の計画書を退避しています。

新しい実装やデータ追加では、まず以下を参照します。

- `../README.md`
- `../../data/README.md`
- `../../../AGENTS.md`
- `../../../ai/rules/00-index.md`
- `../../../ai/rules/10-workflow.md`
- `../../../ai/rules/20-data.md` と `../../../ai/rules/21-data-maintenance-workflow.md`（データ作業時）

このディレクトリの文書は、経緯確認や過去判断の参照に限定して使います。

## 2026-06-23 Archived During AI Docs Reorganization

以下は `docs/planning/` 直下の未分類計画を棚卸しし、現行コードまたは現行ドキュメントへ反映済みと確認して移動したものです。

- `agent-docs-mece-reorganization-plan-v1.md` — `ai/rules/21-data-maintenance-workflow.md` と `ai/rules/80-doc-governance.md` の新設、README/CLAUDE薄型化、planning分類更新まで実行済み。
- `data-docs-mece-cleanup-plan-v1.md` — `data-maintenance-checklist-v1.md` に guides/useCases/deployments/articlePlacements の手順があり、`lib/validate.ts` で deployment sources 必須化が反映済み。
- `data-ops-hardening-plan-v1.md` — `manufacturer.id` 参照、記事画像の `getDisplayableAsset` / `checkImageAsset` 経由、`--site-anchor-offset`、関連解決の入力順保持、関連ID重複validateが現行実装に反映済み。
- `filter-count-display-plan-v1.md` — robots/manufacturers一覧の件数表示とフィルタ領域レイアウトが現行UIに反映済み。
- `home-mobile-ui-plan-v1.md` — homeのモバイル主要コンテンツ導線、注目ロボットカード、関連UI調整が現行実装に反映済み。
- `robots-csv-publish-and-sort-plan-v1.md` — `featuredRank` を使う robot sort と記事配置ソート整理が現行実装に反映済み。

## 2026-06-23 Archived During Hub Page Cache Components Planning

- `seo-hub-prerender-plan-v1.md` — `hub-page-cache-components-plan-v1.md` の調査で、6ハブページすべてが既に `lib/searchParams.ts` 経由でサーバー側 `searchParams` 読み取り＋ `initialFilters` props渡しの構成になっており、`next start` 後の生HTML確認でも実データ（Unitree/Figure等）が出ていることを確認済み。本計画が想定した「初期HTMLが薄い」問題は解消済みのため移動。
