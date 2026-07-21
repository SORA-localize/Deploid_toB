# 記事ページ（ニュースハブ）実装計画 v1

作成日: 2026-06-05

---

## 1. コンセプト・目的

**旧コンセプト（変更前）**: 分析ブリーフの置き場。`whyItMatters` を書いた厚め記事のリスト。

**新コンセプト（本計画）**: ヒューマノイド専門ニュースサイトのトップページをそのまま `/reports` に移植する。
プレスリリース・技術アップデート・資金調達・政策・エンタメまで扱い、読者の目的に応じてタブ＋タグの2層でフィルタできる情報ハブ。

**目標**: このページを見れば、このサイトに訪れる人の目的（技術理解・調達判断・市場把握・単純な興味）に応じたニュースを提供できる状態にする。

---

## 2. 既存実装の調査結果

### 既存ライブラリ（インストール済み）

| ライブラリ | 用途 | バージョン |
|---|---|---|
| `motion` (Framer Motion) | アニメーション全般 | ^12.40.0 |
| `shadcn/ui` + Radix UI | UIコンポーネント基盤 | 導入済み |
| `dotted-map` | ワールドマップ SVG 生成 | ^3.1.0 |
| Tailwind CSS v4 | スタイリング | 導入済み |

### 「Aceternityから実装した」と思われていたものの正体

| コンポーネント | 実際の実装 |
|---|---|
| **RobotCard のホバー効果** | `motion/react` の完全独自実装。3D tilt (`useSpring + useTransform`)、グローエフェクト (`radial-gradient`)、シマーアニメーション（純 Tailwind CSS）。Aceternity は参照元デザインとして使ったが、コードは全て自作。 |
| **ワールドマップ** | `dotted-map` + 独自パンアニメーション + `EncryptedText`（自作コンポーネント）。Aceternity のコードは未使用。 |

→ **AceternityもMagic UIもnpmパッケージとしてはインストールされていない**。使う場合は `npx shadcn@latest add` でコードをプロジェクトにコピーする形式。

---

## 3. 採用コンポーネント（ゾーン別）

### ページ全体構成

```
┌──────────────────────────────────────────────────────────┐
│ [A] Marquee — 速報スクロール帯（最新記事タイトルが流れる） │
├──────────────────────────────────────────────────────────┤
│ [B] shadcn Tabs — カテゴリタブ（中レイヤー）              │
│     全て | 技術 | ビジネス | 導入事例 | 政策・規制 | エンタメ│
├──────────────────────────────────────────────────────────┤
│ [C] shadcn Badge — タグフィルター（小レイヤー）            │
│     #figure-ai  #unitree  #資金調達  #raas  ...           │
├────────────────────────────────┬─────────────────────────┤
│ [D] BentoGrid — フィーチャー帯  │ [G] サイドバー           │
│   大カード (col-span-2)         │   ・トレンドタグ          │
│   小カード × 2 (col-span-1)    │   ・関連ツール導線        │
├────────────────────────────────┤   ・お問い合わせ CTA      │
│ [E] NewsCard グリッド           │                          │
│   記事カード 3col               │                          │
├────────────────────────────────┤                          │
│ [F] 最新リスト（コンパクト行）   │                          │
└────────────────────────────────┴─────────────────────────┘
```

### ゾーン別コンポーネント詳細

#### [A] 速報スクロール帯 — Magic UI Marquee

```bash
npx shadcn@latest add "@magicui/marquee"
```

- インストールすると `components/ui/marquee.tsx`（75行）と CSS 変数 2個が追加される
- CSS アニメーションのみ（Framer Motion 不使用）。`--duration` と `--gap` を CSS 変数で制御
- 使用 props: `pauseOnHover={true}` で止まる、`repeat={3}`

**カスタマイズ**:
- コンテンツ: 最新記事のタイトル + カテゴリバッジを流す
- スタイル: `border-b border-border bg-background py-2` で Deploid のデザインに合わせる
- `[--duration:40s]` を調整して速度をコントロール

#### [B] カテゴリタブ — shadcn Tabs（既存）

shadcn/ui の `Tabs` コンポーネントはすでに利用可能。追加インストール不要。

**URLとの同期**: `?tab=tech` 形式で URL に反映（既存の `useUrlFilters` を流用）。

**タブ一覧**（= `category` フィールドの値）:

| タブ表示名 | `category` 値 | 含む `type` |
|---|---|---|
| 全て | （フィルタなし）| 全て |
| 技術 | `tech` | `analysis`, `tech-update`（新規追加） |
| ビジネス | `business` | `market-analysis`（新規追加）, `interview` |
| 導入事例 | `deployment` | `deployment-report`, `case-study` |
| 政策・規制 | `policy` | `policy-update` |
| エンタメ | `entertainment` | `event-report`, `news-brief` |

#### [C] タグフィルター — shadcn Badge（既存）

既存の `FilterChipGroup` コンポーネントをそのまま流用。追加作業なし。

#### [D] フィーチャー帯 — Magic UI BentoGrid（カスタム）

```bash
npx shadcn@latest add "@magicui/bento-grid"
```

インストールすると `components/ui/bento-grid.tsx`（110行）が追加。依存: `@radix-ui/react-icons`（ただし Lucide に差し替え予定）。

**BentoGrid の元コードの問題点と修正方針**:

| 元のコード | 問題 | 修正 |
|---|---|---|
| `rounded-xl` | Deploid はシャープエッジ | `rounded-none` or 削除 |
| `box-shadow` | シャドウ禁止 | `border border-border` に置換 |
| `dark:[box-shadow:...]` | 同上 | 削除 |
| `text-neutral-700` | デザイントークン外 | `text-foreground` に置換 |
| `Icon: React.ElementType` | ニュースカードに不要 | `heroImage` に差し替え |
| `auto-rows-[22rem]` | 記事カードに高すぎ | `auto-rows-[18rem]` に調整 |

**NewsBentoCard のカスタムプロップ**:
```ts
interface NewsBentoCardProps {
  article: Report;
  className: string;         // col-span-N で大きさ指定
  featured?: boolean;        // 大カードかどうか
}
```

**レイアウト**:
```
col-span-2 (大・フィーチャー記事)  | col-span-1 (小)
                                   | col-span-1 (小)
```

→ `BentoGrid` のコンテナ（CSS Grid `grid-cols-3`）だけ流用し、`BentoCard` はニュース向けに `NewsBentoCard` として書き直す。

#### [E] NewsCard グリッド — 独自実装（RobotCard パターン流用）

新規コンポーネント `components/NewsCard.tsx` を作成。RobotCard の hover パターンを踏襲：

- `motion/react` で hover 時の subtle な scale + shadow
- `group-hover:` の CSS でシマースイープ
- RobotCard よりアニメーションは控えめに（ニュースカードは情報密度が主役）

**カード内構成**:
```
┌────────────────────────────┐
│  heroImage (aspect-video)  │ ← ImageAsset が無ければグレー背景 + カテゴリ名
├────────────────────────────┤
│  [カテゴリバッジ]  日付      │
│  タイトル（2行まで）        │
│  summary（3行 line-clamp） │
│  タグチップ × 2-3          │
└────────────────────────────┘
```

#### [F] 最新リスト — 純 Tailwind CSS

`space-y-0 divide-y divide-border` の compact list。フィーチャーや NewsCard グリッドに入りきらない記事を表示。追加ライブラリ不要。

#### [G] サイドバー — 既存コンポーネント流用

現状の `ReportsBrowser` のサイドバー（関連ツール + お問い合わせ）をほぼそのまま維持。

---

## 4. データモデル変更

### `data/types.ts` への追加

```ts
// 追加する型
export type ReportCategory =
  | 'tech'
  | 'business'
  | 'deployment'
  | 'policy'
  | 'entertainment';

// ReportType に追加
export type ReportType =
  | 'analysis'
  | 'deployment-report'
  | 'interview'
  | 'event-report'
  | 'policy-update'
  | 'case-study'
  | 'news-brief'
  | 'tech-update'      // 新規追加
  | 'market-analysis'; // 新規追加

// Report interface に追加
export interface Report extends BaseRecord {
  // ...既存フィールド...
  category?: ReportCategory;  // タブ中レイヤー（未設定の場合は type から自動推定）
  readingTimeMin?: number;     // 記事の目安読了時間（分）
}
```

### `type → category` 自動マッピング（`lib/reportDisplay.ts` 新規）

`category` が未設定の既存記事に対して `type` から自動推定するユーティリティ関数:

```ts
export function inferCategoryFromType(type: ReportType): ReportCategory {
  const map: Record<ReportType, ReportCategory> = {
    'tech-update': 'tech',
    'analysis': 'tech',
    'market-analysis': 'business',
    'interview': 'business',
    'deployment-report': 'deployment',
    'case-study': 'deployment',
    'policy-update': 'policy',
    'event-report': 'entertainment',
    'news-brief': 'entertainment',
  };
  return map[type] ?? 'tech';
}
```

### フィーチャー記事のロジック

```ts
// 優先順: featured: true → なければ最新1件
const featuredArticle = reports.find(r => r.featured)
  ?? [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
```

---

## 5. 変更ファイル一覧

### 新規作成

| ファイル | 内容 |
|---|---|
| `components/NewsCard.tsx` | 記事カード（RobotCard ホバーパターンの簡易版） |
| `components/NewsBentoCard.tsx` | フィーチャー帯の大/小カード（BentoGrid のカード部分をニュース向けに書き直し） |
| `lib/reportDisplay.ts` | `inferCategoryFromType`、`getReadingTimeLabel` 等のユーティリティ |

### 変更

| ファイル | 変更内容 |
|---|---|
| `components/ReportsBrowser.tsx` | ページ全体の再構築（主要変更） |
| `data/types.ts` | `ReportCategory` 型、`ReportType` 追加値、`Report.category` / `Report.readingTimeMin` フィールド追加 |
| `data/reports.ts` | 既存3件に `category` フィールドを追加 |
| `lib/labels.ts` | `reportCategoryLabels` を追加 |
| `src/app/globals.css` | Marquee 用 CSS 変数 2個追加（shadcn add が自動挿入） |

### インストール（shadcn add でコードコピー）

```bash
npx shadcn@latest add "@magicui/bento-grid"
npx shadcn@latest add "@magicui/marquee"
```

### 変更しないファイル

- `src/app/reports/page.tsx` — `ReportsBrowser` を呼ぶだけ。変更不要
- `src/app/reports/[slug]/page.tsx` — 詳細ページは今回スコープ外
- `lib/reportFilters.ts` — フィルタロジックは既存を流用、`category` 対応を追加するのみ
- `components/FilterChipGroup.tsx` — タグフィルターはそのまま流用

---

## 6. 実装手順

### Phase 1: データ基盤（型 + ラベル + フィルタ）
1. `data/types.ts` に `ReportCategory`、`ReportType` 追加値、`Report` フィールドを追記
2. `lib/labels.ts` に `reportCategoryLabels` を追加
3. `lib/reportDisplay.ts` を新規作成（`inferCategoryFromType`）
4. `data/reports.ts` の既存3件に `category` を追加
5. `lib/reportFilters.ts` に `category` フィルタ条件を追加
6. `npm run build` で型エラーがないことを確認

### Phase 2: コンポーネント追加
7. `npx shadcn@latest add "@magicui/bento-grid"` を実行
8. `npx shadcn@latest add "@magicui/marquee"` を実行
9. インストールされた `components/ui/bento-grid.tsx` を Deploid デザインに修正（rounded 削除、shadow → border、色トークン化）

### Phase 3: ニュースカードコンポーネント
10. `components/NewsCard.tsx` を作成（RobotCard のホバーパターンを参照して簡素化）
11. `components/NewsBentoCard.tsx` を作成（BentoGrid のコンテナを流用、カード内部はニュース向けに書き直し）

### Phase 4: ReportsBrowser 再構築
12. `components/ReportsBrowser.tsx` を新ゾーン構成に書き直し
    - Marquee → Tabs → TagFilter → BentoGrid → NewsCard グリッド → 最新リスト → サイドバー

### Phase 5: 検証
13. `npm run build` を通す
14. `npm run dev` で各ゾーンを目視確認

---

## 7. カスタマイズ要件まとめ

| コンポーネント | 変更点 | 理由 |
|---|---|---|
| BentoGrid/BentoCard | `rounded-xl` → `rounded-none` | Deploid シャープエッジ方針 |
| BentoCard | `box-shadow` → `border border-border` | シャドウ過剰禁止 |
| BentoCard | `text-neutral-700` → `text-foreground` | デザイントークン外 |
| BentoCard | `Icon` prop → `heroImage` prop | ニュースカード向けに再設計 |
| BentoCard | `ArrowRightIcon`(@radix-ui) → Lucide `ArrowRight` | 既存ライブラリに統一 |
| Marquee | CSS 変数 `[--duration:50s]` | スクロール速度を落とす |
| NewsCard | RobotCard より控えめな tilt/glow | ニュースは情報密度が主役 |

---

## 8. 影響範囲

| 影響先 | 内容 |
|---|---|
| `/reports` 一覧 | 全面的に UI が変わる |
| `/reports/[slug]` 詳細 | 今回変更なし（今後の別タスク） |
| Home の最新記事セクション | `Report` 型に `category` が追加されるが `optional` なので影響なし |
| `lib/data.ts` の `getReports()` | 変更なし |
| 型チェック全体 | `ReportType` に値を追加するため、switch 文で網羅チェックをしている箇所がコンパイルエラーになる可能性 → Phase 1 で対処 |

---

## 9. リスク

| リスク | 重大度 | 対処 |
|---|---|---|
| `@radix-ui/react-icons` が BentoGrid に付随インストールされる | 低 | Lucide に差し替えて deps を増やさない |
| BentoGrid の `auto-rows-[22rem]` が記事カードに合わない | 中 | Phase 3 でカードの高さを実測して調整 |
| `ReportType` switch 文の網羅チェック漏れ | 中 | Phase 1 で `npm run build` を通して確認 |
| heroImage が未設定の記事でカードが崩れる | 中 | フォールバック表示（カテゴリ名 + 背景色）を必ず実装 |
| Marquee の CSS アニメーションが `prefers-reduced-motion` に対応していない | 低 | `globals.css` に `@media (prefers-reduced-motion: reduce)` を追加 |

---

## 10. 検証コマンド

```bash
npm run build   # TypeScript 型チェック + 全ページ SSG 生成
npm run dev     # 開発サーバーで目視確認
```

（`lint` / `typecheck` の単体スクリプトはプロジェクトに未設定）

---

## 11. 手動確認項目

### 機能
- [ ] タブ切替でフィルタが効いている（URL に `?tab=tech` 等が反映される）
- [ ] タグフィルターとタブの組み合わせが正常動作する
- [ ] `featured: true` の記事が Bento 大カードに表示される
- [ ] `featured` なし時は最新記事が自動的にフィーチャーされる
- [ ] Marquee が一時停止（`pauseOnHover`）する

### 表示
- [ ] heroImage あり/なし両方でカードが崩れない
- [ ] Bento グリッドが 3cols/2cols/1col と正しく崩れる
- [ ] Marquee がモバイルで適切に動作する

### デザイン方針チェック
- [ ] BentoCard に rounded-xl が残っていないか
- [ ] box-shadow ではなく border になっているか
- [ ] グラデーションが混入していないか
- [ ] カラートークン外の色（neutral-XXX 等）が残っていないか

---

## 12. 今回スコープ外（次フェーズ）

- `/reports/[slug]` 詳細ページのリッチ化（ヒーロー画像全幅・ArticleToc 導入）
- ページネーション or infinite scroll
- 記事の `readingTimeMin` 自動計算
- フィーチャー記事の管理 UI（CMS 移行時）
