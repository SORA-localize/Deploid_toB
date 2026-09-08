---
status: reference
updated: 2026-09-08
---

# Payload field使用状況監査（2026-09-08）

`docs/decisions/admin-field-to-page-section-map-v1.md`（`admin.description`を持つfieldのみ対象）が
対象外としている全fieldを、実コード（grep→該当行を開いて確認）で追跡した記録。**MCP経由で
各collectionを試す前に読む**——「入れたのに表示されない」を、実装漏れやMCP側の問題だと誤認しない
ため。凡例: **①完全に未使用 / ②社内運用専用（意図的に非表示） / ③条件付き・部分的に表示**。

推測ではなく、該当ファイルをgrep→実際に開いて参照ゼロを確認したうえでの記録（2026-09-08時点）。

## Collection単位で丸ごと未使用

### RobotSeries — **収集全体が①**

schema・publish gate・route registryまでフル実装されているが、`src/app/(frontend)`のどのpageからも
呼ばれていない。`resolveRobotNamespaceBySlug()`（`lib/content/createContentRepository.ts:358`）は
実装済みだが呼び出し元が無い。`/robots/[slug]/page.tsx`が使う`resolveRobotDetailBySlug`は`robots`
collectionしか見ず、`robot-series`は素通り。`lib/content/cacheDependencies.ts`の`KNOWN_GAPS`が
既にこれを明記している。

→ **MCPでこのcollectionにデータを入れても、公開ページのどこにも反映されない**（試すこと自体は
MCPの動作確認として有効だが、「入れたのに見えない」は正常な結果）。

### Distributors — **収集全体が①**

`listDistributors`/`listDistributorsForManufacturerId`/`listDistributorsForRobotId`という
repositoryメソッドは存在するが、`src/app/(frontend)`・`components`のどちらからも呼ばれていない
（grepゼロ）。`cacheDependencies.ts`の`KNOWN_GAPS`記述と一致。

→ RobotSeriesと同様、**MCPで書き込んでも公開ページには一切出ない**。

## 共有field（`lib/payload/access.ts`）

| field | 分類 | 根拠 |
|---|---|---|
| `stableId` | ② | 内部参照キー。関連解決専用、テキストとして描画される箇所はゼロ |
| `slug` | ③ | URLそのものを構成 |
| `previousSlugs` | ③ | 旧URLの301 redirect解決にのみ使用 |
| `lifecycleStatus` | ② | publishStatus判定・可視性フィルタに使うだけ、値自体は非表示 |
| `adminPublishIntent` | ② | `admin.hidden: true`。編集画面の競合制御marker |

## Manufacturers

| field | 分類 | 根拠 |
|---|---|---|
| `nameJa`/`companyType`/`companyStatus`/`japanPresence`/`foundedYear`/`contactUrl`/`headquarters` | ③ | 広く表示（FactSheet・ホームworld map等） |
| **`hqCity`** | **①** | grep全体でゼロヒット |
| **`distributorNote`** | **①** | ゼロヒット |
| **`supportNote`** | **①** | ゼロヒット |
| **`procurementNote`** | **①** | ゼロヒット |
| **`vendorRiskNote`** | **①** | ゼロヒット |
| **`featuredRank`** | **①** | 型（`ManufacturerSortField`）はあるが、実際にこの型で並べ替えを呼ぶ箇所が皆無 |
| `domesticDistributors`/`logos` | ③ | 表示される |

## Robots

| field | 分類 | 根拠 |
|---|---|---|
| `deploymentStage`/`japanAvailability` | ③ | sort + カード表示 |
| `industryTags` | ③ | 描画されないがフィルタリング・検索テキストに使用 |
| `distributorJapan` | ③ | 描画なし、検索テキストにのみ混入 |
| `priceOffers` | ③ | 個々の値は非表示だが「価格情報あり」の真偽値に変換して使用 |
| `loadRatings` | ③ | スペック欄に整形されて表示 |
| `usageExampleSourceUrls` | ③ | 詳細ページ「活用事例」欄 |
| `supersededById` | ③ | 詳細ページの後継機表示 |
| `procurementModels` | ③（①寄り） | view model型には流れるが描画コードが無い |
| **`category`** | **①** | ラベル辞書・順序定義まで用意されているが、どこからもimportされていない完全な死にfield |
| **`taskTags`** | **①** | ゼロヒット |
| **`supportNote`** | **①** | ゼロヒット（Manufacturersと同名別field） |

## UseCases

| field | 分類 | 根拠 |
|---|---|---|
| `title`/`titleJa`/`subtitle`/`maturityLevel`/`primaryIndustry`/`overview`/`whyItMatters`/`atAGlance`/`capabilityNotes`/`environmentRequirements`/`whyHardToday`/`japanDeploymentConditions` | ③ | 詳細ページで描画確認済み |
| `buyerReadiness` | ② | admin.description自体が明記 |
| **`environment`** | **①** | 公開必須（`validateUseCaseForPublish`）なのに描画・フィルタどちらにも一切現れない |
| **`requiredCapabilities`** | **①** | 同上。7値のselect optionまで用意されているが消費ゼロ |

## Deployments

| field | 分類 | 根拠 |
|---|---|---|
| `customer`/`status`/`siteName`/`country`/`location` | ③ | 用途詳細ページ＋ホームworld map |
| `manufacturerId` | ③ | world mapの集計キー |
| `relatedUseCaseIds` | ③ | 用途詳細ページ「導入事例」欄のクエリキー |
| **`robotId`** | **①** | 関連解決されるだけ、ロボット名はどこにも出ない |
| **`startedAt`** | **①** | ゼロヒット |

## Articles

| field | 分類 | 根拠 |
|---|---|---|
| `regionTags`/`themeTags`/`keyTakeaways`/`author`/`relatedRobotIds`/`relatedManufacturerIds`/`relatedUseCaseIds`/`type` | ③ | 描画・関連取得確認済み |
| `contentKind` | ③ | メーカーページの「サンプル記事」抽出条件 |
| `section` | ③ | `shelf==='news'`の記事だけラベル表示、他shelfでは使われない |
| **`featured`**（checkbox） | **①** | ホームの注目記事は`ArticlePlacements`（hero/feature枠）で決まり、このcheckboxは完全に死んでいる |

## ArticlePlacements

| field | 分類 | 根拠 |
|---|---|---|
| `surface`/`slot`/`articleId`/`order` | ③ | 実際に消費される |
| **`kind`** | **①** | 型を通過するだけ、表示側は参照しない |
| **`sponsor`**（name/url/disclosure/campaignId） | **①** | スポンサー開示の仕組みがschemaにあるのに、公開ページのどこにも開示表示が無い（法務・広告表示規制の観点で要注意） |

※ `article-placements`自体はMCPから編集不可（`lib/payload/mcp.ts`）なので、この表はAdmin UI編集時の参考情報。

## Media（collection自体）

| field | 分類 | 根拠 |
|---|---|---|
| `alt`/`credit`/`sourceUrl`/`rights.*` | ② | 「発行されたURLを他fieldへ手で貼り付ける」ための編集素材。他collectionから`Media`documentを直接参照する経路は無い |

## SiteSettings（global、MCP対象外）

| field | 分類 | 根拠 |
|---|---|---|
| `dataAsOf` | ② | — |
| `articleIndexPlacementLimits` | ③ | — |
| **`defaultSeo`**（metaTitle/metaDescription） | **①** | `lib/metadata.ts`はハードコード定数を使っており、この値は無関係 |
| **`announcementBanner`**（enabled/message/url） | **①** | banner用のReactコンポーネント自体が存在しない |

## 優先度付きサマリー（編集コスト vs 表示価値のギャップが大きい順）

1. **`ArticlePlacements.sponsor`/`kind`** — スポンサー開示の仕組みがschemaにあるのに未表示。法務リスクに直結しうる
2. **`RobotSeries`収集全体** — フル実装済みなのに閲覧経路ゼロ
3. **`SiteSettings.defaultSeo`/`announcementBanner`** — 変更しても何も起きない罠
4. **`UseCases.environment`/`requiredCapabilities`** — 公開必須なのに公開側消費ゼロ（必須なのに無駄働きという最悪の組み合わせ）
5. **`Robots.category`** — ラベル辞書はあるのに配線だけ忘れられている
6. **`Manufacturers`の4つのnoteフィールド**＋`hqCity`＋`featuredRank`
7. **`Articles.featured`** — `ArticlePlacements`と概念が重複した死にfield
8. **`Deployments.robotId`/`startedAt`**

## MCP試行時の使い方

`docs/reference/mcp-rollout-trial-log.md`で各collectionを試す際、上表で①（未使用）と分類された
fieldに値を入れても公開ページに反映されないのは想定通りの結果。「動いていない」のではなく
「そもそも表示先が無い」ので、MCP自体の不具合切り分けから除外してよい。RobotSeries/Distributorsは
collection全体がこれに該当する。
