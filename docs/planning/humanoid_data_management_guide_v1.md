# ヒューマノイド導入メディア — データ管理ガイド v1

## 1. この文書の目的

この文書は、このサイトのデータをどう作り、どう更新し、どう破綻させないかを整理するための運用ガイド。

具体的なTypeScript型の真実源は `nextjs_data_types_v1.ts`。
Next.jsプロジェクトでは `data/types.ts` にコピーして使う。

---

## 2. 基本方針

このサイトでは、UIよりも先にデータを資産として残す。

目標：

- 今のNext.js実装で扱いやすい
- 将来CMSやDBへ移しても壊れにくい
- AIや外注に渡しても構造が伝わる
- 出典と確認日が残り、情報品質を説明できる

---

## 3. MVPで持つデータ

- `manufacturers`
- `robots`
- `guides`
- `useCases`
- `reports`

後回し：

- `partners`
- `cases`
- `solutions`
- `industries` 独立collection

`industries` はMVPでは独立collectionにしない。`useCases.industryTags` として扱う。

---

## 4. 各データの役割

### `manufacturers`

供給体制の理解。

- どの会社か
- メーカーか代理店かSIerか
- 日本での窓口はあるか
- 保守やPoC支援は期待できるか

### `robots`

導入判断の個票。

- 何ができるか
- 何に向くか
- どう調達するか
- 日本で導入できる可能性はあるか
- 比較時に何が強み/制約になるか

### `guides`

意思決定フレーム。

- 導入判断変数
- PoC設計
- TCO
- 安全・法規
- ベンダー評価

### `useCases`

用途から探すための逆引き導線。

- どの作業に向くか
- どの条件なら成立するか
- どの条件だと厳しいか
- 候補ロボットは何か
- どのガイドを読むべきか

### `reports`

鮮度と判断材料。

- analysis
- deployment-report
- interview
- event-report
- policy-update
- case-study
- news-brief

ニュース速報ではなく、「買い手にとってなぜ重要か」を残す。

---

## 5. 参照関係

- manufacturer has many robots
- robot belongs to one manufacturer
- robot relates to many useCases
- useCase has many candidate robots
- guide relates to robots and useCases
- report relates to robots, manufacturers, useCases, guides

参照はすべて `slug` で行う。

例：

- `Robot.manufacturerSlug`
- `Robot.useCaseSlugs`
- `UseCase.candidateRobotSlugs`
- `Report.relatedRobotSlugs`

---

## 6. 命名規則

### collection名

- 複数形
- 英語
- 意味ベース

使う：

- `robots`
- `manufacturers`
- `guides`
- `useCases`
- `reports`

使わない：

- `posts`
- `industries`
- `companies`

### slug

- 小文字
- ハイフン区切り
- 英数字ベース
- 公開後はむやみに変えない

例：

- `unitree-g1`
- `figure-02`
- `warehouse-picking`
- `decision-variables`

### field名

- 英語
- camelCase
- 意味が明確なもの

例：

- `japanAvailability`
- `japanPresence`
- `deploymentStage`
- `buyerReadiness`
- `candidateRobotSlugs`

---

## 7. 出典管理

事実性が重要な情報には `Source[]` を残す。

`Source` に持つもの：

- `title`
- `url`
- `publisher`
- `publishedAt`
- `checkedAt`
- `reliability`
- `note`

特に強く必要：

- `robots`
- `manufacturers`
- `reports`

推奨：

- `guides`
- `useCases`

注意：

- 一次出典を優先する
- 企業公式、製品ページ、正式資料を優先する
- 報道は `reported` として扱う
- 推定値は `estimated` として扱う
- AIが生成した推測値を事実として混ぜない

---

## 8. ローカルデータ運用

Next.js初期実装ではCMSを接続しない。

配置：

```txt
data/
  types.ts
  robots.ts
  manufacturers.ts
  guides.ts
  useCases.ts
  reports.ts
lib/
  robots.ts
  manufacturers.ts
  guides.ts
  useCases.ts
  reports.ts
```

ルール：

- `data/*.ts` は配列データだけを持つ
- `lib/*.ts` に取得・filter・slug lookupを書く
- ページから `data/*.ts` を直接検索しない
- CMS接続時もページ側の呼び出し形を変えない

---

## 9. データ追加フロー

1. 公式ページ、press release、信頼できる報道を確認する
2. slugを決める
3. `publishStatus: 'draft'` でデータを作る
4. `sources` に確認日と信頼度を入れる
5. 関連slugが存在するか確認する
6. 一覧・詳細・比較で必要な最低項目が埋まっているか確認する
7. 公開できる状態なら `publishStatus: 'published'` にする

---

## 10. データ作成サンプル

### `data/robots.ts`

```ts
import type { Robot } from './types';

export const robots: Robot[] = [
  {
    slug: 'unitree-g1',
    name: 'Unitree G1',
    nameJa: 'ユニツリー G1',
    manufacturerSlug: 'unitree',
    category: 'humanoid',
    summary: '研究・開発用途から注目される小型ヒューマノイド。',
    publishStatus: 'draft',
    updatedAt: '2026-05-27',
    reliability: 'official',
    sources: [
      {
        title: 'Unitree G1 official page',
        url: 'https://www.unitree.com/g1',
        publisher: 'Unitree Robotics',
        checkedAt: '2026-05-27',
        reliability: 'official',
      },
    ],
    description: '導入判断の文脈で、公開情報から確認できる特徴と制約を整理する。',
    deploymentStage: 'pilot',
    buyerReadiness: 'requires-poc',
    specs: {
      mobility: 'biped',
    },
    procurementModels: ['purchase', 'inquiry'],
    priceNote: '価格・構成・納期は販売窓口で要確認。',
    japanAvailability: 'distributor-japan',
    distributorJapan: '国内窓口・保守条件は要確認。',
    supportNote: '導入前に日本語サポート、保守部品、初期トレーニングの範囲を確認する。',
    safetyNote: '人と同じ作業空間で使う場合は、現場ごとのリスクアセスメントが必要。',
    vendorRiskNote: '研究・PoC用途と本番運用用途で評価軸を分ける。',
    useCaseSlugs: ['research-development', 'demo-exhibition'],
    comparison: {
      strengths: ['価格訴求', '研究用途で検討しやすい'],
      constraints: ['本番運用では保守と安全設計の確認が必要'],
      bestFit: ['研究開発', 'PoC', '展示・デモ'],
      notFit: ['高速な本番ライン', '人と密に混在する作業'],
    },
  },
];
```

---

## 11. 公開前チェック

- `slug` が重複していない
- 関連slugが存在する
- `sources` が空ではない
- `checkedAt` が入っている
- 推定値に `estimated` が付いている
- 画像に `alt` と出典がある
- robotは `japanAvailability` が入っている
- useCaseは `candidateRobotSlugs` と `relatedGuideSlugs` が入っている
- reportは `whyItMatters` が入っている

---

## 12. 一言まとめ

この文書の目的は、実装を変えても死なないデータの骨格を残すこと。

今後の判断は、意味で分ける、出典を残す、将来移行しやすくする、UIに引っ張られすぎない、を基準に行う。
