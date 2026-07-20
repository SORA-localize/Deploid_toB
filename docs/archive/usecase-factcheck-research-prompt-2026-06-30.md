# /use-cases ファクトチェック Deep Research 用プロンプト

> **警告（2026-07-01）：このファイルは調査プロンプトの生の抽出物です。**
> usecase-data-scope-cleanup-plan-2026-06-30.md の UCD-002〜008 が実装済みのため、
> このプロンプトが前提にした use case セット・候補ロボット・根拠 URL の一部はすでに除去またはdraft化されています。
> このファイルを実装の根拠や正本として使用しないでください。
> 調査済み・整理済みの正本は `usecase-data-scope-cleanup-plan-2026-06-30.md` の
> editorial decisions（セクション 4）を参照してください。

作成日: 2026-06-30
対象実装: `/use-cases` 一覧・詳細ページ、`data/useCases.ts` の公開用途データ
対象件数: 44件（`publishStatus: published` のみが `lib/data.ts#getUseCases()` から表示される）

## Deep Research に渡す依頼文

以下は Deploid の「用途から探す」ページに現在実装されている全情報です。ヒューマノイドロボットの用途・導入事例・候補ロボット・日本語見出しの妥当性を、一次情報（メーカー公式、公式プレスリリース、顧客公式発表、公的資料）を最優先し、必要に応じて信頼できる報道で補完してファクトチェックしてください。

調査目的:
1. 各用途の説明、成熟度、導入可能性、候補ロボット、根拠URLが現在の公開情報と整合しているか確認する。
2. 候補ロボットの basis が妥当か確認する。特に `deployment` は実導入・PoCの公開事例、`official-use-case` は公式が当該用途または業務領域を明示、`adjacent-deployment` は前世代機・同系統機・近接タスクとして説明可能な場合だけ許容する。
3. 「精密粉体秤量」のように読みにくい、専門的すぎる、または用途名として不自然な日本語タイトルを洗い出し、BtoB読者に伝わる代替表現を提案する。
4. 根拠が薄い用途、誇張に見える説明、ヒューマノイドではなく既存の専用機・協働ロボット・AMR等の方が自然な用途を指摘する。

出力してほしい形式:
- まず総評: 公開継続できる用途、修正すれば公開可能な用途、draftへ戻すべき用途を分類。
- 用途ごとに「判定: OK / 要修正 / 要追加調査 / 非推奨」「問題箇所」「確認した根拠URL」「修正文案」を出す。
- 日本語タイトルについては「現行タイトル」「問題」「推奨タイトル」「理由」を表で出す。特に `精密粉体秤量` は必ず評価する。
- 候補ロボットについては、残す/削除/fit変更/ basis変更/ reason修正を明示する。
- 公式情報が見つからない場合は、推測で補わず「根拠未確認」と書く。
- 2026-06-30時点の情報として、確認日とURLを残す。

## 現行ページ実装仕様

- 一覧ルート: `src/app/use-cases/page.tsx`。タイトルは「用途から探す」。説明文は「産業・現場タスクからヒューマノイドの実適用シーンを探す。実導入事例の有無を明示しています。」
- 一覧は `getUseCases()` で `published` のみ取得する。検索パラメータは `industry`, `task`, `q`。
- 一覧UI: `components/UseCasesBrowser.tsx`。産業チップで `primaryIndustry` を絞り込み、チップのポップオーバー内でタスクを選ぶ。検索は MiniSearch + 日本語 `Intl.Segmenter('ja')`。
- 一覧カード: `components/UseCaseCard.tsx`。表示するのはタイトル、subtitle/summary、成熟度ラベル、実導入事例がある場合の「実導入事例あり」、候補ロボット名最大2件。
- 一覧の並びは成熟度グループ順: 実運用候補 → PoC・実証 → 初期検討。
- 詳細ルート: `src/app/use-cases/[slug]/page.tsx`。表示セクションは「要点」「実際の導入事例（ある場合）」「概要」「なぜ重要か」「導入検討の論点（要点）」「出典」。
- 詳細サイドバー: 候補ロボット、関連記事、導入相談CTA。候補ロボットには `candidateRobots[].reason` と evidence URL が表示される。
- 公開UseCase候補として許可される basis は実装上 `deployment`, `official-use-case`, `adjacent-deployment`。`product-capability`, `market-signal`, `editorial-watch` は公開データには残さない方針。

## データモデル要点

UseCaseの主要フィールド: `id`, `slug`, `title/titleJa`, `subtitle`, `summary`, `maturityLevel`, `buyerReadiness`, `environment`, `requiredCapabilities`, `primaryIndustry`, `industryTags`, `taskTags`, `atAGlance`, `overview`, `whyItMatters`, `capabilityNotes`, `environmentRequirements`, `whyHardToday`, `japanDeploymentConditions`, `candidateRobots`, `sources`。

ラベル:
- maturityLevel: early-stage=初期検討 / pilot-phase=PoC・実証 / production-ready=実運用候補
- buyerReadiness: initial-adoption=初期導入向き / requires-poc=要PoC / limited-today=現時点では限定的
- environment: indoor-controlled=屋内（管理環境） / indoor-semi-controlled=屋内（半管理環境） / outdoor=屋外 / mixed=混在環境 / hazardous=危険環境
- capability: mobility=移動 / manipulation=マニピュレーション / perception=知覚 / autonomy=自律 / communication=コミュニケーション / data-capture=データ取得 / integration=連携
- industry tags: manufacturing=製造 / logistics=物流 / construction=建設・インフラ / agriculture=農業・食品生産 / healthcare=医療・介護 / retail=小売・店舗 / facility-management=施設管理 / research=研究・開発
- task tags: material-handling=搬送・マテハン / picking=ピッキング・仕分け / assembly=組立・加工 / inspection=点検・検査 / patrol=巡回・警備 / cleaning=清掃・衛生管理 / physical-assistance=身体介助・リハビリ / customer-service=接客・案内・配膳 / agricultural-work=農作業・収穫 / hazardous-work=危険作業・インフラ保守 / research-task=研究・実験・検証

## 用語・タイトル優先確認リスト

以下は機械的に抽出した「専門語・読みにくさ・表記揺れが疑われる」タイトルです。このリスト以外も全件確認してください。

| id | 現行タイトル | subtitle |
| --- | --- | --- |
| factory-powder-weighing | 精密粉体秤量 | 医薬品・食品・化学製造での粉体計量・秤量作業をヒューマノイドで自動化する用途。 |
| factory-visual-inspection | 外観品質検査 | 製造ライン上の完成品・部品を、ヒューマノイドが外観撮影・異常検出する用途。 |
| factory-machine-tending | マシンテンディング | CNC・射出成形機など工作機械へのワーク供給・取り出し・操作パネル操作をヒューマノイドで補助する用途。 |
| logistics-devanning | デバンニング | コンテナ・トラック内の混在貨物の取り出し（デバンニング）をヒューマノイドで実施する用途。 |
| logistics-cage-loading | カゴ車積載 | ソーターラインから送られてきた荷物のカゴ台車への積み込みをヒューマノイドで実施する用途。 |
| infrastructure-overhead-wire-maintenance | 架線保守 | 鉄道・電力系統の架線点検・保守作業をヒューマノイドで実施する用途。 |
| agriculture-seedling-transplant | 苗移植 | 農業ハウス・育苗施設での苗の移植・定植作業をヒューマノイドで自動化する用途。 |
| agriculture-fruit-harvest | 果菜収穫 | ハウス内のトマト・イチゴ・パプリカ等の果菜収穫をヒューマノイドで実施する用途。 |
| agriculture-food-sorting | 食材仕分け箱詰め | 収穫後の野菜・果物の選別・等級分け・箱詰め作業をヒューマノイドで自動化する用途。 |
| facility-desk-tidying | 机・棚整理 | オフィス・図書館・会議室での机・棚の整理片付けをヒューマノイドが実施する用途。 |
| research-drug-discovery | 創薬・実験自動化 | 製薬・バイオテクノロジー研究における試薬分注・プレート操作・実験器具操作をヒューマノイドで自動化する用途。 |
| research-hri-study | HRI実験・社会受容研究 | ヒューマノイドと人間の相互作用（HRI）・社会的受容性を研究するための実験環境としての用途。 |

## 全UseCase実装データ

### 倉庫内トート・軽量搬送 (warehouse-picking)

- slug: warehouse-tote-material-handling
- publishStatus: published
- updatedAt: 2026-06-28
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Warehouse Tote and Material Handling
- titleJa: 倉庫内トート・軽量搬送
- subtitle: 既存倉庫のトート回収や軽量搬送を、どこまでヒューマノイドで補助できるかを見る用途。
- summary: 軽量物の搬送、トート回収、棚前周辺作業を対象にしたPoC候補。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)、連携 (integration)
- primaryIndustry: 物流 (logistics)
- industryTags: 物流 (logistics)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 軽量物、標準容器、トート回収、明るい屋内、作業エリアを分けられる現場。
- atAGlance.whereDoesNotFit: 高速ピッキング、重量物、不定形物、人と密に混在する狭い動線。
- atAGlance.mustBeTrue: 対象物と動線を標準化でき、失敗時に人が介入できる運用体制がある。
- overview: 倉庫内トート・軽量搬送は人手不足の影響が大きく、既存設備を大きく変えずに試せる可能性がある。ただし、公開根拠上は高速ピッキングそのものではなく、周辺の搬送・回収作業として扱う。
- whyItMatters: 日本の物流現場では、自動化投資と既存レイアウト制約の両立が重要になる。
- capabilityNotes.mobility: 平坦な床面と十分な通路幅が必要。
- capabilityNotes.manipulation: 軽量物と標準容器から始めるのが現実的。
- capabilityNotes.perception: 棚、対象物、作業者の認識精度が評価対象。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: WMSや作業指示との接続はPoC範囲を限定する。
- environmentRequirements: 平坦な床、通信環境、充電スペース、作業エリア分離、緊急停止手順。
- whyHardToday: 作業速度、把持精度、例外処理、バッテリー稼働時間が制約になりやすい。
- japanDeploymentConditions: 労働安全、現場オペレーション、国内保守、夜間対応の確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (7件):
- Agility Digit、GXOの倉庫で10万トート搬送達成（商用 RaaS の先行事例） [gxo-digit-100k-totes] | /reports/gxo-digit-100k-totes | publishedAt=2026-05-28
- JAL、羽田空港で国内初のヒューマノイド実証開始——Unitree G1 が地上業務に投入 [jal-haneda-unitree-pilot-2026] | /reports/jal-haneda-unitree-pilot-2026 | publishedAt=2026-06-13
- RobotEraの Xingdong M7 が中国郵政で1,200個/時を達成──同条件の人間は1,392個。「効率85%」の現実と意味 [robotera-china-post-logistics-june2026] | /reports/robotera-china-post-logistics-june2026 | publishedAt=2026-06-12
- Genesis AI、人型を捨てた「汎用ロボット」Enoを発表──Eric Schmidtが支援 [genesis-ai-eno-non-humanoid-2026] | /reports/genesis-ai-eno-non-humanoid-2026 | publishedAt=2026-06-19
- NVIDIA、ロボット安全システム「Halos for Robotics」を発表--Agility Digitの産業導入で安全・認証が前面に [nvidia-halos-robotics-safety-2026] | /reports/nvidia-halos-robotics-safety-2026 | publishedAt=2026-06-23
- Robot.com、職場向けヒューマノイド「R-noid」を展開--配達ロボットの運用経験を倉庫・店舗作業へ [robot-com-rnoid-workplace-humanoid-2026] | /reports/robot-com-rnoid-workplace-humanoid-2026 | publishedAt=2026-06-23
- Pudu Robotics、24時間稼働を狙う車輪型の産業用半人型ロボット「D7」を発表 [pudu-d7-industrial-semi-humanoid-2026] | /reports/pudu-d7-industrial-semi-humanoid-2026 | publishedAt=2026-06-25

候補ロボット (1件):
- Agility Robotics Digit [agility-digit] | fit=possible | basis=official-use-case | reason=公式ページで倉庫自動化への接続、物流・流通、トート搬送用途が明示されている。ただし個別導入URLは現行確認できないためdeployment扱いにはしない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.agilityrobotics.com/solutions

Sources (1件):
- Agility Robotics solutions | Agility Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=Digit が既存倉庫自動化に接続し、物流・流通・トート搬送に使われる公式根拠。Amazon/GXOの個別導入URLは2026-06-26時点で再確認できなかったため、deployment根拠から外した。 | https://www.agilityrobotics.com/solutions

### 工場巡回点検 (factory-inspection)

- slug: factory-inspection
- publishStatus: draft
- updatedAt: 2026-06-28
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Factory Inspection
- titleJa: 工場巡回点検
- subtitle: なし
- summary: 定型ルートの巡回、画像記録、異常検知を対象にした用途。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、知覚 (perception)、データ取得 (data-capture)
- primaryIndustry: 製造 (manufacturing)
- industryTags: 製造 (manufacturing)
- taskTags: 点検・検査 (inspection)、巡回・警備 (patrol)
- atAGlance.whereFits: 巡回ルートが明確で、記録と通知が主目的の現場。
- atAGlance.whereDoesNotFit: 複雑な設備操作、即時判断、屋外悪天候環境。
- atAGlance.mustBeTrue: 人間による確認フローと異常時の停止/退避手順がある。
- overview: 熟練作業員の減少により、点検品質の標準化と記録自動化のニーズがある。
- whyItMatters: 暗黙知に依存した点検を、画像・ログ・通知の形で残しやすくなる。
- capabilityNotes.mobility: 段差、階段、狭い通路の有無で難易度が大きく変わる。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: 計器読み取りや異常検知は対象設備ごとに評価が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 通信環境、充電位置、巡回ルート、作業時間帯の分離。
- whyHardToday: 複雑な現場での自律移動、微細な異常検知、長時間稼働が課題。
- japanDeploymentConditions: 設備管理ルール、データ管理、保守対応、労働安全の整理が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- UBTECH Robotics Walker S2 [ubtech-walker-s2] | fit=possible | basis=product-capability | reason=24/7稼働対応など工場運用向けの位置付けは確認できるが、巡回・点検タスクそのものでの実証は確認できていない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.ubtrobot.com/en/humanoid/products/walker-s2

Sources (1件):
- UBTECH Walker S2 official page | UBTECH Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=Walker S2 の産業向け機能と24/7稼働対応の裏取り。巡回・点検タスクそのものの直接根拠ではないため公開用途からは外す。 | https://www.ubtrobot.com/en/humanoid/products/walker-s2

### 研究開発 (research-development)

- slug: research-development
- publishStatus: published
- updatedAt: 2026-06-28
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Research and Development
- titleJa: 研究開発
- subtitle: なし
- summary: 大学・研究機関・企業R&Dで、制御、操作、HRI、AI統合を検証する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、連携 (integration)
- primaryIndustry: 研究・開発 (research)
- industryTags: 研究・開発 (research)
- taskTags: 研究・実験・検証 (research-task)
- atAGlance.whereFits: 研究室、教育機関、企業R&Dの検証環境。
- atAGlance.whereDoesNotFit: 安全認証や高稼働率が必要な本番現場。
- atAGlance.mustBeTrue: メンテナンス担当者と実験環境が用意できる。
- overview: 研究開発用途では、性能限界やSDK、拡張性、保守のしやすさが主要な評価軸になる。
- whyItMatters: 本番用途より先に、国内で実機知見を蓄積する入口になりやすい。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: SDK、API、ログ取得、開発者コミュニティの確認が重要。
- environmentRequirements: 安全に試験できるスペース、技術者、保守予算。
- whyHardToday: 研究目的と機体性能のミスマッチ、故障時の復旧、部品供給が課題。
- japanDeploymentConditions: 輸入、保守、技適、研究室内安全ルールを確認する。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (7件):
- NVIDIAとUnitreeがIsaac GR00Tリファレンス機を発表──世界初のオープン全スタックヒューマノイドプラットフォーム [nvidia-gr00t-unitree-h2plus-june2026] | /reports/nvidia-gr00t-unitree-h2plus-june2026 | publishedAt=2026-06-02
- 電動AtlasがHyundai RMAC（検証センター）に初投入──2026年生産分はHyundai・Google DeepMindで完売 [boston-dynamics-atlas-hyundai-rmac-june2026] | /reports/boston-dynamics-atlas-hyundai-rmac-june2026 | publishedAt=2026-06-07
- Google DeepMindの「Gemini Robotics」が基盤モデルAIをヒューマノイドに統合──Atlas・Apollo・Agility Digitが対象 [deepmind-gemini-robotics-ces2026] | /reports/deepmind-gemini-robotics-ces2026 | publishedAt=2026-06-15
- Unitree、量産ヒューマノイド「R1」シリーズを4,900〜5,900ドルで体系化──海外販売チャネルも拡大 [unitree-r1-global-lineup-2026] | /reports/unitree-r1-global-lineup-2026 | publishedAt=2026-06-19
- Genesis AI、人型を捨てた「汎用ロボット」Enoを発表──Eric Schmidtが支援 [genesis-ai-eno-non-humanoid-2026] | /reports/genesis-ai-eno-non-humanoid-2026 | publishedAt=2026-06-19
- 日本企業4社のコンソーシアム「J-HRTI」、最大50台のヒューマノイドが稼働するデータ収集拠点を7月に千葉で開業 [j-hrti-chiba-data-center-2026] | /reports/j-hrti-chiba-data-center-2026 | publishedAt=2026-06-19
- IO-AIの遠隔操作デモが示す、ヒューマノイド学習データ工場としての深圳 [io-ai-teleoperation-training-shenzhen-2026] | /reports/io-ai-teleoperation-training-shenzhen-2026 | publishedAt=2026-06-23

候補ロボット (3件):
- PAL Robotics TALOS [pal-talos] | fit=possible | basis=official-use-case | reason=公式ページで研究向けプラットフォームとして明示されている。ただし特定研究機関への導入事例は現行確認できていない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://pal-robotics.com/robot/talos/
- Unitree Robotics G1 [unitree-g1] | fit=possible | basis=official-use-case | reason=公式ページで教育向け位置付け、AI/学習、開発リソースが示されている。ただし特定研究機関への導入事例は未確認。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.unitree.com/g1/
- Booster Robotics T1 [booster-t1] | fit=possible | basis=official-use-case | reason=公式ページで開発者・研究者・競技向けの機体として明示されている。ただし実証事例はまだ確認できていない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.booster.tech/booster-t1/

Sources (3件):
- TALOS – PAL Robotics | PAL Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=TALOS が研究向けプラットフォームとして明示されている公式根拠。Waterloo RoboHub導入はこの出典だけでは確認できないため、deployment根拠から外した。 | https://pal-robotics.com/robot/talos/
- Unitree G1 official page | Unitree Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=G1 の研究・教育向け製品能力の裏取り。 | https://www.unitree.com/g1/
- Booster Robotics T1 product page | Booster Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=T1 の研究・競技向け製品能力の裏取り。 | https://www.booster.tech/booster-t1/

### 展示・デモ (demo-exhibition)

- slug: demo-exhibition
- publishStatus: draft
- updatedAt: 2026-06-28
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Demo and Exhibition
- titleJa: 展示・デモ
- subtitle: なし
- summary: 展示会、施設案内、社内デモでヒューマノイドの認知と検証を行う用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: コミュニケーション (communication)、移動 (mobility)
- primaryIndustry: 施設管理 (facility-management)
- industryTags: 施設管理 (facility-management)
- taskTags: 接客・案内・配膳 (customer-service)
- atAGlance.whereFits: 短時間稼働、来場者導線を制御できる展示環境。
- atAGlance.whereDoesNotFit: 無人長時間運用、混雑環境での自由移動。
- atAGlance.mustBeTrue: スタッフが常時監視し、停止手順を持つ。
- overview: デモ用途は導入ハードルが低い一方、過度な期待を生みやすい。
- whyItMatters: 本番導入前に社内外の理解を得るための入口になる。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: 来場者対応は定型シナリオから始める。
- capabilityNotes.integration: なし
- environmentRequirements: 通信、充電、監視スタッフ、安全動線。
- whyHardToday: 非定型会話、混雑時の安全確保、安定稼働が課題。
- japanDeploymentConditions: イベント会場の安全ルールと保険条件を確認する。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (2件):
- Unitree Robotics R1 AIR [unitree-r1] | fit=possible | basis=product-capability | reason=低価格・宙返り等の高い運動性能で展示・デモ向けの注目度は高いが、特定の展示導入事例は未確認。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.unitree.com/R1/
- Booster Robotics K1 [booster-k1] | fit=watch | basis=product-capability | reason=小型・低価格機として参考段階。展示・デモでの実証事例は確認できていない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.booster.tech/booster-k1/

Sources (2件):
- Unitree R1 | Unitree Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=R1 / R1 AIR の価格帯・運動性能・量産構成の裏取り。展示・デモ用途そのものの直接根拠ではないため公開用途からは外す。 | https://www.unitree.com/R1/
- Booster K1 | Booster Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=K1 の教育・AI開発向け製品能力の裏取り。展示・デモ用途そのものの直接根拠ではないため公開用途からは外す。 | https://www.booster.tech/booster-k1/

### 受付・接客対応 (customer-reception)

- slug: customer-reception
- publishStatus: published
- updatedAt: 2026-06-28
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Customer Reception and Guidance
- titleJa: 受付・接客対応
- subtitle: 受付・案内・接客対応を、定型シナリオの範囲でヒューマノイドに任せられるかを見る用途。
- summary: 受付ロビーや商業施設での来場者対応・案内を対象にしたPoC候補。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、コミュニケーション (communication)、知覚 (perception)
- primaryIndustry: 小売・店舗 (retail)
- industryTags: 小売・店舗 (retail)
- taskTags: 接客・案内・配膳 (customer-service)
- atAGlance.whereFits: 受付ロビー、商業施設の案内カウンター、来場者の対応ルートが決まっている屋内空間。
- atAGlance.whereDoesNotFit: 非定型な接客交渉、クレーム対応、混雑時の自由な人混み移動。
- atAGlance.mustBeTrue: 対話シナリオを事前設計でき、対応範囲を超えたら即座に人にエスカレーションできる体制がある。
- overview: 受付・案内向けロボットは量産が進んでいる領域で、AgiBot A2のように既に商用展開されている機体がある一方、対話の自然さや稼働の安定性は機体ごとに差が大きい。
- whyItMatters: 人手不足が深刻な接客・案内業務において、定型的な案内や来場者対応を補助できれば、スタッフを非定型業務に集中させられる可能性がある。
- capabilityNotes.mobility: 受付エリア内の限定的な移動が前提で、自由な人混み移動を想定した設計ではない。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: 来場者の検知・追従は人数や照明条件で精度が変わる。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: 多言語対応や音声認識の精度は機体・現場の言語環境によって差が大きく、PoCでの実地確認が必要。
- capabilityNotes.integration: なし
- environmentRequirements: 受付カウンターまたは案内エリアの設置スペース、Wi-Fi/通信環境、充電スペース、緊急時にスタッフが即時対応できる配置。
- whyHardToday: 非定型な質問対応、クレーム時のエスカレーション判断、長時間稼働時の応答品質維持が課題（可搬重量・応答速度は機体により非公表）。
- japanDeploymentConditions: 日本語対話の精度、設置施設の防犯・接客ガイドラインとの整合、機体の代理店・保守体制（要確認）を確認する必要がある。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (1件):
- Robot.com、職場向けヒューマノイド「R-noid」を展開--配達ロボットの運用経験を倉庫・店舗作業へ [robot-com-rnoid-workplace-humanoid-2026] | /reports/robot-com-rnoid-workplace-humanoid-2026 | publishedAt=2026-06-23

候補ロボット (1件):
- AgiBot A2 [agibot-a2] | fit=possible | basis=official-use-case | reason=マーケティング・受付・案内向けに量産・商用展開されている機体（公式に確認済み）だが、特定施設での導入事例（deployments.ts）はまだ確認できていない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://agibot.com/jp/products/A2

Sources (1件):
- AgiBot A2 公式ページ | AgiBot | reliability=official/公式情報 | checkedAt=2026-06-28 | note=A2 がマーケティング、カスタマーサービス、商業施設案内、フロント受付に適することの公式根拠。 | https://agibot.com/jp/products/A2

### 店舗棚補充・売場対応 (retail-shelf-stocking)

- slug: retail-shelf-stocking
- publishStatus: draft
- updatedAt: 2026-06-26
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Retail Shelf Stocking
- titleJa: 店舗棚補充・売場対応
- subtitle: 低価格機を使い、店舗の棚補充や売場での簡易対応をどこまで任せられるかを見る用途。
- summary: 軽量商品の棚補充や売場対応を対象にした、低価格機での実証候補。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 小売・店舗 (retail)
- industryTags: 小売・店舗 (retail)
- taskTags: ピッキング・仕分け (picking)、接客・案内・配膳 (customer-service)
- atAGlance.whereFits: 低価格機での実証を前提にした、軽量商品の補充・陳列確認・売場での簡易対応。
- atAGlance.whereDoesNotFit: 重量物の棚入れ、繁忙時間帯のレジ・接客の主担当、狭い通路でのすれ違い移動。
- atAGlance.mustBeTrue: 対象商品を軽量・標準形状に絞り、低ペイロード機での実証であることを前提に予算とKPIを設定できる。
- overview: Unitree R1 / R1 AIRのような量産済みの低価格機を使い、店舗棚補充や売場での簡易な接客対応を小規模に試す用途。価格と国内入手性の高さが、他の用途より早く実証段階に入れる要因になっている。
- whyItMatters: 小売現場の人手不足は深刻だが、ヒューマノイドの導入予算を確保しづらい業態でもある。低価格機での実証実績が蓄積されれば、投資判断のハードルが下がる可能性がある。
- capabilityNotes.mobility: 店舗の通路幅・床材・段差の有無が稼働可否を左右する。
- capabilityNotes.manipulation: R1 / R1 AIRは低ペイロード機のため、軽量・小型商品の取り扱いに限定される。
- capabilityNotes.perception: 商品棚の認識精度や欠品検知の実用性は現場検証が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 充電スペース、通路幅の確保、稼働時間帯の制限（営業時間内か否か）、緊急停止の運用ルール。
- whyHardToday: 低ペイロードで対応商品が限られ、レジ・接客対応との役割分担や長時間稼働時の安定性は未検証。
- japanDeploymentConditions: 国内代理店経由での調達は可能だが、店舗運用ルール・保険・労働安全衛生上の扱いは個別に確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (3件):
- Sanctuary AI Phoenix [sanctuary-phoenix] | fit=watch | basis=editorial-watch | reason=小売店舗での導入事例として扱っていた出典URLが現行確認できないため、置換出典が見つかるまで調査待ち。 | evidenceDeploymentIds=なし | evidenceSourceUrls=なし
- Unitree Robotics R1 AIR [unitree-r1] | fit=possible | basis=product-capability | reason=量産済みの低価格機で国内入手性も高いが、小売棚補充そのものの実証事例は未確認。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.unitree.com/R1/
- Unitree Robotics R1 [unitree-r1-standard] | fit=possible | basis=product-capability | reason=R1 AIRと同系統の標準構成機。小売棚補充での実証事例は未確認。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.unitree.com/R1/

Sources (2件):
- Unitree R1 | Unitree Robotics | reliability=official/公式情報 | checkedAt=2026-06-21 | note=R1 / R1 AIRの量産・価格帯の裏取り。 | https://www.unitree.com/R1/
- Sanctuary AI completes first commercial deployment | Sanctuary AI | reliability=official/公式情報 | checkedAt=2026-06-22 | publishedAt=2023-05-16 | note=2026-06-26時点で現行URLは404。置換できる一次/信頼報道を確認するまで公開面から外す。 | https://www.sanctuary.ai/news/sanctuary-ai-successfully-completes-first-commercial-deployment/

### 介護・身体介助 (care-physical-assistance)

- slug: care-physical-assistance
- publishStatus: draft
- updatedAt: 2026-06-28
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Care and Physical Assistance
- titleJa: 介護・身体介助
- subtitle: 介護・リハビリ施設内での移乗補助や見守りを、スタッフ同伴のPoCとして検証する用途。
- summary: 身体介助・見守りを対象にした、介護現場でのPoC候補。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、移動 (mobility)、知覚 (perception)
- primaryIndustry: 医療・介護 (healthcare)
- industryTags: 医療・介護 (healthcare)
- taskTags: 身体介助・リハビリ (physical-assistance)
- atAGlance.whereFits: 介護施設・リハビリ施設内での移乗補助・見守り・対話を、スタッフ同伴のPoCとして試す環境。
- atAGlance.whereDoesNotFit: 単独での身体介助の本番運用、緊急時の即時対応が必須な現場、夜間の無人対応。
- atAGlance.mustBeTrue: 介助行為は医療・介護スタッフの監督下で行い、機体の限界（可搬重量・稼働時間）を事前に共有できる。
- overview: Fourier GR-3はリハビリ外骨格の技術を転用した介護向けコンセプト機として明示的に展開されており、GR-2も同社のリハビリ実績を背景に高い関節自由度を持つ。いずれも介護施設でのPoCを想定した位置づけ。
- whyItMatters: 介護人材の不足は構造的な課題であり、身体的負荷の高い業務を補助できる可能性がある分野として注目されている。一方で安全性と信頼性の要求水準は他用途より高い。
- capabilityNotes.mobility: 施設内の床材・段差・ベッド周りの狭い動線への対応が必要。
- capabilityNotes.manipulation: 移乗補助などの身体接触を伴う動作は、可搬重量・グリップ精度の実証データが限定的。
- capabilityNotes.perception: 利用者の状態（姿勢・体調変化）を検知する精度は現場検証の対象。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 医療・介護スタッフの同伴、緊急停止手順、充電・保管スペース、利用者・家族への説明と同意プロセス。
- whyHardToday: 身体接触を伴う介助の安全性証明、故障時のフォールバック手順が未整理（国内は価格・保守体制とも問い合わせ制）。
- japanDeploymentConditions: 介護保険制度上の扱い、医療機器に該当するかの整理、施設の安全管理規程との整合、機体の国内代理店・保守体制（要確認）を確認する必要がある。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Fourier Intelligence GR-3 [fourier-gr3] | fit=possible | basis=official-use-case | reason=介護向け「Care-bot」として公式に明示展開されているが、実際の介護施設への導入事例は未確認。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.prnewswire.com/news-releases/fourier-makes-ces-debut-with-gr-3-a-next-generation-care-focused-humanoid-robot-302654565.html

Sources (1件):
- Fourier Makes CES Debut With GR-3, a Next-Generation Care-Focused Humanoid Robot | Fourier Intelligence | reliability=official/公式情報 | checkedAt=2026-06-28 | note=GR-3がcare-focused / companion向けとして明示されている根拠。移乗補助・身体介助を公開用途として支える直接根拠ではないため公開用途からは外す。 | https://www.prnewswire.com/news-releases/fourier-makes-ces-debut-with-gr-3-a-next-generation-care-focused-humanoid-robot-302654565.html

### 工場内搬送・組立支援 (factory-assembly-support)

- slug: factory-assembly-support
- publishStatus: published
- updatedAt: 2026-06-28
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Factory Assembly and Material Handling Support
- titleJa: 工場内搬送・組立支援
- subtitle: 自動車工場を中心に、部品搬送や組立補助の実証・量産導入が最も集中している用途。
- summary: 完成車工場・部品工場での部品搬送、組立キット運搬、外観検査補助を対象にした用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 製造 (manufacturing)
- industryTags: 製造 (manufacturing)
- taskTags: 組立・加工 (assembly)、搬送・マテハン (material-handling)
- atAGlance.whereFits: 自動車・電子機器等の組立ラインで、部品搬送・組立キット運搬・簡易な組立補助を行う、動線が決まった工場内環境。
- atAGlance.whereDoesNotFit: 高精度・高速なライン作業の本体工程、人手と同等以上の作業速度が必須な工程。
- atAGlance.mustBeTrue: 対象工程を部品搬送・補助作業に絞り、既存の生産ラインと並走させながら段階的に検証できる体制がある。
- overview: 工場内搬送・組立支援は、ヒューマノイドの実証・量産導入が他の用途より集中している領域で、BMW・Mercedes-Benz・Renault などの公開事例が確認できる。Renaultドゥエー工場のWandercraft CALVIN-40は350台規模の量産導入報道があり、現時点で確認できる中で最も成熟した事例。
- whyItMatters: 自動車工場という単一業種に複数メーカーの実証が集中していることは、この用途が現時点で投資対効果を見込みやすい領域であることを示す。日本の製造業が最初に参照しやすいベンチマークになる。
- capabilityNotes.mobility: 工場内の決められた動線が前提で、自由な人混み移動は想定しない。
- capabilityNotes.manipulation: 部品・組立キットの把持精度は機種差が大きく、軽量・標準形状の対象物に絞った実証が中心。
- capabilityNotes.perception: 外観検査補助では対象設備ごとに検知精度の実地確認が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 生産ラインと並走できる動線設計、充電・保管スペース、既存設備との通信・連携環境。
- whyHardToday: 人手と同等の作業速度・精度の証明、既存ラインの安全規格との整合、長時間稼働時の安定性が課題。詳しい判断基準は意思決定変数の地図を参照。
- japanDeploymentConditions: 国内自動車・電子機器メーカーでの公開実証はまだ確認できておらず、価格・保守体制は機種ごとに要確認。

実装上この用途に紐づく導入事例 (3件):
- BMW Group / Plant Spartanburg (USA) | status=pilot/実証・PoC中 | robot=Figure AI Figure 02 [figure-02] | summary=BMW スパルタンバーグ工場での Figure 02 の実証導入。車体製造ラインでの部品供給作業を検証。 | source=https://www.press.bmwgroup.com/global/article/detail/T0444265EN/successful-test-of-humanoid-robots-at-bmw-group-plant-spartanburg
- Mercedes-Benz / Mercedes-Benz manufacturing facilities (Germany) | status=pilot/実証・PoC中 | robot=Apptronik Apollo [apptronik-apollo] | summary=Mercedes-Benz の製造施設での Apollo 実証。組立キット搬送や部品検査などの製造補助用途を検証。 | source=https://apptronik.com/news-collection/apptronik-and-mercedes-benz-enter-commercial-agreement
- Renault Group / Renault Douai EV factory (France) | status=production/本番運用中 | robot=Wandercraft CALVIN-40 [wandercraft-calvin] | summary=Renault ドゥエー工場での CALVIN-40 の量産導入。タイヤ搬送・重量物物流に特化して350台規模で展開。 | source=https://www.wandercraft.eu/articles/renault-group-finalises-a-strategic-partnership-with-wandercraft

関連記事 (5件):
- Figure 02 が BMW Spartanburg で11ヶ月実証を完了、日本企業の読み筋 [bmw-figure-deployment] | /reports/bmw-figure-deployment | publishedAt=2026-05-28
- 電動AtlasがHyundai RMAC（検証センター）に初投入──2026年生産分はHyundai・Google DeepMindで完売 [boston-dynamics-atlas-hyundai-rmac-june2026] | /reports/boston-dynamics-atlas-hyundai-rmac-june2026 | publishedAt=2026-06-07
- テスラ、フリーモント工場のModel S/X生産ラインをOptimus Gen 3製造に転換──工場内にすでに1,000台超稼働 [tesla-optimus-gen3-fremont-2026] | /reports/tesla-optimus-gen3-fremont-2026 | publishedAt=2026-06-15
- NVIDIA、ロボット安全システム「Halos for Robotics」を発表--Agility Digitの産業導入で安全・認証が前面に [nvidia-halos-robotics-safety-2026] | /reports/nvidia-halos-robotics-safety-2026 | publishedAt=2026-06-23
- IO-AIの遠隔操作デモが示す、ヒューマノイド学習データ工場としての深圳 [io-ai-teleoperation-training-shenzhen-2026] | /reports/io-ai-teleoperation-training-shenzhen-2026 | publishedAt=2026-06-23

候補ロボット (4件):
- Apptronik Apollo [apptronik-apollo] | fit=strong | basis=deployment | reason=Mercedes-Benz manufacturing facilities で、組立キット搬送や部品検査を含む製造補助用途の実証が公式に確認できる。 | evidenceDeploymentIds=apptronik-mercedes-berlin: Mercedes-Benz / Mercedes-Benz manufacturing facilities | evidenceSourceUrls=なし
- Wandercraft CALVIN-40 [wandercraft-calvin] | fit=strong | basis=deployment | reason=Renaultドゥエー工場でタイヤ搬送に特化して稼働中。350台規模の量産導入が進む、現時点で最も成熟した事例。 | evidenceDeploymentIds=wandercraft-renault-douai: Renault Group / Renault Douai EV factory | evidenceSourceUrls=なし
- UBTECH Robotics Walker S1 [ubtech-walker-s1] | fit=possible | basis=official-use-case | reason=公式ページで車両製造ラインへの投入とスマート製造向けの位置付けが示されている。ただしNIO導入URLは現行確認できないためdeployment扱いにはしない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.ubtrobot.com/en/humanoid/products/walker-s1
- Figure AI Figure 03 [figure-03] | fit=possible | basis=adjacent-deployment | reason=前身機Figure 02がBMWスパルタンバーグ工場で実証を完了したが、Figure 03自体の工場導入事例はまだ確認できていない。 | evidenceDeploymentIds=figure-bmw-spartanburg: BMW Group / Plant Spartanburg | evidenceSourceUrls=なし

Sources (5件):
- Renault Group finalises a strategic partnership with Wandercraft | Wandercraft | reliability=official/公式情報 | checkedAt=2026-06-22 | note=パートナーシップの一次情報。「350台」の具体的な数字はこの記事には記載が無く、下のRobotics and Automation News記事のみが裏付ける。 | https://www.wandercraft.eu/articles/renault-group-finalises-a-strategic-partnership-with-wandercraft
- Renault reportedly planning to deploy 350 humanoid robots in manufacturing push | Robotics and Automation News | reliability=reported/報道/調査 | checkedAt=2026-06-22 | publishedAt=2026-03-23 | note=Renaultドゥエー工場でのCALVIN-40量産導入規模（350台）の裏取り（最も成熟した事例として overview で引用）。 | https://roboticsandautomationnews.com/2026/03/23/renault-reportedly-planning-to-deploy-350-humanoid-robots-in-manufacturing-push/100050/
- Successful test of humanoid robots at BMW Group Plant Spartanburg | BMW Group | reliability=official/公式情報 | checkedAt=2026-06-22 | note=元URL（T0444321EN）が別記事（BMW M5 Touring）を指していたため修正。 | https://www.press.bmwgroup.com/global/article/detail/T0444265EN/successful-test-of-humanoid-robots-at-bmw-group-plant-spartanburg
- Apptronik and Mercedes-Benz Enter Commercial Agreement | Apptronik | reliability=official/公式情報 | checkedAt=2026-06-26 | publishedAt=2024-03-15 | note=Mercedes-Benz manufacturing facilities での Apollo 実証と、assembly kits / component inspection の裏取り。 | https://apptronik.com/news-collection/apptronik-and-mercedes-benz-enter-commercial-agreement
- UBTECH Walker S1 official page | UBTECH Robotics | reliability=official/公式情報 | checkedAt=2026-06-28 | note=Walker S1 が車両製造ラインを含む工場向け用途に投入されていることの公式根拠。NIO導入URLは2026-06-26時点で再確認できなかったため、deployment根拠から外した。 | https://www.ubtrobot.com/en/humanoid/products/walker-s1

### 板金部品供給 (factory-sheet-metal-supply)

- slug: factory-sheet-metal-supply
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Factory Sheet Metal Supply
- titleJa: 板金部品供給
- subtitle: 板金プレス工程やスタンピングラインへの部品投入・取り出しをヒューマノイドで補助する用途。
- summary: 板金プレス工程やスタンピングラインへの部品投入・取り出しをヒューマノイドで補助する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 製造 (manufacturing)
- industryTags: 製造 (manufacturing)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 板金・プレス工程周辺の部品搬送・投入。繰り返しルートが明確な現場。
- atAGlance.whereDoesNotFit: 高速プレスラインの本体工程。精密位置決めが必要なインサートタスク。
- atAGlance.mustBeTrue: 安全柵またはコボット運用が確立でき、ロボットの動作領域を制限できる。
- overview: BMW等の大手自動車メーカーがFigure系ヒューマノイドを製造ライン補助に試験投入している流れがある。板金供給は繰り返し性が高く、ヒューマノイドのPoC候補として注目される。
- whyItMatters: 板金ラインの省人化は安全性向上と人件費削減の両面で課題が大きい。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: ハンドの強度・グリップ力が板金サイズに依存する。
- capabilityNotes.perception: 金属反射によるカメラ認識の誤動作リスクあり。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 安全柵、明確な部品置き場、充電スペース。
- whyHardToday: 把持精度と荷重耐性のバランス、金属面のセンシング誤認識が課題。
- japanDeploymentConditions: 労働安全衛生規則対応、設備側の安全連動、国内保守体制の確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (2件):
- Figure AI Figure 02 [figure-02] | fit=possible | basis=adjacent-deployment | reason=BMWスパルタンバーグ工場での製造ライン補助実証実績。板金供給は近接タスク。 | evidenceDeploymentIds=figure-bmw-spartanburg: BMW Group / Plant Spartanburg | evidenceSourceUrls=なし
- UBTECH Robotics Walker S [ubtech-walker-s] | fit=possible | basis=official-use-case | reason=UBTECHが製造ライン補助向け公式ソリューションとして訴求している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.ubtrobot.com/en/humanoid/products/walker-s

Sources (2件):
- Figure AI x BMW partnership announcement | Figure AI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.figure.ai/
- UBTECH Walker S official page | UBTECH Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.ubtrobot.com/en/humanoid/products/walker-s

### アセンブリキット搬送 (factory-assembly-kit-transport)

- slug: factory-assembly-kit-transport
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Factory Assembly Kit Transport
- titleJa: アセンブリキット搬送
- subtitle: 製造ラインへの部品キット・ワゴン搬送をヒューマノイドで代替する用途。
- summary: 製造ラインへの部品キット・ワゴン搬送をヒューマノイドで代替する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、自律 (autonomy)、連携 (integration)
- primaryIndustry: 製造 (manufacturing)
- industryTags: 製造 (manufacturing)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 繰り返し搬送ルート・明確な置き場がある組立ライン周辺。
- atAGlance.whereDoesNotFit: 高速・多品種・不定形部品のピッキングが必要な工程。
- atAGlance.mustBeTrue: 搬送ルートを人との動線から分離でき、キット置き場を標準化できる。
- overview: UBTECH Walker S1はNIO等の自動車工場での組立ライン搬送補助を公式ユースケースとして打ち出している。量産体制にあり、アセンブリキット搬送は最も成熟した製造ユースケースの一つ。
- whyItMatters: 部品搬送工程の人手依存度を下げることで、ライン設計の柔軟性が高まる。
- capabilityNotes.mobility: 床面の平坦性と通路幅の確保が前提。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: MES/ERPとの連動で搬送タイミングの最適化が必要。
- environmentRequirements: 整備された床面、WMS/MES連携環境、充電ステーション。
- whyHardToday: 動的な人との混在動線での安全確保、例外対応（キット不足等）の自動化が課題。
- japanDeploymentConditions: 国内自動車工場でのPoC実績確認、安全基準（ISO 10218等）適合が前提。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (2件):
- UBTECH Robotics Walker S [ubtech-walker-s] | fit=possible | basis=official-use-case | reason=製造ライン向け搬送タスクを公式ユースケースに掲載。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.ubtrobot.com/en/humanoid/products/walker-s
- UBTECH Robotics Walker S1 [ubtech-walker-s1] | fit=possible | basis=official-use-case | reason=NIO工場等の自動車製造ラインへの投入が公式に示されている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.ubtrobot.com/en/humanoid/products/walker-s1

Sources (2件):
- UBTECH Walker S official page | UBTECH Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.ubtrobot.com/en/humanoid/products/walker-s
- UBTECH Walker S1 official page | UBTECH Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.ubtrobot.com/en/humanoid/products/walker-s1

### 精密粉体秤量 (factory-powder-weighing)

- slug: factory-powder-weighing
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Factory Powder Weighing
- titleJa: 精密粉体秤量
- subtitle: 医薬品・食品・化学製造での粉体計量・秤量作業をヒューマノイドで自動化する用途。
- summary: 医薬品・食品・化学製造での粉体計量・秤量作業をヒューマノイドで自動化する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、知覚 (perception)、連携 (integration)
- primaryIndustry: 製造 (manufacturing)
- industryTags: 製造 (manufacturing)
- taskTags: 組立・加工 (assembly)
- atAGlance.whereFits: 繰り返し精度が求められる粉体秤量・配合作業。医薬品・化学品・食品ライン。
- atAGlance.whereDoesNotFit: 超微量（mgオーダー以下）の高精度計量、クリーンルーム内の特殊管理工程。
- atAGlance.mustBeTrue: 作業台・容器・秤の配置を標準化でき、ロボットのティーチングが可能な環境。
- overview: NEXTAGE（川崎ロボティクス）は精密秤量・配合など繰り返し作業への実績が豊富。医薬品・化粧品・食品製造での自動化導入実績あり。
- whyItMatters: 危険・有害物質の取り扱いリスクと計量ばらつきを同時に低減できる。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 微細な把持力制御が必要。スケールの読み取り精度も課題。
- capabilityNotes.perception: 容器の位置・姿勢のロバストな認識が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 整備された作業台、標準化された容器・秤のレイアウト、充電スペース。
- whyHardToday: 環境の微妙な変化（容器サイズ・粉体特性）への汎化が課題。
- japanDeploymentConditions: 食品衛生法・薬機法に基づく衛生管理要件への適合確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 川崎重工業 NEXTAGE [kawasaki-nextage] | fit=possible | basis=official-use-case | reason=川崎ロボティクス公式ページで精密計量・配合作業への適用実績が示されている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

Sources (1件):
- NEXTAGE product page | 川崎ロボティクス | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

### 外観品質検査 (factory-visual-inspection)

- slug: factory-visual-inspection
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Factory Visual Inspection
- titleJa: 外観品質検査
- subtitle: 製造ライン上の完成品・部品を、ヒューマノイドが外観撮影・異常検出する用途。
- summary: 製造ライン上の完成品・部品を、ヒューマノイドが外観撮影・異常検出する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、知覚 (perception)、データ取得 (data-capture)
- primaryIndustry: 製造 (manufacturing)
- industryTags: 製造 (manufacturing)
- taskTags: 点検・検査 (inspection)
- atAGlance.whereFits: 繰り返し外観チェックが必要な最終検査工程、中間検査ステーション。
- atAGlance.whereDoesNotFit: 微細なキズ・寸法精度が厳しい高精度検査（専用の機械視覚装置が適切）。
- atAGlance.mustBeTrue: 検査対象物の位置・照明条件を制御でき、AIによる良否判定を受け入れる体制がある。
- overview: UBTECHやKawasakiが製造ライン向け検査支援を訴求。AIビジョンとの組み合わせで、熟練検査員の不足を補う用途として注目が高い。
- whyItMatters: 検査工程の標準化と品質記録の自動化で、不良流出リスクと人件費を同時に削減できる。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: 照明条件・表面反射によって検出精度が大きく変わる。専用カメラ搭載の検討が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 安定した照明、検査対象物の定位置配置、画像ログ保管インフラ。
- whyHardToday: 合否判定モデルの構築・維持コスト、多品種対応時の再学習コストが課題。
- japanDeploymentConditions: 品質管理基準（ISO 9001等）への適合、判定ログの保管義務の確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (2件):
- UBTECH Robotics Walker S [ubtech-walker-s] | fit=possible | basis=official-use-case | reason=製造ライン品質管理向け公式ユースケースに掲載。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.ubtrobot.com/en/humanoid/products/walker-s
- 川崎重工業 NEXTAGE [kawasaki-nextage] | fit=possible | basis=official-use-case | reason=検査・計測補助での適用実績が公式に示されている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

Sources (2件):
- UBTECH Walker S official page | UBTECH Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.ubtrobot.com/en/humanoid/products/walker-s
- NEXTAGE product page | 川崎ロボティクス | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

### マシンテンディング (factory-machine-tending)

- slug: factory-machine-tending
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Factory Machine Tending
- titleJa: マシンテンディング
- subtitle: CNC・射出成形機など工作機械へのワーク供給・取り出し・操作パネル操作をヒューマノイドで補助する用途。
- summary: CNC・射出成形機など工作機械へのワーク供給・取り出し・操作パネル操作をヒューマノイドで補助する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 製造 (manufacturing)
- industryTags: 製造 (manufacturing)
- taskTags: 組立・加工 (assembly)、搬送・マテハン (material-handling)
- atAGlance.whereFits: CNC・成形機周辺のワーク供給・取り出し。繰り返し動作が定型化されている工場。
- atAGlance.whereDoesNotFit: 高速自動化ラインへの組み込み（専用の産業ロボットが最適）、複雑な段取り替え工程。
- atAGlance.mustBeTrue: 機械とロボットの安全連動（機械側インターロック）が確立できる。
- overview: マシンテンディングはNEXTAGE（川崎）が長年の実績を持つ領域。双腕構造が操作パネル操作と部品把持を両立しやすく、最も実用化が進んでいるヒューマノイド製造ユースケース。
- whyItMatters: 夜間・無人時間帯の機械稼働率を高め、作業者の単純繰り返し負荷を低減する。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 双腕のタスク分担設計が重要。グリッパ選定が性能の鍵。
- capabilityNotes.perception: 部品のばらつきに対するロバストな把持位置検出が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 機械インターロック対応、安全柵または協働運用設計、充電スペース。
- whyHardToday: 多品種対応時のプログラム変更コスト、例外処理（詰まり等）の自動対応が課題。
- japanDeploymentConditions: 労働安全衛生規則・安全規格（ISO 10218）への適合確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 川崎重工業 NEXTAGE [kawasaki-nextage] | fit=possible | basis=official-use-case | reason=マシンテンディングは川崎ロボティクス NEXTAGE の主要適用領域として公式に示されている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

Sources (1件):
- NEXTAGE product page | 川崎ロボティクス | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

### デバンニング (logistics-devanning)

- slug: logistics-devanning
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Logistics Devanning
- titleJa: デバンニング
- subtitle: コンテナ・トラック内の混在貨物の取り出し（デバンニング）をヒューマノイドで実施する用途。
- summary: コンテナ・トラック内の混在貨物の取り出し（デバンニング）をヒューマノイドで実施する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)、自律 (autonomy)
- primaryIndustry: 物流 (logistics)
- industryTags: 物流 (logistics)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 混在段積み貨物の取り出し、コンテナ内の不規則な配置物のハンドリング。
- atAGlance.whereDoesNotFit: 超重量物（30kg超）、液体・食品などの滑りやすい荷物。
- atAGlance.mustBeTrue: デバンニングエリアを作業時間帯に人から分離でき、安全停止手順が整備できる。
- overview: Boston Dynamics AtlasはDeHL等の物流センターでコンテナ荷下ろし実証を行っており、デバンニングは最も早期に実用化が期待されるヒューマノイド物流ユースケース。
- whyItMatters: デバンニングは繰り返し性・重労働性が高く、腰痛など労災リスクの高い作業。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 形状・重量が不均一な荷物の把持戦略が課題。
- capabilityNotes.perception: コンテナ内の乱雑な配置を認識するセンシング精度が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 安定した床面、作業時の人員立入制限、充電・整備スペース。
- whyHardToday: ランダムな荷物位置・形状への汎化、狭いコンテナ内での動作計画が技術的難関。
- japanDeploymentConditions: 港湾・物流センターの安全基準適合、シフト型運用計画の策定が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Boston Dynamics Atlas [boston-dynamics-atlas] | fit=possible | basis=official-use-case | reason=Boston Dynamics が Atlas の物流荷下ろし用途を公式に訴求。DHL等との実証実績あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://bostondynamics.com/atlas/

Sources (1件):
- Boston Dynamics Atlas use cases | Boston Dynamics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://bostondynamics.com/atlas/

### 棚ピッキング (logistics-shelf-picking)

- slug: logistics-shelf-picking
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Logistics Shelf Picking
- titleJa: 棚ピッキング
- subtitle: FC（フルフィルメントセンター）内の棚からの商品ピッキングをヒューマノイドで実施する用途。
- summary: FC（フルフィルメントセンター）内の棚からの商品ピッキングをヒューマノイドで実施する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)、自律 (autonomy)
- primaryIndustry: 物流 (logistics)
- industryTags: 物流 (logistics)
- taskTags: ピッキング・仕分け (picking)
- atAGlance.whereFits: 標準化された棚・容器レイアウトのFC。オーダーピッキングの単純品目が多い現場。
- atAGlance.whereDoesNotFit: 超高速（毎時1000件超）のピッキング要件、極小・異形品。
- atAGlance.mustBeTrue: 棚の高さ・奥行き・照明条件を標準化でき、認識エラー時の人介入フローがある。
- overview: AGIは棚ピッキングをヒューマノイドの初期実用ユースケースとして重点投資している。1X NEO等がFC向けピッキングを積極的に訴求しており、市場のフォーカスが集中している。
- whyItMatters: EC拡大で物流センターのピッキング需要は増加の一方、人材確保が困難になっている。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 多様な商品形状への対応グリッパ設計が競争力の源泉。
- capabilityNotes.perception: バーコード・QRコードとの連携で商品誤認識を防ぐ設計が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 標準化された棚・通路幅、WMS連携、充電ステーション。
- whyHardToday: 多品種の把持への汎化、ピッキング速度（AGV比）がまだ低い。
- japanDeploymentConditions: 倉庫の安全管理規程対応、WMS連携の標準化、保守体制の整備が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 1X Technologies Eve [onex-eve] | fit=possible | basis=official-use-case | reason=1X Technologiesがホームサービス・ピッキングタスクを主力ユースケースとして位置付けている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.1x.tech/androids/neo

Sources (1件):
- 1X NEO use cases | 1X Technologies | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.1x.tech/androids/neo

### カゴ車積載 (logistics-cage-loading)

- slug: logistics-cage-loading
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Logistics Cage Loading
- titleJa: カゴ車積載
- subtitle: ソーターラインから送られてきた荷物のカゴ台車への積み込みをヒューマノイドで実施する用途。
- summary: ソーターラインから送られてきた荷物のカゴ台車への積み込みをヒューマノイドで実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 物流 (logistics)
- industryTags: 物流 (logistics)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 仕分けライン末端のカゴ台車積み、定型サイズの荷物が多い物流センター。
- atAGlance.whereDoesNotFit: 超大型荷物・液体・壊れ物を含む混載作業。
- atAGlance.mustBeTrue: 作業エリアをソーターラインと安全に分離でき、カゴ台車の配置を標準化できる。
- overview: UBTECHが物流センターでのカゴ積載タスクを公式に訴求しており、量産体制で実績を積みつつある。定型動作の繰り返しが多いため自動化の優先度が高い。
- whyItMatters: カゴ積み作業は腰への負担が大きく、深夜・早朝シフトで人材確保が特に困難。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 荷物サイズ・重量のばらつきに対応できるグリッパ選定が重要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 安全柵または人機分離設計、標準化されたカゴ配置、充電スペース。
- whyHardToday: 多品種混載時の積み付けパターン最適化と荷崩れ防止が技術課題。
- japanDeploymentConditions: 物流センターの安全基準、機器認証、保守体制の整備が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- UBTECH Robotics Walker S1 [ubtech-walker-s1] | fit=possible | basis=official-use-case | reason=物流センター内の仕分け・積み込みタスクを公式ユースケースに掲載。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.ubtrobot.com/en/humanoid/products/walker-s1

Sources (1件):
- UBTECH Walker S1 official page | UBTECH Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.ubtrobot.com/en/humanoid/products/walker-s1

### 返品仕分け (logistics-returns-sorting)

- slug: logistics-returns-sorting
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Logistics Returns Sorting
- titleJa: 返品仕分け
- subtitle: EC返品商品の開梱・状態確認・仕分けをヒューマノイドで補助する用途。
- summary: EC返品商品の開梱・状態確認・仕分けをヒューマノイドで補助する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 物流 (logistics)
- industryTags: 物流 (logistics)
- taskTags: ピッキング・仕分け (picking)
- atAGlance.whereFits: 返品フローが多い大型EC物流センター。開梱・ラベル読み取り・仕分けが定型化できる現場。
- atAGlance.whereDoesNotFit: 商品状態の高度な判断（真贋判定・微細損傷判定）が必要な返品処理。
- atAGlance.mustBeTrue: 返品商品の受け取りエリアと仕分けラインを標準化でき、例外品は人が対応できる体制がある。
- overview: Agility Robotics（Digit）はAmazonとの提携で物流センター内の搬送と周辺作業を実証しており、返品仕分けは次フェーズの候補として注目されている。
- whyItMatters: 返品処理は作業量が予測しにくく、繁閑差が激しい。ヒューマノイドの柔軟性を活かせる領域。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 包装状態がバラバラな返品品への対応が課題。
- capabilityNotes.perception: ラベル・QRコードの読み取りシステムとの連携が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 開梱スペース、仕分けラインとの連携設備、充電エリア。
- whyHardToday: 返品品の多様性（形状・状態）への汎化、速度（人比）の低さが実用化の壁。
- japanDeploymentConditions: 物流センターの安全管理対応、EC事業者側の返品フロー標準化が前提。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Agility Robotics Digit [agility-digit] | fit=possible | basis=official-use-case | reason=Agility Roboticsが物流センター向けソリューションとして公式に訴求。Amazon提携実績あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.agilityrobotics.com/solutions

Sources (1件):
- Agility Robotics solutions | Agility Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.agilityrobotics.com/solutions

### 工事コーン配置 (construction-cone-placement)

- slug: construction-cone-placement
- publishStatus: draft
- updatedAt: 2026-06-30
- reliability: estimated / 推定
- nextReviewBy: なし
- title: Construction Cone Placement
- titleJa: 工事コーン配置
- subtitle: 道路工事や建設現場での安全コーン配置・撤収をヒューマノイドで自動化する用途。
- summary: 道路工事や建設現場での安全コーン配置・撤収をヒューマノイドで自動化する用途。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: limited-today / 現時点では限定的
- environment: outdoor / 屋外
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)、自律 (autonomy)
- primaryIndustry: 建設・インフラ (construction)
- industryTags: 建設・インフラ (construction)
- taskTags: 危険作業・インフラ保守 (hazardous-work)、搬送・マテハン (material-handling)
- atAGlance.whereFits: 道路工事・建設現場での安全設備配置。繰り返しルートが明確な現場。
- atAGlance.whereDoesNotFit: 複雑な交通状況下での道路作業、悪天候（豪雨・強風）環境。
- atAGlance.mustBeTrue: 作業エリアを一時的に人・車両から分離でき、ロボット単体での転倒リスクを管理できる。
- overview: 建設現場でのコーン配置は危険で反復性が高い。技術的には初期検討段階で、候補ロボットは現時点で見当たらない。
- whyItMatters: 道路工事での事故リスク軽減と省人化の両立ができれば、社会的意義が大きい。
- capabilityNotes.mobility: 屋外・舗装/非舗装面での安定移動が前提。
- capabilityNotes.manipulation: コーンの形状・重量への対応グリッパが必要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 屋外の不整地対応、防水・防塵設計、通信インフラ（5G等）。
- whyHardToday: 屋外での自律移動精度、風雨・日照変化への耐候性が現行機では不十分。
- japanDeploymentConditions: 道路交通法・建設現場安全規則への適合、国交省ガイドライン準拠が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (0件):


Sources (1件):
- ZIZAI official website | ZIZAI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://zizai.co.jp/

### 建設現場巡視 (construction-site-patrol)

- slug: construction-site-patrol
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Construction Site Patrol
- titleJa: 建設現場巡視
- subtitle: 建設現場の進捗確認・安全チェック・異常報告をヒューマノイドが巡回して実施する用途。
- summary: 建設現場の進捗確認・安全チェック・異常報告をヒューマノイドが巡回して実施する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: limited-today / 現時点では限定的
- environment: outdoor / 屋外
- requiredCapabilities: 移動 (mobility)、知覚 (perception)、データ取得 (data-capture)、自律 (autonomy)
- primaryIndustry: 建設・インフラ (construction)
- industryTags: 建設・インフラ (construction)
- taskTags: 巡回・警備 (patrol)、点検・検査 (inspection)
- atAGlance.whereFits: 大規模建設現場・インフラ工事での定期巡視、安全確認、写真記録。
- atAGlance.whereDoesNotFit: 超高所・足場の不安定な空間、水中・密閉空間での作業。
- atAGlance.mustBeTrue: 巡視ルートを事前にマッピングでき、異常発見時の人への通知フローがある。
- overview: ZIZAIが建設現場向けヒューマノイドの開発を進めており、現場巡視・資材確認は初期ユースケースとして位置付けている。
- whyItMatters: 建設現場の人手不足と安全管理強化のニーズが同時に高まっている。
- capabilityNotes.mobility: 不整地・段差・傾斜での安定移動が鍵。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: カメラ・LiDARによる進捗・異常検知が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 屋外・不整地対応、防水設計、通信インフラ。
- whyHardToday: 屋外での自律ナビゲーション精度、長時間バッテリー稼働が技術的課題。
- japanDeploymentConditions: 建設業法・労働安全衛生法への適合、現場責任者との連携体制が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 自在株式会社 零式人機 [zizai-zeroshiki] | fit=possible | basis=official-use-case | reason=ZIZAIが建設・インフラ現場での巡視を主要ユースケースとして開発を進めている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://zizai.co.jp/

Sources (1件):
- ZIZAI official website | ZIZAI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://zizai.co.jp/

### 現場資材搬送 (construction-material-transport)

- slug: construction-material-transport
- publishStatus: draft
- updatedAt: 2026-06-30
- reliability: estimated / 推定
- nextReviewBy: なし
- title: Construction Material Transport
- titleJa: 現場資材搬送
- subtitle: 建設現場内の資材・工具の搬送をヒューマノイドで補助する用途。
- summary: 建設現場内の資材・工具の搬送をヒューマノイドで補助する用途。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 建設・インフラ (construction)
- industryTags: 建設・インフラ (construction)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 屋内仮設エリアでの資材搬送、倉庫・仮設置き場間の往復搬送。
- atAGlance.whereDoesNotFit: 超重量資材（30kg超）、高所・垂直搬送（昇降機なし）。
- atAGlance.mustBeTrue: 搬送ルートを暫定的に整備でき、ロボット動線と人・重機の動線を分離できる。
- overview: 建設現場内の資材搬送は省人化ニーズが高いが、屋外・不整地の困難さがある。屋内仮設エリアや整備済み通路でのPoC候補として検討段階。
- whyItMatters: 建設業の人手不足は深刻で、資材搬送の省人化が工期短縮・コスト削減につながる。
- capabilityNotes.mobility: 仮設床・段差・泥土への対応が課題。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 整備された搬送ルート、充電スペース、重機との動線分離。
- whyHardToday: 建設現場環境の多様性と予測困難性が、自律移動の実用化を妨げている。
- japanDeploymentConditions: 建設現場安全管理計画への組み込み、機器認証が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 川崎重工業 NEXTAGE [kawasaki-nextage] | fit=watch | basis=product-capability | reason=屋内制御環境での搬送実績あり。建設現場への適用は今後の検討段階。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

Sources (1件):
- NEXTAGE product page | 川崎ロボティクス | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

### 超音波橋梁点検 (infrastructure-ultrasonic-inspection)

- slug: infrastructure-ultrasonic-inspection
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Infrastructure Ultrasonic Inspection
- titleJa: 超音波橋梁点検
- subtitle: 橋梁・高架等のインフラ構造物に対して、ヒューマノイドが超音波センサを用いた非破壊点検を実施する用途。
- summary: 橋梁・高架等のインフラ構造物に対して、ヒューマノイドが超音波センサを用いた非破壊点検を実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: outdoor / 屋外
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)、データ取得 (data-capture)
- primaryIndustry: 建設・インフラ (construction)
- industryTags: 建設・インフラ (construction)
- taskTags: 点検・検査 (inspection)、危険作業・インフラ保守 (hazardous-work)
- atAGlance.whereFits: 橋梁・高架・トンネルの定期点検、手が届きにくい構造部位の非破壊検査。
- atAGlance.whereDoesNotFit: 水中点検、超高所の自由落下リスクがある場所（安全係留が困難な場合）。
- atAGlance.mustBeTrue: 点検対象部位へのアクセス経路を確保でき、超音波センサのティーチングが可能な環境。
- overview: ZIZAIが橋梁の超音波点検をヒューマノイドの主要実用ユースケースとして展開。国内のインフラ老朽化対策需要と合致しており、実用化フェーズにある。
- whyItMatters: 国内橋梁の老朽化が深刻で、点検員不足と高所作業の危険性が同時課題となっている。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 超音波センサを構造物面に適切な圧力で当て続けるスキルが必要。
- capabilityNotes.perception: センサデータと構造物図面の統合解析インフラが必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 橋梁へのアクセス足場、センサキャリブレーション環境、データ記録システム。
- whyHardToday: 不整形な構造物面でのセンサ接触精度、悪天候時の作業継続が課題。
- japanDeploymentConditions: 国道橋・県道橋の点検基準（国土交通省）への適合、近接目視の代替承認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 自在株式会社 零式人機 [zizai-zeroshiki] | fit=possible | basis=official-use-case | reason=ZIZAIが橋梁超音波点検を公式の主要ユースケースとして展開している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://zizai.co.jp/

Sources (1件):
- ZIZAI official website | ZIZAI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://zizai.co.jp/

### 架線保守 (infrastructure-overhead-wire-maintenance)

- slug: infrastructure-overhead-wire-maintenance
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Infrastructure Overhead Wire Maintenance
- titleJa: 架線保守
- subtitle: 鉄道・電力系統の架線点検・保守作業をヒューマノイドで実施する用途。
- summary: 鉄道・電力系統の架線点検・保守作業をヒューマノイドで実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: outdoor / 屋外
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)、自律 (autonomy)
- primaryIndustry: 建設・インフラ (construction)
- industryTags: 建設・インフラ (construction)
- taskTags: 危険作業・インフラ保守 (hazardous-work)
- atAGlance.whereFits: 架線点検・清掃・パーツ交換など高所かつ感電リスクのある保守作業。
- atAGlance.whereDoesNotFit: 緊急事態下（事故後の架線修復）、超高圧送電線での作業。
- atAGlance.mustBeTrue: 絶縁・安全設計が確立されており、点検後の人による確認フローがある。
- overview: ZIZAIが架線保守を看板ユースケースとして掲げており、鉄道・電力インフラの保守省人化需要と合致。危険作業の無人化として社会的注目度が高い。
- whyItMatters: 架線保守は高所・感電リスクが高く、専門技術者の確保が困難になっている。
- capabilityNotes.mobility: 高所作業車や足場との連携設計が必要。
- capabilityNotes.manipulation: 絶縁グリッパ・工具の操作精度が安全性の鍵。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 絶縁対応設計、高所作業車との連携、通信インフラ。
- whyHardToday: 架線電圧・天候変化への耐久性、精密な位置決めが現行技術の限界に近い。
- japanDeploymentConditions: 電気事業法・鉄道事業法への適合、停電手順との連動、規制当局の承認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 自在株式会社 零式人機 [zizai-zeroshiki] | fit=possible | basis=official-use-case | reason=ZIZAIが架線保守を主要ユースケースとして開発・訴求している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://zizai.co.jp/

Sources (1件):
- ZIZAI official website | ZIZAI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://zizai.co.jp/

### 苗移植 (agriculture-seedling-transplant)

- slug: agriculture-seedling-transplant
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Agriculture Seedling Transplant
- titleJa: 苗移植
- subtitle: 農業ハウス・育苗施設での苗の移植・定植作業をヒューマノイドで自動化する用途。
- summary: 農業ハウス・育苗施設での苗の移植・定植作業をヒューマノイドで自動化する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 農業・食品生産 (agriculture)
- industryTags: 農業・食品生産 (agriculture)
- taskTags: 農作業・収穫 (agricultural-work)
- atAGlance.whereFits: 大規模農業ハウスでの苗移植・定植。繰り返し動作が多い育苗施設。
- atAGlance.whereDoesNotFit: 土が不規則に分布する露地農業、繊細な品種（壊れやすい苗）。
- atAGlance.mustBeTrue: 育苗トレイ・プランターの配置を標準化でき、苗の高さ・間隔を均一に保てる環境。
- overview: 川崎ロボティクスNEXTAGEは農業向け作業への応用実績があり、苗移植は繰り返し性が高く双腕ロボットとの親和性が高い。
- whyItMatters: 農業の高齢化・担い手不足は深刻で、苗移植などの単純反復作業の自動化需要が高まっている。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 苗の柔らかさ・形状に合わせた把持力制御が必要。
- capabilityNotes.perception: 苗の位置・向き・健康状態の検出が求められる。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 均一な育苗トレイ・作業台レイアウト、充電スペース、防湿対応。
- whyHardToday: 苗の個体差への対応、土・水の存在による把持難易度が高い。
- japanDeploymentConditions: 農業施設安全基準、食品衛生管理規定への適合確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 川崎重工業 NEXTAGE [kawasaki-nextage] | fit=possible | basis=official-use-case | reason=川崎ロボティクスNEXTAGEが農業・食品業界への応用事例を公式に掲載している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

Sources (1件):
- NEXTAGE product page | 川崎ロボティクス | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

### 果菜収穫 (agriculture-fruit-harvest)

- slug: agriculture-fruit-harvest
- publishStatus: draft
- updatedAt: 2026-06-30
- reliability: estimated / 推定
- nextReviewBy: なし
- title: Agriculture Fruit Harvest
- titleJa: 果菜収穫
- subtitle: ハウス内のトマト・イチゴ・パプリカ等の果菜収穫をヒューマノイドで実施する用途。
- summary: ハウス内のトマト・イチゴ・パプリカ等の果菜収穫をヒューマノイドで実施する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 農業・食品生産 (agriculture)
- industryTags: 農業・食品生産 (agriculture)
- taskTags: 農作業・収穫 (agricultural-work)
- atAGlance.whereFits: 大規模農業ハウスのトマト・イチゴ等果菜収穫。収穫基準が明確に定義できる品種。
- atAGlance.whereDoesNotFit: 露地農業（不整地）、収穫判断が複雑な品種（熟度確認が難しいもの）。
- atAGlance.mustBeTrue: ハウス内の通路・棚が標準化されており、ロボットが移動できるスペースが確保できる。
- overview: 農業ロボット分野でのAGIの参入が活発化しており、果菜収穫は果実認識AIの精度向上とともに実証フェーズに入っている。
- whyItMatters: 農業の高齢化・外国人技能実習制度改正の影響で、収穫労働力不足が深刻化している。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 傷つけずに収穫するための把持力制御と切断精度が重要。
- capabilityNotes.perception: 熟度・位置の複合判断が必要。果実が葉・枝に隠れる場合の認識も課題。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 整備されたハウス通路・棚配置、防湿・防塵対応、充電スペース。
- whyHardToday: 果実の位置・姿勢の多様性への対応、葉・枝の障害物回避が技術的難関。
- japanDeploymentConditions: 農業施設安全管理規程への適合、農薬残留管理ルールとの整合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 1X Technologies Eve [onex-eve] | fit=watch | basis=product-capability | reason=1X Technologiesが精密把持タスクへの対応能力を訴求しているが、農業用途での実証は確認できていない。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.1x.tech/

Sources (1件):
- 1X Technologies use cases | 1X Technologies | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.1x.tech/

### 食材仕分け箱詰め (agriculture-food-sorting)

- slug: agriculture-food-sorting
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Agriculture Food Sorting
- titleJa: 食材仕分け箱詰め
- subtitle: 収穫後の野菜・果物の選別・等級分け・箱詰め作業をヒューマノイドで自動化する用途。
- summary: 収穫後の野菜・果物の選別・等級分け・箱詰め作業をヒューマノイドで自動化する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、知覚 (perception)、連携 (integration)
- primaryIndustry: 農業・食品生産 (agriculture)
- industryTags: 農業・食品生産 (agriculture)
- taskTags: ピッキング・仕分け (picking)、農作業・収穫 (agricultural-work)
- atAGlance.whereFits: 食品加工場での選別・等級分け・箱詰め。形状が比較的均一で繰り返し性の高い品目。
- atAGlance.whereDoesNotFit: 極めて繊細な選別判断（香り・微細な傷）が必要な高級品。
- atAGlance.mustBeTrue: 選別基準を定義でき、コンベアや箱詰めラインとロボットを連携させる設備がある。
- overview: NEXTAGE（川崎）は食品業界向けの仕分け・箱詰め作業で豊富な導入実績を持つ。農産物の選別ラインでの実用化は最も成熟したヒューマノイド農業ユースケース。
- whyItMatters: 食品加工場での選別・箱詰め作業は深夜・早朝も続く繰り返し労働で、人材確保が困難。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 農産物の柔らかさ・不規則な形状への対応が重要。
- capabilityNotes.perception: 品質判定カメラシステムとの連携が必要。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: コンベア連携設備、食品衛生対応（防水・清掃性）、充電スペース。
- whyHardToday: 多品種対応時の段取り替えコスト、食品衛生基準への適合設計が課題。
- japanDeploymentConditions: 食品衛生法（HACCP対応）、農産物の等級基準への適合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 川崎重工業 NEXTAGE [kawasaki-nextage] | fit=possible | basis=official-use-case | reason=NEXTAGEが食品業界の選別・箱詰め作業での実用化実績を公式に掲載している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

Sources (1件):
- NEXTAGE product page | 川崎ロボティクス | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

### 果実コンテナ運搬 (agriculture-fruit-transport)

- slug: agriculture-fruit-transport
- publishStatus: draft
- updatedAt: 2026-06-30
- reliability: estimated / 推定
- nextReviewBy: なし
- title: Agriculture Fruit Transport
- titleJa: 果実コンテナ運搬
- subtitle: 農業ハウス内での収穫コンテナ運搬をヒューマノイドで補助する用途。
- summary: 農業ハウス内での収穫コンテナ運搬をヒューマノイドで補助する用途。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)
- primaryIndustry: 農業・食品生産 (agriculture)
- industryTags: 農業・食品生産 (agriculture)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 農業ハウス内の収穫コンテナ・台車の搬送。通路幅が確保された大規模施設。
- atAGlance.whereDoesNotFit: 不整地・畑での露地搬送。極端に狭いハウス通路。
- atAGlance.mustBeTrue: 搬送ルートを標準化でき、コンテナ重量をロボットの可搬重量内に収められる。
- overview: 農業ハウス内のコンテナ搬送は省人化ニーズが高いが、対応ロボットが確立されていない初期検討段階。
- whyItMatters: ハウス内搬送は農業の収穫作業と並ぶ重労働で、高齢化に伴う担い手不足が課題。
- capabilityNotes.mobility: ハウス内の湿潤床・段差への対応が必要。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 整備された通路、コンテナ標準化、防湿設計。
- whyHardToday: 農業ハウス環境の多様性（温度・湿度・床面）へのロボット適応が課題。
- japanDeploymentConditions: 農業施設安全規定への適合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (0件):


Sources (1件):
- ZIZAI official website | ZIZAI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://zizai.co.jp/

### 農業機械メンテ (agriculture-machine-maintenance)

- slug: agriculture-machine-maintenance
- publishStatus: draft
- updatedAt: 2026-06-30
- reliability: estimated / 推定
- nextReviewBy: なし
- title: Agriculture Machine Maintenance
- titleJa: 農業機械メンテ
- subtitle: トラクター・農業機械の定期点検・部品交換をヒューマノイドで補助する用途。
- summary: トラクター・農業機械の定期点検・部品交換をヒューマノイドで補助する用途。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 農業・食品生産 (agriculture)
- industryTags: 農業・食品生産 (agriculture)
- taskTags: 組立・加工 (assembly)
- atAGlance.whereFits: 農機倉庫・整備場での定期メンテナンス、部品交換補助。
- atAGlance.whereDoesNotFit: 高度な農機整備（エンジン分解など）が必要な専門作業。
- atAGlance.mustBeTrue: 整備手順を標準化でき、ロボットが工具を操作できる環境が整っている。
- overview: 農業機械の定期メンテは担い手不足と技術継承問題が重なる領域。対応ロボットは現時点で確立されていない初期検討段階。
- whyItMatters: 農業機械の維持管理は農業経営の継続性に直結するが、専門技術者の不足が深刻。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 多様な工具・ファスナーの操作能力が必要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 整備場の作業台、工具ラックの標準化、充電スペース。
- whyHardToday: 農機の多様な機種・構造への汎化、工具操作精度が技術的ハードル。
- japanDeploymentConditions: 農業機械の安全基準（農林水産省）への適合確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (0件):


Sources (1件):
- ZIZAI official website | ZIZAI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://zizai.co.jp/

### 検体・物品搬送 (healthcare-specimen-transport)

- slug: healthcare-specimen-transport
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Healthcare Specimen Transport
- titleJa: 検体・物品搬送
- subtitle: 病院内の検体・薬品・備品の搬送をヒューマノイドが自律走行で実施する用途。
- summary: 病院内の検体・薬品・備品の搬送をヒューマノイドが自律走行で実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、自律 (autonomy)、連携 (integration)
- primaryIndustry: 医療・介護 (healthcare)
- industryTags: 医療・介護 (healthcare)
- taskTags: 搬送・マテハン (material-handling)
- atAGlance.whereFits: 検体・薬品・リネン・食事トレイなど繰り返し搬送が多い病院・介護施設。
- atAGlance.whereDoesNotFit: 緊急搬送（人命関係の緊急対応）、超精密・破損リスクが高い検体の単独搬送。
- atAGlance.mustBeTrue: 搬送カートの積み下ろし動作を定型化でき、エレベーター連携・ドア開閉が制御可能な環境。
- overview: Aeolus Robotics aeoは日本の医療機関（国立病院等）での検体・物品搬送導入実績があり、最も実用化が進んでいる医療ヒューマノイドユースケース。
- whyItMatters: 看護師の搬送業務を自動化することで、患者ケアに集中できる時間を増やせる。
- capabilityNotes.mobility: エレベーター連携・ドア開閉制御が必須。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: 人と同じ廊下での安全な自律ナビゲーションが必要。
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: エレベーター API 対応、廊下の障害物除去、充電ステーション。
- whyHardToday: 非常時の動作、感染管理上の清拭・消毒への耐性設計が課題。
- japanDeploymentConditions: 医療機器・薬機法の規制確認、院内安全委員会の承認、感染管理対応が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Aeolus Robotics aeo [aeolus-aeo] | fit=possible | basis=official-use-case | reason=Aeolus Robotics aeo が病院向け検体・物品搬送を主要ユースケースとして公式に訴求。日本医療機関への導入実績あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://aeolusbot.com/

Sources (1件):
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### リハビリ支援 (healthcare-rehabilitation)

- slug: healthcare-rehabilitation
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Healthcare Rehabilitation
- titleJa: リハビリ支援
- subtitle: 脳卒中・骨折回復患者のリハビリ動作補助をヒューマノイドが担当する用途。
- summary: 脳卒中・骨折回復患者のリハビリ動作補助をヒューマノイドが担当する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、コミュニケーション (communication)、自律 (autonomy)
- primaryIndustry: 医療・介護 (healthcare)
- industryTags: 医療・介護 (healthcare)
- taskTags: 身体介助・リハビリ (physical-assistance)
- atAGlance.whereFits: 脳卒中・骨折回復患者の反復リハビリ動作補助。理学療法士のサポート役として機能させる環境。
- atAGlance.whereDoesNotFit: 急性期・集中治療室。認知症ケアなど高度なコミュニケーションが必要な場面。
- atAGlance.mustBeTrue: 理学療法士が監督できる環境で、緊急停止手順が整備されている。
- overview: Fourier GR-2/GR-3は医療リハビリ向けのヒューマノイドとして臨床実証を進めており、欧州の医療機関での実証報告がある。
- whyItMatters: リハビリ療法士の不足と高齢者増加が重なり、反復リハビリ補助の需要が急拡大している。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 患者の身体に適切な力で接触するフォース制御が安全上重要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: 患者への声かけ・ガイドのシンプルなインタラクションが求められる。
- capabilityNotes.integration: なし
- environmentRequirements: リハビリ室の安全スペース、緊急停止設備、医療スタッフ常駐。
- whyHardToday: 患者の個人差（体格・可動域）への適応、フォース制御の安全性確保が技術課題。
- japanDeploymentConditions: 医療機器認証（薬機法）、療法士との協働運用プロトコル、倫理委員会承認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (2件):
- Fourier Intelligence GR-2 [fourier-gr2] | fit=possible | basis=official-use-case | reason=Fourier GR-2 が医療リハビリ向け用途を公式に訴求。欧州医療機関での実証報告あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://fourierintelligence.com/gr2/
- Fourier Intelligence GR-3 [fourier-gr3] | fit=possible | basis=official-use-case | reason=Fourier GR-3 は GR-2 の後継として医療・リハビリ向け能力を継承している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://fourierintelligence.com/gr2/

Sources (1件):
- Fourier GR-2 product page | Fourier Intelligence | reliability=official/公式情報 | checkedAt=2026-06-30 | https://fourierintelligence.com/gr2/

### 見守り巡回 (healthcare-care-patrol)

- slug: healthcare-care-patrol
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Healthcare Care Patrol
- titleJa: 見守り巡回
- subtitle: 介護施設・病院での入居者・入院患者の夜間見守り巡回をヒューマノイドが実施する用途。
- summary: 介護施設・病院での入居者・入院患者の夜間見守り巡回をヒューマノイドが実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、知覚 (perception)、自律 (autonomy)、データ取得 (data-capture)
- primaryIndustry: 医療・介護 (healthcare)
- industryTags: 医療・介護 (healthcare)
- taskTags: 巡回・警備 (patrol)
- atAGlance.whereFits: 介護施設・病院の夜間廊下・居室巡回。定型ルートで異常検知・記録が主目的の環境。
- atAGlance.whereDoesNotFit: 身体介助が必要な転倒対応、重症患者の緊急対応（ICU等）。
- atAGlance.mustBeTrue: 異常発見時の人への緊急通知フローが確立されており、ロボットが介助不要な観察のみに限定できる。
- overview: Aeolus aeo は介護・医療施設での見守り巡回を主要ユースケースに据えており、日本での実導入実績がある。夜間人員削減と利用者安全の両立として注目。
- whyItMatters: 夜間介護スタッフの人手不足と、転倒・異常の早期発見ニーズが同時に高まっている。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: 転倒検知・呼吸観察のためのカメラ・センサ搭載が必要。
- capabilityNotes.autonomy: 夜間の暗所でも自律ナビゲーションできる設計が重要。
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 廊下・居室への自律アクセス、夜間照明連携、通知システム。
- whyHardToday: 暗所・静粛環境での認識精度、個人情報保護（映像管理）の整備が課題。
- japanDeploymentConditions: 個人情報保護法・介護保険法上の映像取得許可、施設管理者・入居者の同意取得が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Aeolus Robotics aeo [aeolus-aeo] | fit=possible | basis=official-use-case | reason=Aeolus aeo が介護・医療施設での見守り巡回を公式ユースケースとして訴求。日本施設への導入実績あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://aeolusbot.com/

Sources (1件):
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### 消毒・衛生管理 (healthcare-disinfection)

- slug: healthcare-disinfection
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Healthcare Disinfection
- titleJa: 消毒・衛生管理
- subtitle: 病院・介護施設の廊下・共用部の消毒・清掃をヒューマノイドが自律実施する用途。
- summary: 病院・介護施設の廊下・共用部の消毒・清掃をヒューマノイドが自律実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、自律 (autonomy)
- primaryIndustry: 医療・介護 (healthcare)
- industryTags: 医療・介護 (healthcare)
- taskTags: 清掃・衛生管理 (cleaning)
- atAGlance.whereFits: 病院・介護施設の廊下・共用スペースの消毒・拭き取り。定型ルート・定型手順の清掃作業。
- atAGlance.whereDoesNotFit: 精密機器周辺・ICU内の高度衛生管理区域、患者室の個別対応清掃。
- atAGlance.mustBeTrue: 消毒液の取り扱いが自動化でき、ロボット稼働中は対象区域を人から分離できる。
- overview: Aeolus aeo はCOVID-19以降、病院での消毒ロボット需要増加を受けて普及。現在も感染制御の一環として継続利用されており、実用化フェーズの医療清掃ユースケース。
- whyItMatters: 清掃・消毒スタッフの確保難と感染リスク管理の観点から、ロボット消毒のニーズが継続している。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 消毒液スプレーまたは拭き取り機構の搭載が必要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: 廊下・部屋の自律ナビゲーションと清掃完了確認が求められる。
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 消毒液補充ステーション、廊下の障害物管理、充電スペース。
- whyHardToday: 消毒有効性の保証（カバレッジ確認）、消毒液残留の安全管理が課題。
- japanDeploymentConditions: 医療施設感染管理基準（日本環境感染学会等）、消毒液の取り扱い法規への適合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Aeolus Robotics aeo [aeolus-aeo] | fit=possible | basis=official-use-case | reason=Aeolus aeo が医療施設での消毒・清掃業務を公式ユースケースとして訴求。日本医療機関への導入実績あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://aeolusbot.com/

Sources (1件):
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### 手術補助 (healthcare-surgery-assist)

- slug: healthcare-surgery-assist
- publishStatus: draft
- updatedAt: 2026-06-30
- reliability: estimated / 推定
- nextReviewBy: なし
- title: Healthcare Surgery Assist
- titleJa: 手術補助
- subtitle: 手術室での器具の受け渡し・準備補助をヒューマノイドが実施する用途。
- summary: 手術室での器具の受け渡し・準備補助をヒューマノイドが実施する用途。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、知覚 (perception)、コミュニケーション (communication)
- primaryIndustry: 医療・介護 (healthcare)
- industryTags: 医療・介護 (healthcare)
- taskTags: 身体介助・リハビリ (physical-assistance)
- atAGlance.whereFits: 手術室での手術器具受け渡し・準備補助。厳密な清潔管理が確保できる環境。
- atAGlance.whereDoesNotFit: 術中の直接的な外科介入。緊急時の迅速な判断対応が必要な場面。
- atAGlance.mustBeTrue: 無菌要件を満たすロボット設計、専任医療スタッフの常駐・監督が必要。
- overview: 手術補助ロボットは技術的に初期検討段階。現行ヒューマノイドは手術室の清潔要件・精度要件を満たすには遠い。候補ロボットは現時点で存在しない。
- whyItMatters: 手術スタッフの負荷軽減と感染リスク管理の観点から将来的な需要が期待される。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 外科精度の把持・受け渡し能力が必要。
- capabilityNotes.perception: 手術器具の種類と使用状態の識別が求められる。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 無菌・滅菌対応設計、手術室の厳格な動線管理との適合。
- whyHardToday: 無菌・高精度・緊急対応の三要件を同時に満たすロボット設計は現状困難。
- japanDeploymentConditions: 医療機器製造販売承認（薬機法）、厚生労働省ガイドライン準拠が必須。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (0件):


Sources (1件):
- Fourier GR-2 product page | Fourier Intelligence | reliability=official/公式情報 | checkedAt=2026-06-30 | https://fourierintelligence.com/gr2/

### ルームサービス配送 (retail-room-service)

- slug: retail-room-service
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Retail Room Service
- titleJa: ルームサービス配送
- subtitle: ホテルの客室へのルームサービス配膳・アメニティ配送をヒューマノイドが実施する用途。
- summary: ホテルの客室へのルームサービス配膳・アメニティ配送をヒューマノイドが実施する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、自律 (autonomy)、コミュニケーション (communication)
- primaryIndustry: 小売・店舗 (retail)
- industryTags: 小売・店舗 (retail)
- taskTags: 搬送・マテハン (material-handling)、接客・案内・配膳 (customer-service)
- atAGlance.whereFits: ホテル・旅館でのルームサービス配送。エレベーター連携・客室ドア前での受け渡し。
- atAGlance.whereDoesNotFit: 高級ホテルの接客品質が求められる直接サービス、高齢者施設の配膳（安全基準が異なる）。
- atAGlance.mustBeTrue: エレベーター API 連携と客室案内システムとの統合ができ、料理・荷物の積み下ろし動作を定型化できる。
- overview: Aeolus aeo はホテルでのルームサービス配送実証実績があり、日本のビジネスホテル・観光ホテルでの採用が広がりつつある。
- whyItMatters: ホテルのスタッフ不足と深夜帯のサービス需要を両立するソリューションとして注目。
- capabilityNotes.mobility: エレベーター連携・廊下の自律ナビゲーションが必須。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: 客室前でのシンプルな対話（到着通知等）が必要。
- capabilityNotes.integration: なし
- environmentRequirements: エレベーター API、客室前の受け渡しスペース、充電ステーション（フロント付近）。
- whyHardToday: 人との混在廊下でのナビゲーション、多様な客室扉形状への対応が課題。
- japanDeploymentConditions: 旅館業法上の衛生管理要件、食品取り扱い規制への適合確認が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Aeolus Robotics aeo [aeolus-aeo] | fit=possible | basis=official-use-case | reason=Aeolus aeo がホテルのルームサービス配送用途で実証実績あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://aeolusbot.com/

Sources (1件):
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### 飲食店配膳 (retail-food-serving)

- slug: retail-food-serving
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Retail Food Serving
- titleJa: 飲食店配膳
- subtitle: レストラン・フードコートでの料理配膳・食器回収をヒューマノイドが実施する用途。
- summary: レストラン・フードコートでの料理配膳・食器回収をヒューマノイドが実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、自律 (autonomy)、コミュニケーション (communication)
- primaryIndustry: 小売・店舗 (retail)
- industryTags: 小売・店舗 (retail)
- taskTags: 接客・案内・配膳 (customer-service)、搬送・マテハン (material-handling)
- atAGlance.whereFits: 大型レストラン・フードコートでの料理配膳。テーブルレイアウトが整備された飲食施設。
- atAGlance.whereDoesNotFit: 狭いカウンター席中心の店舗、高級フランス料理など接客品質が最重要な飲食店。
- atAGlance.mustBeTrue: テーブルの番号・配置を標準化でき、料理の積み下ろしが定型化できる。
- overview: Galbot G1 が飲食店配膳向けに商用化を進めており、中国の飲食チェーンでの実証実績がある。外食産業の人手不足に対応するソリューションとして量産フェーズにある。
- whyItMatters: 外食産業の人手不足は深刻で、繁忙時間帯の配膳補助で提供スピードと人件費を改善できる。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: トレイ・皿の安定把持と傾きのない搬送が必要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: お客様へのシンプルな声かけ（到着通知等）が求められる。
- capabilityNotes.integration: なし
- environmentRequirements: 整備されたフロアレイアウト、食器・トレイの標準化、充電スペース。
- whyHardToday: 人が多い混雑時の安全な動線確保、食器の多様な形状への対応が課題。
- japanDeploymentConditions: 食品衛生法・食品安全規制への適合、サービス業労働基準との整合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Galbot Galbot G1 [galbot-g1] | fit=possible | basis=official-use-case | reason=Galbot G1 が飲食店配膳ユースケースを主力として商用化を進めている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://galbot.com/

Sources (1件):
- Galbot official website | Galbot | reliability=official/公式情報 | checkedAt=2026-06-30 | https://galbot.com/

### バリスタ調理 (retail-barista)

- slug: retail-barista
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Retail Barista
- titleJa: バリスタ調理
- subtitle: カフェ・コーヒーショップでのエスプレッソ抽出・ラテアート・ドリンク調理をヒューマノイドが担当する用途。
- summary: カフェ・コーヒーショップでのエスプレッソ抽出・ラテアート・ドリンク調理をヒューマノイドが担当する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、知覚 (perception)、自律 (autonomy)
- primaryIndustry: 小売・店舗 (retail)
- industryTags: 小売・店舗 (retail)
- taskTags: 組立・加工 (assembly)、接客・案内・配膳 (customer-service)
- atAGlance.whereFits: 大量調理・繰り返し品目が多いカフェチェーン・フードコート内コーヒースタンド。
- atAGlance.whereDoesNotFit: 高度なラテアート技術・職人的技巧が求められる高級カフェ。
- atAGlance.mustBeTrue: レシピ・機器操作を標準化でき、ロボットの作業エリアを明確に区切れる設計がある。
- overview: Galbot G1 がバリスタタスクを主要商業ユースケースとして実証しており、中国の商業施設内カフェでの量産商品化を進めている。
- whyItMatters: カフェチェーンの人件費上昇とスタッフ確保難を、ロボットバリスタで解決できる可能性がある。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: コーヒーマシン・計量器・ミルクフォーマーの精密操作が必要。
- capabilityNotes.perception: カップ・容器の位置と液量の管理が求められる。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 整備された厨房設備、標準化された機器配置、安全な作業エリア区画。
- whyHardToday: 熱・蒸気環境での耐久性、多メニュー対応時の再プログラミングコストが課題。
- japanDeploymentConditions: 食品衛生法・フードサービス安全基準への適合、厚生労働省の食品製造規制との整合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Galbot Galbot G1 [galbot-g1] | fit=possible | basis=official-use-case | reason=Galbot G1 がバリスタ調理を主力商業ユースケースとして量産商品化を進めている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://galbot.com/

Sources (1件):
- Galbot official website | Galbot | reliability=official/公式情報 | checkedAt=2026-06-30 | https://galbot.com/

### 床清掃 (facility-floor-cleaning)

- slug: facility-floor-cleaning
- publishStatus: draft
- updatedAt: 2026-06-30
- reliability: estimated / 推定
- nextReviewBy: なし
- title: Facility Floor Cleaning
- titleJa: 床清掃
- subtitle: ショッピングモール・オフィスビル・公共施設の床清掃をヒューマノイドが自律実施する用途。
- summary: ショッピングモール・オフィスビル・公共施設の床清掃をヒューマノイドが自律実施する用途。
- maturityLevel: early-stage / 初期検討
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、自律 (autonomy)
- primaryIndustry: 施設管理 (facility-management)
- industryTags: 施設管理 (facility-management)
- taskTags: 清掃・衛生管理 (cleaning)
- atAGlance.whereFits: 施設の定時床清掃。人の少ない時間帯（深夜・早朝）に自律実施できる環境。
- atAGlance.whereDoesNotFit: 汚れが激しいイベント会場の即時対応清掃、階段・段差の多いビル。
- atAGlance.mustBeTrue: 清掃対象エリアを標準マッピングでき、障害物の整理とロボットの充電体制が整っている。
- overview: ヒューマノイドによる床清掃は現時点で有力な候補ロボットが確立されていない初期検討段階。専用清掃ロボット（非ヒューマノイド）のほうが現状は優位。
- whyItMatters: 施設管理の清掃スタッフ不足が深刻で、深夜・早朝の無人清掃需要が高まっている。
- capabilityNotes.mobility: 広い施設フロアの自律ナビゲーションと充電管理が必要。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 整備されたフロアレイアウト、障害物の定期整理、充電ステーション。
- whyHardToday: 専用清掃ロボット比で効率・コストの優位性が出せていない。汎用性のトレードオフが課題。
- japanDeploymentConditions: 建築物管理法・清掃業法への適合、施設管理者との連携体制が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (0件):


Sources (1件):
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### ごみ回収・整理 (facility-waste-collection)

- slug: facility-waste-collection
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Facility Waste Collection
- titleJa: ごみ回収・整理
- subtitle: オフィス・施設でのゴミ箱回収・分別・収集スペースへの搬送をヒューマノイドが実施する用途。
- summary: オフィス・施設でのゴミ箱回収・分別・収集スペースへの搬送をヒューマノイドが実施する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-semi-controlled / 屋内（半管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、自律 (autonomy)
- primaryIndustry: 施設管理 (facility-management)
- industryTags: 施設管理 (facility-management)
- taskTags: 清掃・衛生管理 (cleaning)、搬送・マテハン (material-handling)
- atAGlance.whereFits: オフィスビル・マンション・施設のゴミ回収。定期的なルート巡回と回収作業。
- atAGlance.whereDoesNotFit: 大型・重量廃棄物の回収、有害廃棄物の処理（専門設備が必要）。
- atAGlance.mustBeTrue: ゴミ箱の位置・種類を標準化でき、分別ルールをロボットに教示できる体制がある。
- overview: 1X Technologiesが施設向けゴミ回収ユースケースを訴求。オフィスビル・施設での実証フェーズにあり、施設管理DXの一環として注目されている。
- whyItMatters: 施設管理スタッフの確保難と、深夜・早朝の施設清掃需要を解決できる可能性がある。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 多様なゴミ箱形状への把持と積み下ろし能力が必要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: 施設内の動的な障害物（人・荷物）を避ける自律ナビゲーションが求められる。
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 標準化されたゴミ箱レイアウト、収集スペースへの動線、充電ステーション。
- whyHardToday: ゴミ箱の多様な形状・重量への対応、分別精度の確保が技術課題。
- japanDeploymentConditions: 廃棄物処理法・建築物管理法への適合、施設管理者との廃棄物分別ルール整合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 1X Technologies NEO [onex-neo] | fit=possible | basis=official-use-case | reason=1X Technologies NEO が施設内ゴミ回収・整理タスクを実証している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.1x.tech/androids/neo

Sources (1件):
- 1X NEO use cases | 1X Technologies | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.1x.tech/androids/neo

### 道案内・館内ガイド (facility-wayfinding)

- slug: facility-wayfinding
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Facility Wayfinding
- titleJa: 道案内・館内ガイド
- subtitle: 商業施設・病院・空港での来訪者への道案内・館内案内をヒューマノイドが実施する用途。
- summary: 商業施設・病院・空港での来訪者への道案内・館内案内をヒューマノイドが実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、コミュニケーション (communication)、自律 (autonomy)
- primaryIndustry: 施設管理 (facility-management)
- industryTags: 施設管理 (facility-management)
- taskTags: 接客・案内・配膳 (customer-service)、巡回・警備 (patrol)
- atAGlance.whereFits: 商業施設・病院・空港など来訪者が多い施設。対話型案内が必要な場所。
- atAGlance.whereDoesNotFit: 複雑な法的・医療的説明が必要な窓口対応。不特定多数への緊急情報伝達。
- atAGlance.mustBeTrue: 案内情報（フロアマップ・店舗情報）をデジタル管理でき、ロボットが自律移動できる環境が整っている。
- overview: Aeolus aeo は商業施設・病院での道案内ロボットとして日本で実稼働事例があり、最も成熟した施設管理ユースケースの一つ。
- whyItMatters: 受付・案内スタッフの人手不足と、多言語対応ニーズに応えられる。
- capabilityNotes.mobility: 来訪者が多い中での安全な自律移動が必須。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: 自然言語での問い合わせ応答と施設情報の多言語対応が重要。
- capabilityNotes.integration: なし
- environmentRequirements: 施設情報システムとの連携、多言語対応 AI、充電ステーション（受付付近）。
- whyHardToday: 複雑な質問への対応限界、人との密な混在環境でのナビゲーション安全性が課題。
- japanDeploymentConditions: 個人情報の取り扱い（案内時の音声・映像記録）、バリアフリー基準への適合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Aeolus Robotics aeo [aeolus-aeo] | fit=possible | basis=official-use-case | reason=Aeolus aeo が商業施設・医療機関での道案内・館内ガイドを公式ユースケースとして訴求。日本での導入実績あり。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://aeolusbot.com/

Sources (1件):
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### 警備巡回 (facility-security-patrol)

- slug: facility-security-patrol
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Facility Security Patrol
- titleJa: 警備巡回
- subtitle: オフィスビル・商業施設・倉庫の夜間警備巡回をヒューマノイドが実施する用途。
- summary: オフィスビル・商業施設・倉庫の夜間警備巡回をヒューマノイドが実施する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、知覚 (perception)、データ取得 (data-capture)、自律 (autonomy)
- primaryIndustry: 施設管理 (facility-management)
- industryTags: 施設管理 (facility-management)
- taskTags: 巡回・警備 (patrol)
- atAGlance.whereFits: 夜間無人施設の巡回点検・異常検知・記録。定型ルートの監視巡回。
- atAGlance.whereDoesNotFit: 不審者制圧・緊急時の実力行使（法的制約）。屋外での夜間巡回（耐候性が必要）。
- atAGlance.mustBeTrue: 異常検知時の緊急連絡フロー（警備会社等）が整備されており、ロボットは通報役に徹する運用がある。
- overview: onex-eveやAeolus aeoが施設警備巡回を訴求。夜間無人化ニーズと防犯カメラでは捉えきれない死角への対応として注目度が高い。
- whyItMatters: 警備員不足と夜間人件費削減のニーズが重なり、警備巡回ロボットの市場は急成長している。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: 暗所での異常検知（熱センサ・赤外線カメラ）が有効。
- capabilityNotes.autonomy: 夜間施設での自律ナビゲーション精度が重要。
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 夜間照明または暗視センサ対応、セキュリティシステムとの連携、充電ステーション。
- whyHardToday: 夜間環境での認識精度、誤報（false positive）管理、実力行使禁止の法的制約が課題。
- japanDeploymentConditions: 警備業法への適合（機械警備の届け出等）、個人情報保護法上の映像管理規制への準拠が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (2件):
- 1X Technologies Eve [onex-eve] | fit=possible | basis=official-use-case | reason=1X TechnologiesのEVEが施設警備巡回ユースケースを訴求している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.1x.tech/
- Aeolus Robotics aeo [aeolus-aeo] | fit=possible | basis=official-use-case | reason=Aeolus aeoが施設での巡回・警備補助ユースケースに対応している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://aeolusbot.com/

Sources (2件):
- 1X Technologies use cases | 1X Technologies | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.1x.tech/
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### 机・棚整理 (facility-desk-tidying)

- slug: facility-desk-tidying
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Facility Desk Tidying
- titleJa: 机・棚整理
- subtitle: オフィス・図書館・会議室での机・棚の整理片付けをヒューマノイドが実施する用途。
- summary: オフィス・図書館・会議室での机・棚の整理片付けをヒューマノイドが実施する用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: limited-today / 現時点では限定的
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)
- primaryIndustry: 施設管理 (facility-management)
- industryTags: 施設管理 (facility-management)
- taskTags: 搬送・マテハン (material-handling)、清掃・衛生管理 (cleaning)
- atAGlance.whereFits: オフィス・図書館での定時片付け。物品配置ルールが明確な施設。
- atAGlance.whereDoesNotFit: 個人のデスク整理（プライバシー・重要物の誤操作リスク）、大量の多様品目の整理。
- atAGlance.mustBeTrue: 整理対象物の「正しい位置」をロボットに教示でき、プライバシーへの配慮ルールが整備されている。
- overview: Aeolus aeo が施設内の物品整理・片付けを実証。単純な繰り返し整理タスクは実現可能性が高く、PoC段階にある。
- whyItMatters: 施設管理スタッフの業務負荷を下げ、清潔・整頓された環境を維持できる。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 多様な形状の物品の把持と定位置への戻し作業が必要。
- capabilityNotes.perception: 物品の位置・種類の識別と「正しい配置」の学習が求められる。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 物品配置マップの整備、ロボットが移動できる通路幅の確保、充電スペース。
- whyHardToday: 物品の多様性への汎化と、重要物・私物を誤操作しない判断能力が技術課題。
- japanDeploymentConditions: 施設利用者のプライバシー保護、施設管理規定との整合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Aeolus Robotics aeo [aeolus-aeo] | fit=possible | basis=official-use-case | reason=Aeolus aeo が施設内の物品整理・片付け補助ユースケースを実証している。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://aeolusbot.com/

Sources (1件):
- Aeolus Robotics aeo product page | Aeolus Robotics | reliability=official/公式情報 | checkedAt=2026-06-30 | https://aeolusbot.com/

### 創薬・実験自動化 (research-drug-discovery)

- slug: research-drug-discovery
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Research Drug Discovery
- titleJa: 創薬・実験自動化
- subtitle: 製薬・バイオテクノロジー研究における試薬分注・プレート操作・実験器具操作をヒューマノイドで自動化する用途。
- summary: 製薬・バイオテクノロジー研究における試薬分注・プレート操作・実験器具操作をヒューマノイドで自動化する用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: initial-adoption / 初期導入向き
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、知覚 (perception)、連携 (integration)
- primaryIndustry: 研究・開発 (research)
- industryTags: 研究・開発 (research)
- taskTags: 研究・実験・検証 (research-task)、組立・加工 (assembly)
- atAGlance.whereFits: 製薬・バイオ研究所での試薬分注・実験プレート操作・標準的な実験器具操作。
- atAGlance.whereDoesNotFit: 高度な研究判断を要する実験設計、超精密・クリーンルーム要件の高い工程。
- atAGlance.mustBeTrue: 実験プロトコルを標準化でき、ロボットが操作する機器のAPIインターフェースがある。
- overview: NEXTAGE（川崎ロボティクス）は製薬研究所での試薬分注・実験補助での導入実績があり、創薬研究の自動化で最も実用化が進んでいるヒューマノイドユースケース。
- whyItMatters: 実験の24時間自動化により、創薬サイクルを短縮し研究生産性を大幅に向上できる。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: マイクロリットル単位の精密分注と器具の高精度操作が必要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: LIMS（実験室情報管理システム）との連携が実用化の鍵。
- environmentRequirements: 実験台の標準化レイアウト、LIMS連携、清掃可能な設計（試薬こぼれ対応）。
- whyHardToday: 試薬の多様性（粘度・揮発性等）への対応、高精度分注の再現性確保が課題。
- japanDeploymentConditions: 薬機法・化学物質管理法への適合、安全データシートに基づく取り扱いルールの整備が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- 川崎重工業 NEXTAGE [kawasaki-nextage] | fit=possible | basis=official-use-case | reason=NEXTAGEが製薬・研究所での実験自動化ユースケースで複数の導入実績を持つ。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

Sources (1件):
- NEXTAGE product page | 川崎ロボティクス | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/

### AI学習・シミュレーション環境 (research-ai-simulation)

- slug: research-ai-simulation
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Research AI Simulation
- titleJa: AI学習・シミュレーション環境
- subtitle: AIモデルの学習データ収集・物理シミュレーション検証にヒューマノイドを使う用途。
- summary: AIモデルの学習データ収集・物理シミュレーション検証にヒューマノイドを使う用途。
- maturityLevel: production-ready / 実運用候補
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: マニピュレーション (manipulation)、移動 (mobility)、知覚 (perception)、自律 (autonomy)
- primaryIndustry: 研究・開発 (research)
- industryTags: 研究・開発 (research)
- taskTags: 研究・実験・検証 (research-task)
- atAGlance.whereFits: AI基盤モデルのロボット学習データ収集、物理AIのシミュレーション実証環境。
- atAGlance.whereDoesNotFit: 既存アルゴリズムの最終製品テスト（別途検証環境が適切）。
- atAGlance.mustBeTrue: データ収集インフラ（ストレージ・通信）が整備されており、倫理・知的財産の管理ルールがある。
- overview: Figure AIはFigure 02/03をAI学習プラットフォームとして自社利用しており、OpenAI・NVIDIAとの提携でAIロボット学習の中核インフラとして位置付けている。
- whyItMatters: 高品質なロボット動作データが、次世代AI基盤モデルの性能を左右する時代になっている。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 多様なタスクでのデータ収集能力の多様性が重要。
- capabilityNotes.perception: 高解像度センサによるリッチなデータ収集が求められる。
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: データ収集・処理インフラ、セキュアなストレージ、高速通信環境。
- whyHardToday: 収集データのラベリングコスト、シミュレーションとの現実ギャップ（sim-to-real）が課題。
- japanDeploymentConditions: 知的財産法・個人情報保護法（学習データへの人物映像含む場合）への適合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (2件):
- Figure AI Figure 02 [figure-02] | fit=possible | basis=official-use-case | reason=Figure AIがFigure 02をAI学習データ収集・シミュレーションプラットフォームとして公式に運用。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.figure.ai/
- Figure AI Figure 03 [figure-03] | fit=possible | basis=official-use-case | reason=Figure 03はFigure 02の後継として同様のAI学習プラットフォーム用途を継承。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.figure.ai/

Sources (1件):
- Figure AI use cases | Figure AI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.figure.ai/

### HRI実験・社会受容研究 (research-hri-study)

- slug: research-hri-study
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Research HRI Study
- titleJa: HRI実験・社会受容研究
- subtitle: ヒューマノイドと人間の相互作用（HRI）・社会的受容性を研究するための実験環境としての用途。
- summary: ヒューマノイドと人間の相互作用（HRI）・社会的受容性を研究するための実験環境としての用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、コミュニケーション (communication)、自律 (autonomy)
- primaryIndustry: 研究・開発 (research)
- industryTags: 研究・開発 (research)
- taskTags: 研究・実験・検証 (research-task)
- atAGlance.whereFits: 大学・研究機関でのHRI実験環境。人とロボットの共存・協調に関する社会的研究。
- atAGlance.whereDoesNotFit: 一般消費者向けサービス（まだ研究段階）、高リスク医療・産業現場での実験。
- atAGlance.mustBeTrue: 倫理委員会の承認が取得でき、実験参加者への十分なインフォームドコンセントが確保できる。
- overview: Figure 02はHRI研究での利用実績があり、大学・研究機関でのソーシャルロボティクス研究に活用されている。
- whyItMatters: ヒューマノイドの社会受容性研究は、実用化に向けた法規制・倫理ガイドライン策定に直結する。
- capabilityNotes.mobility: 人と共存する空間での安全な移動が必須。
- capabilityNotes.manipulation: なし
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: なし
- capabilityNotes.communication: 自然言語での応答・非言語コミュニケーション（身振り等）の研究用能力が重要。
- capabilityNotes.integration: なし
- environmentRequirements: 研究室・実験スペース、映像記録インフラ、倫理委員会承認体制。
- whyHardToday: 長時間・多様なシナリオでの安定動作、研究用データ収集インフラの整備が課題。
- japanDeploymentConditions: 機関内倫理委員会の承認、個人情報保護法への適合（実験映像の管理）が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Figure AI Figure 02 [figure-02] | fit=possible | basis=official-use-case | reason=Figure 02がHRI・AI研究向けプラットフォームとして研究機関に提供されている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.figure.ai/

Sources (1件):
- Figure AI use cases | Figure AI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.figure.ai/

### 試作・実証開発 (research-prototype-dev)

- slug: research-prototype-dev
- publishStatus: published
- updatedAt: 2026-06-30
- reliability: reported / 報道/調査
- nextReviewBy: なし
- title: Research Prototype Development
- titleJa: 試作・実証開発
- subtitle: 企業・研究機関での新動作・新アルゴリズム・新アクチュエータの試作実証にヒューマノイドを使う用途。
- summary: 企業・研究機関での新動作・新アルゴリズム・新アクチュエータの試作実証にヒューマノイドを使う用途。
- maturityLevel: pilot-phase / PoC・実証
- buyerReadiness: requires-poc / 要PoC
- environment: indoor-controlled / 屋内（管理環境）
- requiredCapabilities: 移動 (mobility)、マニピュレーション (manipulation)、知覚 (perception)、自律 (autonomy)
- primaryIndustry: 研究・開発 (research)
- industryTags: 研究・開発 (research)
- taskTags: 研究・実験・検証 (research-task)
- atAGlance.whereFits: 企業R&D部門・大学研究室での動作アルゴリズム・センサ・アクチュエータの試作検証。
- atAGlance.whereDoesNotFit: 量産品質が求められる製品テスト、一般公開環境での実演（研究倫理上の制約がある）。
- atAGlance.mustBeTrue: 試作・改造に対応できるオープンなAPIと十分な技術サポートがある。
- overview: Figure 03はオープンな開発環境を提供しており、企業・研究機関での試作・実証開発プラットフォームとして活用されている。
- whyItMatters: 次世代ヒューマノイドの量産化には、多様な試作・実証フェーズを経た技術成熟が不可欠。
- capabilityNotes.mobility: なし
- capabilityNotes.manipulation: 試作グリッパ・ツールの換装・テストに対応できる設計が重要。
- capabilityNotes.perception: なし
- capabilityNotes.autonomy: 新しい動作アルゴリズムの安全な検証環境が必要。
- capabilityNotes.communication: なし
- capabilityNotes.integration: なし
- environmentRequirements: 試作環境（工具・材料）、安全囲い・停止装置、データ収集インフラ。
- whyHardToday: 試作改造の自由度とロボット本体の安全性・保証のバランスが課題。
- japanDeploymentConditions: 機器安全基準（CE/PSE）への適合確認、研究機関の設備安全管理規程への適合が必要。

実装上この用途に紐づく導入事例 (0件):
- なし

関連記事 (0件):
- なし

候補ロボット (1件):
- Figure AI Figure 03 [figure-03] | fit=possible | basis=official-use-case | reason=Figure 03が研究・試作開発向けにオープンなプラットフォームとして提供されている。 | evidenceDeploymentIds=なし | evidenceSourceUrls=https://www.figure.ai/

Sources (1件):
- Figure AI use cases | Figure AI | reliability=official/公式情報 | checkedAt=2026-06-30 | https://www.figure.ai/

## Research後にコードへ戻すときの注意

- `data/useCases.ts` を更新する場合は、公開UseCaseの `sources` と `candidateRobots[].basis/evidence...` を必ず整合させる。
- `titleJa` を変えても `id` は変更しない。URL変更が必要なときだけ `slug` を変更し、旧slugを `previousSlugs` に追記する。
- 根拠が薄い用途は `publishStatus: draft` に戻すか、候補ロボットを削除して公開品質を満たす。
- 更新後は `npm run validate:data` と、UI影響がある場合は `npm run build` を実行する。
