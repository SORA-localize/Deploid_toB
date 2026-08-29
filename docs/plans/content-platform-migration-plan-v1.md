---
status: plan
updated: 2026-08-09
---

# Content Platform Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **2026-08-28 チェックボックスの由来（読む前に）**: Task 0〜8 の Step チェックボックスは、
> 実行中に逐次チェックされていなかった（2026-08-28 時点で Task 1 と Task 9 以外の72個が
> `- [ ]` のまま残っていた）。これらは実装完了後に**遡って**チェックしたものであり、
> 根拠は (a) Tasks 0-8 を含む PR #34 が main へ merge 済みであること、(b) 事実監査
> [content-platform-migration-factual-audit-v1.md](content-platform-migration-factual-audit-v1.md)
> が各Taskの成果物の実体（collection 12個、migration 8世代、MCP plugin 組み込み、
> repository 分離、旧TS撤去、CI ゲート群）を確認したこと、の2点。
> **チェックボックスは Step 単位で個別検証された記録ではない。**
> Step 単位の根拠が必要な場合は事実監査の方を参照すること。
>
> **完了判定**: 中核実装と Production 切替は完了。ただし Completion Criteria 全12項目は未達
> （実証7 / 部分3 / 未達1 / 未検証1）。残課題は事実監査 §3 を正本とする。

**Goal:** `data/*.ts` を正本とする現行構成を、Payload CMS + managed Postgres へ移行する。①の
保存先変更では公開URL、`slug`、`previousSlugs`を維持する。`id`（stableId）はcollection内・
collection横断の参照整合性に使うため不変。

**Architecture:** GitHubはコード、Payload schema、migration、validatorを管理する。コンテンツレコードはPostgresを唯一の正本とし、Next.jsはserver-side repository経由、非エンジニアはPayload Admin、CodexはPayload MCP経由で同じデータを扱う。移行期間だけlocal/payloadのread adapterを切り替え、dual writeは行わない。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Payload CMS、Postgres、Vitest、Playwright、Vercel、Vercel BlobまたはS3互換storage

> **Deferred program prerequisite:** Phase 1〜7 は完了済み（2026-08-04）。品質ツール、local snapshot、validator、view model は既に存在するため、本計画で同じ基盤を作り直さない。**どれが既存でどれが新規かは「2026-08-08 突合結果」§A・§B が正本。File Structure の表より優先する。**

## 2026-08-08 突合結果（着手前に必ず読む）

本計画は 2026-07-26 付で、pre-migration refactor の Phase 3・5・6 が作った層を反映していない。
**着手前に実装と突き合わせた結果を以下に記録する。File Structure の表より本節が優先する。**

### A. 「新規作成」に挙がっているが既に存在するもの（4件）

| Path | 実態 |
|---|---|
| `lib/validation/crossCollection.ts` | Phase 3 が作成済み。`buildReferenceIndex` を持つ |
| `vitest.config.ts` | Phase 1 で導入済み |
| `playwright.config.ts` | Phase 1 で導入済み |
| `tests/e2e/public-routes.spec.ts` | Phase 6 で作成済み |

### B. 同じ役割の層が別の場所に既にあるもの（重複して作らない）

| 計画の記載 | 実装の現状 | 判断 |
|---|---|---|
| `lib/content/contracts.ts`（source/repository境界とsnapshot型） | **`lib/data/contentSnapshot.ts`** が `ContentSnapshot` 型を提供済み | 型は既存を import する。**repository 契約は `lib/content/` に新設する**（既存は型だけで境界を持たない） |
| `lib/content/localSource.ts`（移行期間のTS reader） | **`lib/data/localContentSnapshot.ts`** が全collectionを結合済み | **既存を source として再利用しつつ、`lib/content/` に repository / query 境界を新設する。** 既存は配列 snapshot だけで query・slug解決・pagination を持たないため、Task 4 で `lib/content/` を作るのは重複ではない |
| `lib/validation/collections/*.ts`（collection単位のdomain validation） | **`lib/validation/*.ts`** に9本（`robots` / `manufacturers` / `useCases` / `articles` / `deployments` / `common` / `registry` / `types` / `validateContentSnapshot`）が既存 | 既存の平置きを使う。`collections/` サブディレクトリを作らない |
| `lib/validation/crossCollection.ts`（collection横断） | 同名で既存 | 既存を拡張する |

`lib/validate.ts` は「互換facade」で、規則の本体は `lib/validation/*.ts` にある（`lib/validate.ts:1-4` のコメント）。
移行では facade の中身を差し替えるだけでよく、検証ロジックを書き直さない。

### C. ファイル名の誤り

| 計画の記載 | 実際 |
|---|---|
| `next.config.mjs` | **`next.config.ts`** |

### D. 計画が知らないコレクション（2件・2026-08-08 決定）

`docs/decisions/data-architecture-redesign-v1.md` §4-1 / §11 で2つのコレクションを新設すると決めた。
**Task 3（全collectionと権限を定義する）にこの2つを含める。**

| コレクション | 内容 | 出典 |
|---|---|---|
| `robotSeries` | 製品ファミリ。スペック・価格を持たない。`Robot.seriesId?` で結ぶ | `robot-data-import-plan-v1.md` DEC-S08 |
| `distributors` | 国内の提供事業者。メーカーと多対多 | `data-architecture-redesign-v1.md` §4-1 |

あわせて `Robot` から `buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote` の
**4フィールドだけ**を落とす（DEC-S05・S06）。`comparison` は `/compare` の実表示が依存するため
残す。**`collections/Robots.ts` を書くときに現行 `data/types.ts` をそのまま写さない。**

### E. 前提条件の再確認（2026-08-08 実測）

| Task 1 の確認項目 | 実測 |
|---|---|
| Payload / Postgres package | **0件**（未導入。計画どおり） |
| `DATABASE_URL` / `PAYLOAD_SECRET` / `CONTENT_SOURCE` | `.env.example` に**0件**（計画どおり） |
| `npm run check:data-boundaries` | exit 0 |
| pre-migration refactor の完了文書 | `docs/reference/pre-migration-refactor-results-v1.md` 存在 |
| Vercel プロジェクト | 接続済み（`.vercel/project.json`）。`vercel.json` は無く既定設定＝`main` が本番、他ブランチは Preview |

### F. 制約の緩和とURL waiverの適用範囲（2026-08-09再確定）

無停止でのcutoverだけを緩和し、**1週間程度の停止は許容**する。

「公開URLの維持不要」という包括waiverは撤回する。①は保存先だけを変更するため、`id`、`slug`、
`previousSlugs`、公開URLをすべてparity対象に残す。URL waiverは②のSeries cutover等、旧URL・
新URL・301または同一URL継承をTask内に列挙し、人間が承認した変換だけに適用する。①のimporterが
URL値を変更した場合はparity failureとして停止する。

---

## 2026-08-08 外部監査の指摘（**反映済み**）

突合結果（上記）に続き、外部監査で見つかった項目。**すべて本文へ反映済み。**
以下は「何をどう直したか」の記録であり、未解決リストではない。

### M-1. Task 3 が10コレクションを作らない（Critical）

`### Task 3` の Files と schema test は**7コレクション**しか列挙していない。突合結果 §D が
`RobotSeries` と `Distributors` の追加を指示しているが、**本文に反映されていない**。
test・snapshot・repository・import order・cache tag のいずれにも無い。

`docs/plans/robot-data-import-plan-v1.md` の §0 G-2 は10コレクションを要求するため、
**このままでは②が永久に着手できない。**

### M-2. 削除4フィールドの実行主体がいない（Critical）

②の DEC-S05・S06 は `Robot` から `buyerReadiness` / `marketAvailability` / `safetyNote` /
`vendorRiskNote` を落とすとするが、**①のどの Task も実行しない**。Task 3 は現行 `data/types.ts` の
semantics を写す設計なので、**削除予定のフィールドを Payload schema へ再導入してしまう。**

`buyerReadiness` は `lib/catalog/search.ts` で使用中。Payload schema だけでなく domain 型・
mapper・search・labels・visual semantics・tests・manifest scripts まで一緒に移す必要がある。

**`comparison` は削除しない。** `components/ComparisonRobotPanel.tsx` が12箇所で実表示している。

### M-3. Postgres migration の Task が無い（High）

Global Constraints は「schema変更はmigrationを生成してGitでreviewし、CIで適用確認する」と
要求しているが、本文に `payload migrate:create` / `migrations/` / `migrate:status` /
production適用 / down検証が**一度も現れない**。Postgres では collection / field 追加ごとに
migration が要る。

**schema Task ごとに migration 生成と review を含め、空DBへの up・既存schemaへの up・
down または復旧を検証する Task を追加する。**

### M-4. ①と②で script 名が食い違う（High）

| ①が定義 | ②が呼ぶ |
|---|---|
| `content:compare` | ~~`compare:content-sources`~~ → ②側を修正済み |
| `content:export` | ~~`export:content-snapshot`~~ → ②側を修正済み |

②は修正済み。①側も`content:compare`をcutover前のlocal vs Payload専用に限定し、cutover後は
`content:verify-snapshot`（完全一致）と`content:verify-conservation`（stableId保全）へ分離した。

### M-5. Task 2 の next config 例が security headers を消す（High）

現行 `next.config.ts:18-22` は全 route に security headers を設定している。Task 2 の置換例には
`headers()` が**無い**ため、そのまま実装すると削除される。`tests/unit/security-headers.test.ts` が
落ちる。

**現行 config を保持したまま `export default withPayload(nextConfig)` だけを加える。**

なお `next.config.mjs` という記載は誤りで、実際は `next.config.ts`（突合結果 §C）。
Task 2 の Files と commit command は修正済み（§C・Task 2 Step 4・Step 8 の git add）。

### M-6. `tsx` が devDependency に無い（Medium）

Task 5 は「`tsx` は Task 1 で明示的な devDependency として追加済み」とするが、**Task 1 に
install step は無く、`package.json` にも無い**（lockfile に transitive としてのみ存在）。

Task 2 か 5 で `npm install -D tsx` するか、現行 scripts に合わせて Node の
`--experimental-strip-types` へ統一する。

### M-7. object storage・secret・DB分離の provisioning が未計画（High）

Task 5 は画像を object storage へ upload するとするが、provider・storage adapter・bucket・
credentials・CORS・バックアップ・失敗時処理が無い。`REVALIDATION_SECRET` も Task 7 で使うのに
`.env.example` の更新対象に入っていない。Preview / Production の DB を別々に作る Task も無く、
②の G-6 へ丸投げされている。

**Task 2 の前に provider 確定・資源表・secret ownership を作る。**

### M-8. MCP の `publish: false` は権限制御になっていない（High）

Task 8 は独自 resolver に `publish: false` を期待するが、Payload MCP の標準 capability は
find / create / update / delete で、独立した publish capability は無い。`update: true` のまま
`_status: published` を拒否しなければ公開できてしまう。

**collection access / hook で draft → published transition を拒否する統合testを作る。**

---

## Global Constraints

- **`id`、`slug`、`previousSlugs`、公開URLは①の移行都合で変更しない。** URL waiverは②で
  個別承認した変換だけに適用する（§F）。
- `PublishStatus`、rights、sources、evidence、関連IDの意味を変えない。
- 本番コンテンツをCodexからSQLで直接更新しない。Payload API/MCPを通す。
- 通常のCodex権限はread/create/update-draftに限定し、delete/publish/schema/adminを許可しない。
- local TSとPostgresのdual writeを実装しない。
- Payload切替前に全collectionの件数、ID集合、参照、公開状態、主要フィールドのparityを機械検証する。
- Client Componentへraw collection全件を渡さず、必要なview modelだけを渡す。
- schema変更はmigrationを生成してGitでreviewし、CIで適用確認する。
- ユーザー由来の未コミット差分を変更・復元しない。
- 正式role enumは `content-reader` / `content-draft-writer` / `content-publisher` /
  `platform-admin` の4値だけとし、旧称 `editor` / `publisher` / `admin` をDB値に使わない。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `payload.config.ts` | Payload全体設定、DB、editor、collections、plugins |
| `collections/Admins.ts` | 管理画面ユーザーとrole |
| `collections/Manufacturers.ts` | manufacturer schema |
| `collections/Robots.ts` | robot schema |
| `collections/UseCases.ts` | use-case schema |
| `collections/Deployments.ts` | deployment schema |
| `collections/Articles.ts` | article schema |
| `collections/ArticlePlacements.ts` | reports/home掲載枠 |
| `collections/Media.ts` | binary metadata、rights、storage |
| `globals/SiteSettings.ts` | `dataAsOf` などの編集対象サイト設定 |
| `lib/payload/access.ts` | 正式4 roleとMCP API keyの権限 |
| `lib/payload/mcp.ts` | MCP公開範囲とcapability |
| `lib/content/contracts.ts` | source/repository境界とsnapshot型 |
| `lib/content/localSource.ts` | 移行期間のTS reader |
| `lib/content/payloadSource.ts` | Payload Local API reader |
| `lib/content/getContentRepository.ts` | source選択、cache、repository生成 |
| `lib/content/createContentRepository.ts` | 公開状態、slug、関連解決 |
| `lib/validation/collections/*.ts` | collection単位のdomain validation |
| `lib/validation/crossCollection.ts` | collection横断の参照・公開ゲート |
| `lib/content/cacheTags.ts` | collection単位のcache tag |
| `scripts/import-content-to-payload.mts` | 冪等import |
| `scripts/compare-content-sources.mts` | local/payload parity |
| `scripts/export-content-snapshot.mts` | rollback用export |
| `tests/content/repository.contract.test.ts` | local/payload共通contract |
| `tests/content/import-parity.test.ts` | import後parity |
| `tests/content/publish-gates.test.ts` | domain publish gates |
| `tests/fixtures/contentSnapshot.ts` | parity test用の最小fixture |
| `tests/e2e/public-routes.spec.ts` | 品質ゲート用の公開route smoke test |
| `tests/e2e/content-routes.spec.ts` | 主要URLと表示回帰 |
| `vitest.config.ts` / `eslint.config.mjs` / `playwright.config.ts` | unit、lint、E2E設定 |
| `.github/workflows/ci.yml` | PR/main品質ゲート |

### 変更

| Path | Responsibility |
|---|---|
| `package.json` / lockfile | Payload、DB adapter、test、migration commands |
| `next.config.ts` | `withPayload`統合 |
| `tsconfig.json` | `@payload-config` alias、生成型 |
| `.env.example` | DB、Payload、content source、storage設定 |
| `.gitignore` | rollback snapshot等の一時artifact除外 |
| `data/types.ts` | runtime domain型とPayload生成型の境界整理 |
| `lib/data.ts` | repository facadeへ縮小 |
| `lib/validate.ts` | 分割validatorのorchestratorへ縮小 |
| `scripts/validate-data.mjs` | local/payload両sourceに対応 |
| `src/app/layout.tsx` | Payload route groupと競合しないfrontend layoutへ整理 |
| `src/app/**/page.tsx` | async repository取得へ変更 |
| `src/app/sitemap.ts` | repository取得へ変更 |
| `components/*Browser.tsx` | raw recordではなくview model propsへ縮小 |
| `docs/decisions/data/README.md` | cutover後の編集入口へ更新 |
| `docs/decisions/data-maintenance-checklist-v1.md` | Admin/MCP前提へ更新 |
| `README.md` | runtime data sourceと運用コマンドを更新 |

---

### Task 0: 資源を確定して払い出す（人間の作業を含む）

**実行順は Task 0.5 → Task 1 → Task 0。** 文書上の番号は既存参照を壊さないため維持する。
Task 1は移行用envを追加する前のbaselineを固定するTaskなので、Task 0より先に行う。上位SoTの
更新・承認が終わるまでprovider契約、環境構築、secret発行を開始しない。

**Files:**
- Modify: `docs/reference/content-platform-resources-v1.md`（Task 0.5が作る承認記録入りskeletonを資源表として完成させる）
- Modify: `.env.example`

**Interfaces:**
- Produces: Postgres / object storage の provider 確定、環境別の接続情報、secret の管理者

`content-platform-and-database-architecture-v2.md` §11 が「実装開始時に確定する」とした
未確定5件に、本計画で追加したsnapshot署名方式とaudit outbox暗号化を加えた7件を、ここで閉じる。
**Task 2 の前に終わらせる。**

- [x] **Step 1: provider を確定する**

| 項目 | 初期値 | 決めること |
|---|---|---|
| Postgres | Supabase | プラン、リージョン、接続プーリング方式 |
| public media storage | Vercel Blob | Production / Preview別store、public access、Payload adapter、CORS |
| private audit / backup storage | private Vercel BlobまたはS3互換 | Production / Preview別store、private access、retention、delete / restore権限 |
| Payload の置き場 | 現行 Vercel へ同居 | Payload Cloud を使わない判断の確認 |
| snapshot署名 | cosign + KMS管理鍵 | key ID、検証用公開鍵、署名実行者 |
| audit outbox暗号化 | KMS envelope encryption | 署名鍵と別のkey ID、rotation、復号担当、旧version保持 |

- [x] **Step 2: 環境ごとにDBを分ける（②の G-6 の前提）**

**Git はブランチで分かれるが DB は分かれない。** Preview の編集が本番に出る事故を防ぐ。

| 環境 | DB | 用途 |
|---|---|---|
| local | ローカル or 開発用 Supabase | 開発 |
| CI | 使い捨て（毎回作り直す） | migration の空DB適用検証（Task 3.5 Step 2） |
| Preview | 検証用 | ブランチデプロイ |
| Production | 本番 | |

object storageもDBと同じ環境境界で分離する。**次の5つは論理名だけでなく別store / 別資格情報にする。**

| Store | Access mode | CORS | Retention | delete | restore/read |
|---|---|---|---|---|---|
| Production media | public | Production originのupload APIだけ。公開GETはCDN | Media削除policyに従う | `platform-admin` | 公開GET、書込はProduction media credential |
| Production audit/backup | private | browser直接accessなし | baselineはrollback終了後90日以上、batch before-imageは180日以上 | security ownerのみ | `platform-admin` + recovery operator |
| Preview media | public | Preview allowlistのみ | Preview終了後30日 | Preview `platform-admin` | Preview credentialのみ |
| Preview audit/backup | private | browser直接accessなし | Preview終了後30日 | Preview `platform-admin` | Preview recovery operator |
| CI/test | fake / local | なし | job終了時に破棄 | test runner | test runner |

Production private credentialはPreview / CIへ設定しない。Preview credentialでProductionのobject keyを
read/write/delete/restoreしようとしてすべて拒否される負テストをG-6相当の環境境界testに含める。

- [x] **Step 3: 環境変数を洗い出して `.env.example` へ書く**

```dotenv
DATABASE_URL=
PAYLOAD_SECRET=
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
CONTENT_SOURCE=local
ALLOW_LOCAL_CONTENT_ROLLBACK=false
REVALIDATION_SECRET=
PREVIEW_TOKEN_SECRET=
PRODUCTION_MEDIA_BLOB_TOKEN=
PRODUCTION_AUDIT_BLOB_TOKEN=
PREVIEW_MEDIA_BLOB_TOKEN=
PREVIEW_AUDIT_BLOB_TOKEN=
SNAPSHOT_SIGNING_KEY=
AUDIT_OUTBOX_KMS_KEY_ID=
```

**`REVALIDATION_SECRET` と `PREVIEW_TOKEN_SECRET` は Task 7 が使う。** `AUDIT_OUTBOX_KMS_KEY_ID`は
②の監査outboxをenvelope encryptionする鍵の識別子で、署名用KMS鍵と共有しない。raw秘密鍵や
復号可能なdata keyをenvへ置かない。storage tokenは用途・環境を名前で区別し、単一の
共通read/write tokenを共有しない。
**実値はここに書かない。** Vercel の Environment Variables で設定する。

- [x] **Step 4: 接続を確認し、環境ごとの fingerprint を記録する**

**`current_database()` 単体では分離を証明できない。** 別 provider の別プロジェクトでも
標準DB名（`postgres` 等）が一致することがあり、逆に同じ server 上の別DB名だけでは
意図した managed resource かを保証できない。**host・project参照・database名・schema・
環境marker を組み合わせて fingerprint にする。**

```bash
psql "$DATABASE_URL" -c "
  select
    current_database() as db,
    current_user as usr,
    current_setting('server_version') as pg_version,
    inet_server_addr() as host_addr,
    current_setting('cluster_name', true) as cluster_name;
"
```

上記の出力と、provider 管理画面が示す project ref / project ID を合わせて
`docs/reference/content-platform-resources-v1.md` へ環境ごとに記録する。

Expected: Preview と Production でproviderの **project/resource IDが必ず異なる**。
`current_database()` や `host_addr` だけが違う場合は分離の証明にしない。

**接続メタデータだけでは足りない。** `_environment_marker` のDDLはTask 3.5のinitial migrationへ
含め、Task 0では手動SQLを実行しない。Task 3.5のmigration適用後、Git管理script
`npm run environment:stamp -- --expected preview|production` が環境固有行を冪等にinsertし、
反対環境の行があれば書き換えずexit 1にする。

Task完了時点では(a) provider resource IDが異なること、(b)5つのstorageが別store / 別credentialで
あること、(c)Production credentialがPreviewに未設定であることを資源表へ記録する。DB markerの
実データ検証はTask 3.5完了条件と② G-6で行う。

- [x] **Step 5: 資源表を書いてcommit**

provider・環境別の接続先・5 storageのprovider resource ID / access mode / CORS / retention / credential
owner / delete権限 / restore権限・snapshot署名鍵IDと公開鍵・audit outbox KMS key ID / rotation / 復号担当・
費用責任者・復旧手順の入口を1枚にまとめる。

**完了条件:** 外部リソースの契約・費用・責任者を含む未確定事項が閉じ、環境ごとにDBとstorageが
分かれている。1件でもowner / credential / retentionが未確定ならTask 2へ進まない。

---

### Task 0.5: 上位正本を新schemaへ先行更新する

**Files:**
- Create: `docs/reference/content-platform-resources-v1.md`（承認者・commit SHA・承認日時だけを持つskeleton。Task 0が資源情報を追記）
- Modify and approve: `docs/decisions/content-platform-and-database-architecture-v2.md`
- Modify and approve: `docs/decisions/data-architecture-redesign-v1.md`
- Modify: `docs/decisions/data-maintenance-checklist-v1.md`（§F から `buyerReadiness`、`candidateRobots` に `seriesId`）
- Modify: `ai/rules/21-data-maintenance-workflow.md`（対象collection、編集先）

**②は「上位正本を計画より優先する」と書いている。** その正本が旧schemaのままだと、
Task 3 の実装時点で正本と計画が衝突する。**schema を書く前に正本を直す。**
Task 1のbaseline確認とTask 0の外部resource払い出しも本Taskの承認後に開始する。

| 文書 | 現状 | 直す内容 |
|---|---|---|
| `content-platform-and-database-architecture-v2.md` §2.1 / §7.3 / §10 | URL不変、role、storage境界が計画と衝突 | ①はslug / previousSlugs parity、正式4 role、環境×用途別storageへ統一 |
| `data-architecture-redesign-v1.md` §0 / §11 / §11.5 | buyerReadiness必須表とURL契約が旧値 | RobotのbuyerReadiness必須を削除し、①ではURL parity、Series検索契約を明記 |
| `data-maintenance-checklist-v1.md` §F | Robot の公開ゲートが `buyerReadiness` を要求。`candidateRobots` を `robotId` のみに限定 | `buyerReadiness` を外し、`seriesId` を許す |
| `ai/rules/21-data-maintenance-workflow.md` | 対象collectionが6種類、編集先が `data/*.ts` | 9つの編集対象content collection + SiteSettings globalへ。`admins`は認証専用で除外。編集先は cutover 後に Payload |

**cutover 後（Task 9）に回さない。** 回すと Task 3〜8 の間ずっと矛盾したまま作業することになる。

- [x] **Step 1: 上位2文書、checklist、AI ruleを更新して `updated` を上げる**
- [x] **Step 2: architecture ownerとcontent ownerがURL waiver・role enum・Robot必須fieldを承認する**

承認者、commit SHA、承認日時を `docs/reference/content-platform-resources-v1.md` のdecision logへ残す。
口頭確認だけ、または未承認の文書差分ではgate通過にしない。

- [x] **Step 3: 旧契約が残っていないことを機械確認する**

```bash
rg -n '公開URLの維持は不要|slug・previousSlugsの維持は要件外|id と slug を変更しない' \
  docs/decisions docs/plans/content-platform-migration-plan-v1.md
rg -n 'category / deploymentStage / buyerReadiness|Robot.*buyerReadiness.*必須' docs/decisions
rg -n "'editor'|'publisher'|'admin'|editor/adminロール" \
  docs/decisions/content-platform-and-database-architecture-v2.md \
  docs/plans/content-platform-migration-plan-v1.md
```

Expected: 包括URL waiver 0件、RobotのbuyerReadiness必須要件0件、旧roleをenum値として使う箇所0件。
履歴説明や明示的な旧称対応表だけは許可し、該当行を人が1件ずつ確認する。

- [x] **Step 4: `npm run check:docs` が緑であることを確認**
- [x] **Step 5: commit**

**完了条件:** 4文書が新schemaを反映し、上位2文書の承認記録と矛盾検索0件が揃う。未承認または
1件でも意味上の矛盾が残れば①のTask 1へ進まない。

---

### Task 1: 移行開始前gateを確認する

**Files:**
- Modify: `docs/plans/content-platform-migration-plan-v1.md`

**Interfaces:**
- Consumes: pre-migration refactorで追加済みの`npm run check`、local snapshot、validator、view model
- Produces: Payload package導入前のclean/green baseline

- [x] **Step 1: pre-migration programの完了文書を確認する**

```bash
test -f docs/reference/pre-migration-refactor-results-v1.md
rg -n "CMS / DB移行は未実施|Added gates|Remaining work" \
  docs/reference/pre-migration-refactor-results-v1.md
```

Expected: results文書が存在し、local TSが正本、品質ゲート完了、CMS / DBが残作業として記録されている。

- [x] **Step 2: clean installから全gateを実行する**

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
```

Expected: 全gate exit 0、critical vulnerability 0。残るhighがある場合は`docs/reference/dependency-audit-2026-07-26.md`にpackage、到達可能性、追跡先がある。

- [x] **Step 3: source境界と既存migration package不在を確認する**

```bash
npm run check:data-boundaries
rg -n "\"(payload|@payloadcms/db-postgres|@payloadcms/next)\"" package.json
rg -n "DATABASE_URL|PAYLOAD_SECRET|CONTENT_SOURCE" .env.example
```

Expected:

- data boundary checkがexit 0
- Payload/Postgres packageは0件
- migration用envは0件

- [x] **Step 4: working treeとbranchを確認する**

```bash
git status -sb
git branch --show-current
```

Expected: working tree clean、CMS / DB移行専用branch上。pre-migration integrationや`main`へ直接実装しない。

- [x] **Step 5: Task 1完了を記録してcommit**

```bash
git add docs/plans/content-platform-migration-plan-v1.md
git commit -m "docs: confirm content migration start gates"
```

---

### Task 2: Payloadを現行Next.jsへ組み込む

**Files:**
- Create: `payload.config.ts`
- Create: `collections/Admins.ts`
- Create: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `src/app/(payload)/api/[...slug]/route.ts`
- Create: `src/app/(payload)/layout.tsx`
- Create: `src/app/(payload)/admin/importMap.js`
- Create: `tests/e2e/payload-admin.spec.ts`
- Create: `tests/content/admin-access.test.ts`
- Modify: `next.config.ts`
- Modify: `tsconfig.json`
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `DATABASE_URL`、`PAYLOAD_SECRET`
- Produces: `/admin`、`/api`、`payload.config.ts`、Payload Local API

- [x] **Step 1: admin routeのE2E testを書く**

```ts
import { expect, test } from '@playwright/test';

test('Payload admin login is mounted', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: /welcome|login|create/i })).toBeVisible();
});
```

- [x] **Step 2: testが404で失敗することを確認する**

Run: `npm run test:e2e -- tests/e2e/payload-admin.spec.ts`

Expected: `/admin` のheadingが見つからずFAIL

- [x] **Step 3: Payload・Postgres・storage adapter・`tsx` を追加する**

`tsx` は Task 5 の import / compare / export script が使う。**transitive dependency に依存しない。**

```bash
npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical sharp
# Task 0 で Vercel Blob を選んだ場合（初期値）
npm install @payloadcms/storage-vercel-blob
# S3互換storageを選んだ場合は上の1行の代わりに次を使う
# npm install @payloadcms/storage-s3
npm install -D tsx
```

```bash
npm ls tsx --depth=0
```
Expected: `devDependencies` に解決される。

- [x] **Step 4: Next.js configをPayloadでwrapする**

**現行 `next.config.ts` を置き換えない。`withPayload()` で包むだけにする。**

現行の `next.config.ts:18-25` は全 route へ security headers を設定している。
置換すると消え、`tests/unit/security-headers.test.ts` が落ちる。

```ts
// next.config.ts — 既存の import と nextConfig 本体はそのまま残す
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig = {
  cacheComponents: true,
  turbopack: { root: path.resolve('.') },
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [{ source: '/:path*', headers: [...securityHeaders] }];   // ← 消さない
  },
};

export default withPayload(nextConfig);   // ← 変更はこの1行だけ
```

**ファイル名は `next.config.ts`。** `next.config.mjs` ではない（突合結果 §C）。

- [x] **Step 5: 環境変数契約を追加する**

`.env.example`:

```dotenv
DATABASE_URL=
PAYLOAD_SECRET=
CONTENT_SOURCE=local
ALLOW_LOCAL_CONTENT_ROLLBACK=false
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
REVALIDATION_SECRET=
PREVIEW_TOKEN_SECRET=
PRODUCTION_MEDIA_BLOB_TOKEN=
PRODUCTION_AUDIT_BLOB_TOKEN=
PREVIEW_MEDIA_BLOB_TOKEN=
PREVIEW_AUDIT_BLOB_TOKEN=
SNAPSHOT_SIGNING_KEY=
```

storage providerをS3互換へ変更した場合は、Task 0の資源表で確定したbucket・region・endpoint・
access key用の変数名へ置き換える。選んでいないproviderのadapterと環境変数を併存させない。

- [x] **Step 6: admin collectionとPayload configを追加する**

`collections/Admins.ts`:

```ts
import type { CollectionConfig } from 'payload';

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    // bootstrap時はadmins=0件の場合だけ1人目を作成可能。以後はplatform-adminだけ。
    create: canBootstrapFirstAdminOrPlatformAdmin,
    read: selfOrPlatformAdmin,
    update: selfOrPlatformAdmin,
    delete: platformAdminExceptLastPlatformAdmin,
    unlock: isPlatformAdmin,
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [{
    name: 'role',
    type: 'select',
    required: true,
    // 1人目はbeforeValidateでplatform-adminへ強制する。2人目以降の既定値。
    defaultValue: 'content-draft-writer',
    options: ['content-reader', 'content-draft-writer', 'content-publisher', 'platform-admin'],
    access: {
      create: canSetRoleOnBootstrapOrPlatformAdmin,
      update: isPlatformAdmin,
    },
  }],
};
```

正式enumは上記4値だけ。人間のeditorも通常のCodex MCPも `content-draft-writer`、公開担当は
`content-publisher`、管理担当は`platform-admin`を使う。旧称`editor` / `publisher` / `admin`は
表示ラベルに限り、保存値・API入力にしない。Task 8のaccess / hookも同じenumで分岐する。

Payloadの既定accessは認証済みuserへcreate/read/update/deleteを許すため、`auth: true`だけで
Adminsを公開しない。1人目はadminsが0件の間だけ`/create-first-user`から作成し、roleを
`platform-admin`へ強制する。2人目以降の作成、role変更、unlockは`platform-admin`だけに許可する。
自分自身を含む最後の`platform-admin`の削除・降格を拒否する。collection updateをselfに許す場合も、
role field accessは別に検査して自己昇格を防ぐ。

`tests/content/admin-access.test.ts`は未認証create、draft writerの自己昇格、他user昇格、新admin作成、
admin削除、last-admin降格を拒否し、first-user bootstrap 1回とplatform-adminによる通常管理だけが
成功することを実Payload APIで確認する。Task 8では同じsuiteをMCP credentialにも再実行する。

`payload.config.ts` は `buildConfig` で `postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })`、`lexicalEditor()`、`Admins`、`secret`、`typescript.outputFile` を設定する。`DATABASE_URL` と `PAYLOAD_SECRET` が欠落した場合は、用途が分かるメッセージで起動を失敗させる。admin page / layout / REST route / import mapはPayloadの既存Next.js統合用viewとhandlerを使い、独自admin shellを作らない。

CIにはPostgreSQL service containerとtest用 `DATABASE_URL` / `PAYLOAD_SECRET` を追加し、ローカルでは専用の開発DBを使う。本番DBをE2Eへ接続しない。

- [x] **Step 7: admin routeと既存公開routeを確認する**

Run: `npm run test:e2e -- tests/e2e/payload-admin.spec.ts`

Run: `npm run test -- tests/content/admin-access.test.ts`

Expected: PASS

Run: `npm run build`

Expected: 現行157ページ相当とPayload routesがbuildされ、exit 0

- [x] **Step 8: commit**

```bash
git add payload.config.ts collections/Admins.ts src/app/'(payload)' tests/e2e/payload-admin.spec.ts tests/content/admin-access.test.ts next.config.ts tsconfig.json .env.example package.json package-lock.json .github/workflows/ci.yml
git commit -m "feat: embed Payload CMS in the Next.js app"
```

---

### Task 3: 全collectionと権限を定義する

**Files:**
- Create: `collections/Manufacturers.ts`
- Create: `collections/Robots.ts`
- Create: `collections/RobotSeries.ts`
- Create: `collections/Distributors.ts`
- Create: `collections/UseCases.ts`
- Create: `collections/Deployments.ts`
- Create: `collections/Articles.ts`
- Create: `collections/ArticlePlacements.ts`
- Create: `collections/Media.ts`
- Create: `globals/SiteSettings.ts`
- Create: `lib/payload/access.ts`
- Create: `lib/payload/routeRegistry.ts`
- Create: `lib/payload/publishApprovedVersion.ts`
- Create: `lib/content/domainTypes.ts`（cutover後も残るcanonical runtime型）
- Create: `lib/content/payloadMappers.ts`
- Modify: `payload.config.ts`
- Modify: `data/types.ts`（移行期間だけlegacy型を提供するcompatibility境界）
- Test: `tests/content/payload-schema.test.ts`
- Test: `tests/content/media-storage.test.ts`
- Test: `tests/content/route-registry.test.ts`
- Test: `tests/content/publish-approved-version.test.ts`

**Interfaces:**
- Consumes: `data/types.ts` の現行field semantics（**ただし §D の削除4フィールドは写さない**）
- Produces: Payload collections 10本、relationship fields、draft/version、role-based access

Payload の `collections/Robots.ts` は `data/types.ts` の旧 `Robot` interface をimportして
作らず、**独立したschemaとして最初から4フィールド無しで書く。** 同時に
`lib/content/domainTypes.ts` へcutover後も使うcanonical runtime型を定義し、canonical `Robot` も
4フィールドを持たない。`data/types.ts` は移行期間だけ、`data/*.ts` が現在持つ4フィールドを
受け入れるlegacy型を提供するcompatibility境界とする。

Task 4以降のrepository・Payload mapper・view modelは必ず `lib/content/domainTypes.ts` を使う。
local sourceはlegacy recordから4フィールドを明示的に除いてcanonical型へ変換する。これにより
Payload sourceだけ存在しないrequired fieldを捏造せず、local/payload両sourceが同じcontractを返す。
`mapPayloadRobotToDomain(doc, payload): Promise<Robot>` はrelationship内部IDをstableIdへ解決する。
Payload `_status`は`draft|published`しか表せないため、`lifecycleStatus: active|archived`も全content
collectionへ定義し、domain `publishStatus`を次で変換する。

| domain | Payload `_status` | `lifecycleStatus` |
|---|---|---|
| `draft` | `draft` | `active` |
| `published` | `published` | `active` |
| `archived` | `published` | `archived` |

逆向きの
`mapDomainRobotToPayload(robot, payload): Promise<RobotPayloadData>` は
stableId relationshipを内部IDへ解決して両fieldを書く。custom `publishStatus` fieldは作らない。
`lib/catalog/search.ts` の
`buyerReadinessLabels[robot.buyerReadiness]` など、削除4フィールドに依存する消費側コードは
**Task 6（ページをrepositoryへ切り替える）**で直す。Task 6 の時点でページが読む形が
Payload 由来（4フィールド無し）に変わるため、そこで消費側を合わせる。

**このTaskが `Robot` から削除する4フィールド**（`robot-data-import-plan-v1.md` DEC-S05・S06）:

| フィールド | 現状 | 削除にあたって一緒に消すもの |
|---|---|---|
| `buyerReadiness` | 型に `@deprecated`。**`lib/catalog/search.ts:51` が実行時に使用中** | `lib/catalog/search.ts` の連結。型 `BuyerReadiness` は `UseCase` が使うので残す |
| `marketAvailability` | 参照0。`robot.marketAvailability` を読むコードが存在しない | 型 `MarketAvailability`、`lib/labels.ts` の `marketAvailabilityLabels`、`lib/visualSemantics.ts` の tone、両 manifest script |
| `safetyNote` | 0/63件 | `tests/unit/view-models/robots.test.ts` の参照 |
| `vendorRiskNote` | 1/63件。**`Manufacturer.vendorRiskNote` は 25/26 で残す** | 同上 |

**`comparison` は削除しない。** 型に `@deprecated` が付くが `components/ComparisonRobotPanel.tsx`
が `robot.comparison.*` を12箇所で実表示している。削除するなら `/compare` の作り替えが要るため
別計画。`collections/Robots.ts` には含める。

`RobotSeries` と `Distributors` の設計は `docs/decisions/data-architecture-redesign-v1.md`
§4-1 / §11 が正本。**`RobotSeries` はスペックも価格も持たない**（`deploymentStage` と `specs` に
答えが存在しないため）。

`Media` は Task 0で確定した**環境別public media store**のadapterを `payload.config.ts` のpluginへ
登録する。Vercel BlobならProductionは`PRODUCTION_MEDIA_BLOB_TOKEN`、Previewは
`PREVIEW_MEDIA_BLOB_TOKEN`を選び、private audit tokenをMedia adapterへ渡さない。
local / CIでcloudへ書かない場合も、adapterを無かったことにせず `enabled` を環境変数で切り替え、
schemaへ注入されるfield差分が環境間で変わらない設定にする。

- [x] **Step 1: schema contract testを書く**

```ts
import { describe, expect, it } from 'vitest';
import config from '@payload-config';

describe('Payload content schema', () => {
  it('registers every content collection', async () => {
    const resolved = await config;
    expect(resolved.collections.map((collection) => collection.slug)).toEqual(
      expect.arrayContaining([
        'admins',
        'manufacturers',
        'distributors',
        'robot-series',
        'robots',
        'use-cases',
        'deployments',
        'articles',
        'article-placements',
        'media',
      ]),
    );
  });

  // ②の §0 G-4 が要求する。data/types.ts を写すと再導入されるため機械で止める。
  it('does not carry the removed Robot fields', async () => {
    const resolved = await config;
    const robots = resolved.collections.find((collection) => collection.slug === 'robots')!;
    const names = robots.fields.flatMap((field) => ('name' in field ? [field.name] : []));

    for (const removed of ['buyerReadiness', 'marketAvailability', 'safetyNote', 'vendorRiskNote']) {
      expect(names).not.toContain(removed);
    }
    // comparison は /compare が使用中のため残す
    expect(names).toContain('comparison');
  });

  it('links robots to their series', async () => {
    const resolved = await config;
    const robots = resolved.collections.find((collection) => collection.slug === 'robots')!;
    const seriesId = robots.fields.find((field) => 'name' in field && field.name === 'seriesId');

    expect(seriesId).toBeDefined();
    expect(seriesId).toMatchObject({ type: 'relationship', relationTo: 'robot-series', required: false });
  });
});
```

- [x] **Step 2: 未定義collectionによりFAILすることを確認する**

Run: `npm run test -- tests/content/payload-schema.test.ts`

Expected: `manufacturers` / `robot-series` / `distributors` が不足してFAIL

- [x] **Step 3: collectionを一つずつ追加する**

Mediaについては、テスト用の小さな画像を upload → read → delete し、(a) object storageに保存される、
(b)未認証readがaccess policyどおりになる、(c)delete後にobjectが残らない、の3点を
`tests/content/media-storage.test.ts` で確認する。adapterがfieldを追加する場合は、Task 3.5の
migrationへ必ず含める。

各collectionは次を共通化する。

```ts
{
  versions: { drafts: true, maxPerDoc: 50 },
  access: {
    read: publishedOrAuthenticated,
    create: canWriteDraft,
    update: canWriteDraft,
    delete: isPlatformAdmin,
  },
  fields: [
    { name: 'stableId', type: 'text', required: true, unique: true, index: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'previousSlugs', type: 'text', hasMany: true },
  ],
}
```

versionsは最低180日保持し、50件上限へ達するrecordは古いversionを削除する前に署名済みprivate
audit archiveへexportする。自動pruneの実行主体、件数、version IDを監査ログへ残す。

collection accessの期待値は全content collectionで次に統一する。`publish` / `unpublish`は独立した
Payload capabilityではなくupdate内の状態遷移なので、accessに加えて`beforeChange`でもactorを検査する。

| actor | read | create draft | update draft | publish | unpublish | delete |
|---|---:|---:|---:|---:|---:|---:|
| `content-reader` | ✓ | × | × | × | × | × |
| `content-draft-writer` | ✓ | ✓ | ✓ | × | × | × |
| `content-publisher` | ✓ | ✓ | ✓ | ✓ | ✓ | × |
| `platform-admin` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| MCP API key (`content-draft-writer`) | ✓ | ✓ | ✓ | × | × | × |

Local APIの呼び出しは原則 `overrideAccess: false` と実行`user`を指定する。bootstrap / restoreで
例外的にoverrideする場合はrunbookに理由・対象・run IDを残し、通常importから再利用できない別entrypointにする。

RobotとRobotSeriesは同じ`/robots/[slug]` namespaceを共有するため、collectionごとの`unique: true`だけに
依存しない。initial migrationで`content_route_registry(namespace, slug, owner_collection,
owner_stable_id)`を作り、`UNIQUE(namespace, slug)`をDB制約にする。Robots / RobotSeriesのcreate、slug更新、
delete hookは同じ`req.transactionID`でregistryをclaim / move / releaseする。`previousSlugs`も予約し、現行slugとの
衝突を拒否する。Robot→Series、Series→Robot、同時create、Task 9.5のowner移管を統合testにする。

承認済みdraftの公開は`publishApprovedVersion()`へ集約する。入力はcollection、stableId、
`approvedVersionId`、approval manifest hash、publisher req。公開直前に最新draft version IDが承認IDと一致する
ことを確認し、承認versionの全canonical fieldを読み出して`_status: 'published'`とともにmain documentへ書く。
承認後に別draftが作られた場合、statusだけを更新する場合、approval hashが違う場合は停止する。公開後は
canonical hashとversion chainが承認対象と一致することを返す。Task 6〜9.5は独自のpublish updateを作らず
このhelperを使う。

参照はPayload relationshipとして定義し、API変換時に既存の `*Id` へ戻す。`stableId` は既存 `id` を保持し、Payload内部IDを公開参照に使わない。

現行 `ArticlePlacement` だけはidを持たないため、import時に `surface:slot:articleId` を決定的な `stableId` として生成する。同じsurface / slot内のorder重複と、同じ記事の重複配置はdomain validatorで拒否する。Mediaは正規化した既存srcを基に決定的なstableIdを生成し、再importで重複させない。

- [x] **Step 4: publish gateをcollection hookへ接続する**

公開時だけdomain validatorを呼び、draftでは不完全レコードを保存可能にする。

```ts
hooks: {
  beforeChange: [
    async ({ data, originalDoc, operation, req }) => {
      const candidate = operation === 'update'
        ? { ...originalDoc, ...data }
        : data;

      if (candidate?._status === 'published') {
        if (!['content-publisher', 'platform-admin'].includes(req.user?.role)) {
          throw new Error('publish-role-required');
        }
        // relationship内部IDとPayloadの `_status` をcanonical domain型へ変換してから検証する。
        // updateのdataは差分だけなので、data単体をvalidatorへ渡さない。
        validateRobotForPublish(await mapPayloadRobotToDomain(candidate, req.payload));
      }
      return data;
    },
  ],
}
```

`originalDoc._status === 'published'`からdraftへ戻すunpublishも同じ2 roleだけに許可する。create時に
`content-draft-writer`が最初から`_status: 'published'`を送る経路、update時に送る経路を両方拒否する。
`lifecycleStatus`を`archived`へ変えるarchive操作と`active`へ戻すrestoreも同じ2 roleだけに許可する。

各collectionで「必須field以外は既存値のまま、`_status` だけをpublishedへ変更する」回帰テストを
追加し、partial updateでも公開gateが完全なdocを検証することを固定する。

- [x] **Step 5: schema testと型生成を実行する**

Run: `npx payload generate:types`

Expected: `payload-types.ts` が生成される

Run: `npm run test -- tests/content/payload-schema.test.ts tests/content/publish-gates.test.ts tests/content/route-registry.test.ts tests/content/publish-approved-version.test.ts`

Expected: schema testに加え、上の5 actor × 6操作の権限表、draft writerのcreate時published拒否、
update時published拒否、publisherのpublish/unpublish、adminのみdelete、承認versionの内容一致、
承認後draft競合拒否、Robot/Series slugのDB一意制約がPASS

- [x] **Step 6: commit**

```bash
git add collections globals lib/payload payload.config.ts payload-types.ts tests/content/payload-schema.test.ts tests/content/publish-gates.test.ts tests/content/route-registry.test.ts tests/content/publish-approved-version.test.ts
git commit -m "feat: define Payload content collections"
```

---

### Task 3.5: Postgres migration を生成・適用・検証する

**Files:**
- Create: `migrations/*.ts`（Payload が生成）
- Create: `scripts/stamp-environment.mts`
- Modify: `package.json`（`payload:migrate` / `payload:migrate:status` / `payload:migrate:create`）
- Modify: `.github/workflows/ci.yml`
- Test: `tests/content/migration.test.ts`

**Interfaces:**
- Consumes: Task 3 の collections 10本
- Produces: Git で review 可能な migration ファイルと、CI での適用確認

**`_environment_marker`、`content_route_registry`を含むすべてのDDLをmigrationへ入れる。** 手動SQLで作ったtableは
「全migrationをGit管理」と矛盾する。Postgresではcollection / field追加ごとにmigrationが要る。

- [x] **Step 1: migration script を package.json へ追加する**

```json
{
  "payload:migrate": "payload migrate",
  "payload:migrate:create": "payload migrate:create",
  "payload:migrate:status": "payload migrate:status"
}
```

- [x] **Step 2: 空DBへ適用できることを確認する**

新しい空のデータベースを作り、そこへ流す。

```bash
npm run payload:migrate:create -- initial-schema
npm run payload:migrate
npm run payload:migrate:status
```
Expected: 10 collectionぶんのテーブル、`_environment_marker`、`content_route_registry`と
`UNIQUE(namespace, slug)`が作られ、statusがすべて適用済みになる。

`environment:stamp`をpackage scriptへ追加し、`DEPLOYMENT_ENV`と`--expected`が一致するときだけ
`preview`または`production`の1行を冪等にinsertする。反対環境の行が既にあれば変更せずexit 1。

```bash
npm run environment:stamp -- --expected preview
```

Expected: Previewは`preview` 1行だけ、Productionは`production` 1行だけ。marker DDLを手動実行しない。

- [x] **Step 3: 既存schemaを持つDBへ適用できることを確認する**

**Production / Previewと資格情報を共有しない隔離DB**へinitial migrationを適用し、次にTask 8で
実際に採用するMCP API key schema migration fixtureを適用する。任意フィールドをcollectionへ足して
試験しない。fixture config・一時migration出力先は`tests/fixtures/payload-migrations/`に限定し、
test終了時に隔離DBと生成物を破棄する。

Expected: 実採用schema差分だけのmigrationが生成され、seedした既存データが消えない。

- [x] **Step 4: 巻き戻せることを確認する**

package lockで固定したPayload版のdownコマンドを`docs/reference/database-migration-runbook-v1.md`へ
具体的に記載し、隔離DBで直前migrationをdown→upする。空migrationもfixtureで生成し、
`--skip-empty`相当がfileを作らず非対話でexit 0になることを確認する。

Expected: 直前の migration が取り消され、そのテーブル・カラムが消える。**down が動かない場合は、
`content:export` からの復元手順を Task 5 で確立するまで先へ進まない。**

- [x] **Step 5: schema drift を検出する負テストを書く**

**`payload:migrate:status` は「生成済みmigrationファイルの適用状態」しか見ない。**
「`collections/Robots.ts` にフィールドを足したのに migration を生成し忘れた」という
drift は検出できない。**`migrate:create` を実行して新しいファイルが生成されるかどうかで
判定する** — 生成されれば drift がある。

**CIは非対話。** 変更が無いとき `migrate:create` が「変更なし、生成しますか」のような
確認プロンプトを出す実装だと、CIの標準入力は無いのでプロンプトが応答を待ち続けて
ジョブがtimeoutするまでハングする（drift が無いのが大多数のケースなので、これが
毎回のCIで起きる）。**`--skip-empty`（変更が無ければファイルを作らずexit 0で終える
フラグ。導入する Payload バージョンのCLIオプションを公式ドキュメントで確認し、
無ければ `yes ''` 等でプロンプトへ空応答を流す代替を使う）を付けて非対話化する。**

```bash
npm run payload:migrate:create -- __drift-check --skip-empty 2>&1 | tee /tmp/drift.log
if ls migrations/*__drift-check* 2>/dev/null; then
  echo "schema drift: collections の変更に対応する migration が無い"
  rm migrations/*__drift-check*
  exit 1
fi
```

**`--skip-empty` を先に単体で確認する。** drift が無い状態でこのコマンドだけを実行し、
プロンプトが出ずにexit 0で終わることを、Step 6 でCIへ組み込む前に手元で確認する。

- [x] **Step 6: CI へ組み込む**

`.github/workflows/ci.yml` に Step 5 の drift check と `payload:migrate:status` の両方を追加する。
drift check は「migration ファイルの生成漏れ」を、`migrate:status` は「生成したが適用し忘れた
migration」を検出する。**両方無いと片方の不備を見逃す。**

- [x] **Step 7: ゲートが赤くなることを確認する（Global Constraints）**

fixture configにだけfieldを1つ足し、migrationを生成せずCI相当checkを回す。
Expected: Step 5のdrift checkが **exit 1**。確認後はfixture差分と一時migrationを破棄し、
production config / migrationsに試験fieldが0件であることを`git diff --check`と`rg`で確認する。

- [x] **Step 8: production 適用の手順を書く**

deploy pipeline で `npm run payload:migrate` を build の前段に置く。失敗したら deploy を止める。
migration はスキーマ変更であり、アプリコードより先に適用されている必要がある。

- [x] **Step 9: commit**

```bash
git add migrations scripts/stamp-environment.mts package.json .github/workflows/ci.yml tests/content/migration.test.ts docs/reference/database-migration-runbook-v1.md
git commit -m "feat(db): Postgres migration の生成・適用・検証を追加"
```

**完了条件:** up / down / 再up、空migration、schema drift、marker誤環境拒否が隔離DBで確認済み。
一時生成物0件、Production適用手順が具体化され、未適用migrationをCIが検出する。

---

### Task 4: content sourceとrepositoryを分離する

**Files:**
- Create: `lib/content/contracts.ts`
- Create: `lib/content/localSource.ts`
- Create: `lib/content/payloadSource.ts`
- Create: `lib/content/createContentRepository.ts`
- Create: `lib/content/getContentRepository.ts`
- Create: `tests/content/repository.contract.test.ts`
- Modify: `lib/data.ts`

**Interfaces:**
- Consumes: local arraysまたはPayload Local API
- Produces: `getContentRepository(): Promise<ContentRepository>`、query単位のruntime取得、管理処理専用snapshot

- [x] **Step 1: repository contract testを書く**

```ts
import { describe, expect, it } from 'vitest';
import { createContentRepository } from '@/lib/content/createContentRepository';
import { createLocalContentSource } from '@/lib/content/localSource';

describe('ContentRepository contract', () => {
  it('resolves stable IDs and previous slugs', async () => {
    const repository = createContentRepository(createLocalContentSource());
    const [robot] = await repository.listRobots({ limit: 1 });
    expect((await repository.getRobotById(robot.id))?.id).toBe(robot.id);
    expect((await repository.resolveRobotDetailBySlug(robot.slug)).record?.id)
      .toBe(robot.id);
  });
});
```

- [x] **Step 2: module未作成によるFAILを確認する**

Run: `npm run test -- tests/content/repository.contract.test.ts`

Expected: `Cannot find module '@/lib/content/createContentRepository'`

- [x] **Step 3: runtime queryとsnapshot contractを分離する**

```ts
import type {
  Article,
  ArticlePlacement,
  ArticlePlacementSlot,
  DeploymentSite,
  Distributor,
  Manufacturer,
  MediaAsset,
  Robot,
  RobotSeries,
  UseCase,
} from '@/lib/content/domainTypes';

export interface ContentSnapshot {
  robots: Robot[];
  robotSeries: RobotSeries[];        // ②DEC-S08。Task 3 §D
  distributors: Distributor[];       // architecture-v2 §4-1。Task 3 §D
  manufacturers: Manufacturer[];
  useCases: UseCase[];
  deployments: DeploymentSite[];
  articles: Article[];
  articlePlacements: ArticlePlacement[];
  articleIndexPlacementLimits: Record<ArticlePlacementSlot, number>;  // lib/data/localContentSnapshot.ts に既存
  media: MediaAsset[];                // 新規。rights metadata を含む
  siteSettings: {
    dataAsOf: string;
  };
}

// 公開コンテンツ9collection + SiteSettings globalを持つ。
// robotSeries / distributors / media / articleIndexPlacementLimits は
// 既存 lib/data/contentSnapshot.ts の型には無いため、ここで拡張する
// （既存を re-export せず置き換えるのではなく、フィールドを足す形で拡張する）。

export interface ContentSource {
  listRobots(query: RobotListQuery): Promise<Robot[]>;
  findRobotById(id: string): Promise<Robot | null>;
  findRobotBySlug(slug: string): Promise<Robot | null>;
  // manufacturers / useCases / articles / deploymentsにも同じ粒度で定義
}

export interface ContentSnapshotSource {
  readSnapshot(): Promise<ContentSnapshot>;
}
```

`ContentSource` は公開runtime用、`ContentSnapshotSource` はimport / export / parity / 横断validation用とする。ページ処理から `readSnapshot()` を呼べない依存方向にする。

- [x] **Step 4: local sourceを実装する**

`localSource.ts` は現行配列をメモリ上でqueryし、同時に管理処理向け `readSnapshot()` を提供する。`lib/site.ts` の `dataAsOf` もsnapshotへ含める。移行完了後に削除できるよう、local importはこのファイルだけに限定する。

- [x] **Step 5: pure repositoryを実装する**

`createContentRepository(source)` は現行 `lib/data.ts` のpublished filter、archived detail、slug redirect、ID解決、関連解決を移す。呼び出し側は物理sourceを知らず、一覧queryにはlimit / page / filters / sortを明示する。

**公開コンテンツ9collectionに対して同じ粒度で定義する。** `robots` / `manufacturers` だけでなく
`robotSeries` / `distributors` / `useCases` / `deployments` / `articles` /
`articlePlacements` / `media` のrepositoryメソッドも同時に作る。`admins` は認証専用であり、
公開repository・snapshot・parityの対象に含めない。
`robotSeries` は `listRobotSeries` / `getRobotSeriesById` / `resolveRobotSeriesBySlug`
（`robots` と `robotSeries` を横断した slug 解決が要る。②の Task 4 が
`/robots/[slug]` を両方で描き分けるため）。

- [x] **Step 6: Payload sourceを実装する**

Payloadの各collectionへ `where`、`limit`、`page`、`sort`、`depth: 0` を明示してqueryする。Payload relationshipとdraft状態はcollection別mapperでcanonical domain型へ変換し、暗黙の型castだけで済ませない。Payloadの `_status` + `lifecycleStatus` は上記3状態のdomain `publishStatus`へ、書き込み時は逆向きに変換する。`limit: 500` の全件取得は `readSnapshot()` を使う管理処理だけに限定する。

**10コレクションの契約表を1つにまとめ、空欄を残さない。**

| コレクション | Payload collection | domain型 | repository | snapshot | parity | cache tag |
|---|---|---|---|---|---|---|
| `manufacturers` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `robots` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `robotSeries` | ✓ Task 3（②DEC-S08） | ②が定義 | **Step 5-6** | **本Stepで追加** | **Task 5で追加** | **Task 7で追加** |
| `distributors` | ✓ Task 3（架構v2 §4-1） | ②未定義。①側で最小型を用意 | **Step 5-6** | **本Stepで追加** | **Task 5で追加** | **Task 7で追加** |
| `useCases` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `deployments` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `articles` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `articlePlacements` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `media` | ✓ Task 3 | 新規（rights meta含む） | **Step 5-6** | **本Stepで追加** | **Task 5で追加** | **Task 7で追加** |
| `admins` | ✓ Task 2 | 認証専用 | 対象外（編集APIを持たない） | 対象外 | 対象外 | 対象外 |

**`admins` は10コレクション全部を編集可能というAIルールの対象に機械的に含めない。**
認証用collectionであり、`ai/rules/20-data.md` / `21-data-maintenance-workflow.md`
（Task 0.5 で更新）の対象は9コレクション（`admins` を除く）と明記する。

- [x] **Step 7: source選択を実装する**

```ts
export async function getContentRepository() {
  const sourceName = process.env.CONTENT_SOURCE;
  if (sourceName !== 'local' && sourceName !== 'payload') {
    throw new Error(`CONTENT_SOURCE must be local or payload; received ${String(sourceName)}`);
  }
  if (
    process.env.VERCEL_ENV === 'production' &&
    sourceName === 'local' &&
    process.env.ALLOW_LOCAL_CONTENT_ROLLBACK !== 'true'
  ) {
    throw new Error('local content is disabled in production outside the approved rollback window');
  }
  const source = sourceName === 'payload'
    ? createPayloadContentSource()
    : createLocalContentSource();
  return createContentRepository(source);
}
```

未設定・typoをlocalへ倒さない。local開発、CI、Previewも`CONTENT_SOURCE`を明示する。Productionでlocalを
許すのはTask 9の24時間rollback windowだけで、その間だけ`ALLOW_LOCAL_CONTENT_ROLLBACK=true`を設定し、
終了時に変数自体を削除する。export / restoreはruntime envを暗黙利用せず`--source local|payload|snapshot`
を必須にし、manifestへsource kind、environment marker、provider resource IDを記録する。

- [x] **Step 8: local / Payloadの同一contract testを通す**

Run: `npm run test -- tests/content/repository.contract.test.ts`

Expected: 同じcontract suiteをlocal sourceとPayload sourceへparameterizeして実行し、両方PASS。
特にRobotは両sourceとも削除4フィールドを持たず、`publishStatus` が同じ値になることを確認する。
未設定、未知値、Production local（rollback flag無し）がすべて起動時にFAILすることも確認する。

- [x] **Step 9: commit**

```bash
git add lib/content lib/data.ts tests/content/repository.contract.test.ts
git commit -m "refactor: introduce content repository boundary"
```

---

### Task 5: importerとparity検証を作る

**Files:**
- Create: `scripts/import-content-to-payload.mts`
- Create: `scripts/compare-content-sources.mts`
- Create: `scripts/export-content-snapshot.mts`
- Create: `scripts/verify-content-snapshot.mts`
- Create: `scripts/verify-content-conservation.mts`
- Create: `tests/fixtures/contentSnapshot.ts`
- Create: `tests/content/import-parity.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `ContentSnapshot`、Payload Local API
- Produces: 冪等upsert、JSON parity report、rollback snapshot

- [x] **Step 1: parity testを書く**

```ts
import { describe, expect, it } from 'vitest';
import { compareSnapshots } from '@/scripts/compare-content-sources';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

describe('content source parity', () => {
  it('reports no differences for equivalent snapshots', () => {
    const result = compareSnapshots(
      contentSnapshotFixture,
      structuredClone(contentSnapshotFixture),
    );
    expect(result).toEqual({ missing: [], extra: [], changed: [], brokenReferences: [] });
  });
});
```

- [x] **Step 2: compare module不足のFAILを確認する**

Run: `npm run test -- tests/content/import-parity.test.ts`

Expected: module not foundでFAIL

- [x] **Step 3: importerをstableId upsertで実装する**

collectionごとに `stableId` を検索し、存在すればupdate、なければcreateする。relationshipは参照先collectionを先にimportし、stableIdからPayload内部IDへ変換する。`site-settings` はGlobalなので `updateGlobal` を使い、stableId upsertの対象にしない。

domainの `publishStatus` は書き込みmapperでPayload `_status` + `lifecycleStatus`へ変換し、Payload schemaに
custom `publishStatus` fieldを作らない。draft recordは `_status: 'draft'` と `draft: true` を
両方指定する。export/compareの読み取りmapperは逆向きに `_status` → `publishStatus` とする。

mediaは現行レコード内の画像を `src + rights metadata` で正規化・重複排除して先に作る。ローカル画像はobject storageへuploadし、外部画像は権利確認済みのものだけ取得・保存する。取得不能または権利未確定の画像は自動公開せず、parity reportの要確認項目として残す。

Import order（公開コンテンツ9collection + SiteSettings global。依存先を先に import する）:

```text
media
manufacturers
distributors        # manufacturers を参照するため後
robot-series         # manufacturers を参照するため後
robots               # robot-series / manufacturers を参照するため後
use-cases            # robots / robot-series を参照するため後
deployments          # robots / manufacturers を参照するため後
articles             # robots / robot-series / manufacturers を参照するため後
article-placements   # articles を参照するため後
site-settings
```

**`robotSeries` は `robots` より先。** `Robot.seriesId` が `robotSeries` を参照するため、
先に import しないと relationship の解決先が無い。

- [x] **Step 4: parity比較を実装する**

比較対象:

- collectionごとの件数
- stable ID集合
- slug / previousSlugs（順序を含め完全一致。①ではURL waiverなし）
- publish status
- relationship ID集合と順序
- sources URL / checkedAt / reliability
- image rights metadata
- robot specs / evidence
- article bodyとplacement

日時、Payload内部ID、version metadataは比較対象から除外する。
各collectionの`slug`、`previousSlugs`、そこから導出した公開URLに1件でも差があれば
`changed`としてexit 1にし、Task 9へ進まない。

- [x] **Step 5: scriptを追加する**

```json
{
  "scripts": {
    "content:import": "tsx scripts/import-content-to-payload.mts",
    "content:compare": "tsx scripts/compare-content-sources.mts",
    "content:export": "tsx scripts/export-content-snapshot.mts",
    "content:restore": "tsx scripts/export-content-snapshot.mts --restore",
    "content:verify-snapshot": "tsx scripts/verify-content-snapshot.mts",
    "content:verify-conservation": "tsx scripts/verify-content-conservation.mts"
  }
}
```

コマンド責務を混ぜない。`content:compare`は①cutover前の`local TS vs Payload`専用で、local source削除後は
呼ばない。`content:export`は`--source local|payload`を必須にし、暗黙のsource選択をしない。
`content:verify-snapshot -- --manifest <path>`は署名snapshotとPayload DBの全collection完全一致、
`content:verify-conservation -- --manifest <path> --stable-id-subset`は履歴baselineのstableId部分集合と
承認済みidentity transferだけを検証する。②はこの2コマンドを使い、bare `content:compare`を使わない。

**`content:import` は現状「local TS → Payload」の一方向しか無い。** 復旧には
「export した snapshot → 空DBへ書き戻す」経路が要る。`content:restore` を
`--input <snapshot>` で受け、`content:import` と同じ upsert ロジックを再利用して
空DBへ流し込む。

`tsx` は **Task 2 Step 3 で devDependency として追加する**（Task 1 に install step は無く、
現 `package.json` にも無い。lockfile に transitive として存在するだけなので依存しない）。

```bash
npm ls tsx --depth=0
```
Expected: `devDependencies` に解決される。transitive のみなら Task 2 へ戻る。

- [x] **Step 6: 開発DBへimportして再実行する**

Run: `npm run content:import`

Expected: 全collectionがcreatedまたはupdatedとして報告され、exit 0

Run: `npm run content:import`

Expected: 重複を作らず、同じstable ID集合でexit 0

Run: `npm run content:compare`

- [x] **Step 6.5: export→restore の round-trip を確認する**

```bash
npm run content:export -- --source payload --out /tmp/rt.json
# 別の空DBを用意する
DATABASE_URL="$RESTORE_TEST_DB_URL" npm run payload:migrate
DATABASE_URL="$RESTORE_TEST_DB_URL" npm run content:restore -- --input /tmp/rt.json
DATABASE_URL="$RESTORE_TEST_DB_URL" npm run content:verify-snapshot -- --input /tmp/rt.json
```
Expected: migration適用後の空DBへrestoreでき、export元と一致する（parity差分0）。**この round-trip が
G-7（復旧手順が動く）の実証になる。**

Expected: `missing=0 extra=0 changed=0 brokenReferences=0`

- [x] **Step 7: cutover baseline snapshot を固定する**

**`content:compare` は Task 9 で local TS を撤去したあと実行できなくなる。**
「local vs payload」の比較なので、比較元が消えるため。

**Git へは commit しない。** `content-platform-and-database-architecture-v2.md` §2.1
「単一の正本」が「Gitへ同じレコードを二重保存しない」としており、全content recordを含む
snapshot を `docs/reference/` へ commit するとこれに反する。加えて `shasum` は改ざん検知の
チェックサムであって、真正性を証明する署名ではない（同じ場所でJSONとhashを両方書き換えられる）。

このTaskではexport/upload/verify機能とfixtureを実装する。**実データのbaseline取得は
Task 9 Step 2だけで実行する**（このTaskの実行時点で取った古いsnapshotをcutover baselineとして
使い回さない）。Task 9 の直前に `content:export` で snapshot を取り、**object storage（Task 0 で確定した
provider）の immutable / write-once な領域へ置く**。「immutable な領域」の中身を Task 0 の
資源表（`docs/reference/content-platform-resources-v1.md`）へ具体的に記録する。

| 項目 | 方針 |
|---|---|
| アクセス | private（署名付きURLでのみ読める。公開URLにしない） |
| 上書き・バージョニング | provider がobject versioning／immutability設定を持つ場合は有効化する。持たない場合（Task 0 default の Vercel Blob は現時点でWORM/object-lockを提供しない）、**同一キーへの再uploadを禁止し、runごとに一意なキー（日時+ハッシュ）で新規オブジェクトとして置く**運用で上書きを防ぐ |
| 削除権限 | 削除できるのは `platform-admin` のみ。日常運用（import/export/parity）の実行者アカウントには delete 権限を渡さない |
| 保持期間 | cutover完了（Task 9 Step 7 のrollback window終了）から最低90日は削除しない。90日経過後の削除は手動判断とし、自動失効ルールは設定しない |
| 復元確認 | Step 6 のexport→restore round-tripテストと同じ経路で、この artifact からの復元が動くことを Task 9 実行前に一度確認する |

Git には次の3つだけを commit する。

```bash
npm run content:export -- --upload  # object storage へ upload、URLを返す
```

```ts
// docs/reference/cutover-baseline-manifest.json の検証schema
interface CutoverBaselineManifest {
  storage: {
    provider: 'vercel-blob' | 's3';
    bucket: string;
    objectKey: string;
    versionId: string | null;
  };
  sha256: string;
  signature: {
    algorithm: 'cosign';
    keyId: string;
    detachedSignatureObjectKey: string;
  };
  recordCounts: {
    manufacturers: number;
    robots: number;
    robotSeries: number;
    distributors: number;
    useCases: number;
    deployments: number;
    articles: number;
    articlePlacements: number;
    media: number;
    siteSettings: number;
  };
  exportedAt: string;
  exportedBy: string;
}
```

cutover baselineの既知件数はmanufacturers 26 / robots 63 / robotSeries 0 / distributors 0 /
useCases 44 / deployments 11 / articles 34 / articlePlacements 7 / siteSettings 1。mediaはexportが
snapshotから数えた値をmanifestへ書き、compareがsnapshot本体の件数と一致することを検証する。

private objectの署名付きURLはmanifestへ保存しない。URLは期限切れになるため、restore時に
`storage` の永続識別子から短命URLを発行する。`content:verify-snapshot -- --manifest` は
cosignのdetached signatureをTask 0の公開鍵で検証してから、sha256、全 `recordCounts`、
ID集合、参照集合、公開状態を検証し、署名不正または1collectionでも欠落したartifactを拒否する。

**署名は必須。** checksumだけでは「取得時に改ざんされていない」ことしか示せず、artifact自体が
正規のexportであることは示さない。Task 0で確定したcosign KMS鍵で署名し、署名検証に失敗した
artifactはcompare / restoreの入力として受け付けない。

**この manifest は①cutover時点の履歴baselineであり、②の §0 G-3 が既存63 stableIdの保全を
検証する入力になる。** ②開始時の実復元対象は、② G-3で新規生成する
`pre-robot-import-manifest.json`である。古いcutover baselineを②開始時点の完全復元へ流用しない。

- [x] **Step 8: commit**

```bash
git add scripts/import-content-to-payload.mts scripts/compare-content-sources.mts scripts/export-content-snapshot.mts scripts/verify-content-snapshot.mts scripts/verify-content-conservation.mts tests/fixtures/contentSnapshot.ts tests/content/import-parity.test.ts package.json package-lock.json
git commit -m "feat: add idempotent content migration tooling"
```

---

### Task 6: ページをrepositoryへ切り替える

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/compare/page.tsx`
- Modify: `src/app/manufacturers/page.tsx`
- Modify: `src/app/manufacturers/[slug]/page.tsx`
- Modify: `src/app/robots/page.tsx`
- Modify: `src/app/robots/[slug]/page.tsx`
- Modify: `src/app/use-cases/page.tsx`
- Modify: `src/app/use-cases/[slug]/page.tsx`
- Modify: `src/app/reports/page.tsx`
- Modify: `src/app/reports/[slug]/page.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/for-manufacturers/page.tsx`
- Modify: `lib/manufacturerLogoEnrich.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `components/ManufacturersBrowser.tsx`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `lib/catalog/search.ts`（`buyerReadinessLabels[robot.buyerReadiness]` の除去。DEC-S05）
- Modify: `lib/labels.ts` / `lib/visualSemantics.ts`（`marketAvailabilityLabels` / 未使用 tone の除去）
- Modify: `scripts/build-data-r01-manifest.mjs` / `scripts/build-data-r02-manifest.mjs`
- Modify: `tests/unit/view-models/robots.test.ts`
- Modify: `components/**/*.tsx` / `lib/**/*.ts` / `tests/**/*.ts` の `@/data/types` import（canonical型へ移行）

**ページが repository（Payload由来・4フィールド無し）を読み始めるのはこの Task から。**
削除4フィールドに依存する消費側コードをここで直す。Task 3 では触らなかった
（`data/robots.ts` がまだ4フィールドを持つ local source を使うため）。
- Test: `tests/e2e/content-routes.spec.ts`

**Interfaces:**
- Consumes: `getContentRepository()`
- Produces: local/payload両sourceで同じ公開URLと主要表示

- [x] **Step 1: 主要route回帰testを書く**

```ts
import { expect, test } from '@playwright/test';

for (const route of [
  '/',
  '/robots',
  '/manufacturers',
  '/use-cases',
  '/reports',
  '/compare',
  '/robots/unitree-g1',
]) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });
}
```

- [x] **Step 2: 各Server Componentでrepositoryをawaitする**

```ts
const repository = await getContentRepository();
const robots = await repository.listAllPublishedRobots();
```

`listAllPublishedRobots()` はPayloadを`limit: 100`、`page: 1..totalPages`で走査し、全pageを結合する。
各pageの`totalDocs`が途中で変わったら最初から最大1回だけ再試行し、それでも変動する場合は
`unstable-pagination`で失敗する。重複stableIdを拒否し、取得件数が`totalDocs`と一致しない場合は
部分結果を返さない。安全上限500件を超えたら黙ってtruncateせず、server-side pagination UIへ
切り替える別Taskを要求してexit 1にする。

`tests/content/repository.contract.test.ts`へ101件・188件・page境界重複・途中totalDocs変化を追加し、
`displayed/pageable count === totalDocs`をlocal/payload両sourceで検証する。②Task 10の公開促進前にも
同じcontract testを実行する。

`lib/data.ts` のmodule-level array importを削除し、ページから `data/*.ts` を直接importしない。

同時にruntime consumerの型importを `@/data/types` から `@/lib/content/domainTypes` へ移す。
legacy型を参照してよいのは `data/*.ts`・`lib/content/localSource.ts`・`lib/data/contentSnapshot.ts`
の3箇所だけに閉じる（fix round 1で判明: `lib/data/contentSnapshot.ts` の `Robot` /
`Manufacturer` / `UseCase` field は、`lib/content/localSource.ts` のlegacy→domain変換関数
（`toDomainRobot`等）が引数型として厳密なlegacy shapeを要求すること、`lib/validation/manufacturers.ts`
がlegacy専用の `Manufacturer.logo` を読むことから、domain型に置き換えるとコンパイルが壊れる
実在の構造差分がある。詳細は `lib/data/contentSnapshot.ts` 冒頭コメント参照）。機械ゲートは
次で固定する。

```bash
rg -n "@/data/types|\.\.?/.*data/types" src components lib tests \
  -g '!lib/content/localSource.ts' -g '!lib/data/contentSnapshot.ts'
```

Expected: 0件。現状46ファイルあるため、Task 9で `data/types.ts` を削除する前に全件を解消する
（`lib/data/contentSnapshot.ts` の残存importは対象外。Task 9のcutoverでlegacy検証パイプライン
（`lib/validate.ts` 一式）ごと削除・作り替えするまで残る想定で、Task 9本文にその手順がある）。

- [x] **Step 3: Client Component propsをview modelへ縮小する**

一覧Browserへ渡す値は、ID、slug、表示名、カード情報、filter facetに必要な値へ限定する。記事本文、全sources、詳細spec、未使用relationshipを一覧client propsへ含めない。

- [x] **Step 4: local sourceで回帰確認する**

Run: `CONTENT_SOURCE=local npm run build`

Expected: exit 0、主要公開pathが生成される

Run: `CONTENT_SOURCE=local npm run test:e2e -- tests/e2e/content-routes.spec.ts`

Expected: 全route PASS

- [x] **Step 5: payload sourceで同じ回帰確認をする**

Run: `CONTENT_SOURCE=payload npm run build`

Expected: exit 0、local sourceと同じ主要公開pathが生成される

Run: `CONTENT_SOURCE=payload npm run test:e2e -- tests/e2e/content-routes.spec.ts`

Expected: 全route PASS

- [x] **Step 6: commit**

```bash
git add src/app components lib scripts tests data/types.ts
git commit -m "refactor: read public routes through the content repository"
```

---

### Task 7: cache、preview、publish revalidationを接続する

**Files:**
- Create: `lib/content/cacheTags.ts`
- Create: `src/app/api/revalidate-content/route.ts`
- Create: `src/app/api/draft-mode/enable/route.ts`
- Create: `src/app/api/draft-mode/disable/route.ts`
- Create: `lib/content/previewTokens.ts`
- Create: `lib/content/cacheDependencies.ts`
- Create: `docs/reference/content-preview-runbook-v1.md`
- Create: `migrations/*-add-preview-nonces.ts`
- Modify: `lib/content/payloadSource.ts`
- Modify: `payload.config.ts`
- Test: `tests/content/revalidation.test.ts`
- Test: `tests/content/draft-mode-security.test.ts`
- Test: `tests/content/cache-dependencies.test.ts`

**Interfaces:**
- Consumes: Payload publish hook、signed webhook
- Produces: collection単位cache tags、draft preview、publish後revalidation

- [x] **Step 1: webhook署名拒否testを書く**

```ts
import { expect, test } from 'vitest';
import { POST } from '@/src/app/api/revalidate-content/route';

test('rejects unsigned revalidation requests', async () => {
  const response = await POST(new Request('http://localhost/api/revalidate-content', {
    method: 'POST',
    body: JSON.stringify({ collection: 'robots' }),
  }));
  expect(response.status).toBe(401);
});
```

- [x] **Step 2: 署名なしrequestが拒否される実装を追加する**

`REVALIDATION_SECRET` とconstant-time比較し、collection名をallowlist検証した後だけ `revalidateTag` を呼ぶ。

- [x] **Step 3: cache tagを定義する**

```ts
export const contentTags = {
  robots: 'content:robots',
  robotSeries: 'content:robot-series',
  distributors: 'content:distributors',
  manufacturers: 'content:manufacturers',
  useCases: 'content:use-cases',
  deployments: 'content:deployments',
  articles: 'content:articles',
  articlePlacements: 'content:article-placements',
  media: 'content:media',
  settings: 'content:settings',
} as const;
```

**公開コンテンツ9collection + settings全部にタグを持たせる。** Task 4 の契約表（`robotSeries` / `distributors` /
`media` を含む）と同じ集合にする。抜けがあると、そのコレクションだけ publish 後に
古い値が残り続ける。

**`revalidateTag` は第2引数を明示する。** Next.js 16 で単一引数形式は deprecated。

```ts
revalidateTag(contentTags.robots, 'max');
```

**タグを定義するだけでは効かない。** `use cache` を付けた repository 関数の内部で、
対応する `cacheTag()` を実際に呼ぶ必要がある。

```ts
// lib/content/payloadSource.ts
export async function getRobotById(id: string) {
  'use cache';
  cacheTag(contentTags.robots);
  return payload.find({ collection: 'robots', where: { stableId: { equals: id } } });
}
```

**公開コンテンツ9collection + settingsを読むrepository関数すべてに漏れなく `cacheTag()` を入れる。**
単に「主collectionのtagを1つ」では足りない。各cached関数は実際に読む依存先をすべてtag付けする。

| cached page / view model | 読み取る全collection tag |
|---|---|
| Robot一覧・比較 | `robots`, `manufacturers`, `robotSeries`, `media` |
| Robot詳細 | `robots`, `robotSeries`, `manufacturers`, `useCases`, `media` |
| Series詳細 | `robotSeries`, `robots`, `manufacturers`, `useCases`, `media` |
| Manufacturer一覧 | `manufacturers`, `media` |
| Manufacturer詳細 | `manufacturers`, `robots`, `robotSeries`, `distributors`, `articles`, `useCases`, `media` |
| UseCase一覧 | `useCases`, `media` |
| UseCase詳細 | `useCases`, `robots`, `robotSeries`, `manufacturers`, `deployments`, `articles`, `media` |
| Report一覧 | `articles`, `articlePlacements`, `media` |
| Report詳細 | `articles`, `robots`, `robotSeries`, `manufacturers`, `useCases`, `media` |
| Home | `robots`, `manufacturers`, `useCases`, `deployments`, `articles`, `articlePlacements`, `media`, `settings` |
| sitemap / search index | `robots`, `robotSeries`, `manufacturers`, `useCases`, `articles`, `settings` |

> **実装時の注記（Task 7 fix round 1、`task-7-report.md`参照）**:
> - **`distributors` / `robotSeries` / `media`** は、この表の複数行で依存として挙がって
>   いるが、実装時点でどの cached view も実際にはこの3 collectionを読まない
>   （`distributors`: 画面に出る「取扱代理店」は `Manufacturer.domesticDistributors` という
>   別の埋め込みfield。`robotSeries`: `robot-series` を単体で解決するpageが存在しない。
>   `media`: `Media` collectionの読み取りメソッド自体をどのpage/componentも一度も呼ばない
>   ——`heroImage`/`images`/`logos`はcollection自身の埋め込みfieldで、`Media`への
>   relationshipではない）。実装では、実際に読まないcollectionへ`cacheTag()`を呼ぶ
>   見せかけの紐付けを作らない方針を徹底し、この3つは`lib/content/cacheDependencies.ts`の
>   `KNOWN_GAPS`として明示的に扱う。将来、これらのcollectionを実際に使うUIができた時点で
>   解消できる。
> - **「Series詳細」は実装時点でページ自体が存在しない**（`robot-series` は
>   `/robots/[slug]` のnamespaceを共有する設計だが、現在のroute実装は robotsのslugしか
>   解決しない）。この行はcache化の対象外。

タグ定義（Step 3）と全依存先への `cacheTag()` 呼び出し（本Step）が揃って初めて、関連recordの
publish後に埋め込み表示まで更新される。統合テストではRobot名の変更後にRobot詳細だけでなく、
そのRobotを埋め込むUseCaseとArticleも最終的に新しい名前になることを確認する。

- [x] **Step 4: Draft Mode enable routeを認証し、通常cacheから分離する**

`/api/draft-mode/enable`は次のどちらかだけを受け付ける。

1. Payloadへログイン済みで`content-draft-writer` / `content-publisher` / `platform-admin`のuser
2. `PREVIEW_TOKEN_SECRET`でHMAC署名した5分以内のtoken。payloadは`sub`、`exp`、128-bit nonce、
   allowlist済み相対redirectを持ち、nonceを`preview_nonces` tableで原子的に未使用→使用済みにする

`preview_nonces` tableはTask 3.5で確立した手順に従い、このTaskでGit管理migrationを生成する。
TTL cleanup indexも定義し、migration適用・status・drift checkが通るまでrouteを有効化しない。
redirectは相対pathかつ `/`, `/robots`, `/manufacturers`, `/use-cases`, `/reports` 配下だけを許可し、
`//host`、absolute URL、backslash、encoded traversalを拒否する。未認証、期限切れ、署名改ざん、nonce再利用、
allowlist外redirectではDraft Mode cookieを発行しない。disableはcookieを削除するだけでredirectを受け取らない。

draft modeではdraftを含め、published modeではpublished/archived policyだけを返す。draft responseを
共有cacheへ保存しない。**draft取得側も毎request user/token由来のpreview sessionを検証**し、cookieが
存在するだけではdraftを返さない。権限失効後の既存cookieは403にする。

`tests/content/draft-mode-security.test.ts`で認証済み成功、正規token成功、未認証、期限切れ、改ざん、
再利用、open redirect、権限失効、draft cache非混入を検証する。

`content-preview-runbook-v1.md`にtoken発行担当=`content-publisher`、入力（対象path・閲覧者・期限）、
出力（5分token）、nonce失効、漏えい時のsecret rotation、403時の停止条件を記載する。tokenやcookie値を
監査artifact・Git・チャットへ保存しない。

- [x] **Step 5: 更新前後の値を統合テストで確認する**

HTTP status だけでは「revalidate が呼ばれたこと」しか分からず、「表示が実際に新しい値へ
変わったこと」は確認できない。**`revalidateTag(tag, 'max')` の第2引数 `'max'` は
stale-while-revalidate profile を指定するもので、呼び出し直後の1回の読み出しで
即座に新しい値へ切り替わることを保証しない**（背後で再生成が終わるまで、その間の読み出しは
古い値を返してよい、という契約）。呼び出し直後の1回勝負で `toBe('X')` を assert するテストは
この契約と矛盾する。**ポーリングで「最終的に新しい値になる」ことを確認する。**

```ts
test('publish後に古い値ではなく新しい値が返る（stale-while-revalidateを考慮）', async () => {
  const before = await repository.getRobotById(id);
  await payload.update({ collection: 'robots', id, data: { name: 'X' } });
  await fetch('/api/revalidate-content', { method: 'POST', headers: signed, body: JSON.stringify({ collection: 'robots' }) });

  await vi.waitFor(async () => {
    const after = await repository.getRobotById(id);
    expect(after?.name).not.toBe(before?.name);
    expect(after?.name).toBe('X');
  }, { timeout: 5000, interval: 100 });
});
```

全dependencyを表駆動で検査する。Robot更新後のRobot詳細・UseCase、Manufacturer更新後の
Manufacturer詳細・Article・UseCase、UseCase更新後のUseCase詳細・Manufacturer・Article、
Report更新後のReport詳細・UseCase、UseCase更新後のHomeを最低ケースとする。

- [x] **Step 5.5: dependency tableと実装の差分を検査する**

`cacheDependencies.ts`を唯一の依存表とし、repositoryの各cached queryが宣言したtag集合と、
publish hookがcollection更新時に無効化するview/tag集合を同じ表から導出する。
`tests/content/cache-dependencies.test.ts`は全cached queryが表に1回だけ登録され、source code中の
`cacheTag()`実測集合と表が一致し、全9collection + settingsに少なくとも1 consumerがあることをassertする。

- [x] **Step 6: testとbuildを実行する**

Run: `npm run test -- tests/content/revalidation.test.ts tests/content/draft-mode-security.test.ts tests/content/cache-dependencies.test.ts`

Expected: revalidation、全依存ページ更新、Draft Modeの認証・期限・改ざん・nonce再利用・redirect・
取得権限、dependency table差分0がすべてPASS

Run: `npm run build`

Expected: exit 0

- [x] **Step 7: commit**

```bash
git add lib/content/cacheTags.ts lib/content/cacheDependencies.ts lib/content/previewTokens.ts src/app/api payload.config.ts lib/content/payloadSource.ts migrations tests/content/revalidation.test.ts tests/content/draft-mode-security.test.ts tests/content/cache-dependencies.test.ts docs/reference/content-preview-runbook-v1.md
git commit -m "feat: add content preview and cache revalidation"
```

---

### Task 8: Codex MCPと編集権限を導入する

**この Task は Task 3.5（Postgres migration基盤）の後に置く。** MCP plugin 自身が
API key 用の collection をスキーマに追加するため、その migration が Task 3.5 の
`migrate:create` サイクルに乗る必要がある。Task 3.5 より前に導入すると、MCP plugin
導入時点のスキーマ変更が drift 検出の対象外になってしまう。

**Files:**
- Modify: `package.json`（`@payloadcms/plugin-mcp` を追加）
- Modify: `package-lock.json`
- Modify: `payload.config.ts`
- Create: `migrations/*-add-payload-mcp-api-keys.ts`
- Create: `lib/payload/mcp.ts`
- Create: `.codex/content-workflow.md`
- Modify: `ai/rules/20-data.md`
- Modify: `ai/rules/21-data-maintenance-workflow.md`
- Modify: `.env.example`
- Test: `tests/content/mcp-access.test.ts`
- Test: `tests/content/admin-access.test.ts`
- Test: `tests/integration/mcp-endpoint.test.ts`

- [x] **Step 0: パッケージを導入する**

```bash
npm install @payloadcms/plugin-mcp
```

`payload.config.ts` の `plugins` へ追加し、通常MCP API keyを`content-draft-writer` userへ結び付ける。
MCP経由もTask 3のcollection access / beforeChangeを迂回せず、published create/update、unpublish、
deleteを拒否する。管理用keyは通常profileと別発行・別保管にし、統合試験以外で使わない。導入後は
次を実行し、plugin が追加したAPI key collectionのmigrationを生成・適用する。

```bash
npm run payload:migrate:create -- add-payload-mcp-api-keys
npm run payload:migrate
npm run payload:migrate:status
```

Expected: migration fileが1本生成され、適用済みになる。続けてTask 3.5のdrift checkを実行し、
追加migrationが生成されないことを確認する。

**Interfaces:**
- Consumes: Payload MCP plugin、`content-draft-writer`
- Produces: schema-aware read/create/update-draft tools、publish/delete拒否

**Payload MCP に独立した publish capability は無い。** 標準は find / create / update / delete で、
`update: true` のまま `_status: 'published'` を書ければ公開できてしまう
（`https://payloadcms.com/docs/plugins/mcp`）。**resolver に `publish: false` を期待する設計は
権限制御になっていない。**

collection の access / hook で **draft → published の遷移そのものを拒否する**。

- [x] **Step 1: MCP権限testを書く**

`resolveMcpCapabilities()` のような自前 resolver を作って `publish: false` を assert する
テストは**権限制御の証明にならない**。Payload MCP に独立した publish capability は無く、
標準は find / create / update / delete で、`update: true` のまま
`_status: 'published'` を書ければ実際には公開できてしまう
（`https://payloadcms.com/docs/plugins/mcp`）。**collection の `access.update` フックで
`_status` の書き換えそのものを拒否し、それを実際の Payload Local API へ投げて確認する。**

```ts
import { describe, expect, it, beforeAll } from 'vitest';
import { getPayload } from 'payload';
import config from '@payload-config';

describe('content-draft-writer の実権限（Local API 経由）', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>;
  let unitreeId: string;
  const asDraftWriter = { user: { id: 'test-draft-writer', role: 'content-draft-writer' } };
  const asPublisher = { user: { id: 'test-publisher', role: 'content-publisher' } };

  beforeAll(async () => {
    payload = await getPayload({ config });
    // manufacturerId は Payload relationship なので、stableId 'unitree' から
    // Payload 内部IDへ解決してから使う（domain の 'unitree' を relationship 値に直接渡せない）。
    const [unitree] = (await payload.find({
      collection: 'manufacturers', where: { stableId: { equals: 'unitree' } }, limit: 1,
    })).docs;
    unitreeId = unitree.id;
  });

  it('draft の作成に成功する', async () => {
    const doc = await payload.create({
      collection: 'robots',
      data: {
        stableId: 'test-mcp-draft-robot',
        slug: 'test-mcp-draft-robot',
        name: 'Test',
        manufacturerId: unitreeId,
        _status: 'draft',
      },
      draft: true,
      overrideAccess: false,
      user: asDraftWriter.user,
    });
    expect(doc._status).toBe('draft');
  });

  it('draft の更新に成功する', async () => {
    const [doc] = (await payload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-draft-robot' } }, limit: 1 })).docs;
    const updated = await payload.update({
      collection: 'robots', id: doc.id, data: { name: 'Test 2' },
      draft: true, overrideAccess: false, user: asDraftWriter.user,
    });
    expect(updated.name).toBe('Test 2');
  });

  it('_status: published への更新を拒否する', async () => {
    const [doc] = (await payload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-draft-robot' } }, limit: 1 })).docs;
    await expect(
      payload.update({
        collection: 'robots', id: doc.id, data: { _status: 'published' },
        overrideAccess: false, user: asDraftWriter.user,
      }),
    ).rejects.toThrow(/Forbidden|Unauthorized/);
  });

  it('delete を拒否する', async () => {
    const [doc] = (await payload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-draft-robot' } }, limit: 1 })).docs;
    await expect(
      payload.delete({ collection: 'robots', id: doc.id, overrideAccess: false, user: asDraftWriter.user }),
    ).rejects.toThrow(/Forbidden|Unauthorized/);
  });

  it('admins collection へアクセスできない', async () => {
    await expect(
      payload.find({ collection: 'admins', overrideAccess: false, user: asDraftWriter.user }),
    ).rejects.toThrow(/Forbidden|Unauthorized/);
  });

  it('content-publisher は同じ draft を published へ昇格できる', async () => {
    const [doc] = (await payload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-draft-robot' } }, limit: 1 })).docs;
    const approved = await findLatestDraftVersion(payload, 'robots', doc.id);
    const published = await publishApprovedVersion({
      payload,
      collection: 'robots',
      stableId: 'test-mcp-draft-robot',
      approvedVersionId: approved.id,
      approvalManifestHash: hashApproval(approved),
      user: asPublisher.user,
    });
    expect(published._status).toBe('published');
    expect(published.name).toBe('Test 2');
  });
});
```

**`overrideAccess: false` が要。** 省略すると Local API はデフォルトで access 制御をスキップし、
テストが「常に成功する」誤検知になる。**`draft: true` も要。** Payload Drafts は
`data._status: 'draft'` だけでなく呼び出しオプション `draft: true` の両方が揃って初めて
draft として保存される（`https://payloadcms.com/docs/versions/drafts`）。

上の例だけで終えず、Task 3の権限表をtable-driven testにする。`content-reader`、
`content-draft-writer`、`content-publisher`、`platform-admin`、通常MCP API keyについて
create draft / update draft / publish / unpublish / deleteをすべて実APIへ投げ、表と一致させる。
draft writerとMCPはcreate時`_status: published`とupdate時`_status: published`の両方を拒否し、
collection accessと`beforeChange`のどちらかを外したmutation testでも片方が拒否を維持する。
承認後に別draftを追加してから古いversion IDを公開するcaseは`approved-version-stale`で拒否し、
`_status`だけのupdateではdraft本文がmain documentへ昇格した証明にならないため禁止する。

AdminsもTask 2のbootstrap/RBAC suiteを実DBへ再実行する。未認証・通常MCP・reader・draft writer・
publisherはadminsのfind/create/update/deleteをすべて拒否する。`platform-admin`だけが2人目のadmin作成、
非特権roleへの更新、通常admin削除を行え、自己role昇格、他人の`platform-admin`付与、最後の
`platform-admin`削除/降格、adminsが既に存在する状態でのfirst-user bootstrap再実行を拒否する。

Local API testだけでは実MCP経路のcredential bindingを証明できないため、
`tests/integration/mcp-endpoint.test.ts`でMCP serverをtest DBに対して起動し、実transportで
find/create/update/publish相当/unpublish相当/delete/admins findを呼ぶ。通常MCP API keyが
`content-draft-writer`へ結び付き、Task 3の権限表どおりになることを自動検証する。

- [x] **Step 2: 権限をcollection access/hookへ実装する**

`collections/Robots.ts`（他9コレクション共通）の `access.update` で、`_status` を
`published` へ変更するリクエストを `content-draft-writer` ロールから拒否する。
`access.delete` も同ロールを拒否する。`admins` collection への `access.read` も拒否する。

MCP plugin は公開collectionだけをexposeし、`admins`、API key、schema管理を通常profileから除外する。Mediaのbinary uploadは別toolとして明示的に許可したときだけ有効にする。

- [x] **Step 3: Codex workflowを文書化する**

`.codex/content-workflow.md` に次の順序を固定する。

```text
schema取得
→ 対象と参照先を検索
→ draft作成/更新
→ domain validation
→ diff要約
→ 人間のAdmin review
→ content-publisherが公開
```

- [x] **Step 4: MCP access testを実行する**

Run: `npm run test -- tests/content/mcp-access.test.ts`

Expected: 正式4 role + MCPの権限表がすべてPASS（draft作成・draft更新・publish・unpublish・delete・
admins拒否を含む）。
**実際の Payload Local API に対して実行され、fake resolver のモックではないこと。**

- [x] **Step 5: 実MCP endpointのread/write制約を自動・手動で確認する**

```bash
npm run test:integration -- tests/integration/mcp-endpoint.test.ts
```

Expected: reader/draft writer/publisher/admin/MCPの操作表と同じ結果。MCP keyからpublished create/update、
unpublish、delete、admins find/create/update/deleteが拒否される。platform-admin用の隔離test credentialでは
承認済みadmin操作だけ成功し、role escalationと最後のadmin保護が機能する。

Run: `codex mcp list`

Expected: Payload MCP serverがenabledとして表示される

同じ `content-draft-writer` credentialで実MCP toolを順に呼ぶ。

1. published robotをfindし、DB件数と一致する
2. `test-mcp-endpoint-draft` をdraft createできる
3. 同recordをdraft updateできる
4. `_status: published` へのupdateが拒否される
5. deleteが拒否される
6. adminsのfind/create/update/deleteが拒否される
7. 隔離した`platform-admin` credentialでテストadminの作成→非特権role更新→削除が成功する
8. 自己昇格、platform-admin付与、最後のplatform-admin削除/降格が拒否される
9. `platform-admin` credentialでテストrecordとテストadminを削除し、cleanup後に0件である

各callのtool名、入力、成功/拒否結果、cleanup結果を
`docs/reference/payload-mcp-integration-check-<日付>.md` へ記録する。Local APIテストだけで
このStepを代替しない。

- [x] **Step 6: commit**

```bash
git add package.json package-lock.json payload.config.ts migrations lib/payload/mcp.ts .codex/content-workflow.md ai/rules/20-data.md ai/rules/21-data-maintenance-workflow.md .env.example tests/content/mcp-access.test.ts tests/content/admin-access.test.ts tests/integration/mcp-endpoint.test.ts docs/reference/payload-mcp-integration-check-*.md
git commit -m "feat: add least-privilege Codex content access"
```

---

### Task 9: 本番cutoverと旧TS撤去

> **2026-08-27 現在地（実行状況の正本）**: Task 9の実装前提となる安全ゲートはPR #39でmainへ反映済み。
> `verify`、`content-e2e`、main CI、main Content platform E2E、Vercel deploymentはいずれも成功している。
> Production cutoverと旧TS撤去については、`docs/reference/task9-production-cutover-preflight-v1.md`に
> 2026-08-25の実施記録があるが、このセッションではProduction DB/Blobの再確認をしていないため、本文の
> Step 1〜9を「このブランチでこれから再実行する」状態とは扱わない。まず同preflightの実施記録と
> Production read-only identityを突合し、実施済みStepと未実施Stepを確定する。Productionへの
> migration/import/export、Vercel環境変数変更、旧TS削除の再実行は禁止する。
> 2026-08-27〜28のread-only確認では、Production deployment `dpl_3qtYG4RtsomzDhxJmaQiNyiWEzCn` がReadyで、
> `deploid.net` / `deploid-to-b.vercel.app`のaliasを持つ。Supabase SQL EditorでProduction DBを確認し、
> `_environment_marker.environment=production`、必要なpublic tables、migration履歴、主要件数（manufacturers 26 /
> robots 63 / useCases 44 / deployments 11 / articles 34 / articlePlacements 7 / media 51）、および
> `_audit_upload_sessions` 2件（いずれも`production`・`completed`・allowed objects 53）を確認した。
> `last_restored_baseline_*`はnullだが、Production audit sessionの`baseline_run_id`と、2026-08-25の実施記録に
> restore/export世代およびcompletion markerの確認が残っている。今回のread-only再確認では、Vercel Blob storeの
> media 51 files / audit 106 files、Production URL主要route HTTP 200、Cron endpointの未認証401を確認した。
> Production cutover・旧TS撤去・audit backup・cleanup scheduler登録は完了した。completion markerは2026-08-25の
> Production実施記録で確認済みであり、今回のruntime OIDC経由の再取得は保守確認として扱う。全UI E2E 94本中の
> 32 failureは、既存のfixture/visual baseline差（cache・draft 2、日本語/英語6、最小fixture10、画像baseline14）で、
> Task 9のrequired gateではない。Task 9のrequired checks（verify/content-e2e）とProduction deploymentは成功しているため、
> **Task 9本番cutoverは完了**と判定する。UI 32件の再整理とmarker再取得は、完了後のnon-blocking保守課題として記録する。

**Task 9着手前の外部監査で見つかった、対応済み事項（Remediation Group 1〜5）**: fail-closed
publish gate/RBAC/route registry/version保持、SiteSettings本移行/snapshot一貫性/signed restore
強制、Blob・OIDC/import・parity/media復元/identity transfer、import/restore全経路のDB書き込み
安全ガード統一（2026-08-20の`deploid_dev`誤削除インシデント再発防止）、revalidation失敗の
可観測性向上とintegration/e2e testのnon-blocking CI組み込み。詳細は
`.superpowers/sdd/content-platform-migration-plan-v1/progress.md`（git管理外の作業ログ）。

**Task 9着手前の判断（2026-08-21、ユーザー確認済み）**:
- **source linkの403/410エラー修正は本Taskのscopeに含めない。** 外部監査でBMW公式・JAL公式
  （403）・MEXC（410）・GlobeNewswire・GMO Air・METI（403）等、複数の実リンク失敗が見つかった。
  `npm run check:source-links`はこれらを検出するが、**`npm run check`の構成scriptには含まれて
  いない**（`package.json`の`check` scriptを参照。Step 8の`npm run check`ではこの問題は
  ブロッカーにならない）。CMS移行のエンジニアリング作業とは性質が異なるコンテンツメンテナンス
  作業のため、別途後回しにする。403がbot拒否によるものかリンク自体の不備かの分類、410・恒久
  失敗URLの差し替えは、別taskとして起票すること。
- **version audit archive（KMS署名付きprivate blob store）は本Taskで構築しない。** 現状は
  archive先が無いためfail-closedでversion pruningが一切行われず、無期限にversionが増え続ける
  （データ消失リスクは無い）。Task 9の受け入れ条件は「Version pruning is disabled because the
  private audit archive is not yet configured. No version is automatically deleted.」を明記する
  形とする。archive構築（容量監視・保持期間・KMS鍵管理・private blob store・復元テスト設計）は
  将来の別remediation taskとして扱う。
- **Payload CMS 3.87.1自体の既知バグ**（`draft: true`で二重にネストしたgroup field
  （`heroImage.rights`等）を更新すると、`update()`の戻り値には新値が入るが実際のDBには永続化
  されない）が実機で見つかっている。詳細・回避策は
  `docs/reference/database-migration-runbook-v1.md`§8参照。恒久修正（patch-package化等）は
  影響範囲の精査が必要なため本Taskに含めず、別remediationとして切り出す。

**Files:**
- Delete after parity: `data/robots.ts`
- Delete after parity: `data/manufacturers.ts`
- Delete after parity: `data/useCases.ts`
- Delete after parity: `data/deployments.ts`
- Delete after parity: `data/articles.ts`
- Delete after parity: `data/articlePlacements.ts`
- Delete after parity: `data/types.ts`（Task 6のcanonical型移行gateが0件になった場合だけ削除。
  Task 6 fix round 1時点で唯一の残存依存は `lib/data/contentSnapshot.ts` — `Robot` /
  `Manufacturer` / `UseCase` について、legacy側の必須field（`buyerReadiness`）・legacy専用field
  （`Manufacturer.logo`、`lib/validation/manufacturers.ts` が読む）・legacyの方が厳格な必須制約
  （`UseCaseCandidateRobot.robotId`）が、`lib/content/localSource.ts` のlegacy→domain変換関数
  （`toDomainRobot`等）の引数型として実際に必要なため、意図的にlegacy型を保持している。
  `data/*.ts` を削除する前に、このfileと、それが支える legacy検証パイプライン一式
  （`lib/validate.ts` / `lib/data/localContentSnapshot.ts` / `lib/validation/*.ts` /
  `scripts/validate-data.mjs` 経由の dev起動時チェック・`npm run validate:data`）を
  どう扱うか（削除するか、Payload由来のsnapshotを検証する形へ作り替えるか）を
  このTaskで決めること。下記Step 7のgateコマンドは exclusion 無しのままでよい
  （`lib/data/contentSnapshot.ts` が実際に1件ヒットして止まるのが正しい挙動）。
- Delete after parity（legacy検証パイプライン。上記と同時に判断する）:
  `lib/data/contentSnapshot.ts`, `lib/data/localContentSnapshot.ts`, `lib/validate.ts`,
  `lib/validation/*.ts`
- Delete after cutover: `lib/content/localSource.ts`
- Modify: `lib/content/getContentRepository.ts`
- Modify: `scripts/validate-data.mjs`（legacy検証パイプラインを削除する場合は、この行自体を
  「Delete」に読み替え、`package.json` の `build` / `validate:data` scriptからも呼び出しを外す）
- Modify: `README.md`
- Modify: `docs/decisions/data/README.md`
- Modify: `docs/decisions/data-maintenance-checklist-v1.md`
- Modify: `docs/README.md`
- Modify: `.gitignore`
- Create: `docs/reference/content-restore-runbook-v1.md`

**Interfaces:**
- Consumes: parity 0差分、Payload production DB、export snapshot
- Produces: Payload-only content runtime

- [x] **Step 1: 変更凍結とrollback windowを宣言する**

本番import開始から24時間はコンテンツ更新を凍結する。cutover後24時間はlocal sourceを残し、障害時に環境変数だけで戻せるrollback windowとする。この間にPostgresだけで新規公開を行わない。

- [x] **Step 2: cutover直前exportを保存する**

Run: `npm run content:export -- --source local --upload`

Expected: 日時付きJSON artifactがprivate object storageへ保存され、永続的な
provider / bucket / objectKey / versionId、全recordCounts、sha256を持つmanifestが生成される。
保存先は**Production private audit/backup store**だけとし、Production media、Previewの2 storeへは
書き込まない。Preview credentialで同artifactのread/restore/deleteが403になることも記録する。

署名付きURLはmanifestへ保存しない。manifestから短命URLを発行してartifactを取得し、sha256を
検証する。続けて別の空DBへmigrationを適用してrestore→compareを実行し、このcutover直前artifact
そのものから復元できることを確認する。Task 5で使ったfixtureや古いsnapshotで代替しない。

このartifactは`cutover-baseline-manifest.json`として①時点の63 Robotを証明する履歴baselineである。
②開始時には現在DBから別世代の`pre-robot-import-manifest.json`を生成・復元試験するため、
この古いbaselineを②の直接の復元対象として使わない。

- [x] **Step 3: production importとparityを実行する**

Run: `npm run content:import`

Expected: import exit 0

Run: `npm run content:compare -- --source local --target payload`

Expected: `missing=0 extra=0 changed=0 brokenReferences=0`

- [x] **Step 4: Vercel PreviewでPayload sourceを有効にする**

Set: `CONTENT_SOURCE=payload`

Run: `npm run check`

Expected: 全品質ゲートexit 0

Run: `npm run test:e2e -- tests/e2e/content-routes.spec.ts`

Expected: 全route PASS

- [x] **Step 5: 主要画面を目視確認する**

対象:

- `/`
- `/robots`
- `/robots/unitree-g1`
- `/manufacturers`
- `/use-cases`
- `/reports`
- `/compare`
- `/admin`

desktop 1440pxとmobile 390pxで、公開内容、画像、関連リンク、slug redirect、横幅を確認する。

- [x] **Step 6: productionをPayload sourceへ切り替える**

Vercel production環境へ `CONTENT_SOURCE=payload` を設定してdeployする。公開後に主要route、sitemap、robots、OG imageを確認する。

- [x] **Step 7: rollback window終了後にlocal sourceを削除する**

24時間の安定化、監視、主要route確認が完了してから、旧TS配列、local adapter、local/payload切替分岐を削除する。`CONTENT_SOURCE` は廃止し、Payload sourceを唯一の実装にする。

削除前に次を実行する。

```bash
rg -n "@/data/types|\.\.?/.*data/types" src components lib scripts tests
```

Expected: 0件。Task 6 fix round 1時点では `lib/data/contentSnapshot.ts` が1件ヒットする
（意図的・上記Filesの注記を参照）。これはTask 6の未修正ではなく、legacy検証パイプライン
（`lib/validate.ts` / `lib/data/localContentSnapshot.ts` / `lib/validation/*.ts` /
`scripts/validate-data.mjs`）を本Taskで削除するかPayload snapshot検証へ作り替えるまで
解消しない残存依存。それ以外の箇所で1件でも出る場合は、新たな回帰としてTask 6へ戻って調査する。

- [x] **Step 8: 最終検証を実行する**

Run: `npm run check`

Expected: exit 0

Run: `npm audit --omit=dev`

Expected: critical 0。残存highは個別にissue化し、根拠なく無視しない

Run: `git diff --check`

Expected: outputなし、exit 0

- [x] **Step 9: commit**

```bash
git add -A
git commit -m "refactor: make Payload the content source of truth"
```

---

## Rollback

> **2026-08-28 追記（実装後の現在地）**: 下記の「24時間rollback window」は**もう存在しない**。
> Task 9 Step 7 で local source と `CONTENT_SOURCE` 分岐を撤去した結果、
> `lib/content/getContentRepository.ts` は `CONTENT_SOURCE !== 'payload'` で必ずthrowする。
> `ALLOW_LOCAL_CONTENT_ROLLBACK` はコード上どこからも読まれていない。
> **したがって現行の唯一のrollback手段は、下段の「署名済みbaselineから新しいDBへrestoreする」経路である。**
> 手順の正本は `docs/reference/content-restore-runbook-v1.md`。

~~cutover後に公開障害が起きた場合は、コードを巻き戻さず、24時間のrollback window内だけVercel環境変数を
`CONTENT_SOURCE=local`、`ALLOW_LOCAL_CONTENT_ROLLBACK=true`にしてredeployする。この期間は公開コンテンツを
凍結するため、local / Postgres間に新しいpublished差分を作らない。Postgresのdraftは保持するが、local TSへ
逆同期しない。rollback window終了時に`ALLOW_LOCAL_CONTENT_ROLLBACK`をProductionから削除する。~~
（↑ 撤去済み経路。歴史的経緯として残す）

旧TS削除後のrollbackは、cutover直前exportを新しいPostgres環境へimportし、同じmigration versionのアプリをdeployする。SQL手修正で復旧しない。
実行role=`platform-admin`、Production private storeからの署名検証、空DB migration、restore、parity、
DNS/deploy切替、停止条件は **[`docs/reference/content-restore-runbook-v1.md`](../reference/content-restore-runbook-v1.md)**
に記載済み（2026-08-28作成）。署名・hash・environment marker・provider resource IDのどれかが
一致しなければrestoreを開始しない。

---

## Completion Criteria

- Payload Adminから全collectionを編集できる
- Codex MCPがschemaを読み、draftを作成・更新できる
- Codex通常権限でdelete/publish/schema/adminが拒否される
- first-user bootstrap、admin role escalation拒否、最後のplatform-admin保護が実APIとMCP統合testで通る
- 公開は承認済み最新version ID/hashの完全なdocumentだけを昇格し、status-only publishを拒否する
- Postgresがコンテンツ唯一の正本である
- Gitにcontent recordの二重正本がない
- 全stable ID、slug、previousSlugs、公開URL、relationship、公開状態が①の移行前後で一致する
- `npm run check` がexit 0
- 主要routeのdesktop/mobile E2Eが通る
- publish後のcache revalidationが動作する
- export/importによる復旧手順を実行できる
