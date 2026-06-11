# 比較ページ UI リデザイン 計画 v1

## 背景

Gemini による動画レビューで「全体的にごちゃついた印象・色の意味が不明確」と指摘を受けた。
ただし Gemini は Deploid のデザインシステム（Radix Colors token・Editorial/Dashboard zone・AI感回避ルール）を知らずに評価しているため、提案をそのまま採用するのではなく、**Deploid のデザインシステムと照合して取捨選択する**。

---

## 実装前調査結果

### カラートークン（重要）

| トークン | ライトモード | ダークモード |
|---|---|---|
| `--background` | slate-3 | slate-1 |
| `--card` | slate-1（近白） | slate-2 |
| `--muted` | **slate-3（background と同値！）** | slate-3 |
| `--surface-inset` | slate-4（backgroundより若干暗）| **未定義 → cascade で slate-4 dark が使われ、bg-muted(slate-3)より明るくなる（要追加定義）** |
| `--border-subtle` | slate-5 | — |
| `--primary` | jade-9 | jade-9 |

**核心的な問題**: `bg-muted` = `bg-background` = slate-3 なので、中央シート（`bg-muted`）と各カード（`bg-muted`）が同一色になっており、カードの輪郭が消える。

### 3カラムの現状 bg 一覧

| カラム | 現在の bg | 問題 |
|---|---|---|
| 左サイドバー（メーカーメニュー） | 指定なし → bg-background (slate-3) | 右カラムと色が違う |
| 中央シート（比較ワークスペース） | `bg-muted` = slate-3 | background と同値、深みゼロ |
| 各比較カード (`ComparisonRobotPanel`) | `bg-muted` = slate-3 | シート bg と同値 → カード輪郭消失 |
| 右サイドバー（お気に入り） | `bg-card` = slate-1（近白） | 左と不一致 |

### 左メニュー選択状態

`DraggableMenuRobotButton` の selected:
```
text-primary font-semibold  ← テキスト色変化のみ
```
背景変化・左アクティブバーなし → 一覧の中で見つけにくい

---

## Gemini フィードバックの取捨選択

### 採用する（デザインシステム内で実現可能）

| Gemini 指摘 | 採用する修正 | 根拠 |
|---|---|---|
| デバイダーが目立つ | メーカーグループ間に `border-b border-border-subtle` → 最終要素は `last:border-0` | token 範囲内 |
| 選択中の視覚効果が弱い | 選択ロボットボタンに `border-l-2 border-primary bg-primary/8` 追加 | primary = jade-9 token |
| カードが沈んだ印象 | 中央シートを `bg-surface-inset` に変更 → カード（`bg-muted`）が浮き出る | token 範囲内 |
| 左右カラムの bg 不一致 | 左サイドバーに `bg-card` 追加 → 右サイドバーと統一 | token 範囲内 |
| カード画像が暗い | blur 背景の `brightness-75` → `brightness-85` | Tailwind utility 変更のみ |
| フォント色階層が不明確 | 現状は token 使用済み。メーカー名に `text-sm font-medium` を使いラベル型に揃える | 軽微なスタイル調整 |

### 採用しない（理由付き）

| Gemini 提案 | 不採用の理由 |
|---|---|
| `box-shadow` をカードに追加 | CLAUDE.md 禁止: 過剰なシャドウ・glassmorphism |
| hex 色コード直書き (`#FFFFFF`, `#F8F9FA` 等) | 色は token 経由が原則 |
| 「薄いブルー」のドロップゾーン | Deploid のアクセントは jade (グリーン), blue は使わない |
| 右パネル全体を別コンポーネント分離 | スコープ肥大化。現状の Dialog Drawer は正しい実装 |
| カードの `rounded-xl` 化 | CLAUDE.md 禁止: 過剰な角丸 |

---

## 変更ファイルと差分

### Phase 1: カラム背景の統一（`CompareClient.tsx`）

#### 1-A 左サイドバーに `bg-card` を追加（line ~361）

```diff
  'border border-border transition-[box-shadow,outline-color] duration-200 xl:sticky xl:top-[calc(var(--header-h)+1.5rem)]',
+ 'bg-card',
```

#### 1-B `globals.css` の `.dark` ブロックに `--surface-inset` を追加

**前提**: `--surface-inset` はダークモードで未定義のため、cascade で `var(--slate-4)` dark が使われる。
ダークモードでは slate 値が大きいほど明るくなるため、slate-4 > slate-3 (muted) となり
sheet がカードより明るくなってしまう（カードが沈んで見える）。

`.dark` ブロックに以下を追加する：

```diff
  .dark {
    --surface-raised: var(--slate-2);
+   --surface-inset: var(--slate-2);
    --card-spotlight: ...
  }
```

`slate-2` (dark) は `--card` と同値で、`--muted` (slate-3) より暗い。
→ ダークモードでも sheet (slate-2) がカード (slate-3) より暗くなり、カードが浮き出る ✓

> **観察**: ダークモードでは `--surface-raised` も `var(--slate-2)` であり、`--surface-inset` と同値になる。
> ダークモードは background が最暗値（slate-1）のため、「background より暗い surface」を表現できないという制約上の同値で、意図的。
> 将来どちらかを変更する際は両トークンの意味的乖離が起きないよう注意する。

#### 1-C 中央シートを `bg-muted` → `bg-surface-inset` に変更（`CompareClient.tsx` line ~444）

```diff
- 'border border-border-subtle bg-muted p-3 transition-[box-shadow,outline-color] duration-200',
+ 'border border-border-subtle bg-surface-inset p-3 transition-[box-shadow,outline-color] duration-200',
```

**効果**:
- ライトモード: sheet = slate-4（暗）、カード = slate-3（明）→ カードが浮き出る ✓
- ダークモード: sheet = slate-2（暗）、カード = slate-3（明）→ カードが浮き出る ✓

#### 1-D メーカーグループ間にセパレーターを追加（line ~378付近の`div key={manufacturer.slug}`）

```diff
- <div key={manufacturer.slug}>
+ <div key={manufacturer.slug} className="border-b border-border-subtle last:border-0">
```

`divide-y` ではなく各グループ下端に `border-b` を置くことで、最終要素の下線を `last:border-0` で消せる。

### Phase 2: 選択状態の強化（`CompareParts.tsx`）

`DraggableMenuRobotButton` の selected ブランチを変更（line ~75-99）:

```diff
  className={cn(
-   'group flex w-full items-center justify-between gap-3 py-1.5 pl-6 pr-3 text-left text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
+   'group flex w-full items-center justify-between gap-3 py-1.5 pr-3 text-left text-[11px] transition-colors border-l-2 disabled:cursor-not-allowed disabled:opacity-50',
    isSelected
-     ? 'text-primary hover:bg-muted/60'
-     : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground',
+     ? 'border-primary bg-primary/8 pl-[22px] text-primary hover:bg-primary/12'
+     : 'border-transparent pl-[22px] text-foreground/70 hover:bg-muted/60 hover:text-foreground',
  )}
```

**修正のポイント**:
- `pl-6` を base class から削除し、両ブランチに `pl-[22px]` を設定する
- `border-l-2` を base class に移動し、両ブランチで「色だけ」切り替える
- 結果: `border(2px) + padding(22px) = 24px` = 元の `pl-6(24px)` と同幅 → ガタつきなし
- `cn()` = `twMerge(clsx(...))` 確認済み → `pl-[22px]` が `pl-6` を上書きするが、base から削除するため依存なし
- `brightness-85` はデフォルトスケール外のため `brightness-[85]`（arbitrary value）を使用（後述）

### Phase 3: カード輝度調整（`ComparisonRobotPanel.tsx`）

blur 背景の brightness を少し上げる（line ~73）:

```diff
- className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-110 object-cover blur-2xl brightness-75 saturate-150"
+ className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-110 object-cover blur-2xl brightness-[85] saturate-150"
```

**注意**: `brightness-85` は Tailwind デフォルトスケール外（75 / 90 / 95 ... の間）。`brightness-[85]` の arbitrary value 記法を使う。`brightness-90` も選択肢だが、75→90 は変化が大きすぎるため中間値の 85% を採用。

---

## 変更しないもの（理由）

| 要素 | 変更しない理由 |
|---|---|
| カードの `rounded-lg` | 現在の角丸は適切。xl化はしない |
| `aspect-[5/7]` 縦長比率 | トレーディングカードデザインの核心 |
| ドラッグ overlay の `shadow-2xl` | すでに機能的で適切 |
| `CompareInsertionPreviewCard` の `border-dashed border-ring` | 挿入位置ガイドとして正しい |
| Dialog の右スライドイン | 正しい実装。別コンポーネント化は不要 |
| 右サイドバーの `bg-card` | 変更しない（左を揃える方向） |
| テキストトークン (`text-foreground` / `text-muted-foreground`) | すでに正しく階層化されている |

---

## 影響範囲

| ファイル | 変更種別 | 副作用リスク |
|---|---|---|
| `src/app/globals.css` | `.dark` ブロックに `--surface-inset: var(--slate-2)` 追加 | 低（`bg-surface-inset` を使う箇所のみ影響。現在は比較ページのみ） |
| `components/CompareClient.tsx` | bg クラス追加・変更、グループ border 追加 | 低（CSS のみ） |
| `components/compare/CompareParts.tsx` | `DraggableMenuRobotButton` className 変更 | 低（見た目のみ）|
| `components/ComparisonRobotPanel.tsx` | blur bg の brightness 変更 | 低（画像表示の輝度のみ） |

**変わらない**: データ取得・DnD ロジック・URL state・Dialog 開閉・a11y 属性

---

## 実装手順

1. `src/app/globals.css` — `.dark` ブロックに `--surface-inset: var(--slate-2)` 追加（Phase 1-B 前提）
2. `components/CompareClient.tsx` — Phase 1-A/C/D（左サイドバー bg・中央シート bg・グループ border）
3. `components/compare/CompareParts.tsx` — Phase 2（DraggableMenuRobotButton selected state）
4. `components/ComparisonRobotPanel.tsx` — Phase 3（blur bg を `brightness-[85]` に変更）
5. `npm run build` 確認

---

## 手動確認チェックリスト

- [ ] 左サイドバーが `bg-card`（白系）になっており右サイドバーと同トーンか
- [ ] 中央シートが若干暗い `bg-surface-inset` でカードが浮き出て見えるか
- [ ] メーカーグループ間に薄い区切り線があり、最後のグループには線がないか
- [ ] ロボット選択時にボタン左端に primary（jade）の縦バーと薄い背景色が出るか
- [ ] 非選択→選択のトグル時にボタンの横幅・配置がガタつかないか（border-l-2 両状態で統一）
- [ ] カード画像が以前より少し明るく（暗すぎない）見えるか
- [ ] ダークモードで不自然な色抜けがないか
- [ ] DnD（ドラッグ・ドロップ）が壊れていないか
- [ ] Dialog（詳細パネル）の開閉が正常か
- [ ] モバイル（375px）で横スクロールが発生しないか

---

## `bg-primary/8` の確認事項

Tailwind v4 + `@theme inline` では `bg-primary/8` が `background-color: color-mix(in oklch, var(--primary) 8%, transparent)` として解釈される。
既存コードで `hover:bg-muted/60` が使われており（`CompareParts.tsx:79`）、同形式の opacity modifier は問題なく動作することが確認済み。
