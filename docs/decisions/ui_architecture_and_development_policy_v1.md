---
status: current
updated: 2026-08-06
---

# UIアーキテクチャ・開発方針 v1

> **2026-06-28 撤去注記**: `/guides`・`GuidesBrowser`・ガイド詳細は撤去済み。本書のガイド関連記述（`GuidesBrowser`、`/guides → GuidesBrowser`、ガイド専用ブロック等）は**もう有効でない**。経緯は `archive/guides-retirement-v1.md`。

Last reviewed: 2026-07-14

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
- 色/トークン: **Radix Colors** ベースの semantic token（`src/app/globals.css` + `lib/visualSemantics.ts`）。ダークモードは `next-themes`。
- UIライブラリ: 全面的なUIフレームワークは未導入。ただし shadcn 由来の薄い部品を `components/ui/` に限定的に持つ（現状 `encrypted-text` 程度）。大半は独自Tailwindコンポーネント。
- アニメーション: `motion`（旧 framer-motion）。`motion/react` に一本化。

### 既存UIの方向性

現状のUIは、Figma Make UI復元方針を出発点にしつつ、現在は以下の方向に整理されている。

- neutral基調（Radix slate）＋アクセント1色（Radix jade）
- 角丸は最小限（`--radius` token 化。原則は矩形基調）
- 枠線で情報単位を区切る
- カード型だが装飾は薄い
- buyer intelligence / B2B調査ツール寄り
- 大きなマーケティングheroより、一覧・比較・判断材料の密度を優先

### 既存の重要な実装単位

| 領域 | 主なファイル | 役割 |
|---|---|---|
| Shell | `Header`, `Footer`, `Breadcrumbs`, `layout.tsx` | 全ページ共通の外枠 |
| 一覧ヘッダ | `PageListHeader` | 全 index route の H1＋検索＋説明文（**正本。独自ヘッダを組まない**） |
| 追従ヘッダ | `ContextualPageHeader`, `HeaderChrome`（`HeaderStickyBarSlot`） | スクロール時の絞り込み帯。本文の再掲に留める |
| 一覧ブラウザ | `RobotsBrowser`, `ManufacturersBrowser`, `UseCasesBrowser`, `ReportsBrowser`, `CompareClient` | 検索、filter、tag、一覧表示 |
| カード | `RobotCard`, `FeaturedRobotCard`, `FavoriteCard`, `TagChip`, `EmptyState` | 再利用される表示単位 |
| fact表示 | `FactList`, `CardFactGrid`, `ComparisonSpecList` | 短いラベル–値、カード、比較の役割別表示 |
| ロボットレール | `RobotCardRail` | `FeaturedRobotCard` の幅・gap・snap・横スクロール |
| 入力 | `SearchInput`, `SelectControl`, `FilterChipGroup`, `ContactForm` | 絞り込み・問い合わせ |
| 詳細 | `RobotImageCarousel`, `Markdown`, `ManufacturerLogoName` | 詳細ページ固有の補助部品 |
| データ取得 | `lib/data.ts` | published filter、slug lookup、関連取得 |
| ラベル | `lib/labels.ts` | enum表示名 |
| 検索 | `lib/catalog/search.ts`（server専用の検索テキスト組み立て）, `lib/catalog/matchSearch.ts`（client側の一致判定） | collection別 search document |
| タグ | `lib/tags.ts` | tag正規化、表示、候補生成 |
| URL filter | `lib/catalog/urlState.ts`（`useCatalogUrlState`） | 一覧のURL連動filter（旧 `useUrlFilters` / `useUrlParamUpdater` は廃止） |
| メディア権利 | `lib/media.ts` | 画像・ロゴ表示可否のgate |

---

## 3. 真実源

| 領域 | 真実源 |
|---|---|
| データ型 | `data/types.ts` |
| 静的データ | `data/*.ts` |
| データ取得・関連解決 | `lib/data.ts` |
| enumラベル | `lib/labels.ts` |
| 検索対象 | `lib/catalog/search.ts` |
| タグ正規化 | `lib/tags.ts` |
| メディア表示可否 | `lib/media.ts` |
| 共通UI部品 | `components/*.tsx` |
| ページ構成 | `src/app/**/page.tsx` |
| 色トークン | `src/app/globals.css`（Radix slate/jade ベースの CSS 変数） |
| semantic tone | `lib/visualSemantics.ts`（enum/状態 → tone → class） |
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
- `/compare` → `CompareClient`

ルール：

- page側は `lib/data.ts` から取得する。
- 一覧の検索・filter・chip状態は browser component に閉じる。
- URL共有したいfilterだけ `useCatalogUrlState`（`lib/catalog/urlState.ts`）を使う。初期値は Server 側 searchParams から `toInitialSearch` で渡し、以降は `history.pushState` + `useSyncExternalStore` で同期する（`useSearchParams` は使わない。Server Component の再実行を伴うため）。
- 主軸タブは `PageTabBar`、補助絞り込みは `SelectControl` に分ける。主軸タブの種類は固定し、検索・ファセット条件から導出した件数と0件disabledだけを連動させる。
- `PageTabBar` は表示部品に留める。件数計算、URL更新、検索状態の解釈は browser/header 側で行う。
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
- hover/focus/clickで切り替える詳細仕様パネル
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
- `SelectControl`
- `FilterChipGroup`
- `TagChip`
- `EmptyState`
- `ManufacturerLogoName`
- `FactList`
- `CardFactGrid`
- `RobotCardRail`

### 作りすぎないもの

以下は、いきなり汎用化しない。

- ページ全体レイアウト
- 複雑な比較UI
- 詳細ページ固有のaside
- markdown本文レイアウト
- レポート/ガイド専用の情報ブロック

理由：情報設計がまだ固まり切っていないため、抽象化が早すぎると変更しづらくなる。

### カードとグリッドの責務分離

一覧カードは、置き場所ごとに別コンポーネントや別variantを作らない。ロボット、メーカー、用途、記事など同じデータ種別のカードは、home、一覧、詳細内の関連枠でまず同じカードコンポーネントを使う。

カードコンポーネントの責務：

- 表示する情報の密度、順序、欠損時表示を決める。
- `h-full`、必要最小限の `min-h-*`、`line-clamp-*` で外形が極端に崩れないようにする。
- hover、focus、カード内操作など、カード単体の振る舞いを持つ。
- データ種別ごとの正本ラベル/helperを使い、配置場所ごとの直書き表示を増やさない。

親グリッド/親セクションの責務：

- カードの幅、列数、行揃え、gap、表示件数、レスポンシブ段階を決める。
- 同じ `site-container` 内で同じ種類のカードを出す場合、原則として同じグリッド指定を使う。
- `auto-rows-fr` などで同一行の高さを揃える。

禁止：

- home用、一覧用、詳細埋め込み用という理由だけで同じカードを複製する。
- カード側に `w-[...]`、`basis-[...]`、`sm:w-[...]` など配置場所依存の幅を持たせる。
- 「featured」など根拠の曖昧な表示枠のためにデータ型やカードvariantを増やす。
- カード内のテキスト量に合わせて、同じグリッド内のカード外形が大きく変わる実装にする。

---

## 6. データとUIの境界

UIは、存在しないデータを捏造しない。

ルール：

- 未確認値は `TBD_LABEL` または「要確認」系の表示にする。
- UI表示名は `lib/labels.ts` を通す。
- 検索対象は `lib/catalog/search.ts` に追加する。field は明示列挙する（オブジェクト全体を投げ込まない。client bundle へ全文が載るため）。
- タグ表示・正規化は `lib/tags.ts` に追加する。
- 画像・ロゴは `lib/media.ts` のgateを通す。
- ロボットのカード・詳細・比較・JSON-LD用画像は `Robot.images` を正本にし、共通resolverで解決する。
- カード用の用途・価格・サイズ・稼働時間と、詳細の仕様・活用事例・関連ロボットはpure view model resolverで組み立てる。

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

- 実機画像はロボットを知る入口として十分な面積を確保する。
- 主役は公式に追跡できる「用途」「仕様」「価格」「活用事例」「出典」。根拠の曖昧な導入判断ラベルや国内可否をカードの主要変数にしない。
- 画像の有無でカードの高さやレイアウトが極端に崩れないようにする。

### ロボット詳細のServer / Client境界

- page側は `lib/data.ts` からRobot・UseCase・Source・関連Robotを取得する。
- `lib/robotCatalog.ts` がserializableなcard/detail view modelを組み立てる。
- `RobotSpecExplorer` と `RobotImageCarousel` は操作状態だけを持ち、raw data検索や用途・価格の業務ルールを持たない。
- 活用事例はRobotが保持するsource URLから既存Sourceを解決し、タイトル・publisher・日付をRobotへ複製しない。

---

## 8. レスポンシブ方針

原則：

- mobile first
- 固定3カラム禁止
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` のように段階指定する
- レスポンシブは「カード内でサイズを変える」ことではなく、親グリッドが列数・幅・表示密度を変えることを基本にする
- Compareのような密度UIは、desktopで3ペイン、mobileでは縦積み
- 横スクロールは表やタブなど固定フォーマットUIに限定する

チェック対象（幅は `design_system_v1.md` §8 と揃える）：

- 390px幅（`tests/e2e/mobile-overflow.spec.ts` が回帰を見る）
- 768px幅
- 1280px幅
- 1440px幅
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

### フォーカスの契約

- **overlay（メニュー・dialog・popover）を閉じたら、開いた場所へフォーカスを戻す。**
  戻さないとフォーカスは `body` へ落ち、キーボード利用者は Tab を先頭から押し直すことになる。
  実装は Radix の既定と各コンポーネントの `restoreFocusRef` で足りている（Phase 6 Task 4 で実測）。
  **PASS しているコンポーネントへ独自の focus 制御を足さない。**
- **フォーカスを保持している領域を、スクロールやフィルタ更新を理由に unmount しない。**
  詳細は `design_system_v1.md` の追従ヘッダの項。
- `setTimeout` でフォーカスのタイミングを推測しない。Radix の lifecycle event か
  `requestAnimationFrame` を1回だけ使う。

### ページ内タブとナビゲーションの区別

- **URL が変わる絞り込み**（`/reports?kind=news` 等）は `role="group"` + `aria-current="page"`。
  `role=tab` / `aria-selected` / roving tabindex を**付けない**。付けると支援技術の利用者は
  パネルの差し替えを予期するが、実際にはページ遷移が起きる。到達は Tab、選択は Enter/Space。
- **同一ページ内で panel を差し替えるもの**（ロボット詳細のスペックタブ）だけが tab semantics を持つ。
- この区別は `tests/components/page-tab-bar.test.tsx` が固定している。
  過去に一度 tab semantics が入って差し戻された経緯があるため、テストごと消さないこと。

### 自動的に動くもの

- autoplay には停止／再開の手段を常設する（WCAG 2.2.2）。
- reduced motion では autoplay と progress animation を止める。詳細は `design_system_v1.md`。

現在できていること：

- `CompareClient` の選択・削除・accordionにaria属性がある。
- `FilterChipGroup` に `role="group"` と `aria-pressed` がある。
- `ContactForm` にlabelがある。
- `ManufacturerLogoName` のロゴは装飾扱い。
- carousel に停止／再開ボタン、`aria-live` の現在位置、スライドごとの位置がある。
- nav の現在ページが `aria-current="page"`。
- overlay 3系統（モバイルメニュー / 比較ドロワー / 検索つきドロップダウン）の
  focus 復元を e2e で固定している（`tests/e2e/focus-restoration.spec.ts`）。

今後の課題（詳細と実測値は [`deferred-work-register-v1.md`](deferred-work-register-v1.md) が正本）：

- **`color-contrast` 違反 218箇所**（登録簿 #4）。テーマトークンの見直しを伴うため独立した計画が要る。
  axe gate の閾値を `serious` へ上げられるのはこれを片付けた後。現状は `critical` で運用する。
- `/robots` グリッドが 768px で2列のまま（登録簿 #7）。壊れてはいないため対象外と決定済み。

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
3. 一覧フィルタは各 browser component が `SelectControl` を直接組む形に戻した（件数つき・0件無効化は維持。URLは `useCatalogUrlState`）。設定駆動の `FacetFilterBar`＋`lib/facetConfig.ts` は Phase 5 で削除した——設定表が全 collection のラベルを1つのモジュールへ集め、client bundle に載っていたため。`SelectControl` のパネル幅はトリガー幅に統一済み。
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
