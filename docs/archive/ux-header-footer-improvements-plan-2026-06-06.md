# UX改善計画：Header sticky化・Skip nav・Scroll lock・Back to top・特殊ページ

作成日: 2026-06-06

---

## 目的

調査で洗い出したHeader/Footer/特殊ページのUX未実装項目を実装する。

対象:
1. グローバルHeader のsticky化
2. StickyPageHeader の `top` 値修正（Headerがstickyになることで必要）
3. Skip navigation リンク
4. モバイルメニュー時のbody scroll lock
5. Back to top ボタン（Footer）
6. `not-found.tsx`（カスタム404）
7. `error.tsx`（ランタイムエラーUI）

---

## 調査済みファイル

| ファイル | 現状 |
|---|---|
| `components/Header.tsx` | `relative border-b border-border bg-background`。NOT sticky。モバイルbackdrop=`fixed z-40`、nav=`absolute z-50` |
| `components/Footer.tsx` | logo + nav + copyright のみ。back-to-top なし。Server Component |
| `src/app/layout.tsx` | `<main className="flex-1">` — id属性なし。skip nav なし |
| `components/StickyPageHeader.tsx` | `sticky top-0 z-30`。Headerがstickyになると `top` がずれる |
| `lib/siteLayout.ts` | `GLOBAL_HEADER_HEIGHT = 64` — 正本 |
| `src/app/globals.css` | `focus-visible` スタイルあり。`prefers-reduced-motion` あり |
| `src/app/not-found.tsx` | 存在しない |
| `src/app/error.tsx` | 存在しない |

---

## 再利用する既存コード

| 再利用元 | 使い方 |
|---|---|
| `GLOBAL_HEADER_HEIGHT` (`lib/siteLayout.ts`) | StickyPageHeader の `top-16` の根拠として参照 |
| `ThemeModeToggle.tsx` の `prefers-reduced-motion` パターン | BackToTopButton のスクロール挙動制御に流用 |
| `.site-container` | not-found / error ページのレイアウト |
| `siteNavItems` (`lib/siteNavigation.ts`) | not-found ページのナビリンク |

---

## 変更・新規ファイル一覧

### 変更

| ファイル | 変更内容 |
|---|---|
| `components/Header.tsx` | `relative` → `sticky top-0 z-40`。body scroll lock の `useEffect` 追加 |
| `components/StickyPageHeader.tsx` | `top-0` → `top-16`（グローバルHeader分のオフセット） |
| `src/app/layout.tsx` | `<main>` に `id="main-content"` と `tabIndex={-1}` 追加。`<Header />` 直前にskip navリンク追加 |
| `components/Footer.tsx` | `BackToTopButton` を import して配置 |

### 新規

| ファイル | 内容 |
|---|---|
| `components/BackToTopButton.tsx` | `'use client'`。`prefers-reduced-motion` 対応。Footer Server Componentを汚染しないよう分離 |
| `src/app/not-found.tsx` | カスタム404。既存デザイントークン使用。ホームおよびサイトナビへのリンクあり |
| `src/app/error.tsx` | `'use client'`。`reset` ボタン（再試行）+ ホームへの `<a>` タグ（ネイティブaタグ。エラー時でもナビゲート可能） |

### 変更しないファイル

- `lib/siteLayout.ts`（GLOBAL_HEADER_HEIGHT 変更なし）
- `lib/useStickyScroll.ts`（ロジック変更なし）
- `components/RobotsHeader.tsx`、`ManufacturersHeader.tsx`、`ReportsHeader.tsx`（StickyPageHeader 経由なので top-16 修正で自動追従）

---

## z-index スタック（変更後）

| 要素 | z-index | 備考 |
|---|---|---|
| StickyPageHeader | 30 | ページ内サブヘッダー。グローバルHeaderの下 |
| Global Header | **40** | sticky。サブヘッダーの上 |
| モバイルbackdrop（Header内） | 40 | Header stacking context内。全画面を覆う |
| モバイルnav dropdown（Header内） | 50 | backdrop上に重なる |

`sticky z-40` は stacking context を生成する。Header内の `fixed z-40` backdrop と `absolute z-50` navは
Header stacking context内で評価されるため、StickyPageHeader（z-30 in root）より常に上に来る。

---

## 実装順序

```
1. components/StickyPageHeader.tsx — top-16 変更（Header sticky化の前提）
2. components/Header.tsx — sticky top-0 z-40 + body scroll lock
3. src/app/layout.tsx — skip nav リンク + main id + tabIndex
4. components/BackToTopButton.tsx — 新規作成
5. components/Footer.tsx — BackToTopButton 追加
6. src/app/not-found.tsx — 新規作成
7. src/app/error.tsx — 新規作成
8. npm run build — 型・ビルド確認
```

---

## 実装仕様

### 1. StickyPageHeader.tsx

```tsx
// top-0 → top-16
<div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
```

### 2. Header.tsx

sticky化:
```tsx
<header className="sticky top-0 z-40 border-b border-border bg-background">
```

body scroll lock（既存の `useEffect` 群の末尾に追加）:
```tsx
useEffect(() => {
  document.body.style.overflow = isMenuOpen ? 'hidden' : '';
  return () => { document.body.style.overflow = ''; };
}, [isMenuOpen]);
```

### 3. layout.tsx

skip nav リンク:
```tsx
<a
  href="#main-content"
  className="absolute left-4 top-4 z-50 -translate-y-16 rounded bg-background px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border transition-transform focus:translate-y-0"
>
  コンテンツへスキップ
</a>
<Header />
<main id="main-content" tabIndex={-1} className="flex-1 outline-none">
  {children}
</main>
```

### 4. BackToTopButton.tsx

```tsx
'use client';
import { ArrowUp } from 'lucide-react';

export function BackToTopButton() {
  function handleClick() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'instant' : 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      aria-label="ページトップへ戻る"
    >
      <ArrowUp className="h-3 w-3" />
      トップへ
    </button>
  );
}
```

### 5. not-found.tsx

既存デザイントークン使用。`siteNavItems` は import せず、主要リンクをシンプルに手書き（not-found は静的でよい）。

### 6. error.tsx

`reset` ボタン + `<a href="/">` のネイティブaタグ（Next.js `<Link>` ではなくaタグ。エラー状態でもナビゲート可能にするため）。

---

## リスクと軽減策

| リスク | 内容 | 軽減策 |
|---|---|---|
| iOS Safari body scroll lock 非対応 | `overflow: hidden` 単体ではiOS Safariでスクロールが止まらない | 今回は `overflow-hidden` のみ実装。既知制限として手動確認項目に記載。完全対応（`position: fixed` + `top: -scrollY`）は別タスク |
| anchor link がHeaderに隠れる | sticky化後にページ内リンクのスクロール先がHeaderの下に隠れる | 現時点でサイト内anchor linkは確認されていない。TOC等を後実装する際に `scroll-margin-top` を追加する方針を明記 |
| skip nav `sr-only` のTailwind v4互換 | `focus:not-sr-only` がv4で変わっている可能性 | `sr-only` の代わりに `absolute -translate-y-full focus:translate-y-0` パターンで実装（v4依存なし） |
| error.tsx reset ループ | データフェッチエラーで reset を押すと同じエラーが再発し無限ループになりうる | reset ボタンと `<a href="/">` の2択を置く。リロードではなくナビゲーションで回避 |

---

## 検証コマンド

```bash
npm run build   # 型エラー・ビルドエラー確認
```

---

## 手動確認チェックリスト

### Header sticky

- [ ] ページスクロール時にHeaderが画面上部に固定されている
- [ ] StickyPageHeader（ロボット一覧・メーカー一覧・記事）がグローバルHeaderの直下（top-16）に固定される
- [ ] StickyPageHeaderとグローバルHeaderが重ならない

### Skip navigation

- [ ] Tabキーでページをナビゲートしたとき「コンテンツへスキップ」リンクが出現する
- [ ] スキップリンクをクリック/Enterで `#main-content` へフォーカスが移動する

### Body scroll lock

- [ ] モバイル幅でハンバーガーメニューを開いたとき背後のページがスクロールできない
- [ ] モバイルメニューを閉じたあとページのスクロールが復帰する
- [ ] iOS Safari（既知制限）: 完全には止まらない可能性あり。確認して記録

### Back to top

- [ ] Footerの「トップへ」ボタンをクリックするとページ最上部へスクロールする
- [ ] `prefers-reduced-motion` 環境でスクロールが instant になる

### 特殊ページ

- [ ] `/存在しないパス` で not-found.tsx のUIが出る
- [ ] not-found からホームへのリンクが動作する
- [ ] error.tsx のUIが既存デザインと整合している

---

## 残るリスク（実装後も存在）

- iOS SafariのBody scroll lock未完全対応（既知）
- サイト内anchor linkを後で実装する場合、`scroll-margin-top: 64px + α` が必要
