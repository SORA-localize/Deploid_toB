# DATA-R02-10: USE_CASE_GAP triage

Status: docs only（`data/*.ts` 変更なし）。対象: `docs/data/DATA-R02-B01.json`〜`B10.json` の `useCaseGaps[]` 全51件。

分類は4種類（`robot-data-r02-integration-plan-v1.md` §R02-10 準拠）。

- `existing-match` — 表現が一般的・汎用的だが、既存UseCaseの粒度（他robotの接続実績）と整合する。将来の小規模batchで `candidateRobots` に追加できる候補。今回はdocsのみで実データは変更しない。
- `new-use-case-candidate` — 複数ロボット・複数メーカー・複数一次根拠が同一テーマに集まっており、新規UseCase（draft）を別計画で起こす価値がある。
- `editorial-only` — メーカー公式の用途宣言ではない（代理店・パートナー発表など）、または既にusageExamplesとして処理済みで、UseCase接続の対象外。
- `hold` — 単一ロボット・単一根拠、または表現が一般的すぎて既存/新規どちらのUseCaseにも確信を持って接続できない。将来追加の一次情報を待つ。

## サマリ

| 分類 | 件数 |
| --- | --- |
| new-use-case-candidate | 9 |
| existing-match | 7 |
| editorial-only | 2 |
| hold | 33 |
| **合計** | **51** |

## new-use-case-candidate（2クラスタ、9件）

### クラスタA: エンタメ・ステージパフォーマンス（6件・3メーカー）

既存UseCaseのどれにも「エンタメ・パフォーマンス」の粒度がなく、AgiBot（4機）・UBTECH（1機）・LimX（1機）という複数メーカーの公式ページが同一テーマ（ダンス・ステージ演出・ブランドアンバサダー・観客対応）を明記している。新規UseCase（draft、例: `entertainment-performance`）を別計画で起こす価値がある。

| robotId | 表現 | evidenceSourceUrl |
| --- | --- | --- |
| agibot-a2-ultra | A Rising Star in the Entertainment and Commercial Performance Industry / IP-Customized Brand Ambassador | https://www.agibot.com/products/A2_Ultra |
| agibot-a2-lite | entertainment / cultural and commercial performances / theme-park promotion | https://www.agibot.com/products/A2_Pro |
| agibot-x2 | entertainment and commercial performance (lifelike dance/interaction) | https://www.agibot.com/products/X2 |
| agibot-x2-ultra | entertainment performance / tourism ambassador roles | https://www.agibot.com/products/X2 |
| ubtech-walker-c | Public-zone entertainment / stage performance and voice broadcasting at cultural events | https://www.ubtrobot.com/en/humanoid/products/walker-c |
| limx-oli | Entertainment & Performance | https://www.limxdynamics.com/en/products/oli |

### クラスタB: 家庭内サービス・家事支援（3件・3メーカー）

既存UseCaseに家庭向け（B2C寄り）のIDが存在しない。1X・Figure・Lejuという3メーカーが具体的なタスク（洗濯・食器洗い・清掃・ドア対応、家庭サービス全般）を公式に明記しており、多ロボット・多一次根拠の基準を満たす。B2B購買判断ポータルとしての適合度は要検討（家庭用途は本サイトの主対象=法人導入と軸がずれる可能性があるため、新規UseCase化の是非は別計画での編集判断に委ねる）。

| robotId | 表現 | evidenceSourceUrl |
| --- | --- | --- |
| onex-neo | household chores: getting the door, laundry, dishwashing, bathroom cleaning | https://www.1x.tech/neo |
| figure-03 | 家庭内タスク（洗濯・清掃・食器洗い）の遂行を想定した設計 | https://www.figure.ai/news/introducing-figure-03 |
| leju-kuavo5 | 家庭服务 (home service) | https://www.lejurobot.com/zh/products/kuavo-5 |

補足（クラスタBの弱い支持材料、単独では`hold`扱い）: `ubtech-walker-x`（家電AIoT制御）、`engineai-se01`（industrial and household 汎用）、`fourier-gr3`（介護コンパニオン会話）、`mentee-menteebotv3`（household assistance and elderly care、NVIDIA発表内の一項目）。新規UseCase化を検討する際の追加根拠として参照可能。

## existing-match（7件）

表現は一般的だが、同一UseCase内の既存承認済みrelation（agility-digit・sanctuary-phoenix等）と同等の粒度で既に接続実績があるため、将来の小規模batchで`candidateRobots`へ追加できる。

| robotId | 表現 | 接続候補UseCase | 根拠 |
| --- | --- | --- | --- |
| agibot-g2 | wheeled industrial precision assembly / continuous 24h operation, quality inspection | factory-assembly-support | 既に同UseCaseへ接続済み（本セッションでLongcheer導入事例のURLを追加）。24h稼働・品質検査のニュアンスは同一relationの範囲内として扱える。 |
| apptronik-apollo-2 | Packout: placing picked items into boxes, positioning on conveyors | warehouse-picking | 同ロボットは既に`goods-to-person`根拠で同UseCaseへ接続済み。Packoutは同じ倉庫内搬送タスクの一部として扱える粒度。 |
| apptronik-apollo-2 | Retail: general-purpose automation for dynamic retail fulfillment | warehouse-picking | 同上。retail fulfillmentは倉庫・出荷オペレーションの一般化表現。 |
| kepler-k2 | Warehousing and logistics（汎用ドメイン記述） | warehouse-picking | 同UseCase内のagility-digit/sanctuary-phoenixも同程度に汎用的な「倉庫自動化」表現で接続済みの前例がある。 |
| kepler-k1 | Warehousing & Logistics（汎用ドメイン記述） | warehouse-picking | 同上。 |
| leju-kuavo5 | 商业讲解/引导（commercial guidance） | customer-reception | customer-receptionの既存接続と同等の粒度。ただし出典ページの記述が薄いため、接続前に再確認を推奨（tentative）。 |
| wandercraft-calvin | SAPA deployment: high-precision, repetitive movement of large/heavy parts | factory-assembly-support または warehouse-picking | 同ロボットは両UseCaseに既に接続済み（factory-assembly-supportはdeployment基準、warehouse-pickingはofficial-use-case基準）。SAPA事例はどちらの根拠としても補強に使える。 |

## editorial-only（2件）

| robotId | 表現 | 理由 |
| --- | --- | --- |
| unitree-h1 | GMO AI & Robotics（国内代理店）による物流・製造・施設管理・建設・空港運用という対象業種フレーミング | Unitree自身の公式用途宣言ではなく国内代理店の発表。UseCase接続ではなく、日本市場向け解説記事等の編集コンテンツとして活用余地がある。 |
| engineai-pm01 | 智慧交管（交通指挥）／门店导购・接客（Duolun Technology経由の実導入） | 既にDATA-R02バッチでusageExamplesとして記録済み（officialUseCasesではない）。追加のUseCase接続作業は不要。 |

## hold（33件）

単一ロボット・単一根拠、または表現が一般的すぎて確信を持った接続ができないもの。将来、追加の一次情報（具体的タスク名・複数根拠）が得られた時点で再評価する。

| robotId | 表現（要約） | evidenceSourceUrl |
| --- | --- | --- |
| unitree-h2 | 汎用マルチシナリオ訴求、タスク名なし | https://www.unitree.com/mobile/H2/ |
| unitree-h2-edu | 二次開発向け推定のみ、明示的な研究/教育文言なし | https://www.unitree.com/mobile/H2/ |
| unitree-g1-d | Service/Life/Retail/Industryの4分類のみ、タスク名なし | https://www.unitree.com/mobile/G1-D |
| agibot-a2 | LLM+RAGによるマーケティング・営業相談 | https://www.agibot.com/products/A2 |
| agibot-a2-max | material handling and palletizing（単一ロボットの重量物特化ニッチ） | https://www.agibot.com/products/A2_Max |
| ubtech-walker-x | AIoT経由の家電制御 | https://www.ubtrobot.com/en/humanoid/products/walker-x |
| ubtech-walker-x | 'intelligent and caring service across scenarios'（意図的に汎用） | https://www.ubtrobot.com/en/humanoid/products/walker-x |
| ubtech-walker-tienkung | 教室・カリキュラム教育（研究用途と別軸） | https://www.ubtrobot.com/en/ai-education/products/walker-tienkung |
| fourier-gr3 | 感情を読み取る社会的コンパニオン・介護寄り対話 | https://support.fftai.com/en/getting-started/general-information |
| fourier-gr3c | 複雑環境下でのより高精度な作業（タスク名なし） | https://www.fftai.com/grx/gr3 |
| engineai-se01 | 産業・家庭向け汎用ヒューマノイド（タスク名なし） | https://www.engineai.com.cn/about-news-media/23.html |
| apptronik-apollo | retail, home delivery and elder care（将来応用として列挙のみ） | https://apptronik.com/news-collection/apptronik-unveils-apollo |
| onex-neo | manufacturing/warehousing/logistics/facility-ops/healthcare（EQT提携先業種の列挙） | https://www.businesswire.com/news/home/20251211360340/en/... |
| onex-eve | "handling industrial tasks autonomously"（タスク名なし） | https://www.1x.tech/about |
| booster-t1 | RoboCup AdultSize（競技用途、購買判断とは軸が異なる） | https://www.booster.tech/robocup/ |
| booster-k1 | RoboCup KidSize（同上） | https://www.booster.tech/robocup/ |
| kepler-k2 | Specialized Industries / high-risk operations（汎用） | https://www.gotokepler.com/productDetailK2?id=2 |
| kepler-k1 | High-risk Environment（汎用） | https://gotokepler.com/productDetailK1 |
| kepler-k1 | Outdoor Tasks（汎用） | https://gotokepler.com/productDetailK1 |
| leju-kuavo5 | 工业制造（汎用） | https://www.lejurobot.com/zh/products/kuavo-5 |
| leju-kuavo5 | 户外巡检（既存factory-inspectionは屋内限定のため不一致） | https://www.lejurobot.com/zh/products/kuavo-5 |
| limx-oli | Equipment Inspection（既存factory-inspectionは屋内工場限定） | https://www.limxdynamics.com/en/products/oli |
| limx-oli | Industrial Operations（汎用） | https://www.limxdynamics.com/en/products/oli |
| limx-oli | Property Management（単独、既存UseCaseなし） | https://www.limxdynamics.com/en/products/oli |
| tesla-optimus | unsafe, repetitive or boring tasksの代替（社内利用限定・非公表段階） | https://www.tesla.com/AI |
| sanctuary-phoenix | dexterous work/assembly/material handling/picking/sorting（ソフトウェア一般論、ハード固有ではない） | https://sanctuary.ai/solutions/physical-ai/ |
| kawasaki-kaleido | 災害対応・高所作業の開発方向性（将来応用、商用UseCase未確定） | https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/ |
| neura-4ne-1 | 労働力不足対応・身体的タスク支援・サービス体験向上（汎用） | https://neurarobotics.px.media/plk/cE/NEURA_Robotics_4NE1_Datasheet_Web.pdf |
| xpeng-iron | traffic diversion（交通誘導、単独・既存UseCaseなし） | https://www.xpeng.com/pressroom/news/019a56f54fe99a2a0a8d8a0282e402b7 |
| mentee-menteebotv3 | industrial manufacturing / retail-logistics / household / elderly-care（NVIDIA発表内の業種列挙、自社一次情報ではない） | https://nvidia.com/en-us/customer-stories/mentee-robotics |
| robotera-l7 | sorting / barcode scanning / screw fastening（報道ソース、自社ページで未確認） | https://finance.yahoo.com/news/robotera-unveils-robot-l7-full-014200227.html |
| robotera-q5 | hospitality/cultural-tourism/hotels/elderly-care/education（CES報道、自社ページで未確認） | https://www.autonomyglobal.co/robotera-showcases-its-hexa-core-robotics-lineup-at-ces-2026/ |
| robotera-m7 | lab experiments/telepresence/HRI-testing（リセラー掲載、自社一次情報未確認） | https://www.americansatellite.us/Robotera-M7-Upper-Body-Humanoid-Robot.htm |

## 次のアクション（この文書の範囲外）

- `existing-match` 7件: 別の小規模batchで対象UseCaseの`sources[]`と`candidateRobots[].evidenceSourceUrls`を更新する（1機ずつ、通常のG2〜G6ゲートに従う）。
- `new-use-case-candidate` 2クラスタ: 新規UseCase（`publishStatus: 'draft'`）を起こすかどうかの編集判断を別計画で行う。特にクラスタB（家庭内サービス）は本サイトの主対象（法人導入）との整合性を先に判断する必要がある。
- `editorial-only` 2件: データ変更不要。`unitree-h1`は日本市場向け解説コンテンツの素材候補として記録のみ。
- `hold` 33件: 追加の一次情報（複数ロボット化・具体的タスク名の公式明記）が得られるまで保留。
