# Responsive Design Implementation Plan

## 1. Purpose

この資料は、Deploidのレスポンシブデザイン監査結果を実装タスクへ落とし込むための計画書です。

目的は「スマホで崩れない」だけではなく、以下の画面幅ごとに情報量、操作性、余白、カード密度、比較性を最適化することです。

- 375px: 小さめスマホ
- 390-430px: 一般的なスマホ
- 768px: タブレット縦
- 1024px: タブレット横 / 小さめPC
- 1280-1440px: 一般的なPC
- 1536-1920px: 大型モニター

実装では、既存のデザイン意図、白黒ベースのトーン、Tailwind v4、既存コンポーネント構造を維持します。大規模リファクタリングは避け、優先度の高いUX問題から小さく進めます。

## 2. Implementation Principles

- 既存の `site-container`、`card-data`、`card-editorial`、`HeaderChrome`、`PageListHeader`、`RobotCard`、`ManufacturerCard` を優先的に再利用する
- 画面幅別の表示差分は、まず `compact / default / detailed` のvariantで表現する
- スマホでは情報を削り、PC/大型モニターでは一覧性または詳細性を増やす
- 表示密度、タップ領域、横スクロール、sticky、overlay、z-indexを毎フェーズで確認する
- データ構造、URLパラメータ、検索ロジックはレスポンシブ対応目的では変更しない
- Homeのワールドマップ演出、RobotCardのホバー演出、比較ページのPC向けD&Dは削除しない
- 未コミットのユーザー変更は戻さない
- 実装後は少なくとも `npm run build` を実行する
- Chrome実測が環境要因で失敗する場合は、その理由と代替確認を明記する

## 3. Target Screen Behavior

| Width | Ideal behavior |
| --- | --- |
| 375px | 1カラム、compact表示、タップ領域44px前後、表はカード化、stickyバーは最小情報 |
| 390-430px | 375pxと同等。検索と主要CTAは全幅、補助リンクは折り返し許容 |
| 768px | 2カラムカード、フィルター2列、詳細ページの本文優先、サイドバーは基本下配置 |
| 1024px | PCナビ開始、詳細ページはサイドバー開始、一覧は3カラム程度 |
| 1280-1440px | 標準PC。比較ページ3カラム、一覧4カラム、本文は読みやすい幅を維持 |
| 1536-1920px | 列数を増やすだけでなくdetailed variantを使い、間延びと情報不足を防ぐ |

## 4. Priority Summary

### High

- Robot detailのspec/decision表をスマホでカード化
- Breadcrumbのスマホ省略・横はみ出し対策
- sticky補助バーのスマホ圧迫解消
- `ManufacturerCard` のcompact variant追加
- Compareのスマホ操作モデル改善
- 小ボタン、タブ、チップ、Selectのタップ領域改善

### Medium

- Robots/Manufacturersのフィルター折りたたみ
- Markdown/記事/ガイドの本文幅調整
- `RobotCard` detailed variant追加
- `2xl` のカード密度調整
- スマホ詳細ページTOCの横チップ化

### Low

- container queries導入検討
- `clamp()` トークン化
- PC向け比較表のsticky header/column化
- Footer細部のタップ領域調整

## 5. Phase 1: Safe Layout Fixes

### Goal

スマホ幅で横はみ出し、長いパンくず、固定幅ラベル、表の読みづらさを先に解消する。

### Target Files

- `components/Breadcrumbs.tsx`
- `src/app/robots/[slug]/page.tsx`
- `components/ManufacturerFactSheet.tsx`
- `components/ManufacturerDetailHero.tsx`
- `components/SourceList.tsx`（長いURLが問題になる場合のみ）

### Implementation

- `Breadcrumbs` は `min-w-0`、最後の項目の `truncate` または `line-clamp-1` を追加する
- スマホでは長い詳細タイトルをパンくず内で全文表示しない
- Robot detailの `decisionRows` / `specRows` は、baseでは `dl` カード表示、`sm` 以上で既存table表示にする
- `ManufacturerFactSheet` の `grid-cols-[8rem_minmax(0,1fr)]` は、375pxでは `grid-cols-1`、`sm` 以上で2列ラベルにする
- URLや長いメーカー名は `break-words` / `break-all` / `min-w-0` を適切に付ける

### Expected Improvements

- 375px: 表の横スクロール依存を減らし、主要スペックを縦に読める
- 390-430px: パンくずとラベル列が本文幅を圧迫しない
- 768px以上: 既存の表形式を維持し、比較しやすさを保つ

### Verification

- `npm run validate:data && npm run build`
- `/robots/unitree-g1`
- `/manufacturers/unitree`
- 長い記事タイトル、長いメーカー名、長いURLを含むページ
- Breadcrumbs の Tab フォーカスと truncate 時のツールチップ有無確認

## 6. Phase 2: Sticky Header and Navigation

### Goal

ヘッダー、モバイルメニュー、sticky contextual headerが375pxで過密にならないようにする。

### Target Files

- `components/HeaderChrome.tsx`（メインナビ。`components/Header.tsx` は存在しない）
- `components/ContextualPageHeader.tsx`
- `components/RobotsHeader.tsx`
- `components/ManufacturersHeader.tsx`
- `components/ReportsHeader.tsx`
- `components/ManufacturerDetailStickyHeader.tsx`
- `components/RobotDetailStickyHeader.tsx`
- `components/PageTabBar.tsx`
- `components/ActiveFilterChips.tsx`
- `components/ScrollToTopIconButton.tsx`

### Implementation

- Mobile menuのリンクに `min-h-11` を付ける
- stickyバー内のタイトルは375pxでは非表示または短縮し、横スクロールナビを優先する
- active filter chipsはスマホでは件数表示または1行横スクロールにする
- `ScrollToTopIconButton` は `h-10 w-10` 程度のタップ領域を持たせる
- `PageTabBar` のタブは `min-h-10` または `min-h-11` にし、狭幅では横スクロールを許容する

### Expected Improvements

- 375px: stickyバーの圧迫を減らし、タップしやすくする
- 768px: タブと選択中フィルターを両立
- 1024px以上: 現在のPC向け情報量を維持

### Verification

- `npm run validate:data && npm run build`
- `/robots`
- `/manufacturers`
- `/reports`
- `/robots/unitree-g1`
- `/manufacturers/unitree`
- sticky表示状態でスクロール、タブ切り替え、フィルター解除
- mobile menu: Tab/Enter キー操作、フォーカストラップ確認
- PageTabBar: 横スクロール時に選択中タブが見切れないか

## 7. Phase 3: Card Variants

### Goal

PC向けカードを単に縮めるのではなく、画面幅と文脈に応じて表示情報を切り替える。

### Target Files

- `components/ManufacturerCard.tsx`
- `components/RobotCard.tsx`
- `components/NewsCard.tsx`（必要なら調整のみ）
- `components/ManufacturersBrowser.tsx`
- `components/RobotsBrowser.tsx`
- `components/FeaturedRobotsGrid.tsx`
- `components/ManufacturerRobotsGrid.tsx`

### Variant Design

```ts
type CardVariant = 'compact' | 'default' | 'detailed';
```

> **型の正本**: `CardVariant` は `lib/cardVariants.ts`（新規）に定義する。`data/types.ts` はデータスキーマ専用のため混入しない。各カードコンポーネントはここから import する。

`ManufacturerCard`:

- `compact`: ロゴ、メーカー名、地域、相談ルート、詳細リンク
- `default`: 現在の4項目表示
- `detailed`: PC/大型画面で説明文、代表ロボット、国内代理店導線を少し増やす

`RobotCard`:

- `compact`: 画像、名称、メーカー、導入段階のみ
- `default`: 現状相当
- `detailed`: PC/大型画面で代表スペック、説明、CTAを追加

### Implementation

- まず `ManufacturerCard` からvariant化する
- 既存呼び出しはdefault維持
- 一覧ページではbaseはcompact、`md` 以上はdefault、`2xl` は必要に応じてdetailedを検討
- `RobotCard` は既にスマホで情報を削っているため、後続でdetailedのみ追加する

### Expected Improvements

- 375px: カード1枚あたりの情報過多を減らす
- 768px: 2カラムで読みやすい密度にする
- 1280px以上: 一覧性を保ちながら必要情報を増やす
- 1920px: 5カラムで薄く見える問題をdetailed表示で緩和

### Verification

- `npm run validate:data && npm run build`
- `/manufacturers`
- `/robots`
- `/manufacturers/unitree`
- Homeの注目ロボット
- 既存の default 呼び出し箇所が visual regression していないか（compact/detailed 追加による巻き込みチェック）

## 8. Phase 4: Tables and Comparison UI

### Goal

スペック表と比較ページを、スマホで「PCの縮小版」ではなく、操作しやすい構造にする。

### Target Files

- `src/app/robots/[slug]/page.tsx`
- `components/CompareClient.tsx`
- `components/ComparisonRobotPanel.tsx`
- `components/compare/CompareParts.tsx`
- 必要なら `components/SpecList.tsx` を新規作成

### 破壊リスク（最高リスクフェーズ）

`CompareClient.tsx` は以下の複合状態を持つ。スマホ UX を追加する際にこれらを壊さないことを最優先にする：

| 状態 | 保護方針 |
|---|---|
| dnd-kit によるドラッグ並び替え | スマホ分岐は `useMediaQuery` または CSS で切り替え。dnd ロジック自体には触らない |
| URL state（`?compare=id,id,...`） | スマホ UI 追加後も同じ URL から共有・復元できることを確認する |
| localStorage お気に入り | クライアントマウント前の hydration 不一致を出さない。既存の `useFavorites` フックを再利用する |
| 上限件数ガード | スマホ追加ボタンでも上限チェックを通す |

### Implementation

- `SpecList` のような小さな共通部品を作り、`table` と `card` variantを持たせる
- Robot detailではbaseで `card`、`sm` 以上で `table`
- Compareのスマホは、メーカー一覧、比較シート、お気に入りをただ縦に積むだけでなく、以下に変更する
  - 上部: 選択中ロボットと追加ボタン
  - 中部: メーカー別ロボット選択リスト
  - 下部: 選択済み比較カード
  - 詳細はスライドインまたはモーダル
- PCでは既存の3カラムD&Dを維持する

### Expected Improvements

- 375px: D&Dに依存せず、タップで追加・削除できる
- 768px: 2カラム程度で比較カードを並べられる
- 1280px以上: 既存D&Dの比較体験を維持

### Verification

- `npm run validate:data && npm run build`
- `/compare`
- 比較ロボット0件、1件、上限件数
- お気に入り未マウント時、空状態、追加済み、削除
- キーボード操作、フォーカス、aria-label
- スマホで追加→URL変化→戻る→URLから復元の一連フロー
- PCのD&D並び替えが壊れていないこと

## 9. Phase 5: Filters and Search UI

### Goal

検索とフィルターがスマホで縦に長くなりすぎる問題を軽減する。

### Target Files

- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/GuidesBrowser.tsx`
- `components/SearchInput.tsx`
- `components/SelectControl.tsx`
- `components/FilterChipGroup.tsx`
- `components/ui/select.tsx`
- `components/ui/searchable-dropdown.tsx`

### Implementation

- Select系は `min-h-11` を基準にする
- Robotsの4フィルターはスマホで折りたたみパネル化を検討する
- フィルター適用中は、stickyバーまたは一覧上部に「選択中件数 / 解除」だけを出す
- chip buttonは `min-h-10` 程度へ拡大する
- 検索入力は既存の `min-h-11` を維持

### Expected Improvements

- 375px: 検索後に一覧へ到達しやすくする
- 768px: 2列フィルターで操作しやすくする
- 1280px以上: 現状の横並び密度を維持

### Verification

- `npm run validate:data && npm run build`
- `/robots?q=...`
- `/manufacturers?country=...`
- `/use-cases`（ComingSoonGate の z-index とフィルター折りたたみの競合がないか確認）
- `/guides`（同上）
- URL更新、戻る/進む、検索入力のIME composition
- フィルター折りたたみ開閉時のフォーカス管理（a11y）

## 10. Phase 6: Typography and Spacing

### Goal

スマホで読みやすく、PC/大型モニターで間延びしない余白と本文幅へ整える。

### Target Files

- `src/app/globals.css`
- `components/Markdown.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `components/PageListHeader.tsx`

### Implementation

- `site-container-content` は大枠1600pxを維持しても、本文カラムは `max-w-[72ch]` 程度に制限する
- Markdown本文は現状の `text-base leading-[1.75]` を維持し、長文幅だけ調整する
- H1/H2は必要箇所だけ `clamp()` またはTailwind arbitrary valueで流体化を検討する
- セクションpaddingは `py-6 sm:py-8 lg:py-10` のように段階化する

### Expected Improvements

- 375px: 見出しが大きすぎず、本文が詰まりすぎない
- 1024px: サイドバー込みでも本文幅が自然
- 1920px: 本文が横に伸びすぎない

### Verification

- `npm run validate:data && npm run build`
- `/reports/[slug]`
- `/guides/[slug]`
- `/use-cases/[slug]`
- 長い見出し、英数字混在、箇条書き、引用、リンク

## 11. Phase 7: Large Screen Behavior

### Goal

1536-1920pxで、単に横に広がるだけ、または中央に小さく固まるだけの見え方を避ける。

### Target Files

- `src/app/globals.css`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/ReportsBrowser.tsx`
- `components/RobotCard.tsx`
- `components/ManufacturerCard.tsx`
- `components/HomeContentNavigator.tsx`

### 依存関係

このフェーズは **Phase 3（Card Variants）の完了後** に着手する。`detailed` variant が未実装の場合、大型画面の情報密度改善は `detailed` なしで進めないこと。

### Implementation

- `2xl:grid-cols-5` は維持するか、カードvariantとセットで判断する
- 大型画面では `detailed` variantまたは説明文追加で情報密度を上げる
- ただし記事本文は広げず、余白とサイドバーでバランスを取る
- Homeのメディア面は大型画面で過剰に間延びしないよう、最大高と内部余白を確認する

### Expected Improvements

- 1536px: 一覧の密度と可読性を両立
- 1920px: 余白が広すぎず、カードが薄く見えない

### Verification

- `npm run validate:data && npm run build`
- `/`
- `/robots`
- `/manufacturers`
- `/reports`
- `/compare`

## 12. Suggested PR Split

### PR 1: Safe Layout Fixes

- Breadcrumb
- Robot detail spec/decision card
- FactSheetのスマホラベル調整
- build検証

### PR 2: Sticky and Navigation

- ContextualPageHeader
- PageTabBar
- ActiveFilterChips
- ScrollToTopIconButton
- Header mobile menu tap target

### PR 3: Card Variants

- ManufacturerCard compact/default
- ManufacturersBrowserで幅別variant適用
- 必要に応じてRobotCard detailedの準備

### PR 4: Compare Mobile UX

- スマホ専用の選択式比較導線
- PC D&D維持
- 空状態、上限、削除、詳細パネル確認

### PR 5: Filters and Typography

- フィルター折りたたみ
- Select/Chipタップ領域
- Markdown本文幅
- Large screen調整

## 13. Manual QA Checklist

- 375px: `/`, `/robots`, `/manufacturers`, `/reports`, `/compare`
- 390-430px: 検索、フィルター、モバイルメニュー、stickyバー
- 768px: 一覧2カラム、詳細本文、下落ちサイドバー
- 1024px: PCナビ、詳細サイドバー、比較2カラムから3カラムへの遷移
- 1280-1440px: 標準PCの一覧密度、比較ページ、記事本文
- 1536-1920px: 大型モニターの間延び、カード密度、本文幅
- キーボード: Tab移動、Enter/Space、Esc、フォーカスリング
- 状態: 空状態、フィルター適用中、検索中、比較0件/上限、長いテキスト、画像欠損

## 14. Done Criteria

- `npm run build` が成功する
- 375pxで意図しない横スクロールがない
- スマホで主要CTA、検索、フィルター、タブ、カードリンクが押しやすい
- Robot detailのspec/decision情報がスマホで読みやすい
- ManufacturerCardがスマホで情報過多にならない
- CompareがスマホでD&Dなしでも使える
- PC/大型モニターで情報密度が落ちすぎない
- 変更範囲と残るリスクが最終報告に明記されている
