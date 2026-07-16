# DATA-R01-B10 — Leju Robotics

調査日: 2026-07-16

対象: leju-kuavo, leju-kuavo5（2機）

## 結論

Leju公式サイトはKUAVOを研究プラットフォーム、ビジネスサービス、産業製造、教育・訓練向けの製品群として掲載している。公式KUAVOマニュアルから、4ProはStandard／Advanced／MaxA／MaxB／Exhibition系、5は5 Advancedのvariant別仕様を直接確認した。

KUAVO 4Proは1.66m、55kg、歩行0.4m/s、走行5km/h、歩行継続1時間、60V・6Ah、充電1.5時間以下を確認したが、Standardは22 DoF、Advanced/Max系は28 DoFで、算力もOrin NX／AGX Orin／SWNUCに分かれる。KUAVO 5 Advancedは1.73m、63.5kg、29 DoF（エンドエフェクタ除外）、歩行0.4m/s、歩行継続1時間、60V・6Ahを確認した。公式LeToolsにはKuavo5の41 DoF・payload20kg表記もあるため、scopeとvariantを確定せずneeds-reviewにしている。

価格はLeju公式サイトから遷移する公式Tmallストアを確認したが、4Pro/5の公開金額は確認できなかった。国内正規代理店、日本向け出荷、国内サポート条件も公式公開情報では確認できない。

## カード項目

| Robot | 想定用途 | 身長 | 重量 | 価格 | 稼働時間 |
| --- | --- | ---: | ---: | --- | ---: |
| KUAVO 4Pro | 研究、展示会・店舗・銀行案内、産業製造 | 166cm | 55kg | 公式非公開（公式ストア・問い合わせ） | 歩行1時間 |
| KUAVO 5 | 産業製造、屋外検査、ビジネス案内、研究・教育、家庭サービス | 173cm（5 Advanced） | 63.5kg（5 Advanced） | 公式非公開（公式ストア・問い合わせ） | 歩行1時間（5 Advanced） |

## Robot詳細用の主要値

### KUAVO 4Pro

- 公式variantマニュアルはStandard、Advanced、MaxA、MaxB、Exhibition、Exhibition Computeを別掲載。Standardは22 DoF、Advanced/Max/Exhibition系は28 DoF（エンドエフェクタ除外）で、単一DoFを選択していない。
- 公式値は身長1.66m、重量55kg、歩行0.4m/s、走行5km/h、歩行継続1時間、60V・6Ah、充電1.5時間以下。
- 電池はStandardマニュアルで交換式リチウム電池、外部67.2V/5A充電器。360Whは60V×6Ahの換算値であり、公式の直接表記ではない。
- H12 remoteとVR操作、ROS-SDK、Python-WebSocket SDKを確認。計算基盤はvariant依存で、Standard/AdvancedはOrin NX、MaxA/MaxB/Exhibition ComputeはAGX Orin、ExhibitionはSWNUC。
- カメラIP65、LiDAR IP67、部品別動作温度は確認したが、機体全体のIP等級・動作温度・安全規格は確認できない。荷重数値も4Pro公式マニュアルでは確認できない。

### KUAVO 5

- 公式製品ページはKUAVO 5とKUAVO 5-Wを製品族として掲載。数値は公式KUAVO 5 Advancedマニュアルに限定し、5-Wの値を混在させていない。
- 5 Advancedは身長1.73m、重量63.5kg、歩行0.4m/s、走行5km/h、歩行継続1時間、60V・6Ah、充電1.5時間以下、GENE-MTH6＋Orin NX。
- 5 Advancedの公式マニュアルは29 DoF（エンドエフェクタ除外）。一方、Leju公式LeToolsはKuavo5を41 DoF、payload20kgと記載するが、scope・variant・rated/maximumがないため、DoFはneeds-review、荷重はmanufacturer-wording／unspecifiedとして記録した。
- 公式SDKはROS-SDK／Python-WebSocket SDK。カメラ・LiDARは部品IP値のみで、機体全体のIP等級・温度・安全規格は非公開。

## 活用事例

### KUAVO 4Pro

1. REAL-I — Kuavo 4 ProをICRA 2026の実ロボット競技・現地競技のコアプラットフォームとして使用。金属部品反転、薬品ボトルpick-and-place、宅配荷物スキャンを実機課題化。区分: demonstration。出典: [Leju公式 REAL-I](https://www.kdc.icra.lejurobot.com/)
2. Strategic cooperation with Hengtong manufacturing center, explore KUAVO scale-up application — Hengtong製造センターとの戦略協力で産業スケールアップ用途を探索。区分: pilot。出典: [Leju公式ニュースリンク](https://mp.weixin.qq.com/s/FbeeOQtYsHpJtRN82VWXYA)。WeChat本文は調査時点で取得できず、詳細工程は断定していない。
3. Together with Hefei city, promote humanoid robot industrial application ahead — 合肥市とヒューマノイドロボットの産業応用を推進する公式協力事例。区分: pilot。出典: [Leju公式ニュースリンク](https://mp.weixin.qq.com/s/CkBN249IkqKusRoVxZZAmw)。本文未取得のため、具体的な配備内容は断定していない。

### KUAVO 5

公式KUAVO 5製品ページは用途領域を掲載するが、KUAVO 5固有の導入・実証・研究を説明する名前付き事例ページは今回確認できなかった。4ProのREAL-Iや公式マニュアルのデモをKUAVO 5の活用事例へ流用していない。

## UseCase接続とGap

既存UseCaseへの接続候補はJSONに根拠付きで記録した。

- leju-kuavo → research-development: Research Scenario / ready-to-use humanoid robot research platform
- leju-kuavo → customer-reception: exhibition hall guidance, store shopping assistance, bank assistance
- leju-kuavo → factory-assembly-support: Industrial: automotive manufacturing and 3C electronics
- leju-kuavo5 → factory-assembly-support: Industrial Manufacturing
- leju-kuavo5 → facility-security-patrol: Outdoor Inspection
- leju-kuavo5 → customer-reception: Business Guidance
- leju-kuavo5 → research-development: Research/Education

USE_CASE_GAPは以下の通り。

    USE_CASE_GAP leju-kuavo "automotive manufacturing / 3C electronics / logistics" https://lejurobot.cn/en
    USE_CASE_GAP leju-kuavo "training ground / data and model services" https://lejurobot.cn/en
    USE_CASE_GAP leju-kuavo5 "Home Service" https://www.lejurobot.com/zh/products/kuavo-5

## 価格・調達・日本情報

- Leju公式サイトの公式Tmallストア導線を確認したが、KUAVO 4Pro／5の公開価格は確認できなかった。価格がないためpriceOffersへ問い合わせ行は追加していない。
- 公式製品ページ、公式マニュアル、公式ストア導線は確認できるが、現行在庫、出荷条件、商用提供状態は公開情報だけでは確定できず、needs-reviewとした。
- 日本向け販売、国内正規代理店、国内修理・保守SLAは公式情報で確認できない。問い合わせフォームの存在だけで購入可能とは断定していない。

## 主要確認ページ

- [Leju公式Englishサイト](https://lejurobot.cn/en)
- [Leju公式KUAVO 5製品ページ](https://www.lejurobot.com/zh/products/kuavo-5)
- [KUAVO公式マニュアル一覧](https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/)
- [KUAVO 4Pro Standard公式マニュアル](https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/1%E4%BA%A7%E5%93%81%E4%BB%8B%E7%BB%8D/KUAVO_4PRO%20%E6%A0%87%E5%87%86%E7%89%88%E4%BA%A7%E5%93%81%E4%BB%8B%E7%BB%8D/)
- [KUAVO 5 Advanced公式マニュアル](https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/1%E4%BA%94%E4%BB%A3%E4%BA%A7%E5%93%81/KUAVO_5%20%E8%BF%9B%E9%98%B6%E7%89%88%E4%BA%A7%E5%93%81%E4%BB%8B%E7%BB%8D/)
- [KUAVO公式SDK紹介](https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/4%E5%BC%80%E5%8F%91%E6%8E%A5%E5%8F%A3/SDK%E4%BB%8B%E7%BB%8D/)
- [Leju公式LeTools](https://www.letools.lejurobot.com/)
- [Leju公式Tmallストア導線](https://lejuznsb.tmall.com/shop/view_shop.htm)
- [Leju公式 REAL-I](https://www.kdc.icra.lejurobot.com/)

JSON: [DATA-R01-B10-leju.json](./DATA-R01-B10-leju.json)
