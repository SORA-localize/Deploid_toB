# タグ運用メモ

Last reviewed: 2026-06-25

## 目的

`Article.themeTags` / `Article.regionTags` / `Article.industryTags`、`Guide.topics`、`UseCase.industryTags`、`UseCase.taskTags` は、コンテンツ拡張時に表記ゆれが起きやすい。
タグを追加する場合は、データへ直接文字列を足す前に `lib/tagRegistry.ts` へ登録する。

## タグ軸

- `theme`: 記事の論点ファセット。`Article.themeTags` に必須で1〜4個入れる。
- `region`: 記事の地域ファセット。地域非依存の記事では省略する。
- `industry`: ロボット・用途・記事で使う業種ファセット。検索・絞り込み用で、MECEは意図しない。
- `task`: 用途・ロボットのタスクファセット。
- `use-case-domain`: `UseCase.primaryDomain` / `secondaryDomains` の動作軸。
- `guide-topic`: `Guide.topics` の分類。

企業名・機種名はタグにしない。記事では `relatedManufacturerIds` / `relatedRobotIds` に id 参照で入れる。エンティティ化していない組織名は本文・タイトル・出典名などの全文検索で拾う。

## 追加手順

1. `lib/tagRegistry.ts` に `kind`、正規化済み `value`、表示用 `label` を追加する。
2. `data/*.ts` の該当フィールドにタグを追加する。
3. `npm run validate:data` を実行し、未知タグ・重複・参照漏れがないことを確認する。
4. `npm run build` を実行する。

## 方針

- 今はタグをunion型で厳格化しすぎない。
- URLや検索では `value` の正規化キーを使う。
- UI表示では `label` を使う。
- 記事タグは `theme` / `region` / `industry` を混ぜない。`theme` は業種や地域ではなく、記事の主張・論点を表す。
- 意味が近いタグを増やす前に、既存タグで表現できないか確認する。
