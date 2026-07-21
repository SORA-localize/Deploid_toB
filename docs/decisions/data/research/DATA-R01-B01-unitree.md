# DATA-R01-B01 Unitree 調査報告

- checkedAt: 2026-07-16
- 対象: Unitreeのpublished Robot 10機
- JSON: [DATA-R01-B01-unitree.json](./DATA-R01-B01-unitree.json)
- 対象ID: `unitree-g1`, `unitree-g1-edu`, `unitree-h1`, `unitree-h1-2`, `unitree-h2`, `unitree-h2-edu`, `unitree-h2-plus`, `unitree-r1`, `unitree-r1-standard`, `unitree-g1-d`

## まとめ

公式製品ページ、公式ストア、公式APP／マニュアル導線、Unitree公式GitHub組織、国内正規代理店の公式ページ、大学の公式導入・研究発表を確認した。価格はメーカー公式ストアを先に確認し、メーカー価格がない／現行性が曖昧な機体だけ国内正規代理店ページを追加確認した。

カード用の確定値は、G1、H1/H1-2、H2/H2 EDU/H2 Plus、R1 AIR/R1について身長・重量・稼働時間をvariant別に記録した。G1-DはStandard／Flagshipが未選択のため、現行コードのgenericレコードに単一の身長・重量・速度・稼働時間を流用していない。

主な要確認は次のとおり。

- G1: 現行公式ページは132cmだが、旧公式ページは127cm。旧仕様の速度`>2m/s`は流用せず、現行速度は`not-published`。
- G1 EDU: 重量は公式表記が`35kg+`、DoFは`23–43`。単一値に丸めていない。
- H1: 公式ストアは`$90,000`を表示するが商品名が「Contact us for the real price」。TechShareの`1,580万円（税抜、2023年予約開始時）`も併記し、価格状態を`conflict`とした。
- H1-2: `speed <2m/s`は上限表記として`needs-review`。H1の速度・価格・交換性を流用していない。
- H2 Plus: 公式ストア一覧の`$100,000`と商品詳細の`Contact Sales`が競合。計算基盤も同一公式ページ内の`Jetson T5000`／`Jetson Thor`表記が競合。
- R1: 公式ページの`Maximum Torque of Arm Joint: About 2kg`はラベルと単位が矛盾するため、荷重に採用していない。
- G1-D: Standard／Flagship未選択。同一公式URLの別表示で重量が`90kg`と`50/80kg`に分かれるため、`conflict`としてgeneric値を保留した。
- 日本: GMO AI & Roboticsは2026-06-19付でG1/H1を含むUnitreeの国内正規代理店を表明。TechShareもG1/H1/G1-Dの正規販売・予約販売を公式に公表している。G1の旧独占権とGMO契約の現行範囲は要確認。

## 2026-07-16 公式ページ再確認差分

Web上の現行公式ページを再確認し、次の値をB01 JSONのvariant別記録と突合した。

- [G1公式](https://www.unitree.com/g1/)は現行G1/G1 EDU列を1320mm、約35kg/35kg+、23/23–43 DoF、約2時間、9000mAh、54V 5A charger、G1片腕最大約2kg・EDU約3kgとして掲載している。旧`operate/g1`の1270mmや`>2m/s`は現行値へ流用していない。
- [H1/H1-2公式](https://www.unitree.com/mobile/h1/)はH1を約180cm/47kg/3.3m/s/864Wh、H1-2を約178cm/70kg/27DoF、H1-2のArm normal loadをPeak 21kg/Rated 7kgとして掲載している。H1のruntimeやH1-2の充電時間は記載されていない。
- [H2公式ストア](https://shop.unitree.com/products/unitree-h2)はH2を`$29,900.00 USD`、180cm、31 DoF、2070 TOPSとして表示し、EDUは二次開発対応・Contact Salesとして区別している。H2 Plusの[商品詳細](https://shop.unitree.com/products/unitree-h2-plus)はrated arm payload 7kg/peak 15kg、75 total body-and-hand DoFを掲載する一方、購入はContact Salesであるため、一覧の`$100,000`表示を確定販売価格へ読み替えていない。
- [R1中国公式](https://www.unitree.com/cn/mobile/R1/)は税込価格をR1 AIR 2.99万元、R1 3.99万元、R1 EDUは営業問い合わせとして掲載し、三列の身長1230mm、重量27/29/29kg、DoF20/26/26–40、約1時間、リチウム電池・快拆電池・手持ち式リモコンを掲載している。B01では`unitree-r1`をAIR、`unitree-r1-standard`を標準R1として分離した。
- [G1-D公式](https://www.unitree.com/mobile/G1-D/)の現行表はStandard/Flagshipとも約90kg、DoF17/19、片腕最大約3kg、Flagship速度1.5m/s、電池寿命2/6時間、上体快拆9Ah＋底盤内蔵30Ahと表示する。対して[TechShareの国内ページ](https://techshare.co.jp/product/unitree/unitree-g1-d/)はStandard約50kg／Ultimate約80kgを表示するため、genericな`unitree-g1-d`の重量・身長・DoF・runtimeはvariant未選択の`conflict`/`needs-review`として単一値にしない。
- [GMO AIRの正規代理店発表](https://ai-robotics.gmo/news/article/gmo-unitree/)は2026-06-19の国内正規代理店契約、G1/H1等の取扱い、販売・導入支援・ソフトウェア開発・保守運用を明記する。R1、H2、H2 EDU/Plus、G1 EDU、G1-Dの個別国内取扱いへ自動拡張していない。

## 用途接続とUSE_CASE_GAP

既存のpublished UseCaseに接続候補を作ったのは、公式表現が既存の研究開発・AIシミュレーション・試作開発のスコープに直接対応するものに限定した。G1-Dの`Service / Life / Retail / Industry`は公式表現として記録したが、現行published UseCaseに同じ粒度の汎用項目がないため、タスクへ推測接続していない。

JSON内の`useCaseGaps`に次を記録した。

```text
USE_CASE_GAP unitree-h1 "industrial / service industry; full-size general-purpose humanoid" https://www.unitree.com/operate/h1/
USE_CASE_GAP unitree-h1-2 "full-size universal humanoid robot / 360° depth sensing" https://www.unitree.com/mobile/h1/
USE_CASE_GAP unitree-h2 "multiple work scenarios / humanoid robot" https://www.unitree.com/mobile/H2/
USE_CASE_GAP unitree-h2-edu "multiple work scenarios / secondary development" https://www.unitree.com/mobile/H2/
USE_CASE_GAP unitree-g1-d "Service / Life / Retail / Industry" https://www.unitree.com/mobile/G1-D/
```

## 活用事例の扱い

製品ページの能力紹介は活用事例に数えず、実際の研究・教育利用またはイベント実演を分けた。G1はCMUのUnitree G1研究、CCSUの教育・研究導入、Unitree公式WRC実演、G1 EDUはWilliam Paterson Universityの助成導入、H1はUnitree公式WRC実演を登録した。H1-2、H2、H2 EDU、H2 Plus、R1、G1-Dはvariantを確定できる導入・研究事例を確認できなかったため空配列とした。

## 仕様状態の要約

各RobotのJSONで`lib/specSchema.ts`の16キー（`payloadKg`を含む）を省略せず記録した。`payloadKg`は単独値にせず、公式の片腕荷重・Peak／Ratedを`loadRatings`へ移した。IP等級、動作温度、安全規格番号、充電時間は、公式製品ページ・ストア・APP／マニュアル導線を確認しても公開値を確認できなかったため`not-published`とした。

このバッチは調査報告のみで、`data/*.ts`、UI、画像ファイルは変更していない。
