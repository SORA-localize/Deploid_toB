# Deploid Docs

md を覗くだけで「今何が動いているか」「あの内容はどうなったか」が分かることを目的にした入口。人間（オーナー）はこの1枚から必要な文書へ潜る。AIエージェントの入口は `../AGENTS.md` → `../ai/rules/00-index.md`。

---

## いま動いているもの

`docs/plans/` にある実行中の計画。完了したら `docs/archive/` へ移す（このダッシュボードからも消える）。

| 計画 | 一言 | branch | 開始日 |
|---|---|---|---|
| [ロボットDB同期](plans/robot-db-sync-plan-v1.md) | `~/Downloads/ロボDB/ロボDB/*.html` を原本にDBを同期。母集団177行→完了時198レコード（更新42・追加134・archived化1・variant分割1）、メーカー26→59社。**Task 1〜11は着手可能、Task 12はシートへの1列追加待ち**（`deploymentStage`はどのシートからも導出できず型必須）。あわせて「買えるか」軸の重複を解消する（`Robot.buyerReadiness` と `marketAvailability` を削除） | 未定 | 2026-08-07 |
| [積み残し登録簿フォローアップ](plans/deferred-work-register-followup-v1.md) | 登録簿#4/#5/#6/#10の実行計画。**#4・#5・#6は解消済み**。残るのは#10のバッテリー23機（CSVのvariant名とレコードの対応を人が決める） | `main`（専用branchなし） | 2026-08-05 |
| [コンテンツ基盤移行](plans/content-platform-migration-plan-v1.md) | `data/*.ts` から Payload CMS + managed PostgreSQLへ、URLと不変idを保って段階移行。実装は未着手。**2026-07-26付でPhase 3・5・6が作った層を反映していない——着手時に現行実装へ突合すること** | 未定（専用branch必須） | 2026-07-26 |
| [プロジェクト全体リファクタリング](plans/project-wide-refactor-roadmap-v2.md) | 上位ロードマップ。**Phase番号は移行前リファクタの1〜7とは別体系**（本書のPhase 1はCMS/DB移行を指す）。移行前スコープは実装インデックス側が正本 | phaseごとに分割 | 2026-07-26 |
| [レスポンシブ対応](plans/responsive-phase-1-static-audit-v1.md) | Phase 1のコード実装は完了。R-06（実機スクリーンショットでの最終確認）が未実施 | 専用branchなし（mainへ直接実装） | 2026-07-03 |
| [ロボットデータ ファクトチェック反映](plans/robot-data-factcheck-impl-plan-2026-07-01.md) | Phase A/Bは完了。Phase Cは`marketAvailability`のみ実装済み、`scopeStatus`/`evidenceLevel`が未着手 | 未定（型変更のため別branch推奨のまま） | 2026-07-01 |
| [ロボットデータ R02統合](plans/robot-data-r02-integration-plan-v1.md) | 全61機再調査（DATA-R02）の反映。低リスクbatchは反映済み、個別conflict機（pal-kangaroo等）と最終回帰監査（R02-11）が残task | `data/robot-catalog-r01-rollout-20260716`（PR #3はmerge済み、残taskは別PRで継続） | 2026-07-17 |
| [ロボット画像・メーカーロゴ調達](plans/robot-image-sourcing-plan-v1.md) | Robot B1〜B6の読み取り専用調査は完了。台帳・許諾SSOTの実装が調査開始gateとして未着手 | 未定 | 2026-07-08 |

---

## 最近の決定・反映

`docs/decisions/` の直近更新（frontmatterの`updated`が新しい順、上位5件）。

| 日付 | 文書 | 内容 |
|---|---|---|
| 2026-07-26 | [コンテンツ基盤・DBアーキテクチャ](decisions/content-platform-and-database-architecture-v2.md) | Payload CMS + managed PostgreSQLを採用。GitHub、管理画面、Codex MCP、公開サイトの責務を確定 |
| 2026-07-26 | [データアーキテクチャ再設計](decisions/data-architecture-redesign-v1.md) | id / slug設計は維持し、旧Git型CMS移行案を新しいPayload移行計画へ置換 |
| 2026-07-26 | [技術スタック](decisions/humanoid_platform_tech_stack_v1.md) | CMS候補とDB不要判断を、Payload + PostgreSQLの確定構成へ更新 |
| 2026-07-26 | [アーキテクチャ将来対応リスト](decisions/architecture_future_considerations_v1.md) | コンテンツ基盤移行の確定判断と移行後の見直し条件を追加 |
| 2026-07-26 | [Deploid Data Work Guide](decisions/data/README.md) | cutoverまでは現行TS運用を継続する移行期間ルールを追加 |

---

## 直近で完了したもの

進行中ではないが、経緯を追う起点になるもの。本体は `docs/archive/` にある。

| 完了 | 内容 |
|---|---|
| 2026-08-04 | [CMS / DB移行前リファクタリング Phase 1〜7](archive/pre-migration-refactor-implementation-index-v1.md)。実測値は [結果](reference/pre-migration-refactor-results-v1.md) |
| 2026-08-05 | [同リファクタの全体レビュー](archive/pre-migration-refactor-full-review-plan-v1.md)。14の規定文書に照らしてR1〜R19を5層に分けて実行し、健全と結論。唯一の修正はコンポーネント3ファイルの重複除去 |
| 2026-08-06 | 積み残し登録簿の `#4`（color-contrast 219件→0件、axe gateを`serious`へ）・`#5`（/reportsタブ到達性）・`#6`（Reports H1）・`#9`（e2e hydration race）・`#11`（Linuxベースライン自動再生成） |

残る積み残しは [登録簿](decisions/deferred-work-register-v1.md) が正本。

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

- [`content-platform-and-database-architecture-v2.md`](decisions/content-platform-and-database-architecture-v2.md) — Payload CMS、PostgreSQL、GitHub、公開サイト、Codex MCPの役割を定める移行後アーキテクチャ
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
- [`deferred-work-register-v1.md`](decisions/deferred-work-register-v1.md) — リファクタ中に「今はやらない」と判断した項目の唯一の一覧（積み残し登録簿）
- [`architecture_future_considerations_v1.md`](decisions/architecture_future_considerations_v1.md) — 現在のアーキ判断と将来見直しトリガー
- [`humanoid_platform_tech_stack_v1.md`](decisions/humanoid_platform_tech_stack_v1.md) — 技術スタック選定理由
- [`business-positioning-and-roadmap-2026-07.md`](decisions/business-positioning-and-roadmap-2026-07.md) — 事業ポジショニング・今後の動き方（随時書き換える現行文書）

### 現行の正本（コード側）

以下はCMS / DBのcutover完了まで有効。移行後の正本分担は [`content-platform-and-database-architecture-v2.md`](decisions/content-platform-and-database-architecture-v2.md) に従い、この一覧も同時に更新する。

- データ型: `../data/types.ts`
- データ取得/関連解決: `../lib/data.ts`
- データ検証: `../lib/validate.ts` と `../scripts/validate-data.mjs`
- タグ正本: `../lib/tagRegistry.ts`
- スペック項目正本: `../lib/specSchema.ts`
- enumラベル/表示順: `../lib/labels.ts` と `../lib/display.ts`
- UI文言: `../lib/uiText.ts`
- 色・テーマtoken: `../src/app/globals.css`
- semantic tone: `../lib/visualSemantics.ts`

ページ実装から `data/*.ts` を直接検索せず、取得や関連解決は `lib/data.ts` 経由にする。移行後もページから直接SQL / Payload SDKを呼ばず、サーバー専用repository境界を経由する。

---

## 更新責務

- 計画を開始・完了したら「いま動いているもの」の表を更新する（完了時は行を消し、`docs/archive/`へ移動）。
- `docs/decisions/` の文書を改訂したら、その文書のfrontmatter `updated` を更新する。「最近の決定・反映」表は`updated`降順の目視転記のため、大きな改訂をしたら上位5件に入っているか確認する。
- 新しい正本文書を `docs/decisions/` に追加したら「decisions の主要文書」に追記する。
- 詳しい更新順序は `ai/rules/80-doc-governance.md` を参照。
