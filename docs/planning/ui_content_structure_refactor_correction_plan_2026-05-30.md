# UI・データ構造リファクタ修正計画

Date: 2026-05-30

## 目的

ここまでの `ui_content_structure_refactor_plan_v1.md` と最終監査に対して、実装後の追加データ・追加実装を「不備がある前提」で再監査し、DRY / KISS / Single Source of Truth / Separation of Concerns / Type Safety / Accessibility / Responsive / URL State / Operational Safety の観点で修正計画を作る。

この計画では、すぐに検索ライブラリを入れることは目的にしない。現状の軽量検索を保ちつつ、将来 Fuse.js / Algolia などへ移す場合にデータ構造と検索境界が邪魔にならない状態へ整える。

## 現状確認

- `git status --short --branch`: clean / `main...origin/main`
- `npm run validate:data`: OK
- `npm run build`: OK
- 直近で `9d13019` と `f2aa7d7` によりメーカー・ロボットデータが増えた。
- 既存の最終監査 `ui_content_structure_refactor_final_audit_2026-05-30.md` は、データ追加前の前提を含むため更新が必要。

## 主要な不備

| 優先度 | 原則 | 不備 | 根拠 | 修正方針 |
| --- | --- | --- | --- | --- |
| P0 | Single Source of Truth / Type Safety | メーカー国の表示順が現在のデータを網羅していない | `lib/display.ts:43` は `Japan, USA, China, Norway` のみ。`data/manufacturers.ts` には `Canada, Germany, Spain` も存在する。 | 表示順を現データに合わせ、検証CLIで「表示順定義にない国」を検出する。 |
| P0 | Operational Safety | 最終監査が最新実装を反映していない | `ui_content_structure_refactor_final_audit_2026-05-30.md:48-53` が当時の残リスクで止まっている。 | 修正後に再監査ファイルを作成し、最新コミット基準の確認結果を残す。 |
| P1 | Type Safety / SSOT | タグ表示で `kind` を省略している箇所が残る | `components/UseCasesBrowser.tsx`, `components/GuidesBrowser.tsx`, `components/ReportsBrowser.tsx`, `src/app/guides/[slug]/page.tsx`, `src/app/page.tsx`, `lib/search.ts:91` | `getTagLabel(value, kind)` を原則化し、検索文書にもタグ種別を渡す。 |
| P1 | DRY / SSOT | ロボット仕様・導入判断の表示ロジックが複数箇所に重複 | `components/RobotCard.tsx:28-36`, `src/app/robots/[slug]/page.tsx:64-87`, `components/ComparisonRobotPanel.tsx:52-67` | 汎用カード化ではなく、`lib/robotDisplay.ts` の小さな行生成ヘルパーへ集約する。 |
| P1 | DRY | 出典リストが `SourceList` と詳細ページ内実装で重複 | `components/SourceList.tsx`, `src/app/reports/[slug]/page.tsx:115-141`, `src/app/robots/[slug]/page.tsx:235-261` | reports / robots 詳細も `SourceList` を使う。ただしページごとの外枠差分はpropsで最小対応する。 |
| P1 | Separation of Concerns | 検索・URLパラメータ検証・フィルタ候補生成・描画がブラウザコンポーネント内に集中 | `components/RobotsBrowser.tsx:27-120`, `components/ManufacturersBrowser.tsx:29-123` | UI部品の巨大共通化ではなく、filter option生成・filter適用だけを純粋関数または小さなhookに分離する。 |
| P1 | Accessibility | `SelectControl` のcombobox/listbox実装が最低限で、active optionの関連付けが弱い | `components/SelectControl.tsx:106-142` は `aria-activedescendant` と option id がない。 | option id / `aria-activedescendant` / selected/focused状態を明示し、キーボード操作を再確認する。 |
| P1 | Operational Safety / Type Safety | フォーム送信値が安定IDではなく表示ラベルになっている | `components/FormSelect.tsx:33` | hidden inputは `selectedValue` を送る。必要なら別名で表示ラベルも送る。Formspree側の受信影響を確認する。 |
| P2 | URL State / SEO | フィルタURLのSEO方針が未定義 | `useUrlFilters` は共有可能URLを作るが、filtered URLのcanonical/noindex方針は未整理。 | robots / manufacturers のクエリ付きURLをインデックス対象にするか、canonicalを基本URLへ寄せるか決める。 |
| P2 | Responsive | デスクトップ中心の修正で、スマホ実機相当の回帰確認が未完了 | 最終監査でもモバイル確認未実施と明記。 | 実装フェーズの最後に 360px / 768px / desktop の確認チェックを必須化する。 |
| P2 | Operational Safety | productionで `NEXT_PUBLIC_SITE_URL` が未設定でも localhost fallback になる | `lib/site.ts:3` | production build時の警告または検証スクリプトを追加し、Vercel env checklistに入れる。 |

## 修正フェーズ

### Phase 0: 最新前提の固定

実施内容:
- 現在の `main` と `origin/main` が一致していることを再確認する。
- `npm run validate:data`, `npm run build`, `git diff --check` を基準チェックにする。
- 既存最終監査は「過去監査」として扱い、この修正計画の完了時に新しい再監査を作る。

完了条件:
- 作業開始時点の基準が明記されている。
- 修正対象が「機能追加」ではなく「計画逸脱・構造不備の是正」に限定されている。

### Phase 1: データ分類・表示順のSSOT修正

実施内容:
- `manufacturerCountryOrder` を現在の国データに合わせる。
- `validate:data` に「表示順定義がデータの値を全て含むか」を検証するルールを追加する。
- 同じ検証方針を `robotCategoryOrder`, `japanAvailabilityOrder`, `companyTypeOrder`, `companyStatusOrder` にも適用できる形にする。

注意点:
- 国名を無理にunion型へ閉じるかは別判断。外部データ増加時に国が増えるため、まずは検証で漏れを検知する。
- 地域分類を増やす場合も、国名そのものとは別フィールドにする。

完了条件:
- 新しい国を追加して表示順に入れ忘れた場合、検証が落ちる。
- フィルタの並びがデータ追加後も意図通りになる。

### Phase 2: タグのkind明示と検索境界の整理

実施内容:
- UI上の `getTagLabel(tag)` を `getTagLabel(tag, 'industry')` などのkind明示へ置き換える。
- `getTagSearchValues` と `createSearchDocumentTags` にkindを渡せるようにする。
- guide / report / useCase の検索文書作成時に、タグの文脈を明示する。

注意点:
- Fuse.js 向けの専用構造へ寄せすぎない。検索ドキュメントは `title`, `fields`, `tags` の中立的な形を維持する。
- 同じ文字列タグが別kindで別ラベルを持つ将来ケースを前提にする。

完了条件:
- kindなしの `getTagLabel(...)` 呼び出しが、意図的なfallback以外に残らない。
- 既存検索の挙動を維持しつつ、タグ文脈が検索ドキュメントに反映される。

### Phase 3: ロボット表示ロジックと出典表示のDRY化

実施内容:
- `lib/robotDisplay.ts` を追加し、仕様値の単位・未定義時表示・導入判断行を生成する。
- `RobotCard`, `RobotDetailPage`, `ComparisonRobotPanel` は、そのhelperから必要な行だけ選ぶ。
- `SourceList` を reports / robots 詳細にも適用する。外枠の見た目差分は最小propsで吸収する。

注意点:
- なんでも共通化する巨大 `RobotInfoTable` は作らない。共通化するのは「値の作り方」であり、レイアウトはページ側に残す。
- これによりKISSとDRYの両方を守る。

完了条件:
- 単位表記や `TBD_LABEL` の扱いが1箇所で変えられる。
- 出典表示のリンク・確認日・信頼度表記が1箇所で変えられる。

### Phase 4: ブラウザページのSoC修正

実施内容:
- robots / manufacturers の filter option生成、URL param正規化、filter適用を小さな関数へ分離する。
- UIコンポーネントは「状態取得」「イベント」「描画」を中心に残す。
- 検索ライブラリを今入れない前提で、`lib/search.ts` のAPIを将来差し替えやすいまま維持する。

注意点:
- `RobotsBrowser` と `ManufacturersBrowser` を無理に1つの汎用Browserへ統合しない。ドメインが違うため、抽象化しすぎるとKISS違反になる。
- 共通化するなら URL param更新や option生成のような狭い責務に留める。

完了条件:
- UIを読まなくても、フィルタ条件と検索条件の仕様が関数単位で追える。
- 新しいフィルタ追加時の変更箇所が明確になる。

### Phase 5: Select / Form のa11yと運用安全性修正

実施内容:
- `SelectControl` に option id と `aria-activedescendant` を追加する。
- キーボード操作、マウス操作、フォーカス、Escape/Tabの挙動を確認する。
- `FormSelect` は安定valueを送信し、必要なら表示ラベルを別hidden fieldで送る。

注意点:
- Formspreeの既存受信内容が変わるため、フィールド名の互換性を確認する。
- 見た目より、支援技術とフォーム運用の意味を優先する。

完了条件:
- フォーム送信値が表示文言変更に影響されない。
- Selectの操作がキーボードだけで完結し、ARIA関連付けが明示される。

### Phase 6: URL State / SEO / Responsive の方針固定

実施内容:
- robots / manufacturers のクエリ付きURLについて、SEO方針を決める。
- 方針に応じて canonical metadata またはドキュメント化を行う。
- 主要ページを 360px / 768px / desktop で確認する。

注意点:
- フィルタURLはユーザー共有には有用だが、検索エンジンには重複URLを作りやすい。
- スマホ最適化は後回しでも、崩壊していないことの最低確認は必要。

完了条件:
- 共有可能URLとSEOの扱いが矛盾しない。
- モバイルでテキスト重なり・横スクロール・操作不能がないことを確認済みにする。

### Phase 7: Operational Safety と最終再監査

実施内容:
- productionで `NEXT_PUBLIC_SITE_URL` が未設定のままにならない検知を追加するか、少なくともVercel設定チェックリストに明記する。
- `npm run validate:data`, `npm run build`, `git diff --check` を再実行する。
- 新しい最終監査ファイルを作成し、今回の不備が解消されたことを原則別に記録する。

完了条件:
- 変更後の最終監査が、最新コミット・最新データを基準にしている。
- Vercel運用で必要な環境変数が明文化されている。

## 実装順序

1. Phase 1: データ分類・表示順のSSOT修正
2. Phase 2: タグkind明示と検索境界整理
3. Phase 3: ロボット表示・出典表示のDRY化
4. Phase 4: robots / manufacturers ブラウザのSoC修正
5. Phase 5: Select / Formのa11yと送信値修正
6. Phase 6: URL / SEO / Responsive方針固定
7. Phase 7: 最終再監査

## フェイルセーフ

- 各Phaseの前後で `npm run validate:data` を通す。データ構造に触れたPhaseでは必須。
- UI共通化では、まず既存表示と同じ結果を返すhelperを作り、ページごとのレイアウト変更は最後にする。
- a11y修正では見た目の変更を最小化し、操作の意味だけを強化する。
- 検索ライブラリは今回入れない。検索UX改善が必要になった時点で、現行 `lib/search.ts` の境界内で Fuse.js などへ置き換える。
- 1Phaseごとに差分を確認し、計画外のリファクタが混ざったらそこで止めて戻す。

## この計画が解決すること

- データ追加後にフィルタ表示順が暗黙に崩れる問題を検証で防ぐ。
- タグが増えたときに、同じ文字列でも文脈ごとに正しいラベル・検索語を使える。
- ロボット仕様や出典表示の表記ゆれを1箇所で直せる。
- robots / manufacturers ページの検索・フィルタ仕様をUIから分離し、将来の検索ライブラリ導入を安全にする。
- フォーム送信値とSelect操作の意味を安定させる。
- 最終監査を最新データ基準へ更新し、元の計画に戻れる状態を作る。
