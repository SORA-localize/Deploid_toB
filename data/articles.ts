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
  // ── 2024年 主要イベント ──────────────────────────────────────────
  {
    id: 'boston-dynamics-atlas-electric',
    slug: 'boston-dynamics-atlas-electric',
    title: 'Boston Dynamics retires hydraulic Atlas, unveils all-electric redesign',
    titleJa: 'Boston Dynamics、油圧式 Atlas を退役——完全電動の新世代を発表',
    type: 'tech-update',
    category: 'news',
    section: 'tech',
    summary: 'Boston Dynamics が20年以上続けた油圧式 Atlas の開発を終え、完全電動の次世代 Atlas を2024年4月に公開した。全身設計を一新し、より柔軟なグリッパーと俊敏な動作を実現している。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'official',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    tags: ['boston-dynamics', 'autonomous', 'research'],
    heroImage: {
      src: '/images/articles/boston-dynamics-atlas-electric/hero.jpg',
      alt: 'Boston Dynamics electric Atlas robot',
      credit: 'Boston Dynamics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '油圧から電動への世代交代は保守コスト・騒音・設置環境の大幅な変化を意味する。長年「研究用デモ機」の代名詞だったAtlasが商用化路線に転換したことは、Boston Dynamicsのビジネスモデル変化として追う価値がある。Hyundai傘下での開発加速も評価変数になる。',
    keyTakeaways: [
      '油圧駆動から電動アクチュエータへ全面移行。保守・騒音・精度面で産業利用の前提条件が変わる',
      'Hyundai傘下で商用化を加速。研究機から産業機への方向転換を明言',
      '全身設計を刷新——把持部の自由度が増し、製造・物流の補助作業に向く構造に',
      '販売条件・価格は未公表。研究パートナー向けの限定提供から始まる見通し',
    ],
    readingTimeMin: 5,
    body: `## 油圧から電動へ——何が変わるか

2024年4月17日、Boston Dynamics は20年以上にわたって開発してきた油圧駆動式 Atlas の「退役」を発表し、同日に完全電動の新世代 Atlas を公開した。この転換は単なるパワートレインの変更ではない。

油圧システムの課題は実運用の文脈で明確だった。高圧オイルの配管・漏れリスク・騒音・メンテナンス頻度が、研究機としては許容されても産業導入にはハードルになっていた。電動アクチュエータへの移行は、これらの問題を構造から解消する。保守コスト・稼働環境（食品・医療・半導体工場など油分を嫌う現場）・騒音規制への対応が変わる。

## 新設計の特徴

新 Atlas は把持部を全面刷新し、従来の3本指クランプから、より人間の手に近い動作を持つグリッパーに切り替えた。腰の可動域が拡張され、床面のアイテム回収や低い場所への作業が可能になっている。また、従来の Atlas では不可能だった「うつ伏せから自力で起き上がる」動作をデモで披露し、起き上がり時の適応動作に改善が見られた。

## Hyundai 傘下での商用化路線

2021年に Hyundai Motor Group が Boston Dynamics を約11億ドルで買収して以降、同社は「研究機メーカーから製品メーカーへ」の転換を明言してきた。電動 Atlas はその具体的な一手だ。自動車製造ラインでの実証を想定しており、Hyundai の工場を最初の導入候補として開発が進む。

## 日本企業が見るべき変数

販売条件・価格・日本での調達経路はいずれも未公表（要確認）。現時点では「どんな研究パートナーシップが組めるか」を問い合わせるフェーズにある。Hyundai の日本拠点（韓国資本）経由での調達可能性は今後の注目点のひとつ。`,
    relatedRobotIds: ['boston-dynamics-atlas'],
    relatedManufacturerIds: ['boston-dynamics'],
    relatedUseCaseIds: ['factory-inspection', 'research-development'],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Boston Dynamics: An Electric New Era for Atlas',
        url: 'https://bostondynamics.com/blog/electric-new-era-for-atlas/',
        publisher: 'Boston Dynamics',
        publishedAt: '2026-06-13',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'figure-ai-series-b-2024',
    slug: 'figure-ai-series-b-2024',
    title: 'Figure AI closes $675M Series B — Microsoft, OpenAI, Nvidia lead the round',
    titleJa: 'Figure AI が6億7500万ドルのシリーズBを完了——Microsoft・OpenAI・Nvidia が出資',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary: 'Figure AI が2024年2月、Microsoft・OpenAI・Nvidia・Jeff Bezos・LG Innotekなどを投資家に迎えてシリーズBで6億7500万ドルを調達した。AIソフトウェア大手との資本関係が競争優位の核になる。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    tags: ['figure', 'funding', 'series-b'],
    whyItMatters:
      'ハードウェアメーカーがMicrosoft・OpenAI・Nvidiaと同一ラウンドで資本関係を結んだことは、制御スタック（AI OS）の開発力が機体と同等以上に重要という業界判断を示す。BMW実証（別記事参照）と合わせて読むと、調達→実証→量産のロードマップが見えてくる。',
    keyTakeaways: [
      '調達額6.75億ドル、累計調達は10億ドル超。当面のキャッシュフローリスクは低い',
      'Microsoft・OpenAI・Nvidia・Jeff Bezos・LG Innotek・Intel Capitalが出資——ソフト/ハード/流通の全軸でエコシステム形成',
      'OpenAIとの協業でAI制御スタックの強化を明言。他社との技術差別化軸がソフトウェアに移行',
      '日本市場への言及はまだなし。国内調達経路は別途確認が必要',
    ],
    readingTimeMin: 4,
    body: `## 誰が出資したか、なぜ重要か

Figure AI のシリーズBには Microsoft、OpenAI、Nvidia、Jeff Bezos、LG Innotek、Intel Capital が参加した。金額は6億7500万ドルで、累計調達額は10億ドルを超えた。

注目すべきは投資家の「組み合わせ」だ。Microsoft はクラウド・エンタープライズ、OpenAI は AI モデル、Nvidia はチップ・シミュレーション環境、LG Innotek は部品・量産ライン、Jeff Bezos は物流・EC——それぞれが Figure のバリューチェーンの異なる層をカバーする。これは「資金調達」ではなく「エコシステムの形成」として読む方が正確だ。

## AI 制御スタックとの統合

OpenAI との協業で特に注目されるのは、大規模言語モデル（LLM）とロボット制御の統合だ。Figure は2024年に公開したデモで、GPT-4 との統合による音声指示→タスク実行のフローを披露している。言語モデルが「何をすべきか」を判断し、ロボット制御系が「どう動くか」を実行する二層構造は、産業ロボットの「固定プログラム」とは根本的に異なるアーキテクチャだ。

## BMW 実証との関係

シリーズBの発表（2024年2月）と BMW Spartanburg での実証（2024〜2025年）は時系列として連続している。調達した資金が量産体制と BMW との実証継続に充てられた文脈が見える。BMW 実証の結果（別記事参照）と合わせて読むことで、「資金→実証→量産」のロードマップがより具体的に描ける。

## 日本企業へのインプリケーション

現時点で Figure AI は日本での販売・調達経路を公式に発表していない。ただし、LG Innotek（韓国）が出資していることは、アジア太平洋圏での展開を射程に入れている可能性を示唆する。調達可能性の確認は直接問い合わせが現状では唯一の手段。`,
    relatedRobotIds: ['figure-02', 'figure-03'],
    relatedManufacturerIds: ['figure-ai'],
    relatedUseCaseIds: [],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Figure raises $675M from Microsoft, OpenAI, Nvidia, and others',
        url: 'https://techcrunch.com/2024/02/29/figure-raises-675m-from-microsoft-openai-nvidia-and-others/',
        publisher: 'TechCrunch',
        publishedAt: '2026-06-13',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Figure AI — Series B Announcement',
        url: 'https://www.figure.ai/news',
        publisher: 'Figure AI',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'unitree-g1-price-evaluation',
    slug: 'unitree-g1-price-evaluation',
    title: 'Unitree G1 at $16K resets the floor for pre-PoC humanoid evaluation',
    titleJa: 'Unitree G1 が1,600万円以下の市場を切り開く——PoC前の社内評価コストが変わる',
    type: 'market-analysis',
    category: 'analysis',
    section: 'business',
    summary: 'Unitree Roboticsが2024年5月に発表したG1は、開発者向け価格16,000ドル（約240万円）という価格帯で市場に登場した。本格PoCより前の「社内検証・デモ・研究」用途のコスト構造を変える可能性がある。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    tags: ['unitree', 'pricing', 'research'],
    heroImage: {
      src: '/images/articles/unitree-g1-price-evaluation/hero.jpg',
      alt: 'Unitree G1 humanoid robot',
      credit: 'Unitree Robotics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'Figure・Atlas 級の機体は調達・保険・設置環境の整備で数千万円単位の初期費用が現実的。G1の価格帯は「まず社内で動かして感触を掴む」フェーズのコストを大幅に下げる。ただし産業用途への耐久性・保守体制は別評価が必要。',
    keyTakeaways: [
      'G1の開発者向け発売価格は16,000ドル（約240万円）——同世代の他社比で5〜10倍のコスト差',
      '研究・教育・展示デモ向け。産業現場での連続稼働・保守サポートは別途確認が必要',
      '価格が下がると社内稟議のハードルも下がる——「PoC前に試す」予算枠での検討が現実的になる',
      '日本での販売・保守窓口は2024年時点で未確認。個人輸入・研究機関経由が先行している',
    ],
    readingTimeMin: 4,
    body: `## 16,000ドルが意味する価格帯の変化

2024年5月に Unitree Robotics が発表した G1 の開発者向け価格は16,000ドル（約240万円）だ。競合として比較されることの多い Figure 02 や Atlas の調達コストが数百万〜数千万円規模とされる中、G1 はひとつの桁を下げた。

この差は「機体の性能差」を超えた意味を持つ。高価格機は機体費用だけでなく、保険・搬入・設置環境の整備・社内承認フローにかかるコストが積み重なる。G1の価格帯は「検討フェーズで動かして試す」という使い方を、予算感覚として現実的にする。

## G1 のスペックと用途の前提

身長127cm・重量35kg・最大歩行速度2m/s のコンパクトな二足歩行機。ペイロードは公称2kgで、重量物ハンドリングには向かない。自由度は43 DoF で研究用途には十分な関節構成を持つが、産業環境での連続稼働耐久性・防塵防水・保守部品の供給体制は別途確認が必要だ。

## 評価フェーズの設計に使える

本格 PoC の前段として「社内で動かして何ができるか・できないかを把握する」フェーズがある。G1 はこのフェーズに向く。動作プログラムの開発環境（SDK・ROS 対応）が整っており、研究機関や大学との共同研究にも使われている。ただし「評価で動いた」と「産業導入できる」は別の命題なので、本番機との移行計画を分けて考える必要がある。

## 日本での調達状況

2024年時点で Unitree Japan の正式販売・保守窓口は未確認。国内では大学・研究機関での個人輸入・代理店経由の導入が先行しており、企業による本格利用事例は限定的だ。調達を検討する場合は輸入手続き・保守体制・国内での修理対応を事前に調査することが必要になる。`,
    relatedRobotIds: ['unitree-g1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['research-development', 'demo-exhibition'],
    relatedGuideIds: ['decision-variables'],
    sources: [
      {
        title: 'Unitree G1 Humanoid Agent — Official Product Page',
        url: 'https://www.unitree.com/g1/',
        publisher: 'Unitree Robotics',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'apptronik-mercedes-pilot-2024',
    slug: 'apptronik-mercedes-pilot-2024',
    title: 'Apptronik and Mercedes-Benz launch Apollo pilot in vehicle manufacturing',
    titleJa: 'Apptronik と Mercedes-Benz、Apollo を車両製造ラインで実証開始',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: 'Apptronikが開発するヒューマノイド Apollo が Mercedes-Benz の製造拠点で実証に入った。補助搬送・部品供給タスクから開始し、製造現場での汎用ヒューマノイド活用可能性を検証する。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    tags: ['apptronik', 'mercedes-benz', 'manufacturing', 'commercial'],
    heroImage: {
      src: '/images/articles/apptronik-mercedes-pilot-2024/hero.png',
      alt: 'Apptronik Apollo humanoid robot',
      credit: 'Apptronik',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'Figure×BMW実証と並ぶ製造業での本格実証事例。Apptronikは米軍向けロボットで培ったペイロード・耐久性の設計思想を持つ点が差別化軸。製造ラインへの適合設計（腰高・リーチ・ペイロード）の比較対象として評価できる。',
    keyTakeaways: [
      'Apollo は身長173cm・ペイロード25kgで製造現場の人間作業区域に適合した設計',
      '補助搬送・部品供給から開始し段階的に作業範囲を拡大する想定',
      'Apptronikは米軍・NASAとの協業実績を持つ。ミッションクリティカル環境向け設計が背景',
      '日本代理店・調達経路は未確認（2024年時点）',
    ],
    readingTimeMin: 5,
    body: `## なぜ Mercedes-Benz が Apptronik を選んだか

2024年3月、Apptronik と Mercedes-Benz は製造ラインでのヒューマノイドロボット実証に向けたパートナーシップを発表した。Figure×BMW と並ぶ自動車大手でのヒューマノイド実証として注目される。

Apptronik の Apollo が Mercedes に選ばれた背景には、設計思想の親和性がある。Apollo は身長173cm・重量73kg・ペイロード25kgで、既存の製造ラインの通路幅・作業台高さ・可搬重量に近い設計になっている。これは「人間の作業環境を変えずにロボットを導入する」という方針と合致する。

## Apptronik の設計思想

Apptronik はテキサス大学のHuman Centered Robotics Lab から派生したスタートアップで、米軍・NASA との共同開発実績を持つ。軍事・宇宙用途では「絶対に止まれない環境での稼働」が要件になるため、フェイルセーフ設計・部品交換の容易さ・長期稼働耐久性が設計の核になってきた。

この経験は産業利用への転換でも優位に働く。Figure や Atlas がAI制御の洗練を前面に出すのに対し、Apptronik は「実環境での信頼性」を差別化軸に据えている。

## 実証の進め方と注目すべき変数

Mercedes との実証は補助搬送・部品供給タスクから段階的に拡大する計画だ。Figure×BMW の実証が「単一タスク・固定スコープ」で成果を出したことを踏まえると、Apptronik も同様のスコープ設計を取ると予想される。

評価を進める上で注目すべき変数は「作業切り替えの自律度」だ。単一タスクの繰り返しではなく、複数タスクを状況に応じて切り替えられるか。この点がFigure実証との差分として今後明らかになるはずだ。

## 日本への示唆

日本では Apptronik の公式販売・保守窓口は未確認（2024年時点）。自動車産業との親和性を考えると、トヨタ・Honda・日産といった国内メーカーとの接点が今後の注目点になる。`,
    relatedRobotIds: ['apptronik-apollo'],
    relatedManufacturerIds: ['apptronik'],
    relatedUseCaseIds: ['factory-inspection'],
    relatedGuideIds: ['poc-planning'],
    sources: [
      {
        title: 'Apptronik and Mercedes-Benz team up to develop humanoid robots for car manufacturing',
        url: 'https://apptronik.com/news-collection/apptronik-and-mercedes-benz-team-up-to-develop-humanoid-robots-for-car-manufacturing',
        publisher: 'Apptronik',
        publishedAt: '2026-06-13',
        checkedAt: '2026-06-13',
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
      src: '',
      alt: 'Unitree G1 humanoid robot at Haneda Airport JAL ground handling',
      credit: 'JAL Group',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
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
