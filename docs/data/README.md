# Deploid Data Work Guide

Last reviewed: 2026-07-16

この文書は、AIでデータ追加・更新を行うときの入口です。
実装上の正本は `data/types.ts` と `lib/*` にあります。

## データの種類

- `data/robots.ts` — ロボット個票。公式スペック、価格offer、画像、活用事例source参照、比較材料。用途はUseCaseから逆引きする
- `data/manufacturers.ts` — メーカー/供給体制。企業種別、日本窓口、サポート、調達メモ
- `data/articles.ts` — 記事。公開URLは `/reports`。速報でも `whyItMatters` を必須にする
- `data/deployments.ts` — 実在の導入事例。Homeのワールドマップ根拠データ
- `data/useCases.ts` — 用途から探す逆引き。公開データは sources と candidate evidence を必須にし、一次情報が薄い間は慎重に扱う
- `data/articlePlacements.ts` — 記事タブ/home注目記事の掲載枠
- `data/types.ts` — 型の正本

## 全件調査成果物

- `DATA-R01-master-report.md` — published Robot全61機の公式情報一次調査の統合報告
- `DATA-R01-B01-*.json`〜`DATA-R01-B14-*.json` — 項目別raw調査データ
- `DATA-R01-B01-*.md`〜`DATA-R01-B14-*.md` — バッチ別の人間向け要約
- `DATA-R01-verification-report.md` — raw調査を公式原典と現行schemaに照合した全件検証報告
- `DATA-R01-VERIFY-B01.json`〜`DATA-R01-VERIFY-B14.json` — raw値、検証結果、実装候補値、未解決理由を1対1で保持する検証データ
- `DATA-R01-implementation-manifest-report.md` — VERIFYから実装可能値、削除候補、source join、未解決値を分離した実装準備報告
- `DATA-R01-IMPLEMENT-B01.json`〜`DATA-R01-IMPLEMENT-B14.json` — 現行Robot/UseCaseとの差分を含むメーカー・機体バッチ別の実装manifest

これらは調査対象をMECEに収録した非正本であり、`data/*.ts`へ直接コピーしない。
実装候補にはVERIFYデータの `verificationStatus` が `verified` または `corrected` で、
かつ `proposedValue` がnullでないレコードだけを使用する。
`unresolved` / `rejected`、variant未確定、取得エラーの値は推測で補完せず、UIでは省略または既定のフォールバックを使う。
実装時は候補値を現行型へ正規化し、validatorを通過させてから `data/*.ts` へ反映する。
IMPLEMENT manifestは `npm run build:data-r01-manifest` でVERIFYと現行 `data/*.ts` から再生成する。
manifest内の `robotPatch` は候補差分であり、`status: add-after-review` のsource metadataを先に確定する。
`manualReview` の値を自動適用せず、UseCase relationは既存candidateへ上書きせずmergeする。

各コレクションの追加・更新手順は `../planning/data-maintenance-checklist-v1.md` の対応セクション：
robots=A / manufacturers=B / articles=C / slug変更=D / 既存更新=D2 / useCases=M / deployments=N / articlePlacements=O。
（guides=L は撤去済み。経緯は `../planning/archive/guides-retirement-v1.md`。）

## 事前に見るもの

- `../../AGENTS.md` — 汎用AIエージェント入口
- `../../ai/rules/00-index.md` — 作業種別ごとの参照ルール
- `../../ai/rules/10-workflow.md` — AI作業の共通手順
- `../../ai/rules/21-data-maintenance-workflow.md` — `data/*.ts` 追加・更新の事前確認チェックリスト
- `../../ai/rules/20-data.md` — データ作業で読む正本のルーティング
- `../planning/data-maintenance-checklist-v1.md` — 追加・公開・slug変更・鮮度レビューのチェックリスト
- `../planning/data-architecture-redesign-v1.md` — id/slug分離、参照、正本設計
- `../planning/copyright_and_media_rights_policy_v1.md` — 画像・ロゴ・引用を扱う場合
- `tagging.md` — タグ追加・表記ゆれ防止

## 基本ルール

- 参照は `id` で結ぶ。`slug` は公開URL専用。slugを変えるときは `previousSlugs` に旧slugを追記する
- `id` は発番後に変えない。命名修正では `slug` / `name` / `nameJa` だけを変える。例: A2 Ultra は `id: 'agibot-a2-max'`、公開slugは `agibot-a2-ultra`
- 公式ページ、press release、信頼できる報道を確認し、`sources` に `url` / `checkedAt` / `reliability` を残す
- 公開 UseCase は `sources` を空にしない。`candidateRobots` は `fit` だけでなく `basis` と `evidenceDeploymentIds` または `evidenceSourceUrls` で根拠を明示する
- 公開 UseCase は「この用途でどんな実例があるか」または「実例未確認でも、公式にその用途・業務領域へ投入できると読めるか」を候補単位で追える状態にする。読者が候補カードから根拠の deployment/source に到達できない候補は公開に残さない
- 公開 UseCase の候補に残せる `basis` は `deployment` / `official-use-case` / `adjacent-deployment` のみ。`product-capability` / `market-signal` / `editorial-watch` は draft の調査メモに留めるか削除する
- `official-use-case` は公式 source が当該用途または業務領域を明示している場合だけ使い、その URL を `useCase.sources` にも載せる。`adjacent-deployment` は `reason` に前世代機・同系統機・近接タスクなど隣接根拠の種類を書く
- UseCase の `fit:'strong'` は、同じ `robotId` と `useCase.id` を持つ published deployment を `evidenceDeploymentIds` で明示できる場合だけ使う
- 用途詳細の関連記事は `Article.relatedUseCaseIds` が正本。`industryTags` / `taskTags` の一致だけで関連記事や候補ロボットを自動生成しない
- AIの推測を事実として入れない。不明なスペックや価格は省略または要確認メモにする
- ロボット価格はメーカー公式公開価格、国内正規代理店公開価格だけを `priceOffers` に入れ、該当がなければUIでDeploid問い合わせへフォールバックする。推測価格や非正規販売店価格を入れない
- `specs.payloadKg` を片腕荷重へ読み替えない。荷重はscope・rated/maximum・sourceを確認して `loadRatings` に記録する
- 活用事例は `usageExampleSourceUrls` から同じRobotの `sources` を参照し、タイトル・媒体・日付・画像を重複保持しない
- ロボット側へ用途タグや用途名を複製しない。公式用途は `UseCase.candidateRobots` の `basis:'official-use-case'` と根拠URLから逆引きする
- 新規レコードは原則 `publishStatus: 'draft'` から作る
- 記事は `category` と `whyItMatters` を必ず入れる
- 記事の `type` は `ArticleType`（analysis / deployment-report / interview / event-report / policy-update / case-study / news-brief / tech-update / market-analysis）から選ぶ。`ArticleCategory`（news / company-report 等）と混同しない
- **記事の日付の使い分け**：`publishedAt` = Deploidがこの記事を公開した日（執筆・掲載日）。元ニュースの発生日ではない。昨日のニュースを今日書いたなら `publishedAt` は今日。元ニュースの日付は `sources[].publishedAt` に書く。`updatedAt` はデータレコードを最後に編集した日
- 記事本文は速報でも800文字以上、分析・レポートは1,500文字以上を目安にする
- `published` 記事の `sources[].url` は公開前にアクセス確認する（404・403 のまま published にしない）
- 記事は原則2件以上の出典を持つ。1件のみで published にする場合はその理由を記録し、追加出典を探す努力をする
- 既存記事を全削除して置き換えることは禁止。更新は同じ `id` で行う。url 変更が必要なら `slug` を変更し `previousSlugs` に旧 slug を追記する
- `requiredCapabilities` には `Capability` 型の値のみ使う。`lib/tagRegistry.ts` のタグ value は `Capability` ではないため混入しない
- 画像・ロゴは `ImageAsset.rights` を必ず持たせる。外部ホットリンクは避け、可能なら `public/images/` にローカル配置する
- タグは `lib/tagRegistry.ts` に登録済みの `value` を使う。`label` はUI表示用なので、短い略称や自然な日本語表記でよい
- スペック項目は `lib/specSchema.ts` にあるキーだけを使う
- ページから `data/*.ts` を直接検索しない。取得・関連解決は `lib/data.ts` 経由にする
- ロボット名はメーカー名を重複させない。メーカー名は `manufacturerId` から別表示されるため、`Unitree G1` ではなく `G1` のようにモデル名を入れる
- ロボット一覧・メーカー一覧の表示順は表示側のフィルタ/ソート処理で決める。`data/*.ts` の配列順や `getRobots()` / `getManufacturers()` の返却順に依存しない

## 更新か新規追加かの判断

既存レコードの名称、スペック、価格、導入状況、国内代理店、説明文、画像、出典が変わっただけなら、原則として同じ `id` のレコードを更新する。新規レコードを作らない。

同じレコードを更新する例:

- ロボット名や日本語表記を直す
- 公式スペック、価格offer、安全性メモ、日本入手性を更新する
- メーカーの国内代理店、所在地、企業ステータス、ロゴを更新する
- 既存ロボットやメーカーに関連する導入事例、記事、用途を追加する
- URLを変えるために `slug` を変更する

新規レコードを作る例:

- 公式に別モデル、別世代、別SKUとして扱われる
- 旧モデルを残しつつ後継機を追加する
- メーカー統合やブランド変更ではなく、実体として別会社を追加する

提供終了した機種は削除せず、原則 `publishStatus: 'archived'` にする。後継機がある場合は旧機種に `supersededById` を設定する。

## 素材を受け取ったときの置き場所

ユーザーが画像素材と配置先だけを指定した場合、AIは以下の規則で配置する。

| 種類 | 配置先 | データに書く場所 |
| --- | --- | --- |
| ロボット画像 | `public/images/robots/<robot-id>-<role>.<ext>` | `data/robots.ts` の `images.<role>`（Robotで `heroImage` は新規登録しない） |
| メーカーロゴ | `public/images/manufacturers/logos/<manufacturer-id>-<variant>.<ext>` | `data/manufacturers.ts` の `logos.symbol` / `logos.wordmark` / `logos.combined`（`logo` は移行中の後方互換のみ） |
| メーカー補助画像 | `public/images/manufacturers/<manufacturer-id>-<purpose>.<ext>` | 必要な表示枠がある場合のみ追加 |
| 記事hero画像 | `public/images/articles/<article-id>/hero.<ext>` | `data/articles.ts` の `heroImage` |
| 記事本文補助画像 | `public/images/articles/<article-id>/<name>.<ext>` | 本文や将来の画像フィールドで明示参照 |

画像を登録するときは `src` / `alt` / `credit` / `sourceUrl` / `rights.status` / `rights.sourceType` / `rights.rightsHolder` / `rights.checkedAt` を確認する。許諾・商用利用可として登録する場合は `licenseUrl` または `permissionNote` に根拠を残す。メーカーから直接提供された素材は、利用媒体・商用利用・改変可否・期限・クレジット条件を `permissionNote` に記録し、原本メールや契約書の管理先を `licenseUrl` または社内管理番号で追跡できる状態にする。権利が不明な画像は公開用データに入れず、必要なら `publishStatus: 'draft'` のままにする。

## 参照とタグの追加手順

- 関連付けは `slug` ではなく `id` で行う。例: `relatedRobotIds`, `relatedManufacturerIds`, `relatedUseCaseIds`, `candidateRobots[].robotId`, `manufacturerId`
- URLを作るときだけ `slug` を使う。例: `/robots/${robot.slug}`
- 新しいタグが必要な場合は、先に `lib/tagRegistry.ts` へ `value` と `label` を追加する
- `value` は安定キーなので後から気軽に変えない。表示を変えたいだけなら `label` を変える
- 未登録タグ、存在しない `id` 参照、slug衝突は `npm run validate:data` / `npm run build` で失敗させる

## AIに渡す作業手順

1. 対象データと目的を決める。例: 「Unitree G1 の価格・日本入手性・公式出典を更新」
2. 公式/一次情報を優先して出典候補を列挙する
3. 既存の `id`、関連先ID、登録済みタグ、スペックキーを確認する
4. 更新か新規追加かを判断する。迷う場合は新規作成せず、既存レコード更新案と新規案を並べて確認する
5. 画像素材がある場合は上記の配置規則で `public/images/` に置き、該当データの `ImageAsset` を更新する
6. `data/*.ts` を最小差分で更新する
7. `npm run validate:data` を実行する
8. UI表示に影響する変更なら `npm run build` まで通す

## 検証コマンド

```bash
npm run build:data-r01-manifest
npm run validate:data
npm run build
```

`validate:data` は id重複、参照切れ、未知タグ、slug衝突、公開必須項目を検出します。
warning は鮮度切れや画像ローカル化推奨で、error は公開前に必ず直します。
