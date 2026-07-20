# home 注目記事 横スクロール実装計画 v1

Branch: `fix/home-mobile-ui`
Last updated: 2026-06-15

---

## 目的

home の「注目記事」セクションを、グリッド4枚固定から**横スクロールストリップ（最大7枚）**に変更する。
- 現状: `getHomeFeaturedArticles()` で4枚 → `grid-cols-4`
- 変更後: `getArticleIndexPlacementReports()` で hero5枚+feature2枚（最大7枚）→ 横スクロール
- カードサイズは画面幅に応じて `clamp` / breakpoint で自動変動

---

## 調査結果

### 既存資産（再利用するもの）

| 資産 | 場所 | 役割 |
|---|---|---|
| `getArticleIndexPlacementReports(articles)` | `lib/articlePlacements.ts:81` | hero/feature スロットを分けて返す。`ReportsBrowser` が既に使用 |
| `NewsFeatureCard` | `components/NewsFeatureCard.tsx` | 画像+オーバーレイカード。`className` でサイズ指定可。変更不要 |
| `articlePlacements.ts` | `data/articlePlacements.ts` | hero4件+feature2件登録済み（現在の合計6件） |
| `articleIndexPlacementLimits` | `data/articlePlacements.ts:3` | `hero:5, feature:2`（上限値の正本） |

### 変更対象

- `src/app/page.tsx` のみ（データ取得・セクション UI）

### 変更しないもの

- `lib/articlePlacements.ts`（関数追加・変更なし）
- `components/NewsFeatureCard.tsx`（変更なし）
- `data/articlePlacements.ts`（変更なし）
- `components/NewsHeroCarousel.tsx`（変更なし。home では使わない）

### 現在の配置件数

- `reports-index` hero スロット: **4件**（上限5。あと1枠空き）
- `reports-index` feature スロット: **2件**（上限2。満杯）
- home で表示できる最大: **6件**（hero枠が埋まれば7件）
- `getArticleIndexPlacementReports` は枠が埋まらない場合、最新記事で自動補完する

### `getHomeFeaturedArticles` の扱い

- 現在 `page.tsx` からのみ呼ばれている
- 今回の変更後は `page.tsx` から呼ばれなくなる → lib 内に dead code として残る
- 削除せず残す（lib の public 関数を呼び元がなくなっただけで削除する理由は薄い。将来再利用の可能性あり）
- import だけ `page.tsx` から除去する

---

## 監査（問題10個想定）

### 問題1: `getArticleIndexPlacementReports` は `sorted` を受け取ることを前提にしているか
**重大度: 低**

`ReportsBrowser` では `useMemo` で `sorted` を作ってから渡している。`page.tsx` は Server Component なので `[...getArticles()].sort(byArticlePublishedDesc)` でソート済みを渡すか、生の `getArticles()` を渡すかを確認する必要がある。

関数の実装を確認：`getArticleIndexPlacementReports` は内部で `sortArticlesByPublishedAt` を呼ぶため、**生の articles を渡せばよい**。`page.tsx` からは `getArticles()` をそのまま渡す。

対応: `getArticleIndexPlacementReports(getArticles())` で問題なし。

### 問題2: `NewsFeatureCard` のグラデーション — design_system との整合
**重大度: 低（許容済み）**

`NewsFeatureCard` は `bg-gradient-to-t from-black/90 via-black/35 to-transparent` を使用。`design_system_v1.md §4` で hero/featured カルーセルは `rounded-xl` を含むリッチ表現が例外許可されており、この単色フェードオーバーレイは可読性目的。画像なし時の fallback `bg-gradient-to-br from-muted to-muted/50` は有彩色ではないため問題なし。

対応: 変更不要。

### 問題3: 横スクロールのキーボード・アクセシビリティ
**重大度: 中**

`overflow-x-auto` の横スクロールコンテナ内の `<Link>` は Tab で順にフォーカスできる（ブラウザデフォルト）。ただしコンテナ自体にフォーカスが当たるか、スクロールがキーボードで追従するかはブラウザ依存。

対応:
- コンテナに `tabIndex={-1}` は付けない（Link 自体がフォーカス可能）
- `scroll-smooth` + `snap-x snap-mandatory` で Tab フォーカス時もスナップする

### 問題4: iOS でのスクロール慣性
**重大度: 低**

Tailwind の `overflow-x-auto` は `-webkit-overflow-scrolling: touch` を含まない（Tailwind v4）。iOS Safari でのスクロール慣性が失われる可能性。

対応: `[&]:[-webkit-overflow-scrolling:touch]` を追加するか、CSS custom property で対応。ただし iOS 13 以降はデフォルトで慣性スクロールが有効なため実害は少ない。手動確認チェックリストに追加。

### 問題5: スクロール余白（末尾カードが見切れる）
**重大度: 中**

横スクロールで末尾カードがコンテナ端に貼り付くと、「まだ先がある」視覚ヒントが出ない。

対応: コンテナに `pe-4 sm:pe-6`（padding-end）を付けて末尾に余白を作る。先頭も `ps-0`（padding-start は site-container に委ねる）。

### 問題6: カード幅がモバイルで広すぎる・狭すぎる
**重大度: 中**

- 幅: `w-[min(72vw,280px)] sm:w-72 lg:w-80`
  - モバイル 360px → 72vw = 259px（カード2.3枚分見える）
  - sm 640px → 288px
  - lg 1024px → 320px
- 高さ: `aspect-[3/4]`
  - モバイル: 259 × 4/3 = 345px（適切）
  - lg: 320 × 4/3 = 427px（適切）

対応: 上記サイズで実装、手動確認で調整。

### 問題7: `snapType` とタッチ操作の相性
**重大度: 低**

`snap-x snap-mandatory` はタッチで1枚ずつスナップするが、複数枚を一度にスクロールしたい場合に使いにくい。`snap-x snap-proximity` の方が自然なスクロールを許容する。

対応: `snap-proximity` を使用。スナップ位置は `snap-start` を各カードに付ける。

### 問題8: 記事がゼロ件の場合のガード
**重大度: 低**

`scrollArticles.length === 0` の場合、セクション自体を非表示にする。現行の `homeFeaturedReports.length > 0` 判定と同じロジックで対応。

### 問題9: `getHomeFeaturedArticles` import が page.tsx に残ると lint 警告
**重大度: 低**

import を除去し、`getArticleIndexPlacementReports` に差し替える。`getArticles` import は継続使用。

### 問題10: セクションタイトル「注目記事」の変更不要確認
**重大度: 低**

タイトルは変えない。hero と feature の区別をユーザーに見せる必要はなく、「注目記事」のまま7枚を横スクロールで並べる。

---

## 実装仕様

### `src/app/page.tsx` の変更

**import の差し替え:**

```tsx
// 削除
import { getHomeFeaturedArticles } from '@/lib/articlePlacements';

// 追加
import { getArticleIndexPlacementReports } from '@/lib/articlePlacements';
```

**データ取得の差し替え:**

```tsx
// 削除
const homeFeaturedReports = getHomeFeaturedArticles(getArticles());

// 追加
const { heroReports, featureReports } = getArticleIndexPlacementReports(getArticles());
const scrollArticles = [...heroReports, ...featureReports];
```

**セクション UI の差し替え:**

```tsx
// 変更前
{homeFeaturedReports.length > 0 && (
  <section className="py-8 sm:py-10 border-b border-border">
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-2xl font-semibold text-foreground">注目記事</h2>
      <Link href="/reports" ...>すべて見る</Link>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {homeFeaturedReports.map((report) => (
        <NewsFeatureCard key={report.id} report={report}
          className="min-h-[220px] sm:min-h-[240px] lg:min-h-[260px]" />
      ))}
    </div>
  </section>
)}

// 変更後
{scrollArticles.length > 0 && (
  <section className="py-8 sm:py-10 border-b border-border">
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-2xl font-semibold text-foreground">注目記事</h2>
      <Link href="/reports" ...>すべて見る</Link>
    </div>
    <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-proximity
                    pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
      {scrollArticles.map((report) => (
        <NewsFeatureCard
          key={report.id}
          report={report}
          className="shrink-0 snap-start w-[min(72vw,280px)] sm:w-72 lg:w-80 aspect-[3/4]"
        />
      ))}
    </div>
  </section>
)}
```

**`-mx-4 px-4 sm:-mx-6 sm:px-6` の意図:**
`site-container` のパディングを打ち消して端まで伸ばし、再度同じ値のパディングを付けることで、スクロール開始は左端に揃えつつ、末尾のカードはコンテナ外まで続いて「まだある」ヒントを出す。

---

## 変更ファイル一覧

| ファイル | 変更種別 |
|---|---|
| `src/app/page.tsx` | 変更（import差し替え・データ取得・セクションUI） |

**変更しないファイル:**
- `lib/articlePlacements.ts`
- `components/NewsFeatureCard.tsx`
- `data/articlePlacements.ts`
- その他すべて

---

## 実装順序

1. `src/app/page.tsx` を変更（import → データ取得 → UI の順で差し替え）
2. `npm run validate:data && npm run build`

---

## 影響範囲

| ファイル | 影響するページ |
|---|---|
| `src/app/page.tsx` | `/`（home のみ） |

`getHomeFeaturedArticles` は `lib/articlePlacements.ts` に残るが未呼び出しになる。他ページへの影響なし。

---

## 検証コマンド

```bash
npm run validate:data && npm run build
```

---

## 手動確認チェックリスト

- [ ] 360px幅: カード幅 ≈ 259px、2枚以上見える、スクロール可能
- [ ] 360px幅: スクロール末尾に余白があり「まだある」ヒントが出る
- [ ] 640px（sm）: カード幅 288px、スクロール可能
- [ ] 1024px（lg）: カード幅 320px、スクロール可能
- [ ] カードをクリック → `/reports/[slug]` に遷移する
- [ ] 画像なし記事: プレースホルダーが表示され崩れない
- [ ] 記事が0件: セクション自体が非表示になる
- [ ] iOS Safari: タッチスクロールが自然に動く（慣性あり）
- [ ] キーボード: Tab でカードが順にフォーカスされる
- [ ] `/reports` ページ: 変更なしで既存表示が維持されている

---

## 残るリスク

- `site-container` のパディング値が変わった場合、`-mx-4 px-4 sm:-mx-6 sm:px-6` の打ち消しがズレる。現状 `globals.css` で `px-4 sm:px-6` と定義されているため問題なし（変更時は合わせて修正）
- カード幅 `min(72vw,280px)` は実機で調整が必要な可能性。280px に達するのは 389px 以上の端末
- `getHomeFeaturedArticles` が dead code になることは許容。将来削除する場合は `lib/articlePlacements.ts` と import を合わせて除去
