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

## 確立済みのデザイン基準（P1〜P9 で決定・実装済み）

以下は既に実装された基準。新しい調査ではこれに合わせているかを検証する。

### レイアウト
- **コンテナ**: `.site-container` = `max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12`
- **z-index**: `--z-overlay:38 / --z-header:40 / --z-dropdown:50 / --z-modal:60 / --z-toast:70`（`z-[var(--z-*)]` 形式で参照）

### タイポグラフィ
- **詳細ページ h1**: `text-2xl md:text-3xl font-semibold leading-tight`
- **コンテンツ節 h2**: `text-lg font-semibold` （robots/reports/use-cases/guides 全詳細ページで統一）
- **ページ最上位節 h2**（ManufacturerDetailSection 等）: `text-xl font-semibold`（例外として許容）
- **グローバル line-height**: h1=1.3 / h2=1.35 / h3,h4=1.4
- **ラベル型セクション見出し**: `text-xs font-medium uppercase tracking-wide text-muted-foreground`

### 縦余白リズム
- **大セクション**: `py-8`（詳細ページ節）
- **ホームページセクション**: `py-8 sm:py-10`
- **見出し下 mb**: `mb-4`（標準）

### カラー（`globals.css` トークン）
- **背景**: `--background: var(--slate-3)`
- **カード**: `--card: var(--slate-1)`（ライト）/ `--card: var(--slate-2)`（ダーク）
- **neutral tag**: `--tone-neutral-bg: var(--slate-4)` / `--tone-neutral-border: var(--slate-7)`
- **色直書き禁止**（Hero 帯・世界地図の黒背景例外を除く）

### カード・インタラクション
- **`.card-data` hover**: `border-ring shadow-sm`（`globals.css`）
- **RobotCard 画像**: ぼかし背景（`blur-2xl brightness-75 saturate-150`）+ `object-contain` 前景
- **RobotImageCarousel 高さ**: `h-[280px] sm:h-[360px] md:h-[420px]`

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

### 観点A: タイポグラフィ
1. h1〜h3 のサイズが確立済み基準と一致しているか
2. h1 にレスポンシブ（`text-2xl md:text-3xl`）が付いているか
3. セクション h2 が `text-lg`（コンテンツ節）または `text-xl`（最上位節）で統一されているか
4. ラベル型とコンテンツ型の見出しが役割分離されているか

### 観点B: 縦余白・スペーシング
1. セクション `py-*` が `py-8`（基準）または正当な理由のある値か
2. 見出し下 `mb-*` が概ね `mb-4` か
3. ページコンテナの `py-*` が適切か

### 観点C: レスポンシブ
1. 375px で横スクロールが発生しないか
2. sm/md ブレークポイントでレイアウト崩れがないか
3. 画像・カードが小画面で切れないか

### 観点D: コンポーネント再利用
1. `EmptyState` を使うべき箇所で独自 `<div>` を使っていないか
2. `TagChip` / `Breadcrumbs` / `SourceList` の使い方が他ページと一致しているか

### 観点E: インタラクション・a11y
1. ドロップダウン・メニューが Radix を使っているか
2. sticky 要素の z-index がトークンを使っているか
3. インタラクティブ要素にフォーカス状態が定義されているか

### 観点F: デザイン方針逸脱
1. 禁止パターンが混入していないか
2. 色の直書きがないか

---

## 出力フォーマット

```
# [ページ名] UI 調査レポート

## 問題一覧

| # | カテゴリ | 問題 | 箇所（file:line） | 重要度 |
|---|---------|------|-----------------|--------|
| 1 | タイポ | h1 に responsive なし | ComponentName.tsx:44 | 中 |
...

## 詳細メモ

各問題について、なぜ問題かを1〜2文で説明。
確立済み基準との差分を明示する（例:「基準は py-8 だが py-12 になっている」）。

## スコープ外（判断が必要なもの）

実装と無関係な設計判断事項のみここに記載。
```

---

## 注意事項

- ファイルを読んだ上で報告する（推測で書かない）
- 「良さそう」な箇所も確認してスコープ外を明示する
- 問題は MECE に（重複なし・漏れなし）
- 実装・編集は一切しない
