# UIアーキテクチャ・開発方針 v1

Last reviewed: 2026-05-29

> この文書は、Deploid のUIを作り込む前に、既存実装の構造、責務分担、今後の開発ルールを明文化する。具体的な色・余白・部品の見た目は `design_system_v1.md` に分ける。

---

## 1. 結論

UI開発方針とデザインシステムは別文書にする。

- `ui_architecture_and_development_policy_v1.md`
  - 画面構造、データ取得、Server/Client境界、コンポーネント責務、実装手順、検証ルール。
- `design_system_v1.md`
  - 色、余白、タイポグラフィ、カード、ボタン、タグ、フォーム、画像枠、レスポンシブ、アクセシビリティ。

理由：

- UIアーキテクチャは「壊れにくく作るための設計」。
- デザインシステムは「見た目と操作感を揃えるための設計」。
- 同じ文書にすると、実装ルールと視覚ルールが混ざり、更新しにくくなる。

---

## 2. 現状調査サマリ

### 技術スタック

- Framework: Next.js App Router
- UI: React + Tailwind CSS v4
- Icons: `lucide-react`
- Markdown: `react-markdown`
- Form: `@formspree/react`
- データ: `data/*.ts` の静的データ、取得は `lib/data.ts`
- CMS/DB: 未導入
- UIライブラリ: shadcn/ui 等は未導入。現状は独自Tailwindコンポーネント。

### 既存UIの方向性

現状のUIは、Figma Make UI復元方針を出発点にしつつ、現在は以下の方向に整理されている。

- neutral基調
- 角丸なし
- 枠線で情報単位を区切る
- カード型だが装飾は薄い
- buyer intelligence / B2B調査ツール寄り
- 大きなマーケティングheroより、一覧・比較・判断材料の密度を優先

### 既存の重要な実装単位

| 領域 | 主なファイル | 役割 |
|---|---|---|
| Shell | `Header`, `Footer`, `Breadcrumbs`, `layout.tsx` | 全ページ共通の外枠 |
| 一覧ブラウザ | `RobotsBrowser`, `ManufacturersBrowser`, `UseCasesBrowser`, `ReportsBrowser`, `GuidesBrowser` | 検索、filter、tag、一覧表示 |
| カード | `RobotCard`, `FavoriteCard`, `TagChip`, `EmptyState` | 再利用される表示単位 |
| 入力 | `SearchInput`, `FilterSelect`, `FilterChipGroup`, `ContactForm` | 絞り込み・問い合わせ |
| 詳細 | `RobotImageCarousel`, `Markdown`, `ManufacturerLogoName` | 詳細ページ固有の補助部品 |
| データ取得 | `lib/data.ts` | published filter、slug lookup、関連取得 |
| ラベル | `lib/labels.ts` | enum表示名 |
| 検索 | `lib/search.ts` | collection別 search document |
| タグ | `lib/tags.ts` | tag正規化、表示、候補生成 |
| URL filter | `lib/useUrlFilters.ts` | use-cases 等のURL連動filter |
| メディア権利 | `lib/media.ts` | 画像・ロゴ表示可否のgate |

---

## 3. 真実源

| 領域 | 真実源 |
|---|---|
| データ型 | `data/types.ts` |
| 静的データ | `data/*.ts` |
| データ取得・関連解決 | `lib/data.ts` |
| enumラベル | `lib/labels.ts` |
| 検索対象 | `lib/search.ts` |
| タグ正規化 | `lib/tags.ts` |
| メディア表示可否 | `lib/media.ts` |
| 共通UI部品 | `components/*.tsx` |
| ページ構成 | `src/app/**/page.tsx` |
| 視覚ルール | `design_system_v1.md` |

古いFigma復元計画は歴史的な参照として残す。今後の実装判断は、現在の実装とこの文書、`design_system_v1.md` を優先する。

---

## 4. 画面構造

### Collection一覧

一覧ページは、原則として Server Component の page からデータを取得し、必要な場合だけ Client Component の browser に渡す。

例：

- `/robots` → `RobotsBrowser`
- `/manufacturers` → `ManufacturersBrowser`
- `/use-cases` → `UseCasesBrowser`
- `/reports` → `ReportsBrowser`
- `/guides` → `GuidesBrowser`

ルール：

- page側は `lib/data.ts` から取得する。
- 一覧の検索・filter・chip状態は browser component に閉じる。
- URL共有したいfilterだけ `useUrlFilters` を使う。
- ページから `data/*.ts` を直接importしない。

### Detailページ

詳細ページは Server Component を基本にする。

役割：

- `generateMetadata`
- `generateStaticParams`
- slug lookup
- 関連データ取得
- 本文/出典/関連カードの構成

Client Component が必要なもの：

- carousel
- accordion
- tabs
- favorite
- filter/search
- form

---

## 5. コンポーネント責務

### 作ってよい共通コンポーネント

次の条件を満たす場合は共通化する。

- 3箇所以上で同じ見た目・挙動が出る。
- propsが少なく、用途が名前で分かる。
- ドメインロジックを持ちすぎない。

既存の良い例：

- `SearchInput`
- `FilterSelect`
- `FilterChipGroup`
- `TagChip`
- `EmptyState`
- `ManufacturerLogoName`

### 作りすぎないもの

以下は、いきなり汎用化しない。

- ページ全体レイアウト
- 複雑な比較UI
- 詳細ページ固有のaside
- markdown本文レイアウト
- レポート/ガイド専用の情報ブロック

理由：情報設計がまだ固まり切っていないため、抽象化が早すぎると変更しづらくなる。

---

## 6. データとUIの境界

UIは、存在しないデータを捏造しない。

ルール：

- 未確認値は `TBD_LABEL` または「要確認」系の表示にする。
- UI表示名は `lib/labels.ts` を通す。
- 検索対象は `lib/search.ts` に追加する。
- タグ表示・正規化は `lib/tags.ts` に追加する。
- 画像・ロゴは `lib/media.ts` のgateを通す。

禁止：

- ページやコンポーネントから `data/*.ts` の配列を直接importする。
- UI都合で `data/types.ts` を場当たり的に拡張する。
- 同じenumラベルを複数箇所に直書きする。
- 外部画像を `rights` なしで表示する。

---

## 7. メディア表示方針

画像・ロゴはUI品質と権利対策の両方に影響する。

ルール：

- 表示前に `getDisplayableAsset` / `canDisplayAsset` を通す。
- ロボット画像は `object-contain` を基本にする。
- 画像がない状態も完成UIとして扱う。
- 公開・登壇・商用導線では `commercial-strict` 相当を前提にする。
- 画像がないカードでも、比較・検索・導入判断が成立する情報設計にする。

デザイン上の考え方：

- 実機画像は補助情報。
- 主役は「導入判断変数」「比較」「出典」「国内可否」。
- 画像の有無でカードの高さやレイアウトが極端に崩れないようにする。

---

## 8. レスポンシブ方針

原則：

- mobile first
- 固定3カラム禁止
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` のように段階指定する
- Compareのような密度UIは、desktopで3ペイン、mobileでは縦積み
- 横スクロールは表やタブなど固定フォーマットUIに限定する

チェック対象：

- 360px幅
- 768px幅
- 1280px幅
- 長い日本語
- 長い英語製品名
- 画像なし
- 検索0件

---

## 9. アクセシビリティ方針

最低限守ること：

- icon button には `aria-label`
- toggle / chip button には `aria-pressed`
- accordion button には `aria-expanded`
- form input は `label` と `htmlFor`
- decorative logo image は `alt=""` + `aria-hidden`
- link と button の使い分けを守る

現在できていること：

- `CompareClient` の選択・削除・accordionにaria属性がある。
- `FilterChipGroup` に `role="group"` と `aria-pressed` がある。
- `ContactForm` にlabelがある。
- `ManufacturerLogoName` のロゴは装飾扱い。

今後の課題：

- keyboard focus時の視認性をもう少し明確にする。
- carouselの現在スロットを `aria-current` 相当で補強する。
- navの現在ページを `aria-current="page"` にする。

---

## 10. UI開発手順

大きなUI改修は次の順で進める。

1. 対象ページと関連コンポーネントを読む。
2. 既存の共通コンポーネントで表現できるか確認する。
3. 画面固有の情報設計を先に決める。
4. 必要なら小さな共通コンポーネントを追加する。
5. mobile / desktop のレイアウトを同時に実装する。
6. 画像なし、データなし、長文、検索0件を確認する。
7. `npm run build` を通す。
8. 差分に unrelated が混ざっていないか確認する。

---

## 11. 近い将来やるべきこと

優先度高：

1. `design_system_v1.md` を運用基準にする。
2. UIの主要部品を棚卸しし、重複classを減らす。
3. `PageHeader`, `SectionHeader`, `InfoPanel`, `StatList`, `SourceList` などの小さな共通化を検討する。
4. `lib/media.ts` のpolicyと商用公開方針を揃える。
5. mobile実機幅で主要ページを確認する。

優先度中：

1. Storybook相当の軽量カタログページを検討する。
2. Playwrightで主要ページのスクリーンショット回帰を検討する。
3. `SearchInput`, `FilterSelect`, `FilterChipGroup` の見た目と状態を統一する。
4. detailページのaside / source list / related list を整理する。

今はやらない：

- 大規模UIライブラリ導入
- shadcn/ui全面導入
- CMS前提のcomponent再設計
- 3D/派手なhero
- 汎用Table framework

---

## 12. 一言まとめ

Deploid のUIは、派手なLPではなく、導入判断のための業務ツールとして育てる。

実装は `lib/data`、`lib/search`、`lib/tags`、`lib/media` に責務を寄せ、UIは小さな部品を積む。デザインは neutral、矩形、情報密度、比較可能性を守る。
