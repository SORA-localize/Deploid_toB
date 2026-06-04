# shadcn/ui 移行計画 v1

**ブランチ**: `feat/shadcn-migration`
**作成日**: 2026-06-04
**目的**: 独自実装の SelectControl（`useState` + `ul/li`）を shadcn/ui（Radix UI）ベースへ移行し、アクセシビリティ・インタラクションを向上させる。

---

## スコープ

### 対象（今回やる）
- `SelectControl.tsx` → shadcn `Select` ラッパーに書き直し
- `FormSelect.tsx` → native `<select>` に置換（選択肢A）
- shadcn コンポーネント生成: `select`, `input`（inputは将来のため追加のみ）

### 対象外（今回やらない）
- `SearchInput.tsx` — アクセシビリティ上の問題なし。将来 Input を他でも使うタイミングで統一
- `ContactForm.tsx` の生 input — Formspree ロジックへの回帰リスクを避けるため別 Issue
- `button` / `label` shadcn コンポーネント追加 — スコープ外

---

## 原則チェック

| 原則 | 判断 |
|---|---|
| DRY | FilterSelect は SelectControl の薄いラッパーのまま維持。重複なし |
| KISS | SelectControl の型インターフェースを維持し、内部だけ置換 |
| Single Source of Truth | styles は globals.css のトークンのみ。shadcn デフォルト色は持ち込まない |
| Separation of Concerns | useUrlFilters などのロジック層は一切触らない |
| Type Safety | SelectControlOption 型を維持。onValueChange → onChange の変換はラッパー内で処理 |
| Accessibility | Radix UI の Select プリミティブで Portal・keyboard nav・aria を確保 |
| Responsive | SelectContent は Radix が制御。モバイル幅での viewport 超えを手動確認 |

---

## 変更するファイル

| ファイル | 変更内容 |
|---|---|
| `components/SelectControl.tsx` | 内部を shadcn `Select` に置換。型インターフェース維持 |
| `components/FormSelect.tsx` | native `<select>` に完全置換。hidden input 不要になる |
| `components/ui/select.tsx` | shadcn 生成（新規） |
| `components/ui/input.tsx` | shadcn 生成（新規・今回は参照なし） |

## 変更しないファイル

- `components/FilterSelect.tsx` — インターフェース変化なしのため不要
- `components/SearchInput.tsx` — 今回スコープ外
- `components/ContactForm.tsx` — 今回スコープ外
- `src/app/globals.css` — 角丸はコンポーネントファイル内で対処
- `components.json` — 変更しない（生成時に style 確認のみ）
- `lib/useUrlFilters.ts` 等のロジック層 — 一切触らない
- `RobotsBrowser`, `ManufacturersBrowser`, `UseCasesBrowser`, `ReportsBrowser` — SelectControl の型維持により変更不要

---

## globals.css との統合

`globals.css` は `@import "shadcn/tailwind.css"` 済みで、`@theme inline` ブロックが `--color-primary`・`--color-border`・`--color-ring`・`--color-popover` 等を jade/slate に向けている。shadcn 生成コンポーネントはこれらのトークンをそのまま使うため、**デフォルト zinc/slate 色への汚染はない**。

**角丸について**: プロジェクトの方針は矩形UI（`rounded-*` 禁止）。shadcn 生成コンポーネントに含まれる `rounded-md` 等は、**コンポーネントファイル内で直接除去**する（globals.css は変更しない）。

---

## 実装手順

```
Step 1  npm run build でベースラインのビルド通過を確認

Step 2  npx shadcn@latest add select input
        → components/ui/select.tsx, input.tsx が生成される
        → style が "radix-nova" で想定外の構造なら style:"default" に変更して再生成
        → 生成ファイルの rounded-* クラスをファイル内で直接除去

Step 3  SelectControl.tsx を shadcn Select ラッパーに書き直し
        - 型インターフェース（SelectControlOption / SelectControlProps）は完全維持
        - labelClassName / buttonClassName / listClassName prop は削除
          （内部スタイルは shadcn + globals.css トークンで完結するため）
        - label は既存の <label> タグを維持（shadcn Label は使わない）

Step 4  npm run build → 通過確認。失敗なら git stash で Step 2 の状態に戻す

Step 5  FormSelect.tsx を native <select> に置換
        - hidden input は不要になる（name 属性を <select> 自体に付与）
        - required も <select> に付与
        - labelClassName は <label> の className に直接指定

Step 6  npm run build → 最終確認

Step 7  dev サーバーで手動確認（下記チェックリスト）
```

---

## 検証コマンド

```bash
npm run build   # TypeScript チェック兼用（lint/typecheck スクリプトは未設定）
```

※ `npm run lint` / `npm run typecheck` はこのプロジェクトに存在しない。

---

## 手動確認チェックリスト

- [ ] `/robots` でフィルター全種（industry / task / manufacturer / availability）をキーボードのみで操作できる
- [ ] `/robots` でドロップダウンを開いた状態で Escape が閉じる
- [ ] `/compare` でカードをドラッグ中にドロップダウンを開き、z-index 競合がない
- [ ] `/contact` でフォームの inquiryType が送信値に含まれる（未設定環境では警告表示確認）
- [ ] ダークモード切替時にドロップダウンの背景色・文字色が正しい
- [ ] モバイル幅（375px）でドロップダウンが画面外にはみ出さない

---

## リスク

| リスク | 対策 |
|---|---|
| `style: "radix-nova"` で生成物が想定外 | Step 2 で生成物確認。問題なら `style:"default"` に変更 |
| Radix Portal の z-index が dnd-kit と競合 | Step 7 の `/compare` 手動確認で検証 |
| FormSelect の native select が既存スタイルと浮く | globals.css トークンで styling を合わせる |
| ビルド失敗時 | `feat/shadcn-migration` ブランチのため main は安全。`git stash` または直前コミットに戻す |
