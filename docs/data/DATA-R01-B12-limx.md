# DATA-R01-B12 — LimX Dynamics

調査日: 2026-07-16

対象: limx-oli, limx-luna（2機）

## 結論

LimX公式の現行製品ページと仕様表を確認した。Oliはフルサイズ汎用ヒューマノイド、Lunaは商業空間・観客体験向けのフルサイズ対話型ヒューマノイドとして位置付けられている。

Oliは複数variantの仕様表で、高さ165/175cm、重量≤55/≤60kg、DoF31/33/43、稼働約2/約1.5時間、片腕最大荷重3/5kg、RK3588・Orin NX・AGX Orin構成を確認した。variantを確定できないため単一値へ統合していない。Lunaは160cm、電池込み56kg、27 DoF、最大歩行5km/h、約4時間、10,000mAh、充電約1時間、片腕最大3kg、RK3588構成を確認した。

両機とも公開価格は確認できず、公式Buy Now／Contact Salesへフォールバックする。注文フォームにJapan選択肢はあるが、日本販売・出荷・国内正規代理店が明示されていないため、入手可能とは断定していない。

## カード項目

| Robot | 想定用途 | 身長 | 重量 | 価格 | 稼働時間 |
| --- | --- | ---: | ---: | --- | ---: |
| LimX Oli | 科学研究、展示・イベント案内、設備検査、産業オペレーション | 165/175cm（variant確認要） | ≤55/≤60kg（電池込み・variant確認要） | 公式非公開（問い合わせ） | 約2/約1.5時間（variant確認要） |
| LimX Luna | 商業空間の対話・観客エンゲージメント、展示・イベント | 160cm | 56kg（電池込み） | 公式非公開（問い合わせ） | 約4時間 |

## Robot詳細用の主要値

### Oli

- 公式仕様表はOli Lite、Oli EDU、Oli Super等を分け、高さ165/175cm、重量≤55/≤60kg、DoF31/33/43、稼働約2/約1.5時間、片腕最大荷重3/5kgを掲載。generic Oliへ一つのvariant値を選んでいない。
- 最大移動速度は5km/h（1.3889m/s換算）。電池は9500mAh、スライド式交換モジュール、58.8V/10A充電器。電圧が電池容量と対応していないためWh換算せず、充電時間も非公開とした。
- リモコン、手持ちE-stop、音声制御、full Python、modular SDK、上下位API、URDF、Isaac Sim/MuJoCo/Gazebo対応を確認。
- 計算基盤はモーション制御RK3588、知覚なし／Orin NX 157TOPS、任意AGX Orin 275TOPSなど構成依存。IP等級、機体動作温度、安全規格名は非公開。

### Luna

- 160cm、電池込み56kg、27 active DoF（脚6、腕5、腰3、首2）、最大歩行5km/h、片腕最大3kg。
- 電池は10,000mAh・引出式2個、直接充電／電池交換、充電約1時間、58.8V/10A出力。10,000mAhからWhは換算していない。
- リモコン・タブレット、LimX Studioの動画模倣・手動教示・振付・インテリジェントタスク・群制御、RK3588（モーション16G/256G、知覚8G/32G）を確認。Luna固有のSDK/API名は確認できない。
- 転倒緩和、外力検知、ハードウェアE-stop、安全動作overrideはあるが、IP等級・動作温度・安全規格名は非公開。

## 活用事例

### Oli

1. Full-Size Humanoid Oli | Fully Autonomous Tennis Ball Picks Up & Tosses — Oliの自律的なテニスボール拾い上げ・投げ動作を紹介する公式製品デモ。導入・量産配備ではなくdemonstrationとして記録。区分: demonstration。出典: [LimX公式ニュース](https://www.limxdynamics.com/en/news/BK000046)

### Luna

Luna公式発表・製品ページは商業空間向けの製品位置付けと機能を掲載するが、Luna固有の導入・実証を説明する名前付き事例は今回確認できなかった。Luna製品発表や動画を導入事例へ流用していない。

## UseCase接続とGap

既存UseCaseへの接続候補はJSONに根拠付きで記録した。

- limx-oli → research-development: Scientific Research & Development
- limx-oli → customer-reception: Exhibition & Event Guidance
- limx-oli → factory-visual-inspection: Equipment Inspection
- limx-oli → factory-assembly-support: Industrial Operations
- limx-luna → customer-reception: commercial spaces / multimodal interaction / audience engagement

USE_CASE_GAPは以下の通り。

    USE_CASE_GAP limx-oli "Entertainment & Performance" https://www.limxdynamics.com/en/products/oli
    USE_CASE_GAP limx-oli "Property Management" https://www.limxdynamics.com/en/products/oli
    USE_CASE_GAP limx-luna "shopping malls / museums / theme parks / live stages" https://www.limxdynamics.com/en/products/luna
    USE_CASE_GAP limx-luna "Entertainment & Performance / brand activations" https://www.limxdynamics.com/en/news/BK000062

## 価格・調達・日本情報

- Oli/Lunaとも公式Buy Now／Contact Sales・Order Consultationを確認したが、メーカー公開価格はない。priceOffersは空配列とした。
- 注文フォームはJapanの国番号・国選択を提供するが、国内販売・出荷・在庫・正規代理店の明示ではない。
- 公式サポート、マニュアル、開発資料は確認できるが、日本の修理SLA・保守契約・現地サービス条件は非公開。

## 主要確認ページ

- [LimX公式Oli製品ページ](https://www.limxdynamics.com/en/products/oli)
- [LimX公式Oli仕様表](https://limxdynamics.com/en/products/oli/spec)
- [LimX公式Luna製品ページ](https://www.limxdynamics.com/en/products/luna)
- [LimX公式Luna仕様表](https://www.limxdynamics.com/en/products/luna/spec)
- [LimX公式Order Consultation](https://limxdynamics.com/en/order)
- [Oli公式製品発表](https://www.limxdynamics.com/en/news/BK000043)
- [Oli公式デモ記事](https://www.limxdynamics.com/en/news/BK000046)
- [Luna公式製品発表](https://www.limxdynamics.com/en/news/BK000062)
- [LimX公式About](https://www.limxdynamics.com/en/about)

JSON: [DATA-R01-B12-limx.json](./DATA-R01-B12-limx.json)
