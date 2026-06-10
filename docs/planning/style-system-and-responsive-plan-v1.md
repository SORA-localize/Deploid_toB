# スタイル体系化 + 大画面レスポンシブ 計画 v1

作成: 2026-06-11  
改訂: 2026-06-11（指摘6点を反映）

---

## 目的

| # | 問題 |
|---|---|
| 1 | デザインジャンルが未明文化。`design_system_v1.md` に独立章として追加する |
| 2 | `site-container` が `lg:px-12`（1024px）で止まっており、大型モニターでコンテンツが中央寄りに見える |
| 3 | 詳細ページのセクションが全てボックスで囲まれており、設計意図（ディバイダー区切り）と実装が乖離している |

---

## 調査で確定した事実

### 各詳細ページの実レイアウト

| ページ | 実グリッド | 備考 |
|---|---|---|
| `reports/[slug]` | `grid-cols-12` / `lg:col-span-2/7/3` | TOC+content+sidebar |
| `guides/[slug]` | `grid-cols-12` / `lg:col-span-2/7/3` | TOC+content+sidebar |
| `use-cases/[slug]` | `grid-cols-12` / `lg:col-span-8/4` | content+sidebar（TOCなし）|
| `robots/[slug]` | `lg:grid-cols-[1fr_280px]` | **既にディバイダー設計済み。対象外** |
| `manufacturers/[slug]` | コンポーネント内に吸収 | 詳細は別調査 |

### ボックス→ディバイダー対象の分類（page別）

**`reports/[slug]`（content 列）**:

| セクション | 現クラス | 分類 | 方針 |
|---|---|---|---|
| takeaways | `border border-border bg-card p-6` | 本文 | ディバイダー |
| body | `border border-border bg-card p-6` | 本文 | ディバイダー |
| tags zone | `border border-border bg-card px-6 py-4` | 本文 | ディバイダー |
| RelatedLinkList × 4 | コンポーネント内 `border border-border bg-card` | ナビ | **維持**（変更不要） |
| SourceList | デフォルト `border border-border bg-card p-6` | 本文 | **className 上書き** |
| サイドバーウィジェット × 2 | `border border-border bg-muted/card p-4` | UI | **維持** |

**`guides/[slug]`（content 列）**:

| セクション | 現クラス | 分類 | 方針 |
|---|---|---|---|
| overview | `border border-border bg-card p-6` | 本文 | ディバイダー |
| body | `border border-border bg-card p-6` | 本文 | ディバイダー |
| checklist | `border border-border bg-muted p-6` | 本文 | ディバイダー |
| RelatedLinkList × 2 | コンポーネント内 | ナビ | **維持** |
| SourceList | デフォルト `border border-border bg-card p-6` | 本文 | **className 上書き** |
| サイドバーウィジェット × 2 | `border border-border bg-card p-4` | UI | **維持** |

**`use-cases/[slug]`（content 列）**:

| セクション | 現クラス | 分類 | 方針 |
|---|---|---|---|
| At a glance（ヘッダー内） | `border border-border bg-muted p-5` | データ要約カード | **維持**（ヘッダー内の例外） |
| overview | `border border-border bg-card p-6` | 本文 | ディバイダー |
| whyItMatters | `border border-border bg-card p-6` | 本文 | ディバイダー |
| capabilities | `border border-border bg-card p-6` | 本文 | ディバイダー |
| environment | `border border-border bg-card p-6` | 本文 | ディバイダー |
| whyHardToday | `border border-border bg-card p-6` | 本文 | ディバイダー |
| japanDeploymentConditions | `border border-border bg-card p-6` | 本文 | ディバイダー |
| サイドバーウィジェット × 2 | `border border-border bg-card p-4` | UI | **維持** |

**`robots/[slug]`**: 既に `border-b + py-8` のディバイダー設計。変更対象外。

---

## Part 1: デザインジャンル定義

### `design_system_v1.md` への追記（独立章）

既存 §5（該当なし）の後に `## 6. デザインジャンル` を追加する。§3 Spacing の「本文ブロックへ矩形背景を貼らない」ルールはそのまま残し、新章から参照する形にする。

追記内容:

```markdown
## 6. デザインジャンル

**Editorial Broadsheet × Product Dashboard** のハイブリッド。

### ゾーン定義

| ゾーン | ジャンル | 代表 | 対象ページ |
|---|---|---|---|
| 読む場所 | Editorial Broadsheet | FT.com / Bloomberg | 詳細ページ本文（reports/guides/use-cases/[slug]） |
| 操作する場所 | Product Dashboard | Linear / Vercel | 一覧・比較（robots/reports/guides/use-cases/compare） |

### Editorial ゾーンのルール
- セクションをボックスで囲まない（§3 Spacing 参照）
- 区切りは `border-b border-border` + 上下余白（`pt-6 pb-8`）のみ
- 見出し + 余白 + 罫線で構造を出す
- 背景色は `bg-background`。セクションごとに `bg-card` を塗らない

### Dashboard ゾーンのルール
- データ単位（ロボットカード・メーカーカード）には `.card-data` を使う
- ナビゲーション要素（RelatedLinkList、サイドバーウィジェット）はボックスを維持する
- 一覧ページのグリッドに `xl:grid-cols-4` まで使う（既実装）

### 参照
- §3 Spacing「詳細ページの本文セクション…はカード面にしない」（既記述）
- ホームページ（src/app/page.tsx）が Editorial ゾーンの実装参照基準
- `robots/[slug]`（border-b + py-8 設計）が詳細ページの実装参照基準
```

---

## Part 2: 大画面レスポンシブ修正

### 問題の整理

**誤った方針（旧版で指摘）**: `xl:px-16 2xl:px-20` を追加する
→ `max-w-[1440px]` 固定のまま padding を増やすと実コンテンツ幅が 1344px→1280px に**縮小**する。

**正しい選択肢**:

| 選択肢 | 内容 | トレードオフ |
|---|---|---|
| A. `max-w` を拡張 | `max-w-[1440px]` → `max-w-[1600px]` に変更 | 全ページ波及（31箇所）。一覧ページも広がる |
| B. 詳細ページ専用コンテナ | `.site-container-content` を追加し detail pages のみ `max-w-[1600px]` | 一覧に影響なし。2クラス管理が必要 |
| C. gap 拡張のみ | `gap-6` → `xl:gap-8` | 実質的変化が小さい。根本解決にならない |

**採用方針: 選択肢 B（詳細ページ専用コンテナ）**

理由: 一覧ページは既に `xl:grid-cols-4` が効いており現状で問題ない。詳細ページ（3カラムレイアウト）だけが大画面で狭く見える。影響範囲を詳細ページ4本に限定できる。

### 実装

`globals.css` に追加:
```css
.site-container-content {
  @apply mx-auto max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-12;
}
```

`src/app/globals.css` の既存 `.site-container` は変更しない。

対象ページのトップレベル `site-container` を `site-container-content` に置換:
- `reports/[slug]/page.tsx` — 本文エリアの `<div className="site-container py-8">`
- `guides/[slug]/page.tsx` — 本文エリアの `<div className="site-container py-8">`
- `use-cases/[slug]/page.tsx` — 本文エリアの `<div className="site-container py-8">`

ヘッダー帯（`.site-container.py-6`）はそのまま `site-container` でよい（幅より内容が先）。

### 変更ファイル（Part 2）

| ファイル | 変更 |
|---|---|
| `src/app/globals.css` | `.site-container-content` 追加（`.site-container` は変更しない） |
| `reports/[slug]/page.tsx` | 本文エリア div のクラス変更 |
| `guides/[slug]/page.tsx` | 本文エリア div のクラス変更 |
| `use-cases/[slug]/page.tsx` | 本文エリア div のクラス変更 |

---

## Part 3: ブロック→ディバイダー移行

### 変換パターン

**本文セクション（overview / body / whyItMatters 等）**:
```tsx
// Before
<div id="overview" className="border border-border bg-card p-6 scroll-mt-site-header">
  <h2 className="mb-4 text-lg font-semibold text-foreground">概要</h2>
  <p className="text-sm leading-relaxed text-foreground/80">{...}</p>
</div>

// After
<section id="overview" className="scroll-mt-site-header pt-6 pb-8 border-b border-border last:border-0">
  <h2 className="mb-3 text-lg font-semibold text-foreground">概要</h2>
  <p className="text-sm leading-relaxed text-foreground/80">{...}</p>
</section>
```

**SourceList（className 上書き）**:
```tsx
// Before（デフォルト className = "border border-border bg-card p-6 scroll-mt-site-header"）
<SourceList sources={...} />

// After
<SourceList
  sources={...}
  className="scroll-mt-site-header pt-6 border-t border-border"
/>
```

**RelatedLinkList**: 変更なし。カード UI として維持する。コンポーネント内のボックスは「ナビゲーション要素のボックス」として許容。

**サイドバーウィジェット**: 変更なし。UI パーツとしてボックスを維持。

**At a glance（use-cases ヘッダー内）**: 変更なし。ヘッダーバンド内のデータ要約カードとして維持。

### `space-y-6` の扱い

現在コンテンツカラムは `<div className="space-y-6">` でセクション間隔を管理している。ディバイダー化後はセクション自体が `pt-6 pb-8` を持つため、wrapper の `space-y-*` は不要になる。`space-y-6` を削除してフラットな構造にする。

### 変更ファイル（Part 3）

| ファイル | 変換するセクション数 |
|---|---|
| `src/app/reports/[slug]/page.tsx` | 3セクション（takeaways/body/tags）+ SourceList className |
| `src/app/guides/[slug]/page.tsx` | 3セクション（overview/body/checklist）+ SourceList className |
| `src/app/use-cases/[slug]/page.tsx` | 6セクション（overview/whyItMatters/capabilities/environment/whyHardToday/japanDeploymentConditions）|

---

## フェーズ構成

```
Phase 0 — design_system_v1.md に ## 6. デザインジャンル 追加         → commit
Phase 1 — globals.css に .site-container-content 追加                → commit + 大画面目視確認
Phase 2 — reports/[slug] 本文→ディバイダー + SourceList className     → commit
Phase 3 — guides/[slug]  本文→ディバイダー + SourceList className     → commit
Phase 4 — use-cases/[slug] 本文→ディバイダー                          → commit
```

各 Phase は独立コミット・独立ビルド確認。

---

## 変更しないもの

| 対象 | 理由 |
|---|---|
| `site-container`（既存クラス） | 一覧ページはこのままで問題なし |
| `robots/[slug]` | 既にディバイダー設計 |
| `manufacturers/[slug]` | コンポーネント層に吸収されており別調査が必要 |
| `RelatedLinkList.tsx` | ナビゲーション要素のボックスは許容 |
| サイドバーウィジェット | UI パーツのボックスは許容 |
| `use-cases/[slug]` ヘッダーの At a glance | ヘッダーバンド内の要約カード。許容 |
| ホームページ | 既にディバイダー設計 |

---

## 検証

```bash
npm run build
npx tsc --noEmit
```

Phase 1 後の手動確認:
- [ ] 1920px で detail ページのコンテンツ幅が広がり、左右余白が減る
- [ ] 1440px（ノートPC）で表示が変わらない
- [ ] 一覧ページ（robots/reports）は変化なし

Phase 2〜4 後の手動確認:
- [ ] 本文セクションのボックスが消え、ディバイダーで区切られている
- [ ] セクション間余白が統一されている
- [ ] RelatedLinkList・サイドバーはボックスのまま
- [ ] `robots/[slug]` に変化なし（触っていない確認）

---

## リスク

| リスク | 軽減策 |
|---|---|
| `last:border-0` が Tailwind v4 で正しく効くか | `[&:last-child]:border-b-0` 等の代替も用意しておく |
| `space-y-6` 削除後に意図しない余白崩れ | Phase ごとに目視確認し、必要なら個別 `mb-*` を追加 |
