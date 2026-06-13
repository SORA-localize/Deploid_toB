import type { Article } from './types';

export const articles: Article[] = [
  {
    id: 'bmw-figure-deployment',
    slug: 'bmw-figure-deployment',
    title: 'Figure 02 completed 11-month BMW pilot — what Japanese buyers should read into it',
    titleJa: 'Figure 02 が BMW Spartanburg で11ヶ月実証を完了、日本企業の読み筋',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: 'Figure 02 は BMW Spartanburg で約11ヶ月の実証を完遂し、Figure AI は後継 Figure 03 へ移行した。日本企業がここから読み取るべき論点を整理する。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    publishedAt: '2026-05-28',
    author: 'Deploid Research',
    tags: ['manufacturing', 'poc', 'figure', 'bmw'],
    heroImage: {
      src: '',
      alt: 'Figure robot at BMW plant',
      credit: 'BMW Group / Figure AI',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        checkedAt: '2026-06-02',
      },
    },
    whyItMatters:
      '製造現場で完遂された実証としては最も明確な公開事例の1つ。作業選定（板金パーツの装着）、評価KPI（精度・サイクル時間）、稼働形態（10時間シフト×週5）、世代交代のスピード、いずれも日本企業がヒューマノイドのPoCを設計する際の比較基準になる。',
    keyTakeaways: [
      'Figure公式発表ベース：11ヶ月稼働で30,000台超のBMW X3生産に貢献、90,000点超の部品をロード',
      'サイクル84秒・配置精度99%以上は、実績値ではなくFigureが定義したKPI要求／目標値として扱う',
      '実証完遂を機にFigure 02は退役、後継Figure 03へ移行 — 世代交代のスピードはベンダー継続性リスクとして必ず織り込む',
      'PoCの作業範囲を狭く・固定化（同じ部品の同じ動作）したことが定量結果に直結している',
      '実証完了 ≠ 一般販売可能。Figure はまだ外部企業への販売条件を公表していない',
    ],
    readingTimeMin: 6,
    body: `## 実証の前提条件

BMW Spartanburg は Figure 02 に対して、板金パーツ（BMWが「VIN プレート」と呼ぶ車体識別番号プレートを含む複数の金属パーツ）を所定の治具に装着する単一タスクを割り当てた。Figure AI 公式発表によると稼働形態は10時間シフト・週5日で、作業範囲を意図的に狭く・固定化している。この「スコープの絞り込み」が後述の定量結果に直結している。

## 発表された数値の読み方

Figure AI は「30,000台超の BMW X3 生産に貢献」「90,000点超の部品をロード」「サイクル84秒・配置精度99%以上」を公式発表している。これらの数値を読む際には以下の点に注意が必要だ。

- **サイクル時間・精度は KPI 要求値または目標値であり、実測平均値ではない**と Deploid は判断している（Figure AI の発表には「達成した平均値」という表現はない）
- 「30,000台超の生産に貢献」は、ロボットが稼働した期間中に Spartanburg で生産された台数であり、ロボット単体の生産効率を示すものではない
- 実証期間は約11ヶ月で、その間の稼働率・ダウンタイム・人間の補助介入率は非公開

## Figure 03 への世代交代が意味すること

実証完遂を機に Figure 02 は退役し、後継の Figure 03 への移行が発表された。これは技術進化の速さを示す一方、**ベンダー継続性リスク**として必ず評価に織り込む必要がある。

日本企業が PoC を設計する際は「PoC 実施中に後継モデルに切り替わった場合の対応コスト（再トレーニング・再検証・契約変更）」を事前にベンダーと合意しておくことが望ましい。

## 日本市場への適用上の注意

Figure はまだ外部企業への販売条件・価格・調達経路を公表していない（要確認）。国内代理店も未発表。現時点では **「どのような条件で調達できるか」を把握するための問い合わせ段階** にとどまる。`,
    featured: true,
    relatedRobotIds: ['figure-02', 'figure-03'],
    relatedManufacturerIds: ['figure-ai'],
    relatedUseCaseIds: ['warehouse-picking', 'factory-inspection'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'F.02 Contributed to the Production of 30,000 Cars at BMW',
        url: 'https://www.figure.ai/news/production-at-bmw',
        publisher: 'Figure AI',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
      {
        title: 'Humanoid Robots for BMW Group Plant Spartanburg',
        url: 'https://www.bmwgroup.com/en/news/general/2024/humanoid-robots.html',
        publisher: 'BMW Group',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'gxo-digit-100k-totes',
    slug: 'gxo-digit-100k-totes',
    title: 'Agility Digit passes 100,000 totes at GXO under RaaS contract',
    titleJa: 'Agility Digit、GXOの倉庫で10万トート搬送達成（商用 RaaS の先行事例）',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: 'Agility Robotics の Digit が、GXO ジョージア州 Flowery Branch 拠点での RaaS 契約による商用稼働で累計10万トート搬送を達成した。買い切りではなく「サービスとして導入する」モデルの先行例。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    publishedAt: '2026-05-28',
    author: 'Deploid Research',
    tags: ['logistics', 'raas', 'agility', 'gxo'],
    heroImage: {
      src: '/images/articles/gxo-digit-100k-totes/hero.jpg',
      alt: 'Digit robot moving totes at GXO',
      credit: 'Agility Robotics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'ヒューマノイドの商用導入で「機体を買う」のではなく「ロボットをサービスとして導入する」契約形態（RaaS）が量的成果を出した稀有な例。買い切りに対する代替形態として、調達形態の議論に直接インパクトを持つ。',
    keyTakeaways: [
      '累計10万トート以上の搬送をGXO拠点で達成（Agility公式発表）',
      '契約形態は RaaS と公表。ただし価格・課金単位・SLAなど詳細条件は未公表',
      'タスクは物流倉庫の構造化された環境（トート搬送・AMR連携）で、現状のヒューマノイドが最も成立しやすい領域',
      '日本では同等の RaaS 契約・国内サービス窓口は未確認',
    ],
    readingTimeMin: 5,
    body: `## RaaS とはどういう契約形態か

従来の産業用ロボット調達は「機体購入＋保守契約」が基本だった。RaaS（Robot as a Service）はこれを根本から変える。企業は機体を所有せず、稼働量・時間・成果に応じた利用料を支払う。初期投資が抑えられる一方、SLAの中身（稼働保証・故障対応・更新タイミング）が契約の核になる。

## GXO拠点での実証内容

GXO ジョージア州 Flowery Branch 拠点に導入された Agility Digit は、AMR（自律搬送ロボット）と連携して空トートバッグの回収・仕分けを担当した。Agilityは累計10万トート搬送を達成したと公式に発表している。ただし稼働率・ダウンタイム・人間の介入頻度といった詳細なオペレーション指標は非公表のため、この数値を単独で評価することには注意が必要だ。

## 「構造化された環境」が成果の前提

物流倉庫はヒューマノイドが最も成立しやすい環境のひとつだ。動線が設計済みで、扱う物体の形状がある程度一定で、人間との作業区域を分離しやすい。今回の10万トートという実績も、こうした「環境の設計」が先行したことで成立している。非構造環境（工場の曖昧な作業区域や、形状不定な物体のハンドリング）への適用は別の難易度になる。

## 日本企業が読み取るべき論点

RaaS モデルで最も重要なのは「何を SLA として合意するか」だ。稼働保証（uptime）、故障時の対応時間、世代更新のタイミングと追加費用、日本語対応窓口の有無——これらが契約の価値を決める。現時点でAgilityは国内に正式な販売・保守拠点を持っていないため、本格導入を検討する場合は代理店交渉と合わせて進める必要がある。`,
    relatedRobotIds: ['agility-digit'],
    relatedManufacturerIds: ['agility-robotics'],
    relatedUseCaseIds: ['warehouse-picking'],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Digit Moves Over 100,000 Totes in Commercial Deployment',
        url: 'https://www.agilityrobotics.com/content/digit-moves-over-100k-totes',
        publisher: 'Agility Robotics',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
    ],
  },
  // ── 2026年 最新ニュース ──────────────────────────────────────────
  {
    id: 'jal-haneda-unitree-pilot-2026',
    slug: 'jal-haneda-unitree-pilot-2026',
    title: "JAL launches Japan's first humanoid robot trial at Haneda — Unitree G1 handles ground ops",
    titleJa: 'JAL、羽田空港で国内初のヒューマノイド実証開始——Unitree G1 が地上業務に投入',
    type: 'deployment-report',
    category: 'news',
    section: 'deployment',
    summary: '日本航空（JAL）が2026年5月、羽田空港で国内航空会社として初めてヒューマノイドロボットの実証実験を開始した。GMO AI & Robotics が提供する Unitree G1 ベースの機体が、手荷物・貨物の積み降ろし等のグランドハンドリング業務を担当する。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'official',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    tags: ['japan', 'deployment', 'unitree', 'logistics'],
    heroImage: {
      src: '/images/articles/jal-haneda-unitree-pilot-2026/hero.jpg',
      alt: 'Unitree G1 humanoid robot on display at Japan Mobility Show 2025',
      credit: 'RuinDig (Yuki Uchida) / Wikimedia Commons (CC BY 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Japan-Mobility-Show-2025-RuinDig_0557.jpg',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'RuinDig (Yuki Uchida)',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '日本の大手レガシーキャリアが安全規制の厳しい空港現場でヒューマノイドを実運用に踏み切ったことは、国内の他業種への波及効果が大きい。使用機体が Unitree G1（研究・評価向けと見られていた廉価機）であること、GMO が制御ソフトを独自開発していることも、導入モデルとして参照価値が高い。',
    keyTakeaways: [
      '2026年5月開始・2028年まで2年間の実証。3年以内の商用化が目標（JAL公式発表）',
      '使用機体は Unitree G1（身長132cm・35kg）。GMO AI & Robotics が空港業務向けソフトを独自開発',
      '当面のタスクはコンテナ搬送・レバー開閉等の補助作業。将来的に手荷物積み降ろし・客室清掃・地上支援機材操作を想定',
      '稼働時間2〜3時間／充電サイクル——バッテリー交換体制の設計が運用コストの核になる',
      '人口高齢化による航空グランドハンドリング人材不足が実証の直接動機',
    ],
    readingTimeMin: 5,
    body: `## なぜ JAL が今、ヒューマノイドなのか

2026年5月、日本航空（JAL）は JAL グランドサービス株式会社と GMO AI & Robotics 株式会社と組み、羽田空港での国内初となるヒューマノイドロボット実証実験を開始した。背景にあるのは航空グランドハンドリング業界が直面する深刻な人材不足だ。

インバウンド需要の回復により空港の取扱量は増加する一方、日本の生産年齢人口の減少は加速している。荷物の積み降ろしや牽引といった肉体的負荷の高い業務は特に採用難が続いており、ヒューマノイドは「補助ではなく代替」としての位置付けで検討が始まっている。

## 使用機体の詳細：Unitree G1 + GMO の独自ソフト

今回の実証に使用されているのは Unitree Robotics（中国・杭州）の G1 をベースにした132cm・35kgの機体だ。23〜43自由度を持ち、最大時速7.2kmで移動できる。この機体自体は研究・教育用途で先行している廉価帯の機種だが、GMO AI & Robotics が空港グランドハンドリング業務向けに動作制御ソフトウェアを独自開発して搭載している。

「機体のベースは市場から調達、作業特化ソフトは内製」というモデルは、国内事業者がヒューマノイドを活用する際の現実的な構成パターンとして参照価値がある。

## 現在の実証タスクと将来計画

実証フェーズ1では、コンテナの搬送とロック・アンロック用レバーの開閉操作を担当する。いずれも人間の監督者が安全機能を保持しながら、ロボットが補助する形態だ。将来的には手荷物・貨物の積み降ろし、客室清掃、地上支援機材（GSE）の操作まで段階的に拡大する計画が示されている。

## 運用上の課題：バッテリー稼働時間

現時点で最も明確な制約は稼働時間だ。2〜3時間の運用後に充電（またはバッテリー交換）が必要なため、空港の連続稼働シフト（6〜8時間）に対応するには複数台のローテーション体制か、バッテリー交換ステーションの設置が不可欠になる。この制約はグランドハンドリング特有の「稼働密度の高いシフト」との相性で見極める必要がある。

## 日本のtoB事業者が読み取るべき論点

- **機体選択**: 廉価帯の Unitree G1 が「実証用途」として起点になっていることは、評価フェーズの初期コストが想定より低い可能性を示す
- **ソフト内製**: GMO が制御ソフトを独自開発している点は、システムインテグレーターの役割が今後の日本市場で重要になることを示唆する
- **2年間の実証期間**: 定量KPI・商用化条件は実証完了後に公表される見通し。短期での意思決定には使えないが、「どこで検証しているか」を把握する参照点として追う価値がある`,
    relatedRobotIds: ['unitree-g1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['warehouse-picking'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: "Japan's First Demonstration Experiment for Utilizing Humanoid Robots at Airports Begins",
        url: 'https://press.jal.co.jp/en/release/202604/009502.html',
        publisher: 'JAL Group',
        publishedAt: '2026-04-29',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: "Japan Airlines begins humanoid robot trials at Tokyo's Haneda airport as labor shortages bite",
        url: 'https://www.cnbc.com/2026/05/01/japan-airlines-humanoid-robots-haneda-labor-shortage.html',
        publisher: 'CNBC',
        publishedAt: '2026-05-01',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Japan Airlines to test humanoid robots for airport ground handling work',
        url: 'https://www.japantimes.co.jp/business/2026/04/28/companies/jal-humanoid-robot-use-airport/',
        publisher: 'The Japan Times',
        publishedAt: '2026-04-28',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'figure-botq-production-milestone-2026',
    slug: 'figure-botq-production-milestone-2026',
    title: "Figure's BotQ factory scales Figure 03 output from 1/day to 1/hour in four months",
    titleJa: 'Figure の BotQ 工場、Figure 03 を4ヶ月で1台/日→1台/時に増産——年産12,000台体制へ',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary: 'Figure AI が自社工場 BotQ（カリフォルニア州）で Figure 03 の量産ペースを4ヶ月未満で1日1台から1時間1台（24倍）に引き上げた。500台超を出荷済みで、年産12,000台・将来50,000台を目標とする。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    tags: ['figure', 'production', 'commercial', 'manufacturing'],
    whyItMatters:
      '「1時間に1台」というペースは、産業機械の量産水準に近づく変化点として重要だ。Honda・Toyota の自動車ラインとの比較は時期尚早だが、ヒューマノイドが「試作品」ではなく「量産品」として流通し始めたという事実は、調達コスト・納期・保守部品の供給体制を評価する上での前提が変わることを意味する。',
    keyTakeaways: [
      '4ヶ月未満で1日1台→1時間1台（24倍）。500台超出荷済み、9,000個超のアクチュエーター生産',
      '年産目標：現在12,000台、将来50,000台/年、4年後100,000台',
      '初回通過合格率80%超、バッテリー生産合格率99.3%（Figure公式）',
      'Figure 03 スペック：身長1.68m・60kg・44 DoF・ペイロード20kg・バッテリー約16時間・$20,000以下（目標、未確定）',
      '現在は商用パイロット限定。一般販売は2026年末以降の見通し',
    ],
    readingTimeMin: 4,
    body: `## 「量産」の水準が変わった

2026年、Figure AI の自社工場 BotQ（カリフォルニア州）が Figure 03 の生産ペースを1日1台から1時間1台へ引き上げた。この4ヶ月未満での24倍増は、ヒューマノイドが「高精度な試作品」から「量産品」に移行し始めたことを示す最も具体的な指標だ。

BotQ は150台以上のネットワーク化されたワークステーションで構成され、Figure が独自開発した製造実行システム（MES）が品質データをフルトレーサビリティで管理する。初回通過合格率80%超、バッテリー生産合格率99.3%という数値は、量産体制としての再現性が一定水準に達していることを示す。

## Figure 03 のスペックと商用パイロットの状況

Figure 03 は身長1.68m・重量60kg・44自由度・ペイロード20kgで、6つのオンボードカメラと指先に3グラム単位を検知できる触覚センサーを搭載する。制御AIは Helix（Figure 独自）で、音声指示→タスク実行のフローをオンデバイスで処理する。

価格は $20,000 以下を目標としているが、確定していない。現在は BMW を含む複数の商用パイロットパートナーへの限定提供にとどまり、一般販売は2026年末以降の見通しだ。

## 量産加速が日本の調達担当者に意味すること

量産ペースの加速は「調達しやすさ」に直結する可能性がある。一方で注意すべき点もある。

- **500台超の出荷実績**は総量として小さい。自動車1車種の月産台数（数万台）と比較すると、ヒューマノイドの量産は依然として桁が2〜3違う
- **商用パイロット限定の現状**では、日本企業が今すぐ調達できる状況ではない。ウェイティングリストへの登録と条件交渉が先行ステップになる
- **世代交代リスク**: BMW実証（別記事）では Figure 02 が退役して Figure 03 へ移行した。量産加速は「後継モデルへの切り替えも速くなる」ことを意味し、PoC中の機種変更リスクとして評価に組み込む必要がある

## サプライチェーンの観点

Figure がアクチュエーター（9,000個超生産済み）を含む主要コンポーネントの内製化を進めている点は、サプライチェーンの安定性とコスト競争力の両面で重要だ。一方、国内での保守部品調達・修理対応の体制は未公表のため、日本での本格展開には代理店体制の整備が前提になる。`,
    relatedRobotIds: ['figure-03'],
    relatedManufacturerIds: ['figure-ai'],
    relatedUseCaseIds: ['factory-inspection', 'warehouse-picking'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'BotQ: A High-Volume Manufacturing Facility for Humanoid Robots',
        url: 'https://www.figure.ai/news/botq',
        publisher: 'Figure AI',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Ramping Figure 03 Production',
        url: 'https://www.figure.ai/news/ramping-figure-03-production',
        publisher: 'Figure AI',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Figure ramps humanoid robot production from one per day to one per hour',
        url: 'https://roboticsandautomationnews.com/2026/05/27/figure-ramps-humanoid-robot-manufacturing-at-unprecedented-speed/101954/',
        publisher: 'Robotics and Automation News',
        publishedAt: '2026-05-27',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  // ── 2026年6月 最新ニュース ─────────────────────────────────────────
  {
    id: 'unitree-ipo-star-market-june2026',
    slug: 'unitree-ipo-star-market-june2026',
    title: 'Unitree Robotics clears China STAR Market listing review — first "embodied AI" IPO on A-shares',
    titleJa: 'Unitree Robotics が中国STARマーケット上場審査を通過──A株初の「体現AI」IPO承認',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary: '2026年6月1日、上海証券取引所の上場審査委員会がUnitree Roboticsの新規上場申請を承認した。調達目標42億元（約6.2億ドル）、上場後評価額420億元（約62億ドル）を見込む。申請受理から73日間という異例の高速審査で、A株市場での「体現AI」企業の上場承認は初のケース。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-02',
    author: 'Deploid Research',
    tags: ['unitree', 'funding', 'market', 'ipo'],
    heroImage: {
      src: '/images/articles/unitree-ipo-star-market-june2026/hero.jpg',
      alt: 'Unitree G1 humanoid robot',
      credit: 'Sayanesy / Wikimedia Commons (CC0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Unitree_G1.jpg',
      rights: {
        status: 'commercial-permitted',
        sourceType: 'third-party',
        rightsHolder: 'Sayanesy',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'Unitreeが公開企業になると、財務情報・調達コスト・部品サプライヤー・生産能力が有価証券報告書で開示されるようになる。日本企業がUnitree機を検討する際の「ベンダー財務健全性評価」に使える情報源が初めて公式に整う。また、A株での「体現AI」銘柄の誕生は中国政府・機関投資家の資金をこのセクターに引き込み、競合他社の量産加速にも間接的に働く。',
    keyTakeaways: [
      '2026年6月1日、上海証券取引所の上場審査委員会がUnitreeのIPO申請を承認（A株「体現AI」企業として初）',
      '申請受理（2026年3月20日）から承認まで73日間──STAR市場での異例のスピード審査',
      '調達目標：42億元（約6.2億ドル）、上場後評価額：420億元（約62億ドル）',
      '2025年売上高：16.99億元（約2.5億ドル）、コア事業粗利益率：60.13%（IPO目論見書）',
      '2025年にヒューマノイドロボット5,500台超を出荷。2026年は1万〜2万台出荷を目標',
    ],
    readingTimeMin: 5,
    body: `## 何が起きたか

2026年6月1日、上海証券取引所（SSE）の上場審査委員会がUnitree Roboticsの新規上場申請を承認した。中国のA株市場（STAR Market）で「体現AI（Embodied AI）」企業が上場承認を受けるのはこれが初めてだ。

IPO申請の受理は2026年3月20日で、承認まで73日間という短期間で審査を通過している。STAR Marketは「硬科技（ハードテック）」銘柄の上場を促進する制度設計があるが、Caixin Globalによると73日間は異例のスピードとされる。

## 財務内容と規模感

IPO目論見書によると、2025年の売上高は16.99億元（約2.5億ドル）で、コア事業粗利益率は60.13%。調達目標は42億元（約6.2億ドル）で、上場後の想定評価額は420億元（約62億ドル）だ。

出荷実績については、2025年にヒューマノイドロボットを5,500台超出荷済み。2026年の出荷目標は1万〜2万台とされている。

## 上場で何が変わるか

Unitreeが公開企業になると、四半期ごとの財務開示が義務付けられる。日本企業にとっては以下の情報が初めて外部から確認できるようになる。

- コスト構造と粗利トレンド（価格交渉の参考）
- 主要部品サプライヤーの開示（サプライチェーンリスク評価）
- 研究開発投資の規模と方向性（技術ロードマップの読み解き）

一方で、公開企業になることで株主への業績プレッシャーが生じる。研究開発投資が短期利益優先に引っ張られるリスクや、量産ペースが投資家期待によって急加速・急減速するリスクも評価変数に加わる。

## 中国ヒューマノイド市場全体への影響

UnitreeのA株上場は、中国の機関投資家・政策ファンドをヒューマノイドセクターに引き込む呼び水になる可能性がある。競合他社（AGIBOT、Fourier Intelligence、他）の資金調達・量産加速にも間接的な追い風になると見られる。日本企業は「中国発ヒューマノイドの供給量が今後急増する」ことを前提にした調達・価格交渉シナリオを持つ必要がある。

## 注意事項

上場審査委員会の承認はIPO完了ではない。正式上場・株式公開は別プロセスを経る。本記事執筆時点（2026年6月13日）では正式な上場日程は未公表（要確認）。`,
    relatedRobotIds: ['unitree-g1', 'unitree-h2', 'unitree-r1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: [],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Unitree Robotics IPO Hearing Scheduled for June 1, Targeting China\'s First Listed Humanoid Robot Company',
        url: 'https://pandaily.com/unitree-robotics-ipo-hearing-june-2026',
        publisher: 'Pandaily',
        publishedAt: '2026-05-30',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Unitree gets STAR Market green light in China\'s \'hard-tech\' IPO wave',
        url: 'https://news.cgtn.com/news/2026-06-01/Unitree-gets-STAR-Market-green-light-in-China-s-hard-tech-IPO-wave-1NCT9TksSVq/share_amp.html',
        publisher: 'CGTN',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Unitree Fast-Tracks Shanghai IPO With Target Valuation of $6.2 Billion',
        url: 'https://www.caixinglobal.com/2026-05-26/unitree-fast-tracks-shanghai-ipo-with-target-valuation-of-62-billion-102447449.html',
        publisher: 'Caixin Global',
        publishedAt: '2026-05-26',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Inside Unitree\'s Prospectus: Revenue Climbs and Profits Dip as Star Market IPO Hearing Approaches',
        url: 'https://www.humanoidsdaily.com/news/inside-unitree-s-prospectus-revenue-climbs-and-profits-dip-as-star-market-ipo-hearing-approaches',
        publisher: 'Humanoids Daily',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'nvidia-gr00t-unitree-h2plus-june2026',
    slug: 'nvidia-gr00t-unitree-h2plus-june2026',
    title: 'NVIDIA and Unitree unveil Isaac GR00T Reference Humanoid at GTC Taipei — first open full-stack platform',
    titleJa: 'NVIDIAとUnitreeがIsaac GR00Tリファレンス機を発表──世界初のオープン全スタックヒューマノイドプラットフォーム',
    type: 'tech-update',
    category: 'news',
    section: 'tech',
    summary: '2026年6月1日、NVIDIAはGTC Taipeiでオープンなヒューマノイドロボット研究プラットフォーム「NVIDIA Isaac GR00T Reference Humanoid Robot」を発表した。Unitree H2 Plus の機体に Sharpa の五指触覚ハンド、NVIDIA Jetson Thor のオンボードコンピュートを統合し、Ai2・ETH Zurich・Stanford 等の研究機関が採用を表明した。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'official',
    publishedAt: '2026-06-02',
    author: 'Deploid Research',
    tags: ['nvidia', 'unitree', 'research', 'autonomous'],
    heroImage: {
      src: '',
      alt: 'NVIDIA Isaac GR00T Reference Humanoid Robot with Unitree H2 Plus',
      credit: 'NVIDIA Corporation',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'NVIDIAがヒューマノイドの「ハードウェア＋ソフトウェア＋AIモデル」をオープンリファレンスとして統合したことは、研究→実用化のサイクルを大幅に短縮する可能性がある。Unitree H2 Plusが採用プラットフォームに選ばれた事実は、中国製機体が西側学術機関の標準研究機として認知されつつあることを示す。',
    keyTakeaways: [
      'プラットフォーム構成：Unitree H2 Plus（機体）＋Sharpa Wave五指触覚ハンド＋NVIDIA Jetson Thor（オンボードAI）＋Isaac GR00Tソフトウェアスタック',
      'H2 Plusスペック：身長1.8m・重量68kg・31 DoF（脚6×2、腕7×2、腰3、頭2）',
      '採用研究機関：Ai2、ETH Zurich、Stanford Robotics Center、UC San Diego ARCL',
      '機体の出荷は2026年末からUnitreeを通じて提供。開発ワークフローはGitHub・Hugging Faceで近日公開予定（要確認）',
      '価格・日本での調達経路は未公表（要確認）',
    ],
    readingTimeMin: 5,
    body: `## GTC Taipeiで発表されたこと

2026年6月1日、NVIDIAはGTC Taipei（台湾グランドコンピューテックショー）でオープンなヒューマノイドロボット研究プラットフォーム「NVIDIA Isaac GR00T Reference Humanoid Robot」を発表した。NVIDIAとしては初めて、特定のハードウェア構成を指定した「リファレンスデザイン」を公開した形になる。

## プラットフォームの構成

リファレンス機は4つのコンポーネントで構成される。

**Unitree H2 Plus（機体）**：身長1.8m・重量68kg・31自由度（脚6×2、腕7×2、腰3、頭2）。従来のH2をベースに微調整されたモデル。

**Sharpa Wave 五指触覚ハンド**：指ごとに圧力・変形を検知できる触覚センサーを搭載した五本指ハンド。従来の「つかむ」動作に加えて「触れる」フィードバックを制御に使える設計。

**NVIDIA Jetson Thor**：オンボードで推論を実行するAIコンピュートモジュール。クラウドへの常時接続なしに制御・推論を処理する。

**Isaac GR00T ソフトウェアスタック**：データ収集・合成→モデル学習→評価→展開までの研究ワークフローをオープンに提供。GitHub・Hugging Face経由で近日公開予定（要確認）。

## なぜリファレンスデザインが重要か

研究機関が独自にヒューマノイドを選定・調達・統合するコストは大きかった。機体選定→ソフト開発→センサー統合→評価環境の構築が個別に発生していたためだ。リファレンスデザインが標準化されることで、研究者は「どの機体でどのソフトを使うか」ではなく「どのスキルをどう学習させるか」に集中できる。

採用を表明した機関はAi2、ETH Zurich、Stanford Robotics Center、UC San Diego Advanced Robotics and Controls Laboratoryで、いずれも物理AIの最前線にいる研究拠点だ。これらの機関が同一ハードで研究を進めることで、学習データ・事前学習モデル・評価手法の共有が現実的になる。

## Unitree H2 Plusが選ばれた意味

NVIDIAのリファレンス機にUnitreeの機体が選ばれたことは、複数の含意を持つ。第一に、Unitreeの量産能力（2026年1〜2万台出荷目標）が研究機の大量展開を可能にする。第二に、$13.5K〜という価格帯が大学・研究機関の予算に収まりやすい。

一方で、日本市場への展開については現時点（2026年6月）では未公表（要確認）。機体の正式出荷は2026年末からとされている。

## 日本企業への示唆

このプラットフォームが普及すると、「大学・研究機関で鍛えられたスキルが量産機に転用される」パイプラインが生まれる可能性がある。研究段階の成果が実用機に展開されるまでの時間が縮まることは、日本の製造・物流企業がPoC設計を行う際のリードタイム見積もりを修正する根拠になる。`,
    relatedRobotIds: ['unitree-h2'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['research-development'],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'NVIDIA Announces NVIDIA Isaac GR00T Reference Humanoid Robot for Academic Research',
        url: 'https://nvidianews.nvidia.com/news/nvidia-open-humanoid-robot-reference-design',
        publisher: 'NVIDIA Newsroom',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Unitree Announces H2 Plus, an NVIDIA Isaac GR00T Reference Humanoid Robot for Academic Research',
        url: 'https://www.prnewswire.com/news-releases/unitree-announces-h2-plus-an-nvidia-isaac-gr00t-reference-humanoid-robot-for-academic-research-302786748.html',
        publisher: 'PR Newswire / Unitree Robotics',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'NVIDIA, Unitree and Sharpa unite to design humanoid robot that can perform \'real work\'',
        url: 'https://www.scmp.com/tech/big-tech/article/3355402/nvidia-unitree-and-sharpa-unite-design-humanoid-robot-can-perform-real-work',
        publisher: 'South China Morning Post',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'unitree-g1-agt-season21-june2026',
    slug: 'unitree-g1-agt-season21-june2026',
    title: "Unitree G1 robots perform synchronized backflips on America's Got Talent — what virality means for enterprise",
    titleJa: 'Unitree G1がAmerica\'s Got Talent Season 21に出演──シンクロバック転が世界的バイラルへ。企業導入への含意は',
    type: 'news-brief',
    category: 'news',
    section: 'business',
    summary: '2026年6月2日（現地時間）放送のAmerica\'s Got Talent Season 21プレミアで、ダンサーの呉玉飛（ Wu Yufei）が8台のUnitree G1ロボットとシンクロパフォーマンスを披露した。バック転を含むルーティンに全審査員がYesを投票し、公式YouTubeは1日100万再生を超えた。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-03',
    author: 'Deploid Research',
    tags: ['unitree', 'viral', 'demo', 'market'],
    heroImage: {
      src: '/images/articles/unitree-g1-agt-season21-june2026/hero.jpg',
      alt: 'Unitree G1 humanoid robot',
      credit: 'Sayanesy / Wikimedia Commons (CC0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Unitree_G1.jpg',
      rights: {
        status: 'commercial-permitted',
        sourceType: 'third-party',
        rightsHolder: 'Sayanesy',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '「ロボットは難しそう」という認知バリアがバイラル動画によって一気に崩れる効果がある。社内の「ヒューマノイド導入を検討してみよう」という議論が始まるトリガーになりやすい。一方で、パフォーマンス用途と産業用途では設計思想・要件が大きく異なるため、「テレビで見たから使える」という短絡思考を社内で整理しておく必要がある。',
    keyTakeaways: [
      '出演機体はUnitree G1（身長127cm・35kg・研究開発向け廉価機）。パフォーマンスのプログラムはUnitreeエンジニアの呉玉飛が独自開発',
      'Lady Gagaの「Abracadabra」に合わせた8台シンクロ演技。後半のシンクロバック転でスタンディングオベーション',
      '全審査員（Simon Cowell含む）がYesを投票。YouTubeで1日100万再生超え',
      'Global Timesの確認によると出演機体はG1モデルと明言',
    ],
    readingTimeMin: 4,
    body: `## AGT Season 21で何が起きたか

2026年6月2日放送のAmerica's Got Talent（NBC）Season 21プレミアで、Unitree Roboticsのエンジニアでダンサーでもある呉玉飛（Wu Yufei、26歳、通称FlyingBug）が8台のUnitree G1ロボットとシンクロパフォーマンスを披露した。Lady Gagaの「Abracadabra」に合わせた演技は、ルーティン後半のシンクロバック転でオーディエンスのスタンディングオベーションを引き起こした。

Simon Cowellを含む全審査員がYesを投票し、公式YouTubeの1日再生数は100万回を超えた。Global Timesが同社に確認したところ、出演機体はUnitree G1であることが公式に認められた。

## G1はどういう機体か

Unitree G1は身長127cm・重量35kg・最高時速7.2km・23〜43自由度の研究開発・教育向けヒューマノイド。開発者向け価格は$13,500から（2026年時点）。製造業や物流業の産業現場に向けて設計されたわけではなく、研究・デモ・教育用途が主な適用領域だ。

今回のパフォーマンスは、呉玉飛がロボットの動作を一から独自プログラミングしたものだ。「製品として届いたG1がそのままダンスした」のではなく、高度な実装者が相当な時間をかけて完成させた演技である点を明確にしておく。

## バイラルが企業導入に与える影響

「テレビでロボットが踊っていた」という事実は、社内の「ヒューマノイドを検討してみようか」という会話が生まれるトリガーになる。これは必ずしも悪いことではない。経営層の関心が高まることで、実証実験の予算確保が容易になる側面がある。

一方で、「AGTで動いたから工場でも使える」という短絡的な評価は誤解を生む。パフォーマンス用途と産業用途では、耐久性・防塵防水・安全設計・保守体制・稼働時間という要件が根本的に異なる。社内でヒューマノイドの議論が始まったとき、「どの用途で・どの環境で・どのKPIで評価するか」を最初に確定させる必要がある。

## 国際的な認知変化としての意義

AGTは米国の主要ゴールデンタイム番組であり、視聴者規模は数百万単位だ。「中国製のロボットがアメリカの国民的番組で拍手を受けた」という事実は、米中関係のテンションを背景に特別な意味を持つ。eWeekはこの出演を「米国の消費者意識に中国製ロボットが踏み込んだ象徴的瞬間」と評している。`,
    relatedRobotIds: ['unitree-g1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['demo-exhibition'],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Unitree, a Crew of Dancing Robots, Wow in AGT Premiere',
        url: 'https://www.nbc.com/nbc-insider/unitree-agt-dancing-robots-audition',
        publisher: 'NBC',
        publishedAt: '2026-06-02',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Unitree dancing robots that wowed America\'s Got Talent are G1 humanoid models, firm tells GT',
        url: 'https://www.globaltimes.cn/page/202606/1362852.shtml',
        publisher: 'Global Times',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'China\'s Unitree Robots Dance Into the US Spotlight on America\'s Got Talent',
        url: 'https://www.eweek.com/news/unitree-robots-americas-got-talent-us-scrutiny-apac-china/',
        publisher: 'eWeek',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'china-humanoid-duopoly-agibot-june2026',
    slug: 'china-humanoid-duopoly-agibot-june2026',
    title: 'AGIBOT at 10,000 units + Unitree IPO cleared: China\'s humanoid duopoly takes shape',
    titleJa: 'AGIBOT 1万台達成・Unitree IPO承認──中国ヒューマノイド二強の構図が固まる',
    type: 'market-analysis',
    category: 'analysis',
    section: 'business',
    summary: '2026年3月末にAGIBOTが累計1万台生産を達成し、6月1日にUnitreeのSTARマーケットIPOが承認された。生産量・資本調達の両面でこの2社が中国市場の上位を占める構図が鮮明になっている。日本のtoB事業者がこの「二強」をどう評価すべきかを整理する。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-03',
    author: 'Deploid Research',
    tags: ['agibot', 'unitree', 'production', 'market', 'china'],
    heroImage: {
      src: '/images/articles/china-humanoid-duopoly-agibot-june2026/hero.jpg',
      alt: 'AGIBOT X2 humanoid robot at MWC 2026',
      credit: 'JJxFile / Wikimedia Commons (CC BY 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:AGIBOT-X2-_by_JxFile_MWC26.jpg',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'JJxFile',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '中国ヒューマノイド市場のシェアとリソースがUnitree・AGIBOT２社に集中する構図は、部品サプライチェーン・学習データ・開発者エコシステムの集積を加速させる。日本企業が将来的に中国製ヒューマノイドを検討する際、この2社の動向が価格帯・保守体制・技術水準のベンチマークになる。',
    keyTakeaways: [
      'AGIBOT：2026年3月30日に累計1万台生産達成（2023年創業）。5000台→1万台の倍増は3ヶ月で達成',
      'Unitree：2026年6月1日にSTARマーケット上場審査を通過。2025年出荷5500台超、2026年目標1〜2万台',
      'AGIBOT Expedition A3 が主力モデルとして商業展開をリード',
      'TechTimesはこの2社を「中国ヒューマノイドデュオポリー」と表現。欧米系と異なり製品が市場に流通している点を強調',
      '日本を含むアジア太平洋・中東への展開をAGIBOTは明言しているが、国内代理店・保守体制は要確認',
    ],
    readingTimeMin: 5,
    body: `## AGIBOT の1万台とは何か

2026年3月30日、上海発のAGIBOT（創業2023年）が累計1万台のヒューマノイドロボット生産を達成したと発表した。同社公式発表によると、最初の1000台に2年近くかかったのに対し、5000台→1万台の倍増は3ヶ月で達成している。主力プラットフォームはExpedition A3で、製造・物流・公共サービスなど複数セクターへの展開が進む。

この数値を評価する際には、「生産台数 ≠ 稼働台数 ≠ 商業導入台数」という点に注意が必要だ。同社の発表は生産（製造）台数を示しており、各台の稼働状況・収益貢献度・維持管理状況は非公開だ。

## Unitree との比較

TechTimesが「中国ヒューマノイドデュオポリー」と表現するように、この2社は規模と資本力で中国市場の上位を占める。

| | AGIBOT | Unitree |
|---|---|---|
| 創業 | 2023年 | 2016年 |
| 累計生産台数（2026年3月時点） | 1万台 | 5,500台（2025年） |
| 上場ステータス | 未公開（2026年6月時点） | STARマーケット審査通過（2026年6月） |
| 主力機 | Expedition A3 | G1（$13.5K〜）、H2、R1 |

## 競争優位の違い

AGIBOTの強みは「生産実績の蓄積スピード」にある。創業2年あまりで1万台という数字は、製造プロセスの標準化が急速に進んでいることを示す。欧州・北米・アジア太平洋・中東への展開を明言しており、グローバル展開の意欲が明確だ。

Unitreeの強みは「価格と量産能力の組み合わせ」にある。G1の$13.5K〜という価格帯は競合機と比較して一桁安い製品を市場に投入し続けている。さらにSTARマーケット上場による公開資本調達で研究開発・生産設備への大規模投資が可能になる。

## 日本企業が読み取るべきこと

中国二強の存在は、日本向け価格・サポート体制の評価軸に直接影響する。Unitreeは国内代理店（TechShare等）が確認されているが、AGIBOTの日本代理店・保守体制は2026年6月時点で未確認（要確認）。大量生産能力があることと「日本の現場で使えるか」は別の命題であるため、技術水準だけでなく国内サポート体制の充実度が調達判断の核になる。`,
    relatedRobotIds: ['agibot-a2', 'unitree-g1'],
    relatedManufacturerIds: ['agibot', 'unitree'],
    relatedUseCaseIds: ['factory-inspection', 'warehouse-picking'],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Unitree IPO Cleared, AGIBOT Hits 10,000 Units: China Humanoid Robot Duopoly Takes Shape',
        url: 'https://www.techtimes.com/articles/317632/20260602/unitree-ipo-cleared-agibot-hits-10000-units-china-humanoid-robot-duopoly-takes-shape.htm',
        publisher: 'TechTimes',
        publishedAt: '2026-06-02',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'AGIBOT Reaches 10,000 Units as Real-World Demand for Robots Accelerates',
        url: 'https://www.prnewswire.com/news-releases/agibot-reaches-10-000-units-as-real-world-demand-for-robots-accelerates-302728295.html',
        publisher: 'PR Newswire / AGIBOT',
        publishedAt: '2026-03-30',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'yy-group-unitree-facility-june2026',
    slug: 'yy-group-unitree-facility-june2026',
    title: 'YY Group deploys Unitree G1 Edu in Asia facility management — robots clean buildings and harvest AI training data',
    titleJa: 'YY GroupがアジアのビルメンにUnitree G1 Eduを商用展開──清掃しながらAI訓練データも収集する二重モデル',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: '2026年6月9日、マレーシア上場企業YY Group Holding（NASDAQ: YYGH）がアジア全域の施設管理事業にUnitree G1 Edu Ultimate B-U4を商用展開すると発表した。清掃・保守タスクの実行と並行して、現場データをAI訓練用に収集する二重目的の運用モデルが特徴的だ。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-10',
    author: 'Deploid Research',
    tags: ['unitree', 'deployment', 'logistics', 'commercial', 'japan'],
    heroImage: {
      src: '',
      alt: 'Unitree G1 Edu humanoid robot in facility management context',
      credit: 'YY Group / Unitree Robotics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'ビルメンテナンスは日本でも深刻な人材不足が続く労働集約産業だ。YY Groupの導入モデル（機体はUnitree調達・ソフトは内製・既存ワークフォースプラットフォームと統合）は、日本の施設管理会社がヒューマノイドを導入する際の参照パターンとして直接使える。「清掃しながらデータ収集」という二重モデルは、ROI計算の構造を変える可能性がある。',
    keyTakeaways: [
      '使用機体：Unitree G1 Edu Ultimate B-U4（3D触覚ハンド・NVIDIA Jetson Orin搭載）',
      '展開拠点：ショッピングモール・ホテル・商業不動産（アジア全域）',
      '清掃・保守作業と並行して現場AIトレーニングデータを収集する二重目的の運用',
      '既存システム（YY Circleワークフォースプラットフォーム・24IFM）と統合した軟件スタック',
      'YY Groupは施設管理大手。データ収集も事業化できれば「ロボットの稼働コストをデータ収益で一部相殺」するモデルが成立する可能性',
    ],
    readingTimeMin: 5,
    body: `## YY Groupとは

YY Group Holding Limited（NASDAQ: YYGH）はマレーシアを本拠とし、アジア全域でビルメンテナンス・施設管理サービスを展開する上場企業だ。ショッピングモール・ホテル・商業不動産が主な顧客となる。

2026年6月9日のGlobe Newswireプレスリリースで、同社はUnitree G1 Edu Ultimate B-U4ヒューマノイドの商用展開を発表した。

## 機体仕様と統合構成

展開機体のUnitree G1 Edu Ultimate B-U4は、標準G1に3D触覚センサーを内蔵した五指ハンドとNVIDIA Jetson Orinオンボードコンピュートを追加したモデルだ。清掃・巡回・物品補充などの作業に使われる予定で、既存のYY CircleワークフォースプラットフォームおよびIFMシステム（24IFM）と統合して運用される。

## 「清掃しながらデータ収集」のビジネスモデル

TechTimesの6月12日記事によると、YY Groupの戦略は単純な清掃業務の自動化にとどまらない。清掃員が専用データ収集ギアを装着して現場作業を行い、その動作データを取得してAIモデルの訓練に使用する仕組みも並行して構築している。

このモデルが確立されれば、ロボットが清掃しながら収集したデータを施設管理AI向けに販売・ライセンスするという副収益源が生まれる可能性がある。初期の稼働コストをデータ価値で一部相殺するこの構造は、ロボット導入のROI計算に新しい軸を加える。

## 日本のビルメン・施設管理業への示唆

日本のビルメンテナンス業界は、人口減少・高齢化による慢性的な人材不足に直面している。YY Groupのモデルが成立した場合、類似の展開を検討する上で参照すべき論点は次の通りだ。

- **機体選択の根拠**：Unitree G1 Eduは産業用とは異なる「開発者・教育向け」機。産業現場での耐久性・防塵防水・保守体制は本格商用展開前に確認が必要
- **ソフトウェア内製コスト**：既存プラットフォームとの統合開発には相応のエンジニアリング投資が必要。SIerの活用コストが意思決定の核になる
- **データ戦略の可能性**：施設管理データそのものが資産になるかどうかは日本の規制環境・顧客との契約条件によって変わる`,
    relatedRobotIds: ['unitree-g1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['factory-inspection'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'YY Group (NASDAQ YYGH) Launches Commercial Humanoid Robotics Initiative to Drive AI-Driven Margin Expansion and Address Global Facility Management Labor Shortages',
        url: 'https://www.globenewswire.com/news-release/2026/06/09/3309337/0/en/YY-Group-NASDAQ-YYGH-Launches-Commercial-Humanoid-Robotics-Initiative-to-Drive-AI-Driven-Margin-Expansion-and-Address-Global-Facility-Management-Labor-Shortages.html',
        publisher: 'Globe Newswire / YY Group',
        publishedAt: '2026-06-09',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'YY Group Deploys Humanoid Robots to Clean Buildings, and to Harvest Training Data',
        url: 'https://www.techtimes.com/articles/318297/20260612/yy-group-deploys-humanoid-robots-clean-buildings-harvest-training-data.htm',
        publisher: 'TechTimes',
        publishedAt: '2026-06-12',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'sharpa-wave-hands-gr00t-june2026',
    slug: 'sharpa-wave-hands-gr00t-june2026',
    title: 'Sharpa Wave tactile hands join Nvidia–Unitree GR00T reference design — first dexterous platform with touch sensing',
    titleJa: 'Sharpaの触覚ハンドがNvidia×Unitree GR00Tリファレンス機に統合──世界初、触覚センサー搭載オープンヒューマノイドプラットフォーム',
    type: 'tech-update',
    category: 'news',
    section: 'tech',
    summary: '2026年6月9日、Robotics and Automation NewsがSharpaのWave触覚ロボットハンドをNVIDA Isaac GR00TリファレンスデザインのUnitree H2 Plusに統合したことを報じた。GR00Tフレームワーク上で触覚操作技術を搭載した初のヒューマノイドプラットフォームとなる。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-10',
    author: 'Deploid Research',
    tags: ['nvidia', 'unitree', 'research', 'autonomous'],
    heroImage: {
      src: '',
      alt: 'Sharpa Wave tactile robot hand integrated with Unitree H2 Plus',
      credit: 'Sharpa / NVIDIA',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '触覚フィードバックのないロボットハンドは「形状不定の物体のつかみ」「力加減が必要な精密作業」で限界がある。Sharpa WaveハンドのGR00T統合は、製造・食品・物流での「壊れやすい部品を扱う」タスクへの適用可能性を一段広げる技術変化点だ。研究から実用化までのパイプラインが短くなることで、日本の現場への展開タイムラインも更新が必要になる。',
    keyTakeaways: [
      'Sharpa Waveハンド：五本指、各指に圧力・変形を検知する触覚センサーを内蔵。力加減とスリップ検知が可能',
      'GR00T IsaacフレームワークとJetson Thor上での触覚フィードバック統合が初めて実現',
      '同ハンドはNVIDIA Isaac GR00T Referenceプラットフォームの標準コンポーネントとして採用（June 1発表分）',
      '触覚なしの場合：力のコントロールができず、精密部品のグリップ・繊維類・包装品のハンドリングに制約',
      '触覚センサー搭載による実装コスト・メンテナンス要件は別途評価が必要（未公表）',
    ],
    readingTimeMin: 4,
    body: `## 触覚がないとロボットハンドで何ができないか

現在市場に出回るヒューマノイドのほとんどは、ハンドに圧力・温度・変形を感知する触覚センサーを持っていない。「見て」つかむことはできても、「感じながら」つかむことができない。この制約は以下のタスクで壁になる。

- **精密部品のアセンブリ**：0.1mm単位の位置合わせが必要な作業で滑り検知がなければ失敗率が高い
- **繊維・食品・軟質材のハンドリング**：力加減のフィードバックなしでは潰す・落とすが避けられない
- **形状不定物体のグリップ**：摩擦係数・硬度が不明な物体を安定してつかめない

## Sharpa Wave ハンドの技術

Sharpaが開発したWave触覚ハンドは五本指構造で、各指の腹部に圧力センサーと変形センサーを内蔵する。接触箇所の力分布をリアルタイムで計測し、スリップ（滑り始め）の予兆を検知して把持力を自動調整できる。

このハンドがNVIDIA Isaac GR00T Reference Humanoid Robot（6月1日発表）のコンポーネントとして採用されたことで、GR00Tフレームワーク内で触覚情報を用いたスキル学習・評価が可能になった。Robotics and Automation Newsの6月9日記事では「GR00Tベースとしては初の触覚搭載ヒューマノイドプラットフォーム」と表現されている。

## 研究→実用化への影響

触覚センサーを持つリファレンス機が標準化されることで、複数の研究機関（Ai2、ETH Zurich、Stanford等）が触覚を使ったスキル学習データを共有しやすくなる。これは「食品工場での果実ハンドリング」「電子部品の精密組み立て」「柔軟包材の梱包」といったタスクの研究成果が蓄積される速度を上げる。

日本の製造・食品・物流業にとっては、「触覚センサー搭載ヒューマノイドが産業用途で使えるかどうか」の答えが研究機関から出てくるタイムラインが従来より前倒しになる可能性がある。

## 留意事項

触覚センサーの追加は、コスト・重量・保守複雑性を上げる。センサー破損時の交換部品供給・キャリブレーション手順・産業環境での耐久性はいずれも未公表（要確認）。「触覚があれば何でもできる」ではなく、「どのタスクで触覚が差分をつくるか」を具体的に評価する必要がある。`,
    relatedRobotIds: ['unitree-h2'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['research-development', 'factory-inspection'],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Sharpa brings dexterous robot hands to Nvidia and Unitree humanoid reference design',
        url: 'https://roboticsandautomationnews.com/2026/06/09/sharpa-brings-dexterous-robot-hands-to-nvidia-and-unitree-humanoid-reference-design/102424/',
        publisher: 'Robotics and Automation News',
        publishedAt: '2026-06-09',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'NVIDIA, Unitree and Sharpa unite to design humanoid robot that can perform \'real work\'',
        url: 'https://www.scmp.com/tech/big-tech/article/3355402/nvidia-unitree-and-sharpa-unite-design-humanoid-robot-can-perform-real-work',
        publisher: 'South China Morning Post',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'china-miit-sasac-10000-directive-june2026',
    slug: 'china-miit-sasac-10000-directive-june2026',
    title: 'China\'s MIIT and SASAC issue joint directive: 10,000 humanoids deployed commercially by end-2026',
    titleJa: '中国MIITとSASACが合同指令──2026年末までにヒューマノイド1万台を商用展開。地方政府・国有企業に実施計画提出を義務化',
    type: 'policy-update',
    category: 'policy',
    section: 'policy',
    summary: '2026年6月10日、Caixin Globalが中国工業情報化部（MIIT）と国有資産監督管理委員会（SASAC）が合同で発令した指令を報じた。2026年末までに1万台超のヒューマノイドロボットを商用展開し、100以上の高付加価値活用シナリオを創出することを目標に定め、地方政府・国有企業に6月末までの実施計画提出を義務付けた。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-11',
    author: 'Deploid Research',
    tags: ['policy', 'regulation', 'china', 'deployment', 'market'],
    heroImage: {
      src: '',
      alt: 'China humanoid robot policy directive',
      credit: '',
      rights: {
        status: 'reference-attributed',
        sourceType: 'unknown',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '国家レベルの指令が「商用展開1万台」という数値目標を設定したことは、中国製ヒューマノイドの量産加速を政策面から強制力をもって後押しする。日本企業にとっては「中国製ロボットの供給量が2026年末に向けて急増する」という現実的なシナリオを前提として調達戦略を再設計する必要が生じる。RaaS（Robot as a Service）モデルの制度的支援が盛り込まれた点は、調達形態の多様化という観点でも注目すべき。',
    keyTakeaways: [
      'MIIT（工業情報化部）とSASAC（国有資産監督管理委員会）の合同指令。国有企業が対象に含まれる点が従来指針と異なる',
      '目標：2026年末までに1万台超の商用展開、100以上の高付加価値活用シナリオ創出',
      '対象業種：製造、物流・倉庫、小売、医療・介護、安全・設備検査、保守・点検、緊急対応・災害救助',
      '地方政府は6月末までに実施計画提出、11月末までに進捗報告が義務',
      'RaaS（Robot as a Service）モデルの採用を普及障壁低減策として積極的に奨励',
    ],
    readingTimeMin: 5,
    body: `## 指令の内容

2026年6月10日、Caixin Globalは中国工業情報化部（MIIT）と国有資産監督管理委員会（SASAC）が連名で発令した指令を報じた。この指令は「体現AI（Embodied AI）の実産業への加速導入」を目標に掲げ、ヒューマノイドロボットの商用展開について具体的な数値目標と期限を設定している。

**数値目標**
- 2026年末までに1万台超のヒューマノイドを商用展開
- 100以上の高付加価値な活用シナリオを創出

**スケジュール**
- 地方政府・国有企業：6月末までに実施計画を提出
- 2026年11月末：進捗報告の提出

## SASACが名を連ねた意味

通常、産業政策の指令はMIITが単独で発令することが多い。今回の指令にSASAC（国有資産監督管理委員会）が加わったことは、国有企業が積極的な展開主体として位置付けられていることを示す。中国の国有企業は製造・物流・エネルギー・インフラ等の主要産業を担っており、SASACの参加は「政策目標の実施を推進する主体」が明確になったことを意味する。

## 対象とされる業種

指令が明示した適用業種は製造、倉庫・物流、小売、医療・介護、職場安全・設備検査、保守・点検、緊急対応・災害救助に及ぶ。eWeekの報道によると、北京発のRoboteraがChina PostとSF Holdingの10以上の物流センターにヒューマノイドを展開済みであることが、この指令の具体的な先行事例として言及されている。

## RaaS支援の意味

指令に含まれるRaaS（Robot as a Service）支援策は、「初期調達コストの高さ」という普及障壁を低減するための制度設計だ。企業が機体を購入するのではなく、稼働量・時間・成果に応じた利用料を払うモデルを制度的に後押しすることで、中小企業・地方国有企業が導入に踏み切りやすくする意図がある。

## 日本企業への示唆

政策主導の量産加速は、日本向け中国製ヒューマノイドの「供給量・価格・技術水準」を今後1〜2年で大きく変える可能性がある。重要な評価軸は2つだ。

第一に「量産された機体が産業現場で実際に機能するかどうか」。政策目標としての「1万台」は導入台数の上限ではなく下限目標に近い。実稼働・KPI達成率のデータが出揃う2026年末〜2027年初に、真の実用水準が見えてくる。

第二に「日本の規制・安全基準との適合」。中国の指令で設定された活用シナリオが日本の安全規制（労安法・機械安全規格）に合致するとは限らない。日本での展開には追加の安全適合プロセスが必要になる可能性が高い。`,
    relatedRobotIds: [],
    relatedManufacturerIds: ['agibot', 'unitree'],
    relatedUseCaseIds: ['factory-inspection', 'warehouse-picking'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'China Targets 10,000 Humanoid Robots in Commercial Use by End-2026',
        url: 'https://www.caixinglobal.com/2026-06-10/china-targets-10000-humanoid-robots-in-commercial-use-by-end-2026-102452656.html',
        publisher: 'Caixin Global',
        publishedAt: '2026-06-10',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'China\'s 2026 Plan: Move 10,000 Humanoid Robots From Demos to Real Jobs',
        url: 'https://www.eweek.com/news/humanoid-robots-work-mode-2026-apac-china/',
        publisher: 'eWeek',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'China fast tracks humanoid robots and embodied AI into industry under nationwide programme',
        url: 'https://www.scmp.com/economy/china-economy/article/3356629/china-fast-tracks-humanoid-robots-and-embodied-ai-industry-under-nationwide-programme',
        publisher: 'South China Morning Post',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'china-humanoid-demand-gap-june2026',
    slug: 'china-humanoid-demand-gap-june2026',
    title: 'China built the humanoid factories — but buyers aren\'t showing up fast enough',
    titleJa: '工場は建った、買い手が足りない──中国ヒューマノイド「供給過剰・需要不足」の構造問題',
    type: 'market-analysis',
    category: 'analysis',
    section: 'business',
    summary: '中国のヒューマノイドロボット工場が急速に生産能力を拡大する一方、顧客側の実需が生産能力の増加ペースに追いついていない。現在の標準価格帯は約3万ドル（約430万円）で、北京の工場は年産50万台体制（2030年目標）に向けた計画を打ち出しているが、現実の受注環境との乖離が課題として浮上している。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-11',
    author: 'Deploid Research',
    tags: ['china', 'market', 'pricing', 'production', 'analysis'],
    heroImage: {
      src: '',
      alt: 'Humanoid robot production line in China',
      credit: '',
      rights: {
        status: 'reference-attributed',
        sourceType: 'unknown',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '「供給過剰・需要不足」の状況は価格下落圧力を生み、日本企業にとっては中国製ヒューマノイドの調達コストが今後数年で下がる可能性を示す。一方で、需要が追いつかない中での過剰生産は、ベンダーの財務リスク・品質管理リスクを高める。安さだけで選んだ場合にサポート継続が担保されない事態のリスクを評価変数に加える必要がある。',
    keyTakeaways: [
      '現在の標準ヒューマノイド価格：約3万ドル（約430万円）。北京の工場が年産50万台（2030年）を目指せばモルガン・スタンレーは1台あたり半額以下になると予測',
      '北京・Lingyi iTech工場：4月開業後300台生産済み、2026年に1万台目標。2030年までに年産50万台計画',
      '現実の課題：生産能力の拡大ペースに顧客の購入意欲が追いついていない（CNBC、6月8日報道）',
      '価格が下がっても「ロボットで何ができるか」「どう安全に使うか」が整理されなければ受注は増えない',
      'モルガン・スタンレーの予測：平均価格が2050年に約2万1,000ドルへ低下（長期推計）',
    ],
    readingTimeMin: 5,
    body: `## 何が起きているか

2026年6月、CNBC・TechTimes・eWeekが相次いで報じた：中国のヒューマノイドロボット工場は生産能力を急拡大しているが、実需（購入意欲のある顧客）がそのペースについていけていない。

北京に4月開業したLingyi iTech（電子製品受託製造大手）の工場は、すでに300台のロボットを複数顧客向けに生産済みで、2026年に1万台、2030年までに年産50万台の計画を打ち出している。しかし、CNBCの6月8日ニュースレターは「中国は工場を建てた。今度は買い手が必要だ」と率直に問題を指摘した。

## 現在の価格帯と見通し

現在、稼働可能なヒューマノイドロボットの標準価格帯は約3万ドル（約430万円）だ。Lingyi iTechがCNBCに語ったところによると、年産50万台体制が整えば今日の約3万ドルという価格を半分以下に下げられる可能性があるという。モルガン・スタンレーは長期的に平均価格が約2万1,000ドル（2050年時点）まで低下すると予測しているが、これは長期推計であり確定値ではない。

## なぜ買い手が足りないのか

需要不足には構造的な理由がある。

**第一に、「何ができるか」が不明確だ**。自動車工場の特定ラインや航空グランドハンドリング等、スコープを絞った実証では成果が出始めているが、「どんな作業にも対応できる汎用機」としての実績はまだない。購買担当者が「これを買えば何が解決するか」を説明できない段階では、稟議が通りにくい。

**第二に、サポート体制が整っていない**。機体を納入しても、現場での調整・メンテナンス・ソフトウェアアップデートを担う体制が整っていないと実運用に移れない。特に中国国外での展開ではこの障壁が大きい。

**第三に、安全評価のコストが高い**。製造・物流現場で人間と共働させるには、安全リスクアセスメント・国内規格適合の確認に相当な時間とコストがかかる。

## 日本企業の立ち位置

この「供給過剰・需要不足」状況は日本のtoB事業者に2つの意味を持つ。

一つは**価格交渉のタイミング**。競争が激化している今は、複数ベンダーから見積もりを取り比較できる市場環境にある。「出てから考える」ではなく、評価フェーズに入ることで情報アドバンテージが得られる。

もう一つは**ベンダーリスクの評価**。需要が追いつかない中での過剰生産は、財務健全性の悪化→撤退・買収というリスクシナリオにつながる。「5年後もサポートを受けられるか」というベンダー継続性の評価を今から始めておくことが重要だ。`,
    relatedRobotIds: ['agibot-a2', 'unitree-g1'],
    relatedManufacturerIds: ['agibot', 'unitree'],
    relatedUseCaseIds: ['factory-inspection', 'warehouse-picking'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'CNBC\'s The China Connection newsletter: Humanoid robots are great, but they need buyers too',
        url: 'https://www.cnbc.com/2026/06/08/cnbcs-the-china-connection-newsletter-who-will-buy-the-humanoids.html',
        publisher: 'CNBC',
        publishedAt: '2026-06-08',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Humanoid Robot Prices Near $30,000：Beijing Factory\'s 500,000-a-Year Plan May Halve Cost, Buyers Lag',
        url: 'https://www.techtimes.com/articles/318157/20260610/humanoid-robot-prices-near-30000beijing-factorys-500000-year-plan-may-halve-cost-buyers-lag.htm',
        publisher: 'TechTimes',
        publishedAt: '2026-06-10',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'boston-dynamics-atlas-hyundai-rmac-june2026',
    slug: 'boston-dynamics-atlas-hyundai-rmac-june2026',
    title: 'Electric Atlas enters Hyundai RMAC for training — 2026 production fully committed to Hyundai and DeepMind',
    titleJa: '電動AtlasがHyundai RMAC（検証センター）に初投入──2026年生産分はHyundai・Google DeepMindで完売',
    type: 'deployment-report',
    category: 'news',
    section: 'deployment',
    summary: 'Boston Dynamicsの電動Atlas（2024年4月発表）が2026年、Hyundai Motor GroupのRobotics Metaplant Application Center（RMAC）に初投入された。2026年の全生産分はHyundaiとGoogle DeepMindで完売状態にある。Hyundaiは2026年のマルチ米国投資計画の中でAtlasを中心的な要素として位置付け、将来的に25,000台規模の工場展開を目指す。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-07',
    author: 'Deploid Research',
    tags: ['boston-dynamics', 'manufacturing', 'commercial', 'production', 'deployment'],
    heroImage: {
      src: '/images/articles/boston-dynamics-atlas-hyundai-rmac-june2026/hero.jpg',
      alt: 'Boston Dynamics electric Atlas robot',
      credit: 'Boston Dynamics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '「2026年生産分が完売」は、Atlasが研究デモ機から本格的な産業機への転換を果たした事実上の証明だ。HyundaiとDeepMindというパートナー構成（製造ライン＋AI基盤モデル）は、「ハードウェア量産×AIモデル統合」という競合優位を同時に確立しようとする戦略を示す。日本の自動車・製造業にとっては競合動向として、また機体評価のベンチマークとして追う必要がある。',
    keyTakeaways: [
      '2026年の全生産分はHyundaiとGoogle DeepMindで完売。追加顧客への提供は2027年以降の予定',
      'Hyundai RMAC（ジョージア州）にてトレーニング・検証フェーズが進行中。工場ラインへの本格展開は2028年',
      'HyundaiはAtlasを最大25,000台規模で自社工場に展開する計画を表明',
      'Google DeepMindとの連携でGemini RoboticsモデルをAtlasの認知制御に統合（CES 2026発表）',
      '年産3万台工場を2028年稼働目標で建設中。価格・外部顧客向け販売条件は未公表（要確認）',
    ],
    readingTimeMin: 5,
    body: `## 「完売」の意味

2026年、Boston Dynamicsの電動Atlasは初の商用生産ロットを出荷した。しかし、その全台数が2顧客──親会社のHyundai Motor Groupと、AIパートナーのGoogle DeepMind──で占有されており、外部企業が今すぐ調達できる状態にはない。

Boston Dynamicsによれば、追加の顧客への提供は2027年以降になる見込みだ。現時点（2026年6月）でウェイティングリストへの登録を受け付けているかどうかは未確認（要確認）。

## Hyundai RMAC での動き

HyundaiはジョージアのMetaplant近くにRobotics Metaplant Application Center（RMAC）を設置し、Atlasの現場トレーニング・検証を行っている。RMACはロボットが実際の工場環境に近い条件で作業を学習するためのテストベッドとして機能する。工場ラインへの本格展開は2028年の見通しで、Hyundaiはグローバルの製造拠点に最大25,000台規模でAtlasを配備する計画を持つ。

## DeepMindとのGemini Robotics統合

2026年1月のCES発表でBoston Dynamicsはカルフォルニア州に本拠を置くGoogle DeepMindとのパートナーシップを発表し、DeepMindのGemini Robotics基盤モデルをAtlasの認知制御に統合することを明言した。言語理解→タスク計画→物理操作の三層を一貫した基盤モデルで処理する設計は、他社の「ルールベース制御＋固定タスク」のアプローチとは根本的に異なる。

## 「3万台/年」工場の意味

Hyundaiは2028年稼働を目標に、年産3万台体制のAtlas製造工場を建設中と報じられている。自動車製造ライン（月産数万台）と比較すると依然として桁が違うが、図はヒューマノイドが「試作品」から「製造業の製品ライン」に移行しつつあることを示す。

## 日本製造業への示唆

Hyundaiが先陣を切ってAtlasを工場に投入することは、競合する日本の自動車メーカー（トヨタ・Honda・日産等）がヒューマノイドのベンチマークとしてAtlasを評価せざるを得ない環境をつくる。「Hyundaiがどういう作業でどの程度の成果を出したか」という2028年以降のデータは、国内製造業のヒューマノイド評価の基準になる可能性が高い。現時点での日本企業のアクション項目は「情報収集とベンダーリスト整理」だ。`,
    relatedRobotIds: ['boston-dynamics-atlas'],
    relatedManufacturerIds: ['boston-dynamics'],
    relatedUseCaseIds: ['factory-inspection'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'Boston Dynamics\' electric Atlas robot just sold out its entire 2026 production run',
        url: 'https://www.msn.com/en-us/money/other/boston-dynamics-electric-atlas-robot-just-sold-out-its-entire-2026-production-run-every-unit-already-claimed-by-hyundai-and-google-s-deepmind-lab/ar-AA23TkRC',
        publisher: 'MSN / Business Insider',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Atlas humanoid robots enter Hyundai factories for industrial use',
        url: 'https://newatlas.com/ai-humanoids/boston-dynamics-production-atlas-hyundai/',
        publisher: 'New Atlas',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Hyundai Motor Group Announces AI Robotics Strategy to Lead Human-Centered Robotics Era at CES 2026',
        url: 'https://www.hyundai.com/worldwide/en/newsroom/detail/hyundai-motor-group-announces-ai-robotics-strategy-to-lead-human-centered-robotics-era-at-ces-2026-0000001100',
        publisher: 'Hyundai Motor Group',
        publishedAt: '2026-01-05',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'robotera-china-post-logistics-june2026',
    slug: 'robotera-china-post-logistics-june2026',
    title: 'RobotEra\'s Xingdong M7 sorts 1,200 parcels/hour at China Post — a human processed 192 more in the same test',
    titleJa: 'RobotEraの Xingdong M7 が中国郵政で1,200個/時を達成──同条件の人間は1,392個。「効率85%」の現実と意味',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: '北京のRobotEraが開発したXingdong M7（固定式上半身ヒューマノイド）が、China PostとSF Holdingの合計10か所超の物流センターに展開され、仕分け作業において時間当たり1,200個の処理能力を達成した。同条件での人間の処理量は1,392個。Robotics and Automation NewsおよびInteresting Engineeringが6月に報じた。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-12',
    author: 'Deploid Research',
    tags: ['robotera', 'deployment', 'logistics', 'china', 'commercial'],
    heroImage: {
      src: '',
      alt: 'RobotEra Xingdong M7 robot sorting parcels at China Post logistics center',
      credit: 'RobotEra',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '「人間比85%の効率」という実測値は、ヒューマノイドの現実的な生産性を判断する珍しいベンチマークだ。「人間以下の効率でも使う理由はあるか」という問いへの答えが、夜間連続稼働・人材不足の補完・安全管理コスト削減などに具体的に分解できるようになる。物流・郵便業界で仕事を始めた「準ヒューマノイド」が日本での同種評価のベースラインを提供する。',
    keyTakeaways: [
      'Xingdong M7は固定式上半身ロボット（7 DoFアーム×2＋12 DoFハンド）。移動脚は持たない「スタンド固定型」',
      '仕分けテスト結果：ロボット1,200個/時 vs 人間1,392個/時（効率86.2%）',
      '10か所超のChina Post・SF Holding物流センターに展開済み。RobotEraは2026年Q2から1,000台単位の出荷を開始',
      'RobotEraは2026年5月に2億ドルの資金調達を完了（別途報道）',
      '「1,200個/時」の条件詳細（稼働時間・エラー率・人間の監視介入率など）は未公表',
    ],
    readingTimeMin: 5,
    body: `## Xingdong M7 とは何か

RobotEra（本拠：北京）が開発したXingdong M7は、コンベアベルト沿いに設置される固定スタンド式の上半身ロボットだ。7自由度のアームを2本と12自由度のハンドを持ち、多様な形状の荷物を識別・把持・仕分けできる。「ヒューマノイド」の定義に固定式が含まれるかは議論があるが、形状・機能設計は人間の上半身に近い。

移動機能（脚・車輪）を持たないことで、バランス制御の複雑さを排除し仕分け精度と速度に特化している。これは「物流倉庫の一定の作業区域内」という構造化環境では合理的な設計判断だ。

## テスト結果の読み方

Interesting Engineeringの報道によると、同一テスト条件でXingdong M7は1,200個/時を処理し、人間作業者は1,392個/時を処理した。差は192個（約13.8%）で、ロボットの効率は人間比86.2%だ。

この数字をそのまま「まだ人間に劣る」と読むのは不正確だ。評価する際には次の変数を加える必要がある。

- **連続稼働**：ロボットは休憩なしで24時間稼働できる。1日3シフト体制でシフトあたり8時間の場合、実効処理量は日間比較で変わる
- **深夜稼働コスト**：深夜・早朝シフトの人材確保コスト・割増賃金が不要になる
- **人材不足下の絶対値**：人が集まらない状況では「1,200個/時できるロボット」と「0個/時（人がいない）」の比較になる

一方で、エラー率・破損率・人間の監視介入頻度・稼働率（メンテナンス停止時間）といった指標は公表されていない（要確認）。1,200個/時という数値の「品質」を独立に評価する情報は現時点では不足している。

## 10か所超への展開規模

RobotEraはChina PostとSF Holdingの合計10か所超の物流センターへの展開を達成しており、Robotera社は2026年Q2から1,000台単位の出荷を開始していると報じられた。また2026年5月には2億ドルの資金調達も完了している（別記事）。

## 日本の物流業への示唆

日本の物流・郵便業界は、人口減少による人材不足に加えて、2024年問題（ドライバーの時間外労働規制）以降の深刻な労働力制約を抱える。「人間比85〜90%の効率で24時間稼働できる機体」が有効かどうかは、「人件費 vs 機体コスト＋保守コスト」の計算だけでなく「そもそも人が集まらない状況でのスループット保証」という観点から評価する必要がある。

Xingdong M7はRobotEraの機体で、国内代理店・保守体制は2026年6月時点で未確認（要確認）。中国国外での展開実績は限定的とみられる。`,
    relatedRobotIds: [],
    relatedManufacturerIds: ['robotera'],
    relatedUseCaseIds: ['warehouse-picking'],
    relatedGuideIds: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'China Post deploys humanoid robots to sort 1,200 parcels per hour',
        url: 'https://interestingengineering.com/ai-robotics/china-deploys-humanoid-robots-in-postal-hub',
        publisher: 'Interesting Engineering',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Humanoid Robots Are Now Sorting Packages at China\'s Postal Hubs. A Human Still Beat One by 192 Parcels',
        url: 'https://www.revolutioninai.com/2026/06/china-post-humanoid-robots-package-sorting-2026.html',
        publisher: 'Revolution In AI',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Robotera Expands Global Humanoid Robot Deployment After Securing $200M Investment',
        url: 'https://news.fundsforngos.org/2026/05/15/robotera-expands-global-humanoid-robot-deployment-after-securing-200m-investment/',
        publisher: 'Funds for NGOs / Press Release',
        publishedAt: '2026-05-15',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'onex-neo-preorder',
    slug: 'onex-neo-preorder',
    title: '1X opens NEO pre-orders at $20K / $499 per month subscription',
    titleJa: '1X、家庭向けヒューマノイド NEO の予約を開始（買い切り $20K または月額 $499）',
    type: 'news-brief',
    category: 'news',
    section: 'business',
    summary: 'OpenAI出資の 1X Technologies が二足ヒューマノイド NEO の米国向け予約販売を2025年10月に開始。買い切り 20,000 USD と月額 499 USD のサブスクリプションが提示された。配送は2026年。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    publishedAt: '2026-05-28',
    author: 'Deploid Research',
    tags: ['1x', 'consumer', 'subscription'],
    heroImage: {
      src: '',
      alt: '1X NEO robot',
      credit: '1X Technologies',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-02',
      },
    },
    whyItMatters:
      '消費者価格帯のヒューマノイドが「サブスクリプション」で提供される初期事例の1つ。toB の導入判断でも「買う」「リース」「RaaS」「サブスク」の選択肢が広がる動きとして参照価値がある。',
    keyTakeaways: [
      '価格：買い切り 20,000 USD または月額 499 USD（米国向け）',
      '予約金200 USD、配送は2026年から米国早期顧客へ',
      '家庭利用前提の安全設計。産業現場での運用は別途リスクアセスメントが必要',
    ],
    readingTimeMin: 3,
    body: `## サブスクリプション型ヒューマノイドとは何か

1X Technologies（旧 1X）が発表した NEO は、20,000ドルの買い切りと月額499ドルのサブスクリプションという2つの調達モデルを提示した。配送は2026年から米国の早期顧客から順次開始される予定だ。

OpenAI が出資していることで知られる同社は、家庭向けを主ターゲットとしている。NEO のデザインは人間の生活空間に合わせており、身長・可搬重量・安全設計が産業機とは異なる前提で作られている。

## B2B 文脈での読み方

家庭向け機が「なぜ B2B 調達担当者に関係するか」という問いへの答えは、調達モデルの変化にある。月額499ドルという価格設定は、産業向けの RaaS 契約が今後どう設計されるかの参照点になる。また、消費者向けで培われた「壊れにくさ・使いやすさ・アップデート提供モデル」が産業機に転用されるケースは、自動車・スマートフォン産業でも起きてきた。

## 現時点での留意点

NEO の安全設計は家庭利用前提だ。産業現場での利用には安全評価・責任分界の整理が別途必要になる。また米国向け予約のため、日本での調達・保守サポートは現時点で未確認。価格モデルの参照としては有益だが、実導入候補としての評価は別フェーズで行うことを推奨する。`,
    relatedRobotIds: ['onex-neo'],
    relatedManufacturerIds: ['onex'],
    relatedUseCaseIds: [],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'NEO Home Robot | Order Today',
        url: 'https://www.1x.tech/discover/neo-home-robot',
        publisher: '1X Technologies',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
    ],
  },
];
