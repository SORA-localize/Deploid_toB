# UI/UX 包括修正計画（調査レポート統合版）

**作成日**: 2026-06-09
**改訂**: 2026-06-09 — 調査レポート `ui-ux-pre-refactor-investigation-report-2026-06-09.md` を反映し全面再構成（旧ドラフトを置換）
**対象ブランチ**: `experiment/ui-refinement`
**根拠**: UI/UX 全調査25件（Gemini 12 + 追加13）+ 事前コード調査レポート
**性質**: 計画。実装は未着手。各フェーズ着手前にユーザー承認を取る。

> **パス注記**: コンポーネントはリポジトリ直下 `components/` にある（`src/components/` ではない）。`tsconfig.json` の `@/* → ./*` により `@/components` が直下を指す。以下は実体パスで記載。

---

## 0. この版で旧計画から変えた点（調査レポート反映）

調査で**旧計画の前提とコードが食い違う5件**が判明したため、該当フェーズを設計し直した。

| ID | 旧計画の前提 | 確定した事実 | この版での扱い |
|----|------------|------------|--------------|
| F1 | #9 TagChip は「枠線のみ」→ 背景追加 | `TagChip.tsx:32-36` は `getVisualToneClassName()` で **`bg-tone-*-bg` を既に付与済み** | 「背景追加」を撤回。**neutral tone の視覚的重み調整**に変更（P3） |
| F2 | #8/#17 EmptyState は「バリアントなし」 | `EmptyState.tsx:1-6` は `variant`/`size` を**既に保持** | 「バリアント追加」を撤回。**icon 対応の追加のみ**（P8） |
| F3 | EmptyState 改修は後方互換（A5） | 計画の新シグネチャは `variant`/`size`/`className` を落とし、`ManufacturersBrowser.tsx:130`・`RobotsBrowser.tsx:214` が**型エラー**になる | **既存4 prop を全て残し、`icon`/`description` をオプショナル追加**する設計に確定（P8） |
| F4 | A10「各フェーズで `next lint`」 | lint script も eslint 設定もなく、**Next.js 16 で `next lint` は廃止** | `next lint` を**全削除**。静的検証は `npm run build` + `npx tsc --noEmit` の2本に確定（§検証） |
| F5 | A1「グローバル h1 が Hero を縮小」 | Hero は `ManufacturerMapStage.tsx:257` で `text-3xl md:text-5xl` を明示。ユーティリティが `@layer base` の h1 に優先するため**縮小されない**。グローバル h1〜h4(`globals.css:320-342`)は `text-*` 未指定要素にしか効かず、実見出しはほぼ全て `text-*` 明示 | **グローバル h1 改修は最小化**。本丸は**コンポーネント単位の見出しサイズ不統一**（P2） |

加えて、旧計画が拾えていなかった**構造的不統一**を新規に組み込んだ:

- **最大課題**: セクション見出し `h2` が `text-sm/base/lg/2xl` の**4段階混在**（詳細・一覧ページ横断）→ P2 の本体
- **ラベル:値の表示が4実装**（`<table>` / `<dl grid>` / `flex justify-between` / `grid-cols-n`）→ P5 で整理
- **未使用資産**: `BudouXText`（budoux）・`ui/marquee.tsx` → §未使用資産 の判断事項

---

## 1. 最重要原則

- **Existing Code First**: 既存の構造・命名・責務分離を先に踏襲する。
- **Minimal Correct Change**: 目的を満たす最小変更。不要なリファクタを混ぜない。
- **Single Source of Truth**: 色・spacing・token は `globals.css` と `lib/visualSemantics.ts` に集約（CLAUDE.md）。色は直書きしない。
- **Behavior Preservation**: 明示目的以外の既存挙動を変えない。
- **意図的演出を壊さない**: Hero帯・世界地図の黒背景/白文字、RobotCard の motion tilt/glow/shimmer、カルーセル画像オーバーレイのグラデは CLAUDE.md 例外として温存。
- フェーズ完了ごとに `npm run build` + `npx tsc --noEmit` を通し `git commit`。

---

## 2. 問題一覧 → フェーズ割当（MECE）

**25問題を各1フェーズに重複なく割当（全件カバー）**。括弧内は根拠 file:line。

| # | 問題 | 担当フェーズ |
|---|------|------------|
| 5 | コンテナ幅 `max-w-[1680px]` 広すぎ（`globals.css:365`、31箇所波及） | **P1** |
| 19 | タブレットのpadding比率（`globals.css:365` `px-4 md:px-8`、sm/lg段階なし） | **P1** |
| 25 | z-index 競合（`Header.tsx:44` z-40 / `:115` z-50、トークンなし） | **P1** |
| 7 | 見出しジャンプ率不足（実体: h2 サイズ4段階不統一） | **P2** |
| 12 | 日本語 line-height 1.5 固定（`globals.css:320-360`） | **P2** |
| 15 | 見出しレスポンシブなし（本文系見出しが固定） | **P2** |
| 6 | カード/背景コントラスト不足（bg=slate-2 / card=slate-1、差1段） | **P3** |
| 9 | TagChip の neutral tone が視覚的に弱い（bg は既存・F1） | **P3** |
| 4 | 縦余白が不統一（py-5/8/12 + sm有無が混在） | **P4** |
| 2 | スペック表 大画面で余白（`robots/[slug]:113,204` `<table w-full>`上限なし） | **P5** |
| 16 | スペック表モバイル横スクロール保護なし（`overflow-x-auto`欠落） | **P5** |
| 11 | アイコン未活用（実体: スペック表のみ未適用） | **P5** |
| 3 | プレースホルダ画像（`RobotCard.tsx:130`） | **P6** |
| 10 | ManufacturerCard ホバー弱い（NewsCard は要再評価・F付録） | **P6** |
| 13 | カルーセル h-[420px] 固定（**RobotImageCarousel限定**`:67,82`） | **P6** |
| 14 | RobotCard sm 欠落（`:129` `flex-row md:flex-col`） | **P6** |
| 18 | ManufacturerCard `ml-4` 過剰（`:72,78,84,91,153`） | **P6** |
| 21 | NewsCard 画像遷移（`:27` `w-24→sm:aspect-video`） | **P6** |
| 1 | 検索/フィルタが大画面で伸びる（フィルタ `xl:grid-cols-4` 上限なし） | **P7** |
| 24 | ActiveFilterChips モバイル乱れ（`:19`） | **P7** |
| 8/17 | EmptyState アイコン非対応（variant/size は既存・F2） | **P8** |
| 20 | フッターモバイル折返し（`Footer.tsx:27`） | **P9** |
| 22 | ドロップダウン Escape/focus（**ManufacturerCard 自前メニュー限定**`:27-35,109-147`） | **P9** |
| 23 | Breadcrumbs gap モバイル（`Breadcrumbs.tsx:16` `gap-2`） | **P9** |

> 検証: 25件すべてが上表に一意で出現（#8と#17は同一の EmptyState 課題として P8 に統合）。

---

## 3. フェーズ構成（上流→下流）

```
P1 レイアウト基盤      : コンテナ幅・padding段階・z-index体系       → commit
P2 タイポグラフィ階層  : h2サイズ統一・見出しレスポンシブ・line-height → commit
P3 コントラスト・色    : カード境界・TagChip neutral重み              → commit
P4 縦余白リズム        : py/mb の不統一を階層化（先行3ページ）        → commit
P5 スペック/ファクト表 : 4実装の整理・幅上限・横スクロール・アイコン  → commit
P6 カード・画像        : カルーセル/RobotCard/Manufacturer/News        → commit
P7 検索・フィルタUI    : フィルタ幅上限・ActiveFilterChips             → commit
P8 EmptyState 完成度   : icon 追加（既存prop温存）                     → commit
P9 a11y・モバイル      : 自前メニュー→Radix Popover・Footer・Breadcrumbs → commit
```

各フェーズは独立コミット。フェーズをまたぐ変更をしない。

---

## P1: レイアウト基盤

**Issues**: #5, #19, #25
**目的**: 全ページに波及するコンテナ幅・左右padding段階・z-index を正す。

### 変更ファイル
| ファイル | 変更 |
|---------|------|
| `globals.css` | `.site-container` の max-width / padding段階、z-index トークン |
| `components/Header.tsx`, `components/HeaderChrome.tsx` | z-index のトークン参照化 |
| 各 sticky header（`RobotDetailStickyHeader` 等） | z-index 参照の統一 |

### 方針
- **コンテナ幅**: `max-w-[1680px]` → 一般的な上限（`1280px`〜`1440px` のいずれか）。段階padding `px-4 sm:px-6 md:px-8 lg:px-12` を導入。**31箇所に波及**（調査4）するため P1 後に全ページ目視。
- **z-index（#25・要注意）**: `Header.tsx:44` z-40 / `:115` z-50、ドロップダウン z-10/z-20 が混在。階層を `--z-dropdown < --z-sticky < --z-header < --z-modal < --z-toast` で固定。
  > **A7 への補足（調査25）**: Tailwind v4 の `@theme inline` は色/spacing 等の namespace のみ utility を自動生成し、**`--z-*` から `z-dropdown` 等は自動生成されない**。`:root`（または `@theme`）に CSS 変数として定義し、利用側は `z-[var(--z-header)]` 形式で参照する。

### 検証
```bash
npm run build && npx tsc --noEmit
grep -rn "z-40\|z-50\|z-10\|z-20" components/Header.tsx components/HeaderChrome.tsx
```
- [ ] 1280px で全ページのコンテナが中央寄せで適切
- [ ] 375px で横スクロールなし
- [ ] ドロップダウンがヘッダーに潜り込まない

**commit**: `fix(layout): normalize container width, padding scale, z-index tokens`

---

## P2: タイポグラフィ階層 ★本丸

**Issues**: #7, #12, #15
**目的**: **セクション見出し `h2` の4段階混在を解消**し、見出しに階層とレスポンシブを与える。

### 確定事実（調査3）— 同じ「セクション見出し」で4段階混在
| 箇所 | サイズ |
|------|-------|
| `robots/[slug]/page.tsx:112,131,201` | `text-sm` |
| `reports/[slug]/page.tsx:142` / `:166` | `text-base` / `text-sm` |
| `use-cases/[slug]/page.tsx:83` / `:115,121,125` | `text-sm` / `text-lg` |
| `guides/[slug]/page.tsx:121` | `text-lg` |
| `ManufacturerDetailSection.tsx:33` / `ManufacturerFactSheet.tsx:116` | `text-2xl` |
| 一覧 h1（`RobotsBrowser:160`・`ManufacturersBrowser:85`・`GuidesBrowser:50`・`UseCasesBrowser:80`） | `text-2xl`（系統一致） |
| 詳細 h1（`robots/[slug]:91`・`use-cases/[slug]:55`） | `text-3xl`（系統一致） |

### 方針
- **セクション見出し h2 の標準サイズを1つに決めて全詳細ページで統一**（候補: `text-lg font-semibold` を基準。CLAUDE.md「モノスペースのセクションラベル」を別途残す箇所は `text-xs uppercase tracking-wide` 等の**ラベル**として h2 とは役割分離）。
  - 対象: `robots/[slug]`・`use-cases/[slug]`・`guides/[slug]`・`reports/[slug]`・`ManufacturerDetailSection`・`ManufacturerFactSheet`。
- **見出しレスポンシブ（#15）**: 詳細 h1 に `text-2xl md:text-3xl` 等の段階を付与。Hero（`ManufacturerMapStage.tsx:257`）は既に `md:text-5xl` のため**対象外**。
- **line-height（#12）**: グローバル `h1〜h4`（`globals.css:320-342`）の `line-height:1.5` を見出し用に詰める（例 1.3〜1.4）。**F5 の通りグローバル改修の効果は限定的**なので、実効は各コンポーネントの className 側で担保する。本文の line-height は 1.7〜1.8 を維持。
  > 旧計画の `.content-prose` スコープ導入は **F5 により再検討**。グローバル h1 が Hero を縮小しない以上、`.content-prose` の主目的（Hero保護）は不要。本文行間専用に小さく使うかは P2 着手時にユーザー判断。

### 検証
```bash
npm run build && npx tsc --noEmit
grep -rn "h2.*text-sm\|h2.*text-base\|h2.*text-lg\|h2.*text-2xl" src/app components/
```
- [ ] 全詳細ページでセクション h2 のサイズが一致
- [ ] h1→h2→本文の階層がビジュアルで明確
- [ ] Hero のサイズが不変（375/1280px）

**commit**: `fix(typography): unify section heading scale, add responsive sizes, tune line-height`

---

## P3: コントラスト・色

**Issues**: #6, #9
**目的**: カード境界を明確化し、TagChip の neutral tone に視覚的重みを与える。

### 方針
- **コントラスト（#6）**: 現状 page `bg=slate-2`(`globals.css:32`) / card `slate-1`(`:34`) で明度差1段。差を広げる手段は2択（P3着手時に決定）:
  - (a) ページ背景を `slate-3` に下げる（旧 A3 の Option A+B）
  - (b) `--border`(`:50` slate-6) を強化 / `.card-data`(`:369-374`) の border を一段濃く
  - ダーク（`globals.css:393-424`）両モードで確認。
- **TagChip（#9・F1反映）**: 背景は**既にある**（`getVisualToneClassName` → `bg-tone-*-bg`）。問題は neutral の `--tone-neutral-bg=slate-3`(`:79`) が薄いこと。**neutral tone の bg/border/font-weight を一段強める**か、用途に応じて `tone` を neutral 以外へ寄せる。`visualSemantics.ts:27-58` の token を使い、直書きしない。

### リスク
- token 変更は `:root`/`visualSemantics` 経由で**全UIに波及**（調査4・最大）。TagChip 7箇所・`.card-data` 4箇所を変更前に確認。

### 検証
```bash
npm run build && npx tsc --noEmit
grep -rn "TagChip\|card-data" src/app components/
```
- [ ] ライト/ダーク両方でカードと背景の境界が見える
- [ ] TagChip がテキストと明確に区別できる

**commit**: `fix(design): strengthen card contrast and tag chip neutral tone weight`

---

## P4: 縦余白リズム

**Issues**: #4
**目的**: `py-5/8/12` + sm有無の混在を、情報階層に応じた強弱に整える。

### 確定事実（調査3）
セクション縦余白が `py-8`（`robots/[slug]:111,130,200`）/ `py-12`（`ManufacturerFactSheet:110`）/ `py-8 sm:py-12`（`page.tsx:102,122,151`）/ 一覧 `py-5`（`RobotsBrowser:157`）で不統一。見出し下 `mb` も `mb-2/3/4/5/6` 混在。

### 方針（A6 反映: 先行3ページ限定→展開）
- 余白スケールの原則を決め（大セクション間 / グループ間 / 小区切り / 見出し→本文）、**機械置換せず**前後要素を見て使い分け。
- **先行**: `src/app/page.tsx` / `src/app/robots/page.tsx` / `src/app/robots/[slug]/page.tsx`。問題なければ別コミットで他ページ展開。

### 検証
```bash
npm run build && npx tsc --noEmit
grep -n "py-5\|py-8\|py-12\|mb-5" src/app/page.tsx "src/app/robots/[slug]/page.tsx"
```
- [ ] 先行3ページでセクションのまとまり感が改善
- [ ] 他ページの余白が未変更（先行のみ対象）

**commit**: `fix(spacing): introduce vertical rhythm on home and robots pages (pilot)`

---

## P5: スペック/ファクト表

**Issues**: #2, #16, #11
**目的**: 大画面の余白とモバイルの横はみ出しを解消し、**ラベル:値表示の4実装を整理**、表にアイコンを足す。

### 確定事実（調査3）— ラベル:値が4実装
| 実装 | 箇所 |
|------|------|
| `<table><td w-2/5 sm:w-1/3>` | `robots/[slug]:113,204`（導入判断/技術仕様） |
| `<dl grid-cols-[8rem_minmax(0,1fr)]>` | `ManufacturerFactSheet.tsx:125-135` |
| `<dl grid-cols-1 md:grid-cols-2>` | `RobotCard.tsx:167` |
| `flex justify-between` 行 | `ManufacturerCard.tsx:69-87` |
| `grid-cols-3` / `grid-cols-12` | `use-cases/[slug]:86` / `:111` |

### 方針
- **#2 幅上限**: 値エリアが 1280px 内でも広がりすぎないよう、表に `max-w-3xl` 等の上限 + `break-words`（A4 反映: 長いURL/説明の折返し保証。`ManufacturerFactSheet:102` は既に `break-all`）。
- **#16 横スクロール保護**: `robots/[slug]:113,204` の `<table>` を `overflow-x-auto` でラップ + 最小幅。
- **実装統一（構造）**: 詳細ページの「ラベル:値」を**1つのパターン（推奨 `<dl>` ベース）に寄せる**かを P5 着手時に判断。最低でも `robots/[slug]` の2 `<table>` と `ManufacturerFactSheet` の `<dl>` の方針を揃える。
- **#11 アイコン**: lucide は36ファイルで活用済み。**未適用はスペック表のみ**。行ラベル横に任意 prop でアイコンを足す（過剰装飾を避け、意味のある行に限定）。

### 検証
```bash
npm run build && npx tsc --noEmit
grep -rn "grid-cols\|<table\|<dl\|justify-between" "src/app/robots/[slug]/page.tsx" components/ManufacturerFactSheet.tsx
```
- [ ] 1280px でスペック表の右に過剰な余白がない
- [ ] 375px で表が横にはみ出さない / 長いURLが折り返る

**commit**: `fix(detail-pages): unify spec/fact tables, cap width, add mobile scroll & icons`

---

## P6: カード・画像レスポンシブ

**Issues**: #3, #10, #13, #14, #18, #21
**目的**: カルーセル/RobotCard/ManufacturerCard/NewsCard のモバイル・タブレット表示とホバーを整える。

### 確定事実（調査1・付録）
- **#13 は RobotImageCarousel 限定**（`:67,82` `h-[420px]` 固定）。`NewsHeroCarousel` は `ReportsBrowser:96` で `aspect-[16/9]`（レスポンシブ済み）→ **触らない**。
- **#10/#21 は要再評価**: RobotCard は motion tilt/glow/shimmer/底辺線で作り込み済み（**触らない**）。NewsCard は既に画像 `scale-105`(`:33`)+底辺線(`:81`)+矢印移動(`:76`) を持つ。**素なのは ManufacturerCard(`.card-data` border-colorのみ)**。
- `RobotCard` / `ManufacturerCard` は `className` prop **非対応**（調査5）。呼び出し側からホバーを渡す設計にするなら prop 追加が必要。

### 方針
| # | 対象 | 内容 |
|---|------|------|
| 13 | `RobotImageCarousel.tsx:67,82` | `h-[420px]` → `h-[280px] sm:h-[360px] md:h-[420px]` |
| 3,14 | `RobotCard.tsx:129-130` | sm 中間ブレークポイント追加。画像 object-fit を統一（A2: 切れ防止なら `object-contain`+背景。現状 `md:object-contain`(`:135`)） |
| 10 | `ManufacturerCard.tsx`（`.card-data`） | ホバーを NewsCard 相当へ引き上げ（border + 軽い shadow-sm 程度。過剰シャドウ禁止）。NewsCard は現状維持で可否を判断 |
| 18 | `ManufacturerCard.tsx:72,78,84,91,153` | `ml-4` → `ml-2 sm:ml-4` |
| 21 | `NewsCard.tsx:27` | `w-24`→`w-20 sm:w-24` 等で sm 遷移を緩和 |

### リスク
- RobotCard/ManufacturerCard 変更は一覧ページ全体に波及（調査4）。変更前後を一覧で並べて確認。

### 検証
```bash
npm run build && npx tsc --noEmit
```
- [ ] 375px でカルーセルが画面を占有しすぎない
- [ ] sm(640px) でカードが崩れない / ロボット画像が切れない
- [ ] ManufacturerCard にホバー変化がある

**commit**: `fix(cards): responsive heights/breakpoints and manufacturer card hover`

---

## P7: 検索・フィルタUI

**Issues**: #1, #24
**目的**: 大画面でのフィルタ引き伸ばしと、モバイルの ActiveFilterChips の乱れを直す。

### 確定事実
- 検索は既に `RobotsBrowser:166` で `max-w-2xl`。**伸びるのはフィルタグリッド**（`:174` `xl:grid-cols-4`、上限なし）。
- `ActiveFilterChips.tsx:19` は `flex flex-wrap items-center gap-2`。

### 方針
- **#1**: フィルタグリッドに `max-w-*`（例 `max-w-4xl`）を付け、各一覧ページ（robots/manufacturers/guides/use-cases/reports のブラウザ）で揃える。
- **#24**: 「選択中:」ラベルとチップ群をモバイルで段分け（`block` ラベル + 折返しチップ列）。

### 検証
```bash
npm run build && npx tsc --noEmit
grep -rn "xl:grid-cols\|SearchInput\|ActiveFilterChips" components/*Browser.tsx
```
- [ ] 1280px でフィルタが過剰に伸びない
- [ ] 375px で ActiveFilterChips が整列

**commit**: `fix(filters): constrain filter grid width and fix mobile active chips`

---

## P8: EmptyState 完成度

**Issues**: #8 / #17
**目的**: EmptyState に**アイコンを追加**する（variant/size は既存・F2）。

### 方針（F3 反映: 後方互換を厳守）
- 既存4 prop（`message`・`variant`・`size`・`className`）を**全て残す**。`icon?`・`description?` を**オプショナル追加**。
- 既存6呼び出し（`RobotsBrowser:214,229`・`ManufacturersBrowser:130`・`GuidesBrowser:156`・`ReportsBrowser:116`・`UseCasesBrowser:205`）は**無改修で型が通る**ことを保証。`ManufacturersBrowser:130`/`RobotsBrowser:214` の `variant`/`size` 指定が壊れないこと。
- アイコンは lucide（`SearchX` 等）。`bg`/border は現行 variant のスタイルを維持。

### 検証
```bash
npm run build && npx tsc --noEmit
grep -rn "EmptyState" components/ --include="*.tsx"
```
- [ ] 既存 `<EmptyState message=... variant=... size=... />` が型エラーなし
- [ ] 空状態でアイコンが表示される

**commit**: `feat(empty-state): add optional icon/description, keep existing props`

---

## P9: a11y・モバイルインタラクション

**Issues**: #20, #22, #23
**目的**: 自前ドロップダウンの a11y、フッター・パンくずのモバイル整備。

### 確定事実（調査2）
- **#22 の対象は1箇所のみ**: `ManufacturerCard.tsx:27-35,109-147` の自前 `useState`+`pointerdown` メニュー（Escape/focus trap なし）。
- `ui/searchable-dropdown.tsx:175-323` は **Radix Popover を full 活用**（Escape `:227`・focus復帰 `:130-135`・矢印/Home/End・aria 一式）。**置換の参照実装が repo 内にある**。`ui/select.tsx`（Radix Select）も a11y 完備。

### 方針
| # | 対象 | 内容 |
|---|------|------|
| 22 | `ManufacturerCard.tsx:109-147` | 自前メニュー → **Radix Popover** へ置換（新規依存不要、`radix-ui` 既導入）。Escape/focus は Radix が内包。`searchable-dropdown.tsx` のパターンを参照。z-index は P1 の `--z-dropdown` に合わせる |
| 20 | `Footer.tsx:27` | `flex flex-wrap` のモバイル折返しを安定化（グリッド or gap 調整） |
| 23 | `Breadcrumbs.tsx:16` | `gap-2` → `gap-1 sm:gap-2` |

### 検証
```bash
npm run build && npx tsc --noEmit
grep -rn "Popover\|radix-ui" components/ManufacturerCard.tsx components/ui/searchable-dropdown.tsx
```
- [ ] 代理店メニューが Escape で閉じ、Tab フォーカスが適切
- [ ] フッターがモバイルで整列 / パンくずが詰まらない

**commit**: `fix(a11y): replace custom menu with radix popover, footer & breadcrumb mobile`

---

## 4. 検証コマンド（F4 反映: next lint 廃止）

```bash
# 全フェーズ共通（実行可能な静的検証はこの2本のみ）
npm run build
npx tsc --noEmit

# 補助（データ整合性。UI修正では任意）
npm run validate:data
```

> `next lint` は **使わない**（lint script・eslint 設定なし、Next.js 16 で廃止）。lint を導入する場合は ESLint flat config + script 追加が別作業（ユーザー確認事項）。
> `npx tsc --noEmit` は `typescript` 導入済み・`tsconfig.json` が `strict:true`/`noEmit:true` のため実行可能。

---

## 5. 影響範囲まとめ

| Phase | 変更ファイル数（概算） | 波及 |
|-------|-------------------|------|
| P1 | 3〜5 | 全ページ（コンテナ31箇所・z-index）— **大** |
| P2 | 6〜8 | 全詳細＋一覧の見出し — **大** |
| P3 | 2〜3 | token 経由で全UI（色）— **大** |
| P4 | 3（先行）→ 順次 | 余白 — 中 |
| P5 | 2〜4 | 詳細ページの表 — 中 |
| P6 | 4 | カード系 — 中 |
| P7 | 5前後 | 一覧フィルタ — 小 |
| P8 | 1 | EmptyState（呼出6箇所は無改修）— 小 |
| P9 | 3 | ManufacturerCard/Footer/Breadcrumbs — 小 |

**波及最大の共通部品（調査4）**: `:root`トークン（全UI）／`.site-container`（31箇所）／`RobotCard`（4箇所）。P1〜P3 は全ページ・両テーマの目視必須。

---

## 6. 未使用資産の判断事項（調査2）

実装とは別に、以下は「活用 or 削除」をユーザー判断で決める（この計画では変更しない）:
- `components/BudouXText.tsx`（budoux 日本語改行）— 定義のみ・**全リポジトリで未使用**。見出し/本文の折返し品質に使える資産。
- `components/ui/marquee.tsx` — **未使用**。

---

## 7. 残るリスク

| リスク | 対応 |
|-------|------|
| コンテナ幅縮小で一部レイアウトが狭く見える | P1 後に全ページ確認。必要なら上限を緩める |
| token 変更がダークで意図せず暗く/明るく | P3 後に両テーマ全ページ確認 |
| 見出し統一でページ間の印象が変わる | P2 で Figma/既存と並べて確認（CLAUDE.md 逐語コピー方針との整合） |
| Radix Popover 置換のスタイル差（#22） | `searchable-dropdown.tsx` の既存スタイルに合わせる |
| `.content-prose` 不採用判断（F5） | P2 着手時にユーザーと確定 |
| ラベル:値 4実装の統一範囲（P5） | 全統一かページ単位かを P5 着手時に判断 |
