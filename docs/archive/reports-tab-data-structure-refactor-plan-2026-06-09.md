# 記事タブ データ構造リファクタ — 実装計画 (2026-06-09, rev4)

> 目的：記事（reports）タブの分類を、ニュース運営に耐える適切なデータ構造へ整理する。
> 本書は `ai_implementation_workflow_prompt.md` の手順（計画→自己監査→修正版計画）に沿う。
>
> **rev2 注記**：rev1 は「`category` は冗長 → 削除し `type` から導出」としていたが、実データ照合により誤りと判明。撤回した。下記「前提の訂正」参照。
> **rev3 注記**：runtime SoT の置き場所（`lib/display.ts`）、型名の責務分離（`ReportSection`/`ReportSectionFilter`）、旧 `?category=` 直接アクセスの非正規化方針を確定。自己監査 #8〜#10 参照。
> **rev4 注記**：section 完全性の強制を多層化（`Record` 型のコンパイル時＋labels↔order diff の validate 時）。`reportSectionOrder` 単体に網羅責務を負わせない。自己監査 #11 参照。

## 前提の訂正（rev1 → rev2）

rev1 は「`type` がコンテンツ形式の真実源で、`category` はそこから導出できる冗長フィールド」と仮定した。**実データ照合の結果これは偽**：

| type | 実データ上の category 分布 |
|---|---|
| `deployment-report` | deployment ×4（1対1）✓ |
| `tech-update` | tech ×3（1対1）✓ |
| `market-analysis` | business ×4（1対1）✓ |
| `policy-update` | policy ×2（1対1）✓ |
| `case-study` | deployment ×1（1対1）✓ |
| **`news-brief`** | **business / entertainment / tech に分散** |
| **`analysis`** | **tech / business に分散** |

`type` = **フォーマット（どう書かれた記事か）**、`category` = **サブジェクト（何の話か）**で、本来直交する2軸。`news-brief`（短報）はバイラル動画の話にも価格の話にもなり得るため、`type` からタブを導出すると編集意図が失われる。

→ **結論：`category` フィールドは削除しない。`section` にリネームし、`type` から導出せず記事ごとに明示指定する必須フィールドとして正式化する。**

## 設計

| 軸 | フィールド | 役割 | UI |
|---|---|---|---|
| フォーマット | `type`（9種・**据え置き**） | どう書かれた記事か | NewsCard のチップ＋`getReportTypeTone` |
| サブジェクト | **`section`**（`category` を改称・**必須**） | 何の話か＝タブ分類 | reports タブ |

`section` は `type` と独立に編集者が指定する。`field`（取材・現場）等の type 由来タブは新設しない（type 導出を行わないため空タブ問題が発生しない）。

### 型名と runtime 正本の責務分離（rev3 で訂正）

- **データ型**：`data/types.ts` に `type ReportSection`（union, 5値）。`Report.section: ReportSection`（必須）。`data/types.ts` は現状どおり**型のみ**に保つ。
- **UIフィルタ型**：`lib/reportSections.ts` に `type ReportSectionFilter = ReportSection | 'all'`（`all` はUI専用なのでデータ型から分離）。
- **完全性の正本（コンパイル時）**：`lib/labels.ts` の `reportSectionLabels: Record<ReportSection, string>`。`Record` 型により union の**全値にラベルが要求**され、section 追加時にラベル漏れがコンパイルエラーになる。
- **表示順の正本（runtime）**：`lib/display.ts` に `export const reportSectionOrder: ReportSection[]`。タブ表示順を持つ実行時配列。
  - 根拠：`display.ts` には既に `robotCategoryOrder` / `reportTypeOrder` 等の同型 runtime 配列があり、`validate.ts` が相対 import している（alias-free・既存規約）。
  - レビュー提案（runtime を `data/types.ts` に置く）より既存規約に合致するため、こちらを採る。`validate.ts` は UI 用 `reportSections.ts`（path alias と `all` を含む）を**読まない**ため、`scripts/validate-data.mjs`（node）でも壊れない。`labels.ts` は `import type` のみ＝alias-free なので validate から相対 import 可。
- **網羅強制（validate 時）**：`reportSectionOrder` は `ReportSection[]` 型だけでは union 全値の網羅を保証しない（各要素が有効なだけ）。また `checkOrderCoverage` は実データ出現値しか見ない。そこで validate に **`Object.keys(reportSectionLabels)`（=完全集合）と `reportSectionOrder` の双方向 diff チェック** を追加し、order 配列の section 追加漏れ・余剰を実データに依存せず検出する。

### セクション分類（英語トークンは識別子として据え置き、日本語ラベルのみ整理）

| section value | ラベル | description（ツールチップ） | 現データ件数 |
|---|---|---|---|
| `all` | すべて | — | 20 |
| `deployment` | 導入・事例 | 実稼働・PoCの結果、現場導入レポート | 5 |
| `business` | 市場・動向 | 資金調達、量産、市場予測、価格、業界の動き | 7 |
| `tech` | 技術・製品 | 新モデル発表、技術デモ、性能分析 | 5 |
| `policy` | 政策・規制 | 法規制、安全基準、行政の動き | 2 |
| `entertainment` | 話題・その他 | バイラル動画、一般向け話題、カルチャー | 1 |

→ 空タブなし。`entertainment` はトークン据え置き・ラベルのみ「話題・その他」に。一般ヒューマノイドニュースの受け皿として維持。

### URL パラメータ名

`?category=` → **`?section=`**（確定）。`useUrlFilters.updateParams` は既存queryにマージするため、タブ選択時は **`{ section, category: null, [REPORT_PAGE_PARAM]: null }` を同時更新**し、旧 `?category=` 除去とページリセットを保証する（現行 ReportsHeader の page リセット挙動を維持）。

**直接アクセス（`/reports?category=business` でのランディング）は正規化しない**（rev3 決定）。`useActiveReportSection` は `section` のみ読み、未知の `category` param は無視されるだけで表示は `all` になり実害なし。load時 `router.replace` による正規化 effect は追加しない（未公開MVPで旧リンクのブックマークは存在せず、毎ロードの replace は flicker・複雑性の割に便益ゼロ＝KISS）。手動確認の「旧 `?category=` が残らない」は**タブクリック経路のみ**を対象とする。

## 調査したファイル（事実ベース）

| 層 | ファイル | 役割 / 確定事項 |
|---|---|---|
| 型 | `data/types.ts` | `ReportCategory`(5) / `Report.category?` 定義 |
| データ | `data/reports.ts` | 20件、全件が `category` を手書き（L9〜565）。type×category は上表のとおり非関数 |
| 分類ロジック | `lib/reportDisplay.ts` | `typeToCategoryMap`/`inferCategoryFromType`/`getReportCategory`（**導出ロジックは廃止**） |
| タブ定義 | `lib/reportCategories.ts` | `REPORT_CATEGORY_TABS`/`normalizeReportCategoryParam` |
| ラベル | `lib/labels.ts` | `reportCategoryLabels`(L137) |
| フィルタ | `lib/reportFilters.ts` | `getReportCategory` で絞り込み |
| URL state | `lib/useActiveReportCategory.ts` | `?category=` を読む |
| UI | `components/ReportsHeader.tsx` / `ReportsBrowser.tsx` | タブ描画・グリッド |
| 共通タブ | `components/PageTabBar.tsx` | `PageTab<T>{value,label}`。robots と共用 |
| 検証 | `lib/validate.ts` + `npm run validate:data` / `npm run build` | report の section 整合性チェックは**未整備（追加する）** |

**無影響を確認したポイント：**
- `NewsCard` は `report.type` のみ表示（`reportTypeLabels`+`getReportTypeTone`）。`section` はカードに出ない。
- `search.ts` は type/tags/whyItMatters 等を索引。`category` 不参照。
- `validate.ts` の `checkOrderCoverage` は `robot.category` のみ。report 側 order 検証は無い。
- `getReportTypeTone`/`reportTypeTones` は9 type 全網羅。tone は触らない。
- `radix-ui@1.4.3` 導入済み → Tooltip は新規依存なしで使用可。

## 変更するファイル

| ファイル | 変更 |
|---|---|
| `data/types.ts` | `ReportCategory` → `type ReportSection`（union, 5値）。`Report.category?` → **`section: ReportSection`（必須）**。型のみ |
| `lib/display.ts` | `reportSectionOrder: ReportSection[]` を追加（runtime SoT。既存 `reportTypeOrder` の隣） |
| `data/reports.ts` | 全20件 `category:` → `section:`（**データ名の突合**。値は据え置き） |
| `lib/reportDisplay.ts` | `typeToCategoryMap`/`inferCategoryFromType`/`getReportCategory` を**削除**（導出をやめ section を直接参照） |
| `lib/reportCategories.ts` → **`lib/reportSections.ts` に改名** | `REPORT_SECTION_TABS`（`reportSectionOrder`+`all`、各タブに `description`）、`type ReportSectionFilter = ReportSection \| 'all'`、`normalizeReportSectionParam` |
| `lib/labels.ts` | `reportCategoryLabels` → `reportSectionLabels: Record<ReportSection, string>`（ラベルは「話題・その他」に） |
| `lib/reportFilters.ts` | 引数 `category`→`section`、`r.section` を直接比較 |
| `lib/useActiveReportCategory.ts` → **`lib/useActiveReportSection.ts` に改名** | param `section` を読む |
| `components/ReportsHeader.tsx` | 新フック・新定数、`updateParams({ section, category: null, [REPORT_PAGE_PARAM]: null })` |
| `components/ReportsBrowser.tsx` | フック名・filter引数を section に追従（ロジック不変） |
| `components/PageTabBar.tsx` | `PageTab` に `description?` 追加（任意）。あれば Radix Tooltip でラップ |
| `lib/validate.ts` | (a) `checkOrderCoverage('report.section', reports.map(r => r.section), reportSectionOrder)`（既存ヘルパ再利用、実データの未登録値検出）。(b) `reportSectionLabels` のキー集合と `reportSectionOrder` の双方向 diff チェック（order 配列の網羅漏れ・余剰を実データ非依存で検出）。両者を相対 import |

## 変更しないファイル

`NewsCard` / `NewsFeatureCard` / `NewsHeroCarousel`（type表示のみ）、`reportPlacements.ts`、`reportPagination.ts`、`useUrlFilters.ts`、`visualSemantics.ts`、`RobotsHeader.tsx`（`PageTab.description` は任意なので無影響）。

## PageTabBar Tooltip 実装方針（指摘#5反映）

- `PageTab` に `description?: string` を追加（任意）。`undefined` のタブ（robots側全タブ・reports の `all`）は Tooltip でラップせず素の `button` のまま → **robots側にDOM副作用なし**。
- Radix `Tooltip.Provider` は `PageTabBar` 内に1つ配置（`delayDuration` 設定）。各タブは `Tooltip.Root` > `Tooltip.Trigger asChild` で既存の `button role="tab"` をそのまま包む（roleと既存classを保持）。`Tooltip.Portal` + `Tooltip.Content` で表示。
- キーボードfocus・hover両対応（Radix標準）。モバイルは press で表示。

## スコープ外（別フェーズ提案）

`tags` の `kind:'report'` におけるエンティティ名（`figure`/`bmw`/`unitree` 等）とトピックの混在分離。`data/reports.ts` 全件＋`tagRegistry`＋`validate`＋`NewsCard`表示に波及するため Phase 2 として分離。

## 実装手順

1. `data/types.ts`：`type ReportSection` 定義、`section` 必須化（型エラーを全箇所へ波及させ漏れ検出）
2. `lib/display.ts`：`reportSectionOrder: ReportSection[]` を追加（runtime SoT）
3. `data/reports.ts`：20件 `category:`→`section:`
4. `lib/reportDisplay.ts`：導出ロジック削除
5. `lib/reportSections.ts`（改名・`reportSectionOrder`+`all` から `REPORT_SECTION_TABS` 構築）→ `labels.ts` → `reportFilters.ts` → `useActiveReportSection.ts`（改名）の順で型エラーを潰す
6. `ReportsHeader.tsx` / `ReportsBrowser.tsx` を section・param `section`・同時リセットに追従
7. `PageTabBar.tsx` に `description?` ＋ Radix Tooltip
8. `lib/validate.ts` に `checkOrderCoverage` で section 整合性チェック追加
9. `npm run validate:data` → `npm run build`

## ユーザーに見える変化（指摘#3反映）

- タブのラベルと並び：技術/ビジネス/導入事例/政策規制/エンタメ → 導入・事例/市場・動向/技術・製品/政策・規制/話題・その他
- タブ hover/focus でツールチップ表示
- URL：`?category=` → `?section=`（値トークンは据え置き）
- **タブごとの記事集合は現状の category 振り分けと同一**（セクション値を据え置くため移動なし）。空タブなし。
- 不変：グリッド、カード、ヒーロー、ページネーション、カード上の type チップ・タグ表示

## リスクと軽減

| リスク | 軽減 |
|---|---|
| `category`→`section` 改名漏れ | 型を必須化し改名するのでビルドで全箇所検出 |
| 旧 `?category=` がURLに残留（タブクリック経路） | タブ選択時に `category: null` 同時更新 |
| 旧 `?category=` での直接アクセス | 正規化しない（無視され表示は `all`、実害なし）。load時 replace effect は追加しない（KISS） |
| 既存の section 値に編集的な誤りが残る（例：`sample-market-size-2026` が tech、`sample-tesla-optimus-demo-update` が tech）| 値は機械移行で据え置き。編集的見直しは別タスク（要レビュー、本リファクタのスコープ外） |
| Tooltip がrobots側に副作用 | `description` 任意・undefined時は素のbutton |
| 将来の section 追加漏れ | 多層防御：(1) `reportSectionLabels: Record<ReportSection,string>` でラベル漏れをコンパイル時検出、(2) validate の labels↔order diff で order 配列漏れを検出、(3) `checkOrderCoverage` で実データの未登録値を検出。※`reportSectionOrder: ReportSection[]` 単体では union 網羅は強制されない点に留意 |

## 検証

- `npm run validate:data`（section整合性・タグ・日付・関連slug・掲載枠）
- `npm run build`（型・SSG）
- 手動：6タブ切替・URL直アクセス（`?section=xxx`）・戻る/進む・タブhover/focusツールチップ・モバイル幅・`?section=`不正値→all・**タブクリック後**に旧`?category=`が残らない（直接アクセス時の残留は正規化対象外＝表示`all`で問題なし）

## 自己監査（rev1監査 + rev2レビュー反映）

| # | 指摘（出所） | 重大度 | 対応 |
|---|---|---|---|
| 1 | type→category は純粋関数でない。category は編集セクション（rev2レビュー） | 重大 | **計画の前提を訂正**。削除をやめ `section` として正式化（反映済） |
| 2 | URL更新が category 除去とページリセットを保証していない（rev2レビュー） | 中 | `{ section, category: null, page: null }` 同時更新を明記（反映済） |
| 3 | ユーザー影響が過小・field空タブ（rev2レビュー） | 中 | field新設せず空タブ回避。件数変化を本文明記（反映済） |
| 4 | category 概念の命名が残る（rev2レビュー） | 低 | `reportSections.ts`/`REPORT_SECTION_TABS`/`useActiveReportSection` に統一（反映済） |
| 5 | Tooltip 実装詳細不足（rev2レビュー） | 低 | Provider/Trigger asChild/Portal・robots無副作用を明記（反映済） |
| 6 | `reportCategoryLabels` 削除で他参照破損 | 低 | grep済：参照は当該lib内のみ。`reportSectionLabels` に改名 |
| 7 | `NewsCard`/`search`/`validate` の category 参照 | 低 | 調査済：いずれも未参照（NewsCardはtype）。無影響 |
| 8 | section 値の runtime 正本が未定義（union型だけでは実行時検証不可。`reportSections.ts` を validate から読むと alias/`all` で node 実行が壊れる）（rev3レビュー） | 中 | runtime SoT を `lib/display.ts` の `reportSectionOrder` に置き、`validate.ts` が相対 import。UI 用 `reportSections.ts` は validate から読まない（反映済） |
| 9 | 型名 `ReportTabSection` が UI 専用概念に見える（rev3レビュー） | 低 | データ型 `ReportSection` / UIフィルタ `ReportSectionFilter` に責務分離（反映済） |
| 10 | 旧 `?category=` 直接アクセスの正規化が曖昧（rev3レビュー） | 低 | 正規化しない方針を明文化。手動確認をタブクリック経路に限定（反映済） |
| 11 | `reportSectionOrder: ReportSection[]`+`checkOrderCoverage` では union 網羅を強制できない（配列型は各要素のみ保証、coverage は実データ出現値のみ）（rev4レビュー） | 低 | 完全性は `reportSectionLabels: Record<>`（コンパイル時）＋ labels↔order diff（validate時）で担保。order 単体に網羅責務を負わせない旨を明記（反映済） |

## ステータス

rev4 計画確定・**実装未着手**。実験用ブランチへ計画を commit 後、実装フェーズへ。
