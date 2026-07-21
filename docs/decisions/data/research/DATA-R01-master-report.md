# DATA-R01 published Robot 全件公式情報調査

調査日: 2026-07-16（Asia/Tokyo）
対象: `data/robots.ts` の実行時 `publishStatus: 'published'` 61機
調査単位: 1 Robot ID を1回だけ調査し、14バッチへ分割

Status: **一次調査完了 / 正規化・独立ファクトチェック未完了**

この文書とB01〜B14のJSONはraw調査成果物であり、実装・公開データの正本ではない。
`data/*.ts`へ反映する前に、現行enumへの正規化、未解決項目の再確認、型検証を必須とする。

## 結論

公開Robotはコードから再計算した結果61機で、14バッチのJSONへちょうど1回ずつ収録した。欠落、重複、対象外IDは0件。各Robotについてカード項目（用途、身長、重量、価格、稼働時間）と、`lib/specSchema.ts` の16項目を調査し、値または調査状態、variant、raw value、正規化値、条件、直接の出典URLを記録した。これは調査対象の網羅を示すものであり、全値の正確性・最新性・実装可能性を保証しない。

調査データは実装用の `data/*.ts` やUIへ書き戻していない。以下のバッチJSONとMarkdownがDATA-R01の調査成果物である。

## バッチ一覧

| Batch | メーカー / 対象数 | Robot IDs | 成果物 |
|---|---:|---|---|
| B01 | Unitree / 10 | `unitree-g1`, `unitree-g1-edu`, `unitree-h1`, `unitree-h1-2`, `unitree-h2`, `unitree-h2-edu`, `unitree-h2-plus`, `unitree-r1`, `unitree-r1-standard`, `unitree-g1-d` | [JSON](./DATA-R01-B01-unitree.json) / [Markdown](./DATA-R01-B01-unitree.md) |
| B02 | AgiBot / 8 | `agibot-a2`, `agibot-a2-ultra`, `agibot-a2-max`, `agibot-a2-lite`, `agibot-x1`, `agibot-x2`, `agibot-x2-ultra`, `agibot-g2` | [JSON](./DATA-R01-B02-agibot.json) / [Markdown](./DATA-R01-B02-agibot.md) |
| B03 | UBTECH / 6 | `ubtech-walker-s2`, `ubtech-walker-s1`, `ubtech-walker-x`, `ubtech-walker-s`, `ubtech-walker-c`, `ubtech-walker-tienkung` | [JSON](./DATA-R01-B03-ubtech.json) / [Markdown](./DATA-R01-B03-ubtech.md) |
| B04 | Fourier / 4 | `fourier-gr2`, `fourier-gr3`, `fourier-gr1`, `fourier-gr3c` | [JSON](./DATA-R01-B04-fourier.json) / [Markdown](./DATA-R01-B04-fourier.md) |
| B05 | EngineAI / 4 | `engineai-se01`, `engineai-pm01`, `engineai-t800`, `engineai-sa01` | [JSON](./DATA-R01-B05-engineai.json) / [Markdown](./DATA-R01-B05-engineai.md) |
| B06 | Apptronik / 2 | `apptronik-apollo`, `apptronik-apollo-2` | [JSON](./DATA-R01-B06-apptronik.json) / [Markdown](./DATA-R01-B06-apptronik.md) |
| B07 | 1X / 2 | `onex-neo`, `onex-eve` | [JSON](./DATA-R01-B07-onex.json) / [Markdown](./DATA-R01-B07-onex.md) |
| B08 | Booster Robotics / 2 | `booster-t1`, `booster-k1` | [JSON](./DATA-R01-B08-booster.json) / [Markdown](./DATA-R01-B08-booster.md) |
| B09 | Kepler / 2 | `kepler-k2`, `kepler-k1` | [JSON](./DATA-R01-B09-kepler.json) / [Markdown](./DATA-R01-B09-kepler.md) |
| B10 | Leju / 2 | `leju-kuavo`, `leju-kuavo5` | [JSON](./DATA-R01-B10-leju.json) / [Markdown](./DATA-R01-B10-leju.md) |
| B11 | PAL Robotics / 2 | `pal-talos`, `pal-kangaroo` | [JSON](./DATA-R01-B11-pal.json) / [Markdown](./DATA-R01-B11-pal.md) |
| B12 | LimX Dynamics / 2 | `limx-oli`, `limx-luna` | [JSON](./DATA-R01-B12-limx.json) / [Markdown](./DATA-R01-B12-limx.md) |
| B13 | Other / 8 | `agility-digit`, `figure-03`, `boston-dynamics-atlas`, `tesla-optimus`, `sanctuary-phoenix`, `kawasaki-kaleido`, `neura-4ne-1`, `xpeng-iron` | [JSON](./DATA-R01-B13-other.json) / [Markdown](./DATA-R01-B13-other.md) |
| B14 | Other / 7 | `wandercraft-calvin`, `mentee-menteebotv3`, `robotera-l7`, `robotera-q5`, `robotera-m7`, `galbot-g1`, `aeolus-aeo` | [JSON](./DATA-R01-B14-other.json) / [Markdown](./DATA-R01-B14-other.md) |
| **合計** | **61** | **61 unique IDs** | **14 JSON / 14 Markdown** |

## 調査方法と記録ルール

- 最初に `data/robots.ts`, `data/types.ts`, `data/useCases.ts`, `data/deployments.ts`, `lib/specSchema.ts`, `lib/robotCatalog.ts`, DATA-R01計画書、`docs/data/README.md`を確認した。
- `robots.ts` のRobotオブジェクト境界ごとに `publishStatus` を再計算し、固定件数61を前提にしなかった。
- 情報源はメーカー公式製品ページ、公式仕様表・PDF・マニュアル、公式ストア、公式ニュース・導入事例を優先した。国内正規代理店の掲載は、正規代理店であることを公式発表で確認できた場合だけ採用した。
- 各フィールドは `found`, `not-published`, `not-applicable`, `needs-review`, `conflict` のいずれかを付与した。`not-published`にも確認ページ、確認できなかった内容、理由を残した。
- 数値は公式raw表記と正規化値を併記し、km/h→m/s、h→min、V×Ah→Whなどの換算は`condition`へ換算元を残した。推測値、旧世代値、別variant値は採用していない。
- `payloadKg`は片腕荷重へ読み替えず、`loadRatings[]`へ`single-arm`, `dual-arm`, `whole-body`, `carrier`, `manufacturer-wording`と`rated`, `maximum`, `unspecified`を分離して記録した。
- `fieldEvidence`は全61 Robotへ収録した。`pagesReviewed`、`sourceCandidates`、各fieldの`sourceUrl`、価格・荷重・用途・事例URLから、後続実装で`Robot.sources[]`を生成できるようにした。
- 用途接続は既存のpublished UseCaseだけを使用し、新しいタグ・UseCaseは作成していない。既存項目に対応しない公式用途は`useCaseGaps`へ`USE_CASE_GAP`形式で記録した。
- 活用事例は製品発表・一般デモを導入事例と混同せず、メーカー公式記事、導入企業・研究機関の公式発表、公式動画・報道の順で最大3件まで収録した。
- 画像はダウンロードしていない。画像調査資料はスペック調査の一次根拠には使用していない。

## スキーマ別集計

各行は61 Robot分。`not-applicable`が0件なのは、今回の公開カタログでは該当なしを断定せず、公開値がない場合は`not-published`またはvariant・意味が曖昧な場合は`needs-review`として残したためである。

| specSchema field | found | not-published | needs-review | conflict | not-applicable |
|---|---:|---:|---:|---:|---:|
| `mobility` | 49 | 2 | 10 | 0 | 0 |
| `heightCm` | 41 | 12 | 5 | 3 | 0 |
| `weightKg` | 35 | 14 | 6 | 6 | 0 |
| `speedMps` | 18 | 30 | 8 | 5 | 0 |
| `dof` | 26 | 16 | 11 | 8 | 0 |
| `payloadKg` | 0 | 59 | 2 | 0 | 0 |
| `runtimeMin` | 30 | 19 | 9 | 3 | 0 |
| `batteryCapacityWh` | 14 | 29 | 18 | 0 | 0 |
| `chargeTimeMin` | 14 | 44 | 3 | 0 | 0 |
| `batterySystem` | 44 | 14 | 3 | 0 | 0 |
| `controlMethod` | 52 | 7 | 2 | 0 | 0 |
| `sdk` | 24 | 26 | 9 | 2 | 0 |
| `computePlatform` | 22 | 27 | 7 | 5 | 0 |
| `ipRating` | 6 | 53 | 2 | 0 | 0 |
| `operatingTemperature` | 8 | 51 | 2 | 0 | 0 |
| `safetyStandard` | 2 | 54 | 5 | 0 | 0 |

### カード項目

| カード項目 | found | not-published | needs-review | conflict |
|---|---:|---:|---:|---:|
| 身長 | 41 | 12 | 5 | 3 |
| 重量 | 35 | 14 | 6 | 6 |
| 稼働時間 | 30 | 19 | 9 | 3 |
| 価格調査状態 | 9 | 47 | 3 | 2 |

公式ページに金額の数値表示があるOfferだけ`priceOffers[]`へ20件収録した。価格未掲載のRobotには「問い合わせ」という偽の価格Offerを追加していないため、Deploidの`/contact`フォールバックを利用できる。公式ページ間の表示が衝突するもの、版・パッケージ・税区分・有効期限・表示単位が確定しないものは、数値をraw記録したうえでRobotの価格調査状態を`conflict`または`needs-review`にしている。

## 価格・荷重・用途・事例の集計

| 項目 | 件数 | 内容 |
|---|---:|---|
| `priceOffers[]` | 20 | メーカー公式、または正規代理店と確認できた公開価格のみ |
| `loadRatings[]` | 54 | 各JSONでscope・rating・variant・sourceUrlを保持。scalar `payloadKg`へ統合していない |
| 活用事例 | 52 | 1 Robotあたり最大3件、`deployment` / `pilot` / `research` / `demonstration`を区分 |
| `useCaseGaps` | 52 | 既存UseCaseへ未登録の公式用途。各JSONに`USE_CASE_GAP ...`を記録 |
| `conflicts` | 105 | 公式ページ間の版・構成・単位・意味の不一致を保持 |
| `humanReviewRequired` | 114 | variant確定、価格条件、国内窓口など実装前に人手確認が必要な事項 |

`loadRatings[]`の件数は、同じRobotの複数scopeをまとめて扱わないよう、バッチJSONを機械的に再集計する実装側で数える。特に「片腕3kg/5kg」「両腕10kg」「全身payload」「搬送重量」を相互に読み替えていない。

## 重要な要確認事項

- Fourier GR-1、UBTECH Walker Tienkung、Kepler K2、EngineAI T800、LimX Oli、PAL KANGAROOなどは、公式資料内に複数構成・複数行がある。generic Robot IDに一つの値を推定せず、`needs-review`または`conflict`としてvariant確定待ちにした。
- Fourier GR-3CはGR-3 Series共通値をGR-3C固有値へ流用していない。RobotEra L7は英語ページの身長欄の表記矛盾を保持した。
- Galbot G1は製品ページの「車輪を含む24 DoF」とマニュアルの「車輪を除く21 DoF」を別値として`conflict`にした。
- Aeolus aeoは現行`aeo`ページと旧称・旧資料の対象範囲を分け、国内代理店についてもMarubunの公式発表で確認できる範囲に限定した。
- 1X NEOの販売開始・地域展開、Booster K1/T1のパッケージ価格、EngineAI PM01/T800/SA01の版・キャンペーン価格は、掲載時点・構成・税区分を混同しないよう`priceOffers`と`conflicts`へ残した。
- `USE_CASE_GAP`は不足をAIで補完する指示ではなく、既存の「用途から探す」分類に現行項目がないことを示す調査結果である。

## 機械検証結果

以下を再計算した。

1. `data/robots.ts`をRobotオブジェクト境界で解析し、published IDを抽出。
2. B01〜B14のJSONをすべてJSON parse。
3. JSON内IDの集合とpublished IDの集合を比較。
4. 全Robotの`fields`に16 schema keyがあることを確認。
5. `found`フィールド、`priceOffers[]`、`loadRatings[]`、`usageExamples[]`に直接URLがあることを確認。
6. `usageExamples[]`がRobotごとに3件以内であること、published UseCase ID以外を接続していないことを確認。

結果:

- published: **61**
- JSON収録: **61**
- unique ID: **61**
- missing: **0**
- duplicate: **0**
- extra: **0**
- schema field欠落: **0**
- `found`で直接`sourceUrl`欠落: **0**（found値385件）
- `fieldEvidence`欠落: **0**
- 1Robotあたり事例上限超過: **0**

## 事後構造監査

2026-07-16に、B01〜B14のJSONを現行`data/types.ts`、`lib/specSchema.ts`へ照合した。
集合・field網羅・URL存在は上記の自己検証と一致した。B01/B02の現行公式ページを再確認し、B02/B03/B04/B05のJSONについて、実装前の機械監査で見つかった型・field evidenceの差分も修正した。なお、同一URLが複数の活用事例を支える場合、`usageExampleSourceUrls`は重複を除いたURL集合として比較した。

| 問題 | 件数 |
|---|---:|
| `marketAvailability`の現行enum外 | 49 |
| `japanAvailability`の現行enum外 | 41 |
| `procurementModels`の現行enum外 | 35 |
| `found`値の型不一致 | 0 |
| `conflict` / `needs-review`のまま保持された価格Offer | 6 |
| `usageExamples` URL集合と`usageExampleSourceUrls`の不一致 | 0 |
| `found`値の`fieldEvidence`不足 | 0 |

enum正規化前の3項目（`marketAvailability` 49件、`japanAvailability` 41件、`procurementModels` 35件）と、価格の`conflict`/`needs-review` 6件を合わせ、実装前に解決すべきraw-to-runtime差分は**131件**残る。これは調査状態を欠落させる問題ではなく、現行TypeScript enumへ投影する際にraw値・表示値を分離するための正規化課題である。
加えて、field状態には`needs-review` 102件、`conflict` 32件があり、Robot単位の
`conflicts` 105件、`humanReviewRequired` 114件が残る。

したがって完了したのはDATA-R01の一次調査である。各バッチJSONをraw記録として保持したまま、
別成果物で正規化・再検証し、validatorを通過した値だけを`Robot.sources[]`、カード項目、
詳細仕様、価格、荷重、用途、活用事例へ投影する。
