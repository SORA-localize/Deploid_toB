import type { Guide } from './types';

export const guides: Guide[] = [
  {
    id: 'decision-variables',
    slug: 'decision-variables',
    title: 'ヒューマノイド導入で最初に押さえる意思決定変数',
    titleJa: '意思決定変数の地図',
    summary: '価格、調達、保守、安全、PoC、国内可否をどう見るべきかを整理する旗艦ガイド。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    sources: [],
    seo: { noindex: true },
    heroImage: {
      src: '',
      alt: 'Atlas robot reflecting decision variables',
      credit: 'Boston Dynamics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-02',
      },
    },
    description:
      '知識ゼロの担当者が、ロボット比較に入る前に理解しておくべき判断軸をまとめる。',
    stage: 'evaluate',
    order: 1,
    topics: ['decision-variables', 'tco', 'safety', 'procurement'],
    targetReaders: ['新規事業担当', '製造DX担当', '設備企画担当'],
    readingTimeMinutes: 12,
    checklistItems: ['国内サポートを確認したか', 'PoCの成功条件を決めたか', '安全責任の分界を決めたか'],
    body: `ヒューマノイド導入は、ロボット選定の前に「何を変数として見るか」を揃えるところから始まる。本ガイドは、メーカー発表やスペック表ではなく、買い手が現場導入で実際に決めなければならない項目を整理する。各セクションは「何を確認すべきか」を提示し、具体的な数字や事業者名は出典のあるロボット詳細ページ側に置く。

## 調達形態

買い切り・リース・RaaS（Robotics as a Service）・サブスクのどれで導入するかは、初期投資の重さ・撤退コスト・所有権の在り処を大きく変える。技術成熟が早い領域では、固定資産化を避けて短期で乗り換えられる形態を選ぶ余地が大きい。

- 提供される調達形態はどれか（メーカー直販／代理店経由／パートナー実証）
- 契約期間・解約条件・残価設定はどうなっているか
- 機器の所有権は誰にあるか
- 保守・アップデート費用は契約に含まれるか
- 切替・撤退時のデータ・ティーチング資産の扱い

## 総保有コスト（TCO）

本体価格だけで評価しない。導入から退役までの一連の費用を、少なくとも 3〜5 年スパンで積む。ヒューマノイドは「機体だけで完結する設備」ではなく、運用・保守・人の工数まで含めて初めてコストが見える。

- 機体・周辺・保守・運用・教育・退役までを束ねた TCO（3〜5 年）の試算を、ベンダーと共同で作る
- 「年あたりに換算した RaaS / サブスク」と「買い切り＋保守＋人件」を**同じ期間で**比較する
- バッテリー交換・サポート契約の更新タイミングを明確化する

## 安全・法規制

人と空間を共有する場合、責任分界とリスクアセスメントが導入の可否を決める。日本では国際規格 **ISO 10218** が JIS として国内適用されている（**JIS B 8433-1 / -2**）ことを起点にすると話が早い。

- 産業安全規格（ISO 10218 / JIS B 8433）への適合状況をベンダーに文書で確認する
- 日本国内の無線・電気規格（技適 / PSE）の取得状況を確認する
- 現場ごとのリスクアセスメントは「導入条件」ではなく「契約前提」として最初から盛り込む

## 設置・運用要件

「動かす環境」が成立するかは仕様書だけでは分からない。

- 床面・段差・通路幅・障害物の状況
- 充電インフラ（場所・電圧・本数）
- ネットワーク要件（社内LAN・無線・クラウド接続の可否）

## ROI / 投資回収の考え方

短期回収を前提にしないほうが、判断が現実的になる。

- 削減できる工数 / 置き換えできるタスクの正確な定義
- 失敗を許容できる PoC 期間とその予算
- 段階導入の前提（小規模実証→限定本番→拡張）
- 計測指標（タクトタイム・歩留・稼働率・人手代替工数）

## ヒューマノイドじゃなくていいケース

率直に書く。これが買い手目線の信頼を取りに行く方法。**ヒューマノイドの強みは「人間用に設計された環境で、柔軟にタスクを切り替えられる」一点**。それが必要ない用途には、より適した選択肢がある。

「ヒューマノイドを入れたい」という意思決定から始めると、適合しない作業に無理やり機体を当てることになる。逆に「現場のこの作業を、人型である意味があるか」から問い直すと、選択肢が広がる。`,
    relatedRobotIds: ['unitree-g1', 'figure-03'],
    relatedUseCaseIds: [
      'warehouse-picking',
      'factory-inspection',
      'research-development',
      'demo-exhibition',
      'customer-reception',
      'retail-shelf-stocking',
      'care-physical-assistance',
    ],
  },
  {
    id: 'poc-planning',
    slug: 'poc-planning',
    title: 'PoC計画策定ガイド',
    summary: 'ヒューマノイド導入の実証実験で、失敗しやすい条件と評価項目を先に決めるためのガイド。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    sources: [],
    seo: { noindex: true },
    heroImage: {
      src: '',
      alt: 'PoC planning with Figure robot',
      credit: 'BMW Group / Figure AI',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        checkedAt: '2026-06-02',
      },
    },
    description: 'PoCを単なるデモで終わらせないためのKPI、現場条件、エスカレーション設計を整理する。',
    stage: 'act',
    order: 2,
    topics: ['poc', 'kpi', 'operations'],
    targetReaders: ['現場責任者', '事業開発担当', '技術企画担当'],
    readingTimeMinutes: 10,
    relatedRobotIds: ['figure-03', 'agility-digit'],
    relatedUseCaseIds: ['warehouse-picking'],
  },
];
