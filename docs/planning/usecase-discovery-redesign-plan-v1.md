# UseCase Discovery Redesign Plan v1

Status: active/unimplemented plan
Created: 2026-06-28
Branch: TBD - create a dedicated branch from updated `main` before implementation

この文書は、`/use-cases`（用途から探す）を「現場の用途から、根拠付きで候補ロボット・実例・関連記事へ進めるページ」に再設計するための実装計画です。
実装判断の正本ではありません。実装時は現行コード、`data/types.ts`、`lib/data.ts`、`lib/validate.ts`、`docs/planning/data-architecture-redesign-v1.md`、`docs/planning/data-maintenance-checklist-v1.md` を優先します。

## 0. 結論

`/use-cases` の価値は、一般的な「業界紹介」ではなく、読者が次の問いに短時間で答えられることにある。

1. 自分の現場の作業は、どの用途分類に近いか。
2. その用途には、実際の導入事例や公式に説明できる根拠があるか。
3. どのロボットが候補になり、なぜ候補と言えるのか。
4. 追加で読むべき記事は、何に基づいて関連しているのか。
5. その用途が今すぐ現実的なのか、PoC 前提なのか、まだ監視対象なのか。

したがって、今回の改修では「関連」をタグ類似で曖昧に出さない。

- 関連ロボット: `UseCase.candidateRobots[]` を正本にする。
- 実際の導入事例: `DeploymentSite.relatedUseCaseIds` と `candidateRobots[].evidenceDeploymentIds` を正本にする。
- 関連記事: `Article.relatedUseCaseIds` を正本にする。
- 用途分類: `UseCase.primaryDomain` / `secondaryDomains` を MECE な動作軸の正本にする。
- 業種・タスク: `industryTags` / `taskTags` を検索ファセットとして扱い、関連欄の根拠にはしない。

タグは「探すための軸」であり、右カラムや関連欄の「なぜ関係があるか」の根拠にはしない。

## 1. 実装前に必ず読むもの

実装開始前に、この順で読む。

1. `AGENTS.md`
2. `ai/rules/00-index.md`
3. `ai/rules/10-workflow.md`
4. `ai/rules/20-data.md`
5. `ai/rules/21-data-maintenance-workflow.md`
6. `ai/rules/30-ui-design.md`
7. `ai/rules/80-doc-governance.md`
8. `docs/planning/README.md`
9. `docs/data/README.md`
10. `docs/planning/data-architecture-redesign-v1.md`
11. `docs/planning/data-maintenance-checklist-v1.md`
12. `docs/planning/design_system_v1.md`
13. `docs/planning/ui_architecture_and_development_policy_v1.md`
14. `docs/planning/usecase-evidence-model-refactor-plan-v1.md`

実コードの正本として以下を読む。

- `data/types.ts`
- `data/useCases.ts`
- `data/deployments.ts`
- `data/articles.ts`
- `data/robots.ts`
- `lib/data.ts`
- `lib/validate.ts`
- `lib/search.ts`
- `lib/searchIndex.ts`
- `lib/tags.ts`
- `lib/tagRegistry.ts`
- `lib/useCaseFilters.ts`
- `lib/useCaseDisplay.ts`
- `lib/uiText.ts`
- `components/UseCasesBrowser.tsx`
- `components/UseCaseCard.tsx`
- `components/CandidateRobotList.tsx`
- `components/FacetFilterBar.tsx`
- `src/app/use-cases/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`

## 2. 現状の棚卸し

2026-06-28 時点の調査結果。

### 2.1 データ構造

- `UseCase.primaryDomain` は MECE を意図した「ロボットが何をするか」の動作軸。
- `UseCase.secondaryDomains` は同じ用途が複数の動作軸にまたがる場合の補助軸。
- `UseCase.industryTags` / `taskTags` は検索・絞り込み用の非 MECE ファセット。
- `UseCase.candidateRobots[]` は `{ robotId, fit, basis, evidenceDeploymentIds?, evidenceSourceUrls?, reason }` を持つ。
- `fit:'strong'` は同じ `robotId` / `useCase.id` の published deployment がある場合だけ許可される。
- `DeploymentSite.relatedUseCaseIds` は「この導入事例がどの用途の根拠になるか」を示す一方向参照。
- `Article.relatedUseCaseIds` は記事側から用途へ張る一方向参照。
- `lib/data.ts` は `getDeploymentsForUseCase()` / `getArticlesForUseCase()` / `getRelatedRobots()` を持つ。

### 2.2 UI

- `/use-cases` 一覧は `domain` / `industry` / `task` / `q` を URL state として扱う。
- `UseCasesBrowser` は `SelectControl` を直接3つ並べている。
- `reports` には `FacetFilterBar` があり、件数付き選択肢と 0 件 option disabled を実装済み。
- `ReportsBrowser` は `createArticleSearchIndex()` / `searchArticleSlugs()` で `matchedSlugs` を作り、テキスト検索中の facet 件数を検索結果に連動させている。
- `UseCasesBrowser` はまだ `FacetFilterBar` 相当の動的件数・0件無効化に寄っていない。
- `UseCaseCard` は候補ロボット数を出すが、根拠の強さや実例有無は一覧で分からない。
- 詳細ページの右カラムは `判断軸` / `候補ロボット` / `関連` / `選定の相談` という構成。
- `関連` は実装上は `Article.relatedUseCaseIds` 由来の記事だが、UIラベルだけでは何に対する関連か分かりにくい。
- `候補ロボット` は `fit` と `reason` を出すが、`basis` や evidence への導線はまだ弱い。
- 実導入事例はメインカラムに出るが、候補ロボットの evidence と視覚的に結びついていない。

### 2.3 既に存在する良い設計

- 「関連」は id 参照で結ぶ方針が既にある。
- `candidateRobots` は単なる関連 robot id ではなく、`fit` / `basis` / evidence を持つ。
- `validateData()` は UseCase candidate evidence の基本整合を検証している。
- `lib/useCaseEvidence.ts` は既に存在し、`publicUseCaseCandidateBases` / `isPublicUseCaseCandidateBasis()` / `candidateEvidenceBasisLabels` を持つ。
- `use-case-domain` は `lib/tagRegistry.ts` の登録語彙に閉じている。
- UI文言は `lib/uiText.ts` に集約されている。
- enum / 状態ラベルは `lib/labels.ts`、tone は `lib/visualSemantics.ts` を使う方針。

### 2.4 問題

1. 一覧で「何を根拠に候補を出しているか」が見えない。
2. `関連` というラベルが曖昧で、データ構造上の根拠が読者に伝わらない。
3. `判断軸` は一般語として弱く、右カラムの役割が「用途の成立条件」なのか「導入判断」なのか曖昧。
4. `選定の相談` は導線名として硬く、既存の `ContactInquiryType` の `adoption-consultation` とも言い方がずれている。
5. `UseCasesBrowser` のファセットは既存の `FacetFilterBar` 方針に未統合で、0件に進める選択肢を押せる。
6. candidate evidence の表示ロジックがページ側に増えると、`data` / `validate` / `UI` の正本が散る。
7. 先行の `usecase-evidence-model-refactor-plan-v1.md` は現在のコードに一部反映済みだが、`lib/useCaseEvidence.ts` は public-grade basis 判定と basis label に限られており、detail/card で使う candidate evidence view model はまだ持たない。

## 3. 目標状態

### 3.1 情報設計

`/use-cases` は以下の構造にする。

一覧:

- 検索: 自動化したい作業・用途名・分類・タスク・業種で探す。
- 得意分野: `primaryDomain` / `secondaryDomains` を絞り込む。
- 業種: `industryTags` を絞り込む。
- タスク: `taskTags` を絞り込む。
- カード: 用途名、短い説明、成熟度、実例有無、候補ロボット数、強い根拠の有無を表示する。

詳細:

- 要点: 向く条件 / 向かない条件 / 成立条件。
- 実際の導入事例: `DeploymentSite.relatedUseCaseIds` 由来。存在する場合だけ出す。
- 概要 / なぜ重要か / 導入検討の論点 / 出典。
- 右カラム:
  - `用途の条件`: `getUseCaseOverviewFacts()` 由来の facts。
  - `候補ロボット`: `UseCase.candidateRobots[]` 由来。`fit` / `basis` / evidence を表示する。
  - `関連記事`: `Article.relatedUseCaseIds` 由来。存在する場合だけ出す。
  - `導入相談`: CTA。文言は `lib/uiText.ts` に置く。

### 3.2 関連の定義

| UI表示 | 正本 | 派生方法 | タグ利用 |
| --- | --- | --- | --- |
| 候補ロボット | `UseCase.candidateRobots[]` | `lib/data.ts`: `getRelatedRobots()` で `robotId` を解決し、candidate の順序を保持 | 使わない |
| 実際の導入事例 | `DeploymentSite.relatedUseCaseIds` | `lib/data.ts`: `getDeploymentsForUseCase(useCase.id)` | 使わない |
| 候補根拠 | `candidateRobots[].basis` + `evidenceDeploymentIds` / `evidenceSourceUrls` | helper で表示用 view model にする | 使わない |
| 関連記事 | `Article.relatedUseCaseIds` | `lib/data.ts`: `getArticlesForUseCase(useCase.id)` | 使わない |
| 用途分類 | `primaryDomain` / `secondaryDomains` | `lib/useCaseDisplay.ts`: `getUseCaseDomainLabel()` | `use-case-domain` の登録語彙 |
| 絞り込み | `industryTags` / `taskTags` / domain | `lib/useCaseFilters.ts` | 使う |

この定義により、「関連性が曖昧」という問題を UI ラベルとデータ構造の両方で解消する。

### 3.3 データモデル方針

原則として、新しい関連フィールドは追加しない。

既存の正本で足りる。

- `candidateRobots[]`
- `evidenceDeploymentIds`
- `evidenceSourceUrls`
- `DeploymentSite.relatedUseCaseIds`
- `Article.relatedUseCaseIds`
- `primaryDomain` / `secondaryDomains`
- `industryTags` / `taskTags`

追加してよいものは、データの事実値ではなく表示・検証の重複を減らす helper に限る。

- `lib/useCaseEvidence.ts` の既存 helper を拡張する（新規ファイルとして作り直さない）
- `lib/visualSemantics.ts` の basis / evidence 表示 tone が必要なら追加

`candidateEvidenceBasisLabels` は既に `lib/useCaseEvidence.ts` にあるため、`lib/labels.ts` へ移動しない。
移動する場合は `components/CandidateRobotList.tsx` と `lib/validate.ts` の既存 import 変更まで同じ task に含める必要があるが、今回の最小改修では不要。

`Source.id` の全コレクション導入は今回やらない。
理由は、全 `sources[]` への安定ID付与は影響範囲が広く、今回の「用途から探す」価値改善に対して過剰であるため。

## 4. 設計判断

### 4.1 関連ロボットはタグ類似で出さない

タグ類似は「業種が同じ」「タスクが近い」程度の弱い関係しか示さない。
候補ロボット欄は、読者に「このロボットがこの用途にコミットできる可能性」を示す場所なので、`candidateRobots[]` の明示データだけを使う。

### 4.2 関連記事もタグ類似で出さない

記事は `Article.relatedUseCaseIds` を持つ。
記事側の編集判断で「この用途の追加理解になる」と明示されたものだけを `関連記事` として出す。
タグで自動抽出すると、同じ業種タグの記事が混ざり、用途ページの根拠性が下がる。

### 4.3 右カラムは「補助情報」ではなく「次の判断導線」にする

右カラムの役割は、本文の飾りではない。

- `用途の条件`: その用途を検討してよい前提を確認する。
- `候補ロボット`: どの機体から比較すべきかを見る。
- `関連記事`: この用途をめぐる市場・導入・技術の文脈を読む。
- `導入相談`: 個別検討に進む。

このため、`関連` のような抽象名は使わず、データソースが分かる名前にする。

### 4.4 タグ設計の見直しは段階化する

`use-case-domain` は MECE 軸として既に設計されているため、今回の primary 軸はこれを使う。
`industryTags` / `taskTags` は非 MECE の検索ファセットとして維持する。

タグ値を変える必要が出た場合は、UI実装中に場当たりで変更しない。
先に次を満たす audit task を切る。

1. 現 useCase 全件がどの domain / industry / task を持つか一覧化する。
2. 0件の domain、重複しすぎる task、粒度違いの industry を洗い出す。
3. `lib/tagRegistry.ts` の変更案を出す。
4. `data/useCases.ts` / `data/robots.ts` / `data/articles.ts` への波及を明記する。
5. `npm run validate:data` が通る順序に分解する。

### 4.5 `FacetFilterBar` は generic 化を第一候補にする

`reports` と `use-cases` はどちらも「複数ファセット、件数、0件無効化、URL連動」を必要とする。
`UseCasesBrowser` 専用の似た実装を増やすと、今後 robots / manufacturers へ寄せる時にまた分岐する。

推奨は `FacetFilterBar` と `FacetConfig` を generic 化すること。
ただし `reports` の挙動を壊すリスクがあるため、task を小さく分ける。

## 5. 実装対象

### 5.1 変更候補ファイル

- `data/types.ts`（原則変更しない。必要時のみ）
- `data/useCases.ts`（根拠不足や表示上の矛盾が audit で見つかった場合のみ）
- `data/deployments.ts`（事例と用途の紐付け修正が必要な場合のみ）
- `data/articles.ts`（関連記事の明示紐付け修正が必要な場合のみ）
- `lib/useCaseEvidence.ts`（既存 helper の拡張候補）
- `lib/useCaseFilters.ts`
- `lib/facetConfig.ts`
- `lib/searchIndex.ts`
- `lib/uiText.ts`
- `lib/visualSemantics.ts`（必要な場合のみ）
- `components/FacetFilterBar.tsx`
- `components/ReportsBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/UseCaseCard.tsx`
- `components/CandidateRobotList.tsx`
- `src/app/use-cases/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/data/README.md`

### 5.2 変更しないファイル

- `data/robots.ts` は、候補ロボットの表示に必要な既存情報を読むだけにする。新しい逆参照フィールドは追加しない。
- `/guides` や Guide 復活関連は触らない。
- CMS / DB 導入はしない。
- 新しい検索ライブラリは入れない。
- source 全件への `Source.id` 追加はしない。

## 6. 実装タスク

各 task は原則 1 commit にできる大きさにする。

### UCD-001: ブランチとベースラインを固定する

Files: なし

手順:

1. guide retirement は `main` へ統合済み（`0351830 merge: retire guides`）。quality-gate 側の状態だけ確認し、未統合差分を混ぜない。
2. 実装用ブランチを updated `main` から作る。
3. `git status --short --branch` を確認する。
4. `npm run validate:data` を実行する。
5. `npm run build` を実行する。

完了条件:

- guide retirement の未コミット差分や別計画を混ぜていない。
- quality-gate 側の未統合状態が説明できる。
- validate / build の初期状態が説明できる。

### UCD-002: UseCase discovery audit を作る

Files: なし、または一時メモ

手順:

1. published UseCase 全件について以下を一覧化する。
   - `id`
   - `primaryDomain`
   - `secondaryDomains`
   - `industryTags`
   - `taskTags`
   - `candidateRobots[].fit`
   - `candidateRobots[].basis`
   - `evidenceDeploymentIds`
   - `evidenceSourceUrls`
   - `getDeploymentsForUseCase(id)` 件数
   - `getArticlesForUseCase(id)` 件数
2. `strong` / `possible` / `watch` の表示文と根拠が読者に誤認されないか確認する。
3. 実際の導入事例がない用途で、UIが「実例あり」に見えないか確認する。

完了条件:

- UI改修前に、どの useCase が実導入事例あり/なしなのか説明できる。
- データ修正が必要な useCase と、UIだけでよい useCase が分かれている。

検証:

- `npm run validate:data`

### UCD-003: 関連と evidence の表示 helper を拡張する

Files:

- `lib/useCaseEvidence.ts`
- `components/CandidateRobotList.tsx`（import 変更が必要になった場合のみ）
- `lib/visualSemantics.ts`（必要な場合のみ）

変更:

1. 既存 `lib/useCaseEvidence.ts` を拡張し、新規ファイルとして上書きしない。
2. 既存の `candidateEvidenceBasisLabels` と `isPublicUseCaseCandidateBasis()` は維持する。
3. `candidateEvidenceBasisLabels` は `lib/labels.ts` へ移動しない。移動する場合は `components/CandidateRobotList.tsx` の import を同じ task で更新する。
4. candidate から表示用 view model を作る helper を追加する。
5. helper は次を返す。
   - `fit`
   - `basis`
   - `basisLabel`
   - `reason`
   - `deploymentEvidence[]`
   - `sourceEvidenceUrls[]`
6. `deploymentEvidence[]` は `candidate.evidenceDeploymentIds ?? []` を既存の `getDeploymentById(id)` で解決する。`lib/data.ts` には新規 helper を追加しない。`getDeploymentsForUseCase(useCase.id)` は useCase 全体の導入事例一覧用であり、candidate 固有の evidence 解決には使わない。
7. `getDeploymentById()` は `undefined` を返しうるため、現行 `src/app/use-cases/[slug]/page.tsx` の `flatMap(() => [] | [...])` パターンに寄せ、未解決 ID を UI 配列へ混入させない。欠損 ID の検出責務は validate 側に置く。
8. helper はデータの事実判定をしない。validate 済みデータを UI 表示用に整形するだけにする。
9. page component への適用は UCD-004 で行う。
10. UCD-003 の view model は、現行の `candidateAnnotations[robotId].evidenceLinks` を置き換える前提の中間形式とする。`CandidateRobotList` の props 型変更と描画反映は UCD-004 で行う。

完了条件:

- candidate evidence 表示のための label / URL / deployment 解決が一箇所に集まる。
- `CandidateRobotList` の `annotations` 型は UCD-003 では旧 `evidenceLinks` 形式のままでもよい。型変更と描画反映は UCD-004 で行う。
- 既存の `CandidateRobotList.tsx` と `lib/validate.ts` の import が壊れていない。

検証:

- `npm run validate:data`
- `npm run build`

### UCD-004: UseCase 詳細の右カラムを根拠付き導線に直す

Files:

- `src/app/use-cases/[slug]/page.tsx`
- `components/CandidateRobotList.tsx`
- `lib/uiText.ts`
- `lib/useCaseDisplay.ts`（必要な場合のみ）

変更:

1. `判断軸` を `用途の条件` に変更する。
2. `関連` を `関連記事` に変更する。
3. `選定の相談` を `導入相談` に変更する。
4. `候補ロボット` で `fit` だけでなく `basis` を表示する。
5. deployment evidence がある candidate では、対応する導入事例名または件数を表示する。
6. source URL evidence しかない candidate では、公式情報/製品能力などの根拠種別が伝わる文言にする。
7. stale な guide コメントを削除する。
8. `RelatedLinkList` の `title` / `SidebarBlock kicker` が重複する場合は、`RelatedLinkList` の `title` prop を削除または未指定にし、見出し表示は `SidebarBlock` の `kicker` 側へ寄せる。
9. UCD-003 の helper を使い、page component に evidence の細かい条件分岐を直書きしない。
10. `CandidateRobotList` の `annotations` props 型を UCD-003 の view model に合わせて更新する。現行 `evidenceLinks` 形式を使い続ける場合は、helper 側で最終形まで整形し、page component で再変換しない。

完了条件:

- 右カラムの各 block が何をソースにした情報か説明できる。
- 「関連」が何に対して関連なのか曖昧な表示が残っていない。
- candidate evidence の強弱が、本文を読まなくても最低限分かる。
- `src/app/use-cases/[slug]/page.tsx` が evidence の細かい条件分岐を持たない。
- CTA文言が `ContactInquiryType` の `adoption-consultation` と意味的に一致する。

検証:

- `npm run build`
- 手動確認: `/use-cases/factory-assembly-support`
- 手動確認: 実導入事例がない useCase
- 手動確認: 関連記事がない useCase
- 手動確認: 375px / 768px / 1280px

### UCD-005: UseCase 一覧カードに根拠の強さを出す

Files:

- `components/UseCaseCard.tsx`
- `components/UseCasesBrowser.tsx`
- `src/app/use-cases/page.tsx`
- `lib/uiText.ts`
- `lib/useCaseEvidence.ts`
- `lib/useCaseDisplay.ts`（必要な場合のみ）
- `lib/visualSemantics.ts`（必要な場合のみ）

変更:

1. 候補ロボット数だけでなく、実導入事例あり/公式根拠あり/監視対象中心の違いを短く出す。
   - card-level の「実導入事例あり」は `getDeploymentsForUseCase(useCase.id).length > 0` を正本にする。
   - candidate-level の「導入事例に基づく候補」は `candidate.basis === 'deployment'` と `evidenceDeploymentIds` を正本にする。
   - 両者が食い違う場合は、UIで丸めず UCD-002 / UCD-007 でデータ結線の不足として扱う。
2. `UseCaseCard` は `hasDeployments` などの表示用 prop を受け取る。カード内から `getDeploymentsForUseCase()` / `lib/data.ts` を直接 import しない。
3. `src/app/use-cases/page.tsx` の server 側で useCase ごとの card metadata を作る。`hasDeployments` は `getDeploymentsForUseCase(useCase.id).length > 0` で計算し、`UseCasesBrowser` へ渡す。
4. `UseCasesBrowser` は受け取った card metadata を filtered useCase に対応付け、`UseCaseCard` へ渡す。親コンポーネント変更を UCD-005 に含める。
5. 表示は 1 行以内に抑え、カードの高さを不安定にしない。
6. `primaryDomain` の表示が必要なら既存 `getUseCaseDomainLabel()` を使う。
7. 根拠が弱い useCase を強く見せる文言は使わない。

完了条件:

- 一覧で「実際の事例がある用途」と「製品能力ベースの用途」が混同されない。
- カード外形が現行グリッドで崩れない。

検証:

- `npm run build`
- 手動確認: `/use-cases`
- 手動確認: 長い日本語タイトル、候補数0ではない published UseCase

### UCD-006: FacetFilterBar を UseCase にも使える形へ寄せる

Files:

- `components/FacetFilterBar.tsx`
- `lib/facetConfig.ts`
- `lib/useCaseFilters.ts`
- `lib/searchIndex.ts`
- `components/ReportsBrowser.tsx`
- `components/UseCasesBrowser.tsx`

推奨方針:

- `FacetConfig` を `FacetConfig<T extends { slug: string }>` に generic 化する。
- `ARTICLE_FACETS` は現行挙動を維持する。
- `USE_CASE_FACETS` を追加する。
- `domain` / `industry` / `task` は同じ dynamic count / 0件 disabled のルールで扱う。
- `/reports` で使う型は `Article` であり、`Report` 型は存在しない。generic 化後は `FacetConfig<Article>` と `FacetConfig<UseCase>` を扱う。
- use-cases のテキスト検索も `ReportsBrowser` と同じ `lib/searchIndex.ts` パターンに寄せる。

変更:

1. `FacetFilterBar` が `Article` 固定になっている箇所を generic にする。
2. props は `articles` から `items: readonly T[]` にリネームする。`components/ReportsBrowser.tsx` の呼び出しも同じ task で更新し、reports の挙動を変えない。
3. `FacetConfig<T extends { slug: string }>.getValues(item: T)` にする。
4. `matchedSlugs` は `item.slug` を前提にするため、`T extends { slug: string }` の型制約を必須にする。
5. `SelectControl` の `id` が `report-${facet.key}` にハードコードされているため、`idPrefix` prop を追加する。reports は `report`、use-cases は `use-case` を渡す。
6. `FacetFilterBar` は `ActiveFilterChips` を内蔵している。`showChips?: boolean` prop を追加し、既定値は `true` にして `/reports` の現行表示を維持する。`/use-cases` は既存の `UseCasesHeader` 側 chips を採用し、`FacetFilterBar` には `showChips={false}` を渡して二重表示を避ける。
7. `showChips={false}` は chips のみ非表示にし、件数表示は残す。現行の `{active && (...)}` block は `ActiveFilterChips` と件数テキストに分割する。
8. `lib/searchIndex.ts` に `createUseCaseSearchIndex()` / `searchUseCaseSlugs()` を追加する。検索対象テキストは既存 `createUseCaseSearchDocument()` を使い、MiniSearch / `tokenizeJa` / 空クエリは `null` という reports と同じ挙動にする。
9. `UseCasesBrowser` は `createUseCaseSearchIndex(useCases)` と `searchUseCaseSlugs(searchIndex, query)` で use-cases 用 `matchedSlugs` を生成し、`FacetFilterBar` へ渡す。
10. `FacetFilterBar` の option count は、reports と同じく `matchedSlugs` でテキスト検索結果に連動させる。テキスト検索と facet 適用後の最終結果 set を混同しない。
11. `UseCasesBrowser` の3つの `SelectControl` 直書きを `FacetFilterBar` に置き換える。
12. 件数表示は `FacetFilterBar` 側に統一する。`UseCasesBrowser` の独自 `uiText.common.results(filtered.length, Boolean(active))` 表示は削除し、同じ件数を2箇所に出さない。
13. URL state は引き続き `useUrlParamUpdater` を使う。
14. `normalizeUseCaseFilters()` の挙動は維持する。
15. `lib/tags.ts` の `getUseCaseDomainOptions()` / `getUseCaseIndustryTagOptions()` / `getUseCaseTaskTagOptions()` は、`src/app/use-cases/page.tsx` の URL param 正規化で使うため削除しない。UCD-006 では `UseCasesBrowser` からの直接利用だけを減らす。
16. reports の挙動を変えない。

完了条件:

- `/reports` の facet が現行通り動く。
- `/use-cases` で 0件になる option が disabled になる。
- active chip と件数表示が domain / industry / task のすべてで正しい。
- `/use-cases` の active chip は `UseCasesHeader` 側だけに出る。`/reports` は従来通り `FacetFilterBar` 内に出る。
- chips が header と filter bar で二重表示されない。
- `/use-cases` の件数表示は `FacetFilterBar` 側だけに出る。
- `SelectControl` の `id` / `label htmlFor` が reports/use-cases の両方で一意かつ対応している。
- 検索クエリと facet の組み合わせで option count が正しく変わる。

検証:

- `npm run build`
- 手動確認: `/reports`
- 手動確認: `/use-cases?domain=move-goods`
- 手動確認: `/use-cases?industry=manufacturing&task=assembly`
- 手動確認: `/use-cases?q=搬送`

### UCD-007: UseCase data の不足があれば最小修正する

Files:

- `data/useCases.ts`
- `data/deployments.ts`
- `data/articles.ts`
- `docs/planning/data-maintenance-checklist-v1.md`（ルール変更が必要な場合のみ）

実施条件:

- UCD-002 audit で、UI改善だけでは誤認を防げないデータ不備が見つかった場合だけ実行する。

変更:

1. `candidateRobots[].reason` が根拠以上に強い表現なら弱める。
2. `basis` と evidence が合っていない場合は直す。
3. `relatedUseCaseIds` が無理な紐付けなら外す。
4. 実際に用途の根拠になる article があるのに `relatedUseCaseIds` が空なら追加する。
5. 新しい useCase / tag は原則追加しない。必要なら別計画に切り出す。

完了条件:

- 公開 UseCase が、表示される evidence 以上の主張をしていない。
- `npm run validate:data` が通る。

検証:

- `npm run validate:data`
- `npm run build`

### UCD-008: docs の正本へ運用ルールを反映する

Files:

- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/data/README.md`

変更:

1. `/use-cases` の関連定義を明文化する。
2. タグは関連欄の根拠にしないことを書く。
3. `candidateRobots` / `deployments` / `articles` のそれぞれの役割を短く追記する。
4. UseCase 追加/更新時の checklist に「関連記事は `Article.relatedUseCaseIds` で明示する」を加える。
5. `FacetFilterBar` や UI 実装詳細は docs に書きすぎない。運用ルールに留める。

完了条件:

- 今後の agent が、タグ類似で関連を自動生成しない。
- UseCase 追加時に、候補ロボット・導入事例・関連記事の正本が分かる。

検証:

- docs差分のセルフレビュー

### UCD-009: 最終検証と画面確認

Files: なし

手順:

1. `npm run validate:data`
2. `npm run build`
3. `/use-cases` を desktop / mobile で確認する。
4. `/use-cases/factory-assembly-support` を確認する。
5. 実導入事例がない useCase を確認する。
6. 関連記事がない useCase を確認する。
7. `/reports` の facet regressions を確認する。

完了条件:

- validate / build が通る。
- 「関連」の根拠が UI とデータ構造の両方で説明できる。
- 実導入事例あり/なしが読者に誤認されない。
- 0件 option を選ばせる filter regression がない。

## 7. 実装しないこと

- Guide 機能を復活しない。
- タグ一致だけで関連ロボット/関連記事を自動生成しない。
- Source 全件に `id` を追加しない。
- 新しい CMS / DB / search package を入れない。
- UseCase を大量追加しない。
- 実例が薄いページを、UIだけで強く見せない。
- 右カラム用に専用の重複データフィールドを増やさない。
- `data/*.ts` を page component から直接 import しない。

## 8. リスクと軽減策

| リスク | 重大度 | 軽減策 |
| --- | --- | --- |
| `FacetFilterBar` generic 化で reports が壊れる | High | UCD-006 を単独 commit にし、`/reports` を必ず手動確認する |
| evidence 表示が強すぎて、未実証用途を実証済みに見せる | High | `fit` / `basis` / deployment有無で文言を分ける |
| useCase 全体の導入事例と candidate 固有 evidence が食い違う | High | card-level は `getDeploymentsForUseCase()`、candidate-level は `evidenceDeploymentIds` を正本にし、食い違いはデータ監査で直す |
| タグ設計変更が robots/articles へ波及する | Medium | 今回は原則変更しない。必要なら UCD-002 後に別 task 化する |
| 右カラムの情報量が増えすぎる | Medium | evidence 表示は短くし、詳細は出典/導入事例セクションへ逃がす |
| helper が抽象化しすぎる | Medium | `useCaseEvidence` は UseCase detail/card の表示整形だけに限定する |
| 既存 guide retirement / quality-gate ブランチと混ざる | Medium | updated `main` から専用ブランチを切る |

## 9. 手動確認チェックリスト

- [ ] `/use-cases` 初期表示でカードが崩れない。
- [ ] `domain` / `industry` / `task` の各 facet に件数が出る。
- [ ] 0件になる facet option が disabled になる。
- [ ] 検索クエリ入力中も facet count が破綻しない。
- [ ] active chip の削除が URL と表示に反映される。
- [ ] `/use-cases/factory-assembly-support` で `strong` / `possible` / `watch` の fit と、`deployment` / `adjacent-deployment` / `official-use-case` などの basis が混同されずに分かる。
- [ ] 実導入事例がない useCase で、実例ありに見える文言がない。
- [ ] 関連記事がない useCase で右カラムに空見出しが出ない。
- [ ] `/reports` の facet が regression していない。
- [ ] 375px幅で filter / card / right column が重ならない。
- [ ] 1280px幅で右カラムが本文と過度に離れない。

## 10. 完了条件

この計画は、次を満たしたとき完了とする。

1. `/use-cases` の関連ロボット・関連記事・導入事例が、それぞれどのデータ構造をソースにしているか明確。
2. candidate robot の根拠種別と evidence が UI 上で最低限見える。
3. タグは discovery facet、id参照は related/evidence という責務分離が維持されている。
4. 右カラムに `判断軸` / `関連` / `選定の相談` のような曖昧な見出しが残っていない。
5. `npm run validate:data` が通る。
6. `npm run build` が通る。
7. `docs/planning/data-architecture-redesign-v1.md` / `data-maintenance-checklist-v1.md` / `docs/data/README.md` に運用ルールが反映されている。
