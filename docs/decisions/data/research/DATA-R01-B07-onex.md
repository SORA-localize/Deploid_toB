# DATA-R01-B07 1X Technologies 調査報告

- checkedAt: `2026-07-16`
- 対象: 2機体
- 対象Robot ID: `onex-neo`, `onex-eve`
- JSON: [DATA-R01-B07-onex.json](./DATA-R01-B07-onex.json)
- 調査範囲: 1X公式製品ページ、注文ページ、About、AI/研究記事、公式発表。画像候補のダウンロードは行っていない。

## 重要な調査結果

### NEO

公式NEO仕様表から、身長5ft6in（167.64cm）、重量66lb（29.9379kg）、歩行1.4m/s、最大走行6.2m/s、手8.0m/s、842Wh、runtime4時間、手IP68・本体IP44、Nvidia Jetson Thor搭載のNEO Cortex、最大2070 FP4 TFLOPSを確認した。荷重はlift154lb、carry55lb、arm payload18lbをscope別`loadRatings`へ分離した。充電は「稼働1時間あたり6分のquick charge」であり、満充電時間ではないため`needs-review`。

DoFは、現行製品ページの手22×2等から合計75と読める一方、2026年7月9日の公式NEO Hands発表は手1個25 DoFを明示する。出荷手世代が確定するまで`conflict`とした。公式注文ページはEarly Access所有`$20000`、Standardサブスクリプション`$499/月`、返金可能デポジット`$200`を掲載したが、デポジットは製品価格ではないためpriceOffersには入れていない。米国2026年配送、他市場2027年以降の拡大を確認し、日本は未確定とした。

### EVE Industrial

公式EVEページ・Aboutから、EVEを車輪型工場ヒューマノイド／androidとして、顧客工場で産業タスクを自律処理する機体と確認した。数値仕様表、価格、SDK、電池容量、payload、温度、IP、安全規格は公式公開ページで確認できなかった。公式World Model記事は、EVEで家庭・オフィスの移動マニピュレーションを数千時間収集した研究を記載する。

## 用途接続

- `research-development`: EVE。公式World Model研究のデータ収集・評価に接続。
- NEOの家庭内家事・個人支援は既存UseCaseに対応項目がないため、タグを新設せず`USE_CASE_GAP`とした。
- EVEの自律工場タスクも既存UseCaseの具体的な作業表現が公式ページにないため、`USE_CASE_GAP`とした。
- `USE_CASE_GAP onex-neo "household chores / personal domestic assistance / companionship" https://www.1x.tech/neo`
- `USE_CASE_GAP onex-eve "autonomous industrial factory task handling" https://www.1x.tech/about`

## 事例の扱い

NEOは1X公式Aboutの「NEO In Your Home」をEarly Access家庭への展開pilotとして収録した。EVEは、公式rebranding発表の米国での大規模商用展開と、公式World Model研究の家庭・オフィスデータ収集を収録した。製品ページの家事例示や画像デモは導入事例に数えていない。

## 価格・調達・日本情報

- NEO: 公式注文ページのEarly Access所有`$20000`、Standard`$499/月`を記録。`$200`は返金可能デポジットであり価格Offerから除外。
- EVE: 公開価格なし。企業問い合わせ・pilot・研究協力のみ。
- NEOは所有プランに3年保証・Premium Support・Priority Deliveryを確認した。
- 両機体とも日本の国内正規代理店は確認できない。NEOは公式発表が2026年米国、2027年以降の他市場拡大を記載するが、日本名はない。

## 保留事項

- NEO: 出荷手世代（22 DoF/handと25 DoF/hand）、最終注文価格・税・サブスクリプション条件、日本配送可否を確定する。
- EVE: 企業向けデータシートで全16項目、価格、構成、国内調達条件を確認する。

値を推測して補完せず、上記はJSONの`humanReviewRequired`にも記録した。
