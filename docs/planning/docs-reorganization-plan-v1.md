# ドキュメント再体系化 実行計画 v1

Status: active（未実装・作業計画）
Created: 2026-07-20
Branch: `docs/md-reorg-20260720`（worktree: `Deploid_toB-docs-reorg`）

## 1. 目的

プロジェクトオーナーが PM として「今何が動いているか」「あの内容はどうなったか」を md を覗くだけで把握できる状態を作る。

現状の問題（2026-07-20 棚卸しで確認済み）:

- アクティブな md が 63 ファイル（archive 済み 68 を除く）あり、全体像を一望する場所がない
- 「入口」文書が並行して複数ある（`README.md` / `ai/rules/20-data.md` / `docs/data/README.md` / `docs/planning/README.md` の「まず読むもの」）
- `docs/planning/README.md` の (a) 正本・現行に、恒久方針（`design_system_v1.md`）と 1 回きりの調査プロンプト（`deployment_sites_research_prompt_2026-06-01.md`）が同居しており、分類軸が非 MECE
- 分類体系に載っていない孤立ツリーがある: `docs/data/`(4)・`docs/superpowers/plans/`(3)・`docs/strategy/`(1)・`docs/market-environment/`(3)
- `docs/planning/README.md` の (a)(b)(c) テーブルは手動更新で、鮮度が保証されない（Last cleaned: 2026-07-01 のまま）

前提:

- 読者は AI エージェントのままで良い。人間（オーナー）は入口 1 枚（PM ダッシュボード）から必要な md へ潜る運用
- ドキュメント管理は Notion 等へ移さず、リポジトリ内 md + git のまま行う
- 本計画の完了後に、データ整理（DB リファクタ）へ移る。データ整理は本計画のスコープ外

## 2. スコープ

対象（アクティブ md 63）:

| 場所 | 件数 |
|---|---|
| `docs/planning/` 直下 | 38 |
| `ai/rules/` | 9 |
| `docs/data/` | 4 |
| ルート（`README.md` / `AGENTS.md` / `CLAUDE.md` / `ai_implementation_workflow_prompt.md`） | 4 |
| `docs/superpowers/plans/` | 3 |
| `docs/market-environment/` | 3 |
| `docs/strategy/` | 1 |
| `public/images/robots/README.md` | 1 |

対象外:

- `docs/planning/archive/` の中身 68 ファイル（既に退避済み。中身は読まない・動かさない）
- `data/*.ts`・`lib/*` などコード側の正本（本計画では触らない）
- 親フォルダ `Humanoid_curation_website/` 直下の旧 md 群（リポジトリ外。必要なら別途）

## 3. 実行フェーズ

方針: 「体系は仮決めして精読しながら直す」「移動と書き換えのコミットを分離する」の 2 点を厳守する。

### Phase 0: 棚卸し台帳の作成

- T0-1: `ai/rules/80-doc-governance.md` を読む（済 2026-07-20）。本再編はこのルールに従う。ルール自体を変える場合は Phase 5 で改訂する
- T0-2: アクティブ全 63 ファイルに 1 行ずつ「目的 / 現ステータス（正本・計画・背景・不明）/ 重複疑いの相手」を付けた台帳 md を作る
  - Files: `docs/planning/docs-reorg-inventory-2026-07-20.md`（新規、作業用。完了後 archive）
  - 精読はしない。冒頭 30 行程度 + 見出し構造で判定する
- 完了条件: 63 ファイル全てが台帳に載り、ステータス不明のものが「不明」として明示されている
- **ゲート: 台帳をオーナーに見せ、全体像への所感と分類軸の違和感を回収してから Phase 1 へ**

### Phase 1: 分類体系の仮決め

- T1-1: フォルダ構成案を確定する。たたき台:
  - `docs/decisions/` — 恒久方針・設計判断（design system、権利ポリシー、データ設計等）
  - `docs/plans/` — 進行中の作業計画。完了したら即 `docs/archive/` へ
  - `docs/reference/` — 仕様・背景資料（tech stack、IA、調査プロンプト等）
  - `docs/archive/` — 済み（現 `docs/planning/archive/` を統合）
  - `ai/rules/` — 現状維持（AI ルーティング。役割が明確なため）
  - ※ 実際の軸は Phase 0 の台帳を見て決める。上記はたたき台であり確定ではない
- T1-2: status frontmatter の仕様を決める（例: `status: active|done|superseded` / `updated: YYYY-MM-DD`）。全 md に付けるか、plans 系だけに付けるかも含めて決める
- T1-3: PM ダッシュボード（人間向け入口 1 枚）の置き場所と構成を決める
- 完了条件: フォルダ構成・frontmatter 仕様・ダッシュボード仕様の 3 点がこの計画書に追記されている
- **ゲート: オーナー承認**

### Phase 2: カテゴリ単位の精読・処遇判定

- T2-1: カテゴリ（Phase 1 の棚）単位で中身を精読し、ファイルごとに処遇を台帳へ記録する:
  - `keep`（そのまま）/ `move`（移動のみ）/ `merge`（統合）/ `split`(分割) / `rewrite`（書き換え）/ `archive`
- T2-2: 精読で見つけた矛盾・重複・古い記述を台帳に記録する（この時点では直さない）
- T2-3: 分類体系が実際の内容と合わない場合は Phase 1 に戻して体系を直す
- 既知の処遇候補（Phase 0 前に判明している分）:
  - `ai_implementation_workflow_prompt.md`（ルート）— 中身は移設済みの案内 11 行のみ。削除候補
  - `editorial-methodology-review-2026-06-24.md` — 未承認ドラフトのまま浮いている。承認して style guide へ反映するか、archive するかの判断が必要
  - `docs/superpowers/plans/` 3 件 — 2026-05 の実装済み計画。archive 候補
  - `docs/planning/README.md` (a) 群の調査プロンプト類 — reference 棚へ移動候補
- 完了条件: 全 63 ファイルに処遇が付き、merge/split/rewrite 対象は「何をどうするか」の 1 行説明がある
- **ゲート: 処遇一覧をオーナー承認**

### Phase 3: 移動・リネームのみ実行

- T3-1: 承認済み処遇のうち `move` / `archive` を実行する。**内容は 1 文字も変えない**
- T3-2: 参照リンクを追従修正する。修正対象の把握コマンド:
  - `rg --no-ignore -l '<旧パス>' ai/ docs/ README.md AGENTS.md CLAUDE.md`
  - 特に `ai/rules/00-index.md` の work-type routing、`CLAUDE.md`、`docs/planning/README.md` はパス直書きが多い
- T3-3: リンク切れ最終確認（`rg` で旧パス残存ゼロを確認）
- コミット粒度: 1 カテゴリの移動 + そのリンク修正 = 1 コミット
- 完了条件: 旧パスへの参照が残っていない。`npm run build` が通る（docs はビルド対象外だが、無関係破壊がないことの確認として）

### Phase 4: 統合・分割・書き換えの実行

- T4-1: 承認済み処遇の `merge` / `split` / `rewrite` を 1 ファイル（1 統合群）= 1 コミットで実行する
- T4-2: merge で消えるファイルは、消える側に案内スタブを残すか完全削除かを処遇一覧の指定に従う
- 完了条件: 処遇一覧の全項目が消化され、台帳のステータスが全て反映済みになっている

### Phase 5: 入口の再構築

- T5-1: PM ダッシュボード作成（Phase 1 で決めた仕様。人間向け入口 1 枚。今動いている計画・最近の決定・棚への案内）
- T5-2: `docs/planning/README.md`（または新体系での後継）を新分類で書き直す
- T5-3: `README.md` / `AGENTS.md` / `CLAUDE.md` / `ai/rules/00-index.md` のポインタを新体系へ更新。執筆フローなど work-type routing に不足していた枝（「記事を書く」）もここで足す
- T5-4: `ai/rules/80-doc-governance.md` を新体系に合わせて改訂する（フォルダ役割・分類クラス・更新順序）
- T5-5: 本計画書と Phase 0 台帳を archive へ移動する
- 完了条件: 新規セッションの AI が `AGENTS.md` → `00-index.md` から全ての現行文書に到達できる。オーナーがダッシュボード 1 枚から状況把握できる

## 4. リスクと軽減策

| リスク | 軽減策 |
|---|---|
| ai/rules がパス直書きでルーティングしており、移動でリンク切れ → AI が迷子 | Phase 3 で `rg` による旧パス残存ゼロ確認を完了条件にする |
| 分類体系が精読後に破綻し、手戻り | Phase 1 は仮決めと明示。Phase 2 に「Phase 1 へ戻す」枝を正規手順として持つ |
| 移動と書き換えが混ざり、git 履歴で内容の増減を追えなくなる | Phase 3（移動のみ）と Phase 4（書き換えのみ）をコミットレベルで分離 |
| main 側チェックアウトに同じ guardrails 変更が未コミットで残っており、マージ時に衝突 | ベースラインとして本ブランチに同内容をコミット済み（44a4010）。マージ時は本ブランチ側を正とする。main 側の未コミット差分はオーナーが破棄可否を判断 |
| 再編中に他ブランチ（robot catalog 系）が docs を触り、コンフリクト | 本計画は docs のみ触る。マージ順はオーナーと相談。長期化させず Phase 3〜5 は短期集中で実行 |
| 「体系化のための体系化」でフォルダ・規約が増えすぎる | 棚は 4 つ以内。frontmatter は最小 2 フィールド。ダッシュボードは 1 枚のみ |

## 5. 検証

- 各 Phase の完了条件（上記）
- Phase 3 以降の各コミット後: `rg --no-ignore -l '<旧パス>'` で残存ゼロ
- 最終: `npm run validate:data` と `npm run build` が通る（docs 変更が無関係破壊をしていないこと）
- 最終: 新規 AI セッションを想定し、`AGENTS.md` からのリンクだけで全現行文書に到達できるかを机上トレース

## 6. 実装しないこと

- `data/*.ts` の構造変更・データ整理（本計画の次のプロジェクト）
- `docs/planning/archive/` 内 68 ファイルの中身の再分類・書き換え（置き場所の統合のみ Phase 1 で判断）
- 記事執筆テンプレート自体の改訂（robot-guide 型強制などは別タスク）
- Notion 等外部ツールへの移行

## 7. Phase 1 決定事項（2026-07-20 確定）

Phase 0 ゲートでオーナーは分類軸の判断を実施者へ委任した（「自分で調査して決めてよい」）。以下は Phase 0 台帳（`docs-reorg-inventory-2026-07-20.md`）の実態に基づいて確定した3点である。

### 7.1 フォルダ構成

台帳の実態は「正本 32 / 計画 8 / 背景 8 / 済 14 / 削除 1」だった。たたき台どおり4棚で過不足なく収まることを確認したため、次の構成を採用する。

```text
docs/
├── README.md      ← 入口1枚（上段 = PMダッシュボード、下段 = 棚マップ。詳細は §7.3）
├── decisions/     ← 恒久方針・現行仕様・運用チェックリスト・継続運用ツール（= 正本）
├── plans/         ← 進行中の作業計画のみ。完了したら即 archive へ
├── reference/     ← 背景・経緯・調査スナップショット。市場環境調査もここに置く
└── archive/       ← 済み（現 docs/planning/archive/ 68 件を統合し、済 14 件を追加）
ai/rules/          ← 現状維持
```

各棚の判定基準は1問で済むようにする。「新しい実装・運用判断で従うべきか」→ Yes なら decisions。「これから実行する作業か」→ Yes なら plans。「過去の経緯・時点スナップショットとして読むか」→ Yes なら reference。どれでもなければ archive。

孤立ツリーの解消: `docs/strategy/` の事業整理文書は「随時書き換える現行文書」なので decisions へ。`docs/market-environment/` は調査スナップショットの蓄積なので reference 配下へツリーごと移動。`docs/data/` の正本2件（README・tagging）は decisions へ統合し、済み2件は archive へ。`docs/superpowers/plans/` は3件とも実装済みのため archive へ移してツリーを畳む。`public/images/robots/README.md` はアセット併設が合理的なので現位置に残す。ルートの `ai_implementation_workflow_prompt.md` は現役参照ゼロを確認済みのため削除する。

継続運用ツール（`robot-factcheck-research-prompt` 等、更新しながら使い回すプロンプト）は「調査の実行手順を定めた現行仕様」として decisions に置く。1回きりで消化済みのプロンプトとの区別はここで付ける。

### 7.2 status frontmatter 仕様

decisions / plans / reference に置く全 md の先頭に、次の2フィールドだけを付ける。

```yaml
---
status: current | plan | reference
updated: YYYY-MM-DD
---
```

`status` は棚と一致させる（棚 = 分類の正、frontmatter は grep 用の写し）。`updated` は内容を実質的に変えたときだけ更新する。plans の文書は任意で `branch:` を3フィールド目に足してよいが、必須は上の2つ。archive 内の文書には遡って付けない（移動時に付いていればそのまま残す）。

この仕様により「今動いている計画」は `rg --no-ignore -l 'status: plan' docs/` で機械的に列挙でき、ダッシュボードの手動更新が漏れても検算できる。

### 7.3 入口（PMダッシュボード）仕様

入口は `docs/README.md` の1枚に集約する。ダッシュボードと棚マップを別ファイルにすると鮮度管理が2箇所になるため、1ファイルの上下2段構成にする。

- 上段「いま動いているもの」: plans 全件の表（計画名 / 一言 / branch / 開始日）。完了した計画はここから消して archive へ移す。この表と `status: plan` の grep 結果が一致することが鮮度の検算になる
- 上段「最近の決定・反映」: decisions の直近更新 5 件程度（日付 + 一言）
- 下段「棚マップ」: 4棚それぞれの役割1行と、decisions の主要正本へのリンク一覧（現 `docs/planning/README.md` の (a) 群に相当）

更新責務は「計画の開始・完了時」と「decisions の改訂時」に該当行を触ることとし、Phase 5 で `80-doc-governance.md` の Update Order に組み込む。AI 向けの入口は従来どおり `AGENTS.md` → `ai/rules/00-index.md` とし、`00-index.md` の Current Source Of Truth 節が `docs/planning/README.md` を指している箇所を `docs/README.md` へ差し替える（Phase 5）。
