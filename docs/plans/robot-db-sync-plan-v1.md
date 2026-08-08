---
status: plan
updated: 2026-08-08
---

# ロボットDB同期 実行計画 v1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `~/Downloads/ロボDB/ロボDB/*.html`（Google Sheets のHTML書き出し、5ファイル）を原本として `data/*.ts` を同期し、同期の過程で判明した「買えるか」軸の重複と、表示されない注記フィールドを解消する。

**Architecture:** HTML をパーサで正規化JSON（`data/import/*.json`）へ落とし、そこから `data/*.ts` を更新する。正規化JSONをコミットすることで、原本が更新されたときの差分がレビュー可能になる。スキーマ整理（重複フィールドの削除・未表示フィールドの接続）はデータ大量投入より前に行い、1ファイルのうちに済ませる。

**Tech Stack:** TypeScript, Next.js 16 App Router, React 19, Vitest, Playwright, Node `--experimental-strip-types`

この文書は実装や権利判断の正本ではない。矛盾した場合は次の順で現行実装を優先する。

1. `data/types.ts`、`lib/specSchema.ts`、`lib/tagRegistry.ts`
2. `docs/decisions/data-maintenance-checklist-v1.md`
3. `ai/rules/21-data-maintenance-workflow.md`
4. 本計画

## Global Constraints

- 既存の `id` を変更しない。`slug` を変える場合のみ `previousSlugs` へ旧値を足す（`ai/rules/20-data.md`）
- 新規レコードは `publishStatus: 'draft'` で始める（`ai/rules/21-data-maintenance-workflow.md` G9）
- スペックキーは `lib/specSchema.ts`、タグは `lib/tagRegistry.ts` に登録済みの値のみ使う（G7）
- ラベルは `lib/labels.ts`、UI文言は `lib/uiText.ts` を正本にする。コンポーネントへ直書きしない
- 色は `lib/visualSemantics.ts` と `src/app/globals.css` のトークンを使う。色リテラルを書かない（`ai/rules/30-ui-design.md`）
- 画像は `rights` メタデータなしに公開しない。`src: ''` は valid（`ai/rules/40-content-rights.md`）
- 挙動変更・構造改善・見た目変更を同じ task に混ぜない（`ai/rules/10-workflow.md`）
- 1 task = 1 commit。**例外は Task 12 のみ** — 134件を1コミットにすると revert 単位が粗すぎるため、意図的に1メーカー1コミット（33コミット以上）にする。§9.1 のロールバックはこの粒度に依存する
- 新しい validation ゲートは、**わざと違反を仕込んで赤くなることを確認してから**採用する
- `npm run validate:data` はデータ変更の各 task 末尾で実行し、error 0 を確認する

---

## 1. 原本の定義

CSV書き出しは使わない。セルのハイパーリンクを落とすため出典URLが消える。HTMLなら `<a href>` として残る。

| ファイル | 実データ行数 | 対応コレクション | Deploidスキーマとの距離 |
|---|---|---|---|
| `発表済みロボット.html` | 198 | `robots` | 18列が `specSchema` とグループ単位で一致。値は日本語自由文。出典は機体あたり製品ページ1本 |
| `導入事例＿世界地図用.html` | 41 | `deployments` | 列名が `id/slug/manufacturerId/robotId/customer/country/latitude/longitude/status/…` と一致。`sources` はJSON配列 |
| `代理店とか.html` | 57（1社1行） | `manufacturers` | `japanPresence` / 各注記に対応。全57行に情報源URL＋確認日 |
| `モデル突合マスタ（内部）.html` | 19 | — | Unitreeのみ。57社分は存在しない。参照用 |
| `未発表ロボット.html` | 6 | — | 社名のみ、機種名なし。対象外 |

`<tr>` 要素数（204 / 303 / 105 / 22 / 8）はセル結合を含むため実データ行数と一致しない。パーサは結合セルを前方補完してから行を数える。

### 1.1 取り消し線 ＝ 対象外

Google Sheets の取り消し線は、HTML書き出しでは `text-decoration:line-through` を含むCSSクラス（`発表済みロボット.html` で30種）として残る。

**判定は機種名セルの `class` のみで行う。メーカー名セルの取り消し線は使わない。**

判定が現行データと整合していることを確認済み。

- Fourier `GR-1` / `GR-2` に取り消し線 → Deploidでも既に `publishStatus: 'archived'`
- X-Humanoid は `Tian Kung 2.0` 系・`3.0 Lite` / `3.0 Pro` に取り消し線、現行の `具身天工3.0` / `天轶2.0` は残る
- ROBOTIS は `OP3` / `THORMANG3` に取り消し線、`AI Sapiens K0` / `AI Worker` 系は残る
- ugo は `ugo Pro R&D` / `ugo Ex` に取り消し線、`ugo Pro` は残る

### 1.2 メーカー名セルの取り消し線を使わない理由

`Sunday Robotics` はメーカー名セルに取り消し線があるが、**原本の記入ミス**である
（人間が2026-08-08に確認）。同社の2行は性格が異なる。

| 行 | 機種名セルの斜線 | 実態 |
|---|---|---|
| `ACT-2` | **あり** | `https://www.sunday.ai/blog/act-2-preview`。スペック列が1つも埋まっていない。**ロボットではなくAIモデル名**（Action Chunking Transformer）。対象外で正しい |
| `Memo` | **なし** | 170cm / 77.1kg / 56 DoF（腕27＋手24＋胴1＋下半身4）/ 双腕24-DoFハンド / 車輪 / 自律（ACT-1・ACT-2）。**発表済みロボットとして登録する** |

メーカー名セルの斜線で除外すると `Memo` を誤って落とす。機種名セルのみで判定すれば
`ACT-2` は除外され `Memo` は残り、両方とも正しくなる。

メーカー名セルに取り消し線があるのは `Sunday Robotics` **1社のみ**で、
ルールをこう変えても他に影響しない（実測、2026-08-08）。

**取り消し線判定は手入力の原本に対するヒューリスティックであり、絶対ではない。**
この1件は実際に誤りだった。Task 2 の突合レポートで除外行の一覧を出し、
**人が一度目を通す**こと。

---

## 2. 母集団

```
198 行
 −17  機種名セルの取り消し線（§1.1）
  −4  AELOS PRO3 / LITE / PRO / SMART
────
177 行 / 57メーカー
```

AELOS は 34.6×22.4×11.8 cm・1.73 kg・簡易ハンド・Blockly／Python の卓上STEM教育玩具。人間が対象外と決定（2026-08-07）。

**身長は分類軸として使わない。** 最大寸法100cm未満の16行には、上半身固定型で 65 kg・43 DoF・XHAND 1（12DoF五指）の `RobotEra M7`（79.2cm）や、可搬2〜4kg（片腕）の `Unitree R1-A5` / `R1-A7`（70 / 83.5cm）が含まれる。いずれも業務機であり、身長で切ると誤って落ちる。実際に効く軸はハンドと可搬（AELOS は可搬値が存在しない）。

`G1-Boxing` は取り消し線があり、機種名が「独立機種ではない」、移動方式セルが「G1の競技用途（対象外）」。別機体ではなく G1 の用途違いなので独立レコードにしない。

---

## 3. 突合結果（2026-08-07 実測）

現行 `data/robots.ts` は63件（published 57 / archived 4 / draft 2）。

| | 件数 |
|---|---|
| 更新（両方にある） | **43行 → 42レコード** |
| 追加（シートにあってDeploidに無い） | 134行 |
| Deploid側で一致しない | 21レコード |

**行とレコードの数が一致しない。** `43 + 134 = 177`（母集団の行数）だが、更新対象の Deploid レコードは42件しかない。`apptronik-apollo-2` の1レコードにシートの2行（`Apollo 2（Biped）` / `Apollo 2（Wheeled）`）が対応しているため。**DEC-S01（variant は別レコードに分ける）に従えば、この1レコードは2レコードへ分割する**（Task 9）。移動方式が二足と車輪で異なり、同一レコードに畳めない。

### 3.0 最終レコード件数

| | 件数 |
|---|---|
| 現行 | 63 |
| 追加 | +134 |
| `apptronik-apollo-2` の分割 | +1 |
| **完了時** | **198** |

**177 は「シート側の母集団の行数」であって、Deploid の最終レコード件数ではない。** 両者を混同しないこと。差の21件は、シートに対応行が無い Deploid 側レコード（§3.2）。

このうち公開されるのは一部にとどまる。新規134件は `publishStatus: 'draft'` で投入する（Task 12）ため、投入直後の published は現行57件から `onex-eve` を archived にした **56件**。以降、値を確認したものから昇格する。

### 3.0.1 最終メーカー件数

robots と同じ「シート行数 ≠ レコード件数」の罠がメーカー側にもある。3つの母集団は別物。

| 母集団 | 件数 |
|---|---|
| 代理店シートの行 | 57 |
| ロボットシートの対象内メーカー | 57 |
| 現行 `data/manufacturers.ts` | 26 |

**実測（2026-08-08）:**

- **ロボットシートの57社と代理店シートの57社は同一集合**（実測、2026-08-08）。
  したがって Task 12 の新規134件で dangling `manufacturerId` は発生しない（G5 は安全）
- 現行26社のうち代理店シートに含まれるのは **24社**。含まれないのは
  `Aeolus Robotics` と `Pudu Robotics`（どちらもロボットシートにも無い。§3.2 の
  `aeolus-aeo` / `pudu-d7` に対応）。この2社は削除せず残す
- `Sunday Robotics` は §1.2 のとおり `Memo` が対象内に入るため**追加する**

| | 件数 |
|---|---|
| 現行 | 26 |
| 代理店シートにしか無い | +33 |
| **完了時** | **59** |

**57 は代理店シートの行数であって、Deploid の最終メーカー件数ではない。**

### 3.1 追加134件の内訳

- **31件は既存レコードのグレード違い** — `T1 Basic/Standard/Customized`、`K1 Geek/Education/Professional`、`G1-D Standard/Flagship`、`K2 Basic/Bipedal Development/Wheeled Development`、`T800 Basic/Development/Pro/Max`、`PM01 Commercial/Education`、`KUAVO 4PRO MaxA/MaxB/Exhibition/Exhibition Compute/Advanced`、`KUAVO 5 MaxA/MaxB/Exhibition Compute`、`4NE1 Gen 3.5/Mini Standard/Mini Pro`、`Walker Tienkung TK2301/TK2201/TK2101`
- **103件が純粋な新規** — 新メーカー66件（`Sunday Robotics / Memo` を含む）、既存メーカーの新機種37件

### 3.2 Deploid側21件の分類

| 分類 | 件数 | 対象 |
|---|---|---|
| archived化が要る | 1 | `onex-eve` |
| 既に archived で対応済み | 4 | `fourier-gr1` `fourier-gr2`（取り消し線）、`apptronik-apollo`（→Apollo 2）、`figure-02`（→`figure-03` は収録済み） |
| 名前ずれ＝更新 | 2 | `mentee-menteebotv3`「MenteeBot」→「MenteeBot V3」、`kawasaki-kaleido`「Kaleido」→「Kaleido9」 |
| 世代更新 | 1 | `neura-4ne-1`「4NE1 Gen 3」→「4NE1 Gen 3.5」 |
| グレード違いの親レコード | 9 | `booster-t1` `booster-k1` `kepler-k2` `engineai-pm01` `engineai-t800` `unitree-g1-d` `ubtech-walker-tienkung` `agibot-a2` `agibot-a2-max` |
| シートに無いが消す理由もない | 4 | `aeolus-aeo` `pudu-d7`（Aeolus・Pudu がメーカーごと未収録）、`kepler-k1` `engineai-sa01` |

---

## 4. 決定事項

### DEC-S01. variant は別レコードに分ける

グレード違いを1レコードに畳まない。追加134件、完了時198レコード（§3.0）。

**根拠**: Deploid は既に `unitree-g1` / `unitree-g1-edu`、`agibot-a2` / `-ultra` / `-max` / `-lite` という分け方をしており、その延長になる。畳むと値が失われる。`booster-t1` に対しシートは `T1 Basic` / `T1 Standard` / `T1 Customized` の3行を持ち、バッテリー容量・プロセッサー・SDK の値が3行で割れている。

決定者: 人間、2026-08-07。

### DEC-S02. `onex-eve` を archived にする

`EVE Industrial` は 1X の公式製品名（`https://www.1x.tech/eve` の見出しがそのまま "Eve Industrial"。2026-08-07 確認）。ただし当該ページは見出しとnewsletterフォームのみで製品情報・スペックを持たない。Deploid のレコードも `specs` が `mobility: 'wheeled'` と `controlMethod` の2項目だけで、コード上は「追加ドラフト機」ブロックにありながら `publishStatus: 'published'`。

シートは `EVE` に取り消し線を引き、1X の現行行は `NEO` のみ。一般販売モデルではないため archived とする。決定者: 人間、2026-08-07。

### DEC-S03. `japanAvailability` は代理店シートから導出する

代理店シートの「対応モデル」列は**機種単位の粒度を持つ**。メーカー単位の「日本での提供状況」と組み合わせると機種ごとに値が割れる。現行42件での一致率:

| セル | `japanAvailability` の一致率 |
|---|---|
| 国内提供未確認 / 列挙あり | `unknown` **100%**（13/13） |
| 未発売 / 列挙あり | `unknown` **100%**（3/3） |
| 入手可能 / 列挙なし | `unknown` 78%（7/9） |
| 入手可能 / 列挙あり | 41%（`inquiry-required` 7 / `unknown` 7 / `distributor-japan` 3） |

**100%のセルのみ自動確定する。** 「入手可能 / 列挙あり」は人が個別に判断する。

### DEC-S04. `deploymentStage` はシートに1列追加して埋める

DEC-S05 で `Robot.buyerReadiness` を削除するため、追加する列は `deploymentStage` の1列。

**シートのどこからも導出できない。**

- 代理店シート → 日本の流通状態しか持たない。一致率は最良セルで54%、「入手可能 / 列挙あり」の17件は `limited-production` 7 / `production` 4 / `pilot` 6 に三分する
- 導入事例シート → `robotId` は既存19機しか指しておらず、追加134件へのカバレッジは0
- 発表済みロボットシート → 18列すべてハードウェア仕様。成熟度の列がない

`deploymentStage` は `data/types.ts:281` で `?` なしの型必須。`publishStatus` に関係なく値がないと `tsc` が落ちるため、draft投入で先送りできない。列仕様は §5。決定者: 人間、2026-08-07。

### DEC-S05. 「買えるか」軸の重複を解消する

`Robot` に製品の売られ方を表すフィールドが3つあり、2つが機能していない。

| フィールド | 必須 | 充足 | コード参照 | 実態 |
|---|---|---|---|---|
| `deploymentStage` | 必須 | 63/63 | 15箇所 | カード・比較で表示。機能している |
| `buyerReadiness` | 必須 | 63/63 | 1箇所 | 型に `@deprecated`。表示されず、`lib/catalog/search.ts:51` で検索テキストに混ざるだけ |
| `marketAvailability` | 任意 | 42/63（うち11が`unknown`＝実質31件） | **0箇所** | `robot.marketAvailability` を読むコードが存在しない |

`lib/visualSemantics.ts` の `buyerReadinessTones` / `marketAvailabilityTones` / `getBuyerReadinessTone` はいずれも消費先が存在しない。

`marketAvailability` は `data/types.ts:172` のコメントどおり、この重複を解消する目的で FC-C-003 が新設した（「`deploymentStage` が『製品の成熟段階』、こちらが『いま買えるのか・誰に売っているのか』」）。分離の設計自体は正しいが、UIに接続されないまま42件分のデータが溜まっている。

**63件での実測**: `deploymentStage` を知ると `buyerReadiness` の不確実性が 37.6% 減る（H=1.3340→0.8318 bit）。クロス集計は単調で、`buyerReadiness` は実質 `deploymentStage` を3段階へ潰したもの。

| deploymentStage | initial-adoption | requires-poc | limited-today | 行計 |
|---|---|---|---|---|
| production | 6 | 6 | 0 | 12 |
| limited-production | 0 | 18 | 5 | 23 |
| pilot | 0 | 8 | 12 | 20 |
| prototype | 0 | 1 | 4 | 5 |
| concept | 0 | 1 | 0 | 1 |
| internal-use | 0 | 0 | 1 | 1 |
| discontinued | 0 | 0 | 1 | 1 |
| **列計** | **6** | **34** | **23** | **63** |

**この 37.6% は上振れしている。** `concept` / `internal-use` / `discontinued` は各 n=1 で、条件付きエントロピーへ機械的に 0 を寄与する。この3件を除いた n=60 では **34.7%**（H=1.3367→0.8734）。つまり約3ポイントは singleton の産物であり、削除根拠として使えるのは 34.7% のほう。

**逆に読めば「65%は独立情報」でもある。** 情報量だけでは削除を決められない。決め手は情報量ではなく、(1) 型に `@deprecated` が付いていること、(2) 詳細ページ・カード・比較のいずれにも表示されていないこと、(3) 唯一の参照が検索テキストへの連結であることの3点。情報量はその補強材料に留める。

**決定**: `Robot.buyerReadiness` と `Robot.marketAvailability` を削除し、`deploymentStage`（製品の成熟段階）と `japanAvailability`（日本の調達経路）の2軸に絞る。決定者: 人間、2026-08-07。

**削除しないもの**: 型 `BuyerReadiness` 自体 — `UseCase.buyerReadiness`（`data/types.ts:374`、44件）が使う。UseCase 側は公開ゲートの型必須であり、`/use-cases` のファセットとして機能している。型 `MarketAvailability` は `Robot` からの参照が消えたら未使用になるため削除する。

### DEC-S06. 表示されない注記フィールドを接続する

`src` / `components` / `lib` の全走査（`lib/labels.ts` / `lib/uiText.ts` を除く）で参照0だったもの。

| フィールド | Robot | Manufacturer | 参照 |
|---|---|---|---|
| `supportNote` | 34/63 | **26/26** | 0 |
| `procurementNote` | — | **26/26** | 0 |
| `distributorNote` | — | **24/26** | 0 |
| `vendorRiskNote` | 1/63 | **25/26** | 0 |
| `safetyNote` | 0/63 | — | 0 |

`tests/unit/view-models/robots.test.ts:29-31` がこの3つを参照しているが、これは「本文が client の searchText へ漏れないこと」を守るガードであり、表示されている証拠ではない。

**Manufacturer の4注記は重複していない。** 実物で確認したところ4軸に分かれている。

```
unitree  distributorNote  TechShare
         supportNote      TechShareのUnitreeチームが問い合わせ窓口。国内サポート範囲、部品在庫、現地対応は見積時に確認する。
         procurementNote  G1/G1 EDU、H2/H2 EDU、R1 AIR/R1/R1 EDUなど構成別の価格・納期・保証は個別に見積確認する。
         vendorRiskNote   研究・PoC向け評価と、本番運用向け評価を分ける。
```

窓口 / 保守 / 見積 / リスクの4軸で、B2B調達判断ではいずれも必要。**問題は重複ではなく、約100件の記述が一度も描画されていないこと。**

**決定**: Manufacturer の4注記と `Robot.supportNote` を詳細ページに表示する。`Robot.safetyNote`（0/63）と `Robot.vendorRiskNote`（1/63）は実質空なので型ごと削除する。

> **2026-08-08 の修正**: 2026-08-07 時点の決定は「`supportNote` を表示し、`safetyNote` と `vendorRiskNote` を削除」だった。これは Robot 側だけを見た判断で、その後の Manufacturer 監査で `Manufacturer.vendorRiskNote` が 25/26 埋まっており Robot 側とは別軸の内容を持つことが判明した。**Manufacturer.vendorRiskNote は削除せず表示する**へ改める。削除対象は Robot 側の2フィールドのみ。

**`distributorNote` は `domesticDistributors` と重複している。** `unitree.distributorNote: 'TechShare'` は構造化フィールド `domesticDistributors`（5/26、`getDomesticDistributorDisplay` 経由で表示済み）と同じ事実を自由文で持つ。24/26 が自由文側にあり、構造化側は5/26 しかない。**本計画では `distributorNote` を表示するに留め、構造化への移行はしない**（別途判断）。

### DEC-S07. `deploymentStage` の陳腐化を直し、片方向ゲートを1つ足す

> **2026-08-08 に全面改訂。** 当初の決定は「`publishStatus: 'archived'` を提供終了の唯一の
> 正本とし、`DeploymentStage` から `discontinued` を削除、archived な現役段階を error にする」
> だった。**この前提は誤りだったので撤回する。** 経緯は本節末尾。

`deploymentStage` のラベルは `lib/labels.ts:84-92` を見るとすべて**現在形**である。

```
concept 構想段階 / prototype 試作段階 / pilot 実証展開中 / limited-production 限定販売中
production 量産・商用化 / internal-use 自社利用のみ / discontinued 生産終了
```

つまりこのフィールドは「到達した最高段階」ではなく**現在の状態**を表す。この前提で実データを見ると、矛盾しているのは**スキーマではなく3件の値**だった。

| レコード | 現在値 | 要約が示す事実 | 正しい値 |
|---|---|---|---|
| `figure-02` | `discontinued` | Figure 03 へ移行中 | **そのまま** |
| `fourier-gr1` | `production` | 「現行公式サイトはGR-3 Seriesへ製品導線を一本化」 | `discontinued` |
| `fourier-gr2` | `limited-production` | 同上 | `discontinued` |
| `apptronik-apollo` | `pilot` | 「現行公式サイトの製品導線は後継機Apollo 2のみ」 | `discontinued` |
| `onex-eve` | `limited-production` | 公式ページは現存、後継機の記載なし | **そのまま** |

**決定**:

1. `DeploymentStage` から `discontinued` を**削除しない**
2. `fourier-gr1` / `fourier-gr2` / `apptronik-apollo` の3件を `discontinued` へ直す。
   いずれも**そのレコード自身の `summary` と `sources` が支持する**ので G2 を満たす
3. `lib/validation/robots.ts` に**片方向**のゲートを足す —
   `deploymentStage === 'discontinued'` ⟹ `publishStatus === 'archived'`

**双方向（`archived` ⟺ `discontinued`）にはしない。** `onex-eve` が反例になる。
DEC-S02 で archived にするのは「一般販売モデルではない」という編集判断であって、
1X が EVE Industrial を終了したという出典は無い。双方向ゲートは
`onex-eve` に出典の無い `discontinued` を書かせることになり、G2 に反する。

**撤回した前提について。** 当初は「`publishStatus: 'archived'` / `deploymentStage: 'discontinued'` /
`supersededById` の3つが同じ事実を表している」と考えたが、実際には別々の事実だった。

- `publishStatus: 'archived'` — **Deploid がこのレコードを公開しない**（編集判断）
- `deploymentStage: 'discontinued'` — **メーカーが提供を終えた**（外界の事実）
- `supersededById` — 後継機への導線（関連の表現）

`onex-eve` は1つ目だけが真で2つ目は偽、という組み合わせが実在する。3つを1系統に畳む設計は
この区別を潰す。**スキーマは正しく、直すべきはデータだった。**

`internal-use` が `DeploymentStage` と `MarketAvailability` の両方に値として存在する重複は、DEC-S05 で `MarketAvailability` を削除することで解消する。

### DEC-S08. `data/robots.ts` をメーカー別に分割する

分割対象は `data/robots.ts` の全レコード（=198、§3.0）であって母集団の177行ではない。現行 5,039行 / 267,834 B を63件で割ると1件あたり約80行 / 約4.2KB なので、**198件では約15,800行 / 約830KB** になる。`data/robots/<manufacturer-id>.ts` へ分割し、`data/robots.ts` が import して配列に組み立てる。

前例は `data/articles.ts` が `data/articles/manufacturer-guide/*.ts` を3本 import している形。`scripts/check-data-import-boundaries.mjs` の走査対象は `components` / `lib` / `scripts` / `src` / `tests` であり `data/` を含まないため、この分割は抵触しない。

決定者: 人間、2026-08-07。

### DEC-S09. CMS移行より先に実施する

- `docs/plans/content-platform-migration-plan-v1.md` Task 5 の `scripts/import-content-to-payload.mts` は `data/*.ts` から取り込む設計なので、先に入れたデータはそのまま運ばれる
- 同 Task 5 の parity 検証は、63件より198件（§3.0）の実データ形状で通したほうが価値が高い
- バンドル予算は障害にならない（実測: shared floor 554,140/560,000、`/robots` 185,524/215,000）。`scripts/check-client-bundle-content.mjs` が「1チャンクに5件以上のレコードslug禁止」を敷いているとおりカタログデータはJSチャンクに乗らず、RSCペイロード側にある。増えるのは `/robots` の prerender HTML 36,770 B → 全件昇格時で約124KB（Task 12 Step 5）で、ページ重量の話であり移行順序とは独立

### DEC-S10. 画像・ロゴはこの計画の対象外

`docs/decisions/data-maintenance-checklist-v1.md` §F の Robot 公開ゲートで、画像は「未ローカル化なら warning」であり必須ではない。`src: ''` は valid。現行63機のうち44機が既に `src: ''`。

画像調達（`docs/plans/robot-image-sourcing-plan-v1.md`）は本計画をブロックしない。新規レコードは `src: ''` で投入する。

---

## 5. シートへ追加する1列（人間の作業）

`発表済みロボット.html` の元シートに `deploymentStage` を1列追加する。対象は177行。うち43行は現行Deploidの値を転記できるため、判断が要るのは134行。

貼り付け用に `~/Downloads/ロボDB/stage-deployment-paste.tsv` をシートのデータ行と同じ順で生成済み（198行。取り消し線・AELOS の22行は「対象外」で埋めてある。参考列に提供状況・対応モデル列挙・スペック充足・製品URL）。

### 5.1 `deploymentStage`（製品の成熟段階）

| 値 | 意味 |
|---|---|
| `concept` | 発表・コンセプトのみ。実機の存在が確認できない |
| `prototype` | 試作機が存在するが外部提供はない |
| `pilot` | 顧客・パートナー先での実証段階 |
| `limited-production` | 少量生産・限定販売 |
| `production` | 量産・一般販売 |
| `internal-use` | 自社内利用のみ |

**`discontinued`（生産終了）は §5 の記入対象では選ばない。** 176行はすべて「発表済み＝現行HPで確認できるモデル」なので、記入時点で生産終了のものは無い。提供終了が判明した機体はシート側で取り消し線を引き、Deploid 側は `publishStatus: 'archived'` ＋ `deploymentStage: 'discontinued'` にする（DEC-S07）。

現行63件の分布（較正の目安）: `limited-production` 23 / `pilot` 20 / `production` 12 / `prototype` 5 / `internal-use` 1 / `concept` 1

判定は公式製品ページを開いて、上から順に最初に当てはまったところで確定する。

1. 自社工場・自社サービス内での使用しか書いていない（外販の記述なし） → `internal-use`
2. オンラインストアに価格があってカートに入る → `production`
3. 価格はあるが問い合わせ購入・受注生産・限定台数 → `limited-production`
4. 「予約受付」「Reserve」「Pre-order」 → `limited-production`
5. 購入導線はないが、顧客名を挙げた導入・実証の発表がある → `pilot`
6. 実機のデモ映像とスペック表はあるが、購入導線も導入事例もない → `prototype`
7. 発表だけで実機の映像がない → `concept`
8. 後継機ページへ飛ばされる／製品ページが消えている → シート側で取り消し線を引く（レコードは `publishStatus: 'archived'`）

### 5.2 その他のフィールドの充足状況

Robot の公開ゲート（`data-maintenance-checklist-v1.md` §F）に対する対応。

| フィールド | シートから埋まるか |
|---|---|
| `id` / `slug` / `name` / `manufacturerId` | 導出できる |
| `sources` | 製品ページURLが177/177行にある |
| `category` | 移動方式から導出（`固定スタンド`→`upper-body-humanoid`、`車輪`＋双腕→`mobile-manipulator`、`二足`→`humanoid`） |
| `japanAvailability` | 代理店シートから（DEC-S03） |
| `summary` | 列がない。日本語1〜2文を生成し、シートの値と出典に基づいて書く |
| `deploymentStage` | 列がない（DEC-S04） |
| `buyerReadiness` | 削除するため不要（DEC-S05） |

---

## 6. File Structure

### 新規作成

| Path | 責務 |
|---|---|
| `scripts/parse-robot-db.ts` | HTML 5ファイル → 正規化JSON。取り消し線判定・結合セル前方補完・`<a href>` 抽出。**`.mjs` ではなく `.ts`** — テストから import するため型宣言が要る（`tsconfig` は `allowJs: false`）。Node は `--experimental-strip-types` で直接実行する |
| `scripts/report-robot-db-diff.mjs` | 正規化JSON と `data/*.ts` の突合レポート（§3 の再生成） |
| `data/import/robots.json` | 発表済みロボット 198行の正規化結果（機種名セルの取り消し線フラグ付き） |
| `data/import/deployments.json` | 導入事例 41行の正規化結果 |
| `data/import/manufacturers.json` | 代理店 57行の正規化結果 |
| `data/robots/<manufacturer-id>.ts` | メーカー別レコード（DEC-S08） |
| `components/ProcurementNotes.tsx` | 注記4軸の表示（Manufacturer詳細・Robot詳細で共用） |
| `tests/unit/data/parse-robot-db.test.ts` | パーサの単体テスト |
| `tests/unit/components/procurement-notes.test.tsx` | 注記表示の単体テスト |
| `tests/unit/validation/discontinued-publish-status.test.ts` | DEC-S07 の validation テスト |

### 変更

| Path | 変更内容 |
|---|---|
| `data/types.ts` | `Robot.buyerReadiness` / `.marketAvailability` / `.safetyNote` / `.vendorRiskNote` 削除、`MarketAvailability` 型削除。**`DeploymentStage` は変更しない**（DEC-S07 改訂） |
| `data/robots.ts` | 分割後は `data/robots/*.ts` を import して結合するだけになる |
| `data/manufacturers.ts` | **59社**へ拡張（§3.0.1）、`japanPresence` / 注記の更新 |
| `data/deployments.ts` | 11件 → 41件 |
| `lib/labels.ts` | `marketAvailabilityLabels` 削除。`deploymentStageLabels` は変更しない |
| `lib/display.ts` | 変更なし（`deploymentStageOrder` は `discontinued` を含んだまま） |
| `lib/visualSemantics.ts` | `buyerReadinessTones` / `marketAvailabilityTones` / `getBuyerReadinessTone` 削除 |
| `lib/catalog/search.ts` | 51行目の `buyerReadinessLabels[robot.buyerReadiness]` 削除 |
| `lib/validation/robots.ts` | **片方向**ゲート追加: `deploymentStage === 'discontinued'` ⟹ `publishStatus === 'archived'`（DEC-S07 改訂。**逆方向は検査しない** — `onex-eve` が archived × `limited-production` で反例になる） |
| `lib/uiText.ts` | 注記4軸のラベル追加 |
| `components/ManufacturerFactSheet.tsx` | 注記表示の呼び出し |
| `components/RobotStickyAside.tsx` | `supportNote` 表示の呼び出し |
| `scripts/build-data-r01-manifest.mjs` | 164行目の `marketAvailability` バリデータ削除 |
| `scripts/build-data-r02-manifest.mjs` | 209行目の `supported` 配列から `marketAvailability` 削除 |
| `tests/unit/view-models/robots.test.ts` | 削除フィールドの参照を外す（`supportNote` の行は残す） |

### 変更しない

`lib/specSchema.ts` / `lib/tagRegistry.ts` / `data/articles.ts` / `data/useCases.ts` / `data/articlePlacements.ts` / `src/app/globals.css` / `next.config.*` / `package.json`

---

## 7. Tasks

### Task 1: HTMLパーサ

**Files:**
- Create: `scripts/parse-robot-db.ts`
- Test: `tests/unit/data/parse-robot-db.test.ts`
- Create: `data/import/robots.json`, `data/import/deployments.json`, `data/import/manufacturers.json`

**Interfaces:**
- Produces: `parseSheet(html: string): Cell[][]`（`Cell = { text: string; url: string | null; strike: boolean; checked: boolean }`。`checked` はチェックボックス — `<svg>` で書き出されるため text からは判定できない）
- Produces: `parseRobotSheet(html: string): RobotImportRow[]`（`{ maker, makerUrl, model, modelUrl, strike, specs: Record<string,string> }`）

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { describe, expect, it } from 'vitest';
import { parseSheet, parseRobotSheet } from '../../../scripts/parse-robot-db.ts';

const HTML = `<html><head><style>
.s1{text-decoration:line-through;}
.s2{color:#000;}
</style></head><body><table>
<tr><td class="s2">Unitree</td><td class="s2"><a href="https://x/g1">G1</a></td><td class="s2">二足</td></tr>
<tr><td class="s2"></td><td class="s1"><a href="https://x/old">G1-Boxing</a></td><td class="s2">競技用</td></tr>
</table></body></html>`;

describe('parse-robot-db', () => {
  it('取り消し線クラスをセル単位で検出する', () => {
    const rows = parseSheet(HTML);
    expect(rows[0][1].strike).toBe(false);
    expect(rows[1][1].strike).toBe(true);
  });

  it('セル内のhrefを保持する', () => {
    expect(parseSheet(HTML)[0][1].url).toBe('https://x/g1');
  });

  it('結合セルのメーカー名を前方補完する', () => {
    expect(parseRobotSheet(HTML)[1].maker).toBe('Unitree');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npx vitest run tests/unit/data/parse-robot-db.test.ts`
Expected: FAIL（`Cannot find module '../../../scripts/parse-robot-db.ts'`）

- [ ] **Step 3: パーサを実装**

`<style>` から `text-decoration:line-through` を含むクラス名の集合を作り、各 `<td>` の `class` と積を取る。`text` は `<[^>]+>` 除去 → HTMLエンティティ復号 → `trim` → ゼロ幅スペース（U+200B）除去。`maker` セルが空なら直前の値を引き継ぐ。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/unit/data/parse-robot-db.test.ts`
Expected: PASS

- [ ] **Step 5: 実データで件数を検算**

Run: `npm run parse:robot-db`
Expected: `発表済みロボット 198行 / 機種名セル取り消し線17 / メーカー57`、`導入事例 41行`、`代理店 57行`。§1〜§2 と一致しなければ実装を直す。

- [ ] **Step 6: 正規化JSONを出力してコミット**

```bash
npm run parse:robot-db -- --out data/import
git add scripts/parse-robot-db.ts tests/unit/data/parse-robot-db.test.ts data/import package.json
git commit -m "feat(data): ロボDB原本HTMLのパーサと正規化JSONを追加"
```

**完了条件:** 3ファイルのJSONが生成され、件数が §1〜§2 と一致し、テストが通る。

---

### Task 2: 突合レポート

**Files:**
- Create: `scripts/report-robot-db-diff.mjs`

**Interfaces:**
- Consumes: Task 1 の `data/import/*.json`
- Produces: 標準出力に「更新 / 追加 / Deploid側で一致しないもの」の3表

- [ ] **Step 1: 実装**

`data/import/robots.json` と `lib/data/localContentSnapshot.ts` を突合する。メーカー名 → `manufacturerId` の対応表はスクリプト内に持つ。機種名の正規化は NFKC → 括弧内除去 → 英数小文字化。

- [ ] **Step 2: §3 と一致するか検算**

Run: `node --experimental-strip-types scripts/report-robot-db-diff.mjs`
Expected: 更新43行(42レコード) / 追加134 / 一致しない21。**一致しない場合は §3 を直すのではなく、正規化規則の取りこぼしを疑う**（`MenteeBot V3` / `GALBOT S1` / `GR-3(Meow-bot)` のような表記ゆれが既知）。

- [ ] **Step 3: コミット**

```bash
git add scripts/report-robot-db-diff.mjs
git commit -m "feat(data): 原本HTMLと data/*.ts の突合レポートを追加"
```

**完了条件:** レポートの3表が §3 と一致する。

---

### Task 3: `Robot.buyerReadiness` と `Robot.marketAvailability` を削除（DEC-S05）

**Files:**
- Modify: `data/types.ts:177-186`（`MarketAvailability` 型）, `data/types.ts:283,285`（フィールド）
- Modify: `data/robots.ts`（`buyerReadiness` 63行 / `marketAvailability` 42行）
- Modify: `lib/labels.ts`, `lib/visualSemantics.ts:105,151,188`, `lib/catalog/search.ts:51`
- Modify: `scripts/build-data-r01-manifest.mjs:164`, `scripts/build-data-r02-manifest.mjs:209`

**Interfaces:**
- Produces: `Robot` から2フィールドが消える。`BuyerReadiness` 型は残る（`UseCase.buyerReadiness` が使用）

- [ ] **Step 1: 型から2フィールドと `MarketAvailability` を削除**

- [ ] **Step 2: `tsc` で参照箇所を洗い出す**

Run: `npm run typecheck`
Expected: FAIL。`data/robots.ts` の105行と `lib/*` の参照がエラーとして列挙される。**このエラー一覧が削除対象の正本になる。**

- [ ] **Step 3: データとコードから参照を削除**

`lib/catalog/search.ts:51` を消すと catalog の検索テキストから `buyerReadinessLabels[robot.buyerReadiness]` が消える。`/robots` の検索で「初期導入向け」「PoCが前提」が引けなくなる。これは意図した変更（§9）。

- [ ] **Step 4: 検証**

```bash
npm run typecheck && npm run validate:data && npm run test && npm run build
grep -rn "marketAvailability\|MarketAvailability" data lib src components scripts tests
```
Expected: すべて成功。grep は**派生名（`marketAvailabilityTones` 等）を含めて0件**。

- [ ] **Step 5: コミット**

```bash
git commit -am "refactor(data): Robot の buyerReadiness と marketAvailability を削除"
```

**完了条件:** 語幹一致の grep が0件（`\b` を使わない。`marketAvailabilityTones` は語境界が成立せず取りこぼす）。`BuyerReadiness` 型は `data/types.ts` と `data/useCases.ts` に残っている。

---

### Task 4: `Robot.safetyNote` と `Robot.vendorRiskNote` を削除（DEC-S06）

**Files:**
- Modify: `data/types.ts:299,300`
- Modify: `data/robots.ts`（`vendorRiskNote` 1行、`safetyNote` 0行）
- Modify: `tests/unit/view-models/robots.test.ts:30,31`

**Interfaces:**
- Produces: `Robot.supportNote` は残る（Task 5 で表示する）

- [ ] **Step 1: 型とデータから削除**

`Manufacturer.vendorRiskNote`（`data/types.ts:156`、25/26）は**削除しない**。Robot 側の2フィールドのみ。

- [ ] **Step 2: テストの参照を外す**

`tests/unit/view-models/robots.test.ts` の `bodyValues` から `robot.safetyNote` と `robot.vendorRiskNote` の行を消す。**`robot.supportNote` の行は残す** — Task 5 で表示するのは server 側の詳細ページであり、catalog の client searchText へ載せてよいという意味ではない。

- [ ] **Step 3: 検証**

```bash
npm run typecheck && npm run test && npm run validate:data
grep -rn "safetyNote" data lib src components tests
```
Expected: grep は0件。

- [ ] **Step 4: コミット**

```bash
git commit -am "refactor(data): 実質空の Robot.safetyNote と Robot.vendorRiskNote を削除"
```

**完了条件:** grep 0件。`Manufacturer.vendorRiskNote` は残っている。

---

### Task 5: 調達注記を詳細ページに表示（DEC-S06）

**Files:**
- Create: `components/ProcurementNotes.tsx`
- Test: `tests/unit/components/procurement-notes.test.tsx`
- Modify: `lib/uiText.ts`, `components/ManufacturerFactSheet.tsx`, `components/RobotStickyAside.tsx`

**Interfaces:**
- Consumes: Task 4 完了後の `Robot.supportNote`、`Manufacturer.{distributorNote,supportNote,procurementNote,vendorRiskNote}`
- Produces: `<ProcurementNotes notes={{ distributor?: string; support?: string; procurement?: string; vendorRisk?: string }} />`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProcurementNotes } from '@/components/ProcurementNotes';

describe('ProcurementNotes', () => {
  it('値がある軸だけを描画する', () => {
    render(<ProcurementNotes notes={{ support: '国内保守は代理店に確認する。' }} />);
    expect(screen.getByText('国内保守は代理店に確認する。')).toBeInTheDocument();
    expect(screen.queryByText('見積・価格')).not.toBeInTheDocument();
  });

  it('全軸が空なら何も描画しない', () => {
    const { container } = render(<ProcurementNotes notes={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npx vitest run tests/unit/components/procurement-notes.test.tsx`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: 実装**

`<dl>` で4軸を並べる。ラベルは `lib/uiText.ts` に置く（窓口 / サポート / 見積・価格 / 確認事項）。値が `undefined` の軸は行ごと出さない。色は既存トークンのみ。`SidebarBlock` / `FactList` の既存 API に合わせ、新しいレイアウト規約を作らない。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/unit/components/procurement-notes.test.tsx`
Expected: PASS

- [ ] **Step 5: 詳細ページへ接続**

`ManufacturerFactSheet` の `rows` の下に4軸、`RobotStickyAside` に `supportNote` の1軸。両方とも Server Component 側で渡す（client view model には載せない）。

- [ ] **Step 6: 検証**

```bash
npm run typecheck && npm run lint && npm run test
npm run build && npm run check:client-budgets && npm run check:bundle-content
npm run test:e2e
```
Expected: すべて成功。特に `check:bundle-content` が緑であること（注記本文が client チャンクへ漏れていない証拠）。

**緑であることだけを見ない。各チャンクの最大 hit 数を before / after で記録する。**
`scripts/check-client-bundle-content.mjs` は全コレクションの slug（draft 含む）を集めて
チャンクごとに `source.includes('"slug"')` を掛け、**5件以上で赤**にする。
本計画で slug の総数は 175（63+26+44+31+11）から約380へ倍増するため、
4 → 5 に乗る直前が「緑」からは見えない。

記録の取り方は2案。**どちらでもよいが、数字を残すこと。**

- `scripts/check-client-bundle-content.mjs` に「最大 hit 数」を1行 `console.log` する
  （`MAX_DISTINCT_SLUGS_PER_CHUNK` と同じスコープで既に数えているので追加コストは無い）
- または本 task の完了報告に、赤にならなかった最大値を手で記録する

`docs/decisions/ai_fullstack_development_guardrails_v1.md` が「誤検知が常態化すると
チェック自体が無視される」として `activeSection` を grep 対象から外したのと同じ構図。
余裕が縮んでいることに気づけるようにしておく。

- [ ] **Step 7: 手動確認**

`npm run dev` で `/manufacturers/unitree` と `/robots/unitree-g1` を開き、注記が出ること、390px 幅で折り返しが破綻しないこと、`dt`/`dd` がスクリーンリーダー順で読めることを確認する。

- [ ] **Step 8: コミット**

```bash
git commit -am "feat(ui): メーカー・ロボット詳細に調達注記を表示"
```

**完了条件:** `/manufacturers/[slug]` に4軸、`/robots/[slug]` に `supportNote` が出る。`check:bundle-content` が緑。

---

### Task 6: 陳腐化した `deploymentStage` の修正と片方向ゲート（DEC-S07）

**Files:**
- Modify: `data/robots.ts`（`fourier-gr1` / `fourier-gr2` / `apptronik-apollo` の3件）
- Modify: `lib/validation/robots.ts`
- Test: `tests/unit/validation/discontinued-publish-status.test.ts`

**Interfaces:**
- Produces: validation error プレフィックス `[discontinued-status]`

**`data/types.ts` / `lib/labels.ts` / `lib/display.ts` は変更しない。** `discontinued` は
列挙に残す（DEC-S07 の改訂）。

- [ ] **Step 1: 失敗するテストを書く**

`validateRobots` は `(snapshot: ContentSnapshot, collector: ValidationCollector): void` で単体では呼びにくい。既存の `tests/unit/validation/reference-errors.test.ts` と同じく、実スナップショットをクローンして変異させ `validateContentSnapshot(snapshot).errors` を文字列で照合する。

```ts
import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { validateContentSnapshot } from '@/lib/validation/validateContentSnapshot';

describe('discontinued は archived でなければならない', () => {
  it('discontinued な robot が published だと error', () => {
    const snapshot = structuredClone(localContentSnapshot);
    const robot = snapshot.robots.find((r) => r.publishStatus === 'published')!;
    robot.deploymentStage = 'discontinued';

    expect(validateContentSnapshot(snapshot).errors).toContain(
      `[discontinued-status] robot "${robot.id}".deploymentStage が "discontinued" ですが publishStatus が "published" です`,
    );
  });

  it('archived かつ discontinued は通す', () => {
    const snapshot = structuredClone(localContentSnapshot);
    const robot = snapshot.robots.find((r) => r.publishStatus === 'archived')!;
    robot.deploymentStage = 'discontinued';

    expect(
      validateContentSnapshot(snapshot).errors.filter((e) => e.startsWith('[discontinued-status]')),
    ).toHaveLength(0);
  });

  it('archived だが discontinued でないレコードを error にしない（onex-eve のケース）', () => {
    const snapshot = structuredClone(localContentSnapshot);
    const robot = snapshot.robots.find((r) => r.publishStatus === 'archived')!;
    robot.deploymentStage = 'limited-production';

    expect(
      validateContentSnapshot(snapshot).errors.filter((e) => e.startsWith('[discontinued-status]')),
    ).toHaveLength(0);
  });
});
```

3つ目のテストが**双方向ゲートへの退行を防ぐ**。エラー文言は実装と同一の文字列にする（既存の `[missing]` プレフィックス方式に合わせる）。

- [ ] **Step 2: 失敗を確認**

Run: `npx vitest run tests/unit/validation/discontinued-publish-status.test.ts`
Expected: FAIL（`[discontinued-status]` が出ない）

- [ ] **Step 3: 片方向 validation を実装**

`deploymentStage === 'discontinued'` かつ `publishStatus !== 'archived'` のときだけ error。
**逆方向（archived なのに discontinued でない）は検査しない。**

- [ ] **Step 4: 陳腐化した3件を直す**

| レコード | 現在 | 修正後 | 根拠 |
|---|---|---|---|
| `fourier-gr1` | `production` | `discontinued` | 自レコードの summary「現行公式サイトはGR-3 Seriesへ製品導線を一本化」 |
| `fourier-gr2` | `limited-production` | `discontinued` | 同上 |
| `apptronik-apollo` | `pilot` | `discontinued` | 自レコードの summary「現行公式サイトの製品導線は後継機Apollo 2のみ」 |

`figure-02`（既に `discontinued`）と `onex-eve`（`limited-production` のまま）は**変更しない**。
`sources[].checkedAt` を更新し、`updatedAt` も合わせる。

- [ ] **Step 5: テストが通ることを確認**

Run: `npx vitest run tests/unit/validation/discontinued-publish-status.test.ts`
Expected: PASS

- [ ] **Step 6: ゲートが実際に赤くなることを確認（Global Constraints）**

`fourier-gr1` の `publishStatus` を一時的に `published` へ変える（`discontinued` のまま）。

Run: `npm run validate:data`
Expected: **exit 1** と `[discontinued-status]`。確認できたら戻す。**この確認をせずに次へ進まない。**

- [ ] **Step 7: 検証**

```bash
npm run typecheck && npm run validate:data && npm run test && npm run build
```

- [ ] **Step 8: コミット**

```bash
git commit -am "fix(data): 提供終了3件の deploymentStage を修正し、discontinued は archived を要求するゲートを追加"
```

**完了条件:** 3件が `discontinued` になり、意図的な違反で `validate:data` が exit 1 になることを確認済み。`archived` かつ `discontinued` 以外のレコード（`onex-eve`）が error にならないことをテストで固定済み。

---

### Task 7: `data/robots.ts` をメーカー別に分割（DEC-S08）

**Files:**
- Create: `data/robots/<manufacturer-id>.ts`（現行26メーカー分）
- Modify: `data/robots.ts`

**Interfaces:**
- Produces: 各ファイルが `export const <camelCaseId>Robots: Robot[]` を出す。`data/robots.ts` がそれらを import して `export const robots` に結合する

- [ ] **Step 1: 分割前の指紋を記録**

```bash
node --experimental-strip-types -e "import('./data/robots.ts').then(async m => {
  const { createHash } = await import('node:crypto');
  const sorted = [...m.robots].sort((a, b) => a.id.localeCompare(b.id));
  console.log(m.robots.length, createHash('sha256').update(JSON.stringify(sorted)).digest('hex'));
})"
```
Expected: `63 <sha256>`。この2つを控える。

**`JSON.stringify(robots).length` の一致では不十分。** 分割はメーカー単位でまとめる操作なので
並び順は必ず変わる。長さの一致は並び替えを検出せず、同じ長さのレコードどうしの取り違えも
通してしまう。`id` でソートしてからハッシュを取れば、**件数・取り違え・重複・値の書き換えを
すべて検出しつつ、意図した並び替えだけを許容できる**。

- [ ] **Step 2: 手作業で分ける**

レコード境界の切り出しを正規表現に任せると、文字列内の `},\n  {` で誤爆する。26ファイルなので手で分ける。**値は1文字も変えない。**

- [ ] **Step 3: 分割前後で内容が同一であることを機械確認**

Step 1 と同じコマンドを実行。
Expected: 件数と sha256 が Step 1 と完全一致。**一致しなければ分割をやり直す。**

- [ ] **Step 4: 検証**

```bash
npm run typecheck && npm run validate:data && npm run check:data-boundaries && npm run test && npm run build
```

- [ ] **Step 5: コミット**

```bash
git commit -am "refactor(data): data/robots.ts をメーカー別ファイルへ分割"
```

**完了条件:** 件数と `id` ソート後の sha256 が分割前と一致。`check:data-boundaries` が緑。

---

### Task 8: 既存42件の更新

**Files:**
- Modify: `data/robots/*.ts`（該当メーカー分）

- [ ] **Step 1: 差分のある値だけを当てる**

Task 2 のレポートで差分が出た値のみ。`specSchema` に無い列（`可搬重量`）は `loadRatings[]` へ入れる。バッテリーは mAh 単位（`deferred-work-register-v1.md` #10 の DEC-04）。

- [ ] **Step 2: `updatedAt` と `sources[].checkedAt` を更新**

- [ ] **Step 3: 検証**

```bash
npm run validate:data && npm run test && npm run build
node --experimental-strip-types scripts/report-robot-db-diff.mjs
```
Expected: レポートの「更新」列の差分が0。

- [ ] **Step 4: コミット**

```bash
git commit -am "data(robots): 原本シートとの差分を既存42件へ反映"
```

**完了条件:** レポートの「更新」差分が0。

---

### Task 9: 名前ずれ3件と `onex-eve`

**Files:**
- Modify: `data/robots/mentee-robotics.ts`, `data/robots/kawasaki-heavy-industries.ts`, `data/robots/neura-robotics.ts`, `data/robots/onex.ts`

- [ ] **Step 1: 名前を直す**

`mentee-menteebotv3` の `name` を「MenteeBot V3」、`kawasaki-kaleido` の `name` を「Kaleido9」へ。`neura-4ne-1` を `4NE1 Gen 3.5` の値へ更新。**`id` と `slug` は変更しない**（Global Constraints）。

- [ ] **Step 2: `onex-eve` を archived にする**

`publishStatus: 'archived'` へ。**`deploymentStage` は `limited-production` のまま変更しない。**
DEC-S07 のゲートは片方向（`discontinued` ⟹ `archived`）なので、archived にしても
`limited-production` は error にならない。1X が EVE Industrial を終了したという出典は無く、
`discontinued` を書くと G2 に反する。

- [ ] **Step 3: `apptronik-apollo-2` を2レコードへ分割する（§3.0）**

シートは `Apollo 2（Biped）` と `Apollo 2（Wheeled）` の2行を持ち、移動方式が二足と車輪で異なる。DEC-S01 に従い `apptronik-apollo-2-biped` / `apptronik-apollo-2-wheeled` へ分ける。

**`id` は不変が原則**（Global Constraints）なので、既存の `apptronik-apollo-2` は**どちらか一方に残す**。シートで先に来る `Apollo 2（Biped）` を既存 `id` の継承先とし、`Wheeled` を新規 `id` で追加する。`slug` を変える場合は `previousSlugs` に旧値を足す。

**波及範囲（実測）**: `data/useCases.ts` の `candidateRobots[].robotId` から **7箇所**、`data/robots.ts` の `apptronik-apollo` の `supersededById` から1箇所が参照している。

既存 `id` を Biped 側が継承するので、**7箇所の参照はそのまま Biped を指す。付け替えはしない。**
`data/useCases.ts` は §6「変更しない」に載っており、本 task では触らない。

Wheeled 構成のほうが適切な useCase があるかの判断は別作業（§11）。`candidateRobots[].fit` が
`'strong'` の場合は `basis: 'deployment'` と `evidenceDeploymentIds` の裏取りが要り（§F）、
7件それぞれに実証事例の有無を調べることになるため、「名前ずれ3件」の task に混ぜない
（Global Constraints「1 task = 1 commit」「挙動変更と構造改善を混ぜない」）。

```bash
grep -rn "apptronik-apollo-2" data/
```

- [ ] **Step 4: 検証**

```bash
grep -rn "apptronik-apollo-2" data/
npm run validate:data && npm run test && npm run build
```

- [ ] **Step 5: コミット**

```bash
git commit -am "data(robots): 名称ずれ3件を修正し、onex-eve を archived、Apollo 2 を構成別に分割"
```

**完了条件:** 名称3件・archived 1件・分割1件が反映され、`validate:data` が error 0。参照切れなし。

---

### Task 10: `deployments` をシート41行から取り込み可能分へ拡充

**Files:**
- Modify: `data/deployments.ts`

- [ ] **Step 1: `exclusionReason` 記入済み22行の理由を読む**

取り込むか外すかを行ごとに決める。理由が「robotId が特定できない」なら `robotId` を省いて取り込む（型で任意）。

- [ ] **Step 2: `DeploymentSite` 型に無い列は取り込まない**

`coordinatePrecision` / `deploymentType` / `endedAt` / `summary` / `nextReviewBy` / `importReady` / `exclusionReason` は捨てる。型を広げるかは本計画の対象外（§11）。緯度経度は `location: { lat, lng }` へ入れる。

- [ ] **Step 3: 検証**

```bash
npm run validate:data && npm run check:world-map-asset && npm run test && npm run build
```
Expected: `check:world-map-asset` が緑。**赤い場合は `npm run generate:world-map` で資産を再生成する**（導入拠点が増えると世界地図の static asset が変わる）。

- [ ] **Step 4: 手動確認**

`npm run dev` で `/` の世界地図を開き、追加した拠点が意図した位置に出ること、arc が破綻していないことを確認する。

- [ ] **Step 5: コミット**

```bash
git commit -am "data(deployments): 導入事例をシートから拡充"
```

**完了条件:** 41行それぞれの取り込み可否を判断し、**結果の件数と、外した行の理由を完了報告に記録する**（G11）。`check:world-map-asset` が緑。

取り込み数は `exclusionReason` の判断結果しだいで **19〜41件の範囲**になる。件数を事前に断定しない。

---

### Task 11: `manufacturers` を59社へ

**Files:**
- Modify: `data/manufacturers.ts`

- [ ] **Step 1: 既存26社のうち24社の `japanPresence` と4注記を更新**

代理店シートの「日本での提供状況」「提供事業者」「事業者種別」「入手方法」から。全57行に情報源URL＋確認日があるので `sources` に入れる。

**更新できるのは24社。** `Aeolus Robotics` と `Pudu Robotics` は代理店シートに行が無いため更新元が無い（§3.0.1）。この2社は現状維持。

- [ ] **Step 2: 新メーカー33社を追加**

公開ゲート（§F）は `id` / `slug` / `name` / `country` / `companyType` / `japanPresence` と `sources` 非空。満たせないものは `publishStatus: 'draft'`。

`Sunday Robotics` も追加する。§1.2 のとおり `Memo` が対象内のロボットとして入る。

- [ ] **Step 3: 検証**

```bash
npm run validate:data && npm run test && npm run build && npm run check:client-budgets
```

- [ ] **Step 4: コミット**

```bash
git commit -am "data(manufacturers): 59社へ拡充し、調達注記と日本での提供状況を更新"
```

**完了条件:** `manufacturers` が **59社**（§3.0.1）、`validate:data` が error 0。

```bash
grep -cE "^\s+id: '" data/manufacturers.ts
```
Expected: `59`。**57 と出たら代理店シートの行数と取り違えている。**

---

### Task 12: 新規134件を投入（§5 完了後）

**Files:**
- Create: `data/robots/<manufacturer-id>.ts`（新メーカー33ファイル、§3.0.1）
- Modify: `data/robots/*.ts`（既存メーカー分）

**Interfaces:**
- Consumes: §5 で `deploymentStage` 列が埋まった原本HTML、Task 11 の新メーカー33社の `id`（§3.0.1）

- [ ] **Step 1: 原本HTMLを再書き出しし、パーサを通す**

Run: `npm run parse:robot-db -- --out data/import`
Expected: `deploymentStage` 列が正規化JSONに入る。

- [ ] **Step 2: メーカー単位で分割投入する**

1メーカー1コミット。Unitree 19機 / Leju 18機 / UBTECH 12機が最大。`publishStatus: 'draft'` で入れ、値を確認したものから `published` へ昇格する。

- [ ] **Step 3: 各メーカーごとに検証**

```bash
npm run validate:data && npm run build
```

- [ ] **Step 4: 全件投入後の総合検証**

```bash
npm run check
```

- [ ] **Step 5: ページ重量を実測して記録**

```bash
ls -la .next/server/app/robots.html
node --experimental-strip-types -e "import('./data/robots.ts').then(m => console.log('published', m.robots.filter(x => x.publishStatus === 'published').length))"
```

**測る状態を取り違えないこと。** `robots.html` に載るのは `published` のみで、
Task 12 は新規134件を `draft` で投入する。したがって **Task 12 完了直後の測定値は
36,770 B より小さくなり、150KB ゲートは絶対に発火しない。**

現行は published 57件で 36,770 B（約645 B/件）。published になり得るのは archived 5件を除く193件で、全件昇格時の外挿は約124KB。**この 150KB ゲートが意味を持つのは昇格後**なので、Step 5 では
「published 件数」と「その時点のバイト数」を対で記録し、**1件あたりのバイト数が
645 B から大きく増えていないか**を見る。

昇格作業は本計画の対象外（§11 に明記）。**昇格を行う担当が、published が150件を超えた時点で
再測定し、150KB を超えたら `/robots` のページネーションを別計画として起票する。**
この引き継ぎを Task 12 の完了報告に明記する。

- [ ] **Step 6: 計画書のコードスニペットを型検査の対象にする**

`scripts/check-plan-snippets.mjs` は front-matter に `snippetCheck: true` を宣言した計画書だけを
型検査する。本計画には `ts` / `tsx` のスニペットが3本（Task 1 のパーサテスト、Task 5 の
`ProcurementNotes` テスト、Task 6 の validation テスト）あり、実装完了後なら3本とも
実在モジュールを指す。

front-matter へ `snippetCheck: true` を追加し、次を実行する。

```bash
npm run check:plan-snippets
```
Expected: 緑。**実装前に宣言すると未作成モジュールの import で落ちる**ので、この Step まで待つ。

**完了条件:** `robots` が **198件**（§3.0）、うち published は昇格した分だけ（投入直後は56件）。`npm run check` が全緑、`/robots` の prerender HTML が150KB未満。

件数は次で確認する。

```bash
node --experimental-strip-types -e "import('./data/robots.ts').then(m => { const r = m.robots; console.log('total', r.length); console.log('published', r.filter(x => x.publishStatus === 'published').length); })"
```
Expected: `total 198`。**177 と出たら母集団の行数と取り違えている。**

---

## 8. 順序制約

```
Task 1 ─→ Task 2 ──────────────────────────────→ Task 8 ─→ Task 12
                                                     ↑         ↑
Task 3 ─→ Task 4 ─→ Task 5                           │     （§5 完了）
   │         │                                       │         ↑
   └─→ Task 6 ─→ Task 7 ─────────────────────────────┘         │
                    └─→ Task 9                                 │
Task 10（deployments）… 独立                                    │
Task 11（manufacturers）… 独立 ─────────────────────────────────┘
```

- **Task 3・4・6 は Task 7 より先**。1ファイルから消すほうが26ファイル（分割後）から消すより安全で、差分も読みやすい
- **Task 5 は Task 4 の後**。`Robot.vendorRiskNote` を消してから表示コンポーネントを作らないと、消す予定の軸を実装してしまう
- **Task 7 は Task 8・9 より先**。分割後のファイルに対して値を当てる
- **Task 11 は Task 12 より先**。新規134件の `manufacturerId` が参照整合性チェック（G5）に引っかかる
- `data/robots.ts` を触る task（3・4・6・7・8・9・12）は同じファイルを触るため直列にする

---

## 9. 影響範囲・リスクと軽減策

| リスク | 影響 | 軽減策 |
|---|---|---|
| Task 7 の分割でレコードを落とす / 取り違える / 重複させる | データ欠損。`validate:data` は件数を見ないため気づけない | Step 1・3 で `id` ソート後の sha256 を突き合わせる（長さ比較では並び替えも取り違えも検出できない） |
| Task 3 で検索性が落ちる | `/robots` の検索で「初期導入向け」等が引けなくなる | 意図した変更。カードに表示されていない値なので実害は小さいと判断。**ユーザーへ事前告知済み（2026-08-07）** |
| Task 6 のゲートが空振りする | 「落ちないゲート」が増える | Step 6 でわざと違反を仕込み exit 1 を確認する（Global Constraints） |
| Task 10 で世界地図の static asset が陳腐化 | Home の地図が古い拠点のまま | `check:world-map-asset` を検証に入れ、赤なら `generate:world-map` で再生成 |
| Task 12 で `/robots` が重くなる | 全件昇格時のページ重量 36,770 B → 約124KB | Step 5 で実測。150KB 超なら別計画として起票 |
| Task 5 で注記本文が client bundle へ漏れる | 共有フロア増加、`check:bundle-content` 違反 | Server Component 側で渡す。`tests/unit/view-models/robots.test.ts` の `supportNote` 行を残して機械的に守る |
| 原本HTMLがユーザー環境にしかない | 他の環境で再現できない | 正規化JSON（`data/import/*.json`）をコミットする |
| `deploymentStage` を人が埋め間違える | カタログの絞り込みが誤る | §5.1 の8分岐を製品ページで1回通す運用。43行は現行値を転記するので判断は134行 |

### 9.1 ロールバック

- **各 task の直前にタグを打つ**（`git tag pre-task-3` など）。12 task・20以上のコミットに
  またがるため、`git log` から戻り先を探す状態にしない
- **Task 7（分割）を挟んで戻すときは、Task 7 以降を先に revert する。** Task 3・4・6 が
  消した行は分割後に別ファイルへ移っているので、Task 7 を残したまま単純な `git revert` を
  かけると必ず衝突する
- Task 12 は1メーカー1コミットなので、メーカー単位で revert できる
- データ変更の task はいずれも `npm run validate:data` が通る状態でコミットするので、
  revert 後もその時点の状態は valid

**副作用が及ぶ既存機能**: `/robots`（カード・検索・フィルタ）、`/robots/[slug]`、`/compare`、`/manufacturers`、`/manufacturers/[slug]`、`/`（世界地図）。`/reports` `/use-cases` `/about` `/contact` `/privacy` は変更対象外。

---

## 10. 検証

### コマンド

```bash
npm run validate:data          # 各データ task の末尾
npm run typecheck
npm run lint
npm run test
npm run build
npm run check:data-boundaries  # Task 7
npm run check:world-map-asset  # Task 10
npm run check:client-budgets   # Task 5, 11, 12
npm run check:bundle-content   # Task 5, 12
npm run test:e2e               # Task 5, 12
npm run check                  # Task 12 の総合確認（上記すべてを含む）
```

**CI の確認は retries や verify=SUCCESS だけを見ない。** e2e の flaky 件数まで読む。2026-08-07 時点の main は unit 72 passed / 20 files、e2e 79 passed、flaky 0。

### 手動確認チェックリスト

- [ ] `/robots` — カード数が `published` レコード数と一致する（投入直後は56件。全件昇格しても198件にはならない。archived と draft は出ない）。フィルタの件数表示が正しい。0件選択肢が disabled
- [ ] `/robots` — 390px / 768px / 1280px で横スクロールが出ない
- [ ] `/robots/[slug]` — `supportNote` が出る。空のレコードで空欄が崩れない
- [ ] `/manufacturers/[slug]` — 注記4軸が出る。4軸すべて空のメーカーで見出しだけ残らない
- [ ] `/compare` — 削除したフィールドの行が消え、レイアウトが崩れない
- [ ] `/` — 世界地図の拠点数が `data/deployments.ts` の published 件数と一致する。arc が破綻しない
- [ ] archived レコード（`onex-eve` / `fourier-gr1` / `fourier-gr2` / `figure-02` / `apptronik-apollo`）が一覧に出ない
- [ ] キーボードのみで `/robots` のフィルタと `/manufacturers/[slug]` の注記まで到達できる
- [ ] コンソールエラーが出ない

---

## 11. この計画がやらないこと

- 画像・ロゴの調達（DEC-S10。`robot-image-sourcing-plan-v1.md` の範囲）
- CMS / DB移行そのもの（`content-platform-migration-plan-v1.md` の範囲）
- `DeploymentSite` 型の拡張（Task 10 で取り込まない7列の扱いは別途判断）
- `distributorNote` → `domesticDistributors` の構造化移行（DEC-S06 で重複と認定したが、本計画では表示に留める）
- **`draft` → `published` の昇格**（最大134件）。本計画はレコードを投入するところまでで、
  公開判断は行わない。**昇格しない限り `/robots` のカードは今より減る**（§3.0）。
  昇格基準（§F の公開ゲートに加え、どのフィールドが埋まったら昇格してよいか）と担当は
  別途決める
- **`japanAvailability` の個別判断49機**。DEC-S03 の「入手可能 / 列挙あり」セルは
  一致率41%のため自動確定しない。誰がいつ判断するかは別途決める
- `/robots` のページネーション（Task 12 Step 5 の再測定で150KB超なら別計画として起票）
- 記事・活用事例の追加
- 価格情報の一括更新（`priceOffers` は既存の裏取り済みレコードのみ）
- `Robot.featuredRank`（0/63）、`Manufacturer.featuredRank`（0/26）、`Robot.heroImage`（0/63、legacy）の整理

---

## 12. 積み残しとの関係

`docs/decisions/deferred-work-register-v1.md` の **#10（`batteryCapacityMah` の未反映、残23機）**は Task 8・Task 12 に吸収される。シートは全177行に mAh 単位の列を持ち（98行が記入済み）、DEC-S01 で variant を別レコードに分けるため、#10 が保留していた「CSV側のvariant名がDeploidの代表レコードとどう対応するか」という論点自体が消える。Task 12 の完了時に #10 を登録簿から削除する。

**#3（共有フロア削減）**は Task 5 と関係する。注記表示を client component にすると共有フロアが増えるため、Server Component 側で渡す（§9）。
