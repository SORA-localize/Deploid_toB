# DATA-R01-B13 — Agility / Figure / Boston Dynamics / Tesla / Sanctuary / Kawasaki / NEURA / XPENG

調査日: 2026-07-16

対象: agility-digit, figure-03, boston-dynamics-atlas, tesla-optimus, sanctuary-phoenix, kawasaki-kaleido, neura-4ne-1, xpeng-iron（8機）

## 結論

現行メーカー公式ページ、公式仕様表・PDF、公式ニュース・IRを確認した。数値が公開されていない機体は、報道値やリポジトリ既存値で補完せず、項目別にnot-publishedを記録した。

特にvariant混在がある機体は次の扱いにした。

- Sanctuary Phoenix: 現行Generation 8は車輪ベース。Generation 6の5'7\"、155lb、55lb、3mph、手20 DoFを現行Gen8へ流用していない。
- Kawasaki Kaleido: 2017、2019、RHP7で身長・重量等が異なるため、generic recordはconflict/needs-reviewとした。
- XPENG IRON: 2024初代と2025 Next-GenでDoF・算力等が異なるため、単一値へ統合していない。
- NEURA 4NE1: 現行4NE1と旧4NE-1で速度・payload表現が異なるためconflictとした。

## カード項目

| Robot | 想定用途 | 身長 | 重量 | 価格 | 稼働時間 |
| --- | --- | ---: | ---: | --- | ---: |
| Agility Digit | 製造・物流・流通のトート搬送、積み降ろし、AMR連携 | 非公開 | 非公開 | 公式非公開（RaaS/問い合わせ） | 4時間 |
| Figure 03 | 家庭内の洗濯・清掃・食器、製造物流の部品sequencing | 5'8\"（172.72cm） | 61kg | 公式非公開 | 5時間（ピーク性能条件） |
| Boston Dynamics Atlas | 製造のpart sequencing・machine tending、物流・order fulfillment | 190cm | 90kg | 公式非公開（選定顧客向け問い合わせ） | 4時間（重量物2時間） |
| Tesla Optimus | 自社施設のunsafe/repetitive/boring task、電池取扱い | 非公開 | 非公開 | 公式非公開（外販未確認） | 非公開 |
| Sanctuary Phoenix | 汎用Physical AI、製造・物流、データ取得 | 現行Gen8非公開 | 現行Gen8非公開 | 公式非公開（商用問い合わせ） | 非公開 |
| Kawasaki Kaleido | ヒューマノイド研究開発、将来の危険・災害現場遠隔作業 | 世代により175/178/180cm | 世代により85/80kg | 公式非公開 | 非公開 |
| NEURA 4NE1 | 非構造産業ワークフロー、物流・製造、日常支援 | 180cm | 80kg | 本体価格非公開（予約金は除外） | 非公開（dual-battery 24/7表現） |
| XPENG IRON | 案内・買物支援・交通誘導、Baosteelでの産業検査探索、自社工場・店舗 | 非公開 | 非公開 | 公式非公開（量産計画） | 非公開 |

## Robot詳細用の主要値

### Agility Digit

- 公式はDigitをbipedal Mobile Manipulation Robot、完全自律・商用導入済みとして位置付ける。現行公式ページで35lb carrying capacity（15.876kg換算）と4時間を確認。荷重はcarrier scope・manufacturer wordingとして登録し、payloadKgには入れていない。
- Arcはクラウド型フリート・ワークフロー管理で、WMS/MES/WES/PLCやAMR連携、遠隔監視・保守を担う。Digit固有SDK、搭載計算基盤、身長、重量、速度、DoF、Wh、充電時間、IP、温度は公開されていない。
- CAT1 stop、Safety PLC、PLd、E-stop、FSoEは確認できるが、動的安定モバイルロボットの規格は発展途上との公式説明であり、Digitの安全認証規格としてはneeds-review。
- GXOとのRaaS、アトランタ近郊施設での長期商用導入、GXO Flowery Branchで10万トート超の3件を導入事例として登録。

### Figure 03

- 現行製品ページの5'8\"、61kg、20KG、5HR、1.2M/S、electricを記録。5'8\"は172.72cmへ換算した。20kgはscope/rating不明のmanufacturer-wording荷重。
- F.03 Battery公式記事で2.3kWh、ピーク性能5時間、2kW fast charge、胴体内蔵・内製電池を確認。充電出力を充電時間へ読み替えていない。
- HelixはFigureのvision-language-action AI。F.03の総DoF、SDK、搭載CPU/GPU、IP、動作温度は非公開。電池のUN38.3・UL2271は確認したが、ロボット全体の安全規格とは区別した。
- BMW Plant Spartanburg Hall 52での部品sequencing・カート牽引は、公式記事自身がFigure 03のfirst demonstrationと説明するため、deploymentではなくdemonstrationとして登録。

### Boston Dynamics Atlas

- 現行電動Atlasの公式ページ/PDFで190cm、90kg、56 DoF、IP67、-20〜40°Cを確認。4時間の通常稼働、重量物条件2時間、充電1.5時間、電池自律交換3分、110V（220V optional）を区別した。
- 荷重は公式表記どおりInstant 50kg、Sustained 30kg、One-Handed 20kg。Instant/Sustainedはmanufacturer-wording、One-Handedはsingle-armで、いずれもrated/maximumとは断定していない。
- 操作方式はautonomous、VR teleoperated、tablet。OrbitはMES/WMS等との統合・フリート管理であり、Atlas SDKとして扱っていない。速度、Wh、搭載計算基盤、安全認証規格名は非公開。
- Hyundaiを最初の顧客とする実顧客施設でのシーケンシングフィールドテスト・配備を公式製品版発表からdeploymentとして登録。一般公開価格はない。

### Tesla Optimus

- Tesla公式AIページがgeneral-purpose、bi-pedal、autonomous、unsafe/repetitive/boring tasksを明記。Q2 2024公式IRは、Tesla施設で電池取扱いタスクを自律実行開始と報告している。
- 公式に確認できたのは位置付け・自律ソフトウェアスタック・社内タスクのみ。身長、重量、速度、DoF、荷重、稼働時間、電池、充電、SDK、搭載計算基盤、IP、温度、安全規格はすべて推測せずnot-published。
- 外販価格・一般購入・日本入手性・国内代理店・製品サポート条件は確認できない。コードにあった数値は採用していない。

### Sanctuary Phoenix

- Phoenix Gen8公式記事は、現行機が車輪ベースで、テレメトリ、カメラ、センサー、音声映像、製造性を改善した世代であることを明記。Carbonは認知アーキテクチャ／AI制御系で、自律方策、human-in-the-loop、teleoperation、fleet managementを含む。
- 旧Gen6公式記事には具体的数値があるが、Gen8とは別世代であり、現行カードの身長・重量・速度・荷重・DoF・稼働時間等へ流用していない。現行Gen8のIP、温度、電池、算力、SDK、安全規格も非公開またはneeds-review。
- Canadian Tire傘下Mark's店舗での1週間・110タスクのpilotを、Phoenix世代未特定のPhoenix platform歴史事例として登録。Gen8固有の導入事例とは表示しない。

### Kawasaki Kaleido

- Kawasaki公式はKaleidoを研究開発機体・将来実用化目標と説明。2017は175cm/85kg/外部給電、2019は178cm/85kg/内蔵電池、RHP7記事は180cm/80kg・歩行4km/h。generic Kaleidoへ代表値を選んでいない。
- 自由度、荷重、稼働時間、Wh、充電時間、SDK、計算基盤、IP、温度、安全規格は非公開。専用humanoid controller、dynamic behavior support、転倒試験は確認したが、現行操作方式・安全規格へ単純化していない。
- iREX等の展示・歩行デモは製品発表／研究展示であり、導入事例として数えていない。危険現場・災害対応の遠隔操作は公式の将来用途で、既存UseCaseに完全一致しないためUSE_CASE_GAPへ記録。

### NEURA 4NE1

- 現行4NE1ページの180cm、80kg、5km/h、payload 10–100kgを確認。旧4NE-1ページは3km/h、15kgであり、公式世代差としてconflict。payload 10–100kgはscope/rating不明のmanufacturer-wording荷重として下限10kgを記録した。
- 現行はwalking humanoidで、車輪型は別モデル。音声・自律・遠隔操作、交換式forearms、NEURA Ai API、sensor skin、touchless human detectionを確認。SDKはAPIとの差があるためneeds-review。
- 2025公式発表のintelligent dual-battery／24/7 operationを記録したが、稼働時間やWhへ換算していない。IP、温度、搭載計算基盤、安全認証規格は非公開。
- 4NE1本体価格は非公開。公式ストアの119€はreservation feeであり、ロボット本体価格・クラウドファンディング価格ではないためpriceOffersへ登録していない。

### XPENG IRON

- 2024公式AI Dayは初代IRONを60超の関節・200 DoF超、自社工場・店舗の内部用途として説明。2025 Next-Genは全身82 DoF、手22 DoF、全固体電池、3 Turing AI chips、3000 TOPS、VLT/VLA/VLM、SDK開放方針を説明。
- 2026公式Singapore発表の算力は2250 TOPSで、2025公式3000 TOPSと矛盾するためconflict。身長、重量、速度、荷重、稼働時間、Wh、充電、IP、温度、安全認証規格は非公開。
- 公式用途はguided tours、shopping guidance、traffic diversion、Baosteelのintelligent manufacturing inspection探索。案内・検査・接客を既存UseCaseへ接続した。
- XPENGの自社工場・店舗での内部利用をdeploymentとして登録。Baosteelへの将来配備や2026年末量産目標は、実導入済みとは扱っていない。

## 活用事例

JSONのusageExamplesは最大3件に制限し、製品発表・研究展示・単なる機能デモを導入事例へ流用していない。

- Digit: GXO RaaS、GXOアトランタ近郊長期商用運用、GXO Flowery Branch 10万トート超（deployment）
- Figure 03: BMW Hall 52での部品sequencing初実演（demonstration）
- Atlas: Hyundai顧客施設のシーケンシングフィールドテスト・配備（deployment）
- Optimus: Tesla施設での電池取扱い自律タスク（deployment/internal-use）
- Phoenix: Canadian Tire/Mark's店舗での110タスク・1週間pilot（pilot、世代未特定）
- Kaleido: 今回は導入事例なし。iREX等の展示実演は除外
- 4NE1: 今回は名前付き導入事例なし
- IRON: XPENG自社工場・店舗での内部利用（deployment）

## UseCase接続とGap

既存UseCaseへの接続候補はJSONにrobotId、officialExpression、evidenceSourceUrl、reasonを記録した。

- Digit → factory-assembly-support / factory-assembly-kit-transport / logistics-devanning
- Figure 03 → factory-assembly-support / factory-assembly-kit-transport
- Atlas → factory-assembly-support / factory-assembly-kit-transport
- Optimus → factory-assembly-support
- Phoenix → factory-assembly-support / factory-assembly-kit-transport / warehouse-picking
- Kaleido → research-development
- 4NE1 → factory-assembly-support / factory-assembly-kit-transport / research-development
- IRON → facility-wayfinding / factory-visual-inspection / customer-reception

USE_CASE_GAPは以下の通り。

    USE_CASE_GAP agility-digit "automated putwall / nesting / AMR loading and unloading" https://www.agilityrobotics.com/content/agility-robotics-announces-new-innovations-for-market-leading-humanoid-robot-digit
    USE_CASE_GAP figure-03 "household tasks like laundry, cleaning, and doing dishes" https://www.figure.ai/figure
    USE_CASE_GAP sanctuary-phoenix "retail store picking, packing, cleaning, tagging, labelling and folding" https://sanctuary.ai/news/sanctuary-ai-deploys-first-humanoid-general-purpose-robot-commercially
    USE_CASE_GAP kawasaki-kaleido "remote operation for hazardous sites and disaster response" https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/
    USE_CASE_GAP neura-4ne-1 "everyday assistance and home routines" https://neura-robotics.com/products/4ne1/

## 価格・調達・日本情報

- Digitは公式RaaS／導入相談を確認したが金額は非公開。Figure 03、Atlas、Phoenix、4NE1、Kaleido、XPENG IRON、Optimusもメーカー公開価格は確認できず、priceOffersは空配列とした。
- 4NE1公式ストアの119€は予約金であり、本体価格として登録していない。
- Atlasは製品版と選定顧客向け2026配備を確認したが、一般在庫・購入価格は未公開。Digitは商用RaaS導入済みだが日本販売とは断定していない。
- 国内正規代理店は、公式ページで確認できた対象機体についてのみ記録する方針とし、本バッチでは該当情報を確認できなかった。問い合わせフォームの存在だけで購入可能・商用提供中とはしていない。

## 主要確認ページ

- [Agility Digit Solutions](https://www.agilityrobotics.com/solutions)
- [Agility Digit innovations](https://www.agilityrobotics.com/content/agility-robotics-announces-new-innovations-for-market-leading-humanoid-robot-digit)
- [Agility GXO agreement](https://www.agilityrobotics.com/content/gxo-signs-industry-first-multi-year-agreement-with-agility-robotics)
- [Figure 03 product page](https://www.figure.ai/figure)
- [Figure 03 introduction](https://www.figure.ai/news/introducing-figure-03)
- [Figure 03 battery](https://www.figure.ai/news/f-03-battery-development)
- [Figure 03 BMW example](https://www.figure.ai/news/f-03-at-bmw)
- [Boston Dynamics Atlas](https://bostondynamics.com/products/atlas/)
- [Atlas official spec sheet](https://bostondynamics.com/wp-content/uploads/2026/01/atlas-spec-sheet.pdf)
- [Atlas product-version announcement](https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/)
- [Tesla AI & Robotics](https://www.tesla.com/AI)
- [Tesla Q2 2024 official IR update](https://ir.tesla.com/_flysystem/s3/sec/000162828024032603/tsla-20240723-gen.pdf)
- [Sanctuary Phoenix Generation 8](https://sanctuary.ai/news/sanctuary-ai-releases-new-generation-of-ai-robots-for-high-quality-data-capture/)
- [Sanctuary Phoenix historical specification](https://sanctuary.ai/news/sanctuary-ai-unveils-phoenix-a-humanoid-general-purpose-robot-designed-for-work/)
- [Sanctuary Canadian Tire deployment](https://sanctuary.ai/news/sanctuary-ai-deploys-first-humanoid-general-purpose-robot-commercially/)
- [Kawasaki Kaleido lineage](https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/)
- [Kawasaki RHP7 article](https://kawasakirobotics.com/in/blog/story_22/)
- [NEURA 4NE1 current page](https://neura-robotics.com/products/4ne1/)
- [NEURA legacy 4NE-1 page](https://neura-robotics.com/products/4ne-1)
- [NEURA 2025 product announcement](https://neura-robotics.com/neura-robotics-launches-technological-revolution/)
- [XPENG Next-Gen IRON announcement](https://www.xpeng.com/pressroom/news/019a56f54fe99a2a0a8d8a0282e402b7)
- [XPENG 2024 AI Day / internal use](https://www.xpeng.com/news/019301d2135392fa562d8a0282200016)

JSON: [DATA-R01-B13-other.json](./DATA-R01-B13-other.json)
