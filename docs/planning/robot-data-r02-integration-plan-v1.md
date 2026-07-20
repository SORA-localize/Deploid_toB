# Robot DATA-R02 Integration Plan v1

Status: active / R02-04 schema decision completed (Option A) — proceeding to R02-08

Created: 2026-07-17

Branch: `data/robot-catalog-r01-rollout-20260716`

Plan review rule: `ai/rules/10-workflow.md`

Implementation review rule: `docs/planning/ai_fullstack_development_guardrails_v1.md`

## 1. 目的

DATA-R02で再調査したpublished Robot 61機の最新一次情報を、現行のRobot catalogへ安全に反映する。

調査JSONを一括転記せず、次を別々の作業として扱う。

1. 調査成果物を再現可能な状態で固定する
2. 製品の現行・発表・後継状態を人間が承認する
3. R02の調査スキーマと現行データモデルの差を整理する
4. 実装可能値と保留値をmanifestで分離する
5. まず1機でデータ反映を検証する
6. 問題の少ない機体からメーカー単位または5〜8機体単位で反映する
7. conflict、variant、取得不能資料は通常バッチへ混ぜず個別に扱う

この計画は、実装済みの `robot-catalog-fullstack-implementation-plan-v1.md` にある「全件再調査を別PR群で行う」後続作業を具体化する。

## 2. 現在地

### 2.1 Git / worktree

- worktree: `Deploid_toB-data-r01-onex`
- branch: `data/robot-catalog-r01-rollout-20260716`
- DATA-R02成果物はR02-00のdocs-only snapshotで追跡対象に追加
- `next-env.d.ts` はdev serverが生成した変更であり、R02成果物commitへ含めない
- `data/*.ts`、UI、画像、publishStatusはDATA-R02調査では未変更

既存のR02成果物やユーザー変更を、計画実行中にまとめてstage・restoreしない。各taskで対象ファイルを明示して扱う。

### 2.2 R02機械再集計

`DATA-R02-B01.json`〜`B10.json`を直接集計した値:

| 項目 | 件数 |
| --- | ---: |
| Robot | 61 |
| unique Robot | 61 |
| 16項目中 `found` | 443 |
| `conflict` | 28 |
| `needs-review` | 47 |
| `source-inaccessible` | 40 |
| human review対象 | 32機・42件 |
| official UseCase接続候補 | 81 |
| USE_CASE_GAP | 51 |
| usage example候補 | 63 |
| current feature候補 | 267 |

`DATA-R02-master-report.md` の旧記載「found値はおよそ425件」は、この再集計結果443件に訂正した。

### 2.3 公開状態の調査結果

| recommendation | 件数 | 対象 |
| --- | ---: | --- |
| keep-published | 56 | 下記以外 |
| move-to-draft | 1 | `agibot-a2-max` |
| archive | 3 | `fourier-gr1`, `fourier-gr2`, `apptronik-apollo` |
| manual-review | 1 | `robotera-m7` |

`keep-published` は「公開状態を維持できる」という判定であり、「全フィールドを無条件で実装できる」という意味ではない。

## 3. 変更範囲

### 3.1 対象

- `docs/data/DATA-R02-*` の監査・固定
- `docs/data/README.md` のR02案内追加
- 必要なRobotデータ契約
- `data/robots.ts` の既存61レコード更新
- 公式用途を接続する `data/useCases.ts`
- 必要な `Source`、field evidence、価格、荷重、活用事例URL
- 承認されたpublishStatus / `supersededById` 更新
- resolver / validator / UIに本当に必要な最小変更

### 3.2 対象外

- 画像・ロゴの追加、権利判定、素材差し替え
- 51件のUSE_CASE_GAPを一括で新規UseCase化
- 取得不能な公式資料を推測で補完
- conflict値をAI判断で単一値へ統合
- 12機のvariantを一括分割
- mobile専用カードの新設・再設計
- Robot以外の全サイトリファクタ
- CMS、DB、APIの導入

## 4. 正本とデータ投影ルール

### 4.1 正本

- 型: `data/types.ts`
- スペック項目: `lib/specSchema.ts`
- Robot実データ: `data/robots.ts`
- 公式用途との接続: `UseCase.candidateRobots`
- 活用事例の表示選択: `Robot.usageExampleSourceUrls`
- 出典: 各recordの `sources[]`
- 価格フォールバック: price offerの有無からresolverで導出
- 調査履歴: `docs/data/DATA-R02-*`。公開データの正本にはしない

### 4.2 採用可能な値

次の全条件を満たす値だけを実装候補にする。

- R02 statusが `found`
- `evidence.sourceUrl` がある
- `evidenceScope` が `current-product`、`current-family-common`、または対象recordと一致する `variant-specific`
- 現行recordの対象機種・variantと矛盾しない
- 現行schemaへ意味を失わず投影できる
- 同じURLをRobotまたはUseCaseの `sources[]` から追跡できる

### 4.3 自動適用しない値

- `conflict`
- `needs-review`
- `source-inaccessible`
- `historical-only`
- 対象variantが異なる値
- R02の自由記述を既存enumへ推測変換した値
- 第三者記事だけに存在する仕様値

`not-published` は「空値を書き込む」操作ではない。古い現行値を削除する場合は、既存値の出典とR02の調査範囲を個別確認し、manifestへ `clear-after-review` として分離する。

## 5. 実装前に決めること

### DEC-01 公開状態

推奨案:

- `agibot-a2-max`: `draft`。Coming soonの間は一覧・関連レールへ出さない
- `fourier-gr1`: `archived`、`supersededById: 'fourier-gr2'`
- `fourier-gr2`: `archived`、`supersededById: 'fourier-gr3'`。SDKサポート継続は説明・出典へ残す
- `apptronik-apollo`: `archived`、`supersededById: 'apptronik-apollo-2'`
- `robotera-m7`: 公式ナビ上はcurrentのため当面publishedを維持し、公式本文取得まで未確認数値を追加しない

このtaskでは判断を記録するだけで、`data/robots.ts` は変更しない。

### DEC-02 R02にしかないデータの扱い

R02の次の形は現行Robot型へそのまま入らない。

- `identity.lifecycleStatus`
- `currentFeatures[]`
- `priceFallback`
- 構造化された `procurement`
- 分類・顧客・variantを持つ `usageExamples[]`
- variant別に異なるspec値

推奨方針:

| R02 field | 推奨投影 |
| --- | --- |
| lifecycleStatus | `publishStatus`と混同しない。必要性をPILOT後に再評価し、最初のdata batchでは新fieldを追加しない |
| priceFallback | 保存しない。`priceOffers`がなければ既存resolverが問い合わせを返す |
| procurement | 既存の`procurementModels`、`marketAvailability`、`japanAvailability`、`distributorJapan`、`supportNote`へ意味を保てるものだけ投影 |
| usageExamples | 現行契約どおり最大3件のURLだけを`usageExampleSourceUrls`へ入れ、表示メタデータは`Source`から解決 |
| currentFeatures | 一括追加しない。aeo pilotで既存`description`・spec・UseCaseで不足する情報を確認後、根拠付きの小さい構造を別taskで判断 |
| variant別spec | family-commonだけscalar specへ入れる。variant固有値は勝手に代表値化せず、record分割またはvariant構造を別taskで判断 |

### DEC-03 variant方針

12機のproduct-family問題を一括解決しない。

1. 公式に別SKU・別モデルとして購入・参照される場合はrecord分割候補
2. 同一製品の選択構成なら、共通値だけ現行Robotへ採用
3. 価格と荷重は既存のvariant付き配列を利用
4. その他のvariant別specは保留し、最初のpilotへ混ぜない
5. `kepler-k2`、`ubtech-walker-tienkung`、`kawasaki-kaleido`を代表ケースとして後続設計を行う

## 6. 実行task

1 taskを原則1 commitにする。task完了時に検証し、不備を残したまま次へ進まない。

### R02-00 調査成果物を固定する

Files:

- `docs/data/DATA-R02-*`
- `docs/data/README.md`

Problem: R02成果物が未追跡で、master reportのfound総数に不一致があった。

Change:

- B01〜B10、source plan、publication review、unresolved、master reportを1つのresearch snapshotとして追加
- master reportのfound総数を443へ訂正
- `docs/data/README.md`へR02の役割と「dataへ直接コピーしない」注意を追加
- `next-env.d.ts`、data、UIをstageしない

Completion:

- 61件・unique 61件
- 16 spec keys欠落0件
- found 443件、found source URL欠落0件
- R02成果物だけがcommit対象

Validation:

```bash
jq -e . docs/data/DATA-R02-*.json
git diff --cached --name-only
git diff --check
```

Depends on: none。Commit: research docs only。

### R02-01 人間判断を決定ログへ固定する

Status: completed 2026-07-18

Files:

- `docs/data/DATA-R02-decisions.md`（new）

Problem: publishStatusとvariantに編集判断が残ったままでは、別AIが異なる判断で実装する。

Change:

- DEC-01〜03の採否、根拠、決定者、決定日を記録
- 未決定事項は `pending` のままにし、実装対象へ入れない

Completion: 公開状態5機とpilot対象の投影ルールが明示される。

Validation: decision logとpublication reviewの対象IDを機械突合する。

Depends on: R02-00。Commit: decisions only。

### R02-02 実装manifestを生成・監査する

Files:

- `docs/data/DATA-R02-IMPLEMENT-*.json`（new）
- `docs/data/DATA-R02-implementation-report.md`（new）
- 必要な場合のみmanifest生成script

Problem: R02のraw調査形を直接dataへ転記すると、既存値・source join・保留値を壊す。

Change: 各Robotについて次のactionを生成する。

- `set`
- `preserve`
- `clear-after-review`
- `hold-conflict`
- `hold-variant`
- `hold-source-inaccessible`
- `add-source`
- `merge-use-case-relation`
- `replace-usage-example-urls`
- `publish-status-proposal`
- `unsupported-schema`

manifestは現行 `data/robots.ts` / `data/useCases.ts` との差分を持ち、unsupported fieldを捨てず別欄へ隔離する。

Completion:

- 61機が1回ずつ存在
- actionのないfound値0件
- conflict / needs-review / inaccessibleの自動set 0件
- source join欠落0件
- 既存deployment basisをofficial-use-caseで上書きしない

Validation:

```bash
npm run validate:data
git diff --check
```

Depends on: R02-01。Commit: manifest only。

### R02-03 aeoをデータpilotとして反映する

Files:

- `data/robots.ts`
- `data/useCases.ts`
- 必要なsource joinのみ

Problem: aeoは現行公式ページの情報があるのに、数値spec非公開と旧世代事例の不確定が混ざり、詳細仕様がほぼ空になっている。

Change:

- 現行aeoページに直接帰属する `controlMethod` 等、現行schemaへ投影可能な情報だけを反映
- disinfect / care / delivery / securityのうち、既存UseCaseと意味が一致する関係だけをmerge
- 旧Aeolus Robot導入事例は現行機と同一と断定せず、採用する場合もhistorical/adjacentで分離
- RaaS、国内窓口、保守情報を既存procurement fieldsへ根拠付きで反映
- 数値specは推測で埋めない
- UIや型をこのtaskで変更しない

Completion:

- aeoの現行公式情報が旧世代identity問題で一括棄却されない
- 数値非公開項目は欠損のまま
- 用途・調達・操作方式・出典が追跡できる
- 他60機のdata diff 0件

Validation:

```bash
npm run validate:data
npm run build
npm run check:source-links
git diff --check
```

Manual:

- `/robots/aeolus-aeo`
- `/robots`
- aeoを含むUseCaseページ
- aeoのメーカー詳細・関連ロボット

Depends on: R02-02。Commit: one Robot pilot。

### R02-04 pilot結果からschema不足を判断する

Files: まずdocs only。承認後に型taskを分離する。

Problem: R02のcurrentFeatures 267件やvariant別specをそのまま追加すると、詳細ページが再び過剰実装になる。

Change:

- aeo pilotで公開情報のうち表示不能だった事実を列挙
- 既存のdescription、spec、UseCase、procurement、Sourceで十分か確認
- 不足する場合だけOption A/Bを提示する

- Option A: 現行modelを維持し、表示対象を既存fieldへ限定する。
- Option B: 根拠URL付きの小さい `featureFacts` 構造を追加し、件数上限と表示場所を定義する。

Completion: 新fieldの必要性、表示場所、上限、重複禁止ルールが承認される。未承認なら型・UIを変更しない。

Depends on: R02-03。Commit: design decision only。

### R02-05 必要な場合だけデータ契約を拡張する

Files:

- `data/types.ts`
- `lib/validate.ts`
- `lib/robotCatalog.ts`
- `lib/uiText.ts`
- 正本docs

Problem: R02-04で、既存modelでは必要な公式情報を表示できないと確定した場合だけ対応する。

Change:

- approved fieldだけoptionalで追加
- source URL join、件数上限、重複をvalidatorで保証
- resolverを先に作り、ページでraw fieldを直接組み立てない
- 既存61件の一括移行を要求しない

Completion: 既存dataを変更しなくてもbuildでき、pilotデータだけで空・1件・上限件数を検証できる。

Validation:

```bash
npm run validate:data
npm run build
git diff --check
```

Depends on: R02-04でOption B承認時のみ。Commit: schema/resolver/validator only。

### R02-06 必要な場合だけUIを追加する

Files:

- `src/app/robots/[slug]/page.tsx`
- 既存詳細componentまたは承認された小さい共通component
- `components/RobotDetailSkeleton.tsx`（構造が変わる場合のみ）

Problem: approved fieldが保存できても、詳細ページに責務の重複なく表示できる場所がない場合がある。

Change:

- 既存の固定詳細仕様、想定用途、活用事例、出典との重複を避ける
- 値0件ならsectionを出さない
- 長いマーケティング文をそのまま並べない
- mobileは既存回帰確認だけ行い、専用デザインを追加しない

Completion: aeoで必要情報を確認でき、他Robotの空状態とレイアウトを壊さない。

Validation:

```bash
npm run build
git diff --check
```

Manual viewport: 1280×900、1536×900、360×800。

Depends on: R02-05。Commit: UI only。

### R02-07 公開状態変更を独立反映する

Files:

- `data/robots.ts`
- sitemap / related resolverは変更せず既存挙動を検証

Problem: lifecycle変更をspec更新と同じcommitへ混ぜると、一覧・SEO・関連から消えた原因を追跡しにくい。

Change: DEC-01で承認された5機だけを変更する。

Completion:

- draftは一覧、関連、sitemapへ出ない
- archivedは詳細URLを保持しnoindex、後継導線を表示
- related railへdraft/archivedが出ない
- 既存記事・UseCase参照が無言で壊れない

Validation:

```bash
npm run validate:data
npm run build
git diff --check
```

Depends on: R02-01。Commit: publish status only。

### R02-08 低リスクbatchを反映する

Files: 1batchにつき `data/robots.ts`、必要な `data/useCases.ts`、source join。

Problem: 56機を一括変更するとレビュー不能になる。

Change:

- 1メーカー、または5〜8機体を上限にする
- `conflict`、variant設計待ち、source-inaccessibleを通常batchから除外
- spec、price、load、procurement、usage URL、official use caseをmanifestどおり反映
- 1batch 1 commit、必要なら1PR

Completion:

- 対象IDと変更fieldがcommit本文で列挙される
- 対象外Robotのdiff 0件
- manifestのset/preserve/source joinがdataと一致

Validation: validate、build、source-links、対象詳細ページの手動確認。

Depends on: R02-03、およびR02-05/06を実施した場合はその完了後。

### R02-09 conflict / variant / inaccessibleを個別処理する

Files: 対象1機または1製品familyに限定。

Problem: 公式資料間の競合やvariant差を通常batchで解決すると誤値が混入する。

Change:

- conflictは原典の日付、対象variant、定義、通常/最大条件を再確認
- 解決不能なら現行値を消さずholdし、UIでは省略
- product family分割は既存ID・slug・関連・記事・用途への影響を先に監査
- source-inaccessibleは別ブラウザ/OCR/資料請求などで一次資料を取得できた場合だけ再開

Completion: 採用値と不採用値の理由がfield単位で追跡できる。

Depends on: R02-08と並列にしない。Commit: one Robot/family。

### R02-10 USE_CASE_GAPを別計画へ送る

Files: docs only。

Problem: 51 gapを一括でUseCase化すると、用途から探すに薄いページが増える。

Change:

- 同義表現を正規化して重複候補をまとめる
- 既存UseCaseへ接続可能な誤判定を再確認
- 複数Robot・複数一次根拠が集まる用途だけ新規候補にする
- 新規UseCaseは別計画・draftから開始する

Completion: gapごとに `existing-match` / `new-use-case-candidate` / `editorial-only` / `hold` が付く。

Depends on: Robot data rolloutとは独立。Commit: gap triage docs only。

### R02-11 全件回帰監査

Files: 原則変更なし。発見した問題は対象taskへ戻す。

Completion:

- published/draft/archived件数がdecision logと一致
- 全published Robotのsourcesが追跡可能
- spec、price、load、usage exampleのsource join欠落0
- official UseCase relationのevidence欠落0
- DATA-R02 manifestの未処理actionが、明示したhold/deferredだけになる
- 画像・ロゴ・権利状態に意図しない差分0

Validation:

```bash
npm run validate:data
npm run build
npm run check:source-links
git diff --check
```

Manual:

- `/robots`
- aeoおよび各batch代表Robot詳細
- spec 0件 / 1件 / 多数のRobot
- 用途0件 / 複数件
- 活用事例0件 / 3件
- published / draft / archived / successor
- Home、メーカー解説、メーカー詳細、比較で共有Robotデータが崩れていないこと

## 7. 順序制約

```text
R02-00 research snapshot
  └─ R02-01 decisions
      ├─ R02-02 implementation manifest
      │   └─ R02-03 aeo pilot
      │       └─ R02-04 schema decision
      │           ├─ Option A: R02-08 rollout
      │           └─ Option B: R02-05 schema ─ R02-06 UI ─ R02-08 rollout
      └─ R02-07 publication status

R02-08 low-risk batches ─ R02-09 difficult records ─ R02-11 final audit
R02-10 use-case gap triage is separate from Robot rollout
```

## 8. リスクと軽減策

| リスク | 軽減策 |
| --- | --- |
| R02を正本として直接参照する | 必ずmanifestを経由し、公開正本はdata/*.tsに限定 |
| foundを無条件で採用する | evidenceScope、variant、source join、schema投影をgate化 |
| 旧値を一括削除する | `clear-after-review`を別actionにし、人間確認なしでclearしない |
| currentFeaturesを267件全部表示する | aeo pilot後に必要性を判断し、未承認ならmodel追加しない |
| variant差を代表値へ潰す | family-commonのみscalarへ採用し、難しい12機を別task化 |
| status変更でURLや関連が消える | archived detailを保持し、sitemap/noindex/relatedを手動確認 |
| UseCaseを薄く量産する | 51 gapを別triageし、Robot rolloutで自動追加しない |
| dev server生成物がcommitへ混ざる | taskごとにstage対象を列挙し、`git diff --cached --name-only`を確認 |
| 一括変更でレビュー不能 | 1メーカーまたは5〜8機体、難しいものは1機ずつ |

## 9. 各batchの完了報告

各taskで次を報告する。

- 対象Robot ID
- 変更したfield
- 追加・更新したsource URL
- 採用しなかったR02値と理由
- publishStatus変更の有無
- USE_CASE_GAP
- 実行した検証と結果
- 手動確認したURL・viewport
- 残るhuman review

## 10. 全体完了条件

- 61機のR02値が `set`、`preserve`、`clear-after-review`、`hold-*`、`unsupported-schema` のいずれかで説明される
- 実装した値は公開正本から追跡できる
- conflict / needs-review / inaccessibleを推測で採用していない
- 現行製品ページの直接情報を、旧世代事例の不確定だけで一括棄却していない
- 非現行機の公開状態が承認済み方針と一致する
- Robot card、detail、Home、メーカー解説、比較が同じRobot SSOTを参照する
- `validate:data`、`build`、`check:source-links`、`git diff --check`の結果を記録する
- 未解決事項が「調査漏れ」ではなく、対象・理由・次の取得方法を持つ

## 11. 次に実行する小さい単位

`R02-04`はOption A（現行モデル維持、新フィールド追加なし）で承認済み（`docs/data/DATA-R02-decisions.md` §8a）。R02-05/06（schema・UI拡張）は実施しない。

次に実行するのは `R02-07`（承認済み5機のpublishStatus変更、specとは別commit）と、続く `R02-08`（メーカー単位・5〜8機体単位の低リスクバッチ反映、manifestの`set`/`merge-use-case-relation`/`replace-usage-example-urls`/`add-source`のみを対象とし、conflict/variant-hold/source-inaccessibleはR02-09へ個別送りする）。
