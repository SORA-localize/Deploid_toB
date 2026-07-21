# DATA-R02-B01 — Unitree Robotics 再検証レポート

- checkedAt: 2026-07-17
- 対象: `unitree-g1`, `unitree-g1-edu`, `unitree-h1`, `unitree-h1-2`, `unitree-h2`, `unitree-h2-edu`, `unitree-h2-plus`, `unitree-r1`, `unitree-r1-standard`, `unitree-g1-d`（10機）
- JSON: [DATA-R02-B01.json](./DATA-R02-B01.json)
- 本レポートは調査専用。`data/*.ts`・UI・画像・publishStatusは一切変更していない。

## 方針: DATA-R01からの主な修正点

DATA-R01は「旧・不明瞭な導入事例と現行製品世代の同一性が確認できない」という理由で、現行公式ページに明記された値まで保留する傾向があった。本バッチでは、その判断を修正し、**現行公式ページに直接書かれている値は、無関係な旧導入事例の世代同定が曖昧であっても採用する**方針で全10機を再確認した。特に `unitree-g1-d` は、DATA-R01が variant 未選択を理由に spec を全て空にしていたが、現行公式ページ（https://www.unitree.com/mobile/G1-D）はStandard/Flagshipの2構成について身長（昇降範囲）・重量・DoF・稼働時間・荷重を明確に区別して掲載しており、今回はfamily-common値とvariant別値を分けて採用した。

## ロボット別サマリー

### unitree-g1 (G1)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- 現行公式ページ（unitree.com/g1）・公式ストア（$13,500）で確認。旧`operate/g1`ページの127cm・">2m/s"は現行値としては採用しない（historical）。
- 主要spec: 身長132cm、重量約35kg、DoF23、稼働約2h、片腕最大荷重約2kg（姿勢依存）。
- 未公開: 速度、バッテリーWh（9000mAhのみで電圧不明のため換算しない）、充電時間、IP等級、動作温度、安全規格。
- 用途接続: `research-development`（既存useCases.tsの接続と整合）。
- 活用事例: CMU Intelligent Control LabのICRA2025優勝（research、CMU公式発表）／Unitree自社WRC2024ブース実演（demonstration）。

### unitree-g1-edu (G1 EDU)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- G1と同一公式ページ上の二次開発対応構成。重量「35kg+」、DoF 23–43（構成幅として明記、単一値に丸めない）、片腕最大荷重約3kg。
- 価格は「Contact sales」明記のため `priceFallback: inquiry-fallback`。
- 用途接続: `research-development`。
- 活用事例: William Paterson University（米国教育省助成金によるG1 EDU導入、大学公式発表2025-10-27、research）。

### unitree-h1 (H1)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- Unitreeトップページの「Humanoid Robot」枠に現行掲載、公式ストアでも購入導線あり（ただし商品名が「Contact us for the real price」）。
- 主要spec: 身長180cm、重量47kg、速度3.3m/s（世界記録）、DoF18、バッテリー864Wh（H1-2と共通区画に記載）。
- 価格: ストア表示$90,000だが商品タイトル自体が実勢価格の問い合わせを促す文言のため`conflicts`に記録。TechShareの2023-12-06予約開始時価格（1,580万円・税抜）は2023年時点の historical 価格として現行価格に採用しない。
- 日本: TechShare（2023年予約販売開始）＋GMO AI & Robotics（2026-06-19付・正規代理店としてG1/H1を明記）の両方が現行の取扱窓口。
- unresolved: リポジトリに以前あった「NVIDIA Jetson Orin NX」オプション表記は今回のページ再取得では確認できず（Intel i5/i7のみ確認）。

### unitree-h1-2 (H1-2)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- H1と同一ページの別構成として現行確認。身長178cm、重量70kg、DoF27、片腕Peak約21kg・Rated約7kg。バッテリー864WhはH1と共通区画の記載。
- 価格: H1-2単独の価格情報は見つからず、`priceFallback: inquiry-fallback`。
- 速度・稼働時間はH1-2単独では非公開。

### unitree-h2 (H2)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- 公式ページ・公式ストア（$29,900）で一致確認。身長182cm、重量70kg、DoF31、稼働約3h、バッテリー972Wh、片腕Peak15kg/Rated7kg。
- 用途接続: 明確な公式タスク表現がないため`research-development`等へは接続せず、USE_CASE_GAPとして記録。

### unitree-h2-edu (H2 EDU)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- H2と同一ページのEDU列。本体仕様はH2と共通（family-common）、二次開発対応・高演算モジュール（Thor等選択可）が差分。
- 価格「Contact Sales」明記のため`priceFallback: inquiry-fallback`。

### unitree-h2-plus (H2 Plus)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- 専用公式ページ・公式ストア（$100,000、ただし購入は要問い合わせ）に加え、NVIDIA公式プレスリリース（2026-05-31、GTC Taipei）がH2 PlusをIsaac GR00Tリファレンスヒューマノイドの機体として明記。
- computePlatformは**conflict**: 同一公式ページ内で「Jetson T5000」と「Jetson Thor」の両方の表記が併存。NVIDIA自身のプレスリリースは「Jetson Thor」を使用。
- 用途接続: `research-development`、`research-ai-simulation`（Isaac Sim/Lab/ROS/GR00T対応が根拠）。

### unitree-r1 (R1 AIR)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- 公式ページでR1 AIR（$4,900）／R1（$5,900）／R1 EDU（要問い合わせ）の3構成が明確に区別。R1 AIRは身長123cm、重量27kg、DoF20、稼働約1h。
- 荷重: 公式表記「Arm joint maximum torque: About 2kg」はラベルと単位（トルクをkgで表記）が矛盾するため、loadRatingとして記録しつつ`unresolved`にも明記。
- 用途接続: `research-ai-simulation`（主要シミュレーション環境対応）。

### unitree-r1-standard (R1)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- R1 AIRと同一ページの標準構成。重量29kg、DoF26、価格$5,900。その他の共通スペック（身長・稼働時間・バッテリー・SDK等）はR1ファミリー共通。
- 用途接続: `research-ai-simulation`。

### unitree-g1-d (G1-D)
- lifecycleStatus: **current** / publicationRecommendation: **keep-published**（DATA-R01は spec を全て空にしていたが、現行公式ページの明確な per-variant 記載に基づき今回は復元）
- Standard／Flagship両構成: 重量約90kg（共通）、DoF Standard17／Flagship19、稼働Standard約2h／Flagship約6h、速度Flagship1.5m/s（Standardは固定スタンドのため非該当）、片腕最大荷重約3kg（共通）。
- mobility は `needs-review`: Standard=stationary、Flagship=wheeled/mobile base の変種差のため単一値にしない。
- 価格: Unitree公式・TechShare予約販売発表（2025-12-01）とも非公開、`priceFallback: inquiry-fallback`。
- conflicts: DATA-R01が引用したTechShare旧ページの「Standard約50kg／Ultimate約80kg」は、本日(2026-07-17)の再確認では当該数値がTechShareページ上に見当たらず再現できなかった。現行Unitree公式ページの約90kg（両構成共通）を採用し、DATA-R01のように全spec保留とはしない。
- unresolved/humanReviewRequired: Unitree公式の「Standard/Flagship」とTechShareの「Standard/Ultimate」の対応関係は文脈からの推測であり、明示的な一致確認はできていない。

## Spec状態サマリー表（16キー中 found件数 / not-published件数 等）

| robotId | found | not-published | conflict | needs-review |
|---|---|---|---|---|
| unitree-g1 | 9 | 7 | 0 | 0 |
| unitree-g1-edu | 9 | 7 | 0 | 0 |
| unitree-h1 | 10 | 6 | 0 | 0 |
| unitree-h1-2 | 9 | 7 | 0 | 0 |
| unitree-h2 | 10 | 6 | 0 | 0 |
| unitree-h2-edu | 10 | 6 | 0 | 0 |
| unitree-h2-plus | 9 | 6 | 1 | 0 |
| unitree-r1 | 9 | 7 | 0 | 0 |
| unitree-r1-standard | 9 | 7 | 0 | 0 |
| unitree-g1-d | 9 | 6 | 0 | 1 |

IP等級・動作温度・安全規格の3項目、および充電時間・バッテリーWh（多くの機種でmAh/Ahのみ公表）は、全10機で一貫して`not-published`（製品ページ・ストア・GitHub・代理店ページ・マニュアル導線を確認した上での判定）。

## 主な conflicts / unresolved 一覧

- `unitree-h1`: ストア価格$90,000と商品タイトル「Contact us for the real price」の矛盾。TechShare 2023年予約価格（1,580万円）は historical。
- `unitree-h2-plus`: 同一公式ページ内 computePlatform 表記の競合（Jetson T5000 / Jetson Thor）。ストア$100,000と「要問い合わせ」の並存。
- `unitree-r1` / `unitree-r1-standard`: 「Arm joint maximum torque: About 2kg」のラベル・単位矛盾（トルクをkgで表記）。
- `unitree-g1-d`: 重量に関するDATA-R01引用のTechShare旧数値と現行公式ページの差異（今回は現行公式値を採用）。Unitree「Standard/Flagship」とTechShare「Standard/Ultimate」の呼称対応は未確定。
- `unitree-h1` / `unitree-h1-2`: リポジトリに記載されていた「NVIDIA Jetson Orin NX」オプションは、今回のページ再取得では確認できず（manual review推奨）。

## USE_CASE_GAP一覧

```text
USE_CASE_GAP unitree-h1 "GMO AI & Robotics: logistics/manufacturing/facility management/construction/airport operations sales & support for G1/H1" https://ai-robotics.gmo/news/article/gmo-unitree/
USE_CASE_GAP unitree-h2 "multiple intelligent models / general work scenarios (no specific task named)" https://www.unitree.com/mobile/H2/
USE_CASE_GAP unitree-h2-edu "secondary development support / custom compute module options (no explicit research/education wording)" https://www.unitree.com/mobile/H2/
USE_CASE_GAP unitree-g1-d "Service / Life / Retail / Industry (four generic categories)" https://www.unitree.com/mobile/G1-D
```

## 活用事例（実導入事例）まとめ

| robotId | 主体 | 分類 | 出典 |
|---|---|---|---|
| unitree-g1 | Carnegie Mellon University Intelligent Control Lab | research | https://icontrol.ri.cmu.edu/news/icra2025-wbcd.html |
| unitree-g1 | Unitree Robotics（WRC2024自社ブース） | demonstration | https://www.unitree.com/news1/ |
| unitree-g1-edu | William Paterson University | research | https://www.wpunj.edu/articles/news/2025-10-27/humanoid-AI-robot-computer-science-department-william-paterson-university |
| unitree-h1 | Unitree Robotics（WRC2024自社ブース） | demonstration | https://www.unitree.com/news1/ |

H1-2、H2、H2 EDU、H2 Plus、R1 AIR、R1、G1-Dはvariantを確定できる導入・研究事例を今回確認できなかったため空配列とした。

## 評価ドキュメント一覧（robotId別・簡略）

- **unitree-g1**: unitree.com/g1（official-product）／shop.unitree.com/products/unitree-g1（official-store）／github.com/unitreerobotics（official-sdk）／techshare.co.jp/product/unitree/g1（distributor）／icontrol.ri.cmu.edu ICRA2025記事（customer-primary）／unitree.com/news1（official-news）
- **unitree-g1-edu**: 上記G1と同一公式ページ＋wpunj.edu記事（customer-primary）
- **unitree-h1**: unitree.com/mobile/h1（official-product）／unitree.com/app/h1（official-manual）／shop.unitree.com/products/unitree-h1（official-store）／techshare.co.jp/unitree-h1-press-release（distributor）／ai-robotics.gmo（distributor）
- **unitree-h1-2**: unitree.com/mobile/h1（official-product、H1と共通ページ）／unitree.com/app/h1（official-manual）
- **unitree-h2 / h2-edu**: unitree.com/mobile/H2（official-product）／shop.unitree.com/products/unitree-h2（official-store）
- **unitree-h2-plus**: unitree.com/mobile/H2plus（official-product）／shop.unitree.com/products/unitree-h2-plus（official-store）／nvidianews.nvidia.com（official-news, NVIDIA公式）
- **unitree-r1 / r1-standard**: unitree.com/mobile/R1（official-product）
- **unitree-g1-d**: unitree.com/mobile/G1-D（official-product）／techshare.co.jp/g1-g1d-press-release（distributor）／techshare.co.jp/product/unitree/unitree-g1-d（distributor）

全ドキュメントの`checkedAt`は2026-07-17。GitHub組織ページ（github.com/unitreerobotics、unitree_sdk2のリポジトリ説明がG1/G1-D/H1/H1-2/H2/H2 Plus/R1を明示的にサポート対象として列挙）は全10機で共通のSDK出典として使用した。

このバッチは調査報告のみで、`data/*.ts`・UI・画像ファイルは変更していない。
