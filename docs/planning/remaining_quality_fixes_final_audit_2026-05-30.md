# 残修正 最終監査

Date: 2026-05-30

## 対象

`remaining_quality_fixes_execution_plan_2026-05-30.md` に基づき、`filter-tag-redesign` 後に残っていた構造・型・UI文言・アクセシビリティ・運用安全性の不備を確認した。

## 実施内容

- `getTagLabel(...)` のUI呼び出しをkind明示へ変更。
- 検索placeholderとempty stateの主要文言を `uiText` へ集約。
- URL param由来の型アサーションを `isOneOf` 型ガードへ置換。
- `tagRegistry` 由来の `TagValue<K>` を追加し、Robot / Guide / UseCase / Report のタグ型を強化。
- robot / report 詳細の出典表示を `SourceList` へ統一。
- `SelectControl` に option id と `aria-activedescendant` を追加。
- `FormSelect` の送信値を表示ラベルから安定valueへ変更し、表示ラベルは別fieldへ分離。
- robot / manufacturer のfilter option生成・param正規化・filter適用をhelperへ分離。
- robots / manufacturers のcanonicalをbase pathへ設定。
- Vercel productionで `NEXT_PUBLIC_SITE_URL` がlocalhostのままになる事故をguard。
- 表示順定義の網羅性を `validate:data` で検出するように追加。

## 検証結果

- `npm run validate:data`: OK
- `npm run build`: OK
- `git diff --check`: OK

## 原則別確認

- DRY: ロボット仕様値生成は `lib/robotDisplay.ts`、出典表示は `SourceList` に集約。
- KISS: UIコンポーネントの巨大共通化は避け、表示値生成・filter処理だけをhelper化。
- Single Source of Truth: タグラベルと表示順は `tagRegistry`、主要UI文言は `uiText` に集約。
- Separation of Concerns: robots / manufacturers のfilter処理をUI JSXから分離。
- Type Safety: タグ値はregistry由来union型、URL paramは型ガードで正規化。
- Accessibility: Selectのactive option関連付けをARIAで明示。
- Responsive: 既存レイアウトを維持し、今回の内部修正で新しい固定幅UIは追加していない。
- URL State / SEO: 絞り込みURLは共有用、canonicalは一覧base pathへ寄せる。
- Operational Safety: Formspree送信値とproduction site URLを安定化。

## 残リスク

- スマホ最適化そのものは別フェーズ。今回の修正では大きなUI変更を増やしていない。
- 検索UXは引き続き軽量な正規化ワード一致。検索ログやデータ量が増えた時点でFuse.js等を検討する。
- タグ分類の事業的妥当性は運用しながら調整する。現時点ではカード上にタグUIを増やさず、裏側の検索・絞り込み・検証用に留める。
