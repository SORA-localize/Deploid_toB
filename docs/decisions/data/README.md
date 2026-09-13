---
status: current
updated: 2026-09-13
---

# Deploid Data Work Guide

Last reviewed: 2026-09-13

この文書は、AIでデータ追加・更新を行うときの入口です。
Payload CMS + managed PostgreSQLが日常運用の唯一の正本です（2026-08-25のcutoverで完了。旧 `data/*.ts` と local adapterはTask 9で削除済み）。
実装上の正本は `lib/content/domainTypes.ts`（canonical domain型）と `collections/*.ts`（Payloadコレクション定義）にあります。
日常の編集手順（Codex MCP経由）は `.codex/content-workflow.md` を参照してください。

## コレクションの種類

対応する旧 `data/*.ts` ファイル名も参考として併記します（すべて削除済み・編集対象ではありません）。

- `collections/Robots.ts`（旧 `data/robots.ts`）— ロボット個票。公式スペック、価格offer、画像、活用事例source参照、比較材料。用途はUseCaseから逆引きする
- `collections/Manufacturers.ts`（旧 `data/manufacturers.ts`）— メーカー/供給体制。企業種別、日本窓口、国内代理店、ロゴ
- `collections/Distributors.ts` — 国内提供事業者（代理店・直販窓口）。2026-08-08新設。現状フロント側の消費箇所が無く、`Manufacturer.domesticDistributors` が表示の正本のまま（詳細は本README「既知の未解消事項」）
- `collections/RobotSeries.ts` — 製品ファミリ。`/robots/:slug` の名前空間をRobotと共有する設計だが、series単体を表示するページは未実装（詳細は同上）
- `collections/Articles.ts`（旧 `data/articles.ts`）— 記事。公開URLは `/reports`。速報でも `whyItMatters` は撤去済み（2026-09-11、フロント表示先が無いまま宙に浮いていたため削除。経緯は `docs/archive/deleted-field-snapshot-2026-09-11.json`）
- `collections/Deployments.ts`（旧 `data/deployments.ts`）— 実在の導入事例。Homeのワールドマップ根拠データ
- `collections/UseCases.ts`（旧 `data/useCases.ts`）— 用途から探す逆引き。公開データは sources と candidate evidence を必須にし、一次情報が薄い間は慎重に扱う
- `collections/ArticlePlacements.ts`（旧 `data/articlePlacements.ts`）— 記事タブ/home注目記事の掲載枠
- `collections/Media.ts` — 画像アップロード実体（Vercel Blob）
- `lib/content/domainTypes.ts`（旧 `data/types.ts`）— 型の正本

## 全件調査成果物

`research/` 配下に保存（このReadmeから見て `research/`）。**cutover前（2026-08-25以前）に実施した調査で、当時の `data/*.ts` を対象にしていた**。事実調査そのものの価値は変わらないが、記載されている「実装先」は現行Payloadレコードへ読み替えること。

- `research/DATA-R02-master-report.md` — 2026-07-17時点でpublished Robot全61機の現行性、全16スペック、価格、用途、活用事例を公式一次資料から再調査した最新報告
- `research/DATA-R02-source-plan.json` / `.md` — Robotごとに調査対象資料を優先順で整理した資料計画
- `research/DATA-R02-B01.json`〜`DATA-R02-B10.json` — 全61機の最新raw調査データ。現行製品、family-common、variant固有、historicalを分離して保持する
- `research/DATA-R02-B01.md`〜`DATA-R02-B10.md` — バッチ別の人間向け要約
- `research/DATA-R02-publication-review.json` — lifecycleStatusとpublicationRecommendationの調査結果。publishStatusを自動変更する指示ではない
- `research/DATA-R02-unresolved.md` — conflict、variant、取得不能資料、人間判断事項の集約
- `research/DATA-R02-decisions.md` — 公開状態、値の採用、variant、用途、pilot順序について承認済みの実装判断
- `research/DATA-R01-master-report.md` — published Robot全61機の公式情報一次調査の統合報告
- `research/DATA-R01-B01-*.json`〜`DATA-R01-B14-*.json` — 項目別raw調査データ
- `research/DATA-R01-B01-*.md`〜`DATA-R01-B14-*.md` — バッチ別の人間向け要約
- `research/DATA-R01-verification-report.md` — raw調査を公式原典と現行schemaに照合した全件検証報告
- `research/DATA-R01-VERIFY-B01.json`〜`DATA-R01-VERIFY-B14.json` — raw値、検証結果、実装候補値、未解決理由を1対1で保持する検証データ
- `research/DATA-R01-implementation-manifest-report.md` — VERIFYから実装可能値、削除候補、source join、未解決値を分離した実装準備報告
- `research/DATA-R01-IMPLEMENT-B01.json`〜`DATA-R01-IMPLEMENT-B14.json` — 現行Robot/UseCaseとの差分を含むメーカー・機体バッチ別の実装manifest

R02はR01後に公式原典を再訪した最新調査だが、どちらも調査対象をMECEに収録した非正本であり、現行Payloadレコードへ直接コピーしない。
R02の `found` も、対象record/variant、evidenceScope、現行schemaへの投影、source joinを実装manifestで確認してから採用する。
`conflict` / `needs-review` / `source-inaccessible` / `historical-only` は自動適用しない。

R01を使う場合は、
実装候補にはVERIFYデータの `verificationStatus` が `verified` または `corrected` で、
かつ `proposedValue` がnullでないレコードだけを使用する。
`unresolved` / `rejected`、variant未確定、取得エラーの値は推測で補完せず、UIでは省略または既定のフォールバックを使う。
実装時は候補値を現行型へ正規化し、Payload draftとして反映してから人間のAdmin reviewを経て公開する。
IMPLEMENT manifestは `npm run build:data-r01-manifest` でVERIFYと（cutover前の）`data/*.ts`から再生成する仕組みだったため、この生成コマンド自体はcutover後は使えない。差分の考え方（`robotPatch`は候補差分であり `status: add-after-review` のsource metadataを先に確定する）は引き続き有効。

各コレクションの追加・更新手順は `../data-maintenance-checklist-v1.md` の対応セクション：
robots=A / manufacturers=B / articles=C / slug変更=D / 既存更新=D2 / useCases=M / deployments=N / articlePlacements=O。
（guides=L は撤去済み。経緯は `../../archive/guides-retirement-v1.md`。）

## 事前に見るもの

- `../../../.codex/content-workflow.md` — Payload MCP経由でのdraft作成・更新の標準ワークフロー（最優先で読む）
- `../../../AGENTS.md` — 汎用AIエージェント入口
- `../../../ai/rules/00-index.md` — 作業種別ごとの参照ルール
- `../../../ai/rules/10-workflow.md` — AI作業の共通手順
- `../../../ai/rules/21-data-maintenance-workflow.md` — Payload content編集の事前確認ゲート（G1〜G11）
- `../../../ai/rules/20-data.md` — データ作業で読む正本のルーティング
- `../data-maintenance-checklist-v1.md` — 追加・公開・slug変更・鮮度レビューのチェックリスト
- `../data-architecture-redesign-v1.md` — id/slug分離、参照、正本設計
- `../content-platform-and-database-architecture-v2.md` — CMS / DB / GitHub / MCPの役割分担
- `../copyright_and_media_rights_policy_v1.md` — 画像・ロゴ・引用を扱う場合
- `tagging.md` — タグ追加・表記ゆれ防止

## 基本ルール

- 参照は `id`（Payload上は `stableId`）で結ぶ。`slug` は公開URL専用。slugを変えるときは `previousSlugs` に旧slugを追記する
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
- 記事は `category` を必ず入れる
- 記事の `type` は `ArticleType`（analysis / deployment-report / interview / event-report / policy-update / case-study / news-brief / tech-update / market-analysis / manufacturer-guide / robot-guide / basics-guide）から選ぶ。`ArticleCategory`（news / company-report 等）と混同しない
- **記事の日付の使い分け**：`publishedAt` = Deploidがこの記事を公開した日（執筆・掲載日）。元ニュースの発生日ではない。昨日のニュースを今日書いたなら `publishedAt` は今日。元ニュースの日付は `sources[].publishedAt` に書く。`updatedAt` はPayloadが管理する
- 記事本文は速報でも800文字以上、分析・レポートは1,500文字以上を目安にする
- `published` 記事の `sources[].url` は公開前にアクセス確認する（404・403 のまま published にしない）
- 記事は原則2件以上の出典を持つ。1件のみで published にする場合はその理由を記録し、追加出典を探す努力をする
- 既存記事を全削除して置き換えることは禁止。更新は同じ `id` で行う。url 変更が必要なら `slug` を変更し `previousSlugs` に旧 slug を追記する
- `requiredCapabilities` には `Capability` 型の値のみ使う。`lib/tagRegistry.ts` のタグ value は `Capability` ではないため混入しない
- 画像・ロゴは `ImageAsset.rights` を必ず持たせる。外部ホットリンクは避け、`public/images/` にローカル配置してからPayloadの該当fieldへ登録する
- タグは `lib/tagRegistry.ts` に登録済みの `value` を使う。`label` はUI表示用なので、短い略称や自然な日本語表記でよい
- スペック項目は `lib/specSchema.ts` にあるキーだけを使う
- ページから直接Payloadコレクションへアクセスしない。取得・関連解決は content repository（`lib/content/createContentRepository.ts` / `lib/content/payloadSource.ts`）経由にする
- ロボット名はメーカー名を重複させない。メーカー名は `manufacturerId` から別表示されるため、`Unitree G1` ではなく `G1` のようにモデル名を入れる
- ロボット一覧・メーカー一覧の表示順は表示側のフィルタ/ソート処理で決める。Payloadからの取得順に依存しない

## 更新か新規追加かの判断

既存レコードの名称、スペック、価格、導入状況、国内代理店、説明文、画像、出典が変わっただけなら、原則として同じ `id`（Payload上は `stableId`）のレコードを更新する。新規レコードを作らない。

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

ユーザーが画像素材と配置先だけを指定した場合、AIは以下の規則で配置する。ローカル配置先は移行前後で変わっていないが、データに書き込む先はPayloadの該当recordのfield（Admin UIまたはMCP経由）になった。

| 種類 | 配置先 | データに書く場所 |
| --- | --- | --- |
| ロボット画像 | `public/images/robots/<robot-id>-<role>.<ext>` | Robotレコードの `images.<role>`（`heroImage`へ新規登録しない。詳細は `public/images/robots/README.md`） |
| メーカーロゴ | `public/images/manufacturers/logos/<manufacturer-id>-<variant>.<ext>` | Manufacturerレコードの `logos.symbol` / `logos.wordmark` / `logos.combined`（legacyの`logo`は既に廃止済み） |
| メーカー補助画像 | `public/images/manufacturers/<manufacturer-id>-<purpose>.<ext>` | 必要な表示枠がある場合のみ追加 |
| 記事hero画像 | `public/images/articles/<article-id>/hero.<ext>` | Articleレコードの `heroImage` |
| 記事本文補助画像 | `public/images/articles/<article-id>/<name>.<ext>` | 本文や将来の画像フィールドで明示参照 |

画像を登録するときは `src` / `alt` / `credit` / `sourceUrl` / `rights.status` / `rights.sourceType` / `rights.rightsHolder` / `rights.checkedAt` を確認する。許諾・商用利用可として登録する場合は `licenseUrl` または `permissionNote` に根拠を残す。メーカーから直接提供された素材は、利用媒体・商用利用・改変可否・期限・クレジット条件を `permissionNote` に記録し、原本メールや契約書の管理先を `licenseUrl` または社内管理番号で追跡できる状態にする。権利が不明な画像は公開用データに入れず、必要なら `publishStatus: 'draft'` のままにする。

## 参照とタグの追加手順

- 関連付けは `slug` ではなく `id`（Payload上は `stableId`）で行う。例: `relatedRobotIds`, `relatedManufacturerIds`, `relatedUseCaseIds`, `candidateRobots[].robotId`, `manufacturerId`
- URLを作るときだけ `slug` を使う。例: `/robots/${robot.slug}`
- 新しいタグが必要な場合は、先に `lib/tagRegistry.ts` へ `value` と `label` を追加する
- `value` は安定キーなので後から気軽に変えない。表示を変えたいだけなら `label` を変える
- 未登録タグ、存在しない `id` 参照、slug衝突は publish時の `validateForPublish`（Payload側）で失敗させる。draft時点で機械検証する手段は無い（下記「検証コマンド」参照）

## AIに渡す作業手順

対象コレクション・目的・出典を決めたうえで、`.codex/content-workflow.md` の標準ワークフローに従う：

```text
schema取得（find<Collection>）
→ 対象と参照先を検索（既存id・重複チェック）
→ draft作成/更新（create<Collection> / update<Collection>、draft: trueで呼ぶ）
→ 手動での必須field自己点検（下記「検証コマンド」参照）
→ diff要約（変更内容を日本語で簡潔に）
→ 人間のAdmin review
→ content-publisherがpublishApprovedVersion()経由で公開
```

画像素材がある場合は、上記「素材を受け取ったときの置き場所」の配置規則に従ってローカル配置してから、Payload Media（Vercel Blob）へアップロードするか、審査済みの外部公開URLを該当fieldへ設定する。

## 検証コマンド

`npm run validate:data`はPayload移行時に廃止済みで、現在`package.json`に存在しない
（`docs/plans/content-platform-migration-factual-audit-v1.md`参照）。`content:verify-snapshot` /
`content:verify-conservation`は署名済みsnapshot/baseline manifestを前提にした本番運用向け
コマンドで、日常のcontent編集後に都度回す粒度のものではない。id重複・参照切れ・未知タグ・
slug衝突・公開必須項目のチェックは、現状**publish時の`validateForPublish`（Payload側、人間の
`content-publisher`がAdmin UI経由で公開する際にのみ走る）でしか機械的に検出されない**。
draft作成・更新の時点では、この節の各手順で挙げた項目を手動で自己点検すること。

## 既知の未解消事項

- `Distributors`コレクションと`RobotSeries`コレクションは、フロント側の消費箇所が無いまま存在する（2026-09-13時点で意図的に現状維持。実装するか撤去するかは未決定）。編集を依頼された場合は、この状態を踏まえてユーザーに確認すること
- `Manufacturer.domesticDistributors`はAdmin UI上「移行前の互換フィールド」とラベル表示されるが、実際にはこちらが唯一表示されている実装（`Distributors`コレクションではない）
