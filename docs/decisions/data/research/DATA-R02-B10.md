# DATA-R02 B10 — 残りメーカー7機種 再検証レポート

調査日: 2026-07-17 / 対象: wandercraft-calvin, mentee-menteebotv3, robotera-l7, robotera-q5, robotera-m7, galbot-g1, aeolus-aeo

DATA-R01の結論・数値は一切証拠として採用せず、本セッションで独自に一次情報（公式サイト・公式プレスリリース・公式マニュアル・NVIDIA公式カスタマーストーリー・RobotEra自身が出品者であるRBTX公式ストア等）を開いて再検証した。詳細な出典・evidenceオブジェクトは `DATA-R02-B10.json` を参照。

---

## 1. wandercraft-calvin（Calvin-40 / Wandercraft）

- **lifecycleStatus: current** / **publicationRecommendation: keep-published**
- 理由: 公式ホームページの「Current Products」の筆頭に掲載され、Renault Group（2025-06-06発表）とSAPA（2025-11-12発表）という2件の公式パートナーシップ発表がある。後継機・提供終了の兆候なし。

### スペックステータス

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | biped（自律ナビゲーション） |
| heightCm | not-published | — |
| weightKg | not-published | — |
| speedMps | not-published | — |
| dof | not-published | — |
| payloadKg | not-published | — |
| runtimeMin | needs-review | 8〜22時間/日（1充電あたりの数値ではない） |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | not-published | — |
| batterySystem | not-published | — |
| controlMethod | found | 自律ナビゲーション / 全身制御（荷重自動適応） |
| sdk | not-published | — |
| computePlatform | not-published | — |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | found | 認証志向の独自安全システム（規格番号は非公表） |

### 主な所見・未解決事項
- 「Calvin-40」の「40」は複数の第三者報道（The Robot Report等）が開発期間40日と説明するが、公式ページ自体は由来を明記していない。「40kg payload」という一部第三者の解釈は公式に未確認のため不採用（payloadKgはnot-published）。
- computePlatform: WebSearchの合成回答はNVIDIA Isaac GR00T N1/Jetsonの使用を示唆したが、Calvin-40の公式製品ページ・ニュース記事本文を直接確認した結果、該当する記述は見つからなかった。誤った合成情報として不採用。
- SAPAとの提携は「Deployment Partnership」として発表されたばかりで、稼働開始前の段階（pilot相当）として記録。

### 評価ログ（抜粋）
- Calvin-40 (EN) — en.wandercraft.eu/calvin-40 — Wandercraft — 2026-07-17
- Wandercraft homepage — wandercraft.eu — Wandercraft — 2026-07-17
- Renault Group finalises a strategic partnership with Wandercraft — wandercraft.eu/articles/... — Wandercraft — 2026-07-17 (公開: 2025-06-06)
- Wandercraft and SAPA Announce Deployment Partnership — wandercraft.eu/articles/... — Wandercraft — 2026-07-17 (公開: 2025-11-12)

---

## 2. mentee-menteebotv3（MenteeBot / Mentee Robotics）

- **lifecycleStatus: current** / **publicationRecommendation: keep-published**
- 理由: 公式製品ページ（menteebot.com/bot/）とNVIDIA公式カスタマーストーリーが共に現行機として言及。Mobileyeによる買収（2026-01-06発表、約$900M、Q1 2026close予定）はオーナーシップの変更であり、製品終了ではない。Menteeは独立ユニットとして運営継続、2026年PoC・2028年量産目標が公式に発表されている。

### スペックステータス

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 175cm |
| weightKg | found | 70kg |
| speedMps | found | 1.5m/s |
| dof | found | 40 |
| payloadKg | found | 25kg（manufacturer-wording, maximum） |
| runtimeMin | not-published | — |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | not-published | — |
| batterySystem | found | ホットスワップバッテリー（24時間稼働想定） |
| controlMethod | found | 音声対話 / 指示追従 |
| sdk | not-published | — |
| computePlatform | found | NVIDIA Jetson AGX Orin ×2（NVIDIA公式カスタマーストーリー由来） |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### 主な所見・未解決事項
- 稼働時間（分）の公式数値は確認できず。第三者記事は「約3〜4時間」等バラつきがあり不採用。
- Mentee自社ページは現行機を単に「MenteeBot」と表記し「V3」を明記しないが、NVIDIA公式ページは「MenteeBot V3.0」と明記。軽微な表記差として記録。
- computePlatform（Jetson AGX Orin×2）はMentee自社ページではなくNVIDIA公式カスタマーストーリー由来。信頼性は高いが出典がMentee自身でない点は明記。

### 評価ログ（抜粋）
- MenteeBot product page — menteebot.com/bot/ — Mentee Robotics — 2026-07-17
- Mentee Robotics customer story — nvidia.com/en-us/customer-stories/mentee-robotics — NVIDIA — 2026-07-17
- Mobileye to Acquire Mentee Robotics — ir.mobileye.com — Mobileye — 2026-07-17
- Two MenteeBots Working Together in an Autonomous Warehouse Task — menteebot.com/blog/... — Mentee Robotics — 2026-07-17

---

## 3. robotera-l7（L7 / RobotEra）

- **lifecycleStatus: current** / **publicationRecommendation: keep-published**
- 理由: 2025-07-28/29の公式ローンチプレスリリース（Newsfile Corp配信、ROBOTERA名義）、CES2026（2026-01）での継続展示、RobotEra自身が出品者であるRBTX公式ストアで確認。

### スペックステータス

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 171cm |
| weightKg | **conflict** | 65kg（2025-07プレスリリース） vs 70kg（2026-01 CES報道・RBTX本文にも両方混在） |
| speedMps | found | 4m/s（走行） |
| dof | found | 55 |
| payloadKg | not-applicable | （loadRatingsで管理） |
| runtimeMin | found | 6時間 |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | not-published | — |
| batterySystem | found | リチウムバッテリー（BMS内蔵） |
| controlMethod | found | 全身遠隔操作 / VLAモデルERA-42 |
| sdk | not-published | — |
| computePlatform | not-published | — |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

loadRatings: dual-arm, maximum, 20kg（公式プレスリリース "up to 20 kg payload per dual 7-axis biomimetic arm"）

### 主な所見・未解決事項
- **身長の競合は再現せず**: DATA-R01が指摘した「英語ページ間の身長表記競合」は、本セッションで開いた複数の一次情報（公式プレスリリース、RBTX公式ストア、独立中国語メディア）がすべて171cmで一致し、再現できなかった。
- **重量の競合を新たに発見**: 2025年7月の公式ローンチプレスリリースは65kg、2026年1月のCES2026関連報道は70kgと異なり、RBTX公式ストアページ本文にも両方の数値が混在することを確認。ハードウェア改訂か表記揺れかは公式に確認できず、conflictとして記録。
- robotera.com自体はJavaScript描画のためWebFetch/プロキシ経由でも本文を直接取得できず、身長・重量以外の項目は主に公式プレスリリースとRBTX公式ストア（RobotEra自身が出品者）に依拠した。

### 評価ログ（抜粋）
- ROBOTERA Unveils ROBOT L7（Newsfile Corp、ROBOTERA名義） — finance.yahoo.com — 2026-07-17（公開: 2025-07-28）
- ROBOTERA L7 | Humanoid Robot | 55 DOF — rbtx.com（出品者: Robotera） — 2026-07-17
- ROBOTERA Showcases Its "Hexa-Core" Robotics Lineup at CES 2026 — autonomyglobal.co — 2026-07-17（公開: 2026-01-03）
- RobotEra application scenarios — robotera.com/application.html — 2026-07-17

---

## 4. robotera-q5（Q5 / RobotEra）

- **lifecycleStatus: current** / **publicationRecommendation: keep-published**
- 理由: RobotEra自社の製品ライン（robotera.com/en/enq5）とCES2026展示で現行製品として確認。robotera.com本体はJS描画のため直接検証できず、機種固有仕様はRobotEra自身が出品者であるRBTX公式ストアに依拠。

### スペックステータス

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | wheeled |
| heightCm | found | 165cm |
| weightKg | found | 70kg |
| speedMps | found | 1.5m/s |
| dof | found | 44 |
| payloadKg | not-applicable | （loadRatingsで管理） |
| runtimeMin | found | 4時間 |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | not-published | — |
| batterySystem | found | リチウムバッテリー（BMS内蔵、60V系統） |
| controlMethod | found | 全身遠隔操作 / 2.4G無線 / 37言語以上の音声認識 |
| sdk | not-published | — |
| computePlatform | not-published | — |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

loadRatings: single-arm, maximum, 10kg

### 主な所見・未解決事項
- 既存repoレコードは「Q5固有の仕様は非公表」としていたが、本セッションでRobotEra自身が出品者であるRBTX公式ストアページから機種固有の数値仕様（165cm/70kg/44DoF/10kg/1.5m/s/4h）を直接確認できた。**publicationRecommendationはkeep-publishedのまま変更なしだが、specsをnot-publishedからfoundへ格上げ**（次回データ反映時の検討材料として記録）。

### 評価ログ（抜粋）
- ROBOTERA Q5 official product page — robotera.com/en/enq5 — 2026-07-17
- ROBOTERA Q5 | Humanoid Robot | 44DOF — rbtx.com（出品者: Robotera） — 2026-07-17
- ROBOTERA Showcases Its "Hexa-Core" Robotics Lineup at CES 2026 — autonomyglobal.co — 2026-07-17

---

## 5. robotera-m7（M7 / RobotEra）

- **lifecycleStatus: current** / **publicationRecommendation: manual-review**
- 理由: RobotEra公式ナビゲーションに現行製品として掲載されていることは確認できたが、M7専用ページ本文（JS描画）を直接取得できず、正規代理店経由での数値確認もできなかった。数値仕様は収束する複数のリセラー掲載情報のみに依拠しており、一次資料での裏取りが不十分なためmanual-reviewとする。

### スペックステータス

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found（reported） | stationary（固定式上半身） |
| heightCm | **needs-review** | 1.19m（リセラー情報のみ） |
| weightKg | **needs-review** | 43kg（リセラー情報のみ） |
| speedMps | not-applicable | — |
| dof | **needs-review** | 43 DoF（ハンド込み）/ 19 DoF（ハンド無し）（リセラー情報のみ） |
| payloadKg | not-published | — |
| runtimeMin | not-published | — |
| batteryCapacityWh | not-applicable | — |
| chargeTimeMin | not-published | — |
| batterySystem | not-published | — |
| controlMethod | needs-review | Meta Quest対応遠隔操作（リセラー情報のみ） |
| sdk | not-published | — |
| computePlatform | not-published | — |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### 主な所見・未解決事項
- **要人手レビュー**: robotera.com/en/robotics/M7.html はJS描画のため本文が取得できず（プロキシ経由でもナビゲーション・企業情報のみ）。数値仕様はAmerican Satellite・Robots International等、RobotEraによる正規代理店認定が確認できないリセラーの掲載情報にのみ依拠している。ブラウザレンダリングでの再確認を推奨。
- Robots Internationalが$99,999.99という価格を掲示しているが、正規代理店であることが確認できないため価格として不採用（priceFallback: inquiry-fallback）。

### 評価ログ（抜粋）
- ROBOTERA M7 official product page（ナビゲーションのみ取得） — robotera.com/en/robotics/M7.html — 2026-07-17
- RobotEra M7 Upper Body Humanoid Robot — americansatellite.us（リセラー、正規性未確認） — 2026-07-17

---

## 6. galbot-g1（Galbot G1 / Galbot）

- **lifecycleStatus: current** / **publicationRecommendation: keep-published**
- 理由: 公式製品ページ（galbot.com/g1/、テキストレンダリングプロキシ経由で本文取得）と公式マニュアルミラーで現行製品として確認。

### スペックステータス

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | wheeled（360度全方位車輪） |
| heightCm | found | 173cm（1730mm） |
| weightKg | found | 92.5kg |
| speedMps | found | 1.5m/s |
| dof | **conflict** | 24（公式製品ページ：車輪4基含む駆動関節合計） vs 21（公式マニュアル：シャーシ・末端執行器を除く自由度） |
| payloadKg | not-applicable | （loadRatingsで管理） |
| runtimeMin | found | 8時間（480分） |
| batteryCapacityWh | found | 1440Wh（48V×30Ah） |
| chargeTimeMin | found | 210分（3.5時間、54.6V 10Aアダプタ） |
| batterySystem | found | 48Vバッテリー（30Ah）/ 有線充電 |
| controlMethod | found | 自律運転 / 音声 / 無線コントローラー / GalbotSDK |
| sdk | found | GalbotSDK（Python API） |
| computePlatform | found | NVIDIA AGX Orin 64GB / 275TOPS |
| ipRating | found | IP54 |
| operatingTemperature | found | 0～40℃・湿度90%以下（結露なし） |
| safetyStandard | not-published | — |

loadRatings: single-arm unspecified 5kg / dual-arm unspecified 10kg

### 主な所見・未解決事項
- **DoF競合を一次資料で直接確認**: 公式製品ページ本文（プロキシ経由取得）は「24駆動関節（脚/腰/首6 + 双腕14 + シャーシ車輪4）」、公式マニュアル（開発者ドキュメントのミラー）は「シャーシ・末端執行器を除く自由度＝首2+腕14+腰3+脚2=21」と明記。両者は矛盾ではなく定義域（車輪算入の有無）の違いであり、DATA-R01が指摘した「24 DoF including wheels」対「21 DoF excluding wheels」の対立を本セッションで独自に再確認・裏付けた。単一値へ収束させず、両raw値・出典を両論併記する。
- galbot.com本体はJS描画のためWebFetch単体では本文取得不可だったが、テキストレンダリングプロキシ経由で本文を取得し、既存repoの数値（身長・重量・速度・稼働時間・電池容量・充電時間・計算基盤・IP等級）とすべて一致することを確認した。

### 評価ログ（抜粋）
- Galbot-G1（本文取得: プロキシ経由） — galbot.com/g1/ — Galbot — 2026-07-17
- GALBOT G1 official manual（快速使用手册、ミラー経由確認） — developer.galbot.com/docs/g1/2.2.4/zh/g1 — Galbot — 2026-07-17
- 银河通用Galbot G1 人形机器人 快速使用手册（第三者ミラー、裏取り用） — robotsj.cn — 2026-07-17

---

## 7. aeolus-aeo（aeo / Aeolus Robotics）

- **lifecycleStatus: current** / **publicationRecommendation: keep-published**
- 理由: aeolusbot.comの現行サイト全体がaeoのみを扱い、現行の4ソリューションページ（disinfect/care/delivery/security）・モバイルアプリ・リース/サブスクリプションプラン・現在形の顧客証言を掲載。公式CES2023プレスリリース（PRNewswire、2023-01-04）が「当社初の単腕ロボット（2018年）」と明確に区別し、aeoを第3世代・双腕ロボットと位置付けている。

### スペックステータス

| 項目 | ステータス | 値 |
|---|---|---|
| mobility | found | wheeled（自律移動、ドア開閉・エレベーター搭乗） |
| heightCm | not-published | — |
| weightKg | not-published | — |
| speedMps | not-published | — |
| dof | found | 両腕各7自由度（全身合計は非公表） |
| payloadKg | not-applicable | （loadRatingsで管理） |
| runtimeMin | not-published | — |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | not-published | — |
| batterySystem | not-published | — |
| controlMethod | found | モバイルアプリ操作 / AIによる空間認識・自律適応 |
| sdk | not-published | — |
| computePlatform | not-published | — |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

loadRatings: single-arm, maximum, 3.6kg（8lb per single arm、公式プレスリリース）

### 主な所見・未解決事項（DATA-R01からの主要な変更点）
- **日本代理店（丸文）を現行機として確定**: DATA-R01は2019年の丸文PDFが旧世代機（Aeolus Robot）を指す可能性を理由に、現行aeoとの関連付けを保留していた。本セッションでは、**現行公式ホームページ自体**（aeolusbot.com、2026-07-17時点）に丸文 Satoshi Fujino氏（Senior Vice President）の現在形の証言「currently promoting Aeolus's highly capable, **two-armed** humanoid robot」を発見。「two-armed」という表現はaeo世代の特徴と一致し、2019年PDFの世代不確実性とは独立に、現行公式ページ自体が丸文の現行取扱いを裏付けている。distributorJapan = 丸文株式会社として記録。
- **導入実績を現行公式ページから直接採用**: 現行ホームページに掲載されたHIMEDIC（センター長・小島佳代子氏）、GLOBESHIP（社長CEO・矢口敏和氏）、Medical Care Service（社長CEO・山本紀夫氏）の現在形の証言を、commercial-deploymentとして記録した。DATA-R01はこれらを「現行機との世代対応が確認できない」として採用していなかったが、これらは現行ホームページ自身の現在形の記述であり、古い個別導入事例の世代不確実性の問題ではないため採用する。
- 数値仕様（身長・重量・稼働時間・電池容量等）は公式ページ・公式プレスリリースいずれにも記載がなく、not-publishedのまま。

### 評価ログ（抜粋）
- Aeolus homepage（顧客証言掲載） — aeolusbot.com — Aeolus Robotics — 2026-07-17
- Meet aeo — aeolusbot.com/meet-aeo — Aeolus Robotics — 2026-07-17
- Why Aeolus — aeolusbot.com/why-aeolus — Aeolus Robotics — 2026-07-17
- Aeolus Debuts Autonomous Dual-arm Humanoid Robot at CES — prnewswire.com — Aeolus Robotics / PR Newswire — 2026-07-17（公開: 2023-01-04）
- 丸文とAeolus Roboticsの戦略的パートナーシップ（旧世代機の可能性、参考のみ） — marubun.co.jp — 丸文 — 2026-07-17（公開: 2019-02-13）

---

## 横断的な備考

- 7機種すべて**priceFallback: inquiry-fallback**（メーカー公式・正規代理店いずれの公開価格も確認できず）。RobotEra M7についてリセラーが$99,999.99を掲示しているが正規性未確認のため不採用。
- robotera.com、galbot.com はいずれもJavaScript描画のSPAで、標準的なWebFetchでは本文（ナビゲーション以外）を取得できないケースが多かった。galbot.com はテキストレンダリングプロキシ経由で本文取得に成功したが、robotera.com の一部ページ（M7専用ページ等）は最終的に本文を取得できず、該当箇所はneeds-review/manual-reviewとして明記した。
- DoF/重量など「単一値に収束させるべきでない」項目（Galbot G1のDoF、RobotEra L7の重量）は、両方のraw値と出典を併記し、conflictとして記録した。
