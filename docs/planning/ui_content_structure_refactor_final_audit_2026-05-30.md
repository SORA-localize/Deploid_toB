# UI・内容・内部構造リファクタ最終監査

Date: 2026-05-30

## 実施済みフェーズ

1. UI文言・日本語表記のSSOT化
2. フィルタ分類と表示順のMECE化
3. robots / manufacturers のURL state化
4. FilterSelect / FormSelect のlistbox挙動共通化
5. 比較ページの比較専用UI化
6. ガイド詳細の3カラム構造整理
7. タグ辞書とデータ検証CLI追加
8. 日本語UIのuppercase / tracking / line-clamp調整
9. 最終監査

## 検証結果

- `git status --short --branch`: clean / `main...origin/main`
- `git diff --check`: OK
- `npm run validate:data`: OK
- `npm run build`: OK
- 旧UI文言検索:
  - `All Types`
  - `All Status`
  - `VIEW FULL PROFILE`
  - `COMPARISON SHEET`
  - `Read Guide`
  - `Featured Guide`
  - `Featured Report`
  - `ACTIVE MODELS`
  - `PRE-RELEASE`
  - `Production Ready`
  - いずれも対象コード内でヒットなし

## 原則別確認

- DRY: UI文言は `lib/uiText.ts`、enumラベルは `lib/labels.ts`、タグは `lib/tagRegistry.ts` に分離。
- KISS: Select共通化は `SelectControl` に限定し、巨大な汎用UI framework化はしていない。
- Single Source of Truth: フィルタ順序は `lib/display.ts`、タグ表示は `lib/tagRegistry.ts` に集約。
- Separation of Concerns: URL stateは `useUrlFilters`、検索文書は `lib/search.ts`、表示UIは各componentへ分離。
- Type Safety: 既存union型の表示順を型付き配列で管理。タグは未知タグ検出をvalidationへ追加。
- Accessibility: Selectのlabel / combobox / listbox構造を共通部品に集約。
- Responsive: 固定3カラムはdesktopのみ維持。比較ページは専用パネル化し、カード流用を解消。
- URL State / SEO: robots / manufacturers の検索・絞り込みURL共有に対応。
- Operational Safety: Formspree ID、site URL、media policy はenv参照のまま。秘密値直書きなし。

## 残リスク

- 実ブラウザでのモバイル確認は未実施。ユーザー方針どおりスマホ最適化は後続で扱う。
- 画像・ロゴの権利は `reference-attributed` 前提。許諾取得・削除依頼フローは運用課題として残る。
- 検索はまだ軽量な正規化ワード一致。Fuse.js / Algolia 等の導入判断は、データ量と検索ログが増えてからでよい。
- `SourceList` はガイド詳細に導入済みだが、reports / robots詳細への横展開は未実施。
