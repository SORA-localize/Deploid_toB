# SEOハブページ初期HTML改善計画 v1

作成日: 2026-06-14

## 目的

公開サイトの主要導線である一覧・比較・ガイド・用途ページが、JavaScript実行前のHTMLでも検索エンジン、AIクローラー、SNSプレビュー、簡易HTTP取得ツールに意味のある本文を返す状態にする。

今回の対象はコンテンツ拡充そのものではなく、既に存在するデータを初期HTMLへ出すための技術SEO改善である。

## 背景

公開ページを外部AIに見せたところ、トップページと詳細ページは評価された一方で、ロボット一覧、メーカー一覧、比較、記事一覧、ガイド一覧が「ヘッダーとフッター中心で本文が薄い」と見える指摘があった。

ローカルビルド成果物でも、以下の一覧系HTMLに `BAILOUT_TO_CLIENT_SIDE_RENDERING` と `ページを読み込み中` fallback が出ていることを確認した。

- `.next/server/app/robots.html`
- `.next/server/app/manufacturers.html`
- `.next/server/app/compare.html`
- `.next/server/app/reports.html`
- `.next/server/app/guides.html`
- `.next/server/app/use-cases.html`

詳細ページは別状況で、ロボット詳細、メーカー詳細、記事詳細、ガイド詳細、用途詳細はSSGされ、H1、本文、表、関連リンク、構造化データが初期HTMLに出ている。

## 公式ドキュメント上の根拠

- Next.js `useSearchParams`:
  - `useSearchParams` はClient Component用hook。
  - 静的プリレンダーされるrouteで使うと、最寄りの `Suspense` 境界までClient-side renderingになる。
  - サーバー側で検索パラメータを使うなら、Pageの `searchParams` prop を読む選択肢が示されている。
  - 参照: https://nextjs.org/docs/app/api-reference/functions/use-search-params
- Next.js Server / Client Components:
  - pages/layouts はデフォルトでServer Components。
  - state、event handler、`localStorage` などが必要な部分だけClient Componentsにする。
  - Client境界を小さくするとJavaScript量を減らし、初期表示にも有利。
  - 参照: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Google JavaScript SEO:
  - GoogleはJavaScriptを処理するが、クロール、レンダリング、インデックスは段階的。
  - JavaScript依存が強いページはレンダリング待ちや検出遅延のリスクがある。
  - 参照: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

## 調査済みファイル

- `ai_implementation_workflow_prompt.md`
- `src/app/robots/page.tsx`
- `src/app/manufacturers/page.tsx`
- `src/app/compare/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/guides/page.tsx`
- `src/app/use-cases/page.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/ReportsBrowser.tsx`
- `components/GuidesBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/CompareClient.tsx`
- `components/RobotsHeader.tsx`
- `components/ManufacturersHeader.tsx`
- `components/ReportsHeader.tsx`
- `components/ActiveFilterChips.tsx`
- `components/RobotCard.tsx`
- `components/ManufacturerCard.tsx`
- `components/NewsCard.tsx`
- `components/PageListHeader.tsx`
- `components/SelectControl.tsx`
- `components/SearchInput.tsx`
- `components/FilterChipGroup.tsx`
- `components/PageTabBar.tsx`
- `components/ComingSoonOverlay.tsx`
- `components/PageSuspenseFallback.tsx`
- `lib/useUrlFilters.ts`
- `lib/useActiveArticleSection.ts`
- `lib/robotFilters.ts`
- `lib/manufacturerFilters.ts`
- `lib/articleFilters.ts`
- `lib/guideFilters.ts`
- `lib/articlePagination.ts`
- `lib/articleSections.ts`
- `lib/data.ts`
- `lib/jsonLd.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `lib/site.ts`
- `.next/types/routes.d.ts`

## 現状の責務整理

### 問題がある責務混在

現在の一覧ページは、ページ全体の本体表示がClient Componentに寄っている。

例:

- `src/app/robots/page.tsx`
  - `Suspense fallback={<PageSuspenseFallback />}` の中で `RobotsBrowser` を描画
  - `RobotsBrowser` が `useUrlFilters()` を呼ぶ
  - `useUrlFilters()` が `useSearchParams()` を呼ぶ
- `src/app/manufacturers/page.tsx`
  - 同様に `ManufacturersBrowser` が `useUrlFilters()` に依存
- `src/app/reports/page.tsx`
  - `ReportsBrowser` が `useActiveArticleSection()` と `useUrlFilters()` に依存
- `src/app/guides/page.tsx` / `src/app/use-cases/page.tsx`
  - `GuidesBrowser` / `UseCasesBrowser` が `useUrlFilters()` に依存
  - さらに `ComingSoonOverlay` によって「開発中」表示が前面に出る
- `src/app/compare/page.tsx`
  - `CompareClient` がD&D、localStorage favorites、URL stateをまとめて担う

### 再利用できる既存コード

フィルタ処理そのものは既にpure helperに分かれているため、サーバー側でも再利用できる。

- `normalizeRobotFilters()` / `filterRobots()`
- `normalizeManufacturerFilters()` / `filterManufacturers()`
- `filterArticles()`
- `filterGuides()`
- `getArticlePageItems()` / `normalizeReportPageParam()`
- `sortRobots()` / `sortManufacturers()`
- `getArticleIndexPlacementReports()`

## 基本方針

### 1. 本文・一覧・主要リンクはServer Componentへ寄せる

H1、説明文、パンくず、件数、カード一覧、主要な内部リンクは初期HTMLに出す。

Client Componentに残すのは以下に限定する。

- 検索入力
- セレクト/チップ/タブなどの操作UI
- URL更新
- favoritesなどの `localStorage` 依存
- D&D
- carousel / hover animation など、SEO本文ではない演出

### 2. URLパラメータの正本をPageの `searchParams` にする

一覧ページの初期表示は、`page.tsx` が `searchParams` を受け取り、既存の `normalize*Filters()` を使って決める。

Client側の `useUrlFilters()` は「ユーザー操作後にURLを更新する」責務へ縮小する。

Next 16.2.6 の生成型では、Page props の `searchParams` は同期オブジェクトではなく以下の形になる。

```ts
searchParams: Promise<Record<string, string | string[] | undefined>>
```

そのため、各ページで直接 `searchParams.foo` のように読む実装は禁止する。
共通helperで `await` と配列値の正規化を行い、ページ側は文字列または `null` だけを扱う。

追加候補:

- `lib/searchParams.ts`
  - `type RouteSearchParams = Promise<Record<string, string | string[] | undefined>>`
  - `type ResolvedSearchParams = Record<string, string | string[] | undefined>`
  - `readFirstSearchParam(params, key): string | null`
    - 解決済みrecordを読む同期関数
  - `resolveSearchParams(params): Promise<ResolvedSearchParams>`
    - Page propsのPromiseを `await` するasync関数
  - `getFirstSearchParam(params, key): Promise<string | null>`
    - Promiseを受けるasync関数。内部で `resolveSearchParams()` と `readFirstSearchParam()` を使う
  - `pickSearchParams(params, keys): Promise<Record<Key, string | null>>`
    - Promiseを受けるasync関数。指定keyだけfirst-string正規化して返す

正規化ルール:

- 値が配列なら先頭の文字列だけ採用する
- 空文字または空白だけの値は `null`
- 未定義は `null`
- `normalize*Filters()` に渡す前に、自由入力以外の妥当性チェックをページごとに重複実装しない

### 3. Client island は `useSearchParams` 非依存を基本にする

ページ全体の `Suspense` を外しても、フィルタUI内部で `useSearchParams()` を呼ぶと、そのClient islandに `Suspense` が必要になる。
本計画では、ハブ本文の初期HTMLを確実に残すため、操作UIは `useSearchParams()` 非依存に寄せる。

追加候補:

- `lib/useUrlParamUpdater.ts`
  - `usePathname()` と `useRouter()` は使う
  - 現在値はserverからpropsで受ける
  - 更新時だけ `window.location.search` から `URLSearchParams` を作る
  - `push` / `replace` と `scroll: false` を維持する

既存 `lib/useUrlFilters.ts` は一気に削除しない。
ただし、新しいハブページのfilter controlsでは使わない。
やむを得ず `useUrlFilters()` を使うClient islandが残る場合は、その小さい部分だけを局所 `Suspense` で包み、ページ本文全体をfallbackにしない。

### 4. Active filter chips はdescriptor化する

現行の `ActiveFilterChip` は `onRemove` 関数を持つ。

```ts
export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}
```

Server Componentから関数propsは渡せないため、サーバー側でcallback付きchipを組み立てない。
ハブページでは、削除方法をデータで表すdescriptorを作り、削除処理だけClient側に置く。

追加候補:

- `components/filters/ActiveFilterChipControls.tsx`
- `lib/filterChips.ts`

descriptor例:

```ts
interface ActiveFilterChipDescriptor {
  key: string;
  label: string;
  removeParams: Record<string, null>;
}
```

方針:

- server側: chipの `key` / `label` / `removeParams` だけを作る
- client側: descriptorを受け取り、`useUrlParamUpdater()` でURLから該当paramを消す
- `ContextualPageHeader` にserver側からcallback付きchipを渡す設計は避ける

既存headerとの接続:

- `components/ContextualPageHeader.tsx`
  - 現状は `activeChips?: ActiveFilterChip[]` だけを受け、内部でcallback付き `ActiveFilterChips` を描画している
  - 新ハブページ向けに、以下のどちらかを実装する
    - 推奨: `trailing?: ReactNode` または `rightSlot?: ReactNode` を追加し、descriptor対応chip UIを外から差し込む
    - 代替: `activeChipDescriptors?: ActiveFilterChipDescriptor[]` を追加し、内部で `ActiveFilterChipControls` を描画する
  - 既存利用箇所を壊さないため、既存 `activeChips` prop は残す
- `components/RobotsHeader.tsx`
  - 現状は `activeChips: ActiveFilterChip[]` と `useUrlFilters()` 前提
  - 新実装では `activeChipDescriptors` と現在の `release` 値をpropsで受ける
  - タブ更新は `useUrlParamUpdater()` で行う
- `components/ManufacturersHeader.tsx`
  - 現状はcallback付き `activeChips` 前提
  - 新実装では `activeChipDescriptors` または `trailing/rightSlot` 経由に移す
- `components/ReportsHeader.tsx`
  - 現状は `useActiveArticleSection()` と `useUrlFilters()` 前提
  - 新実装では現在の `section` をpropsで受け、タブ更新だけをClient側で行う

### 5. 既存のUI見た目を大きく変えない

今回の目的はSEO/クロール耐性であり、カードデザインやフィルタUIの大幅変更ではない。

ただし、`RobotCard` / `ManufacturerCard` / `NewsCard` は現在 `'use client'` であり、Server Componentから直接使うとカード全体がClient境界になる。
初期HTMLの厚みを優先する場合は、最小の静的カードを別途作るか、既存カードから静的部分を抽出する。

## 推奨実装方針

### A. サーバー描画用の薄い表示コンポーネントを追加する

既存の演出付きカードを無理にサーバー化しない。
まず、SEOに必要な内容を出すためのサーバー表示コンポーネントを作る。

候補:

- `components/seo/RobotIndexCard.tsx`
- `components/seo/ManufacturerIndexCard.tsx`
- `components/seo/ReportIndexCard.tsx`
- `components/seo/GuideIndexItem.tsx`
- `components/seo/UseCaseIndexItem.tsx`
- `components/seo/CompareSummaryTable.tsx`

表示する情報:

- ロボット:
  - 名前
  - メーカー
  - 概要
  - 導入段階
  - 日本での入手性
  - 代表用途タグ
  - 詳細リンク
- メーカー:
  - 名前
  - 国/地域
  - 概要
  - 代表ロボット
  - 相談ルート
  - 詳細リンク
- 記事:
  - タイトル
  - 概要
  - 公開日
  - 種別/セクション
  - 詳細リンク
- ガイド:
  - タイトル
  - 概要
  - ステージ
  - 更新日
  - 詳細リンク
- 用途:
  - タイトル
  - 概要
  - 成熟度
  - 候補ロボット数
  - 詳細リンク
- 比較:
  - ロボット名
  - メーカー
  - 導入段階
  - 日本入手性
  - 価格メモ
  - ペイロード
  - 稼働時間
  - 主用途
  - 詳細リンク

### B. 操作UIは小さいClient Componentへ分離する

既存の `SelectControl` / `SearchInput` / `FilterChipGroup` / `PageTabBar` はClient Componentのまま活かす。
ただし、これらをページ全体の親にしない。

候補:

- `components/filters/RobotsFilterControls.tsx`
- `components/filters/ManufacturersFilterControls.tsx`
- `components/filters/ReportsSectionTabs.tsx`
- `components/filters/GuidesFilterControls.tsx`
- `components/filters/UseCasesFilterControls.tsx`

これらは以下だけを担う。

- 現在値をpropsで受ける
- ユーザー操作でURLを更新する
- `useUrlParamUpdater()` を使い、原則 `useSearchParams()` を呼ばない
- 表示ロジックやフィルタ結果生成は持たない

### C. Client Browser本体は段階的に縮小する

既存の `RobotsBrowser` などを一気に削除しない。
最初はサーバー描画版を作り、既存Browserの責務を少しずつ移す。

移行後の理想:

- `RobotsBrowser`:
  - 使わないか、操作UIだけの小さいClient Componentへ分解
- `ManufacturersBrowser`:
  - 同上
- `ReportsBrowser`:
  - hero carouselなど演出領域だけClientへ残す
- `GuidesBrowser` / `UseCasesBrowser`:
  - サーバー描画主体にする
- `CompareClient`:
  - 現行のインタラクティブ比較として残す
  - その前後にサーバー描画の比較表/説明文を追加する

## ページ別計画

### Phase 1: Robots

目的:

- `/robots` の初期HTMLにロボット一覧、H1、説明文、件数、フィルタ状態を出す

変更候補:

- `src/app/robots/page.tsx`
  - `searchParams: Promise<Record<string, string | string[] | undefined>>` を受け取る
  - `lib/searchParams.ts` のhelperで `await` とfirst-string正規化を行う
  - `getRobots()` / `getManufacturers()` / `getRobotFilterOptions()` を呼ぶ
  - `normalizeRobotFilters()` / `filterRobots()` をサーバーで実行
  - `<Suspense>` でページ全体を包む構造をやめる
  - サーバー描画の一覧を返す
- `components/filters/RobotsFilterControls.tsx`
  - 検索、業種、タスク、メーカー、入手性、releaseタブのURL更新を担う
  - `useUrlFilters()` ではなく `useUrlParamUpdater()` を使う
- `components/filters/ActiveFilterChipControls.tsx`
  - chip descriptorを受け取り、URL param削除だけを担う
- `components/seo/RobotIndexCard.tsx`
  - 初期HTMLに出すロボットカード

注意:

- favoritesの星はSEOに不要。Phase 1では省略または小さいClient islandに分ける
- `release` タブと `hasActiveFilters` 時の横断件数ロジックは既存挙動を維持する
- `robots` のactive/pre-release表示分けは現行と同じにする
- active filter chips はcallbackではなく `{ key, label, removeParams }` で作る

### Phase 2: Manufacturers

目的:

- `/manufacturers` の初期HTMLにメーカー一覧、代表ロボット、相談ルートを出す

変更候補:

- `src/app/manufacturers/page.tsx`
  - `searchParams: Promise<Record<string, string | string[] | undefined>>` を受け取る
  - `lib/searchParams.ts` のhelperで `await` とfirst-string正規化を行う
  - `groupRobotsByManufacturer()` / `normalizeManufacturerFilters()` / `filterManufacturers()` をサーバーで実行
- `components/filters/ManufacturersFilterControls.tsx`
  - `useUrlParamUpdater()` を使う
- `components/seo/ManufacturerIndexCard.tsx`

注意:

- 代表ロボットは `robotsByManufacturer.get(manufacturer.id)` を使う
- メーカー詳細へのリンクは `slug`
- 内部keyやMapは `id`
- active filter chips はcallbackではなくdescriptorで扱う

### Phase 3: Reports

目的:

- `/reports` の初期HTMLに記事一覧、セクションタブ状態、主要記事を出す

変更候補:

- `src/app/reports/page.tsx`
  - `searchParams: Promise<Record<string, string | string[] | undefined>>` を受け取る
  - `lib/searchParams.ts` のhelperで `await` とfirst-string正規化を行う
  - `section` と `page` をサーバーで正規化
  - `filterArticles()` / `getArticlePageItems()` をサーバーで実行
- `components/filters/ReportsSectionTabs.tsx`
  - `useUrlParamUpdater()` を使う
  - `ARTICLE_SECTION_TABS` / `normalizeArticleSectionParam()` を正本にする
  - タブ選択時は既存挙動通り、旧 `category` と `page` を同時に消す
  - 更新内容:
    - `section: value === 'all' ? null : value`
    - `category: null`
    - `[ARTICLE_PAGE_PARAM]: null`
- `components/seo/ReportIndexCard.tsx`
- `components/seo/ReportsFeaturedSection.tsx`

注意:

- `useArticlesPerPage()` はviewport依存なので、サーバー初期HTMLでは `ARTICLES_PER_PAGE = 12` を正本にする
- クライアントでviewportに応じて件数を変える現行挙動は、SEO/ページネーションURLと相性が悪い。ページ数の正本はサーバー固定値へ寄せる
- hero carouselは演出なので、SEO本文とは別Client islandにしてよい

### Phase 4: Guides / Use Cases

目的:

- `/guides` と `/use-cases` を正式なハブページにするか、未完成ページとして検索対象外にするか決める

承認ゲート:

- Phase 4 実装前に、以下のどちらにするかを決める
  - 正式公開: `ComingSoonOverlay` を外し、hub一覧を初期HTMLに出す
  - 未公開維持: hubページに `robots: { index: false, follow: false }` を付け、必要ならsitemapからhubを外す
- 未公開維持の場合は、詳細ページも対象を確認する
  - `guides/[slug]` / `use-cases/[slug]` を検索対象に残すのか
  - 出典不足の詳細だけ `seo.noindex` または `draft` にするのか
- sitemapは `src/app/sitemap.ts` でhubと詳細を別々に判断する

推奨:

- 既に詳細ページが存在するため、`ComingSoonOverlay` は外して正式公開する
- ただし、本文や出典が不足しているガイド/用途がある場合は、該当詳細ページ側の `seo.noindex` を使うか、公開前データを `draft` にする

変更候補:

- `src/app/guides/page.tsx`
  - `ComingSoonOverlay` を外す
  - `searchParams: Promise<Record<string, string | string[] | undefined>>` から `stage` / `topic` を正規化
  - `filterGuides()` をサーバーで実行
- `src/app/use-cases/page.tsx`
  - `ComingSoonOverlay` を外す
  - `searchParams: Promise<Record<string, string | string[] | undefined>>` から `mode` / `industry` / `task` / `q` をサーバーで正規化
  - 現行の検索ロジックをサーバーで再利用またはhelperへ抽出
- `components/filters/GuidesFilterControls.tsx`
- `components/filters/UseCasesFilterControls.tsx`
- `components/seo/GuideIndexItem.tsx`
- `components/seo/UseCaseIndexItem.tsx`

注意:

- `use-cases` の検索ロジックは現在 `UseCasesBrowser` 内に直接あるため、`lib/useCaseFilters.ts` へ抽出する
- `lib/useCaseFilters.ts` には既存URL互換を含める
  - `?task=...` がある場合、`mode=industry` でない限り task mode と解釈する
  - `mode` の既定値は現行通り `industry`
  - `industry` / `task` は `normalizeTagKey()` を通す
  - `q` は現行通り空文字既定
  - 検索document生成と `matchesSearchDocument()` 判定をhelper側に寄せる
  - `featured = filtered.slice(0, 2)` / `rest = filtered.slice(2)` の分割もhelper側へ寄せる
  - `active = industry || task || query` の判定もhelper側へ寄せる
- `guides` / `use-cases` を公開しない判断の場合、sitemapから外すかmetadata robots noindexを付ける

### Phase 5: Compare

目的:

- `/compare` がJSなしでも「比較ページ」として読める状態にする

変更候補:

- `src/app/compare/page.tsx`
  - H1、説明文、導入判断用の比較表をサーバーで出す
  - `searchParams: Promise<Record<string, string | string[] | undefined>>` から `compare` を読む
  - 現行 `CompareClient` は「インタラクティブ比較」セクションとして残す
- `components/seo/CompareSummaryTable.tsx`
- `lib/compareParams.ts`
  - `normalizeCompareRobotIds(compareParam, robots, max = 20)` を追加
  - 有効IDチェック、重複排除、最大20件制限を共通化する

表示方針:

- デフォルトでは公開ロボット全件または代表的な上位件数を表で出す
- `?compare=` がある場合は、指定された `id` のロボットをサーバーでも表に反映する
- D&D並べ替えやfavoritesは引き続きClient側だけでよい

注意:

- 比較表が長くなりすぎる場合、初期表示は全件ではなく主要列のみ・全件リンク/詳細リンクありにする
- SEO向けの比較表と操作用の `CompareClient` で情報が矛盾しないよう、行データ生成は `lib/robotDisplay.ts` の既存helperを使う
- `CompareClient` 内の `compare` param正規化も `lib/compareParams.ts` へ寄せ、サーバー表とhydration後UIのズレを避ける

## 変更しないこと

- 詳細ページの大規模改修
- データモデルの再設計
- 新規SEOライブラリの追加
- カードUIの全面刷新
- フォーム/CV導線の文言改善
- 記事やガイド本文の大量追加
- Search Console設定
- 本番環境変数の変更

これらは関連課題だが、今回の主目的とは分ける。

## 影響範囲

### 直接影響

- `/robots`
- `/manufacturers`
- `/reports`
- `/guides`
- `/use-cases`
- `/compare`

### 間接影響

- sitemapに載せるべきページの判断
- canonical / metadata の信頼性
- Google Search ConsoleのURL検査結果
- AIクローラーやSNS/OG取得時の見え方
- 初期表示速度とJSバンドル量

### 影響を受けない想定

- `/robots/[slug]`
- `/manufacturers/[slug]`
- `/reports/[slug]`
- `/guides/[slug]`
- `/use-cases/[slug]`
- `lib/data.ts` の取得方針
- データ保守ルール

## リスクと軽減策

| リスク | 重大度 | なぜ問題か | 軽減策 |
| --- | --- | --- | --- |
| 既存のClient Browserを一気にサーバー化してUI挙動を壊す | High | 検索、タブ、favorites、D&D、carouselが混ざっている | サーバー表示とClient操作UIを分離し、ページ単位で段階移行する |
| サーバー側フィルタとクライアント側フィルタが二重実装になる | High | 件数や表示順がズレる | 既存の `lib/*Filters.ts` を正本にし、不足分だけhelperへ抽出する |
| Next 16の `searchParams` を同期オブジェクトとして扱う | High | 型エラーまたは配列値の挙動ズレが出る | `lib/searchParams.ts` で `await` とfirst-string正規化を共通化する |
| Client islandで `useSearchParams()` を使い続ける | High | ページ全体のfallbackは外れても局所BAILOUTやSuspense漏れが残る | 新規filter controlsは `useUrlParamUpdater()` を使い、`useSearchParams()` 非依存にする |
| callback付きactive chipをServer境界越しに渡す | High | 関数propsはServer ComponentからClient Componentへ渡せない | `{ key, label, removeParams }` descriptorへ変換する |
| descriptor chipと既存headerの接続口がない | High | `ContextualPageHeader` / `RobotsHeader` / `ManufacturersHeader` がcallback付きchip前提で詰まる | `trailing/rightSlot` またはdescriptor propを追加し、既存propは維持する |
| 既存カードをそのまま使ってClient境界が残る | Medium | 初期HTMLの改善幅が限定される | SEO用の薄いサーバーカードを追加するか、静的部分を抽出する |
| Reportsのviewport依存ページネーションがURLとズレる | Medium | `page=2` の意味が端末幅で変わる | サーバー初期HTMLでは `ARTICLES_PER_PAGE` 固定へ寄せる |
| Reportsのタブ変更で旧URL stateが残る | Medium | `?section=tech&page=5` や旧 `category` が残り、空/ズレ表示になり得る | `ReportsSectionTabs` は `{ section, category: null, page: null }` を同時更新する |
| Guides/Use Casesの開発中解除で未完成感が出る | Medium | 低品質ページが検索対象になる | Phase 4前の承認ゲートで、正式公開かnoindex/sitemap除外かを決める |
| Use Casesの既存URL互換が落ちる | Medium | `?task=...` 直接URLの表示modeが変わる | `lib/useCaseFilters.ts` に既存のmode推定ロジックを抽出して正本化する |
| Compareの `compare` param正規化が二重化する | Medium | 初期HTMLの比較表とhydration後UIが違う候補になる | `lib/compareParams.ts` へ有効ID/重複/上限処理を抽出する |
| Compareの表が長すぎて読みにくい | Low | UXが重くなる | 主要列に絞る。詳細は各ロボットページへリンクする |
| 新規コンポーネントが増えすぎる | Low | 保守負荷が上がる | `components/seo` と `components/filters` に役割を限定し、共通行/カード構造は必要になってから抽出する |

## 実装順序

1. Phase 1: `/robots`
   - 最初の成功パターンを作る
   - build後HTMLの `<main>` 内にロボット名・説明文・詳細リンクが出ることを確認
2. Phase 2: `/manufacturers`
   - `/robots` のパターンを横展開
3. Phase 3: `/reports`
   - paginationとsection tabをサーバー基準へ寄せる
4. Phase 4: `/guides` / `/use-cases`
   - 実装前に正式公開かnoindex/sitemap除外かを承認する
   - 正式公開の場合のみ `ComingSoonOverlay` を外す
   - 必要なfilter helperを抽出
5. Phase 5: `/compare`
   - サーバー比較表を追加し、現行D&D比較は維持
6. 仕上げ
   - sitemap/noindexの整合確認
   - build成果物HTML検査
   - Search Console URL検査の手順をREADMEまたは運用メモへ追記

## 実装後に見るべきHTML検査

ビルド後、まずビルド成果物を確認する。
ただし、Page側で `await searchParams` を使うと、Nextの最適化結果によっては `.next/server/app/*.html` が存在しない、または期待した静的HTML検査対象にならない可能性がある。
そのため、`.next` 直読みは参考検査とし、最終的な成功条件は `next start` で返るレスポンスHTMLに置く。

```bash
npm run build
rg -n "ページを読み込み中" .next/server/app/robots.html .next/server/app/manufacturers.html .next/server/app/reports.html .next/server/app/guides.html .next/server/app/use-cases.html .next/server/app/compare.html
rg -n "Unitree|Figure|ヒューマノイド|導入判断|メーカー|記事|ガイド|用途|比較" .next/server/app/robots.html .next/server/app/manufacturers.html .next/server/app/reports.html .next/server/app/guides.html .next/server/app/use-cases.html .next/server/app/compare.html
```

レスポンスHTML検査:

```bash
npm run start
curl -sS http://localhost:3000/robots | rg -n "Unitree|Figure|ヒューマノイド|ロボット|ページを読み込み中"
curl -sS 'http://localhost:3000/robots?release=pre' | rg -n "ヒューマノイド|ロボット|ページを読み込み中"
curl -sS http://localhost:3000/manufacturers | rg -n "Unitree|Figure|メーカー|ページを読み込み中"
curl -sS 'http://localhost:3000/reports?section=tech' | rg -n "記事|ヒューマノイド|ページを読み込み中"
curl -sS http://localhost:3000/compare | rg -n "比較|導入段階|日本での入手性|ページを読み込み中"
```

期待:

- 主要ハブ本体の `PageSuspenseFallback` 由来の `ページを読み込み中` が消える
- H1、説明文、カード/表の主要テキストがHTMLに出る
- 詳細ページへの内部リンクがHTMLに出る
- `.next/server/app/*.html` の有無に依存せず、HTTPレスポンスHTMLで同じ確認ができる

注意:

- HTML全体の `BAILOUT_TO_CLIENT_SIDE_RENDERING` 有無だけを合否にしない
- rootのanalyticsなど、本文外の小さい `Suspense` が `useSearchParams()` を使う可能性がある
- 合否は `<main>` 内のハブ本文、カード/表、内部リンクが初期HTMLに出ているかで判断する
- 必要なら `scripts/inspect-prerendered-hubs.mjs` のような検査スクリプトを追加し、対象HTMLから `<main>` 周辺の本文テキストを検査する
- `next start` は別プロセスで起動するため、検証後はプロセスを終了する

## 検証コマンド

```bash
npm run validate:data
npx tsc --noEmit
npm run build
git diff --check
```

## 手動確認チェックリスト

- [ ] `/robots`: フィルタなしでロボット一覧が表示される
- [ ] `/robots`: `?release=pre` が既存通り効く
- [ ] `/robots`: 業種/タスク/メーカー/入手性/検索がURL更新で効く
- [ ] `/robots`: 初期HTMLにロボット名と詳細リンクが出る
- [ ] `/manufacturers`: メーカー一覧と代表ロボットが表示される
- [ ] `/manufacturers`: 国/相談ルート/検索がURL更新で効く
- [ ] `/manufacturers`: 初期HTMLにメーカー名と詳細リンクが出る
- [ ] `/reports`: 記事一覧、セクションタブ、ページネーションが動く
- [ ] `/reports`: 初期HTMLに記事タイトルと詳細リンクが出る
- [ ] `/guides`: 開発中表示の扱いが決定通りになっている
- [ ] `/use-cases`: 開発中表示の扱いが決定通りになっている
- [ ] `/compare`: JSなしでも比較表として読める
- [ ] `/compare`: 現行D&D比較UIは壊れていない
- [ ] モバイルで横スクロールや重なりがない
- [ ] キーボード操作でフィルタUIを操作できる
- [ ] Search ConsoleのURL検査でレンダリング後HTMLに主要本文が見える

## 自己監査メモ

### 問題1: 既存カードをサーバー化する範囲が広すぎる可能性

重大度: Medium

既存カードにはmotion、popover、localStorage、hover演出が含まれている。
これを一気にServer Component化するとUI回帰が大きい。

反映:

- SEO用の薄いサーバー表示コンポーネントを追加する方針にした
- 既存カードの演出は急に消さない

### 問題2: URL stateの正本が二重化する可能性

重大度: High

サーバー `searchParams` とクライアント `useSearchParams` の両方で正規化するとズレる。

反映:

- 正規化は既存 `normalize*Filters()` を共用する
- Client controlsは現在値をpropsで受け、URL更新だけを担当する

### 問題3: Reportsのページネーションが端末幅で変わる

重大度: Medium

SEO上、同じURLが端末幅で別記事集合を返すのは望ましくない。

反映:

- サーバー初期HTMLでは `ARTICLES_PER_PAGE` 固定を正本にする
- viewport依存の表示件数変更は見直し対象にした

### 問題4: Guides/Use Casesを公開するか判断が必要

重大度: Medium

`ComingSoonOverlay` を外すだけだと、出典不足や未完成ページが検索対象になる可能性がある。

反映:

- 公開するなら正式公開、しないならnoindex/sitemap除外を明記した

### 問題5: 変更範囲が大きい

重大度: Medium

6ページを一度に変えると原因切り分けが難しい。

反映:

- `robots` でパターンを作り、順に横展開する実装順にした

### 問題6: Next 16の `searchParams` 型が未反映

重大度: High

Next 16.2.6 の生成型では `searchParams` は `Promise<Record<string, string | string[] | undefined>>`。
同期アクセスや配列値の未処理は型エラーまたは表示ズレにつながる。

反映:

- `lib/searchParams.ts` を追加候補に入れた
- 各ページで `await` とfirst-string正規化を共通helperに寄せる方針にした

### 問題7: 小Client islandの `useSearchParams()` 依存が残る

重大度: High

ページ全体の `Suspense` を外しても、filter controls側が `useUrlFilters()` を使うと `useSearchParams()` 依存が残る。
局所 `Suspense` 漏れやhydration後の挙動差が起きやすい。

反映:

- 新規 `useUrlParamUpdater()` を追加候補に入れた
- 新しいfilter controlsは `useSearchParams()` 非依存を基本にした
- 既存 `useUrlFilters()` は一気に削除せず、legacyとして残す方針にした

### 問題8: Active filter chips のcallbackがServer境界を越えられない

重大度: High

現行 `ActiveFilterChip` は `onRemove` 関数を持つため、Server Componentで組み立ててClient Componentへ渡せない。

反映:

- `{ key, label, removeParams }` のdescriptor方式を追加した
- 削除処理はClient側の `ActiveFilterChipControls` に限定する方針にした

### 問題9: BAILOUT検証が広すぎる

重大度: Medium

rootのanalyticsなど本文外の小さい `Suspense` が `useSearchParams()` を使う可能性があるため、HTML全体の `BAILOUT_TO_CLIENT_SIDE_RENDERING` 検索は合否基準として不適切。

反映:

- 検証基準を `PageSuspenseFallback` 由来の `ページを読み込み中` と、`<main>` 内の実本文確認へ変更した
- 必要なら検査スクリプトを追加する方針にした

### 問題10: Compareの `compare` param正規化が二重化する

重大度: Medium

現行 `CompareClient` は有効ID、重複排除、最大20件制限を内部で処理している。
サーバー比較表でも同じparamを読むなら、二重実装で初期HTMLとhydration後UIがズレる。

反映:

- `lib/compareParams.ts` を追加候補に入れた
- `CompareClient` も同じhelperへ寄せる方針にした

### 問題11: descriptor chipの接続先が未定義

重大度: High

`ContextualPageHeader`、`RobotsHeader`、`ManufacturersHeader` はcallback付き `ActiveFilterChip[]` 前提。
descriptor方針だけでは、Server Componentからheaderへchipを渡す段階で詰まる。

反映:

- `ContextualPageHeader` に `trailing/rightSlot` またはdescriptor propを追加する方針を明記した
- `RobotsHeader` / `ManufacturersHeader` / `ReportsHeader` もdescriptor + `useUrlParamUpdater()` へ移す方針を追記した
- 既存 `activeChips` propは互換性のため残す方針にした

### 問題12: ReportsタブのURLリセット挙動が落ちる

重大度: Medium

現行 `ReportsHeader` はsection変更時に旧 `category` と `page` を同時に消している。
これを落とすと古いURL stateや範囲外ページが残る。

反映:

- `ReportsSectionTabs` は `ARTICLE_SECTION_TABS` / `normalizeArticleSectionParam()` を使う
- タブ選択時は `{ section, category: null, [ARTICLE_PAGE_PARAM]: null }` を同時更新する

### 問題13: Use Casesの既存URL互換が未指定

重大度: Medium

現行 `UseCasesBrowser` は `?task=...` がある場合、`mode=industry` でない限りtask modeとして扱う。
実装者が `mode` だけを正本にすると、既存の直接URLで表示が変わる。

反映:

- `lib/useCaseFilters.ts` に既存のmode推定、tag正規化、検索document生成、featured/rest分割、active判定を寄せる方針を追記した

### 問題14: HTML検査が `.next/server/app/*.html` 前提に寄りすぎる

重大度: Medium

Page側で `await searchParams` を使うと、Nextの最適化結果によって `.next/server/app/*.html` が期待通りの検査対象にならない可能性がある。

反映:

- `.next` 直読みを参考検査に下げた
- `npm run start` 後に `curl` でレスポンスHTMLを確認する手順を成功条件に追加した

### 問題15: `lib/searchParams.ts` の候補APIのPromise境界が曖昧

重大度: Low

`searchParams` がPromiseである以上、Promiseを受けるhelperの戻り値もPromiseになる。
同期関数とasync関数を混ぜて書くと、実装者が型を誤りやすい。

反映:

- `ResolvedSearchParams` を追加候補に入れた
- 解決済みrecordを読む `readFirstSearchParam()` と、Promiseを受ける `getFirstSearchParam()` を分けた

## 残るリスク

- Google Search Consoleの実URL検査はローカルだけでは完了できない
- 本番の `NEXT_PUBLIC_SITE_URL` はVercel production環境で確認が必要
- コンテンツ自体の薄さ、出典不足、CV導線改善は別計画が必要
- AIクローラーごとのJavaScript実行能力差は完全には制御できない
