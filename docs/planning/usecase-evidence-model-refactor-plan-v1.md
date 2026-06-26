# UseCase Evidence Model Refactor Plan v1

Status: active/unimplemented plan
Created: 2026-06-26
Branch: `refactor/project-wide-refactor`

この文書は、`/use-cases`（用途から探す）の公開品質を上げるために、UseCase の出典・導入事例・候補ロボット根拠をデータモデルと validator で保証する実行計画です。
実装判断の正本ではありません。実装時は現行コード、`data/types.ts`、`lib/validate.ts`、`docs/planning/data-architecture-redesign-v1.md`、`docs/planning/data-maintenance-checklist-v1.md` を優先します。

## 0. 結論

UseCase は単なるカテゴリではなく、公開ページ上で以下を主張している。

1. この用途はどの現場に向く/向かないか。
2. 導入判断上どの能力・環境・成熟度が必要か。
3. どのロボットが候補になり、なぜ候補なのか。
4. 実在の導入事例がある場合、それがどの用途の根拠になるか。

現状の `UseCase.sources` はレコード単位であり、`candidateRobots[].reason` は自由文です。
そのため、`sources` を1件足すだけでは「このロボットがこの用途に向いている」という主張の根拠を機械的に追跡できません。

本計画の解決策は以下です。

- published UseCase は `sources` を必須にする。
- `candidateRobots[]` に根拠分類と根拠参照を追加する。
- `fit: 'strong'` は published deployment で裏付ける。
- `fit: 'possible'` / `fit: 'watch'` も、根拠分類なしの自由文にしない。
- 根拠が弱い既存 UseCase は、出典を補うか、`draft` / `seo.noindex` / 候補削除のいずれかに落とす。

## 1. 現状の問題

### 1.1 docs と実装の矛盾

- `docs/planning/data-architecture-redesign-v1.md` は「事実値には `sources`」を原則にしている。
- `docs/planning/data-maintenance-checklist-v1.md` は UseCase sources を「手動推奨（validate 未強制）」としている。
- `lib/validate.ts` は Robot / Manufacturer / Article / Deployment の sources を検証するが、UseCase sources は検証していない。

### 1.2 公開中 UseCase の空 sources

2026-06-26 時点で、published UseCase 8件中4件の `sources` が空。

- `warehouse-picking`
- `factory-inspection`
- `research-development`
- `demo-exhibition`

この状態でも `npm run validate:data` は通る。

### 1.3 candidateRobots の根拠粒度不足

`UseCase.candidateRobots[]` は現在以下の形。

```ts
{
  robotId: Id;
  fit: 'strong' | 'possible' | 'watch';
  reason: string;
}
```

問題:

- `reason` は自由文で、どの source / deployment に基づくか分からない。
- `fit: 'strong'` だけは `data/deployments.ts` と validator で一部保証されている。
- `fit: 'possible'` / `fit: 'watch'` は、公式用途説明・隣接導入事例・スペック適合・編集上の監視対象などが混在している。
- UI は `reason` をそのまま候補ロボット欄に出すため、根拠の弱い主張も公開面に出る。

### 1.4 deployments を UseCase 全体の代替根拠にしている

`docs/planning/data-maintenance-checklist-v1.md` §M は、UseCase の実質的根拠を `deployments.relatedUseCaseIds` に期待している。
ただしこれは以下の理由で不十分。

- deployment は「実在事例」の根拠であり、UseCase 本文全体の根拠ではない。
- deployment があるのは一部 UseCase / 一部 robot だけ。
- `possible` / `watch` の候補理由は deployment では裏付かない。

## 2. 対象範囲

対象:

- `data/types.ts`
- `data/useCases.ts`
- `data/deployments.ts`（必要な `relatedUseCaseIds` 追加・修正のみ）
- `lib/validate.ts`
- `components/CandidateRobotList.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `lib/labels.ts`
- `lib/visualSemantics.ts`（必要な場合のみ）
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/data/README.md`

対象外:

- `/guides` の ComingSoonGate 公開判断
- Guide 本文の sources 強制
- Robot / Manufacturer / Article の大規模 source id 移行
- CMS 移行
- 外部調査を伴う実データ更新の一括実装

Guide は未公開扱いが混ざっているため、この計画では UseCase と切り離す。

## 3. 目標状態

### 3.1 データの不変条件

published UseCase では以下を満たす。

1. `sources.length > 0`
2. `candidateRobots.length > 0`
3. 各 `candidateRobots[]` が根拠分類を持つ
4. `fit: 'strong'` は、同じ `robotId` と同じ `useCase.id` を持つ published deployment を1件以上参照する
5. `fit: 'possible'` は、公式情報・製品能力・隣接導入事例などの根拠を明示する
6. `fit: 'watch'` は、未確認/初期段階/監視対象であることを根拠分類として明示する
7. 根拠を説明できない candidate robot は削除する
8. 根拠を説明できない UseCase は published にしない

### 3.2 UI上の意味

候補ロボット欄の `fit` は以下の意味に固定する。

| fit | UI上の意味 | 必須根拠 |
| --- | --- | --- |
| `strong` | この用途で実在導入/実証が確認できる | matching deployment |
| `possible` | 用途適合の根拠はあるが、この用途での導入事例は未確認 | official source / product capability / adjacent deployment |
| `watch` | 参考・監視対象。現時点では用途適合を強く言えない | watch basis + reason |

## 4. 推奨データモデル

### 4.1 追加する型

`data/types.ts` に追加する。

```ts
export type CandidateEvidenceBasis =
  | 'deployment'
  | 'official-use-case'
  | 'product-capability'
  | 'adjacent-deployment'
  | 'market-signal'
  | 'editorial-watch';
```

意味:

| basis | 意味 |
| --- | --- |
| `deployment` | 同じ robotId / useCaseId の実在 deployment がある |
| `official-use-case` | メーカー/顧客公式がこの用途を明示している |
| `product-capability` | 公式仕様・製品説明から能力適合を説明できるが、用途事例は未確認 |
| `adjacent-deployment` | 前身機・同系統機・近い用途の deployment がある |
| `market-signal` | 公式発表・信頼できる報道で市場投入/実証意向はあるが、用途実績は未確認 |
| `editorial-watch` | 現時点では根拠が弱く、比較/監視対象としてのみ残す |

### 4.2 UseCaseCandidateRobot の拡張

最終形:

```ts
export interface UseCaseCandidateRobot {
  robotId: Id;
  fit: CandidateFit;
  basis: CandidateEvidenceBasis;
  evidenceDeploymentIds?: Id[];
  evidenceSourceUrls?: string[];
  reason: string;
}
```

設計判断:

- `evidenceDeploymentIds` は `data/deployments.ts` の `id` を参照する。
- `evidenceSourceUrls` は当面 URL 文字列で参照する。
- `Source.id` の全コレクション移行は Phase 2 以降に回す。
- `reason` は表示文。validator の根拠にはしない。

`Source.id` を今入れない理由:

- Source は Robot / Manufacturer / Article / Guide / UseCase / Deployment すべてで使われている。
- 全 source に stable id を追加すると変更範囲が広く、今回の UseCase 公開品質改善より大きい。
- candidate evidence の第一根拠は deployment id で十分に安定している。
- URL 参照は完全ではないが、Source.id 導入までの中間表現として扱える。

## 5. validator 方針

`lib/validate.ts` に以下を追加する。

### 5.0 既存 strong 検証との関係

現行 `lib/validate.ts` には、`strongFitEvidence` で deployments の `robotId::useCaseId` ペアを暗黙に導出し、`fit: 'strong'` を error 検証する `[fit-unverified]` チェックが既にある。

evidence model 導入時は、この暗黙チェックを残して新しい `evidenceDeploymentIds` チェックを足さない。
二重管理を避けるため、既存 `[fit-unverified]` チェックは `evidenceDeploymentIds` ベースの明示チェックへ置き換える。

置き換え後の正本:

- `strong` の根拠正本は `UseCase.candidateRobots[].evidenceDeploymentIds`
- `Deployment.relatedUseCaseIds` は deployment がどの UseCase に属するかの正本
- validator は両者が一致していることを検証する

この方針により、「deployment 側の暗黙ペアでは通るが candidate 側の evidence は空」のようなズレを error にできる。

### 5.1 published UseCase sources 必須

UseCase loop 内で以下を呼ぶ。

```ts
checkRequiredSources('useCase', u.slug, u.sources, {
  requireNonEmpty: u.publishStatus === 'published',
});
```

さらに、published UseCase は候補提示ページとして公開されるため、`candidateRobots.length > 0` も error にする。

### 5.2 candidate evidence 検証

UseCase loop 内で candidate ごとに検証する。

共通:

- `basis` が未設定なら error
- published UseCase の candidate は、fit によらず `reason.trim().length > 0` でなければ error
- `evidenceSourceUrls[]` がある場合、各 URL が http(s) URL であること
- `evidenceDeploymentIds[]` がある場合、各 id が `deployments` に存在すること
- published UseCase の candidate が `evidenceDeploymentIds[]` を持つ場合、各 deployment が `publishStatus === 'published'` でなければ error

`fit: 'strong'`:

- `basis === 'deployment'`
- `evidenceDeploymentIds.length > 0`
- 各 deployment が `publishStatus === 'published'`
- deployment の `robotId === candidate.robotId`
- deployment の `relatedUseCaseIds` に当該 `useCase.id` が含まれる
- 現行の `strongFitEvidence` 暗黙チェックは、この明示チェックに置き換える

`fit: 'possible'`:

- `basis !== 'editorial-watch'`
- `basis === 'deployment'` は error。matching deployment があるなら `fit: 'strong'` にする
- `basis === 'adjacent-deployment'` の場合は `evidenceDeploymentIds.length > 0`
- `basis === 'adjacent-deployment'` の deployment は published 必須。ただし隣接根拠なので `robotId === candidate.robotId` や `relatedUseCaseIds` の一致までは要求しない
- `basis === 'official-use-case' | 'product-capability' | 'market-signal'` の場合は `evidenceSourceUrls.length > 0`

`fit: 'watch'`:

- `basis === 'market-signal' | 'editorial-watch' | 'product-capability'`
- `basis === 'product-capability'` の場合は、fit によらず `evidenceSourceUrls.length > 0`
- `basis === 'market-signal'` の場合は `evidenceSourceUrls.length > 0`
- `basis === 'editorial-watch'` の場合のみ、`evidenceSourceUrls` 空を warning に留められる

### 5.3 error / warning の境界

初回導入では published UseCase の公開面に影響するため、以下は error にする。

- published UseCase の sources 空
- published UseCase の `candidateRobots` 空
- candidate `basis` 未設定
- candidate `reason` 空
- `strong` の deployment 不整合
- `possible` かつ `basis === 'deployment'`
- `possible` の根拠参照なし
- published UseCase の candidate が未公開 deployment を根拠参照している
- `product-capability` / `market-signal` の source URL なし

以下は warning で開始する。

- `watch` かつ `basis === 'editorial-watch'` の `evidenceSourceUrls` 空
- UseCase の `sources.checkedAt` が古い
- candidate の `evidenceSourceUrls` が UseCase.sources に含まれていない

## 6. 既存データの判断基準

### 6.1 UseCase ごとの初期判断

| useCase | 現状 | 初期判断 |
| --- | --- | --- |
| `warehouse-picking` | sources 空 / Digit strong deployments あり | sources 追加、Digit strong evidence を deployment ids で明示 |
| `factory-inspection` | sources 空 / strong なし | 根拠調査。薄ければ draft/noindex または candidate 削除 |
| `research-development` | sources 空 / TALOS strong deployment あり | sources 追加、TALOS strong evidence を deployment id で明示 |
| `demo-exhibition` | sources 空 / strong なし | 根拠調査。薄ければ draft/noindex または削除候補 |
| `customer-reception` | sources 1 / possible candidates | candidate evidence を補強。根拠不足なら削る |
| `retail-shelf-stocking` | sources 2 / Phoenix strong deployment あり | Phoenix strong evidence を deployment id で明示 |
| `care-physical-assistance` | sources 2 / strong なし | possible/watch の根拠を再確認。誇張があれば下げる |
| `factory-assembly-support` | sources 3 / strong 複数 | strong evidence を deployment ids で明示。Figure 03 possible は adjacent-deployment 扱いにする |

### 6.2 削除/非公開の判断

以下のどれかに該当する UseCase は published のままにしない。

- UseCase 本体の用途定義を裏付ける source がない
- candidateRobots の大半が `editorial-watch` しかない
- 実在 deployment も公式用途説明もなく、ページが編集推測だけで構成されている
- B2B買い手が見たときに「候補ロボット紹介」として誤認し得る

対応は優先順に以下。

1. 出典を調査して補う
2. candidateRobots を減らす
3. `seo.noindex: true` を付ける
4. `publishStatus: 'draft'` に戻す
5. 削除は原則しない。削除する場合は関連参照を先に整理する

## 7. 実装タスク

### UEM-001: 現状 audit を固定する

Files:

- なし、または作業メモ

手順:

1. `node --input-type=module` で UseCase 一覧、sources 件数、candidateRobots、deployments 対応を出す。
2. `npm run validate:data` を実行する。
3. 現状の空 sources と strong evidence 対応を記録する。

完了条件:

- published UseCase 8件の sources/candidates/deployments の現状が説明できる。
- `next-env.d.ts` などユーザー由来/生成差分を戻していない。

### UEM-002: 型に candidate evidence を追加する

Files:

- `data/types.ts`

変更:

1. `CandidateEvidenceBasis` を追加する。
2. `UseCaseCandidateRobot` に `basis?`, `evidenceDeploymentIds?`, `evidenceSourceUrls?` を追加する。
3. この段階では `basis` は optional にする。

完了条件:

- `npm run build` が通る。
- 既存データ未移行でも TypeScript が通る。

### UEM-003: validator の helper を追加する

Files:

- `lib/validate.ts`

変更:

1. deployment id から deployment を引く Map を作る。
2. candidate evidence 検証 helper を追加する。
3. 既存の `strongFitEvidence` / `[fit-unverified]` チェックは、この段階では残す。
4. 新 helper では、`evidenceDeploymentIds` がある candidate だけ deployment id の存在・robotId・relatedUseCaseIds を warning 検証する。
5. ただし初回は `basis` 未設定を warning に留める。
6. published UseCase の sources 空、published UseCase の candidate 空も、移行前は warning に留める。

完了条件:

- `npm run validate:data` が warning を出して通る。
- warning に空 sources、candidate 空、basis 未設定 candidate が出る。
- 既存 `[fit-unverified]` error の挙動はまだ壊していない。

### UEM-004: UseCase データを移行する

Files:

- `data/useCases.ts`
- 必要なら `data/deployments.ts`

変更:

1. 全 published UseCase に sources を入れる。
2. 全 candidateRobots に `basis` を入れる。
3. `strong` candidate に `evidenceDeploymentIds` を入れる。
4. `possible` candidate に `evidenceSourceUrls` または `evidenceDeploymentIds` を入れる。
5. `watch` candidate に `basis` を入れ、根拠が弱いことが分かる reason に直す。
6. 根拠の説明ができない candidate は削除する。
7. 根拠の説明ができない UseCase は `draft` または `seo.noindex: true` にする。

注意:

- data 更新前に `ai/rules/20-data.md` と `ai/rules/21-data-maintenance-workflow.md` の gate を通る。
- 出典確認では公式/一次情報を優先する。
- 2026-06-26 時点で最新性が必要な外部情報は必ず確認する。
- 推測で source を入れない。

完了条件:

- UseCase 8件すべてについて、published に残すか非公開に落とすかが明確。
- published UseCase は `sources.length > 0`。
- published UseCase の candidateRobots は全件 `basis` を持つ。
- `npm run validate:data` が通る。

### UEM-005: validator を error 化する

Files:

- `lib/validate.ts`

変更:

1. published UseCase sources 空を error にする。
2. published UseCase の `candidateRobots.length === 0` を error にする。
3. candidate `basis` 未設定を error にする。
4. 既存の `strongFitEvidence` / `[fit-unverified]` 暗黙チェックを削除し、`strong` の `evidenceDeploymentIds` 明示チェックへ置き換える。
5. candidate `reason.trim().length === 0` を error にする。
6. `possible` かつ `basis === 'deployment'` を error にする。
7. `possible` の根拠参照なしを error にする。
8. published UseCase の candidate が `evidenceDeploymentIds` で未公開 deployment を参照した場合は error にする。
9. `product-capability` / `market-signal` の source URL なしを error にする。
10. `watch` かつ `basis === 'editorial-watch'` の source URL なしは warning に留める。

完了条件:

- `npm run validate:data` が通る。
- 一時的に published UseCase の sources を空にすると validate が失敗することを確認できる。
- 一時的に published UseCase の candidateRobots を空にすると validate が失敗することを確認できる。
- 一時的に `strong` の `evidenceDeploymentIds` を消すと validate が失敗することを確認できる。
- 一時的に candidate の `reason` を空にすると validate が失敗することを確認できる。
- 一時的に `possible` の `basis` を `deployment` にすると validate が失敗することを確認できる。
- 一時的に `adjacent-deployment` の `evidenceDeploymentIds` を draft deployment にすると validate が失敗することを確認できる。
- `lib/validate.ts` 内に、`strongFitEvidence` 由来の暗黙チェックと `evidenceDeploymentIds` 明示チェックが併存していない。

### UEM-006: 型を最終形に締める

Files:

- `data/types.ts`
- `data/useCases.ts`

変更:

1. `UseCaseCandidateRobot.basis` を optional から required にする。
2. `data/useCases.ts` が全件追従していることを確認する。

完了条件:

- TypeScript 上も `basis` なしの candidate を書けない。
- `npm run build` が通る。

### UEM-007: UI文言を根拠モデルに合わせる

Files:

- `lib/labels.ts`
- `components/CandidateRobotList.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- 必要なら `lib/uiText.ts`

変更:

1. `candidateFitLabels` の表示が新しい意味と一致しているか確認する。
2. 必要なら `strong` を「導入事例あり」、`possible` を「根拠あり」、`watch` を「要確認」に寄せる。
3. candidate の `basis` を UI に出すか判断する。
4. 出す場合は短い補助ラベルに留め、本文を増やしすぎない。

完了条件:

- UseCase 詳細で `strong` / `possible` / `watch` の意味が誤解されない。
- UI が根拠未確認の candidate を強く推薦しているように見えない。
- `npm run build` が通る。

### UEM-008: docs を正本へ反映する

Files:

- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/data/README.md`
- 必要なら `ai/rules/20-data.md`

変更:

1. UseCase sources は published で必須と明記する。
2. deployments は UseCase の一部根拠であり、UseCase 本文全体の代替ではないと明記する。
3. `candidateRobots` の `fit` / `basis` / `evidenceDeploymentIds` / `evidenceSourceUrls` の意味を書く。
4. 新規 UseCase 追加時の gate を、先に deployment/source を確認する流れに直す。
5. Guide sources とは切り離す。

完了条件:

- docs 間で「UseCase sources は手動推奨」と「published は必須」が矛盾しない。
- AI が次回 UseCase を追加するとき、根拠なし candidate を作れない。

### UEM-009: project-wide refactor plan を整合させる

Files:

- `docs/planning/project-wide-refactor-implementation-plan-v1.md`

変更:

1. Phase C の UseCase sources 追加 task は、この計画に置き換わったことを明記する。
2. Guide sources は別判断として残す。
3. UseCase を Guide と同列に扱わない。

完了条件:

- 全体リファクタ計画から古い C-003A/C-004A をそのまま実行する事故が起きない。

### UEM-010: 最終検証

Files:

- なし

実行:

1. `npm run validate:data`
2. `npm run build`
3. `/use-cases`
4. `/use-cases/warehouse-picking`
5. `/use-cases/factory-assembly-support`
6. 非公開/下書きに落とした UseCase があれば、その URL と sitemap の扱い

完了条件:

- validate と build が通る。
- UseCase 詳細で出典セクションが空にならない。
- 根拠の弱い candidate が強く推薦されているように見えない。
- sitemap に載る UseCase は published かつ indexable なものだけ。

## 8. 推奨実装順

1. UEM-001: audit
2. UEM-002: optional 型追加
3. UEM-003: warning validator
4. UEM-004: data migration
5. UEM-005: validator error 化
6. UEM-006: `basis` required 化
7. UEM-007: UI文言調整
8. UEM-008: docs 正本反映
9. UEM-009: project-wide plan 整合
10. UEM-010: 最終検証

## 9. リスクと注意点

### R-001: Source.id を先に入れると範囲が膨らむ

`Source.id` は長期的には良いが、全コレクションの sources へ波及する。
今回の最小実装では `evidenceDeploymentIds` と `evidenceSourceUrls` で進める。

### R-002: sources を足すだけでは解決しない

UseCase 本体の sources と candidate evidence は別問題。
`sources.length > 0` だけで完了扱いにしない。

### R-003: possible を推薦に見せすぎない

`possible` は「用途実証未確認」を含む。
UI文言と reason が強すぎる場合は、`watch` へ下げるか candidate から外す。

### R-004: deployment の relatedUseCaseIds を無理に増やさない

deployment は実在事例の正本。
用途に合わない事例を UseCase の根拠にするために無理に紐付けない。

### R-005: Guide と混ぜない

Guide は ComingSoonGate と noindex の判断が別にある。
UseCase は公開タブなので先に締める。

## 10. 完了定義

この計画全体は、以下を満たしたら完了。

- published UseCase に空 sources がない。
- published UseCase の candidateRobots 全件に `basis` がある。
- `strong` は deployment id で機械検証される。
- `possible` は source URL または adjacent deployment で説明できる。
- 根拠のない UseCase / candidate が公開面に残っていない。
- `npm run validate:data` と `npm run build` が通る。
- docs の UseCase 運用ルールが validator と一致している。
