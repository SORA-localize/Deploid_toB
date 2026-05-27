# Vite/Figma Make UI から Next.js への移植手順 v1

## 1. この文書の目的

Figma Make が生成した Vite/React プロトタイプを、Next.js 本番プロジェクトへ移植するための手順書。

一括変換は避ける。理由は、Vite 側の構造が `react-router` 前提であり、Next.js ではルーティング、リンク、詳細ページ、メタデータ、ビルド方式が変わるため。

この移植では、既存コードを「そのまま変換する」のではなく、次の3つに分解して再構成する。

- UIの見た目とレイアウト
- データ構造
- Next.js のルート構造

---

## 2. 基本方針

### やること

- Figma Make 出力は UI 参照元として使う
- Next.js プロジェクトは新規に作る
- ページ単位で移植する
- `react-router` 依存をなくす
- まずローカルデータで動かす
- CMS接続は後回しにする

### やらないこと

- Vite プロジェクトを無理に Next.js 化しない
- 全ページをAIに一括変換させない
- CMSやDBを最初から入れない
- デザイン調整とデータ精査を同時にやりすぎない

---

## 3. 移植前に決めること

### 3-1. URL

Next.js では以下を正式ルートにする。

| Page | URL |
|---|---|
| Home | `/` |
| Robots index | `/robots` |
| Robot detail | `/robots/[slug]` |
| Manufacturers index | `/manufacturers` |
| Manufacturer detail | `/manufacturers/[slug]` |
| Compare | `/compare` |
| Guides index | `/guides` |
| Guide detail | `/guides/[slug]` |
| Use cases index | `/use-cases` |
| Use case detail | `/use-cases/[slug]` |
| Reports index | `/reports` |
| Report detail | `/reports/[slug]` |
| About | `/about` |
| Contact | `/contact` |

### 3-2. 命名

- `posts` は使わず、UI表示もURLも `reports` に寄せる
- `industries` は使わず、URLは `use-cases` に寄せる
- 詳細ページの識別子は `id` ではなく `slug` に寄せる

---

## 4. 推奨ディレクトリ構成

```text
app/
  layout.tsx
  page.tsx
  about/page.tsx
  contact/page.tsx
  robots/page.tsx
  robots/[slug]/page.tsx
  manufacturers/page.tsx
  manufacturers/[slug]/page.tsx
  compare/page.tsx
  guides/page.tsx
  guides/[slug]/page.tsx
  use-cases/page.tsx
  use-cases/[slug]/page.tsx
  reports/page.tsx
  reports/[slug]/page.tsx

components/
  Header.tsx
  Footer.tsx
  Breadcrumbs.tsx
  RobotCard.tsx
  FavoriteCard.tsx

data/
  types.ts
  robots.ts
  manufacturers.ts
  guides.ts
  reports.ts
  useCases.ts

lib/
  routes.ts
  metadata.ts
  data.ts

styles/
  globals.css
```

---

## 5. コンポーネントとデータ取得の設計

移植の目的は、Vite側の画面をNext.jsで再現することだけではない。

今後のUI開発、CMS移行、データ追加を楽にするため、最初から責務を分ける。

### 5-1. 責務分離

| 層 | 役割 | 例 |
|---|---|---|
| `data/` | 一時的なローカルデータ | `robots.ts`, `manufacturers.ts` |
| `lib/` | データ取得・整形 | `getRobots()`, `getRobotBySlug()` |
| `components/` | 表示専用UI | `RobotCard`, `StatusBadge` |
| `app/` | ページ構成・ルーティング | `/robots/page.tsx` |

### 5-2. 基本ルール

- ページ内にデータ加工を書きすぎない
- カード内でデータ検索をしない
- `components/` は表示に集中させる
- CMSに移行するときは、主に `lib/` を差し替える
- `data/` の shape はCMSのモデルに近づけておく

### 5-3. 推奨する取得関数

```text
lib/
  robots.ts
  manufacturers.ts
  guides.ts
  reports.ts
  useCases.ts
```

例：

```ts
getRobots()
getRobotBySlug(slug)
getManufacturerBySlug(slug)
getRobotsByManufacturerSlug(slug)
getRelatedUseCasesForRobot(slug)
getReportsByRobotSlug(slug)
```

この形にすると、ローカルデータからCMSへ移る時もページやコンポーネントの変更を抑えられる。

### 5-4. 共通コンポーネント候補

最初から全部作る必要はないが、以下は重複が出やすいので共通化候補にする。

```text
components/layout/
  Header.tsx
  Footer.tsx
  PageHeader.tsx
  ThreeColumnLayout.tsx

components/cards/
  RobotCard.tsx
  ManufacturerCard.tsx
  UseCaseCard.tsx
  ReportCard.tsx
  GuideCard.tsx

components/data-display/
  StatusBadge.tsx
  InfoMetric.tsx
  SourceList.tsx
  ComparisonTable.tsx
  RelatedContent.tsx

components/filters/
  FilterPanel.tsx
  SearchInput.tsx
  SegmentedControl.tsx
```

### 5-5. 避けること

- `robots/page.tsx` と `compare/page.tsx` で別々のロボットカードを作る
- `id`, `slug`, `manufacturerId` が混在する
- `posts`, `reports`, `industries`, `use-cases` が混在する
- 詳細ページごとに関連コンテンツ表示をコピペする
- UIコンポーネント内でCMSやDBの取得処理を直接呼ぶ

---

## 6. 移植順序

### Phase 1：Next.jsの空プロジェクトを作る

1. `create-next-app` で新規作成
2. TypeScript を有効にする
3. Tailwind を有効にする
4. `app/` Router を使う
5. 空の `Header / Footer / Layout` を置く
6. Vercel へ一度空デプロイする

目的は、公開導線を先に通すこと。

### Phase 2：共通部品を移す

移す対象：

- Header
- Footer
- Breadcrumbs
- RobotCard
- FavoriteCard

置き換えルール：

- `react-router` の `Link` は `next/link` に変える
- `useLocation` は使わない。必要なら `usePathname` を使う
- `usePathname` を使うコンポーネントは `use client` が必要
- まず見た目だけ合わせ、細かい状態管理は後で戻す

### Phase 3：データを移す

まず `nextjs_data_types_v1.ts` を `data/types.ts` にコピーし、その型に合わせて `src/app/data/*.ts` を `data/*.ts` に移す。

この段階でやること：

- `id` を `slug` に寄せる
- robots と manufacturers の関連を明確にする
- reports は `/reports` 前提にする
- useCases は `/use-cases` 前提にする

この段階でやらないこと：

- CMS接続
- DB接続
- 画像の完全整備

### Phase 4：一覧ページを移す

順番：

1. `/robots`
2. `/manufacturers`
3. `/compare`
4. `/guides`
5. `/use-cases`
6. `/reports`

一覧ページでは、まず表示だけ通す。

注意：

- フィルタが未実装でもよいが、動かないUIはなるべく置かない
- 動かすならローカル state で完結させる
- 検索欄を置くなら実際に絞り込む

### Phase 5：詳細ページを移す

順番：

1. `/robots/[slug]`
2. `/manufacturers/[slug]`
3. `/guides/[slug]`
4. `/use-cases/[slug]`
5. `/reports/[slug]`

詳細ページでは以下を必ず入れる。

- 該当データがない場合の `notFound()`
- `generateStaticParams`
- `generateMetadata`
- 関連データへのリンク

### Phase 6：Homeを作り直す

Home は最後にやる。

理由：

- Home は全ページの役割が固まってから作る方が自然
- 先に作ると、ただの主要カード一覧になりやすい

Home の役割：

- サイト全体の入口
- `探す / 比べる / 判断する / 用途から探す / 動向を見る` の導線整理
- 旗艦ガイドと主要DBへの接続

---

## 7. AIに依頼するときの単位

### 良い依頼単位

- `HeaderをNext.jsに移植して`
- `RobotCardをnext/link前提に変えて`
- `/robots/page.tsxだけ作って`
- `/robots/[slug]/page.tsxだけ作って`
- `mockDataをrobots.tsとmanufacturers.tsに分けて`

### 悪い依頼単位

- `このViteプロジェクトをNext.jsに全部変換して`
- `全部いい感じに移植して`
- `CMSもDBも含めて本番化して`

---

## 8. 変換時の対応表

| Vite / React Router | Next.js |
|---|---|
| `react-router` の `Link` | `next/link` |
| `useParams()` | page props の `params` |
| `useLocation()` | `usePathname()` |
| `createBrowserRouter()` | `app/` ディレクトリ |
| `routes.tsx` | 不要 |
| `src/main.tsx` | 不要 |
| SPA ルーティング | ファイルベースルーティング |
| `id` | `slug` |
| `manufacturerId` | `manufacturerSlug` |
| `posts` | `reports` |
| `industries` | `use-cases` |

---

## 9. 実装後の確認方法

### 9-1. ローカル確認

```bash
npm run dev
```

確認するURL：

```text
/
/robots
/robots/figure-02
/manufacturers
/manufacturers/figure-ai
/compare
/guides
/guides/procurement-guide
/use-cases
/use-cases/warehouse-picking
/reports
/reports/bmw-figure-deployment
/about
/contact
```

### 9-2. ビルド確認

```bash
npm run build
```

見ること：

- TypeScript error がない
- `generateStaticParams` が落ちない
- 存在しない slug でエラーにならない
- client component と server component の境界が破綻していない

### 9-3. Lint確認

```bash
npm run lint
```

Next.js の初期設定によっては `lint` script が無い場合がある。無ければ追加する。

### 9-4. 画面確認

最低限見る画面：

- Desktop 1440px
- Tablet 768px
- Mobile 390px

見ること：

- ヘッダーが折り返して崩れない
- 3カラムページがモバイルで破綻しない
- カード内の文字がはみ出さない
- 詳細ページのサイドバーが狭い画面で邪魔にならない
- CTAが実際のリンク先に飛ぶ

### 9-5. リンク確認

手で確認するリンク：

- Header nav
- Robot card -> detail
- Manufacturer card -> detail
- Compare -> robot detail
- Use case -> candidate robot
- Report -> related robot / guide
- Guide -> related robot / use case

### 9-6. SEO確認

各詳細ページで見ること：

- title が固有
- description が固有
- canonical を後で入れやすい
- OGP を後で設定しやすい
- robots noindex が残っていない

---

## 10. 移植時に起きやすい失敗

### 10-1. `use client` の付け忘れ

`useState`, `usePathname`, click handler を使うコンポーネントは client component にする。

ただし、全部に `use client` を付けない。ページ本体はできるだけ server component のままにする。

### 10-2. 詳細ページで `params` の扱いを間違える

Next.js では `useParams()` ではなく、page props から `params.slug` を受ける。

### 10-3. `react-router` の import が残る

移植後に以下が残っていたら基本的にNG。

```ts
import { Link } from 'react-router'
import { useParams } from 'react-router'
import { useLocation } from 'react-router'
```

### 10-4. URL名が旧名のまま残る

残してはいけない旧URL：

- `/posts`
- `/industries`

新URL：

- `/reports`
- `/use-cases`

### 10-5. 動かないフィルタUIを残す

検索欄やセレクトがあるなら、最低限ローカル state で動かす。

---

## 11. 完了条件

移植完了の最低条件：

- `npm run build` が通る
- 主要ルートが全て表示できる
- `react-router` 依存が消えている
- `/posts` と `/industries` が残っていない
- robots / manufacturers / guides / reports / useCases が分離されている
- `data/` と `lib/` が分かれている
- ページが `lib/` の取得関数経由でデータを読む
- 各詳細ページが slug で表示できる
- Vercel のプレビューURLで確認できる

---

## 12. 推奨する最初の実装単位

最初にやるべき単位はこれ。

1. Next.js 空プロジェクト
2. Header / Footer
3. `data/types.ts`（`nextjs_data_types_v1.ts` をコピー）
4. `data/robots.ts`, `data/manufacturers.ts`
5. `/robots`
6. `/robots/[slug]`
7. `/manufacturers`
8. `/manufacturers/[slug]`
9. `/compare`

この順番なら、公開情報だけで作り切れる中核から固まる。
