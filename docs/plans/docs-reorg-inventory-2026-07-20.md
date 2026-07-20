---
status: plan
updated: 2026-07-20
---

# ドキュメント再体系化 棚卸し台帳

Created: 2026-07-20
Status: Phase 0（棚卸し）+ Phase 2（処遇判定）完了。Phase 3（移動実行）へ進行中。完了後 archive へ移動する。

## ブランチ横断チェック（2026-07-20 追記）

他ローカルブランチが未マージのままdocs対象ファイルを触っていないか確認したところ、`data/robot-catalog-r01-rollout-20260716`（origin push済み・実装中・DATA-R01→R02のロボットデータ品質整備、51コミット・139ファイル差分）が以下7ファイルを触っていた。別セッションで詳細調査した結果:

- **差分ゼロ（無条件で移動可）**: `editorial_style_guide_v1.md`、`archive/manufacturer-guide-buyer-lens-plan-v1.md`
- **軽微差分（移動してもコンフリクトリスク低い）**: `docs/data/README.md`（+33行程度）、`docs/planning/README.md`（+2行）、`design_system_v1.md`（+15行）
- **保留（移動を見送る）**: `copyright_and_media_rights_policy_v1.md`（416行差分、権利ポリシーの方針転換が最新コミット2026-07-19と進行中）、`robot-image-sourcing-plan-v1.md`（gate解釈の改訂が同時進行中）

この2ファイルは中身が生きて動いているため、`data/robot-catalog-r01-rollout-20260716` のマージ（時期不明、R02-08/09が大半完了・R02-11最終回帰監査が未実施の段階）を待ってから移動する方針を一度は立てた。

**オーナー判断（2026-07-20）で解除**: 両ファイルとも中身は方針の明文化であり、rollout branch側の書き換えも実質完了に近いと判断。保留を解除し、他61ファイルと同じくPhase 3で移動する。rollout branchマージ時にコンフリクトが出た場合は、その時点でrights側の内容を正として再適用する。

| ファイル | Phase2処遇 | Phase3実行時の扱い |
|---|---|---|
| `docs/planning/copyright_and_media_rights_policy_v1.md` | keep→decisions | 保留解除。通常どおり移動する |
| `docs/planning/robot-image-sourcing-plan-v1.md` | keep→plans | 保留解除。通常どおり移動する |

対象: アクティブ md 63 ファイル（`docs/planning/archive/` の 68 ファイルは対象外）。

判定方法:
- Phase 0: 冒頭30行＋見出し構造の把握と、コード・データ・git履歴との突き合わせ（ファイル自身の Status 自己申告は信用しない）
- Phase 2: 重複疑い・残タスクがあるファイルを全文精読し、処遇（keep/move/merge/split/rewrite/archive/delete）を判定。移動先は Phase 1 で確定した4棚（`docs/decisions/` `docs/plans/` `docs/reference/` `docs/archive/`）

凡例（現ステータス）: 正本 / 計画 / 背景 / 済（実装済み・archive候補）/ 削除候補
凡例（処遇）: **keep**（内容そのまま、棚だけ移動）/ **merge**（他ファイルへ統合）/ **split**（一部を抜き出してから処理）/ **rewrite**（内容を書き換える）/ **archive**（archiveへ）/ **delete**（削除）

---

## 1. `docs/planning/` 直下（38）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `ai_fullstack_development_guardrails_v1.md` | 正本 | keep | decisions | `ai/rules/10-workflow.md`と役割近接だが住み分け成立、統合不要 |
| `architecture_future_considerations_v1.md` | 正本 | keep | decisions | なし |
| `article-sourcing-reference-v1.md` | 正本 | keep | decisions | なし |
| `compare-and-catalog-ui-improvement-plan-v1.md` | 済 | archive | archive | 訂正（初回判定ミス）: `TBD_LABEL`残存を根拠に未実装と誤判定していたが、`archive/local-media-preview-20260714`の全commit（T1〜T3b、§8.5〜8.8改訂含む）がmainに同一メッセージ・同一著者・同一タイムスタンプで存在＝squash/cherry-pick済みを確認。`TBD_LABEL`はenum不明ステータス用に意図的に残す設計（T1 Option B）だった。ブランチ内でmainに無いcommitはロゴ・画像プロトタイプ系のみで`robot-image-sourcing-plan-v1.md`の管轄 |
| `copyright_and_media_rights_policy_v1.md` | 正本 | keep | decisions | なし |
| `data-architecture-redesign-v1.md` | 正本 | keep | decisions | なし |
| `data-maintenance-checklist-v1.md` | 正本 | keep | decisions | なし |
| `deployment_sites_research_prompt_2026-06-01.md` | 済 | archive | archive | `data/deployments.ts`に12件投入済みで消化済み |
| `design_system_v1.md` | 正本 | keep | decisions | なし |
| `docs-reorganization-plan-v1.md` | 計画 | keep | plans | 本計画自体。T5-5で自らarchiveへ移動する（Phase5完了時） |
| `editorial_style_guide_v1.md` | 正本 | **merge受け皿** | decisions | `editorial-methodology-review-2026-06-24.md`の内容を新設節として受け入れる |
| `editorial-methodology-review-2026-06-24.md` | 計画 | **merge** | (消滅) | 題材選定基準（§4-6）・記事化判定（§10）・hero掲載基準（§11）を`editorial_style_guide_v1.md`へ新設節として統合し、本ファイルは削除する。`ai/rules/22-article-sourcing.md`の参照も統合後の節へ張り替える（Phase4） |
| `humanoid_data_management_guide_v1.md` | 背景 | keep | reference | `ai/rules/90-archive-policy.md`が「archive外の背景」と明示指定。フォルダ名変更に伴い同ルールをPhase5で更新 |
| `humanoid_data_model_policy_v1.md` | 背景 | keep | reference | 同上 |
| `humanoid_media_build_notes_v1.md` | 背景 | archive | archive | 全文精読済み。Guide中心の初期構築TODOで大半が完了/撤去済み。`ai/rules/30-ui-design.md`が「anti-AI-feel rulesの出典」として参照しているが、実際の該当節（§4）は「量産SaaS顔にしない」程度の薄い記述で、`30-ui-design.md`自身のStanding Rulesが既により詳細な同種ルールを持っており実質重複。**Phase3でai/rules/30-ui-design.mdのMust Readからこの参照を削除する** |
| `humanoid_media_IA_v1.md` | 背景 | keep | reference | 全文精読済み。§1-3・§7（ページ役割）は「大枠有効」と自己申告どおり実際に現行ナビと整合。**`data-maintenance-checklist-v1.md` §Mが§7を名指しで参照しており、archiveせず背景として残す必要がある**。旧サンプルコード・6/10 MVP章（§9-13）は完全に陳腐化しているが、Phase2では書き換えない（Phase4で§9-13削除のrewrite候補） |
| `humanoid_mvp_scope_decision_v1.md` | 背景 | archive | archive | 完全に終了した過去のマイルストーン。README以外に現役参照なし |
| `humanoid_platform_tech_stack_v1.md` | 正本 | keep | decisions | なし |
| `launch-readiness-meta-plan-v1.md` | 済 | **split→archive** | archive | 実装済みを確認。ただし「未決事項」2件（画像credit表示範囲／OGP画像を元メディア素材か生成ブランドカードにするか）が未解決のまま残っている。**この2件を`copyright_and_media_rights_policy_v1.md`の残課題節へ転記してからarchiveする**（Phase4） |
| `layout-and-data-structure-audit-plan-v1.md` | 済 | archive | archive | 自己申告どおり完了。後続の`component-duplication-unification-plan-v1.md`も既archive済みを確認 |
| `manufacturer-logo-usage-spec-v1.md` | 正本 | keep | decisions | なし |
| `news-automation-prompt-contract-v1.md` | 正本 | keep | decisions | なし |
| `project-wide-refactor-implementation-plan-v1.md` | 済 | archive | archive | 対象branch `refactor/project-wide-refactor`は消滅（ローカル・リモート共になし）。完了条件の大半をコードで確認済み（ComingSoonGate削除・DefinitionList統合・aria-current等）。F-003（Playwright方針）・H-003（search実装差異の文書化）等、個別未検証項目が残る可能性はあるが、branch消滅＝この計画単位としては終了と判断 |
| `README.md`（planning直下） | 正本 | **merge** | (docs/README.mdへ吸収) | (a)(b)(c)テーブルの内容は新設`docs/README.md`の棚マップ・ダッシュボードへ統合し、本ファイルは削除する（Phase5 T5-2） |
| `responsive-audit-2026-06-30.md` | 背景 | **split→archive** | archive | 後続の`responsive-surface-audit-targets-v1.md`系列に発展的置換。ただしH-1（`Header.tsx`の`w-72`固定幅）等、未修正の指摘が残存を確認。**未消化の指摘を`responsive-phase-1-static-audit-v1.md`の優先度リストへ転記してからarchiveする**（Phase4） |
| `responsive-capture-protocol-v1.md` | 計画 | keep | plans | `responsive-phase-1-static-audit-v1.md` R-06の補助文書として一体運用 |
| `responsive-design-implementation-plan.md` | 背景 | archive | archive | README (b)で「このまま実行しない」と明記済み |
| `responsive-phase-1-static-audit-v1.md` | 計画 | keep | plans | R-06ビジュアルキャプチャ待ちで進行中 |
| `responsive-surface-audit-targets-v1.md` | 計画 | keep | plans | phase-1の前提（Phase0）として現役 |
| `robot-catalog-fullstack-implementation-plan-v1.md` | 済 | archive | archive | origin/mainへのマージを確認済み |
| `robot-data-factcheck-impl-plan-2026-07-01.md` | 計画 | **rewrite** | plans | Phase A/B実装済み（`apptronik-apollo-2`等をデータで確認）、Phase Cは`marketAvailability`のみ実装・`scopeStatus`/`evidenceLevel`は未実装。**Phase A/Bを完了済みとして明記し、Phase Cのみ残taskとして残す書き換えが必要**（Phase4） |
| `robot-factcheck-research-prompt-2026-07-01.md` | 正本 | keep | decisions | 「掲載変更のたびに更新」前提の継続運用ツール。README未掲載だったため今回新規登録 |
| `robot-image-sourcing-plan-v1.md` | 計画 | keep | plans | 調査開始gate未実装で待機中と自己申告、矛盾なし |
| `ui_architecture_and_development_policy_v1.md` | 正本 | keep | decisions | なし |
| `usecase-data-scope-cleanup-plan-2026-06-30.md` | 済 | archive | archive | ZEROSHIKI等の除去をデータで確認 |
| `usecase-evidence-model-refactor-plan-v1.md` | 済 | archive | archive | `basis`/`evidenceSourceUrls`が型定義に存在＝実装済み |
| `usecase-factcheck-research-prompt-2026-06-30.md` | 済 | archive | archive | 自己警告どおり実装へ反映済みの生ログ |
| `usecase-page-redesign-plan-v1.md` | 済 | archive | archive | ファイル記載は「Status: 未着手」だが実装済みを確認（useCases 44件・`primaryIndustry`フィールド存在）。**自己申告Statusと実態の乖離はT2-2所見として記録**（下記参照） |

## 2. `ai/rules/`（9）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `00-index.md` | 正本 | keep | 現位置 | Phase5でパス参照を新体系へ更新（T5-3） |
| `10-workflow.md` | 正本 | keep | 現位置 | なし |
| `20-data.md` | 正本 | keep | 現位置 | なし |
| `21-data-maintenance-workflow.md` | 正本 | keep | 現位置 | なし |
| `22-article-sourcing.md` | 正本 | keep | 現位置 | `editorial-methodology-review`統合後、参照先を新節へ張り替え（Phase4） |
| `30-ui-design.md` | 正本 | keep | 現位置 | `humanoid_media_build_notes_v1.md`への参照をPhase3で削除 |
| `40-content-rights.md` | 正本 | keep | 現位置 | なし |
| `80-doc-governance.md` | 正本 | keep | 現位置 | Phase5で新体系（4棚・frontmatter仕様）に合わせて全面改訂（T5-4、計画書のスコープ内） |
| `90-archive-policy.md` | 正本 | keep | 現位置 | Phase5でフォルダ名変更（`docs/planning/archive`→`docs/archive`）・背景文書2件のパスを更新 |

## 3. `docs/data/`（4）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `README.md` | 正本 | keep | decisions | `data-maintenance-checklist-v1.md`と役割は入口/詳細で相補的、統合不要 |
| `manufacturer-research-draft-2026-06-02.md` | 済 | archive | archive | 追加候補が`data/manufacturers.ts`へ反映済み、被参照ゼロ |
| `robot-model-inventory.md` | 済 | archive | archive | 被参照ゼロ、17社時点の中間文書で現行25社と乖離 |
| `tagging.md` | 正本 | **rewrite** | decisions | 撤去済み`Guide.topics`への言及を削除する書き換えが必要（Phase4） |

## 4. ルート直下（4）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `AGENTS.md` | 正本 | keep | 現位置 | Phase5でパス参照を更新（T5-3） |
| `ai_implementation_workflow_prompt.md` | 削除候補 | **delete** | (削除) | 被参照は本再編関連ファイルのみ＝現役参照ゼロを確認済み |
| `CLAUDE.md` | 正本 | keep | 現位置 | Phase5でパス参照を更新 |
| `README.md`（ルート） | 正本 | keep | 現位置 | Phase5で`docs/planning/README.md`への言及を`docs/README.md`へ更新 |

## 5. `docs/superpowers/plans/`（3）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `2026-05-29-code-quality-fixes.md` | 済 | archive | archive | `aria-current`実装確認済み |
| `2026-05-30-filter-tag-redesign.md` | 済 | archive | archive | `industryTags`/`taskTags`実装確認済み |
| `2026-05-30-sort-order.md` | 済 | archive | archive | `sortRobots`/`RobotSortKey`実装確認済み |

`docs/superpowers/plans/`ディレクトリ自体は3件全archiveのため空になり、ツリーごと解消する。

## 6. `docs/market-environment/`（3）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `README.md` | 正本 | keep | reference/market-environment/ | ツリーごと移動 |
| `competitors/_template-competitor-profile.md` | 正本 | keep | reference/market-environment/ | 同上 |
| `competitors/korthos/korthos-profile-2026-07-16.md` | 背景 | keep | reference/market-environment/ | 同上 |

## 7. `docs/strategy/`（1）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `business-positioning-and-roadmap-2026-07.md` | 正本 | keep | decisions | 孤立ツリー解消。「随時書き換える現行文書」としてdecisionsへ |

## 8. `public/images/robots/README.md`（1）

| ファイル | 現ステータス | 処遇 | 移動先 | 根拠・処遇の説明 |
|---|---|---|---|---|
| `public/images/robots/README.md` | 正本 | keep | 現位置 | アセット併設が合理的、移動しない |

---

## Phase 2 集計

| 処遇 | 件数 | 内訳 |
|---|---|---|
| keep（棚移動のみ、内容不変） | 38 | 上表参照 |
| archive | 19 | 済15（compare-and-catalog-ui-improvement-plan-v1.md訂正分を含む）＋split後archive2（launch-readiness／responsive-audit）＋その他 |
| merge | 2 | editorial-methodology-review→style guide／planning README→docs README |
| rewrite | 2 | robot-data-factcheck-impl-plan（Phase C残task化）／tagging.md（Guide言及削除） |
| delete | 1 | ai_implementation_workflow_prompt.md |
| split（要件のみ、実行はPhase4） | 2 | launch-readiness-meta-plan／responsive-audit-2026-06-30（上記mergeまたはarchiveと重複カウントなし、実質はarchive前処理） |

（keep 39 + archive 18 + merge対象1(editorial-methodology-review) + merge対象1(planning README) + rewrite 2 + delete 1 = 62、editorial_style_guide_v1.mdはmerge受け皿として既にkeepでカウント済みのため合計63）

## Phase 2 で見つかった矛盾・重複・古い記述（T2-2、この時点では直さない）

1. **Status自己申告と実態の乖離が構造的に起きている。** `usecase-page-redesign-plan-v1.md`は「Status: 未着手」のまま実装完了。`robot-catalog-fullstack-implementation-plan-v1.md`・`layout-and-data-structure-audit-plan-v1.md`も同様に自己申告が古いまま放置されていた。Phase1で導入する`status: current|plan|reference` frontmatterと、完了時にarchiveへ移す運用がこの再発を防ぐ設計になっている。
2. **正本→背景文書への現役参照が2本、想定より深く食い込んでいた。** `humanoid_media_IA_v1.md` §7は`data-maintenance-checklist-v1.md`から名指しで参照されており、単純archiveはできない（reference棚へのkeepが正しい）。`humanoid_media_build_notes_v1.md`への`30-ui-design.md`の参照は逆に実質不要（内容が薄く同ファイル自身のルールと重複）と判明し、archive可能。同じ「正本から背景への参照」でも中身次第で処遇が割れる。
3. **未消化の指摘・未決事項を持ったまま「完了」扱いにできないファイルが2本。** `launch-readiness-meta-plan-v1.md`（未決事項2件）、`responsive-audit-2026-06-30.md`（H-1等の未修正指摘）。実装計画としては役目を終えていても、中身の一部だけ生きているため、archiveの前に該当箇所を正本側へ転記する一手間が要る。
4. **`compare-and-catalog-ui-improvement-plan-v1.md`は初回判定を誤り、オーナー指摘で訂正した。** `TBD_LABEL`の残存だけを見て「T1未実装」と判断したが、それは計画が意図した設計（enum不明ステータス用に温存）だった。commit履歴まで遡ってmain反映を確認すべきだった。表面的なgrep一致だけで「未実装」と判定するのは危険という教訓。
5. **`editorial-methodology-review-2026-06-24.md`は「未承認草案」を自称しながら`ai/rules/22-article-sourcing.md`から実質正本として参照されていた。** 承認判断を先送りしたまま運用に組み込まれている状態で、今回mergeにより解消する。

## Phase 2 ゲートでオーナーに確認したいこと

- `compare-and-catalog-ui-improvement-plan-v1.md`の扱いはオーナー指摘により解消済み（archive確定）。
- 残りの処遇（archive対象19件・merge対象2件含む）に異論がなければ、Phase 3（移動のみ実行）へ進む。

---

## Phase 3.5（追記）: main合流で新規追加された104ファイルの処理（2026-07-20）

Phase 3完了後、`data/robot-catalog-r01-rollout-20260716`（DATA-R01→R02のロボットデータ整備、PR #3）がmainへマージされた。このブランチをoriginから取り込んだところ、当初の63ファイル一覧には存在しなかった新規md/jsonファイルがdocs配下に104件着地した。分類体系（decisions/plans/reference/archive）が確定した後に生まれた文書群なので、Phase 0〜3の対象外だったが、今回の合流時に一括で処理した。

| 内容 | 件数 | 処遇 | 移動先 |
|---|---|---|---|
| DATA-R01 raw調査・検証・実装manifest（json+md） | 56 | keep（研究成果物として保存） | `docs/decisions/data/research/` |
| DATA-R02 raw調査・決定ログ・実装manifest（json+md） | 40 | keep（研究成果物として保存） | `docs/decisions/data/research/` |
| `robot-data-r02-integration-plan-v1.md` | 1 | keep（Status: active、R02-11未実施のため現役計画） | `docs/plans/` |
| `robot-image-sourcing-research-B1.md`〜`B6.md` | 6 | keep（`robot-image-sourcing-plan-v1.md`の読み取り専用調査成果物） | `docs/plans/`（同計画と同じ棚、フラット配置） |
| （計） | 104 | | |

判定根拠: DATA-R01/R02研究成果物は、`docs/decisions/data/README.md`が「## 全件調査成果物」として一括カタログ化・参照している一次資料群であり、正本ではないが正本(`docs/decisions/data/README.md`)から名指し参照される継続的な監査証跡。archiveではなくdecisions配下の`research/`サブフォルダとして保存した（archiveは「役目を終えた計画」向けで、これは「参照され続ける調査ログ」のため性質が異なる）。

処理内容:
- `docs/decisions/data/README.md`の内容コンフリクトを解消（このブランチの相対パス修正 + origin/mainが追加した調査成果物カタログ節を統合、パスを`research/`サブフォルダ基準に補正）
- 上記104ファイルをgit mvで配置
- 参照先が変わった9箇所（`ai/rules/40-content-rights.md`は自動マージ、`robot-data-r02-integration-plan-v1.md`内の`docs/planning/`・`docs/data/`参照、`robot-image-sourcing-plan-v1.md`内の将来ファイル参照1箇所）を修正
- コード側コメント8箇所（`lib/*.ts`・`data/*.ts`・`components/SelectControl.tsx`）の`docs/planning/`参照も、内容不変のコメント文字列置換のみで修正
- DATA-R01/R02研究ファイル同士の内部相互参照（`docs/data/DATA-R0X-*`形式のまま）は、確定済みの調査ログとして凍結扱いにし、archiveと同じ方針で書き換えなかった。カタログの入口（`docs/decisions/data/README.md`）さえ正しければAIは辿り着ける
- `npm run validate:data`・`npm run build`とも成功を確認

集計更新: 対象ファイルは63 + 104 = 167件（うちPhase 0〜2の精査対象は元の63件のみ。新規104件はPhase 0〜2を経ずに機械的な分類ルール適用のみで配置した）。

---

## Phase 4 完了記録（2026-07-20）

処遇一覧のmerge/rewrite/split対象5件を全て消化した。

| 対象 | 処遇 | 実施内容 |
|---|---|---|
| `editorial-methodology-review-2026-06-24.md` | merge | `editorial_style_guide_v1.md` §1.5「題材選定基準」として統合。重複箇所（読者像・4段構成）は破棄。統合元はarchiveへ、`ai/rules/22-article-sourcing.md`等3箇所の参照先を更新 |
| `docs/decisions/data/tagging.md` | rewrite | `Guide.topics`/`guide-topic`/`use-case-domain`の記述を削除。`lib/tagRegistry.ts`の現行4種（industry/task/region/theme）に合わせて書き換え |
| `robot-data-factcheck-impl-plan-2026-07-01.md` | rewrite | Phase A/B完了を個別データ照合の上で明記。Phase Cは`FC-C-001`/`FC-C-003`完了、`FC-C-002`（scopeStatus）/`FC-C-004`（evidenceLevel）が未実装のまま残ることを明記 |
| `docs/archive/launch-readiness-meta-plan-v1.md` | split→archive（archive自体はPhase3で実施済み） | 未決事項2件を`copyright_and_media_rights_policy_v1.md` §11へ転記 |
| `docs/archive/responsive-audit-2026-06-30.md` | split→archive（archive自体はPhase3で実施済み） | 現行コードで再確認の上、未解決3件（H-1・M-4・M-7）を`responsive-phase-1-static-audit-v1.md` §0.5へ転記。解決済み1件（H-2）も記録 |

`npm run validate:data`・`npm run build`とも各コミット後に成功を確認。
