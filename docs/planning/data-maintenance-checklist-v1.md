# データ保守運用チェックリスト v1

`data-architecture-redesign-v1.md`（設計）の **運用面の実行チェックリスト**。
日々のデータ追加・更新・slug変更・公開・定期レビューで「何を確認すれば破綻しないか」を手順化する。

> 各セクションは独立して使える。該当する作業の表だけ見ればよい。
> 「自動」= validate / build が機械チェックする（§設計10-1）。「手動」= 人が目視確認。

---

## A. ロボット追加

1. [ ] 公式ページ / press release / 信頼できる報道で事実確認（一次出典優先）
2. [ ] 既存機種の名称・スペック・画像・導入状況更新ではなく、公式に別モデル/別世代/別SKUとして扱うべきか確認
3. [ ] **id を発番**（小文字・ハイフン・英数。発番後は不変。例 `unitree-g1`）。初期は `slug = id`
4. [ ] `publishStatus: 'draft'` で作成
5. [ ] `name` / `nameJa` はモデル名を優先し、メーカー名を重複させない（例: `G1`、`A2 Ultra`）
6. [ ] `manufacturerId` の参照先が存在する（自動：参照切れは build 失敗）
7. [ ] `sources` に `checkedAt` と `reliability` を記入（手動）
8. [ ] **公開ゲート必須項目**を充足（→ セクション F）
9. [ ] `specs` を specSchema にある項目で記入。不明値は**省略**（要確認表示に任せる）
10. [ ] 画像をローカル配置：`public/images/robots/<id>-<role>.<ext>`（外部ホットリンク禁止）
11. [ ] 画像 `rights`（credit / sourceUrl / rights）を記入（自動：参照表示系は必須）
12. [ ] industryTags / taskTags は tagRegistry の登録値のみ（自動：未登録は build 失敗）
13. [ ] `nextReviewBy` を設定（価格含むなら短め）
14. [ ] `npm run build` が通る → 問題なければ `publishStatus: 'published'`

## B. メーカー追加

1. [ ] 既存メーカーの名称変更・ロゴ差し替え・代理店更新ではなく、実体として別会社を追加すべきか確認
2. [ ] id 発番（不変）、`slug = id`、`publishStatus: 'draft'`
3. [ ] 必須：name / country / companyType / japanPresence / website / sources
4. [ ] logo をローカル配置：`public/images/manufacturers/<id>-logo.<ext>`
5. [ ] 国内代理店があれば `domesticDistributors`（name 必須・URL は形式チェック）
6. [ ] `headquarters`（lat/lng）はワールドマップ用（任意）
7. [ ] build 通過 → `published`

## C. ニュース記事（articles）追加

1. [ ] id 発番、`slug = id`
2. [ ] **`category` を1つ選択**（news / interview / company-report / analysis / policy）
3. [ ] **`whyItMatters` を必ず書く**（速報でも省略不可＝メディアの付加価値）
4. [ ] `publishedAt`（鮮度ソート用）を記入
5. [ ] hero画像がある場合は `public/images/articles/<id>/hero.<ext>` に置く
6. [ ] hero画像の `ImageAsset.rights` を記入する（自動：空src以外は検証対象）
7. [ ] `related*Ids` は **id で**結ぶ（自動：参照切れは build 失敗）
8. [ ] tags は tagRegistry 登録値のみ
9. [ ] `contentKind: 'sample'` の場合は noindex・本番除外を確認（§設計11.9）
10. [ ] build 通過 → `published`

---

## D. slug 変更（命名修正・URL変更）

> id・参照は**絶対に触らない**。変えるのは slug だけ。

1. [ ] 新 slug を決める（小文字・ハイフン・英数）
2. [ ] **旧 slug を `previousSlugs` に追記**（301リダイレクト元になる）
3. [ ] `slug` を新値に更新
4. [ ] `id` と全参照（`*Id` / `*Ids`）は**据え置き**（無改修）
5. [ ] 旧 slug と同じ slug の新規レコードを作らない（`previousSlugs` と現存 slug が衝突する）
6. [ ] 自動：`previousSlugs` が現存 slug と衝突しないか（build チェック）
7. [ ] 手動：旧URLが新URLへ 301 されるか確認
8. [ ] 手動：お気に入り・比較が壊れないか（client状態は id 保持のため影響なし）

## D2. 既存レコード更新（名称・スペック・画像・出典）

> 名前や仕様が変わっただけなら新規レコードを作らない。`id` は維持し、必要なフィールドだけ更新する。

1. [ ] 更新対象の既存 `id` を確認
2. [ ] 表示名変更なら `name` / `nameJa` を更新。URL変更が必要な場合だけ `slug` と `previousSlugs` を更新
3. [ ] スペック更新なら `lib/specSchema.ts` にあるキーだけを使う。未知キーが必要なら先に specSchema 追加を検討
4. [ ] 価格・国内入手性・代理店・導入状況は出典を再確認し、`sources.checkedAt` / `nextReviewBy` を更新
5. [ ] 画像差し替えは既存 `id` ベースのパスへ配置し、古い画像が不要なら参照が残っていないか確認
6. [ ] 関連記事・用途・導入事例を追加する場合は `slug` ではなく `id` で結ぶ
7. [ ] `npm run validate:data` を実行する

## E. レコードの提供終了 / 後継機（archive）

1. [ ] `publishStatus: 'archived'` に変更
2. [ ] 後継機があれば **`supersededById`** に後継の id を設定
3. [ ] 自動：`supersededById` の参照先が存在するか
4. [ ] 手動：詳細・関連欄に「提供終了」「後継機: X」が表示されるか
5. [ ] このレコードを related で参照している記事/用途が無言脱落しないか確認

---

## F. 公開ゲート（draft → published 昇格時の必須項目）

> 自動：error レベルで build をブロック（§設計10-1, 11.5）。

**Robot**
- [ ] id / slug / name / manufacturerId
- [ ] summary / category / deploymentStage / buyerReadiness / japanAvailability
- [ ] sources が空でない
- [ ] 画像が未ローカル化なら warning（推奨：ローカル化）

**Manufacturer**
- [ ] id / slug / name / country / companyType / japanPresence
- [ ] sources が空でない

**Article**
- [ ] id / slug / title / category / publishedAt / whyItMatters
- [ ] sources が空でない（`contentKind:'sample'` を除く）

---

## G. 定期鮮度レビュー（月次 or 四半期）

1. [ ] `checkedAt` が既定日数を超えたレコード一覧を validate warning で確認
2. [ ] 揮発性の高い値（価格・代理店・在庫）を優先再確認
3. [ ] 再確認したら `checkedAt` と `nextReviewBy` を更新
4. [ ] 価格は出典再取得（推測値を入れない・不明は「要確認」）
5. [ ] リンク切れ画像が無いか（ローカル化が完了していれば低リスク）
6. [ ] archived の後継リンク（supersededById）が最新か

---

## H. デプロイ前ゲート（毎回）

1. [ ] `npm run build` が通る（= validate error が0：参照切れ・id重複・未登録タグ・slug衝突・公開必須欠落なし）
2. [ ] validate warning を確認（未ローカル画像・鮮度切れ）— ブロックはしないが把握
3. [ ] `sitemap.xml` が published のみを含む
4. [ ] draft / sample / archived の noindex を確認
5. [ ] 主要タブ（一覧・比較・詳細・記事）が表示される（手動 or スモーク）

---

## I. タグ / enum / スペック項目を増やすとき

- **タグ追加** → `lib/tagRegistry.ts` に1行 → 該当レコードに付与（未登録は build 失敗）。`value` は安定キー、`label` はUI表示用なので略称・自然な短縮表記でよい
- **enum値追加** → 型 ＋ `lib/labels.ts`（ラベル）＋ `lib/display.ts`（順序）を更新（自動：順序網羅チェックあり）
- **スペック項目追加** → `lib/specSchema.ts` に1行 → 該当ロボットの `specs` に値（型・スペック表・比較表が自動追従）

> 原則：**正本は1箇所**。直書きで増やさない（§設計5）。

---

## J. 表示名 / ソート方針

- ロボット名はモデル名を正本にする。メーカー名は `manufacturerId` から別表示されるため、`name` / `nameJa` にメーカー接頭辞を入れない
- メーカー名・タグ名のUI表示は `lib/labels.ts` / `lib/tagRegistry.ts` の `label` を使う。表示用 `label` は略称でもよいが、検索・参照に使う `value` / `id` は変えない
- ロボット一覧・メーカー一覧・比較候補の基本順は表示側のフィルタ/ソート処理で決める。データ取得関数や `data/*.ts` の配列順に依存しない
- 手動で上位表示したい場合は配列順を変えず、既存の `featuredRank` やページ固有の明示ソートを使う

---

## K. AIに素材配置だけ依頼する場合の最低入力

ユーザーは最低限、以下を伝えればよい。AIは既存 `id` と配置先を確認してから実装する。

- 対象種別: robot / manufacturer / article
- 対象名または既存 `id`
- 素材の用途: hero / logo / transparent / side / inOperation / scale / article hero など
- 権利情報: 自社素材、公式提供、CC0、CC BY 4.0、許諾済み、確認中など
- credit / sourceUrl / rightsHolder / checkedAt

AI側の実装手順:

1. [ ] 対象レコードの `id` を確認する。見つからなければ新規追加か既存更新かを確認する
2. [ ] 素材を `public/images/...` の `id` ベースパスに置く
3. [ ] 該当レコードの `ImageAsset` を更新する
4. [ ] `getDisplayableAsset()` の表示ポリシーに通る rights か確認する
5. [ ] `npm run validate:data` と、表示に関わる場合は `npm run build` を実行する

---

## 関連ドキュメント

- 設計の本体: `data-architecture-redesign-v1.md`
- データ運用の旧ガイド: `humanoid_data_management_guide_v1.md`（本書と設計書の確定後に整合更新）
- 型の真実源: `nextjs_data_types_v1.ts` → `data/types.ts`
