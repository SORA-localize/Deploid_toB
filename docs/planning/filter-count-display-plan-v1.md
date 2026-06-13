# 実装計画：フィルタ件数表示のレイアウト統一

作成日: 2026-06-13
改訂日: 2026-06-14（件数の右端をカードグリッド右辺に変更）

---

## 目的

- ロボットページとメーカーページで件数表示の挙動・配置を揃える
- 件数をドロップダウンと同じ高さ・**カードグリッドの右辺**に配置する
- ロボットページの件数をフィルタなし時も常時表示する

---

## 現状（551c5c5 時点）

| | RobotsBrowser | ManufacturersBrowser |
|---|---|---|
| 件数表示 | 常時表示（実装済み） | 常時表示 |
| 位置 | `max-w-4xl` ラッパー内・右端 | `max-w-2xl` ラッパー内・右端 |
| 問題 | フィルター幅（〜896px）の右端 ≠ カードグリッド右辺 | 同左（〜672px） |

`max-w-*xl` が外側ラッパーに移っており、件数がフィルター幅内に閉じ込められている。

---

## 調査済みファイル・再利用する既存コード

- `components/RobotsBrowser.tsx:95` — `crossReleaseTotal = activeRobots.length + preReleaseRobots.length`
- `components/RobotsBrowser.tsx:96` — `resultCount = hasActiveFilters ? crossReleaseTotal : filtered.length`
- `components/RobotsBrowser.tsx:173` — フィルタ flex ラッパー（現在 `max-w-4xl` 付き）
- `components/RobotsBrowser.tsx:174` — 内側グリッド（現在 `flex-1 min-w-0`）
- `components/RobotsBrowser.tsx:205` — 件数 `<p>`
- `components/ManufacturersBrowser.tsx:97` — フィルタ flex ラッパー（現在 `max-w-2xl` 付き）
- `components/ManufacturersBrowser.tsx:98` — 内側グリッド（現在 `flex-1 min-w-0`）
- `components/ManufacturersBrowser.tsx:120` — 件数 `<p>`
- `src/app/globals.css:264` — `.site-container` = `mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16`
- `components/RobotsBrowser.tsx:120` — カードグリッド = `max-w` なし（site-container 全幅に展開）
- `lib/uiText.ts` — `uiText.common.results(count, filtered)` を再利用（変更なし）
- `components/SelectControl.tsx:42` — 親幅に従う作り（`w-full`）

---

## 件数ロジック（RobotsBrowser）

フィルタなし時に `crossReleaseTotal`（全件）を使うと release タブとカード数がズレる。

```ts
// フィルタあり → active + pre の横断合計
// フィルタなし → 現在表示タブのカード数（filtered.length）
const resultCount = hasActiveFilters ? crossReleaseTotal : filtered.length;
```

この変数は 551c5c5 時点で既に導入済み。変更なし。

---

## レイアウト構造変更（改訂）

### 設計方針

`max-w-*xl` を**フィルターグリッド側に残し**、外側ラッパーは `max-w` なし（site-container 全幅）にする。  
件数に `ml-auto` を付けることで flex 文脈の残余スペースをすべて吸収し、コンテナ右端（= カードグリッド右辺）へ押し出す。

```
site-container（max-w-[1440px], padding あり）
├─ flex ラッパー（max-w なし → site-container 全幅）
│  ├─ フィルターグリッド（max-w-4xl で左側に収まる, shrink-0）
│  │  ├─ [Select × 4]
│  └─ 件数 <p>（ml-auto で右端へ）
│
└─ カードグリッド（max-w なし → site-container 全幅）
   └─ [Card × n]

件数の右端 ≒ カードグリッドの右端  ✓
```

### ブレークポイント

| ページ | 適用 bp | 理由 |
|---|---|---|
| RobotsBrowser（4列） | `xl`（1280px） | Select 4列が1行に揃う。lg（1024px）でも余白は出るが xl の方が安定 |
| ManufacturersBrowser（2列） | `sm`（640px） | Select 2列が1行に揃う最小幅 |

### 変更前後の差分

**変更前（551c5c5、RobotsBrowser）**:
```html
<div class="xl:flex xl:items-end xl:justify-between gap-4 mb-5 max-w-4xl">
  <div class="grid ... xl:flex-1 xl:min-w-0">
    [dropdowns]
  </div>
  <p class="mt-3 xl:mt-0 shrink-0 whitespace-nowrap px-1 ...">XX件</p>
</div>
```

**変更後（RobotsBrowser）**:
```html
<div class="xl:flex xl:items-end mb-5">                      ← max-w 削除, justify-between 削除
  <div class="grid ... max-w-4xl xl:shrink-0">              ← max-w をここへ戻す, flex-1/min-w-0 → shrink-0
    [dropdowns]
  </div>
  <p class="mt-3 xl:mt-0 xl:ml-auto shrink-0 whitespace-nowrap text-right xl:text-left ...">XX件</p>
                                             ↑ ml-auto で右端へ
</div>
```

**変更前（551c5c5、ManufacturersBrowser）**:
```html
<div class="sm:flex sm:items-end sm:justify-between gap-4 mb-5 max-w-2xl">
  <div class="grid ... sm:flex-1 sm:min-w-0">
    [dropdowns]
  </div>
  <p class="mt-3 sm:mt-0 shrink-0 whitespace-nowrap ...">XX件</p>
</div>
```

**変更後（ManufacturersBrowser）**:
```html
<div class="sm:flex sm:items-end mb-5">                      ← max-w 削除, justify-between 削除
  <div class="grid ... max-w-2xl sm:shrink-0">              ← max-w をここへ戻す, flex-1/min-w-0 → shrink-0
    [dropdowns]
  </div>
  <p class="mt-3 sm:mt-0 sm:ml-auto shrink-0 whitespace-nowrap text-right sm:text-left ...">XX件</p>
</div>
```

### レスポンシブ挙動

| 幅 | RobotsBrowser | ManufacturersBrowser |
|---|---|---|
| mobile（〜639px） | stacked。件数は `text-right` でコンテナ右端 | 同左 |
| sm（640px〜xl未満） | stacked。件数は `text-right` でコンテナ右端 | flex行。件数は `ml-auto` でサイト右端 |
| xl（1280px+） | flex行。件数は `xl:ml-auto` でサイト右端 | — |

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `components/RobotsBrowser.tsx` | 外側 flex ラッパーから `max-w-4xl` / `justify-between` を削除。内側グリッドに `max-w-4xl xl:shrink-0`。件数に `xl:ml-auto text-right xl:text-left` |
| `components/ManufacturersBrowser.tsx` | 外側 flex ラッパーから `max-w-2xl` / `justify-between` を削除。内側グリッドに `max-w-2xl sm:shrink-0`。件数に `sm:ml-auto text-right sm:text-left` |

**変更しないファイル:** `lib/uiText.ts`、`lib/robotFilters.ts`、`lib/manufacturerFilters.ts`、`components/SelectControl.tsx`、その他すべて

---

## リスクと軽減策

| リスク | 軽減策 |
|---|---|
| フィルターグリッドが flex 文脈で `shrink-0` + `max-w-4xl` でも内容に応じて幅が不定 | SelectControl は `w-full` で親幅追従。グリッドの flex アイテム幅はコンテンツ min-content に基づくが `max-w-4xl` が上限として機能する |
| `ml-auto` が機能せず件数が左端に留まる | flex コンテナに `gap` がある場合も `ml-auto` はそのマージンより優先されるため問題なし |
| mobile で `text-right` がフィルターグリッドと重なる | stacked（flex なし）のため重ならない。`<p>` はブロック要素 |
| Select 幅が若干変わる | `shrink-0` により縮まない。拡大もしない（`flex-grow` なし） |

---

## 実装手順

1. `components/RobotsBrowser.tsx` L173–208:
   - 外側ラッパー `div`: `max-w-4xl` 削除、`xl:justify-between` 削除、`gap-4` は維持
   - 内側グリッド `div`: `xl:flex-1 xl:min-w-0` → `max-w-4xl xl:shrink-0` に変更
   - 件数 `<p>`: `xl:ml-auto` 追加、`text-right xl:text-left` 追加、`px-1` は維持

2. `components/ManufacturersBrowser.tsx` L97–126:
   - 外側ラッパー `div`: `max-w-2xl` 削除、`sm:justify-between` 削除、`gap-4` は維持
   - 内側グリッド `div`: `sm:flex-1 sm:min-w-0` → `max-w-2xl sm:shrink-0` に変更
   - 件数 `<p>`: `sm:ml-auto` 追加、`text-right sm:text-left` 追加

---

## 検証コマンド

```bash
npm run build
```

---

## 手動確認チェックリスト

- [ ] ロボットページ / xl幅（1280px+）：件数がカードグリッド右辺と揃う
- [ ] ロボットページ / xl幅：ドロップダウン4列と件数が同行
- [ ] ロボットページ / sm〜xl未満：件数が `text-right` でコンテナ右端に落ちる
- [ ] ロボットページ / mobile：件数がフィルター下・右寄せで表示
- [ ] ロボットページ / 横スクロールが発生しない
- [ ] ロボットページ / フィルタなし + 販売中タブ：販売中カード数と件数が一致
- [ ] ロボットページ / フィルタなし + 開発中タブ：開発中カード数と件数が一致
- [ ] ロボットページ / フィルタあり：「XX件（絞り込み中）」で active+pre 合計
- [ ] メーカーページ / sm幅（640px+）：件数がカードグリッド右辺と揃う
- [ ] メーカーページ / sm幅：ドロップダウン2列と件数が同行
- [ ] メーカーページ / mobile：件数がフィルター下・右寄せで表示
- [ ] メーカーページ / 横スクロールが発生しない
