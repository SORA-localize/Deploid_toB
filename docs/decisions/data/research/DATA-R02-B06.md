# DATA-R02-B06 Apptronik + 1X Technologies 再調査報告

- checkedAt: `2026-07-17`
- 対象: 4機体（`apptronik-apollo`, `apptronik-apollo-2`, `onex-neo`, `onex-eve`）
- JSON: [DATA-R02-B06.json](./DATA-R02-B06.json)
- 方針: DATA-R01（`docs/data/DATA-R01-B06-apptronik.*`, `docs/data/DATA-R01-B07-onex.*`）はURL発見の参考のみに使用し、すべての値を2026-07-17時点の一次情報（公式サイト・公式プレスリリース）から再取得・再検証した。DATA-R01の「旧世代の導入事例と現行製品の同一性が不明」という理由での保留判断は見直し、現行公式ページに直接書かれている情報は積極的に採用する方針で臨んだ。

---

## 1. apptronik-apollo（初代 Apollo）

**lifecycleStatus: `superseded`　publicationRecommendation: `archive`**

### 判定理由
- `https://apptronik.com/apollo` は **HTTP 404**（`curl -I` で確認）。現行サイトのフッターナビゲーションの「Apollo」カテゴリ配下のリンクは **「Apollo 2」(`/apollo/apollo-2`) の1本のみ**で、初代Apolloへの現行導線は存在しない。
- 初代Apolloの情報は2023年8月の発表記事、2024年のMercedes-Benz商用契約発表、GXO PoC発表という**過去のニュース記事としてのみ**現存する。
- 2026年6月30日の公式発表「Welcome to Robot Park」はApollo 2のみを現行の稼働プラットフォームとして記載し、初代Apolloへの言及はない。
- 明示的な「discontinued」宣言はないため discontinued とはせず、同一ブランド内の明確な後継（Apollo 2）が存在することを根拠に **superseded** と判定。archiveは「削除」ではなく履歴保存のため推奨。

### スペック状況

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | needs-review | 二足/車輪/据置の選択式構成（hybridかvariant選択か公式に未整理） |
| heightCm | found | 172.72cm (5'8") |
| weightKg | found | 72.57kg (160lb) |
| speedMps | not-published | - |
| dof | not-published | - |
| payloadKg | not-published | - (loadRatings参照) |
| runtimeMin | found | 240分（交換式電池1本あたり） |
| batteryCapacityWh | not-published | - |
| chargeTimeMin | not-published | - |
| batterySystem | found | 交換式バッテリー |
| controlMethod | found | 力制御アーキテクチャによる協働安全設計 |
| sdk / computePlatform / ipRating / operatingTemperature / safetyStandard | not-published | - |

### 使用事例
- Mercedes-Benz：**commercial-deployment**（公式「first publicly announced commercial deployment of Apollo」）
- GXO：**pilot**（公式「early-stage proof-of-concept program」）

### 保留・要確認
- Mercedes-Benz/GXO拠点がApollo 2後も初代ハードウェアのままかは不明。
- Apptronikへ現行提供状況の直接確認が必要（humanReviewRequired）。

### 証跡ログ
- Apollo 2 (現行, HTTP 200 vs /apollo 404) — Apptronik — checked 2026-07-17
- Apptronik Unveils Apollo — Apptronik — 2023-08-23 — checked 2026-07-17
- Apptronik and Mercedes-Benz Enter Commercial Agreement — Apptronik — checked 2026-07-17
- GXO Advances Humanoid Strategy with Apptronik — Apptronik — checked 2026-07-17
- Welcome to Robot Park — Apptronik — 2026-06-30 — checked 2026-07-17

---

## 2. apptronik-apollo-2（Apollo 2）

**lifecycleStatus: `current`　publicationRecommendation: `keep-published`**

### 判定理由
- `apptronik.com/apollo/apollo-2` はHTTP 200で稼働中、フッターナビゲーションの「Apollo」カテゴリの唯一のリンク先。
- 2026-06-30公式発表はApollo 2をRobot Park（Austin、約9万平方フィート）および顧客・パートナー拠点で1年以上稼働する「workhorse」と明記。
- 詳細な数値スペック（身長・重量・DoF・payload・runtime等）は一切公表されていないが、現行公式ページ・現行プレスリリースとして実在し稼働実績もあるため keep-published。
- 第三者報道（The Robot Report等・参考情報）はApollo 2を「データ収集プラットフォームで真の商用機はApollo 3」と伝えるが、公式ページ自体にApollo 3への言及は確認できず、事実として記録するに留めた（unresolved）。

### スペック状況

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | 二足 / 車輪ベースの選択式（hybrid） |
| heightCm〜dof/payload/runtime/battery系/sdk/compute/ip/temp/safety | not-published | 数値仕様は非公開 |
| batterySystem | found | 交換式バッテリー（7x22運用）／機会充電／テザー給電 |
| controlMethod | found | テレオペ＋自律実行／Artemis／Fleet Connect |

### 現行公式Solutionsページからの用途接続（現行ラインナップ＝Apollo 2として接続）
- `factory-assembly-kit-transport`（Kitting: 自動車部品のキット組立）
- `factory-visual-inspection`（Inspection & Sorting: 外観・品質検査と仕分け）
- `factory-machine-tending`（Machine & Tool Tending: バッテリー製造等でのマシンテンディング）
- `warehouse-picking`（Goods-to-Person: 保管棚から出荷エリアへの搬送）
- `logistics-shelf-picking`（Person-to-Goods: 棚からのピッキング）
- USE_CASE_GAP: Packout（梱包・コンベア投入、既存UseCase該当なし）
- USE_CASE_GAP: Retail全般（業種ページレベルの一般訴求）

### 使用事例
- Robot Park（Austin本社）：**research**（自社データ収集・AI学習拠点）
- Mercedes-Benz / GXO / Google DeepMind研究拠点：**research**（公式発表はデータ収集目的と明記。初代Apolloの商用パイロットとは別事象として区別）

### 保留・要確認
- Apollo 2の数値仕様シート・価格・出荷時期・日本展開は非公開。
- Apollo 3への言及は第三者報道のみで公式未確認。

### 証跡ログ
- Apollo 2 — Apptronik — checked 2026-07-17
- Welcome to Robot Park — Apptronik — 2026-06-30 — checked 2026-07-17
- Solutions: Goods-to-Person / Person-to-Goods / Kitting / Inspection & Sorting / Machine & Tool Tending / Packout — Apptronik — checked 2026-07-17
- Apptronik unveils Apollo 2 (参考・第三者) — The Robot Report — checked 2026-07-17

---

## 3. onex-neo（NEO）

**lifecycleStatus: `current`　publicationRecommendation: `keep-published`**

### 判定理由
- `1x.tech/neo`・`1x.tech/order` は現行トップナビゲーションから直接アクセス可能な現行製品・購入ページ。
- 公式プレスギャラリー（`1x.tech/press`）はNEO（18枚）をNEOGamma・NEOBetaという別カテゴリと明確に区別しており、現行出荷世代が公式に特定できる。
- Hayward工場（2026-04-30公式記事）で年産最大1万台体制、EQTとの戦略提携（2025-12-11公式プレスリリース）で2026-2030年に最大1万台をEQTポートフォリオ企業へ供給予定と確認。

### スペック状況

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 167.64cm (5'6") |
| weightKg | found | 29.94kg (66lb) |
| speedMps | found | 1.4 m/s（歩行速度。最高走行6.2m/s、ハンド速度8.0m/s は別値） |
| dof | **conflict** | 現行/neoページ: 手22DoF×2（合計75DoF） vs 2026-07-09公式発表: 片手25DoF（22+手首3）「will ship on every NEO」 |
| payloadKg | not-published | loadRatings参照（arm 8.16kg / lift 69.85kg / carry 24.95kg） |
| runtimeMin | found | 240分 |
| batteryCapacityWh | found | 842Wh |
| chargeTimeMin | not-published | 公式は「稼働1時間あたり6分」の比率表記のみで総充電時間は非公開。推測換算はしていない |
| batterySystem | found | 自己充電（自律接続） |
| controlMethod | found | 自律実行（デフォルト）／音声／モバイルアプリ／VR遠隔操作／1X Expert |
| sdk | not-published | - |
| computePlatform | found | 1X NEO Cortex（NVIDIA Jetson Thor、最大2070 FP4 TFLOPS） |
| ipRating | found | 手部IP68 / 本体IP44 |
| operatingTemperature / safetyStandard | not-published | - |

### 価格
- Early Access買い切り: $20,000（3年保証・Premium Support・優先配送込み）
- Standardサブスクリプション: $499/月
- （$200デポジットは全額返金可能な予約金であり価格Offerには含めない）

### 用途接続
- 家庭内家事（洗濯・食洗・掃除・応対等）に対応する既存UseCaseが存在しないため USE_CASE_GAP として記録。
- EQT提携の対象業種（製造・倉庫・物流・施設運営・ヘルスケア）も業種レベルの言及に留まり、Apollo系のような具体タスク記述がないため USE_CASE_GAP として記録。

### 使用事例
- 米国Early Access家庭ユーザー：**pilot**
- EQTポートフォリオ企業群：**pilot**（2026年に米国でパイロット開始、個社の導入可否は未確定）

### 保留・要確認
- dof の22 vs 25 の不一致（conflict、単一値へ丸めていない）。
- 総充電時間（分）は非公開。
- 日本への配送・保守時期は「US 2026、国際展開はlater」とのみ確認でき、国名の明記なし。

### 証跡ログ
- NEO Home Robot (`/neo`) — 1X Technologies — checked 2026-07-17
- Order NEO (`/order`) — 1X Technologies — checked 2026-07-17
- NEO Home Robot | Order Today (`/discover/neo-home-robot`) — 1X Technologies — 2025-10-28 — checked 2026-07-17
- Artificial Intelligence (`/ai`) — 1X Technologies — checked 2026-07-17
- NEO's Hands | An API to the Physical World — 1X Technologies — 2026-07-09 — checked 2026-07-17
- NEO Factory | Building Your NEO — 1X Technologies — 2026-04-30 — checked 2026-07-17
- Enterprise Robots / Robot fleet (`/robot-fleet`) — 1X Technologies — checked 2026-07-17
- 1X Announces Strategic Partnership...EQT (Business Wire配信の公式プレスリリース) — 1X Technologies — 2025-12-11 — checked 2026-07-17

---

## 4. onex-eve（EVE Industrial）

**lifecycleStatus: `limited-current`　publicationRecommendation: `keep-published`**

### 判定理由（DATA-R01からの主要な変更点）
- `1x.tech/eve` は現行サイトのフッターナビゲーションに現存（HTTP 200）だが、ページ埋め込みのCMSメタデータ（Sanity `_updatedAt`）は **2025-02-26付けで以降実質更新なし**。現行NEOのような仕様表・注文ページは存在しない。
- 公式Enterprise/Robot Fleetページ（2025-10-28更新）は背景画像に「EVE Robots sorting mail」を使用し続けており、企業向け訴求から完全に消えたわけではない。
- 会社公式Aboutページは2022年の顧客工場導入・自律稼働開始を明記し、2024年の1X World Model研究記事も「EVE humanoids」でのデータ収集を明記——これらは**現行の公式ページ上に今も掲載されている事実**であり、DATA-R01のように「識別不能」として保留する理由はない。
- 一方、2025-2026年の新規発表（NEO Factory、EQT提携等）はすべてNEOのみが対象で、EVE向けの新規販売導線は見当たらない。廃止の公式宣言はないため discontinued/historical にはせず、新規販売がほぼ停止し既存顧客・研究用途に限定されている実態を **limited-current** として明記した。

### スペック状況

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | wheeled（車輪型工場ヒューマノイド） |
| controlMethod | found | 自律による産業タスク実行（2022年〜、現行Aboutページに明記） |
| heightCm〜safetyStandard（他14項目） | not-published | 公開データシートなし |

### 用途接続
- `research-development`：1X World Model研究（家庭・オフィスでのモバイルマニピュレーションデータ収集、公式記事2024-09-17）に接続。
- 「自律産業タスク実行」自体は具体タスクの粒度が公式に明記されないため USE_CASE_GAP として記録。

### 使用事例
1. 米国内複数顧客（企業名非公開）：**commercial-deployment**（公式「first commercial android」2023年展開）
2. 1X社内研究（World Model Lab）：**research**
3. Enterprise Robot Fleetページの例示画像：**demonstration**（画像alt textのみで本文説明を伴わないため補助的事例として区別）

### 保留・要確認
- EVEが現在も新規顧客向けに販売されているか、既存顧客保守のみかは公式資料からは断定不可（第三者情報ではNEOへ軸足移行と伝えられるが公式終了宣言なし）。
- 数値スペック（身長・重量・DoF・payload・runtime・電池・IP・安全規格）は非公開のまま。

### 証跡ログ
- EVE | 1X (`/eve`, CMS更新日2025-02-26) — 1X Technologies — checked 2026-07-17
- About (`/about`) — 1X Technologies — checked 2026-07-17
- Announcing rebranding: From Halodi Robotics to 1X — 1X Technologies — 2023-07-03 — checked 2026-07-17
- 1X World Model — 1X Technologies — 2024-09-17 — checked 2026-07-17
- Enterprise Robots / Robot fleet (`/robot-fleet`, 更新日2025-10-28) — 1X Technologies — checked 2026-07-17
- Press Gallery (`/press`) — 1X Technologies — checked 2026-07-17

---

## 横断的な変更点まとめ（DATA-R01との差分）

1. **apptronik-apollo**: DATA-R01では明確なlifecycle判定を保留していたが、今回 `apptronik.com/apollo` の404確認とフッターナビゲーション精査により **`superseded`／`archive`** と明確化した。
2. **onex-eve**: DATA-R01は数値仕様の欠如のみを記録していたが、今回はページのCMS更新日（2025-02-26で停止）と、NEOへの経営資源シフト（Hayward工場・EQT提携が悉くNEO限定）を一次情報から突き合わせ、**`limited-current`** という中間的ステータスを新設的に適用した。
3. **onex-neo**: DATA-R01が指摘した手部DoF競合（22 vs 25）を2026-07-09公式発表で再確認し、conflictとして両値を保持。EQT提携（2025-12-11公式プレスリリース）という新規の公式情報を追加。
4. **apptronik-apollo-2**: DATA-R01は用途接続をUSE_CASE_GAPのみとしていたが、今回は現行Apptronik Solutionsページ（Kitting/Inspection & Sorting/Machine & Tool Tending/Goods-to-Person/Person-to-Goods）を直接精査し、5件の具体的なUseCase接続を新たに確立した（現行ラインナップがApollo 2のみである点を根拠に、無版数表記「Apollo」を現行Apollo 2として扱った）。

## アクセスできなかった情報源
- `apptronik.com/company/press-releases` と `apptronik.com/sitemap.xml` はJS駆動のCMSリストで静的取得では本文一覧を得られず、代わりにnews-collection個別記事から直接裏取りした。
- Web Archive（web.archive.org）へのアクセスは本環境の制約で利用不可のため、EVEページの過去更新履歴はページ埋め込みCMSメタデータ（`_createdAt`/`_updatedAt`）で代替確認した。
