# 比較ページ カードUI改修計画 — タブ廃止 & Popover詳細パネル導入

作成: 2026-06-10  
改訂: 2026-06-10（7点のレビュー指摘を反映）

---

## 目的

`ComparisonRobotPanel` の tab UI（基本/詳細）をカード内から撤廃し、
サムネクリックで開く **Radix Popover** に詳細情報を移す。

カード本体は「ロボット名・メーカー・★・✕・サムネ・代理店」のみに絞り、
比較ページ全体の情報密度とスキャン性を改善する。

---

## 最終カード仕様

### ComparisonRobotPanel（新）

```
┌──────────────────────────────────────────┐
│ [≡ drag] ロボット名             ★   ✕   │  ← ヘッダー（D&D ハンドル + keyboard sortable の入口）
│          メーカーロゴ メーカー名           │
├──────────────────────────────────────────┤
│                                          │
│           サムネ画像                     │  ← <button onPointerDown stopProp>
│    [aspect-3/2 / object-contain]         │    Popover.Trigger
│                                          │
├──────────────────────────────────────────┤
│ 代理店  TechShare（または入手性ラベル）   │  ← フッター 1行
└──────────────────────────────────────────┘
```

**ヘッダーについての注意**: `dragHandleProps.attributes` / `dragHandleProps.listeners` が spread されており、
これは keyboard sortable の入口でもある。
サムネに `onPointerDown stopPropagation` を足す設計は正しいが、
keyboard sortable 操作はヘッダーにフォーカスが当たった状態で行われるため、
本改修でその挙動は変わらない。ただし手動確認項目に明記する。

### Popover 内（クリックで開く、幅 min(400px, 90vw)）

```
ロボット名                              [✕]
────────────────────────────────────────
コアスペック
  参考価格   ────   問い合わせ
  国内対応   ────   国内代理店あり
  提供段階   ────   量産段階
  可搬重量   ────   標準（5〜15kg）
  稼働時間   ────   標準（90〜180分）
────────────────────────────────────────
詳細データ
  外形寸法   ────   130cm / 45kg
  自由度     ────   43 DoF
  移動方式   ────   二足歩行
  防塵防水   ────   IP52
────────────────────────────────────────
向く用途
  • 製造ラインの部品組付け
  ...
向かない用途 / 強み / 制約（データある項目のみ表示）
────────────────────────────────────────
[→ ロボット詳細ページへ]
```

### CompareInsertionPreviewCard（ゴースト、新）

```
┌──────────────────────────────────────────┐
│  ロボット名（スケルトン）                 │
│  メーカー名（スケルトン）                 │
├──────────────────────────────────────────┤
│      [aspect-3/2 bg-muted スケルトン]    │
├──────────────────────────────────────────┤
│  代理店 ─────────── （スケルトン）        │
└──────────────────────────────────────────┘
```

---

## 変更ファイル一覧

| ファイル | 変更種別 | 概要 |
|---|---|---|
| `components/ComparisonRobotPanel.tsx` | 改修（主） | tab廃止・Popover追加・フッター追加 |
| `components/compare/CompareParts.tsx` | 改修 | `CompareInsertionPreviewCard` をタブなし構造に合わせる |
| `lib/uiText.ts` | 追加 | Popover 用の新ラベルキー追加 |

### 変更しないファイル

- `components/SortableCompareCard.tsx` — D&D ラッパーのみ、変更不要
- `lib/robotDisplay.ts` — `getComparisonCoreRows` / `getComparisonDetailRows` はそのまま Popover 内で流用
- `lib/labels.ts` — `japanAvailabilityLabels` をそのまま使う
- `data/types.ts` — Robot.distributorJapan / japanAvailability は現行フィールドで足りる
- `src/app/compare/page.tsx` — props の渡し方は変わらない
- `components/CompareClient.tsx` — 変更なし

---

## 意図的に変える挙動

- **tab bar（基本/詳細）の廃止**: カード内の Left/Right キー tab 切替（`handleTabKeyDown`）は削除される。
  代わりに Popover がキーボード操作可能なパネルとして機能する（Tab/Shift+Tab でフォーカス移動、Escape で閉じる）。

---

## 実装手順

### Step 1 — `lib/uiText.ts` に Popover 用ラベルを追加

`comparison` オブジェクトに以下を追加する。
既存キー（`tabBasic` / `tabDetailed` / `detailedData` / `coreVariables`）は
既存参照や後方互換のため **削除しない**。
（Popover 内で使うのは `coreVariables` / `detailedData`。`tabBasic` / `tabDetailed` は参照箇所があれば壊れるため残す）

```ts
// comparison: { ... } に追加
distributor: '代理店',
detailsLabel: '詳細',                                          // ホバーオーバーレイの表示テキスト
detailsAria: (name: string) => `${name}の詳細を確認する`,      // サムネ button の aria-label
closeDetail: '詳細を閉じる',                                    // Popover 閉じるボタンの aria-label
viewRobotPage: 'ロボット詳細ページへ',                          // Popover 内リンクテキスト
```

---

### Step 2 — `components/ComparisonRobotPanel.tsx` 改修

#### 2-a. import 変更

削除:
```ts
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
```

追加・変更:
```ts
// Radix import は既存コードの命名規約に合わせ "as PopoverPrimitive" を使う
// （他コンポーネント: import { Popover as PopoverPrimitive } from 'radix-ui'）
import { Popover as PopoverPrimitive } from 'radix-ui';
import Link from 'next/link';
import { japanAvailabilityLabels } from '@/lib/labels';
```

lucide-react は既存の `import { Star, X }` と統合して1行にまとめる:
```ts
// 変更前
import { Star, X } from 'lucide-react';
// 変更後（ExternalLink 追加、X は XIcon として残す）
import { ExternalLink, Star, X, X as XIcon } from 'lucide-react';
```

> 補足: `X` と `X as XIcon` を同一 import に書くと重複エラーになる。
> 実装では既存の `X`（✕ボタン）はそのまま残し、Popover.Close 用の close アイコンは同じ `X` を使うか、`XIcon` に一本化するかを選択する。
> **推奨**: Popover.Close でも `X` を使い、alias は不要にする。`import { ExternalLink, Star, X } from 'lucide-react';` の1行で完結。


#### 2-b. state / tab 関連をすべて削除

削除対象:
- `const [activeTab, setActiveTab] = useState<'basic' | 'detailed'>('basic');`
- `const basicTabId`, `basicPanelId`, `detailedTabId`, `detailedPanelId`
- `handleTabKeyDown` 関数

#### 2-c. 代理店表示値を計算

```ts
const distributorDisplay =
  robot.distributorJapan ?? japanAvailabilityLabels[robot.japanAvailability];
```

#### 2-d. JSX 全体を置き換え

```tsx
return (
  <article className="flex flex-col border border-border bg-card text-card-foreground h-full relative">

    {/* ── ヘッダー（D&D ハンドル + keyboard sortable 入口）── 変更なし */}
    <div
      className={`border-b border-border-subtle bg-muted p-3 flex flex-col gap-4 ${
        dragHandleProps
          ? 'cursor-grab touch-none select-none active:cursor-grabbing'
          : ''
      }`}
      aria-label={dragHandleProps ? uiText.comparison.reorderAria(robot.nameJa ?? robot.name) : undefined}
      title={dragHandleProps ? uiText.comparison.reorderHint : undefined}
      {...dragHandleProps?.attributes}
      {...dragHandleProps?.listeners}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-semibold text-foreground truncate"
            title={robot.nameJa ?? robot.name}
          >
            {robot.nameJa ?? robot.name}
          </h3>
          <ManufacturerLogoName
            name={manufacturerName ?? robot.manufacturerSlug}
            logo={manufacturerLogo}
            className="mt-1 text-xs text-muted-foreground"
            frameClassName="h-4 w-4 shrink-0"
            imageClassName="h-3 w-3"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={
              isFavorite
                ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
                : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
            }
            aria-pressed={isFavorite}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onFavoriteToggle(robot.slug)}
            className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            <Star
              className={`h-4 w-4 ${
                isFavorite ? 'fill-favorite text-favorite' : 'currentColor'
              }`}
            />
          </button>
          <button
            type="button"
            aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onRemove(robot.slug)}
            className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    {/* ── サムネ（Popover トリガー）── */}
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={uiText.comparison.detailsAria(robot.nameJa ?? robot.name)}
          onPointerDown={(event) => event.stopPropagation()}
          className="group relative block w-full border-b border-border-subtle bg-muted
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="aspect-[3/2] w-full overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.src}
                alt={hero.alt}
                className="h-full w-full object-contain transition-opacity duration-200 group-hover:opacity-80"
              />
            ) : (
              uiText.robots.mainImageMissing
            )}
          </div>
          {/* ホバーオーバーレイ（aria-hidden: 視覚的ヒントのみ） */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center
                       bg-black/0 group-hover:bg-black/20 transition-colors duration-200"
          >
            <span
              className="rounded-sm bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              {uiText.comparison.detailsLabel}
            </span>
          </div>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        {/*
          onOpenAutoFocus は削除し Radix デフォルト（Popover.Close にフォーカス）に任せる。
          z-index は className="z-[var(--z-dropdown)]" のみで管理（style prop 不要）。
          Portal が body 直下レンダリングのため dnd z:20 との競合はない。
        */}
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-[var(--z-dropdown)] w-[min(400px,90vw)] max-h-[80vh] overflow-y-auto
                     border border-border bg-card text-card-foreground shadow-lg
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {/* Popover ヘッダー */}
          <div className="flex items-center justify-between gap-3 border-b border-border p-3">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {robot.nameJa ?? robot.name}
            </h4>
            <PopoverPrimitive.Close
              aria-label={uiText.comparison.closeDetail}
              className="shrink-0 p-1 text-muted-foreground hover:text-foreground
                         rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <XIcon className="h-4 w-4" />
            </PopoverPrimitive.Close>
          </div>

          <div className="p-3 space-y-5">
            {/* コアスペック */}
            <section>
              <h5 className="mb-2 text-xs font-semibold text-foreground pb-1.5 border-b border-border-subtle">
                {uiText.comparison.coreVariables}
              </h5>
              <dl className="space-y-2 text-xs">
                {coreRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-3 border-b border-border-subtle pb-2 last:border-0 last:pb-0"
                  >
                    <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-medium text-foreground break-words max-w-[65%]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* 詳細データ */}
            <section>
              <h5 className="mb-2 text-xs font-semibold text-foreground pb-1.5 border-b border-border-subtle">
                {uiText.comparison.detailedData}
              </h5>
              <dl className="space-y-2 text-xs">
                {detailRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-3 border-b border-border-subtle pb-2 last:border-0 last:pb-0"
                  >
                    <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-medium text-foreground break-words max-w-[65%]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* 適合情報（データある項目のみ） */}
            {(robot.comparison.bestFit.length > 0 ||
              robot.comparison.notFit.length > 0 ||
              robot.comparison.strengths.length > 0 ||
              robot.comparison.constraints.length > 0) && (
              <section className="space-y-3">
                {robot.comparison.bestFit.length > 0 && (
                  <div>
                    <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.bestFit}</h5>
                    <CompactList items={robot.comparison.bestFit} />
                  </div>
                )}
                {robot.comparison.notFit.length > 0 && (
                  <div>
                    <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.notFit}</h5>
                    <CompactList items={robot.comparison.notFit} />
                  </div>
                )}
                {robot.comparison.strengths.length > 0 && (
                  <div>
                    <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.strengths}</h5>
                    <CompactList items={robot.comparison.strengths} />
                  </div>
                )}
                {robot.comparison.constraints.length > 0 && (
                  <div>
                    <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.constraints}</h5>
                    <CompactList items={robot.comparison.constraints} />
                  </div>
                )}
              </section>
            )}

            {/* 詳細ページリンク */}
            <Link
              href={`/robots/${robot.slug}`}
              className="flex items-center justify-between border border-border p-2.5 text-xs
                         text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <span>{uiText.comparison.viewRobotPage}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>

    {/* ── 代理店フッター ── */}
    <div className="mt-auto border-t border-border-subtle p-3">
      {/*
        dl で dt/dd を包む（dt/dd は dl の外に出してはいけない）
        flex レイアウトは dl に直接付ける
      */}
      <dl className="flex items-center justify-between gap-2 text-xs">
        <dt className="shrink-0 text-muted-foreground">{uiText.comparison.distributor}</dt>
        <dd className="text-right font-medium text-foreground truncate">{distributorDisplay}</dd>
      </dl>
    </div>

  </article>
);
```

---

### Step 3 — `components/compare/CompareParts.tsx` の `CompareInsertionPreviewCard` 改修

tab bar 行（`uiText.comparison.addToSheet` を表示していた `div`）を削除し、
新カード構造（ヘッダー・サムネ・代理店フッター）に合わせてスケルトンを組み替える。

#### 変更前

```tsx
// tab bar 相当のスケルトン行（削除）
<div className="border-b border-border-subtle bg-card px-3 py-2 text-center text-xs font-medium text-muted-foreground">
  {uiText.comparison.addToSheet}
</div>

<div className="aspect-[3/2] border-b border-border-subtle bg-muted/80" />

<div className="mt-auto space-y-2.5 p-3">
  <div className="h-3 w-24 bg-muted" />
  <div className="h-3 w-full bg-muted" />
  <div className="h-3 w-4/5 bg-muted" />
</div>
```

#### 変更後

```tsx
{/* サムネスケルトン */}
<div className="aspect-[3/2] border-b border-border-subtle bg-muted/80" />

{/* 代理店フッタースケルトン（dl/dt/dd で構造を揃える） */}
<div className="mt-auto border-t border-border-subtle p-3">
  <dl className="flex items-center justify-between gap-2">
    <dt className="h-3 w-12 bg-muted rounded-sm" />
    <dd className="h-3 w-20 bg-muted rounded-sm" />
  </dl>
</div>
```

---

## 代理店表示ロジック（詳細）

```ts
// robot.distributorJapan は任意フィールド（社名文字列 e.g. 'TechShare'）
// robot.japanAvailability は enum → japanAvailabilityLabels でラベル化
//   'official-japan'     → '公式日本法人あり'
//   'distributor-japan'  → '国内代理店あり'
//   'inquiry-required'   → '問い合わせ必要'
//   'import-only'        → '並行輸入のみ'
//   'unavailable'        → '国内取扱なし'
//   'unknown'            → '要確認'

const distributorDisplay =
  robot.distributorJapan ?? japanAvailabilityLabels[robot.japanAvailability];
```

distributorJapan が設定されているロボット（現時点）:
- `unitree-g1`: 'TechShare'
- `nichiei-kiko-robot`（他）: '日栄機工株式会社'

未設定のロボットは japanAvailability ラベルにフォールバックする。

---

## D&D 競合回避（重要）

dnd-kit は `pointerdown` → 一定距離移動で drag 判定する。
ドラッグハンドル以外の要素で `onPointerDown={(e) => e.stopPropagation()}` を付けると
その要素上でドラッグが始まらなくなる（クリックは正常に動く）。

```
現行で実施済み:  ★ボタン, ✕ボタン
今回追加が必要:  サムネ <button>（PopoverPrimitive.Trigger の asChild 子要素）
```

`Popover.Trigger asChild` を使う場合、`onPointerDown` は Trigger の直の子 element（`<button>`）に付ける。

---

## z-index 管理

`globals.css` の定義:
```
--z-overlay: 38
--z-header: 40
--z-dropdown: 50
--z-modal: 60
--z-toast: 70
```

`PopoverPrimitive.Content` は `PopoverPrimitive.Portal` で body 直下にレンダリングされるため、
比較カードの `z-index:20`（ドラッグ中）は上書きされない。
`className="z-[var(--z-dropdown)]"` のみで管理し、`style` prop は使わない。

---

## uiText 追加キー一覧（最終）

```ts
comparison: {
  // 既存キーは変更なし（tabBasic / tabDetailed / coreVariables / detailedData など）
  // 追加:
  distributor: '代理店',
  detailsLabel: '詳細',                                          // ホバーオーバーレイ表示テキスト
  detailsAria: (name: string) => `${name}の詳細を確認する`,      // サムネ button aria-label
  closeDetail: '詳細を閉じる',                                    // Popover ✕ボタン aria-label
  viewRobotPage: 'ロボット詳細ページへ',                          // Popover 内リンクテキスト
}
```

---

## リスクと軽減策

| # | リスク | 重大度 | 対応 |
|---|---|---|---|
| 1 | サムネ上でのドラッグが Popover を誤開 | 高 | `onPointerDown stopPropagation` 必須。Trigger の `asChild` 子 `<button>` に付ける |
| 2 | Popover が viewport 外にはみ出す | 中 | `collisionPadding=8` / `avoidCollisions`（Radix デフォルト有効） |
| 3 | `CompareInsertionPreviewCard` が新カードと高さ不一致でガタつく | 中 | スケルトンのフッター1行を `dl/dt/dd` で追加し構造を揃える |
| 4 | `tabBasic`/`tabDetailed` キーを削除すると他所参照が壊れる | 低 | 既存参照や後方互換のため削除しない |
| 5 | `mt-auto` で代理店フッターが浮く | 低 | `article` を `flex flex-col` にしているので問題なし（現行から変わらず） |
| 6 | モバイルで比較カードが縦積みになる際 Popover が上要素と重なる | 低 | `side="bottom"` + `avoidCollisions` で自動回避 |
| 7 | keyboard sortable の挙動が壊れる | 低 | ハンドル div への `attributes/listeners` spread は変更なし。手動確認項目に明記 |

---

## 検証コマンド

```bash
npm run build   # 型・静的ビルドエラーがないこと
```

---

## 手動確認チェックリスト

### 機能確認

- [ ] サムネをクリック → Popover が開く（コアスペック・詳細・適合情報が表示される）
- [ ] Popover の ✕ ボタン → 閉じる
- [ ] Popover 外クリック → 閉じる
- [ ] Escape キー → Popover が閉じる
- [ ] ドラッグ中にサムネに触れても Popover が開かない
- [ ] ★ボタン・✕ボタンがドラッグを誤発動しない（現行と変わらず）
- [ ] カードの並び替え D&D が正常動作
- [ ] 代理店フッターに正しい値が表示される（distributorJapan あり: 社名 / なし: 入手性ラベル）
- [ ] ロボット詳細ページリンクが `/robots/[slug]` に正しく遷移する
- [ ] `CompareInsertionPreviewCard`（ドラッグ中のゴースト）がタブ行なしで表示される

### キーボード操作（a11y）

- [ ] Tab でサムネボタンに到達できる
- [ ] Enter / Space でサムネボタンを押すと Popover が開く
- [ ] Popover が開いた後、Radix デフォルトで Popover.Close にフォーカスが移る
- [ ] Popover 内で Tab → 閉じるボタン → 詳細リンクの順にフォーカスが移動する
- [ ] Popover を閉じる（✕ ボタン / Escape）と trigger（サムネボタン）にフォーカスが戻る
- [ ] ヘッダーにフォーカスし、Space/Enter で持ち上げ、矢印キーで移動、Space/Enter で確定できる（keyboard sortable、現行と同じ）
- [ ] **廃止**: 旧 tab bar の Left/Right キー切替（`handleTabKeyDown`）は削除されていることを確認

### レイアウト

- [ ] 375px モバイル幅で横スクロールが発生しない
- [ ] ダークモードで Popover 内の配色が崩れない
- [ ] Popover が比較カラム枠からはみ出す場合に自動回避される
