---
status: reference
updated: 2026-08-12
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

`package.json` scripts（すべて `payload` CLIの薄いラッパー）:

| script | 中身 | 用途 |
|---|---|---|
| `npm run payload:migrate` | `payload migrate` | 未適用のmigrationをすべて適用する |
| `npm run payload:migrate:create -- <name>` | `payload migrate:create <name>` | 現在のcollections/globalsの定義と、`migrations/`内の最新snapshotとの差分からmigrationを生成する |
| `npm run payload:migrate:down` | `payload migrate:down` | 直近のbatch（複数ファイルなら複数）を一括で巻き戻す |
| `npm run payload:migrate:status` | `payload migrate:status` | 生成済みmigrationファイルそれぞれの適用状態（Yes/No）を表示する |
| `npm run environment:stamp -- --expected <preview\|production>` | `tsx scripts/stamp-environment.mts` | `_environment_marker`へ環境markerを冪等に書き込む |

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
（`export --source payload`、manifest付き）はTask 5以降の実装予定であり、**現時点では存在しない**。
今日使える手段は`pg_dump` / `psql`（PostgreSQLクライアント）によるテーブル単位の退避で、以下は
実機確認済みの手順。

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

> **Known gap（Task 5へ）**: これはテーブル単位の物理退避であり、source kind・environment marker・
> provider resource IDを記録するcontent levelのexport（plan Task 4 Step 7が要求する
> `export --source local|payload|snapshot` + manifest）ではない。Task 5でexport / restoreを実装したら、
> 本節の手順を「DB物理退避のfallback」として残しつつ、通常経路をそちらへ差し替えること。

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
   `pg_dump --data-only`。content levelのexportはTask 5以降の実装であり現時点では使えない）。
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

## 7. Global Constraints との対応

- 「schema変更はmigrationを生成してGitでreviewし、CIで適用確認する」→ §1・§5・
  `.github/workflows/ci.yml`。
- 「本番コンテンツをCodexからSQLで直接更新しない」→ このrunbookが扱うのはDDL
  （schema）のみ。コンテンツのCRUDはPayload API/MCP経由（Task 8）で別途扱う。
- 「local TSとPostgresのdual writeを実装しない」→ このtaskはPostgres1本のみを対象にしており、
  該当しない。
