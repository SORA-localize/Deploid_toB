---
status: reference
updated: 2026-08-21
---

# Postgres migration runbook v1

Task 3.5（`.superpowers/sdd/content-platform-migration-plan-v1/task-3.5-brief.md`）が確立した、
Payload CMS + Postgres の migration 生成・適用・検証・rollback 手順の正本。schema変更は必ず
`migrations/*.ts`（Gitでreview可能）を経由する。Payloadのdev-mode auto-push（`pushDevSchema`）を
Production/Previewへ向けて使わない。

対象バージョン: `payload@3.87.1` / `@payloadcms/db-postgres@3.87.1`（`package-lock.json`で固定）。
以下のCLI挙動の記述は、このバージョンで実機確認したものだけを書く。

---

## 1. 日常のコマンド

`package.json` scripts:

| script | 中身 | 用途 |
|---|---|---|
| `npm run payload:migrate` | `tsx scripts/run-payload-migration-cli.mts -- migrate` | 未適用のmigrationをすべて適用する |
| `npm run payload:migrate:create -- <name>` | `tsx scripts/run-payload-migration-cli.mts -- migrate:create <name>` | 現在のcollections/globalsの定義と、`migrations/`内の最新snapshotとの差分からmigrationを生成する |
| `npm run payload:migrate:down` | `tsx scripts/run-payload-migration-cli.mts -- migrate:down` | 直近のbatch（複数ファイルなら複数）を一括で巻き戻す |
| `npm run payload:migrate:status` | `tsx scripts/run-payload-migration-cli.mts -- migrate:status` | 生成済みmigrationファイルそれぞれの適用状態（Yes/No）を表示する |
| `npm run environment:stamp -- --expected <preview\|production>` | `tsx scripts/stamp-environment.mts` | `_environment_marker`へ環境markerを冪等に書き込む |

**2026-08-21 (remediation group 6) 追記**: 上記4つの`payload:migrate*`は、以前は`payload`
CLI（`node_modules/.bin/payload`、実体は`payload/bin.js`）の薄いラッパーだった。
`payload/bin.js`は`payload.config.ts`のtranspileにtsxの非同期worker-thread loaderを使うが、
Node 22.12.0上ではこれが「短時間に子processを連続起動する」負荷下（CIの共有runnerや
連続deploy）でNodeの event-loop-idle判定と競合し、`Warning: Detected unsettled top-level
await`（exit code 13）で失敗することがある——実際にこのrepoのGitHub Actions上で複数回
再現した実バグ（詳細は`.superpowers/sdd/content-platform-migration-plan-v1/
remediation-group6-report.md`）。`patches/payload+3.87.1.patch`でこの競合自体への
upstream側の対処（silent false-successの防止）は入れたが、競合の発生自体は止まらないため、
4つの`payload:migrate*`は`scripts/run-payload-migration-cli.mts`
（`payload`の公開API `payload.db.migrate()`等を直接呼ぶ、同じmigration機構への薄い
ラッパーだが、tsx loaderの起動をprocess起動の最初に前倒しで一度だけ行う`tsx <script>`
経路を使う）経由に切り替えた。コマンド名・挙動はユーザーから見て変化しない。

**`migrationDir` は repo-root の `migrations/`固定。** `payload.config.ts`で明示的に
`migrationDir: path.resolve(dirname, 'migrations')`を指定している。Payloadの既定解決
（`findMigrationDir`）は`src/`ディレクトリが存在すると`src/migrations`を優先してしまう
（このrepoには`src/app/(payload)`があるため該当する）ため、明示指定が必須。

`tests/content/migration.test.ts`実行時だけ、`PAYLOAD_TEST_MIGRATION_DIR`環境変数で
一時ディレクトリへ差し替えられる（本番では絶対に設定しない）。

---

## 2. Production / Preview への適用手順（deploy pipeline）

**migrationはbuildより前に適用し、失敗したらdeployを止める（fail-closed）。**
migrationはschema変更であり、新しいアプリコードがそのschemaを前提にする前に適用されている
必要がある。deploy pipelineのstep順序:

```bash
# 1. 依存関係をインストール
npm ci

# 2. migrationを適用する。DATABASE_URLは対象環境のDirect connection
#    （docs/reference/content-platform-resources-v1.md #1 の「migration実行」用、pooler不可）。
#    非ゼロ終了したらここでpipelineを止める。
npm run payload:migrate

# 3. 環境markerをstampする。preview環境なら --expected preview、production環境なら
#    --expected production。DEPLOYMENT_ENVはpipeline側で環境ごとに設定する
#    （--expectedと一致しなければ何も書かず exit 1 する、Step 3参照）。
npm run environment:stamp -- --expected "$DEPLOYMENT_ENV"

# 4. ここまで成功して初めてbuildする
npm run build
```

`payload migrate`が失敗する（=いずれかのmigrationの`up()`が例外を投げる）と、Payloadはその
例外をrethrowするだけでcatchしない。Node のtop-levelで拾われ、processは非ゼロ終了する
（`node_modules/payload/dist/database/migrations/migrate.js`で確認済み）。deploy pipelineの
step 2が失敗扱いになり、後続のstepへ進まない設計であることを前提にする。

---

## 3. `environment:stamp` の設計

`_environment_marker`は「このDBはpreviewかproductionのどちらか」を1行だけ持つmarker table
（`collections/EnvironmentMarker.ts`、`dbName: '_environment_marker'`）。手動SQLでは作らず、
`migrations/`に含まれるDDLとして作られる（brief必須要件）。

- `environment`列: `preview` / `production`のどちらか。
- `singleton`列: 常に`1`。**`unique: true`でDB制約として最大1行に固定する。** app側の
  check-then-insertだけに頼らない（同時に2つのdeployが誤って走るような race でも、2行目の
  insertはunique制約違反で確実に失敗する）。

`scripts/stamp-environment.mts`の動作:

1. `DEPLOYMENT_ENV`（env var）と`--expected`（CLI引数）が一致しなければ、DBへ一切触れず
   exit 1する（deploy pipelineの設定ミスガード）。
2. 一致していれば、既存行を読む。
   - 0行 → `{environment: expected, singleton: 1}`を作成し、exit 0。
   - 1行あり、値が`expected`と同じ → 何もしない（冪等）、exit 0。
   - 1行あり、値が`expected`と違う → **変更せず** exit 1（反対環境の行を上書きしない — 誤って
     間違ったDBへ向けてdeployしたことを検知するためのguard）。
   - 2行以上 → data corruptionとして exit 1（unique制約が壊れていない限り起きないはずの状態）。

**既知の落とし穴（実機で踏んだ）**: `getPayload()`は`NODE_ENV !== 'production'`かつ
`PAYLOAD_MIGRATING !== 'true'`かつ`push !== false`のとき、dev-mode schema auto-push
（`pushDevSchema`、drizzle-kitの`pushSchema`）を毎回実行する。deploy pipelineのようにTTYが
無い環境でこれが走ると、差分検出時のwarningプロンプト（`prompts`ライブラリ）が応答を待ち続けて
ハングする。`scripts/stamp-environment.mts`は`getPayload()`を呼ぶ前に明示的に
`process.env.PAYLOAD_MIGRATING = 'true'`を設定し、これを回避している（`payload migrate`自身が
CLI内部で行っているのと同じ回避）。**Payload Local APIを直接呼ぶ新しいdeploy-time scriptを
今後追加する場合、このパターンを必ず踏襲する。**

もう一つの落とし穴: `payload.destroy()`を呼んだだけではNode processが自然終了しない
（pg poolのsocketが残る）。`payload`自身のCLIラッパー（`node_modules/payload/dist/bin/index.js`）
は`payload.destroy()`の直後に明示`process.exit(0)`する。`stamp-environment.mts`も同じパターンを
踏襲している。省略すると、deploy pipelineのstepが正常終了後も無期限にハングする。

---

## 4. Rollback（down migration）

```bash
npm run payload:migrate:down
```

直近のbatch（同時に生成・適用されたmigration群）を巻き戻す。**batch単位**であり、個別ファイル
単位ではない。

### 巻き戻し前のbackup / restore（テーブル単位）

**contentが入っているDBを巻き戻す前に、必ずデータを退避する。** Payload側のcontent export
（`content:export --source payload --upload`、署名済みmanifest付き）は**Task 5で実装済み**
（下の §4.1「content level のexport / restore」を正本とする）。本節の`pg_dump` / `psql`による
テーブル単位の退避は、**schema世代を跨ぐ巻き戻しのためのDB物理退避**として引き続き有効な手順。

> content level のexport（§4.1）は**同一schema世代・同一DBへ戻す**ことを前提に設計されている
> （restoreは`schemaVersion`と`databaseResourceId`の一致を要求する）。したがって
> **`migrate:down`を挟む作業では本節の物理退避が正しい手段**であり、§4.1はその代替ではない。
> 用途が別なので、どちらか一方だけを行えばよいという関係にはならない。

以下は実機確認済みの手順。

前提: サーバのmajor versionに合わせたclientを使う（確認環境: PostgreSQL 15.14）。接続先は
migration用のDirect connection（poolerではない。`docs/reference/content-platform-resources-v1.md` #1）。

```bash
# 1. 退避（データのみ。schemaはmigrationが正本なのでdumpしない）
#    versions table（_<collection>_v）も必ず一緒に取る。Payloadのdraft/version行がそこにある。
pg_dump "$DATABASE_URL" --data-only \
  --table=deployments --table=_deployments_v > /tmp/deployments-backup.sql

# 2. 巻き戻し・再適用（必要な作業）
psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -c 'DELETE FROM _deployments_v;' -c 'DELETE FROM deployments;'
npm run payload:migrate:down
npm run payload:migrate

# 3. 復元（復元先のtableは空であること。COPYは既存行と衝突しうる）
psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f /tmp/deployments-backup.sql
```

`--data-only`のdumpには各sequenceの現在値が`setval`として含まれるため、復元後にidを明示しない
INSERTを行ってもPK衝突しない（実機確認: id 1・2を復元した直後のINSERTがid 3を採番）。

他のcollectionを退避する場合も同じ形で、`--table=<collection>`と`--table=_<collection>_v`を
対にして指定する。DB全体を取るなら`--table`を外す。

**実機確認（Task 4、隔離DB `deploid_task4_down_test`）**: `status`が`pilot`/`production`の
deployment行 + version行 → 上記1で退避 → 2でDELETE・`migrate:down`・`migrate` → 3で復元 →
`pilot`/`production`がそのまま戻り、後続INSERTも成功。

> **Known gapは解消済み（Task 5 + remediation group 2/3）**: source kind・environment marker・
> provider resource IDを記録するcontent levelのexport（plan Task 4 Step 7が要求する
> `export --source local|payload` + 署名済みmanifest）は実装済み。本節は「DB物理退避」として
> 残し、通常のcontent退避・復元は次の §4.1 を使う。

### 4.1 content level のexport / restore（署名済みbaseline）

`content:export` / `content:restore` / `content:verify-snapshot` / `content:verify-conservation`
の運用手順。**この節は「実装済み」「未検証」「人間判断待ち」を区別して書く**（必須修正11-5）。

#### 実装済み（自動テストで固定されている）

| 事項 | 内容 |
|---|---|
| 署名 | AWS KMS（`alias/deploid-snapshot-signing`、ECDSA_SHA_256）+ cosign。**snapshot本体とmanifestの両方**に署名する。検証のtrust anchorは`docs/reference/content-platform-resources-v1.md` §4の公開鍵で、Rekorは使わない（`--insecure-ignore-tlog`） |
| 環境marker | restoreは`_environment_marker`（`npm run environment:stamp`が書く行）とmanifestの`provenance.environment`の一致を要求する。未署名の`--input`は、DB自身がproduction / previewと申告していれば常に拒否される |
| provider resource ID | manifestは`storage.storeId`（**実store ID**）と`provenance.auditBlobStoreId` / `databaseResourceId` / `schemaVersion` / `baselineRunId` / `baselineGeneration`を持つ。restoreは全部を対象DB・runtime credentialと突き合わせる |
| media | baselineは**media bytesを同梱**し、manifestの`mediaInventory`に`objectKey` / `sha256` / `size` / `mimeType`を署名付きで記録する。restoreは全mediaのsha256を検証してから書き込む（public media Blobの生存を前提にしない） |
| 停止条件 | 下の「停止条件」表のいずれか1件でDB書き込みを開始しない（`refusing to write. No database change was made.`）か、書き込み後の完全parityで失敗を報告する（`NOT successful`） |

実行前にdeployment scopeごとに次を確認する。

- `BLOB_STORE_ID`は、Productionなら`PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID`、Previewなら
  `PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID`と同じstoreを指すこと。
- `SNAPSHOT_SIGNING_KMS_KEY_ARN`はsnapshot署名KMS keyのARNであること。鍵をrotationした場合は、
  対応する公開鍵PEMを`SNAPSHOT_SIGNING_PUBLIC_KEY_PATH`にも設定すること。
- Production/Previewのexport/restoreでは`local-disk`を使わない。CLIもfail-closedで拒否する。

```bash
# export（署名 + private audit storeへupload + 署名済みmanifest envelope）
npm run content:export -- --source payload --upload \
  --store vercel-blob --store-id "$PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID" \
  --store-name deploid-audit-production \
  --manifest-out ./cutover-baseline.envelope.json \
  --baseline-generation <前回+1>

# restore（managed DBへはmanifest経由のみ）
npm run content:restore -- --manifest ./cutover-baseline.envelope.json \
  --expected-environment production --expected-baseline-run-id <baselineRunId> \
  --i-know-this-is-production
```

#### 停止条件（1件でも該当すればrestoreしない）

| check | 意味 |
|---|---|
| `envelopeSchema` / `manifestSignature` | 署名済みenvelopeでない、またはmanifestが署名後に書き換えられている |
| `artifactSignature` / `sha256` | artifact本体が改ざんされている、manifestのdigestと一致しない |
| `baselineCompletion` | completion markerが無い / 別runのもの。**途中で失敗したexport runの残骸**なので使わない |
| `snapshotSchema` / `recordCounts` / `duplicateStableId` / `brokenReference` | artifactの中身が壊れている |
| `mediaInventory` / `mediaBytes` | mediaのbytesが欠落・改ざん・取得不能、またはsnapshotとinventoryが1対1でない |
| `environmentMarker` / `databaseResourceId` / `auditBlobStoreId` / `schemaVersion` | 別環境・別DB・別store・別schema世代向けのartifact |
| `baselineGeneration` / `baselineRunId` | このDBが既に適用した世代より古いartifact、または同じ世代番号を再利用した別run。同世代は同じrun IDの再試行だけ許可 |
| `blobStoreId` / `blobCredentialEnvironment` / `blobCredentialStoreUnknown` | manifestのstore IDとruntime credentialのstore IDが違う、Preview / Productionのcredential交差、credentialがどのstoreを指すか特定できない |
| `skippedMedia` / `postRestoreParity` | 書き込み後に、DBがartifactと一致していない |

#### 未検証（実credentialが無いためTask 9まで確認できない）

- **実private Blob store（`deploid-audit-production` / `deploid-audit-preview`）へのupload / get / head / delは未検証。**
  これらはOIDC-federatedで、`VERCEL_OIDC_TOKEN`をBlob accessへ交換できるのはVercel Function runtimeだけ。
  ローカル / CIからは到達できない。store ID照合・credential交差拒否・completion markerといった
  **ロジックはunit / 統合テストで検証済み**だが、**実Blobに対するend-to-endはTask 9で行う**。
- OIDC経路では`BLOB_STORE_ID`をenvに設定する必要がある（未設定だとcredentialがどのstoreを選ぶか
  特定できないため、fail-closedで拒否される）。

#### 人間判断待ち

- 同一`src`に異なるrights metadataが付いているmedia（`mediaRightsConflicts`）。同じファイルが
  複数のmediaレコードとしてuploadされる既知のデータ品質課題で、restoreの失敗としては扱わない。
- `content:compare`が要確認mediaを1件でも報告した場合、既定でexit 1になる。通すには
  **署名済みwaiver**（`--media-waiver`）が要る。waiverは要確認項目そのもののdigestに結び付くので、
  項目が増減したら承認し直しになる。
- identity transfer（消失stable IDの承認済み付け替え）は**署名済み文書**でしか受け付けない。
  `approvedBy`に名前を書いたJSONは承認ではない。

### 既知の生成物バグ（重要 — 巻き戻す前に必ず確認する）

**症状**: 新しいcollectionを追加するmigrationの`down()`で、生成されたSQLが次の順序になる:

```sql
DROP TABLE "<new_table>" CASCADE;
ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "..._<new_table>_fk";  -- (A)
ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "..._<new_table>_fk";        -- (B)
```

`DROP TABLE ... CASCADE`は、他のtable（`payload_locked_documents_rels` /
`payload_preferences_rels` — Payloadが全collectionを横断して持つ「最近開いたdocument」
「user preference」用の多態的relationship table）が新tableへ持つFK制約を、CASCADEの副作用として
**先に**削除する。その直後の明示的な(A)(B) `DROP CONSTRAINT`は、既に無い制約を消そうとして

```
error: constraint "..._<new_table>_fk" of relation "..." does not exist
```

で失敗する。トランザクション内なのでロールバックされ、データは失われない（実機で確認: seed済み
rowも既存tableも無傷のまま、`migrate:down`だけが失敗する）。しかし**そのまま`migrate:down`を
実行するとエラーで停止し、rollbackが完了しない**。

**発生条件**: 「新しいcollectionを追加するmigration」全般（`payload-mcp-api-keys`のような、単一
collectionだけを新設するmigrationで確認済み）。**最初のmigration（このrepoの
`20260811_153537_initial_schema`）は対象外** — 全table・全FKをまとめて一度にdropするため、
「他のtableだけが生き残ってconstraintを持ち続ける」状況が発生しない（実機で確認: 初回migrationの
down/up/re-upはこの問題なく成功する）。**Task 8以降、新しいcollectionを追加するmigrationは
毎回この対象になりうる。**

**対処（migrationをcommitする前のreview手順に組み込む）**:

1. `migrate:create`で生成した直後、`down()`の中身を読む。
2. `DROP TABLE "X" CASCADE;`の直後に、Xを参照する`DROP CONSTRAINT`が続いていないか確認する
   （grep目安: `` grep -A2 'DROP TABLE.*CASCADE' <file> ``）。
3. あれば、その`DROP CONSTRAINT`行を削除する（CASCADEが既にやっているので安全に削除できる）。
   `DROP INDEX` / `DROP COLUMN`行はconstraintの有無に依存しないため**そのまま残す**。
4. 隔離DBで`migrate:down`→`migrate`のround-tripを実際に実行して確認してから commit する。

`tests/content/migration.test.ts`はこの手順を`stripCascadeRedundantDropConstraints()`として
自動化し、fixture migrationに対して実際にdown/up round-tripが成功することを検証している
（このバグの再現とfixの両方を毎回のtest実行で確認する）。

**このバグにより「downが動かない」わけではない** — 手順3のhand-fixを適用すれば動く、と実機で
確認済み。brief Step 4の「downが動かない場合はcontent:exportからの復元手順を確立するまで先へ
進まない」というgateには抵触しない。ただし**このhand-fix手順を省略すると壊れる**ため、
migration reviewのチェックリストに必ず含めること。

### 一方向migration（down()がデータ投入後は巻き戻せないもの）

**enum型を「狭い旧型」から「広い新型」へ付け替えるmigrationは、実データが入った後は
巻き戻せない。** `down()`が旧型へcastし直すため、旧型に無い値を持つ行が1行でもあると
`invalid input value for enum ...`で失敗する。データは失われない（transaction内でrollbackされる）
が、rollbackは完了しない。

該当migration一覧（新しく作ったら必ずここへ追記する）:

| migration | 内容 | 巻き戻せる条件 |
|---|---|---|
| `20260812_014819_deployment_status_enum` | `deployments.status` を `_status`（draft\|published）と衝突していたenum型から `enum_deployments_site_status`（announced\|pilot\|production\|ended\|unknown）へ分離（Task 4） | `deployments` / `_deployments_v` に `announced`/`pilot`/`production`/`ended`/`unknown` を持つ行が**1行も無い**とき |
| `20260812_080919_date_only_content_fields_to_text` | 日付のみのコンテンツ日付（`sources[].publishedAt` / `sources[].checkedAt` / `nextReviewBy` / `heroImage.rights.checkedAt` / `domesticDistributors[].checkedAt` / `articles.publishedAt` / `media.rights.checkedAt`、計61列）を `timestamptz` → `varchar`（Task 5） | 対象61列に**非NULL値が1つも無い**とき |

**`date_only_content_fields_to_text` は enum の場合と危険の向きが逆**（同種を書くときの注意）。
enum は「旧型で表現できない値」が cast エラーになるだけで、**失敗が安全側**だった。こちらは:

- 月精度の値（`'2025-05'`）を持つ行 → cast エラーで transaction ごと落ちる（うるさいが安全）。
- **`'2026-07-16'` のような普通の値を持つ行 → cast に成功してしまう。** ただしその値は
  「`migrate:down` を実行した session の timezone の0時」になる。JSTで巻き戻すと
  `2026-07-15T15:00:00Z` として保存され、`up()` が取り除いた1日ずれが**エラーも警告も無しに
  再導入される**。down() 自体は成功したように見える。

したがって guard の条件は「変換できない行があるか」ではなく **「対象列に値があるか」**。
1行でもあれば止める。実機確認済み（Task 5、隔離DB `deploid_task5_down`）: 実データ投入後の
`migrate:down` は `down() is one-way once date-only content values exist (1887 row(s) ...)` で停止し、
列型は `character varying` のまま・値も `2026-07-16` のまま無傷。空DBでは down → up の
round-trip が成功する。

> 生成された down() は `USING` 節を持たず**空DBでも実行できなかった**
> （`column "published_at" cannot be cast automatically to type timestamp with time zone`）。
> 下記「既知の生成物バグ」と同種のため、明示 cast を手で足してある。

**なぜ「可逆なdown()」にできないか**（同種のmigrationを書くときの判断材料）:

- 旧enum型へ値を`ALTER TYPE ... ADD VALUE`で足す案は不可。(1) 旧型は`_status`と共有されており
  draft/published以外を許す＝直した欠陥の再導入、(2) Payloadのmigrationは1 transactionで走るが、
  Postgresは同一transaction内で追加したenum値を使えない（`unsafe use of new value`）。
- 該当行をNULL/既定値へ潰す案は、意味（`DeploymentSite.status`＝導入実績の段階）を静かに失わせる
  ためGlobal Constraint（意味を変えない）に反する。

**対処（このrepoの方針）**: 巻き戻せない条件を満たさないときは、`down()`の先頭で
**明示的な例外**を投げて何も壊さずに止める（素のcastエラーで落とさない）。例外messageに件数、
`HINT`に復旧手順を入れる。`20260812_014819_deployment_status_enum`はこの形で実装済み。

復旧手順（このmigrationより前へ戻す必要が本当にある場合）:

1. まず戻す必要性を再確認する。`up()`は列の型を広げるだけで既存のdraft/published値も安全に通る。
   通常このmigrationを巻き戻す理由は無い。
2. deployment dataを退避する（本節（§4）の「巻き戻し前のbackup / restore（テーブル単位）」の
   `pg_dump --data-only`。§4.1のcontent level exportは実装済みだが、**schema世代を跨ぐ復元には
   使えない**——restoreは`schemaVersion`の一致を要求するため、down後のDBへは戻せない）。
3. `DELETE FROM _deployments_v;` と `DELETE FROM deployments;`（両方空にする）。
4. `npm run payload:migrate:down`。
5. 再度upする場合は`npm run payload:migrate`のあと、2で退避したデータをimportし直す。

実機確認済み（Task 4、隔離DB `deploid_task4_down_test`）: `status='pilot'`の行がある状態で
`migrate:down`は上記の明示的例外で停止し、schemaとデータは無傷のまま。手順3のあとは
`migrate:down` → `migrate` のround-tripが成功し、その後に`pilot`を再投入できる。

---

## 5. Schema drift 検出

`payload:migrate:status`は「生成済みmigrationファイルの適用状態」しか見ない。
「`collections/Robots.ts`にfieldを足したのにmigrationを生成し忘れた」というdriftは検出できない
（migrationファイル自体が存在しないので、statusの表に現れようがない）。

`migrate:create`を実際に実行し、**新しいfileが生成されるかどうか**でdriftを判定する。CIは
非対話なので`--skip-empty`を付ける（差分が無ければfileを作らずexit 0で終わる。プロンプトを
一切出さない — `@payloadcms/drizzle`の`buildCreateMigration.js`で確認済み）。

```bash
npm run payload:migrate:create -- __drift_check --skip-empty
if ls migrations/*__drift_check* >/dev/null 2>&1; then
  echo "schema drift: collectionsの変更に対応するmigrationが無い"
  rm -f migrations/*__drift_check*
  exit 1
fi
```

`.github/workflows/ci.yml`にこのcheckと`payload:migrate:status`の両方を組み込んでいる。片方だけ
では:
- drift check だけ: migrationファイルは生成したが**適用し忘れた**（例: `payload:migrate`の
  step自体を誤って削除された）ケースを見逃す。
- `migrate:status`だけ: `collections/*.ts`を変更したのに**migrationを生成し忘れた**ケースを
  見逃す（migration status表に載る対象自体が存在しないため）。

**実機確認済み（2026-08-12）**: `collections/Robots.ts`へ一時的にfieldを1つ追加し（commitせず）、
上記drift checkをそのまま実行したところ、`migrate:create`が新しいmigrationファイルを生成し、
checkがexit 1することを確認した。確認後、field追加を`git checkout`で取り消し、生成された
migrationファイルとその副産物（`migrations/index.ts`の一時的な追記分）を含めすべて元に戻し、
`git diff --check`と`rg`で試験用fieldの痕跡が0件であることを確認済み。

---

## 6. 隔離DBでの検証（テスト方針）

`tests/content/migration.test.ts`が自動化している検証:

- **空DBへの初回適用**（Step 2）: 空DBを作り、`migrate:create`→`migrate`→`migrate:status`を
  実行し、10 collectionのtable、`content_route_registry`（`UNIQUE(namespace, slug)`込み）、
  `_environment_marker`が作られることを確認する。
- **`environment:stamp`の冪等性・拒否**: 初回insert、2回目の冪等no-op、反対環境への拒否
  （exit 1、行は変更されない）を確認する。
- **既存schemaへの適用**（Step 3）: 実際に committed された初回migrationを別の隔離DBへ適用し、
  行を1件seedしたあと、Task 8で実際に採用する`@payloadcms/plugin-mcp`のAPI key collection
  （`tests/fixtures/payload-migrations/mcp-fixture.config.ts` — 本番の`payload.config.ts`と
  同じ`contentCollections` / `contentGlobals` / `createMediaStoragePlugin()`を再利用し、
  `mcpPlugin`を足しただけの設定）からmigrationを生成・適用し、seed済みの行が消えないことを
  確認する。任意のfieldを足すのではなく、実際に将来採用されるschema変更を使う。
- **down/up/再up**（Step 4）: 生成したmigrationを`migrate:down`→`migrate`し、tableの消滅・復活と
  seed行の生存を確認する（§4のhand-fixを適用した上で）。
- **空migration**: 差分が無い状態で`migrate:create --skip-empty`を実行し、fileが作られず
  exit 0で終わることを確認する（drift-check negative caseと共用）。
- **drift検出**: 同じfixtureに対する2回目の`migrate:create --skip-empty`が新しいfileを作らない
  ことを確認する（drift-check positive caseは、fixtureが実際に新しいAPI key tableを持つことで
  自然に検証される）。

**すべて`localhost` / `127.0.0.1` / `::1`のPostgresサーバーに対してのみ実行する**
（`tests/content/migrationTestSupport.ts`の`assertLocalThrowawayDatabase`が`DATABASE_URL`の
hostを検査し、それ以外なら例外で止める）。Production / Preview Supabaseとは資格情報を一切共有
しない。作成した一時databaseとファイルは`afterAll`で必ず破棄する。

---

## 7. Payload collection以外のtableを追加する場合（`afterSchemaInit`）

**新規migration**: `20260818_090053_add_preview_nonces`（Task 7、`preview_nonces` — Draft Mode
preview tokenのnonce台帳）。

Payload collectionとして宣言していない生tableを`migrations/*.ts`だけで作ると、実機で次の
落とし穴を踏む: `getPayload()` が実行するdev-mode schema auto-push（drizzle-kitの宣言的
push — 「Payloadが知っているschema」にDBを合わせ込む）が、その生tableを「未知のtable」と
見なして**pushのたびに削除する**。`tests/content/*.test.ts` はほぼ全て `getPayload()` を
呼ぶため、テストを1回走らせるだけでmigrationで作ったばかりのtableが消える
（`preview_nonces`で実機確認済み）。

**対処**: 対象tableをPayloadのadapter設定（`postgresAdapter({ afterSchemaInit: [...] })`）で
drizzleの `pgTable` として宣言し、pushの「知っている」schemaに含める
（`lib/payload/previewNonceSchema.ts` が実装例）。`payload.config.ts` の本番設定と、
`tests/fixtures/payload-migrations/mcp-fixture.config.ts`（Task 3.5 Step 3のfixture。
本番の`contentCollections`/`contentGlobals`/`createMediaStoragePlugin()`を再利用する設計）の
**両方**に同じ`afterSchemaInit`を足す必要がある——`createMediaStoragePlugin()`が既に踏んでいた
のと同じ理由（fixtureとproductionのdeclarative schemaがずれると、無関係な
`DROP TABLE`/`DROP COLUMN`がdrift検出へ混入する）。片方だけ足すと
`tests/content/migration.test.ts`のdrift検出testが壊れる（実機で確認済み: fixtureへ
足し忘れた状態では、期待した1件の差分ファイルが生成されず`generated.length`が0になった）。

`migrations/*.ts`自体は通常どおり`payload migrate:create`で生成する（`afterSchemaInit`で
宣言済みなら差分として検出される）。生SQLを手書きする必要は無い——`preview_nonces`の
migrationファイルも生成結果をそのまま採用している。

## 8. Payload 3.87.1の既知バグ: draft内nested group更新

Payload 3.87.1では、`draft: true` かつ既に`_status: 'draft'`のcollection documentに対し、
`heroImage.rights`のような二重groupを更新すると、`update()`の戻り値には新値が入る一方、
直後のfresh readでは旧値が残ることがある。単独のgroup fieldや`heroImage.src`など同階層の値では
再現せず、nested groupのdraft更新に限定して実機再現した。

このため、署名済みexport / cutover baseline / parityの読み取りは未承認draftを意図的に除外する
（`readSnapshot()`に`draft: true`を追加してはならない）。draft記事の権利メタデータを補正する
必要がある場合は、対象stable IDと旧値を`WHERE`条件に含めたローカルDB限定の補正を行い、fresh
readと`content:compare`で確認する。本番DBへの直接SQLは禁止する。

## 10. publish後にrevalidationが実際に成功したことを確認する運用手順

remediation group 5（`.superpowers/sdd/content-platform-migration-plan-v1/remediation-group5-brief.md`
必須修正1）。§6の`/api/revalidate-content`はfail-open設計（§6.1「fail-open時の残存ウィンドウ」）
であり、**失敗しても書き込み自体は成功する**——そのため、失敗時のwarnログだけでは
「revalidationが正常に動いているのか、そもそも一度も呼ばれていないのか」をログだけから
区別できなかった。以下の成功ログを追加済み。

### 10.1 検索対象のログメッセージ

| 場所 | `msg` | level | 意味 |
|---|---|---|---|
| `lib/payload/revalidationHook.ts`（`notifyRevalidation()`） | `revalidation-webhook-notified` | info | 各collection/globalの`afterChange`から`/api/revalidate-content`へのHTTP通知が`response.ok`で成功した |
| `lib/payload/revalidationHook.ts`（同上、既存） | `revalidation-webhook-non-ok-response` | warn | HTTP通知はできたがnon-2xxが返った |
| `lib/payload/revalidationHook.ts`（同上、既存） | `revalidation-webhook-unreachable` | warn | HTTP通知自体が失敗した（fetch例外・timeout） |
| `src/app/api/revalidate-content/route.ts`（`POST()`） | `revalidate-content-tag-invalidated` | (console.log、JSON文字列1行) | 署名検証・allowlist検証を通過し、`revalidateTag(tag, 'max')`を実際に呼び終えた |

`route.ts`側のログは`req.payload.logger`が無い（Payloadの`req`を経由しないNext.js route
handlerのため）ので`console.log(JSON.stringify({...}))`で出す。両方とも`collection`
（`revalidationHook.ts`側）または`collection`・`tagKey`・`tag`（`route.ts`側）を含む。

### 10.2 Vercel Function logsでの検索

Vercel dashboard の Project → Logs、または CLI:

```bash
# 直近のfunction logsをJSON行として見る
vercel logs <deployment-url-or-name> --json | grep 'revalidation-webhook-notified'
vercel logs <deployment-url-or-name> --json | grep 'revalidate-content-tag-invalidated'
```

publishした直後に両方のmsgが（`collection`が一致する形で）**両方とも**出ていれば、
「afterChangeフックからのHTTP通知」と「実際の`revalidateTag()`呼び出し」の両方が成功している。
`revalidation-webhook-notified`だけ出て`revalidate-content-tag-invalidated`が出ない場合は、
署名検証か`revalidateTag()`自体で問題が起きている可能性がある（`route.ts`のfail-closed分岐
——401/400——のログも合わせて確認する。ただしこの2つの401/400はcollection名を含まないため、
`route.ts`側の`unauthorized`/`unknown-collection`エラーレスポンス自体を見る必要がある）。

`revalidation-webhook-notified`が一度も出ない場合は、そもそもafterChangeフックが
`REVALIDATION_SECRET`未設定などでHTTP通知自体を試みていない（§6参照、`notifyRevalidation()`は
secret/`PAYLOAD_PUBLIC_SERVER_URL`未設定時は早期returnしログすら出さない）。§10.3の
troubleshooting手順を参照。

### 10.3 fail-openの結果、revalidation自体が失敗した場合の最大stale時間

`docs/reference/content-preview-runbook-v1.md` §6.1（Task 7 fix round 2で実測済み）の値を転記する:

| profile値 | 秒数 | 意味 |
|---|---|---|
| `stale` | 300秒（5分） | クライアント（router cache）がこの間は再検証なしに使い回す |
| `revalidate` | 3600秒（**60分**） | サーバーがこの間隔でbackground再生成を試みる（stale-while-revalidate） |
| `expire` | 86400秒（**24時間**） | 上限。これを過ぎるとstale値を一切返さず、同期的に再生成する |

webhook通知が一度も届かなかった最悪ケースでも、通常は**最大60分以内**に、どれだけ運が悪くても
**24時間以内**には必ず新しい値へ切り替わる（詳細・根拠は content-preview-runbook-v1.md §6.1）。

### 10.4 「publishしたのに反映が確認できない」場合のtroubleshooting

次の順序で確認する（早い段階の項目ほど「そもそも通知が一度も飛んでいない」可能性が高い原因）。

1. **secret未設定**: `REVALIDATION_SECRET`がPayload側（Vercel Functionのenv）に設定されているか。
   未設定だと`notifyRevalidation()`が早期returnし、§10.1のログが一切出ない
   （§6「secret未設定・署名欠落・不一致…は401/400で拒否する」と対になる、送信側の早期return）。
2. **`PAYLOAD_PUBLIC_SERVER_URL`未設定**: これも未設定だと`notifyRevalidation()`が同様に早期
   returnする。Production/Previewそれぞれの実URLが正しく設定されているか確認する
   （プレビューdeploymentごとにURLが変わる構成の場合、固定値のままになっていないか）。
3. **Next.js側のネットワーク到達性**: 1・2が両方設定済みなのに`revalidation-webhook-unreachable`
   （fetch例外）や`revalidation-webhook-non-ok-response`（non-2xx）が出ている場合、Payloadを
   実行しているruntimeから`PAYLOAD_PUBLIC_SERVER_URL`（Next.js自身）への到達性の問題
   （VercelのFunction間ネットワーク制約、`NOTIFY_TIMEOUT_MS`＝5秒のtimeoutに収まらない遅延、
   等）を疑う。この場合は§10.3の最大stale時間内に自然回復するのを待つか、
   `REVALIDATION_SECRET`を使って`/api/revalidate-content`へ手動で署名付きrequestを送るか、
   Vercelのcache purge機能を使う（content-preview-runbook-v1.md §6.1と同じ緊急手段）。

## 11. Global Constraints との対応

- 「schema変更はmigrationを生成してGitでreviewし、CIで適用確認する」→ §1・§5・
  `.github/workflows/ci.yml`。
- 「本番コンテンツをCodexからSQLで直接更新しない」→ このrunbookが扱うのはDDL
  （schema）のみ。コンテンツのCRUDはPayload API/MCP経由（Task 8）で別途扱う。
- 「local TSとPostgresのdual writeを実装しない」→ このtaskはPostgres1本のみを対象にしており、
  該当しない。
