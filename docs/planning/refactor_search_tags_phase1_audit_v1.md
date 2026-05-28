# Phase 1 監査結果: UI共通化・検索・タグ改善 v1

## 1. 監査目的

`refactor_search_tags_execution_plan_v1.md` の Phase 1 として、実装に入る前に以下を確定する。

- 共通化すべきUI
- ハードコードやDRY違反
- `lib/data.ts` に寄せるべき処理
- タグ機能の最小仕様
- 検索改善の最小仕様
- レスポンシブ、アクセシビリティ、運用安全性のリスク

この監査は、次フェーズ以降で「何となく直す」ことを避けるための作業対象リストである。

---

## 2. ベースライン

確認日: 2026-05-29

GitHub同期:

```text
origin/main...HEAD = 0 0
HEAD = origin/main
```

既存の未コミット差分:

```text
data/guides.ts
data/manufacturers.ts
data/reports.ts
data/robots.ts
```

扱い:

- 上記 `data/*.ts` は既存差分として扱う
- Phase 2以降の実装で必要が明確になるまで触らない
- stage対象には含めない

---

## 3. 監査方法

主に以下の観点で `rg` による機械検索と周辺コード確認を行った。

```bash
rg 'border border-neutral-300|border border-neutral-200' components src/app
rg 'px-2 py-0.5|px-3 py-1|条件に合う|Featured|Latest|All Types|All Status' components src/app
rg 'const .*Labels|TBD|PRE_RELEASE_STAGES|stageOrder|typeOrder|categoryLabels|envLabels|capLabels' components src/app lib
rg 'getReports\(\)\.filter|filter\(' src/app components lib
rg 'grid-cols-3|grid-cols-12|w-64|sticky top-6|aria-label|useForm\(' components src/app
rg 'tags|topics|industryTags|taskTags' data components src/app lib
```

---

## 4. 優先度定義

- P0: 次フェーズで先に直すべき。今後の実装を安全にする土台。
- P1: 機能追加前に直したい。放置すると重複や仕様ズレが増える。
- P2: 重要だが、P0/P1後にまとめて直す方が安全。

---

## 5. P0: 先に直すべき項目

### 5.1 タグ・バッジUIが各所に直書きされている

問題:

- `span` のタグ/バッジ表示が複数ページに散らばっている
- `tags`、`topics`、`industryTags`、`taskTags` の見た目が似ているが統一されていない
- 今後タグクリック、URL state、タグ一覧を入れる時に全箇所修正が必要になる

主な箇所:

- `components/ReportsBrowser.tsx`: report type badge, report tags
- `components/GuidesBrowser.tsx`: guide stage badge, guide topics
- `components/UseCasesBrowser.tsx`: industry tag, maturity badge, readiness badge, task tags
- `src/app/page.tsx`: report type badge, guide topics
- `src/app/guides/[slug]/page.tsx`: guide topics
- `src/app/manufacturers/[slug]/page.tsx`: distributor/support/vendor notes, model count badge

次フェーズ方針:

- Phase 2で `TagChip` を作る
- 表示専用の `TagChip` から始める
- クリック可能タグやURL stateは Phase 5 まで入れない

完了条件:

- tag/topic/task/industry 表示の大半が `TagChip` 経由になる
- maturity/readiness のような状態バッジも共通化するか、別 `StatusBadge` に分ける判断をする

---

### 5.2 フィルタchip/buttonが重複している

問題:

- filter chip の active/inactive className がページごとに直書きされている
- Reports / Guides / UseCases でほぼ同じ構造を持つ
- タグURL化の前に共通化しておかないと、URL state対応がページごとに分岐する

主な箇所:

- `components/ReportsBrowser.tsx`: type filter, topic filter
- `components/GuidesBrowser.tsx`: stage filter, topic filter
- `components/UseCasesBrowser.tsx`: industry/task mode, chip filter
- `components/RobotsBrowser.tsx`: release toggle

次フェーズ方針:

- Phase 2で `FilterChipGroup` を作る
- 最初は単一選択の chip group に限定する
- UseCases の「mode切替 + chip」は一気に抽象化しすぎない

完了条件:

- Reports と Guides の単純な chip filter が共通部品化される
- UseCases は共通部品を使える範囲だけ適用する

---

### 5.3 select UI が重複している

問題:

- select の className と label 構造が複数箇所に直書きされている
- ロボット、メーカー、問い合わせフォームで同じ基礎UIを持つ

主な箇所:

- `components/RobotsBrowser.tsx`: type / manufacturer / availability
- `components/ManufacturersBrowser.tsx`: country / type / status
- `components/ContactForm.tsx`: inquiry type

次フェーズ方針:

- Phase 2で `FilterSelect` を作る
- `label`, `value`, `onChange`, `options` の最小propsにする
- ContactForm は form field として微妙に責務が違うため、適用は自己監査後に判断する

完了条件:

- RobotsBrowser と ManufacturersBrowser の select が共通化される
- ContactForm は共通化するか、別 `FormSelect` に分ける判断が残っている

---

### 5.4 Empty state が直書きされている

問題:

- 「条件に合う〜がありません」系の表示が各一覧に直書きされている
- 空状態の余白、背景、文言トーンがページごとにズレやすい

主な箇所:

- `components/ReportsBrowser.tsx`
- `components/GuidesBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/CompareClient.tsx`
- `src/app/manufacturers/[slug]/page.tsx`

次フェーズ方針:

- Phase 2で `EmptyState` を作る
- 最初は title なし、message だけの小さい部品にする
- Compare の空状態は内容が複雑なので、最初は対象外でもよい

完了条件:

- 一覧ページの単純な空状態が `EmptyState` 経由になる

---

## 6. P1: 機能追加前に直したい項目

### 6.1 `lib/data.ts` に寄せるべき filter がページ側にある

問題:

- データ運用ルールでは取得・filter・slug lookup は `lib/data.ts` に寄せる方針
- `src/app/manufacturers/[slug]/page.tsx` で `getReports().filter(...)` を直接実行している
- 既に `getReportsForManufacturer(slug)` が存在する

該当:

- `src/app/manufacturers/[slug]/page.tsx`
- `lib/data.ts`

次フェーズ方針:

- Phase 3で `getReportsForManufacturer(manufacturer.slug)` に置換する
- Browserコンポーネント内のUI状態に依存した filter はそのままでよい

完了条件:

- ページ側で関連取得の direct filter がなくなる

---

### 6.2 ラベル定義が `lib/labels.ts` 外に散っている

問題:

- enum由来のラベルは `lib/labels.ts` に集約する方針
- 一部が各ページ/コンポーネントにローカル定義されている

主な箇所:

- `components/RobotsBrowser.tsx`: `categoryLabels`, `PRE_RELEASE_STAGES`
- `src/app/robots/[slug]/page.tsx`: `categoryLabels`
- `src/app/use-cases/[slug]/page.tsx`: `envLabels`, `capLabels`, `capNoteLabels`
- `components/GuidesBrowser.tsx`: `stageOrder`
- `components/ReportsBrowser.tsx`: `typeOrder`

次フェーズ方針:

- Phase 3で label 系は `lib/labels.ts` に移す
- order 系は `lib/labels.ts` ではなく `lib/data.ts` か新規 `lib/display.ts` も検討する
- `PRE_RELEASE_STAGES` は表示ラベルではなく分類ロジックなので、`lib/data.ts` か `lib/robots.ts` 的 helper が妥当か判断する

完了条件:

- category/environment/capability の表示名が `lib/labels.ts` に集約される
- `RobotsBrowser` と robot detail の category label 重複がなくなる

---

### 6.3 `TBD = '要確認'` が複数箇所にある

問題:

- `要確認` が表示定数として複数ファイルに定義されている
- 小さい重複だが、データ品質方針に関わる重要な表示なので一元化候補

主な箇所:

- `components/RobotCard.tsx`
- `components/FavoriteCard.tsx`
- `components/ManufacturersBrowser.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`

次フェーズ方針:

- Phase 3で `lib/labels.ts` に `TBD_LABEL` などを置くか判断
- ただし過剰抽象化になりやすいので、他の label 整理と一緒に最小変更で行う

完了条件:

- `要確認` の表示方針が1箇所で説明できる

---

### 6.4 Source list が重複している

問題:

- 出典表示が Robot / Guide / Report 詳細でほぼ同じ構造
- reliability 表示、publisher、checkedAt の出し方が散らばる
- 今後ソース品質表示を変える時に複数箇所修正になる

主な箇所:

- `src/app/robots/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/reports/[slug]/page.tsx`

次フェーズ方針:

- Phase 2またはPhase 3で `SourceList` を検討
- `SectionCard` より先に `SourceList` を作ると実利が大きい

完了条件:

- 出典表示が共通化される
- 空状態文言も統一される

---

### 6.5 Related links panel が重複している

問題:

- 右サイドバーの「関連」「関連ツール」「Related Paths」構造がページごとに直書きされている
- link row の見た目とセクション見出しが重複している

主な箇所:

- `components/ReportsBrowser.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`

次フェーズ方針:

- Phase 2では対象外でもよい
- Phase 3以降で `SidebarPanel` / `RelatedLinksPanel` を検討

完了条件:

- 少なくとも link row の共通化方針が決まる

---

## 7. P1: タグ機能の現状と最小仕様

### 7.1 現状

タグ相当データは既にある。

- `Report.tags`
- `Guide.topics`
- `UseCase.industryTags`
- `UseCase.taskTags`

問題:

- `tags` と `topics` と `industryTags/taskTags` が別々の概念としてUIに出ている
- 表示名とslug的な値が混在している
  - 例: `Decision Variables`
  - 例: `manufacturing`
  - 例: `r-and-d`
- 正規化、表示名、タグ種別の helper がない
- URL state がないため、タグ状態を共有できない

### 7.2 最小仕様

Phase 4で作る最小仕様:

- 独立 `tags` collection はまだ作らない
- `lib/tags.ts` を作る
- 既存配列からタグを集約する
- タグ値は `normalizeTag(value)` で正規化する
- 表示は `formatTagLabel(value)` を通す
- UI表示は `TagChip` に統一する

Phase 5で作る最小仕様:

- まず `ReportsBrowser` の `?tag=` と `GuidesBrowser` の `?topic=` から始める
- UseCases の `industry/task` URL化はその後
- robots/manufacturers はタグ機能とは分ける

やらないこと:

- いきなり `/tags/[slug]` を作らない
- いきなりタグDBを作らない
- いきなり全ページのURL stateを統一しない

---

## 8. P1: 検索改善の現状と最小仕様

### 8.1 現状

検索入力UIは `SearchInput` に共通化済み。

検索処理は `lib/search.ts` の `matchesQuery` で単純一致。

使っている箇所:

- `components/ReportsBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`

問題:

- 検索対象フィールドが各 Browser に直書きされている
- 日本語のゆらぎ、英語の大文字小文字以外の正規化はない
- URL state がない
- 「検索モーダル」はまだ存在しない。現状は一覧内検索のみ

### 8.2 最小仕様

Phase 6で作る最小仕様:

- `matchesQuery` は維持する
- 検索対象フィールドを関数化する
  - 例: `robotSearchValues(robot, manufacturerName)`
  - 例: `reportSearchValues(report)`
- query の trim/lowercase 以外の正規化を `lib/search.ts` に閉じる
- Fuse.js や Pagefind はまだ入れない

将来判断:

- 一覧内 fuzzy search が必要になったら Fuse.js
- サイト全体検索や検索モーダルが必要になったら Pagefind
- Algolia は件数・運用要件が増えてから検討

---

## 9. P2: レスポンシブ・アクセシビリティ

### 9.1 固定カラムが多い

問題:

- 固定 `grid-cols-3` が多く、モバイルで崩れやすい
- `CompareClient` は `w-64` の左右サイドバーと中央比較領域を横並び固定にしている

主な箇所:

- `src/app/page.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `components/CompareClient.tsx`

次フェーズ方針:

- Phase 7で responsive grid に直す
- 例: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Compare は単独で設計する。小修正で済ませない

---

### 9.2 icon button のアクセシビリティ不足

問題:

- 一部 icon button が `aria-label` なし
- `title` だけに依存している箇所がある

主な箇所:

- `components/RobotCard.tsx`: favorite button
- `components/CompareClient.tsx`: remove button
- `components/RobotImageCarousel.tsx`: tab button は title あり。aria 現状を再確認する

次フェーズ方針:

- Phase 7で `aria-label` を追加
- icon-only button は `title` ではなく `aria-label` を基準にする

---

## 10. P2: 運用安全性

### 10.1 Formspree ID が直書きされている

問題:

- `components/ContactForm.tsx` で `useForm('mgoqrrkb')` が直書き
- secretではない可能性が高いが、環境ごとの差し替えがしにくい
- `docs/planning/publish_todo_v1.md` にもフォームIDが記載されている

次フェーズ方針:

- Phase 8で `NEXT_PUBLIC_FORMSPREE_FORM_ID` のような環境変数に寄せる
- 未設定時の表示を決める
- ドキュメントに環境変数名のみ記載し、値は書かない方針にする

---

### 10.2 placeholder画像に gradient が残っている

問題:

- デザイン方針では gradient を避ける方針
- `RobotCard` と `RobotImageCarousel` に `bg-gradient-to-br` がある
- 実画像がない場合の placeholder として使われているが、方針上は neutral flat の方が安全

主な箇所:

- `components/RobotCard.tsx`
- `components/RobotImageCarousel.tsx`

次フェーズ方針:

- Phase 7またはPhase 9で flat neutral placeholder に変更する

---

## 11. 実装フェーズ割り当て

### Phase 2: 小型UI共通コンポーネント化

対象:

- `TagChip`
- `FilterChipGroup`
- `FilterSelect`
- `EmptyState`

優先:

1. `TagChip`
2. `FilterChipGroup`
3. `FilterSelect`
4. `EmptyState`

Phase 2でまだやらない:

- URL state
- `lib/tags.ts`
- 検索ライブラリ
- Compare のレスポンシブ大改修

### Phase 3: データ/helper整理

対象:

- `lib/labels.ts`
- `lib/data.ts`
- `components/RobotsBrowser.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`

優先:

1. `getReportsForManufacturer` 置換
2. category/environment/capability labels 集約
3. `TBD` 方針決定
4. `SourceList` 検討

### Phase 4: タグ基盤

対象:

- `lib/tags.ts`
- `TagChip`
- `ReportsBrowser`
- `GuidesBrowser`
- `UseCasesBrowser`

優先:

1. 正規化
2. 表示名
3. タグ集約
4. UI適用

### Phase 5: タグURL・一覧フィルタ改善

対象:

- `ReportsBrowser`
- `GuidesBrowser`
- 必要なら `UseCasesBrowser`

優先:

1. `reports?tag=`
2. `guides?topic=`
3. `use-cases?industry=` / `?task=`

### Phase 6: 検索改善

対象:

- `lib/search.ts`
- Browser components

優先:

1. 検索対象フィールド関数化
2. query正規化
3. URL query化するか判断
4. Fuse.js/Pagefind導入判断

### Phase 7: レスポンシブ・アクセシビリティ

対象:

- 固定 grid
- Compare
- icon button
- placeholder gradient

### Phase 8: 外部ID・運用安全性

対象:

- `ContactForm`
- env var docs
- Formspree ID記載方針

---

## 12. Phase 1 完了条件の判定

完了:

- 共通化対象を確定した
- ハードコード対象を確定した
- helper違反を確定した
- タグ機能の最小仕様を決めた
- 検索改善の最小仕様を決めた
- 次フェーズの対象ファイルを分けた

未実装:

- Phase 1は監査のみ。実装変更は行っていない

次に進む条件:

- この監査結果をコミットする
- GitHubにpushする
- 次の作業は Phase 2 の小型UI共通コンポーネント化から開始する

