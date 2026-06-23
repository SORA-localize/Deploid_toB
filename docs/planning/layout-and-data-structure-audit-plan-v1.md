# Layout And Data Structure Audit Plan v1

Status: active/unimplemented plan — investigation (Phase 1-4) complete, fixes not yet implemented
Last updated: 2026-06-23

この文書は、Deploid 全体のテキスト表示レイアウトと、ページ上の文字情報が適切なデータ構造から供給されているかを調査するための実行計画です。

この計画は実装判断の正本ではありません。調査完了後は、結果を修正計画・実装・正本文書へ反映し、この文書は archive へ移動します。

## 背景

一部の静的ページで、画面幅に対して本文の表示領域が不自然に狭く、早い位置で折り返されている。特に会社概要、プライバシーポリシー、問い合わせ、メーカー・代理店向けページでは、ページごとの個別 grid や `max-width` 指定が混在している可能性がある。

また、全ページの文字情報について、事実データ、UI文言、静的本文、法務・ポリシー文言、権利関連情報が適切な場所に置かれているかを確認する必要がある。

## 参照する正本

調査時は、以下を現在の判断基準として使う。

- `docs/planning/README.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/copyright_and_media_rights_policy_v1.md`
- `docs/planning/editorial_style_guide_v1.md`
- `docs/planning/humanoid_media_IA_v1.md`

実装の正本は、常に現行コードと型定義を優先する。

- `src/app/globals.css`
- `data/types.ts`
- `lib/data.ts`
- `lib/uiText.ts`
- `lib/tagRegistry.ts`
- `lib/labels.ts`
- `lib/display.ts`
- `lib/validate.ts`

## 調査対象

### ページ

全 route の `page.tsx` と、ページから直接使われる表示コンポーネントを対象にする。

- `/`
- `/robots`
- `/robots/[slug]`
- `/manufacturers`
- `/manufacturers/[slug]`
- `/reports`
- `/reports/[slug]`
- `/guides`
- `/guides/[slug]`
- `/use-cases`
- `/use-cases/[slug]`
- `/compare`
- `/about`
- `/privacy`
- `/contact`
- `/for-manufacturers`
- error / not-found

### 文字情報の分類

ページ上の文字情報は、以下に分類して調査する。

- `record_fact`: ロボット、メーカー、記事、ガイド、用途、導入事例などの事実情報
- `ui_text`: ナビ、ボタン、フィルター、タブ、空状態、補助ラベル
- `static_page_content`: 会社概要、問い合わせ案内、メーカー向け説明などの固定本文
- `legal_policy`: プライバシーポリシー、免責、問い合わせ先、運営者情報
- `derived_value`: 掲載件数、最終更新日、カテゴリ数など算出できる値
- `rights_sensitive`: ロゴ、画像、引用、外部動画、掲載許諾、クレジットに関係する文言

## 調査観点

### A. レイアウト構造

1. `site-container`、`site-container-content`、`content-col`、ページ固有の `max-w-*` がどこで使われているか確認する。
2. 画面幅に対して本文が不自然に狭い箇所を特定する。
3. `md:grid-cols-[8rem_1fr]` など、固定値の grid が本文幅を圧迫していないか確認する。
4. 同じ見た目の定義リスト、セクション、問い合わせフォームがページごとに独自実装になっていないか確認する。
5. 記事本文や詳細ページの読みやすさ目的の幅制限と、静的情報ページの不要な幅制限を分けて判断する。
6. mobile / tablet / desktop / wide desktop で、折り返し、余白、列幅、テキスト重なりを確認する。

### B. データ構造

1. ページが `data/*.ts` を直接 import していないか確認する。
2. 事実情報が `lib/data.ts` 経由の構造化データから供給されているか確認する。
3. `record_fact` に source / reliability / checkedAt 相当の確認経路があるか確認する。
4. `ui_text` がページ内に散らばりすぎていないか、`lib/uiText.ts` に寄せるべきものを洗い出す。
5. `static_page_content` を無理に data 化していないか、逆に複数ページで重複してズレる状態になっていないか確認する。
6. `derived_value` がハードコードされていないか確認する。
7. `rights_sensitive` が権利ポリシーと矛盾していないか確認する。
8. slug と id の責務が混ざっていないか確認する。
9. タグ、カテゴリ、表示ラベルが registry / labels / display の正本に沿っているか確認する。

## 実行手順

### Phase 1: インベントリ作成

目的: 全ページ、主要コンポーネント、データ供給元、幅制限を一覧化する。

実行内容:

- `src/app` の全 `page.tsx` を列挙する。
- 各ページが import している主要 components / lib / data を記録する。
- `max-w-`, `grid-cols-[`, `content-col`, `site-container`, `prose`, `ch` 系の指定を検索する。
- ページ内に直接書かれた日本語本文、ラベル、説明文を抽出する。

成果物:

- route 別の layout source map
- route 別の data/text source map
- 調査対象外にできるものと、詳細確認が必要なものの分離

### Phase 2: レイアウト問題の分類

目的: どの幅制限が意図的で、どれが不自然な折り返しの原因かを分ける。

実行内容:

- 静的情報ページの本文幅を優先確認する。
- 詳細ページの記事本文、カード内テキスト、フィルターUI、比較表は別カテゴリとして扱う。
- 同じ構造なのにページごとに個別 class になっている箇所を抽出する。
- 共通化候補を `StaticPageShell`、`StaticSection`、`DefinitionList`、`FormShell` などに分類する。

成果物:

- layout issue list
- 共通化候補リスト
- 修正優先度

優先度:

- P0: 文字が重なる、読めない、横スクロールが発生する
- P1: 大画面で本文が不自然に狭く、早く折り返される
- P2: 同じ構造が複数ページに重複し、今後ズレやすい
- P3: 見た目の微調整で済むもの

### Phase 3: データ配置の分類

目的: 文字情報が適切な場所に置かれているかを全ページで判定する。

実行内容:

- 各ページの文字情報を `record_fact` / `ui_text` / `static_page_content` / `legal_policy` / `derived_value` / `rights_sensitive` に分類する。
- `record_fact` は `data/*.ts` と `lib/data.ts` の構造に沿っているか確認する。
- `ui_text` は `lib/uiText.ts`、labels、display、tag registry に寄せるべきか確認する。
- `static_page_content` はページ内固定でよいものと、サイト共通 content に出すべきものを分ける。
- `legal_policy` は実際の利用サービス、問い合わせ経路、計測スクリプト、フォーム送信先と矛盾しないか確認する。
- `rights_sensitive` は権利ポリシーと照合する。

成果物:

- data placement issue list
- 移動不要の判断リスト
- 修正候補リスト

優先度:

- P0: 事実情報が未出典または誤った場所にあり、誤情報につながる
- P1: 変動する値がハードコードされ、更新漏れしやすい
- P2: UI文言や固定本文が重複し、ページ間でズレる
- P3: 直ちに問題ではないが、整理すると保守しやすい

### Phase 4: 修正計画への変換

目的: 調査結果を、そのまま実装できる粒度の修正計画に落とす。

実行内容:

- レイアウト修正とデータ構造修正を別の実装単位に分ける。
- 静的ページ共通レイアウトの導入範囲を決める。
- data / uiText / site content / legal policy の移動対象を決める。
- 修正対象外にする箇所を明記する。
- build / validate / visual check の検証項目を決める。

成果物:

- 修正実行計画
- 変更対象ファイル一覧
- 検証チェックリスト

## 初期仮説

調査開始時点では、以下を仮説として扱う。確定判断は Phase 1 から Phase 3 の結果で行う。

1. 会社概要、プライバシーポリシー、問い合わせ、メーカー・代理店向けページの狭い折り返しは、`content-col` とページ個別の固定 grid が主因の可能性が高い。
2. 記事本文や詳細ページの `ch` ベースの幅制限は、読みやすさのために意図された可能性が高く、静的情報ページの問題とは分けて扱う。
3. ロボット、メーカー、記事、ガイド、用途の主要事実データは、概ね `lib/data.ts` 経由で供給されている可能性が高い。
4. 静的ページの本文は、必ずしも data 化する必要はない。ただし、複数ページで繰り返されるサイト説明、更新される可能性のある件数・日付・サービス利用情報は整理対象になる。
5. 権利・素材・問い合わせ先・計測ツールに関する文言は、実装や運用実態と照合する必要がある。

## 調査で作る一覧

### Route Layout Table

| route | main component | container | max width | grid pattern | issue | priority |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | page.tsx + `HomeContentNavigator` 等 | `site-container` | `max-w-3xl`（コピー部分のみ） | 固定値なし | 問題なし | - |
| `/robots`, `/manufacturers`, `/reports`, `/guides`, `/use-cases`, `/compare` | 各 `*Browser`/`CompareClient` | `site-container` | ページ固有なし | フィルタバー等の可変 grid のみ | 問題なし | - |
| `/robots/[slug]` | page.tsx + `RobotStickyAside` | `site-container` | `max-w-3xl`（`dl`） | `lg:grid-cols-[1fr_280px]`、`sm:grid-cols-[8rem_1fr]` を同一ファイル内に2回直書き | 同一構造の重複。共有化候補 | P2 |
| `/manufacturers/[slug]` | `ManufacturerDetailHero`/`ManufacturerFactSheet`/`ManufacturerDetailSection` | `site-container` | ページ側指定なし | 各コンポーネントが個別に `sm:grid-cols-[7rem_minmax(0,1fr)]` / `sm:grid-cols-[8rem_minmax(0,1fr)]` を実装 | robots/[slug] と近似だが微妙に値が異なる重複 | P2 |
| `/reports/[slug]`, `/guides/[slug]` | page.tsx 内 `ReportSidebarContent()` 等 | `site-container` + `site-container-content` | `max-w-4xl`/`max-w-3xl` | `grid-cols-12`（TOC 2 / 本文 7 / サイドバー 3）を両ページで個別に直書き | 同一形状の重複。サイドバー実装も両ページ別物 | P2 |
| `/use-cases/[slug]` | page.tsx 内の独自 `<aside>` | `site-container` | `max-w-3xl`（`dl`） | `lg:grid-cols-[1fr_280px]`（robots/[slug] と同形状）、`sm:grid-cols-[8rem_1fr]` を同一ファイル内に3回直書き | コメント上は `RobotStickyAside` と同等と書かれているが実際は再実装。重複が最も多い | P1（実装と意図のズレ） |
| `/about`, `/for-manufacturers` | page.tsx（共有シェルなし） | `site-container` + `content-col` | `content-col`（64rem） | `md:grid-cols-[8rem_1fr]` をそれぞれ5回・4回直書き | 同一ページ内 + ページ間で重複 | P2 |
| `/privacy` | page.tsx（共有シェルなし） | `site-container` + `content-col` | `content-col`（64rem） | `md:grid-cols-[10rem_1fr]` を2回直書き | `/about`/`/for-manufacturers` と同じ見た目の定義リストだが gutter 幅だけ `10rem` と不揃い | P1（不自然な狭さの直接原因候補） |
| `/contact` | page.tsx + `ContactForm` | `site-container` + `content-col` | `content-col` | なし | 問題なし | - |
| `error.tsx`, `not-found.tsx` | page.tsx単体 | `site-container` | `max-w-2xl`/`max-w-3xl` | `not-found.tsx` のみ `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`（ナビ） | 同じシェル形状を別々に実装（軽微） | P3 |

静的ページ（`/about` `/privacy` `/contact` `/for-manufacturers`）はいずれも `content-col`（64rem）を使っており、初期仮説1（個別固定 grid が原因）は部分的に正しいが、`content-col` 自体の幅は統一されている。不自然な狭さの主因は **`content-col` 幅そのものではなく、定義リストの gutter（`8rem` vs `10rem`）の不統一と、本文最大幅をさらに狭める `max-w-*` の重ね指定**である。

### Text Source Table

| route | text category | current location | expected location | issue | priority |
| --- | --- | --- | --- | --- | --- |
| `/`, `/about`, `/privacy`, `/contact`, `/for-manufacturers` | `static_page_content` | page.tsx 内に直書き | 現状で問題なし（固定本文として妥当） | なし | - |
| `/about`, `/privacy`, `/for-manufacturers` | `derived_value`（"公開開始: 2026年6月" / "最終更新：2026年6月"） | 3ファイルにそれぞれ個別ハードコード | 単一の定数（例: `lib/uiText.ts` か専用 site content 定数） | 3箇所が独立しており、1箇所更新で残り2箇所とズレる | P1 |
| `/for-manufacturers` | `derived_value`（掲載件数）+ 日付の混在 | `` `ロボット ${robotCount}件・メーカー ${manufacturerCount}社（2026年6月現在）` `` | 件数部分は現状通り動的でよいが、日付部分は上記の単一定数に統一 | 動的値と静的日付が同一文字列に混在し、日付だけ更新漏れしやすい | P1 |
| `/robots/[slug]`, `/manufacturers/[slug]`, `/reports/[slug]`, `/guides/[slug]`, `/use-cases/[slug]` | `ui_text`（breadcrumb "ホーム"） | 5ファイル全てに `'ホーム'` を個別ハードコード | `uiText.common.home`（既存・未使用） | 既存の共通文言を使わず重複 | P2 |
| `/robots/[slug]` | `ui_text`（"導入判断" "向く用途" "制約・向かない用途" "不向きな現場" "提供終了：" 等） | page.tsx 内に直書き、隣接見出しは `uiText.robots.*` を使用 | `uiText.robots.*` | 同一ページ内で `uiText` 利用とハードコードが混在 | P2 |
| `components/RobotStickyAside.tsx` | `ui_text`（"基本スペック" "導入段階" "日本での入手性" "メーカーサイトへ" "比較ページで確認"） | コンポーネント内に直書き | `uiText.robots.*` 等 | ラベルが正本を経由していない | P2 |
| `/use-cases/[slug]` | `ui_text`（"要点" "導入事例" "なぜ重要か" "論点" "成立条件" "向く条件" "向かない条件" "判断軸" "候補ロボット" "関連" "選定の相談" 等、`overviewRows` ラベル配列含む） | page.tsx 内に大量直書き | `uiText.useCases.*` / `labels.ts` | 詳細ページの中で最も `uiText` 規約からの逸脱が大きい | P1 |
| `/reports/[slug]` | `ui_text`（`ReportSidebarContent()` 内の "情報提供・取材相談" "関連ツール" "お問い合わせ" "ロボットを探す" 等、"タグ"ラベル） | page.tsx 内に直書き | `uiText.reports.*` | サイドバー全体が共通化されておらず文言も未経由 | P2 |
| `/guides/[slug]` | `ui_text`（"チェックリスト" "選定の相談" "このガイドの内容を踏まえて検討したい場合はご相談ください。" "相談する" 等） | page.tsx 内に直書き | `uiText.guides.*` | 同上 | P2 |
| `/use-cases` | `ui_text`（`defaultTitle`/`defaultDescription`） | page.tsx 内の定数 | 現状で問題なし（SEO用メタ文言として妥当） | なし | - |

### Data Flow Table

| route/component | current source | expected source | direct data import | source/reliability concern |
| --- | --- | --- | --- | --- |
| 全15ルート | `lib/data.ts` 経由（`getRobots` 等） | `lib/data.ts` | なし（`data/*.ts` 直import は検出されず） | なし。事実データの供給経路は健全 |
| `/about`, `/privacy` | ページ固有の静的定数 | 現状で問題なし | なし | "2026年6月" の日付がコード上の固定文字列であり、`sources[].checkedAt` のような確認経路を持たない（lib/data.ts 配下の record とは異質のため許容範囲） |
| `/for-manufacturers` | `getRobots`/`getManufacturers` の件数 + 固定日付文字列 | 件数は現状通り。日付のみ上記の単一定数化対象 | なし | 上記と同様 |

事実データ（`record_fact`）の供給経路自体に問題は見つからなかった。タグ・カテゴリ・表示ラベルも `tagRegistry`/`labels.ts`/`display.ts` を経由しているページが大半で、検出された逸脱は `ui_text` カテゴリ（文言の置き場所）に集中している。

### Fix Candidate Table

| target | type | proposed fix | risk | verification |
| --- | --- | --- | --- | --- |
| `/privacy` の定義リスト gutter（`10rem`） | layout | `8rem` に統一し `/about`・`/for-manufacturers` と一致させる | 低（class値変更のみ） | 360/768/1280/1440px 表示確認 |
| `/robots/[slug]`・`/manufacturers/[slug]`・`/use-cases/[slug]` の定義リスト直書き | layout | 共通 `DefinitionList` コンポーネントを新設し3箇所を置き換え | 中（既存マークアップとの差異に注意） | build + 3ページの表示確認 |
| `/reports/[slug]`・`/guides/[slug]` のサイドバー直書き | layout | 共通 `ArticleSidebar`（仮）に統合するか、現状維持で文言のみ uiText 化するかを Phase 4 で判断 | 中（情報提供導線の文言が記事種別で異なる可能性） | build + 表示確認 |
| `/use-cases/[slug]` の `<aside>` | layout | `RobotStickyAside` を実際に再利用する形に変更、またはコメントを実装に合わせて修正 | 中（props 形状の差異を要確認） | build + 表示確認 |
| `/about`・`/privacy`・`/for-manufacturers` の "2026年6月" | data | 単一の site content 定数（例 `lib/uiText.ts` の `siteMeta.launchedAt` 等）を新設し3箇所から参照 | 低 | build。日付変更時に1箇所のみ編集で反映されることを確認 |
| 5つの詳細ページの `'ホーム'` 直書き | data | `uiText.common.home` を参照するよう置き換え | 低 | build |
| `/robots/[slug]` 本文中の `uiText` 未経由ラベル | data | `uiText.robots.*` に追加し参照を置き換え | 低〜中（既存キー構造との整合確認） | build |
| `components/RobotStickyAside.tsx` のラベル | data | `uiText` 経由に変更 | 低 | build + `/robots/[slug]` 表示確認 |
| `/use-cases/[slug]` のセクション見出し・`overviewRows` ラベル | data | `uiText.useCases.*`／`labels.ts` に追加し参照を置き換え（量が多いため最優先で着手） | 中（既存キー命名との整合、翻訳揺れ確認） | build + `/use-cases/[slug]` 表示確認 |
| `/reports/[slug]`・`/guides/[slug]` のサイドバー文言 | data | `uiText.reports.*`／`uiText.guides.*` に追加 | 低〜中 | build |

## 修正対象外（現状維持で問題なし）

- 一覧ページ6種（`/robots` `/manufacturers` `/reports` `/guides` `/use-cases` `/compare`）のレイアウト・データ供給経路。
- `/`、`/contact` のレイアウトと文言。
- `error.tsx`／`not-found.tsx`（構造重複はP3で軽微、今回のスコープでは対応不要）。
- 全ルートの `record_fact` 供給経路（`lib/data.ts` 経由で健全）。
- タグ・カテゴリ・表示ラベルの registry/labels/display 経由の利用（逸脱は見つからず）。

## 要確認（このまま実装に進めない項目）

- `/reports/[slug]`・`/guides/[slug]` のサイドバーは記事種別ごとに文言・導線が異なる可能性があり、共通化するかは Phase 4 で記事の編集方針（`editorial_style_guide_v1.md`）と照合してから決める。
- `use-cases/[slug]` のラベル群を `uiText.useCases.*` に移す際、既存の `uiText` 命名規則（既存ファイルの構造）と衝突しないか実装前に `lib/uiText.ts` を確認する。

## 修正実行計画（次の実装フェーズで触るファイル）

実装は「データ修正（低リスク・先行可）」と「レイアウト共通化（中リスク・要設計判断）」を別の実装単位に分ける。

1. データ修正（先行して着手可能）
   - `src/app/about/page.tsx`、`src/app/privacy/page.tsx`、`src/app/for-manufacturers/page.tsx`：日付文字列を単一定数参照に変更
   - `src/app/robots/[slug]/page.tsx`、`src/app/manufacturers/[slug]/page.tsx`、`src/app/reports/[slug]/page.tsx`、`src/app/guides/[slug]/page.tsx`、`src/app/use-cases/[slug]/page.tsx`：`'ホーム'` を `uiText.common.home` 参照に変更
   - `components/RobotStickyAside.tsx`：ラベルを `uiText` 参照に変更
   - `src/app/robots/[slug]/page.tsx`：本文中の未経由ラベルを `uiText.robots.*` 参照に変更
   - `src/app/use-cases/[slug]/page.tsx`：見出し・`overviewRows` ラベルを `uiText.useCases.*`／`labels.ts` 参照に変更（最優先）
   - `src/app/reports/[slug]/page.tsx`、`src/app/guides/[slug]/page.tsx`：サイドバー文言を `uiText.reports.*`／`uiText.guides.*` 参照に変更
   - 付随して `lib/uiText.ts`／`lib/labels.ts` にキー追加
2. レイアウト共通化（設計判断後に着手）
   - `src/app/privacy/page.tsx`：定義リスト gutter を `8rem` に統一
   - 共通 `DefinitionList` コンポーネント新設 → `src/app/robots/[slug]/page.tsx`、`components/ManufacturerDetailHero.tsx`、`components/ManufacturerFactSheet.tsx`、`src/app/use-cases/[slug]/page.tsx`、`src/app/about/page.tsx`、`src/app/for-manufacturers/page.tsx` を置き換え
   - `src/app/use-cases/[slug]/page.tsx` の `<aside>` を `RobotStickyAside` 再利用に変更（または非再利用の理由をコメントで明記）
   - `src/app/reports/[slug]/page.tsx`・`src/app/guides/[slug]/page.tsx` のサイドバー共通化は「要確認」の判断後に着手

触らないファイル: 上記「修正対象外」セクションに記載の一覧ページ群、`/`、`/contact`、`error.tsx`/`not-found.tsx`、`lib/data.ts` 経由のデータ供給ロジック本体。

検証チェックリストは既存の「検証方針」セクションをそのまま使う。

## 検証方針

調査後の実装修正では、最低限以下を確認する。

- `npm run build`
- データを変更した場合は `npm run validate:data`
- 主要 viewport での表示確認
  - 360px
  - 768px
  - 1280px
  - 1440px 以上

優先して確認するページ:

- `/about`
- `/privacy`
- `/contact`
- `/for-manufacturers`
- `/`
- `/robots`
- `/manufacturers`
- `/reports`
- `/guides`
- `/use-cases`
- 代表的な詳細ページ

## 完了条件

- 全 route の layout source map がある。
- 全 route の text/data source map がある。
- レイアウト問題とデータ構造問題が別々に分類されている。
- 修正不要、要修正、要確認が明確に分かれている。
- 次の実装フェーズで触るファイルと触らないファイルが明確になっている。
- この計画が `docs/planning/README.md` に active/unimplemented plan として登録されている。
