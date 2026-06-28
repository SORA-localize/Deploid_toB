# UseCase Publication Quality Gate Plan v1

Status: completed/archived plan
Created: 2026-06-28
Completed: 2026-06-28
Scope: `/use-cases` の公開候補、根拠表示、既存 UseCase データ再判定

この文書は、`/use-cases` を「用途から探す逆引き」として成立させるための実装計画です。
実装判断の正本ではありません。実装時は現行コード、`data/types.ts`、`lib/validate.ts`、`docs/data/README.md`、`docs/planning/data-maintenance-checklist-v1.md`、`docs/planning/data-architecture-redesign-v1.md` を優先します。

## 0. 計画策定時に読んだ明文化ファイル

計画策定ルール、docs 管理ルール、データ運用ルールとして以下を確認した。

- `AGENTS.md`
- `ai/rules/00-index.md`
- `ai/rules/10-workflow.md`
- `ai/rules/20-data.md`
- `ai/rules/21-data-maintenance-workflow.md`
- `ai/rules/80-doc-governance.md`
- `docs/planning/README.md`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/usecase-evidence-model-refactor-plan-v1.md`
- `data/types.ts`
- `lib/validate.ts`
- `components/CandidateRobotList.tsx`
- `lib/labels.ts`

計画作成で従う注意点:

- 既存コードと正本 docs を先に読む。
- 文書だけの理想論にせず、現行の型、validator、UI 表示と照合する。
- `task ID`、`Files`、問題、変更内容、完了条件、検証方法を書く。
- 1 task は 1 commit にできる粒度にする。
- 同じファイルを触る task、docs と validate の整合、data 変更と validator 強化の順序制約を明示する。
- 構造改善、表示変更、データ整理、外部ソース調査を同じ task に混ぜない。
- 「実装しないこと」を書き、計画外の膨張を止める。
- 実行できない検証を実行済みのように書かない。

## 1. 現状

### 1.1 すでに改善済みの点

`UseCaseCandidateRobot` は現在、以下の根拠フィールドを持つ。

- `fit`
- `basis`
- `evidenceDeploymentIds`
- `evidenceSourceUrls`
- `reason`

`lib/validate.ts` も以下をすでに検証している。

- published UseCase の `sources` 非空
- published UseCase の `candidateRobots` 非空
- candidate `reason` 非空
- `strong` は `basis: 'deployment'` と `evidenceDeploymentIds` 必須
- `strong` の deployment は published、同じ `robotId`、同じ `useCase.id` を含む必要がある
- `possible + basis: 'deployment'` は error
- `adjacent-deployment` は `evidenceDeploymentIds` 必須
- `official-use-case` / `product-capability` / `market-signal` は `evidenceSourceUrls` 必須
- published UseCase が未公開 deployment を evidence に使うと error

### 1.2 まだ残っている問題

現状の問題は「根拠フィールドがないこと」ではない。
問題は、published UseCase に `product-capability` だけの候補が残り得ることと、それが公開 UI で「候補ロボット」として見えること。

具体的には:

- `product-capability` は「製品ページ上の能力が近い」根拠であり、「その用途に向いている」根拠としては弱い。
- `market-signal` は市場投入や実証意向のシグナルであり、特定用途の候補根拠としては弱い。
- `editorial-watch` は調査待ちであり、公開候補として表示すべきではない。
- `components/CandidateRobotList.tsx` は `fit` と `reason` だけを表示し、`basis` を表示していない。
- `lib/labels.ts` の `possible: '根拠あり'` は、公開面では根拠の種類を曖昧にしすぎる。
- `npm run validate:data` が通っても、source 本文が UseCase 本文や候補理由の主張を支えているかまでは機械検証できない。

## 2. 目的

`/use-cases` を、以下の性質を持つページにする。

- 用途からロボットを逆引きできる。
- 公開候補は、実導入、公式用途、または隣接実証で説明できるものに限定する。
- 製品能力が近いだけのロボットを、公開候補として推薦のように見せない。
- 根拠が薄い UseCase は、弱い候補を並べて公開するのではなく `draft` に戻す。
- 既存の `candidateRobots[].basis` を正本にし、追加フィールドを増やしすぎない。

## 3. 非目的

今回やらないこと:

- `Source.id` の全コレクション移行
- claim table の新設
- candidate ごとの長い claim / quote / excerpt フィールド追加
- published 用 candidate と internal 用 candidate の二重配列化
- CMS 移行
- `/guides` 全体の再設計
- Robot / Manufacturer / Article 全体の source 再設計
- UI に大きな「参考候補」枠を追加して情報量を増やすこと

理由:

- 現在すでに `basis` と `evidence*` があるため、まず運用意味と validator を強くする方が小さい。
- claim table は意味論の追跡には強いが、初回の公開品質改善としては情報量と運用負荷が大きい。
- public/internal candidate を分けると、同じ候補が二重管理になりやすい。

## 4. 基本設計

### 4.1 `basis` を公開可否の正本にする

published UseCase の `candidateRobots[]` に残してよい `basis` は以下に限定する。

| basis | 公開可否 | 意味 |
| --- | --- | --- |
| `deployment` | 可 | 同じ robotId / useCaseId の published deployment がある |
| `official-use-case` | 可 | 公式 source が当該用途または業務領域を明示している |
| `adjacent-deployment` | 可 | 前世代機、同系統機、または近接用途の published deployment がある |
| `product-capability` | 不可 | 製品能力は近いが、用途明示または導入事例ではない |
| `market-signal` | 不可 | 市場投入、開発、実証意向のシグナルに留まる |
| `editorial-watch` | 不可 | 調査待ち、編集上の監視対象 |

`product-capability` / `market-signal` / `editorial-watch` は型から消さない。
draft UseCase、調査途中データ、将来記事化のメモとして使えるため。
ただし published UseCase には残さない。

### 4.2 public-grade candidate の定義

public-grade candidate とは、published UseCase の候補欄に表示してよい candidate のこと。

条件:

- `basis` が `deployment` / `official-use-case` / `adjacent-deployment` のいずれか。
- `reason` が空でない。
- `basis: 'deployment'` の場合、matching published deployment を `evidenceDeploymentIds` で明示する。
- `basis: 'adjacent-deployment'` の場合、published deployment を `evidenceDeploymentIds` で明示する。
- `basis: 'adjacent-deployment'` の場合、`reason` で隣接根拠の種類を明示し、直接導入のように見せない。
- `basis: 'official-use-case'` の場合、公式 source URL を `evidenceSourceUrls` で明示し、その URL を `useCase.sources` にも載せる。

### 4.3 published UseCase の公開条件

published UseCase は以下を満たす。

- `sources.length > 0`
- `candidateRobots.length > 0`
- `candidateRobots[]` の全件が public-grade candidate
- 本文が source / deployment より強いことを言っていない
- `relatedGuideIds` と guide 側 `relatedUseCaseIds` の双方向整合がある

根拠が薄く public-grade candidate を1件も残せない場合、UseCase は `draft` に戻す。

## 5. 実装方針

### 5.1 新しい大型データモデルは作らない

既存の `candidateRobots[].basis` と `evidenceDeploymentIds` / `evidenceSourceUrls` を使う。
追加する場合も、公開可否判定と表示ラベルの helper に限定する。

### 5.2 公開可否ロジックは1箇所に寄せる

`lib/useCaseEvidence.ts` を新設し、以下を置く。

- `publicUseCaseCandidateBases`
- `isPublicUseCaseCandidateBasis(basis)`
- `candidateEvidenceBasisLabels`

目的:

- validator と UI が別々に `basis` の意味を直書きしない。
- `lib/labels.ts` の `candidateFitLabels` と混同しない。
- 将来 `public-grade` の基準を変えるとき、変更箇所を減らす。

過剰実装回避:

- source 本文の claim 判定は helper に入れない。
- route や data fetch は helper に入れない。
- UI コンポーネント用の複雑な view model は作らない。

### 5.3 実行時の安全策

この計画は `main` では直接進めず、作業ブランチで進める。

- 推奨ブランチ: `feat/usecase-publication-quality-gate`
- `main` の履歴整理や rebase はこの計画の範囲外。
- 既存の未コミット差分は戻さず、ブランチ上で作業する。
- UCP-001 を最初の commit にする。
- UCP-020 は一括 commit にせず、UseCase 単位または「published 維持」「draft 化」「関連参照整理」に分けられる場合は分ける。
- 各 data 変更 commit 前に `npm run validate:data` を通す。
- 外部 URL 確認が network sandbox で失敗した場合だけ、承認を得て再実行する。

### 5.4 実装前に固定する追加決定

- UCP-010 は独立した永続ドキュメントを増やさない。監査結果は UCP-020 の commit body と最終報告に、UseCase ごとの判断として残す。
- `official-use-case` は、原則としてメーカー、ロボット提供元、導入先、研究機関などの公式 source が当該用途または業務領域を明示している場合だけ使う。信頼できる報道だけでは `official-use-case` に昇格しない。
- 報道だけで用途が示されている候補は、この計画では public-grade candidate にしない。必要なら後続計画で別の `basis` 追加を検討する。
- `adjacent-deployment` を使う場合、`reason` に「何が隣接なのか」を必ず書く。例: 前世代機、同系統機、同じ顧客工程、近接タスク。直接導入のように読める文言にしない。
- `retail-shelf-stocking` は現状 draft のため、この計画では published 復帰させない。公開復帰は direct source または deployment を確認した後の別 task とする。
- 実装完了後、この計画書を `active/unimplemented plan` のまま残さない。standing docs へ反映後、archive 移動または README 上の分類変更を行う。

## 6. Task Plan

### UCP-001: 計画文書の登録

Files:

- `docs/planning/usecase-publication-quality-gate-plan-v1.md`
- `docs/planning/README.md`

問題:

- `/use-cases` の後続方針が会話上にしかなく、実装AIが再利用できない。

変更内容:

- 本計画書を追加する。
- `docs/planning/README.md` の `(c) 未実装・作業計画` に本計画書を登録する。

完了条件:

- 本計画書が `docs/planning/README.md` から発見できる。

検証方法:

- `rg -n "usecase-publication-quality-gate-plan" docs/planning/README.md docs/planning/usecase-publication-quality-gate-plan-v1.md`

### UCP-010: UseCase source / candidate 現物監査

Files:

- `data/useCases.ts`
- `data/deployments.ts`
- 必要に応じて `data/guides.ts`
- 必要に応じて `data/articles.ts`

問題:

- 現行の `sources` と `reason` が、用途本文の主張を直接支えているとは限らない。
- `validate:data` は URL 形式と参照整合を見られるが、source 本文と主張の意味一致は見られない。

変更内容:

- この task ではデータを編集しない。
- published UseCase ごとに以下を表で監査する。
  - UseCase id / slug
  - 現 `publishStatus`
  - candidate robot
  - 現 `fit`
  - 現 `basis`
  - evidence URL / deployment id
  - source が用途を直接明示しているか
  - public-grade candidate として残せるか
  - 削除 / draft / 文言弱化 / source差し替えの判断

完了条件:

- 各 published UseCase について、candidate ごとの処理方針が決まる。
- 「言い切れないなら載せない」判定が明示される。

検証方法:

- 監査結果を実装メモまたは次 commit の説明に残す。
- 外部 URL は `curl` または browser で確認し、404 / 403 / dead URL を published 根拠にしない。

順序制約:

- UCP-020 より先に実施する。
- source が確認できない candidate は、推測で `official-use-case` に昇格しない。

### UCP-020: published UseCase データを public-grade に合わせる

Files:

- `data/useCases.ts`
- `data/deployments.ts`
- `data/guides.ts`
- `data/articles.ts`

問題:

- published UseCase に `product-capability` / `market-signal` / `editorial-watch` が残っていると、公開候補が推薦のように見える。
- UseCase を `draft` に戻す場合、Guide / Article からの関連参照が公開面で無言脱落する可能性がある。

変更内容:

- published UseCase の `candidateRobots[]` から public-grade でない candidate を削除する。
- source 調査で direct official use-case と確認できた candidate は `basis: 'official-use-case'` にする。
- direct deployment と確認できた candidate は `basis: 'deployment'` と matching `evidenceDeploymentIds` にする。
- adjacent deployment と確認できた candidate は `basis: 'adjacent-deployment'` と published `evidenceDeploymentIds` にする。
- adjacent deployment として残す candidate は、`reason` に隣接根拠の種類を明記する。
- public-grade candidate が0件になる UseCase は `publishStatus: 'draft'` にする。
- UseCase を draft に戻した場合、published Guide / Article の `relatedUseCaseIds` から当該 id を外すか、相手も draft にするかを個別判断する。
- `updatedAt` と `sources[].checkedAt` は、実際に再確認した日付へ更新する。

初期判定の目安:

- `factory-assembly-support`: published 維持候補。Apptronik / Wandercraft / Figure adjacent は再確認して残す。UBTECH Walker S1 は公式が当該用途を明示していなければ削除。
- `warehouse-picking` / `warehouse-tote-material-handling`: Agility の direct deployment または official use-case が確認できれば published 維持。Figure 03 は direct 根拠がなければ削除。
- `customer-reception`: AgiBot A2 は公式用途が確認できれば残す。Walker X は direct 根拠がなければ削除。
- `research-development`: TALOS / Unitree / Booster は公式に research / education / developer platform が明示されているものだけ残す。
- `factory-inspection`: 巡回点検 / inspection patrol の direct 根拠がなければ draft。
- `care-physical-assistance`: 身体介助 / physical assistance の direct 根拠がなければ draft。care / companion だけなら本文を大きく変えない限り公開しない。
- `demo-exhibition`: exhibition / demo use の direct 根拠がなければ draft。
- `retail-shelf-stocking`: 既に draft。この計画では公開復帰させない。公開復帰は direct source または deployment を確認してから別 task とする。

作業分割の推奨:

- UCP-020a: published 維持できる UseCase の candidate 削除・basis 修正・文言弱化。
- UCP-020b: public-grade candidate が0件になる UseCase の draft 化。
- UCP-020c: draft 化に伴う `data/guides.ts` / `data/articles.ts` / `data/deployments.ts` の関連参照整理。
- 各分割単位で `npm run validate:data` を通し、公開 Article / Guide が draft UseCase を参照し続けないことを確認する。

完了条件:

- `data/useCases.ts` の published UseCase に public-grade でない `basis` が残らない。
- published Guide / Article が draft UseCase を参照して公開面で壊れない。
- 本文が source より強く言い切らない。

検証方法:

- `npm run validate:data`
- この task の変更を commit できる単位に分ける場合も、各 commit 前に `npm run validate:data` を通す。
- 必要に応じて `npm run check:source-links`

順序制約:

- UCP-030 / UCP-040 の validator 強化より先に実施する。先に validator を強化すると、現行データで即失敗するため。
- ただし UCP-020 中も既存 validator は毎回通す。public-grade gate 未導入の状態で修正漏れを見逃さないよう、UCP-010 の監査表と照合してから UCP-030 / UCP-040 に進む。

### UCP-030: public-grade basis helper を追加する

Files:

- `lib/useCaseEvidence.ts`
- `data/types.ts`（型定義は変更しない。`lib/useCaseEvidence.ts` から `CandidateEvidenceBasis` を import して参照する）
- `lib/labels.ts`（必要なら候補表示ラベルの移動または参照整理）

問題:

- validator と UI が `basis` の公開可否と表示ラベルを別々に持つと、将来ズレる。

変更内容:

- `lib/useCaseEvidence.ts` を追加する。
- `publicUseCaseCandidateBases` を `as const` で定義する。
- `isPublicUseCaseCandidateBasis(basis: CandidateEvidenceBasis)` を定義する。
- `candidateEvidenceBasisLabels: Record<CandidateEvidenceBasis, string>` を定義する。
- ラベル案:
  - `deployment`: `導入事例あり`
  - `official-use-case`: `公式用途あり`
  - `adjacent-deployment`: `隣接実証あり`
  - `product-capability`: `製品能力のみ`
  - `market-signal`: `市場シグナル`
  - `editorial-watch`: `調査待ち`

完了条件:

- `basis` の公開可否と表示ラベルが1箇所から参照できる。
- `candidateFitLabels` は他画面互換のため残してもよいが、UseCase 詳細の候補ラベルには使わない。

検証方法:

- `npm run validate:data`
- `npm run build`

### UCP-040: validator に published public-grade gate を追加する

Files:

- `lib/validate.ts`
- `lib/useCaseEvidence.ts`

問題:

- 現行 validator は `product-capability` を published UseCase の candidate として許す。

変更内容:

- `validate.ts` の `candidateEvidenceBases` は、全6値が登録済みかを見る validator 内部の型網羅 Set として残す。
- public-grade gate だけを `lib/useCaseEvidence.ts` の `isPublicUseCaseCandidateBasis()` から参照する。
- `candidateEvidenceBases` と public-grade basis は別の関心として扱い、全 basis の登録チェックと published 表示可否チェックを混同しない。
- `useCase.publishStatus === 'published'` の candidate について、`isPublicUseCaseCandidateBasis(candidate.basis)` が false なら error にする。
- published UseCase で public-grade candidate が0件なら error にする。
- published UseCase の `official-use-case` の `evidenceSourceUrls` が `useCase.sources` に無い場合、現行 warning から error にする。
- `product-capability` / `market-signal` / `editorial-watch` は published UseCase では前段の public-grade gate で error にするため、source unlisted 判定より先に公開不可として扱う。
- draft UseCase では `product-capability` / `market-signal` / `editorial-watch` を許容する。

完了条件:

- published UseCase に `product-capability` / `market-signal` / `editorial-watch` が残ると `npm run validate:data` が失敗する。
- draft UseCase の調査メモ用途は壊さない。

検証方法:

- `npm run validate:data`
- negative check:
  - published UseCase に `product-capability` candidate を一時的に入れると error になることをローカル差分で確認し、確認後は必ず戻す。

順序制約:

- UCP-020 完了後に実施する。
- UCP-030 の helper 追加後に実施する。

### UCP-050: UseCase 詳細の候補ラベルを `basis` ベースにする

Files:

- `src/app/use-cases/[slug]/page.tsx`
- `components/CandidateRobotList.tsx`
- `lib/useCaseEvidence.ts`
- `lib/visualSemantics.ts`（必要な場合のみ）
- `lib/labels.ts`（必要な場合のみ）

問題:

- 現在は `fit` の `strong` / `possible` / `watch` をラベル表示している。
- `possible: '根拠あり'` は、根拠の種類を隠してしまう。

変更内容:

- `candidateAnnotations` に `basis` を渡す。
- `components/CandidateRobotList.tsx` 内のローカル型 `CandidateRobotAnnotation` に `basis: CandidateEvidenceBasis` を追加する。
- `CandidateRobotAnnotation` は共有型ではないため、`data/types.ts` は変更しない。
- `TagChip` の表示文言を `candidateEvidenceBasisLabels[annotation.basis]` にする。
- tone は既存の `fit` を使ってもよい。`basis` tone を新設する場合は `lib/visualSemantics.ts` に限定する。
- `fit` は並び順や tone のために残してもよいが、UseCase 詳細のラベル正本にはしない。

完了条件:

- 候補カード上で「導入事例あり」「公式用途あり」「隣接実証あり」が区別される。
- `possible: 根拠あり` という曖昧ラベルは UseCase 詳細に出ない。

検証方法:

- `npm run build`
- 手動確認:
  - `/use-cases/factory-assembly-support`
  - `/use-cases/warehouse-tote-material-handling`（published 維持の場合）
  - `/use-cases/research-development`（published 維持の場合）

### UCP-060: docs の standing policy へ反映する

Files:

- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- 必要なら `docs/planning/data-architecture-redesign-v1.md`

問題:

- 本計画だけに公開ゲート方針を書くと、実装後に standing policy とズレる。

変更内容:

- `docs/data/README.md` に、published UseCase の candidate は public-grade basis のみと明記する。
- `docs/planning/data-maintenance-checklist-v1.md` §M に以下を追記する。
  - `product-capability` / `market-signal` / `editorial-watch` は published candidate に残さない。
  - 根拠が薄い場合は candidate 削除または UseCase draft 化を標準にする。
  - `official-use-case` は公式 source が当該用途または業務領域を明示している場合のみ。
  - `adjacent-deployment` は UI 上も隣接根拠として表示される。
- `data-architecture-redesign-v1.md` は、必要な場合だけ短く追記する。長い重複説明は入れない。

完了条件:

- 実装後の運用ルールが planning doc と data guide から発見できる。
- 本計画書なしでも、新規 UseCase 追加時の判断ができる。

検証方法:

- `rg -n "public-grade|product-capability|official-use-case|adjacent-deployment" docs/data/README.md docs/planning/data-maintenance-checklist-v1.md docs/planning/data-architecture-redesign-v1.md`

### UCP-070: source link と build 検証

Files:

- 変更なし

問題:

- source の意味一致は手動監査が必要だが、URL 死活と build は機械検証できる。

変更内容:

- 以下を実行する。

```bash
npm run validate:data
npm run check:source-links
npm run build
```

完了条件:

- `npm run validate:data` が error 0。
- `npm run check:source-links` が published UseCase / published Deployment の根拠 URL で OK。
- `npm run build` が通る。

注意:

- `npm run check:source-links` は環境によって network sandbox で失敗する可能性がある。DNS や host resolution の失敗なら、承認を得て escalated で再実行する。

### UCP-080: 計画文書の完了処理

Files:

- `docs/planning/usecase-publication-quality-gate-plan-v1.md`
- `docs/planning/README.md`
- 必要なら `docs/planning/archive/usecase-publication-quality-gate-plan-v1.md`

問題:

- 実装完了後も本計画が `(c) 未実装・作業計画` に残ると、次回以降のAIが未実装計画として誤認する。

変更内容:

- UCP-070 まで完了した後、本計画を `docs/planning/archive/` へ移動するか、`docs/planning/README.md` 上で背景参照へ再分類する。
- standing policy は UCP-060 で `docs/data/README.md` と `data-maintenance-checklist-v1.md` に反映済みにする。
- archive 移動する場合は `docs/planning/README.md` の `(c) 未実装・作業計画` から削除し、archive 一覧または説明と整合させる。

完了条件:

- `docs/planning/README.md` が本計画を未実装 plan として案内していない。
- 実装後の判断は standing docs から追える。

検証方法:

- `rg -n "usecase-publication-quality-gate-plan" docs/planning/README.md docs/planning/archive`

## 7. 推奨実装順

1. UCP-001: 計画文書の登録
2. UCP-010: UseCase source / candidate 現物監査
3. UCP-020: published UseCase データを public-grade に合わせる
4. UCP-030: public-grade basis helper を追加する
5. UCP-040: validator に published public-grade gate を追加する
6. UCP-050: UseCase 詳細の候補ラベルを `basis` ベースにする
7. UCP-060: docs の standing policy へ反映する
8. UCP-070: source link と build 検証
9. UCP-080: 計画文書の完了処理

この順序の理由:

- data を先に直すことで、validator 強化 commit が build 可能になる。
- helper を先に作ることで、validator と UI の `basis` 判定を重複させない。
- docs の standing policy は、実装内容と差分が固まった後に反映する。
- 計画書の完了処理は、standing docs と検証が終わってから行う。

## 8. ファイル別影響

変更予定:

- `data/useCases.ts`
- `data/deployments.ts`
- `data/guides.ts`
- `data/articles.ts`
- `lib/useCaseEvidence.ts`
- `lib/validate.ts`
- `components/CandidateRobotList.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `lib/labels.ts`
- `lib/visualSemantics.ts`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`

変更しない予定:

- `data/types.ts`: 現行の `CandidateEvidenceBasis` で足りるため、原則変更しない。
- `lib/data.ts`: published filtering と関連解決は既存責務のまま使う。
- `/guides` ページ構造: UseCase draft 化に伴う関連配列の修正はあり得るが、Guide UI は変更しない。
- `package.json` / `package-lock.json`: 新規依存は追加しない。

## 9. リスクと軽減策

| リスク | 内容 | 軽減策 |
| --- | --- | --- |
| 公開 UseCase が大きく減る | public-grade を厳格にすると、ページ数と候補数が減る | 薄いページを量産しない方針を優先する。draft は削除ではなく再調査待ちとして残す |
| `product-capability` を全部落として情報が減る | 製品能力上は参考になる候補が見えなくなる | 今回は推薦誤認を避ける。必要なら将来、別画面で「調査中候補」を設計する |
| source 本文の意味一致は機械検証できない | URL が生きていても主張を支えない可能性がある | UCP-010 で人間が source 本文を確認し、本文が強すぎる場合は文言弱化または draft 化する |
| helper が過剰抽象化になる | 小さい enum 判定に helper を作ると冗長に見える | validator と UI の二箇所で同じ基準を使うため、公開可否と label だけを helper に置く |
| UseCase draft 化で related が壊れる | Guide / Article が draft UseCase を参照し続ける可能性 | UCP-020 で `data/guides.ts` / `data/articles.ts` を同時確認し、`validate:data` で not-visible を検出する |

## 10. 手動確認チェックリスト

- `/use-cases` 一覧で published UseCase 数が意図した件数になっている。
- UseCase 詳細の候補ラベルが `basis` に基づいている。
- `導入事例あり` と表示される候補には published deployment がある。
- `公式用途あり` と表示される候補には、公式 source が当該用途または業務領域を明示している。
- `隣接実証あり` と表示される候補には、前世代機、同系統機、または近接用途の published deployment がある。
- `製品能力のみ` / `市場シグナル` / `調査待ち` が published UseCase 詳細に出ない。
- draft 化した UseCase の旧 URL は公開ページとして生成されない。
- sitemap に draft UseCase が含まれない。

## 11. 全体完了条件

- published UseCase に public-grade でない candidate が存在しない。
- `product-capability` だけで公開候補が表示されない。
- UI が `fit` の曖昧ラベルではなく、`basis` の根拠種別を表示している。
- 根拠が薄い UseCase は published から外れている。
- standing docs に運用方針が反映されている。
- 本計画書が未実装 plan として残っていない。
- `npm run validate:data` が通る。
- `npm run check:source-links` が通る。
- `npm run build` が通る。

## 12. 残る意図的な限界

- source 本文と本文主張の意味一致は、引き続き人間の監査が必要。
- `official-use-case` の粒度は source に依存する。公式が広い業務領域だけを述べている場合、UseCase 側のタイトルや本文を source の粒度に合わせる。
- `adjacent-deployment` は「同じ用途での導入」ではないため、UI ラベルと reason で隣接根拠であることを隠さない。
- claim table は今回入れない。将来、source と主張のズレが再発し、運用上の負荷に見合う場合だけ再検討する。
