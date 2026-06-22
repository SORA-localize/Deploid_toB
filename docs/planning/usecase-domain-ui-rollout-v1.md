# primaryDomain をUIに繋ぎ込む計画

Last reviewed: 2026-06-22

## Context

前回のセッションで`UseCase.primaryDomain`/`secondaryDomains`（タスク起点のMECE分類、`lib/tagRegistry.ts`の`use-case-domain`kind）をデータ層に追加したが、`grep`で確認した結果、`lib/tagRegistry.ts`と`lib/validate.ts`にしか存在せず、UIには一切出ていなかった。一覧のフィルタにも、カードのバッジにも、詳細ページにも出てこない。当初の提案の目的（業界紹介ではなくタスク起点で探せるようにする、`humanoid_media_IA_v1.md` §7）は、データだけ整備してUIに繋がってない状態では実現できていない。

`featuredRank`と`candidateRobots`（fit/reason）は既にUIに反映済み（一覧の並び順、詳細ページのサイドバーバッジ）なので対象外。今回は`primaryDomain`/`secondaryDomains`のみを対象にする。

既存の`industryTags`/`taskTags`は検索ファセットとして`/use-cases`の2つのドロップダウン（業種・タスク）で既に機能しており、これは変更しない（前回決めた通り、削除・格下げはしない）。`primaryDomain`はこれらに**追加する3つ目の軸**として導入する。

## 監査で反映した指摘 / 反映しなかった指摘

`ai_implementation_workflow_prompt.md`の監査フェーズに従い、2回のレビューで出た指摘を反映状況込みで記録する。

**1回目レビューで反映した指摘**
- `generateMetadata`が`resolveFilters`を共有しているのに`domain`を読まない問題 → 「1. 一覧ページに...」の段落に反映
- `getUseCaseFilterResult`の`active`に`domain`が入っていない問題 → 同上
- `grid-cols-2`→`grid-cols-3`の直書きでラベルが欠ける問題 → `grid-cols-1 sm:grid-cols-3 max-w-3xl`に変更
- `lib/search.ts`が`primaryDomain`/`secondaryDomains`を検索対象に含めない非対称 → 新規セクション4として追加

**2回目レビューで反映した指摘（本リビジョン）**
- 計画に「変更するファイル」「実装手順」「影響範囲」「リスク」が無い → 本リビジョンで「調査したファイル」〜「リスクと軽減策」の各節を追加
- `domainOptions`の「すべて」ラベルの正本未指定 → 「1. 一覧ページに...」に`common.allDomains`新設の判断を追記
- ページ説明文（`useCases.description`/`defaultDescription`）の更新有無が未判断 → 新規セクション5として追加、更新する方針に決定

**反映しなかった指摘とその理由**
- なし（今回出た指摘はすべて反映した）

## 採用するアプローチ

### 1. 一覧ページに「分類」ドロップダウンを追加

`lib/tags.ts`に`getUseCaseDomainOptions(useCases)`を新設する。既存の`getUseCaseIndustryTagOptions`と同じ`toTagOptions`パターンを使うが、`primaryDomain`と`secondaryDomains`を両方フラット化したものを渡す（`useCases.flatMap(uc => [uc.primaryDomain, ...(uc.secondaryDomains ?? [])])`）。これにより、絞り込み結果の件数表示が実際にフィルタする件数と一致する。

`lib/useCaseFilters.ts`の`UseCaseFilters`に`domain: string | null`を追加し、`normalizeUseCaseFilters`で`domainValues`に対して検証する（既存の`industry`/`task`と同じ形）。マッチ判定は新しい関数を書かず、既存の`matchesTag(values, selected)`をそのまま再利用する：`matchesTag([useCase.primaryDomain, ...(useCase.secondaryDomains ?? [])], filters.domain)`。これにより、`secondaryDomains`に含まれるユースケース（例：`factory-assembly-support`を`move-goods`で検索した場合）も正しくヒットする。`getUseCaseFilterResult`の`active`（`lib/useCaseFilters.ts:65`、現状`Boolean(filters.industry || filters.task || filters.query)`）にも`filters.domain`を加える。これを忘れると、分類だけで絞り込んでいる状態が「絞り込み中」と判定されず、featured表示が出たままになる・件数表示の文言がずれる。

`src/app/use-cases/page.tsx`の`pickSearchParams`に`'domain'`を追加し、`resolveFilters`内で`domainValues`を渡す。**ページ本体（`UseCasesPage`）だけでなく`generateMetadata`も同じ`resolveFilters`を呼んでいる**（`src/app/use-cases/page.tsx:22-26`）。`generateMetadata`側の`pickSearchParams`呼び出しにも`'domain'`を追加し、`tagLabels`配列に`filters.domain ? getTagLabel(filters.domain, 'use-case-domain') : null`を加える。これを漏らすと、分類で絞り込んだ状態でtitle/description/noindexが実際のフィルタ結果と一致しなくなる。

`tagLabels`配列の並び順は`domain → industry → task`にする（`[filters.domain ? getTagLabel(filters.domain, 'use-case-domain') : null, filters.industry ? getTagLabel(filters.industry, 'industry') : null, filters.task ? getTagLabel(filters.task, 'task') : null].filter(...)`）。`primaryDomain`がMECE分類の正本で`industryTags`/`taskTags`は検索ファセットという位置付け（`data-maintenance-checklist-v1.md:242`）なので、タイトル/descriptionでも分類を先頭に出すのが自然（例：「物を動かす×製造×搬送・マテハン × ヒューマノイド活用事例」）。

`components/UseCasesBrowser.tsx`の業種・タスクの2つの`SelectControl`に、3つ目として「分類」を追加する。現状は`grid-cols-2 gap-3 sm:gap-4 max-w-md`（`components/UseCasesBrowser.tsx:96`）だが、分類の選択肢ラベルは「物を加工・組立・操作する」「危険・遠隔環境で代替する」のように最大12文字程度あり、業種・タスクのラベル（最大7文字程度）より長い。そのまま`grid-cols-3`にすると狭い列でラベルが欠ける（`SelectValue`は`line-clamp-1`で折り返さず切れる、`components/ui/select.tsx`）。`grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl`にして、モバイルでは縦積み・sm以上で3列に広げる（`max-w-md`→`max-w-3xl`で1列あたりの幅を確保する）。

`uiText.filters`に新しいラベルキー（`domain: '分類'`）を追加する。先頭の「すべて」optionは既存パターン（`industryOptions`/`taskOptions`が使う`uiText.common.allIndustries`/`allTasks`、`components/UseCasesBrowser.tsx:39,46`）に揃え、`lib/uiText.ts`の`common`に新規キー`allDomains: 'すべての分類'`を追加して使う。`lib/uiText.ts:6`には文言が同じ`allTypes: 'すべての分類'`という既存キーがあるが、これはコードベース全体で参照箇所が無い孤立したキーであり、名前も「ロボット分類」を想起させ意味が異なるため流用しない（フィルタ軸ごとに専用の`allXxx`キーを持つ既存規約に揃える）。

`UseCasesHeader`に渡す`activeChips`の計算にも`domain`を追加する。

### 2. カードのバッジを`industryTags[0]`から`primaryDomain`に置き換え

`components/UseCaseCard.tsx`は現在`industryTags[0]`をTagChipとして表示している（タスクタグのチップ行は、カードを小さくする際に既に削除済み）。`industryTags`は引き続きフィルタとして機能するが、カード上の一目で分かる分類表示は`primaryDomain`の方が「このユースケースが何をする話か」をより正確に伝えるため、`<TagChip kind="industry" value={u.industryTags[0]} />`を`<TagChip kind="use-case-domain" value={u.primaryDomain} />`に置き換える。`TagKind`はすでに`use-case-domain`を含んでおり、`tagKindTones`にも色（brand）が設定済みなので追加実装は不要。

### 3. 詳細ページのサイドバーに「分類」行を追加

`src/app/use-cases/[slug]/page.tsx`の右カラム「判断軸」テーブル（`overviewRows`）に、既存の成熟度・実務ラベル・環境・必要能力と並んで「分類」の行を追加する。値は`primaryDomain`のラベル（`secondaryDomains`がある場合は「、」区切りで括弧内に併記。例：「物を加工・組立・操作する（＋物を動かす、状態を見て記録する）」）。新しいUIチップ列を発明せず、既存の構造化データ表示パターンに1行追加するだけにする。

### 4. 自由文検索にも`primaryDomain`/`secondaryDomains`を含める

`lib/search.ts`の`createUseCaseSearchDocument`（`lib/search.ts:282-291`）は現状`industryTags`/`taskTags`のみを`kind`付きタグとして検索対象に入れており、`primaryDomain`/`secondaryDomains`は含まれていない。分類ドロップダウンを追加すると「ドロップダウンでは選べるが検索ボックスでは引っかからない」非対称な状態になる。既存パターン（`...useCase.industryTags.map((value) => ({ value, kind: 'industry' as const }))`）に揃え、`tags`配列に`[useCase.primaryDomain, ...(useCase.secondaryDomains ?? [])].map((value) => ({ value, kind: 'use-case-domain' as const }))`を追加する。これにより「物を動かす」のような分類ラベルで検索しても対応するユースケースがヒットする。

### 5. ページ説明文に「分類」を反映する

`lib/uiText.ts:136`の`useCases.description`（「業種・ワークフロー・タスクから、現実的なヒューマノイドの適用機会を探せます。」）と`src/app/use-cases/page.tsx:8-10`の`defaultDescription`（「業種・ワークフロー・タスクから現実的なヒューマノイドの適用機会を探す。ベンダー名ではなく現場の課題から始めます。」）はいずれも「分類」に触れていない。

本計画の出発点は「業界紹介ではなくタスク起点で探せるようにする」（`humanoid_media_IA_v1.md` §7）ことであり、`primaryDomain`はその軸そのものなので、両方の文言に分類を加える。
- `useCases.description` → 「やりたい作業の分類・業種・タスクから、現実的なヒューマノイドの適用機会を探せます。」
- `defaultDescription` → 「やりたい作業の分類・業種・タスクから現実的なヒューマノイドの適用機会を探す。ベンダー名ではなく現場の課題から始めます。」

代替案（コピーを変えない）も検討したが、新しいドロップダウンが一覧の先頭軸として並ぶのに説明文だけが旧来の2軸のままだと、UIとコピーの間で齟齬が生まれるため採用しない。コピーの最終文言はユーザー確認を経て調整可能な前提とする。

この文言変更は他の指摘（ロジック追加・型追加）と違って見た目の挙動に影響しないため実装時に埋もれやすい。**実装完了報告では「`useCases.description`/`defaultDescription`の文言を変更した」ことを明示する**（差分に紛れ込ませず、変更点として名指しする）。

## 調査したファイル

- `data/types.ts`（`UseCase.primaryDomain`/`secondaryDomains`の型定義、307-309行）
- `lib/tagRegistry.ts`（`use-case-domain`kindの登録値とラベル）
- `lib/validate.ts`（既存の`primaryDomain`/`secondaryDomains`タグ検証、444-445行）
- `lib/tags.ts`（`toTagOptions`・`getUseCaseIndustryTagOptions`等の既存パターン、`getAllTagOptions`が未参照であること）
- `lib/useCaseFilters.ts`（`UseCaseFilters`・`normalizeUseCaseFilters`・`getUseCaseFilterResult`・`active`の定義）
- `lib/search.ts`（`createUseCaseSearchDocument`・`createRobotSearchDocument`等の既存タグ付与パターン）
- `lib/uiText.ts`（`common.allXxx`系の既存命名規約、`filters.industry`/`task`、`useCases.description`、孤立キー`allTypes`）
- `lib/visualSemantics.ts`（`tagKindTones`に`use-case-domain: 'brand'`が既に設定済み）
- `components/TagChip.tsx`（`kind`汎用実装で追加対応が不要なこと）
- `components/ui/select.tsx`（`SelectValue`が`line-clamp-1`で折り返さず欠ける挙動）
- `components/SelectControl.tsx`（`SelectControl`の構造）
- `components/UseCasesBrowser.tsx`（ドロップダウンのグリッド・`activeChips`の計算）
- `components/UseCaseCard.tsx`（カードバッジの現状実装）
- `components/RobotsBrowser.tsx`・`components/ManufacturersBrowser.tsx`（複数フィルタ時のグリッド幅指定の既存パターン比較）
- `src/app/use-cases/page.tsx`（`generateMetadata`と`UseCasesPage`が`resolveFilters`を共有していること）
- `src/app/use-cases/[slug]/page.tsx`（`overviewRows`の構造）
- `docs/planning/data-maintenance-checklist-v1.md` M章（`primaryDomain`/`secondaryDomains`の運用ルール、242行）
- `docs/planning/humanoid_media_IA_v1.md` §7（タスク起点逆引きという目的）
- `ai_implementation_workflow_prompt.md`（計画に含めるべき必須項目、96行・153行）

## 再利用する既存コード

- `toTagOptions`（`lib/tags.ts`）→ `getUseCaseDomainOptions`新設時にそのまま使う
- `matchesTag`（`lib/tags.ts`）→ ドメインのマッチ判定に新しい関数を書かず再利用
- `normalizeUseCaseFilters`/`getUseCaseFilterResult`の既存`industry`/`task`実装パターン → `domain`もこの形に揃える
- `TagChip`（`components/TagChip.tsx`）→ `use-case-domain`kindは既に汎用実装で対応済み、追加実装なし
- `pickSearchParams`（`lib/searchParams.ts`）→ 既存ヘルパーをそのまま使う
- `uiText.common.allIndustries`/`allTasks`と同じ命名パターン → `allDomains`もこれに揃える

## 新規作成するコード

- `lib/tags.ts`: `getUseCaseDomainOptions(useCases)`
- `lib/uiText.ts`: `common.allDomains`、`filters.domain`
- `lib/useCaseFilters.ts`: `UseCaseFilters.domain`フィールド、`normalizeUseCaseFilters`の`domainValues`引数
- `lib/search.ts`: `createUseCaseSearchDocument`の`tags`への`use-case-domain`追加

## 変更するファイル

- `lib/tags.ts`
- `lib/uiText.ts`
- `lib/useCaseFilters.ts`
- `lib/search.ts`
- `src/app/use-cases/page.tsx`
- `components/UseCasesBrowser.tsx`
- `components/UseCaseCard.tsx`
- `src/app/use-cases/[slug]/page.tsx`

## 変更しないファイル

- `lib/tagRegistry.ts`：`use-case-domain`の登録値・ラベルは前回のセッションで投入済みで、今回はUI接続のみが目的のため変更しない
- `lib/visualSemantics.ts`：`tagKindTones`の`use-case-domain: 'brand'`は既に設定済み
- `components/TagChip.tsx`：`kind`の汎用実装が既に`use-case-domain`に対応済み
- `data/useCases.ts`：`primaryDomain`/`secondaryDomains`の値自体は前回投入済みで対象外
- `lib/tags.ts`の`getAllTagOptions`：サイトマップ等横断用の関数で、現在どこからも呼ばれていない。今回は`/use-cases`一覧専用の対応のため触らない（スコープ外に明記）

## 実装手順

1. `lib/uiText.ts`：`common.allDomains`、`filters.domain`を追加し、`useCases.description`を更新
2. `src/app/use-cases/page.tsx`：`defaultDescription`を更新
3. `lib/tags.ts`：`getUseCaseDomainOptions`を追加
4. `lib/useCaseFilters.ts`：`UseCaseFilters.domain`・`normalizeUseCaseFilters`の`domainValues`・`matchesTag`呼び出し・`active`への反映
5. `lib/search.ts`：`createUseCaseSearchDocument`の`tags`に`primaryDomain`/`secondaryDomains`を追加
6. `src/app/use-cases/page.tsx`：`pickSearchParams`（`UseCasesPage`と`generateMetadata`の両方）・`resolveFilters`・`tagLabels`に`domain`を反映
7. `components/UseCasesBrowser.tsx`：3つ目の`SelectControl`追加、グリッドを`grid-cols-1 sm:grid-cols-3 max-w-3xl`に変更、`activeChips`に`domain`を追加
8. `components/UseCaseCard.tsx`：`TagChip`を`industryTags[0]`から`primaryDomain`に置き換え
9. `src/app/use-cases/[slug]/page.tsx`：`overviewRows`に「分類」行を追加
10. `npm run validate:data` → `npm run build` → 「検証」節の手動確認チェックリストを実施

## 影響範囲

- 影響するのは`/use-cases`一覧・詳細ページのみ。`robots`/`manufacturers`/`guides`/`reports`の既存フィルタ・検索・カードは対象外（`matchesTag`/`toTagOptions`等の共有helperはシグネチャを変えず呼び出しを追加するだけなので、既存呼び出し元の挙動は変わらない）
- URLパラメータに`?domain=`が新規追加される。既存の`?industry=`/`?task=`/`?q=`の挙動・URL形式は変えない
- `lib/search.ts`の変更により、自由文検索で今までヒットしなかったユースケース（分類ラベルに一致するが業種・タスクには一致しない事例）が新たにヒットするようになる。これは意図した変更
- `useCases.description`/`defaultDescription`の文言変更はSEOのメタディスクリプションにも反映される（`createPageMetadata`経由）

## リスクと軽減策

- 分類ラベルが業種・タスクより長く、3列レイアウトで欠ける可能性 → `grid-cols-1 sm:grid-cols-3 max-w-3xl`にして列幅を確保する。確認は手動確認チェックリストのモバイル幅項目で行う
- カードのバッジを`industryTags[0]`から`primaryDomain`に切り替えると、一覧の見た目（バッジのテキスト）が変わる → 色（brand）は変えずラベルのみ変わるため視覚的な破壊は小さいが、変更前後のスクリーンショット比較を手動確認に含める
- `generateMetadata`の反映漏れがあると分類フィルタ時のSEOタイトル/descriptionが実際の結果とズレる → 実装手順6で`UseCasesPage`と`generateMetadata`の両方を同時に直すことで防ぐ。検証チェックリストに直接URL確認を追加済み
- ページ説明文の変更はコピーの最終判断であり、編集方針（`editorial_style_guide_v1.md`）との整合はユーザー確認が必要 → 実装後、コピー変更箇所を明示してユーザーに最終確認を依頼する

## 今回のスコープ外

- `industryTags`/`taskTags`ドロップダウンの削除・統合はしない
- `lib/tags.ts`の`getAllTagOptions`（サイトマップ等横断用、現在どこからも呼ばれていない）への`use-case-domain`追加はしない（今回は`/use-cases`一覧専用の対応）

## 検証

```bash
npm run validate:data
npm run build
```

`/use-cases`で3つ目のドロップダウンから分類を選び、`primaryDomain`一致と`secondaryDomains`一致の両方が結果に出ることを確認する。カードのバッジが`primaryDomain`ラベルになっていること、詳細ページのサイドバーに分類行が出ることをPlaywrightで確認する。

加えて以下も確認する：
- 分類だけを選んだ状態で件数表示・featured非表示（`active`判定）が業種/タスク選択時と同じ挙動になること
- 分類で絞り込んだURL（`?domain=...`）に直接アクセスし、`<title>`/`<meta name="description">`が選んだ分類に対応していること（`generateMetadata`側の反映漏れがないか）
- 検索ボックスに分類ラベル（例：「物を動かす」）を入力し、対応するユースケースがヒットすること
- モバイル幅（375px相当）で3つのドロップダウンが縦積みになり、分類ラベルが欠けずに表示されること
- `useCases.description`/`defaultDescription`の文言変更後、`/use-cases`のトップ説明文とメタディスクリプションの両方が更新されていること

## 残るリスク

- ページ説明文の最終コピーはユーザー承認が前提で、本計画の文言はドラフト
- `getAllTagOptions`に`use-case-domain`を含めない判断は今回のスコープ限定であり、将来サイトマップ等で分類別の横断一覧が必要になった場合は再度設計判断が必要
