# DATA-R02 Implementation Decisions

Status: approved

Approved by: project owner

Approved at: 2026-07-18

Applies to: DATA-R02 implementation manifest and subsequent Robot data rollout

## 1. この文書の役割

DATA-R02の調査結果を `data/*.ts` へ反映するときの編集判断を固定する。

この文書自体は公開データの正本ではない。実装値の正本は `data/*.ts`、型は `data/types.ts`、スペック項目は `lib/specSchema.ts`、用途関係は `UseCase.candidateRobots` とする。

## 2. 公開状態

| Robot | 決定 | 実装時の扱い |
| --- | --- | --- |
| `agibot-a2-max` | `draft` | Coming soonの間は一覧、関連レール、sitemapへ出さない。公式ページと調査記録は保持する |
| `fourier-gr1` | `archived` | 詳細URLを保持し、`supersededById: 'fourier-gr2'`を設定する |
| `fourier-gr2` | `archived` | 詳細URLとSDKサポート情報を保持し、`supersededById: 'fourier-gr3'`を設定する |
| `apptronik-apollo` | `archived` | 詳細URLを保持し、`supersededById: 'apptronik-apollo-2'`を設定する |
| `robotera-m7` | `published`を維持 | 現行機として掲載を続けるが、公式本文で確認できない数値は追加しない |

`archived` は削除を意味しない。詳細ページは残し、noindex、提供終了表示、後継機導線、既存記事・用途参照の維持を確認する。

上記以外の56機は、今回のlifecycle調査だけを理由にpublishStatusを変更しない。

## 3. 値の採用条件

次の全条件を満たすR02値だけを実装manifestの `set` 候補にする。

- statusが `found`
- `evidence.sourceUrl` がある
- `evidenceScope` が現行製品、現行family共通、または対象recordと一致するvariant固有情報
- 対象Robotのidentityと矛盾しない
- 現行schemaへ意味を失わず投影できる
- RobotまたはUseCaseの `sources[]` から根拠URLを追跡できる

次は自動採用しない。

- `conflict`
- `needs-review`
- `source-inaccessible`
- `historical-only`
- 対象variantが異なる値
- 第三者記事だけに存在する仕様値
- 自由記述を既存enumへ推測変換した値

## 4. 既存値の削除

`not-published` は自動削除指示として扱わない。

既存値を削除する場合は、次を満たしてmanifestへ `clear-after-review` として分離する。

- 既存値の出典を確認した
- 旧世代・別variant・古い公式資料の値であることを確認した
- 現行製品へ残すと誤認を生む
- 削除後のカード、詳細、比較の欠損表示を確認する

人間確認なしで一括clearしない。

## 5. R02固有データの投影

| R02 field | 決定 |
| --- | --- |
| `identity.lifecycleStatus` | 最初のdata batchでは新fieldとして追加しない。公開制御は承認済みpublishStatus変更で行い、追加の必要性はpilot後に再評価する |
| `priceFallback` | 保存しない。`priceOffers`がなければ既存resolverがDeploid問い合わせを返す |
| `procurement` | `procurementModels`、`marketAvailability`、`japanAvailability`、`distributorJapan`、`supportNote`へ意味を保てる値だけ投影する |
| `usageExamples` | 最大3件を選び、URLだけを`usageExampleSourceUrls`へ保持する。タイトル、publisher、日付は`Source`から解決する |
| `currentFeatures` | 267件を一括追加しない。aeo pilot後に、既存description・spec・UseCase・procurementでは表示できない必要情報だけを確認する |
| variant別spec | family-commonだけscalar specへ入れる。variant固有値を単一の代表値へ潰さない |

## 6. variant方針

- 公式に別モデル・別世代・別SKUとして扱われる場合だけrecord分割候補にする
- 同一製品の選択構成は、共通値だけ既存Robotへ採用する
- 価格と荷重は既存のvariant付き `priceOffers` / `loadRatings` を使う
- その他のvariant別specは、record分割またはvariant構造を別途承認するまで保留する
- `kepler-k2`、`ubtech-walker-tienkung`、`kawasaki-kaleido`を後続設計の代表ケースとする
- variant問題を理由に、現行公式ページのfamily-common情報まで一括棄却しない

## 7. 用途と活用事例

- 公式用途は既存UseCaseと意味が一致する場合だけ `basis: 'official-use-case'` と根拠URLを付けてmergeする
- 既存のdeployment / adjacent-deployment関係を上書きしない
- 51件のUSE_CASE_GAPはRobot rolloutで自動追加しない
- USE_CASE_GAPは別triageで同義語をまとめ、複数Robot・複数一次根拠があるものだけ新規UseCase候補にする
- 活用事例は最大3件。用途説明、メーカー自身のデモ、実導入を混同しない
- 旧世代事例は現行機の実績として扱わず、必要ならhistorical / adjacentとして分離する

## 8. 最初のpilot

最初に反映するRobotは `aeolus-aeo` とする。

pilotでは次だけを行う。

- 現行公式ページに直接帰属する操作方式
- 既存UseCaseと一致する公式用途
- RaaS、国内窓口、保守情報
- 必要なSourceとfield evidence
- 最大3件の活用事例URL候補のうち、現行機との関係を説明できるもの

数値specを推測で埋めず、型・UI・他60機を同じcommitで変更しない。

pilot後、公開情報のうち現行modelでは適切に保存・表示できないものを列挙する。その結果を見て初めて、根拠URL付き `featureFacts` 等の追加要否を判断する。

## 9. 実装単位

- R02から直接dataへコピーせず、先に実装manifestを作る
- 最初はaeo 1機
- 通常batchは1メーカーまたは5〜8機体
- conflict、variant、source-inaccessibleは通常batchへ混ぜない
- 公開状態変更はspec更新と別commitにする
- 1task 1commitを原則とする

## 10. 次の作業

次はR02-02として実装manifestを作成・監査する。

この段階でも `data/*.ts`、UI、画像、publishStatusは変更しない。61機の全R02値を `set`、`preserve`、`clear-after-review`、`hold-*`、`unsupported-schema` のいずれかへ分類してから、aeo pilotへ進む。
