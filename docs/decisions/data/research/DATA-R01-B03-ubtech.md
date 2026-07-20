# DATA-R01-B03 UBTECH 調査報告

- checkedAt: `2026-07-16`
- 対象: 6機体
- 対象Robot ID: `ubtech-walker-s2`, `ubtech-walker-s1`, `ubtech-walker-x`, `ubtech-walker-s`, `ubtech-walker-c`, `ubtech-walker-tienkung`
- JSON: [DATA-R01-B03-ubtech.json](./DATA-R01-B03-ubtech.json)
- 調査範囲: UBTECH公式製品ページ、公式産業ソリューション、公式年次・中間報告、公式SDK/マニュアル、GA Robotics（UBTECH日本代理店）公式ページ。画像候補のダウンロードは行っていない。

## 重要な調査結果

### Walker S2

UBTECH公式はS2を産業用ヒューマノイド、自律ホットスワップ、3分交換、7x24運用、52 DoF、15kg payloadとして説明する。SANY REとFoxconnの公式導入事例を収録した。身長・重量は、GA Roboticsの発表（176cm/73kg）、カタログ（176cm/70kg）、製品ページ表（172cm等）が一致しないため`conflict`とした。S2の3分は充電時間ではなく交換時間であり、runtime/充電時間は`not-published`とした。GA RoboticsのROS2 SDKは「段階的公開予定」のため`needs-review`。

### Walker S1

公式製品ページは、LLMタスク計画、semantic VSLAM、学習型全身制御、車両製造ラインへの導入を確認できる。公式産業ソリューションと香港取引所公告からBYDでの搬送・自律物流連携、S1/Cの購入契約を確認した。一方、公式ページの仕様表は画像導線のみで、読み取れない身長・重量・速度・DoF・payload・runtimeを販売ページや既存コードから補完していない。これらは`not-published`として残した。

### Walker X

公式仕様表から130cm、63kg、最大3km/h、41 DoF、2時間、54.6V/10Ah、充電2時間、単腕1.5kg、Intel i7-8665U x2/NVIDIA GT1030を抽出した。3km/hは`0.8333m/s`へ換算し、54.6V x 10Ahの546Whは公式Wh直記載ではないため`needs-review`とした。Walker Xの主位置付けはサービス・対話・スマートホーム制御で、スマートホーム制御は既存UseCaseに未登録。

### Walker S

公式本文で1.7m、41 servo joints、ROSA 2.0、GUI/tele-operation/AIOT、工場組立・検査を確認した。S Liteの仕様画像、S1/S2の値は流用していない。NIO最終組立ワークステーション導入を公式事例として収録した。重量・速度・電池・payload等は公式テキストで確認できず`not-published`。

### Walker C

公式仕様表から163cm、43kg、20 DoF、48V/15Ah、充電1.5時間、歩行2時間、立位4時間を抽出した。6km/hは公式の「steady running pace」であり最大速度と断定せず、`needs-review`で1.6667m/sへ換算した。展示館案内・受付・Expo 2025 Osaka・Strawberry Music Festival・広東省春節晩会の事例を収録した。48V x 15Ah=720Whは換算値であり`needs-review`。

### Walker Tienkung

公式マニュアルでgeneric名がTK2101（20 DoF/64kg）、TK2201（21 DoF/68kg）、TK2301（42 DoF/75kg）に分かれることを確認した。Deploidの1 Robot IDにどのvariantを対応させるか未確定なので、身長・重量・DoF・runtime・計算基盤は`conflict`/`needs-review`。公式SDKはROS2でモーター、IMU、音声、電池、リモート等のAPIを提供する。GA RoboticsはWalker E/E Proからの改称、日本正規代理店、評価貸出し、全国オンサイト保守を掲載している。

## 用途接続

- `factory-assembly-support`: Walker S2、S1、S。公式の組立・生産ライン・搬送作業に接続。
- `factory-assembly-kit-transport`: Walker S2、S1、S。公式のSPS部品供給、トレイ/工程資材搬送に接続。
- `factory-visual-inspection`: Walker S1、S。公式の自動車生産ライン品質検査に接続。
- `facility-wayfinding`: Walker X、Walker C。公式のU-SLAM経路計画、展示館・交通拠点案内に接続。
- `customer-reception`: Walker X、Walker C。公式のサービス、対話、受付・歓迎に接続。
- `research-development`: Walker Tienkung。公式の科学研究用途に接続。
- `research-prototype-dev`: Walker Tienkung。公式の全身関節・センサー開放、ROS2 SDK、二次開発に接続。
- `USE_CASE_GAP ubtech-walker-x "Smart Home Control / household appliance operation" https://www.ubtrobot.com/en/humanoid/products/walker-x`
- `USE_CASE_GAP ubtech-walker-c "public-zone entertainment / shopping-mall voice broadcasting" https://www.ubtrobot.com/en/humanoid/products/walker-c`
- `USE_CASE_GAP ubtech-walker-tienkung "education" https://docs.ubtrobot.com/walker-tienkung/en/docs/user-guide/5/`

## 事例の扱い

製品ページの一般的なデモ説明は導入事例に数えず、公式ページが相手先・現場・作業を記載するものだけを収録した。Walker Cの音楽祭・晩会はイベント実演、Expo 2025は案内サービス提供、Walker S/S1/S2の自動車・製造現場はdeploymentに分類した。S1の公式仕様画像は存在を確認したが、読み取れない数値は補完していない。

## 価格・調達・日本情報

6機体とも公開価格は確認できず、`priceOffers`は空配列。S2とTienkungはGA Roboticsの日本正規代理店・相談/貸出し・保守情報を確認できる。Walker Cは日本でのExpo導入実績はあるが、C個別販売を確認できないため日本調達は`needs-review`。S1/Sは企業導入・契約は確認できるが、日本個別代理店は`not-published`。Walker XはUBTECH代理店契約は確認できるが、X個別の国内取扱は`needs-review`。

## 保留事項

- S2: メーカー現行データシートで身長・重量、GA Robotics発表間の差異、SDK公開範囲を確定する。
- S1/S: 公式仕様画像またはデータシートからサイズ、速度、電池、payload、runtimeをvariant明記で確認する。
- Tienkung: Deploid側でTK2101/TK2201/TK2301の掲載variantを確定し、generic値を公開カードに出さない。
- Walker X/C: 546Wh/720WhはV x Ahの換算値であり、公式Wh表記の有無を再確認する。

値を推測して補完せず、上記はJSONの`humanReviewRequired`にも記録した。
