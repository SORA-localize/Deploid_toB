# Deploid Data Work Guide

Last reviewed: 2026-06-13

この文書は、AIでデータ追加・更新を行うときの入口です。
実装上の正本は `data/types.ts` と `lib/*` にあります。

## データの種類

- `data/robots.ts` — ロボット個票。導入判断、スペック、価格メモ、日本入手性、比較材料
- `data/manufacturers.ts` — メーカー/供給体制。企業種別、日本窓口、サポート、調達メモ
- `data/articles.ts` — 記事。公開URLは `/reports`。速報でも `whyItMatters` を必須にする
- `data/deployments.ts` — 実在の導入事例。Homeのワールドマップ根拠データ
- `data/guides.ts` — 導入判断ガイド。常設コンテンツ
- `data/useCases.ts` — 用途から探す逆引き。一次情報が薄い間は慎重に扱う
- `data/articlePlacements.ts` — 記事タブ/home注目記事の掲載枠
- `data/types.ts` — 型の正本

## 事前に見るもの

- `../../ai_implementation_workflow_prompt.md` — AI作業の共通手順
- `../planning/data-maintenance-checklist-v1.md` — 追加・公開・slug変更・鮮度レビューのチェックリスト
- `../planning/data-architecture-redesign-v1.md` — id/slug分離、参照、正本設計
- `../planning/copyright_and_media_rights_policy_v1.md` — 画像・ロゴ・引用を扱う場合
- `tagging.md` — タグ追加・表記ゆれ防止

## 基本ルール

- 参照は `id` で結ぶ。`slug` は公開URL専用。slugを変えるときは `previousSlugs` に旧slugを追記する
- `id` は発番後に変えない。命名修正では `slug` / `name` / `nameJa` だけを変える。例: A2 Ultra は `id: 'agibot-a2-max'`、公開slugは `agibot-a2-ultra`
- 公式ページ、press release、信頼できる報道を確認し、`sources` に `url` / `checkedAt` / `reliability` を残す
- AIの推測を事実として入れない。不明なスペックや価格は省略または要確認メモにする
- 新規レコードは原則 `publishStatus: 'draft'` から作る
- 記事は `category` と `whyItMatters` を必ず入れる
- 画像・ロゴは `ImageAsset.rights` を必ず持たせる。外部ホットリンクは避け、可能なら `public/images/` にローカル配置する
- タグは `lib/tagRegistry.ts` に登録済みの `value` を使う。`label` はUI表示用なので、短い略称や自然な日本語表記でよい
- スペック項目は `lib/specSchema.ts` にあるキーだけを使う
- ページから `data/*.ts` を直接検索しない。取得・関連解決は `lib/data.ts` 経由にする
- ロボット名はメーカー名を重複させない。メーカー名は `manufacturerId` から別表示されるため、`Unitree G1` ではなく `G1` のようにモデル名を入れる
- ロボット一覧・メーカー一覧の表示順は `lib/data.ts` の `getRobots()` / `getManufacturers()` がアルファベット順で決める。`data/*.ts` の配列順に依存しない

## AIに渡す作業手順

1. 対象データと目的を決める。例: 「Unitree G1 の価格・日本入手性・公式出典を更新」
2. 公式/一次情報を優先して出典候補を列挙する
3. 既存の `id`、関連先ID、登録済みタグ、スペックキーを確認する
4. `data/*.ts` を最小差分で更新する
5. `npm run validate:data` を実行する
6. UI表示に影響する変更なら `npm run build` まで通す

## 検証コマンド

```bash
npm run validate:data
npm run build
```

`validate:data` は id重複、参照切れ、未知タグ、slug衝突、公開必須項目を検出します。
warning は鮮度切れや画像ローカル化推奨で、error は公開前に必ず直します。
