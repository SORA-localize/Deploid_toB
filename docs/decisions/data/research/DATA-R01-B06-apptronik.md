# DATA-R01-B06 Apptronik 調査報告

- checkedAt: `2026-07-16`
- 対象: 2機体
- 対象Robot ID: `apptronik-apollo`, `apptronik-apollo-2`
- JSON: [DATA-R01-B06-apptronik.json](./DATA-R01-B06-apptronik.json)
- 調査範囲: Apptronik公式製品ページ、公式Solutions、公式プレスリリース。画像候補のダウンロードは行っていない。

## 重要な調査結果

### Apollo（旧発表・現行Robot ID）

2023年の公式発表から、5ft8in（172.72cm）、160lb（72.5748kg）、55lbを持ち上げる能力（24.9476kg換算）、交換式電池1本あたり4時間を確認した。55lbはrated/maximumの定義がないため`manufacturer-wording`・`unspecified`の`loadRatings`へ分離した。二足歩行、車輪付き胴体、据置のモジュール構成があるため移動方式は`needs-review`/`hybrid`とした。公式のApollo Solutionsは倉庫ピッキング、ケース・トート処理、組立キット配送、部品検査、製造ライン支援を明示する。

### Apollo 2

Apollo 2専用公式ページから、二足構成と車輪ベース、高速処理向け車輪構成、Artemisによる知覚・計画・制御・安全・タスク実行、交換電池、機会充電、テザーを確認した。2026年6月30日の公式Robot Park発表は、Apollo 2がAustinのRobot Parkと顧客・パートナー拠点で稼働し、テレオペ・自律実行による物流・製造・小売タスクのデータをGoogle DeepMindとAI学習に利用していると記載する。Apollo旧世代の身長・重量・荷重・runtimeはApollo 2へ流用していない。

## 用途接続

- `factory-assembly-kit-transport`: Apollo。Mercedes-Benz公式提携の組立キット・トート配送に接続。
- `factory-visual-inspection`: Apollo。Mercedes-Benz公式提携の部品検査に接続。
- `factory-assembly-support`: Apollo、Apollo 2。公式製造業ページのラインサイド支援、機械供給、kittingに接続。
- `logistics-shelf-picking`: Apollo、Apollo 2。公式Goods-to-Person/Person-to-Goodsの棚・ラックからのピッキングに接続。
- `research-development`: Apollo 2。Robot Parkでの実世界データ収集・AI学習に接続。
- `USE_CASE_GAP apptronik-apollo "retail, home delivery and elder care" https://apptronik.com/news-collection/apptronik-unveils-apollo`
- `USE_CASE_GAP apptronik-apollo-2 "retail and future healthcare/home applications" https://apptronik.com/news-collection/welcome-to-robot-park-where-apptroniks-apollo-goes-to-work`

## 事例の扱い

ApolloはMercedes-Benzの製造施設パイロットとGXOの倉庫PoCをusageExamplesに収録した。Apollo 2はRobot Parkおよび顧客・パートナー拠点での実運用・データ収集を研究事例として収録した。製品発表、一般Solutions、単なる将来用途の列挙は導入事例と混同していない。

## 価格・調達・日本情報

Apollo/Apollo 2ともApptronik公式の公開価格は確認できず、`priceOffers`は空配列とした。公式Get Started、顧客サイトでのpilot/deployment、量産拡大、Robot Park運用は確認できるが、公開カタログ価格・日本在庫・国内正規代理店・日本語保守は確認できない。問い合わせ導線の存在だけで購入可能とは断定していない。

## 保留事項

- Apollo 2: 構成別の身長、重量、速度、DoF、payload、runtime、電池容量、充電時間、computeの公式データシートを確認する。
- Apollo: 顧客契約時の構成、速度、DoF、電池容量、SDK、compute、IP、温度、安全規格を確認する。
- 両機体: 日本での販売・保守・価格・税区分をApptronikへ確認する。

値を推測して補完せず、上記はJSONの`humanReviewRequired`にも記録した。
