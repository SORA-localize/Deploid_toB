# UI/UX リファクタリング前 調査レポート

**作成日**: 2026-06-09
**対象ブランチ**: `experiment/ui-refinement`
**調査元プロンプト**: `ui-ux-pre-refactor-investigation-prompt-2026-06-09.md`
**対象計画書**: `ui-ux-comprehensive-fix-plan-2026-06-09.md`
**性質**: 事実調査のみ。実装提案・修正は含まない。

> 注記: 当プロジェクトはコンポーネントが `src/components/` ではなくリポジトリ直下 `components/` に置かれている。計画書・プロンプト内の `src/components/...` パスは実体としては `components/...`。以下は実体パスで記載する。

---

## ⚠ 先に共有すべき「計画書の前提と食い違う事実」（5件）

調査の過程で、計画書が前提にしている記述と**実コードが食い違う**箇所を5件確認した。計画を書き直す際の最優先確認事項。

| # | 計画書の前提 | 実コードの事実 | 影響 |
|---|------------|-------------|------|
| F1 | **#9 TagChip は「枠線のみ」**（Phase 2 で背景追加） | `TagChip.tsx:32-36` は `getVisualToneClassName()` 経由で既に `bg-tone-*-bg` を付与済み。背景は**既にある**（neutral=slate-3 で薄いだけ） | Phase 2 の「背景追加」は不要。実態は「neutral背景が薄い」問題 |
| F2 | **#8/#17 EmptyState は「バリアントなし」** | `EmptyState.tsx:1-23` は `variant:'white'\|'muted'` と `size:'default'\|'large'` を**既に持つ** | 「バリアント追加」は誤り。実態はアイコン非対応のみ |
| F3 | Phase 7 の EmptyState 改修例（`{message, icon, description}` に書換）は A5「後方互換」と主張 | 全6呼び出し箇所のうち `ManufacturersBrowser.tsx:130` と `RobotsBrowser.tsx:214` は `variant`/`size` を渡す。計画の新シグネチャは両propを**削除**しており、その通り実装すると**型エラー＝後方互換は崩れる** | Phase 7 の実装例は A5 の主張と矛盾。要再設計 |
| F4 | A10「各フェーズに `next lint` を追加」 | `package.json` に lint script なし・eslint 設定ファイルなし。かつ **Next.js 16 では `next lint` コマンド自体が廃止**（ESLint CLI へ移行）。CLAUDE.md も「lint設定はまだ無い」 | `next lint` は**実行不能**。A10 の検証フローは成立しない |
| F5 | A1「グローバル `h1` 適用が Hero を縮小する」 | Hero 見出しは `ManufacturerMapStage.tsx:257` で `text-3xl md:text-5xl` を**明示**。Tailwind ユーティリティは `@layer base` の `h1` ルールより優先されるため、Hero は縮小**されない**。グローバル `h1〜h4`（`globals.css:320-342`）は `text-*` クラスを持たない素の見出しにしか効かず、実際には**ほぼ全ての見出しが `text-*` を明示**している | グローバル見出しサイズ変更の効果は限定的。`.content-prose` 導入の前提見直しが必要 |

---

## 調査 1: 意図的な実装の識別（触ってはいけない箇所）

**使用コマンド**:
```bash
sed -n '1,170p' src/app/page.tsx
sed -n '1,484p' src/app/globals.css
grep -rn "<h1\|text-3xl\|text-5xl" components/ManufacturerMapStage.tsx
grep -rn "<h1\|<h2" src/app/robots/[slug]/page.tsx src/app/manufacturers/[slug]/page.tsx src/app/use-cases/[slug]/page.tsx
```

| 箇所 | クラス/実装 | 意図的か | 理由（出典） |
|------|-----------|---------|------|
| Hero 帯（世界地図） | `ManufacturerMapStage.tsx:257` `<h1 className="text-3xl ... md:text-5xl text-white">`、黒背景・白文字直書き | **意図的** | CLAUDE.md「例外カテゴリ：トップのヒーロー帯とメーカー世界地図のみ、黒背景・白文字の直書きを許容」。`page.tsx:81-85` で `ManufacturerWorldMap` に heading/subcopy を渡す構成 |
| 世界地図セクション全体 | `ManufacturerWorldMap.tsx` / `ManufacturerMapStage.tsx`。dotted-map + SVG arc + ドット登場アニメ | **意図的** | CLAUDE.md 例外カテゴリ。`globals.css:257-318` に専用 keyframe（`manufacturerDotEnter` 等）。演出用の確立した実装 |
| `:root` トークン定義 | `globals.css:27-114`（`--slate-*`/`--jade-*` を semantic token へ写像、`--tone-*` 一式） | **意図的** | CLAUDE.md「色は直書きせず globals.css の token と visualSemantics の tone を使う」。`design_system_v1.md` が真実源。**変更は全ページ波及（調査4参照）** |
| `.site-container` | `globals.css:364-366` `max-w-[1680px] px-4 md:px-8` | **意図的だが論点**（バグではない） | 設計上の確立クラス。ただし計画 #5 が「広すぎ」と指摘。31箇所で利用（調査4）。値そのものは意図的設定で、UX妥当性は別議論 |
| グローバル `h1〜h4` | `globals.css:320-342`、全て `line-height:1.5`・`--text-2xl/xl/lg/base` | **意図的（shadcn 由来の base）だが効果限定的** | F5 の通り、実見出しは `text-*` 明示が大半でこの base はフォールバックに留まる。`line-height:1.5` 固定は #12 の指摘対象 |
| robots/[slug] 見出し | `robots/[slug]/page.tsx:91` h1 `text-3xl`、`:112,131,201` セクション h2 `text-sm font-semibold` | **半意図的（要判断）** | CLAUDE.md「モノスペースのセクションラベル」志向で小さめは設計意図の可能性。ただし h1=30px 直後 h2=14px の落差は #7「ジャンプ率不足」と裏表。バグとは断定不可 |
| RobotCard ホバー | `RobotCard.tsx:44-104,195-198`：tilt(motion)+glow spotlight+shimmer sweep+底辺アクセント線、`globals.css:426-436` の grid 兄弟ディミング | **意図的（作り込み済み）** | motion による 3D tilt/spring。`--card-spotlight`（`globals.css:113,423`）でダーク反転対応。#10「ホバー弱い」は RobotCard には**該当しない**（ManufacturerCard/NewsCard が対象） |
| ManufacturerCard ホバー | `ManufacturerCard.tsx:38` `.card-data`（`globals.css:369-374` border-color のみ変化） | **未完成寄り（#10対象）** | RobotCard と比べ意図的に簡素。#10 の改善対象として妥当 |
| NewsCard ホバー | `NewsCard.tsx:21` `.card-editorial`（`globals.css:377-382` border-color）+ 画像 `scale-105`(`:33`)+底辺線(`:81-84`)+矢印移動(`:76`) | **部分的に作り込み済み** | border-color だけでなく画像ズーム・アクセント線・矢印移動を既に持つ。#10「弱い」「#21 遷移が唐突」は要再評価 |
| CLAUDE.md デザイン方針 | 「AI感回避」§。グラデ禁止/角丸過剰禁止/モノクロ+1色 | **強制ルール（不可変）** | CLAUDE.md「build_notes §5 が強制ルール。違反するとサイトの存在意義が崩れる」 |

**補足（意図的演出として温存すべき箇所）**:
- `NewsHeroCarousel.tsx:87` の `bg-gradient-to-t from-black/90`、`:81` の `from-muted` グラデは**カルーセル画像オーバーレイ**で、CLAUDE.md グラデ禁止の例外と判断できる演出（黒背景帯の系譜）。ただし `:81` の No Image プレースホルダー `bg-gradient-to-br` は要検討余地。

---

## 調査 2: 既存ライブラリで解決できる問題のマッピング

**使用コマンド**:
```bash
grep -rln "embla-carousel" components/ src/ --include="*.tsx"
grep -rln "from 'motion\|framer-motion" components/ src/ --include="*.tsx"
grep -rln "budoux\|BudouX" components/ lib/ --include="*.tsx" --include="*.ts"
grep -rln "BudouXText" . --include="*.tsx"   # 利用箇所探索
grep -rln "CardHoverEffect\|AnimatedTooltip\|EncryptedText\|Marquee" components/ src/
ls components/ui/
```

**現在の利用状況（事実）**:
- `embla-carousel*`: `components/uilayouts/carousel.tsx`（基盤）/ `NewsHeroCarousel.tsx`（autoplay）/ `RobotImageCarousel.tsx`。class-names プラグインは package にあるが利用箇所はカルーセル基盤のみ。
- `framer-motion`/`motion`: `RobotCard.tsx`・`HomeContentNavigator.tsx`・`CompareClient.tsx`・`compare/CompareParts.tsx`・`ui/card-hover-effect.tsx`・`ui/AnimatedTooltip.tsx`・`ui/encrypted-text.tsx`・`uilayouts/carousel.tsx` で使用。
- `radix-ui`（Popover）: `ui/searchable-dropdown.tsx`（Popover を full 活用、後述）。`ui/select.tsx`（Radix Select）。
- `budoux`: `lib/typography.ts` と `components/BudouXText.tsx` に実装あり。**`BudouXText` の利用箇所はゼロ（コンポーネント定義のみ・全リポジトリで未使用）**。
- `lucide-react`: 36ファイルで使用（広く活用済み）。
- `next-themes`: ダークモード稼働中（`globals.css:393-424` `.dark`）。
- `ui/marquee.tsx`: **利用箇所ゼロ（未使用）**。
- `ui/card-hover-effect.tsx`: `ReportsBrowser.tsx` で使用。`ui/AnimatedTooltip.tsx`: `PageTabBar.tsx`。`ui/encrypted-text.tsx`: `ManufacturerMapStage.tsx`。

**問題→ライブラリ対応マップ**:

| 問題# | ライブラリ | 使える機能 | 現在の使用状況 | 事実 |
|-------|----------|----------|-------------|------|
| #22 | radix-ui | Popover（Escape/focus 管理内包） | `ui/searchable-dropdown.tsx:175-323` で**既に full 活用**（Escape `:227`、focus 復帰 `:130-135`、矢印/Home/End `:232-251`、`aria-*` 一式） | **#22 の対象は `ManufacturerCard.tsx:27-35,109-147` の自前 useState+pointerdown メニューのみ**。Radix Popover の置換パターンは既に repo 内に存在し流用可。新規依存不要 |
| #22(別) | radix-ui | Select（Escape/focus） | `ui/select.tsx`（`SelectControl.tsx:59-73` 経由）で稼働。フィルタ非searchableは Radix Select | 非searchable フィルタの a11y は既に Radix が担保 |
| #11 | lucide-react | スペック表行のアイコン | 36ファイルで使用済みだが**スペック表（`robots/[slug]/page.tsx:113,204` の `<table>`、`ManufacturerFactSheet.tsx:125-135` の `<dl>`）にはアイコンなし** | アイコン基盤は導入済み。表への適用は未 |
| #11/日本語 | budoux | 日本語の自然改行（`BudouXText`） | `BudouXText` 未使用 | 既存の未使用資産。見出し・本文の折返し品質に適用余地（事実として未活用） |
| #13 | embla | カルーセル高さ | `RobotImageCarousel.tsx:67,82` が `h-[420px]` **固定** | embla 自体は高さ非関与。高さは外側 div の Tailwind 固定値。`NewsHeroCarousel` は `ReportsBrowser.tsx:96` で `aspect-[16/9]`（レスポンシブ済み）→ **#13 はカルーセル全般ではなく RobotImageCarousel 限定** |
| #10 | framer-motion | カードホバー | RobotCard は motion 活用済み。ManufacturerCard/NewsCard は CSS transition のみ | motion 基盤あり。適用有無の差が #10 の本体 |
| #1/#24 | （ライブラリ不要） | — | 検索/フィルタは幅・折返しの Tailwind 調整事項。`RobotsBrowser.tsx:166` 検索は既に `max-w-2xl` | ライブラリで解く問題ではない |
| #25 | （ライブラリ不要） | — | z-index は素の Tailwind クラス。後述 | トークン化は CSS 設計事項 |

---

## 調査 3: コンポーネント間の実装パターンの一貫性

**使用コマンド**:
```bash
grep -rn "<h1\|<h2\|<h3\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl\|text-3xl" \
  src/app/robots/[slug]/page.tsx src/app/use-cases/[slug]/page.tsx \
  src/app/guides/[slug]/page.tsx src/app/reports/[slug]/page.tsx \
  components/ManufacturerDetailSection.tsx components/ManufacturerFactSheet.tsx \
  components/RobotsBrowser.tsx components/ManufacturersBrowser.tsx \
  components/GuidesBrowser.tsx components/UseCasesBrowser.tsx
grep -rn "grid-cols\|<dl\|<table\|justify-between" src/app/.../page.tsx components/*.tsx
```

| パターン | ばらつきの内容（file:line） | 統一方向性（事実のみ） |
|---------|-------------|-----------|
| **セクション見出し h2 のサイズ** | `robots/[slug]:112,131,201` = `text-sm` / `reports/[slug]:142` = `text-base`・`:166` = `text-sm` / `use-cases/[slug]:115,121,125` = `text-lg`・`:83` = `text-sm` / `guides/[slug]:121` = `text-lg` / `ManufacturerDetailSection.tsx:33` = `text-2xl` / `ManufacturerFactSheet.tsx:116` = `text-2xl` | 同じ「セクション見出し」で **text-sm/base/lg/2xl の4段階**が混在。最大の不統一 |
| **ページ h1 サイズ** | 一覧: `RobotsBrowser.tsx:160`・`ManufacturersBrowser.tsx:85`・`GuidesBrowser.tsx:50`・`UseCasesBrowser.tsx:80` = `text-2xl`。詳細: `robots/[slug]:91`・`use-cases/[slug]:55` = `text-3xl` | 一覧=2xl / 詳細=3xl。2系統で比較的一貫 |
| **スペック/ファクト表の構造** | `robots/[slug]:113,204` = `<table><td w-2/5 sm:w-1/3>` / `ManufacturerFactSheet.tsx:125-135` = `<dl grid-cols-[8rem_minmax(0,1fr)]>` / `RobotCard.tsx:167` = `<dl grid-cols-1 md:grid-cols-2>` / `ManufacturerCard.tsx:69-87` = `flex justify-between` 行 / `use-cases/[slug]:86` = `grid-cols-3`・`:111` = `grid-cols-12` | **同じ「ラベル:値」表示が4種の実装**（table / dl-grid / flex-between / grid-cols-n）。共通コンポーネント不在 |
| **カードのホバー** | `RobotCard.tsx`（motion tilt+glow+shimmer+底辺線）/ `NewsCard.tsx`（border+画像scale+底辺線+矢印）/ `ManufacturerCard.tsx`（`.card-data` border-colorのみ）/ `.card-data`(`globals.css:369-374`) と `.card-editorial`(`:377-382`) の2系統 | 3段階の作り込み差。`.card-data`/`.card-editorial` の2クラスが存在するが ManufacturerCard だけ素 |
| **空状態** | 全6箇所 `EmptyState` 使用（`RobotsBrowser:214,229`・`ManufacturersBrowser:130`・`GuidesBrowser:156`・`ReportsBrowser:116`・`UseCasesBrowser:205`）。ただし `variant`/`size` 指定は Robots/Manufacturers のみ、他はデフォルト | コンポーネントは統一済み。props 指定に粗密あり |
| **検索/フィルタUI** | `RobotsBrowser.tsx:166-204`：`SearchInput`+`SelectControl`×4（`grid sm:grid-cols-2 xl:grid-cols-4`）。他ブラウザも `SelectControl`/`SearchInput` 共通利用 | 共通部品で概ね統一。`SelectControl` の `searchable` 切替も統一済み |
| **余白クラス** | セクション縦余白が `py-8`（`robots/[slug]:111,130,200`）/ `py-12`（`ManufacturerFactSheet.tsx:110`）/ `py-8 sm:py-12`（`page.tsx:102,122,151`）/ 一覧 `py-5`（`RobotsBrowser.tsx:157`）と混在。見出し下 `mb` も `mb-2/3/4/5/6` 混在 | py-5/8/12 と sm:有無が不統一。#4 の実体 |
| **アクティブフィルタ表示** | `ActiveFilterChips.tsx:19` は「選択中:」+チップ横並び。`RobotsHeader` 側にも `activeChips` を渡す経路（`RobotsBrowser.tsx:153`） | チップ生成は `RobotsBrowser.tsx:96-115` に集約。表示は ActiveFilterChips 単一 |

---

## 調査 4: 変更によるリスクの高い共通部品

**使用コマンド**:
```bash
grep -rn "site-container" src/ components/ --include="*.tsx" | wc -l   # → 31
grep -rln "TagChip\|EmptyState\|RobotCard\|ManufacturerCard\|NewsCard\|card-data\|card-editorial" src/ components/ --include="*.tsx"
```

| 部品 | 利用箇所数 | 変更リスク | 注意点（事実） |
|-----|---------|---------|-------|
| `globals.css :root` トークン（`--slate-*`/`--jade-*`/`--tone-*`/semantic） | 全UI（`@theme inline` 経由で `bg-*`/`text-*`/`border-*` 全クラスの色源） | **最大** | 1値変更で全ページ・両テーマに波及。`visualSemantics.ts` の `bg-tone-*` クラス（`:27-58`）も全部この token 依存。Phase 2 の token 変更は最広域 |
| `.site-container`（`globals.css:364-366`） | **31箇所** | **大** | 全ページの最外コンテナ幅・左右padding。#5/#19 の中心。max-width 変更は全ページ目視必須 |
| `RobotCard` | 4ファイル（`page.tsx`・`FeaturedRobotsGrid`・`RobotsBrowser`・`ManufacturerRobotsGrid`） | 大 | Home/一覧/メーカー詳細に出る主力カード。motion 実装込みで複雑（`RobotCard.tsx:44-104`）。レイアウト変更の波及広い |
| `EmptyState` | **6箇所**（Robots/Manufacturers/Guides/Reports/UseCases ブラウザ） | 中 | props 変更は全6箇所に影響。うち2箇所が `variant`+`size` 指定（F3）。シグネチャ変更時は型互換を全箇所で要確認 |
| `TagChip` | 7箇所（`page.tsx`・`guides/[slug]`・`reports/[slug]`・`NewsCard`・`GuidesBrowser`・`UseCasesBrowser`・自身） | 中 | `kind`/`value`/`tone`/`children` の4系統の呼ばれ方。`visualSemantics` の tone 依存（F1） |
| `ManufacturerCard` | 1箇所（`ManufacturersBrowser`） | 小 | 影響範囲は限定的。安全に触れる |
| `NewsCard` | 3箇所（`page.tsx`・`manufacturers/[slug]`・`ReportsBrowser`） | 中 | Home/メーカー詳細/記事一覧 |
| `.card-data` | 4箇所（`FavoriteCard`・`ManufacturerCard`・`GuidesBrowser`・`UseCasesBrowser`） | 中 | クラス定義変更は4種カードに波及 |
| `.card-editorial` | 1箇所（`NewsCard`） | 小 | NewsCard 専用 |

---

## 調査 5: 型定義と既存パターン

**使用コマンド**:
```bash
sed -n '1,415p' data/types.ts
sed -n '1,190p' lib/visualSemantics.ts
sed -n '1,41p' components/TagChip.tsx ; sed -n '1,23p' components/EmptyState.tsx
grep -rn "EmptyState" components/*.tsx
```

**確認結果（事実）**:

- **データ型 `data/types.ts`**: UI修正で触れる必要のある型は確認できない。`ImageAsset`(`:54-60`)・`Robot.images`(`:217`)・`RobotSpecs`(`:180-189`) 等はUI表示の元だが、レスポンシブ/余白/色の修正で型変更は不要。`data/types.ts` は `nextjs_data_types_v1.ts` が真実源（CLAUDE.md）で、UI都合での変更は方針外。

- **EmptyState props（`EmptyState.tsx:1-6`）**: 現状 `{ message:string; variant?:'white'|'muted'; size?:'default'|'large'; className?:string }`。`icon` prop は**無い**。F2/F3 の通り、計画 Phase 7 の新シグネチャ `{message, icon, description}` は `variant`/`size`/`className` を落とすため、`ManufacturersBrowser.tsx:130`・`RobotsBrowser.tsx:214` で型エラー。**追加するなら全 prop をオプショナルで足し、既存4 prop を残す**のが型安全（事実：既存呼び出しは6箇所）。

- **TagChip と visualSemantics（`TagChip.tsx:27-39` / `visualSemantics.ts:27-62`）**: TagChip は既に `tone` prop（`VisualTone`）を受け、`getVisualToneClassName(tone)` で `border-tone-*-border bg-tone-*-bg text-tone-*-text` を適用。**背景は既に visualSemantics の tone 経由で出ている**。「背景色を追加するとき tone を使えるか」→ **既に使っている**。`neutral` tone の bg が `--tone-neutral-bg=slate-3`（`globals.css:79`）で薄いのが視覚的弱さの実体。solid バリアント（`visualToneSolidClassNames` `:49-58`）も既存。

- **カードの className 受け取り（cn/tw-merge）**: `cn()` は `lib/utils.ts` で提供（`clsx`+`tailwind-merge`）。`NewsCard.tsx:21` `cn('card-editorial ...', className)`・`RobotCard.tsx:84` `cn(...)` は対応済み。**ただし `RobotCard` は `className` prop を受け取らない**（`RobotCardProps` `:18-25` に無い）、`ManufacturerCard` も `className` 非対応（`:17-20`）、`EmptyState` は `className` 受取あり（`:5`）。ホバー等を呼び出し側から渡す設計にするなら RobotCard/ManufacturerCard は prop 追加が必要（事実）。

- **`tagRegistry`/`labels`**: `TagChip` は `getRegisteredTag(kind, value)`(`TagChip.tsx:27`) でラベル解決。色修正で `labels.ts`/`tagRegistry.ts` を触る必要は確認できない。

---

## 調査 6: 検証コマンド

**使用コマンド**:
```bash
cat package.json   # scripts 確認
cat tsconfig.json
ls -la | grep -iE "eslint|prettier|lint"   # → 該当なし
ls node_modules/.bin/tsc   # → 存在
```

| コマンド | 実行可否 | 用途・根拠 |
|---------|--------|-----|
| `npm run build` | ✅ | `package.json` scripts に `"build": "next build"`。本番ビルド/SSG |
| `npm run dev` | ✅ | `"dev": "next dev"` |
| `npm run start` | ✅ | `"start": "next start"` |
| `npm run validate:data` | ✅ | `"validate:data": "node scripts/validate-data.mjs"`（データ整合性。UI修正では補助的） |
| `npx tsc --noEmit` | ✅ | `typescript` devDep 導入済み・`node_modules/.bin/tsc` 存在。`tsconfig.json` は `strict:true`・`noEmit:true`・`allowImportingTsExtensions:true`。型チェックの主検証手段 |
| `next lint` | ❌ | **lint script なし・eslint 設定ファイルなし**。CLAUDE.md「lint設定はまだ無い」。さらに **Next.js 16 で `next lint` は廃止**（公式は ESLint CLI へ移行）。`package.json` の next は `^16.2.6`。→ **計画 A10 は成立しない** |
| `eslint`/`prettier` | ❌ | 設定・依存ともに無し |

**`tsconfig.json` 要点**: `strict:true` / `target:ES2017` / `moduleResolution:bundler` / paths `@/* → ./*`（だから `@/components` が直下 `components/` を指す）。

**結論（検証フロー）**: 実行可能な静的検証は `npm run build` と `npx tsc --noEmit` の2つ。`next lint` を前提にした計画記述（A10・各 Phase の検証節）は要修正。lint を入れたい場合は ESLint flat config + script 追加が別途必要（ユーザー確認事項）。

---

## 付録: 25問題の「現状ステータス」早見表（事実ベース）

| # | 計画の主張 | 調査で判明した事実 |
|---|----------|-----------------|
| 1 | 検索/ドロップダウンが大画面で伸びる | `RobotsBrowser.tsx:166` 検索は既に `max-w-2xl`。フィルタは `xl:grid-cols-4` 上限なし |
| 2 | スペック表 大画面で余白 | `robots/[slug]:113,204` `<table w-full>` 上限なし。`ManufacturerFactSheet` は `md:grid-cols-2` |
| 3 | プレースホルダ画像が縦長 | `RobotCard.tsx:130` `md:aspect-[4/3]`。プレースホルダは CameraOff アイコン中央 |
| 4 | 縦余白一律 | 実際は py-5/8/12 + sm:有無が**不統一**（一律ではなくバラバラ） |
| 5 | コンテナ1680px広すぎ | `globals.css:365` `max-w-[1680px]`、31箇所波及（事実） |
| 6 | カード/背景コントラスト不足 | bg=slate-2 / card=slate-1（`globals.css:32,34`）。差1段 |
| 7 | 見出しジャンプ率不足 | グローバル h1-h4 はあるが F5 で効果限定。実体は調査3の h2 不統一 |
| 8/17 | EmptyState テキストのみ/バリアントなし | **誤**: variant/size 既存（F2）。アイコン非対応は事実 |
| 9 | TagChip 枠線のみ | **誤**: bg 既存（F1）。neutral bg が薄いのが実体 |
| 10 | Manufacturer/NewsCard ホバー弱い | ManufacturerCard=border のみ（該当）。NewsCard=画像scale+線+矢印あり（要再評価） |
| 11 | アイコン未活用 | lucide 36ファイルで活用済み。未適用は**スペック表のみ**。budoux/BudouXText は未使用資産 |
| 12 | 日本語 line-height 1.5 固定 | `globals.css:320-360` 全見出し `line-height:1.5`（事実） |
| 13 | カルーセル h-[420px] 固定 | **RobotImageCarousel 限定**（`:67,82`）。NewsHeroCarousel は `aspect-[16/9]`(`ReportsBrowser:96`) |
| 14 | RobotCard sm 欠落 | `RobotCard.tsx:129` は `flex-row md:flex-col`（sm 中間なし＝事実） |
| 15 | 見出しレスポンシブなし | Hero は `md:text-5xl` あり。本文系見出しは固定（事実） |
| 16 | スペック表モバイル横スクロール保護なし | `robots/[slug]:113,204` `<table>` に `overflow-x-auto` 無し（事実） |
| 18 | ManufacturerCard ml-4 過剰 | `ManufacturerCard.tsx:72,78,84,91,153` `ml-4`/`ml-auto`（事実、固定値） |
| 19 | タブレットpadding比率崩れ | `.site-container px-4 md:px-8`（sm/lg 段階なし＝事実） |
| 20 | フッターモバイル折返し不規則 | `Footer.tsx:27` `flex flex-wrap gap-x-4 gap-y-2`（事実） |
| 21 | NewsCard 画像遷移が唐突 | `NewsCard.tsx:27` `w-24 ... sm:w-auto sm:aspect-video`（sm で一気に切替＝事実） |
| 22 | ドロップダウン focus trap/Escape なし | **ManufacturerCard の自前メニュー限定**（`:27-35,109-147`）。searchable-dropdown/Select は Radix で完備 |
| 23 | Breadcrumbs gap モバイルで詰まる | `Breadcrumbs.tsx:16` `gap-2`（sm 分岐なし＝事実） |
| 24 | ActiveFilterChips モバイル乱れ | `ActiveFilterChips.tsx:19` `flex flex-wrap items-center gap-2`（事実） |
| 25 | z-index 競合 | `Header.tsx:44` z-40・`:115` z-50。全体で z-10(13回)/z-20(7)/z-30(3)/z-40(4)/z-50(5)。トークン化なし。**Tailwind v4 `@theme inline` に `--z-*` を置いても z-utility は自動生成されない（色/spacing 等の namespace のみ）。`z-[var(--z-*)]` 参照になる**点に注意（A7 の前提に補足必要） |

---

## まとめ（計画書改訂時の論点・事実のみ）

1. **F1〜F5 の前提ずれを先に修正**してから計画を再構成する（TagChip/EmptyState は「追加」でなく「調整」、`next lint` 不採用、グローバル h1 改修の効果限定）。
2. **最大の不統一は「セクション見出し h2 のサイズ」**（text-sm〜2xl の4段階・調査3）と「スペック/ファクト表の4種実装」。#7 より影響が大きい構造課題。
3. **波及最大の共通部品は `:root` トークンと `.site-container`(31箇所)**。Phase 1/2 の検証は全ページ・両テーマ目視が必須。
4. **#22 は ManufacturerCard 自前メニュー1箇所限定**。Radix Popover 置換の参照実装は `ui/searchable-dropdown.tsx` に既存。
5. **未使用資産**: `BudouXText`・`ui/marquee.tsx`（活用 or 削除の判断材料）。
6. **静的検証は build と `tsc --noEmit` の2本**のみが実行可能。
