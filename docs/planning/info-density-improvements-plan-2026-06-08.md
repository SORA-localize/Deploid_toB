# 情報密度改善 実装計画（2026-06-08）

## 目的

スペーシングが全体的に大きく、スクロールが多い／一画面の情報量が少ない。さらにロボットカード・ニュースカードがモバイルで縦積みフル幅のままで、コンポーネントサイズが縮まず使いづらい。これを是正する。

1. セクション余白の締め直し（全体を一段階コンパクトに）
2. RobotCard のモバイル横並び（サムネイル左＋テキスト右のリスト行）
3. NewsCard のモバイル横並び

## 設計判断（レビューで確定した修正点）

実コードを検証し、初版計画の誤りを2点修正、1点をプロダクト判断で確定した。

### 修正1：RobotCard の編集ターゲット（致命的誤り）
初版は `motion.div`（`RobotCard.tsx:85` の `flex flex-col`）を横並び化する想定だったが、これは効かない。motion.div の直接の子はグロー／シマー／お気に入り／下線／全面リンクが全て `absolute` で、フロー内にあるのは内側ラッパー1個だけ。画像とテキストの縦積みは **`RobotCard.tsx:129` の内側ラッパー** `<div className="relative z-20 flex flex-col h-full">` が作っている。横並び化はこの129行目を対象にする。

### 修正2：NewsCard のブレークポイント（崩れる）
カードの横並び切替はグリッドが多列化する境界と一致させる必要がある。

| グリッド | 多列化の境界 | カード横並び切替 |
|---|---|---|
| ロボット系（`RobotsBrowser:173` / `FeaturedRobotsGrid:26` / `ManufacturerRobotsGrid:21`） | `md:grid-cols-2`（768px） | **`md`** |
| ニュース（`ReportsBrowser:119`） | `sm:grid-cols-2`（640px） | **`sm`** |

RobotCard は `md`、NewsCard は `sm` を境界にする（初版の「両方 md に統一」は誤り）。理由：NewsCard を `md` にすると 640–767px で「2列グリッド × 各セル横並び」になり約300px幅に押し込まれて潰れる。

### 確定3：モバイルの spec 表示（プロダクト判断）
CLAUDE.md の「スペックではなく導入判断の変数で整理する」に従い、モバイル横並びでも spec を全隠しにはせず **「段階」1行だけ残す**。残りの spec 行と「詳細を見る」フッターはモバイルで非表示。

### 検証済み（初版どおりで問題なし）
- `scroll-mt-site-header` は `calc(var(--header-h)+1.5rem)`（`globals.css:384`）。余白変更の影響を受けない。
- ロボット系3グリッドは全て `md` で多列化。RobotCard の `md` 境界は正しい。
- モバイル touch では tilt/glow/shimmer は発火しない（mousemove / `group-hover` 依存）。横並びでも害なし。
- `@media (hover: hover)` で `robot-card-grid` の dimming（`globals.css:426`）をポインタ限定化するのは妥当。

## 変更ファイルと内容

### Phase 1 — セクション余白の締め直し（別コミット）

| ファイル | 変更 |
|---|---|
| `components/FeaturedRobotsGrid.tsx` | `py-16`→`py-8 sm:py-12`、`mb-8`→`mb-5`、`gap-6`→`gap-4` |
| `components/HomeContentNavigator.tsx` | `py-16`→`py-8 sm:py-12`、`mb-8`→`mb-5`、`gap-8`→`gap-6` |
| `components/ManufacturerDetailSection.tsx` | `py-12`→`py-8`、`mb-6`→`mb-4` |
| `components/RobotsBrowser.tsx` | コンテナ `py-8`→`py-5`、各 `mb-8`/`mb-6`→`mb-5`/`mb-4`、`gap-6`→`gap-4` |
| `components/ReportsBrowser.tsx` | セクション `py-6`→`py-4`、`space-y-5`→`space-y-3` |
| `components/ManufacturersBrowser.tsx` | `py-8`→`py-5`、`mb-8`→`mb-5` |
| `components/GuidesBrowser.tsx` | `py-8`→`py-5`（ヘッダー・本文） |
| `components/UseCasesBrowser.tsx` | `py-8`→`py-5`、`mb-8`→`mb-5` |
| `components/ManufacturerRobotsGrid.tsx` | `gap-6`→`gap-4` |
| `src/app/page.tsx` | ラッパー `py-12`→`py-6 sm:py-10`、各 `py-16`→`py-8 sm:py-12`、`mb-8`→`mb-5` |
| `src/app/about/page.tsx` | ラッパー `py-12`→`py-6 sm:py-10`、各セクション `py-12`→`py-8` |
| `src/app/manufacturers/[slug]/page.tsx` | コンテナ `py-8 sm:py-12`→`py-5 sm:py-8`、ソース `py-12`→`py-8` |

### Phase 2 — RobotCard モバイル横並び（別コミット）

`components/RobotCard.tsx`（ブレークポイント `md`）：
- 内側ラッパー（`:129`）：`flex flex-col h-full` → `flex flex-row md:flex-col h-full`
- 画像枠（`:130`）：`aspect-[4/3] ... border-b border-border` → `w-20 flex-none self-stretch border-r border-border md:w-auto md:aspect-[4/3] md:border-r-0 md:border-b`
- 画像 `img`（`:135`）：モバイルは `object-cover`、md 以上は `object-contain`（小サムネは cover でトリミングした方が収まる） → `h-full w-full object-cover md:object-contain`
- テキスト枠（`:149`）：`p-4` → `p-3 md:p-4`
- spec `dl`（`:167`）：モバイルは「段階」行のみ表示。`段階` 以外の `<div>` を `hidden md:block` で包む。dl 自体は `grid-cols-1 md:grid-cols-2`
- 「詳細を見る」フッター（`:185`）：`flex` → `hidden md:flex`
- メーカー名リンク（`:158` の `inline-block pointer-events-auto`）：`pointer-events-none md:pointer-events-auto`（モバイル横並びの誤タップ防止。カード全体リンクで遷移可能）

`src/app/globals.css`（`:426`）：hover dimming をポインタ限定化
```css
@media (hover: hover) {
  .robot-card-grid:has(.robot-card:hover) .robot-card { opacity: 0.4; filter: grayscale(0.5) blur(1px); }
  .robot-card-grid:has(.robot-card:hover) .robot-card:hover { opacity: 1; filter: grayscale(0) blur(0); }
}
```

### Phase 3 — NewsCard モバイル横並び（別コミット）

`components/NewsCard.tsx`（ブレークポイント `sm`）：
- ルート（`:20`）`flex h-full flex-col` → `flex h-full flex-row sm:flex-col`
- 画像枠（`:27`）：`aspect-video overflow-hidden bg-muted` → `w-24 flex-none self-stretch overflow-hidden bg-muted sm:w-auto sm:aspect-video`
- テキスト枠（`:45`）：`p-4` → `p-3 sm:p-4`
- summary（`:66`）：`line-clamp-2` → `hidden sm:block`（モバイル非表示でコンパクト）
- `ReportsBrowser.tsx:119` の `CardHoverEffect` グリッドに `items-stretch` 追加（横並び時の高さ均一化）

## 変更しないファイル
- `src/app/contact/page.tsx`（フォームUXのため意図的に除外）
- `src/app/robots/[slug]/page.tsx`（詳細は既に `py-8` でコンパクト）
- `components/Header.tsx` / `Footer.tsx` / `ManufacturerCard.tsx` / `FavoriteCard.tsx`
- `components/NewsFeatureCard.tsx` / `NewsHeroCarousel.tsx`
- `components/PageSuspenseFallback.tsx`（CLS は後回し・低優先）
- `components/compare/` 配下（独自カード実装、RobotCard 不使用）
- `lib/` / `data/` 配下

## 影響範囲
- `RobotCard`：`/robots`一覧・ホーム注目・`/manufacturers/[slug]`グリッド・`/compare`（Compareは独自カードのため影響なしを実装前に確認）
- `NewsCard`：`/reports`一覧・ホーム最新・`/manufacturers/[slug]`関連レポート
- 余白系：各一覧ページとホーム・about・メーカー詳細

## リスクと軽減策
| リスク | 重大度 | 軽減策 |
|---|---|---|
| 横並びで画像 `object-cover` がロボットを過度にトリミング | 中 | 小サムネ(`w-20`)では cover が自然。気になればモバイルも `object-contain` に戻す（1行変更） |
| `CardHoverEffect` の `p-2` ラッパーで横並び高さ不均一 | 低 | グリッドに `items-stretch` 付与で対処 |
| メーカー名リンクのモバイル誤タップ | 低 | `pointer-events-none md:pointer-events-auto` |
| 余白削減率のばらつき | 低 | 実装後ブラウザ目視で微調整 |

## 検証
```
npm run build
```

## 手動確認チェックリスト
**デスクトップ (≥md/768px)**
- [ ] RobotCard が縦積み・spec 2列・tilt/glow/dimming 動作
- [ ] NewsCard が縦積み・summary 表示
- [ ] 各ページのスクロール量が削減

**モバイル (<sm/640px)**
- [ ] RobotCard 横並び（左 `w-20` サムネ＋右テキスト）
- [ ] RobotCard は「段階」1行のみ表示・フッター非表示
- [ ] NewsCard 横並び・summary 非表示
- [ ] カード全体タップで遷移／メーカー名で誤動作しない
- [ ] 画像トリミングが破綻しない

**640–767px（sm〜md間）**
- [ ] NewsCard は2列縦積み（潰れない）
- [ ] RobotCard は1列横並び（潰れない）

**ダークモード**
- [ ] 横並び時の `border-r`／`bg-muted` が正常
```
