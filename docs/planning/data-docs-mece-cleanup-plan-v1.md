# データ取り扱い md の MECE 再編計画 v1

Last updated: 2026-06-14

## 目的

**運用の正本ドキュメント集合を MECE に整える**。旧2本は「重複を消す」のではなく、正本集合から外して非正本の参照層に明示分離することで重複混乱を解く（重複記述自体は参照用に残す＝ユーザー判断）。中心はドキュメント整理だが、**deployment の出典必須化（`validate.ts` 1行）だけはコード変更を含む**。

- **ME 崩れ**：旧2本（`humanoid_data_management_guide_v1.md` / `humanoid_data_model_policy_v1.md`）が現行（`docs/data/README.md` / `data-maintenance-checklist-v1.md` / `data-architecture-redesign-v1.md`）と内容重複しつつ、`planning/README.md` の「現在残している設計文書（＝現行）」に同居している。
- **CE 崩れ**：`data-maintenance-checklist-v1.md` の追加手順が robot / manufacturer / article の3種のみ。`guides` / `useCases` / `deployments` / `articlePlacements` の追加・更新手順が空白。

## ユーザー確定事項（2026-06-14）

- **deployment の `sources` は必須にする**。文書明記に留めず `validate.ts` で error 強制する。
  - 既存8件はすべて `sources` 記入済み・空配列なしを確認済み → 必須化しても build は全件通る（破壊なし）。
- **旧2本（v1）は参照価値があるため archive へ退避しない**。現行（正本）とは別の「参照・背景（旧／非正本）」層として `docs/planning/` に残し、`planning/README.md` で**役割を明確に分離**して ME を解消する（＝場所ではなくラベルで正本と背景を分ける）。

## 調査済みファイル

- `docs/planning/README.md` / `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/humanoid_data_management_guide_v1.md`
- `docs/planning/humanoid_data_model_policy_v1.md`
- `docs/planning/copyright_and_media_rights_policy_v1.md` / `docs/data/tagging.md`
- `data/types.ts`（Guide / UseCase / DeploymentSite / ArticlePlacement）
- `lib/validate.ts`（4コレクションの検証規則）
- `CLAUDE.md`

## 調査結果（事実ベース）

### ME 側：旧2本の状態と参照

- 両ファイルとも**自身で旧と明示**：
  - `humanoid_data_model_policy_v1.md`：「本書は再設計前の方針を含む旧ガイド。現行の正本は `data/types.ts` と `data-architecture-redesign-v1.md`」
  - `humanoid_data_management_guide_v1.md`：checklist が「旧ガイド（本書と設計書の確定後に整合更新）」と注記。
- インバウンド参照（archive 外）は **4ファイル5箇所**：
  - `CLAUDE.md:27` → management_guide
  - `docs/planning/README.md:40,41` → 両方
  - `docs/planning/data-maintenance-checklist-v1.md:171` → management_guide
  - `docs/planning/data-architecture-redesign-v1.md:9,245` → 両方（「上書きせず上位に立つ再設計提案」「実装フェーズで更新」）

### CE 側：`validate.ts` が各コレクションに課す検証（公開手順の根拠）

| コレクション | BaseRecord | validate が課す検証 | 型上の主な必須 |
|---|---|---|---|
| **Guide** | ○ | `updatedAt` 日付 / `topics`（guide-topic 登録タグ）/ `relatedRobotIds`→robots / `relatedUseCaseIds`→useCases / **guide↔useCase 双方向対称** | title, description, stage, order, topics, targetReaders, relatedRobotIds, relatedUseCaseIds |
| **UseCase** | ○ | `updatedAt` / `industryTags`・`taskTags`（登録タグ）/ `candidateRobotIds`→robots / `relatedGuideIds`→guides / **双方向対称** | title, maturityLevel, buyerReadiness, environment, requiredCapabilities, atAGlance{3}, overview, **whyItMatters**, capabilityNotes, environmentRequirements, whyHardToday, japanDeploymentConditions, candidateRobotIds, relatedGuideIds |
| **DeploymentSite** | ○ | `manufacturerId`→manufacturers / `robotId`→robots（任意）/ `updatedAt`（※本計画で `sources` 必須を追加） | manufacturerId, customer, country, location{lat,lng}, status |
| **ArticlePlacement** | ✗（独自型） | `articleId`→articles / `order` 一意（surface:slot 内）/ article 一意（surface:slot 内）/ `kind:'sponsored'`→`sponsor.name` 必須 / `sponsor.url` 形式 | surface, slot, articleId, order |

### 出典（sources）強制の実態（重要・collectionごとに異なる）

`checkRequiredSources`（既定 `requireNonEmpty: true`）の呼び出し有無は collection で割れている。checklist にはこの**実態どおり**書く（手動を自動と誤記しない）。

| collection | sources の validate 強制 |
|---|---|
| robot / manufacturer | **常時必須**（draft でも error） |
| article | **published かつ非 sample のとき必須** |
| **deployment** | 現状**未強制** → 本計画で**常時必須**に変更（§3） |
| **guide / useCase** | **未強制**（BaseRecord で `sources` 欄はあるが validate は呼ばない）。→ checklist では「出典は手動推奨」と明記。必須化は本計画スコープ外（必要なら別途判断） |

### 公開ゲートの実態（F 節の正確な意味）

`validate.ts` に**汎用の publish-gate（公開時のみ必須フィールド検査）は無い**。必須フィールドは **TypeScript 型で強制**され、欠落は `tsc` / build が落とす。validate が担うのは参照整合・タグ登録・日付・出典・画像権利・鮮度・順序網羅・guide↔useCase 双方向対称。
→ checklist F に Guide/UseCase を足すときは「**型必須（欠落で build 失敗）＋ validate（参照・タグ・対称）**」と表現し、「validate の公開ゲート」とは書かない。

## 方針

### 1. ME 解消 — 旧2本を「参照・背景」層に再分類（場所は維持）

archive へは移さず、`docs/planning/` に残したまま**役割を正本と分離**して重複混乱を解く。

- `planning/README.md` を再構成：「現在残している設計文書」を **(a) 正本（現行）** と **(b) 参照・背景（旧／非正本）** の2グループに分ける。
  - 旧2本（`humanoid_data_management_guide_v1.md` / `humanoid_data_model_policy_v1.md`）は (b) に移し、「背景・経緯の参照用。運用の正本は data/README・checklist・data-architecture」と1行で明記。
- 旧2本の冒頭バナーを統一（model_policy には既に「旧ガイド」注記あり。management_guide にも同等の「※本書は背景説明。運用の正本は…」バナーを追記）。
- 現行に無い**生きた記述**（コレクションの役割・出典の背景など）が旧2本にあれば、現行（`data/README` か checklist）へ1回だけ吸収。重複記述はそのまま（参照用に残す）。
- インバウンド参照を「参照・背景」扱いに揃え、**「後で整合更新する」という宙ぶらりんの約束を消す**（参照用に残す＝整合更新はしない、という決定に合わせる）：
  - `CLAUDE.md:27` … 行を `- \`…humanoid_data_management_guide_v1.md\` —（背景・非正本）データ運用の経緯。運用の正本は \`docs/data/README.md\` と \`data-maintenance-checklist-v1.md\`` に置換（必読の正本リストから背景へ降格。削除はしない）。
  - `planning/README.md:40,41` … (b)「参照・背景（旧）」グループへ移動（削除しない）。
  - `data-maintenance-checklist-v1.md:171` … 「（本書と設計書の確定後に整合更新）」→「（参照用。整合更新はしない。正本は本書と data-architecture）」へ。
  - `data-architecture-redesign-v1.md:245` … 「該当記述は実装フェーズで更新する」→「該当記述は参照用として残す（整合更新はしない）」へ。9行目の関係説明は正確なので維持。

### 2. CE 解消 — checklist に4コレクションを追記

`data-maintenance-checklist-v1.md` に、上表の `validate.ts` 事実に基づく最小手順を追加する。

- **新セクション**（既存 A〜K は採番を変えず、末尾 K の後に追加してリンク churn を避ける）：
  - `L. ガイド（guides）追加 / 更新`
  - `M. ユースケース（useCases）追加 / 更新`
  - `N. 導入事例（deployments）追加 / 更新`
  - `O. 記事掲載枠（articlePlacements）追加 / 更新`
- 各セクションは「**A/B/C 手順に準拠（id 発番・draft 起票・build ゲート）＋固有の制約のみ**」で冗長化を避ける。各項目に「自動（validate/型）」「手動」を上表の実態どおり付す。
  - Guide / UseCase：**guide↔useCase 双方向対称**（relatedGuideIds ↔ relatedUseCaseIds 片方だけだと build 失敗＝非自明な罠）と登録タグ（自動）を明記。`whyItMatters` 等の必須は**型必須（欠落で build 失敗）**として書く。出典は**手動推奨**（validate 未強制）と明記。
  - Deployment：`manufacturerId`/`robotId` は id 参照（自動）、`location{lat,lng}`・`customer`・`status` は型必須、**出典は必須（§3 で validate 強制）**。
  - ArticlePlacement：BaseRecord でない（publishStatus/sources なし）。`surface:slot:order` 一意・`articleId` 参照・`sponsored`→`sponsor.name`（自動）を明記。加えて**掲載対象は published 記事にする**（validate は存在のみ確認し、draft 記事への枠付けは検出しない＝手動）。
- **公開ゲート（F）** に Guide / UseCase の必須項目を追加するが、見出しは「型必須＋ validate（参照・タグ・対称）」と正確に表現する（validate に汎用 publish-gate は無いため。上記「公開ゲートの実態」参照）。deployment は型必須＋出典必須、articlePlacement は枠設定で F 対象外と明記。
- `docs/data/README.md` の「データの種類」一覧から checklist の該当セクションへ相互リンクを張る（入口→手順の導線を全コレクションで揃える）。

### 3. deployment の sources を必須化（validate 強制）

- `lib/validate.ts` の deployment ループ（現行 §`for (const d of deployments)`、367行付近）に既存ヘルパを1行追加：
  ```ts
  checkRequiredSources('deployment', d.id, d.sources);
  ```
  - `checkRequiredSources`（`validate.ts:79`）は robot/manufacturer/article で使用中のものを**そのまま流用**（新規ロジックなし＝DRY）。
- 既存8件は全件 sources 記入済みのため、追加しても `npm run build` は通る（事前確認済み）。
- checklist N（導入事例）に「出典は必須（validate error で強制）」と明記し、文書とコードを一致させる。

## 変更ファイル

- `lib/validate.ts`（deployment ループに `checkRequiredSources('deployment', d.id, d.sources)` 1行追加）
- `docs/planning/data-maintenance-checklist-v1.md`（L〜O 追記・F を「型必須＋validate」で拡張・171行の「整合更新」約束を撤回）
- `docs/data/README.md`（各コレクション→手順への相互リンク）
- `docs/planning/README.md`（「正本（現行）」と「参照・背景（旧）」の2グループに再構成）
- `docs/planning/humanoid_data_management_guide_v1.md`（冒頭に「背景・非正本」バナー追記）
- `docs/planning/data-architecture-redesign-v1.md`（245行の「実装フェーズで更新する」→「参照用として残す」へ。9行の関係説明は維持）
- `CLAUDE.md`（27行を「（背景・非正本）…正本は data/README と checklist」へ置換。必読リストから降格・削除はしない）

## 変更しないファイル

- `data/*.ts`（deployment データは既に sources 充足。データ追記不要）
- `humanoid_data_model_policy_v1.md`（既に「旧ガイド」注記あり。場所も維持・本文編集なし）
- `copyright_and_media_rights_policy_v1.md` / `tagging.md`（既に MECE に機能しており触らない）
- `lib/validate.ts` の `checkRequiredSources` 本体（流用のみ・改変なし）
- guide / useCase の出典強制（今回は変更しない。手動推奨の明記に留める）

## 影響範囲

- **コード変更は `validate.ts` 1行のみ**（deployment 出典必須）。既存データは全件適合済みのため build は通る。
- 残りはドキュメント整理で、コード・データ・公開挙動に影響なし。
- 旧2本は場所を動かさない（`git mv` なし）ため、既存のインバウンドリンクはパス切れしない。

## リスクと軽減策

| リスク | 軽減策 |
| --- | --- |
| deployment 出典必須化で将来の新規追加が build 失敗 | これは意図した安全側挙動。checklist N に「出典必須」と明記し、追加時に気づける |
| 旧2本を残すと ME（重複）が完全には消えない | 正本/参照をラベルで明確分離。重複は「参照用の背景」として許容（正本の操作手順は checklist に一本化） |
| 旧2本の背景情報が埋もれる | 場所は維持し参照可能なまま。生きた記述は現行へ1回だけ吸収 |
| checklist が冗長化 | 薄いコレクションは「A/B/C 準拠＋固有のみ」で最小記述 |

## 検証コマンド

```bash
npx tsc --noEmit        # validate.ts の型（checkRequiredSources の引数整合）
npm run validate:data   # deployment 出典必須が既存8件で全件通るか（強制直後の回帰）
npm run build           # validate を前段実行＋SSG
git diff --check        # 空白エラー
```

ドキュメントのみの変更でも、`validate.ts` を1行触るため tsc / validate / build を必ず通す。

## 手動確認項目

- `planning/README.md` で「正本（現行）」と「参照・背景（旧）」が一目で分かる
- 旧2本の冒頭に「非正本・背景」バナーがあり、正本への導線が書かれている
- `data-maintenance-checklist-v1.md` の目次に robot/manufacturer/article ＋ guides/useCases/deployments/articlePlacements が並ぶ
- `data/README.md` の各コレクション行から該当手順セクションへ飛べる
- deployment 新規追加時に sources 未記入だと build が落ちる（必須化の確認）

## 実装しないこと

- データモデルの再設計・型変更
- `validate.ts` の deployment 出典必須化**以外**のコード変更（guide/useCase の出典強制も今回はしない）
- 旧2本の archive への移動（参照価値ありのため場所を維持）
- archive 内の既存履歴文書の編集

## 自己監査の反映（v1.1）

ワークフロー §1.5 に従い計画を自己監査し、`validate.ts` / 各 doc を実コードで突合した。反映した補正：

1. **出典強制の実態が collection で割れている** — guide/useCase は `checkRequiredSources` 未呼び出し（未強制）。checklist で「出典必須」と一律に書くと手動を自動と誤記する。→ 「出典強制の実態」表を追加し、collection ごとに正確化。
2. **validate に汎用 publish-gate は無い** — 必須フィールドは型（tsc）強制。checklist F を「型必須＋validate」と正確化。
3. **宙ぶらりんの「後で整合更新」約束** — `checklist:171` と `data-architecture:245` が旧guideの整合更新を予告。「参照用に残す（整合更新しない）」決定と矛盾するため、両行の約束を撤回する編集を変更対象に追加。
4. **CLAUDE.md の変更を具体化** — 「背景 or 現行リンク」の両論併記をやめ、「（背景・非正本）…正本は data/README と checklist」への置換に確定。
5. **`checkRequiredSources` 既定挙動を確認** — `requireNonEmpty` 既定 true。deployment への1行追加で意図どおり error 強制される。
6. **検証に `tsc --noEmit` を追加** — validate.ts を触るため。

反映しなかった項目（理由）：
- guide/useCase の出典必須化：ユーザー指示は deployment のみ。MECE 観点の指摘だが scope 外。checklist に「手動推奨」と明記し、将来の別判断に残す。
- 旧2本の重複記述そのものの削除：ユーザーが参照価値ありと判断。正本/参照のラベル分離で対応し、本文重複は許容。
