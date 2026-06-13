# Compare 3カラムD&D実装計画 2026-06-03

## 目的

`/compare` で、左の機種メニュー、中央の比較シート、右のお気に入りの3カラムを1つの `DndContext` で包み、機種カードを直感的に移動できるようにする。

対象操作:

- 左 -> 中: 機種を比較シートへ追加
- 中 -> 右: 比較中の機種をお気に入りへ追加
- 右 -> 中: お気に入りの機種を比較シートへ追加
- 中央内: 既存の並び替えを維持

## 調査した既存ファイル

- `components/CompareClient.tsx`
  - `/compare` の3カラムUI、URL query `compare`、favorite、中央D&Dの本体。
  - 現在の `DndContext` は中央シート内だけにある。
- `components/SortableCompareCard.tsx`
  - 中央比較カードの `useSortable` ラッパー。
  - 現状は `id === slug` 前提。
- `components/ComparisonRobotPanel.tsx`
  - 中央カード本体。ドラッグハンドルpropsを受け取る構造は再利用できる。
- `components/FavoriteCard.tsx`
  - 右カラムのお気に入りカード。クリック選択・削除前提。
- `lib/useUrlFilters.ts`
  - `updateParams` によるURL state更新。
- `lib/useFavorites.ts`
  - localStorage backed favorite state。現状は `toggleFavorite` のみ。
- `package.json`
  - `@dnd-kit/*` と `motion` / `framer-motion` は導入済み。

## 再利用する既存コード

- URLのSingle Source of Truth:
  - `selectedSlugs` は引き続き `compare` queryから導出する。
  - 追加・削除・並び替えは既存と同じく `updateParams` で反映する。
- favoriteのSingle Source of Truth:
  - `favorites` は引き続き `useFavorites` で取得する。
  - localStorageキーやparse処理は変更しない。
- 中央カードUI:
  - `ComparisonRobotPanel` はそのまま使う。
  - `SortableCompareCard` はID/data対応だけ拡張する。
- 右カードUI:
  - `FavoriteCard` は表示とクリック操作を維持し、D&D用ラッパーで包む。
- アニメーション:
  - 既存の流儀に合わせて `motion/react` を使う。

## 新規または変更するコード

変更予定:

- `components/CompareClient.tsx`
  - `DndContext` を3カラム全体へ移動。
  - `DragOverlay` を追加。
  - 左メニュー行・右favoriteカード・中央空シート/シート枠をdroppable/draggable化。
  - drag source / drop target の判定を追加。
- `components/SortableCompareCard.tsx`
  - D&D item idを `sheet-${slug}` にできるようにする。
  - `data` を受け取れるようにして、`slug` と `source` を `active.data.current` から読めるようにする。
- `lib/uiText.ts`
  - 必要な最小限のaria文言・drop文言を追加する可能性がある。

変更しない予定:

- `data/*.ts`
- `lib/data.ts`
- `lib/useUrlFilters.ts`
- `lib/useFavorites.ts`
- `components/ComparisonRobotPanel.tsx`
- `src/app/compare/page.tsx`

## 設計方針

### D&D ID

ID競合を避けるため、D&D上のIDは次の形にする。

- 左メニュー item: `menu-${slug}`
- 中央シート item: `sheet-${slug}`
- 右favorite item: `fav-${slug}`
- 左カラム drop: `menu-column`
- 中央カラム drop: `sheet-column`
- 右カラム drop: `fav-column`

ただし、URL更新やfavorite更新ではID文字列をparseしない。`active.data.current` / `over.data.current` に `{ slug, source, target }` を持たせ、slugはそこから読む。

### 状態更新

- 左/右 -> 中:
  - `selectedSlugs` に存在しなければ末尾に追加。
  - 9件上限を超える場合は追加しない。
  - URLは `updateParams({ compare: next.join(',') })` で更新。
- 中央内並び替え:
  - `sheet-${slug}` 同士のover時だけ `arrayMove` する。
  - URLは既存通り `replace` で更新する。
- 中央 -> 右:
  - `favorites` に存在しない場合だけ `toggleFavorite(slug)` を呼ぶ。
  - 既にfavoriteの場合は何もしない。`toggleFavorite` の誤用で削除しない。
  - 比較シートからは削除しない。ドラッグ先が「お気に入りへ追加」を意味するため。
- 中央 -> 左:
  - 今回は実装しない。左はソースカラムとして扱う。

### UX

- `DragOverlay` でドラッグ中の軽量カードを表示する。
- 元カードは `isDragging` で半透明にする。
- droppableカラムは `isOver` で border/ring を強調する。
- 並び替えは中央の `SortableContext` 内だけで有効にする。
- 他カラムへの移動は、drop先カラムに反応する「放り込む」挙動にする。
- `PointerSensor` には小さなdistance制約を入れ、既存クリック操作との衝突を減らす。

## 影響範囲

- `/compare` のUI操作のみ。
- URL query `compare` の仕様は維持。
- localStorage `deploid_favorites` の仕様は維持。
- robots/manufacturersのデータ構造には影響しない。

## リスクと対策

- リスク: `sheet-${slug}` に変えたことで中央並び替えが壊れる。
  - 対策: `SortableContext` itemsと `useSortable` idを同じD&D IDにし、slugはdataで渡す。
- リスク: `toggleFavorite` をD&D投入で呼び、既存favoriteを削除してしまう。
  - 対策: `favorites.includes(slug)` を確認してから呼ぶ。
- リスク: 空シート時にdropできない。
  - 対策: 空状態の枠も `sheet-column` droppableとして登録する。
- リスク: クリック操作とドラッグ開始が干渉する。
  - 対策: `PointerSensor` のdistance制約を使う。既存button/linkのclickは維持する。
- リスク: モバイルで3カラムD&Dの操作対象が分かりづらい。
  - 対策: 現在の `grid-cols-1` -> `xl` 3カラムのレスポンシブ構造は維持し、縦並びでもdrop枠が強調されるようにする。

## 実装手順

1. `CompareClient.tsx` にD&D用の型、ID helper、droppable/draggable小コンポーネント、overlay表示を追加する。
2. `DndContext` を3カラムgridの外側に移動する。
3. 左メニュー行を `useDraggable` 対応の小ラッパーで包む。
4. 中央シート枠を `useDroppable` 対応にし、既存 `SortableContext` を `sheet-${slug}` itemsへ変更する。
5. `SortableCompareCard` に `id` と `data` propsを追加する。
6. 右favoriteカードを `useDraggable` 対応の小ラッパーで包み、右カラムをdroppableにする。
7. `DragOverlay` とドラッグ中の視覚状態を追加する。
8. `handleDragStart` / `handleDragCancel` / `handleDragEnd` を実装する。

## 検証コマンド

- `npm run validate:data`
- `npm run build`

`package.json` に `lint` / `typecheck` / `test` script はないため、実行対象外。TypeScript確認は `npm run build` 内で行う。

## 手動確認項目

- `/compare` で左メニューから中央へドラッグして追加できる。
- 中央内で並び替えでき、URL query順が更新される。
- 中央から右へドラッグしてfavoriteに追加できる。
- 既にfavoriteの中央カードを右へドラッグしてもfavoriteから削除されない。
- 右favoriteから中央へドラッグして追加できる。
- 9件上限到達時に中央へ追加されない。
- 空シートにもdropできる。
- クリックでの追加/削除/favorite操作が従来通り動く。
- reload / browser back-forward 後もURL stateとfavorite stateが破綻しない。
- mobile/tablet/desktop幅で表示が崩れない。
