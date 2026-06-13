# 実装計画：フィルタ件数表示のレイアウト統一

作成日: 2026-06-13

---

## 目的

- ロボットページとメーカーページで件数表示の挙動・配置を揃える
- 件数をドロップダウンと同じ高さ・右端に配置する
- ロボットページの件数をフィルタなし時も常時表示する

---

## 現状

| | RobotsBrowser | ManufacturersBrowser |
|---|---|---|
| 件数表示 | `hasActiveFilters` 時のみ | 常時 |
| 位置 | グリッドの下・左寄せ | グリッドの下・左寄せ |
| `max-w` 付与先 | 内側グリッド（`max-w-4xl`） | 内側グリッド（`max-w-2xl`） |

どちらも件数はグリッドの外（下行）にあり、「同じ高さ・右端」になっていない。

---

## 調査済みファイル・再利用する既存コード

- `components/RobotsBrowser.tsx:95` — `crossReleaseTotal = activeRobots.length + preReleaseRobots.length`
- `components/RobotsBrowser.tsx:172` — フィルタグリッドの div
- `components/RobotsBrowser.tsx:204` — 件数 `<p>`（現在は条件付き）
- `components/ManufacturersBrowser.tsx:97` — フィルタグリッドの div
- `components/ManufacturersBrowser.tsx:120` — 件数 `<p>`（現在は常時表示）
- `components/RobotsHeader.tsx:47` — release タブ（フィルタなし時は販売中/開発中を切り替え）
- `components/SelectControl.tsx:42` — 親幅に従う作り（`w-full`）
- `lib/uiText.ts` — `uiText.common.results(count, filtered)` を再利用（変更なし）

---

## 件数ロジック（RobotsBrowser）

フィルタなし時に `crossReleaseTotal`（全件）を使うと、release タブで片方だけ表示されているカード数とズレる。

```ts
// フィルタあり → active + pre の横断合計
// フィルタなし → 現在表示タブのカード数（filtered.length）
const resultCount = hasActiveFilters ? crossReleaseTotal : filtered.length;
```

表示:

```tsx
{uiText.common.results(resultCount, hasActiveFilters)}
// フィルタなし + 販売中タブ: 「XX件」（販売中カード数）
// フィルタなし + 開発中タブ: 「XX件」（開発中カード数）
// フィルタあり:              「XX件（絞り込み中）」（active + pre 合計）
```

---

## レイアウト構造変更

ドロップダウンが1行に揃うブレークポイントで flex に切り替え、件数を右端に配置する。

| ページ | 1行揃う bp | 適用 |
|---|---|---|
| RobotsBrowser（4列） | `xl`（1280px） | `xl:flex xl:items-end xl:justify-between` |
| ManufacturersBrowser（2列） | `sm`（640px） | `sm:flex sm:items-end sm:justify-between` |

それより狭い幅では件数がグリッド下に自然に落ちる。

```
変更前:
  <div class="grid ... max-w-*xl mb-5">   ← ドロップダウン群
  <p>XX件</p>                             ← 別行・左寄せ

変更後:
  <div class="[bp]:flex [bp]:items-end [bp]:justify-between gap-4 mb-5 max-w-*xl">
    ├─ <div class="grid ... [bp]:flex-1 [bp]:min-w-0">  ← ドロップダウン群
    └─ <p class="mt-3 [bp]:mt-0 shrink-0 whitespace-nowrap ...">XX件</p>
```

- `max-w-*xl` を外側ラッパーへ移動（件数が max-w 外に飛び出さないため）
- 内側グリッドに `[bp]:flex-1 [bp]:min-w-0`（SelectControl は親幅に従うため安全）
- 件数に `shrink-0 whitespace-nowrap`（テキストが潰れないため）

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `components/RobotsBrowser.tsx` | flex ラッパー追加、件数常時表示化（`resultCount` 導入）、`max-w-4xl` を外へ移動 |
| `components/ManufacturersBrowser.tsx` | flex ラッパー追加、件数位置を grid 外→ラッパー内へ移動、`max-w-2xl` を外へ移動 |

**変更しないファイル:** `lib/uiText.ts`、`lib/robotFilters.ts`、`lib/manufacturerFilters.ts`、`components/SelectControl.tsx`、その他すべて

---

## リスクと軽減策

| リスク | 軽減策 |
|---|---|
| `filtered.length` がどのタブ状態を反映するか | `filterRobots` の戻り値 `filtered` は現在の release タブを反映済みのため正確 |
| `max-w-*xl` 移動で内側グリッドが広がりすぎる | `[bp]:flex-1 [bp]:min-w-0` を付けることで flex 文脈での縮小が効く |
| `items-end` でラベル+Select の高さ差が大きい場合に位置がズレる | SelectControl は一定高さ構造のため実害なし |
| mobile で件数がグリッドに詰まりすぎる | `mt-3 [bp]:mt-0` で上マージン確保 |

---

## 実装手順

1. `components/RobotsBrowser.tsx`
   - L172 の grid div を flex ラッパーで囲む（`xl:flex xl:items-end xl:justify-between gap-4 mb-5 max-w-4xl`）
   - 内側 grid から `mb-5 max-w-4xl` を除去し `xl:flex-1 xl:min-w-0` を追加
   - L204 の条件付き `<p>` を flex ラッパー内に移動し常時表示に変更
   - `crossReleaseTotal` → `resultCount = hasActiveFilters ? crossReleaseTotal : filtered.length`
   - 件数 `<p>` に `mt-3 xl:mt-0 shrink-0 whitespace-nowrap` を付与

2. `components/ManufacturersBrowser.tsx`
   - L97 の grid div を flex ラッパーで囲む（`sm:flex sm:items-end sm:justify-between gap-4 mb-5 max-w-2xl`）
   - 内側 grid から `mb-5 max-w-2xl` を除去し `sm:flex-1 sm:min-w-0` を追加
   - L120 の `<p>` を flex ラッパー内（grid の後）に移動
   - 件数 `<p>` に `mt-3 sm:mt-0 shrink-0 whitespace-nowrap` を付与（`mb-4` 除去）

---

## 検証コマンド

```bash
npm run build
```

---

## 手動確認チェックリスト

- [ ] ロボットページ / xl幅（1280px+）：ドロップダウン4列と件数が同行右端
- [ ] ロボットページ / sm幅（640–1279px）：件数がグリッド下に落ちる
- [ ] ロボットページ / mobile幅（〜639px）：件数がグリッド下に落ちる
- [ ] ロボットページ / フィルタなし + 販売中タブ：販売中カード数と件数が一致
- [ ] ロボットページ / フィルタなし + 開発中タブ：開発中カード数と件数が一致
- [ ] ロボットページ / フィルタあり：「XX件（絞り込み中）」で active+pre の合計
- [ ] メーカーページ / sm幅（640px+）：ドロップダウン2列と件数が同行右端
- [ ] メーカーページ / mobile幅：件数がグリッド下に落ちる
- [ ] メーカーページ / フィルタなし：件数常時表示（既存動作の維持）
- [ ] 両ページ：横スクロールが発生しない
