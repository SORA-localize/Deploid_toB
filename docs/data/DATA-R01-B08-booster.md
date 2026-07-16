# DATA-R01-B08 — Booster Robotics

調査日: 2026-07-16

対象: `booster-t1`, `booster-k1`（2機）

## 結論

Booster公式はT1を開発・研究・競技向け、K1を具身AI開発・教育向けとして位置付けている。T1は身長約1.2m、重量約30kg、歩行約2時間／立位約4時間、K1は身長約95cm、重量約19.5kg、全身22 DoF。T1のDoFは構成により23／31／41、K1の稼働時間はGeek 30分（2Ah）とEducation/Professional 80分（5Ah）に分かれるため、汎用Robotレコードに単一値を決めていない。

T1の公開価格は公式ストアを確認しても非公開。K1はメーカー公式ページに「From $5,999」、中国語公式ページに「3.99万起」があるが、Geek/Education/Professionalのどの構成かは明記されない。日本ではTohasen Roboticsが2025-11-03付でBooster Roboticsとの国内正規代理店契約を発表している。

## カード項目

| Robot | 想定用途 | 身長 | 重量 | 価格 | 稼働時間 |
| --- | --- | ---: | ---: | --- | --- |
| T1 | 開発、研究、RoboCup AdultSize、教育・競技 | 約118cm | 約30kg | 公式非公開（問い合わせ） | 約120分（歩行）、約240分（立位） |
| K1 | 具身AI開発、RoboCup KidSize、教育 | 約95cm | 約19.5kg | $5,999〜／¥39,900〜（構成未特定） | 30分（Geek、2Ah）／80分（Education・Professional、5Ah） |

## Robot詳細用の主要値

### T1

- 公式variant: Basic / Standard / Customized。通常の全身DoFは23、グリッパー付き31、器用手付き41。構成を指定しないまま単一DoFを採用しない。
- 速度、payload、充電時間、IP等級、動作温度、安全規格は、確認した公式製品・RoboCup・サポートページに公開値なし。
- 電池は10.5Ahとあるが、電圧がないためWhへ換算していない。計算機はBasicがNVIDIA AGX Orin 200 TOPS、Standard/CustomizedがIntel i7-1370P + NVIDIA AGX Orin 200 TOPS。
- 公式ページはAPIインターフェース、オープンソース framework/toolsを明示。Booster Gymの公式READMEでT1対応とBooster Robotics SDK経由の実機デプロイを確認。

### K1

- 公式variant: Geek / Education / Professional。全構成で身長約95cm、重量約19.5kg、全身22 DoF。
- 稼働・電池・算力は構成別。Geekは30分・2Ah・48 TOPS（dense）、Educationは80分・5Ah・117 TOPS、Professionalは80分・5Ah・200 TOPS。ボード名・電圧・充電時間は非公開。
- 公式ページは「From $5,999」、中国語公式ページは「3.99万起」。from価格で構成・税区分を確定できないため価格offerにはvariant注意を残した。
- K1は二次開発対応。公式Booster Gym READMEはK1対応を明記し、教育ページにはPython、ROS2、MuJoCo、RL、Sim2Real等の開発内容が掲載されている。

## 活用事例（製品発表・単なるスペック紹介と分離）

### T1

1. `Robot Table Tennis - Purdue University` — Booster掲載の顧客事例。T1を用いたロボット卓球の研究・実演。区分: `research`。
2. `Building Robot Fighting Game - Frodobots` — T1を使ったロボット格闘ゲーム構築。区分: `research`。
3. `FALCON RL Framework - Carnegie Mellon University` — T1を用いた強化学習フレームワーク事例。区分: `research`。

出典: [Booster T1公式製品ページ](https://www.booster.tech/booster-t1/)

### K1

1. `"World Cup 'KidSize' Category Champion" - HTWK Team, Germany` — RoboCup 2025 KidSize部門。区分: `demonstration`。
2. `2025 World Humanoid Robotics Games Federation Center Stage Lead Performer` — 公式ページ掲載のステージ活用。区分: `demonstration`。

出典: [Booster K1公式製品ページ](https://www.booster.tech/booster-k1/)

## UseCase接続とGap

既存UseCaseへの接続候補はJSONに根拠付きで記録した。

- `booster-t1` → `research-development`: `competition, research and development`
- `booster-t1` → `research-prototype-dev`: 開発者向けAPI・オープンソース開発基盤
- `booster-k1` → `research-development`: `embodied AI education / research innovation`
- `booster-k1` → `research-prototype-dev`: `Introductory Embodied Development Platform / embodied development`

USE_CASE_GAPは以下の通り。

```text
USE_CASE_GAP booster-t1 "RoboCup AdultSize robot soccer competition" https://www.booster.tech/robocup/
USE_CASE_GAP booster-t1 "embodied AI education / robotics soccer training courses" https://www.booster.tech/cn/education/
USE_CASE_GAP booster-k1 "embodied AI education / K12 and higher-education training" https://www.booster.tech/cn/education/
USE_CASE_GAP booster-k1 "RoboCup KidSize robot soccer competition" https://www.booster.tech/robocup/
```

## 価格・日本調達

- T1: [公式ストア](https://www.booster.tech/store/)は問い合わせフォームで、金額は公開されていない。国内正規代理店を確認したが、T1の日本価格は公開されていないため`priceOffers`は空配列。
- K1: [英語公式ページ](https://www.booster.tech/booster-k1/)の`From $5,999`と、[中国語公式ページ](https://www.booster.tech/cn/booster-k1/)の`3.99万起`を記録。別variant価格の流用ではなく、同一K1ページのfrom価格としてvariant未特定を明示。
- 日本: [Tohasen Roboticsの正規代理店契約発表](https://www.tohasen-robotics.com/news/tohasen-robotics%E3%80%81booster-robotics%E7%A4%BE%E3%81%A8%E6%97%A5%E6%9C%AC%E5%9B%BD%E5%86%85%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E6%AD%A3%E8%A6%8F%E4%BB%A3%E7%90%86%E5%BA%97%E5%A5%91%E7%B4%84/)で国内正規代理店契約を確認。契約発表は2026年前半の日本語サポート体制構築予定にも言及するが、現行のSLA・修理期間・機体別価格は未公開。

## 主要確認ページ

- [Booster T1](https://www.booster.tech/booster-t1/)
- [Booster K1](https://www.booster.tech/booster-k1/)
- [RoboCup solution](https://www.booster.tech/robocup/)
- [教育ソリューション（中国語）](https://www.booster.tech/cn/education/)
- [Booster Gym公式README](https://github.com/BoosterRobotics/booster_gym)
- [Booster Deploy公式README](https://github.com/BoosterRobotics/booster_deploy)
- [Booster Robotics公式ストア](https://www.booster.tech/store/)
- [Tohasen Robotics 会社概要（Booster Robotics国内正規代理店表記）](https://www.tohasen-robotics.com/company/profile/)

JSON: [`DATA-R01-B08-booster.json`](./DATA-R01-B08-booster.json)
