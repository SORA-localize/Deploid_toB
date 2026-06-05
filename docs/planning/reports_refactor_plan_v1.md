# Reports 安全リファクタリング計画 v1

作成日: 2026-06-05
対象ブランチ: experiment/reports-ui

---

## 目的

記事ページ実装後に残っている reports 周辺の問題を、AI が実行しても既存機能・データ構造を壊しにくい順序で解消する。

今回の主目的は以下。

- サンプル記事が本番表示される状態を解消する
- reports 周辺の検証失敗を解消する
- 明確な未使用コードだけを削除する
- `activeCategory` の重複計算を安全に共通化する

`Report.category` の削除や `onex-neo-preorder` の `type` 変更は、単なるリファクタではなく情報設計変更に該当するため、今回の実装対象から外す。

---

## 調査結果

### 確認したファイル

| ファイル | 確認内容 | 判断 |
|---|---|---|
| `data/reports.ts` | サンプル7件が `publishStatus: 'published'` かつ `sources: []` | 修正対象 |
| `data/types.ts` | `Report.category?: ReportCategory` は type と別の分類軸 | 維持 |
| `lib/data.ts` | `getReports()` は published のみ返す | draft 化で一覧・詳細生成・関連記事・sitemap から除外される |
| `lib/validate.ts` | draft も含めて全 reports の `sources` を検証する | validator 方針の明確化が必要 |
| `lib/reportDisplay.ts` | `getReportCategory()` は category fallback を持つ | 維持 |
| `lib/reportFilters.ts` | `filters.type` は現状 `all` のみだが将来拡張用の入口 | 維持 |
| `components/ReportsBrowser.tsx` | `activeCategory` を URL から算出 | 共通化対象 |
| `components/ReportsHeader.tsx` | 同じ `activeCategory` 算出が重複 | 共通化対象 |
| `components/NewsHero.tsx` | 実コードから import なし | 削除候補 |
| `components/ui/bento-grid.tsx` | 実コードから import なし | 削除候補 |

### 実行した検証

```bash
npm run build
```

結果: 成功。

```bash
npm run validate:data
```

結果: 失敗。サンプル7件の `sources` が空。

---

## 重要な設計判断

### 1. `Report.category` は削除しない

現状の `type` は記事フォーマット、`category` は `/reports` のタブ分類として使われている。

例: `onex-neo-preorder`

- `type: 'news-brief'`
- `category: 'business'`

これは「短いニュース形式の記事だが、分類はビジネス」という意味を表せる。`category` を削除すると、この情報を `type` に押し込む必要があり、表示ラベルや分類の意味が変わる。

したがって、今回の AI 実装では以下を禁止する。

- `data/types.ts` から `Report.category` を削除しない
- `data/reports.ts` から `category:` を削除しない
- `onex-neo-preorder` の `type` を変更しない
- `getReportCategory()` の fallback を削除しない

### 2. `filters.type` は削除しない

`ReportsBrowser` からは現在 `type: 'all'` しか渡していないが、`filterReports()` は reports 用の汎用フィルタ関数として `type`, `category`, `topic`, `query` を受け取る形になっている。

今回 `type` を消すと、将来 type フィルタを URL state に戻す時に再追加が必要になる。実害のある重複ではないため維持する。

### 3. `activeCategory` は hook で共通化する

`ReportsHeader` から `ReportsBrowser` に値を返す設計や Context 化は不要。

安全な方針:

- `CATEGORY_TABS` 相当の定義は `lib/reportCategories.ts` に分離する
- `useActiveReportCategory()` を新規作成する
- `ReportsBrowser` と `ReportsHeader` の両方でその hook を使う

追加ファイル:

- `lib/reportCategories.ts`
- `lib/useActiveReportCategory.ts`

`reportCategories.ts` は `REPORT_CATEGORY_TABS` と `normalizeReportCategoryParam()` を持つ純粋な lib にする。
`useActiveReportCategory.ts` は client hook として `useUrlFilters()` を使い、URL の `category` param を `ReportCategory | 'all'` に正規化する。

---

## 最終変更ファイル一覧

### 変更する

| ファイル | 変更内容 |
|---|---|
| `data/reports.ts` | サンプル7件の `publishStatus` を `draft` に変更 |
| `lib/validate.ts` | reports の `source-empty` 必須チェック対象だけを published に限定する |
| `lib/reportCategories.ts` | カテゴリタブ定義と URL param 正規化を新規追加 |
| `lib/useActiveReportCategory.ts` | `activeCategory` 算出 hook を新規追加 |
| `components/ReportsBrowser.tsx` | 重複した `activeCategory` 算出を hook 利用に置換 |
| `components/ReportsHeader.tsx` | 重複した `activeCategory` 算出を hook 利用に置換 |

### 削除する

| ファイル | 条件 |
|---|---|
| `components/NewsHero.tsx` | 実装直前に `rg -n "\bNewsHero\b" components src lib data -g '!components/NewsHero.tsx'` で外部参照ゼロを再確認できた場合のみ削除 |
| `components/ui/bento-grid.tsx` | 実装直前に `rg -n "\bBentoGrid\b|bento-grid" components src lib data -g '!components/ui/bento-grid.tsx'` で外部参照ゼロを再確認できた場合のみ削除 |

### 変更しない

- `data/types.ts`
- `lib/reportDisplay.ts`
- `lib/reportFilters.ts`
- `lib/display.ts`
- `lib/labels.ts`
- `src/app/reports/page.tsx`
- `src/app/reports/[slug]/page.tsx`
- `components/NewsHeroCarousel.tsx`
- `components/NewsBentoCard.tsx`
- `components/NewsCard.tsx`

---

## 実装手順

### Phase 0: 実装前ガード

実装前に以下を必ず実行する。

```bash
git status --short --branch
rg -n "\bNewsHero\b" components src lib data -g '!components/NewsHero.tsx'
rg -n "\bBentoGrid\b|bento-grid" components src lib data -g '!components/ui/bento-grid.tsx'
rg -n "report\\.category|\\.category" components src lib data
```

確認事項:

- 既存の未コミット変更を把握する
- 削除候補が実コードから参照されていないこと
- `Report.category` 直接参照を消す作業に誤って進まないこと

### Phase 1: サンプル記事の本番表示除外

`data/reports.ts` の `sample-` prefix 7件を以下のように変更する。

```ts
publishStatus: 'draft'
```

注意:

- `slug` は変更しない
- `category` は削除しない
- `type` は変更しない
- `sources` はこの phase では追加しない

影響:

- `/reports` 一覧から sample 記事が消える
- Home の最新記事から sample 記事が消える
- `/reports/sample-...` の詳細ページは published 対象外になり 404 になる
- `generateStaticParams()` の reports 件数が sample 分減る
- sitemap の report URL から sample 記事が消える
- ロボット・メーカー・ユースケース詳細の関連記事から sample 記事が消える

### Phase 2: データ検証の方針修正

現状 `validateData()` は draft を含む全 reports に `sources` を要求する。
サンプル記事を draft にしても `npm run validate:data` は失敗するため、validator 側の方針を明確化する。

推奨実装:

- `source-empty` は `publishStatus === 'published'` の report にだけ必須とする
- draft についても日付・slug重複・関連slug・タグ登録は引き続き検証する

理由:

- draft は未完成データとして保持できる
- published の品質基準は維持できる
- sample の `sources: []` が本番品質チェックを壊さない

### Phase 3: `activeCategory` 共通化

`lib/useActiveReportCategory.ts` を追加する。

想定 API:

```ts
'use client';

import { useMemo } from 'react';
import {
  normalizeReportCategoryParam,
  type ReportCategoryFilter,
} from '@/lib/reportCategories';
import { useUrlFilters } from '@/lib/useUrlFilters';

export function useActiveReportCategory(): ReportCategoryFilter {
  const { getParam } = useUrlFilters();

  return useMemo(
    () => normalizeReportCategoryParam(getParam('category')),
    [getParam],
  );
}
```

`components/ReportsBrowser.tsx`:

- `useUrlFilters`, `ReportCategory`, `CATEGORY_TABS` 相当の component 依存、`useMemo` による activeCategory 計算を削除
- `useActiveReportCategory()` を使う

`components/ReportsHeader.tsx`:

- `useMemo` import を削除
- `activeCategory` 計算を `useActiveReportCategory()` に置換
- `updateParams` は引き続き `useUrlFilters()` から取得する
- タブ配列は `REPORT_CATEGORY_TABS` を `lib/reportCategories.ts` から import する

注意:

- Context は追加しない
- `ReportsHeader` から親へ値を返す設計にしない
- URL param のキー `category` は変更しない
- `lib/useActiveReportCategory.ts` から `components/ReportsHeader.tsx` を import しない

### Phase 4: 明確な未使用コード削除

実装直前に以下を再確認する。

```bash
rg -n "\bNewsHero\b" components src lib data -g '!components/NewsHero.tsx'
rg -n "\bBentoGrid\b|bento-grid" components src lib data -g '!components/ui/bento-grid.tsx'
```

実コード参照がゼロなら削除する。

- `components/NewsHero.tsx`
- `components/ui/bento-grid.tsx`

注意:

- `docs/planning` 内の過去計画参照は削除判断に含めない
- `NewsHeroCarousel` と `NewsBentoCard` は削除しない

---

## AI 実装時の禁止事項

- `Report.category` を削除しない
- `ReportCategory` 型を削除しない
- `typeToCategoryMap` を削除しない
- `getReportCategory()` を `inferCategoryFromType(report.type)` だけに変更しない
- `onex-neo-preorder` の `type` を変更しない
- `filterReports()` から `filters.type` を削除しない
- `src/app/reports/[slug]/page.tsx` を変更しない
- 関連 slug、タグ、日付、sources の値を推測で追加しない
- 過去 docs の参照を理由に実コードを広範囲検索置換しない

---

## 影響範囲

| 影響先 | 内容 |
|---|---|
| `/reports` | sample 記事が非表示になる |
| `/reports?category=...` | category filter は維持 |
| `/reports/sample-...` | draft 化により 404 になる |
| Home 最新記事 | sample 記事が非表示になる |
| sitemap | sample report URL が sitemap から消える |
| ロボット・メーカー・ユースケース詳細の関連記事 | sample report が関連記事から消える |
| `npm run validate:data` | published report の source 品質を維持しつつ sample draft で失敗しない状態を目指す |
| Reports UI | タブ状態の算出元が hook に共通化されるが、URL state は変更しない |

---

## リスクと対処

| リスク | 重大度 | 対処 |
|---|---|---|
| sample 詳細URLが 404 になる | 中 | draft 化の意図として受け入れる。必要なら別途 preview 導線を設計する |
| validator を緩めすぎる | 中 | `source-empty` だけを published 限定にし、slug・tag・relation 検証は draft も継続する |
| hook が client-only 依存を増やす | 低 | 既存の `ReportsBrowser` / `ReportsHeader` はどちらも client component なので許容 |
| hook と `ReportsHeader` の循環依存 | 中 | タブ定義と正規化を `lib/reportCategories.ts` に分離し、hook から component を import しない |
| 未使用コード削除で将来再利用候補が消える | 低 | 実コード参照ゼロの場合のみ削除。必要なら docs のみ残す |
| category/type の情報設計問題が残る | 中 | 今回は保留。CMS 設計時に `type` と `category` の責務を再決定する |

---

## 検証コマンド

存在する scripts のみ実行する。

```bash
npm run validate:data
npm run build
```

必要に応じて手動確認用に起動する。

```bash
npm run dev
```

---

## 手動確認チェックリスト

- [ ] `/reports` に sample 記事が表示されない
- [ ] `/` の最新記事に sample 記事が表示されない
- [ ] `/reports?category=business` で business 記事が表示される
- [ ] `/reports?category=deployment` で deployment 記事が表示される
- [ ] 無効な category param 例 `/reports?category=unknown` が「すべて」扱いになる
- [ ] カテゴリタブの選択状態が URL と一致する
- [ ] ブラウザ戻る/進むでカテゴリタブと記事一覧が破綻しない
- [ ] `/reports/sample-atlas-factory-demo` が 404 になることを確認する
- [ ] `npm run validate:data` が成功する
- [ ] `npm run build` が成功する

---

## 今回スコープ外

- `Report.category` 削除
- `onex-neo-preorder` の `type` 変更
- CMS フォーム項目の最終設計
- report type/category の分類体系再設計
- Reports UI の大幅レイアウト変更
- `NewsHeroCarousel` のデザイン調整
- タグ登録の自動バリデーション追加
- `@radix-ui/react-icons` の dependency cleanup（別件の package 差分と分けて実施）
