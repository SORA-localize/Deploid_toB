---
status: current
updated: 2026-09-05
---

# Admin field → 公開ページ表示箇所 対応表 v1

> `docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 7。`admin.description`を
> 編集者向けに書き換える前提として、各fieldが実際に公開ページのどこへ出るか（出ないか）を
> **実コードを読んで**確定する。`lib/uiText.ts`の見出し文言と突き合わせている。
> 推測はしていない——「出ない」と書いた項目は、該当componentを検索して参照が無いことを
> 確認済み。

対象は`admin.description`を持つ（＝Task 7で書き換える）fieldと、その直接の親group。
全fieldの網羅表ではない。

---

## 共有field（`lib/payload/access.ts`、全content collectionに現れる）

| field | 公開ページでの扱い | 根拠 |
|---|---|---|
| `sources[].title` / `.url` / `.publisher` | **表示される**。出典欄（`uiText.common.resources`＝「出典」）のリンクテキストとリンク先 | `components/SourceList.tsx` |
| `sources[].checkedAt` | **表示される**。同じ出典欄に「確認 {日付}」として付記される | `components/SourceList.tsx`（`確認 {source.checkedAt}`） |
| `sources[].publishedAt` | **条件付きで表示される**（2026-09-05外部監査で訂正）。`SourceList.tsx`（出典一覧）には出ないが、この出典の`url`が同じdocumentの`usageExampleSourceUrls`（Robotsのみ）から参照されている場合、ロボット詳細ページの「活用事例」欄に`{publisher} · {publishedAt}`として表示される | `SourceList.tsx`のJSXに参照は無いが、`lib/robotCatalog.ts`の`resolveRobotUsageExamples()`が`source.publishedAt`を返し、`src/app/(frontend)/robots/[slug]/page.tsx`がそれを描画している |
| `sources[].reliability` / `.note` | **表示されない**。社内の裏付け確認用（この出典1件ごとの信頼度・備考） | 同上 |
| `reliability`（BaseRecord直下、`sources`とは別） | **表示されない**。document全体の総合信頼度で、社内の掲載可否判断用 | 同上、UI側にこの値の参照なし |
| `heroImage`（`src`/`alt`/`credit`/`sourceUrl`/`aspectRatio`） | **`Articles`のみ表示される**（記事カード・トップのニュースカルーセル・**記事詳細ページ上部のヒーロー画像**・JSON-LD画像。2026-09-05外部監査で記事詳細ページ分を追記）。`Manufacturers`/`Robots`/`RobotSeries`/`UseCases`/`Deployments`では**現状どのページからも読まれていない**——各collectionは別の専用画像field（`Manufacturers.logos`、`Robots`/`RobotSeries`の`images`）を使っている | `components/NewsCard.tsx`・`NewsHeroCarousel.tsx`・`NewsFeatureCard.tsx`・`lib/jsonLd.ts`・`reports/[slug]/page.tsx`（`#report-article-header`のfigure）。他collectionの詳細ページにheroImage参照なし。`lib/content/cacheDependencies.ts`の`KNOWN_GAPS`コメントも同じ整理を既に明記している |
| `heroImage.rights.*`（`status`/`sourceType`/`checkedAt`/`rightsHolder`/`licenseUrl`/`permissionNote`） | **表示されない**。ただし`status`の値は`lib/media.ts`の`canDisplayAsset()`が読み、`blocked`等の場合は**画像自体を表示しない**判定に使われる——「見えないが動作に影響する」項目 | `lib/media.ts` |
| `nextReviewBy` | **表示されない**。次回のファクトチェック期限を管理する社内運用項目 | どのcomponentにも参照なし（`lib/content/domainTypes.ts`/`payloadMappers.ts`のみ） |
| `seo.metaTitle` / `seo.metaDescription` | **表示される**が本文ではなく`<title>`・検索結果のスニペット（`generateMetadata()`）に使われる | `manufacturers`/`robots`/`use-cases`/`reports`の各`[slug]/page.tsx` |
| `seo.noindex` | 検索エンジンのインデックス可否に影響（本文表示ではない） | 同上 |

## Manufacturers

| field | 公開ページでの扱い |
|---|---|
| `logos` | **表示される**。メーカー詳細ページ上部（`factSheet`＝基本情報欄）のロゴ表示 |
| `domesticDistributors` | **表示される**。メーカー詳細ページの「国内代理店」欄（`uiText.manufacturers.domesticDistributors`）、および一覧カードにも一部反映 |

## Robots / RobotSeries

| field | 公開ページでの扱い |
|---|---|
| `Robots.specs` | **表示される**。ロボット詳細ページの「仕様」「技術仕様」「詳細仕様」欄（`uiText.robots.specifications`等）。`lib/robotCatalog.ts`の`getRobotSpecGroups()`が項目定義に従って整形する |
| `Robots.fieldEvidence` | **表示される**。上記スペック欄の各項目に付く出典リンクの元データ（項目ごとの根拠URL） |
| `Robots.images` / `RobotSeries.images` | **`Robots`は表示される**（詳細ページの画像ギャラリー、role別: hero/transparent/side/inOperation/scale/endEffector/mobility）。**`RobotSeries`は現状どのページからも読まれていない**——series単体を表示するページ自体が実装されていない | `lib/robotMedia.ts`。`lib/content/cacheDependencies.ts`の`KNOWN_GAPS`が「robot-seriesを単体で解決するpageが無い」と明記 |
| `Robots.comparison` | **表示される。ただし`/robots/[slug]`ではなく`/compare`ページ** | `components/ComparisonRobotPanel.tsx`・`compare/CompareParts.tsx` |

## UseCases

| field | 公開ページでの扱い |
|---|---|
| `candidateRobots` | **`robotId`を持つ行だけ表示される**（2026-09-05外部監査で訂正）。用途詳細ページの「候補ロボット」欄。`seriesId`だけの行は現状描画対象外——既存コードコメントが明記している | `use-cases/[slug]/page.tsx`の`buildUseCaseDetailData()`（「seriesId候補（DEC-S08）はrobotId単位のこのpageではまだ描画対象外」） |
| `buyerReadiness` | **表示されない**。`Robots`からは既に削除済み（DEC-S05）の軸で、`UseCases`側にも公開UIの消費箇所は無い | `domainTypes.ts`/`payloadMappers.ts`のみで参照、componentに無し |

## SiteSettings

| field | 公開ページでの扱い |
|---|---|
| `dataAsOf` | **表示されない**（2026-09-05外部監査で訂正。前回版は誤り）。`/for-manufacturers`ページは`lib/site.ts`の`siteMeta.dataAsOf`（静的定数）を直接importしており、Payloadのこの値とは無関係。Payload側の`dataAsOf`は`content:export`/`content:import`の`ContentSnapshot`専用で、parity検証にのみ使われる |
| `articleIndexPlacementLimits` | **表示に影響する**（本文ではなく件数の上限値）。トップページ・記事一覧ページで、hero/feature枠に何件まで掲載するかを決める | `page.tsx`（home）・`reports/page.tsx` |

## Articles

| field | 公開ページでの扱い |
|---|---|
| `body` | **表示される**。記事本文（`uiText.reports.body`）。ただし記事タイプが「メーカー解説」の場合はこちらではなく`manufacturerGuideContent`を使う |
| `manufacturerGuideContent` | **表示される**。記事タイプが「メーカー解説」の記事だけで使う専用テンプレート（企業概要・ラインアップ・導入実績・購入導線・FAQ等のセクション） | `reports/[slug]/page.tsx`、`docs/decisions/editorial_style_guide_v1.md` §6 |

## Distributors collectionそのものについて（参考）

`Distributors` collection自体は、cutover時点でどのページからも読まれておらず実データも0件
（`lib/content/cacheDependencies.ts`の`KNOWN_GAPS`参照）。画面に出ている「取扱代理店」は
`Manufacturers.domesticDistributors`という別の埋め込みfieldで、`Distributors`
collectionとは無関係。この表の対象からは外すが、admin画面には両方のUIが存在するため
編集者が混同しないよう記録しておく。
