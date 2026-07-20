# Deploid デザインシステム v1

Last reviewed: 2026-05-29

> この文書は、Deploid の見た目・UI部品・レイアウト・操作感を揃えるためのデザインシステムである。実装構造や開発手順は `ui_architecture_and_development_policy_v1.md` に分ける。

---

## 1. デザイン原則

Deploid は、ヒューマノイド導入を検討する事業者向けの buyer intelligence / reference portal である。

優先する体験：

1. 比較しやすい。
2. 出典と未確認事項が分かる。
3. 画像がなくても判断材料が残る。
4. 一覧から詳細、詳細から関連情報へ迷わず移動できる。
5. 毎回使う業務ツールとして静かで読みやすい。

避ける体験：

- マーケティングLP風の大きすぎるhero。
- 装飾的なグラデーションやイラスト中心の画面。
- 画像がないと成立しないカード。
- 角丸・影・装飾で情報密度を落とすUI。
- メーカー公式サイトのように見える表現。

---

## 2. ビジュアルトーン

キーワード：

- neutral
- rectangular
- dense but calm
- research archive
- procurement intelligence
- source-aware

> **更新 2026-06-03（実装と同期）**：色は Tailwind の素の `neutral-*` から **Radix Colors ベースの semantic token** に移行済み。真実源は `src/app/globals.css`（`--background`/`--foreground`/`--border`/`--primary` …）と `lib/visualSemantics.ts`（tone → class 変換）。以下および §3 の `neutral-*` / `green-*` 等の直値は**歴史的記述**で、現行コードは下記 token を使う。neutral基調＋アクセント1色という方針自体は不変。
>
> - 中立スケール = Radix **slate**（`--background`=slate-1, `--foreground`=slate-12, `--border`=slate-6, `--muted-foreground`=slate-11）
> - アクセント1色 = Radix **jade**（`--primary`/`--brand`=jade-9, `--ring`=jade-8）
> - semantic tone（`lib/visualSemantics.ts`）: `neutral`/`brand`/`info`(blue)/`success`(grass)/`warning`(amber)/`danger`(ruby)/`unknown`/`favorite`(yellow)。`tone-*-bg` / `tone-*-border` / `tone-*-text` として適用。
> - ダークモードは `next-themes` + Radix `*-dark` スケールで対応。
> - 角丸は token 化（`--radius`）。原則は最小限・矩形基調を維持。
> - **例外カテゴリ（意図的）**：トップのヒーロー帯とメーカー世界地図は、token に依らず黒背景・白文字の直書きを許容する。演出上の例外であり、一覧・比較・詳細などの業務UIには持ち込まない。

現在の実装方針（neutral基調・矩形・低装飾）：

- 背景・テキスト・枠線・CTAは上記 semantic token を使う（旧 `neutral-*` 直値は使わない）
- 成功・警告・情報・危険は `lib/visualSemantics.ts` の tone 経由で限定使用
- 角丸は最小限、影は原則なし

---

## 3. トークン

### Color

| 用途 | Tailwind |
|---|---|
| Page background | `bg-neutral-50`, `bg-neutral-100`, `bg-white` |
| Primary text | `text-neutral-900` |
| Body text | `text-neutral-700`, `text-neutral-600` |
| Muted text | `text-neutral-500`, `text-neutral-400` |
| Border strong | `border-neutral-300` |
| Border subtle | `border-neutral-200` |
| Primary action | `bg-neutral-900 text-white` |
| Primary action hover | `hover:bg-neutral-700` |
| Success | `green-50`, `green-700`, `green-800` |
| Warning | `amber-50`, `amber-700`, `amber-900` |
| Info | `blue-50`, `blue-700`, `blue-800` |

> **更新 2026-06-03**：上の表は歴史的記述。現行は `src/app/globals.css` の semantic token（Radix slate/jade ベース）と `lib/visualSemantics.ts` の tone を真実源とする。新しい色や用途を足す場合は、まず `globals.css` の token か `visualSemantics.ts` の tone を増やし、必要なら本表も更新する（個別ページに色を直書きしない）。

### Typography

| 用途 | 推奨class |
|---|---|
| Page title | `text-2xl font-semibold text-neutral-900` |
| Detail title | `text-3xl font-semibold text-neutral-900 leading-tight` |
| Home hero title | `text-4xl font-semibold text-neutral-900` |
| Section title | `text-2xl font-semibold text-neutral-900` |
| Panel title | `text-sm font-semibold text-neutral-900 uppercase tracking-wider` |
| Card title | `font-semibold text-neutral-900` |
| Body | `text-sm text-neutral-700 leading-relaxed` |
| Muted body | `text-sm text-neutral-600 leading-relaxed` |
| Metadata | `text-xs text-neutral-500` |
| Button text | `text-sm` or `text-xs uppercase tracking-wide` |

ルール：

- viewport幅に応じてfont-sizeを変えない。
- letter spacingは原則0。uppercaseの補助ラベルだけ `tracking-wide` / `tracking-wider` を許可する。
- 日本語本文は `leading-relaxed` を基本にする。

### Spacing

| 用途 | 推奨 |
|---|---|
| Page outer | `mx-auto max-w-7xl px-6 py-12` |
| Header band inner | `mx-auto max-w-7xl px-6 py-8` |
| Section vertical | `py-12` or `py-16` |
| Card padding | `p-4`, `p-6`, `p-8` |
| Compact panel padding | `p-3`, `p-4` |
| Grid gap | `gap-4`, `gap-6` |
| Form gap | `space-y-5` |

ルール：

- ページセクションは全幅bandまたは余白で区切る。
- カードの中にカードを入れない。
- 詳細ページの本文セクション、Fact Sheet、調達メモ、出典欄はカード面にしない。`border border-border bg-card` / `bg-muted` の矩形背景を本文ブロックへ貼らず、見出し・余白・罫線行で構造を出す。
- 既存コンポーネントのスタイルを流用する前に、このルールとの整合を確認する。過去にコンポーネントのデフォルト（旧SourceList・旧DefinitionList judgmentバリアント）が矩形背景を焼き込んでいて、新実装がそれをコピーして違反が再生産された。呼び出し側が全てclassNameを上書きしているデフォルトは違反の温床なので、見つけたらデフォルト自体を直す。
- コンパクトな管理UIではhero級の余白を使わない。

### Radius / Shadow

- Shadow: 原則なし。
- 例外: 比較削除ボタンのような小さな浮遊操作だけ、既存の `rounded-full` は許容。

**カードの角丸・hover ルール（コンテンツ種別で使い分け）**

| 種別 | クラス | rounded | hover border |
|---|---|---|---|
| カタログ・業務系（ロボット・メーカー・ユースケース） | `.card-data` | なし（矩形） | `border-ring`（jade） |
| 記事・メディア系 | `.card-editorial` | `rounded-lg` | `border-foreground/30` |
| hero/featured カルーセル（NewsFeatureCard, NewsHeroCarousel） | — | `rounded-xl` | `border-foreground/30` |
| 小 UI パーツ（タグ・ラベル） | — | `rounded-sm` | — |
| floating ボタン | — | `rounded-full` | — |

- 実装: `src/app/globals.css @layer components` の `.card-data` / `.card-editorial` を使う。
- **更新 2026-06-21**：マウス追従の3Dチルト＋グロー＋シマー＋ホバー下線という演出は、`RobotCard`専用ではなく`lib/useTiltCardEffect.ts`の共通フックとして切り出し、`RobotCard`/`ManufacturerCard`/`UseCaseCard`の一覧カード全種で共有する。新しいカード種別を増やす場合もこのフックを使い、演出ロジックを複製しない。

**画像・ロゴが無いときのプレースホルダー（更新 2026-06-21）**

権利確認が取れず画像を出せないレコードは、`CameraOff`アイコン＋短い1行ラベル（`text-xs text-muted-foreground`程度）だけに留める。英語・日本語の2行ラベルや`uppercase tracking-widest`のような強調装飾は使わない。一覧で同じプレースホルダーが多数並ぶ場合、ラベルが目立つほど「壊れている」ように見えるため、控えめさを優先する（`components/ManufacturerLogoName.tsx`の小アイコン＋テキストの扱いを基準にする）。

**カード内タイポグラフィのコントラスト（更新 2026-06-21）**

一覧カードはタイトルとメタデータ（スペック行・タグ等）の差を意図的につける。タイトルは周囲より一段大きく・太く（`text-base`〜`text-lg font-semibold`程度）、スペック値・補足情報は一段小さく・`text-muted-foreground`寄りにする（`text-[11px]`程度まで落としてよい）。すべてを同じ大きさで並べない。

---

## 4. Layout

### Page Shell

全ページ：

- `RootLayout`
- `Header`
- `main.flex-1`
- `Footer`

通常ページ：

```tsx
<div className="mx-auto max-w-7xl px-6 py-12">
  ...
</div>
```

Compareのような横幅が必要な画面：

```tsx
<div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 sm:py-12">
  ...
</div>
```

### Listing Page

基本構成：

1. Breadcrumbs
2. Title + summary
3. Search
4. Filters
5. Result count / mode chips
6. Grid or list
7. EmptyState

### Detail Page

基本構成：

1. Header band
2. Metadata row
3. Primary content grid
4. Main sections
5. Sticky aside on desktop
6. Sources
7. Related links/cards

---

## 5. Components

### Breadcrumbs

用途：

- 現在位置の明示。
- detail page / browser page の上部に置く。

ルール：

- HOMEはuppercase。
- 最終要素はlinkにしない。
- 長すぎるlabelはページ側で短くする。

### Cards

基本：

```tsx
className="border border-neutral-300 bg-white p-6"
```

または一覧カード：

```tsx
className="border border-neutral-300 bg-neutral-50 overflow-hidden hover:border-neutral-500 transition-colors"
```

ルール：

- 影を使わない。
- 角丸を増やさない。
- hoverはborderかbackgroundだけで表現する。
- カード全体が遷移する場合は `Link` を使う。
- カード内操作がある場合は、buttonのevent処理に注意する。

### RobotCard

役割：

- ロボット比較・一覧の中核部品。
- 画像、機種名、メーカー、4つの主要fact、詳細導線を持つ。

ルール：

- desktopの画像枠は `aspect-[7/6]`。
- 画像は `object-contain`。
- 画像が表示不可でも成立させる。プレースホルダーは`CameraOff`アイコン＋1行ラベルのみ（§3「画像・ロゴが無いときのプレースホルダー」参照。2行・強調装飾は使わない）。
- desktopのfactは `用途 / サイズ / 価格 / 稼働時間` の2列×2行で固定し、ラベル・値とも左揃えにする。
- 用途は公式根拠付きで既存UseCaseへ接続できるものだけを使い、複数時は代表1件 + `ほかN件` とする。
- 価格はメーカー公開価格、国内正規代理店公開価格、問い合わせの順で解決し、推測価格を表示しない。
- 「国内」「段階」「可搬」、概要文、固定 `min-height` はdesktopカードへ追加しない。
- specは捏造しない。未確認は `TBD_LABEL`。
- ホバー時のチルト/グロー/シマー演出は`lib/useTiltCardEffect.ts`を使う（他カード種別と共通）。
- favoriteは任意機能としてpropsで渡す。

### FactList / CardFactGrid / ComparisonSpecList

- `FactList` は詳細・sidebarの短いラベル–値情報に使う。`dl/dt/dd`、行罫線、折返しを共通化し、ラベル・値とも左揃えにする。
- `FactList` の `compact` はラベル7rem、`standard` は8rem。mobileでは1列へ積む。
- `CardFactGrid` はカード内専用の2列×2行。ラベル上・値下、値は最大2行とし、項目数をカードごとに増やさない。
- `ComparisonSpecList` は比較面専用。数値だけを右揃え + `tabular-nums` にし、状態名・文章・欠損値は左揃えにする。文字列の見た目から数値判定せず、view modelの `valueKind` を使う。
- 長文説明、記事本文、FAQ、真の多列表をこれらへ押し込まない。

### RobotCardRail

- 子カードは `FeaturedRobotCard` に固定し、見出し・データ取得・表示件数は親が持つ。
- card widthはmobile 44%、`sm` 30%、`md` 以上12rem。
- gapは0.75rem、`sm` 以上1rem。
- `overflow-x-auto`、`overscroll-x-contain`、`snap-x snap-mandatory` を使い、子は `shrink-0 snap-start` とする。
- Home、記事、メーカー解説、ロボット詳細の関連ロボットで同じレールを使う。

### Image Carousel

役割：

- robot detailの表示可能な実画像を順に表示する。

ルール：

- 画像枠は幅100%、高さ280px、`sm` 360px、`md` 以上420pxで固定する。画像ごとに外寸を変えない。
- 表示可能画像が0枚なら、単一placeholderを表示する。
- 1枚なら静止表示とし、dot、prev/next、drag cursorを表示しない。
- 2枚以上なら表示可能な実画像だけをカルーセルへ入れる。未投入roleをslide化しない。
- role labelを表示する。
- credit/sourceを表示する。
- dotには現在位置が分かるaccessible nameと `aria-current` を付ける。

### Robot detail spec explorer

- desktopは上部に横並びタブ、下に表示パネルを置く。タブの選択状態は各ボタン自身の `border-b-2`（activeは `border-foreground`、非activeは `border-transparent`）だけで表す。タブ行を包む共有の`border-b`は持たない（タブが並ぶ幅より右側の余白にまで線が伸びる「宙に浮いた区切り線」を避けるため）。
- 表示パネルは固定pxを持たない。4パネルを同じグリッドセル（`grid` + 各パネル `col-start-1 row-start-1`）に重ね、非表示パネルは `display:none` にせず `invisible`（`visibility:hidden`）で残すことで、グリッドのトラック高さがその機体の4グループ中もっとも背の高いパネルへ自動で決まる。タブ切替でレイアウトが跳ねない特性は維持しつつ、機体ごとの実コンテンツ量に高さを合わせ、内容が少ない機体で下のセクション（想定用途等）との間に大きな空白を残さない。
- 各パネルに `max-h-[440px]` + `overflow-y-auto` を安全弁として設定する（1グループ最大6行・値2行以内という制約の想定最大値+バッファ）。想定外に長い公式値が来た場合だけこの上限でスクロールし、通常時は上限に達しない。
- パネルの上下パディングは `pt-6` のみ（タブ行と最初の行の間の余白）。下側パディングは持たない。これを包む `<section>` 側が `py-*` で次セクションとの間隔を管理しており、パネル自身が `pb` を重ねると二重に空くため。ページ内の他セクション（想定用途・活用事例等）もこの原則（内側コンポーネントは外側 `<section>` の余白と重複するpaddingを持たない）に従う。
- タブは `本体・可動 / 電源・稼働 / 操作・開発 / 環境・安全` の4項目。tablistは `overflow-x-auto` で狭幅時の横スクロールを許可する。
- 1グループ最大6行、値は原則2行以内。公開値がない行は省き、空グループでは `公開情報なし` を1回だけ表示する（この1行にも罫線は付けない）。
- `FactList`の行区切り線は最終行に付けない（`rowClassName="last:border-b-0"`）。`FactList.tsx`本体は他ページ（メーカー詳細・サイドバー等）と共用のため既定値は変えず、呼び出し側で上書きする。
- 非active パネルは `aria-hidden="true"` + `tabIndex={-1}` + `pointer-events-none` で読み上げ・操作対象から外す（`visibility:hidden` はスクリーンリーダーからも自動的に除外されるが明示する）。
- hover、focus、clickで選択し、Left/Right/Home/Endを使えるtab semantics（`role=tab` / `aria-selected` / roving tabindex）を持つ。PageTabBarはページナビ（`aria-current`）でtab semanticsを持たないため流用しない。見た目だけ揃える。
- パネル内にグループ名の見出しは重複表示しない（選択中タブがパネル直上にあるため）。tabpanelのaccessible nameは `aria-labelledby` でタブを指す。
- mobileは同じview modelを縦積みFactListで表示し、hover専用UIを作らない。

### Tags

`TagChip` を使う。

tones：

- `neutral`: 通常タグ
- `success`: production-ready等
- `warning`: requires-poc等
- `info`: initial-adoption等

ルール：

- tagの表示名は `getTagLabel`。
- tagの検索/一致は `lib/tags.ts`。
- ページごとにtag表示を直書きしない。

### Filters

使い分け：

- 詳細ファセット（選択肢が多い/enum）: `SelectControl`（内部は Radix Select。多選択肢は `searchable` で SearchableDropdown）
- 主題・粗い軸（タブ）: `PageTabBar`（記事の section、ロボットの release 等）
- 少数カテゴリのトグル: `FilterChipGroup`
- 自由検索: `SearchInput`

ルール：

- searchはページ内filterとして扱う（記事は MiniSearch=`lib/searchIndex.ts`、他は `lib/search.ts` の部分一致）。
- URL共有するfilterは `useUrlParamUpdater` でURLに同期する（旧 `useUrlFilters` は廃止）。
- **主軸タブ（PageTabBar）は軸を固定する**。記事の `section` のような主分類は、検索・ファセット条件に応じて件数を表示してよいが、タブ自体は非表示にしない。0件の非アクティブタブは disabled 表示にし、active タブと「すべて」は選択可能なまま残す。
- **ファセット（SelectControl）は設定駆動の `FacetFilterBar`＋`lib/facetConfig.ts` で組む**。選択肢は他の選択で絞った部分集合から件数つきで導出し（`ラベル (件数)`）、0件は `disabled` で無効化して行き止まりを防ぐ。**他ファセットは自動リセットしない**（選択は保持）。
- ドロップダウンのパネル幅はトリガー幅に固定する（内容で伸ばさない）。Select と SearchableDropdown の閉じた見た目を揃える。
- chip buttonは `aria-pressed`。
- **選択中インジケーター（ActiveFilterChips）はプレーンテキスト**。border/background/shadow を付けない。`text-muted-foreground hover:text-foreground` のみ。TagChip とは別物。

### 記事本文内リスト（メーカー解説）

メーカー解説（`ManufacturerGuideArticleBody`）の本文内リストは、上記「本文ブロックに矩形背景を貼らない」に従い、罫線（`divide-y divide-border`）のみで区切る。

**導入実績リスト（DeploymentList）**

- ステータス文言（「導入確認」「あり/限定的」等）は表示しない。何が確認できたかは本文が直接語る
- 各分類に内容を示すlucideアイコンを付ける：研究・教育=`GraduationCap`／展示・デモ=`Presentation`／PoC=`FlaskConical`／社内実証=`Factory`／商用導入=`Briefcase`
- 確認状態は `evidence` からモノクロの濃淡で表す。新しい色（緑等）は持ち込まない：
  - `confirmed`：分類名の横に `Check`（`text-foreground`）
  - `limited`：通常表示（マークなし）
  - `none`：アイコン `text-muted-foreground/40`、分類名・本文 `text-muted-foreground` でグレーアウト
- 行の根拠は本文下に `参照: 媒体名リンク`（`text-xs text-muted-foreground`、複数は ` / ` 区切り）

**調達チャネルリスト（ProcurementChannelList）**

- kind別（公式販売／国内代理店／導入支援・相談）にkicker見出し＋罫線リスト。囲い枠なし
- 各行は名前リンク＋役割一言の2カラム（`sm:grid-cols-[14rem_1fr]`）
- Deploidの問い合わせ窓口は導入支援・相談グループの末尾にコード側で固定追加する（記事データに持たせない）

**関連メーカー（記事ページ）**

- 名前リンクのみ。紹介文（`manufacturer.summary`）は表示しない。将来はワードロゴ・シンボルロゴの列挙に置き換える方針

### Forms

ルール：

- input/select/textareaはlabel必須。
- requiredはUIにも表示。
- disabled/loading状態を持つ。
- 外部サービスIDはenv。
- form未設定時もページが壊れない。

---

## 6. Media

画像・ロゴは必ず権利gateを通す。

実装：

- `getDisplayableAsset(asset)`
- `canDisplayAsset(asset)`

表示：

- ロボット画像: `object-contain`
- ロゴ: 装飾扱いなら `alt="" aria-hidden="true"`
- 画像なし: placeholderを表示

商用公開：

- `commercial-strict` 相当を使う。
- `reference-attributed` は公開商用サイトでは使わない。

---

## 7. Icons

使用ライブラリ：

- `lucide-react`

ルール：

- 既存にあるアイコンはlucideを使う。
- 手描きSVGは原則使わない。
- icon buttonは `aria-label`。
- 装飾iconは `aria-hidden`。

---

## 8. Responsive

標準グリッド：

```tsx
className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
```

カードグリッド（ロボット・記事など `.card-data` 系の一覧）は、画面が広いときさらに列を増やす：

```tsx
className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
```

一覧ページ（`/robots`・`/reports`）だけでなく、詳細ページに埋め込む小さな一覧（例: メーカー詳細ページ内の取扱ロボット・関連記事グリッド）も同じ列数に揃える。`lg:grid-cols-3` で止めると、同じ `site-container` 内で一覧ページより列が少なくなり、カードが不自然に大きく見える。

カード外形を揃えたい一覧では、行高も親グリッドで揃える：

```tsx
className="grid auto-rows-fr grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
```

カードとグリッドの責務：

- カードは `h-full`、必要最小限の `min-h-*`、`line-clamp-*` で内容差による崩れを抑える。
- カードは配置場所依存の幅を持たない。`w-[78%]`、`sm:w-[42%]`、`basis-*` などは親グリッド/親レール側でだけ扱う。
- 親グリッドが列数、幅、gap、行高、表示件数、レスポンシブ段階を決める。
- 同じデータ種別のカードは、home・一覧・詳細内関連枠で原則同じコンポーネントを使う。表示場所だけを理由に別カードを作らない。
- 「featured」枠を作る場合は、データ設計上の根拠、選定基準、通常グリッドとの差分を明示する。根拠がない場合は通常グリッドの先頭/プレビューとして扱う。

filter grid：

```tsx
className="grid grid-cols-1 gap-4 md:grid-cols-3"
```

detail grid：

```tsx
className="grid grid-cols-12 gap-6"
```

Compare：

```tsx
className="grid grid-cols-1 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_16rem]"
```

禁止：

- 無条件の `grid-cols-3`
- 固定幅sidebarをmobileに持ち込む
- textがボタンからはみ出るサイズ指定
- カードコンポーネント内部に配置場所ごとの幅指定を入れる
- 同じデータ種別のカードを、home用・一覧用という理由だけで複製する

---

## 9. Content Style

文体：

- 日本語を主、英語ラベルは補助。
- toBの導入判断に寄せる。
- 断定しすぎない。
- 未確認は明示する。
- 出典のある事実と独自分析を混ぜない。

UI文言：

- CTAは短くする。
- card内は説明しすぎない。
- 詳細ページで背景と文脈を補う。
- メーカー公式・認定・提携を誤認させる文言を避ける。

---

## 10. Future Component Candidates

すぐに作る価値がありそうな部品：

- `PageHeader`
- `SectionHeader`
- `InfoPanel`
- `SourceList`
- `SpecList`
- `RelatedLinkList`
- `StatusPill`
- `MediaFrame`

ただし、抽象化は利用箇所が増えてから行う。先に巨大なUI frameworkを作らない。

---

## 11. Acceptance Checklist

新しいUIを入れる前に確認する。

- [ ] mobileで1カラムになる
- [ ] desktopで情報密度が落ちすぎない
- [ ] 繰り返しカードの幅・列数・行高は親グリッドが決めている
- [ ] 同じデータ種別のカードを配置場所だけの理由で複製していない
- [ ] カード内に `w-[...]` など配置場所依存の幅指定がない
- [ ] 画像なしで成立する
- [ ] 長い日本語で崩れない
- [ ] icon buttonに `aria-label` がある
- [ ] tag/filter/searchが既存helperを使っている
- [ ] `data/*.ts` を直接importしていない
- [ ] `rights` なしの画像を表示していない
- [ ] `npm run build` が通る

---

## 13. デザインジャンル

**Editorial Broadsheet × Product Dashboard** のハイブリッド。

### ゾーン定義

| ゾーン | ジャンル | 代表 | 対象ページ |
|---|---|---|---|
| 読む場所 | Editorial Broadsheet | FT.com / Bloomberg | 詳細ページ本文（reports/use-cases/[slug]） |
| 操作する場所 | Product Dashboard | Linear / Vercel | 一覧・比較（robots/reports/use-cases/compare） |

### Editorial ゾーンのルール

- セクションをボックスで囲まない（§3 Spacing「本文ブロックへ矩形背景を貼らない」参照）
- 区切りは `border-b border-border` + 上下余白（`pt-6 pb-8`）のみ
- 見出し + 余白 + 罫線で構造を出す
- セクションごとに `bg-card` を塗らない

### Dashboard ゾーンのルール

- データ単位（ロボットカード・メーカーカード）には `.card-data` を使う
- ナビゲーション要素（RelatedLinkList・サイドバーウィジェット）はボックスを維持する
- 一覧ページ・詳細ページ内の埋め込みグリッドともに `xl:grid-cols-4 2xl:grid-cols-5` まで使う（既実装。§8参照）

### 実装参照基準

- `src/app/page.tsx`（ホーム）: Editorial ゾーンの参照基準（`section.border-b` によるセクション区切り）
- `src/app/robots/[slug]/page.tsx`: 詳細ページの参照基準（`border-b + py-8` によるディバイダー設計、既実装）

---

## 12. 一言まとめ

Deploid のデザインシステムは、装飾ではなく判断のための道具である。

neutral、矩形、出典、比較、未確認の明示。この5つを崩さない。
