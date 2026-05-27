# Figma Make UI 復元計画 v1

> 改訂メモ（2026-05-27）：レビューを受けて4点を修正。
> ① Tailwindをフェイルセーフ扱い → **主軸**に格上げ（決定ドキュメント準拠）。
> ② ブランド名はFigmaの "Humanoid Robot Portal" に戻さず **"Deploid" を維持**。
> ③ フェーズ順をユーザー優先度（**Home → ロボット → メーカー → 比較**）に再編。
> ④ `CLAUDE.md` / `package.json` の旧Astro記述クリーンアップを追加。

## 1. 目的

Next.js 実装を、Figma Make版のUI構造へ戻す。

現状のNext.js実装は、型定義、データ構造、App Router、SSG確認を優先した最小スキャフォールドであり、Figma Make版のUIを忠実移植した状態ではない。**データ層（`data/` `lib/`）は完成度が高く維持する。作り直すのはUI層のみ。**

本計画の目的は、以下を両立すること。

- UIの見た目・画面構成は Figma Make版を基準に戻す
- スタイリングは **Tailwind CSS** で行い、FigmaのclassNameをほぼ流用して再現性を上げる
- データ構造は現行の `slug` 中心のNext.js型を維持する
- URLは現行方針の `/reports` と `/use-cases` を維持する
- 実装をフェーズ分割し、各フェーズで確認してから次に進む
- 失敗時に直前フェーズだけを戻せるようにする

---

## 2. 真実源

| 領域 | 優先する真実源 |
|---|---|
| UI構造・レイアウト | `B2B Robot Buyer Portal UI/src/app/` |
| Next.jsルーティング | `src/app/` |
| データ型 | `data/types.ts`（＝ `nextjs_data_types_v1.ts` と一致） |
| データ取得 | `lib/data.ts` |
| ラベル変換 | `lib/labels.ts`（enumトークン→日本語） |
| URL命名・技術決定 | `docs/planning/nextjs_pre_migration_decisions_v1.md` |
| 実装手順 | 本書 |

重要：

- Figma Make版の `react-router` は使わない（`next/link` / `usePathname`）
- Figma Make版の `id` はNext側では `slug` に変換する
- Figma Make版の `/posts` はNext側では `/reports` に置換する
- Figma Make版の `/industries` はNext側では `/use-cases` に置換する
- **ブランド名は "Deploid" を維持する。** Figmaの "Humanoid Robot Portal / for Japanese B2B" は採用しない（`layout.tsx` の metadata と整合させる）
- Figma Make版のUI構造は尊重するが、古いコンテンツ文言や産業ロボット寄りの仮スペックはそのまま採用しない
- **スタイリングはTailwind CSS。** Figmaの `className` を流用し、ページごとの余白・幅のブレを防ぐためデザイントークンを先に固定する

---

## 3. 現状差分のMECE整理

| 分類 | Figma Make版にあるもの | 現Next.js版の状態 | 対応方針 |
|---|---|---|---|
| Styling基盤 | Tailwind + shadcn | 手書きプレーンCSS（Tailwind未導入） | **Phase 1でTailwind導入** |
| Design System | neutral基調、角丸ほぼなし、矩形UI | `--radius:18px` の丸カード、背景グラデ（CLAUDE.md "AI感回避"に違反） | Phase 1でトークン補正・グラデ撤去 |
| Global Shell | Header active state、4カラムFooter | Header簡略（brand=Deploid）、Footer簡略 | Phase 2で復元（brandは維持） |
| Breadcrumb | 全主要ページに `Breadcrumbs` | 未実装 | Phase 2で共通化 |
| Home | hub導線・注目ロボ・用途・ガイド・記事 | 構成はIA §5通り存在。見た目が最小 | Phase 3でFigma見た目に |
| Robots Index | パンくず、3フィルタ、status row、sort、3カラムカード | hero + 2カラムカードのみ | Phase 4で復元 |
| Robot Card | 画像枠、GENラベル、spec grid、View Details、favorite対応 | テキストカード + pillのみ | Phase 4で復元 |
| Manufacturers | 一覧・詳細 | 一覧/詳細は存在、見た目が最小 | Phase 5で復元 |
| Compare | 左メーカーaccordion、中央comparison sheet、右Favorites、選択状態 | 静的比較表のみ | Phase 6で復元 |
| Robot Detail | 上部タブ、パンくず、画像slider、Technical Specs、Application Notes、Prev/Next | 導入判断表中心 | Phase 7で統合復元 |
| Dependencies | `lucide-react`, `react-slick`, `slick-carousel`, Tailwind | 未導入 | Phase 1で必要分追加 |
| Data Adapter | Figmaは `id/manufacturerId` | Nextは `slug/manufacturerSlug` | 各Phaseでadapter化 |
| URL | Figmaに `/posts`, `/industries` が残る | Nextは `/reports`, `/use-cases` | Next方針を維持 |

---

## 4. 実装原則

### 4-1. UI復元の原則

- Figma Make版の画面構造を先に戻す
- 文言と表示データはNext側のB2B導入判断モデルに合わせる
- 「よく似た別UI」を作らない
- 既存Nextの巨大hero/丸カード/背景グラデは、復元対象ページでは使わない

### 4-2. スタイリングの原則（Tailwind）

- FigmaのTailwind `className` を流用する。手書きCSSへの逐次翻訳はしない
- ただし色・余白・radius・幅は `tailwind.config` のデザイントークンで一元管理する
  （bg / fg / muted / border / accent / radius / card padding / page max width / 3カラム幅）
- CLAUDE.md の "AI感回避" ルール（グラデ禁止、強いタイポ階層、矩形、左揃え）をトークン段階で担保する

### 4-3. データ維持の原則

- `data/types.ts` `lib/data.ts` `lib/labels.ts` は維持
- `slug` をURL識別子として維持
- Figma UIが必要とする値は、型を壊さずに派生させる
- 表示用adapterは `lib/` またはコンポーネント内の小さな変換関数に閉じ込める

### 4-4. 変更安全性

- 1フェーズごとに `npm run build` を通す
- 1フェーズごとに対象URLをローカルUIで確認する
- 1フェーズごとに `git diff --stat` を確認する
- `src/styles/global.css` は**どこからもimportされていない孤児**。今回触らない（実際に使われるのは `src/app/globals.css`）
- ユーザー未コミット変更を巻き込まない

---

## 5. フェーズ分割

> 順序はユーザー優先度に準拠：**Home → ロボット → メーカー → 比較** を先に作り切る。
> Phase 1-2（Tailwind基盤・共通Shell）は全ページの前提なので先頭に置く。

## Phase 0: Baseline固定と作業ブランチ

### 目的
現状を壊さず、復元作業を追跡可能にする。

### 実装内容
- 作業ブランチを確認する（現在 `codex/restore-figma-ui`）
- 現在の未コミット変更を確認する（`src/styles/global.css` の差分は孤児ファイルなので無害だが把握する）
- 現在の `npm run build` 成功状態を確認する

### 確認方法
```bash
git status -sb
npm run build
```

### 合格条件
- buildが成功する（確認済み：23ページSSG成功）
- 未コミットのユーザー変更を把握している
- 復元作業用ブランチにいる

---

## Phase 1: Tailwind導入とデザイントークン確定

### 目的
Figma Make版のUIをNext.jsで再現できる土台を作る。

### 実装内容
- Tailwind CSS を Next 16 / Turbopack 構成で導入する
- `nextjs_pre_migration_decisions_v1.md §13-11` のトークンを `tailwind.config` に固定する
  - bg / fg / muted / border / accent / radius / card padding / page max width / 3カラム幅
- `src/app/globals.css` から背景グラデを撤去し、`--radius` を矩形寄り（小さく）に補正する
- 必要依存を追加する
  - `lucide-react`（アイコン）
  - `react-slick` `slick-carousel`（画像slider。Phase 7まで必須でない＝後追いでも可）

### 確認方法
```bash
npm run build
```
ローカル確認URL：`/` `/robots` `/compare`

### 合格条件
- buildが成功する
- Tailwindクラスがページにあたっている
- 依存追加でReact19/Next16のバージョン衝突が起きていない
- 背景グラデが消え、矩形neutralに寄っている

### フェイルセーフ
- Next 16 / Turbopack でTailwindが不安定な場合、まず公式の Next+Tailwind 手順（PostCSSプラグイン）を確認してから導入する。`build` を通すまで他Phaseに進まない
- `react-slick` がReact 19で問題を起こす場合、画像sliderは静的プレースホルダーで代替し、この依存は入れない（Phase 7で再検討）

---

## Phase 2: 共通Shell復元

### 目的
Header、Footer、BreadcrumbsをFigma Make版相当に戻す。

### 実装内容
- `components/Breadcrumbs.tsx` を追加（Figma構造）
- `components/Header.tsx` をFigma構造へ
  - **brand: `Deploid`（維持。Figmaの仮名に戻さない）**
  - active nav（`usePathname` で判定。Headerを `use client` に）
  - nav項目とURLは現行維持（`/reports` `/use-cases`）
- `components/Footer.tsx` を4カラムへ
  - コンテンツ / ツール / 会社情報 / 更新情報
  - copyright / disclaimer
- 主要ページへBreadcrumbsを戻す

### 確認方法
```bash
npm run build
```
UI確認：`/robots` `/manufacturers` `/compare` `/guides` `/use-cases` `/reports`

### 合格条件
- 各主要ページにパンくずが表示される
- Footerが4カラムで復元される
- Headerのactive stateが機能し、brandが `Deploid` のまま
- `/reports` と `/use-cases` のURL方針を壊していない

### フェイルセーフ
- Server Componentへclient hookを混ぜてbuildが落ちた場合は、Headerをclient componentとして分離する

---

## Phase 3: Home復元（最優先・判断ポータルの顔）

### 目的
HomeをFigma Make版相当に戻す。サイトが「カタログ」ではなく「導入判断ポータル」に見えることを最優先で担保する。

### 実装内容
- 現行Homeの構成（IA §5：hero / hub6カード / 注目ロボット / 用途 / ガイド / 記事）を土台に、Figmaのカード・余白・タイポへ寄せる
- hero eyebrowの英語 "Humanoid Robot Buyer Portal" は文言を見直す（任意・コピー判断）
- 主要導線カードをFigmaのRobotCard等と視覚的に揃える

### 確認方法
```bash
npm run build
```
UI確認：`/`

### 合格条件
- HomeがFigma相当の情報密度・矩形neutral見た目になる
- 6つの主要導線が機能する
- 注目ロボット/用途/ガイド/記事が実データで表示される

---

## Phase 4: Robots一覧とRobotCard復元

### 目的
ロボット一覧をFigma Make版の一覧UIに戻す。

### 実装内容
- `RobotCard` をFigma構造へ（画像プレースホルダー / 右上ラベル / manufacturer / summary / spec grid / status / estCost / View Details / favorite props）
- `/robots` をFigma構造へ（Breadcrumbs / heading / 3フィルタ / active・pre-releaseボタン / sort row / 3カラムカード）

### データadapter方針
Figmaの仮スペックをそのまま使わない。
- `payload` ← `robot.specs.payloadKg`、なければ `要確認`
- `battery` ← `runtimeMin`、なければ `要確認`
- `status` ← `deploymentStageLabels`
- `estCost` ← `priceNote`
- `manufacturerName` ← `getManufacturerForRobot`

### 確認方法
```bash
npm run build
```
UI確認：`/robots` `/robots/unitree-g1`

### 合格条件
- `/robots` がFigma相当の情報密度・3カラムに戻る
- フィルタUIが表示される（最低限ローカル絞り込み）
- RobotCardがHome/Compareで再利用できる

### フェイルセーフ
- データ不足項目はハードコードせず `要確認` と表示する
- RobotCard変更で他ページが崩れたら、list用/card用variantをpropsで分ける

---

## Phase 5: Manufacturers一覧/詳細復元

### 目的
メーカーを「会社紹介」ではなく「供給体制ページ」としてFigma相当に戻す（IA §7）。

### 実装内容
- `ManufacturerCard` をFigma構造へ
- `/manufacturers` 一覧（Breadcrumbs / heading / カードグリッド）
- `/manufacturers/[slug]` 詳細（会社概要 + 国内窓口/代理店/サポート/PoC体制 + 紐づくrobots一覧）
- `getRobotsByManufacturerSlug` で機種リストを表示

### 確認方法
```bash
npm run build
```
UI確認：`/manufacturers` `/manufacturers/unitree` `/manufacturers/figure-ai`

### 合格条件
- 一覧・詳細にBreadcrumbsがある
- 詳細にメーカー配下のrobotsが表示される
- 供給体制（国内可否・サポート）が読める

---

## Phase 6: Compare復元

### 目的
CompareをFigma Make版の3ペインUIに戻す。

### 実装内容
- `/compare/page.tsx` を `use client`（必要なら `CompareClient.tsx`）へ分離
- 左：Manufacturers accordion（manufacturerごとのrobots / selected state）
- 中央：COMPARISON SHEET（empty state / selected robot cards / Clear All）
- 右：Favorites（favorite card / empty state）
- `RobotCard` のfavorite propsを有効化
- 既存の静的比較表は削除せず、下部または別sectionへ移す

### 確認方法
```bash
npm run build
```
UI操作確認：accordion開閉 / robot追加・削除 / favorite追加・削除 / empty state / 9件制限

### 合格条件
- 3ペイン構造が戻る / 状態管理が動く / 右Favoritesが戻る / build成功

### フェイルセーフ
- URL query保存はこのPhaseでは必須にしない
- 状態が複雑化したら、まずlocal stateだけで復元する

---

## Phase 7: Robot詳細復元（優先4ページの後）

### 目的
ロボット詳細をFigma Make版のプロダクト詳細ページ構成に戻す。

### 実装内容
- 上部section nav（Overview / Configurations / Technical Specifications / Installation / Applications / Resources）
- Breadcrumbs
- 画像sliderまたは画像プレースホルダー群
- Technical Specifications panel / Application Notes / Previous・Next Model
- Next側の導入判断情報も消さず、Figma構造内に統合する

### 確認方法
```bash
npm run build
```
UI確認：`/robots/unitree-g1` `/robots/figure-02`

### 合格条件
- パンくず / 上部タブ風nav / 画像領域 / Technical Specifications / B2B導入判断情報が揃う

### フェイルセーフ
- `react-slick` が失敗する場合は静的画像枠にする
- Figmaの産業ロボット仮値は使わず、なければ `要確認`

---

## Phase 8: 残りページの整合性確認

### 目的
Guides/UseCases/Reports/About/Contact の見た目とリンクを揃え、旧URL残存を一掃する。

### 実装内容
- Guides一覧/詳細、Use Cases一覧/詳細、Reports一覧/詳細のBreadcrumbsと見た目を揃える
- About / Contact の見た目を共通トークンに合わせる
- FooterリンクのURL修正
- `/posts` `/industries` `react-router` 残存チェック

### 確認方法
```bash
npm run build
rg -n "/posts|/industries|react-router|useLocation|useParams" src components data lib
```
UI確認：`/` `/manufacturers` `/guides` `/use-cases` `/reports` `/about` `/contact`

### 合格条件
- 全主要ページが表示される / 旧URLが残っていない / Header/Footer/Breadcrumbsが一貫 / build成功

---

## Phase 9: クリーンアップと最終検証・push

### 目的
旧Astro残骸を整理し、復元作業を安全にGitHubへ反映する。

### 実装内容
- `Deploid_toB/CLAUDE.md` を更新（Astro/Cloudflare Pages/4ページMVP → Next.js/Vercel/拡張スコープ）
- `package.json` から不要な `astro` 依存・`astro:*` スクリプトを整理（buildに影響しない範囲で慎重に）
- build確認 / diff確認 / commit / push

### 確認方法
```bash
npm run build
git status -sb
git diff --stat
git diff --check
```

### 合格条件
- build成功
- unrelated changesをcommitに含めていない（特に `src/styles/global.css` の孤児差分）
- CLAUDE.md が現行スタックと一致
- GitHubへpushできる

### フェイルセーフ
- commit前に `git diff --cached --stat` を確認する
- 不要ファイルがstageされていたら `git restore --staged <file>` で外す
- push前にbuildが落ちた場合はpushしない

---

## 6. 自己修正ポリシー

### 6-1. build失敗時
1. エラー箇所を特定する
2. 直前フェーズの変更範囲内で修正する
3. 同じ原因で2回失敗したら、依存・設計の代替案へ切り替える
4. 3回以上同じ原因で詰まる場合は、そのフェーズを止めて原因を明記する

### 6-2. UI差分が残った時
1. Figma Make版に存在する要素か
2. Next.js版に存在するか
3. 存在するが位置/密度/文言が違うのか
4. データモデル差分による意図的変更か
5. 意図的変更でないなら復元する

### 6-3. データ不足時
- 仮の数値を作らない
- 不明な値は `要確認` と表示する
- 出典が必要な値は `sources` に残す
- Figmaの仮値をそのまま移植しない

### 6-4. 依存・Tailwindで詰まった時
- UI再現のためだけに重い依存を増やしすぎない
- Tailwind導入は公式手順で `build` を通すまで完了扱いにしない
- `react-slick` が不安定ならCSS/静的枠で代替する
- 依存追加後は必ず `npm run build` を通す

### 6-5. Git安全ルール
- 1フェーズごとに必要ならcommitする
- unrelatedな既存変更（孤児 `src/styles/global.css` 含む）をstageしない
- `git reset --hard` は使わない
- 直前フェーズだけ戻せる粒度で作業する

---

## 7. 実装前チェックリスト

- [ ] 作業ブランチにいる（`codex/restore-figma-ui`）
- [ ] `npm run build` が通る
- [ ] Figma Make版の対象ファイルを確認した
- [ ] Tailwind導入方針を確認した（決定ドキュメント準拠）
- [ ] ブランド名は `Deploid` 維持の方針を確認した
- [ ] `src/styles/global.css`（孤児）を触らない方針を確認した
- [ ] `/posts`→`/reports`、`/industries`→`/use-cases`、`id`→`slug` の置換方針を確認した

---

## 8. 最終受け入れ条件

- [ ] Tailwindが導入され、デザイントークンが固定されている
- [ ] HeaderがFigma相当の情報量で、brandは `Deploid`
- [ ] Footerが4カラムに戻っている
- [ ] Breadcrumbsが主要ページに戻っている
- [ ] **Home** がFigma相当に戻っている（判断ポータルに見える）
- [ ] **`/robots`** がFigma相当の一覧UI（3カラム・フィルタ）に戻っている
- [ ] RobotCardがFigma相当の情報密度に戻っている
- [ ] **`/manufacturers`** 一覧/詳細が供給体制ページとして戻っている
- [ ] **`/compare`** が3ペインUIで、選択/削除/favoriteが動く
- [ ] `/robots/[slug]` がFigma相当の詳細UIに戻っている
- [ ] `npm run build` が成功する
- [ ] `/posts` と `/industries` がNext実装に残っていない
- [ ] `CLAUDE.md` が現行スタック（Next.js/Vercel）と一致
- [ ] unrelated changesをcommitしていない

---

## 9. 次に実行するフェーズ

次は Phase 0 → Phase 1（Tailwind導入）から実行する。

Phase 1 に進む前に確認：
- buildが通っているか
- 作業ブランチが切られているか
- 未コミット変更（孤児 `src/styles/global.css`）の扱いが明確か
