# DATA-R02 B09 — US/other major manufacturers（8機種）

調査日: 2026-07-17。DATA-R01およびDATA-R02-source-plan.jsonは候補URL発見のみに使用し、値・結論はすべて本バッチで一次資料を開いて再検証した。各社ごとに独立したメーカー・機種のため、共有ファミリー間のバリアント問題はない（Kaleidoのみ世代横断の社内シリーズ）。

## サマリー表

| robotId | lifecycleStatus | publicationRecommendation | 主な変更点 |
|---|---|---|---|
| agility-digit | current | keep-published | 変更なし（現行商用機として確認強化） |
| figure-03 | limited-current | keep-published | 変更なし |
| boston-dynamics-atlas | limited-current | keep-published | 変更なし（全電動版が現行・油圧版は2024年4月に公式引退と確認） |
| tesla-optimus | limited-current | keep-published | 変更なし。tesla.com/ir.tesla.comは本セッション終始403で直接検証不可 |
| sanctuary-phoenix | limited-current | keep-published | 変更なし。ただし2026-06-17の公式戦略転換（産業用アーム向けソフトウェア重視）を新たに確認、次回要再評価 |
| kawasaki-kaleido | limited-current | keep-published | 変更なし。2025年11月発表のKaleido 9を新たに確認したが数値スペックは第三者報道のみで公式未確認 |
| neura-4ne-1 | announced | keep-published | 変更なし。公式データシート（2026-06-05付）でDOF・ペイロード・計算基盤等を新規に確認 |
| xpeng-iron | limited-current | keep-published | 変更なし |

---

## 1. agility-digit（Digit / Agility Robotics）

**lifecycleStatus: current** / **publicationRecommendation: keep-published**

agilityrobotics.comのトップページで「Digit is a commercially deployed humanoid robot」と明記。GXOとは2024年6月に業界初の複数年RaaS商用契約を締結し、2025年11月時点で単一拠点（Flowery Branch）で10万個超のトート搬送を公式発表。Schaeffler・Amazon・Mercado Libre・Toyota Motor Manufacturing Canadaも公式に顧客として掲載されている。現行の量産・商用販売中モデルとして扱った。

### スペック状況

| キー | ステータス | 値 |
|---|---|---|
| mobility | found | 二足（biped） |
| heightCm | source-inaccessible | spec-sheetが資料請求フォーム誘導のみで数値を検証できず |
| weightKg | source-inaccessible | 同上 |
| speedMps | not-published | 公式ページに数値なし |
| dof | not-published | 「4-DOFアーム」のみ確認、全身DOF値なし |
| payloadKg | not-published | loadRatingsで別途35lb(15.876kg)を記録 |
| runtimeMin | found | 240分（4時間、2025-03-31公式記事で再確認） |
| batteryCapacityWh | not-published | Wh数値なし |
| chargeTimeMin | not-published | 数値なし |
| batterySystem | found | 自律充電ドック / バッテリー |
| controlMethod | found | 自律運転 / Arcクラウドフリート管理 |
| sdk | not-published | 記載なし |
| computePlatform | not-published | 記載なし |
| ipRating | not-published | 記載なし |
| operatingTemperature | not-published | 記載なし |
| safetyStandard | found | CAT1停止 / Safety PLC / E-stop / 無線ティーチペンダント / FSoE（2025-03-31発表） |

### 主な不明点・要人手確認

- spec-sheet PDF本体（資料請求フォーム経由）は未取得。身長・重量・全身DOFの公式数値確認を推奨。
- WebSearch経由で見た「Lifting capacity 25kg（OSHA準拠）」は一次ページを直接開けず不採用。
- Schaeffler（COOコメント：2030年までに100拠点展開計画）、Amazon（Director of Engineeringの推薦コメント）は具体的な稼働規模非公開のため pilot 扱い。

### 評価ログ
- Humanoid Solutions | Agility, https://www.agilityrobotics.com/solutions, Agility Robotics, 2026-07-17
- Agility Robotics Announces New Innovations for Market-Leading Humanoid Robot Digit, https://www.agilityrobotics.com/content/agility-robotics-announces-new-innovations-for-market-leading-humanoid-robot-digit, Agility Robotics, 2026-07-17
- GXO Signs Industry-First Multi-Year Agreement, https://www.agilityrobotics.com/content/gxo-signs-industry-first-multi-year-agreement-with-agility-robotics, Agility Robotics, 2026-07-17
- Digit Moves Over 100,000 Totes in Commercial Deployment, https://www.agilityrobotics.com/content/digit-moves-over-100k-totes, Agility Robotics, 2026-07-17

---

## 2. figure-03（Figure 03 / Figure AI）

**lifecycleStatus: limited-current** / **publicationRecommendation: keep-published**

figure.ai/figureに現行製品として身長5'8"(172.72cm)・重量61kg・速度1.2m/s・稼働5時間・バッテリー2.3kWh・ペイロード20kgが明記。BMW Spartanburgでの部品シーケンシング実演（2026-06-30発表）を確認。一般販売・外部調達条件は非公開でパートナー実証中心のため limited-current とした。

### スペック状況

| キー | ステータス | 値 |
|---|---|---|
| mobility | found | 二足 |
| heightCm | found | 172.72cm（5'8"） |
| weightKg | found | 61kg |
| speedMps | found | 1.2 m/s |
| dof | not-published | 記載なし |
| payloadKg | not-published | loadRatingsで20kg(manufacturer-wording)を記録 |
| runtimeMin | found | 300分（5時間） |
| batteryCapacityWh | found | 2300Wh（2.3kWh） |
| chargeTimeMin | not-published | 数値なし（2kW充電レートのみ） |
| batterySystem | found | 胴体内蔵バッテリー / 2kWワイヤレス誘導充電・急速充電 |
| controlMethod | found | Helix VLA / 自律音声対話 |
| sdk〜safetyStandard | not-published | いずれも記載なし |

### 主な不明点

- 充電方式表記に軽微な揺れ：10月発表記事は「wireless inductive charging」、7月のバッテリー開発記事は「2kW fast charge with active cooling」。原文確認による解消を推奨（conflictsに記録）。
- 全身DOF、IP等級、動作温度、安全規格は非公開。

### 評価ログ
- Figure 03 official page, https://www.figure.ai/figure, Figure AI, 2026-07-17
- Introducing Figure 03, https://www.figure.ai/news/introducing-figure-03, Figure AI, 2025-10-09（確認2026-07-17）
- F.03 Battery Development, https://www.figure.ai/news/f-03-battery-development, Figure AI, 2025-07-17（確認2026-07-17）
- Figure 03 at BMW, https://www.figure.ai/news/f-03-at-bmw, Figure AI, 2026-06-30（確認2026-07-17）

---

## 3. boston-dynamics-atlas（Atlas / Boston Dynamics）

**lifecycleStatus: limited-current** / **publicationRecommendation: keep-published**

2025-12-23付の公式Atlas Sales Sheet（PDF直接取得・全文確認）で身長1.9m・重量90kg・DOF56・稼働4時間（高負荷時2時間）・充電1.5時間・自律バッテリー交換3分・IP67・動作温度-20〜40℃・荷重能力（Instant 50kg/Sustained 30kg/One-Handed 20kg）を確認。2026-01-05公式ブログで「All Atlas deployments are already fully committed for 2026」（Hyundai RMAC・Google DeepMind向け）と明記。旧油圧式Atlasは2024年4月に公式に引退（"An Electric New Era for Atlas"）しており、現行電動版とは別世代として明確に区別した。

### スペック状況

| キー | ステータス | 値 |
|---|---|---|
| mobility | found | 二足（全電動） |
| heightCm | found | 190cm（1.9m） |
| weightKg | found | 90kg |
| speedMps | not-published | 記載なし |
| dof | found | 56 |
| payloadKg | not-published | loadRatingsに3件（instant/sustained/one-handed）を記録 |
| runtimeMin | found | 240分（通常4時間、高負荷時2時間） |
| batteryCapacityWh | not-published | Wh数値なし |
| chargeTimeMin | found | 90分（1.5時間、自律交換は3分） |
| batterySystem | found | 自律自己交換式バッテリー、充電110V(220Vオプション) |
| controlMethod | found | 自律運転 / VR遠隔操作 / タブレット / Orbit |
| sdk / computePlatform | not-published | 記載なし |
| ipRating | found | IP67 |
| operatingTemperature | found | -20〜40℃ |
| safetyStandard | found | CEマーキング、フェンスレスガーディング・人検知（ISO番号等の個別規格名は非公開） |

### 主な不明点
- 歩行速度の公式数値は確認できず。
- 詳細な安全規格番号（ISO 10218等）は非公開。

### 評価ログ
- Atlas Humanoid Robot | Boston Dynamics, https://bostondynamics.com/products/atlas/, Boston Dynamics, 2026-07-17
- Atlas Sales Sheet (Atlas-SalesSheet-12/23/2025), https://bostondynamics.com/wp-content/uploads/2026/01/atlas-spec-sheet.pdf, Boston Dynamics, 2025-12-23（確認2026-07-17、PDF全文取得）
- Boston Dynamics Unveils New Atlas Robot to Revolutionize Industry, https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/, Boston Dynamics, 2026-01-05
- An Electric New Era for Atlas, https://bostondynamics.com/blog/electric-new-era-for-atlas/, Boston Dynamics, 2024-04-17

---

## 4. tesla-optimus（Optimus / Tesla）

**lifecycleStatus: limited-current** / **publicationRecommendation: keep-published**

tesla.com/AIおよびir.tesla.com配下のPDFはいずれも本セッション中WebFetchが403エラーとなり、一次資料を直接開いて検証できなかった（複数URL・複数回試行後も同様）。WebSearch経由の要約では、Gen 3は開発中で量産開始は2026年内目標、2026-07-17時点で外部未公開・社内学習/データ収集中心と繰り返し報じられている（マスク氏の決算説明会発言として複数メディアが引用）。既存レコードの2項目（mobility: biped, controlMethod: 自律AI制御）はrepositoryの既存ソースと整合するため維持したが、本セッションでの再検証はできていない。

### スペック状況

| キー | ステータス |
|---|---|
| mobility | found（biped、tesla.com/AI・複数の独立した公式発言で一貫） |
| controlMethod | found（自律AI制御） |
| ipRating | not-applicable |
| その他13項目（heightCm, weightKg, speedMps, dof, payloadKg, runtimeMin, batteryCapacityWh, chargeTimeMin, batterySystem, sdk, computePlatform, operatingTemperature, safetyStandard） | source-inaccessible（tesla.com/ir.tesla.comが403で直接検証不可） |

### 主な不明点・要人手確認
- tesla.com/AI、ir.tesla.com配下PDFへの直接アクセスがすべて403で失敗。別ネットワーク・別User-Agent等での再取得を推奨。
- Gen 3の噂されるスペック（身長173cm、重量57kg、手部22DOF等）はサードパーティ集計記事のみで、Tesla公式チャネルでの確認ができておらず、2026-07-17時点で正式発表前のため一切不採用。

### 評価ログ
- AI & Robotics | Tesla, https://www.tesla.com/AI, Tesla, 2026-07-17（403、WebSearch経由で内容のみ把握）
- Tesla Q2 2024 Update (SEC filing), https://ir.tesla.com/_flysystem/s3/sec/000162828024032603/tsla-20240723-gen.pdf, Tesla Inc., 2024-07-23（403、直接確認不可）
- Tesla Q4 2025 Update Deck (SEC filing), https://ir.tesla.com/_flysystem/s3/sec/000162828026003837/tsla-20260128-gen.pdf, Tesla Inc.（403、直接確認不可）

---

## 5. sanctuary-phoenix（Phoenix Gen 8 / Sanctuary AI）

**lifecycleStatus: limited-current** / **publicationRecommendation: keep-published**

sanctuary.aiの公式ニュースでGen 8を「Gen 7発表から8か月未満で投入」と明記し、二足からホイールベースへ移行したことを確認（顧客フィードバック「bi-pedal legs are too frail to support a strong torso」による設計変更）。ただし2026-06-17の公式発表「Sanctuary AI Expands Physical AI Strategy to Industrial Robotics」では、FANUC・Universal Robots等の産業用アームへのPhysical AIソフトウェア展開に重心が移っており、Phoenixヒューマノイド自体は「次世代産業用ヒューマノイドの基盤」という将来位置づけの記述にとどまる。明確な終売宣言はないためdiscontinuedとはせず、研究・データ収集中心のlimited-currentとした。

### スペック状況

| キー | ステータス | 値 |
|---|---|---|
| mobility | found | 車輪ベース（wheeled、Gen 8で二足から移行） |
| controlMethod | found | Carbon AI / 遠隔操作・人間介入 / フリート制御 |
| その他14項目 | not-published | Gen 8の数値スペックは公式ページに一切掲載なし（旧Gen 6の身長170cm/重量70.3kg/速度1.34m/s/payload24.9kg/hand DoF20はhistorical-onlyとして現行機に継承しない） |

### 主な不明点・要人手確認
- 2026-06-17の戦略転換発表により、Phoenixヒューマノイド本体の商用優先度が「既存産業用アーム上のソフトウェア展開」より低い可能性がある。次回レビュー時にlifecycleStatusの再評価を推奨。
- Gen 8固有の数値スペックが皆無なため、今後の製品発表を継続的に確認する必要がある。

### 評価ログ
- Sanctuary AI releases new generation of AI robots for high quality data capture, https://sanctuary.ai/news/sanctuary-ai-releases-new-generation-of-ai-robots-for-high-quality-data-capture/, Sanctuary AI, 2026-07-17
- Sanctuary AI Physical AI, https://sanctuary.ai/solutions/physical-ai/, Sanctuary AI, 2026-07-17
- Sanctuary AI Expands Physical AI Strategy to Industrial Robotics, https://sanctuary.ai/news/sanctuary-ai-expands-physical-ai-strategy-to-industrial-robotics-demonstrating-production-ready-ai-performance/, Sanctuary AI, 2026-06-17
- Sanctuary AI Unveils Phoenix (2023年オリジナル発表、historical), https://www.sanctuary.ai/blog/sanctuary-ai-unveils-phoenix-a-humanoid-general-purpose-robot-designed-for-work, Sanctuary AI, 2023-05-16

---

## 6. kawasaki-kaleido（Kaleido / 川崎重工業）

**lifecycleStatus: limited-current** / **publicationRecommendation: keep-published**

kawasakirobotics.comの公式ブログ（英語版・日本語版）で2015年プロトタイプ〜2023年RHP7までの世代史を確認。2025年11月の国際ロボット展（iREX2025）でKaleido 9が公式に披露されたことも確認したが、公式ブログ記事自体には数値スペックの記載がなかった。身長190cm・体重99kg・自由度30・可搬18kg等の具体的数値は複数の第三者媒体（PC Watch、マイナビ、ITmedia、BigGo等）でのみ報じられ、川崎重工自身のページ上で直接確認できなかったため未採用（needs-review）。「脚部は販売開始を見据えて部品定格を厳守する設計へ刷新」という公式記述はあり、商用化を見据えた開発が継続中と判断した。

### スペック状況

| キー | ステータス | 値 |
|---|---|---|
| mobility | found | 二足 |
| heightCm | needs-review | 世代ごとに175/178/180/190cmと変化、最新値は第三者報道のみ |
| weightKg | needs-review | 世代ごとに85/85/80/99kgと変化、最新値は第三者報道のみ |
| speedMps | found | RHP7（2023）で約4km/h（1.11m/s）、historical-only扱い |
| dof | needs-review | Kaleido9で「30軸」と第三者報道のみ |
| payloadKg | needs-review | Kaleido9で「前モデル比35%増、最大18kg」と第三者報道のみ |
| batterySystem | found | 2019年モデルでオンボードバッテリーによる完全自立稼働を達成 |
| controlMethod | found | HMD遠隔操縦 / LiDAR SLAMによる自律歩行（Kaleido9） |
| その他8項目 | not-published | 記載なし |

### 主な不明点・要人手確認
- Kaleido9の数値スペック（190cm/99kg/30軸/18kg）は第三者メディアのみで、川崎重工公式ページでの直接確認ができなかった。iREX2025の配布資料原本入手を推奨。
- Kaleido 8→9の世代切替時期の公式な明記なし（複数記事で「8代目」「9代目」の記述が混在）。

### 評価ログ
- Kaleido development history, https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/, Kawasaki Heavy Industries, 2026-01-15（確認2026-07-17）
- Kaleido9が目指すヒューマノイドの現在地, https://kawasakirobotics.com/jp/blog/20260316_kaleido9/, 川崎重工業, 2026-03-16（確認2026-07-17）
- RHP7 research platform, https://kawasakirobotics.com/in/blog/story_22/, Kawasaki Robotics, 2023-03-09（確認2026-07-17）
- 「人とロボットが共生する社会」ヒューマノイドロボット, https://kawasakirobotics.com/jp/blog/20241106_kaleido/, 川崎重工業, 2024-11-06（確認2026-07-17）

---

## 7. neura-4ne-1（4NE1 Gen 3 / NEURA Robotics）

**lifecycleStatus: announced** / **publicationRecommendation: keep-published**

NEURA公式が2026-06-05付で発行した「4NE1 Gen 3」データシートPDF（neurarobotics.px.media配下、Adobe Illustratorメタデータでファイル名「4NE1-gen-3-cmyk」と確認）を全文取得し、身長180cm・重量80kg・速度5km/h・全身55自由度（手部12自由度）・腕部ペイロード20kg（脚支持構成で最大100kg）・24時間稼働・制御方式（自律/AI音声/遠隔）・計算基盤（Qualcomm）・安全機能（人検知、オプション）を新規に確認した。neura-robotics.comのHTML製品ページ・予約ページは本セッション中すべて403で直接アクセス不可。まだ量産出荷前の予約段階（marketAvailability=reservation）のためannouncedとした。

### スペック状況

| キー | ステータス | 値 |
|---|---|---|
| mobility | found | 二足（フルサイズ4NE1 Gen 3） |
| heightCm | found | 180cm |
| weightKg | found | 80kg |
| speedMps | found | 5km/h（1.3889 m/s） |
| dof | found | 55（全身）、手部12 |
| payloadKg | found | 腕部20kg（用途依存）、脚支持構成で最大100kg |
| runtimeMin | found | 24/7連続稼働（単一バッテリーの稼働時間は非公表） |
| batteryCapacityWh | not-published | 記載なし |
| chargeTimeMin | not-published | 記載なし |
| batterySystem | found | 二重バッテリー構成 / 連続運用対応 |
| controlMethod | found | 自律モード / AI音声操作 / 遠隔操作 / 経路計画・障害物回避 / 360°認識 |
| sdk | not-published | 記載なし |
| computePlatform | found | Qualcomm（NEURA Roboticsとの共同表記、詳細型番不明） |
| ipRating / operatingTemperature | not-published | 記載なし |
| safetyStandard | found | 人検知センサー（オプション・追加費用） |

### 主な不明点・要人手確認
- neura-robotics.comの全HTMLページが403で直接アクセス不可（PDFホストのneurarobotics.px.mediaのみアクセス可能）。
- 「4NE1 Gen 3.5」という呼称・価格情報（個別€98,000等）が複数のサードパーティ記事で言及されているが、公式ページを直接開いて一次確認ができなかったためpriceOffersには未反映。別ネットワーク・UAでの再確認を推奨。

### 評価ログ
- NEURA Robotics 4NE1 Gen 3 Datasheet (V7/05.06.2026), https://neurarobotics.px.media/plk/cE/NEURA_Robotics_4NE1_Datasheet_Web.pdf, NEURA Robotics GmbH, 2026-06-05（確認2026-07-17、PDF全文取得）
- Humanoid Robot 4NE1 for Work and Life, https://neura-robotics.com/products/4ne1/, NEURA Robotics（403、既存repositoryソースのみ参照）

---

## 8. xpeng-iron（Next-Gen IRON / XPENG Robotics）

**lifecycleStatus: limited-current** / **publicationRecommendation: keep-published**

xpeng.com公式プレスルーム記事（2025-11-05付）で全身82自由度・手部22自由度・全固体電池・Turing AIチップ・SDK公開方針を確認。2026年末までの量産化目標、Baosteelとの産業実証パートナーシップ、案内・買い物ガイド・交通誘導等の商業シナリオへの優先展開方針が公式に明記されている。外部販売は未開始でエコシステムパートナーとの実証段階のためlimited-currentとした。

### スペック状況

| キー | ステータス | 値 |
|---|---|---|
| mobility | found | 二足（キャットウォーク歩行等） |
| dof | found | 全身82、手部22 |
| batterySystem | found | 全固体電池（業界初のヒューマノイド実装） |
| controlMethod | found | VLT・VLA・VLMを統合したPhysical AI |
| sdk | found | グローバル開発者向けSDK公開予定 |
| computePlatform | conflict | Turing AIチップ×3、実効算力3000 TOPS（2025-11-05発表）対 2250 TOPS（2026年1月の別プレスルーム記事）で不一致 |
| heightCm, weightKg, speedMps, payloadKg, runtimeMin, batteryCapacityWh, chargeTimeMin, ipRating, operatingTemperature, safetyStandard | not-published | いずれも公式記載なし |

### 主な不明点
- Turing AIチップのTOPS値（3000 vs 2250）の不一致は解消できておらず、どちらがIRON固有の実効値か公式に明確化されていない。
- 身長・重量等の基本寸法は公式未公表（第三者サイトの178cm/70kgは不採用）。

### 評価ログ
- XPENG Shares Achievements in Physical AI Emergence: Unveils XPENG VLA 2.0, Robotaxi, Next-Gen IRON, and Flying Car, https://www.xpeng.com/pressroom/news/019a56f54fe99a2a0a8d8a0282e402b7, XPENG, 2025-11-05（確認2026-07-17）
