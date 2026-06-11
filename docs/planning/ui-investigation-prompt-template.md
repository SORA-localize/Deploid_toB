# Deploid UI 調査プロンプト テンプレート

このファイルを CLI に貼り付けると、任意のページ・コンポーネント群の UI 問題を
調査レポート形式で出力させられる。実装は行わない（調査専用）。

---

## 使い方

1. 「調査対象」欄に調査したいページ・コンポーネントを書く
2. このファイルの内容をそのまま Claude Code に貼り付けて送信

---

## 調査対象（ここを書き換えて使う）

- ページ: `/manufacturers/[slug]`
- 主要コンポーネント: `ManufacturerDetailHero`, `ManufacturerFactSheet`, `ManufacturerDetailSection`, `ManufacturerDetailSectionNav`

---

## プロジェクト概要（固定）

**Deploid** — 日本語 B2B ヒューマノイドロボット導入判断ポータル。
Next.js 16 + React 19 + TypeScript（App Router）。Tailwind v4（`@theme inline`）＋ Radix Colors（slate/jade）。`shadcn`・`framer-motion`・`lucide-react`。

**パス注記**: コンポーネントはリポジトリ直下 `components/`（`@/components` → `./components`）。ページは `src/app/`。

---

## 確立済みのデザイン基準（実装と同期済み）

以下は実装済みの基準。調査ではこれに合っているかを検証する。

### ゾーン設計（最重要）

Deploid は **Editorial Broadsheet × Product Dashboard** のハイブリッド。  
セクションが Editorial ゾーンか Dashboard ゾーンかによってレイアウトルールが異なる。

| ゾーン | 対象 | 正しいパターン |
|---|---|---|
| **Editorial**（読む場所） | 詳細ページの本文セクション（robots/reports/guides/use-cases/[slug] の本文） | `<section>` + `border-b border-border pt-6 pb-8` |
| **Dashboard**（操作する場所） | 一覧ページのカード、RelatedLinkList、サイドバーウィジェット、compare | `.card-data`、`.card-editorial`、`border border-border bg-card` |

**Editorial ゾーンでの禁止パターン**: `border border-border bg-card p-*` でセクションを包む。

**実装参照基準**:
- Editorial: `src/app/robots/[slug]/page.tsx`（`border-b + py-8` のディバイダー設計）
- Dashboard: `src/app/robots/page.tsx`（`.card-data` グリッド）
- ホームページの `section.border-b` もEditorialゾーンの正例

### レイアウト

- **通常コンテナ**: `.site-container` = `max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12`
- **詳細ページ本文コンテナ**: `.site-container-content` = `max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-12`（reports/guides の本文エリアに使用。use-cases は col-span-8 のため site-container 維持）
- **z-index**: `--z-overlay:38 / --z-header:40 / --z-dropdown:50 / --z-modal:60 / --z-toast:70`（`z-[var(--z-*)]` 形式で参照）

### タイポグラフィ

- **詳細ページ h1**: `text-2xl md:text-3xl font-semibold leading-tight`
- **本文セクション h2**: `text-lg font-semibold`（Editorial・Dashboard 共通）
- **最上位節 h2**（ManufacturerDetailSection 等）: `text-xl font-semibold`（例外として許容）
- **グローバル line-height**: h1=1.3 / h2=1.35 / h3,h4=1.4
- **ラベル型セクション見出し**: `text-xs font-medium uppercase tracking-wide text-muted-foreground`

### 縦余白リズム

- **Editorial セクション**: `pt-6 pb-8`（section 自身が余白を内蔵）
- **セクション間区切り**: `border-b border-border`（最終セクションは `border-b` なし）
- **Dashboard セクション**: `py-8`（詳細ページ内の大節）
- **ホームページセクション**: `py-8 sm:py-10`
- **見出し下 mb**: `mb-4`（標準）

### カラー（`globals.css` トークン）

- **背景**: `--background: var(--slate-3)`（ライト）
- **カード**: `--card: var(--slate-1)`（ライト）/ `--card: var(--slate-2)`（ダーク）
- **neutral tag**: `--tone-neutral-bg: var(--slate-4)` / `--tone-neutral-border: var(--slate-7)`
- **色直書き禁止**（Hero 帯・世界地図の黒背景例外を除く）

### カード・インタラクション

- **`.card-data` hover**: `border-ring shadow-sm`（`globals.css`）
- **`.card-editorial` hover**: `border-foreground/30`（`globals.css`）
- **RobotCard 画像**: ぼかし背景（`blur-2xl brightness-75 saturate-150`）+ `object-contain` 前景
- **RobotImageCarousel 高さ**: `h-[280px] sm:h-[360px] md:h-[420px]`

### SourceList・RelatedLinkList

- **RelatedLinkList**: Dashboard 要素。ボックスを維持する（変更対象外）
- **SourceList の Editorial ゾーンでの使い方**: `className="scroll-mt-site-header mt-6 pt-6 border-t border-border"` を渡す（デフォルトのボックスを上書き）。wrapper div は不要（SourceList 自身が `id="sources"` を持つ）

### a11y

- ドロップダウンは Radix Popover/Select/SearchableDropdown（`Escape` / focus 復帰必須）
- ソースコード内の独自 `useState` + `pointerdown` メニューは置換対象

### EmptyState

- `EmptyState` コンポーネントを使用（`message` / `variant` / `size` / `className` / `icon?` / `description?`）

---

## 禁止パターン（CLAUDE.md AI感回避ルール）

調査でこれらを見つけた場合は問題として列挙する：

- 紫〜青グラデーション、巨大中央寄せヒーロー
- 過剰な `rounded-xl` / shadow / glassmorphism
- アイコン付き角丸カード3枚の「特徴」セクション
- グラデーション（Hero 帯・世界地図以外）
- 色の直書き（token 外）

---

## 調査指示

以下の観点で **コードを読んで** 問題を列挙する。実装・編集は一切しない。

### 観点A: ゾーン設計準拠（最優先）

1. このページは Editorial ゾーンか Dashboard ゾーンか、または混在か
2. Editorial ゾーンの本文セクションが `border border-border bg-card p-*` でボックス化されていないか
3. Editorial ゾーンのセクションが `section + border-b border-border pt-6 pb-8` パターンを使っているか
4. Dashboard ゾーンのカードが `.card-data` / `.card-editorial` を使っているか
5. `site-container` / `site-container-content` の使い分けが適切か（reports/guides 本文エリアは `site-container-content`）

### 観点B: タイポグラフィ

1. h1〜h3 のサイズが確立済み基準と一致しているか
2. h1 にレスポンシブ（`text-2xl md:text-3xl`）が付いているか
3. セクション h2 が `text-lg`（本文）または `text-xl`（最上位節）で統一されているか
4. ラベル型とコンテンツ型の見出しが役割分離されているか

### 観点C: 縦余白・スペーシング

1. Editorial セクションが `pt-6 pb-8` の余白を持っているか
2. Editorial セクションの最終要素が `border-b` を持っていないか（最後のセクションに罫線は不要）
3. Dashboard の大節が `py-8` か
4. 見出し下 `mb-*` が概ね `mb-4` か
5. `space-y-*` wrapper が残っていないか（Editorial ゾーンではセクション自身が余白を内蔵するため不要）

### 観点D: レスポンシブ

1. 375px で横スクロールが発生しないか
2. sm/md ブレークポイントでレイアウト崩れがないか
3. 画像・カードが小画面で切れないか
4. `xl:` / `2xl:` ブレークポイントが必要な箇所に使われているか（一覧グリッドは `xl:grid-cols-4` 推奨）

### 観点E: コンポーネント再利用

1. `EmptyState` を使うべき箇所で独自 `<div>` を使っていないか
2. `TagChip` / `Breadcrumbs` / `SourceList` / `RelatedLinkList` の使い方が他ページと一致しているか
3. SourceList が Editorial ゾーンでボックスのまま（デフォルト className）になっていないか
4. RelatedLinkList の wrapper div に `border border-border bg-card` が重複付与されていないか

### 観点F: インタラクション・a11y

1. ドロップダウン・メニューが Radix を使っているか
2. sticky 要素の z-index が `z-[var(--z-*)]` トークンを使っているか
3. インタラクティブ要素にフォーカス状態が定義されているか
4. TOC のある詳細ページで、anchor 先に `scroll-mt-site-header` が付いているか

### 観点G: デザイン方針逸脱

1. 禁止パターン（グラデ・過剰角丸・glassmorphism）が混入していないか
2. 色の直書きがないか（Hero 帯・世界地図の黒背景例外を除く）
3. RobotCard の motion アニメーション（tilt/glow/shimmer）が無効化されていないか

---

## 出力フォーマット

```
# [ページ名] UI 調査レポート

## ゾーン判定

Editorial ゾーン / Dashboard ゾーン / 混在（本文=Editorial、カード=Dashboard）
[根拠を1〜2行]

## 問題一覧

| # | 観点 | 問題 | 箇所（file:line） | 重要度 |
|---|------|------|-----------------|--------|
| 1 | A-2  | Editorial 本文セクションがボックス化されている | page.tsx:120 | 高 |
| 2 | B-2  | h1 に responsive なし | ComponentName.tsx:44 | 中 |
...

## 詳細メモ

各問題について、なぜ問題かを1〜2文で説明。
確立済み基準との差分を明示する（例:「基準は section+border-b だが border border-border bg-card になっている」）。

## スコープ外（判断が必要なもの）

実装と無関係な設計判断事項のみここに記載。
```

---

## 注意事項

- ファイルを読んだ上で報告する（推測で書かない）
- 「良さそう」な箇所も確認してスコープ外を明示する
- 問題は MECE に（重複なし・漏れなし）
- 観点 A（ゾーン設計）を最初に判定してから他の観点を進める
- 実装・編集は一切しない
