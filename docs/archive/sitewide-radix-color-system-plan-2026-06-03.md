# Sitewide Radix Color System Replacement Plan

作成日: 2026-06-03

対象: Deploid ToB サイト全体のデザインシステム、色トークン、データ由来の状態表示

## 目的

現在の UI は白黒・neutral・矩形・情報密度を優先しており、B2B の比較/調査サイトとしては妥当な方向です。一方で、色の使い方が「ほぼ灰色」か「個別コンポーネント内の直書き」に寄っていて、導入段階、国内入手性、信頼度、権利状態、フォーム状態、D&D 状態などの意味が視覚的に伝わりにくい。

この計画では、サイト全体の白黒ベースは維持しつつ、Radix Colors を色設計の基盤として採用し、UI とデータ側の意味色を再設計する。

## 現状整理

### 灰色が多い理由

既存の設計文書では、Deploid を「ヒューマノイド導入判断のための B2B buyer intelligence / reference portal」と位置づけている。したがって、現在の neutral 中心の設計には次の合理性がある。

- メーカー公式サイトのような販売色を避ける
- 複数メーカー/機種を公平に比較する
- 画像が不足しても情報が成立する
- 繰り返し使う調査/比較ツールとして疲れにくくする
- 装飾より出典、未確認、リスク、比較可能性を優先する

問題は neutral そのものではなく、neutral の上に載せる「意味のある色レイヤー」が不足していること。

### 現在の実装

- `src/app/globals.css`
  - shadcn/Tailwind v4 形式の CSS 変数を使用
  - `--background`, `--card`, `--muted`, `--border`, `--primary`, `--ring` などはほぼ OKLCH の無彩色
  - `--accent-blue-pale` とホーム地図の `#0d7c66` だけが明確なアクセント
- `docs/planning/design_system_v1.md`
  - neutral、矩形、情報密度、出典重視を明文化
  - ただし現在の `globals.css` / Tailwind token 実装との差分が出ている
- `components/TagChip.tsx`
  - `success`, `warning`, `info` を持つが、`green-*`, `amber-*`, `blue-*` を直書き
- `components/UseCasesBrowser.tsx`
  - `maturityTone`, `readinessTone` がローカル実装
- `components/RobotCard.tsx`
  - 量産/限定販売だけ `text-green-*` 直書き
- `components/ContactForm.tsx`
  - warning/error が `amber-*`, `red-*` 直書き
- `components/ManufacturerMapCopy.tsx`
  - 地図のアクセントに `#0d7c66` 直書き
- `components/CompareClient.tsx`
  - D&D 状態、選択状態、お気に入り状態が primary / ring / yellow などに散在

## Radix 採用方針

### 採用するもの

Radix Colors を色スケールの基盤として使う。Radix Colors は各色に 12 step のスケールがあり、公式ドキュメントでは step ごとに用途が定義されている。

- 1-2: app/subtle background
- 3-5: component background / hover / selected
- 6-8: border / interactive border / focus ring
- 9-10: solid background / solid hover
- 11-12: text

参考:

- Radix Colors scale use cases: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Radix Colors scales: https://www.radix-ui.com/colors/docs/palette-composition/scales
- Radix Colors aliasing: https://www.radix-ui.com/colors/docs/overview/aliasing
- Radix Colors installation: https://www.radix-ui.com/colors/docs/overview/installation

### すぐには採用しないもの

Radix Themes の全面採用は初期スコープに入れない。

理由:

- 現在のアプリは Next.js + Tailwind v4 + shadcn 風 CSS 変数で構成されている
- Radix Themes はコンポーネント、radius、spacing、theme provider まで影響する
- いきなり Themes 化すると、既存ページ全体の構造差分が大きくなり、D&D や比較UIの修正と衝突しやすい

まずは Radix Colors を `globals.css` の CSS 変数に取り込み、既存 Tailwind class 名を壊さずに中身を差し替える。

## 推奨パレット

白黒ベースを維持し、色は状態と意味に限定する。

| 役割 | 推奨 Radix scale | 理由 |
|---|---|---|
| Neutral / app gray | Slate | 工業/調査系に合いやすく、純 gray よりわずかに情報UIらしい |
| Brand / primary | Jade | 既存アクセント `#0d7c66` に近く、青/紫に寄りすぎない |
| Info | Blue | 一般的な情報/参照の意味に合う |
| Success / ready | Grass or Green | 商用化、国内対応、確認済みなどに使う |
| Warning / uncertainty | Amber | 要PoC、要問い合わせ、推定、権利確認中 |
| Danger / blocked | Ruby or Tomato | 利用不可、blocked、inactive、error |
| Favorite | Amber or Yellow | 星アイコン限定。UI全体の warning と混同しない token 名にする |
| Overlay | Black Alpha / White Alpha | ホーム地図、メディアオーバーレイ、DragOverlay |

## MECE 対象範囲

以下の層に分ける。上位層は下位層を消費するだけにし、重複責務を持たせない。

### 1. Foundation / Theme

対象:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `components/ThemeProvider.tsx`
- `components/ThemeModeToggle.tsx`
- Tailwind v4 `@theme inline`
- dark mode token
- focus ring / selection / outline / view transition

やること:

- `@radix-ui/colors` を入れるか、必要な CSS 変数を `globals.css` に明示定義するか決める
- `--background`, `--card`, `--popover`, `--muted`, `--border`, `--input`, `--ring`, `--primary` を Radix step に再マップ
- `--surface-*`, `--border-*`, `--text-*`, `--semantic-*` の alias を追加
- light/dark 両方で同じ意味名を使う

### 2. Design Policy / Docs

対象:

- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `docs/planning/dark-mode-theme-refactor-plan-2026-06-03.md`
- 今回の計画書

やること:

- 「neutral 中心」から「white/black base + semantic color layer」へ文書を更新
- 直書き色禁止、semantic token 優先、例外カテゴリを明文化
- Radix Colors は色基盤、Radix Themes は将来検討として分離

### 3. Primitive Components

対象:

- `components/TagChip.tsx`
- `components/FilterChipGroup.tsx`
- `components/SelectControl.tsx`
- `components/SearchInput.tsx`
- `components/FormSelect.tsx`
- `components/EmptyState.tsx`
- `components/Breadcrumbs.tsx`
- `components/ArticleToc.tsx`
- `components/RelatedLinkList.tsx`
- `components/SourceList.tsx`
- `components/Markdown.tsx`

やること:

- `TagChipTone` を新しい `VisualTone` に置き換える
- button/select/input/focus/hover/selected/disabled を token で統一
- alert/success/error/pending を共通表現にする
- `SourceList` に reliability tone を出せるようにする

### 4. Shell / Navigation

対象:

- `components/Header.tsx`
- `components/Footer.tsx`
- page header 相当の各ページ冒頭

やること:

- active nav、CTA、mobile menu、theme toggle の色を token 化
- 全ページで同じ header band / content background / footer rule を使う

### 5. Data Semantics

対象:

- `data/types.ts`
- `lib/labels.ts`
- `lib/display.ts`
- `lib/tagRegistry.ts`
- `lib/tags.ts`
- `lib/media.ts`
- 新規: `lib/visualSemantics.ts`

やること:

- ラベルは `lib/labels.ts` のまま維持
- 並び順は `lib/display.ts` のまま維持
- 見た目の意味色だけ `lib/visualSemantics.ts` に集約
- UI ローカルの `maturityTone`, `readinessTone`, stage green 判定を削除
- `tagRegistry` に tone を入れる場合は、純粋なカテゴリ色なのか状態色なのかを分ける

初期 tone 案:

```ts
export type VisualTone =
  | 'neutral'
  | 'brand'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'unknown'
  | 'favorite';
```

マッピング対象:

- `PublishStatus`
- `Reliability`
- `RightsStatus`
- `DeploymentStage`
- `BuyerReadiness`
- `JapanAvailability`
- `CompanyStatus`
- `JapanPresence`
- `GuideStage`
- `ReportType`
- `UseCaseMaturity`
- `OperatingEnvironment`
- `Capability`
- `TagKind`
- media displayability / blocked state
- form pending/succeeded/error state
- favorite/selected/D&D active state

### 6. Collection Pages

対象:

- `components/RobotsBrowser.tsx`
- `components/RobotCard.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/GuidesBrowser.tsx`
- `components/ReportsBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/FeaturedRobotsGrid.tsx`
- `components/ManufacturerRobotsGrid.tsx`

やること:

- cards, filters, empty states, result count, active release tabs を token 化
- robot stage / availability / favorite / manufacturer consultation route を semantic tone 化
- use case maturity/readiness のローカル tone を撤去

### 7. Detail Pages

対象:

- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`

やること:

- fact sheet / spec table / decision table / sidebars / related links / source blocks を共通 token に寄せる
- `CheckCircle2`, `AlertCircle`, key takeaway, why-it-matters などの意味色を semantic tone にする
- contact form の warning/error/success を共通化

### 8. Compare / Interactive Tools

対象:

- `src/app/compare/page.tsx`
- `components/CompareClient.tsx`
- `components/ComparisonRobotPanel.tsx`
- `components/SortableCompareCard.tsx`
- `components/FavoriteCard.tsx`

やること:

- D&D active / over / selected / disabled / overlay / favorite を token 化
- comparison sheet / manufacturer column / favorite column の背景と border を構造に合わせる
- 現在 `components/CompareClient.tsx` に D&D 修正の未コミット差分があるため、デザインシステム移行前にその差分を完了/commit する

### 9. Home / Map / Media

対象:

- `src/app/page.tsx`
- `components/ManufacturerWorldMap.tsx`
- `components/ManufacturerMapStage.tsx`
- `components/ManufacturerMapCopy.tsx`
- `components/HomeContentNavigator.tsx`
- `components/RobotImageCarousel.tsx`
- `components/ManufacturerLogoName.tsx`

やること:

- 地図アクセント `#0d7c66` を brand token に置換
- 地図/メディアの暗い演出は `media` / `map` 用 token として通常カードから分離
- image missing / rights blocked / logo fallback を semantic state として扱う
- ロゴ表示の `bg-white` は dark mode でも必要なブランド保護 plate かどうかを明文化

### 10. Validation / Tooling

対象:

- `package.json`
- `scripts/validate-data.mjs`
- visual QA 手順
- grep gate

やること:

- `npm run validate:data`
- `npm run build`
- `git diff --check`
- 直書き色の残存確認
- light/dark の主要ルート確認

## 実装手順

### Phase 0: 既存差分の整理

目的: D&D 修正とデザインシステム移行を混ぜない。

- `components/CompareClient.tsx` の未コミット差分を確認
- D&D 修正を検証して commit
- その後、デザインシステム移行ブランチ/commit に入る

### Phase 1: Palette Contract

目的: 色の名前と用途を決める。

- Radix scale の採用色を確定
- token 名を決める
- `design_system_v1.md` を更新
- 「直書きしてよい色」と「禁止する色」を定義

成果物:

- `docs/planning/design_system_v1.md` 更新
- token map 表

### Phase 2: Foundation Token Implementation

目的: 既存 class 名を壊さず、色の中身だけ入れ替える。

- 必要なら `@radix-ui/colors` を追加
- `src/app/globals.css` に Radix scale import / variable mapping を追加
- `@theme inline` を更新
- light/dark の `--background`, `--card`, `--muted`, `--border`, `--ring`, `--primary` を再定義

成果物:

- `globals.css`
- package update if needed

### Phase 3: Visual Semantics Layer

目的: データ状態から色を決める場所を一本化する。

- `lib/visualSemantics.ts` を追加
- enum -> tone mapping を exhaustiveness 付きで定義
- `TagChip` を `VisualTone` 対応に変更
- `UseCasesBrowser`, `RobotCard`, `SourceList`, `ContactForm` からローカル tone/直書き色を移動

成果物:

- `lib/visualSemantics.ts`
- `components/TagChip.tsx`
- 関連コンポーネント更新

### Phase 4: Primitive Components Rollout

目的: ボタン、入力、フィルタ、チップの基礎を統一する。

- `FilterChipGroup`
- `SelectControl`
- `SearchInput`
- `FormSelect`
- `EmptyState`
- `SourceList`
- `ArticleToc`
- `RelatedLinkList`
- `Markdown`

この phase で direct color class の大半を減らす。

### Phase 5: Page Rollout

目的: 主要ページをルート単位で適用する。

順序:

1. Shell: `Header`, `Footer`
2. Collection: robots / manufacturers
3. Content: guides / reports / use-cases
4. Detail: robot / manufacturer / use-case / guide / report
5. Contact / about
6. Compare
7. Home map / media

Compare と Home map は interactive/visual の影響が大きいため後半に回す。

### Phase 6: Cleanup Gates

目的: 新旧色体系の混在をなくす。

確認コマンド:

```sh
rg -n "green-|amber-|blue-|red-|yellow-|#[0-9a-fA-F]{3,6}|neutral-|gray-|slate-|stone-|zinc-" components src/app lib
npm run validate:data
npm run build
git diff --check
```

残してよい例外:

- メディアオーバーレイの alpha color
- ロゴ保護用 white plate
- markdown/code block の最小背景
- 外部ブランド素材そのもの

### Phase 7: Visual QA

主要ルート:

- `/`
- `/robots`
- `/robots/unitree-g1`
- `/manufacturers`
- `/manufacturers/unitree`
- `/compare`
- `/guides`
- `/guides/decision-variables`
- `/use-cases`
- `/reports`
- `/contact`

確認観点:

- light/dark
- desktop/mobile
- focus ring
- hover/selected/disabled
- D&D active/over/overlay
- form pending/success/error
- image missing state
- source reliability display
- contrast and text overflow

## 実装前監査

1. Radix Themes まで一気に入れると差分が大きすぎる
   - 対応: 初期は Radix Colors のみ

2. 色を増やしすぎると B2B 調査サイトの落ち着きが崩れる
   - 対応: brand/info/success/warning/danger/unknown/favorite に制限

3. `neutral-*` や `green-*` の直書きが残る
   - 対応: grep gate を phase ごとに実行

4. データの意味と UI 色が混ざる
   - 対応: label/order/visualSemantics を分ける

5. category tag と risk/status tag が混同される
   - 対応: `TagKind` は基本 neutral/categorical、状態 enum は semantic tone

6. dark mode でカード、popover、input の階層差が消える
   - 対応: Radix step 1-8 の用途に沿って alias を定義

7. 地図/メディアの暗い演出が通常UI token と競合する
   - 対応: `--media-*`, `--map-*` など別カテゴリにする

8. 比較D&Dの既存未コミット差分と衝突する
   - 対応: Phase 0 で先に D&D を完了/commit

9. アクセシビリティ確認が主観になる
   - 対応: Radix step 11/12 の text 用途を守り、主要状態は目視と keyboard 操作で確認

10. 全ページ一括変更でレビュー不能になる
    - 対応: token、semantics、primitive、route rollout の commit に分割

## 推奨 commit 分割

1. `docs: plan sitewide radix color system`
2. `style: add radix color token aliases`
3. `refactor: centralize visual semantics`
4. `refactor: apply semantic tones to primitives`
5. `style: update shell and collection surfaces`
6. `style: update detail page surfaces`
7. `style: update compare interaction colors`
8. `style: update home map and media colors`
9. `docs: update design system color policy`

## 判断が必要な未決事項

- `@radix-ui/colors` を依存追加するか、必要な scale 値だけ CSS に固定するか
- brand scale を `jade` にするか `teal` にするか
- success scale を `grass` にするか `green` にするか
- `tagRegistry` に category color を持たせるか、状態色だけ `visualSemantics` に閉じるか
- Radix UI primitives を Select/Tabs/Tooltip などに段階導入するか

## 結論

このプロジェクトで最適なのは、Radix を「コンポーネント総入れ替え」ではなく「色の設計基盤」として入れる進め方。白黒ベースは維持し、Radix の 12 step scale を使って背景、hover、selected、border、focus、solid、text の階層を作る。その上で、データ側に `visualSemantics` を追加し、導入段階、国内入手性、信頼度、権利状態などの意味色を UI 全体で一貫させる。
