# データ運用・表示整合性ハードニング計画 v1

Last updated: 2026-06-14

## 目的

名称変更、slug変更、スペック更新、導入事例追加、画像差し替えなどの日常的なデータ保守で、AI実装が `id` / `slug` / タグ / 画像権利 / 表示順の設計を誤らないようにする。

今回の変更は、既存設計の大幅変更ではなく、以下を揃えるための最小修正と文書化を行う。

- 内部参照は不変 `id`、公開URLは可変 `slug` という分離をUI実装まで徹底する
- 表示順は `data/*.ts` の配列順ではなく、表示側の明示ソートで決める
- 記事画像もロボット/メーカー画像と同じ権利ポリシーを通す
- anchor / sticky / scrollspy の基準をCSSに寄せ、JSとの二重定義を減らす
- AIがデータ追加・更新時に迷う「同一レコード更新か、新規レコードか」を明文化する

## 調査済みファイル

- `ai_implementation_workflow_prompt.md`
- `lib/data.ts`
- `lib/display.ts`
- `lib/manufacturerFilters.ts`
- `lib/media.ts`
- `lib/useActiveSection.ts`
- `lib/validate.ts`
- `lib/jsonLd.ts`
- `components/ManufacturersBrowser.tsx`
- `components/ManufacturerCard.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturerRobotsGrid.tsx`
- `components/NewsCard.tsx`
- `components/NewsFeatureCard.tsx`
- `components/NewsHeroCarousel.tsx`
- `components/ArticleToc.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `src/app/globals.css`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`

## 実装方針

### 1. `id` / `slug` 分離の実装修正

`groupRobotsByManufacturer()` は `robot.manufacturerId`、つまりメーカー `id` でMap化している。
メーカー一覧カード側も `manufacturer.id` で取り出す。

変更:

- `components/ManufacturersBrowser.tsx`
  - `robotsByManufacturer.get(manufacturer.slug)` を `robotsByManufacturer.get(manufacturer.id)` に変更
  - リストkeyも `manufacturer.id` に変更

### 2. React key の安定化

slugはURL用で変更され得るため、内部レコードのリストkeyは原則 `id` に寄せる。
記事は現状 `id` / `slug` が同じ方針でも、型上 `id` があるため `id` を優先する。

対象:

- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/ManufacturerRobotsGrid.tsx`
- `components/FeaturedRobotsGrid.tsx`
- `src/app/robots/[slug]/page.tsx` の関連リンクkey
- `src/app/manufacturers/[slug]/page.tsx` の記事key
- `components/NewsCard.tsx` / `NewsFeatureCard.tsx` はコンポーネント自身ではなく呼び出し側のkeyを必要に応じて調整

### 3. 表示順の明示ソート

`getRobots()` / `getManufacturers()` は取得関数なので、一覧都合のソートを持たない。
表示順が必要な箇所は `sortRobots()` / `sortManufacturers()` を使う。

変更:

- `src/app/robots/[slug]/page.tsx`
  - prev/next を `sortRobots(getRobots(), 'name', getManufacturers())` の順で算出
- `src/app/manufacturers/[slug]/page.tsx`
  - メーカー詳細のロボットグリッドを `sortRobots(robots, 'name', [manufacturer])` で描画

変更しない:

- `lib/data.ts`
  - `getRobots()` / `getManufacturers()` にソートを戻さない

### 4. 記事画像の権利ポリシー統一

ロボット/メーカー画像と同じく、記事画像も `getDisplayableAsset()` を通す。

変更:

- `src/app/reports/[slug]/page.tsx`
- `components/NewsCard.tsx`
- `components/NewsFeatureCard.tsx`
- `components/NewsHeroCarousel.tsx`
- `lib/jsonLd.ts`
- `lib/validate.ts`

詳細:

- 表示用の `heroImage?.src` 直参照を避ける
- `lib/validate.ts` で `article.heroImage` も `checkImageAsset()` に通す
- JSON-LDの `image` も表示可能な画像だけ出す

### 5. scrollspy offset の真実源をCSSへ寄せる

クリック停止位置は `scroll-margin-top`、active判定はJSの再計算になっている。
CSS変数 `--site-anchor-offset` を導入し、JS側は対象要素の `scrollMarginTop` を読む。

変更:

- `src/app/globals.css`
  - `--site-anchor-offset` を追加
  - `.scroll-mt-site-header` と `.top-site-header-gap` で共用
- `lib/useActiveSection.ts`
  - `--header-h` / `--sticky-bar-h` / `ACTIVE_SECTION_EXTRA_OFFSET` の再合算をやめる
  - 対象セクションの computed `scrollMarginTop` を active判定に使う

変更しない:

- `ArticleToc` / `ManufacturerDetailStickyHeader` の公開API
- 監視方式そのもの。今回は `scroll` + `requestAnimationFrame` を維持し、基準値だけ統一する

### 6. データ運用文書の補強

AIが「素材」と「置き場所」を聞けば、安全に実装できる程度まで運用を明文化する。

追記対象:

- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`

追記内容:

- 同一レコード更新と新規レコード追加の判断基準
- slug変更時の手順
- 画像素材を受け取った時の配置先と `ImageAsset` 記入項目
- タグ追加時の `tagRegistry` 運用
- 導入事例や記事との関連付けは `id` で行うこと
- 表示順は配列順ではなく表示側ソートに任せること

## 実装しないこと

- データモデルの再設計
- `id` の一括変更
- `getRobots()` / `getManufacturers()` へのソート再導入
- 新しいUIライブラリ追加
- 記事右sidebarのfade sticky実験差分の混入

## リスクと軽減策

| リスク | 軽減策 |
| --- | --- |
| 記事画像を `getDisplayableAsset()` 経由にすると、権利未設定/blocked画像が非表示になる | これは意図した安全側挙動。placeholder表示にフォールバックする |
| JSON-LD画像が減る可能性 | 表示不可画像をSEO構造化データに出さない方針へ統一 |
| prev/next の並びが変わる | 一覧のカタログ順と揃える意図的変更 |
| scrollspy active位置が微妙に変わる | CSS `scroll-margin-top` とクリック停止位置に合わせる。手動確認で記事/メーカー詳細を確認 |
| keyをid化してremountタイミングが変わる | idは不変なので、slug変更時の安定性が上がる |

## 検証コマンド

```bash
npm run validate:data
npx tsc --noEmit
npm run build
git diff --check
```

## 手動確認項目

- メーカー一覧で代表ロボットが表示される
- メーカーslugを将来変えても、代表ロボット表示は `id` 参照で残る設計になっている
- ロボット詳細の前後リンクがカタログ順と一致する
- メーカー詳細のロボット一覧が名前順で安定する
- 記事一覧/記事詳細で表示可能なhero画像は従来通り表示される
- 記事画像が権利ポリシーで非表示になる場合、placeholder表示に落ちる
- 記事TOCのクリック停止位置とスクロール中active位置がずれにくい

