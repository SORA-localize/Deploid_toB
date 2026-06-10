# スタイル体系化 + 大画面レスポンシブ 計画 v1

作成: 2026-06-11

---

## 目的

調査で判明した2つのサイト全体問題に対処する。

| # | 問題 | 根拠 |
|---|---|---|
| 1 | 詳細ページのセクションが全てボックス（`border border-border bg-card`）で囲まれており、設計意図（ディバイダー区切り）と実装が乖離している | `design_system_v1.md §3` に「本文ブロックへ矩形背景を貼らず、見出し・余白・罫線行で構造を出す」と明記済みだが未実装 |
| 2 | `site-container` が `lg:px-12` で止まっており、1440px 超の大型モニターでコンテンツが画面中央に過集中して見える。詳細ページは `lg:col-span-*` 止まりで xl 調整なし | 調査: `xl:` 使用17件のみ、詳細ページに xl ブレークポイントなし |

加えて、サイト全体のデザインジャンルを明文化し `design_system_v1.md` に追記する。

---

## Part 1: デザインジャンル明文化

### ジャンル定義

**Editorial Broadsheet × Product Dashboard** のハイブリッド。

| ゾーン | ジャンル | 代表サービス |
|---|---|---|
| 記事・詳細ページ（読む場所） | Editorial Broadsheet | FT.com、Bloomberg、日経電子版 |
| 一覧・比較・フィルタ（操作する場所） | Product Dashboard | Linear、Vercel、Grafana |

### ルール（design_system_v1.md に追記する内容）

```
## デザインジャンル

Editorial Broadsheet × Product Dashboard のハイブリッド。

### 使い分けの原則

「ユーザーがデータを比較・選択する場所」= Dashboard 設計
  → .card-data（矩形・hover border あり）を使う
  → ロボット一覧・メーカー一覧・比較ページ・ガイド一覧

「ユーザーがテキストを読む場所」= Editorial 設計
  → ボックスは使わない。見出し + border-b ディバイダー + 余白で構造を出す
  → robots/[slug]・manufacturers/[slug]・reports/[slug]・
     guides/[slug]・use-cases/[slug] の本文セクション

### Editorial ゾーンで禁止
- セクションごとに border border-border bg-card で囲む
- p-5〜p-8 のボックスにコンテンツを詰める

### Editorial ゾーンで推奨
- セクション間は border-b border-border または py-8 の余白のみで区切る
- 見出しは左揃えのタイポグラフィで構造を示す
- ホームページのセクション設計（section.border-b）を参照基準にする
```

### 作業: `design_system_v1.md` の §3 Spacing に上記を追記する（Phase 0）

---

## Part 2: 大画面レスポンシブ修正

### 現状の問題

```css
/* 現行 */
.site-container {
  @apply mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12;
}
/* lg(1024px) で padding が止まる。xl(1280px) / 2xl(1536px) 以上で変化なし。 */
```

1920px モニターでは `max-w-[1440px]` コンテナが中央に固定され、左右に 240px ずつの余白が生じる。それ自体は editorial サイトとして正常だが、詳細ページで `lg:col-span-7` がコンテンツ幅を 840px に固定しており、xl 以上で TOC・サイドバーが相対的に狭く見える問題がある。

### 方針

**A. `site-container` の padding 段階を xl まで拡張**

```css
/* 変更後 */
.site-container {
  @apply mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20;
}
```

`max-w-[1440px]` は維持。1440px 超でも padding 階段を伸ばすことで、コンテナ内のコンテンツが画面端から等比率で余白を持つようになる。

**B. 詳細ページのカラム配分に xl: 調整を追加**

現状：全詳細ページが `grid-cols-12` で `lg:col-span-2/7/3`（TOC/本文/サイドバー）

xl での調整方針（詳細ページ共通）：
```
lg: TOC=2col / content=7col / sidebar=3col  （現行、1024px〜）
xl: TOC=2col / content=7col / sidebar=3col  → そのまま維持
    → ただし gap を lg:gap-6 から xl:gap-8 に広げてゆとりを出す
```

col-span 比率は変えず、gap とコンテナの内部 padding 拡張で対応する。col-span を変えると content の line-length が変わり可読性が落ちる（editorial 設計ではテキスト幅 600〜900px が最適）。

### 変更ファイル（Part 2）

| ファイル | 変更 |
|---|---|
| `src/app/globals.css` | `.site-container` に `xl:px-16 2xl:px-20` を追加 |
| `src/app/reports/[slug]/page.tsx` | `gap-6` → `gap-6 xl:gap-8` |
| `src/app/guides/[slug]/page.tsx` | `gap-6` → `gap-6 xl:gap-8` |
| `src/app/robots/[slug]/page.tsx` | `gap-6` → `gap-6 xl:gap-8`（確認要） |
| `src/app/use-cases/[slug]/page.tsx` | `gap-6` → `gap-6 xl:gap-8`（確認要） |
| `src/app/manufacturers/[slug]/page.tsx` | `xl:grid-cols-[minmax(0,1fr)_24rem]` は既存、gap 調整のみ |

---

## Part 3: ブロック→ディバイダー移行

### 対象と現状

`border border-border bg-card` ボックスが最も多い詳細ページを対象にする。

| ページ | ボックス数 | 対象セクション |
|---|---|---|
| `use-cases/[slug]/page.tsx` | 8個 | overview / capabilities / requirements / related robots / related guides / related reports |
| `guides/[slug]/page.tsx` | 4個 | overview / body / checklist / sidebar |
| `reports/[slug]/page.tsx` | 4個 | takeaways / body / tags / 出典 |
| `robots/[slug]/page.tsx` | 確認要 | specs / comparison / related |

**変更しないもの**（Dashboard ゾーン）：
- `RelatedLinkList`（関連カードはリンク UI として card-data 相当の扱い）
- `TagChip`
- `SourceList`
- 一覧ページのカードコンポーネント群（`.card-data`）

### 変換パターン（前後比較）

**Before（ボックス）:**
```tsx
<div id="overview" className="border border-border bg-card p-6 scroll-mt-site-header">
  <h2 className="text-lg font-semibold text-foreground mb-4">概要</h2>
  <p className="text-sm text-foreground/80 leading-relaxed">{guide.description}</p>
</div>
```

**After（ディバイダー）:**
```tsx
<section id="overview" className="scroll-mt-site-header pt-6 pb-8 border-b border-border">
  <h2 className="text-lg font-semibold text-foreground mb-3">概要</h2>
  <p className="text-sm text-foreground/80 leading-relaxed">{guide.description}</p>
</section>
```

差分：
- `div` → `section`（意味的）
- `border border-border bg-card p-6` → `border-b border-border pt-6 pb-8`
- 背景色・枠線なし。下罫線のみ
- 最後のセクションは `border-b` を外す（`last:border-0` または条件付き）

### 留意事項

- `RelatedLinkList` 自体は変えない。ただし wrapper div の `border border-border bg-card` は外す
- サイドバーウィジェット（「情報提供・取材相談」「関連ツール」）はコンテンツではなく UI パーツなのでボックスを維持
- `body` セクション（Markdown 本文）は長文テキストなので、border-b 区切りのみ・背景なしにする

### 変更ファイル（Part 3）

| ファイル | 対象セクション数 |
|---|---|
| `src/app/use-cases/[slug]/page.tsx` | 8セクション |
| `src/app/guides/[slug]/page.tsx` | 4セクション |
| `src/app/reports/[slug]/page.tsx` | 4セクション |
| `src/app/robots/[slug]/page.tsx` | 要確認（調査フェーズで詳細把握） |

---

## 実装フェーズ構成

```
Phase 0 — design_system_v1.md 更新（ジャンル定義追記）    → commit
Phase 1 — site-container padding 拡張（globals.css）        → commit + build確認
Phase 2 — 詳細ページ gap 調整（xl:gap-8）                   → commit
Phase 3 — reports/[slug] ブロック→ディバイダー             → commit
Phase 4 — guides/[slug]  ブロック→ディバイダー             → commit
Phase 5 — use-cases/[slug] ブロック→ディバイダー           → commit
Phase 6 — robots/[slug]  ブロック→ディバイダー（要事前調査）→ commit
```

各 Phase は独立コミット。Phase 1 完了後に大型モニターで全ページ目視確認してから次へ。

---

## 変更しないもの

| 対象 | 理由 |
|---|---|
| 一覧ページ（robots/reports/guides/use-cases）| Dashboard ゾーン。card-data 設計を維持 |
| `components/RelatedLinkList.tsx` | リンクカード UI としてボックスは妥当 |
| `components/ArticleToc.tsx` | サイドナビ UI としてボックスは妥当 |
| サイドバーウィジェット | UI パーツなのでボックス維持 |
| ホームページ | 既にディバイダー設計 |
| Hero 帯・世界地図 | CLAUDE.md 例外（黒背景・白文字） |

---

## 既存計画との関係

`ui-ux-comprehensive-fix-plan-2026-06-09.md` の P1（コンテナ幅・padding）と一部重複するが、あちらは未着手。この計画は「padding 段階追加」のみを対象とし、z-index 体系化（P1 の別タスク）は別途対応する。

---

## 検証

```bash
npm run build
npx tsc --noEmit
```

手動確認チェックリスト（Phase 1 後）:
- [ ] 1920px 幅のブラウザで全ページのコンテナが適切に見える
- [ ] 1440px 幅（ノートPC）で見た目が変わらない
- [ ] 375px で横スクロールなし

手動確認チェックリスト（Phase 3〜6 後）:
- [ ] 詳細ページでボックスが消え、ディバイダー区切りになっている
- [ ] セクション間の余白が統一されている
- [ ] サイドバーウィジェットはボックスのまま
- [ ] RelatedLinkList のカードスタイルが維持されている

---

## リスクと軽減策

| リスク | 軽減策 |
|---|---|
| ディバイダーだけでは視覚的に「セクションの開始」が弱くなる | 見出し前の `pt-8` で余白を確保し、h2 の font-weight で区切りを作る |
| 最後のセクションに `border-b` が残って見た目がおかしい | `last:border-0` または最後のセクションだけ `border-b` を外す |
| robots/[slug] の構造が複雑でボックス移行に想定外のコストがかかる | Phase 6 の前に調査 Phase を設ける（コードを読んでから実装量を確認） |
