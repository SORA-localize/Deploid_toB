# Figma Make UI 復元計画 v1

## 1. 目的

Next.js 実装を、Figma Make版のUI構造へ戻す。

現状のNext.js実装は、型定義、データ構造、App Router、SSG確認を優先した最小スキャフォールドであり、Figma Make版のUIを忠実移植した状態ではない。

本計画の目的は、以下を両立すること。

- UIの見た目・画面構成は Figma Make版を基準に戻す
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
| データ型 | `data/types.ts` |
| データ取得 | `lib/data.ts` |
| URL命名 | `docs/planning/nextjs_pre_migration_decisions_v1.md` |
| 実装手順 | 本書 |

重要：

- Figma Make版の `react-router` は使わない
- Figma Make版の `id` はNext側では `slug` に変換する
- Figma Make版の `/posts` はNext側では `/reports` に置換する
- Figma Make版の `/industries` はNext側では `/use-cases` に置換する
- Figma Make版のUI構造は尊重するが、古いコンテンツ文言や産業ロボット寄りの仮スペックはそのまま採用しない

---

## 3. 現状差分のMECE整理

| 分類 | Figma Make版にあるもの | 現Next.js版の状態 | 対応方針 |
|---|---|---|---|
| Global Shell | Header active state、4カラムFooter | Header簡略、Footerほぼ消失 | Phase 2で復元 |
| Breadcrumb | 全主要ページに `Breadcrumbs` | 未実装 | Phase 2で共通化 |
| Design System | Tailwind utility、neutral基調、角丸なし、矩形UI | 独自CSS、巨大タイポ、丸カード、背景グラデ | Phase 1で補正 |
| Robots Index | パンくず、3フィルタ、status row、sort、3カラムカード | hero + 2カラムカードのみ | Phase 3で復元 |
| Robot Card | 画像枠、GENラベル、spec grid、View Details、favorite対応 | テキストカード + pillのみ | Phase 3で復元 |
| Robot Detail | 上部タブ、パンくず、画像slider、Technical Specs、Application Notes、Prev/Next | 導入判断表中心 | Phase 4で統合復元 |
| Compare | 左メーカーaccordion、中央comparison sheet、右Favorites、選択状態 | 静的比較表のみ | Phase 5で復元 |
| Dependencies | `lucide-react`, `react-slick`, `slick-carousel`, Tailwind | 未導入 | Phase 1で必要分追加 |
| Data Adapter | Figmaは `id/manufacturerId` | Nextは `slug/manufacturerSlug` | 各Phaseでadapter化 |
| URL | Figmaに `/posts`, `/industries` が残る | Nextは `/reports`, `/use-cases` | Next方針を維持 |

---

## 4. 実装原則

### 4-1. UI復元の原則

- Figma Make版の画面構造を先に戻す
- 文言と表示データはNext側のB2B導入判断モデルに合わせる
- 「よく似た別UI」を作らない
- 既存Nextの巨大hero/丸カードUIは、Figma UI復元対象ページでは使わない

### 4-2. データ維持の原則

- `data/types.ts` は基本的に維持
- `slug` をURL識別子として維持
- Figma UIが必要とする値は、型を壊さずに派生させる
- 表示用adapterは `lib/` またはコンポーネント内の小さな変換関数に閉じ込める

### 4-3. 変更安全性

- 1フェーズごとに `npm run build` を通す
- 1フェーズごとに対象URLをローカルUIで確認する
- 1フェーズごとに `git diff --stat` を確認する
- 旧Astro由来の `src/styles/global.css` は、明示的な移行対象にしない限り触らない
- ユーザー未コミット変更を巻き込まない

---

## 5. フェーズ分割

## Phase 0: Baseline固定と作業ブランチ

### 目的

現状を壊さず、復元作業を追跡可能にする。

### 実装内容

- 作業ブランチを切る
- 現在の未コミット変更を確認する
- `src/styles/global.css` は今回対象外として扱う
- 現在の `npm run build` 成功状態を確認する

### 確認方法

```bash
git status -sb
npm run build
```

### 合格条件

- buildが成功する
- 未コミットのユーザー変更を把握している
- 復元作業用ブランチにいる

### フェイルセーフ

- buildが失敗したら、復元実装に入らず原因を先に切り分ける
- unrelatedな未コミット変更がある場合はstageしない

---

## Phase 1: UI基盤と依存関係の復元

### 目的

Figma Make版のUIをNext.jsで再現できる状態にする。

### 実装内容

- 必要依存を追加する
  - `lucide-react`
  - `react-slick`
  - `slick-carousel`
  - Tailwind関連は採用方法を確認してから追加
- `src/app/globals.css` をFigma Make版のneutral/矩形UIに寄せる
- 既存の巨大hero、丸カード、背景グラデをrobots/compare系では使わない方針にする

### 確認方法

```bash
npm run build
```

ローカルで確認するURL：

- `/`
- `/robots`
- `/compare`

### 合格条件

- buildが成功する
- 依存追加でReact/Nextのバージョン衝突が起きていない
- グローバルCSS変更により全ページが崩壊していない

### フェイルセーフ

- Tailwind導入でNext 16/Turbopackが不安定になる場合、Tailwind完全導入ではなくCSS modules/グローバルCSSでFigma class相当を再現する
- `react-slick` がReact 19で問題を起こす場合、画像sliderはCSS/静的プレースホルダーで代替し、依存を入れない

---

## Phase 2: 共通Shell復元

### 目的

Header、Footer、BreadcrumbsをFigma Make版相当に戻す。

### 実装内容

- `components/Breadcrumbs.tsx` を追加
- `components/Header.tsx` をFigma構造へ戻す
  - brand: `Humanoid Robot Portal`
  - sub label: `for Japanese B2B`
  - active nav
  - `/posts` は `/reports` へ置換
- `components/Footer.tsx` を4カラムへ戻す
  - コンテンツ
  - ツール
  - 会社情報
  - 更新情報
  - copyright / disclaimer
- 主要ページへBreadcrumbsを戻す

### 確認方法

```bash
npm run build
```

UI確認：

- `/robots`
- `/manufacturers`
- `/compare`
- `/guides`
- `/use-cases`
- `/reports`

### 合格条件

- 各主要ページにパンくずが表示される
- Footerが4カラムで復元される
- Headerのactive stateが機能する
- `/reports` と `/use-cases` のURL方針を壊していない

### フェイルセーフ

- Header active判定で `usePathname` を使うため、Headerだけ `use client` にする
- Server Componentへclient hookを混ぜてbuildが落ちた場合は、Headerをclient componentとして分離する

---

## Phase 3: Robots一覧とRobotCard復元

### 目的

ロボット一覧をFigma Make版の一覧UIに戻す。

### 実装内容

- `RobotCard` をFigma構造へ戻す
  - 画像プレースホルダー
  - 右上ラベル
  - manufacturer
  - summary
  - spec grid
  - status / estimated cost
  - View Details row
  - favorite props
- `/robots` をFigma構造へ戻す
  - Breadcrumbs
  - page heading
  - 3フィルタ
  - active model / pre-release buttons
  - sort row
  - 3カラムカード

### データadapter方針

Figmaの仮スペックをそのまま使わない。

対応：

- `payload` は `robot.specs.payloadKg` から生成。なければ `要確認`
- `battery` は `runtimeMin` から生成。なければ `要確認`
- `status` は `deploymentStageLabels`
- `estCost` は `priceNote`
- `manufacturerName` は `getManufacturerForRobot`

### 確認方法

```bash
npm run build
```

UI確認：

- `/robots`
- `/robots/unitree-g1`
- `/compare`

### 合格条件

- `/robots` がFigma Make版と同じ情報密度に戻る
- 3カラムカードが表示される
- フィルタUIが表示される
- RobotCardがCompareでも再利用できる

### フェイルセーフ

- フィルタは最初は表示のみでもよいが、動かないUIを避けるなら最低限ローカル絞り込みを実装する
- データ不足項目はハードコードせず `要確認` と表示する
- RobotCardの変更で他ページが崩れた場合、list用/card用のvariantをpropsで分ける

---

## Phase 4: Robot詳細復元

### 目的

ロボット詳細をFigma Make版のプロダクト詳細ページ構成に戻す。

### 実装内容

- 上部section navを復元
  - Overview
  - Configurations
  - Technical Specifications
  - Installation
  - Applications
  - Resources
- Breadcrumbsを復元
- 画像sliderまたは画像プレースホルダー群を復元
- Technical Specifications panelを復元
- Application Notesを復元
- Previous / Next Modelを復元
- Next側の導入判断情報も消さず、Figma構造内に統合する

### 確認方法

```bash
npm run build
```

UI確認：

- `/robots/unitree-g1`
- `/robots/figure-02`

### 合格条件

- パンくずがある
- 上部タブ風navがある
- 画像領域がある
- Technical Specificationsがある
- B2B導入判断情報も残っている

### フェイルセーフ

- `react-slick` が失敗する場合は、slider依存を入れず静的な画像枠にする
- Figmaの産業ロボット仮値はそのまま使わず、データがない場合は `要確認` と出す

---

## Phase 5: Compare復元

### 目的

CompareをFigma Make版の3ペインUIに戻す。

### 実装内容

- `/compare/page.tsx` を `use client` componentへ分離
- 左サイドバー
  - Manufacturers accordion
  - manufacturerごとのrobots
  - selected state
- 中央
  - COMPARISON SHEET
  - empty state
  - selected robot cards
  - Clear All
- 右サイドバー
  - Favorites
  - favorite card
  - empty state
- `RobotCard` のfavorite propsを有効化
- 既存の静的比較表は削除せず、下部または別sectionへ移す

### 確認方法

```bash
npm run build
```

UI操作確認：

- `/compare`
- manufacturer accordionを開閉できる
- robotを追加できる
- robotを削除できる
- favoriteを追加/削除できる
- selectedが0件のempty stateが出る
- 9件制限が壊れていない

### 合格条件

- Figma Make版の3ペイン構造が戻る
- 状態管理が動く
- 右Favoritesが戻る
- buildが成功する

### フェイルセーフ

- URL query保存はこのPhaseでは必須にしない
- 状態管理が複雑化したら、まずlocal stateだけで復元する
- Server ComponentとClient Componentの境界で失敗したら、`CompareClient.tsx` に切り出す

---

## Phase 6: 他ページとの整合性確認

### 目的

Robots/Compare復元によって、他ページのUIや導線が崩れていないか確認する。

### 実装内容

- Manufacturers一覧/詳細のBreadcrumbs確認
- Guides一覧/詳細のBreadcrumbs確認
- Use Cases一覧/詳細のBreadcrumbs確認
- Reports一覧/詳細のBreadcrumbs確認
- FooterリンクのURL修正
- `/posts` と `/industries` が残っていないか確認

### 確認方法

```bash
npm run build
rg -n "/posts|/industries|react-router|useLocation|useParams" src components data lib
```

UI確認：

- `/`
- `/manufacturers`
- `/guides`
- `/use-cases`
- `/reports`
- `/about`
- `/contact`

### 合格条件

- 全主要ページが表示される
- 旧URLが残っていない
- Header/Footer/Breadcrumbsが一貫している
- buildが成功する

### フェイルセーフ

- 対象外ページまで大きく変えない
- 他ページで崩れたUIは、共通CSSではなく該当コンポーネント側で調整する

---

## Phase 7: 最終検証とpush

### 目的

復元作業を安全にGitHubへ反映する。

### 実装内容

- build確認
- diff確認
- 変更対象確認
- commit
- push

### 確認方法

```bash
npm run build
git status -sb
git diff --stat
git diff --check
```

### 合格条件

- build成功
- unrelated changesをcommitに含めていない
- `src/styles/global.css` の既存未コミット変更を誤って含めていない
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

以下の順で確認する。

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

### 6-4. 依存関係で詰まった時

- UI再現のためだけに重い依存を増やしすぎない
- `react-slick` が不安定ならCSSで代替する
- Tailwind導入が不安定なら、Figma構造をCSSで再現する
- 依存追加後は必ず `npm run build` を通す

### 6-5. Git安全ルール

- 1フェーズごとに必要ならcommitする
- unrelatedな既存変更をstageしない
- `git reset --hard` は使わない
- 直前フェーズだけ戻せる粒度で作業する

---

## 7. 実装前チェックリスト

- [ ] 作業ブランチを切った
- [ ] `npm run build` が通る
- [ ] Figma Make版の対象ファイルを確認した
- [ ] `src/styles/global.css` の未コミット変更を触らない方針を確認した
- [ ] `/posts` は `/reports` に置換する方針を確認した
- [ ] `/industries` は `/use-cases` に置換する方針を確認した
- [ ] `id` は `slug` に置換する方針を確認した

---

## 8. 最終受け入れ条件

- [ ] HeaderがFigma Make版相当の情報量に戻っている
- [ ] Footerが4カラムに戻っている
- [ ] Breadcrumbsが主要ページに戻っている
- [ ] `/robots` がFigma Make版相当の一覧UIに戻っている
- [ ] RobotCardがFigma Make版相当の情報密度に戻っている
- [ ] `/robots/[slug]` がFigma Make版相当の詳細UIに戻っている
- [ ] `/compare` が3ペインUIに戻っている
- [ ] Compareで選択/削除/favoriteが動く
- [ ] `npm run build` が成功する
- [ ] `/posts` と `/industries` がNext実装に残っていない
- [ ] unrelated changesをcommitしていない

---

## 9. 次に実行するフェーズ

次は Phase 0 から実行する。

Phase 0 完了後、Phase 1 に進む前に以下を確認する。

- buildが通っているか
- 作業ブランチが切られているか
- 未コミット変更の扱いが明確か
