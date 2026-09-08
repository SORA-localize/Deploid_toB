---
status: current
updated: 2026-09-08
---

# Admin編集画面のfield配置 v1

> `docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 6。「fieldが多すぎて分かりにくい」
> を、**data構造を変えずに**（`payload:migrate:create`が新しいmigrationを生成しない範囲で）
> 表示だけ整理する。ManufacturersでのPOC（§2）後、`docs/archive/admin-layout-rollout-plan-v1.md`
> （旧`docs/plans/`、2026-09-08完了によりarchive）が残り7 collectionへの展開を実施し、
> 全て完了した（§3）。

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

## 3. 他collectionへの展開結果（実装済み、2026-09-08完了）

`docs/archive/admin-layout-rollout-plan-v1.md`（T1〜T7）が、Manufacturers POCと同じ考え方
（sidebar=運用メタ、tabsで内容を分割。fieldが少ないcollectionはtabsを作らない）を
残り7 collectionへ展開した。全タスクで共通して確認したこと:

- Manufacturers POCと同じ`unplacedFields`機械検出（起動時throw）に加えて、
  `tests/content/admin-field-layout.test.ts`にsidebar集合・tab label/順序・
  各tab内field順序・visible field集合の不変性を固定するデータ駆動テストを追加した
  （振り分け漏れthrowだけでは誤配置・重複登録・順序違いを検出できないため）
- 各タスクで`payload:migrate:create --skip-empty`が新規migrationを生成しないことを確認
  （表示専用の変更であることの実証）
- `payload-types.ts`は`getPayload()`起動時の自動生成（fire-and-forgetで信頼できない）
  に頼らず、明示的に`generateTypes()`をawaitする`npm run payload:generate-types`
  （`scripts/generate-payload-types.mts`）で再生成し、field集合が変更前後で同一であることを
  ソートして比較した
- 使い捨てDB + 実dev server + Playwrightで、各collectionの編集画面を実際に開き、
  tabsの切り替え・sidebarの常時表示・field配置を目視確認した（確認後にDB・screenshotとも削除）

### T1: Robots（fieldが多いため3 tab構成）

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `featuredRank` `nextReviewBy` `supersededById` |
| tab「基本情報」 | Tier1 | `name` `nameJa` `manufacturerId` `seriesId` `category` `description` `deploymentStage` `japanAvailability` `distributorJapan` `summary` |
| tab「スペック・価格」 | Tier2 | `specs` `procurementModels` `priceOffers` `loadRatings` `fieldEvidence` `usageExampleSourceUrls` `supportNote` |
| tab「画像・出典・比較」 | Tier2〜3 | `images` `industryTags` `taskTags` `sources` `reliability` `heroImage` `seo` `comparison`（`@deprecated`） |

実画面確認（2026-09-08）: 3タブとも設計通りに表示・切り替え。サイドバーは常時表示。
`priceOffers`/`loadRatings`/`sources`の追加ボタンが「価格情報を追加」「可搬重量を追加」
「出典を追加」と日本語表示されること（T9）も同時に確認できた。

### T2: Articles

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` `featured` |
| tab「本文」 | Tier1 | `title` `titleJa` `summary` `whyItMatters` `keyTakeaways` `body` |
| tab「分類・関連」 | Tier2 | `category` `type` `section` `contentKind` `publishedAt` `author` `industryTags` `regionTags` `themeTags` `relatedRobotIds` `relatedManufacturerIds` `relatedUseCaseIds` |
| tab「画像・出典・特殊コンテンツ」 | Tier2〜3 | `heroImage` `sources` `reliability` `seo` `manufacturerGuideContent`（`type === manufacturer-guide`専用） |

実画面確認（2026-09-08）: 3タブとも設計通り。`manufacturerGuideContent`は
`admin.condition`により記事タイプが「メーカー解説」以外では非表示のまま——tabs化後も
条件付き表示が正しく機能することを確認。

**このタスクで実際に踏んだ事故**: `npx vitest run`をpayload-types.ts再生成より前に
実行したところ、`getPayload()`のfire-and-forget型生成が裏でコミット済みファイルを
書き換え、`tests/content/migration.test.ts`のbyte-identityガードが赤くなった。
migrate:create確認 → 明示的な型生成 → テスト、の順に直したところ再現しなくなった。
T3以降はこの順序を最初から守っている。

### T3: UseCases

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `title` `titleJa` `subtitle` `maturityLevel` `buyerReadiness` `environment` `requiredCapabilities` `primaryIndustry` `industryTags` `taskTags` `summary` `overview` `whyItMatters` |
| tab「詳細分析」 | Tier2 | `atAGlance` `capabilityNotes` `environmentRequirements` `whyHardToday` `japanDeploymentConditions` `candidateRobots` |
| tab「出典・SEO」 | Tier3 | `sources` `reliability` `heroImage` `seo` |

実画面確認（2026-09-08）: 3タブとも設計通り。`candidateRobots`の追加ボタンが
「候補ロボットを追加」と日本語表示されること（T9）も確認。

### T4: Distributors（fieldが少ないため2 tab構成）

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `name` `nameJa` `website` `providerType` `handledManufacturerIds` `handledRobotIds` `acquisitionMethods` `inquiryUrl` `summary` `note` |
| tab「画像・出典」 | Tier2 | `heroImage` `sources` `reliability` `seo` |

実画面確認（2026-09-08）: 2タブとも設計通り。

**副産物**: このタスクのCIで、PR #55（summary field説明追加）の内容が
`payload-types.ts`へ一度も反映されていなかった既存drift（型生成の信頼性問題の実例）を
発見し、別PRで是正した（本タスクとは無関係な内容のため分離）。

### T5: Deployments（fieldが少ないため2 tab構成）

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `manufacturerId` `robotId` `customer` `siteName` `country` `location` `status` `startedAt` `relatedUseCaseIds` `summary` |
| tab「出典・SEO」 | Tier3 | `sources` `reliability` `heroImage` `seo` |

実画面確認（2026-09-08）: 2タブとも設計通り。

**副産物**: このタスクのCIで、`tests/content/migration.test.ts`の1テストだけ
`runPayloadCli()`呼び出しに明示的なtimeout指定が漏れていた（他の全同種テストは
30秒/60秒を明示）ため、GitHub Actions共有runner上でvitestの既定5秒に間に合わず
timeoutした。本タスクの内容変更とは無関係と確認し、別PRでtimeoutを追加した。

### T6: RobotSeries（fieldが少ないため2 tab構成）

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` `nextReviewBy` |
| tab「基本情報」 | Tier1 | `name` `nameJa` `manufacturerId` `description` `industryTags` `taskTags` `summary` |
| tab「画像・出典」 | Tier2 | `images` `sources` `reliability` `heroImage` `seo` |

実画面確認（2026-09-08）: 2タブとも設計通り。

### T7: ArticlePlacements（tabsを作らない）

visible field 10個（hiddenな`adminPublishIntentToken`を除く。共有4個
`stableId`/`slug`/`previousSlugs`/`lifecycleStatus` ＋ 固有6個
`surface`/`slot`/`articleId`/`order`/`kind`/`sponsor`。2026-09-07に実コードを
数え直して訂正——旧記載の「7個」は誤りだった）。

| 層 | 置き場所 | fields |
|---|---|---|
| sidebar | 運用メタ | `stableId` `slug` `previousSlugs` `lifecycleStatus` |
| 通常領域（tabsで囲わない） | — | `surface` `slot` `articleId` `order` `kind` `sponsor` |

fieldが少ないためtabs化せず、sidebar以外は通常領域にそのまま縦並びで残した。
`unplacedFields`の機械検出は、sidebarとは別に通常領域のfield名リストも明示することで、
tabsが無いcollectionでも他タスクと同じ「振り分け漏れをthrowで検出する」保証を維持している。
`tests/content/admin-field-layout.test.ts`にも「tabsを持たない設計ではtabsフィールドが
存在しないこと」を確認する分岐を追加した（このcollectionが最初のtabsなし実例）。

実画面確認（2026-09-08）: tabsが1つも存在しないこと、sidebar（4field）が常時表示、
通常領域（6field、`sponsor`groupを含む）が設計順に縦並びで表示されることを確認。

### SiteSettings（global、実装しない）

直下field 4個（`defaultSeo`・`announcementBanner`は`type: 'group'`、`dataAsOf`は
`type: 'text'`、`articleIndexPlacementLimits`は`type: 'group'`）。**変更不要と判断する
（2026-09-07確定）**——globalは常に単一documentのため`stableId`/`slug`/`lifecycleStatus`
のような運用メタfieldの概念がそもそも無く、sidebar化する対象が無い。tabsで分割するほどの
縦の長さも無い。他collectionと同じ「sidebar=運用メタ」パターンを適用する余地が無いため、
このcollectionだけ例外として「実装しない」ことを設計判断として記録する。

## 4. 実装しないこと

- SiteSettings（global）のsidebar/tabs化——運用メタfieldが存在せず、対象が無いため（§3参照）
- `collapsible`の採用——tabsのみで全collectionの要件を満たせたため使わない
