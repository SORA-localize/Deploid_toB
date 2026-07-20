# AI向け明文化資料の MECE 再編計画 v1

Last updated: 2026-06-23

## 目的

Deploid を AI で継続的に開発・保守するときに、作業開始時、計画時、実装時、レビュー時、データ更新時に読むべき資料が迷子にならない状態にする。

現在の問題は、共通開発ワークフロー、データ保守ゲート、権利・編集ルール、ドキュメント管理方針、README/CLAUDE 向け案内が複数ファイルに重複していること。特に `ai/rules/10-workflow.md` は汎用の機能開発・修正用プロンプトと `data/*.ts` 専用の保守運用ゲートが同居しており、AI が作業タイプごとの差分を把握しにくい。

この計画では、資料群を以下の観点で MECE に分ける。

- Mutual Exclusive: ひとつのルールの主担当ファイルを1つに決め、README/CLAUDE には重複本文を置かない。
- Collectively Exhaustive: ユーザーの主要ユースケースすべてに、読むべき入口と正本を用意する。

## ユーザーのユースケース

この整理は次の使い方を前提にする。

1. AI セッション開始時に「あの資料見といて」と言えば、入口資料から必要なルールへ辿れる。
2. 新規機能・修正・リファクタの計画時に、既存コード調査、影響範囲、検証方法を外さない。
3. 実装後レビュー時に、バグ、回帰、責務混在、検証不足を確認できる。
4. `data/*.ts` に新規データを入れる、既存データを修正する、削除ではなく archive する、slug を変える、といった保守運用時に、参照すべき型・正本・検証コマンドを判断できる。
5. 画像、ロゴ、引用、記事本文、外部ソースを扱う時に、権利と編集品質のルールを参照できる。
6. 古い planning doc や一時計画を、現行ルールとして誤読しない。

## この計画書自身の扱い

この文書は現行ルールの正本ではなく、未実装の作業計画である。そのため `docs/planning/README.md` では「未実装・作業計画」として扱う。

Phase 4 で planning doc の4分類を正式導入する時は、この文書自身も次のどちらかに再分類する。

- 実行中または未完了なら「未実装・作業計画」に残す。
- 実行完了後なら `docs/planning/archive/` へ移動し、必要な現行ルールだけを `ai/rules/` と正本 docs に反映する。

## 現状の資料分類

### 入口・ルーティング

- `AGENTS.md`
- `ai/rules/00-index.md`

現状でも役割は明確。`docs/` が `.ignore` で隠れるため `ai/rules/` を安定入口にしている判断も妥当。

### 汎用開発ワークフロー

- `ai/rules/10-workflow.md`

現状は §0〜§7 が汎用開発、§8 が Deploid データ保守専用。ここが最大の混線。

### データ保守運用

- `ai/rules/20-data.md`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-docs-mece-cleanup-plan-v1.md`
- `docs/planning/data-ops-hardening-plan-v1.md`

入口、詳細、過去計画が混ざって見える。`20-data.md` は短い入口として良いが、実作業ゲートの本体が `10-workflow.md` §8 にあるため責務が割れている。

### UI・デザイン

- `ai/rules/30-ui-design.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `docs/planning/humanoid_media_build_notes_v1.md`

大枠は分かれている。`30-ui-design.md` は入口、planning docs は正本として機能している。

### コンテンツ・権利

- `ai/rules/40-content-rights.md`
- `docs/planning/copyright_and_media_rights_policy_v1.md`
- `docs/planning/editorial_style_guide_v1.md`
- `public/images/robots/README.md`

大枠は分かれている。データ運用と画像権利が交差するため、両方から参照されるのは許容する。

### ドキュメント管理・アーカイブ

- `ai/rules/90-archive-policy.md`
- `docs/planning/README.md`

方針はあるが、`docs/planning/` 直下には README に載っていない一時計画が残っている。未掲載計画の扱いを棚卸しする必要がある。

### 人間・ツール向け案内

- `README.md`
- `CLAUDE.md`
- `ai_implementation_workflow_prompt.md`

`README.md` と `CLAUDE.md` に共通ルール本文が残っている。`ai_implementation_workflow_prompt.md` は互換リンクとして案内だけでよい。

## 目指す資料体系

### 1. AI セッション入口

主担当:

- `AGENTS.md`
- `ai/rules/00-index.md`

役割:

- 最初に読む場所を示す。
- 作業種別ごとのルーティングを持つ。
- 競合時の優先順位を示す。
- `docs/` 検索時の `--no-ignore` 注意を示す。

置かないもの:

- 個別の実装プロンプト本文。
- データ追加チェックリスト本文。
- UI/権利/編集ポリシーの詳細。

### 2. 汎用開発・修正・レビュー

主担当:

- `ai/rules/10-workflow.md`

対象:

- 新規機能開発。
- バグ修正。
- リファクタ。
- 実装前計画。
- 計画監査。
- 実装後レビュー。
- 検証コマンド特定。

残す内容:

- 現在の §0〜§7。

移す内容:

- 現在の §8 `data/*.ts` 専用ゲートは `ai/rules/21-data-maintenance-workflow.md` へ移動。

### 3. データ保守運用

主担当:

- `ai/rules/20-data.md`
- 新設 `ai/rules/21-data-maintenance-workflow.md`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`

役割分担:

- `20-data.md`: データ作業の短い入口。Must Read と standing rules。
- `21-data-maintenance-workflow.md`: 作業前ゲート。G1〜G11 の実行チェックリスト。
- `docs/data/README.md`: 人間とAIの詳細入口。コレクション一覧、更新/新規判断、素材置き場所。
- `data-maintenance-checklist-v1.md`: コレクション別の追加・更新・公開ゲート。
- `data-architecture-redesign-v1.md`: id/slug、参照、正本管理、CMS移行を見据えた設計。

置かないもの:

- 汎用の新規機能計画プロンプト。
- UIコンポーネント責務の詳細。
- 権利ポリシー本文の重複。

### 4. UI・デザイン

主担当:

- `ai/rules/30-ui-design.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `docs/planning/humanoid_media_build_notes_v1.md`

役割:

- `30-ui-design.md`: UI作業時に読む入口。
- `design_system_v1.md`: visual system と semantic token。
- `ui_architecture_and_development_policy_v1.md`: UI構造、component responsibility、data/UI boundaries。
- `humanoid_media_build_notes_v1.md`: project intent と anti-AI-feel。

### 5. コンテンツ・権利・編集品質

主担当:

- `ai/rules/40-content-rights.md`
- `docs/planning/copyright_and_media_rights_policy_v1.md`
- `docs/planning/editorial_style_guide_v1.md`
- `public/images/robots/README.md`

役割:

- `40-content-rights.md`: 画像、ロゴ、引用、記事本文、出典を扱う時の入口。
- `copyright_and_media_rights_policy_v1.md`: 権利ステータス、引用、メディア利用の正本。
- `editorial_style_guide_v1.md`: 記事本文、文体、NG表現の正本。
- `public/images/robots/README.md`: ロボット写真のスロット、命名、推奨スペック。

### 6. ドキュメント管理

主担当:

- `ai/rules/90-archive-policy.md`
- 新設候補 `ai/rules/80-doc-governance.md`
- `docs/planning/README.md`

役割:

- `90-archive-policy.md`: 古い計画やアーカイブを参照する判断。
- `80-doc-governance.md`: 新しい明文化資料を作る時の置き場所、正本/背景/一時計画の分類、README 登録ルール。
- `docs/planning/README.md`: planning doc の地図。現行正本、背景、未実装計画、archive を分類する。

## 作業タイプ別ルーティング案

| ユースケース | 最初に読む | 次に読む | 詳細正本 |
| --- | --- | --- | --- |
| セッション開始 | `AGENTS.md` | `ai/rules/00-index.md` | 作業種別に応じて分岐 |
| 新規機能計画 | `10-workflow.md` | 必要なら `30-ui-design.md` / `20-data.md` | current code, planning docs |
| バグ修正 | `10-workflow.md` | 影響領域の rule file | current code |
| リファクタ | `10-workflow.md` | 影響領域の rule file | current code, architecture docs |
| 実装後レビュー | `10-workflow.md` | 変更領域の rule file | package scripts, validation |
| UI変更 | `30-ui-design.md` | `10-workflow.md` | design system, UI architecture |
| データ追加 | `20-data.md` | `21-data-maintenance-workflow.md` | docs/data, checklist, data architecture, types |
| データ修正 | `20-data.md` | `21-data-maintenance-workflow.md` | lib/data, validate, registry files |
| slug変更 | `20-data.md` | `21-data-maintenance-workflow.md` | data architecture, checklist |
| レコード削除判断 | `20-data.md` | `21-data-maintenance-workflow.md` | archive/publishStatus policy in checklist |
| 画像・ロゴ追加 | `40-content-rights.md` | `20-data.md` when data changes | rights policy, docs/data, image README |
| 記事本文編集 | `40-content-rights.md` | `20-data.md` when article data changes | editorial guide |
| 古い計画参照 | `90-archive-policy.md` | `docs/planning/README.md` | archive only as background |
| 新しいルール文書作成 | `80-doc-governance.md` | `00-index.md` | docs/planning README |

## 具体的な変更計画

### Phase 1. rules の責務分離

1. `ai/rules/21-data-maintenance-workflow.md` を新設する。
2. `ai/rules/10-workflow.md` §8 を `21-data-maintenance-workflow.md` へ移動する。
3. `10-workflow.md` は汎用開発・修正・レビュー専用にする。
4. `20-data.md` の Data Work Gate を `21-data-maintenance-workflow.md` 参照に更新する。
5. `00-index.md` の Work-Type Routing を更新する。

完了条件:

- `10-workflow.md` に `data/*.ts` 専用ゲート本文が残っていない。
- `20-data.md` からデータ実装ゲートへ迷わず辿れる。
- `rg --no-ignore "10-workflow.md.*§8|10-workflow.md section 8|データ実装" .` で古い導線が残らない。

### Phase 2. README / CLAUDE の薄型化

1. `README.md` は概要、コマンド、環境変数、構成、入口リンクに絞る。
2. `README.md` の規約本文は rules/docs 参照へ置き換える。
3. `CLAUDE.md` は Claude Code 固有の案内だけ残す。
4. `CLAUDE.md` のデータ設計、UI方針、権利ルール、コマンド詳細の重複本文は `AGENTS.md` / `ai/rules/00-index.md` / README 参照に寄せる。

完了条件:

- README/CLAUDE に、`id/slug`、sources、ImageAsset rights、AI-feel 回避などの詳細ルール本文が重複して残らない。
- README は人間がセットアップできる。
- Claude Code は `AGENTS.md` と `ai/rules/` へ誘導される。

### Phase 3. データ資料の導線整理

1. `docs/data/README.md` をデータ保守の詳細入口として維持する。
2. コレクションごとの追加・更新手順は `data-maintenance-checklist-v1.md` に寄せる。
3. id/slug と参照設計は `data-architecture-redesign-v1.md` に寄せる。
4. `docs/data/README.md` から各コレクションの該当 checklist セクションへ辿れるようにする。
5. `data-docs-mece-cleanup-plan-v1.md` と `data-ops-hardening-plan-v1.md` は実装済み/未実装を確認し、完了済みなら archive、未完了なら `docs/planning/README.md` に「未実装計画」として明記する。判定は、各計画の「変更ファイル」「実装方針」「検証/手動確認項目」を1件ずつ現行ファイルと照合し、未反映項目が0なら完了、1件以上残るなら未実装として扱う。

完了条件:

- AIがデータ追加・修正時に `20-data.md` -> `21-data-maintenance-workflow.md` -> `docs/data/README.md` / checklist / architecture の順で読める。
- `data/*.ts` を触る時に、型、参照、タグ、spec keys、labels/display、validate を確認する導線がある。

### Phase 4. planning doc の棚卸し

1. `docs/planning/README.md` に載っていない直下 `.md` をすべて分類する。
2. 分類は以下の4つに固定する。
   - 正本・現行
   - 未実装・作業計画
   - 参照・背景
   - archive 移動対象
3. `ai/rules/00-index.md` の `docs/planning/README.md` 参照文言を、2分類前提から4分類前提へ更新する。
4. 完了済みの一時計画は `docs/planning/archive/` へ移動する。
5. 残す計画は README に理由付きで登録する。
6. この計画書自身も「未実装・作業計画」または archive へ再分類し、正本枠に置かない。

現時点で未掲載の候補:

- `article-tab-layout-data-plan-v1.md`
- `data-docs-mece-cleanup-plan-v1.md`
- `data-ops-hardening-plan-v1.md`
- `filter-count-display-plan-v1.md`
- `home-article-scroll-plan-v1.md`
- `home-mobile-ui-plan-v1.md`
- `nav-transition-performance-fix-plan-v1.md`
- `responsive-design-implementation-plan.md`
- `robots-csv-publish-and-sort-plan-v1.md`
- `seo-hub-prerender-plan-v1.md`

完了条件:

- `docs/planning/` 直下に README 未掲載の `.md` がない。
- `ai/rules/00-index.md` が4分類後の planning README を正しく案内している。
- archive は背景参照であり、現行判断には使わないことが明確。

### Phase 5. doc governance の明文化

1. `ai/rules/80-doc-governance.md` を新設する。
2. `90-archive-policy.md` は archive 判断に集中させ、`80-doc-governance.md` から参照する。
3. 新規ルール文書、計画書、背景資料、archive の置き場所を明記する。
4. ルール変更時の更新順を明記する。
5. 「長い詳細は正本 doc、rules は入口と guardrails」という方針を明記する。

完了条件:

- 今後 plan doc を作った時に、どこへ置き、README にどう登録し、完了後どう archive するかが決まっている。

## 変更対象ファイル

新規:

- `ai/rules/21-data-maintenance-workflow.md`
- `ai/rules/80-doc-governance.md`

更新:

- `ai/rules/00-index.md`
- `ai/rules/10-workflow.md`
- `ai/rules/20-data.md`
- `ai/rules/90-archive-policy.md` または新設 `80-doc-governance.md` との役割整理
- `README.md`
- `CLAUDE.md`
- `docs/data/README.md`
- `docs/planning/README.md`

`ai/rules/00-index.md` は Phase 1 の work-type routing 更新だけでなく、Phase 4 の planning doc 4分類導入に合わせた source-of-truth 文言更新も対象にする。

棚卸し対象:

- `docs/planning/*.md`
- `docs/planning/archive/*.md` は移動先としてのみ確認。本文編集は原則しない。

## 変更しないもの

- `data/*.ts`
- `lib/*.ts`
- UIコンポーネント
- package scripts
- 既存の設計正本本文。ただしリンクや役割説明の最小修正は行う。

## 検証方法

ドキュメント整理なので、主な検証はリンク、古い参照、分類漏れの確認にする。

```bash
rg --no-ignore "10-workflow.md.*§8|10-workflow.md section 8|データ実装" .
rg --no-ignore "CLAUDE.md|README.md|ai/rules|docs/data|docs/planning" AGENTS.md README.md CLAUDE.md ai/rules docs/data docs/planning/README.md
find docs/planning -maxdepth 1 -type f -name "*.md" -exec basename {} \; | sort
npm run validate:data
npm run build
git diff --check
```

`npm run validate:data` と `npm run build` はコードを触らない場合でも必須ではない。ただし README/CLAUDE のコマンド説明や data workflow の参照を変えた場合は、現行コマンドと矛盾していないか確認するため実行候補にする。

## 手動確認チェックリスト

- セッション開始時に `AGENTS.md` -> `00-index.md` で作業種別を選べる。
- 計画だけ作る時に `10-workflow.md` を読めば、データ専用ゲートに引きずられない。
- データを新規追加・修正する時に `20-data.md` -> `21-data-maintenance-workflow.md` で、型、id/slug、sources、tags/specs、画像権利、validate を確認できる。
- UI変更時に `30-ui-design.md` から design docs へ辿れる。
- 画像・引用・記事本文を扱う時に `40-content-rights.md` から rights/editorial docs へ辿れる。
- README/CLAUDE は入口として機能し、共通ルールの重複正本になっていない。
- `docs/planning/README.md` に未分類の現行計画が残っていない。

## MECE 再確認

### Mutual Exclusive の確認

| 領域 | 主担当 | 重複を許す範囲 | 判定 |
| --- | --- | --- | --- |
| 入口・優先順位 | `AGENTS.md`, `00-index.md` | README/CLAUDE からのリンク | OK |
| 汎用開発計画 | `10-workflow.md` | 各領域 rule から参照 | OK |
| データ保守ゲート | `21-data-maintenance-workflow.md` | `20-data.md` の短い要約 | OK |
| データ詳細運用 | `docs/data/README.md`, checklist, architecture | `21-data-maintenance-workflow.md` の実行項目 | OK |
| UI設計 | `30-ui-design.md`, design docs | `10-workflow.md` の一般UI確認項目 | OK |
| 権利・編集 | `40-content-rights.md`, rights/editorial docs | data/image 作業からの参照 | OK |
| 古い計画の扱い | `90-archive-policy.md`, planning README | `80-doc-governance.md` から参照 | OK |
| 新規文書管理 | `80-doc-governance.md` | planning README の分類表 | OK |

重複は「入口の短い要約」と「詳細正本へのリンク」だけに限定する。本文の詳細ルールは1か所に寄せるため、Mutual Exclusive は満たせる。

### Collectively Exhaustive の確認

| ユースケース | 対応資料 | 判定 |
| --- | --- | --- |
| AIセッション開始 | `AGENTS.md`, `00-index.md` | OK |
| 新規機能計画 | `10-workflow.md` | OK |
| 修正・リファクタ | `10-workflow.md` | OK |
| 実装後レビュー | `10-workflow.md` | OK |
| UI変更 | `30-ui-design.md` + design docs | OK |
| データ新規追加 | `20-data.md` + `21-data-maintenance-workflow.md` + data docs | OK |
| データ修正 | `20-data.md` + `21-data-maintenance-workflow.md` + data docs | OK |
| データ削除判断 | `21-data-maintenance-workflow.md` + checklist の archive/publishStatus 方針 | 条件付きOK。checklist 側で削除禁止/archived 化が十分か確認する |
| 画像・権利 | `40-content-rights.md` + rights docs | OK |
| 記事本文 | `40-content-rights.md` + editorial guide | OK |
| 古い計画参照 | `90-archive-policy.md` | OK |
| 新規文書作成 | `80-doc-governance.md` | OK |

不足しやすいのは「データ削除判断」と「新規文書作成」。前者は data checklist に archived/superseded の判断を明記し、後者は `80-doc-governance.md` を新設すれば埋まる。

この文書自身についても、現時点では「未実装・作業計画」に属するため、Phase 4 実行時に正本枠へ残さないことを再確認する。

## この計画で本当に管理しやすくなるか

結論: なる。ただし `10-workflow.md` から data 専用ゲートを移動するだけでは不十分で、README/CLAUDE の薄型化と planning doc の棚卸しまで実施する必要がある。

理由:

- AI セッション開始時の入口は `AGENTS.md` と `00-index.md` に固定される。
- 計画・レビューは `10-workflow.md` に固定される。
- データ追加・修正は `20-data.md` と `21-data-maintenance-workflow.md` に固定される。
- 画像・記事・権利は `40-content-rights.md` に固定される。
- 古い資料を現行ルールとして誤読する問題は `90-archive-policy.md` と planning README の棚卸しで抑えられる。

残リスク:

- `docs/planning/` 直下の既存未分類計画が多いため、棚卸しを後回しにすると再び混乱する。
- `docs/data/README.md` と `21-data-maintenance-workflow.md` の粒度が近くなりすぎる可能性がある。`21` は実行ゲート、`docs/data/README` は詳細入口、という役割を守る。
- README/CLAUDE を薄くしすぎると人間向けセットアップ情報が減る。README には commands/env/structure は残す。

## 実施順序

推奨順:

1. Phase 1: `10-workflow.md` と data workflow を分離する。
2. Phase 2: `00-index.md`, `20-data.md`, 古い参照を更新する。
3. Phase 3: README/CLAUDE を薄型化する。
4. Phase 4: planning README と未分類計画を棚卸しする。
5. Phase 5: `80-doc-governance.md` を新設し、今後の文書管理ルールを固定する。

一度に全部実装する場合でも、コミットやレビュー単位は Phase ごとに分けるのがよい。
