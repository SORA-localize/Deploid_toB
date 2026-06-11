# データ保守運用チェックリスト v1

`data-architecture-redesign-v1.md`（設計）の **運用面の実行チェックリスト**。
日々のデータ追加・更新・slug変更・公開・定期レビューで「何を確認すれば破綻しないか」を手順化する。

> 各セクションは独立して使える。該当する作業の表だけ見ればよい。
> 「自動」= validate / build が機械チェックする（§設計10-1）。「手動」= 人が目視確認。

---

## A. ロボット追加

1. [ ] 公式ページ / press release / 信頼できる報道で事実確認（一次出典優先）
2. [ ] **id を発番**（小文字・ハイフン・英数。発番後は不変。例 `unitree-g1`）。初期は `slug = id`
3. [ ] `publishStatus: 'draft'` で作成
4. [ ] `manufacturerId` の参照先が存在する（自動：参照切れは build 失敗）
5. [ ] `sources` に `checkedAt` と `reliability` を記入（手動）
6. [ ] **公開ゲート必須項目**を充足（→ セクション F）
7. [ ] `specs` を specSchema にある項目で記入。不明値は**省略**（要確認表示に任せる）
8. [ ] 画像をローカル配置：`public/images/robots/<id>-<role>.<ext>`（外部ホットリンク禁止）
9. [ ] 画像 `rights`（credit / sourceUrl / rights）を記入（自動：参照表示系は必須）
10. [ ] industryTags / taskTags は tagRegistry の登録値のみ（自動：未登録は build 失敗）
11. [ ] `nextReviewBy` を設定（価格含むなら短め）
12. [ ] `npm run build` が通る → 問題なければ `publishStatus: 'published'`

## B. メーカー追加

1. [ ] id 発番（不変）、`slug = id`、`publishStatus: 'draft'`
2. [ ] 必須：name / country / companyType / japanPresence / website / sources
3. [ ] logo をローカル配置：`public/images/manufacturers/<id>-logo.<ext>`
4. [ ] 国内代理店があれば `domesticDistributors`（name 必須・URL は形式チェック）
5. [ ] `headquarters`（lat/lng）はワールドマップ用（任意）
6. [ ] build 通過 → `published`

## C. ニュース記事（articles）追加

1. [ ] id 発番、`slug = id`
2. [ ] **`category` を1つ選択**（news / interview / company-report / analysis / policy）
3. [ ] **`whyItMatters` を必ず書く**（速報でも省略不可＝メディアの付加価値）
4. [ ] `publishedAt`（鮮度ソート用）を記入
5. [ ] `related*Ids` は **id で**結ぶ（自動：参照切れは build 失敗）
6. [ ] tags は tagRegistry 登録値のみ
7. [ ] `contentKind: 'sample'` の場合は noindex・本番除外を確認（§設計11.9）
8. [ ] build 通過 → `published`

---

## D. slug 変更（命名修正・URL変更）

> id・参照は**絶対に触らない**。変えるのは slug だけ。

1. [ ] 新 slug を決める（小文字・ハイフン・英数）
2. [ ] **旧 slug を `previousSlugs` に追記**（301リダイレクト元になる）
3. [ ] `slug` を新値に更新
4. [ ] `id` と全参照（`*Id` / `*Ids`）は**据え置き**（無改修）
5. [ ] 自動：`previousSlugs` が現存 slug と衝突しないか（build チェック）
6. [ ] 手動：旧URLが新URLへ 301 されるか確認
7. [ ] 手動：お気に入り・比較が壊れないか（client状態は id 保持のため影響なし）

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

- **タグ追加** → `lib/tagRegistry.ts` に1行 → 該当レコードに付与（未登録は build 失敗）
- **enum値追加** → 型 ＋ `lib/labels.ts`（ラベル）＋ `lib/display.ts`（順序）を更新（自動：順序網羅チェックあり）
- **スペック項目追加** → `lib/specSchema.ts` に1行 → 該当ロボットの `specs` に値（型・スペック表・比較表が自動追従）

> 原則：**正本は1箇所**。直書きで増やさない（§設計5）。

---

## 関連ドキュメント

- 設計の本体: `data-architecture-redesign-v1.md`
- データ運用の旧ガイド: `humanoid_data_management_guide_v1.md`（本書と設計書の確定後に整合更新）
- 型の真実源: `nextjs_data_types_v1.ts` → `data/types.ts`
