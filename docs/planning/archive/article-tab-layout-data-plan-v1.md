# 記事タブ構造・データ設計・拡張計画 v1

Last reviewed: 2026-06-23

## 目的

Deploid の記事タブ（公開 URL `/reports`、内部データ名 `articles`）を、単なるニュース一覧ではなく、国内事業者がヒューマノイド導入を判断するための「解説・事例・取材・特集」の入口として整理する。

本計画は、ZEALS / Omakase Robotics の確認付き記事を最初の適用例として、以下を明確にする。

- 現在の記事タブのレイアウト構造
- 現在の記事データ構造
- 既存機能でできること / できないこと
- 「特集」「取材」「動画」「国内実装プレイヤー」への拡張方針
- すぐ実装すべきこと / まだ実装しないこと

## 現状の結論

現時点では、ZEALS 記事のためにグローバルナビへ「特集」を新設する必要はない。まずは既存の `/reports` と `articlePlacements` を使い、記事一覧の hero / feature 枠と Unitree G1 関連導線で扱う。

「取材」は既に `ArticleCategory` / `ArticleType` として存在するが、今回の ZEALS 初回記事は取材記事ではなく、確認付き解説として扱うのが自然。

動画は現状、記事本文・hero・カードに専用表示できない。公式動画 URL や掲載許諾済み素材が出てきた段階で、`VideoAsset` 型と表示コンポーネントを追加する。

## 現在のレイアウト構造

### 公開ルート

- 一覧: `src/app/reports/page.tsx`
- 詳細: `src/app/reports/[slug]/page.tsx`
- sitemap: `src/app/sitemap.ts` で `/reports/${slug}` を出力

内部データ名は `articles` だが、公開 URL は `/reports` を維持する。

### 一覧ページ

`src/app/reports/page.tsx` は以下を行う。

- `getArticles()` で published 記事を取得
- URL query の `section` と `page` を読む
- `ReportsBrowser` に渡す

`components/ReportsBrowser.tsx` は以下で構成される。

- `ReportsHeader`
  - `PageTabBar` による section タブ
  - `section=deployment/business/tech/policy/entertainment`
- hero / feature 枠
  - `NewsHeroCarousel`
  - `NewsFeatureCard`
  - `lib/articlePlacements.ts` と `data/articlePlacements.ts` で掲載記事を制御
- 記事グリッド
  - `NewsCard`
  - `articlePagination` によるページング

### 詳細ページ

`src/app/reports/[slug]/page.tsx` は以下で構成される。

- hero 画像あり: 大きい画像 hero + タイトル overlay
- hero 画像なし: テキスト中心 header
- 要点 `keyTakeaways`
- Markdown 本文 `body`
- タグ
- 出典 `SourceList`
- 関連情報
  - relatedRobotIds
  - relatedManufacturerIds
  - relatedUseCaseIds
  - relatedGuideIds
- 右サイドバー
  - 情報提供・取材相談
  - 関連ツール

### 関連導線

記事側の `related*Ids` を設定すると、以下の逆引き導線が成立する。

- `relatedRobotIds: ['unitree-g1']`
  - Unitree G1 詳細ページの関連レポートに表示
- `relatedManufacturerIds: ['unitree']`
  - Unitree メーカー詳細ページの関連記事に表示
- `relatedUseCaseIds`
  - 用途ページの関連レポートに表示
- `relatedGuideIds`
  - 記事詳細の関連ガイドに表示

## 現在の記事データ構造

正本は `data/types.ts` の `Article`。

主要フィールド:

```ts
interface Article extends BaseRecord {
  title: string;
  titleJa?: string;
  category: ArticleCategory;
  type: ArticleType;
  contentKind?: ArticleContentKind;
  publishedAt: ISODate;
  author?: string;
  tags: TagValue<'article'>[];
  whyItMatters: string;
  keyTakeaways?: string[];
  body?: string;
  featured?: boolean;
  section: ArticleSection;
  readingTimeMin?: number;
  relatedRobotIds: Id[];
  relatedManufacturerIds: Id[];
  relatedUseCaseIds: Id[];
  relatedGuideIds?: Id[];
}
```

`BaseRecord` 由来の主要フィールド:

- `id`
- `slug`
- `summary`
- `publishStatus`
- `updatedAt`
- `reliability`
- `sources`
- `heroImage`
- `seo`

## 現在の分類

### category

記事の第一軸。編集上の性格を表す。

- `news` = ニュース
- `interview` = インタビュー
- `company-report` = 企業レポート
- `analysis` = 分析
- `policy` = 政策・規制

### type

記事のフォーマット。カードや詳細 hero のラベルとして表示される。

- `analysis` = 分析
- `deployment-report` = 導入レポート
- `interview` = 取材
- `event-report` = イベント
- `policy-update` = 政策/規制
- `case-study` = 事例
- `news-brief` = ニュースメモ
- `tech-update` = テックアップデート
- `market-analysis` = 市場分析

### section

記事タブの分類。URL query `?section=` で使う。

- `deployment` = 導入・事例
- `business` = 市場・動向
- `tech` = 技術・製品
- `policy` = 政策・規制
- `entertainment` = 話題・その他

### tags

`lib/tagRegistry.ts` の `kind: 'article'` のみ使用可能。未登録タグは validate/build で失敗する。

現状、以下は未登録:

- `zeals`
- `omakase-robotics`
- `hri`（task タグにはあるが article タグにはない）
- `implementation`
- `domestic-implementation`

## ZEALS / Omakase Robotics 記事の扱い

### 記事種別

初回記事は取材記事ではなく、確認付き解説として扱う。

推奨:

```ts
category: 'analysis',
type: 'deployment-report',
section: 'deployment',
```

理由:

- まだ Q&A 形式の取材や発言引用を取っていない
- Unitree G1 そのもののニュースではない
- Omakase Robotics を国内実装レイヤーとして整理する記事である
- 導入検討者向けの PoC / 実装論点に寄せるため `deployment` が自然

将来、ZEALS に実際にヒアリング・インタビューを行う場合:

```ts
category: 'interview',
type: 'interview',
section: 'business' // または deployment
```

### 掲載場所

外部向け説明では、以下の表現にする。

> Deploid の記事ページ上で、国内事業者向けの解説記事として掲載予定です。公開後は、関連する Unitree G1 ページや Unitree 関連情報からも関連記事として導線を設ける予定です。

内部実装では以下。

- `data/articles.ts` に draft 追加
- `relatedRobotIds: ['unitree-g1']`
- `relatedManufacturerIds: ['unitree']`
- `relatedGuideIds: ['decision-variables', 'poc-planning']`
- 公開後、必要に応じて `data/articlePlacements.ts` の `feature` 枠に追加

### 追加したい article タグ

ZEALS 記事を自然に扱うには、最低限以下を追加する。

```ts
{ kind: 'article', value: 'zeals', label: 'ZEALS' },
{ kind: 'article', value: 'omakase-robotics', label: 'Omakase Robotics' },
{ kind: 'article', value: 'hri', label: 'HRI' },
```

必要になれば後で追加:

```ts
{ kind: 'article', value: 'domestic-implementation', label: '国内実装' },
{ kind: 'article', value: 'implementation-partner', label: '実装パートナー' },
```

ただし、タグは記事カードで表示されるため、増やしすぎない。初期は `zeals` / `omakase-robotics` / `hri` で十分。

## 特集の扱い

### 現状

特集専用の category / tag / route は存在しない。

近い仕組み:

- `Article.featured?: boolean`
- `data/articlePlacements.ts`
  - `surface: 'reports-index'`
  - `slot: 'hero' | 'feature'`
- UI 文言の `注目記事`

### 短期方針

グローバルナビに「特集」は追加しない。

理由:

- まだ特集として束ねる記事群が少ない
- ナビ項目を増やすと IA が重くなる
- ホバー展開はモバイル設計も同時に必要になる
- 既存の `/reports` hero / feature 枠で十分に目立たせられる

ZEALS 記事は、公開後に `articlePlacements` の `feature` 枠へ入れることで「注目記事」として扱う。

### 中期方針

以下のような記事群が 3 本以上できたら、特集導線を検討する。

- 国内実装プレイヤー解説
- Unitree G1 国内実証の整理
- Omakase Robotics / HRI OS 解説
- J-HRTI など国内導入基盤
- 国内SIer / 代理店 / 実装支援企業

その時点で検討する実装:

```ts
interface ArticleSeries {
  id: Id;
  slug: Slug;
  title: string;
  description: string;
  articleIds: Id[];
  heroImage?: ImageAsset;
  publishStatus: PublishStatus;
}
```

または `Article` に軽量フィールドを追加:

```ts
seriesIds?: Id[];
```

公開 URL 候補:

- `/features/domestic-implementation`
- `/reports/series/domestic-implementation`

短期は実装しない。

## 取材の扱い

### 現状

取材は型として存在する。

```ts
category: 'interview'
type: 'interview'
```

詳細ページのサイドバーにも「情報提供・取材相談」がある。

### 運用ルール

以下を満たすまでは `interview` にしない。

- 相手にヒアリングした
- 公開可能な発言・回答を得た
- 引用または要旨掲載の確認を取った
- 公開前確認の範囲を合意した

今回の ZEALS 初回記事は `interview` ではなく、確認付き解説にする。

将来の第2弾で `interview` を使う。

例:

> 国内でヒューマノイドを実装するには何が難しいのか：ZEALS に聞く Omakase Robotics の現場設計

## 動画の扱い

### 現状

動画専用の実装はない。

`components/Markdown.tsx` は `ReactMarkdown` で標準 Markdown を描画している。明示スタイル化しているのは以下。

- h1 / h2 / h3
- p
- ul / ol / li
- a
- strong / em
- blockquote
- code
- hr

現状できること:

- 記事 hero 画像
- 記事カード画像
- Markdown 本文

現状できないこと:

- 本文中の動画埋め込み
- YouTube / Vimeo iframe の安全な埋め込み
- hero 位置の動画表示
- 記事カードの動画サムネ表示
- 動画素材の rights 管理

### 短期方針

動画は、まず公式動画 URL / YouTube 埋め込みを前提にする。自前 mp4 配信や DB 契約は不要。

外部向けには以下の表現にする。

> もし掲載可能な動画素材や公式動画 URL 等がある場合は、記事内での紹介可否もあわせて確認できれば幸いです。動画についても、掲載可能範囲・クレジット・利用条件に従います。

### 中期実装案

`data/types.ts` に `VideoAsset` を追加する。

```ts
export type VideoSourceType = 'youtube' | 'vimeo' | 'external' | 'local';

export interface VideoAsset {
  sourceType: VideoSourceType;
  src: string;
  title: string;
  thumbnail?: ImageAsset;
  credit?: string;
  sourceUrl?: string;
  rights: RightsMeta;
}
```

`Article` に以下を追加する。

```ts
featuredVideo?: VideoAsset;
videos?: VideoAsset[];
```

表示は段階的に行う。

1. `featuredVideo` を本文冒頭または hero 下に表示
2. `videos` を記事末尾の素材セクションに表示
3. 必要になれば本文中 block 埋め込みへ拡張

本文中に任意位置で入れたい場合は、Markdown 文字列だけでは扱いづらいため `bodyBlocks` 化を検討する。

```ts
type ArticleBodyBlock =
  | { type: 'markdown'; source: string }
  | { type: 'image'; asset: ImageAsset; caption?: string }
  | { type: 'video'; asset: VideoAsset; caption?: string };
```

ただしこれは記事レンダリングの変更範囲が広いので、短期では実装しない。

## メディア・素材の扱い

### 優先順位

ZEALS 記事で本当に欲しい素材は、Unitree G1 本体写真よりも Omakase Robotics / Omakase OS の説明素材。

優先順位:

1. Omakase OS / Omakase Robotics の概念図
2. Omakase Robotics ロゴ
3. ZEALS ロゴ
4. 掲載許諾済みの実証・デモ画像
5. Unitree G1 本体画像

### Unitree が写る素材

Unitree G1 が写る素材は、ZEALS が提供可能でも利用範囲が限定される可能性が高い。

想定される制約:

- 当該記事内のみ使用可
- 改変不可
- クレジット必須
- 再利用不可
- 人物・施設・Unitree 側の権利確認が必要

したがって、ZEALS への依頼は以下の方針にする。

> Unitree G1 本体が写る画像については、Unitree 様や撮影場所・人物等の権利関係もあるかと思いますので、ZEALS 様側で掲載可能と判断いただける範囲に従います。

## 追加実装の優先順位

### Phase 1: ZEALS 初回記事に必要な最小対応

- `lib/tagRegistry.ts` に article タグ追加
  - `zeals`
  - `omakase-robotics`
  - `hri`
- `data/articles.ts` に draft 記事追加
- `relatedRobotIds` / `relatedManufacturerIds` / `relatedGuideIds` を設定
- 素材が届いたら `heroImage` / rights を更新
- 公開後に `data/articlePlacements.ts` の feature 枠へ追加

### Phase 2: 記事タブ改善

- `/reports` に topic / tag フィルタを追加するか検討
- `articlePlacements` に `series` 的な掲載意図を持たせるか検討
- 特集記事が複数本になったら `ArticleSeries` を追加
- 「国内実装」特集ページを作るか判断

### Phase 3: 取材・動画対応

- `interview` 記事テンプレートの整備
- Q&A / 発言引用 / 確認済み注記の表示
- `VideoAsset` 型の追加
- `featuredVideo` の表示
- YouTube / external video embed の許可リスト設計

## まだやらないこと

- グローバルナビに「特集」を追加しない
- ホバー展開メニューを急いで実装しない
- ZEALS 初回記事を `interview` 扱いしない
- 動画のためだけに DB / CMS / storage 契約をしない
- Unitree 画像を汎用素材として期待しない
- `manufacturers` に ZEALS を追加しない

## 将来の「国内実装企業」データ構造

ZEALS はメーカーではないため、`manufacturers` に追加しない。

将来的に国内実装企業を扱うなら、別コレクションを作る。

候補:

```ts
export type CompanyRole =
  | 'implementation-partner'
  | 'hri-os-provider'
  | 'ai-os-provider'
  | 'systems-integrator'
  | 'distributor'
  | 'operator'
  | 'research-partner';

export interface ImplementationCompany extends BaseRecord {
  name: string;
  nameJa?: string;
  roles: CompanyRole[];
  country: string;
  website: string;
  contactUrl?: string;
  relatedManufacturerIds?: Id[];
  relatedRobotIds?: Id[];
  relatedUseCaseIds?: Id[];
  serviceAreas?: string[];
}
```

ZEALS の想定:

```ts
{
  id: 'zeals',
  slug: 'zeals',
  name: 'ZEALS',
  nameJa: '株式会社ZEALS（ジールス）',
  roles: ['implementation-partner', 'hri-os-provider', 'ai-os-provider'],
  country: 'Japan',
  website: 'https://zeals.ai/',
  contactUrl: 'https://go.zeals.ai/contact',
  relatedManufacturerIds: ['unitree'],
  relatedRobotIds: ['unitree-g1'],
}
```

短期では実装しない。まず記事本文と関連導線で扱う。

## ZEALS 返信文に入れるべき掲載説明

以下を返信文へ追記する。

```text
掲載場所については、Deploid の記事ページ上で、国内事業者向けの解説記事として掲載する想定です。
公開後は、関連する Unitree G1 ページや Unitree 関連情報からも関連記事として導線を設ける予定です。

なお、もし掲載可能な動画素材や公式動画 URL 等がある場合は、記事内での紹介可否もあわせて確認できれば幸いです。
動画についても、掲載可能範囲・クレジット・利用条件に従います。
```

## 判定基準

ZEALS 記事公開前に以下を満たす。

- ZEALS の正式表記が `株式会社ZEALS（ジールス）` になっている
- `ジールズ` が出ていない
- 問い合わせ導線が `https://go.zeals.ai/contact` になっている
- ZEALS をメーカーとして扱っていない
- Unitree との関係を販売代理店・販売元と断定していない
- G1 標準機能と Omakase OS の差分を未確認のまま断定していない
- 商用パッケージ / PoC 段階を未確認のまま断定していない
- 画像・動画の利用条件を `rights` に残している
- 公開前に ZEALS 確認を通している

