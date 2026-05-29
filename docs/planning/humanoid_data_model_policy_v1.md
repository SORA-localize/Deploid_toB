# データモデル設計指針 v1

> Next.js実装で扱うデータを、将来CMSやDBへ移しても崩れない形にするための方針。

---

## 1. この文書の位置づけ

この文書はデータ設計の考え方をまとめる。

実装で使う具体的なTypeScript型の真実源は `nextjs_data_types_v1.ts`。
Next.jsプロジェクト作成後は、その内容を `data/types.ts` にコピーする。

この文書にフィールド定義を二重管理しない。

---

## 2. 設計の原則

1. **公開URLの識別子は `slug` にする**：旧Figma Make UIの `id` は移行時に `slug` へ置き換える。
2. **出典を必ず持つ**：重要情報は `Source[]` としてURL、確認日、信頼度を残す。
3. **信頼度を分類する**：一次出典・報道・推定を混在させない。
4. **日本市場の確認軸を持つ**：海外情報をそのまま転載せず、日本での販売・代理店・保守の見え方を分ける。
5. **UI表示名とデータ名を分ける**：enumは英語トークンにし、UI側で日本語ラベルへ変換する。
6. **CMS非依存にする**：SanityやmicroCMSのschemaから型を作らず、TypeScript型からCMS schemaを派生させる。

---

## 3. 共通モデル

全主要モデルは `BaseRecord` を持つ。

- `slug`
- `summary`
- `publishStatus`
- `updatedAt`
- `reliability`
- `sources`
- `heroImage`
- `seo`

`publishStatus` は以下の3段階。

- `draft`
- `published`
- `archived`

`reliability` は以下の4段階。

| レベル | 意味 | 例 |
|---|---|---|
| `verified` | 直接確認済み | 代理店ヒアリング、メーカー確認 |
| `official` | 公式発表から取得 | メーカー公式ページ、公式press release |
| `reported` | 信頼できる報道から取得 | 業界メディア、展示会レポート |
| `estimated` | 推定・未確認 | 概算価格、推定スペック |

---

## 4. コレクション

### `robots`

中核データ。スペック表ではなく、導入判断の個票として扱う。

主な判断軸：

- `manufacturerSlug`
- `category`
- `deploymentStage`
- `buyerReadiness`
- `specs`
- `procurementModels`
- `priceNote`
- `japanAvailability`
- `distributorJapan`
- `supportNote`
- `safetyNote`
- `vendorRiskNote`
- `useCaseSlugs`
- `comparison`

### `manufacturers`

UI名はメーカーだが、実態は供給体制DB。

`companyType` で以下を扱えるようにする。

- `manufacturer`
- `distributor`
- `integrator`
- `ai-os`
- `research`

MVPのURLは `/manufacturers` のまま。将来 `companies` や `partners` へ広げられるよう、型だけ拡張余地を持つ。

### `guides`

導入判断のフレーム。

ステージは以下。

- `learn`
- `evaluate`
- `act`

記事一覧ではなく、買い手が判断を進めるための常設コンテンツとして扱う。

### `useCases`

ナビ表示は「用途から探す」。

業界紹介ではなく、タスク・作業起点でロボット候補を見つけるページ。

業界は独立collectionにせず、MVPでは `industryTags` として扱う。

主な判断軸：

- `maturityLevel`
- `buyerReadiness`
- `environment`
- `requiredCapabilities`
- `atAGlance`
- `candidateRobotSlugs`
- `relatedGuideSlugs`

### `reports`

記事・レポート・取材・分析。

旧名 `posts` は使わない。

ニュース速報ではなく、買い手にとって「なぜ重要か」が分かる判断材料として扱う。

主な判断軸：

- `type`
- `publishedAt`
- `whyItMatters`
- `keyTakeaways`
- `relatedRobotSlugs`
- `relatedManufacturerSlugs`
- `relatedUseCaseSlugs`

---

## 5. 旧名からの移行ルール

| 旧名 | 新方針 |
|---|---|
| `id` | `slug` |
| `posts` | `reports` |
| `industries` | `useCases` を主役にし、業界は `industryTags` |
| `industryIds` | `useCaseSlugs` または `industryTags` |
| `manufacturerId` | `manufacturerSlug` |
| `relatedRobotIds` | `relatedRobotSlugs` |
| `relatedManufacturers` | `relatedManufacturerSlugs` |
| `japanAvailable` | `japanAvailability` または `japanPresence` |
| `domesticAvailability` | `japanAvailability` |
| `sources: string[]` | `sources: Source[]` |

---

## 6. 情報品質ポリシー

### やること

- robots / manufacturers / reports は `sources` を必須級として扱う。
- 価格・販売可否・納期・国内サポートは断定しない。
- 推定値は `estimated` と明示する。
- `checkedAt` が古い情報はUIで「要確認」にできるようにする。
- 画像には `alt`, `credit`, `sourceUrl` を持たせる。
- ただし `credit` / `sourceUrl` は許諾の証跡ではない。公開用の画像・ロゴは `copyright_and_media_rights_policy_v1.md` に従い、別途 `rights` 状態で管理する。

### やらないこと

- ソースなしでスペック数値を掲載しない。
- 他サイトのDBをそのままコピーしない。
- 報道情報を `official` として扱わない。
- 「おすすめ順位」と広告枠を混ぜない。

---

## 7. CMS / DB移行を見据えた設計

初期実装は `data/*.ts`。

CMS接続時は `nextjs_data_types_v1.ts` をもとにschemaを作る。

想定対応：

| TypeScript | CMS / DB |
|---|---|
| `Robot` | robots |
| `Manufacturer` | manufacturers |
| `Guide` | guides |
| `UseCase` | useCases |
| `Report` | reports |
| `Source` | object / embedded document |

`slug` は公開URLと内部参照の軸なので、CMS移行後も維持する。

---

## 8. 作成・更新フロー

1. 公式情報・一次出典を確認する
2. `sources` にURL、確認日、信頼度を入れる
3. 推定や未確認の値は `estimated` として扱う
4. `publishStatus: 'draft'` で作る
5. ロボット・メーカー・用途・記事の相互参照を確認する
6. 公開前に `publishStatus: 'published'` へ変更する

---

## 9. 一言まとめ

このサイトの価値は、見た目の一覧ではなく「導入判断に使える構造化データ」にある。

UIは変わってもよい。`slug`、出典、信頼度、日本市場の判断軸、参照関係は壊さない。
