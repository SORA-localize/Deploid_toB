# Guides Retirement — Revival Archive v1

Status: archive / revival reference
Created: 2026-06-28
Related plan: `docs/planning/guides-retirement-plan-v1.md`

この文書は `/guides`（導入ガイド）コンテンツタイプ撤去にあたり、将来の復活を容易にするための退避資産です。
撤去理由と手順は計画書を参照。ここには「復活に必要な実体（型・タグ・本文・撤去前 SHA・復活手順）」だけを置く。

## 撤去前 commit SHA

- `PRE_REMOVAL_SHA = 62836442e84f4a88ed6f80a3ca25e3af36a45ca7`（`6283644 docs: add guides retirement plan`）
- この commit ではガイドが完全に存在し、`npm run validate:data` / `npm run build` が通る。
- 最短復活はこの SHA から guide 関連ファイルを取り出すこと（§ 復活手順）。

## 撤去 commit 列

撤去を構成する原子的 commit（ブランチ `refactor/retire-guides`、`PRE_REMOVAL_SHA` の直後から）。
`git revert` で戻す際はこの**逆順**で行う（GR-008 → GR-003）。

- `7823056` GR-003 他ページからガイド導線を外す
- `bd4b36f` GR-004 nav / sitemap からガイドを外す
- `41d194d` GR-005 `/guides` ルートと GuidesBrowser / guideFilters を削除
- `70ad050` GR-006 `relatedGuideIds` 参照を全撤去（atomic）
- `fe0ce68` GR-007 `Guide` 型・data・lib を削除（tsconfig で docs を除外）（atomic）
- `166e53c` GR-008 guide uiText と孤児 ComingSoonGate を削除

補助 commit（コード撤去ではないが復活時に有用）:

- `48acf1c` GR-002 本計画 archive（型・タグ・本文の退避）
- `7c57255` GR-009/010 docs と先行計画の整合

復活の最短経路:

`fe0ce68`（GR-007）は `Guide` 削除と同じ commit で `tsconfig.json` の exclude に `docs` を追加している。
この docs 除外は撤去と独立した正しい設定なので**戻さない**。そのため GR-007 だけ分けて扱う。

```sh
# 1) GR-007 以外を逆順で revert
git revert --no-edit 166e53c 70ad050 41d194d bd4b36f 7823056   # GR-008, 006, 005, 004, 003

# 2) GR-007 を revert しつつ tsconfig の docs 除外は維持する
git revert --no-commit fe0ce68
git checkout HEAD -- tsconfig.json        # docs 除外を巻き戻さない
git commit -m "Revert GR-007 (restore Guide; keep docs excluded from tsconfig)"

# （別法）個別ファイルを撤去前から取り出す: git checkout 62836442 -- data/guides.ts data/types.ts ...
```

復活後は現行の `UseCase` 型・validator（evidence model 導入後）に合わせて `relatedGuideIds` 等を再設計すること。`PRE_REMOVAL_SHA` の `data/useCases.ts` をそのまま上書きしない。

## 型スナップショット（`data/types.ts`）

```ts
export type GuideStage = 'learn' | 'evaluate' | 'act';

// Guide extends BaseRecord。BaseRecord 由来で Guide が使うフィールド:
//   id, slug, previousSlugs?, summary, publishStatus, updatedAt,
//   reliability, sources, heroImage?, seo?
export interface Guide extends BaseRecord {
  title: string;
  titleJa?: string;
  description: string;
  stage: GuideStage;
  order: number;
  topics: TagValue<'guide-topic'>[];
  targetReaders: string[];
  readingTimeMinutes?: number;
  checklistItems?: string[];
  /** 記事本文（Markdown）。空ならガイド本文セクションは描画されない。 */
  body?: string;
  relatedRobotIds: Id[];
  relatedUseCaseIds: Id[];
  // 関連articlesは Article.relatedGuideIds で逆引きする。
}
```

撤去対象の参照フィールド（復活時に再追加が必要）:

- `UseCase.relatedGuideIds: Id[]`
- `Article.relatedGuideIds?: Id[]`

## タグスナップショット（`lib/tagRegistry.ts` の `guide-topic`）

```ts
// kind 'guide-topic' を kinds union に戻し、以下7値を登録する
{ kind: 'guide-topic', value: 'decision-variables', label: '判断軸' },
{ kind: 'guide-topic', value: 'tco', label: 'TCO' },
{ kind: 'guide-topic', value: 'safety', label: '安全' },
{ kind: 'guide-topic', value: 'procurement', label: '調達' },
{ kind: 'guide-topic', value: 'poc', label: 'PoC' },
{ kind: 'guide-topic', value: 'kpi', label: 'KPI' },
{ kind: 'guide-topic', value: 'operations', label: '運用' },
```

## 撤去した周辺実装（復活時の再構築対象）

計画書 §4 の接続マップを正とする。要点のみ:

- ルート: `src/app/guides/page.tsx` / `src/app/guides/[slug]/page.tsx`
- 専用: `components/GuidesBrowser.tsx` / `lib/guideFilters.ts` / `data/guides.ts` / `components/ComingSoonGate.tsx`
- lib: `lib/data.ts`（guide アクセサ5関数） / `lib/validate.ts`（guideループ・Guide⇄UseCase双方向・relatedGuideIds検証） / `lib/search.ts`（guide検索doc・'guides' collection） / `lib/jsonLd.ts`（guideJsonLd） / `lib/labels.ts` / `lib/display.ts` / `lib/visualSemantics.ts`（guide-topic tone, guideStageTones） / `lib/tags.ts`（getGuideTopicOptions） / `lib/uiText.ts`（ガイド文言） / `lib/siteNavigation.ts`（ガイドタブ）
- 相互リンク: `reports/[slug]` / `use-cases/[slug]` / `HomeContentNavigator` / `ManufacturerMapStage` / `sitemap.ts`

## 復活手順

### 速経路（推奨）

1. `git show PRE_REMOVAL_SHA:data/guides.ts > data/guides.ts` で本文を復元。
2. 「撤去 commit 列」を逆順で `git revert`（または各ファイルを `git checkout PRE_REMOVAL_SHA -- <path>`）。
3. `npm run validate:data` / `npm run build` を通す。

### 手動経路

型 → data → lib → validator → UI → nav → sitemap の順に再追加する。計画書 §4 の一覧を逆向きに辿る。

### 復活時の重大な注意

- 撤去後、evidence model などで `UseCase` 型・`lib/validate.ts` が当時から変化している可能性が高い。
- 特に `UseCase.relatedGuideIds` を戻すときは、現行の UseCase 型・validator に合わせること。`PRE_REMOVAL_SHA` の `data/useCases.ts` をそのまま上書きしない（evidence フィールドを失う）。
- `relatedUseCaseIds` の値（例: 旧 `warehouse-picking`）が現行 useCase id と一致するか確認してから戻す。

## 退避した本文（`data/guides.ts` 全文 / PRE_REMOVAL_SHA 時点）

> 下記は撤去前の `data/guides.ts` 全文。git 履歴に加え、ここでも発見性を確保するため保存する。

```ts
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
      'care-physical-assistance',
      'factory-assembly-support',
    ],
  },
  {
    id: 'poc-planning',
    slug: 'poc-planning',
    title: 'PoC計画策定ガイド',
    summary: 'ヒューマノイド導入の実証実験で、失敗しやすい条件と評価項目を先に決めるためのガイド。',
    publishStatus: 'published',
    updatedAt: '2026-06-22',
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
    checklistItems: [
      'PoC開始前に、人手で行っている現状のKPIを同じ条件で計測したか',
      '失敗条件（撤退基準）を、成功条件と同時に決めたか',
      '異常時のエスカレーション先と対応可能な時間帯を、現場側で決めたか',
    ],
    body: `PoC（実証実験）は「とりあえず試してみる」で始めると、評価軸が曖昧なまま延長を繰り返し、本番導入の判断材料が最後まで揃わないことが多い。本ガイドは、PoCを始める前に決めておくべき項目を、KPI・成功失敗条件・現場体制・期間設計の4つに分けて整理する。

## PoCの目的を一文で決める

「ヒューマノイドが使えるか試したい」という目的は、PoCの終了条件を定義できない。PoCを始める前に、以下を一文で言い切れる状態にする。

- どの作業の、どの工程を対象にするか（対象範囲を限定する）
- 何が確認できれば「次の段階に進める」と判断するか
- 何が分かれば「この用途には合わない」と判断できるか

目的が定まっていないと、評価する側もPoCをいつ終わらせるか決められない。

## KPIは導入前の現状値を測ってから決める

ロボット導入後の数値だけでは、何が変わったか判断できない。PoC開始前に、人手で行っている現状の作業を同じ条件で計測しておく。

- タクトタイム（1サイクルにかかる時間）
- 歩留（成功率・エラー率）
- 稼働率（停止時間を含めた実働時間の割合）
- 人手の代替工数（ロボット導入で空いた人員が何に使えるようになったか）

KPIは「ロボットの性能」ではなく「現場の業務がどう変わったか」を測る指標にする。メーカーが提示するベンチマークではなく、自社の現状値との比較で評価する。

## 成功条件と失敗条件を、PoC開始前に両方決める

成功条件だけを決めると、結果が中途半端なときに判断が引き延ばされやすい。失敗条件も同時に決めておく。

- 成功条件：KPIがどの数値に達したら本番導入を検討するか
- 失敗条件：何が起きたら、または何日経過したら撤退するか
- 中間判断：成功・失敗のどちらにも届かない場合、誰がいつ判断するか

失敗条件を決めていないPoCは、「もう少し続ければ改善するかもしれない」という理由で延長が続き、評価のための予算と期間が目的を失う。

## 現場の体制とエスカレーション設計

PoC中の異常時対応は、メーカーの仕様書だけでは決まらない。現場側で以下を事前に決める。

- ロボットが停止・誤動作したときに誰が対応するか（現場スタッフかメーカー保守か）
- 対応可能な時間帯（夜間・休日のサポート体制があるか）
- 人とロボットが同じ空間で作業する場合の安全停止手順
- データ・ログの取得範囲と、誰がそれを確認するか

これらはPoC終了後、本番導入の契約条件にそのまま転用できる。PoCの段階で曖昧にしておくと、本番導入時に同じ議論をやり直すことになる。

## PoCをフェーズで区切る

一度の長期PoCではなく、短いフェーズに区切って評価する方が、途中で軌道修正しやすい。

- フェーズ1：限定条件下での動作確認（対象物・動線を絞る）
- フェーズ2：実運用に近い条件での評価（KPI計測を本格化する）
- フェーズ3：人員体制・運用ルールを含めた評価（本番想定の体制で動かす）

各フェーズの終わりに、継続・条件変更・終了のいずれかを判断する。フェーズを区切らずに数ヶ月間「実証中」のまま続けると、評価データが蓄積されても判断のタイミングを失う。

## 本番導入に進む前に確認すること

PoCの数値が良好でも、本番導入の判断には別の確認が必要になる。

- PoCと同じ条件を本番現場でも再現できるか（PoCは限定された条件で行われていることが多い）
- 保守・部品供給の体制は、PoC時点の仮設対応のままか、本契約に切り替わるか
- 台数を増やした場合のネットワーク・充電・人員体制は、PoCの延長で対応できるか

PoCは「ロボットが使えるか」を確認する場であり、「本番運用が成立するか」を確認する場ではない。両者を分けて評価することが、PoC計画の最初の判断になる。`,
    relatedRobotIds: ['figure-03', 'agility-digit'],
    relatedUseCaseIds: ['warehouse-picking'],
  },
];
```
