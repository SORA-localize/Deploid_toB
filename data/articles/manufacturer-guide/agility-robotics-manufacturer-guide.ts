import type { ManufacturerGuideArticle } from '../../types';

export const agilityRoboticsManufacturerGuide: ManufacturerGuideArticle = {
  id: 'agility-robotics-manufacturer-guide',
  slug: 'agility-robotics-manufacturer-guide',
  title: 'Agility Robotics: company profile and buyer\'s guide',
  titleJa: 'メーカー解説｜Agility Robotics 物流・製造向けにDigitを商用展開、トヨタとも契約',
  type: 'manufacturer-guide',
  category: 'company-report',
  section: 'business',
  summary:
    'Agility Roboticsを、物流・製造の商用導入候補としてどう評価すべきか。価格非公開の理由、商用実績、安全設計、日本からの相談窓口を分けて整理する。',
  publishStatus: 'published',
  updatedAt: '2026-07-17',
  reliability: 'reported',
  publishedAt: '2026-07-08',
  author: 'Deploid Research',
  industryTags: ['logistics', 'manufacturing'],
  themeTags: ['business-model', 'commercialization', 'safety'],
  keyTakeaways: [
    'GXOの物流倉庫でDigitが10万トート超を搬送',
    'Digit v5で3億ドル超の複数年受注を公表',
    '自社工場RoboFabは年産ピーク1万台規模',
  ],
  heroImage: {
    src: '/images/article-generic/logistics-warehouse/forklift-warehouse-pallets.jpg',
    alt: 'Forklift moving pallets inside a logistics warehouse',
    credit: 'Bernd Dittrich / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/a-forklift-driving-through-a-warehouse-filled-with-pallets-F2C_mSrb6iM',
    rights: {
      status: 'licensed',
      sourceType: 'third-party',
      rightsHolder: 'Bernd Dittrich',
      licenseUrl: 'https://unsplash.com/license',
      checkedAt: '2026-07-08',
      permissionNote:
        'Unsplash Licenseの汎用倉庫イメージ。特定企業・ロボットの公式写真ではなく、物流倉庫テーマの代替画像として使用。',
    },
  },
  relatedRobotIds: ['agility-digit'],
  // fitSummary廃止で本文中の比較言及はUnitree（製品ラインナップ）のみになったため、それ以外を外した（G7）。
  relatedManufacturerIds: ['agility-robotics', 'unitree'],
  relatedUseCaseIds: ['warehouse-picking'],
  whyItMatters:
    'Agility Roboticsは、ヒューマノイドを研究用の機体ではなく、RaaS・クラウド運用・安全設計を含む商用パッケージとして売る数少ないメーカーである。日本から見ると、すぐ買える安価な開発機ではない一方、物流・製造で本番導入を検討する際の比較基準になる。',
  sources: [
    {
      title: 'Agility Robotics company page',
      url: 'https://www.agilityrobotics.com/company',
      publisher: 'Agility Robotics',
      checkedAt: '2026-07-13',
      reliability: 'official',
      note: '創業年、OSU発、拠点、RoboFab、沿革、顧客・パートナー表示の根拠。',
    },
    {
      title: 'Agility Robotics solutions',
      url: 'https://www.agilityrobotics.com/solutions',
      publisher: 'Agility Robotics',
      checkedAt: '2026-07-13',
      reliability: 'official',
      note: 'Digit、Arc、サービス体制、物流・製造用途、仕様の根拠。',
    },
    {
      title: 'Digit Moves Over 100,000 Totes',
      url: 'https://www.agilityrobotics.com/content/digit-moves-over-100k-totes',
      publisher: 'Agility Robotics',
      publishedAt: '2025-11-20',
      checkedAt: '2026-07-13',
      reliability: 'official',
      note: 'GXO Flowery Branchでの10万トート搬送、AMR・コンベヤ連携、学習パイプラインの根拠。',
    },
    {
      title: 'Agility Robotics to Go Public Through Merger with Churchill Capital Corp XI',
      url: 'https://www.agilityrobotics.com/content/agility-robotics-to-go-public-through-merger-with-churchill-capital-corp-xi',
      publisher: 'Agility Robotics',
      publishedAt: '2026-06-24',
      checkedAt: '2026-07-13',
      reliability: 'official',
      note: 'SPAC上場予定、65,000時間超の稼働、9施設、3億ドル超のDigit v5受注、顧客名の根拠。将来見通しは注意して扱う。',
    },
    {
      title: 'Agility Robotics Announces Commercial Agreement with Toyota Motor Manufacturing Canada',
      url: 'https://www.agilityrobotics.com/content/agility-robotics-announces-commercial-agreement-with-toyota-motor-manufacturing-canada',
      publisher: 'Agility Robotics',
      publishedAt: '2026-02-19',
      checkedAt: '2026-07-13',
      reliability: 'official',
      note: 'Toyota Motor Manufacturing CanadaとのRaaS契約、製造・サプライチェーン・物流用途の根拠。',
    },
    {
      title: 'Mercado Libre and Agility Robotics Announce Commercial Agreement to Deploy Humanoid Robots',
      url: 'https://www.agilityrobotics.com/content/mercado-libre-and-agility-robotics-announce-commercial-agreement',
      publisher: 'Agility Robotics',
      publishedAt: '2025-12-10',
      checkedAt: '2026-07-13',
      reliability: 'official',
      note: 'Mercado Libreのテキサス拠点でのDigit導入、Arcと既存自動化/WMS連携の根拠。',
    },
    {
      title: 'NVIDIA Announces Halos for Robotics, the Industry’s First Full-Stack Safety System for Physical AI',
      url: 'https://nvidianews.nvidia.com/news/nvidia-announces-halos-for-robotics-the-industrys-first-full-stack-safety-system-for-physical-ai',
      publisher: 'NVIDIA',
      publishedAt: '2026-06-22',
      checkedAt: '2026-07-13',
      reliability: 'official',
      note: 'NVIDIA HalosとAgility協業の根拠。',
    },
  ],
  manufacturerGuideContent: {
    companyOverview:
      'Agility Roboticsは、2015年に米国オレゴン州で設立されたヒューマノイドメーカーである。Oregon State UniversityのDynamic Robotics Labを起点とし、本社をオレゴン州セーラムに置く。\n\n事業は人型ロボット専業で、物流・製造現場向けのDigit本体と配備・監視・フリート管理を担うクラウドプラットフォームArc、導入設計からオンサイト保守までのサービス体制の3本柱で構成される。売上高や年間出荷台数は公表されていない。\n\n競争軸は商用実績である。機体を単体で売るのではなく、既存の倉庫・工場設備にDigitを接続した状態で稼働までを請け負う契約型の事業設計を取り、この方式で複数の商用契約を公表してきた。2026年6月に発表された上場計画では企業価値25億ドルと評価されており、研究向けの安価な開発機ではなく物流・製造の本番導入を検討するときの基準になるメーカーといえる。',
    productLineup:
      '製品は物流・製造向けヒューマノイドのDigit一機種に集約され、Unitreeのように価格帯の異なる複数機種を並べる構成を取らない。機体の上にクラウドプラットフォームArcと導入・トレーニング・保守のサービスを積み上げ、この一体構成ごと顧客に提供する。Digit自体は人間サイズの二足歩行機で、公式ページでは約16kgの運搬能力と約4時間のバッテリーに加えて、トート搬送やAMR・コンベヤ連携を前提にした設計が示されている。\n\n価格が非公開なのはこの事業設計の帰結で、実際の費用は台数・作業範囲・Arc利用料・保守・現場改修・システム連携費によって契約ごとに決まる。機体単価で稟議を組む相手ではなく、業務単位の総額で見積もる相手である。',
    lineup: [
      {
        robotId: 'agility-digit',
        roleLabel: '物流・製造の標準化されたマテリアルハンドリング向け商用候補。トート搬送、AMR・コンベヤ連携が主戦場',
      },
    ],
    history:
      'Agilityの起点はOSUの脚ロボット研究である。2015年に研究室から独立し、2016年には二足歩行ロボットCassieが自律歩行を実現した。2017年発表の初代Digitも、現在の商用機というより研究者向けの機体だった。\n\n転機は2023年で、Digitを産業顧客向けに再設計して事業の軸足を研究から商用労働力へ移した。オレゴン州セーラムに構えた自社工場RoboFabは年産ピーク1万台規模と公式に説明されており、受注に先行して量産体制へ投資する段階に入った。\n\n2025年後半からは物流・製造の商用契約が具体的な数字とともに相次いで公表され、導入先は物流倉庫から自動車製造へ広がった。2026年6月にはChurchill Capital Corp XIとの合併による上場計画を発表し、Digit v5の複数年受注3億ドル超を示して上場手続きの段階にある。',
    deploymentIntro:
      '公開情報で確認できる実装段階を、研究から商用まで5分類で整理する。',
    deploymentStatus: {
      researchEducation: {
        evidence: 'limited',
        body: '会社の起点はOSUの研究室で、初代Digitも研究者向けの機体として始まった。現在のAgilityは大学・研究機関向けに安価な開発機を配る事業モデルではない。',
        sourceUrls: ['https://www.agilityrobotics.com/company'],
      },
      exhibitionDemo: {
        evidence: 'limited',
        body: '公式動画や顧客発表でDigitの稼働映像は確認できるが、Agilityが強調するのは展示映えではなく顧客施設での稼働実績である。',
        sourceUrls: ['https://www.agilityrobotics.com/solutions'],
      },
      poc: {
        evidence: 'limited',
        body: 'Toyota Motor Manufacturing CanadaとのRaaS契約は、パイロット後の契約として発表されている。PoC単体の期間・台数・評価指標を示す公開情報は限られる。',
        sourceUrls: ['https://www.agilityrobotics.com/content/agility-robotics-announces-commercial-agreement-with-toyota-motor-manufacturing-canada'],
      },
      internalTrial: {
        evidence: 'limited',
        body: 'RoboFabという自社製造拠点は存在するが、Digit自身がAgilityの生産工程をどの程度自動化しているかを示す稼働データは公表されていない。',
        sourceUrls: ['https://www.agilityrobotics.com/company'],
      },
      commercial: {
        evidence: 'confirmed',
        body: 'GXOでの10万トート超搬送、Toyota Motor Manufacturing CanadaとのRaaS契約、Mercado Libreのテキサス拠点導入、Schaefflerを含む顧客名が公式に確認できる。2026年6月時点で9施設・6万5,000時間超の運用が示されている。',
        sourceUrls: [
          'https://www.agilityrobotics.com/content/digit-moves-over-100k-totes',
          'https://www.agilityrobotics.com/content/mercado-libre-and-agility-robotics-announce-commercial-agreement',
          'https://www.agilityrobotics.com/content/agility-robotics-to-go-public-through-merger-with-churchill-capital-corp-xi',
        ],
      },
    },
    procurementChannels: [
      {
        kind: 'official-direct',
        name: 'Agility Robotics 公式問い合わせ',
        url: 'https://www.agilityrobotics.com/solutions',
        role: '直販・RaaS契約の一次窓口。日本からの対応可否・導入形態は要確認',
      },
    ],
    japanProcurement:
      '2026年7月時点の公開情報では日本法人・国内正規代理店・国内保守拠点は確認できず、検討は公式の問い合わせ窓口で対象国と導入形態を確認するところから始まる。\n\n※調達リスクとして、現在のDigitは人と完全に混在して働く前提を持たず、Agility自身も次世代のDigit v5で協調安全を目指すと説明している段階である。サービス体制は米国拠点が中心で日本の現場にどこまで届くかは未確認のうえ、上場計画も取引完了前で条件は変わり得る。',
    faq: [],
  },
};
