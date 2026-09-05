---
status: current
updated: 2026-09-05
---

# Admin編集画面のfield配置 v1

> `docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 6。「fieldが多すぎて分かりにくい」
> を、**data構造を変えずに**（`payload:migrate:create`が新しいmigrationを生成しない範囲で）
> 表示だけ整理する。

---

## 1. 使う機構と使わない機構

| 機構 | data構造への影響 | 採用 |
|---|---|---|
| `type: 'tabs'`（unnamed tab、`label`のみで`name`を持たない） | **無し**。tab内のfieldは親と同じ階層のまま | ✅ 採用 |
| `admin.position: 'sidebar'` | **無し**。個々のfieldに付けるだけ | ✅ 採用 |
| `type: 'collapsible'`（`name`を持たない） | **無し** | 今回のPOCでは未使用（tabsで足りたため。候補としては残す） |
| `type: 'group'` の新規追加 | **有り**（列/入れ子構造が増えmigrationが要る） | ❌ 使わない（既存10件はそのまま） |

`node_modules/payload/dist/fields/config/types.d.ts`の`UnnamedTab`/`CollapsibleField`は
`name`を持てない型になっている。既存のnamed `group`（`headquarters`・`heroImage`等）は
そのまま——tabsはその外側を並べ替えるだけ。

## 2. POC: Manufacturers

`collections/Manufacturers.ts`に実装済み。`lib/payload/adminFieldLayout.ts`の
`partitionFieldsByName()`で、`baseContentFields()`/`baseRecordContentFields()`が返す
shared fieldと自collection固有のfieldを合わせた配列を、名前ベースで4つのグループ
（sidebar + tab1〜3）へ振り分ける。**`access.ts`側のshared field自体は変更していない**
——振り分けはManufacturers.ts内で完結する（他collectionへの影響ゼロ）。

振り分け漏れを機械検出するため、`unplacedFields`（どのグループにも入らなかったfield）が
`adminPublishIntentField()`（`admin.hidden: true`）以外を含んでいたら**起動時に例外を投げる**
（`Manufacturers admin field layout: unplaced field(s)`）。新しいfieldを追加してどの
tab/sidebarにも書き忘れると、開発サーバー起動時点で気づける。

### 配置（実装済み）

| 層 | 置き場所 | fields |
|---|---|---|
| Tier 3（運用メタ、常時表示） | sidebar | `stableId` `slug` `previousSlugs` `lifecycleStatus` `featuredRank` `nextReviewBy` |
| Tier 1（毎回触る） | tab「基本情報」 | `name` `nameJa` `summary` `description` `country` `hqCity` `headquarters` `foundedYear` `companyType` `companyStatus` `japanPresence` `website` `contactUrl` |
| Tier 2（時々触る） | tab「画像・出典」 | `heroImage` `logos` `sources` `reliability` `seo` |
| Tier 3（稀・レガシー） | tab「国内取引（レガシー）」 | `domesticDistributors` `distributorNote` `supportNote` `procurementNote` `vendorRiskNote` |

### 実画面での確認結果（2026-09-05、使い捨てDB上でPlaywright + 実dev serverで確認。確認後にDB・screenshotとも削除済み）

- 3つのtabが編集画面上部に並び、クリックで正しく切り替わる。tab名は`基本情報`/
  `画像・出典`/`国内取引（レガシー）`のとおりja表示される
- sidebarは**tabを切り替えても常に表示され続ける**（`内部ID（不変）`・`URLスラッグ`・
  `旧URLスラッグ`・`掲載状態`・`注目度順位`・`次回レビュー期限`）。想定どおりの挙動
- nested groupのlabel（`権利情報`＝`heroImage.rights`、`SEO設定`＝`seo`）も
  tab内で正しく見出しとして表示される——Task 4のlabelがtabs化後も生きていることを確認
- `sources`配列の追加ボタン（`Source を追加`）、`domesticDistributors`配列の追加ボタン
  （`Domestic Distributor を追加`）は英語のまま残っている——これは配列の**行ラベル**
  （singular label）で、Task 4/6のスコープ外（field自体のlabelとは別の設定項目
  `admin.components.RowLabel`または`labels.singular`）。**次のiterationの積み残しとして
  ここに明記する**
- `payload:migrate:create -- structure-check --skip-empty`を使い捨てDB上で実行し、
  既存migrationを全て適用した状態から**新しいmigrationファイルが生成されないこと**を確認
  （`migrations/*.ts`の件数が実行前後で10件のまま変化なし）
- `payload-types.ts`は`getPayload()`実行時に自動再生成され、`Manufacturer`interfaceの
  プロパティ**順序**だけが新しいfield配置順に変わった（型・フィールド集合は1件も変わって
  いないことをsortして比較し確認済み）。生成物として正しい変化のためそのままコミットする

## 3. 他6 collectionへの展開案（設計のみ、未実装）

**このTask 6ではManufacturersのみ実装する。** 以下は同じ考え方（sidebar=Tier3運用メタ、
tabsで内容を分割）を他collectionへ広げる場合の設計案。実装は別task。

### Distributors

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `name` `nameJa` `website` `providerType` `handledManufacturerIds` `handledRobotIds` `acquisitionMethods` `inquiryUrl` `summary` `note` |
| tab「画像・出典」 | Tier2 | `heroImage` `sources` `reliability` `seo` |

### RobotSeries

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `name` `nameJa` `manufacturerId` `description` `industryTags` `taskTags` `summary` |
| tab「画像・出典」 | Tier2 | `images` `sources` `reliability` `heroImage` `seo` |

### Robots（fieldが多いため3 tab構成）

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `featuredRank` `nextReviewBy` `supersededById` |
| tab「基本情報」 | Tier1 | `name` `nameJa` `manufacturerId` `seriesId` `category` `description` `deploymentStage` `japanAvailability` `distributorJapan` `summary` |
| tab「スペック・価格」 | Tier2 | `specs` `procurementModels` `priceOffers` `loadRatings` `fieldEvidence` `usageExampleSourceUrls` `supportNote` |
| tab「画像・出典・比較」 | Tier2〜3 | `images` `industryTags` `taskTags` `sources` `reliability` `heroImage` `seo` `comparison`（`@deprecated`） |

### UseCases

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `title` `titleJa` `subtitle` `maturityLevel` `buyerReadiness` `environment` `requiredCapabilities` `primaryIndustry` `industryTags` `taskTags` `summary` `overview` `whyItMatters` |
| tab「詳細分析」 | Tier2 | `atAGlance` `capabilityNotes` `environmentRequirements` `whyHardToday` `japanDeploymentConditions` `candidateRobots` |
| tab「出典・SEO」 | Tier3 | `sources` `reliability` `heroImage` `seo` |

### Deployments

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `manufacturerId` `robotId` `customer` `siteName` `country` `location` `status` `startedAt` `relatedUseCaseIds` `summary` |
| tab「出典・SEO」 | Tier3 | `sources` `reliability` `heroImage` `seo` |

### Articles

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` `featured` |
| tab「本文」 | Tier1 | `title` `titleJa` `summary` `whyItMatters` `keyTakeaways` `body` |
| tab「分類・関連」 | Tier2 | `category` `type` `section` `contentKind` `publishedAt` `author` `industryTags` `regionTags` `themeTags` `relatedRobotIds` `relatedManufacturerIds` `relatedUseCaseIds` |
| tab「画像・出典・特殊コンテンツ」 | Tier2〜3 | `heroImage` `sources` `reliability` `seo` `manufacturerGuideContent`（`type === manufacturer-guide`専用） |

### ArticlePlacements / SiteSettings

fieldが少なく（それぞれ7個・4個の直下field）、tabsで分割するほどの量ではない。
sidebarで運用メタ（`ArticlePlacements`の`stableId`/`slug`/`previousSlugs`/
`lifecycleStatus`）だけ分離すれば十分——tabs化は不要と判断する。

## 4. 実装しないこと

- 他6 collectionへの実際の展開（設計のみ。実装は別task・別PR）
- 配列fieldの行ラベル（`Source`/`Domestic Distributor`等の英語表記）の日本語化——
  Task 4/6のどちらのスコープにも入っていない。次のiterationの積み残しとして記録
- `collapsible`の採用——tabsのみで要件を満たせたため、今回は使わない
