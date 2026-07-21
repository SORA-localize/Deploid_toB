# DATA-R01-B09 — Kepler Robotics

調査日: 2026-07-16

対象: `kepler-k2`, `kepler-k1`（2機）

## 結論

Kepler公式はK2を工場向けの汎用ヒューマノイド、K1をForerunnerシリーズの汎用機として掲載している。K2の現行公式構成表はBasic／Bipedal Development／Wheeled Developmentを分け、Basicは30 DoF、開発構成は52 DoF、開発構成のGPUは100 TOPS。K2製品ページには175cm、重量は75kgと135kgの構成値、両腕協調荷重25–30kg、1時間充電、8時間稼働があるため、構成を固定しないRobotレコードでは重量・移動方式・DoF・算力を`needs-review`にした。

K1公式ページは178cm、85kg、全身40 DoF、100 TOPSを直接記載する。一方、K1の速度、荷重、稼働時間、電池容量、充電時間、IP等級、動作温度、安全規格、価格は公式ページで確認できなかった。K2はメーカー公式発表で量産・顧客出荷を確認できるが、K1の現行出荷状況は公式ページの「近い将来に商用化・量産化」以上に断定していない。

## カード項目

| Robot | 想定用途 | 身長 | 重量 | 価格 | 稼働時間 |
| --- | --- | ---: | ---: | --- | --- |
| Forerunner K2 | インテリジェント製造、検査、研究・データ取得、工場・物流向け汎用作業 | 175cm | 75kg／135kg（構成要確認） | 公式非公開（購入相談） | 8時間 |
| Forerunner K1 | 教育・研究、スマート検査、自動生産ライン、倉庫物流、高リスク・屋外タスク | 178cm | 85kg | 公式非公開（購入相談） | 公式非公開 |

## Robot詳細用の主要値

### Forerunner K2

- 移動方式は構成依存。公式構成表にBipedal DevelopmentとWheeled Developmentがあるため、公開Robotカードで単一の`biped`を確定していない。
- 公式ページの重量値は75kgと135kgの双方。車輪構成等の対応はページ表示から一意に固定せず、variant reviewへ送った。
- 公式荷重表現は`Dual-arm collaborative handling 25–30kg`。scalar `payloadKg`へ流用せず、`loadRatings`に`dual-arm`・`unspecified`の25kg/30kg endpointとして保存。
- 公式構成表はBasic 30 DoF、二足・車輪開発構成52 DoF。K2 genericの単一DoFを選択していない。
- Nebula System、Visual SLAM、マルチモーダル操作、動作計画・制御、Kepler OS開発プラットフォームを確認。IP、温度、安全規格、電池容量は非公開。

### Forerunner K1

- K1公式ルートは178cm、85kg、全身40 DoF、100 TOPS。手の12 DoFは全身DoFへ加算していない。
- K1ページは歩行・複雑地形、Visual SLAM、自律経路計画、スマート検査、精密組立等を掲載するが、二足／車輪の明示的なvariant表記は見つからず、移動方式は`needs-review`。
- K2の25–30kg、8時間、1時間充電等はK1に流用していない。K1の荷重・稼働・電池・充電時間は公式非公開。
- Kepler OSの公開インターフェース、リファレンス文書、サンプル、視覚プログラミング、オンラインデバッグ、マルチロボット連携をSDK候補として記録した。

## 活用事例

### K2

1. `Kepler robot debuts at SAIC-GM for industrial tests` — SAIC-GMで実環境の産業試験。区分: `pilot`。出典: [Kepler Robotics公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_kepler-humanoid-robot-lands-at-saic-gm-activity-7321418311701815298-9Hyn)
2. `Kepler K2 'Bumblebee' Enters Production at Zhaofeng Motor` — Zhaofeng Motorの実生産ラインで自律移動と部品loading/unloading。区分: `deployment`。出典: [Kepler Robotics公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_keplerrobotics-keplerk2-humanoidrobots-activity-7409791717769601024-bi4K)
3. `Kepler K2 Humanoid Begins Work at Veichi Electric` — VEICHI Electric製造施設での実環境トライアル。区分: `pilot`。出典: [Kepler Robotics公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_kepler-k2-humanoid-begins-work-at-veichi-activity-7397106664631554048-E29L)

### K1

公式K1ページで教育・研究、検査、生産ライン、物流等の用途表現は確認できたが、K1固有の導入・実証・研究を説明する名前付き事例ページは確認できなかった。K2の導入事例やK1 launch/specページはK1の活用事例へ流用していない。

## UseCase接続とGap

既存UseCaseへの接続候補はJSONに根拠付きで記録した。

- `kepler-k2` → `factory-assembly-support`: `precision integration in intelligent manufacturing`
- `kepler-k2` → `factory-visual-inspection`: `product verification and quality alerting / inspection scenarios`
- `kepler-k2` → `research-development`: `scientific research services / data acquisition / research and education`
- `kepler-k1` → `research-development`: `Education & Research`
- `kepler-k1` → `factory-visual-inspection`: `Smart Inspection`
- `kepler-k1` → `factory-assembly-support`: `Automated Production Line / precise assembly`

USE_CASE_GAPは以下の通り。

```text
USE_CASE_GAP kepler-k2 "warehousing and logistics" https://www.gotokepler.com/productDetailK2?id=2
USE_CASE_GAP kepler-k2 "specialized industries / high-risk operations" https://www.gotokepler.com/productDetailK2?id=2
USE_CASE_GAP kepler-k2 "outdoor tasks" https://www.gotokepler.com/productDetailK2?id=2
USE_CASE_GAP kepler-k1 "Education" https://gotokepler.com/productDetailK1
USE_CASE_GAP kepler-k1 "Warehousing & Logistics" https://gotokepler.com/productDetailK1
USE_CASE_GAP kepler-k1 "High-risk Environment" https://gotokepler.com/productDetailK1
USE_CASE_GAP kepler-k1 "Outdoor Tasks" https://gotokepler.com/productDetailK1
```

## 価格・調達・日本情報

- K2: [公式購入相談](https://www.gotokepler.com/contact?type=ordering)を確認したが、メーカー公開価格はない。公式企業発表は2025-09-26にK2 Bumblebeeの量産・顧客出荷開始を報告しているため、市場提供は`production-customer-shipping`とした。
- K1: 公式K1ページと購入相談ページを確認したが価格はない。公式ページは「近い将来に商用化・量産化」と記載するため、現行出荷中とは断定していない。
- 日本: Kepler公式About、購入相談、開発者ページに国内正規代理店の記載はなく、日本での入手性・代理店・サポートは`not-published`または`needs-review`。

## 主要確認ページ

- [Forerunner K2公式製品ページ](https://www.gotokepler.com/productDetailK2?id=2)
- [Forerunner K1公式製品ページ](https://gotokepler.com/productDetailK1)
- [Kepler Developer Platform / Kepler OS](https://www.gotokepler.com/apps/mobile/pages/developerPlatform/index)
- [Kepler About](https://www.gotokepler.com/about)
- [Kepler購入相談](https://www.gotokepler.com/contact?type=ordering)
- [K2量産・顧客出荷の公式発表](https://www.prnewswire.com/news-releases/worlds-first-commercially-available-hybrid-architecture-humanoid-robot-moves-into-mass-production-kepler-marks-the-start-of-a-new-industrial-era-302568138.html)
- [K2 SAIC-GM公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_kepler-humanoid-robot-lands-at-saic-gm-activity-7321418311701815298-9Hyn)
- [K2 Zhaofeng Motor公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_keplerrobotics-keplerk2-humanoidrobots-activity-7409791717769601024-bi4K)
- [K2 VEICHI Electric公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_kepler-k2-humanoid-begins-work-at-veichi-activity-7397106664631554048-E29L)

JSON: [`DATA-R01-B09-kepler.json`](./DATA-R01-B09-kepler.json)
