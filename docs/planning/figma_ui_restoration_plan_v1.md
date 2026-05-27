# Figma Make UI 復元計画 v2（Option C：クリーン後・逐語コピー方式）

> 改訂メモ（2026-05-28）：UI実装が2回ともゴミ化したため方針を確定し直した。
> - 失敗原因：**restyle / 再解釈**で作っていた。構造が違うものに色を塗っても別物のまま。
> - 確定方針：**Option C** = 現行Nextのデータ層/routing/SEOは維持し、UIは**Figmaのコードを逐語コピー**する。
> - 加えて：**作り直す前に、これまでの再現UIを一旦クリーンに削ぎ落とす**（クリーンスレート）。
> - 旧v1（restyle前提・P1でTailwind導入〜の段取り）は本v2で置き換え。

---

## 1. 核心ルール（最重要・これを破ったのが失敗原因）

**「Figmaのマークアップは逐語コピー。再解釈・restyle・独自UIは禁止。差分はバグ。」**

| 区分 | 扱い |
|---|---|
| **そのままコピーする** | レイアウト構造、`className`(Tailwind)、コンポーネント構成、**列構造**（例 Compareの `w-64 / flex-1 / w-64`）、カードの解剖（画像枠/バッジ/spec grid/View Details）、インタラクション（accordion・選択・favorite・空状態） |
| **機械的置換のみ許可** | `react-router` の `Link to=`→`next/link` の `href=`、`useLocation`→`usePathname`、`useParams`→`params`、`robot.id`→`robot.slug`、`mockData` import→`@/lib/data`、`/posts`→`/reports`、`/industries`→`/use-cases` |
| **内容を自モデルに差し替え** | brand→`Deploid`、Figmaのハードコード仮スペック（`6-axis`/`±0.02mm`/`¥8.5M~` 等）→自データの該当フィールド＋無ければ `要確認`、英語コピーは当面維持（日本語化は後） |
| **禁止** | 見た目の"改善"、列構造の簡略化、カードの作り替え、`restyle`、Figmaに無い独自レイアウト |

> 各フェーズで「Figma原本を隣に開き、構造差分が出たら直す」。`要確認` 以外でデータが無くてもFigmaの枠は残す。

---

## 2. 真実源

| 領域 | 真実源 |
|---|---|
| UI構造・レイアウト・className | **`B2B Robot Buyer Portal UI/src/app/`（Figma原本）** |
| データ型 | `data/types.ts`（＝`nextjs_data_types_v1.ts`） |
| データ取得 | `lib/data.ts` / ラベル変換 `lib/labels.ts` |
| ルーティング/URL命名 | `src/app/`（App Router）。`/reports` `/use-cases`、識別子は `slug` |
| 実装手順 | 本書 |

維持する資産（Optionの肝＝これらは作り直さない）：
- `data/`（slug中心の型・実データ）
- `lib/data.ts` `lib/labels.ts`
- App Routerの14ルートの骨格
- SEO/SSG（`generateStaticParams`）

捨てる資産（＝これまでの再現UI＝ゴミ）：
- 簡易テキストカード（現 `components/Cards.tsx`）
- restyleしたHeader/Footer/Breadcrumbs/Home
- 静的比較テーブル（現 `compare/page.tsx`）
- `globals.css` のレガシー独自クラスとレガシートークン

---

## 3. Figma↔現行の構造乖離（調査結果・要復元）

| 画面 | Figma原本 | 現行（ゴミ） |
|---|---|---|
| **RobotCard** | 画像枠`aspect-[4/3]`＋GENバッジ＋`<dl>`spec grid(6項目)＋View Details行＋favorite星 | テキスト＋pill 3つ |
| **Robots一覧** | `max-w-7xl`・3フィルタ・status行・**3カラム** | `.container`・フィルタ無・**2カラム** |
| **Compare** | `max-w-[1800px]`・**3ペイン**（メーカーaccordion / RobotCard比較シート / Favorites）・状態管理・**カード共有** | 単一静的`<table>` |
| **FavoriteCard** | あり（Compare右ペイン） | **無い** |
| Shell | max-w-7xl・active nav・4カラムFooter | restyle版 |

調査で確認済み：robots/compareの核ページは **shadcn非依存（プレーンTailwind + lucideのみ）** → 逐語コピーがクリーン。

---

## 4. フェーズ分割

> 並び：**クリーン → Shell → Home → RobotCard → Robots → Manufacturers → Compare → Robot詳細 → 残り → 最終整理**。
> 優先4領域（Home/ロボット/メーカー/比較）を先に作り切る方針を踏襲。

### Phase 0：Baseline固定
- 作業ブランチ確認（`codex/restore-figma-ui`）、`npm run build` 成功確認、未コミット変更（孤児 `src/styles/global.css`）把握。
- **合格**：build成功・ブランチ確認・未コミット把握。

### Phase 1：UIクリーンスレート（ガレージ一掃）★今回の主眼
これまでの再現UIを削ぎ落とし、Figma逐語コピーを載せる素の土台に戻す。
- `src/app/globals.css` を **`@import "tailwindcss"` ＋ Figmaの`@theme`トークン（neutral・`--radius:0`・accent#0d7c66）＋最小base** だけに縮小。
  - レガシー独自クラス（`.hero/.card/.panel/.table/.button/.pill/.container/.grid/.section/.eyebrow/.page-title/.lead/.footer/.header/.nav/.detail-grid/.site-shell/.main/.meta/.muted`）を**全削除**。
  - レガシートークン（`--bg/--fg/--line/--ink-muted/--subtle/--max`）を**全削除**（Figmaトークンに一本化＝監査の2系統並存を解消）。
- 再現コンポーネントを撤去：`components/Cards.tsx`（簡易カード）、restyle版 `Header/Footer/Breadcrumbs`、`page.tsx`(Home)。
- `src/app/**/page.tsx` を**最小スタブ**に（`<main className="mx-auto max-w-7xl px-6 py-12"><h1>…</h1></main>` 程度）してbuildを通す。`layout.tsx` はHeader/Footer参照を一旦外すかスタブ化。
- `data/` `lib/` は**触らない**。
- **確認**：
  ```bash
  npm run build
  rg -n "\.hero|\.card|\.panel|\.container|\.page-title|\.eyebrow|--bg:|--ink-muted" src components
  ```
- **合格**：build成功・レガシークラス/トークンの参照が0・全ルートがスタブで200。
- **フェイルセーフ**：一気に消してbuildが落ちたら、参照元ページを先にスタブ化してから削除する。

### Phase 2：共通Shell逐語コピー（Layout/Header/Footer/Breadcrumbs）
- Figma `components/Layout.tsx` `Header.tsx` `Footer.tsx` `Breadcrumbs.tsx` を逐語コピー。
- 機械的置換：`Link to`→`href`、`useLocation`→`usePathname`、`react-router`除去。
- 内容差し替え：**brand=`Deploid`**、Footer/Headerの `/industries`→`/use-cases`・`/posts`→`/reports`、存在しない`/partners`は出さない。
- active判定のため Header は `use client`。
- **確認**：build＋`/robots`等でShell表示。**合格**：max-w-7xl・active nav・4カラムFooter・パンくず・旧URL残存なし。

### Phase 3：Home
- Figma `pages/Home.tsx` の**視覚語彙（border矩形カード・section区切り・タイポ）を基準**に、IA §5の構成（hero/主要導線/注目ロボット/用途/ガイド/記事）を同じカード部品で組む。
- データは `lib/data` 経由。**合格**：Figma相当の矩形neutral・実データ表示・build成功。

### Phase 4：RobotCard ＋ FavoriteCard 逐語コピー
- Figma `components/RobotCard.tsx` `FavoriteCard.tsx` を逐語コピー（画像枠/GENバッジ/spec grid/View Details/favorite props）。
- **データadapter**（Figmaの仮値は使わない）：
  - payload←`specs.payloadKg`、battery←`runtimeMin`、status←`deploymentStageLabels`、estCost←`priceNote`、manufacturerName←`getManufacturerForRobot`。無い項目は `要確認`。
  - GENバッジ等の固定文言は、データが無ければ出さないか中立表記に。
- **合格**：一覧/Compoundで共有できるRobotCardが画像カードとして表示・build成功。

### Phase 5：Robots一覧 逐語コピー
- Figma `pages/RobotsIndex.tsx` を逐語コピー（`max-w-7xl`・3フィルタ・status行・**3カラム**・RobotCard）。
- フィルタは最低限ローカル絞り込み（動かないUIにしない）。
- **合格**：3カラム＋フィルタ＋status行・Figma相当の情報密度・build成功。

### Phase 6：Manufacturers 一覧/詳細
- Figmaの `ManufacturersIndex` / `ManufacturerDetail` を逐語コピー。詳細は配下robots一覧（`getRobotsByManufacturerSlug`）。
- `generateMetadata` 追加（SEO）。**合格**：一覧/詳細・パンくず・配下robots・build成功。

### Phase 7：Compare 逐語コピー（3ペイン）
- Figma `pages/Compare.tsx` を逐語コピー。`compare/page.tsx` を `use client`（必要なら `CompareClient.tsx`）。
- 左：メーカーaccordion（展開→配下robot→選択/解除・9件上限・X）/ 中央：COMPARISON SHEET＋空状態＋**RobotCard 3カラム**（削除X・favorite）/ 右：Favorites（FavoriteCard・空状態）。
- 状態は `useState`(selected/favorite/expanded)。
- **合格**：3ペイン・列構造一致・選択/削除/favorite/空状態/9件上限が動く・build成功。

### Phase 8：Robot詳細 逐語コピー
- Figma `pages/RobotDetail.tsx` を逐語コピー（上部section nav・パンくず・画像slider or 静的枠・Technical Specs・Application Notes・Prev/Next）。
- 必要なら `react-slick`/`slick-carousel` と `slider.css` をこのPhaseで導入（不安定なら静的枠で代替）。
- 自モデルの導入判断情報も統合。`generateMetadata` 維持。

### Phase 9：残りページ逐語コピー（guides / use-cases / reports / about / contact）
- 各Figmaページを逐語コピー。`generateMetadata`（title＋description）を全detailに追加（監査のSEO穴を解消）。
- `/posts` `/industries` `react-router` 残存チェック。

### Phase 10：旧Astro残骸クリーンアップ＋最終検証＋push
- 削除：`src/pages/*.astro` `src/components/*.astro` `src/layouts/*.astro` `astro.config.mjs` `src/content.config.ts` `src/content/`、`package.json` の `astro`依存・`astro:*`スクリプト・`wrangler`（使わない範囲で）。孤児 `src/styles/global.css` も決着。
- `CLAUDE.md` を最終確認。build/diff確認 → commit → push。

---

## 5. 各フェーズ共通の検証

```bash
npm run build                 # 必須
git diff --stat               # 変更範囲確認
```
- Figma原本を隣に開き、構造差分（要素・列・密度）が出たら復元する。
- データ不足は仮値を作らず `要確認`。出典は `Source[]` に残す。

---

## 6. 自己修正・Git・受入

### build失敗
1. 直前フェーズ範囲で修正 → 2回同因で失敗なら代替（依存/client境界）→ 3回で停止し原因明記。

### 依存
- 重い依存を増やさない。`react-slick` 不安定なら静的枠。Tailwindは導入済み。

### Git
- 1フェーズ=1コミット。`src/styles/global.css`（孤児）等のunrelatedをstageしない。`git reset --hard` 禁止。直前フェーズだけ戻せる粒度。

### 最終受け入れ条件
- [ ] レガシー独自クラス/トークンが残っていない（クリーン完了）
- [ ] RobotCardが画像カード（spec grid/View Details/favorite）
- [ ] `/robots` が3カラム＋フィルタ
- [ ] `/compare` が3ペインでRobotCardを共有、選択/削除/favoriteが動く
- [ ] FavoriteCardが存在し機能する
- [ ] Shell（max-w-7xl/active nav/4カラムFooter/パンくず）一貫、brand=Deploid
- [ ] detail各種に `generateMetadata`
- [ ] `/posts` `/industries` `react-router` 残存なし
- [ ] 旧Astro残骸を整理
- [ ] `npm run build` 成功・unrelated未コミットを巻き込まない

---

## 7. 次に実行するフェーズ

**Phase 0 → Phase 1（UIクリーンスレート）** から。
Phase 1完了の合格条件（レガシー参照0・全ルートstubでbuild成功）を満たしてから Phase 2 のFigma逐語コピーに入る。
