# 比較カード トレカスタイル UI リデザイン計画 v3

作成日: 2026-06-11  
ブランチ: `experiment/compare-card-popover`  
監査適用: §1.5 ×2ラウンド済み

---

## 目的

比較シートのカードを「トレーディングカード型」に刷新する。

- ロボットの切り抜き画像をカード全面に配置
- 名前・メーカー・操作ボタンを画像の上にオーバーレイ
- deploymentStage バッジを削除
- D&D・Popover 詳細・★✕ 機能は維持
- モバイル（pointer:coarse）では D&D を無効化。タップで Popover が開く

---

## 調査結果

| ファイル | 確認した内容 |
|---|---|
| `components/ComparisonRobotPanel.tsx` | 要フルリライト。現行 Popover は **uncontrolled**（open prop なし） |
| `components/SortableCompareCard.tsx` | `CompareCardDragHandleProps` 型: `attributes: DraggableAttributes`, `listeners: DraggableSyntheticListeners`, `isDragging: boolean` |
| `components/compare/CompareParts.tsx` | ファイル実在確認済み。`CompareInsertionPreviewCard` を更新する |
| `components/CompareClient.tsx` | 変更不要。`PointerSensor: distance 6` 既設定。`MAX_COMPARE_ROBOTS: 20` 済 |
| `lib/uiText.ts` | `uiText.robots.mainImageMissing` 存在確認済み（`'公式画像申請中'`） |
| `src/app/globals.css` | `rounded-lg` = `.card-editorial` で実績あり。`--z-dropdown: 50` |

---

## 監査2ラウンドで発見した問題と対応

| # | 問題 | 対応 |
|---|---|---|
| 1 | `pointer-events-none` は CSS 非継承のため子要素（h3・div）が依然タップを受け取り、Popover trigger（兄弟）に届かない | **Popover を controlled（useState）に変更**。overlay div に `onClick={() => setPopoverOpen(true)}` を付ける。pointer-events 操作を廃止 |
| 2 | ★✕ の `onClick` が stopPropagation していないため、クリック時に overlay の onClick も発火しロボット削除と同時に Popover が開く | ★✕ の `onClick` を `(e) => { e.stopPropagation(); 処理 }` に変更 |
| 3 | `manufacturerLogo` prop が新デザインでは未使用 | prop は維持（CompareClient.tsx 変更を避けるため）、Popover 内部での利用も削除。未使用として残す |
| 4 | `CompareDragOverlayCard`（メニュー/お気に入りドラッグ用ミニカード）が旧デザインのまま | **意図的に変更しない**。あれはシート挿入前の「どのロボットをドラッグしているか」を示す小型インジケータで、トレカデザインにする必要はない |
| 5 | Popover controlled/uncontrolled 退行リスク | 現行は uncontrolled → 今回 controlled に移行。挙動は同等（開閉は Trigger click + Escape + 外クリック）。退行なし |

---

## モバイル Popover 問題の根本解決

### なぜ `pointer-events-none` では不十分だったか

CSS において `pointer-events` は**非継承プロパティ**（non-inherited）。

```
<div pointer-events:none>        ← この div 自体はタップを受けない
  <div>                          ← 子は pointer-events:auto（デフォルト）のまま
    <h3>Robot Name</h3>          ← タップを受け取る → article にバブル → Popover trigger(兄弟)に届かない
  </div>
</div>
```

### 採用する解決策: controlled Popover + overlay onClick

```tsx
const [popoverOpen, setPopoverOpen] = useState(false);

// overlay div: 常に onClick でPopoverを開く
<div onClick={() => setPopoverOpen(true)} {...(canDrag ? dragListeners : {})}>
  <GripVertical />
  <h3>Robot Name</h3>
  <div className="flex ...">
    {/* ★✕: onClick stopPropagation でPopoverが開かないようにする */}
    <button onClick={(e) => { e.stopPropagation(); onFavoriteToggle(slug); }}>★</button>
    <button onClick={(e) => { e.stopPropagation(); onRemove(slug); }}>✕</button>
  </div>
</div>

// 画像エリア Popover trigger: controlled の open/onOpenChange を使う
<PopoverPrimitive.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
  <PopoverPrimitive.Trigger asChild>
    <button onPointerDown={(e) => e.stopPropagation()} />
  </PopoverPrimitive.Trigger>
  ...
</PopoverPrimitive.Root>
```

**結果:**
- デスクトップ: overlay タップ（短いclick）→ `onClick` 発火 → Popover 開く。ドラッグ（6px以上移動）→ click イベント発火せず → Popover 開かない ✅
- モバイル: overlay タップ → `onClick` 発火 → Popover 開く ✅
- ★✕: `stopPropagation` により overlay の `onClick` が発火しない ✅
- `pointer-events-none` なし → シンプル ✅

---

## 新カード構造

```
aspect-[5/7] rounded-lg overflow-hidden relative bg-muted
┌──────────────────────────────────┐
│  [≡] Robot Name      [★] [✕]   │  ← top overlay (absolute top-0 inset-x-0 z-10)
│     gradient: top→transparent    │    onClick={() => setPopoverOpen(true)}
│                                  │    pointer:fine → D&D listeners 展開
│                                  │
│     ロボット画像                  │  ← blur-bg layer (absolute inset-0 blur-2xl)
│     object-contain object-center │    + foreground layer (absolute inset-0 object-contain)
│                                  │    + Popover trigger button (absolute inset-0 z-0)
│                   Manufacturer ▸ │  ← bottom-right overlay (absolute bottom-0 inset-x-0 z-10)
└──────────────────────────────────┘
```

### z-index スタッキング順

```
1. absolute inset-0        — blur 背景画像 (brightness-75 saturate-150 blur-2xl scale-110)
2. absolute inset-0        — foreground ロボット画像 (object-contain object-center)
3. Popover.Trigger button  — absolute inset-0 z-0 (onPointerDown stopPropagation)
4. div top overlay         — absolute top-0 inset-x-0 z-10
                               onClick → setPopoverOpen(true)
                               pointer:fine → D&D listeners 展開, cursor-grab
                               ★✕ buttons → onClick e.stopPropagation()
5. div bottom overlay      — absolute bottom-0 inset-x-0 z-10 pointer-events-none
```

---

## 最終 props インターフェース

```tsx
import type { CompareCardDragHandleProps } from '@/components/SortableCompareCard';

interface ComparisonRobotPanelProps {
  robot: Robot;
  manufacturerName?: string;          // 既存。bottom-right overlay で使用
  manufacturerLogo?: ImageAsset;      // 既存。現在未使用（呼び出し元変更を避けるため維持）
  isFavorite: boolean;
  onFavoriteToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  dragHandleProps?: CompareCardDragHandleProps; // 既存型そのまま
}
```

`manufacturerLogo` は将来 Popover 内でロゴ表示を追加する際に使う想定。現行は受け取るが使わない。

---

## cardImage 導出ロジック

```tsx
const cardImage =
  robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage;
```

現行実装と同一。

---

## 変更ファイル一覧

### 変更する（3ファイル）

| ファイル | 変更内容 |
|---|---|
| `components/ComparisonRobotPanel.tsx` | フルリライト |
| `components/SortableCompareCard.tsx` | 内側 div: `rounded-sm` → `rounded-lg`（1行） |
| `components/compare/CompareParts.tsx` | `CompareInsertionPreviewCard` のみ更新 |

### 変更しない

- `CompareClient.tsx` — センサー・MAX・grid 変更なし
- `CompareParts.tsx` の `CompareDragOverlayCard` — 意図的に維持（ミニインジケータとして別物）
- `data/types.ts`, `lib/labels.ts`, `lib/visualSemantics.ts`
- `lib/uiText.ts` — 必要なキーはすべて存在確認済み

---

## 実装手順

### Step 1: `SortableCompareCard.tsx`（1行変更）

```diff
- <div id={`compare-card-${slug}`} className="rounded-sm transition-shadow duration-500">
+ <div id={`compare-card-${slug}`} className="rounded-lg transition-shadow duration-500">
```

### Step 2: `ComparisonRobotPanel.tsx` フルリライト

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, GripVertical, Star, X } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import type { CompareCardDragHandleProps } from '@/components/SortableCompareCard';
import type { ImageAsset, Robot } from '@/data/types';
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

function CompactList({ items }: { items: string[] }) {
  /* 既存実装そのまま */
}

interface ComparisonRobotPanelProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset; // 現在未使用（維持）
  isFavorite: boolean;
  onFavoriteToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  dragHandleProps?: CompareCardDragHandleProps;
}

export function ComparisonRobotPanel({
  robot,
  manufacturerName,
  isFavorite,
  onFavoriteToggle,
  onRemove,
  dragHandleProps,
}: ComparisonRobotPanelProps) {
  const coreRows = getComparisonCoreRows(robot);
  const detailRows = getComparisonDetailRows(robot);

  // controlled Popover
  const [popoverOpen, setPopoverOpen] = useState(false);

  // pointer:fine（マウス）デバイスのみ D&D を有効化
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  useEffect(() => {
    setIsPointerDevice(window.matchMedia('(pointer: fine)').matches);
  }, []);

  const canDrag = isPointerDevice && !!dragHandleProps;

  const cardImage =
    robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage;

  return (
    <article
      className="relative aspect-[5/7] w-full overflow-hidden rounded-lg
                 bg-muted text-card-foreground"
    >
      {/* ── 画像レイヤー ── */}
      {cardImage ? (
        <>
          <img
            src={cardImage.src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover
                       blur-2xl brightness-75 saturate-150"
          />
          <img
            src={cardImage.src}
            alt={cardImage.alt}
            className="absolute inset-0 h-full w-full object-contain object-center
                       transition-transform duration-300"
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            {uiText.robots.mainImageMissing}
          </span>
        </div>
      )}

      {/* ── Popover trigger（画像全体を覆う z-0）── */}
      <PopoverPrimitive.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label={uiText.comparison.detailsAria(robot.nameJa ?? robot.name)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 z-0 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={8}
            className="z-[var(--z-dropdown)] w-[min(400px,90vw)] max-h-[80vh]
                       overflow-y-auto border border-border bg-card text-card-foreground
                       shadow-lg
                       data-[state=open]:animate-in data-[state=open]:fade-in-0
                       data-[state=open]:zoom-in-95
                       data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                       data-[state=closed]:zoom-out-95"
          >
            {/* ── Popover 内容: 現行コードと同一 ── */}
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {robot.nameJa ?? robot.name}
              </h4>
              <PopoverPrimitive.Close
                aria-label={uiText.comparison.closeDetail}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground
                           rounded-sm transition-colors focus-visible:outline-none
                           focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </PopoverPrimitive.Close>
            </div>

            <div className="p-3 space-y-5">
              {/* coreRows・detailRows・comparison sections・link — 現行コードそのまま */}
              ...
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* ── top overlay: D&D ハンドル + 名前 + ★✕（z-10）── */}
      <div
        onClick={() => setPopoverOpen(true)}
        className={[
          'absolute top-0 inset-x-0 z-10',
          'flex items-start justify-between gap-2 px-2.5 pt-2 pb-8',
          'bg-gradient-to-b from-black/60 to-transparent',
          canDrag
            ? 'cursor-grab touch-none select-none active:cursor-grabbing'
            : '',
        ].join(' ').trim()}
        aria-label={canDrag
          ? uiText.comparison.reorderAria(robot.nameJa ?? robot.name)
          : undefined}
        title={canDrag ? uiText.comparison.reorderHint : undefined}
        {...(canDrag ? dragHandleProps!.attributes : {})}
        {...(canDrag ? dragHandleProps!.listeners : {})}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
          <h3
            className="truncate text-xs font-semibold leading-tight text-white"
            title={robot.nameJa ?? robot.name}
          >
            {robot.nameJa ?? robot.name}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={
              isFavorite
                ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
                : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
            }
            aria-pressed={isFavorite}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation(); // overlay の onClick を止める
              onFavoriteToggle(robot.slug);
            }}
            className="rounded-sm p-1 text-white/70 transition-colors
                       hover:bg-white/20 hover:text-white
                       focus-visible:outline-none focus-visible:ring-1
                       focus-visible:ring-white"
          >
            <Star
              className={`h-3.5 w-3.5 ${isFavorite ? 'fill-favorite text-favorite' : ''}`}
            />
          </button>
          <button
            type="button"
            aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation(); // overlay の onClick を止める
              onRemove(robot.slug);
            }}
            className="rounded-sm p-1 text-white/70 transition-colors
                       hover:bg-white/20 hover:text-white
                       focus-visible:outline-none focus-visible:ring-1
                       focus-visible:ring-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── bottom overlay: メーカー名（z-10, pointer-events-none）── */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 z-10 px-2.5 pb-2
                   bg-gradient-to-t from-black/50 to-transparent"
      >
        <p className="truncate text-right text-[10px] font-medium text-white/70">
          {manufacturerName ?? robot.manufacturerSlug}
        </p>
      </div>
    </article>
  );
}
```

### Step 3: `CompareInsertionPreviewCard` 更新

```tsx
export function CompareInsertionPreviewCard({
  robot,
  manufacturerName,
}: CompareDragOverlayCardProps) {
  return (
    <article
      className="pointer-events-none relative aspect-[5/7] w-full overflow-hidden
                 rounded-lg border border-dashed border-ring bg-card/70 opacity-60"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-muted/80" />

      {/* top overlay スケルトン */}
      <div
        className="absolute top-0 inset-x-0 z-10 flex items-center gap-2
                   px-2.5 pt-2 pb-8
                   bg-gradient-to-b from-black/40 to-transparent"
      >
        <div className="h-3 w-3 shrink-0 rounded-sm bg-white/20" />
        <div className="h-3 w-[55%] rounded-sm bg-white/20" />
      </div>

      {/* bottom overlay スケルトン */}
      <div
        className="absolute bottom-0 inset-x-0 z-10 flex justify-end px-2.5 pb-2
                   bg-gradient-to-t from-black/30 to-transparent"
      >
        <div className="h-2.5 w-16 rounded-sm bg-white/20" />
      </div>
    </article>
  );
}
```

---

## 影響範囲

| 箇所 | 変化 |
|---|---|
| 比較シートのカード表示 | トレカ縦型、画像フル、オーバーレイ |
| D&D（デスクトップ pointer:fine） | top overlay からのみドラッグ可（動作維持） |
| D&D（モバイル pointer:coarse） | 無効化。タップで Popover が開く |
| Popover 詳細 | uncontrolled → controlled に変更。表示内容は変更なし |
| DragOverlay（シート並べ替え） | `ComparisonRobotPanel` を使うため自動的に新デザインが反映 |
| CompareDragOverlayCard（メニュー/お気に入りドラッグ） | 変更なし（意図的） |
| CompareInsertionPreviewCard | 新デザインと揃ったスケルトンに更新 |
| ロボット一覧・詳細ページ | 変更なし |

---

## リスクと軽減策

| リスク | 重大度 | 軽減策 |
|---|---|---|
| Popover を controlled にしたことで Radix の Escape・外クリック閉じが壊れる | 低 | `onOpenChange={setPopoverOpen}` を渡すことで Radix が Escape・外クリックで `setPopoverOpen(false)` を呼ぶ。動作維持 |
| 透過 PNG 未登録ロボットで blur 背景が目立つ | 低 | `object-contain object-center` でロボットは正面中央。blur背景は自然に見える |
| `aspect-[5/7]` で縦長すぎてグリッドが間延び | 中 | 3カラム時は幅約200px、高さ約280px。スクショで実確認する |
| top overlay の gradient がロボット頭部を隠す | 低 | `object-center` なら顔は中央付近。gradient は上端30%程度 |
| overlay `onClick` がデスクトップ D&D 中に発火する | なし | `activationConstraint: { distance: 6 }` により drag 開始後は click イベントが発火しない |

---

## 検証コマンド

```bash
npx tsc --noEmit   # 型チェック
npm run build      # ビルド
```

---

## 手動確認チェックリスト

### 表示
- [ ] カードが `aspect-[5/7]` 縦型で表示される
- [ ] 画像あり: blur 背景 + object-contain 前景が重なる
- [ ] 画像なし: `'公式画像申請中'` が表示される
- [ ] top overlay に ≡アイコン + ロボット名 + ★ + ✕ が表示される
- [ ] bottom-right にメーカー名が表示される
- [ ] deploymentStage バッジが表示されない

### インタラクション（デスクトップ）
- [ ] 画像エリアクリック: Popover が開く
- [ ] top overlay クリック（robot名付近）: Popover が開く
- [ ] ★ クリック: お気に入り切替、Popover は開かない
- [ ] ✕ クリック: カード削除、Popover は開かない
- [ ] Popover: 内容（coreRows・detailRows・ロボットページリンク）が表示される
- [ ] Popover: Escape / 外クリック / ✕ボタンで閉じる
- [ ] top overlay ドラッグ（6px以上移動）: D&D で並べ替えができる、Popover は開かない
- [ ] DragOverlay: ドラッグ中に持ち上がるカードが新デザインで表示される
- [ ] CompareInsertionPreviewCard: ドラッグ中プレビューが新デザインと揃う

### インタラクション（モバイル 375px）
- [ ] 画像エリアタップ: Popover が開く
- [ ] ロボット名・≡アイコン付近タップ: Popover が開く
- [ ] ★ タップ: お気に入り切替、Popover は開かない
- [ ] ✕ タップ: カード削除、Popover は開かない
- [ ] D&D が発動しない

### グリッド
- [ ] sm（2カラム）: レイアウト崩れなし
- [ ] xl（3カラム）: レイアウト崩れなし
- [ ] カードが均一なサイズで並ぶ

### a11y
- [ ] Tab でカード内ボタンにフォーカスできる
- [ ] Popover trigger に `aria-label` が付いている
- [ ] ★ ✕ に `aria-label` / `aria-pressed` が付いている
- [ ] Popover 開閉後フォーカスが適切に戻る（Radix デフォルト）
