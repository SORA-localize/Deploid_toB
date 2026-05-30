# 残修正 実行計画

Date: 2026-05-30

## 目的

`filter-tag-redesign` 後に残っている構造・型・UI文言・アクセシビリティ・運用安全性の不備を、見た目の大きな変更を増やさずに解消する。

タグは当面「裏側の検索・絞り込み・検証用データ」として扱い、ロボットカードや詳細ページに新しいタグUIを増やさない。

## 現在完了済み

- ロボットカードの移動方式バッジ削除。
- ロボット一覧の業種 / タスク dropdown 順を `tagRegistry` 順に整理。
- 不正な `industry` / `task` URL param の安全化。
- robot `industryTags` / `taskTags` の `validate:data` 検証追加。
- ロボット検索に業種 / タスクタグを反映。
- `/robots` metadata description を現行フィルタ仕様へ同期。

## 残修正一覧

| Phase | 優先度 | 修正 | 原則 |
| --- | --- | --- | --- |
| 1 | P0 | `getTagLabel(tag)` のkind省略を解消する | Type Safety / SSOT |
| 2 | P0 | placeholder / empty message / 主要直書き文言を `uiText` に寄せる | SSOT / DRY |
| 3 | P0 | `as CompanyType` などURL param由来の型アサーションを型ガードへ置き換える | Type Safety |
| 4 | P1 | registry由来のタグunion型を作り、Robot / Report / Guide / UseCase のタグ型を強化する | Type Safety |
| 5 | P1 | `SourceList` を robots / reports 詳細へ横展開する | DRY |
| 6 | P1 | `SelectControl` に `aria-activedescendant` と option id を追加する | Accessibility |
| 7 | P1 | `FormSelect` の送信値を表示ラベルではなく安定valueにする | Operational Safety |
| 8 | P1 | robots / manufacturers のfilterロジックを純粋関数へ分離する | Separation of Concerns / KISS |
| 9 | P2 | filtered URL のSEO/canonical方針を実装する | URL State / SEO |
| 10 | P2 | `NEXT_PUBLIC_SITE_URL` のproduction guardを追加する | Operational Safety |
| 11 | P2 | 最終監査ドキュメントを最新状態で作成する | Operational Safety |

## 実行方針

### Phase 1: タグ表示のkind明示

- `UseCasesBrowser`: industry tag は `industry`、task tag は `task` を渡す。
- `GuidesBrowser` / guide詳細 / home: `guide-topic` を渡す。
- `ReportsBrowser`: `report` を渡す。
- `lib/search.ts` は既にkind付き検索タグへ寄せているため、残存呼び出しだけ潰す。

完了条件:
- `rg "getTagLabel\\("` で、意図的fallback以外のkind省略がない。

### Phase 2: UI文言のSSOT化

- browser pageのplaceholderを `uiText.searchPlaceholders` へ移す。
- empty state messageを `uiText.emptyStates` へ移す。
- 全ページを一気に巨大改修せず、今回触る一覧ページ中心に限定する。

完了条件:
- 主要一覧ページの検索placeholderとempty messageが `uiText` 経由になる。

### Phase 3: URL param型ガード

- `lib/typeGuards.ts` または近い名前で `isOneOf` を作る。
- `components/ManufacturersBrowser.tsx`, `components/ReportsBrowser.tsx`, `components/GuidesBrowser.tsx` の `as CompanyType` 等を置換する。
- `RobotsBrowser` は既に実質guard済みだが、同じhelperで統一する。

完了条件:
- URL param由来の `as CompanyType` / `as ReportType` / `as GuideStage` / `as JapanAvailability` を削減する。

### Phase 4: タグ型強化

- `lib/tagRegistry.ts` から `TagValue<K>` をexportする。
- `data/types.ts` の `industryTags` / `taskTags` / `Report.tags` / `Guide.topics` を可能な範囲で `TagValue<...>[]` へ寄せる。
- data層がlibへruntime依存しないように `import type` のみ使う。

完了条件:
- typoタグがvalidationだけでなくTypeScriptでも検出される。

### Phase 5: SourceList横展開

- robots詳細とreports詳細の出典表示を `SourceList` へ置き換える。
- 見た目差分は `className` / heading size propsを最小追加して吸収する。

完了条件:
- 出典リンク、確認日、信頼度表示が1コンポーネントで管理される。

### Phase 6: SelectControl a11y補強

- optionごとに安定idを付ける。
- trigger buttonに `aria-activedescendant` を付ける。
- `aria-controls`, `aria-expanded`, `aria-selected` の整合を保つ。

完了条件:
- キーボード操作の既存挙動を維持したままARIA関連付けが明示される。

### Phase 7: FormSelect送信値修正

- hidden inputは `selectedValue` を送る。
- 表示ラベルが必要な場合に備え、同名を壊さず追加fieldを使うかをコード上で最小対応する。
- Formspreeの受信内容が表示文言変更に依存しないようにする。

完了条件:
- option label変更でフォーム送信の意味が変わらない。

### Phase 8: filterロジック分離

- robots / manufacturers の option生成・param正規化・filter適用を小さな純粋関数へ出す。
- UIコンポーネントを巨大共通化しない。ドメイン別helperに留める。

完了条件:
- filter仕様をUI JSXから分離して読める。

### Phase 9: URL State / SEO

- クエリ付き一覧URLは共有用とし、SEO上はbase pathへcanonicalを寄せる。
- Next metadataで一覧ページのcanonicalを設定する。

完了条件:
- `/robots?industry=...` と `/robots` のSEO方針が矛盾しない。

### Phase 10: production site URL guard

- `NEXT_PUBLIC_SITE_URL` がproductionで未設定またはlocalhostの場合に検出できる仕組みを追加する。
- buildを壊しすぎない範囲で、専用validate scriptまたは既存validationへ統合する。

完了条件:
- Vercel productionでlocalhost metadata/sitemapになる事故を防げる。

### Phase 11: 最終監査

- `npm run validate:data`
- `npm run build`
- `git diff --check`
- 原則別に解消状況を新しい監査docへ記録する。

完了条件:
- 残修正が完了したことをdocsで追跡できる。

## コミット方針

1. この計画書を先にcommit / pushする。
2. 実装は複数commitに分ける。
3. 各commitは原則ごとにまとまりを持たせる。
4. 未追跡の過去計画書は、履歴としてdocs commitに含める。
