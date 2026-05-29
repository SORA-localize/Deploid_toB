# タグ運用メモ

Last reviewed: 2026-05-30

## 目的

`Guide.topics`、`Report.tags`、`UseCase.industryTags`、`UseCase.taskTags` は、コンテンツ拡張時に表記ゆれが起きやすい。
タグを追加する場合は、データへ直接文字列を足す前に `lib/tagRegistry.ts` へ登録する。

## 追加手順

1. `lib/tagRegistry.ts` に `kind`、正規化済み `value`、表示用 `label` を追加する。
2. `data/*.ts` の該当フィールドにタグを追加する。
3. `npm run validate:data` を実行し、未知タグ・重複・参照漏れがないことを確認する。
4. `npm run build` を実行する。

## 方針

- 今はタグをunion型で厳格化しすぎない。
- URLや検索では `value` の正規化キーを使う。
- UI表示では `label` を使う。
- 意味が近いタグを増やす前に、既存タグで表現できないか確認する。
