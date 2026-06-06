# Header App Chrome Sticky Bar Experiment Plan

作成日: 2026-06-06

## 目的

グローバルHeaderは常時stickyのまま維持し、スクロール時だけ出る下段バーをHeaderの子要素として描画する。

これにより、`Header = sticky` と `下段バー = fixed` の別レイヤー構成で起きる、スクロール端での隙間・分離感を減らす。

## 現状の問題

- `Header` は `sticky top-0`
- 下段バーは `fixed top-[var(--header-h)]`
- stickyとfixedの描画基準が違うため、スクロール端や慣性スクロール時に隙間が出る可能性がある
- scroll/resizeでHeader位置を測って補正する方法は、独自実装が重くなる

## 方針

- `HeaderChromeProvider` を追加し、Header下段バーの表示内容をcontextで管理する
- `Header` 内に `HeaderStickyBarSlot` を置く
- 下段バーは `Header` の `absolute top-full` 子要素として表示する
- ページ側の `StickyPageHeader` はDOMを直接描画せず、Headerのslotへ `content` と `visible` を登録する
- 表示タイミングは既存の `useStickyScroll()` を使う
- URL state、filter state、tab stateの正本は変更しない

## 変更ファイル

- `components/HeaderChrome.tsx`
- `components/Header.tsx`
- `components/StickyPageHeader.tsx`
- `src/app/layout.tsx`

## 影響範囲

- Robots / Manufacturers / Reports のスクロール時下段バー
- Headerのstacking context
- モバイルメニューの表示位置

## リスク

- `Header` の責務が少し増える
- Header下段slotが複数ページコンポーネントから同時登録される設計ではない
- client context経由のため、下段バーはclient mount後に表示制御される

## 検証

- `npm run build`
- `npm run validate:data`
- `git diff --check`
- 手動確認:
  - `/robots` でスクロール前に下段バーが表示されない
  - 閾値を超えるとHeader直下に下段バーが出る
  - スクロール端でもHeaderと下段バーに隙間が出にくい
  - モバイルメニューがHeader下段slotと重なって破綻しない
