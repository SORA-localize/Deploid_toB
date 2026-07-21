# DATA-R01-B05 EngineAI 調査報告

- checkedAt: `2026-07-16`
- 対象: 4機体
- 対象Robot ID: `engineai-se01`, `engineai-pm01`, `engineai-t800`, `engineai-sa01`
- JSON: [DATA-R01-B05-engineai.json](./DATA-R01-B05-engineai.json)
- 調査範囲: EngineAI公式中国語・英語製品ページ、公式購入ページ、公式FAQ、公式ニュース。画像候補のダウンロードは行っていない。

## 重要な調査結果

### SE01

公式トップと製品ページから、170cm、通常歩速2m/s、全身32 DoF、稼働2時間、快拆式高容量電池、LiDAR・深度カメラ・赤外線カメラ、5指灵巧手を確認した。公式FAQは重量を約55kgと記載する。製品ページには`1000 mAh`と`80% Charge`が並ぶが、容量の意味・表示単位が不自然であるためWhへ換算していない。価格、充電時間、payload、SDK、計算基盤、IP、温度、安全規格は公開値を確認できなかった。公式FAQの「産業・家庭向け」は既存UseCaseへ無理に割り当てず`USE_CASE_GAP`にした。

### PM01

PM01は商業版（23 DoF・約42kg・二次開発非対応）と教育版（24 DoF・約43kg・Jetson Orin NX 16G・二次開発対応）に分かれる。両版の140cm、>2m/s、約2時間、10000mAh快拆電池、54.6V/約2時間充電、手持ちリモコンを確認した。速度は下限値であり、最大速度へ変換していない。現行公式購入ページは`¥188000`だが版・税区分を明示しない。公式FAQの商用版`¥88000`は2025年3月31日までの過去キャンペーンなので、現行価格へ流用せず`sourceCandidates`に履歴として残した。

### T800

T800公式製品ページから、173cm、版による75–85kg、≥3m/s、25/29/43/46 DoFの版別・ページ別表記、4〜5時間、三元リチウムまたは固態電池、71.4V/20Ahまたは74.8V/40Ah、2.5/3時間充電、Intel/RK3588/Orin NX構成を確認した。物流倉庫、ホテルサービス、店舗案内、工場協働を公式シーンとして接続した。公式発売記事は`¥180000起`とBasic/Eco/Pro/Maxの4階梯を明示し、製品パラメータ表ではBasic 18万、Development 24万、Pro 28万、Max 36万を直接確認した。価格は4variantの`priceOffers`に分け、genericの仕様値はconflict/needs-reviewとした。自社工場からのT800出荷記事は顧客導入ではないためusageExamplesには数えていない。

### SA01

公式仕様表から、約40kg、約1m/s、12 DoF、0.819kWh、15Ah/54.6Vリチウム快拆電池、約2時間、-20〜55℃、荷重約10〜15kgを確認した。寸法の第三値が350mm（高さ）と表示されるが、製品の人型形状と整合しないため身長は`needs-review`に留めた。荷重はscope・rated/maximumが未定義なので`manufacturer-wording`・`unspecified`へ分離した。公式購入ページは`¥42000`、公式過去記事はSA01 EDUの`¥38500`と量産交付を記載しており、現行価格と履歴を分離した。

## 用途接続

- `research-development`: PM01、SA01。公式の研究・教育、個人開発者・研究者向け表現に接続。
- `research-prototype-dev`: PM01、SA01。公式の全開放、訓練・配置コード、ユーザー定義、全鏈路技術共有に接続。
- `logistics-shelf-picking`: T800。公式の物流倉储シーンに接続。
- `retail-room-service`: T800。公式のホテルサービスに接続。
- `factory-assembly-support`: T800。公式の工場協働に接続。
- `facility-security-patrol`: T800。公式提携記事の警務巡逻ロボット位置付けに接続。
- `USE_CASE_GAP engineai-se01 "industrial and household general-purpose operation" https://www.engineai.com.cn/about-news-media/23.html`
- `USE_CASE_GAP engineai-pm01 "education" https://www.engineai.com.cn/about-news-media/23.html`
- `USE_CASE_GAP engineai-t800 "公安交管指挥与警务导服" https://www.engineai.com.cn/about-news-media/53.html`
- `USE_CASE_GAP engineai-sa01 "education" https://www.engineai.com.cn/about-news-media/34.html`

## 事例の扱い

対象4機体について、公式ページで確認できたのは製品シーン、発売・量産・展示・提携計画が中心だった。T800自社工場の初回下線は製造能力のニュースであってT800の顧客導入ではないため、SA01の量産・交付記事も利用現場の導入事例ではないため、`usageExamples`は全機体で空配列とした。PM01のCES・イベント展示も製品デモであり導入事例に数えていない。

## 価格・調達・日本情報

- PM01: 現行公式購入ページ`¥188000`を確認したが、edition・税込/税別が不明なため`needs-review`価格。
- T800: 公式製品ページのBasic/Development/Pro/Maxをそれぞれ`¥180000/¥240000/¥280000/¥360000`として記録。税区分は公開されない。
- SA01: 現行公式購入ページ`¥42000`。2024年のSA01 EDU`¥38500`は過去価格として分離。
- SE01: 公式公開価格は確認できず、`priceOffers`は空配列。

4機体とも、日本の正規代理店・日本価格・日本語保守窓口は確認できなかった。公式購入・問い合わせページの存在だけから日本で購入可能とは断定していない。

## 保留事項

- PM01: Deploid側でcommercial/educationを分離するか決め、現行¥188000の版・税・保証・納期を確認する。
- T800: Basic/Eco/Pro/Maxの各版を別Robotとして扱うか決め、公開カードには版別値だけを出す。
- SA01: 公式寸法の身長値、荷重scope、現行価格の版・税・保証を再確認する。
- SE01: 1000mAh表示、重量以外の電池・充電・SDK・計算基盤・価格を公式資料で再確認する。

値を推測して補完せず、上記はJSONの`humanReviewRequired`にも記録した。
