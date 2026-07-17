# DATA-R02-B04 Fourier Intelligence 再調査報告

- checkedAt: `2026-07-17`
- 対象: 4機体（`fourier-gr2`, `fourier-gr3`, `fourier-gr1`, `fourier-gr3c`）
- JSON: [DATA-R02-B04.json](./DATA-R02-B04.json)
- 本調査は DATA-R01（`DATA-R01-B04-fourier.json/.md`）を**候補URL発見にのみ使用**し、値・結論は一切引き継がず、2026-07-17時点で自分自身が開いた一次情報のみで再構成した。

## 最重要の発見：fftai.com のURL構造が全面的に変わっている

DATA-R01 および現行 `data/robots.ts` が引用する個別製品ページ・ニュース記事・導入事例ページは、**本日確認した時点で全て404**だった。

| 旧URL（現在404） | 現在の代替 |
| --- | --- |
| `fftai.com/products-gr1` | なし（`grx/about` に歴史記述のみ） |
| `fftai.com/products-gr2`, `products-gr2.html` | なし（`grx/about` に歴史記述のみ） |
| `fftai.com/products-gr3`, `products-gr3series` | `fftai.com/grx/gr3`（現行 GR-3系列ページ） |
| `fftai.com/products-gr3c` | `fftai.com/grx/gr3` 内の GR-3C セクションに統合 |
| `fftai.com/newsroom-newintech/14`, `/newsroom-humanoid/26` | 現行ニューズルーム(`fftai.com/fourier/newsroom`)は「暫無内容」で空 |
| `fftai.com/solutions/9` | 見つからず |
| GR-1 brochure PDF（旧URL） | 404。ただし現行「下載中心」に同タイトル(2024-09-23付)が残存、正しい現行リンクは未特定 |

現行の公式ナビゲーション（`fftai.com/grx`）は「関于GRx」（歴史ページ）と「GR-3系列」の2リンクしか持たない。開発者センター（`support.fftai.com/en/`）は "GR-3" のみ稼働し、"GR-2 Coming Soon" "GR-1 Coming Soon" と明記している。この一次情報に基づき、GR-1・GR-2 は現行ラインナップから外れ、GR-3系列（GR-3 / GR-3C）のみが現行製品と判断した。

---

## fourier-gr3（GR-3 "猫猫头"）

- **lifecycleStatus: `current`** / **publicationRecommendation: `keep-published`**
- 現行公式ページ `fftai.com/grx/gr3` にGR-3系列の看板モデルとして掲載。開発者向け「Robot Overview」(`support.fftai.com`, 更新2026-07-10)がGR-3専用の詳細スペック表を提供、Aurora SDK(GitHub, v1.3.0)もGR-3を現行サポート対象に明記。
- recordScope: `specific-variant`（GR-3系列内の交互サービス主導モデル）

### スペック状況

| キー | ステータス | 値 | 出典 |
| --- | --- | --- | --- |
| mobility | found | 二足歩行 | support.fftai.com Robot Overview |
| heightCm | found | 165cm | support.fftai.com / grx/gr3 |
| weightKg | found | ≈71kg | support.fftai.com / grx/gr3 |
| speedMps | **conflict** | 6.1km/h（開発者資料）vs 5.5km/h（現行マーケティングページ） | 両方Fourier公式、未解決 |
| dof | found | 55（頭2/腰3/腕7/脚6/手6+12オプション） | support.fftai.com |
| payloadKg | not-published | — | schema上のpayloadKgキーは未確認。単腕荷重はloadRatingsで記録 |
| runtimeMin | found | 180分（≈3h） | support.fftai.com |
| batteryCapacityWh | found | 936Wh（702+234） | support.fftai.com |
| chargeTimeMin | found | 90分（≈1.5h） | support.fftai.com |
| batterySystem | found | 46.8Vリチウムイオン・ホットスワップ・充電上限54.6V・サイクル寿命≥500 | support.fftai.com |
| controlMethod | found | VR/外骨格遠隔操作 + 音声対話（エコーキャンセル・音源定位） | support.fftai.com |
| sdk | found | Aurora SDK v1.3.0 | github.com/FFTAI/fourier_aurora_sdk |
| computePlatform | found | AMD Ryzen 7 8845HS / Radeon 780M, Ubuntu 22.04, 32GB RAM | support.fftai.com |
| ipRating | not-published | — | dev docs表に記載なし |
| operatingTemperature | found | 0〜45℃、湿度20〜80%結露なし | support.fftai.com |
| safetyStandard | not-published | — | — |

### 主な機能（currentFeatures）

Full-Sense（聴覚・視覚・触覚）統合インタラクションシステム、3D視覚+深度AIカメラによる顔認識と頭部追従、4マイクの全方位音源定位、頭部・胴体31箇所の触覚センサー、VR/外骨格遠隔操作、ホットスワップ電池、標準6DOF/オプション12DOF器用手。全て `support.fftai.com` または現行 `grx/gr3` ページで直接確認。

### 用途接続

- `customer-reception`: 開発者資料が「公共サービス空間での自然な交流」を明記 → 接続。
- USE_CASE_GAP: 高齢者・家族向け「情緒的コンパニオン」用途に一致する既存useCase idなし。

### 未解決・要人手確認

- 6.1km/h（開発者資料）と5.5km/h（現行マーケティングページ）の速度不一致は未解決。
- CES 2026出展・2025年8-9月の発表/予約開始時期は第三者報道のみで確認（本セッションでは一次情報を直接開いていない）。

---

## fourier-gr3c（GR-3C "宇航员"）

- **lifecycleStatus: `current`** / **publicationRecommendation: `keep-published`**
- 現行 `fftai.com/grx/gr3` ページがGR-3Cを「機能サービス主導」のもう一つの現行バリアントとして明記（"全系列包含...以功能服务为主导的GR-3C两款产品"）。旧単独ページ`products-gr3c`は404。
- recordScope: `specific-variant`

### スペック状況

| キー | ステータス | 値 | evidenceScope |
| --- | --- | --- | --- |
| mobility | found | 二足歩行 | current-family-common |
| heightCm | found | 165cm | current-family-common |
| weightKg | found | 71kg | current-family-common |
| speedMps | found | 5.5km/h（GR-3専用資料の6.1km/hは適用せず） | current-family-common |
| dof | found | 55 | current-family-common |
| payloadKg | not-published | — | — |
| runtimeMin | found | 180分 | current-family-common |
| batteryCapacityWh〜safetyStandard | not-published（6項目） | — | GR-3C専用の技術資料が現行サイトに存在しない |

**DATA-R01の慎重すぎた判断を修正した点**: 身長・体重・DoF・稼働時間・単腕荷重は、現行公式ページが両バリアント（GR-3/GR-3C）紹介の**後**にヘッダーなしで置いているスペック塊であり、シリーズ共通値として現行ページから直接確認できた。DATA-R01はGR-3のシリーズページ(旧URL)がGR-3C固有かどうか不明として全て`not-published`にしていたが、今回は現行ページを自分で開いて構造を確認し、`current-family-common`として採用した。

**一方で採用を見送った点**: 旧`products-gr3c`ページに書かれていた「全身遠隔操作・産業組立・遠隔検査・拡張可能なエンドエフェクタ・オプション12DOF器用手」は、そのページが404であるため本セッションでは再確認できず、`controlMethod`等は`not-published`のまま、`unresolved`に記録した。バッテリー容量・充電時間・計算基盤・IP等級・安全規格もGR-3C固有資料が無いため`not-published`。

### 主な機能（currentFeatures）

LiDAR+強化外装による複雑環境での高精度作業、アルミ合金+エンジニアリングプラスチックの堅牢シェル、白色の"宇航员"デザイン。全て現行`grx/gr3`ページで確認。

### 用途接続

- USE_CASE_GAP: 「複雑環境下での高精度作業」は具体的タスク名（組立/検査等）を明示しておらず、既存useCase idへの接続を見送った。

---

## fourier-gr1（GR-1）

- **lifecycleStatus: `superseded`**（successorRobot: `fourier-gr2`） / **publicationRecommendation: `archive`**
- recordScope: `historical-model`
- 現行 `grx/about` ページのみがGR-1に言及し、「傅利叶第一代通用人形机器人」（第1世代）と明記。GR-1→GR-2→GR-3系列の「三次技術迭代」という明示的な世代進化の記述があり、これは単なる情報不足ではなく積極的な公式記述であるため、`unknown`ではなく`superseded`とした。
- 開発者センターは "GR-1 Coming Soon" と表示（現行GR-1専用ドキュメントなし）。

### 今回404で再確認できなかった旧一次情報源

`products-gr1`、GR-1 Seriesブローシャー(PDF)、銀行ロビー/4S店/輸入博覧会の導入事例ページ(`solutions/9`)、旧`.cn`ミラー(`support.fftai.cn`、DNS解決不可）。

### スペック状況

身長・体重・DoF・稼働時間・電池・制御方式・計算基盤など**全ての数値仕様は`source-inaccessible`**（旧一次情報が404、代替の現行一次情報が見つからないため）。`sdk`のみ`needs-review`：現行Aurora SDK v1.3.0が"GR-1P"（Pro）をサポート対象に明記しているが、登録レコードが汎用GR-1かPro/Liteかは現行資料から特定不可。IP等級・安全規格は`not-published`（元々どこにも記載が見当たらない）。

### currentFeatures（歴史的記述のみ、evidenceScope historical-only）

自社開発FSAアクチュエータ、高度に生体模倣した胴体構造（主要自由度をカバー、安定した運動性・敏捷性）。`grx/about`より。

### 用途接続・導入事例

現行一次情報からは接続なし（旧`solutions/9`の銀行ロビー等の事例は本セッションで再確認できず、`usageExamples`は空のまま）。

### 要人手確認

- `superseded` vs `historical` の呼称選択の妥当性（Fourierは「discontinued」等の明示語を使っていない）。
- 現行「下載中心」に残るGR-1ブローシャー（2024-09-23付）の正しい現行URL特定。
- GR-1 / GR-1 Pro / GR-1 Lite のどの構成が登録レコードに該当するか。

---

## fourier-gr2（GR-2）

- **lifecycleStatus: `superseded`**（successorRobot: `fourier-gr3`） / **publicationRecommendation: `archive`**
- recordScope: `historical-model`
- `products-gr2` / `products-gr2.html` は両方404（生HTML取得でVue SPAの空シェルであることも確認済み）。開発者センターは "GR-2 Coming Soon"。
- ただし **Aurora SDK v1.3.0（現行・活発にメンテナンスされている）はGR-2を現行サポート対象として明記**（GR-1がGR-1Pとしか記載されないのと対照的に、GR-2は無印で記載）。これは現行のソフトウェア/開発者サポートが継続している一次証拠であり、`currentFeatures`に記録したが、lifecycleStatus判定はマーケティングページ・ストア不在を優先し`superseded`のまま据え置いた。

### スペック状況

GR-1と同様、数値仕様は全て`source-inaccessible`。`sdk`のみ`found`（current-product、Aurora SDK現行サポート）。

### currentFeatures

Aurora SDK v1.3.0による現行サポート継続（GitHub）。GR-1比でより器用な上肢操作・強力な動力系・オープンな開発プラットフォーム（`grx/about`、historical-only）。

### 要人手確認

- 現行「下載中心」に残るGR-2ブローシャー（2025-05-15付）の正しい現行URL特定。
- SDK継続サポートが新規販売継続を意味するか、既存導入機のレガシーサポートに過ぎないかは公式資料から判別不可。

---

## 価格・調達・日本情報（4機体共通）

メーカー公式価格、正規代理店公開価格ともに見つからず → `priceOffers: []`, `priceFallback: 'inquiry-fallback'`（全機体）。現行の問い合わせ窓口（`fftai.com/fourier/contact`）は上海・珠海・シンガポール・クアラルンプールの拠点電話/メールのみ確認、日本オフィス・日本正規代理店は確認できなかった → `japanAvailability: 'unknown'`（4機体共通）。第三者マーケットプレイスの価格情報（GR-3 $27.5K〜$120,000等）は出所不明・相互に矛盾するため一切採用していない。

## 評価ログ（サマリ）

| URL | タイトル | publisher | checkedAt |
| --- | --- | --- | --- |
| https://www.fftai.com/grx/gr3 | GR-3系列（現行製品ページ） | Fourier Intelligence | 2026-07-17 |
| https://www.fftai.com/grx/about | 关于GRx（世代史） | Fourier Intelligence | 2026-07-17 |
| https://support.fftai.com/en/getting-started/general-information | Robot Overview（GR-3, 開発者資料） | Fourier Intelligence | 2026-07-17 |
| https://support.fftai.com/en/ | Developer Center（GR-2/GR-1 Coming Soon表示） | Fourier Intelligence | 2026-07-17 |
| https://github.com/FFTAI/fourier_aurora_sdk | Aurora SDK v1.3.0 README | Fourier Intelligence | 2026-07-17 |
| https://www.fftai.com/resources/download | 下載中心 | Fourier Intelligence | 2026-07-17 |
| https://www.fftai.com/fourier/newsroom | 新聞中心（現在空） | Fourier Intelligence | 2026-07-17 |
| https://www.fftai.com/fourier/contact | 联系我们 | Fourier Intelligence | 2026-07-17 |
| https://www.fftai.com/products-gr1, /products-gr2(.html), /products-gr3, /products-gr3c, /products-gr3series, /newsroom-newintech/14, /newsroom-humanoid/26, /solutions/9 | 旧URL群 | Fourier Intelligence | 2026-07-17（全て404を確認） |

すべて2026-07-17に直接アクセスして確認（WebFetch経由のJSレンダリング代替として r.jina.ai 経由のレンダリング取得、および生HTML取得によるSPA構造の直接確認を併用）。検索エンジンのスニペットのみに基づく値の採用は行っていない。
