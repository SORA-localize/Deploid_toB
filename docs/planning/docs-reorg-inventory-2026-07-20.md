# ドキュメント再体系化 Phase 0 棚卸し台帳

Created: 2026-07-20
Status: Phase 0 成果物（確定版）。完了後 archive へ移動する。

対象: アクティブ md 63 ファイル（`docs/planning/archive/` の 68 ファイルは対象外）。

判定方法: 冒頭30行＋見出し構造の把握に加え、「不明」となったファイルはコード・データ・git履歴と突き合わせて実装状況を確認した（各行の「根拠」列参照）。ファイル自身の Status 自己申告は信用せず、実物で裏を取っている。

凡例（現ステータス）:

- **正本** — 実装判断・運用で現在使われている source of truth
- **計画** — 未実装または実装中の作業計画
- **背景** — 経緯・参照用。現在の運用ルールではない
- **済** — 実装完了・反映済みが確認できた。archive 移動候補
- **削除候補** — 案内スタブ等で参照価値も残らないもの

---

## 1. `docs/planning/` 直下（38）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `ai_fullstack_development_guardrails_v1.md` | AI単独実装時の失敗対策・自己監査ループ・チェックリスト | 正本 | `ai/rules/10-workflow.md` と役割近接（本件=プロジェクト特有の失敗対策、10=汎用手順。住み分け自体は成立） |
| `architecture_future_considerations_v1.md` | 現在のアーキ判断と将来見直しトリガー | 正本 | なし |
| `article-sourcing-reference-v1.md` | 記事候補ソーシングの許可/除外情報源・検索クエリ | 正本 | なし |
| `compare-and-catalog-ui-improvement-plan-v1.md` | 比較タブ再構成・カタログUI改善計画 | 計画 | experiment ブランチ（現 `archive/local-media-preview-20260714`）で実装・§8.5〜8.8まで合意済みだが、**main には未反映**（`CompareClient.tsx` に比較表なし、`TBD_LABEL` 使用継続を確認）。README (a)(b)(c) 未掲載 |
| `copyright_and_media_rights_policy_v1.md` | 著作権・商標・画像/引用/出典の運用ポリシー | 正本 | なし |
| `data-architecture-redesign-v1.md` | データ構造再設計（id/slug分離、正本マトリクス、CMS移行パス） | 正本 | 旧2ガイドの上位と明記済み |
| `data-maintenance-checklist-v1.md` | データ追加・更新・公開・鮮度レビューの実行チェックリスト | 正本 | README「まず読むもの」にあるが (a) 一覧に未掲載という表記漏れ |
| `deployment_sites_research_prompt_2026-06-01.md` | 導入事例データを別AIに調査させる1回性プロンプト | 済 | `data/deployments.ts` に12件投入済み＝プロンプトは消化済み。README (a) 正本群への混在は誤分類 |
| `design_system_v1.md` | デザイン原則・トークン・レイアウト・コンポーネント仕様 | 正本 | なし |
| `docs-reorganization-plan-v1.md` | 本ドキュメント再体系化の実行計画 | 計画 | なし |
| `editorial_style_guide_v1.md` | 記事執筆方針（文体・NG表現・テンプレート） | 正本 | なし |
| `editorial-methodology-review-2026-06-24.md` | 題材選定・切り口のレビュー用草案 | 計画 | 「未承認草案」を自称するが `ai/rules/22-article-sourcing.md` が must-read 指定しており**実質運用中**。承認して style guide へ統合するか、正本昇格かの判断が Phase 2 で必要 |
| `humanoid_data_management_guide_v1.md` | データ運用ガイド（旧） | 背景 | 本書自身が非正本を明記 |
| `humanoid_data_model_policy_v1.md` | データモデル設計指針（旧） | 背景 | 本書自身が非正本を明記 |
| `humanoid_media_build_notes_v1.md` | 構築メモ＆公開TODO議事録 | 背景 | Guide撤去で大半無効。ただし `ai/rules/30-ui-design.md` が anti-AI-feel ルールの出典として**現役参照**。移動時はリンク追従必須、Phase 2 で該当節の抽出可否を判断 |
| `humanoid_media_IA_v1.md` | 情報設計・要件定義 | 背景 | `data-maintenance-checklist-v1.md`（正本）から参照残存。移動時はリンク追従必須 |
| `humanoid_mvp_scope_decision_v1.md` | 6/10ロボスタ向けMVPスコープ決定書 | 背景 | マイルストーン終了済み。README (a) 正本扱いは誤分類 |
| `humanoid_platform_tech_stack_v1.md` | 技術スタック選定理由 | 正本 | なし |
| `launch-readiness-meta-plan-v1.md` | 公開前メタ情報・OGP・sitemap・計測整備計画 | 済 | `opengraph-image.tsx` / `sitemap.ts` / `privacy/page.tsx` / `lib/jsonLd.ts` 全て存在＝主要項目実装済み。残るのは「未決事項」節のみ（Phase 2 で残課題の転記先を判断） |
| `layout-and-data-structure-audit-plan-v1.md` | レイアウト・データ配置の調査計画 | 済 | 自己申告どおり完了。後続 `component-duplication-unification-plan-v1.md` も archive 済みを確認 |
| `manufacturer-logo-usage-spec-v1.md` | メーカーロゴのvariant・表示解決仕様 | 正本 | なし |
| `news-automation-prompt-contract-v1.md` | 日次ニュース出力→記事データ変換契約 | 正本 | なし |
| `project-wide-refactor-implementation-plan-v1.md` | 全体リファクタの実装task分解（936行） | 済 | 実装マーカー確認済み（`ComingSoonGate` / `ui/marquee` 削除済み、`DefinitionList.tsx` 存在）。Phase 2 で未消化taskの有無だけ精査して archive |
| `README.md`（planning直下） | planning の入口・正本一覧・分類索引 | 正本 | 本計画の再編対象そのもの。2026-07-01 以降の新規5ファイルが未掲載、済み計画の分類が stale |
| `responsive-audit-2026-06-30.md` | レスポンシブ課題の調査レポート | 背景 | 後続の `responsive-surface-audit-targets-v1.md` 系列に発展的置換。ただし指摘自体は未修正のものが残る（例: H-1 の `w-72` が `Header.tsx` に現存）。未消化課題の転記先を Phase 2 で判断 |
| `responsive-capture-protocol-v1.md` | レスポンシブ手動キャプチャ手順 | 計画 | `responsive-phase-1-static-audit-v1.md` R-06 の補助文書 |
| `responsive-design-implementation-plan.md` | レスポンシブ改善の包括計画（旧） | 背景 | README (b) で「このまま実行しない」と明記済み |
| `responsive-phase-1-static-audit-v1.md` | レスポンシブPhase1静的監査・進行トラッカー | 計画 | R-06 ビジュアルキャプチャ待ちで滞留中 |
| `responsive-surface-audit-targets-v1.md` | レスポンシブ監査対象のMECE棚卸し（Phase 0） | 計画 | phase-1 と連鎖 |
| `robot-catalog-fullstack-implementation-plan-v1.md` | ロボットカード・詳細ページ一貫再実装計画 v2 | 済 | **origin/main にマージ済みを確認**（`feat(robots): rebuild robot detail content` 等のコミット群）。README (c) 未実装扱いは stale |
| `robot-data-factcheck-impl-plan-2026-07-01.md` | ファクトチェック反映実装計画（Phase A/B/C） | 計画 | Phase A/B は実装済み（`apptronik-apollo-2` / `agibot-g2` / `unitree-g1-d` がデータに存在）。Phase C は部分実装（`marketAvailability` あり、`scopeStatus` / `evidenceLevel` なし）。残Phase C の要否判断が Phase 2 で必要 |
| `robot-factcheck-research-prompt-2026-07-01.md` | 掲載データのファクトチェック用調査プロンプト | 正本 | 「掲載変更のたびに更新する」継続運用ツール。README 未掲載のため正本群への登録が必要 |
| `robot-image-sourcing-plan-v1.md` | 画像・ロゴ調達の実行計画（1307行） | 計画 | 調査開始gate未実装で待機中と自己申告。整合性は取れている |
| `ui_architecture_and_development_policy_v1.md` | UI構造・責務分離・開発手順の方針 | 正本 | `design_system_v1.md` と対（住み分け明記済み） |
| `usecase-data-scope-cleanup-plan-2026-06-30.md` | `/use-cases` スコープ外・404出典の整理計画 | 済 | ZEROSHIKI 等の除去をデータで確認（`data/robots.ts` / `data/useCases.ts` に残存ゼロ） |
| `usecase-evidence-model-refactor-plan-v1.md` | `/use-cases` 出典・候補根拠のモデル/validator保証計画 | 済 | `basis` / `evidenceSourceUrls` が `data/types.ts` に存在＝実装済み |
| `usecase-factcheck-research-prompt-2026-06-30.md` | `/use-cases` 全件ファクトチェック用プロンプト（2105行の生ログ） | 済 | 冒頭に「実装の根拠に使うな」の自己警告。反映済みで用済み |
| `usecase-page-redesign-plan-v1.md` | `/use-cases` 産業入口への全面再設計計画 | 済 | 「Status: 未着手」は stale。**実装済みを確認**（useCases 44件・`primaryIndustry` フィールド存在） |

## 2. `ai/rules/`（9）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `00-index.md` | AIルール群の入口・作業種別ルーティング | 正本 | なし |
| `10-workflow.md` | 計画/実装/レビューの共通プロンプト集 | 正本 | guardrails と役割近接（前掲） |
| `20-data.md` | データ作業のルーティング | 正本 | なし |
| `21-data-maintenance-workflow.md` | `data/*.ts` 編集前ゲート（G1〜G11） | 正本 | なし |
| `22-article-sourcing.md` | 記事候補探索のルーティング | 正本 | なし |
| `30-ui-design.md` | UI/デザイン作業のルーティング | 正本 | `humanoid_media_build_notes_v1.md`（背景文書）を must-read 指定している点は Phase 2 で解消要 |
| `40-content-rights.md` | 権利センシティブ作業のルーティング | 正本 | なし |
| `80-doc-governance.md` | ドキュメント管理ルール | 正本 | 本再編完了時に Phase 5 で改訂予定 |
| `90-archive-policy.md` | 旧計画の扱い・archiveルール | 正本 | なし |

## 3. `docs/data/`（4）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `README.md` | データ追加・更新のAI向け入口 | 正本 | なし |
| `manufacturer-research-draft-2026-06-02.md` | メーカーデータ拡充の下書き調査 | 済 | 追加候補だった `limx-dynamics` / `xpeng-robotics` が `data/manufacturers.ts` に反映済み。被参照ゼロ。対の計画書は archive 済み |
| `robot-model-inventory.md` | 全社モデルの掲載可否棚卸し（2026-05-30） | 済 | 被参照ゼロ。17社時点の中間文書で、現行25社・63機体と乖離。役割は `robot-factcheck-research-prompt-2026-07-01.md` が引き継いでいる |
| `tagging.md` | タグ追加の運用手順 | 正本 | 撤去済み `Guide.topics` への言及が残り要更新（Phase 4） |

## 4. ルート直下（4）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `AGENTS.md` | 汎用AIエージェント入口 | 正本 | なし |
| `ai_implementation_workflow_prompt.md` | 移設案内スタブ（11行） | 削除候補 | 被参照は archive 文書と本再編関連のみ＝現役参照ゼロを確認。安全に削除可能 |
| `CLAUDE.md` | Claude Code 専用ガイダンス | 正本 | なし |
| `README.md`（ルート） | 人間向けプロジェクト概要 | 正本 | なし |

## 5. `docs/superpowers/plans/`（3）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `2026-05-29-code-quality-fixes.md` | SSOT/A11y修正の実装計画 | 済 | `aria-current` が `Header.tsx` に存在 |
| `2026-05-30-filter-tag-redesign.md` | フィルタ・タグ再設計計画 | 済 | `industryTags` / `taskTags` が `data/types.ts` に存在 |
| `2026-05-30-sort-order.md` | 一覧の並び替え実装計画 | 済 | `sortRobots` / `RobotSortKey` が `lib/display.ts` に存在 |

## 6. `docs/market-environment/`（3）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `README.md` | 市場環境調査の運用ルール・索引 | 正本 | なし |
| `competitors/_template-competitor-profile.md` | 競合調査テンプレート | 正本 | なし |
| `competitors/korthos/korthos-profile-2026-07-16.md` | Korthos 調査プロファイル | 背景 | 調査スナップショット（上書きしない運用が README に明記済み） |

## 7. `docs/strategy/`（1）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `business-positioning-and-roadmap-2026-07.md` | 事業ポジショニング・力の掛け方の現行整理 | 正本 | 「状況が変わったら随時書き換える」現行文書。分類体系上の置き場所がなく孤立（既指摘） |

## 8. `public/images/robots/README.md`（1）

| ファイル | 目的 | 現ステータス | 根拠・重複疑い |
|---|---|---|---|
| `public/images/robots/README.md` | ロボット写真の配置規則・role・命名 | 正本 | アセット併設のため現位置維持が妥当 |

---

## 集計

- 正本: 32
- 計画: 8（docs-reorg / compare-and-catalog / responsive 3件 / robot-image-sourcing / editorial-methodology / robot-data-factcheck 残Phase C）
- 背景: 8
- 済（archive候補）: 14
- 削除候補: 1（`ai_implementation_workflow_prompt.md`）

（計63）

## 調査で確定した構造的な問題

1. **完了検知の欠如が最大の問題。** 63ファイル中14件（22%）が実装済みなのに archive されていない。特に `usecase-page-redesign-plan-v1.md` は「Status: 未着手」のまま実装完了しており、ファイル内 Status 表記も README 分類も両方 stale。`80-doc-governance.md` の Completion Rule は存在するが、実行トリガーがないため機能していない。
2. **README (a) 正本群の誤分類。** 1回性プロンプト（`deployment_sites_research_prompt`）と終了済みマイルストーン（`humanoid_mvp_scope_decision`）が正本扱いのまま。
3. **正本→背景文書への現役参照が2本ある。** `30-ui-design.md` → `build_notes`（anti-AI-feel）、`data-maintenance-checklist` → `humanoid_media_IA`。背景文書を移動する際はこの2本の追従が必須。
4. **継続運用ツールの未登録。** `robot-factcheck-research-prompt-2026-07-01.md` は更新前提の運用ツールだが、どの分類にも載っていない。
