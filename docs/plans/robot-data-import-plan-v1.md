---
status: plan
updated: 2026-08-08
---

# ロボットデータ投入 実行計画 v1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google Sheets のHTML書き出しを原本として、Payload + PostgreSQL へ 177機のロボット・59社のメーカー・28シリーズ・導入事例を投入する。

**Architecture:** 原本HTML → 正規化JSON（`data/import/*.json`、実装済み）→ Payload Local API。TSファイル（`data/*.ts`）を経由しない。既存63件は移行計画が Payload へ移し終えている前提で、その上に差分を当てる。

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
② 本計画                                             原本から177機ぶんの差分を投入する
```

①が終わっていないと②は始められない（§0 のゲート）。

**経緯**: 当初は「TSファイル（`data/*.ts`）を整えてから移行する」前提の計画だった。2026-08-08 に人間が「公開URLの維持は不要」「1週間程度の停止は許容」と判断し、移行の最も高くつく制約が2つとも外れたため、**移行を先にやる**方針へ変えて書き直した。旧計画は削除済み（決定事項は本書へ引き継いだ）。

**吸収した計画**: `robot-data-r02-integration-plan-v1.md`（R02-09・R02-11）、`robot-data-factcheck-impl-plan-2026-07-01.md`（Phase C）。いずれも `docs/archive/`。

## Global Constraints

- 既存の `id` を変更しない。他コレクションからの参照に使う（**公開URL / `slug` の維持は不要** — 2026-08-08 の人間判断）
- 新規レコードは `publishStatus: 'draft'` で始める（`ai/rules/21-data-maintenance-workflow.md` G9）
- スペックキーは `lib/specSchema.ts`、タグは `lib/tagRegistry.ts` に登録済みの値のみ使う（G7）。**これらは Git 管理を継続する**（`content-platform-and-database-architecture-v2.md` §5.2）
- 本番Postgresへ SQL で直接書き込まない。Payload API / MCP を通す（同 §7.3）
- 挙動変更・構造改善・見た目変更を同じ task に混ぜない（`ai/rules/10-workflow.md`）
- 1 task = 1 commit。**例外は Task 9** — ただし「1メーカー1 Git commit」は **DB変更の
  revert 単位にならない**（Payload へ書いた134件は Git 差分にならない）。Task 9 は
  **1メーカー1 transaction ＋ 1 audit artifact**（run ID・作成/更新した `stableId` の一覧・
  before/after の件数）とし、Git には artifact だけを commit する
- 新しい validation ゲートは、**わざと違反を仕込んで赤くなることを確認してから**採用する
- データ変更の各 task 末尾で検証を実行し、error 0 を確認する

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

- [ ] **G-2: 10コレクションが定義されている**

```bash
ls collections/
```
Expected: `Manufacturers` / `Robots` / `RobotSeries` / `Distributors` / `UseCases` / `Deployments` / `Articles` / `ArticlePlacements` / `Media` / `Admins`。

**`RobotSeries` と `Distributors` は①の Task 3 で追加する**（移行計画の「2026-08-08 突合結果」§D）。無ければ①が未完了。

- [ ] **G-3: 既存データが Payload に入り、parity が取れている**

```bash
shasum -a 256 docs/reference/cutover-baseline-snapshot.json
npm run content:compare -- --baseline docs/reference/cutover-baseline-snapshot.json
```
Expected: 件数・ID集合・参照・公開状態が一致。robots 63 / manufacturers 26 / useCases 44 / articles 34 / deployments 11。

**「local vs payload」ではなく「baseline vs payload」で比較する。** ①の Task 9 で
local TS を撤去すると比較元が消えるため、Task 5 Step 7 で固定した署名付き snapshot を使う。

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

- [ ] **G-6: 本番と検証でDBが分かれている**

Preview デプロイと本番が同じDBを見ていないことを確認する。Git はブランチで分かれるが**DBは分かれない**ため、Preview の編集が本番に出る事故が起きうる。

- [ ] **G-7: 復旧手順が動く**

```bash
npm run content:export
```
Expected: エクスポートが生成される。**投入前に1回取っておく。**Task 9 は134件を入れるので、戻す先が要る。

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

**原本はスペック表であって Deploid のコンテンツではない。** 原本が持つのは15のスペック列と製品ページURL 1本だけ。Deploid 側にしかないものは次のとおりで、**原本から再生成できない**。

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

**件数を手で数えない。** 原本が更新されたら `npm run parse:robot-db -- --out data/import` → `npm run report:robot-db-diff` の順で回す。期待値16項目を機械照合し、1つでも外れたら exit 1。

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
| **Series へ移管**（Task 3） | **−6** | — | **+6** |
| Series 新規作成（Task 3） | — | — | +22 |
| `apptronik-apollo-2` の分割（Task 7） | +1 | — | — |
| 新規追加（Task 9） | +134 | +33 | — |
| **本計画の完了時** | **192** | **59** | **28** |

**移管分を引き忘れない。** `63 + 134 + 1 = 198` は誤り。`63 − 6 + 1 + 134 = 192`。

**移管は6件で、レポートが出す「親レコード7件」とは別物。** レポートの7件には
`ubtech-walker-tienkung` が含まれるが、これは A群（ファミリ名が機種として存在しない）に
該当しない。逆に A群の `R1` は Galaxea Dynamics のファミリで、Unitree の
`unitree-r1-standard` とは無関係（ファミリ名だけで突き合わせると誤マッチする）。
**`npm run report:robot-db-diff` の「シリーズ manifest」節が正本**で、メーカー名で限定して
移管元を確定させる。

**177 は原本の行数であって最終レコード件数ではない。57 は代理店シートの行数であってメーカー件数ではない。** 混同しない。

新規134件は `draft` で投入するため、投入直後の published は次のとおり。

```
現行 published            57
 −1  onex-eve を archived（DEC-S02）
 −6  Series へ移管（Task 3。6件すべて published。移管後は robots ではなくなる）
────
     50 件
```

**Series 自体の公開状態は別途決める**（新規finding 10。Task 3 と Task 4 の間にゲートが要る）。
以降、値を確認したものから昇格する。

### 3.2 メーカーの3つの母集団

| 母集団 | 件数 |
|---|---|
| 代理店シートの行 | 57 |
| ロボットシートの対象内メーカー | 57 |
| 現行 `manufacturers` | 26 |

**実測**: ロボットシートの57社と代理店シートの57社は**同一集合**（Task 1 のレポートが毎回検証する）。したがって Task 9 の新規134件で dangling `manufacturerId` は発生しない（G5）。現行26社のうち代理店シートに含まれるのは24社で、含まれない `Aeolus Robotics` / `Pudu Robotics` は削除せず残す。

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

**対象28件は性質が2つに分かれる。**

| | 件数 | 内容 | 目的 |
|---|---|---|---|
| **A** | 14 | ファミリ名が機種として存在しない（`T1` `K1` `T800` `PM01` `G1-D` `A2` `H2-D` `T2` `4NE1` `KUAVO 4PRO` `KUAVO 5` `Oli` `Bumi` `R1`(LimX)） | **正しさ。** いま useCase が誤表示になる |
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
→ **既存の `Source.reliability` と重複する**。`reliability` は `verified` / `official` / `reported` / `estimated` で581本が使用中（`official` 495・`reported` 85・`verified` 1）。出所の種類は `RightsMeta.sourceType` にもある。元計画自身が「全 data/*.ts の sources[] に追記（作業量大）」と書いており、**581本を貼り直して消費先が無い**状態になる。

**同じ計画が生んだ `marketAvailability` が、追加されてから一度も画面に出ないまま DEC-S05 で削除される。** 同じ失敗を繰り返さない。将来必要になったら、`reliability` の値を増やすか置き換えるかで対応する。

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
| `id` / `slug` / `name` / `manufacturerId` | 導出できる |
| `sources` | 製品ページURLが177/177行にある |
| `category` | 移動方式から導出（`固定スタンド`→`upper-body-humanoid`、`車輪`＋双腕→`mobile-manipulator`、`二足`→`humanoid`） |
| `japanAvailability` | 代理店シートから（DEC-S03） |
| `summary` | 列がない。日本語1〜2文を原本の値と出典に基づいて書く |
| `deploymentStage` | 列がない（DEC-S04） |

---

## 6. File Structure

### 既に存在するもの（①の前に実装済み。作り直さない）

| Path | 責務 |
|---|---|
| `scripts/parse-robot-db.ts` | HTML → 正規化JSON。取り消し線判定・結合セル前方補完・`<a href>` 抽出 |
| `scripts/report-robot-db-diff.mjs` | 突合レポート。期待値16項目を機械照合 |
| `data/import/robots.json` / `manufacturers.json` / `deployments.json` | 正規化結果 |
| `tests/unit/data/parse-robot-db.test.ts` | パーサの単体テスト13件 |

### 新規作成

| Path | 責務 |
|---|---|
| `scripts/import-robot-db-to-payload.mts` | 正規化JSON → Payload Local API。冪等 |
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

### Task 1: 原本を再パースし、突合先を Payload へ切り替える

**Files:**
- Modify: `scripts/report-robot-db-diff.mjs`
- Create: `~/Downloads/ロボDB 2/stage-deployment-paste.tsv`

- [ ] **Step 1: 最新の原本をパースする**

```bash
npm run parse:robot-db -- --out data/import
```
Expected: `robots.json` 197件 / `manufacturers.json` 57件 / `deployments.json` 41件。

- [ ] **Step 2: 突合先を Payload へ切り替える**

**source の差し替えだけでは済まない。** 現在の `scripts/report-robot-db-diff.mjs` は
`lib/data/localContentSnapshot.ts` を同期で読む約280行の script。次が要る。

1. repository の非同期 query への書き換え（`await` 化、接続失敗時の扱い）
2. **期待値を Task ごとの manifest へ移す。** 現在の18項目は着手前 baseline を固定値で
   持っており、Task 3（移管6件）と Task 7（分割1件）で**自ら失敗する**
3. fixture 注入（テストから Payload を立てずに走らせる経路）
4. 出力契約の更新

**Step 2 は独立した実装単位として扱い、1コミットにまとめない。**

- [ ] **Step 3: 検算**

```bash
npm run report:robot-db-diff
```
Expected: exit 0、16項目すべて `✓`。母集団177 / 一致43行(42レコード) / 追加134 / 一致しない21 / メーカー完了時59 / DEC-S08 の親レコード7。

**レポートの期待値は着手前の baseline であり、Task 3 以降は自ら失敗する。** 現在の
`scripts/report-robot-db-diff.mjs` は robots 63件を前提に値を固定している。Series 移管（Task 3）と
Apollo 2 分割（Task 7）で件数が動くため、**各 Task 後の期待状態を manifest 化し、同じ固定値を
使い続けない**（新規finding 9）。

**数字が合わない場合、§2〜§3 を直す前に正規化規則の取りこぼしを疑う。**

- [ ] **Step 4: 除外行の一覧を人が確認する（§1.1）**

レポートの「除外した行」20件に目を通す。取り消し線はヒューリスティックで、`Sunday Robotics` で実際に記入ミスが見つかっている。

- [ ] **Step 5: `deploymentStage` 記入用TSVを生成する**

197行、シートと同じ行順。43行は現在の値を転記済み、取り消し線の行は「対象外」。参考列に提供状況・対応モデル列挙・スペック充足・製品URL。

- [ ] **Step 6: コミット**

**完了条件:** `npm run report:robot-db-diff` が exit 0。TSV が生成され、記入対象が134行であること。

---

### Task 2: 陳腐化した `deploymentStage` の修正と片方向ゲート（DEC-S07）

**Files:**
- Modify: `collections/Robots.ts`
- Test: `tests/content/discontinued-publish-status.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`discontinued` かつ `published` を error にする。**`archived` かつ `discontinued` 以外を error にしないテストも書く**（`onex-eve` のケース。双方向ゲートへの退行を防ぐ）。

- [ ] **Step 2: 失敗を確認 → 片方向 validation を実装 → PASS**

- [ ] **Step 3: 陳腐化した3件を直す**

`fourier-gr1` / `fourier-gr2` / `apptronik-apollo` を `discontinued` へ。根拠は各レコード自身の `summary`。`sources[].checkedAt` と `updatedAt` を更新する。

- [ ] **Step 4: ゲートが赤くなることを確認（Global Constraints）**

`fourier-gr1` の `publishStatus` を一時的に `published` に戻す。Expected: **検証が exit 1**。確認できたら戻す。**この確認をせずに次へ進まない。**

**完了条件:** 3件が `discontinued`、意図的な違反で検証が exit 1、`onex-eve` が error にならない。

---

### Task 3: シリーズ28件を作る（DEC-S08）

**Files:**
- Create: 28件の `robotSeries` レコード
- Modify: `collections/RobotSeries.ts`（validation）

- [ ] **Step 1: レポートにシリーズ候補の検出を足す**

構成が2件以上のファミリを A / B に分けて出す。**28件を手で書き写さない。** ファミリ推定は接頭辞処理なので、出力を人が確認して確定する。

- [ ] **Step 2: 失敗するテストを書く → validation を実装**

`seriesId` が `robotSeries` の実在レコードを指すこと / `slug` が `robots` と横断で一意であること / シリーズが `priceOffers` を持たないこと。**「構成を1件以上持つ」は Task 9 まで warning**（この時点では variant が未投入のため）。

- [ ] **Step 3: 28件を作る**

**内訳は 28 = A群14 + B群14。** A群のうち既存の Robot レコードがあるのは一部だけで、
残りは新規作成になる。**「移管7 + 新規14 = 21」では7件足りない。**

| | 件数 | 扱い |
|---|---|---|
| A群のうち既存 Robot がある | 7 | **移管。** `id` と `slug` を引き継ぐ（URL が動かない） |
| A群のうち既存 Robot が無い | 7 | 新規作成（構成がすべて新規追加分のため） |
| B群 | 14 | 新規作成。ファミリ名が機種と衝突するため `unitree-g1-series` のような slug を新設 |

**A群14件の一覧と、レポートが出す「親レコード7件」は一致しない。** レポートの7件には
`ubtech-walker-tienkung` が含まれるが、DEC-S08 の A群一覧には `Walker Tienkung` が無い。
ファミリ推定（接頭辞処理）と親レコード検出（孤立レコードとの突合）が別の走査だったため。
**Step 1 の manifest で両者を突き合わせ、28件を確定させる。**

公開ゲートは Manufacturer と同じ水準（`id` / `slug` / `name` / `manufacturerId` / `summary` / `sources` 非空）。`sources` はメーカーのシリーズ製品ページ。

- [ ] **Step 4: 既存 Robot に `seriesId` を付ける**

- [ ] **Step 5: 移管対象を指す16件の参照を移行する**

`npm run report:robot-db-diff` の「移管対象IDを指す参照」節が一覧を出す。
**Robot を消す前に、16件すべての移行先を決める。**

| 参照元 | 件数 | 移行先 |
|---|---|---|
| `useCase.candidateRobots[].robotId` | 12 | `seriesId` へ（Task 4。根拠URLはシリーズ製品ページのまま） |
| `article.relatedRobotIds` | 4 | **要判断** — Article がシリーズを参照できるようにするか、具体的な variant へ付け替えるか |

Article 4件は `china-humanoid-duopoly-agibot-june2026` / `china-humanoid-demand-gap-june2026` /
`humanoids-summit-tokyo-may2026` / `agibot-manufacturer-guide`。
**メーカー解説の `lineup` にも `agibot-a2` があるため、そこも確認する。**

```bash
npm run report:robot-db-diff
```
Expected: 「移管対象IDを指す参照」が16件。**移行後に0件になることを Task 4 の完了条件で確認する。**

- [ ] **Step 6: ゲートが赤くなることを確認 → コミット**

**完了条件:** `robotSeries` が28件、検証が error 0、意図的な違反で exit 1。

---

### Task 3.5: シリーズの公開状態を決める（§3.1 の宿題）

**Files:**
- Modify: `data/robotSeries.ts`（または Payload 上のレコード）
- Test: `tests/content/series-publish-gate.test.ts`

**Global Constraints は「新規レコードは draft」としているが、Task 4 は published な useCase から
シリーズを参照させる。** draft のままだと公開ページで解決できず、published にするなら
人間の承認と公開ゲートが要る。**Task 4 の前に決める。**

- [ ] **Step 1: 28件の公開状態を決める**

| 由来 | 件数 | 初期状態 |
|---|---|---|
| 既存 Robot から移管（すべて現在 published） | 6 | **published**。既に公開されていた実体なので状態を引き継ぐ |
| A群の新規作成 | 8 | **draft**。構成が Task 9 まで入らないため |
| B群の新規作成 | 14 | **draft**。同上 |

- [ ] **Step 2: published な useCase が draft な Series を参照しないゲートを足す**

```ts
it('published な useCase は draft の series を候補にできない', () => {
  const snapshot = structuredClone(localContentSnapshot);
  const series = snapshot.robotSeries.find((x) => x.publishStatus === 'draft')!;
  const useCase = snapshot.useCases.find((u) => u.publishStatus === 'published')!;
  useCase.candidateRobots[0] = { ...useCase.candidateRobots[0], robotId: undefined, seriesId: series.id };

  expect(
    validateContentSnapshot(snapshot).errors.some((e) => e.startsWith('[candidate-series-draft]')),
  ).toBe(true);
});
```

- [ ] **Step 3: ゲートが赤くなることを確認 → コミット**

**完了条件:** 28件の公開状態が決まり、published な useCase から draft な Series を
参照すると exit 1 になることを確認済み。

---

### Task 4: シリーズの表示と useCase 参照の切り替え（DEC-S08）

**Files:**
- Modify: `src/app/robots/[slug]/page.tsx`, `src/app/sitemap.ts`, `lib/searchIndex.ts`, `lib/uiText.ts`
- Create: `components/SeriesVariantList.tsx`
- Modify: `collections/UseCases.ts`（`seriesId` 排他 validation）
- Test: `tests/unit/components/series-variant-list.test.tsx`

- [ ] **Step 1: 失敗するテストを書く → `SeriesVariantList` を実装 → PASS**

構成を名前つきで並べる。構成が空なら何も描画しない。

- [ ] **Step 2: `/robots/[slug]` に series 分岐を足す**

`generateStaticParams` にシリーズの slug を加える。series では `archivedNotice` を出さず構成一覧を出す。Robot 側には所属シリーズへの導線。文言は `lib/uiText.ts` に置く。

- [ ] **Step 3: useCase の候補14件を `seriesId` へ付け替える**

根拠URLは変更しない（もともとシリーズ製品ページを指している）。

- [ ] **Step 4: sitemap と検索にシリーズを載せる**

- [ ] **Step 5: 検証と手動確認**

```bash
npm run check
```

`/robots` のカード数は **50件**（published 57 − onex-eve 1 − Series へ移管 7 − ... §3.1 の49に Task 7 の分割分を考慮）。**「57のまま」ではない。**実際の数は §3.1 の計算と一致することを確認する。シリーズは一覧に出ない。`/use-cases/research-development` の候補に「T1（提供終了）」が出ないこと。390px で崩れないこと。

**ビジュアル回帰のベースライン再生成が要る。** スナップショットは24枚あり、ファイル名に OS 名が入る（`-darwin` / `-linux`）。macOS では linux 分を生成できないため `.github/workflows/update-visual-baselines.yml` を手動実行する。**このジョブの push は CI を起動しない**ので、`gh workflow run ci.yml --ref <branch>` を別途叩く。

**完了条件:** シリーズの詳細が構成一覧を出し、useCase の候補が「提供終了」表示にならない。
**`npm run report:robot-db-diff` の「移管対象IDを指す参照」が0件になる。**`/robots` のカード数が §3.1 の計算と一致する。

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

### Task 6: 既存42件を更新

- [ ] **Step 1: 差分のある値だけを当てる**

Task 1 のレポートで差分が出た値のみ。`specSchema` に無い列（`可搬重量`）は `loadRatings[]` へ。バッテリーは mAh 単位（積み残し登録簿 #10）。

- [ ] **Step 2: `updatedAt` と `sources[].checkedAt` を更新 → 検証 → コミット**

**完了条件:** レポートの「更新」差分が0。

---

### Task 7: 名前ずれ3件・`onex-eve`・`Apollo 2` の分割

- [ ] **Step 1: 名前を直す**

`mentee-menteebotv3`「MenteeBot」→「MenteeBot V3」、`kawasaki-kaleido`「Kaleido」→「Kaleido9」、`neura-4ne-1` を `4NE1 Gen 3.5` の値へ。**`id` は変更しない。**

- [ ] **Step 2: `onex-eve` を archived にする（DEC-S02）**

`deploymentStage` は `limited-production` のまま。

- [ ] **Step 3: `apptronik-apollo-2` を2レコードへ分割する**

シートは `Apollo 2（Biped）` と `Apollo 2（Wheeled）` の2行を持ち、移動方式が二足と車輪で異なる。既存 `id` を Biped 側が継承し、Wheeled を新規 `id` で追加する。

**波及範囲（実測）**: `useCases` の `candidateRobots[].robotId` から**7箇所**、`apptronik-apollo` の `supersededById` から1箇所。既存 `id` を Biped が継承するので**7箇所はそのまま Biped を指す。付け替えはしない**（§11）。

- [ ] **Step 4: 検証 → コミット**

**完了条件:** 名称3件・archived 1件・分割1件が反映され、参照切れなし。

---

### Task 8: `deployments` と `manufacturers` を拡充

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

**代理店シートの「提供事業者 / 事業者種別 / 入手方法 / 対応モデル / 申込先」は、`distributors` コレクションへ移せる形で保持する。** 自由文の注記へ潰さない（§11）。

- [ ] **Step 4: 検証**

```bash
npm run check:world-map-asset
```
Expected: 緑。赤い場合は `npm run generate:world-map` で再生成する。

- [ ] **Step 5: 手動確認 → コミット**

`/` の世界地図で追加した拠点が意図した位置に出ること、arc が破綻していないこと。

**完了条件:** 取り込み判断の結果と、外した行の理由を完了報告に記録する（G11）。`manufacturers` が59社。

---

### Task 9: 新規134件を投入（§5 完了後）

**Files:**
- Create: `scripts/import-robot-db-to-payload.mts`

- [ ] **Step 1: 原本を再パースする**

```bash
npm run parse:robot-db -- --out data/import
```
Expected: `deploymentStage` 列が正規化JSONに入る。

- [ ] **Step 2: 冪等な importer を書く**

**`id` で upsert する、では足りない。** ①は domain の `id` を Payload の `stableId`
フィールドへ保存し、Payload 内部IDを公開参照に使わない設計。したがって importer の契約は
**「入力JSONの `id` を `stableId` で検索し、あれば update、無ければ create」**になる。

- 疎なJSON（一部フィールドしか持たない）で update するとき、**既存フィールドを消さない**
- メーカー単位で transaction を張る（Step 3）
- `--dry-run` で作成/更新される件数だけ出せる
- 部分失敗したとき、どこまで進んだかが分かる
- relationship（`manufacturerId` / `seriesId`）は `stableId` から Payload ID へ解決する

同じJSONで2回流しても結果が変わらないことをテストで固定する。

- [ ] **Step 3: メーカー単位で投入する**

**1メーカー1 transaction。**Unitree 19機 / Leju 18機 / UBTECH 12機が最大。
`publishStatus: 'draft'` で入れ、`seriesId` を設定する。

各 run について次を artifact として残し、Git へ commit する。

```
run ID / 対象メーカー / 作成した stableId 一覧 / 更新した stableId 一覧 / before・after の件数
```

**戻すときはこの artifact から inverse operation を組む。**Git revert では戻らない。

- [ ] **Step 4: Task 3 の warning を error へ上げる**

「シリーズは構成を1件以上持つ」を error にし、わざと1つの `seriesId` を外して exit 1 を確認する。

- [ ] **Step 5: 全件投入後の総合検証**

```bash
npm run check
npm run report:robot-db-diff
```

- [ ] **Step 6: ページ重量を実測して記録**

**測る状態を取り違えない。** `/robots` に出るのは published のみで、本 task は134件を `draft` で入れる。したがって**完了直後の測定値は増えず、150KB ゲートは発火しない。**

published 件数とバイト数を対で記録し、**1件あたりのバイト数が現行の約645 B から増えていないか**を見る。published になり得るのは archived を除く分で、全件昇格時の外挿は約124KB。

- [ ] **Step 7: `/compare` のツリー行数を実測し、別計画を起票する（DEC-S08）**

投入後の選択ツリーは **59社 + published な Robot 件数**になる。現在は約83行。**177 は原本の行数であって Payload のレコード数ではない**ので、実測して記録する。実測して記録し、**メーカー → シリーズ → 機種 の3段カスケードを別計画として起票する**。

**完了条件:** `robots` が **192件**、`robotSeries` が28件、`npm run check` が全緑（§3.1）。

---

### Task 10: 全件回帰監査（R02-11 の吸収）

- [ ] **Step 1: 全レコードの公開ゲートを機械確認する**

published なレコードが §F の必須項目をすべて満たすこと。

- [ ] **Step 2: 出典URLの死活を確認する**

```bash
npm run check:source-links
```

**対象URL数を記録する。** 581本から大きく増えるため、重複が3桁に達していないかを見る（`data-architecture-redesign-v1.md` §11.45 の判断条件）。

- [ ] **Step 3: 主要routeの手動確認（§10）**

**完了条件:** §10 のチェックリストが全項目完了。

---

## 8. 順序制約

```
§0 前提ゲート（①の完了）
   ↓
Task 1（再パース・突合先切替）
   ↓
Task 2 ─→ Task 3 ─→ Task 4        スキーマとシリーズ
   │                   ↓
   └─→ Task 5（UI・独立）          注記表示
   ↓
Task 6 ─→ Task 7                  既存データの更新
   ↓
Task 8（deployments / manufacturers・独立）
   ↓
Task 9（§5 完了が前提）─→ Task 10
```

- **Task 3 → 4 の順**。データを入れてから表示を切り替える
- **Task 3 の「シリーズは構成を1件以上」は Task 9 まで warning**。Task 3 時点では variant が0件のため、error にすると自分自身が落ちる
- **Task 8 は Task 9 より先**。新規134件の `manufacturerId` が参照整合性チェック（G5）に引っかかる
- **Task 5 は独立**。UIのみで他のデータ変更に依存しない

---

## 9. リスクと軽減策

| リスク | 影響 | 軽減策 |
|---|---|---|
| ①が未完了のまま着手する | Payload が無い状態で投入して失敗する | §0 のゲート7項目。1つでも欠けたら①へ戻る |
| 投入で既存63件を壊す | 出典581本・fieldEvidence 455項目が失われる | §0 G-7 で投入前にエクスポートを取る。importer は `id` で upsert し、既存フィールドを消さない |
| Task 3 のゲートが空振りする | 「落ちないゲート」が増える | 各ゲートでわざと違反を仕込み exit 1 を確認する |
| Task 4 でビジュアル回帰が陳腐化 | CI が赤のまま放置される | `update-visual-baselines.yml` を手動実行し、`gh workflow run ci.yml` を別途叩く |
| Task 8 で世界地図の static asset が陳腐化 | Home の地図が古い拠点のまま | `check:world-map-asset` を検証に入れ、赤なら再生成 |
| Task 9 で注記本文が client bundle へ漏れる | 共有フロア増加 | Server Component 側で渡す。`check:bundle-content` の最大 hit 数を記録する |
| `deploymentStage` を人が埋め間違える | カタログの絞り込みが誤る | §5.1 の8分岐を製品ページで1回通す。43行は現在の値を転記するので判断は134行 |
| 原本がユーザー環境にしかない | 他の環境で再現できない | 正規化JSON（`data/import/*.json`）をコミットする |

**副作用が及ぶ既存機能**: `/robots`（カード・検索・フィルタ）、`/robots/[slug]`、`/compare`、`/manufacturers`、`/manufacturers/[slug]`、`/use-cases/[slug]`、`/`（世界地図）。

---

## 10. 検証

### コマンド

```bash
npm run parse:robot-db -- --out data/import   # 原本の再パース
npm run report:robot-db-diff                  # 突合（期待値16項目）
npm run check                                 # 全ゲート
npm run check:world-map-asset                 # Task 8
npm run check:source-links                    # Task 10
npm run content:compare               # §0 G-3（①が作る）
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
- **全機種へのシリーズ定義と3段カスケードUI。** 本計画で入れるのは `RobotSeries` 型と28シリーズだけ。**Task 9 Step 7 で起票する**
- **`draft` → `published` の昇格**（最大134件）。本計画はレコードを投入するところまで。**昇格しない限り `/robots` のカードは今より減る**（§3.1）。昇格基準と担当は別途決める
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
