# DATA-R01-B04 Fourier Intelligence 調査報告

- checkedAt: `2026-07-16`
- 対象: 4機体
- 対象Robot ID: `fourier-gr2`, `fourier-gr3`, `fourier-gr1`, `fourier-gr3c`
- JSON: [DATA-R01-B04-fourier.json](./DATA-R01-B04-fourier.json)
- 調査範囲: Fourier公式製品ページ、公式ニュース、公式PDF、公式Developer Center、公式導入事例ページ。画像候補のダウンロードは行っていない。

## 重要な調査結果

### GR-2

公式製品ページと公式ニュースから、175cm、63kg、5km/h、最大53 DoF、平均2時間、単腕荷重3kg、着脱式電池、VR遠隔・lead-through・direct commandを確認した。3kgはrated/maximumの定義がないため`loadRatings`の`single-arm`・`unspecified`へ分離した。Fourier Toolkit、Aurora SDK、Python/DDS、ROS・Isaac Lab・MuJoCoの開発環境を確認したが、搭載計算基盤、電池容量、充電時間、IP、動作温度、安全規格番号は公開値を確認できなかった。量産・販売窓口はあるが公開価格はない。

### GR-3

公式Developer CenterのGR-3 Robot Overviewから、165cm、約71kg、歩行6.1km/h、最大55アクチュエータ、単腕約3kg、約3時間、702Wh+234Wh、約1.5時間充電、46.8Vリチウムイオン・ホットスワップ、AMD Ryzen 7 8845HS/Radeon 780M、Ubuntu 22.04、0–45℃を抽出した。速度は公式の`walking speed`であり、最大速度と表記を変えていない。Care-botとして公共サービス空間、子ども・高齢者、介助移動・健康モニタリング・リハビリへの応用を確認した。製品発表は導入事例に数えず、実導入のusageExamplesは空配列とした。

### GR-1

GR-1専用ページから165cm、55kg、44関節を確認した。公式資料にはGR-1、GR-1 Pro、GR-1 Liteの複数行があり、速度・runtime・compute・payloadのvariant対応が曖昧なため、速度とcomputeは`needs-review`、runtimeとschema payloadは`not-published`、単腕3kgはvariant注記付き`loadRatings`へ記録した。Fourier公式導入事例ページから、銀行ロビー、自動車4S店、国際展示会の3件を収録した。製品資料の一般シナリオ（受付、警備点検、医療・リハビリ）は用途接続したが、一般的なデモ記載はusageExamplesに数えていない。

### GR-3C

専用ページで、強化アルミニウム／エンジニアリングプラスチック筐体、LEDリング画面、視覚モジュール、器用な手、全身遠隔操作、産業組立・遠隔検査を確認した。GR-3 Seriesページには165cm・71kg・最大55・3時間などがあるが、GR-3C専用値として分離されていないため`needs-review`に留め、GR-3の数値を流用していない。速度、payload、電池容量、充電時間、compute、IP、温度、安全規格は`not-published`とした。

## 用途接続

- `research-development`: GR-2、GR-3、GR-3C。公式の研究、Embodied AI、実世界課題向けカスタマイズに接続。
- `research-prototype-dev`: GR-2、GR-1。公式の二次開発、Developer/Aurora SDK、開発者モードに接続。
- `customer-reception`: GR-3、GR-1。公共サービス空間、銀行ロビー、受付・相談を根拠付きで接続。
- `facility-wayfinding`: GR-1。銀行・展示会での顧客導線・案内を接続。
- `facility-security-patrol`: GR-1。公式資料のSecurity Inspectionを接続。
- `healthcare-rehabilitation`: GR-3、GR-1。公式のrehabilitation / medical and rehab表現を接続。
- `research-hri-study`: GR-3。公式のemotional interaction・academic researchを接続。
- `factory-assembly-support`: GR-3C。公式専用ページのindustrial assemblyを接続。
- `factory-visual-inspection`: GR-3C。公式専用ページのremote inspectionを接続。
- `USE_CASE_GAP fourier-gr1 "Performances and Exhibitions" https://www.fftai.com/uploads/upload/files/20250515/3f8dfafee28ab3d5c6688016d8e36eaf.pdf`
- `USE_CASE_GAP fourier-gr3 "personal spaces / social companion at home" https://fftai.com/products-gr3series`
- `USE_CASE_GAP fourier-gr3c "high-risk operations" https://www.fftai.com/products-gr3c`

## 事例の扱い

GR-1のみ、公式ページが相手先・場所・実施業務を明記する3件（中国建設銀行の銀行ロビー、永达智造智己北外灘4S店、第7回中国国際輸入博覧会）を収録した。GR-2/GR-3/GR-3Cの製品発表、製品紹介、研究機関ロゴ、一般的な用途説明は導入事例と混同せず、`usageExamples`に入れていない。各RobotのusageExampleSourceUrlsは同じ事例URLを参照する。

## 価格・調達・日本情報

4機体とも、Fourier公式公開価格および確認できる国内正規代理店公開価格は見つからなかったため、`priceOffers`は空配列、`priceResearchStatus`は`not-published`とした。公式ページのContact Sales/Contact Nowや評価・パイロット相談は、購入可能・商用在庫ありとは断定していない。Fourierの公式Developer Centerと販売窓口は確認したが、日本の機体別正規代理店・日本語サポートは確認できなかった。

## 保留事項

- GR-1: Deploid側でGR-1 genericをGR-1/Pro/Liteのどのvariantとして公開するか確定し、速度・runtime・電池・payload・computeを該当variantの公式資料から再確認する。
- GR-3C: 専用データシートでシリーズ共通値とC固有値を分離して再確認する。
- GR-2/GR-3: 公開データシートまたは契約資料でIP、温度、安全規格、価格、国内調達条件を確認する。

値を推測して補完せず、上記はJSONの`humanReviewRequired`にも記録した。
