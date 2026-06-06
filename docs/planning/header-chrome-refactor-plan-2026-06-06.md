# Header Chrome リファクタリング計画

作成日: 2026-06-06  
対象ブランチ: `experiment/header-chrome-refactor`  
前提: `main` は `f566ce4` まで push 済み

---

## 目的

グローバル Header と、スクロール後に出る下段 contextual bar の現行挙動は維持したまま、実験実装で増えた責務の混在と重複を整理する。

今回のリファクタリングでは、見た目、表示閾値、URL state、filter state、tab state は変えない。

---

## 調査したファイル

| ファイル | 確認内容 |
|---|---|
| `components/Header.tsx` | Header 本体、モバイルメニュー、`HeaderStickyBarSlot` の配置 |
| `components/HeaderChrome.tsx` | Header 下段 bar の context/provider |
| `components/StickyPageHeader.tsx` | ページ側 registration と slot 描画が同居 |
| `components/RobotsHeader.tsx` | robot tab、filter chips、上矢印、sticky visibility |
| `components/ManufacturersHeader.tsx` | title、filter chips、上矢印、sticky visibility |
| `components/ReportsHeader.tsx` | report tab、上矢印、sticky visibility |
| `lib/useStickyScroll.ts` | scroll 閾値と hysteresis |
| `lib/siteLayout.ts` | Header 高さの正本 |
| `lib/scroll.ts` | ページ先頭スクロール helper |
| `components/ScrollToTopButton.tsx` | Footer 用 scroll-to-top button |
| `src/app/layout.tsx` | `HeaderChromeProvider` の配置 |
| `src/app/globals.css` | `--header-h`、anchor/sticky offset class |
| `package.json` | 検証 script は `build` と `validate:data` |

---

## 現在の問題

### 1. `StickyPageHeader.tsx` の責務が混ざっている

`StickyPageHeader` はページ側から「Header 下段に表示する内容」を登録する API だが、同じファイル内に Header 側で使う `HeaderStickyBarSlot` も置かれている。

結果として、`Header.tsx` が `StickyPageHeader.tsx` から slot を import しており、依存方向が読み取りづらい。

分類: 責務混在、命名不一致。

### 2. scroll-to-top の小ボタンが3箇所で重複している

`RobotsHeader`、`ManufacturersHeader`、`ReportsHeader` が `ArrowUp` import、button class、`aria-label`、`scrollToPageTop` をそれぞれ持っている。

分類: DRY 違反。ただし単純な UI 重複なので、過剰な汎用化は不要。

### 3. sticky bar の表示 hook 名が実態より曖昧

`useStickyScroll()` は「sticky かどうか」ではなく「Header 下段 contextual bar を表示するか」を返している。実装の意味が変わったあとも名前が以前のまま。

分類: 命名不一致、状態管理の曖昧さ。

### 4. 表示アニメーション値が局所に散っている

`StickyPageHeader.tsx` に `EXIT_DURATION_MS = 320` があり、Tailwind class 側には `duration-300` が直書きされている。意図としては exit transition 後に unmount するための buffer だが、読み手には関係が分かりづらい。

分類: 仕様値の説明不足。大きな問題ではない。

### 5. Header chrome と page header の境界名がまだ仮実装っぽい

`HeaderChromeProvider`、`HeaderStickyBar`、`StickyPageHeader` の役割自体は妥当だが、「page が登録する」「Header が描画する」の境界を型・命名・ファイル構成で表現しきれていない。

分類: 責務境界の曖昧さ。

---

## 変更前後の責務分担

### 変更前

| 領域 | 主な責務 | ファイル |
|---|---|---|
| Header shell | グローバル nav、mobile menu、下段 slot の配置 | `Header.tsx` |
| Header chrome state | 下段 bar の content/visible state | `HeaderChrome.tsx` |
| Page API + Header slot | 下段 bar の登録、表示アニメーション、slot 描画 | `StickyPageHeader.tsx` |
| Page-specific content | tabs、chips、title、top button、URL更新 | `RobotsHeader.tsx` / `ManufacturersHeader.tsx` / `ReportsHeader.tsx` |
| Visibility | scroll threshold/hysteresis | `useStickyScroll.ts` |

### 変更後

| 領域 | 主な責務 | ファイル |
|---|---|---|
| Header shell | グローバル nav、mobile menu、下段 slot の配置 | `Header.tsx` |
| Header chrome state + slot | 下段 bar の state、slot描画、mount/unmount animation | `HeaderChrome.tsx` |
| Page registration API | page から Header chrome へ content/visible を登録する薄い wrapper | `StickyPageHeader.tsx` |
| Shared top action | compact / footer の scroll-to-top button | `ScrollToTopButton.tsx` または新規小コンポーネント |
| Page-specific content | tabs、chips、title、URL更新 | `RobotsHeader.tsx` / `ManufacturersHeader.tsx` / `ReportsHeader.tsx` |
| Visibility | Header 下段 bar の表示判定 | rename 後の hook |

---

## リファクタ方針

### Phase 1: slot を Header chrome 側へ移す

変更:

- `HeaderStickyBarSlot` を `components/StickyPageHeader.tsx` から `components/HeaderChrome.tsx` へ移動する
- `Header.tsx` の import を `@/components/HeaderChrome` に変更する
- `StickyPageHeader.tsx` は registration だけを持つ薄い component にする

理由:

- Header が描画するものは Header chrome 側に置く方が依存方向が自然
- ページ側 API と Header 側 slot を分けることで、実験実装の仮感を減らせる

挙動影響:

- なし。DOM構造、className、transition、context値は維持する。

### Phase 2: scroll-to-top compact button を共通化する

候補:

- 既存 `ScrollToTopButton` に `variant="footer" | "icon"` を足す
- もしくは `ScrollToTopIconButton` を新規追加して、sticky bar 3箇所だけで使う

推奨:

- `ScrollToTopButton` の責務を広げすぎないため、`ScrollToTopIconButton` を新規追加する
- className と aria-label を1箇所に寄せる
- Footer の `ScrollToTopButton` は表示ラベルつきなので、そのまま維持する

理由:

- sticky bar の上矢印は3箇所で同一
- Footer button とは視覚仕様が違うため、無理に variant 化すると component が曖昧になる

挙動影響:

- なし。クリック時は引き続き `scrollToPageTop()` を使う。

### Phase 3: visibility hook を実態に合わせて rename する

変更:

- `useStickyScroll()` を `useHeaderStickyBarVisibility()` に rename する
- 利用箇所3つを更新する
- 閾値値は変更しない

代替:

- 互換 export として `useStickyScroll` を残す

推奨:

- 現在の利用箇所は3箇所だけなので、互換 export は残さず rename でよい

理由:

- 現在は CSS sticky の状態取得ではなく、下段 bar の表示判定になっている
- 名前を直すだけで、次に触る人が実装意図を追いやすくなる

挙動影響:

- なし。hook 内のロジックは維持する。

### Phase 4: animation 定数の意図を明確にする

変更:

- `EXIT_DURATION_MS` を slot と同じファイルへ移す
- `EXIT_DURATION_MS` は Tailwind `duration-300` より少し長い unmount delay であることを短くコメントする
- visual timing は変更しない

挙動影響:

- なし。

---

## 今回やらないこと

- 下段 bar の出入りタイミング、閾値、アニメーションの見た目変更
- Header と下段 bar の DOM 構造変更
- scroll/resize の新しい測定ロジック追加
- URL param、filter state、tab state の設計変更
- `RobotsHeader` / `ManufacturersHeader` / `ReportsHeader` の大きな汎用 component 化
- Guides / UseCases への sticky bar 展開
- `HeaderChromeProvider` の複数 slot 対応

---

## 変更ファイル候補

### 変更する

| ファイル | 変更内容 |
|---|---|
| `components/HeaderChrome.tsx` | `HeaderStickyBarSlot` と animation 定数を移動 |
| `components/Header.tsx` | slot import 元を変更 |
| `components/StickyPageHeader.tsx` | registration 専用に整理 |
| `components/RobotsHeader.tsx` | top button と hook import を置換 |
| `components/ManufacturersHeader.tsx` | top button と hook import を置換 |
| `components/ReportsHeader.tsx` | top button と hook import を置換 |
| `lib/useStickyScroll.ts` | hook rename、必要ならファイル名 rename |

### 新規作成する可能性

| ファイル | 目的 |
|---|---|
| `components/ScrollToTopIconButton.tsx` | sticky bar 用の上矢印 button |
| `lib/useHeaderStickyBarVisibility.ts` | hook rename をファイル名まで反映する場合 |

### 変更しない

- `src/app/layout.tsx`
- `src/app/globals.css`
- `lib/siteLayout.ts`
- `lib/scroll.ts`
- `components/PageTabBar.tsx`
- `components/ActiveFilterChips.tsx`
- Browser 側の filter 計算

---

## 実装順序

1. `git status --short --branch` で未コミット変更を確認する
2. `HeaderStickyBarSlot` を `HeaderChrome.tsx` へ移す
3. `StickyPageHeader.tsx` を registration 専用にする
4. sticky bar 用 top button を小さく共通化する
5. `useStickyScroll` を `useHeaderStickyBarVisibility` に rename する
6. `rg` で旧 import / 旧 symbol が残っていないことを確認する
7. `git diff --check`
8. `npm run build`
9. `npm run validate:data`

---

## リスクと軽減策

| リスク | 重大度 | 軽減策 |
|---|---|---|
| client component 境界を壊す | 中 | 移動先にも `'use client'` を維持し、buildで確認 |
| Header mobile menu と下段 slot の stacking が変わる | 中 | slot の className と DOM位置は維持し、手動確認 |
| rename で import 漏れが出る | 低 | `rg "useStickyScroll|HeaderStickyBarSlot|ArrowUp"` で確認 |
| top button 共通化で aria-label が変わる | 低 | 既存の「ページ先頭に戻る」を維持 |
| 抽象化しすぎて domain header が読みにくくなる | 低 | 今回は top button 以外の大きな共通化をしない |

---

## 検証コマンド

```bash
git diff --check
npm run build
npm run validate:data
```

`package.json` に lint / test / typecheck script はないため、個別には実行しない。

---

## 手動確認チェックリスト

### `/robots`

- [ ] 初期表示で下段 sticky bar が表示されない
- [ ] スクロール閾値を超えると Header 直下に自然に出る
- [ ] 上へ戻ると自然に消える
- [ ] 「販売中」「開発中」tab の URL 更新が維持される
- [ ] active filter chips の解除が維持される
- [ ] 上矢印でページ先頭に戻る

### `/manufacturers`

- [ ] 初期表示で下段 sticky bar が表示されない
- [ ] スクロール閾値を超えると title + chips + 上矢印が出る
- [ ] chips の解除が維持される

### `/reports`

- [ ] 初期表示で下段 sticky bar が表示されない
- [ ] category tab の URL 更新と pagination reset が維持される
- [ ] 上矢印でページ先頭に戻る

### Header / mobile

- [ ] モバイルメニューが下段 slot より手前に出る
- [ ] メニューを開いた状態で body scroll lock が維持される
- [ ] desktop / mobile どちらも Header と下段 bar に隙間が出ない

---

## 残るリスク

- `HeaderChromeProvider` は単一 slot 前提。将来、同時に複数の page chrome を登録する要件が出た場合は、key付き registry にする必要がある。
- `ReactNode` を context state に入れる設計は実用上問題ないが、より厳密にするなら render prop や named slot の設計を検討できる。ただし現時点では過剰。
- `useHeaderStickyBarVisibility` の閾値は UX 調整値であり、仕様値として完全には固まっていない。今回のリファクタでは変えない。
