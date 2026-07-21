# DATA-R01-B14 — Wandercraft / Mentee / RobotEra / Galbot / Aeolus

- 調査日: 2026-07-16
- 対象: `wandercraft-calvin`, `mentee-menteebotv3`, `robotera-l7`, `robotera-q5`, `robotera-m7`, `galbot-g1`, `aeolus-aeo`
- 対象数: 7機（重複なし）
- JSON: [DATA-R01-B14-other.json](./DATA-R01-B14-other.json)
- schema確認: `mobility`, `heightCm`, `weightKg`, `speedMps`, `dof`, `payloadKg`, `runtimeMin`, `batteryCapacityWh`, `chargeTimeMin`, `batterySystem`, `controlMethod`, `sdk`, `computePlatform`, `ipRating`, `operatingTemperature`, `safetyStandard`

## 調査結論

- Calvin-40は現行Wandercraft公式ページで、産業・物流向けの自律ヒューマノイド、実生産配備、8〜22時間/日の連続運用設計を確認した。ただし、8〜22時間/日は電池1充電のruntimeとは断定せず `needs-review` とした。コードや報道にある40kgは現行公式ページの直接値ではないため荷重には登録していない。
- MenteeBot V3は公式製品ページから175cm、70kg、1.5m/s、40DoF、25kg carry、voiceを取得した。Mobileye公式発表のhot-swappable battery、非テレオペ自律、2026年POC／2028年量産目標も確認したが、24/7は電池ランタイムではない。
- RobotEra L7は公式中国語ページから55自由度、171cm、双腕20kgを取得した。英語ページのHeight欄が`171 KG`と表示する単位誤りを確認したため身長は `needs-review` とし、中国語の`171 CM`を候補値として保持した。
- RobotEra Q5/M7は公式製品名、製品導線、購入問い合わせを確認したが、現行公式ページ本文から製品固有の数値仕様・用途値を取得できなかった。L7、STAR1、リポジトリ既存値を流用していない。
- Galbot G1は現行公式製品ページと公式開発者マニュアルを突合した。173cm、92.5kg、最大1.5m/s、8時間、48V×30Ah、3.5時間充電、IP54、AGX Orin 64GB/275TOPS、片腕5kg・合計10kgを取得した。DoFは製品ページの24（車輪を含む）とマニュアルの21（底盤・末端除外）が異なるため `conflict` とした。
- Aeolusは現行`aeo`の用途・RaaS・支援情報と、丸文の公式パートナー発表・日本導入リリースを確認した。旧称`Aeolus Robot`の2020/2022年導入機と現行`aeo`のvariant対応は公式に明記されていないため、現行数値への流用はしていない。

## ロボット別カード項目

| robotId | 想定用途 | 身長 | 重量 | 価格 | 稼働時間 |
|---|---|---:|---:|---|---|
| `wandercraft-calvin` | 産業組立、物流重量物搬送、小部品ピッキング | not-published | not-published | not-published | needs-review（8〜22時間/日。電池runtimeではない） |
| `mentee-menteebotv3` | 倉庫箱搬送、工場・産業環境 | 175cm | 70kg | not-published | needs-review（hot-swapによる24/7 availability） |
| `robotera-l7` | 研究データ収集、製造、企業受付、商業施設・病院案内 | needs-review（中国語171cm／英語171KG表記） | not-published | not-published | not-published |
| `robotera-q5` | 製品固有の公式用途は未取得 | not-published | not-published | not-published | not-published |
| `robotera-m7` | 製品固有の公式用途は未取得 | not-published | not-published | not-published | not-published |
| `galbot-g1` | 製造組立・荷役、倉庫pick/place、薬局物料搬送、小売顧客対応 | 173cm | 92.5kg | not-published | found（8h、実験室・平均速度60%条件） |
| `aeolus-aeo` | UV除菌、介護・病院巡視、施設警備、ホテル・レストラン配送 | not-published | not-published | not-published | not-published |

## 主要スペックと荷重

### `wandercraft-calvin`

公式製品ページはCalvinを「heavy-duty carrier robot」と位置付け、重量物、箱・木箱、小部品を扱う自律機として説明している。現行ページには組立ライン生産タスクへの実生産配備、12の産業・物流ユースケース、3件の配備済みユースケース、8〜22時間/日の連続運用設計、安全ソリューションの記載がある。

身長、機体重量、速度、DoF、電池容量、充電時間、IP、温度、SDK、計算基盤、数値荷重は公式ページで未公開。報道由来の40kgは現行公式ページの値でないため採用していない。`runtimeMin` は日次の連続運用時間と電池runtimeの意味が曖昧なので `needs-review`。

### `mentee-menteebotv3`

Mentee公式製品ページの直接値は、175cm、70kg、1.5m/s、40DoF、`Can carry up to 25kg`、voice。25kgは腕・全身scopeが示されないため `manufacturer-wording / maximum` として荷重欄だけに保持した。Mobileye公式発表では、hot-swappable battery、非テレオペの自律タスク実行、工場・倉庫・産業環境、2026年の顧客POC、2028年の量産・商用化目標を確認した。

### `robotera-l7`

公式中国語ページの値は55自由度、171cm、双腕20kg。双腕20kgはrated/maximumの表現がないため `dual-arm / unspecified`。英語ページの`171 KG`は単位誤りと見られるが、公式ページ間の差分として残した。速度、重量、runtime、電池、充電、SDK、IP、温度、安全規格は未公開。

公式用途は、研究・データ収集・モデル訓練、製造、企業受付、商業施設案内、教育、病院案内。既存UseCaseには研究開発、工場組立支援、顧客受付、館内ガイドを根拠付き接続し、教育・教室を `USE_CASE_GAP` として記録した。製品発表・ニュース一覧は実導入事例と混同していないため、usageExamplesは空配列。

### `robotera-q5` / `robotera-m7`

現行RobotEraの製品一覧、Q5/M7製品導線、購入問い合わせを確認した。製品名の存在と問い合わせ窓口は確認できるが、対象製品固有の身長、重量、速度、DoF、荷重、電池、SDK、IP、温度、安全規格、用途、導入事例は公開テキストから取得できなかった。L7の171cm/55DoF/20kgやSTAR1の仕様をQ5/M7へ流用していない。

### `galbot-g1`

公式G1ページ・マニュアルから以下を取得した。

- 移動: 360°全方向車輪ベース、4輪全方向移動、最大1.5m/s
- 寸法・重量: 標準姿勢1730mm、92.5kg
- 荷重: 片腕5kg、合計10kg。rated/maximumの表示がないため `unspecified`。
- 稼働・電池: 8時間、48V×30Ah。`48×30=1440Wh` は換算値で、rawの48V/30Ahを保持。
- 充電: アダプター3.5時間（210分）、54.6V×10A
- 算力: NVIDIA AGX Orin 64GB、275TOPS
- 保護・環境: IP54、0〜40℃、湿度0〜90%RH（結露なし）
- SDK: 公式GalbotSDK、G1 Python/APIドキュメント

DoFは、製品ページが車輪4個を含む総計24、開発者マニュアルが底盤・末端除外で21（頸2、腕14、腰3、脚2）と異なる。両方をscope付きで保持し、単一値へ統合していない。

### `aeolus-aeo`

現行公式ページで、aeo disinfect、aeo care、aeo delivery、aeo security、2本のアーム、エレベーター・ドア操作、自律ナビゲーション、モバイルアプリ、ライブ監視を確認した。数値仕様（身長、重量、速度、DoF、荷重、runtime、電池、充電、IP、温度、SDK、算力、安全規格）は現行ページで未公開。

丸文の2019年公式発表でAeolusとの戦略的パートナーシップ、RaaS、導入・運用・保守、国内取扱いを確認した。2020年の介護施設導入ではUV除菌と夜間巡視、2022年のグローブシップ本社導入では局所/広範囲除菌と夜間巡回を確認した。ただし、リリース名は現行`aeo`ではなく一般名`Aeolus Robot`である。

## UseCase接続とgap

既存のpublished UseCaseへ根拠付きで接続したものはJSONの`officialUseCases`に記録した。

- Calvin-40: `factory-assembly-support`, `factory-assembly-kit-transport`, `warehouse-picking`
- MenteeBot V3: `warehouse-picking`, `factory-assembly-support`
- RobotEra L7: `research-development`, `factory-assembly-support`, `customer-reception`, `facility-wayfinding`
- Galbot G1: `factory-assembly-support`, `warehouse-picking`, `healthcare-specimen-transport`, `customer-reception`
- Aeolus aeo: `healthcare-disinfection`, `healthcare-care-patrol`, `facility-security-patrol`, `retail-room-service`

今回の `USE_CASE_GAP` は以下。

```text
USE_CASE_GAP robotera-l7 "Education - classroom" https://www.robotera.com/application.html
USE_CASE_GAP galbot-g1 "Home: cleaning, organizing, fetching and package handling" https://www.galbot.com/
USE_CASE_GAP aeolus-aeo "hospital specimen/medical-item delivery" https://www.aeolusbot.com/meet-aeo
```

Q5/M7は製品固有の公式用途表現を取得できなかったため、推測でUseCaseを付けていない。

## 活用事例

| robotId | 事例 | 区分 |
|---|---|---|
| `wandercraft-calvin` | 現行製品ページが実生産配備・組立ライン配備を説明。顧客拠点・作業名は非公開。 | deployment |
| `wandercraft-calvin` | RenaultとのCalvinファミリー開発・量産提携。完成導入とは区別。 | pilot |
| `mentee-menteebotv3` | 2台のV3が32箱を8つの山からラックへ移動する18分の自律倉庫タスク。 | demonstration |
| `aeolus-aeo` | 学研グループ介護施設6施設でUV除菌・夜間巡視を順次導入。旧称Aeolus Robot。 | deployment |
| `aeolus-aeo` | グローブシップ本社ビルへRaaS導入、UV除菌・夜間巡回。旧称Aeolus Robot。 | deployment |

RobotEra Q5/M7、Galbot G1は、確認した公式ページに実導入・実証を特定できる事例がなかったため、製品用途・ソリューション説明を活用事例に数えていない。

## 価格・調達・日本情報

- 7機とも、メーカー公式公開価格・国内正規代理店公開価格のいずれも確認できず、`priceOffers`は空配列、`priceResearchStatus`は`not-published`。
- Calvin-40は実生産配備・数百台発注の公式記載があるが、一般販売条件・価格は非公開。
- MenteeBotは顧客POCが2026年、量産・商用化目標が2028年。現時点の一般調達条件は非公開。
- RobotEra L7/Q5/M7は公式購入問い合わせを確認したが、問い合わせフォームを購入可能・在庫ありとは断定していない。
- Galbot G1は公式製品、SDK、ソリューション納入、保証文書を確認したが、価格・日本販売は非公開。G1マニュアルには販売日起算12か月保証の記載がある。
- AeolusはRaaS・月額/サブスクリプション・保守運用を公式に確認。丸文はAeolusの戦略パートナーかつ国内取扱窓口として登録した。日本導入は確認できるが、旧称導入機と現行aeoのvariant対応は要レビュー。

## 主要出典

- [Wandercraft Calvin-40](https://en.wandercraft.eu/calvin-40)
- [Wandercraft / Renault: Introducing Calvin-40](https://www.wandercraft.eu/articles/renault-group-finalises-a-strategic-partnership-with-wandercraft)
- [MenteeBot公式仕様](https://www.menteebot.com/bot/)
- [MenteeBot公式倉庫タスク](https://www.menteebot.com/blog/menteebot-warehouse-task/)
- [Mobileye公式Mentee買収発表](https://ir.mobileye.com/news-releases/news-release-details/mobileye-acquire-mentee-robotics-accelerate-physical-ai)
- [RobotEra L7公式中国語ページ](https://www.robotera.com/application.html)
- [RobotEra購入問い合わせ](https://www.robotera.com/en/Contact-to-Buy.html)
- [Galbot G1公式製品ページ](https://www.galbot.com/g1/)
- [Galbot G1公式マニュアル](https://developer.galbot.com/docs/g1/2.2.4/zh/g1)
- [Galbot公式SDK/Python例](https://developer.galbot.com/docs/SDK/1.7.0/g1/zh/examples_python)
- [Aeolus aeo公式ページ](https://www.aeolusbot.com/meet-aeo)
- [Aeolus公式サポート・RaaS](https://www.aeolusbot.com/why-aeolus)
- [丸文・Aeolus戦略パートナーシップ](https://www.marubun.co.jp/wp-content/uploads/a7ijkd000000a3p3/20190213aeolus.pdf)
- [丸文・介護施設導入](https://www.marubun.co.jp/wp-content/uploads/a7ijkd000000qbf7/20201222aeolus.pdf)
- [丸文・グローブシップ本社導入](https://www.marubun.co.jp/wp-content/uploads/2022/03/20220323aeolus.pdf)

各フィールドのstatus、rawValue、normalizedValue、variant、condition、直接URL、evidenceSummary、fieldEvidenceは、同梱JSONを正本として参照する。
