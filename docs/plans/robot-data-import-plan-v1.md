---
status: plan
updated: 2026-08-09
---

# ロボットデータ投入 実行計画 v1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google SheetsのHTML書き出しにある**177原本行ぶんの差分を処理**し、Payload +
PostgreSQLを最終robots 188件、DB Manufacturer 59社、RobotSeries 29件にする。177は投入後の
Robot件数ではない。

**Architecture:** 原本HTML → 正規化JSON → 署名済みimmutable import manifest → Payload Local API。
現行parser / JSONは基礎部分だけ実装済みで、stableId・deploymentStage・Robot sources契約とmanifestは
**未実装**（Task 1）。TSファイル（`data/*.ts`）を経由しない。既存63件は①がPayloadへ移し終えた
前提で、その上に差分を当てる。

**Tech Stack:** Payload CMS, PostgreSQL, TypeScript, Next.js 16 App Router, Vitest, Playwright

この文書は実装や権利判断の正本ではない。矛盾した場合は次の順で優先する。

1. `docs/decisions/content-platform-and-database-architecture-v2.md`（CMS/DBの上位正本）
2. `docs/decisions/data-architecture-redesign-v1.md`（データモデルの正本）
3. `collections/*.ts` の実装、`docs/decisions/data-maintenance-checklist-v1.md`
4. `ai/rules/21-data-maintenance-workflow.md`
5. 本計画

## この計画の位置づけ

**2本立ての2本目。**

```
① docs/plans/content-platform-migration-plan-v1.md   Payload + Postgres を立て、既存63件を移す
② 本計画                                             177原本行ぶんの差分を処理し、robots 188件へする
```

①が終わっていないと②は始められない（§0 のゲート）。

**経緯**: 当初は「TSファイル（`data/*.ts`）を整えてから移行する」前提だった。2026-08-08に
停止許容と包括的なURL waiverが提案され移行先行へ変更したが、2026-08-09の上位SoT承認でwaiverを
Task 9.5のSeries移管7件だけへ限定した。停止は1週間程度まで許容する。旧計画は削除済みであり、
継承の完全性は確認不能（§13 #10）。

**吸収した計画**: `robot-data-r02-integration-plan-v1.md`（R02-09・R02-11）、`robot-data-factcheck-impl-plan-2026-07-01.md`（Phase C）。いずれも `docs/archive/`。

## Global Constraints

- 既存の`id`を変更しない。URL waiverはTask 9.5に旧URL・新URL・301または同一URL継承を
  列挙したSeries移管7件だけに適用し、それ以外の`slug` / `previousSlugs`は維持する
- domain JSONでは新規レコードを `publishStatus: 'draft'` で始める。Payload書き込み時は
  `_status: 'draft'` + `lifecycleStatus: 'active'` + `draft: true`へ変換する。domainの
  `archived`は`_status: 'published'` + `lifecycleStatus: 'archived'`、`published`は
  `_status: 'published'` + `lifecycleStatus: 'active'`とし、custom `publishStatus` fieldは作らない
  （`ai/rules/21-data-maintenance-workflow.md` G9）
- スペックキーは `lib/specSchema.ts`、タグは `lib/tagRegistry.ts` に登録済みの値のみ使う（G7）。**これらは Git 管理を継続する**（`content-platform-and-database-architecture-v2.md` §5.2）
- 本番Postgresへ SQL で直接書き込まない。Payload API / MCP を通す（同 §7.3）
- 挙動変更・構造改善・見た目変更を同じ task に混ぜない（`ai/rules/10-workflow.md`）
- 1 task = 1 commit。**例外は Task 1（report基盤と人手TSVを分離）とTask 9** — ただし「1メーカー1 Git commit」は **DB変更の
  revert 単位にならない**（Payload へ新規作成する131件は Git 差分にならない）。Task 9 は
  **affected manufacturerごとに1 transaction ＋ 1 audit artifact**（Task 9の新規131件は45社。
  run ID・作成/更新した `stableId` の一覧・
  before/after の件数）とし、Git には artifact だけを commit する
- 新しい validation ゲートは、**わざと違反を仕込んで赤くなることを確認してから**採用する
- データ変更の各 task 末尾で検証を実行し、error 0 を確認する
- Local APIは原則`overrideAccess: false`と正式roleの実行userを指定する。正式role enumは①と同じ
  `content-reader` / `content-draft-writer` / `content-publisher` / `platform-admin`だけを使う

---

## 0. 前提ゲート（①の完了確認）

**すべて満たすまで Task 1 へ進まない。** 1つでも欠けたら①へ戻る。

- [ ] **G-1: Payload が動いている**

```bash
rg -n '"(payload|@payloadcms/db-postgres|@payloadcms/next)"' package.json
rg -n 'DATABASE_URL|PAYLOAD_SECRET' .env.example
test -f payload.config.ts && echo "payload.config.ts OK"
```
Expected: パッケージが解決し、環境変数が `.env.example` に定義され、`payload.config.ts` が存在する。

加えてTask 1のparser/manifest実装前は②のデータ変更Taskへ進まない。現行JSONにstableId・stage・
Robot source配列が無い状態を「①で実装済み」と誤認しない。

- [ ] **G-2: 10コレクションが定義されている**

```bash
ls collections/
```
Expected: `Manufacturers` / `Robots` / `RobotSeries` / `Distributors` / `UseCases` / `Deployments` / `Articles` / `ArticlePlacements` / `Media` / `Admins`。

**`RobotSeries` と `Distributors` は①の Task 3 で追加する**（移行計画の「2026-08-08 突合結果」§D）。無ければ①が未完了。
`Robots`は`stableId`、`deploymentStage`、`sources[]`を持ち、Robot importerが`modelUrl`から作る
Sourceを受け取れることもschema contract testで確認する。

- [ ] **G-3: ①baselineを検証し、②開始時の新しい復元世代を固定する**

```bash
cat docs/reference/cutover-baseline-manifest.json  # storage識別子・署名・sha256・全recordCountsを確認
npm run content:verify-conservation -- --manifest docs/reference/cutover-baseline-manifest.json --stable-id-subset
npm run content:export -- --source payload --upload --manifest-name pre-robot-import-manifest.json
```
Expected: cosign署名、sha256、件数・ID集合・参照・公開状態が一致。最低でも
manufacturers 26 / robots 63 / robotSeries 0 / distributors 0 / useCases 44 / deployments 11 /
articles 34 / articlePlacements 7 / media実測値 / siteSettings 1を検査する。

最初の検証は**「local vs payload」ではなく「baseline artifactのstableId集合がcurrent Payloadで
保存されているか」**を`content:verify-conservation`で検査する。完全一致は②開始直前に作る
`pre-robot-import-manifest.json`だけに要求する。
baseline 本体は object storage にあり、Git には manifest（provider / bucket / objectKey /
versionId・署名・hash・全件数）だけがある
（①の Task 5でexport/upload機能を実装し、Task 9 Step 2で実artifactを固定する。
`content-platform-and-database-architecture-v2.md` §2.1
「Gitへ同じレコードを二重保存しない」に従う）。①の Task 9 で
local TS を撤去すると比較元が消れるため、① Task 9 Step 2でcutover直前に固定した署名済み
snapshotを使う。期限切れする署名付きURL自体はmanifestへ保存しない。

①のcutover baselineは、①後に正規編集があってもcurrent DBとの完全一致を要求しない。63個の
stableIdが現在DBにすべて存在し、件数差が承認済みversion履歴で説明できることを部分集合invariantとして
検証する。その後、**②開始直前のcurrent DB**をProduction private audit/backup storeへ新規exportし、
`docs/reference/pre-robot-import-manifest.json`を生成・cosign署名・sha256検証する。G-7と②rollbackが
実際に復元するのはこの新世代であり、①baselineではない。

- [ ] **G-4: 削除済みフィールドが `collections/Robots.ts` に無い**

```bash
rg -n 'buyerReadiness|marketAvailability|safetyNote|vendorRiskNote' collections/Robots.ts
```
Expected: **0件**（DEC-S05・S06）。`buyerReadiness` は `collections/UseCases.ts` には残る。

**`comparison` は検査対象に含めない。** 型に `@deprecated` が付いているが、
`components/ComparisonRobotPanel.tsx` が `robot.comparison.*` を12箇所で実表示しており、
**本計画のどの DEC も削除を決めていない**。削除するなら `/compare` の作り替えが要るため別計画。

- [ ] **G-5: 品質ゲートが緑**

```bash
npm run check
```
Expected: exit 0。**e2e の flaky 件数まで読む。** retries や verify=SUCCESS だけを見ない。

Task 1完了後は次もG-5へ追加する。

```bash
npm run verify:robot-import-manifest
npm run verify:manufacturer-import-manifest
npm run verify:robot-series-manifest
```

Expected: 原本177行、stage 177/177、product/source URL 177/177、Robot内stableId重複0、
Series 29件、Robot/Series横断の同一stableIdは承認済みtransfer 7件だけ、許可されないidentity collision 0、
同じ入力hashからbyte-identical manifestが生成される。

- [ ] **G-6: 本番と検証でDBが分かれている**

`docs/reference/content-platform-resources-v1.md`（①の Task 0 が作る）に記録された
Preview と Production の fingerprint（host / project ref / database名）を見比べ、
providerのproject/resource IDが異なることを確認したうえで、各DBの
`select environment from _environment_marker` がPreview=`preview`、Production=`production` の
**1行だけ**を返すことを確認する。host_addrはpooler/directで変わり得るため補助情報に留める。

同じ資源表にProduction / Previewそれぞれのpublic media storeとprivate audit/backup store、CI fakeの
5境界があり、別credentialであることを確認する。Preview credentialからProduction各storeへの
read/write/delete/restore負テストが全拒否にならなければ進まない。

- [ ] **G-7: 復旧手順が動く**

```bash
cat docs/reference/pre-robot-import-manifest.json
DATABASE_URL="$RESTORE_TEST_DB_URL" npm run payload:migrate
DATABASE_URL="$RESTORE_TEST_DB_URL" npm run content:restore -- --baseline-manifest docs/reference/pre-robot-import-manifest.json
DATABASE_URL="$RESTORE_TEST_DB_URL" npm run content:verify-snapshot -- --manifest docs/reference/pre-robot-import-manifest.json
```
Expected: 署名・sha256検証後に空DBへ復元でき、全collectionで差分0。exportが生成できるだけでは
G-7通過にしない。**G-3で作った同じ`pre-robot-import-manifest.json`を投入前に復元する。**
manifest名・生成時点・storage object keyがG-3と異なれば停止する。

---

## 1. 原本

CSV書き出しは使わない。セルのハイパーリンクを落とすため出典URLが消える。HTMLなら `<a href>` として残る。

| ファイル | 実データ行数 | 対応コレクション |
|---|---|---|
| `発表済みロボット.html` | 197 | `robots` / `robotSeries` |
| `導入事例＿世界地図用.html` | 41 | `deployments` |
| `代理店とか.html` | 57（1社1行） | `manufacturers`（`distributors` は §11） |
| `モデル突合マスタ（内部）.html` | 19 | 参照用（Unitreeのみ） |
| `未発表ロボット.html` | 6 | 対象外（社名のみ） |

**原本の置き場はパスで固定しない。** ブラウザは同名フォルダに連番を付けるため（`ロボDB 2`）、`npm run parse:robot-db -- --source <dir>` か環境変数 `ROBOT_DB_DIR` で指定する。既定は `~/Downloads/ロボDB 2`。

**原本はスペック表であって Deploid のコンテンツではない。** 原本が持つのは15のスペック列と
製品ページURL 1本だけ。現行Robot入力のproduct/model URLは177/177だが、`sourceUrls`、
`deploymentStage`、`summary`はすべて0/177で、安定IDも無い。Deploid側にしかないものは次のとおりで、
**原本から再生成できない**。

```
出典 581本（title / url / checkedAt / reliability）
fieldEvidence 455項目（どのスペックがどの出典に基づくか）
日本語 description 63本・summary 63本
loadRatings 51 / priceOffers 10 / 画像の権利情報 58
```

### 1.1 取り消し線 ＝ 対象外

Google Sheets の取り消し線は、HTML書き出しでは `text-decoration:line-through` を含むCSSクラスとして残る。**判定は機種名セルのみ。メーカー名セルの取り消し線は使わない。**

`Sunday Robotics` はメーカー名セルに取り消し線があるが記入ミスだった（人間が2026-08-08に確認）。`ACT-2` はロボットではなくAIモデル名で対象外、`Memo`（170cm / 77.1kg / 56 DoF）は対象内。機種名セルのみで判定すれば両方正しくなる。メーカー名セルに取り消し線があるのは1社のみで、他に影響しない。

**取り消し線は手入力の原本に対するヒューリスティックであり、絶対ではない。** この1件は実際に誤りだった。Task 1 のレポートで除外行の一覧を出し、**人が一度目を通す**。

**対象外はすべて原本側の取り消し線で表現する。コード側に除外リストを持たない。** 2026-08-07 に人間が対象外と決めた AELOS 4機は、翌日の原本更新でシート側に取り消し線が引かれた。除外条件を2箇所で持つと、原本を直しても反映されない状態が生まれる。

### 1.2 原本・正規化JSONのガバナンス

- 原本HTMLはユーザー提供物。Task 1開始前にdata ownerが提供者、取得日、利用目的、再配布可否、
  保存可否を`docs/reference/robot-import-provenance-<runId>.md`へ記録する
- 各HTML、正規化JSON一式、source metadata、enrichment manifestへsha256を付け、import manifestの
  `inputHash`から同じ入力集合を一意に追跡できるようにする
- `data/import/*.json`は移行用のderived research artifactで、Postgresと並ぶ第二のSoTではない。
  public runtimeからimportせず、accessはdata owner / importer operator / approverに限定する
- Task 10後、working copyを`docs/archive/data-import/<runId>/`のread-only archiveへ移すのは、
  利用権限がGit保存を許す場合だけ。許さない場合はGitへ追加せずProduction private audit storeへ
  署名保存し、working copyを削除する
- 保持期間はTask 10完了から365日。data ownerが法務・監査上の延長理由を承認しない限り、期限後に
  private archiveを削除する。Git履歴へ既に入ったartifactは履歴改変せず、repository accessを保持境界とする
- provenanceまたは保存権限が未確定ならparse結果をcommitせずTask 1を停止する

---

## 2. 母集団

```
197 行
 −20  機種名セルの取り消し線（§1.1）
────
177 行 / 57メーカー
```

**身長は分類軸として使わない。** 最大寸法100cm未満の16行には、上半身固定型で 65 kg・43 DoF・XHAND 1（12DoF五指）の `RobotEra M7`（79.2cm）や、可搬2〜4kg（片腕）の `Unitree R1-A5` / `R1-A7` が含まれる。いずれも業務機であり、身長で切ると誤って落ちる。効く軸はハンドと可搬。

---

## 3. 突合結果（`npm run report:robot-db-diff` で再生成できる）

**件数を手で数えない。** 現行reportのpre-series相当23項目は利用できるが、`--state`の4状態対応は
未実装。Task 1 Step 2で実装・負テストを完了するまではTask 3へ進まない。実装後は原本更新ごとに
parse→明示した`--state`の順で回し、1項目でも外れたらexit 1にする。

| | 件数 |
|---|---|
| 更新（両方にある） | **43行 → 42レコード** |
| 追加 | 134行 |
| Payload 側で一致しない | 21レコード |

`43 + 134 = 177`（母集団の行数）だが更新対象は42レコード。`apptronik-apollo-2` の1レコードにシートの2行（`Apollo 2（Biped）` / `Apollo 2（Wheeled）`）が対応するため。DEC-S01 により2レコードへ分割する。

### 3.1 最終件数

| | robots | manufacturers | robotSeries |
|---|---|---|---|
| ①完了時 | 63 | 26 | 0 |
| **Series へ移管**（Task 3〜9.5） | **−7** | — | **+7** |
| Series 新規作成（Task 3） | — | — | +22 |
| `apptronik-apollo-2` の分割（Task 7） | +1 | — | — |
| baseline追加候補のうち既存改名で吸収（Task 7） | 0（3件をcreateからupdateへ変更） | — | — |
| 新規作成（Task 9） | +131 | +33 | — |
| **本計画の完了時** | **188** | **59** | **29** |

**Task 7の改名吸収を引き忘れない。** baselineでは追加候補134行だが、`Kaleido9` / `4NE1 Gen 3.5` /
`MenteeBot V3` の3行は既存recordを改名して更新になる。Task 9のcreateは131件で、
`63 − 7 + 1 + (134 − 3) = 188`。

**移管は7件で、レポートが出す「親レコード7件」と一致する。** 当初 `ubtech-walker-tienkung`
がA群の手動リストから漏れていた。ファミリ名の接頭辞抽出（`Walker Tienkung TK2301` のような
末尾が既知の語＝EDU/Basic/Standard等でない構成名）は自動グルーピングに失敗するため、
単独の走査では検出できない。**`npm run report:robot-db-diff` の「シリーズ manifest」節が
正本**で、[メーカー, ファミリ] を手動で列挙し、現行の親レコード検出（前方一致）と
突き合わせて確定させる（23項目すべて `✓` になることを確認済み）。

A群の `R1` は **Galaxea Dynamics** のファミリで、Unitree の `unitree-r1-standard`
（B群、家名が変わる別ファミリ）とは無関係。ファミリ名だけで突き合わせると誤マッチする。

**177 は原本の行数であって最終レコード件数ではない。57 は代理店シートの行数であってメーカー件数ではない。** 混同しない。

数字の意味は本書全体で次に固定する。

| 数字 | 意味 |
|---:|---|
| 177 | 対象Robot原本行数（43 + 134） |
| 131 | Task 9の新規Robot create数（134 − Task 7改名吸収3） |
| 188 | 完了時DB Robot数（63 − 7 + 1 + 131） |
| 57 | Robot sheet内manufacturer集合、またはAgency sheet行数。使用箇所でどちらか明示 |
| 59 | 完了時DB Manufacturer総数（26 + 33） |
| 45 | Task 9の新規131件が属するaffected manufacturers数、最大transaction数 |
| 29 | RobotSeries総数 |
| 195 | Task 9完了後・Task 9.5前の中間DB Robot数 |

Task 9で新規作成する131件は `draft` で投入するため、投入直後の published は次のとおり。

```
P0 = ①完了時のpublished Robot（Task 1がDB queryで固定）
 −1  onex-eve を archived（DEC-S02）
 −7  Series へ移管（Task 3。7件すべて published。移管後は robots ではなくなる）
────
     P0 − 8 件（監査時snapshotでは49）
```

**Task 7 の Apollo 2 分割後も49件のまま。** Global Constraints「新規レコードは draft」に
従い、新規 `id` の Wheeled 側は draft で作る。既存 `id` を継承する Biped 側は published を
維持する。件数が動くのは Wheeled が昇格したときだけ。

SeriesはTask 3で29件すべてdraft作成し、Task 9.5で移管対象7件だけを同一transaction内で公開する。
残る22件はcontent ownerと`content-publisher`の承認が揃うまでdraftを維持する（Task 3.5）。

### 3.2 メーカーの3つの母集団

| 母集団 | 件数 |
|---|---|
| 代理店シートの行 | 57 |
| ロボットシートの対象内メーカー | 57 |
| 現行 `manufacturers` | 26 |

**実測**: ロボットシートの57社と代理店シートの57社は**同一集合**（Task 1 のレポートが毎回検証する）。したがって Task 9 の新規131件で dangling `manufacturerId` は発生しない（G5）。現行26社のうち代理店シートに含まれるのは24社で、含まれない `Aeolus Robotics` / `Pudu Robotics` は削除せず残す。

---

## 4. 決定事項

番号は旧計画から引き継ぐ。`data-architecture-redesign-v1.md` が DEC-S08 を名指しで参照しているため、振り直さない。欠番の `DEC-S10`（ファイル分割）は Payload では不要になったため廃止、`DEC-S11`（CMS移行より先）は方針反転により失効した。

### DEC-S01. variant は別レコードに分ける

グレード違い（同一機の構成違い）を1レコードに畳まない。

**根拠**: 既に `unitree-g1` / `unitree-g1-edu`、`agibot-a2` / `-ultra` / `-max` / `-lite` という分け方をしており、その延長になる。畳むと値が失われる。`booster-t1` に対しシートは `T1 Basic` / `T1 Standard` / `T1 Customized` の3行を持ち、バッテリー容量・プロセッサー・SDK が3行で割れている。

シートが分けている移動方式違い4組（`H2-D` / `G1-D` / `Apollo 2` / `HMND 01 ALPHA` の Standard×Flagship・Biped×Wheeled）も別レコードにする。

決定者: 人間、2026-08-07。

### DEC-S02. `onex-eve` を archived にする

`EVE Industrial` は 1X の公式製品名（`https://www.1x.tech/eve` の見出しがそのまま "Eve Industrial"。2026-08-07 確認）。ただし当該ページは見出しとnewsletterフォームのみで製品情報を持たない。レコードも `specs` が2項目だけ。シートは `EVE` に取り消し線を引き、1X の現行行は `NEO` のみ。一般販売モデルではないため archived とする。

**`deploymentStage` は `limited-production` のまま変更しない。** DEC-S07 のゲートは片方向なので archived にしても error にならず、1X が終了したという出典も無い。決定者: 人間、2026-08-07。

### DEC-S03. `japanAvailability` は代理店シートから導出する

代理店シートの「対応モデル」列は**機種単位の粒度を持つ**。メーカー単位の「日本での提供状況」と組み合わせると機種ごとに値が割れる。現行42件での一致率:

| セル | 一致率 |
|---|---|
| 国内提供未確認 / 列挙あり | `unknown` **100%**（13/13） |
| 未発売 / 列挙あり | `unknown` **100%**（3/3） |
| 入手可能 / 列挙なし | `unknown` 78%（7/9） |
| 入手可能 / 列挙あり | 41%（`inquiry-required` 7 / `unknown` 7 / `distributor-japan` 3） |

**100%のセルのみ自動確定する。** 「入手可能 / 列挙あり」の49機は人が個別に判断する（§11）。

### DEC-S04. `deploymentStage` は原本に1列追加して埋める

**シートのどこからも導出できない。**

- 代理店シート → 日本の流通状態しか持たない。一致率は最良セルで54%、「入手可能 / 列挙あり」の17件は `limited-production` 7 / `production` 4 / `pilot` 6 に三分する
- 導入事例シート → `robotId` は既存19機しか指しておらず、追加134件へのカバレッジは0
- 発表済みロボットシート → 18列すべてハードウェア仕様。成熟度の列がない

型必須なので `publishStatus` に関係なく値がないと投入できない。列仕様は §5。決定者: 人間、2026-08-07。

### DEC-S05. 「買えるか」軸の重複を解消する

`Robot` に製品の売られ方を表すフィールドが3つあり、2つが機能していなかった。

| フィールド | 充足 | コード参照 | 実態 |
|---|---|---|---|
| `deploymentStage` | 63/63 | 15箇所 | カード・比較で表示。機能している |
| `buyerReadiness` | 63/63 | 1箇所 | 型に `@deprecated`。検索テキストに混ざるだけ |
| `marketAvailability` | 42/63 | **0箇所** | 読むコードが存在しない |

**63件での実測**: `deploymentStage` を知ると `buyerReadiness` の不確実性が 37.6% 減る（H=1.3340→0.8318）。ただし `concept` / `internal-use` / `discontinued` は各 n=1 で条件付きエントロピーへ機械的に0を寄与するため、除いた n=60 では **34.7%**。約3ポイントは singleton の産物。

**逆に読めば「65%は独立情報」でもある。情報量だけでは削除を決められない。** 決め手は (1) 型に `@deprecated` が付いていること、(2) どの画面にも表示されていないこと、(3) 唯一の参照が検索テキストへの連結であることの3点。

**決定**: `collections/Robots.ts` に `buyerReadiness` と `marketAvailability` を**含めない**。`deploymentStage`（製品の成熟段階）と `japanAvailability`（日本の調達経路）の2軸に絞る。型 `BuyerReadiness` は `collections/UseCases.ts` では使う。決定者: 人間、2026-08-07。

### DEC-S06. 表示されない注記フィールドを接続する

`src` / `components` / `lib` の全走査で参照0だったもの。

| フィールド | Robot | Manufacturer |
|---|---|---|
| `supportNote` | 34/63 | **26/26** |
| `procurementNote` | — | **26/26** |
| `distributorNote` | — | **24/26** |
| `vendorRiskNote` | 1/63 | **25/26** |
| `safetyNote` | 0/63 | — |

**Manufacturer の4注記は重複していない。** 窓口 / 保守 / 見積 / リスクの4軸に分かれており、B2B調達判断ではいずれも必要。**問題は重複ではなく、約100件の記述が一度も描画されていないこと。**

**決定**: Manufacturer の4注記と `Robot.supportNote` を詳細ページに表示する。`Robot.safetyNote`（0/63）と `Robot.vendorRiskNote`（1/63）は実質空なので `collections/Robots.ts` に含めない。決定者: 人間、2026-08-07。

`distributorNote` は `domesticDistributors` と同じ事実を自由文で持つ重複。**本計画では表示に留め、`distributors` コレクションへの移行はしない**（§11）。

### DEC-S07. 陳腐化した `deploymentStage` を直し、片方向ゲートを足す

`deploymentStage` のラベルは `lib/labels.ts:84-92` を見るとすべて**現在形**（`pilot` 実証展開中 / `production` 量産・商用化 / `discontinued` 生産終了）。つまり「到達した最高段階」ではなく**現在の状態**を表す。この前提で見ると、矛盾していたのはスキーマではなく**3件の値**だった。

| レコード | 現在値 | 要約が示す事実 | 正しい値 |
|---|---|---|---|
| `fourier-gr1` | `production` | 「現行公式サイトはGR-3 Seriesへ製品導線を一本化」 | `discontinued` |
| `fourier-gr2` | `limited-production` | 同上 | `discontinued` |
| `apptronik-apollo` | `pilot` | 「製品導線は後継機Apollo 2のみ」 | `discontinued` |
| `figure-02` | `discontinued` | Figure 03 へ移行中 | そのまま |
| `onex-eve` | `limited-production` | 公式ページ現存・後継機なし | そのまま |

**決定**: `discontinued` を列挙から削除しない。3件を直す（いずれも**そのレコード自身の `summary` と `sources` が支持する**のでG2を満たす）。**片方向**のゲートを足す — `deploymentStage === 'discontinued'` ⟹ `publishStatus === 'archived'`。

**双方向にはしない。** `onex-eve` が反例。DEC-S02 で archived にするのは編集判断であって、終了の出典は無い。双方向ゲートは出典の無い `discontinued` を書かせることになりG2に反する。

`archived`（Deploid が公開しない）/ `discontinued`（メーカーが終えた）/ `supersededById`（後継機導線）は**別々の事実**である。1系統に畳まない。

### DEC-S08. `RobotSeries` を独立コレクションとして導入する

シートに variant 行しか無いのに素の名前の親レコードが残っている組み合わせが7件ある（`booster-t1`「T1」など）。そのまま134件を入れると `/robots` に「T1」「T1 Basic」「T1 Standard」「T1 Customized」が4件並ぶ。

**`archived` で凌ぐ案は撤回した。** `archived` は UI で「提供終了」として描画される（`robots/[slug]/page.tsx:116-119`、`robotDisplay.ts:55-58`、検索索引からも除外）。T1 は現行機なので**事実として誤り**。DEC-S07 で `archived` と `discontinued` を分離した直後に第3の意味を足すのは、同じ混線を作り直すことになる。

**useCase がシリーズを指すべき根拠（実測）**: 7件を参照する候補14件は**例外なく `basis: 'official-use-case'` で、根拠URLはすべてシリーズ単位の製品ページ**だった（`booster.tech/booster-t1/`、`engineai.com.cn/product-t800.html` 等）。variant 固有のページを引いているものは1件も無い。

**判別フィールド（`recordKind`）案も撤回した。** `Robot` の型必須17件のうち、シリーズに**答えが存在しない**ものが2つある（`deploymentStage` と `specs`）。任意フィールドの判別子は型で守れず、一覧を作る側が毎回フィルタを思い出す必要がある。

**入れ子（`Robot.configurations[]`）も採らない。** 構成が2件以上の28ファミリでどのスペックが割れるか測ると、特定の数項目ではなく**ほぼ全項目に散っていた**（`computePlatform` 20/28、`dof` 18/28、`handType` 18/28…）。「共通はファミリ、差分だけ構成」が成立せず、構成は結局フルのスペックを持つ。

**決定**: 製品ファミリ（シリーズ）と構成（SKU）を別コレクションにする。

```
RobotSeries: name, nameJa?, manufacturerId, description?, images?, industryTags?, taskTags?
             + BaseRecord。スペックも価格も持たない
Robot:       seriesId?: Id を追加。構成が割れるファミリのみ設定する（任意）
```

`seriesId` を任意にするのは、1構成しかない106機にまでシリーズを作ると 1:1 レコードが106件増え、そのすべてが公開ゲート（`sources` 必須・G2）の対象になるため。

**対象29件は性質が2つに分かれる。**

| | 件数 | 内容 | 目的 |
|---|---|---|---|
| **A** | 15 | ファミリ名が機種として存在しない（`T1` `K1` `T2` `T800` `PM01` `G1-D` `H2-D` `Walker Tienkung` `A2` `4NE1` `KUAVO 4PRO` `KUAVO 5` `Oli` `Bumi` `R1`(Galaxea Dynamics)） | **正しさ。** いま useCase・article が誤表示になる |
| **B** | 14 | ファミリ名が機種としても存在する（`G1` `H2` `R1`(Unitree) `Apollo 2` `X2` `Walker S` `GR-3C` `KUAVO 5-W` `TIAGo` `DR02` `Z1` `N2` `E1` `HMND 01 ALPHA`） | **将来のUI。** 参照は今も正しく表示される |

**B は正しさの問題ではない。** 3段カスケード（§11）の下地として先に置く。

`UseCase.candidateRobots[]` に `seriesId?` を足し、**`robotId` と `seriesId` のどちらか一方だけ**を持たせる。

| 画面 | 出るもの |
|---|---|
| `/robots`・`/compare`・Home・`/manufacturers/[slug]`・検索 | **Robot（構成）のみ** |
| `/robots/[slug]`（Series） | 「提供終了」ではなく**構成一覧** |
| `/use-cases/[slug]` の候補 | `seriesId` ならシリーズ、`robotId` なら構成 |

決定者: 人間、2026-08-08。

### DEC-S09. 複合的な移動方式は `hybrid` にする

1行の中に別カテゴリの移動方式が書かれている行が2つある（`NEURA 4NE1 Gen 3.5` = 二足／車輪／固定7軸、`RoboForce TITAN` = 履帯／車輪）。`mobility` は単一値なので入りきらない。

**決定**: `MobilityType` に既にある `hybrid` を使い、内訳は `description` に書く。構成ごとに分ける案は採らない — **シートが分けていないため構成別のスペックが存在せず、分けても中身を埋められない**。

`PAL TIAGo`（車輪：差動／全方向）と `Rainbow RB-Y1`（車輪：差動／メカナム）は `wheeled` の下位区分なので分割不要。決定者: 人間、2026-08-08。

### DEC-S13. `scopeStatus` と `evidenceLevel` は追加しない（★新規）

`robot-data-factcheck-impl-plan-2026-07-01.md`（`docs/archive/`）Phase C の残タスク。**どちらも見送る。**

**`scopeStatus`**（`in-scope` / `borderline` / `research-only` / `out-of-scope` / `needs-confirmation`）
→ **原本の取り消し線が既にこの役割を果たしている**（§1.1）。対象外の行はそもそも投入しないので、レコード側に状態を持つ必要がない。持つと「原本の取り消し線」と「レコードの `scopeStatus`」の2箇所で同じ判断を管理することになる。

**`evidenceLevel`**（`official-product-page` / `official-press-release` / … / `unverified`）
→ `evidenceLevel`は「根拠媒体の種類」、`Source.reliability`は「そのSourceの確からしさ」であり、
**同じ概念ではない**。今回はevidenceLevelのconsumer、媒体分類基準、判定責任者、581 Sourceへ
適用する運用が確立していないため追加を見送る。必要性が生じたら、`Source.reliability`の値を
増やすのではなく、consumerと判定基準を定める別decisionで独立fieldとして再検討する。

決定者: 人間、2026-08-08。

### DEC-S12. 画像・ロゴはこの計画の対象外

`docs/decisions/data-maintenance-checklist-v1.md` §F の Robot 公開ゲートで、画像は「未ローカル化なら warning」であり必須ではない。`src: ''` は valid。現行63機のうち44機が既に `src: ''`。

画像調達（`robot-image-sourcing-plan-v1.md`）は本計画をブロックしない。新規レコードは `src: ''` で投入する。

---

## 5. 原本へ追加する1列（人間の作業）

`発表済みロボット` シートに `deploymentStage` を1列追加する。対象は177行。うち43行は現在の値を転記できるため、判断が要るのは**134行**。

貼り付け用の TSV は Task 1 で生成する（197行、取り消し線の行は「対象外」で埋め、参考列に提供状況・対応モデル列挙・スペック充足・製品URLを付ける）。

### 5.1 値と判定手順

| 値 | 意味 |
|---|---|
| `concept` | 発表・コンセプトのみ。実機の存在が確認できない |
| `prototype` | 試作機が存在するが外部提供はない |
| `pilot` | 顧客・パートナー先での実証段階 |
| `limited-production` | 少量生産・限定販売 |
| `production` | 量産・一般販売 |
| `internal-use` | 自社内利用のみ |

`discontinued`（生産終了）は選ばない。177行はすべて「発表済み＝現行HPで確認できるモデル」であり、提供終了が判明した機体はシート側で取り消し線を引く。

現行63件の分布（較正の目安）: `limited-production` 23 / `pilot` 20 / `production` 12 / `prototype` 5 / `internal-use` 1 / `concept` 1

公式製品ページを開いて、上から順に最初に当てはまったところで確定する。

1. 自社工場・自社サービス内での使用しか書いていない → `internal-use`
2. オンラインストアに価格があってカートに入る → `production`
3. 価格はあるが問い合わせ購入・受注生産・限定台数 → `limited-production`
4. 「予約受付」「Reserve」「Pre-order」 → `limited-production`
5. 購入導線はないが、顧客名を挙げた導入・実証の発表がある → `pilot`
6. 実機のデモ映像とスペック表はあるが、購入導線も導入事例もない → `prototype`
7. 発表だけで実機の映像がない → `concept`
8. 後継機ページへ飛ばされる／製品ページが消えている → シート側で取り消し線を引く

### 5.2 その他のフィールド

| フィールド | 原本から埋まるか |
|---|---|
| `stableId` / `slug` / `name` / `manufacturerId` | 現行JSONにはstableIdが無い。Task 1のmanifest builderが決定的に導出する |
| `sources` | 現行JSONの`modelUrl`は177/177、`sourceUrls`は0/177。Task 1で`modelUrl`をRobot `sources[]`へ変換する |
| `category` | 移動方式から導出（`固定スタンド`→`upper-body-humanoid`、`車輪`＋双腕→`mobile-manipulator`、`二足`→`humanoid`） |
| `japanAvailability` | 代理店シートから（DEC-S03） |
| `summary` | 列がない。日本語1〜2文を原本の値と出典に基づいて書く |
| `deploymentStage` | 現行JSONは0/177。Task 1でヘッダー名から読む実装と人手入力を追加する（DEC-S04） |

Task 9は現行JSONを直接入力にしない。Task 1が生成・署名するimmutable import manifestだけを入力とし、
manifestの各行は`sourceRow`、`inputHash`、`stableId`、`action: create|update|split`、
`manufacturerId`、`seriesId|null`、`productUrl`、`deploymentStage`を必須とする。署名後に原本・JSON・
source metadataのhashが変わった場合はmanifestを再生成・再承認し、既存manifestへ追記修正しない。

---

## 6. File Structure

### 既に存在するもの（①の前に実装済み。作り直さない）

| Path | 責務 |
|---|---|
| `scripts/parse-robot-db.ts` | HTML → 正規化JSON。取り消し線判定・結合セル前方補完・`<a href>` 抽出 |
| `scripts/report-robot-db-diff.mjs` | 突合レポート。期待値23項目を機械照合 |
| `data/import/robots.json` / `manufacturers.json` / `deployments.json` | 正規化結果 |
| `tests/unit/data/parse-robot-db.test.ts` | パーサの単体テスト17件 |

上表は現状を示す。`parse-robot-db.ts`はRobot stableId / deploymentStage / sources契約をまだ持たず、
Task 1で変更するまでTask 9の入力として使えない。

### 新規作成

| Path | 責務 |
|---|---|
| `scripts/import-robot-db-to-payload.mts` | 正規化JSON → Payload Local API。冪等 |
| `scripts/build-robot-import-manifest.mts` | 177行のstableId / action / hashを固定 |
| `data/import/robot-import-manifest.json` | Task 9が読む署名前working manifest。署名後は変更禁止 |
| `scripts/build-manufacturer-import-manifest.mts` | 原本57メーカーとPayload baselineを決定的に照合 |
| `data/import/manufacturer-import-manifest.json` | 57メーカーのcanonical identity / stableId / actionを固定 |
| `scripts/build-robot-series-manifest.mts` | 29 Series、移管7件、全variant所属を決定的に固定 |
| `data/import/robot-series-manifest.json` | Task 3 / 9 / 9.5が共通で読むSeries identity正本 |
| `data/import/content-enrichment-manifest.json` | 新規131件の本文・出典・権利・承認状態 |
| `data/import/manufacturer-content-enrichment-manifest.json` | 新規33メーカーの本文・出典・権利・承認状態 |
| `data/import/robot-series-content-manifest.json` | Series 29件の本文・出典・権利・公開承認を固定 |
| `scripts/update-existing-robots.mts` | Task 6のversioned draft作成・公開 |
| `scripts/apply-robot-identity-corrections.mts` | Task 7の改名・archive・split |
| `scripts/import-robot-deployments-manufacturers.mts` | Task 8のversioned import |
| `lib/payload/auditedBatch.ts` | transaction / actor / version / outbox audit共通契約 |
| `lib/payload/contentChangeOutboxWorker.ts` | 暗号化before-imageのprivate store配送・再送 |
| `migrations/*-content-change-outbox.ts` | before-imageをcommitと同時に耐久化するoutbox |
| `tests/content/robot-db-import.test.ts` | 投入結果の検証 |

### 変更

| Path | 変更内容 |
|---|---|
| `scripts/report-robot-db-diff.mjs` | 突合先を `localContentSnapshot` から Payload へ切り替える |
| `collections/Robots.ts` | `discontinued` ⟹ `archived` の片方向 validation（DEC-S07） |
| `collections/RobotSeries.ts` | シリーズの validation（`seriesId` の向き・slug 横断一意） |
| `collections/UseCases.ts` | `candidateRobots[].seriesId` の排他 validation（DEC-S08） |

### 変更しない

`lib/specSchema.ts` / `lib/tagRegistry.ts` — Git 管理を継続する（`content-platform-and-database-architecture-v2.md` §5.2）。編集者が新しいスペックキーを自由追加できる構成にはしない。

---

## 7. Tasks

### Task 1: parser契約とimmutable import manifestを作り、突合先をPayloadへ切り替える

**Files:**
- Modify: `scripts/parse-robot-db.ts`
- Modify: `tests/unit/data/parse-robot-db.test.ts`
- Create: `scripts/build-robot-import-manifest.mts`
- Create: `tests/unit/data/robot-import-manifest.test.ts`
- Create: `data/import/robot-import-manifest.json`
- Create: `scripts/build-manufacturer-import-manifest.mts`
- Create: `tests/unit/data/manufacturer-import-manifest.test.ts`
- Create: `data/import/manufacturer-import-manifest.json`
- Create: `scripts/build-robot-series-manifest.mts`
- Create: `tests/unit/data/robot-series-manifest.test.ts`
- Create: `data/import/robot-series-manifest.json`
- Modify: `scripts/report-robot-db-diff.mjs`
- Create: `tests/unit/data/report-robot-db-diff.test.ts`
- Modify: `package.json`（`build:source-metadata`）
- Create: `scripts/build-source-metadata.mts`
- Create: `data/import/source-metadata.json`
- Test: `tests/unit/data/source-metadata.test.ts`
- Create: `~/Downloads/ロボDB 2/stage-deployment-paste.tsv`

- [ ] **Step 0: Robot parserの不足契約をtest-firstで追加する**

現行の`robots.json`にはstableId / deploymentStage / sourceUrlsが無い。次を単体testへ追加してから
parserを変更する。

1. `deploymentStage`は固定列番号でなく、空白・改行を正規化したヘッダー名で探す。headerが0件または
   2件以上なら列ずれを推測せずexit 1
2. strict import modeでは対象177行のstageを許可enumとして読み、空・未知値・取り消し線対象への
   値混入を行番号付きで拒否する。`--prepare-stage-template`だけは列未作成を許し、TSV生成以外の
   正規化JSONを成果物として出さない
3. Robotの`modelUrl`を`productUrl`として保持し、Task 9 mapperが1要素以上のPayload `sources[]`へ
   変換する。manufacturerの複数URL処理とRobot source契約を混同しない
4. HTMLの1-based sheet rowを`sourceRow`として保持し、canonical row JSONのsha256を`inputHash`にする

```bash
npm run test -- tests/unit/data/parse-robot-db.test.ts
```

Expected: header移動でもstageを読める、strict modeはheader欠落/重複・stage空/未知値がFAIL、
template modeだけが未入力を許可、productUrl 177/177。

- [ ] **Step 1: 最新の原本をパースする**

```bash
npm run parse:robot-db -- --prepare-stage-template ~/Downloads/ロボDB\ 2/stage-deployment-paste.tsv
```
Expected: strict import用JSONは更新せず、197行のTSV素材とproductUrl 177/177を出す。

- [ ] **Step 2: 突合先を Payload へ切り替える**

**source の差し替えだけでは済まない。** 現在の `scripts/report-robot-db-diff.mjs` は
`lib/data/localContentSnapshot.ts` を同期で読む約280行の script。次が要る。

1. repository の非同期 query への書き換え（`await` 化、接続失敗時の扱い）
2. **`--state` 引数で期待値セットを切り替える。** 同じコマンド・同じ期待値のままでは
   「cutover前は参照20件が正しい」「cutover後は0件が正しい」を区別できず、Task 3〜9.5 の
   どこかで**自ら失敗する**（新規finding 7）。4状態を CLI 引数で明示指定する（自動判定はしない
   — 「今どの Task の後のはずか」を呼び出し側が知っているため、誤検出より明示指定が安全）。

   | `--state` | 呼び出す Task | robots | robotSeries | 参照（robotId向き） |
   |---|---|---|---|---|
   | `pre-series` | Task 1 Step 3 | 63 | 0 | 20（robotId） |
   | `series-created` | Task 3 Step 5 | 63 | 29（全draft） | 20（robotId・不変） |
   | `imported` | Task 9 Step 5 | 195 | 29（全draft） | 20（robotId・不変） |
   | `cutover` | Task 9.5 Step 3/完了確認 | 188 | 29（published 7・draft 22） | 0（旧移管ID向き。Articleは代表variantのrobotIdを維持） |

   各 state は下表の全期待値を独立して持つ（`EXPECTATIONS[state]`）。`--state` 未指定は
   error で終了する（default値による誤判定を防ぐ）。

   | 検査 | pre-series | series-created | imported | cutover |
   |---|---:|---:|---:|---:|
   | 原本 / 除外 / 対象 / 対象メーカー | 197 / 20 / 177 / 57 | 同左 | 同左 | 同左 |
   | 代理店シート行 / maker集合一致 | 57 / true | 同左 | 同左 | 同左 |
   | DB manufacturers / シート内既存 / 完了見込 | 26 / 24 / 59 | 26 / 24 / 59 | 59 / 57 / 59 | 59 / 57 / 59 |
   | DB robots | 63 | 63 | 195 | 188 |
   | 一致行 / 一致robot / 追加 / orphan | 43 / 42 / 134 / 21 | 同左 | 177 / 177 / 0 / 18 | 177 / 177 / 0 / 11 |
   | 移管元Robotの存在 / 旧ID向き参照 | 7 / 20 | 7 / 20 | 7 / 20 | 0 / 0 |
   | cutover後robots見込 | 188 | 188 | 188 | 188 |
   | DEC-S08 decision manifest / Series実在 | 7 / 0 | 7 / 29 | 7 / 29 | 7 / 29 |
   | Task 7改名decision manifest / 未適用候補 | 3 / 3 | 3 / 3 | 3 / 0 | 3 / 0 |

   **旧移管IDは現在のRobotから再推定しない。** Task 1で固定するimmutable manifestの7 stableId
   （`booster-t1` 等）を全stateで使う。cutover後に元Robotが消えても、同じ7 IDへの参照を走査する。
   これを現在存在する親Robotから組み立てると空集合になり、参照が残っていても0件で緑になる。

   matched/additions/orphanも単に期待値だけ差し替えず、DB stateに対して再計算する。`imported` では
   Task 7の改名3件とApollo分割を経て177行すべてが既存recordへ一致し、追加候補は0になる。
   Task 9が実際にcreateするのはbaseline追加候補134−改名吸収3=131件。Series候補・親判断はDBの存在から
   再推定せず、次項のimmutable Series manifestと照合する。
3. fixture 注入（テストから Payload を立てずに走らせる経路）
4. 出力契約の更新

**Step 2 は独立した実装単位として扱い、Step 3の23期待値が緑になった時点で
`scripts/report-robot-db-diff.mjs` とfixture testを先にcommitする。** Step 5のTSV生成は
Step 6のsource metadataとまとめ、入力・人手確認の単位としてStep 7で別commitにする。

```bash
git add scripts/report-robot-db-diff.mjs tests/unit/data/report-robot-db-diff.test.ts
git commit -m "feat(data): add state-aware robot import audit"
```

- [ ] **Step 3: 検算**

```bash
npm run report:robot-db-diff -- --state pre-series
```
Expected: exit 0、23項目すべて `✓`。母集団177 / 一致43行(42レコード) / 追加134 / 一致しない21 / メーカー完了時59 / DEC-S08 の親レコード7 / Series所属74行 / 重複0 / 改名3件。

**`--state` 未対応のまま Task 3 以降へ進むと自ら失敗する。** Series 移管（Task 3）と
Apollo 2 分割（Task 7）で件数が動くため、Task 1 Step 2 の `--state pre-series` 固定値を
Task 3 以降でもそのまま使い続けない — 各 Task は自分の状態に対応する `--state` 値を渡す
（Task 1 Step 2 の対応表）。

**数字が合わない場合、§2〜§3 を直す前に正規化規則の取りこぼしを疑う。**

- [ ] **Step 4: 除外行の一覧を人が確認する（§1.1）**

レポートの「除外した行」20件に目を通す。取り消し線はヒューリスティックで、`Sunday Robotics` で実際に記入ミスが見つかっている。

- [ ] **Step 5: `deploymentStage` 記入用TSVを生成する**

197行、シートと同じ行順。43行は現在の値を転記済み、取り消し線の行は「対象外」。参考列に提供状況・対応モデル列挙・スペック充足・製品URL。

data ownerが134行を記入し、reviewerが全行を確認して原本の`deploymentStage`ヘッダー列へ戻す。
担当者、reviewer、期限をTSV headerとprovenance文書へ記録する。134行のreviewが終わらなければ
Step 5.5へ進まず、代替の推測値を入れない。

- [ ] **Step 5.5: strict再parse後、177行のstableIdとactionをimmutable manifestへ固定する**

```bash
npm run parse:robot-db -- --out data/import
```

Expected: `robots.json` 197件 / `manufacturers.json` 57件 / `deployments.json` 41件。対象177行の
productUrl / stage / sourceRow / inputHashが全件非空。

まず`build-manufacturer-import-manifest.mts`がDB baselineと`manufacturers.json`を照合し、57行を
次のimmutable契約で固定する。

```ts
interface ManufacturerImportManifestRow {
  sourceRow: string;
  inputHash: string;
  canonicalName: string;
  stableId: string;
  action: 'create' | 'update';
  matchedPayloadId: string | null;
  aliases: string[];
}
```

- baselineとcanonical name/承認済みaliasで一致する24件は、現在のstableIdを`update`として維持する
- 新規33件は`${slugify(canonicalName)}`をstableId候補にし、baseline ID、canonical name、alias、
  slugify結果の衝突を全件で検査する。衝突時は自動suffixを付けず、人間がalias/canonical identityを承認する
- 原本外のbaseline 2メーカーは削除せず、manifest対象外として残す。完了時は26+33=59件
- Robot manifestの`manufacturerId`はこのmanifestのstableIdだけを参照し、名前から独自に再発番しない

次に`build-robot-series-manifest.mts`が§3の29 Series、移管元7 stableId、全variant所属を固定する。
その後`build-robot-import-manifest.mts`はDB baseline、Robot正規化JSON、署名済みManufacturer manifest、
署名済みSeries manifestを入力に次を出す。Task 3で初めてSeries manifestを作る循環は禁止する。

```ts
interface RobotImportManifestRow {
  sourceRow: string;
  inputHash: string;
  stableId: string;
  action: 'create' | 'update' | 'split';
  manufacturerId: string;
  seriesId: string | null;
  productUrl: string;
  deploymentStage: DeploymentStage;
}
```

- 既存一致42 recordは現在のstableIdを維持する
- 新規は`${manufacturerId}-${slugify(canonicalModelName)}`。slugify版とmaker内canonical nameの双方を
  collision checkし、異なるsourceRowが同じIDになる場合は自動suffixを付けず停止する
- Apollo 2 Bipedは既存`apptronik-apollo-2`を`update`、Wheeledは
  `apptronik-apollo-2-wheeled`を`split`として固定する。分割の再実行で別IDを発番しない
- Task 7で改名吸収する3行は既存stableIdを`update`とし、Task 9 createへ数えない

manifest全体へ入力集合hash、generator version、generatedAt、cosign署名、Production private audit storeの
永続object keyを付ける。署名後のJSONは変更禁止で、変更時は新run IDで再生成する。byte-identical性の
比較では`generatedAt`を署名対象payloadの外へ出す。

```bash
npm run build:manufacturer-import-manifest
npm run build:robot-series-manifest
npm run build:robot-import-manifest
npm run verify:manufacturer-import-manifest
npm run verify:robot-series-manifest
npm run verify:robot-import-manifest
```

Expected: Manufacturer rows 57（update 24 / create 33）、stableId/canonical/alias collision 0。
Series rows 29（transfer 7 / new 22）、variant所属74行、重複所属0。
Robot rows 177、actionはupdate 45 / create 131 / split 1、stage 177/177、product/source URL
177/177、stableId 177/177、不明manufacturerId 0、重複0、Task 9 affected manufacturers 45、
同じ入力から同じrows/hash。

- [ ] **Step 6: Source metadata正本を生成・確認する**

Robot正規化JSONの全`productUrl`、manufacturerのURL配列、baseline snapshotの既存`sources[]`を入力に、URL keyの
`data/import/source-metadata.json` を生成する。既存URLは既存title/reliability/checkedAtを維持し、新規URLは
title、checkedAt、`verified|official|reported|estimated`のいずれかを人が確定する。空欄を許さない。

```bash
npm run build:source-metadata
npm run test -- tests/unit/data/source-metadata.test.ts
```

Expected: URL集合のmissing 0 / extra 0、Robot productUrl 177/177、空title / checkedAt 0、
未来日0、許可外reliability 0。

- [ ] **Step 7: コミット**

```bash
git add package.json scripts/parse-robot-db.ts scripts/build-manufacturer-import-manifest.mts scripts/build-robot-series-manifest.mts scripts/build-robot-import-manifest.mts scripts/build-source-metadata.mts data/import/manufacturer-import-manifest.json data/import/robot-series-manifest.json data/import/robot-import-manifest.json data/import/source-metadata.json tests/unit/data/parse-robot-db.test.ts tests/unit/data/manufacturer-import-manifest.test.ts tests/unit/data/robot-series-manifest.test.ts tests/unit/data/robot-import-manifest.test.ts tests/unit/data/source-metadata.test.ts
git commit -m "chore(data): prepare reviewed robot import metadata"
```

**完了条件:** `npm run report:robot-db-diff -- --state pre-series` がexit 0。TSVの記入対象134行、
Manufacturer manifest 57行（24 update / 33 create）、Robot manifest 177行、stage 177/177、
Series manifest 29行（7 transfer / 22 new）、product/source URL 177/177、Robot内stableId重複0、
Robot/Series横断の同一stableIdはtransfer 7件だけ、
不明manufacturerId 0、determinism一致、
source metadata missing/extra 0。

---

### Task 1.5: 新規Robot・Manufacturer・Seriesのcontent enrichmentを管理する

**Files:**
- Create: `data/import/content-enrichment-manifest.json`
- Create: `data/import/manufacturer-content-enrichment-manifest.json`
- Create: `data/import/robot-series-content-manifest.json`
- Create: `scripts/verify-content-enrichment.mts`
- Test: `tests/unit/data/content-enrichment.test.ts`

新規Robotをdraft保存できる最低条件と、公開できる品質条件を分ける。

| 区分 | 必須項目 |
|---|---|
| draft import必須 | stableId、name、manufacturerId、deploymentStage、product URL由来sources、source metadata、input hash |
| publish必須 | 日本語summary、description、根拠source、`checkedAt`、`updatedAt`、source reliability、権利確認、japanAvailability判断、approver |

manifestは131 stableIdごとに`author`、`approver`、`dueAt`、根拠source URL、summary、description、
rightsReview (`approved|blocked`) 、status (`not-started|drafted|reviewed|publish-ready`)を持つ。
content ownerが担当割当と期限を確定し、source metadata reviewerがreliability、rights ownerが引用・画像・
説明文の利用権限、`content-publisher`が最終承認を担当する。外部サイトの説明文をそのままコピーせず、
事実だけを複数sourceと照合して日本語で独自要約する。

同じ契約でSeries 29件を`robot-series-content-manifest.json`へ固定する。移管7件は元Robotの
summary / description / sources / images / tagsをfield単位で継承候補として記録し、Seriesとして不適切な
variant固有のスペック・価格・入手性を除く。content ownerとrights ownerが転記・画像権利・出典を再確認し、
`content-publisher`が7/7を`publish-ready`に承認するまでTask 9.5を停止する。残り22件はdraftのままでよいが、
担当・期限・根拠source・状態を持ち、空のSeriesを将来誤公開できないよう同じgateへ通す。

新規Manufacturer 33件も`manufacturer-content-enrichment-manifest.json`へ固定する。代理店シートは
provider情報とURLを持つだけで、Manufacturer公開ゲートのsummary / description / sources / rights判断を
満たす本文ではない。各stableIdに独自要約、公式企業source、checkedAt、rightsReview、author、approver、
dueAt、statusを持たせ、33/33がpublish-readyになるまではTask 8でdraft作成まで許可してもpublishしない。
既存24件は現行公開本文を維持し、承認された差分だけをversioned draftへ当てる。

```bash
npm run verify:content-enrichment
```

Expected: Robot manifest 131件、Manufacturer manifest 33件、Series manifest 29件、
担当・approver・期限の空欄0、根拠URL missing 0、
rights blocked件数、publish-ready件数、未完了件数を出す。移管Seriesは7/7 publish-ready。
Task 9はdraft import必須を満たせば開始できるが、公開促進は
各recordがpublish-readyになるまで拒否する。Task 10の完了報告へ両件数を載せる。

**停止条件:** owner / approver /期限が未確定、または根拠source・権利判断が無いrecordは
publish-readyにせず、推測で埋めない。

---

### Task 1.75: 全データ変更に先立ち監査付きbatch基盤を作る

**Files:**
- Create: `lib/payload/auditedBatch.ts`
- Create: `lib/payload/contentChangeOutboxWorker.ts`
- Create: `migrations/*-content-change-outbox.ts`
- Test: `tests/content/audited-batch.test.ts`
- Test: `tests/content/content-change-outbox-encryption.test.ts`

Task 2以降の変更を先に始めない。`runAuditedBatch`、versioned draft、署名済みapproval manifest、
transactional outbox、private audit store配送を共通実装し、Task 2 / 3 / 6 / 7 / 8 / 9 / 9.5が
同じ入口を使う。Admin UIでの直接一括変更や個別scriptの独自監査実装は禁止する。

outboxのbefore-imageはAES-256-GCMでapplication-level envelope encryptionする。data keyを
`AUDIT_OUTBOX_KMS_KEY_ID`のKMS keyで暗号化し、DBにはciphertext / nonce / auth tag /
encrypted data key / KMS key versionだけを保存する。署名keyと暗号化keyを分離し、生data keyをenvやlogへ
出さない。tamper、誤environment、旧key versionからの復号、rotation後の新旧再送、配送失敗後の冪等再送を
testする。復号不能またはProduction private storeへの配送未完了ならpublishを拒否する。

```bash
npm run payload:migrate:create -- content-change-outbox
DATABASE_URL="$RESTORE_TEST_DB_URL" npm run payload:migrate
npm run test -- tests/content/audited-batch.test.ts tests/content/content-change-outbox-encryption.test.ts
```

Expected: up/down/re-up成功。失敗注入時にdomain変更とoutbox insertがともにrollbackし、暗号文改ざんは
復号拒否、KMS rotation前後のartifactは双方復元可能、同じrun IDの再送はobject重複を作らない。

---

### Task 2: 陳腐化した `deploymentStage` の修正と片方向ゲート（DEC-S07）

**Files:**
- Modify: `collections/Robots.ts`
- Create: `scripts/update-discontinued-robot-stages.mts`
- Test: `tests/content/discontinued-publish-status.test.ts`
- Test: `tests/content/update-discontinued-robot-stages-rollback.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`discontinued`かつdomain `published`（Payloadではpublished+active）をerrorにする。**domain
`archived`（Payloadではpublished+archived）かつ`discontinued`以外をerrorにしないtestも書く**
（`onex-eve`。双方向gateへの退行を防ぐ）。

- [ ] **Step 2: 失敗を確認 → 片方向 validation を実装 → PASS**

- [ ] **Step 3: 監査付きversioned draftで陳腐化した3件を直す**

`fourier-gr1` / `fourier-gr2` / `apptronik-apollo` を `discontinued` へ。根拠は各レコード自身の `summary`。`sources[].checkedAt` と `updatedAt` を更新する。
Task 1.75の`runAuditedBatch`を使い、3件のbefore-imageとversion IDをoutboxへ同一transactionで保存する。
配送後、承認manifestが指すdraft version ID・hashが各docの最新draftと一致することを検査し、
`publishApprovedVersion()`でそのversionだけを公開する。statusだけを更新するpublishは禁止する。

- [ ] **Step 4: ゲートが赤くなることを確認（Global Constraints）**

`fourier-gr1` の `publishStatus` を一時的に `published` に戻す。Expected: **検証が exit 1**。確認できたら戻す。**この確認をせずに次へ進まない。**

失敗注入で3件とoutboxが開始状態へ戻ること、古いversion IDのapprovalが拒否されることも確認する。

**完了条件:** 3件が `discontinued`、意図的な違反で検証が exit 1、`onex-eve` が error にならず、
監査artifactと公開version hashが一致する。

---

### Task 3: シリーズ29件を作る（DEC-S08）

**Files:**
- Consume: `data/import/robot-series-manifest.json`（Task 1で署名済みの29 Series identity正本）
- Create: `scripts/create-robot-series.mts`
- Create: `docs/reference/create-robot-series-<日付>.json`（要約audit artifact）
- Modify: `collections/RobotSeries.ts`（validation）

- [ ] **Step 1: Task 1のSeries manifestをDB stateに対して再検証する**

Task 1で構成候補をA/Bへ分類し署名した`data/import/robot-series-manifest.json`を消費する。
**29件を手で書き写したり、このTaskで再発番しない。** ファミリ推定は接頭辞処理だけでは失敗する
（`Walker Tienkung` の実例）ため、署名、入力hash、generator version、現在DBの移管元7件を再検証する。

```ts
interface RobotSeriesManifest {
  generatedFromSha256: string;
  transferRobotStableIds: string[];
  series: Array<{
    stableId: string;
    makerStableId: string;
    family: string;
    group: 'A' | 'B';
    transferFromRobotStableId: string | null;
    variantStableIds: string[];
  }>;
}
```

`transferRobotStableIds` は次の7件で固定する：`booster-t1` / `booster-k1` /
`engineai-t800` / `engineai-pm01` / `unitree-g1-d` / `ubtech-walker-tienkung` /
`agibot-a2`。`generatedFromSha256` はparse対象の正規化JSON一式をkey順にserializeして計算する。
移管7件のSeries stableIdは`transferFromRobotStableId`と同じ値を引き継ぐ。これはRobot→Seriesという
型移行であり、旧stableIdを消して新IDへ対応付ける変換にはしない。新規22件だけを
`robot-series-${makerStableId}-${slugify(family)}`で決定的に発番し、再生成で変化しないことを
fixture testで固定する。同じstableIdがRobotとSeriesに一時共存するのはTask 9.5まで許容するが、
公開route ownershipは①の`content_route_registry`で常に一方だけにする。

レポートは、Series 29件、各Seriesのvariant件数とstableId集合、全variantの重複所属0、
対象variantの未所属0、移管元7件、旧ID向き参照20件をassertする。総数29だけのassertでは通さない。

- [ ] **Step 2: 失敗するテストを書く → validation とroute registry連携を実装**

`seriesId` が `robotSeries` の実在レコードを指すこと / `slug` が①の`content_route_registry`で
`robots` と横断一意であること / シリーズが `priceOffers` を持たないこと。Robot/Seriesの同時claimを
並行実行し、一方だけ成功するDB integration testを含める。**「構成を1件以上持つ」は Task 9 まで warning**
（この時点では variant が未投入のため）。

- [ ] **Step 3: 29件を作る**

**内訳は 29 = A群15 + B群14。**

| | 件数 | 扱い |
|---|---|---|
| A群のうち既存 Robot がある（移管） | 7 | 元Robotの`stableId`を継承、**`slug` は一時値**（下記） |
| A群のうち既存 Robot が無い（新規） | 8 | 構成がすべて新規追加分のため |
| B群（新規） | 14 | ファミリ名が機種と衝突するため `unitree-g1-series` のような slug を新設 |

**`npm run report:robot-db-diff -- --state series-created` の「シリーズ manifest」節が29件すべてを機械照合する
（A群移管7・A群新規8・B群14・参照20件・完了時188件）。手で書き写さない。**

`scripts/create-robot-series.mts` はmanifestと`robot-series-content-manifest.json`を読み、29件のSeries
upsertと、すでに存在する姉妹Robotへの
`seriesId` 設定を1 transactionで行う。Seriesは `_status: 'draft'`, `draft: true` とする。
`--dry-run` はSeries create/update/noop件数とRobot relationship update件数を表示し、本実行はrun ID、
manifest hash、29 Series stableId、更新Robotのbefore-image、before/after件数をProduction private audit/backup storeの
audit artifactへ残す。Gitの要約artifactはprovider / bucket / objectKey / versionId / sha256 / cosign署名と
対象stableId・件数だけを持ち、before-image本体を含めない。
2回目の実行が全件noopになり、重複を作らないことをテストする。失敗注入でSeries作成とRobot更新の
両方がrollbackすることも確認する。
すべてTask 1.75の`runAuditedBatch`を通し、実行actor、version IDs、暗号化outbox、route registry変更を
同一transactionへ含める。独自transactionだけで変更するscriptを許可しない。

移管7件は承認済みcontent manifestからsummary / description / sources / rights確認済み画像・タグを設定し、
残り22件もmanifestのdraft内容だけを使う。公開ゲートは Manufacturer と同じ水準（`id` / `slug` /
`name` / `manufacturerId` / `summary` / `sources` 非空）。`sources` はメーカーのシリーズ製品ページ。

**移管7件のstableIdは既存Robotから引き継ぐ。** 問題は最終slugのroute ownershipである。
Robot/Series双方のcreate、slug変更、delete hookが①の`content_route_registry`を同一transactionで
claim / move / releaseし、DBの`UNIQUE(namespace, slug)`で競合を直列化する。collectionを順に検索する
check-only実装やTOCTOUを許さない。移管7件の最終的な `slug` は既存 `Robot` と
**同じ値にする計画**（URLを動かさないため）だが、その `Robot` レコード自体は
Task 9.5（variant 投入後）まで消えない。**同じ `slug` を持つレコードが2つ同時に
存在する期間ができるため、それまでは一時 slug を使う。**

```
Task 3    robotSeries.slug = '<元のslug>-series'   （例: booster-t1-series）
             ↓  variant 投入（Task 9）・参照移行（Task 9.5 Step 1）
Task 9.5  Robot（元のid/slug）を削除
             ↓  同一トランザクション内、削除後
          robotSeries.slug を '<元のslug>-series' → '<元のslug>' へ更新
```

**削除と slug 更新を同一トランザクションにする。** 順序を分けてコミットすると、
「Robot は消えたが Series の slug がまだ `-series` のまま」という状態が本番に見える
瞬間ができる。

- [ ] **Step 4: manifest上ですでに存在するvariantに `seriesId` を付ける**

29 Seriesの `variantStableIds` のうちPayloadにすでに存在するRobot（例: `agibot-a2-ultra`、
`apptronik-apollo-2`、`neura-4ne-1`）へ `seriesId` を設定する。
**移管対象そのもの（`agibot-a2` 等）にはまだ設定しない**
（Task 9.5 でまとめて処理する。二重管理を避ける）。この更新はStep 3のscriptと同じtransaction・
audit artifactに含め、別の手作業にしない。

- [ ] **Step 5: 参照移行の対象を確定する（実行は Task 9.5）**

`npm run report:robot-db-diff -- --state series-created` の「移管対象IDを指す参照」節が一覧を出す。**この時点では
移行しない。** Task 9.5 が variant 投入後にまとめて行う。ここでは対象を確定して記録するだけ。

| 参照元 | 件数 | 移行先 |
|---|---|---|
| `useCase.candidateRobots[].robotId` | 14 | `seriesId` へ（根拠URLはシリーズ製品ページのまま） |
| `article.relatedRobotIds` | 5 | 編集者が確定した代表variantの `robotId` へ |
| `article.manufacturerGuideContent.lineup[].robotId` | 1 | 同じA2代表variantの `robotId` へ（`agibot-manufacturer-guide`） |

```bash
npm run report:robot-db-diff -- --state series-created
```
Expected: 「移管IDを指す参照」が20件（robotId のまま・不変）。**Task 9.5 の完了条件（`--state cutover`）で0件になることを確認する。**

- [ ] **Step 6: ゲートが赤くなることを確認 → コミット**

```bash
git add scripts/create-robot-series.mts collections/RobotSeries.ts docs/reference/create-robot-series-*.json
git commit -m "feat(data): create audited robot series manifest"
```

**完了条件:** `robotSeries` が29件（すべて `draft`）、検証が error 0、意図的な違反で exit 1。

---

### Task 3.5: シリーズの公開状態を決める（§3.1 の宿題）

**この時点で Payload が正本。テストは Payload Local API に対して書く**
（`localContentSnapshot` は①の Task 9 で撤去済み）。

**Files:**
- Modify: `collections/UseCases.ts`（published UseCaseのcross-collection `beforeChange` hook）
- Modify: `collections/RobotSeries.ts`（unpublish / deleteの逆方向gate）
- Test: `tests/content/series-publish-gate.test.ts`

**Global Constraints は「新規レコードは draft」としている。29件すべてこれに従う。**
`useCase` の参照切り替えは Task 9.5（variant が実在してから）まで行わない。**variant が
0件の Series を published にして公開ページへ晒す期間を作らない。**

**cutover の順序はこれで固定する**（新規finding「Series移管後の件数と参照移行」への対応）。

```
Series を draft で作成（Task 3）
  → variant 投入（Task 9）
  → Seriesを先に公開 → UseCase参照移行 → 親Robot削除・slug確定
     （Task 9.5、全操作を同じ未commit transaction内で実行）
```

- [ ] **Step 1: 29件とも Payload `_status: 'draft'` で作成したことを確認する**

```bash
npm run report:robot-db-diff -- --state series-created
```
Expected: 29件すべて`draft`、移管7件のstableId継承、route registry ownerは元Robot、
一時Series slug 7件、公開Series 0件。

- [ ] **Step 2: published な useCase が draft な Series を参照しないゲートを足す**

```ts
import { describe, expect, it, beforeAll } from 'vitest';
import { getPayload } from 'payload';
import config from '@payload-config';

describe('published useCase は draft の series を候補にできない', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>;
  const publisher = { id: 'test-series-publisher', role: 'content-publisher' };
  beforeAll(async () => { payload = await getPayload({ config }); });

  it('draft series を候補にした update を拒否する', async () => {
    const [draftSeries] = (await payload.find({ collection: 'robot-series', where: { _status: { equals: 'draft' } }, limit: 1 })).docs;
    const [publishedUseCase] = (await payload.find({ collection: 'use-cases', where: { _status: { equals: 'published' } }, limit: 1 })).docs;

    await expect(
      payload.update({
        collection: 'use-cases',
        id: publishedUseCase.id,
        data: { candidateRobots: [{ seriesId: draftSeries.id }] },
        overrideAccess: false,
        user: publisher,
      }),
    ).rejects.toThrow(/candidate-series-draft/);
  });
});
```

publisher userを渡さずに `overrideAccess: false` だけで実行すると認証拒否が先に発生し、
`candidate-series-draft` hookを通った証明にならない。hookは①と同じく`originalDoc`と差分`data`を
mergeした完全なUseCaseを検証し、relationshipのPayload内部IDからSeriesを取得して `_status` を確認する。

- [ ] **Step 2.5: Series側に逆方向gateを足す**

published UseCaseが`seriesId`を参照しているSeriesをdraftへ戻す、または削除する操作を
`candidate-series-still-published`で拒否する。hookは同じtransaction内の最新状態を`req`で検索するため、
正規rollbackが先にUseCase参照をRobotへ戻してからSeriesをunpublishする順序は許可する。

次を結合testにする。

- published UseCase参照ありでSeries unpublish/deleteを拒否
- 同一transactionでUseCase参照を先に外した場合だけunpublishを許可
- Series publish後、最初のUseCase更新を意図的にhook拒否し、Seriesがdraftへ完全rollbackする
- `overrideAccess: false`、`content-publisher` user、同じ`req.transactionID`が全callに渡る

- [ ] **Step 3: ゲートが赤くなることを確認 → コミット**

**完了条件:** forward gateとunpublish/deleteの逆方向gate、拒否時のtransaction全rollbackがPASS。
29件はTask 9.5まですべてdraftで、ここでは公開済みと書かない。

---

### Task 4: シリーズの表示を実装する（DEC-S08。UIのみ）

**この Task は表示だけを作る。useCase の参照切り替えと親 Robot の削除は Task 9.5 で行う**
（§4 の cutover 順序）。29件は全件 draft なので、ここで作る画面は「動くが、まだ誰にも
見えていない」状態のまま Task 9.5 まで置かれる。

**Files:**
- Modify: `src/app/robots/[slug]/page.tsx`, `src/app/sitemap.ts`, `lib/searchIndex.ts`, `lib/uiText.ts`
- Create: `components/SeriesVariantList.tsx`
- Modify: `collections/UseCases.ts`（`seriesId` 排他 validation。**受け付けるだけで、まだ使わない**）
- Test: `tests/unit/components/series-variant-list.test.tsx`

- [ ] **Step 1: 失敗するテストを書く → `SeriesVariantList` を実装 → PASS**

構成を名前つきで並べる。構成が空なら何も描画しない（draft の間はこの空状態が正しい表示）。

- [ ] **Step 2: `/robots/[slug]` に series 分岐を足す**

`generateStaticParams` にシリーズの slug を加える。series では `archivedNotice` を出さず構成一覧を出す。Robot 側には所属シリーズへの導線。文言は `lib/uiText.ts` に置く。

**draft の series は `generateStaticParams` に含めるが、通常ルートでは 404 にする**
（他の draft レコードと同じ扱い。preview 経路でのみ見える）。

- [ ] **Step 3: sitemap と検索の対応を作る（draft は載せない）**

sitemap・サイト横断検索ともpublishedのみを対象にする。`/robots`・`/compare`の機体選択はRobotだけ、
サイト横断検索はRobotとRobotSeriesを対象にする。`searchIndex`を
`{ kind: 'robot' | 'robot-series', stableId, slug, label, seriesId? }`へ統一し、表示URLは両方
`/robots/${slug}`、dedupe keyは`${kind}:${stableId}`とする。同じfamilyの完全一致ではSeriesを
variantより先、以降は一致度・label・stableId順に並べる。

29件はdraftなので
**この時点では何も追加されない。** Task 9.5 で7件が published になったときに反映される
こと、同名Robot/Seriesが誤ってdedupeされないこと、draftがindexへ出ないことをテストで確認する。

- [ ] **Step 4: 検証と手動確認**

```bash
npm run check
```

`/robots` のカード数は §3.1 のとおり変化しない（Robot 側はまだ何も変わっていない）。
390px で崩れないこと。

**ビジュアル回帰のベースライン再生成が要る。** スナップショットは24枚あり、ファイル名に OS 名が入る（`-darwin` / `-linux`）。macOS では linux 分を生成できないため `.github/workflows/update-visual-baselines.yml` を手動実行する。**このジョブの push は CI を起動しない**ので、`gh workflow run ci.yml --ref <branch>` を別途叩く。

**完了条件:** series の詳細ページと `SeriesVariantList` が動く（draft なので通常ルートでは404、preview では見える）。`useCase` / `robots` のデータはまだ何も変更していない。

---

### Task 5: 調達注記を詳細ページに表示（DEC-S06）

**Files:**
- Create: `components/ProcurementNotes.tsx`
- Modify: `lib/uiText.ts`, `components/ManufacturerFactSheet.tsx`, `components/RobotStickyAside.tsx`
- Test: `tests/unit/components/procurement-notes.test.tsx`

- [ ] **Step 1: 失敗するテストを書く → 実装 → PASS**

`<dl>` で4軸（窓口 / サポート / 見積・価格 / 確認事項）。値が無い軸は行ごと出さない。全軸が空なら何も描画しない。色は既存トークンのみ。

- [ ] **Step 2: 詳細ページへ接続**

`ManufacturerFactSheet` に4軸、`RobotStickyAside` に `supportNote` の1軸。**Server Component 側で渡す**（client view model には載せない）。

- [ ] **Step 3: 検証**

```bash
npm run check
```

**`check:bundle-content` は緑であることだけを見ない。各チャンクの最大 hit 数を before / after で記録する。** slug の総数が倍増するため、4 → 5 に乗る直前が「緑」からは見えない。

- [ ] **Step 4: 手動確認 → コミット**

`/manufacturers/unitree` と `/robots/unitree-g1` を開き、390px で折り返しが破綻しないこと、`dt`/`dd` がスクリーンリーダー順で読めることを確認する。

**完了条件:** `/manufacturers/[slug]` に4軸、`/robots/[slug]` に `supportNote` が出る。

---

### Task 6〜9.5 共通: versioned draft・監査・rollback契約

Task 1.75で実装した次の共通runnerを使い、Adminでの直接一括編集を禁止する。

```ts
runAuditedBatch({
  runId,
  task: '2' | '3' | '6' | '7' | '8' | '9' | '9.5',
  actor: contentDraftWriter,
  inputHash,
  transactionBoundary,
  createDrafts,
});
```

1. Local APIは`overrideAccess: false`、実行user=`content-draft-writer`、`draft: true`でversionを作る。
   既存published文書を直接上書きせず、`_status: draft`だけにも依存しない
2. batch開始時にrun ID、actor、入力hash、対象stableId、before-image、開始時version IDを
   `content_change_outbox`へ同じDB transactionでinsertする。outbox tableはGit管理migrationで作り、
   payloadはapplication-level encryptionを施す
3. commit後のworkerがbefore-imageをProduction private audit/backup storeへ一意object keyでuploadし、
   cosign署名・sha256・version ID・actor・件数を要約manifestへ記録する。outbox delivery完了前に
   次batchやpublishへ進まない。upload失敗時もoutboxから再送できるためbefore-imageを失わない
4. `content-publisher`がDraft Mode previewとdiffを確認し、approval manifestへcollection、stableId、
   approved version ID、canonical document hash、承認者、期限を署名記録する。publish直前にそのversionが
   最新draftでhash一致することを再検査し、①の`publishApprovedVersion()`で**そのversionの完全なdocument**
   だけを公開する。`_status: published`だけを現行docへpatchする実装を禁止する。authorとpublisherを
   同一人物にしない。却下時はdraft versionを破棄しpublished版を維持する
5. Payload versionsは最低180日かつ1 document 50 versionsを保持する。rollbackはversion IDまたは
   署名済みbefore-imageから新draftを作り、preview後に`content-publisher`が再公開する。新規createの
   削除だけは`platform-admin`が行う

監査manifestの必須項目はrun ID、Task、actor、publisher、input hash、transaction境界、実行件数、
created/updated stableId、before/after version ID、private storage永続識別子、sha256、署名、開始・終了時刻。
1項目でも欠ければbatch完了にしない。

---

### Task 6: 既存42件を更新

**Files:**
- Create: `scripts/update-existing-robots.mts`
- Test: `tests/content/update-existing-robots-rollback.test.ts`

- [ ] **Step 0: Task 1.75の監査基盤がProduction適用済みか確認する**

`payload:migrate:status`、environment marker、outbox KMS key version、private store負テストを確認する。
migration未適用、復号/再送test失敗、別environment fingerprintならTask 6を開始しない。

- [ ] **Step 1: 差分のある値だけを当てる**

Task 1 のレポートで差分が出た値のみ。`specSchema` に無い列（`可搬重量`）は `loadRatings[]` へ。バッテリーは mAh 単位（積み残し登録簿 #10）。

- [ ] **Step 2: versioned draftを作成し、preview後に公開する**

transaction境界はmanufacturer単位。scriptが既存42件の`updatedAt`と`sources[].checkedAt`を含むdraft
versionを作り、outbox delivery後に停止する。publisherの明示承認入力
`--approval-manifest <signed file>`が無ければpublish modeを実行しない。

- [ ] **Step 3: 失敗注入・rollbackを検証してcommit**

最大batchの途中で例外を発生させ、draft versions、outbox、published valuesがbatch開始前へ戻ること、
既に成功した別manufacturer batchは影響を受けないことを確認する。公開後はbefore versionから
restore draft→preview→republishし、値とversion chainが戻ることを確認する。

**完了条件:** レポートの「更新」差分が0。

---

### Task 7: 名前ずれ3件・`onex-eve`・`Apollo 2` の分割

**Files:**
- Create: `scripts/apply-robot-identity-corrections.mts`
- Test: `tests/content/robot-identity-corrections-rollback.test.ts`

- [ ] **Step 1: 名前を直す**

`mentee-menteebotv3`「MenteeBot」→「MenteeBot V3」、`kawasaki-kaleido`「Kaleido」→「Kaleido9」、`neura-4ne-1` を `4NE1 Gen 3.5` の値へ。**`id` は変更しない。**
`neura-4ne-1` にはTask 3 manifestのNEURA `4NE1` Series IDも設定する。KaleidoとMenteeBotは
29 Seriesの対象外なので `seriesId` を付けない。

3件とも既存`slug`と`previousSlugs`を維持し、名称変更をURL変更へ連動させない。したがってURL
waiverは使わない。別slugへ変える場合は旧URL・新URL・301をapproval manifestへ追加し、
上位SoT ownerの承認が無ければ停止する。

- [ ] **Step 2: `onex-eve` を archived にする（DEC-S02）**

`deploymentStage` は `limited-production` のまま。

- [ ] **Step 3: `apptronik-apollo-2` を2レコードへ分割する**

シートは `Apollo 2（Biped）` と `Apollo 2（Wheeled）` の2行を持ち、移動方式が二足と車輪で異なる。既存 `id` を Biped 側が継承し、Wheeled を新規 `id` で追加する。
両recordにTask 3 manifestのApptronik `Apollo 2` Series IDを設定する。
URLはBipedが既存slugを維持し、Wheeledだけ新規slug`apptronik-apollo-2-wheeled`を使う。既存URLの
変更・redirectは発生しない。

**波及範囲（実測）**: `useCases` の `candidateRobots[].robotId` から**7箇所**、`apptronik-apollo` の `supersededById` から1箇所。既存 `id` を Biped が継承するので**7箇所はそのまま Biped を指す。付け替えはしない**（§11）。

**Wheeled 側は Global Constraints どおり `publishStatus: 'draft'` で作る。** 新規 `id` なので
draft 開始が原則で、Biped と同じ published にする理由はない。

- [ ] **Step 4: versioned draft・preview・公開・失敗rollbackを検証してcommit**

既存5 recordの変更は1 transactionでdraft versionsを作り、新規Wheeledも同じtransactionに含める。
outbox delivery後に`content-publisher`がpreviewし、別transactionで既存5件だけを公開/archivedへ反映する。
新規Wheeledはdraftのまま維持する。Apollo split直後に強制失敗させ、
名称・`onex-eve` status・新規Wheeled・version/outboxが全rollbackするtestと、公開後の署名before-imageから
全変更を戻すrehearsalを実行する。

**完了条件:** 名称3件・archived 1件・分割1件が反映され、参照切れなし。

---

### Task 8: `deployments` と `manufacturers` を拡充

**Files:**
- Create: `scripts/import-robot-deployments-manufacturers.mts`
- Test: `tests/content/deployment-manufacturer-import-rollback.test.ts`

- [ ] **Step 1: `exclusionReason` 記入済み22行の理由を読む**

取り込むか外すかを行ごとに決める。取り込み数は **19〜41件の範囲**になる。**件数を事前に断定しない。**

- [ ] **Step 2: `deployments` を取り込む**

緯度経度は `location: { lat, lng }` へ。**`summary` と `nextReviewBy` は `BaseRecord` のフィールドなので取り込む**（`data/types.ts:99,105`）。
正規化JSONには `summary` / `sources` / `publishStatus` / `reliability` / `updatedAt` / `nextReviewBy` が既にある。
`sources` と `relatedUseCaseIds` はJSON文字列なので型付きで parse する。

取り込まないのは**本当にスキーマ外の列だけ** — `coordinatePrecision` / `deploymentType` /
`endedAt` / `importReady` / `exclusionReason`。

- [ ] **Step 3: 既存26社のうち24社を更新し、新メーカー33社を追加**

`Aeolus Robotics` と `Pudu Robotics` は代理店シートに行が無いため更新元が無い（§3.2）。現状維持。
Task 1の署名済み`manufacturer-import-manifest.json`を唯一のidentity入力として、24 `update` / 33 `create`
を実行する。raw `manufacturers.json`の名前からstableIdをその場で発番せず、matched Payload ID、alias、
input hash、actionが1件でもDB実態と違えば全処理を停止する。

**代理店シートの「提供事業者 / 事業者種別 / 入手方法 / 対応モデル / 申込先」は、`distributors` コレクションへ移せる形で保持する。** 自由文の注記へ潰さない（§11）。

ただし保存先は未決定なので、Task 8開始前にarchitecture ownerが次のdecisionを承認する。
入力は代理店57行と上記5列、出力は「`distributors`へ直接投入」または「署名済みprivate
`distributor-staging-manifest`へ退避」のどちらか一つ。担当、schema、retention、移行期限をdecisionへ
記載し、承認が無ければmanufacturer importを開始しない。

- [ ] **Step 4: 検証**

```bash
npm run check:world-map-asset
```
Expected: 緑。赤い場合は `npm run generate:world-map` で再生成する。

- [ ] **Step 5: versioned draftをpreviewし、publisherが公開する**

transaction境界はmanufacturer単位、deploymentsはsource sheetのreview decision batch単位。既存24
manufacturerと既存deploymentの更新はdraft version、新規33 manufacturer / 新規deploymentはdraft
createとし、全batchを共通outboxへ記録する。`content-draft-writer`が作成し、別の
`content-publisher`が世界地図と詳細をpreview後に公開する。新規33 manufacturerはTask 1.5のcontent
manifestが33/33 publish-readyで、approved version ID/hashが最新draftと一致するものだけ公開する。
未完了recordはdraftのまま残し、その状態ではTask 9のRobot公開促進を拒否する。

- [ ] **Step 6: 失敗注入・rollbackを確認してcommit**

manufacturer更新後・deployment作成前に強制失敗させ、同じbatchのversion/create/outboxが戻ることを
確認する。公開後はversion ID / before-imageから1 batchを復元し、他batchを変えないことを確認する。

`/` の世界地図で追加した拠点が意図した位置に出ること、arc が破綻していないこと。

**完了条件:** 取り込み判断の結果と、外した行の理由を完了報告に記録する（G11）。`manufacturers` が59社。

---

### Task 9: 新規131件を投入（baseline追加候補134のうち3件はTask 7で更新化。§5 完了後）

**Files:**
- Create: `scripts/import-robot-db-to-payload.mts`

- [ ] **Step 1: 原本を再パースする**

```bash
npm run parse:robot-db -- --out data/import
npm run verify:robot-import-manifest
npm run verify:content-enrichment
```
Expected: parse後のinput hashがTask 1で署名したmanifestと一致し、stage 177/177、product URL
177/177、stableId重複0。hash差分があれば既存manifestを編集せずTask 1 Step 5.5へ戻る。
enrichmentはdraft import必須131/131、publish-ready件数と未完了件数を表示する。

- [ ] **Step 2: 冪等な importer を書く**

Task 9の入力は`robot-import-manifest.json`と`manufacturer-import-manifest.json`の署名済みrowsだけ。
①はdomainの`id`をPayloadの
`stableId`へ保存するため、各rowの`stableId`を検索し、manifest actionとDB実態を照合する。
`create`なのに既存、`update`なのに不存在、input hashや署名不一致はexit 1。

本Taskが書き込むのは`action=create`の131行だけ。`update`45行と`split`1行はTask 6 / 7の完了結果を
read-only照合し、値がmanifestと違えば自動修正せず該当Taskへ戻る。

- 疎なJSON（一部フィールドしか持たない）で update するとき、**既存フィールドを消さない**
- Robotの`productUrl`をPayload `sources[]`の最低1件へ変換する。現行Robot入力の`sourceUrls`は
  0/177なので存在を前提にしない。manufacturerの複数source URL処理は別mapperのまま維持する
- `data/import/source-metadata.json` をURL keyの正本とし、各URLに人が確認した `title` と
  `reliability`（`verified|official|reported|estimated`）を持たせる。既存URLはbaselineの
  Source metadataを維持し、新規URLにmetadataが無ければimportを開始せずexit 1にする。
  hostnameからtitleを自動生成したり、全件を無条件に`official`へ分類しない
- domain JSONの`publishStatus`はPayload書き込み時に`_status` + `lifecycleStatus`へ変換する。
  draft create/updateは`_status: 'draft'`、`lifecycleStatus: 'active'`、`draft: true`を指定し、Payloadに存在しない
  custom field `publishStatus` をwhere/dataへ渡さない
- メーカー単位で transaction を張る（Step 3）
- `--dry-run` で作成/更新される件数だけ出せる
- 部分失敗したとき、どこまで進んだかが分かる
- relationship（`manufacturerId` / `seriesId`）は `stableId` から Payload ID へ解決する
- `manufacturerId`は署名済みManufacturer manifestに存在し、Task 8のactionが適用済みであることを
  確認する。raw manufacturer名からfallback解決しない

同じJSONで2回流しても結果が変わらないことをテストで固定する。

source metadata contract testは、Robot `productUrl` 177本とmanufacturer URL集合を
  `source-metadata.json`のkey集合と比較し、missing 0、余剰key 0、空title / checkedAt 0、未来日0、
  許可外reliability 0を
assertする。Robot全177行で`modelUrl/productUrl → sources[0].url`が一致することを検査する。

- [ ] **Step 3: メーカー単位で投入する**

**新規createが属する45 affected manufacturersごとに1 transaction + 1 audit artifact。**
Unitree 19機 / Leju 18機 / UBTECH 12機が最大で、131件全体を1トランザクションにはしない。
59は完了時DB Manufacturer総数であり、Task 9のtransaction数ではない。
Payloadへ `_status: 'draft'`, `draft: true` で入れ、`seriesId` を設定する。

各runについて、フルのbefore-imageは**Production private audit/backup store**へ置く。public mediaや
Preview private storeへ置かない。保存方式・outbox・role・version保持はTask 6〜9.5共通契約を再利用し、
フルの before-image は private object storage（① Task 5 §7-8 で選定したProduction private store
と同じ provider）へ、Git へは要約 manifest のみ commit する（Task 5 の baseline snapshot と
同じ理由 — Git へ全レコードの二重保存をしない。`content-platform-and-database-architecture-v2.md` §2.1）。

```
# object storage（フル）
run ID / 対象メーカー / 作成した stableId 一覧
/ 更新した stableId 一覧とその before-image（更新前の全フィールド値）

# Git（要約 manifest のみ）
run ID / 対象メーカー / provider + bucket + objectKey + versionId + sha256 + cosign署名
/ 作成した stableId の一覧 / 更新した stableId の一覧
/ before・after の件数
```

期限切れする署名付きURLはmanifestへ保存しない。inverse operationを始める前に、Task 0で確定した
公開鍵による署名とsha256を検証し、失敗したartifactは使用しない。

**update した stableId は before-image を必ず残す。** create した分は「無かった」状態が
inverse なので不要だが、update は before-image が無いと戻せない。

**強制的に途中失敗させて、そのメーカー1社ぶんのトランザクションがロールバックすることを
テストする。**最大のUnitree（19機）を対象に、投入順で15機目を意図的に失敗させ、(a) その
transaction内で既に作成/更新した1〜14機目が巻き戻ること、(b) 他メーカーの transaction（既に
成功しているもの）には影響しないこと、の両方を確認する。131件全体をまたぐロールバックは
設計上存在しない（transaction境界がメーカー単位のため）。

**戻すときはこの artifact から inverse operation を組む。**create は delete、update は
before-imageへの再update。Git revert では戻らない（Payload へ書いたデータは Git 差分ではない）。

各Local API callは`overrideAccess: false`、draft作成user=`content-draft-writer`、同じmanufacturer
transactionの`req.transactionID`を使う。新規131件はdraftのため`content-publisher`による公開は
本Taskでは行わない。

- [ ] **Step 4: Task 3 の warning を error へ上げる**

「シリーズは構成を1件以上持つ」を error にし、わざと1つの `seriesId` を外して exit 1 を確認する。

- [ ] **Step 5: 全件投入後の総合検証**

```bash
npm run check
npm run report:robot-db-diff -- --state imported
```

- [ ] **Step 6: ページ重量を実測して記録**

**測る状態を取り違えない。** `/robots` に出るのは published のみで、本 task は131件を `draft` で入れる。したがって**完了直後の測定値は増えず、150KB ゲートは発火しない。**

published 件数とバイト数を対で記録し、**1件あたりのバイト数が現行の約645 B から増えていないか**を見る。published になり得るのは archived を除く分で、全件昇格時の外挿は約124KB。

- [ ] **Step 7: `/compare` のツリー行数を実測し、別計画を起票する（DEC-S08）**

投入後の選択ツリーは **59社 + published な Robot 件数**になる。現在は約83行。**177 は原本の行数であって Payload のレコード数ではない**ので、実測して記録する。実測して記録し、**メーカー → シリーズ → 機種 の3段カスケードを別計画として起票する**。

**完了条件:** `robots` が **195件**（63 + (134−改名吸収3) + Apollo分割1。移管7件はまだ Task 9.5 まで
`robots` に残る）、`robotSeries` の全件が variant を1件以上持つ、`npm run check` が全緑。

---

### Task 9.5: シリーズを cutover する（DEC-S08。§4 の順序の最終段）

**この Task の時点で、①の cutover（Task 9）は完了しており Payload が唯一の正本。**
`data/*.ts` は既に存在しない。**すべて Payload Local API または管理画面操作として書く。**
`git commit -am` で DB の変更をコミットすることはできない — Git には audit artifact
だけを残す（Global Constraints）。

**Files:**
- Create: `scripts/cutover-migrated-series.mts`（1回限りの cutover script）
- Create: `docs/reference/cutover-migrated-series-<日付>.json`（audit artifact）

**Interfaces:**
- Consumes: Task 9 で投入された variant（`seriesId` 設定済み）、Task 3 で作った7件の
  一時 slug（`<元slug>-series`）

**Task 9 で variant が実在するようになった後に、まとめて行う。** 分けて実行すると
「published な Series が空」「Robot と Series が同じ slug で衝突する」
「Robot は消えたが Series の slug がまだ一時値のまま」のいずれかの状態が本番に見える。

URL waiverは移管7件だけに限定する。外部公開URL`/robots/<元slug>`はRobotからSeriesへ所有主体が
変わるがpathを維持するため301は不要。一時`-series` slugはdraft preview専用でsitemap/searchへ出さず、
cutover完了後0件を検証する。他のslug / previousSlugsは変更しない。

状態遷移を次のとおり固定する。中間行はすべて未commitで、外部readerには開始状態か終了状態しか見えない。

| transaction内の時点 | robots | Series status | 旧stableIdの所有 | 旧Robot ID向き参照 | 7 Series slug |
|---|---:|---|---|---:|---|
| 開始（`imported`） | 195 | draft 29 | Robot + draft Series（一時共存） | 20 | `<元slug>-series` |
| Series 7件publish後 | 195 | published 7 / draft 22 | 同上 | 20 | 同上 |
| UseCase / Article version publish後 | 195 | published 7 / draft 22 | 同上 | 0 | 同上 |
| 旧Robot 7件delete後 | 188 | published 7 / draft 22 | Seriesのみ | 0 | 同上 |
| slug確定・commit後（`cutover`） | 188 | published 7 / draft 22 | Seriesのみ | 0 | `<元slug>` |

**参照移行の対象（Article側）を先に決める。** `Article` 型には `relatedRobotIds: Id[]` しか
なく、`seriesId` の受け皿が無い（`UseCase.candidateRobots[]` とは違う）。Article 型に
`relatedRobotSeriesIds` を新設して①へ差し戻す案もあるが、5箇所のためだけに①のTask 0.5・
Task 3・migration・validator・repository・parity・記事UIまで連鎖させるのは過大。
**代わりに、5箇所は移管先シリーズの中の代表 variant（具体的な Robot）へ付け替える。**
どの variant を代表にするかは編集判断（G2 と同様、機械では決めない）。

| 記事 | 現在の参照 | 付け替え先候補（人が確定） |
|---|---|---|
| `jal-haneda-humanoid-pilot-2026` | `ubtech-walker-tienkung` | Walker Tienkung の3構成から選ぶ |
| `china-humanoid-duopoly-agibot-june2026` | `agibot-a2` | A2 の3構成から選ぶ |
| `china-humanoid-demand-gap-june2026` | `agibot-a2` | 同上 |
| `humanoids-summit-tokyo-may2026` | `booster-t1` | T1 の3構成から選ぶ |
| `agibot-manufacturer-guide`（`relatedRobotIds` + `manufacturerGuideContent.lineup`） | `agibot-a2` | 同上（2箇所とも同じ variant にする） |

- [ ] **Step 0: cutover対象のversioned draftと監査入力を準備する**

`content-draft-writer`がUseCase 14参照・Article 6参照箇所のdraft versionsを`draft: true`で作り、
RobotSeries 7件と代表variantをDraft Modeでpreviewする。`content-publisher`が署名approval manifestへ
Series content manifest 7/7の`publish-ready`、全docのapproved version IDs、canonical hashes、
代表variantを記録する。approved versionが最新draftでなくなった場合は再承認する。旧Robot 7件、
Series 7件、参照元全docのbefore-imageを
transactional outboxへ準備し、Production private audit storeへのdeliveryが完了しなければStep 1へ進まない。
versionsの180日/50件保持と復元手順はTask 6〜9.5共通契約を適用する。

- [ ] **Step 1: 単一トランザクションで cutover script を書く**

7件それぞれについて、次を**すべて成功するか全部失敗するかの1トランザクション**にする
（High「トランザクションとaudit artifactの設計」への対応）。

```
0. 全variant実在・publish gate・代表variant決定・署名済みbefore-image/outboxを検証
1. RobotSeries 7件の承認済み最新draft versionを`publishApprovedVersion()`でpublish
2. 承認済みUseCase draft versionsを同helperでpublish（candidateRobotsの14参照をseriesIdへ）
3. 承認済みArticle draft versionsを同helperでpublish（relatedRobotIds 5箇所を代表variantへ）
4. agibot guideの承認済みdraft versionを同helperでpublish（lineup 1箇所を3と同じ代表variantへ）
5. Robot（移管元、元の id/slug）を削除
6. Robot deleteによるroute release後、RobotSeries routeを同じnamespaceの元slugへmoveし、
   document slugも'<元slug>-series' → '<元slug>'へ更新
```

Seriesを公開してからUseCaseを更新しないと、Task 3.5の「published UseCase→draft Series拒否」gateで
最初の更新が失敗する。Series publishとUseCase更新は同じ未commit transaction内なので、外部readerに
「公開Seriesだが参照未移行」の中間状態は見えない。

standalone scriptは`beginTransaction()`の戻り値を捨てず、同じ`req`へ設定して全Local API callへ渡す。

```ts
const transactionID = await payload.db.beginTransaction();
const req = await createLocalReq({ user: platformAdmin }, payload);
req.transactionID = transactionID;
try {
  await payload.update({ collection: 'robot-series', req, overrideAccess: false, /* publish */ });
  await payload.update({ collection: 'use-cases', req, overrideAccess: false, /* move refs */ });
  // articles, delete old robots, final slugも同じreq
  await payload.db.commitTransaction(transactionID);
} catch (error) {
  await payload.db.rollbackTransaction(transactionID);
  throw error;
}
```

実装時にlockfileで固定したPayload版のtransaction API signatureと照合し、別`req`を生成したcall、
`overrideAccess: true`、actor無しcallをstatic testで拒否する。実行actorはdelete権限を持つ
`platform-admin`、承認者は別人の`content-publisher`とする。通常MCP keyを使わない。

- [ ] **Step 2: gate拒否を強制し、全体がロールバックすることを確認する**

Series publish直後、最初のUseCase updateをfixture hookで拒否する。Series 7件のstatus、UseCase 14参照、
Article 6参照箇所、旧Robot 7件、slug 7件、outboxがすべて開始状態へ戻ることを確認する。Robot削除時の
失敗も別caseで注入し、同じ完全rollbackを確認する。

- [ ] **Step 2.5: commit後rollbackの逆操作をrehearsalする**

同じtransactionで、旧Robot 7件を一時slugでbefore-imageから再作成→UseCase参照をSeriesから旧Robotへ
戻す→Seriesをdraftへ戻す（Task 3.5逆方向gateは参照0を確認）→Series slugを`-series`へ戻す→旧Robot
slugを元へ戻す、の順に行う。Articleは代表variant参照からbefore-imageの旧Robot参照へ戻す。
署名・sha256・run ID・environment markerが一致しなければ開始しない。途中失敗で全操作がrollbackする
ことを確認してから本実行を許可する。

- [ ] **Step 3: 本実行する**

```bash
npm run report:robot-db-diff -- --state imported   # 実行前は imported のまま（参照20件）
npm run verify:content-enrichment     # 移管Series 7/7 publish-ready
npm run cutover:migrated-series -- --approval-manifest <signed-file>
```

Expected: 実行前は「移管IDを指す参照」20件。cutoverは署名、全approved version ID/hash、最新draft、
7/7 publish-ready、outbox deliveryを検証して単一transactionをcommitする。どれか不一致なら変更0件。

- [ ] **Step 4: audit artifact を記録して commit**

```json
{
  "runId": "...",
  "seriesIds": ["..."],
  "deletedRobotIds": ["booster-t1", "booster-k1", "..."],
  "referenceMigrations": [{ "collection": "useCases", "id": "...", "field": "candidateRobots[0].robotId", "before": "booster-t1", "after": "<seriesId>" }],
  "slugRenames": [{ "seriesId": "...", "before": "booster-t1-series", "after": "booster-t1" }]
}
```

**artifact本体（各レコードのbefore-image）はProduction private audit/backup storeへ置く。** Gitには
上記のような要約（対象IDと件数）だけを commit する。全フィールドの before-image を
Git へ置くと、baseline snapshot で避けた「Gitへの content record 二重保存」が再発する。
要約にはURLではなくprovider / bucket / objectKey / versionId / sha256 / cosign署名を記録し、
rollback前に署名とhashを検証する。

```bash
git add docs/reference/cutover-migrated-series-<日付>.json scripts/cutover-migrated-series.mts
git commit -m "feat(data): シリーズ7件を cutover（参照移行・親Robot削除・公開）"
```

- [ ] **Step 5: 検証**

```bash
npm run check
npm run report:robot-db-diff -- --state cutover
```
Expected: exit 0。「移管IDを指す参照」相当が**0件**（Step 4 の commit 前は `imported` のまま
20件のはずで、これが変わっていなければ Step 1 の transaction が実行されていない）。

- [ ] **Step 6: 手動確認**

`/use-cases/research-development` の候補に「T1（提供終了）」が出ないこと。
`/robots/booster-t1` が構成一覧を表示すること（一時 slug が残っていないこと）。
`/robots` のカード数が §3.1 と一致すること。

**完了条件:** `npm run report:robot-db-diff -- --state cutover` が exit 0（「移管対象IDを指す参照」
相当が0件）。`robots` 188件・`robotSeries` 29件（published 7・draft 22）。7件すべての `slug` が
一時値ではなく最終値になっている。

---

### Task 10: 全件回帰監査（R02-11 の吸収）

- [ ] **Step 1: 全レコードの公開ゲートを機械確認する**

publishedなレコードが§Fの必須項目とTask 1.5のpublish必須fieldをすべて満たすこと。
enrichment manifestのpublish-ready / 未完了 / rights blocked件数を完了報告へ出し、未完了recordを
公開しない。

- [ ] **Step 1.5: 100件超の一覧取得と公開促進前gateを確認する**

```bash
npm run test -- tests/content/repository.contract.test.ts
npm run verify:published-robot-pagination
```

Expected: fixture 101件と188件で全pageを取得し、unique stableId件数・表示可能件数・`totalDocs`が一致。
実DBでもpublished件数と`/robots`のpageable/displayed件数が一致する。1件でも欠落、重複、安全上限超過が
あれば新規draftをpublishしない。

- [ ] **Step 2: 出典URLの死活を確認する**

```bash
npm run check:source-links
```

**対象URL数を記録する。** 581本から大きく増えるため、重複が3桁に達していないかを見る（`data-architecture-redesign-v1.md` §11.45 の判断条件）。

- [ ] **Step 3: 主要routeの手動確認（§10）**

- [ ] **Step 4: stableId保全とimport artifactのarchiveを閉じる**

①baselineの63 stableIdについて、56件はRobotとして存在し、移管7件は**同じstableIdのまま**
RobotSeriesへ型移行したことをconservation ledgerで検証する。消失・新IDへの未承認置換0件。

§1.2のprovenance / rights判断に従い、`data/import`のworking JSONをread-only archiveへ移すか、
Production private audit storeへ署名保存してworking copyを削除する。`data/import/README.md`にはrun ID、
hash、archive永続識別子、保持期限、data ownerだけを残し、runtimeがarchiveを読まないことを
`npm run check:data-boundaries`で確認する。

**完了条件:** §10のチェックリスト、manifest 177行のconservation、公開一覧totalDocs一致、
enrichment件数報告、import artifactガバナンスが完了。

---

## 8. 順序制約

```
§0 前提ゲート（①の完了）
   ↓
Task 1（parser・manifest・突合先切替）
   ↓
Task 1.5（content enrichment担当・品質manifest）
   ↓
Task 1.75（全変更共通の監査batch・暗号化outbox）
   ↓
Task 2 ─→ Task 3 ─→ Task 3.5 ─→ Task 4    シリーズ（データ→公開状態→UI）
   │
   └─→ Task 5（UI・独立）                  注記表示
   ↓
Task 6 ─→ Task 7                          既存データの更新
   ↓
Task 8（deployments / manufacturers・独立）
   ↓
Task 9（§5 完了が前提）─→ Task 9.5 ─→ Task 10
```

- **Task 3 → 3.5 → 4 の順**。データを作り、公開状態を決めてから、表示を作る
- **Task 4 は useCase の参照を切り替えない。** それは Task 9.5 の仕事（§4 の cutover 順序）。
  variant が0件のまま Series を published にしないため、切り替えを investment 投入後まで遅らせる
- **Task 3 の「シリーズは構成を1件以上」は Task 9 まで warning**。Task 3 時点では variant が0件のため、error にすると自分自身が落ちる
- **Task 9.5 は Task 9 の直後、Task 10（回帰監査）の前**。variant が実在してから参照を移し、
  親 Robot を消し、Series を公開する。この3つを分割実行すると
  「published な Series が空」または「同じ id/slug が2箇所に存在する」状態が生まれる
- **Task 8 は Task 9 より先**。新規131件の `manufacturerId` が参照整合性チェック（G5）に引っかかる
- **Task 9 はTask 1の署名済みimport manifestとTask 1.5のdraft必須項目を入力にする。** 現行JSONを
  直接読まない
- **Task 5 は独立**。UIのみで他のデータ変更に依存しない

---

## 8.5 ロールバックと監査証跡

| 範囲 | 実行主体 | rollback入力 | transaction境界 | 停止条件 | 復元検証 |
|---|---|---|---|---|---|
| ②全体 | `platform-admin`、`content-publisher`承認 | `pre-robot-import-manifest.json` | 新しい空DBへ全restore | 署名/hash/environment/resource ID不一致 | 全collection parity 0差分 |
| Task 6 | draft=`content-draft-writer`、publish=`content-publisher` | version ID + signed before-image | manufacturer | outbox未配送、preview未承認 | 対象42件とversion chain一致 |
| Task 7 | 同上、delete時だけadmin承認 | version ID + split前before-image | 5既存+1新規を1 batch | slug衝突、参照切れ、outbox未配送 | 名称/status/Apollo/参照が開始状態 |
| Task 8 | 同上 | version ID + signed before-image | manufacturer / reviewed deployment batch | review判断未記録、outbox未配送 | DB件数・地図・対象batch一致 |
| Task 9 | `content-draft-writer` | 45 audit artifacts | affected manufacturer、最大45 | manifest署名/action不一致 | create削除後、pre-countとID集合一致 |
| Task 9.5 | `platform-admin`、別`content-publisher`承認 | cutover before-image + transfer manifest | 全7 Seriesを1 transaction | gate拒否、代表variant未承認 | 逆操作rehearsal、`imported` stateへ一致 |

versionsだけ、object storageだけのどちらか一方を監査証跡にしない。version ID、actor、input hash、
実行件数、before-image、private object永続識別子、署名を相互参照する。rollback成功後も元artifactを
削除せず、rollback run IDを追記した新しい要約manifestを作る。

---

## 9. リスクと軽減策

| リスク | 影響 | 軽減策 |
|---|---|---|
| ①が未完了のまま着手する | Payload が無い状態で投入して失敗する | §0 のゲート7項目。1つでも欠けたら①へ戻る |
| 投入で既存63件を壊す | 出典581本・fieldEvidence 455項目が失われる | §0 G-7でpre-import世代をrestore。署名manifestの`stableId`でaction整合を検証し、疎なupdateで既存fieldを消さない |
| Task 3 のゲートが空振りする | 「落ちないゲート」が増える | 各ゲートでわざと違反を仕込み exit 1 を確認する |
| Task 4 でビジュアル回帰が陳腐化 | CI が赤のまま放置される | `update-visual-baselines.yml` を手動実行し、`gh workflow run ci.yml` を別途叩く |
| Task 8 で世界地図の static asset が陳腐化 | Home の地図が古い拠点のまま | `check:world-map-asset` を検証に入れ、赤なら再生成 |
| Task 9 で注記本文が client bundle へ漏れる | 共有フロア増加 | Server Component 側で渡す。`check:bundle-content` の最大 hit 数を記録する |
| `deploymentStage` を人が埋め間違える | カタログの絞り込みが誤る | §5.1 の8分岐を製品ページで1回通す。43行は現在の値を転記するので判断は134行 |
| 原本がユーザー環境にしかない | 他の環境で再現できない | §1.2のprovenance・hash・権限を確認し、許可時だけread-only Git archive、不可ならprivate archiveへ署名保存する |

**副作用が及ぶ既存機能**: `/robots`（カード・検索・フィルタ）、`/robots/[slug]`、`/compare`、`/manufacturers`、`/manufacturers/[slug]`、`/use-cases/[slug]`、`/`（世界地図）。

---

## 10. 検証

### コマンド

```bash
npm run parse:robot-db -- --out data/import                    # 原本の再パース
npm run report:robot-db-diff -- --state cutover                # 突合（期待値23項目・完了後の状態）
npm run check                                                   # 全ゲート
npm run check:world-map-asset                 # Task 8
npm run check:source-links                    # Task 10
npm run content:verify-conservation -- --manifest docs/reference/cutover-baseline-manifest.json --stable-id-subset  # G-3
npm run content:verify-snapshot -- --manifest docs/reference/pre-robot-import-manifest.json  # G-7のrestore先だけで実行
```

**CI の確認は retries や verify=SUCCESS だけを見ない。** e2e の flaky 件数まで読む。

### 手動確認チェックリスト

- [ ] `/robots` — カード数が published な Robot の件数と一致する（§3.1 の計算値）。**シリーズが出ていない。** フィルタの件数表示が正しい
- [ ] `/robots` — 390px / 768px / 1280px で横スクロールが出ない
- [ ] `/robots/[slug]`（Robot） — `supportNote` と所属シリーズへの導線が出る
- [ ] `/robots/[slug]`（Series） — 構成一覧が出る。「提供終了」が出ない
- [ ] `/manufacturers/[slug]` — 注記4軸が出る。4軸すべて空のメーカーで見出しだけ残らない
- [ ] `/use-cases/[slug]` — 候補に「T1（提供終了）」が出ない
- [ ] `/compare` — 削除したフィールドの行が消え、レイアウトが崩れない
- [ ] `/` — 世界地図の拠点数が `deployments` の published 件数と一致する
- [ ] archived レコード（`onex-eve` / `fourier-gr1` / `fourier-gr2` / `figure-02` / `apptronik-apollo`）が一覧に出ない
- [ ] キーボードのみで `/robots` のフィルタと `/manufacturers/[slug]` の注記まで到達できる
- [ ] コンソールエラーが出ない

---

## 11. この計画がやらないこと

- **`distributors` コレクションの実装。** 設計は `data-architecture-redesign-v1.md` §4-1 / §11 で確定済み。グローバルナビのタブとUI仕様が固まってから着手する（人間の意向、2026-08-08）。**ただし Task 8 で代理店シートを取り込むときは、後で移せる形で保持する**
- **全機種へのシリーズ定義と3段カスケードUI。** 本計画で入れるのは `RobotSeries` 型と29シリーズだけ。**Task 9 Step 7 で起票する**
- **`draft` → `published` の実行**（新規131件）。本計画はdraft投入まで。公開必須条件・担当role・
  enrichment manifestはTask 1.5で定義するが、個別のJapan availability担当・期限は§13 #4の未解決
  blockerであり、満たさないrecordは昇格しない
- **`japanAvailability` の個別判断49機。** DEC-S03 の「入手可能 / 列挙あり」セルは一致率41%のため自動確定しない
- **`useCases` の候補ロボットの付け替え。** `apptronik-apollo-2` の7箇所は Biped を指したまま残る
- **`distributorNote` → `domesticDistributors` の構造化移行**（DEC-S06 で重複と認定したが表示に留める）
- **`scopeStatus` / `evidenceLevel` の追加**（DEC-S13 で見送り）
- 画像・ロゴの調達（DEC-S12）
- 記事の追加
- 価格情報の一括更新

---

## 12. 積み残しとの関係

`docs/decisions/deferred-work-register-v1.md` の **#10（`batteryCapacityMah` の未反映、残23機）**は Task 6・Task 9 に吸収される。原本は全177行に mAh 単位の列を持ち、DEC-S01 で variant を別レコードに分けるため、#10 が保留していた「variant名が代表レコードとどう対応するか」という論点自体が消える。**Task 9 の完了時に #10 を登録簿から削除する。**

**#3（共有フロア削減）**は Task 5 と関係する。注記表示を client component にすると共有フロアが増えるため、Server Component 側で渡す（§9）。

**#1・#2・#7・#8** はいずれもUIで、本計画とは無関係。登録簿に残す。

---

## 13. 既知論点（未解決を含む）

以下は本書から削除せず、実装前のgo/no-goで状態を更新する。計画へ手順を書いたことを
「解決済み」や「実装済み」と扱わない。

| # | 現状 | 担当・入力・出力・停止条件 |
|---:|---|---|
| 1 | ①・②とも未実装Taskが多く、見積もり未確定 | program ownerがTask別見積もり・担当・依存を承認するまで実装日程を確約しない |
| 2 | report scriptの4 state対応は未実装 | Task 1担当がfixtureと4 state出力を実装。`--state`未対応ならTask 3停止 |
| 3 | deploymentStage 134件の人手判定が単一障害点。代替経路なし | data owner + reviewer、入力TSV、出力stage 177/177。期限・担当未確定ならTask 1 Step 5.5停止 |
| 4 | Japan availability 49機と公開判断の担当・期限不足 | content ownerが担当・reviewer・期限をenrichment manifestへ追加するまで該当recordのpublish停止 |
| 5 | B14は別計画のみ | program ownerが別計画の完了証跡を確認。本計画では実装済みとしない |
| 6 | distributorの最終保存先未定義 | Task 8 Step 3のarchitecture decisionが未承認ならTask 8停止 |
| 7 | evidenceLevel追加を見送り | reliabilityと同一ではない。consumerと判定基準が未確立のため別decisionで再検討（DEC-S13） |
| 8 | 外部resourceの契約・費用・責任者未確定 | ①Task 0の資源表で全owner / cost / credential / retentionが閉じるまで①Task 2停止 |
| 9 | Source metadataのtitle / reliabilityは人手判断が正式gate | metadata reviewer、URL集合、承認済みJSON、missing 0が揃わなければTask 9停止 |
| 10 | 削除済み旧計画からの継承確認は不能 | 現存SoTと本書だけをreview対象にし、「全判断を継承済み」とは主張しない |
