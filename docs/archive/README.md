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

## 2026-06-23 Archived After Implementation Sweep

- `hub-page-cache-components-plan-v1.md` — `next.config.mjs` の `cacheComponents: true`、Footerの年表示cache helper、6ハブページのSuspense境界化、トップページ演出の非決定的render除去、sitemapのdeterministic lastModified、`/robots` の `use cache` + `cacheLife('hours')` + `cacheTag('robots-list')` が実装済み。`npm run build` で全137パス生成成功、6ハブページがPartial Prerenderになったことを確認済み。
- `usecase-domain-ui-rollout-v1.md` — `UseCase.primaryDomain`/`secondaryDomains` のUI接続が現行実装に反映済み。`/use-cases` の `domain` query、`getUseCaseDomainOptions`、カードの `use-case-domain` TagChip、詳細ページの得意分野行、検索documentへの `use-case-domain` 追加、metadata用filter反映まで確認済み。
- `home-article-scroll-plan-v1.md` — 計画どおりの横スクロールストリップは採用されず、現行homeは `getArticleIndexPlacementReports()` を使う `NewsHeroCarousel` + `NewsFeatureCard` のreports index型レイアウトへ置き換わっている。現行UIを優先し、この横スクロール案は履歴扱いにする。
- `nav-transition-performance-fix-plan-v1.md` — 主要ハブをclient state化して静的化する旧案。現行はCache Componentsで6ハブページをPartial Prerender化し、`PageSuspenseFallback` もSuspense境界に接続済みのため前提が古い。遷移遅延が再発する場合は現行Cache Components構成を前提に新規計画を作る。
- `component-duplication-unification-plan-v1.md` — サイドバー外枠（`SidebarSection`/`SidebarBlock`/`SidebarDivider`）の統一、`RelatedLinkList`/`DefinitionList`のvariant追加、`ConsultationCta`切り出しまで実装済み。`ManufacturerDetailHero`/`ManufacturerFactSheet`は見た目統一ではなく重複データ（同一事実の2重表示）の削除で解決。B（簡易スペックリスト統合）・C（見出しclass重複）はKISSの観点から見送りを決定済み。
- `article-tab-layout-data-plan-v1.md` — `/reports` と `articlePlacements` の構造整理メモ。現行の正本ではないが、記事タブ拡張やZEALS/Omakase Robotics記事の扱いを検討した経緯として参照価値があるため履歴扱いにする。

## 2026-06-25 Archived After Implementation

- `source-list-meta-heading-dedup-plan-v1.md` — `component-duplication-unification-plan-v1.md` の「C」を自己調査し直して見つかった、`SourceList` の `titleClassName` 重複（reports/guides）のみを対象にした小さな修正計画。`titleVariant`（`titleClassName` 未指定時のみ適用）を追加し、両ファイルを置き換え済み。出典見出しのclass属性が変更前後で一致することを確認済み。

## 2026-06-28 Archived After Implementation

- `usecase-publication-quality-gate-plan-v1.md` — published UseCase の候補を public-grade basis（`deployment` / `official-use-case` / `adjacent-deployment`）に限定し、既存UseCaseデータ、validator、候補ラベル表示、standing docsへ反映済み。
