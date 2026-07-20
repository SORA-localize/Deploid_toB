# DATA-R01 implementation manifest report

Generated from: `DATA-R01-VERIFY-B01.json`〜`DATA-R01-VERIFY-B14.json`
Schema: `DATA-R01-implementation-v1`
Checked at: 2026-07-16

## 結論

VERIFYの `verificationStatus` が `verified` / `corrected` で、対象variantが確定し、`proposedValue` がnullでない値だけを実装候補へ抽出した。
`unresolved` / `rejected` は `robotPatch` へ入れず、`manualReview` に隔離している。

公式ページで「非掲載」を確認できたspecは `clearSpecKeys`、公開価格なしを確認できたRobotは `priceOffers.action: clear` として、古い値を残さないための削除候補を分離した。削除候補も実装時に差分確認する。

## 全体件数

- Robot: 61
- 設定候補spec: 313
- 削除候補spec: 0
- 公開価格offer: 10
- 荷重: 45
- 活用事例URL: 34
- 公式UseCase evidence: 85
- 既存のdeployment/adjacent-deployment関係を保持して要レビュー: 2
- USE_CASE_GAP: 38
- unresolved record: 534
- 追加・メタデータ確認が必要なsource join: 38

## カード4項目の調査カバレッジ

61機のうち、VERIFYから直接採用できる情報があるRobot数。

- 想定用途（既存UseCaseへ公式根拠付き接続）: 37
- サイズ（身長または重量）: 34
- 公開価格: 8（それ以外はUIの問い合わせフォールバック）
- 稼働時間: 26

## バッチ別

| Batch | Robot | spec set | spec clear | price | load | usage | use case evidence | relation review | gap | unresolved | source review |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| B01 | 10 | 79 | 0 | 4 | 10 | 4 | 7 | 0 | 4 | 44 | 13 |
| B02 | 8 | 49 | 0 | 2 | 6 | 3 | 7 | 0 | 6 | 63 | 12 |
| B03 | 6 | 28 | 0 | 0 | 2 | 4 | 11 | 0 | 2 | 41 | 2 |
| B04 | 4 | 23 | 0 | 0 | 3 | 1 | 13 | 0 | 3 | 28 | 5 |
| B05 | 4 | 16 | 0 | 0 | 1 | 0 | 2 | 0 | 2 | 58 | 0 |
| B06 | 2 | 8 | 0 | 0 | 1 | 3 | 7 | 1 | 2 | 5 | 1 |
| B07 | 2 | 12 | 0 | 2 | 3 | 3 | 1 | 0 | 2 | 7 | 1 |
| B08 | 2 | 12 | 0 | 2 | 0 | 2 | 4 | 0 | 4 | 11 | 2 |
| B09 | 2 | 12 | 0 | 0 | 2 | 3 | 6 | 0 | 7 | 12 | 2 |
| B10 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 53 | 0 |
| B11 | 2 | 18 | 0 | 0 | 7 | 3 | 5 | 0 | 0 | 9 | 0 |
| B12 | 2 | 9 | 0 | 0 | 1 | 0 | 1 | 0 | 2 | 32 | 0 |
| B13 | 8 | 24 | 0 | 0 | 5 | 5 | 8 | 0 | 2 | 105 | 0 |
| B14 | 7 | 23 | 0 | 0 | 4 | 3 | 13 | 1 | 2 | 66 | 0 |

## 実装順序

1. 各manifestの `robotSourceRequirements` と `useCaseSourceRequirements` を確認し、`status: add-after-review` のsource title・publisher・reliabilityを確定する。
2. sourceを追加してから `robotPatch.specs`、価格、荷重、活用事例URL、procurementを反映する。
3. `clearSpecKeys` / `clearProcurementFields` / `priceOffers.action: clear` は現行値と出典を目視して削除する。
4. `useCaseRelations` を既存candidateへ上書きせずmergeする。`preserve-existing-review-official-evidence` は既存のdeployment系関係を保持し、UseCase.sourcesへのevidence追加だけを個別判断する。
5. `manualReview`、特に既存値を持つunresolved fieldを確認する。推測で埋めない。
6. メーカー単位または5〜8機体単位で `npm run validate:data`、`npm run build`、`npm run check:source-links` を実行する。

## 非対象

- 画像・ロゴの権利判断と素材登録
- summary / description / comparison のAI自動生成
- USE_CASE_GAPからのUseCase自動新設
- unresolved値のenumへの推測変換
- dirtyな実装worktreeへの自動適用
