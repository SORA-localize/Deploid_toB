# home-mobile-ui 実装計画 v1

Branch: `fix/home-mobile-ui`
Last updated: 2026-06-15

---

## 目的

以下の5つのモバイルUIと2つのデッドコード削除を実施する。

1. home hero のサブコピー・メーカー情報カードをモバイルで非表示
2. HomeContentNavigator のモバイルレイアウトを3カラム横並びに変更
3. 注目ロボット（FeaturedRobotsGrid）を Compare ページ風カード UI に変更
4. ManufacturerCard の dead code（compact variant）を削除
5. CompareClient の設計外 order 切り替えを削除

---

## 監査済みスコープ（実装する変更）

| # | 変更内容 | ファイル | 理由 |
|---|---|---|---|
| 1 | hero サブコピーをモバイルで非表示（h1・CTA は残す） | `components/ManufacturerMapStage.tsx` | ユーザー指示 |
| 2 | hero メーカー情報カードをモバイルで非表示 | `components/ManufacturerMapStage.tsx` | ユーザー指示 |
| 3 | HomeContentNavigator モバイルを3カラム横並びに変更 | `components/HomeContentNavigator.tsx` | ユーザー指示 |
| 4 | FeaturedRobotCard を新規作成（矩形・aspect 切り替え・Link 遷移） | `components/FeaturedRobotCard.tsx`（新規） | ユーザー指示 |
| 5 | FeaturedRobotsGrid で FeaturedRobotCard を使用 | `components/FeaturedRobotsGrid.tsx` | ユーザー指示 |
| 6 | ManufacturerCard の compact variant を削除 | `components/ManufacturerCard.tsx` | dead code |
| 7 | CompareClient の order 切り替えを削除 | `components/CompareClient.tsx` | 設計合意なし |

**スコープ外（監査で除外した変更）**:
- `src/app/page.tsx` のガイドセクション `border border-border bg-card` を `.card-data` に変更 → カード全体がリンクでないため `.card-data:hover` が誤認を招く。別途検討。

---

## 監査で発見した問題と対応

### 問題0a（修正必須）: HomeContentNavigator — デュアル DOM でリンク重複（アクセシビリティ）
モバイル用 `div.lg:hidden` と PC 用 `div.hidden.lg:grid` を両方 DOM に残すと、スクリーンリーダーは同じ `href` の `<Link>` を2回読む。`display:none` はスクリーンリーダーからも隠れるため `hidden` CSS のみで問題は解消されるが、これを明示的に計画に記録する。

**対応**: CSS `hidden` / `lg:hidden` は `display:none` であり、スクリーンリーダーも読まない（VoiceOver/NVDA の仕様）。追加の `aria-hidden` は不要。ただし手動確認チェックリストに「スクリーンリーダーでリンクが重複して読まれないこと」を追加する。

### 問題0b（修正必須）: FeaturedRobotCard — グラデーション使用が CLAUDE.md グラデ禁止に抵触
CLAUDE.md デザイン方針:「グラデ禁止（例外はヒーロー帯と世界地図のみ）」。FeaturedRobotCard は home の業務 UI であり例外カテゴリに該当しない。

**判断**: `ComparisonRobotPanel` が使っているグラデーションは2種類:
1. `bg-gradient-to-b from-black/60 to-transparent`（上部ヘッダーエリアのテキスト可読性確保）
2. `bg-gradient-to-t from-black/60 to-transparent`（ホバー時下部のテキスト可読性確保）

これらは装飾グラデーション（色相を出す演出）ではなく、**暗色画像上のテキストを白で読ませるための可読性オーバーレイ**（opacity/透明から黒への単色フェード）であり、CLAUDE.md が禁止する「紫〜青のグラデ・ヒーロー」とは用途が異なる。

**結論**: 可読性オーバーレイとして許容する。ただし実装では `from-black/60` 等の単色フェードのみを使い、有彩色グラデーション（`from-purple-500 to-blue-500` 等）は使わない。この判断を計画書に明記する。

### 問題0c（確認推奨）: robot.heroImage フィールドの型確認
`data/types.ts` 確認済み（line 96）:
```ts
heroImage?: ImageAsset;  // BaseRecord に存在
images?: Partial<Record<ImageRole, ImageAsset>>;  // Robot 型に存在（line 226）
```
フォールバック順 `robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage` は型安全。`ImageRole` に `transparent` と `hero` が存在するかは `lib/specSchema.ts` / `data/types.ts` の `ImageRole` 型で確認済みとする（ComparisonRobotPanel が同じフォールバックを使用しており動作実績あり）。

### 問題1: FeaturedRobotCard — DRY 違反の可能性
ComparisonRobotPanel のビジュアルをそのままコピーすると実装が2箇所に分散する。設計書の「3箇所以上で共通化」ルールに従い、今は home 用途に特化した独立実装とする。コメントで「Compare UI と類似」と記録し、将来3箇所目が出た時点で共通化を検討。

### 問題2: rounded-lg — カタログカードの設計原則との矛盾
`design_system_v1.md §4` の角丸ルール:
- カタログ・業務系（ロボット含む）: `.card-data` = 角丸なし（矩形）
- hero/featured カルーセル: `rounded-xl`

FeaturedRobotCard はロボットカードなので `rounded-lg` なし（矩形）で実装する。ComparisonRobotPanel 自体の `rounded-lg` は今回スコープ外とし、別 issue として記録する。

### 問題3: aspect-[5/7] — モバイル1列時の高さ
モバイル1列（360px幅）で `aspect-[5/7]` が全幅に展開されると高さ ≈ 504px になり画面の大半を占める。対応: モバイルでは `aspect-[4/3]`（横長）、`md:aspect-[5/7]`（縦長）に切り替える。

### 問題4: HomeContentNavigator — タブレット幅の確認
lg=1024px 未満すべてで3カラムになる（タブレット 768-1024px 含む）。各列幅は sm（640px）時 ≈ 213px、768px 時 ≈ 256px、lg 直前（1023px）時 ≈ 341px。手動確認チェックリストに 768px での確認を追加。崩れる場合は `text-xs` 縮小か `item.title` のみ表示（3文字）にフォールバック。

### 問題5: hero の hidden — CTA ボタンへの影響なし
メーカー情報カード（`active && ar && ...`）と CTA ボタン（「導入ガイドを読む」「ロボット一覧」）は別要素。メーカー情報カードだけ `hidden sm:block` にしても CTA は残る。意図通り。

### 問題6: アクションテキスト — 既存プロパティの再利用
`items` 配列の `item.action`（「ロボットを見る」等）をそのまま再利用する。重複定義しない。3カラムでテキストが折れる場合は実装中に `text-xs` で対応。

### 問題7: card-data 化 — スコープ外とした理由
home の「注目の導入ガイド」カードは全体がリンクではなく内部の「続きを読む」だけがリンク。`.card-data:hover` を付けると「カード全体がクリックできる」誤認を招くため変更しない。

### 問題8: FeaturedRobotCard — 画像なし状態の扱い
ロボットに `transparent` / `hero` / `heroImage` すべて存在しない場合のプレースホルダーを実装に含める。`uiText.robots.mainImageMissing` を使用する（ComparisonRobotPanel と同じ）。

### 問題9: compact variant 削除の前提確認
削除前に `grep -rn "ManufacturerCard" components/ src/` で呼び出し元を全列挙する。現状確認済み: `ManufacturersBrowser.tsx` のみ（`variant` プロップなし）。

### 問題10: CompareClient order 切り替え
前回の `fix/mobile-ui` で追加。「ロボットが未選択のうちはメニューを先に見せたい」という意図だったが、ロボットを追加するたびに画面上のレイアウト順がメニュー→シート→メニュー→シートと入れ替わり、ユーザーが見ているものが突然上下に移動する。Compare ページはモバイルで上からシート（選択済み比較）→メニュー（追加候補）の固定縦積みで十分機能する。将来この並びを変えたい場合は設計書に明示して再実装する。

---

## 実装仕様

### 1 & 2: ManufacturerMapStage.tsx

```tsx
{/* サブコピー: モバイルで非表示（sm以上で表示） */}
<div className="hidden sm:block max-w-xl text-sm leading-relaxed text-neutral-300 md:text-base">
  {subcopyLines.map(...)}
</div>

{/* メーカー情報カード: モバイルで非表示（sm以上で表示） */}
{active && ar && (
  <div className="hidden sm:block pointer-events-none absolute inset-x-0 bottom-24 lg:bottom-0">
    ...
  </div>
)}
```

変えない:
- `GLOBAL HUMANOID. PORTAL` ラベル
- h1 見出し（日本語）
- CTA ボタン（「導入ガイドを読む」「ロボット一覧」）

### 3: HomeContentNavigator.tsx

モバイル（lg未満）と PC（lg以上）で別レイアウトを出す。

```tsx
{/* モバイル: 3カラム横並び（lg未満のみ表示） */}
<div className="flex flex-row divide-x divide-border border-y border-border lg:hidden">
  {items.map((item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.key}
        href={item.href}
        className="flex flex-1 flex-col items-center gap-2 px-2 py-5 text-center
                   transition-colors hover:bg-muted/70"
      >
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-medium text-foreground">{item.title}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          {item.action}
          <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    );
  })}
</div>

{/* PC: 縦リスト + 右画像パネル（lg以上のみ表示） */}
<div className="hidden lg:grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:items-stretch">
  {/* 既存の縦リストと画像パネルをそのまま */}
</div>
```

### 4: FeaturedRobotCard.tsx（新規）

- Compare ページのカード UI に視覚的に類似（blur 背景・前景画像）
- オーバーレイは単色透明フェード（`from-black/60 to-transparent`）のみ。有彩色グラデーション禁止（問題0b 参照）
- 角丸なし（矩形。`.card-data` 原則に従う）
- `aspect-[4/3] md:aspect-[5/7]` でモバイル横長・PC 縦長
- Dialog なし。カード全体が `<Link href=/robots/${robot.slug}>` で詳細ページへ遷移
- 画像なし時は `uiText.robots.mainImageMissing` プレースホルダー
- お気に入り・削除・ドラッグハンドルなし（home 表示専用）
- 画像取得: `robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage` の順でフォールバック

### 5: FeaturedRobotsGrid.tsx

`RobotCard` を `FeaturedRobotCard` に差し替えるのみ。グリッド構成・タイトル・「すべて見る」リンクは変えない。

### 6: ManufacturerCard.tsx

```tsx
// 削除するもの
type CardVariant = 'compact' | 'default';  // 型定義削除
variant?: CardVariant;                      // prop削除
const optionalRowClass = variant === 'compact' ? 'hidden' : 'hidden sm:flex';  // 削除

// 変更後
const optionalRowClass = 'hidden sm:flex';  // 定数に
```

### 7: CompareClient.tsx

```tsx
// 削除するもの（2箇所）
`min-w-0 md:order-none ${selectedRobots.length === 0 ? 'order-1' : 'order-2'}`
`min-w-0 md:order-none md:row-span-2 xl:row-span-1 ${selectedRobots.length === 0 ? 'order-2' : 'order-1'}`

// 変更後（それぞれ）
'min-w-0'
'min-w-0 md:row-span-2 xl:row-span-1'
```

---

## 実装順序（リスク低い順）

1. ManufacturerCard compact variant 削除（単純・影響範囲1ファイル）
2. CompareClient order 切り替え削除（単純・影響範囲1ファイル）
3. ManufacturerMapStage 非表示追加（単純・影響範囲1ファイル）
4. HomeContentNavigator モバイルレイアウト追加（新規レイアウト・既存構造保持）
5. FeaturedRobotCard 新規作成
6. FeaturedRobotsGrid 差し替え
7. `npm run validate:data && npm run build`

---

## 影響範囲

| ファイル | 影響するページ |
|---|---|
| `ManufacturerMapStage.tsx` | `/`（home hero のみ） |
| `HomeContentNavigator.tsx` | `/`（home のみ） |
| `FeaturedRobotCard.tsx`（新規） | `/`（home のみ） |
| `FeaturedRobotsGrid.tsx` | `/`（home のみ） |
| `ManufacturerCard.tsx` | `/manufacturers`（ManufacturersBrowser 経由） |
| `CompareClient.tsx` | `/compare` |

---

## 検証コマンド

```bash
npm run validate:data && npm run build
```

---

## 手動確認チェックリスト

### ManufacturerMapStage
- [ ] 360px幅: サブコピー非表示、h1 見出し表示、CTA ボタン表示
- [ ] 640px（sm）以上: サブコピー復活
- [ ] 640px（sm）以上: マップ上でメーカーにホバーするとメーカー情報カード表示

### HomeContentNavigator
- [ ] 360px幅: 3カラム横並び表示（ロボット|メーカー|ガイド）
- [ ] 360px幅: アクションテキストと ArrowRight アイコンが各カラムに表示
- [ ] 768px: 3カラムが崩れていない（各列幅 ≈ 256px）
- [ ] 1024px（lg）以上: 縦リスト + 右画像パネルに切り替わる
- [ ] lg以上: 既存のホバーアニメーション（画像切り替え）が動く
- [ ] スクリーンリーダー: モバイル/PC それぞれで同じリンクが1回だけ読まれること（デュアルDOM の hidden が正しく機能していること）

### FeaturedRobotCard
- [ ] モバイル: `aspect-[4/3]`（横長）で表示
- [ ] md 以上: `aspect-[5/7]`（縦長）で表示
- [ ] 画像ありロボット: blur 背景 + 前景画像が表示
- [ ] 画像なしロボット: プレースホルダーテキストが表示（崩れない）
- [ ] クリック: `/robots/${slug}` に遷移する
- [ ] 角丸なし（矩形）であること

### ManufacturerCard
- [ ] `/manufacturers` で一覧が表示される（レイアウト崩れなし）
- [ ] sm 以上で「代表ロボット」「国内代理店」行が表示される

### CompareClient
- [ ] `/compare` でモバイル表示: メニュー（左）→ シート（右）の縦積み固定
- [ ] 選択前後でレイアウト順が入れ替わらないこと

---

## 残るリスク

- `HomeContentNavigator` の `item.action` テキストが3カラム幅で折れる場合、実装中に `text-[11px]` 縮小または `item.title` のみ表示に切り替える
- `FeaturedRobotCard` の画像なし状態のプレースホルダー見栄えは実装後の目視確認が必要
- `ComparisonRobotPanel` の `rounded-lg` は設計原則との矛盾として今回スコープ外。別途記録
