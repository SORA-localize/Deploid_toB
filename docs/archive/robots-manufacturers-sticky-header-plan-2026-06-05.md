# 実装計画書: ロボット・メーカーページへの sticky ヘッダー導入

作成日: 2026-06-05  
対象ブランチ: `experiment/reports-ui`

---

## 目的

`/robots` と `/manufacturers` に、`/reports` ページ（`ReportsHeader`）と同じ sticky ページヘッダーパターンを導入する。

現状は `RobotsBrowser` と `ManufacturersBrowser` にブレッドクラム・フィルタトグルがインライン埋め込みになっており、`ReportsBrowser` とパターンが不一致。これを揃える。

---

## 調査したファイル

| ファイル | 役割 |
|---|---|
| `components/ReportsHeader.tsx` | 参照実装（sticky ヘッダーのパターン） |
| `components/ReportsBrowser.tsx` | ReportsHeader の使用例 |
| `components/RobotsBrowser.tsx` | 変更対象（190行、全部インライン） |
| `components/ManufacturersBrowser.tsx` | 変更対象（280行、全部インライン） |
| `components/GuidesBrowser.tsx` | 全量読了。non-sticky ヘッダー別パターン（`border-b bg-card`、h1+フィルタ込み） |
| `components/UseCasesBrowser.tsx` | 全量読了。GuidesBrowser と同じ non-sticky パターン |
| `components/Header.tsx` | グローバルナビ（`relative` 配置, z-40/z-50, 高さ 4rem） |
| `components/Breadcrumbs.tsx` | `mb-6` ハードコード確認 |
| `components/PageSuspenseFallback.tsx` | `min-h-[calc(100svh-4rem)]`、sticky header 追加後も影響なし |
| `lib/useUrlFilters.ts` | URL param 読み書き hook |
| `lib/useActiveReportCategory.ts` | ReportsHeader 参照実装の hook パターン |
| `lib/uiText.ts` | ラベル定数の真実源 |
| `lib/robotFilters.ts` | 全量読了。activeRobots/preReleaseRobots は他フィルタ適用後の分類 |
| `lib/reportCategories.ts` | タブ定数のパターン |
| `src/app/globals.css` | `--header-h: 4rem`、`.site-container = mx-auto max-w-[1680px] px-4 md:px-8` |
| `src/app/robots/page.tsx` | RobotsBrowser の呼び出し元（ここのみ） |
| `src/app/manufacturers/page.tsx` | ManufacturersBrowser の呼び出し元（ここのみ） |
| `package.json` | scripts: dev / build / start / validate:data（lint・型チェック・test 未設定） |

### 調査で確認した補足事実

- **Guides・UseCases のヘッダーパターン**: sticky ではなく `border-b border-border bg-card` で区切り、h1 + description + フィルタを一体化。今回のスコープ外だが、パターン不統一はサイト全体で存在している。今回はロボット・メーカーのみ対応。
- **Header.tsx は `relative` 配置**: `sticky` ではないため、ページヘッダー側の `sticky top-0` は Header 高さを考慮不要。現行 `ReportsHeader` が `top-0` で正しく機能している理由と一致。
- **呼び出し元は各 page.tsx のみ**: RobotsBrowser・ManufacturersBrowser を import している箇所は各 page.tsx 1ファイルずつ。影響範囲が明確。
- **filterRobots の戻り値の正確な意味**: `activeRobots` / `preReleaseRobots` は「他フィルタ（業種・タスク・メーカー・入手性・検索）適用後」のロボットを deploymentStage で分類したもの。カウントはフィルタ状態によって変動する。

---

## 再利用する既存コード

- `ReportsHeader.tsx` の sticky div className をそのまま踏む
  ```
  sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85
  ```
- `Breadcrumbs` コンポーネント（使い方も ReportsHeader と同一）
- `useUrlFilters` hook（`getParam`, `updateParams`）
- `uiText.robots.breadcrumb`, `uiText.manufacturers.breadcrumb`（ラベルは真実源のまま）
- `cn` utility

---

## 新規作成するファイル

- `components/RobotsHeader.tsx`
- `components/ManufacturersHeader.tsx`

---

## 変更するファイル

- `components/RobotsBrowser.tsx`
  - Breadcrumbs を削除
  - リリーストグル（販売中/開発中）を削除
  - `<RobotsHeader activeCount={activeRobots.length} preCount={preReleaseRobots.length} />` を先頭に配置
  - 外包 div から `min-h-screen` を残す。内側 `site-container` の `py-12` は目視確認後に調整（計画時点では数値確定せず）

- `components/ManufacturersBrowser.tsx`
  - Breadcrumbs を削除
  - `<ManufacturersHeader />` を先頭に配置
  - `py-12` は同様に目視確認後に調整

---

## 変更しないファイル

- `components/ReportsHeader.tsx`（参照実装、触らない）
- `components/Breadcrumbs.tsx`（`mb-6` はそのまま、ReportsHeader と同じ外包パターンで吸収）
- `lib/useUrlFilters.ts`, `lib/uiText.ts`, `lib/robotFilters.ts`
- `src/app/globals.css`
- `src/app/robots/page.tsx`, `src/app/manufacturers/page.tsx`（page 側は Browser を渡すだけで変更なし）

---

## 設計判断

### 判断1: リリーストグルのカウント表示を props で維持する

**現状:**
```tsx
{ value: 'active', label: uiText.robots.activeModels(activeRobots.length) }  // "販売中:15件"
{ value: 'pre',    label: uiText.robots.preReleaseModels(preReleaseRobots.length) }  // "開発中:8件"
```
カウントは `filterRobots()` の戻り値（他フィルタ適用後の分類数）。他フィルタと連動して変動するため情報量がある。

**決定: `activeCount` / `preCount` を props で RobotsHeader に渡す**

```tsx
// RobotsBrowser 内で計算済みのカウントをそのまま渡す
<RobotsHeader activeCount={activeRobots.length} preCount={preReleaseRobots.length} />
```

理由:
- 販売中・開発中の件数は絞り込み状態を反映しており、ユーザーがタブ切り替え前に件数を把握できる
- `filterRobots()` はすでに RobotsBrowser で呼ばれており、追加計算コストなし

トレードオフ:
- `ReportsHeader` は完全 standalone（props なし）だが `RobotsHeader` は props を受け取る。パターンが一部異なる。
- ただし `activeCount`/`preCount` は表示用の数値のみであり、URL 状態管理は引き続き `useUrlFilters` で `RobotsHeader` 内部が担う。依存の方向は明確。

代替案（却下）: カウントを省いて standalone にする。件数という有意な情報が失われるため却下。

---

### 判断2: リリーストグルの aria semantics を `role="tab"` に変更

**現状:** `aria-pressed`（トグルボタン）  
**変更後:** `role="tab"` + `aria-selected`（ReportsHeader と同じ）

理由: UI としてタブ（択一選択）として機能しており、aria semantics をタブに揃える方が正確。スクリーンリーダーユーザーへの影響はあるが、改善方向。

---

### 判断3: ManufacturersHeader はブレッドクラムのみ

メーカーページにはリリーストグル相当の要素がない。Breadcrumbs のみの sticky header になる。  
`py-4` の余白を持たせ、高さを最低限確保する。タブ行がない分、ロボットページより少し低い高さになるが許容。

---

## 実装手順

1. `components/RobotsHeader.tsx` 新規作成
2. `components/RobotsBrowser.tsx` を修正（Breadcrumbs・リリーストグル削除、RobotsHeader 追加、py調整）
3. `components/ManufacturersHeader.tsx` 新規作成
4. `components/ManufacturersBrowser.tsx` を修正（Breadcrumbs 削除、ManufacturersHeader 追加、py調整）
5. `npm run build` でビルド確認

---

## 影響範囲

- `/robots` ページ: 見た目変更（sticky header 追加、リリーストグルの位置・外観変更）
- `/manufacturers` ページ: 見た目変更（sticky header 追加）
- 他ページへの影響なし（共通コンポーネント変更なし）

---

## z-index スタック（変更後）

```
z-50: Header のモバイルナビ
z-40: Header の relative 配置、FilterSelect ドロップダウン（Browser 内、scroll 域）
z-30: RobotsHeader, ManufacturersHeader, ReportsHeader（sticky page header）
```

FilterSelect の `relative z-40` は Browser 内（スクロール域）に残るため、sticky header (z-30) の下に潜ることはない。

---

## リスクと軽減策

| リスク | 重大度 | 軽減策 |
|---|---|---|
| aria 変更がスクリーンリーダーで意図しない読み上げになる | 低 | 改善方向の変更なので許容、リリース後確認 |
| py の調整で余白が詰まりすぎる or 広すぎる | 低 | 手動確認で目視調整（数値は実装時確定） |
| ダークモード時の backdrop-blur の表示崩れ | 低 | ReportsHeader と同じ className を使用するため既存動作と同一 |
| Guides・UseCases との header パターン不統一が残る | 低 | 今回スコープ外。将来対応リストに記載済み |

---

## 検証コマンド

```bash
npm run build
```

（型チェック・lint・テストの個別設定は未導入）

---

## 手動確認チェックリスト

### /robots
- [ ] スクロール時にヘッダーが sticky になる（コンテンツの上に残る）
- [ ] グローバル Header と sticky ヘッダーが z-index で重ならない
- [ ] "販売中" タブがデフォルト選択状態（アンダーライン付き）
- [ ] "開発中" クリックでカードグリッドが開発中ロボットに切り替わる
- [ ] URL に `?release=pre` が付与される
- [ ] ブラウザの戻るで `release=pre` が解除され "販売中" に戻る
- [ ] FilterSelect のドロップダウンが sticky ヘッダーの上（手前）に表示される
- [ ] Breadcrumbs が「ホーム > ロボット」と表示される
- [ ] モバイル幅（375px）でレイアウトが崩れない
- [ ] ダークモードで bg-background/95 + backdrop-blur が正しく表示される

### /manufacturers
- [ ] スクロール時にヘッダーが sticky になる
- [ ] Breadcrumbs が「ホーム > メーカー」と表示される
- [ ] グローバル Header と重ならない
- [ ] モバイル幅で崩れない
- [ ] ダークモードで正しく表示される

### 既存機能の回帰確認
- [ ] /reports ページの ReportsHeader に変化がない
- [ ] /robots のフィルタ（業種・タスク・メーカー・国内入手性・検索）が引き続き機能する
- [ ] /manufacturers のフィルタ（地域・相談ルート・検索）が引き続き機能する

---

## 残るリスク

- `Breadcrumbs` の `mb-6` は sticky header 用には少し大きいが、ReportsHeader と同一構成なので許容。将来的に Breadcrumbs を props 化（`className` など）する際に整理できる。
- `ManufacturersHeader` にタブ要素がないため、将来「メーカーにもタブを追加したい」となった場合は Header コンポーネントの修正が必要。
