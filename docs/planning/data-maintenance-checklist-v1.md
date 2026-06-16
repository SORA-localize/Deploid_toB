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
    - フォーマット：**WebP 推奨**。JPG/PNG 可
    - ファイルサイズ：**300KB 以下**（超えたら [Squoosh](https://squoosh.app/) で圧縮）
    - 最大解像度：**1920px 幅**（`sips -Z 1920 <file>` でリサイズ可）
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
6. [ ] `headquarters`（lat/lng）はワールドマップ用（任意）。設定すると Home ワールドマップにドットが表示される
7. [ ] **その国が初登場**の場合は `components/ManufacturerMapCopy.tsx` の `REGION` 定数に `'CountryName': { name: '日本語名', a3: 'ISO3文字コード' }` を追加する（手動。漏れてもビルドは通るが、地図カードの国名がフォールバック表示になる）
8. [ ] build 通過 → `published`

## C. ニュース記事（articles）追加

1. [ ] id 発番、`slug = id`
2. [ ] **`category` を1つ選択**（news / interview / company-report / analysis / policy）
3. [ ] **`type` を ArticleType の有効値から選択**（analysis / deployment-report / interview / event-report / policy-update / case-study / news-brief / tech-update / market-analysis）。`category` と混同しない
4. [ ] **`whyItMatters` を必ず書く**（速報でも省略不可＝メディアの付加価値）
5. [ ] **`publishedAt` = Deploidがこの記事を公開した日**（元ニュースの発生日ではない）。元ニュースの日付は `sources[].publishedAt` に書く。昨日のニュースを今日書いたなら `publishedAt` は今日の日付になる。`updatedAt` はデータレコードを最後に編集した日
6. [ ] **`sources` に `checkedAt` と `reliability` を記入**（自動：published かつ非 sample の空 sources は build 失敗）
7. [ ] **`sources[].url` にHTTPアクセスして 404/403 でないことを確認**（公開前の必須チェック。アクセス不可 URL を published 記事に入れない）
8. [ ] **出典は原則2件以上**。単一ソースのみの場合はその理由を記録し、可能なら追加出典を探してから published にする
9. [ ] hero画像がある場合は `public/images/articles/<id>/hero.<ext>` に置く（外部ホットリンク禁止）。画像が取れない場合は `src: ''` のままでよい（カードにプレースホルダーが出る。`src: ''` は valid）
    - フォーマット：**WebP 推奨**。JPG/PNG 可
    - ファイルサイズ：**300KB 以下**（[Squoosh](https://squoosh.app/) で圧縮）
    - 最大解像度：**1920px 幅**
10. [ ] hero画像の `ImageAsset.rights` を記入する（`commercial-permitted` または `reference-attributed` のみ公開可。権利が確認できない画像は `src: ''` のまま公開する。詳細は `docs/planning/copyright_and_media_rights_policy_v1.md`）（自動：空src以外は検証対象）
11. [ ] `related*Ids` は **id で**結ぶ（自動：参照切れは build 失敗）
12. [ ] tags は tagRegistry 登録値のみ（`lib/tagRegistry.ts` の `kind: 'article'` の value を使う）
13. [ ] **本文量を確認**：速報（news-brief）でも800文字以上、分析・レポートは1,500文字以上を目安にする
14. [ ] **型の確認**：`requiredCapabilities` は `Capability` 型の値のみ。`lib/tagRegistry.ts` のタグ value を誤って入れない
15. [ ] **既存記事を全削除して置き換えない**。更新は同じ `id` で行い、url 変更が必要なら `previousSlugs` に旧 slug を追記する
16. [ ] `contentKind: 'sample'` の場合は noindex・本番除外を確認（§設計11.9）
17. [ ] build 通過 → `published`

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

> 「型必須」＝欠落すると `tsc` / build が落ちる（TypeScript 型で強制）。「自動」＝ validate が機械チェック（参照・タグ・日付・出典・画像・鮮度・順序・双方向対称）。
> validate に汎用 publish-gate は無いため、必須フィールドの大半は型で担保される。

**Robot**
- [ ] id / slug / name / manufacturerId
- [ ] summary / category / deploymentStage / buyerReadiness / japanAvailability
- [ ] sources が空でない（自動：常時必須）
- [ ] 画像が未ローカル化なら warning（推奨：ローカル化）

**Manufacturer**
- [ ] id / slug / name / country / companyType / japanPresence
- [ ] sources が空でない（自動：常時必須）

**Article**
- [ ] id / slug / title / category / publishedAt / whyItMatters
- [ ] sources が空でない（自動：published かつ `contentKind:'sample'` 以外で必須）

**Guide**
- [ ] 型必須：id / slug / title / description / stage / order / topics / targetReaders / relatedRobotIds / relatedUseCaseIds
- [ ] topics は `guide-topic` 登録タグ / relatedRobotIds は id 参照（自動）
- [ ] relatedUseCaseIds と相手 useCase.relatedGuideIds が双方向に揃う（自動：非対称は build 失敗）
- [ ] 出典（sources）は手動推奨（validate 未強制）

**UseCase**
- [ ] 型必須：id / slug / title / maturityLevel / buyerReadiness / environment / requiredCapabilities / atAGlance{3} / overview / whyItMatters / capabilityNotes / environmentRequirements / whyHardToday / japanDeploymentConditions / candidateRobotIds / relatedGuideIds
- [ ] industryTags・taskTags は登録タグ / candidateRobotIds は id 参照（自動）
- [ ] relatedGuideIds と相手 guide.relatedUseCaseIds が双方向に揃う（自動）
- [ ] 出典（sources）は手動推奨（validate 未強制）

**Deployment**
- [ ] 型必須：id / slug / manufacturerId / customer / country / location{lat,lng} / status
- [ ] manufacturerId・robotId（任意）は id 参照（自動）
- [ ] sources が空でない（自動：常時必須）

> ArticlePlacement は publishStatus を持たない設定データのため公開ゲート対象外（→ セクション O）。

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

### ホームページ「注目ロボット」の表示ロジック（`home-featured` ソート）

優先順位：**featuredRank（編集ピック）→ deploymentStage → updatedAt 降順**

| 優先度 | 条件 | 補足 |
|---|---|---|
| 1位 | `featuredRank` が設定されている | 数値が小さいほど上位（1, 2, 3...） |
| 2位 | `deploymentStage` 順 | production → limited-production → pilot → prototype → ... |
| 3位 | `updatedAt` 降順 | 同ステージ内のタイブレーク |

**手動ピックしたい場合**（例: 新発表ロボットを一時的に上位に出す）:
```ts
// data/robots.ts の対象レコードに追加
featuredRank: 1,  // 他のピックと被らない数値を割り当て
```

**運用ルール**:
- `featuredRank` 未設定が通常状態。設定は「このロボットを意図的に出したい」期間だけ
- 期間が終わったらフィールドを削除する（不要な値を残さない）
- 表示件数は5件（`src/app/page.tsx` の `.slice(0, 5)`）

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

## L. ガイド（guides）追加 / 更新

> robots/manufacturers（A/B）に準拠。id 発番 → `draft` → build ゲート → `published`。固有の罠は **guide↔useCase 双方向対称**。

1. [ ] id 発番（不変）、`slug = id`、`publishStatus: 'draft'`
2. [ ] 型必須：title / description / stage / order / topics / targetReaders / relatedRobotIds / relatedUseCaseIds
3. [ ] `topics` は tagRegistry の `guide-topic` 登録値のみ（自動：未登録は build 失敗）
4. [ ] `relatedRobotIds` は robot の **id** 参照（自動：参照切れは build 失敗）
5. [ ] **双方向対称**：`relatedUseCaseIds` に入れた useCase 側の `relatedGuideIds` にも本ガイドの id を入れる（自動：片方向だけだと build 失敗）
6. [ ] 出典（sources）は手動推奨（validate 未強制。一次情報があれば記入）
7. [ ] `npm run build` 通過 → `published`

## M. ユースケース（useCases）追加 / 更新

> 一次情報が薄い間は薄いページを量産しない（CLAUDE.md 方針）。

1. [ ] id 発番（不変）、`slug = id`、`publishStatus: 'draft'`
2. [ ] 型必須：title / maturityLevel / buyerReadiness / environment / requiredCapabilities / atAGlance{whereFits,whereDoesNotFit,mustBeTrue} / overview / **whyItMatters** / capabilityNotes / environmentRequirements / whyHardToday / japanDeploymentConditions / candidateRobotIds / relatedGuideIds
3. [ ] `industryTags` / `taskTags` は登録タグのみ（自動）
4. [ ] `candidateRobotIds` は robot の **id** 参照（自動）
5. [ ] **双方向対称**：`relatedGuideIds` と相手 guide.`relatedUseCaseIds` を両方そろえる（自動）
6. [ ] 出典（sources）は手動推奨（validate 未強制）
7. [ ] build 通過 → `published`

## N. 導入事例（deployments）追加 / 更新

> Home ワールドマップの arc 根拠データ。所在地・主体・段階は一次/信頼できる二次出典で裏取り（AI生成値の混入防止）。

1. [ ] id 発番（不変）、`slug = id`、`publishStatus: 'draft'`
2. [ ] 型必須：manufacturerId / customer / country / location{lat,lng} / status（`announced` / `pilot` / `production` / `ended` / `unknown`）
3. [ ] `manufacturerId`（arc 始点）・`robotId`（任意・判明時）は **id** 参照（自動：参照切れは build 失敗）
4. [ ] **`sources` 必須**（自動：空だと build 失敗）
5. [ ] `siteName`（任意）・`startedAt`（YYYY または YYYY-MM）を可能な範囲で記入。`location` は施設のおおよその座標（番地不要・市区町村レベルで可。施設名が非公開の場合は都市中心座標で代替する）
6. [ ] **導入先の country がメーカーリストに存在しない新しい国**の場合は `components/ManufacturerMapCopy.tsx` の `REGION` 定数に追加する（→ セクション B-7 と同じ対応）
7. [ ] build 通過 → `published`

## O. 記事掲載枠（articlePlacements）追加 / 更新

> 記事タブ／Home 注目記事の掲載枠。**BaseRecord ではない**（id/slug/publishStatus/sources を持たない設定データ）。

1. [ ] `surface`（現状 `reports-index`）/ `slot`（`hero` | `feature`）/ `articleId` / `order` を指定
2. [ ] `articleId` は article の **id** 参照（自動：参照切れは build 失敗）
3. [ ] 同一 `surface:slot` 内で `order` 重複なし・同一記事の重複なし（自動）
4. [ ] `kind: 'sponsored'` なら `sponsor.name` 必須・`sponsor.url` は形式チェック（自動）
5. [ ] **掲載対象は published 記事にする**（validate は記事の存在のみ確認。draft 記事への枠付けは検出しない＝手動）
6. [ ] build 通過

---

## 関連ドキュメント

- 設計の本体: `data-architecture-redesign-v1.md`
- データ運用の旧ガイド（参照用）: `humanoid_data_management_guide_v1.md`（背景・経緯の参照。整合更新はしない。運用の正本は本書と `../data/README.md`）
- 型の真実源: `nextjs_data_types_v1.ts` → `data/types.ts`
