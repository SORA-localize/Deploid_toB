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

現在の実装方針：

- 背景は `neutral-50` / `neutral-100` / `white`
- テキストは `neutral-900` を主軸
- 補助テキストは `neutral-600` / `neutral-500`
- 枠線は `neutral-200` / `neutral-300`
- CTAは `neutral-900` 塗り
- 成功・警告・情報だけ `green` / `amber` / `blue` を限定使用
- 角丸は基本なし
- 影は使わない

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
| Tag neutral | `border-neutral-200 bg-neutral-100 text-neutral-700` |
| Success | `green-50`, `green-700`, `green-800` |
| Warning | `amber-50`, `amber-700`, `amber-900` |
| Info | `blue-50`, `blue-700`, `blue-800` |

`src/app/globals.css` にはFigma由来のCSS変数があるが、実装ではTailwindのneutral scaleを主に使う。新しい色を足す場合は、この文書に用途を追加する。

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
- コンパクトな管理UIではhero級の余白を使わない。

### Radius / Shadow

- Radius: 原則なし。
- Shadow: 原則なし。
- 例外: 比較削除ボタンのような小さな浮遊操作だけ、既存の `rounded-full` は許容。

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
- 画像、機種名、メーカー、summary、主要spec、詳細導線を持つ。

ルール：

- 画像枠は `aspect-[4/3]`。
- 画像は `object-contain`。
- 画像が表示不可でも `[ MAIN IMAGE ]` placeholderで成立させる。
- specは捏造しない。未確認は `TBD_LABEL`。
- favoriteは任意機能としてpropsで渡す。

### Image Carousel

役割：

- robot detailの画像スロット表示。

ルール：

- 画像枠は `aspect-[16/9]`。
- `ImageRole` の固定スロットを使う。
- 表示不可画像はrole label placeholderにする。
- credit/sourceを表示する。
- 今後 `aria-current` の補強を検討する。

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

- 選択肢が多い/enum: `FilterSelect`
- 状態切替/少数カテゴリ: `FilterChipGroup`
- 自由検索: `SearchInput`

ルール：

- searchはページ内filterとして扱う。
- URL共有したいfilterだけ `useUrlFilters`。
- chip buttonは `aria-pressed`。

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
- [ ] 画像なしで成立する
- [ ] 長い日本語で崩れない
- [ ] icon buttonに `aria-label` がある
- [ ] tag/filter/searchが既存helperを使っている
- [ ] `data/*.ts` を直接importしていない
- [ ] `rights` なしの画像を表示していない
- [ ] `npm run build` が通る

---

## 12. 一言まとめ

Deploid のデザインシステムは、装飾ではなく判断のための道具である。

neutral、矩形、出典、比較、未確認の明示。この5つを崩さない。
