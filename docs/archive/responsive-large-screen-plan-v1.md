# レスポンシブ・大画面対応 実装計画 v1

## 背景と目的

27インチモニター（2560px幅）で、ラップトップと同じコンテンツ幅・列数しか表示されない問題を解決する。
あわせてモバイル表示の改善方針を整理する。

ユーザーが感じた問題を概念として整理する：

| 概念 | 説明 | 現状 |
|---|---|---|
| **Max-width container** | コンテナの最大幅制限 | `max-w-[1440px]` 固定。2560px画面で各辺560px余白 |
| **Fluid grid** | 画面幅に応じてカラム数が自動変化 | `2xl:` ブレークポイント未定義。27" でも4列止まり |
| **Line-length limit** | 本文テキストの行長制限（Editorial ゾーン） | `col-span-7` 等で維持済み。問題なし |
| **Mobile-first responsive** | モバイルから拡張するレスポンシブ設計 | 基本実装済みだが、ナビが `absolute dropdown` |

---

## 調査結果

### グリッド現状

| コンポーネント | 現在のブレークポイント | 問題 |
|---|---|---|
| `RobotsBrowser.tsx:119` | `cols-1 md:2 lg:3 xl:4` | `2xl:` なし |
| `ManufacturersBrowser.tsx:130` | `cols-1 md:2 lg:3 xl:4` | `2xl:` なし |
| `ReportsBrowser.tsx:119` | `cols-1 sm:2 lg:3 xl:4` | `2xl:` なし |
| `FeaturedRobotsGrid.tsx:26` | `cols-1 md:2 lg:3` | `xl:` / `2xl:` なし |
| ホーム最新記事 `page.tsx:113` | `cols-1 sm:2 lg:4` | xl/2xl なし（ただし4列は多め） |
| `CompareClient.tsx:479` | `cols-1 sm:2 xl:3` | 比較UIとして適切。変更対象外 |
| `UseCasesBrowser.tsx:128` (featured) | `cols-1 md:2` | 意図的（長い説明テキスト）。変更対象外 |

### コンテナ現状

- `site-container` = `max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12` — 全ページ共通
- `site-container-content` = `max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-12` — reports/guides 詳細のみ

### モバイルナビ現状

- `Header.tsx:106-143`: `isMenuOpen` state → `absolute top-full` 位置の dropdown
- `grid grid-cols-2` で2列ナビ表示
- body `overflow: hidden` で背景スクロール防止
- 機能は問題ないが、Drawer UIではない

---

## 変更スコープと方針

### スコープの優先順位

```
Phase 1（小・安全）:  グリッド 2xl: ブレークポイント追加
Phase 2（中・設計判断要）: リストページ コンテナ幅の responsive 化
Phase 3（大・依存追加）: モバイルナビ Drawer 化
```

**Phase 1 と 2 は今回の実装対象。Phase 3 は方針確認後に別 PR。**

### 設計判断: コンテナ幅の方針

2つの選択肢がある。今回は **Option B** を採用する。

**Option A**: カードグリッドページ専用の広いコンテナ `site-container-wide` を新設する
- `max-w-[1600px]` または `max-w-[1920px]`
- リストページのみに適用
- 問題: Header も `site-container` を使っており、幅不一致が起きる。または Header も追従させる必要がある

**Option B**: `site-container` 自体に `2xl:max-w-[1600px]` を追加（採用）
- `globals.css` の `.site-container` に `2xl:max-w-[1600px]` を追加するだけ
- Header・Footer・すべてのページが自動的に追従
- 2xl:（1536px以上 = 27インチ相当）でのみ幅が広がる
- `site-container-content` も `2xl:max-w-[1920px]` に拡張

**Option B の理由**: Header との幅一致が最も重要。全体で統一した方が破綻が少ない。

---

## Phase 1: グリッド 2xl: ブレークポイント追加

### 変更ファイル

#### `components/FeaturedRobotsGrid.tsx:26`

```diff
- <div className="robot-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
+ <div className="robot-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

理由: ホームページの注目ロボットが lg で3列止まり。`xl:` でラップトップの大画面から4列になるべき。

#### `components/RobotsBrowser.tsx:119`

```diff
- <div className="robot-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
+ <div className="robot-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
```

#### `components/ManufacturersBrowser.tsx:130`

```diff
- <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
+ <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
```

#### `components/ReportsBrowser.tsx:119`

```diff
- <CardHoverEffect className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
+ <CardHoverEffect className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-stretch">
```

#### ホームページ最新記事 `src/app/page.tsx:113`

現在 `lg:grid-cols-4` で止まっており、xl・2xl で変化なし。
ホームのこのセクションは「プレビュー4件」という設計なので 4列 cap は意図的と判断し **変更しない**。

### 変更しないファイル

- `CompareClient.tsx` — 比較UIの3列は機能要件として適切
- `UseCasesBrowser.tsx` — 用途カードは長テキストのため2列 cap が適切
- `GuidesBrowser.tsx` — リスト形式（グリッドではない）
- 詳細ページ群 — Editorial ゾーン、col-span 設計済み

---

## Phase 2: コンテナ幅の responsive 化

### 変更ファイル

#### `src/app/globals.css`

**`site-container` のみ** `2xl:` max-w を追加する。`site-container-content` は変更しない。

> **副作用メモ**: この変更により `2xl:` 以上では `site-container`（1600px）と `site-container-content`（1600px）の max-w が同値になる。padding は異なる（site-container は `2xl:px-16`、site-container-content は `lg:px-12` のまま）ため実害はないが、将来 `site-container-content` を拡張する際は混同に注意。

```css
.site-container {
  @apply mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16;
}

/* site-container-content は max-w-[1600px] のまま据え置き（理由は下記リスク欄） */
```

`2xl:px-16` を追加する理由: 1600px コンテナで `px-12` は内側が詰まりすぎる。余白を維持しつつ使用可能幅を広げる。

### なぜ `site-container-content` を拡張しないか（コード調査済み）

**use-cases 確認結果**: `src/app/use-cases/[slug]/page.tsx` は `site-container` を使用（`site-container-content` ではない）。ui-investigation-prompt-template.md の記載が正しい。

**reports/guides 詳細の本文幅計算**:

| 状態 | コンテナ幅 | padding | 使用可能幅 | col-span-7 テキスト列 |
|---|---|---|---|---|
| 現状（xl以下） | 1600px | lg:px-12 (96px) | 1504px | 1504 × 7/12 ≈ **878px** |
| 2xl で拡張した場合 | 1920px | 2xl:px-16 (128px) | 1792px | 1792 × 7/12 ≈ **1045px** |

コード確認: `max-w-3xl`（768px）は reports/guides の **hero 内の h1・summary にのみ**設定（`:150`, `:153`, `:77`, `:80`）。本文 body セクション内には行長制限なし。1045px は読み物としての長さを超えるため、`site-container-content` の 2xl 拡張は行わない。

**use-cases への `site-container` 拡張の影響**:
- use-cases/[slug] は `site-container`（1440px → 2xl:1600px）を使用、`col-span-8`
- 2xl 時: (1600 - 128) × 8/12 ≈ **981px** のテキスト列
- use-cases は本文パラグラフが短く、構造化データ（atAGlance 3列グリッド等）が混在するため 981px は許容範囲と判断

### リスク

- Header が `site-container` を使っているため、`2xl:` で自動追従 → Header/Footer との幅一致が維持される
- `2xl:max-w-[1600px]` は 2560px 画面で各辺 480px 余白 — 余裕のある余白
- use-cases 本文 col-span-8 が 2xl で ~981px になる（許容。ただし読み物として長い段落を増やす場合は max-w ガードを別途検討）

---

## Phase 3: モバイルナビ Drawer 化（今回スコープ外、方針のみ）

### 現状の問題

`Header.tsx` のモバイルメニューは `absolute` dropdown で機能する。
具体的な UX 問題:
- タップターゲットが `py-2 text-sm` の小さいリンクのみ
- 背景 overlay の tap-to-close はあるが、スワイプ dismiss がない
- `grid grid-cols-2` の2列ナビは項目が増えると見辛い

### 推奨アプローチ

**`vaul`（Vercel製 Drawer）を使うことを推奨しない理由**:
- 依存追加が必要
- 現状の dropdown は機能しており、B2Bサイトでボトムシートは大げさ

**推奨: Header.tsx 内で `block lg:hidden` の `<nav>` を右スライドイン Drawer として実装**
- Radix Dialog (`@radix-ui/react-dialog`) は既存依存にある可能性が高い
- スライドイン `translate-x-full → translate-x-0` の CSS transition で実現可能
- 追加依存なし

この変更は Header の変更範囲が大きいため別 PR にする。

---

## 実装手順

Phase 1（グリッド）→ Phase 2（コンテナ）の順で進める。グリッド変更は CSS クラスの追記のみで安全。コンテナ変更はグローバル影響があるため後で確認しやすいよう分ける。

**Phase 1: グリッド 2xl: ブレークポイント追加**

1. `FeaturedRobotsGrid.tsx:26` — `xl:grid-cols-4` 追加
2. `RobotsBrowser.tsx:119` — `2xl:grid-cols-5` 追加
3. `ManufacturersBrowser.tsx:130` — `2xl:grid-cols-5` 追加
4. `ReportsBrowser.tsx:119` — `2xl:grid-cols-5` 追加

**Phase 2: コンテナ幅 responsive 化**

5. `globals.css` — `.site-container` に `2xl:max-w-[1600px] 2xl:px-16` 追加

**検証**

6. `npm run build` でエラーがないことを確認

---

## 影響範囲

**変更する**: `globals.css`, `FeaturedRobotsGrid.tsx`, `RobotsBrowser.tsx`, `ManufacturersBrowser.tsx`, `ReportsBrowser.tsx`

**変わる挙動**:
- `xl:`（viewport ≥ 1280px）: `FeaturedRobotsGrid` がホームで3列 → 4列に変化。ラップトップ幅でも発動する。
- `2xl:`（viewport ≥ 1536px）: ロボット/メーカー/記事一覧が4列 → 5列に変化。`site-container` 幅が 1440px → 1600px に拡張。

**変わらない**: Compare・Guides・use-cases（一覧/詳細）・reports/guides 詳細ページ・Header・Footer の見た目

---

## 検証コマンド

```bash
npm run build
```

---

## 手動確認チェックリスト

### 2xl: 確認（2560px または Chrome DevTools で 2xl 幅にリサイズ）

- [ ] `/robots` — 5列グリッドになるか
- [ ] `/manufacturers` — 5列グリッドになるか
- [ ] `/reports` — 5列グリッドになるか
- [ ] `/` ホーム 注目ロボット — 4列になるか（FeaturedRobotsGrid）
- [ ] Header の幅がコンテンツグリッドと一致しているか（左右揃いで崩れていないか）
- [ ] Footer の幅が Header と一致しているか

### xl: 確認（1280px〜1536px のラップトップ）

- [ ] `/robots` — 4列（現状と同じ。変化なし）
- [ ] `/` ホーム 注目ロボット — `xl:grid-cols-4` になるか（現在は lg:3 止まり → 改善確認）

### 通常画面（1440px 典型ラップトップ）

- [ ] 全ページで横スクロールが発生しないか
- [ ] 比較ページが崩れていないか
- [ ] Reports/Guides 詳細ページの本文幅が許容範囲か

### モバイル（375px）

- [ ] 全ページで横スクロールが発生しないか（`2xl:` 変更がモバイルに影響しないこと）

---

## 残るリスク

| リスク | 内容 | 対策 |
|---|---|---|
| カード幅が狭すぎる | 5列時、1600px コンテナで1列 ≈ (1600-128)/5 ≈ 294px。RobotCard の最小幅要件を超えるか | 手動確認で目視 |
| `2xl:px-16` の影響 | padding 増加でコンテンツ幅が実質減少するページがないか（1440→1600px 拡張と px-12→px-16 の差し引き計算: 1344→1472px、純増 +128px） | build + 目視確認 |
| use-cases 本文の 2xl 幅 | col-span-8 が ~981px になる。現状は読み物テキストが少なく許容範囲だが、コンテンツ追加時に注意 | 現時点は目視確認のみ |

---

## 変更しない判断の理由

- `max-w-[1440px]` を撤廃してコンテナ幅を無制限にしない — 行長制限のある Editorial ゾーンが壊れる
- `UseCasesBrowser` に `2xl:grid-cols-3` を追加しない — 用途カードは長テキストで横並び3列だと読みにくい
- `GuidesBrowser` をグリッド化しない — リスト形式はデザイン上の意図（記事タイトル+説明を1行で読む）
