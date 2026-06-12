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
      src: '',
      alt: 'Digit robot moving totes at GXO',
      credit: 'Agility Robotics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-02',
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
