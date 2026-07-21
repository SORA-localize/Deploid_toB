---
status: reference
updated: 2026-07-20
---

# ヒューマノイド導入メディア — データ管理ガイド v1

> **※ 本書は背景・経緯の参照用（非正本）。** データ運用の正本は `../decisions/data/README.md` と `../decisions/data-maintenance-checklist-v1.md`、データ設計の正本は `../decisions/data-architecture-redesign-v1.md`。本書と現行が食い違う場合は現行を優先する（本書の整合更新は行わない）。

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
- `articles`（公開URLは /reports）

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

### `articles`（旧 `reports`。公開URLは `/reports` を維持）

ヒューマノイド専門ニュースメディアの中身。鮮度と判断材料。

第一軸は **`category`**（必須。編集者が必ず1つ指定する）：

- `news` … 業界最新情報・発表まとめ（速報）
- `interview` … 取材記事・インタビュー
- `company-report` … 企業レポート（動向・決算・戦略）
- `analysis` … 分析・市場考察・導入事例の読み解き
- `policy` … 政策・規制アップデート

`type`（フォーマット）と `section`（タブ分類）は当面併存する。

**速報（news）も扱う。ただし全記事で `whyItMatters`（買い手にとってなぜ重要か）が必須。**
単なる転載速報にしないことで、専門メディアと導入判断ポータルを両立させる
（経緯は `../decisions/data-architecture-redesign-v1.md` §7-2）。

---

## 5. 参照関係

- manufacturer has many robots
- robot belongs to one manufacturer
- robot relates to many useCases
- useCase has many candidate robots
- guide relates to robots and useCases
- article relates to robots, manufacturers, useCases, guides

参照はすべて **不変の `id`** で行う（`slug` はURL専用で外部キーには使わない）。

例：

- `Robot.manufacturerId`
- `UseCase.candidateRobots[].robotId`
- `Article.relatedRobotIds`

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
- `articles`（公開URLは /reports）

使わない：

- `posts`
- `industries`
- `companies`

### id と slug（分離。詳細は `../decisions/data-architecture-redesign-v1.md` §3）

| | `id` | `slug` |
|---|---|---|
| 役割 | 外部キー・一意性・お気に入り/比較の保存値 | 公開URLのパスのみ |
| 可変性 | **不変（発番後は二度と変えない）** | 変更可 |
| 作成時 | `id === slug` で発番 | idと同値で開始 |

共通の文字種：小文字・ハイフン区切り・英数字（validate が機械チェック）。

例：

- `unitree-g1`
- `figure-02`
- `warehouse-picking`
- `decision-variables`

**slug を変えるとき**（命名修正・URL変更）：

1. 旧 slug を `previousSlugs` に追記（詳細ページが 301 リダイレクトする）
2. `slug` を新値に更新
3. `id` と参照（`*Id` / `*Ids`）は**触らない**

手順の実行チェックリストは `../decisions/data-maintenance-checklist-v1.md` §D。

### field名

- 英語
- camelCase
- 意味が明確なもの

例：

- `japanAvailability`
- `japanPresence`
- `deploymentStage`
- `buyerReadiness`
- `candidateRobots[].robotId`

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
- `articles`（公開URLは /reports）

推奨：

- `guides`
- `useCases`

注意：

- 一次出典を優先する
- 企業公式、製品ページ、正式資料を優先する
- 報道は `reported` として扱う
- 推定値は `estimated` として扱う
- AIが生成した推測値を事実として混ぜない
- 画像・ロゴは `credit` / `sourceUrl` だけでなく `rights` を必ず持たせる

---

## 8. ローカルデータ運用

Next.js初期実装ではCMSを接続しない。

配置：

```txt
data/
  types.ts            ← 型（nextjs_data_types_v1.ts と一致させる）
  robots.ts
  manufacturers.ts
  guides.ts
  useCases.ts
  deployments.ts
  articles.ts
  articlePlacements.ts
lib/
  data.ts             ← 取得・filter・id/slug lookup（ページはここ経由のみ）
  validate.ts         ← 整合チェック（build ゲート）
  specSchema.ts       ← スペック項目の正本
  tagRegistry.ts      ← タグの正本
  labels.ts / display.ts / visualSemantics.ts ← enumのラベル・順序・トーン
```

ルール：

- `data/*.ts` は配列データだけを持つ
- 取得・filter・lookup は `lib/data.ts` に書く（参照は id、URL解決のみ slug）
- ページから `data/*.ts` を直接検索しない
- CMS接続時もページ側の呼び出し形を変えない

---

## 9. データ追加フロー

1. 公式ページ、press release、信頼できる報道を確認する
2. **id を発番する**（小文字・ハイフン・英数。発番後は不変。初期は `slug = id`）
3. `publishStatus: 'draft'` でデータを作る
4. `sources` に確認日と信頼度を入れる
5. 参照 id（`manufacturerId` / `related*Ids` 等）の存在を確認する（参照切れは build が失敗する）
6. 一覧・詳細・比較で必要な最低項目が埋まっているか確認する
7. `npm run validate:data` が通ることを確認し、`publishStatus: 'published'` にする

作業種別ごとの実行チェックリストは `../decisions/data-maintenance-checklist-v1.md`
（追加 / slug変更 / 提供終了 / 公開ゲート / 鮮度レビュー / デプロイ前）。

---

## 10. データ作成サンプル

### `data/robots.ts`

```ts
import type { Robot } from './types';

export const robots: Robot[] = [
  {
    id: 'unitree-g1',
    slug: 'unitree-g1',
    name: 'Unitree G1',
    nameJa: 'ユニツリー G1',
    manufacturerId: 'unitree',
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

機械チェック（**`npm run build` の前段で validate が走り、error があると build が失敗する**）：

- `id` / `slug` が重複していない・文字種が正しい
- 関連 id（`*Id` / `*Ids` / `supersededById`）が存在する
- `sources` が空ではない（published のみ。sample 記事は除外）
- 日付形式・URL形式・画像 `rights`・未登録タグ・specs の未登録キー

warning（buildは通るが把握する）：

- 画像が外部URL（未ローカル化）または空
- 鮮度切れ（`nextReviewBy` 超過 or 最終確認から180日超）

人の目で確認：

- 推定値に `estimated` が付いている
- robotは `japanAvailability` が入っている
- useCaseは `candidateRobots` と `relatedGuideIds` が入っている
- articleは `category` と `whyItMatters` が入っている

---

## 12. 一言まとめ

この文書の目的は、実装を変えても死なないデータの骨格を残すこと。

今後の判断は、意味で分ける、出典を残す、将来移行しやすくする、UIに引っ張られすぎない、を基準に行う。
