# Reports News/Explainer IA Plan v1

Status: archived implemented plan
Created: 2026-06-30
Updated: 2026-06-30 (4棚目追加・計画レビュー×2 反映)
Archived: 2026-07-01

> 2026-07-01時点で `/reports` の4棚化は実装済み。現行の棚定義は `lib/articleShelves.ts`、記事執筆方針は `docs/planning/editorial_style_guide_v1.md`、記事追加手順は `docs/planning/data-maintenance-checklist-v1.md` を正本とする。この文書は実装判断の履歴としてのみ参照する。

## 1. 目的

`/reports` を「記事一覧」から、Deploid の運営スコープに合う `ニュース / メーカー解説 / ロボット解説 / 基礎知識` の4棚に整理する。

現状の `/reports` は `section` タブ（導入・事例 / 市場・動向 / 技術・製品 / 政策・規制 / 話題・その他）と、`theme / industry / region` のドロップダウンファセットを前面に出している。記事数と一人運営の現状に対してUIが重く、読者にとって「何を選べばよいか」が分かりにくい。

今回の変更では、表のUIを以下に絞る。

- 主分類: `すべて / ニュース / メーカー解説 / ロボット解説 / 基礎知識`
- 操作: キーワード検索のみ
- ドロップダウンファセット: `/reports` では非表示

`section / themeTags / industryTags / regionTags` はデータとして残し、将来の記事数増加時に再利用できる状態を保つ。

## 2. 方針

### 2.1 記事系の公開構成

グローバルナビ上の名称は `ニュース・解説` とする。

配下の主分類は4つだけにする。

- `ニュース`
- `メーカー解説`
- `ロボット解説`
- `基礎知識`

`導入記事`、`技術記事`、`政策記事` は独立棚にしない。これらはニュースの中の話題分類として扱う。

### 2.2 ニュースの定義

Deploid のニュースは「新しく起きた外部事実で、業界理解または導入判断の変数が動くもの」とする。

扱うニュース:

- 実証・商用導入・契約
- 新モデル・価格・販売条件・RaaS
- 量産・資金調達・IPO・M&A・提携
- 政策・規制・安全基準・補助金
- 大手企業の導入準備・実装に近い提携

扱わないもの:

- バズ動画だけ
- 論文単体
- 出典1本の噂
- 中身の薄いプレスリリース
- 「AI搭載」「世界初」だけで、何が変わるか不明な発表

### 2.3 解説記事の定義

`メーカー解説` は、メーカー詳細ページとは別に「なぜその企業を見るべきか」「供給力・価格・日本展開・導入可能性をどう読むか」を説明する読み物。

`ロボット解説` は、ロボット詳細ページとは別に「なぜその機体が重要か」「どの用途・読者に関係するか」「導入上の制約は何か」を説明する読み物。

既存の `メーカー` / `ロボット` ページはデータベースであり、解説記事とは役割を分ける。

### 2.4 基礎知識について

`基礎知識` は「ヒューマノイドとは何か」「導入検討のフロー」「現場で使う前・使っている最中の一般的な疑問」に答える、時間軸に依存しない体系的な読み物の棚。ニュースや機体・企業の解説とは役割が異なる。

扱うコンテンツ:

- ヒューマノイドの何がすごいか・何ができるか
- 導入検討の一般的な手順・注意点
- 現場運用中の一般的な注意点
- 業界構造・市場全体の概観

実装直後はコンテンツが0件のため、タブは disabled（クリック不可・UI無効表示）で公開する。コンテンツが揃った時点で有効化する。雑なマップや空の棚を公開しない原則は維持する（disabled表示がその代替）。

`入門` や `業界マップ` などの別名で独立ナビ項目を作ることは今回も行わない。

## 3. 既存実装の事実

### 3.1 主要ファイル

- `data/types.ts`
  - `ArticleCategory`, `ArticleType`, `ArticleSection`, `Article`
- `lib/articleSections.ts`
  - 現在の sticky タブ正本（`ARTICLE_SECTION_TABS`、`normalizeArticleSectionParam`）
- `lib/facetConfig.ts`
  - `/reports` の `theme / industry / region` ファセット正本
- `lib/articleFilters.ts`
  - `filterArticles`（`section` 軸での絞り込み正本）
- `components/ReportsBrowser.tsx`
  - `/reports` 一覧の検索、sectionタブ（`sectionTabs` ロジック含む）、ファセット、ページネーション
  - `ReportsFilters` 型（`facetValues` / `query`）と `initialFilters` props を持つ
- `components/ReportsHeader.tsx`
  - sticky タブのURL同期
- `components/NewsCard.tsx`
  - 記事カード。現状は `articleTypeLabels[report.type]` を前面表示
- `components/NewsHeroCarousel.tsx`
  - 記事hero。現状は `articleTypeLabels[report.type]` を前面表示
- `components/NewsFeatureCard.tsx`
  - feature記事カード。現状は `articleTypeLabels[report.type]` を前面表示
- `src/app/reports/[slug]/page.tsx`
  - 記事詳細。記事種別ラベルとタグリンクを表示（T4 と T6 が両方触る）
- `lib/siteNavigation.ts`
  - グローバルナビ

### 3.2 現在の記事データ分布

2026-06-30時点の `data/articles.ts` は29件。

`category`:

- `analysis`: 12
- `company-report`: 7
- `news`: 8
- `policy`: 2

`type`:

- `analysis`: 3
- `deployment-report`: 7
- `event-report`: 2
- `market-analysis`: 7
- `news-brief`: 3
- `policy-update`: 2
- `tech-update`: 5

`section`:

- `business`: 13
- `deployment`: 7
- `policy`: 2
- `tech`: 7

新しい4棚に移行すると、既存29件は当面すべて `ニュース` 側に入る。`メーカー解説` / `ロボット解説` / `基礎知識` は新規 `ArticleType` を追加して今後増やす。`基礎知識` は実装直後disabled。

## 4. 相談が必要な点

### Q1. 0件タブを公開するか（決定済み）

`メーカー解説` / `ロボット解説` は実装直後に0件になる可能性がある。`基礎知識` は実装直後に必ず0件。

決定: 0件タブは disabled 表示（クリック不可）で公開する。

- `メーカー解説` / `ロボット解説`: できれば実装と同時または直後に最低1本ずつ追加し、disabled を解除する
- `基礎知識`: コンテンツが揃うまで disabled のまま公開する

### Q2. URLパラメータ名（決定済み）

決定: `?kind=news` 形式を採用。

- 短く分かりやすい
- 既存の `category` / `type` とは別概念なので helper が必要
- `?shelf=news` より一般読者に自然

### Q3. `?kind=basics-guide` 直アクセス時の挙動（決定済み）

`基礎知識` タブは disabled でクリック不可だが、外部リンク等で直アクセスされる可能性がある。

決定: `normalizeArticleShelfParam` で `'basics-guide'` を `'all'` にフォールバックする。直アクセスは「すべて」を表示し、壊れたページに見えない。

## 5. 実装計画

### 実装順序

T1 → T2 → T3 → T4 → T5 → T6 → T7

順序制約:

- T2 が T3 / T4 より先（`ArticleShelf` 型と `lib/articleShelves.ts` が T3 / T4 で必要）
- T3 が T6 より先（旧 URL 導線の後始末は一覧変更後）
- **T4 が T6 より先（`src/app/reports/[slug]/page.tsx` のラベル変更を T4 で行い、その後 T6 でタグリンクを除去する。同一ファイルへの変更を分離して衝突を防ぐ）**
- T1 / T5 は独立（任意の位置で並走可能だが T2 完了後が自然）
- T7 は最後

---

### T1. 編集方針ドキュメント更新

Files:

- `docs/planning/editorial_style_guide_v1.md`
- `docs/planning/article-sourcing-reference-v1.md`
- `docs/planning/humanoid_media_IA_v1.md`
- `ai/rules/22-article-sourcing.md`
- `docs/planning/README.md`

変更内容:

- ニュース対象を「外部事実で業界理解または導入判断の変数が動くもの」に再定義する
- `メーカー解説` / `ロボット解説` の役割を明記する
- `基礎知識` の役割（時間軸に依存しない体系的読み物）を明記する
- `/reports` の表UIは4棚 + 検索に絞る方針を明記する
- `入門・業界マップ` は独立ナビ項目にしないことを明記する
- `docs/planning/README.md` の (c) 未実装計画欄の記述を「3棚」から「4棚」に修正する
- `editorial-methodology-review-2026-06-24.md` は、反映後に正本ではない草案として整理する

完了条件:

- ニュース対象・除外対象が文書上で明確
- 実装前の方針と現在のUI変更計画が矛盾しない

検証:

- `rg --no-ignore "ニュース|メーカー解説|ロボット解説|基礎知識|業界マップ|dropdown|ドロップダウン|3棚" docs ai`

---

### T2. 記事棚の正本を追加

Files:

- `data/types.ts`
- `lib/labels.ts`
- `lib/display.ts`
- `lib/visualSemantics.ts`
- new: `lib/articleShelves.ts`

#### 設計判断: ArticleType vs ArticleCategory

`manufacturer-guide`、`robot-guide`、`basics-guide` は編集フォーマットではなくコンテンツカテゴリーに近く、意味論的には `ArticleCategory` が適切な候補。ただし `ArticleCategory` への追加を選ぶと、既存29件すべてに `category` フィールドが存在するため既存データのバリデーション通過確認が必要になる。

今回は `ArticleType` に追加する設計を採用する。理由は以下の通り。

- 既存29件の `type` フィールドは既に「フォーマット」と「カテゴリー」が混在している（`deployment-report`、`market-analysis` 等）。今回の追加で意味論的一貫性が損なわれる程度は軽微。
- `ArticleShelf` の判定が `type` の値で完結するため、`category` と `type` を組み合わせる判定ロジックを避けられる。
- 将来 `ArticleCategory` を整理するフェーズで、`manufacturer-guide` 系の型を `category` 側に移動する選択肢は残る。

この設計選択の背景をここに残しておく。将来の担当者が変更する場合はこの理由を確認すること。

#### 変更内容

- `ArticleType` に以下を追加する
  - `manufacturer-guide`
  - `robot-guide`
  - `basics-guide`
- `articleTypeLabels` に表示ラベルを追加する
- `articleTypeOrder` に追加する
- `articleTypeTones` に追加する
- `lib/articleShelves.ts` を作成し、表示棚を一元化する

想定API:

```ts
export type ArticleShelf = 'all' | 'news' | 'manufacturer-guide' | 'robot-guide' | 'basics-guide';

export interface ArticleShelfTab {
  value: ArticleShelf;
  label: string;
  /** true のときタブは表示するがクリック不可・UI無効表示。コンテンツが揃ったらここを外す（Single Source of Truth）。 */
  disabled?: boolean;
}

export const ARTICLE_SHELF_TABS: ArticleShelfTab[] = [
  { value: 'all',                label: 'すべて' },
  { value: 'news',               label: 'ニュース' },
  { value: 'manufacturer-guide', label: 'メーカー解説' },
  { value: 'robot-guide',        label: 'ロボット解説' },
  { value: 'basics-guide',       label: '基礎知識', disabled: true },
];

export function getArticleShelf(article: Article): Exclude<ArticleShelf, 'all'>;

/** 'basics-guide' は 'all' にフォールバック（直アクセス保護）。 */
export function normalizeArticleShelfParam(value: string | null): ArticleShelf;
```

disabled フラグは `ARTICLE_SHELF_TABS` 側に持つ（Single Source of Truth）。コンポーネントはこのフラグを読んで `pointer-events-none` / `opacity` 等を適用するだけにし、将来コンテンツが揃った時点で `disabled: true` の1行を外すだけで有効化できる。コンポーネント側でタブ値を見て条件分岐しない。

棚判定:

- `type === 'manufacturer-guide'` → `manufacturer-guide`
- `type === 'robot-guide'` → `robot-guide`
- `type === 'basics-guide'` → `basics-guide`（ただし `normalizeArticleShelfParam` では `'all'` にフォールバック）
- それ以外 → `news`

完了条件:

- 表示棚の判定が `lib/articleShelves.ts` に集約される
- UI側で `article.type` を直接比較しない

検証:

- `npm run validate:data`
- `npm run build`

---

### T3. reports一覧を4棚 + 検索へ変更

事前確認（実装前に実行）:

```bash
# filterArticles の呼び出し箇所を確認し、/reports 以外の呼び出し元への影響を把握する
rg "filterArticles" src components lib
```

`filterArticles` の `section` パラメータは、`/reports` 以外から呼ばれている場合に影響が出る。確認結果に応じて `section` を optional のまま残すか、`shelf` に置き換えるかを判断する（下記変更内容は optional 化を前提としているが、呼び出し元が `/reports` 専用ならば削除してよい）。

Files:

- `src/app/reports/page.tsx`
- `components/ReportsBrowser.tsx`
- `components/ReportsHeader.tsx`
- `lib/articleFilters.ts`
- `lib/articleSections.ts`（参照を外す。将来用として残す）

変更内容:

- `/reports` のURL読取対象から以下を外す
  - `section`
  - `theme`
  - `industry`
  - `region`
- URL読取対象に `kind` を追加する
- `FacetFilterBar` を `/reports` から外す
- sticky タブを以下に変える
  - `すべて`
  - `ニュース`
  - `メーカー解説`
  - `ロボット解説`
  - `基礎知識`（disabled 固定）
- `lib/articleFilters.ts` の `filterArticles` に `shelf` パラメータを追加し、`section` 軸を `shelf` 軸に置き換える（`section` は optional として残す）
- `ReportsBrowser.tsx` の `sectionTabs` ロジックを棚（`ArticleShelf`）別件数ロジックに置き換える
- `ReportsBrowser.tsx` の props `activeSection: ArticleSectionFilter` を `activeShelf: ArticleShelf` に変更し、`ReportsHeader` の props も合わせて更新する
- `ReportsFilters` 型から `facetValues` を除去する（または `ReportsBrowser` 内で空 `{}` を固定値として扱う）。`hasActiveFilters` と `gridReports` の計算からファセット参照を除去する
- `lib/articleSections.ts` の `normalizeArticleSectionParam` / `ARTICLE_SECTION_TABS` への参照を `src/app/reports/page.tsx` から除去する。`lib/articleSections.ts` 自体は削除しない（将来の再利用のため残す）
- 検索窓は維持する
- ページネーションは維持する
- hero/feature は `すべて` かつ検索なしの時だけ表示する既存挙動を維持する

完了条件:

- `/reports` の操作が sticky タブ + 検索だけになる
- `?kind=news` 直アクセスでニュースだけ表示される
- `基礎知識` タブが disabled（クリック不可）で表示される
- `?kind=basics-guide` 直アクセスは `all` にフォールバックし「すべて」を表示する
- 0件棚でも空状態のUIが分かる表示になる
- `?theme=` など旧URLが来ても表示が壊れない

検証:

- `/reports`
- `/reports?kind=news`
- `/reports?kind=manufacturer-guide`
- `/reports?kind=robot-guide`
- `/reports?kind=basics-guide`（`all` にフォールバックし「すべて」を表示すること）
- `/reports?q=Unitree`
- `/reports?theme=poc`（旧URLが壊れないこと）
- `/reports?section=tech`（旧URLが壊れないこと）

---

### T4. 記事カード/hero/詳細のラベル整理

Note: `src/app/reports/[slug]/page.tsx` は T4 と T6 の両方が変更する。T4 でラベル変更を先に行い、T6 でタグリンク除去を行う。

Files:

- `components/NewsCard.tsx`
- `components/NewsHeroCarousel.tsx`
- `components/NewsFeatureCard.tsx`
- `src/app/reports/[slug]/page.tsx`（ラベル変更のみ。タグリンク除去は T6）
- `lib/articleShelves.ts`

変更内容:

- `articleTypeLabels[report.type]` の直出しをやめる
- 表示用helperを追加する

想定表示:

- ニュース記事: `section` ラベル（`lib/labels.ts` の `articleSectionLabels` の値をそのまま使う。例: `導入・事例`、`市場・動向`、`技術・製品`、`政策・規制`）
- メーカー解説: `メーカー解説`
- ロボット解説: `ロボット解説`
- 基礎知識: `基礎知識`

詳細ページのタグ:

- `theme / industry / region` は、一覧フィルタを外すためリンクにしない
- 表示する場合は非リンクの補助ラベルとして出す（リンク除去は T6 で行う）

完了条件:

- 一覧カード上で `市場分析`、`テックアップデート` など内部フォーマット名が前面に出ない
- ニュースの話題分類と解説棚が混ざらない

検証:

- `/reports`
- 任意のニュース記事詳細
- 画像なし記事がある場合のカード表示

---

### T5. ナビ/メタ文言変更

Files:

- `lib/siteNavigation.ts`
- `src/app/reports/page.tsx`
- `lib/uiText.ts`
- `lib/metadata.ts`（必要な場合）
- `README.md`（必要な場合）

変更内容:

- グローバルナビの `記事` を `ニュース・解説` に変更する
- `/reports` metadata title/description を4棚構成に合わせる
- 検索placeholderを `タイトル・キーワードで検索` 程度に簡素化する
- 既存の `reportTopics` など前面UIから消える文言は、未使用なら削除または将来用として残す

完了条件:

- ナビ、ページタイトル、検索文言が4棚構成と一致する

検証:

```bash
# reportTopics の参照箇所を確認し、未使用なら削除する
rg "reportTopics" src components lib
```

- desktop header
- mobile menu
- `/reports` metadata

---

### T6. 旧ファセット導線の後始末

Note: `src/app/reports/[slug]/page.tsx` は T4 のラベル変更後に T6 でタグリンクを除去する。

Files:

- `lib/facetConfig.ts`
- `components/FacetFilterBar.tsx`（原則変更しない）
- `src/app/reports/[slug]/page.tsx`（タグリンク除去のみ。ラベル変更は T4 済み）

変更内容:

- `ARTICLE_FACETS` は消さず、`/reports` では現在非表示であることをコメントする
- `FacetFilterBar` は use-cases など他画面で使うため削除しない
- 記事詳細から `?theme=`, `?industry=`, `?region=` へのリンクを消す

完了条件:

- 旧フィルタURLへの不要導線がなくなる
- 将来ファセット復活時に再利用できる情報は残る

検証:

```bash
rg "href=\`/reports\?" src components lib
```

---

### T7. 検証

Commands:

```bash
npm run validate:data
npm run build
```

Manual checks:

- `/reports`
- `/reports?kind=news`
- `/reports?kind=manufacturer-guide`
- `/reports?kind=robot-guide`
- `/reports?kind=basics-guide`（`all` フォールバック・「すべて」表示）
- `/reports?q=Unitree`
- `/reports?theme=poc`（旧URL無視・壊れないこと）
- `/reports?section=tech`（旧URL無視・壊れないこと）
- 任意の `/reports/[slug]`
- desktop header
- mobile menu
- モバイル幅で sticky タブが横スクロールできる
- 0件棚の空状態が分かる
- `基礎知識` タブが disabled（クリック不可・視覚的に無効）で表示される

## 6. 実装しないこと

- グローバルナビのホバードロップダウンは作らない
- `/reports` のドロップダウンファセットは表示しない
- `特集` タブは作らない
- `/guides` は復活しない
- `入門` や `業界マップ` を独立ナビ項目にしない
- `themeTags / industryTags / regionTags` は削除しない
- 既存記事29本を一括で書き換えない
- メーカー/ロボット詳細ページを解説記事に統合しない
- `lib/articleSections.ts` を削除しない（将来用として残す）
- `基礎知識` タブを実装時点でクリック可能にしない（コンテンツが揃うまで disabled）

## 7. リスクと軽減策

### R1. 0件・disabled タブが弱く見える

軽減策:

- `メーカー解説` / `ロボット解説` は early に最低1本ずつ追加して disabled を解除する
- `基礎知識` は disabled のまま公開し、コンテンツが揃ってから有効化する
- disabled タブの視覚表現を明確にする（opacity + pointer-events-none 等）

### R2. 旧URLの扱い

`?section=tech` や `?theme=poc` が外部共有されている可能性がある。

軽減策:

- 旧パラメータが来ても無視して通常一覧を表示する
- 404や空一覧にはしない

### R3. 内部typeと表示棚の混同

`ArticleType` はフォーマット、`ArticleShelf` は表示棚として役割が異なる。

軽減策:

- `lib/articleShelves.ts` を表示棚の正本にする
- UI側で `article.type` の直接比較を避ける

### R4. ファセット削除で探索性が落ちる

記事数が増えた場合に再び絞り込みが必要になる可能性がある。

軽減策:

- `section/theme/industry/region` はデータに残す
- `FacetFilterBar` と `ARTICLE_FACETS` は削除せず再利用可能にしておく

### R5. `lib/articleSections.ts` の未使用残留

T3 後に `normalizeArticleSectionParam` / `ARTICLE_SECTION_TABS` が `/reports` から参照されなくなる。

軽減策:

- T3 の実装前に `rg "articleSections" src components lib` で参照箇所を確認する
- 未使用になった場合はファイルを残しつつ、import のみ除去する

### R6. `filterArticles` の呼び出し元への影響

T3 で `filterArticles` に `shelf` パラメータを追加するとき、`/reports` 以外の呼び出し元が存在する場合に影響が出る。

軽減策:

- T3 実装前に `rg "filterArticles" src components lib` で全呼び出し箇所を確認する
- `section` パラメータは optional として残し、既存の呼び出しが変更なしでビルドを通すようにする

## 8. 完了条件

- `/reports` が `すべて / ニュース / メーカー解説 / ロボット解説 / 基礎知識` の4棚で動く
- `基礎知識` タブが disabled（クリック不可）で表示される
- `?kind=basics-guide` 直アクセスが `all` にフォールバックし「すべて」を表示する
- `/reports` からドロップダウンファセットが消える
- 検索、ページネーション、hero/feature が既存品質を維持する
- 記事カードと詳細ページのラベルが、読者向けの分類として分かる
- 編集方針文書と実装が矛盾しない
- `npm run validate:data` と `npm run build` が通る
