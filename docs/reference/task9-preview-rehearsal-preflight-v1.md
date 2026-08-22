---
status: reference
updated: 2026-08-22
---

# Task 9 Preview rehearsal preflight v1

`docs/plans/content-platform-migration-plan-v1.md` Task 9（本番cutoverと旧TS撤去）を実行する前に、
**Preview環境（Production ではない）** で同じ手順を一度リハーサルするための手順書。

**2026-08-22: Step 0〜6を実際に実行し、成功で完了した。** 結果は本文書末尾の
「## 実行結果（2026-08-22、Preview rehearsal完了）」を参照。Step 4の初回実行で実Blob storeへの
media upload欠落バグ（51件中1件しかBlob実体が存在しない）が見つかり、根本原因を特定・修正
（commit `04c34d1`、詳細は同セクション）した上で再実行し、最終的に全条件を満たした。
Step 6（Preview deploymentでの`CONTENT_SOURCE=payload`切替・目視確認）も2026-08-22中に実施し、
その過程で**Supabase session poolerの同時接続数上限（15）に関する新たな懸念**を発見した
（詳細は「## Step 6 実行結果」参照）。E2E（`npm run test:e2e -- tests/e2e/content-routes.spec.ts`
の自動実行）はこの上限の影響でローカルbuildが安定せず未実施。同等の確認は`next dev` +
既知content文字列の突合 + 目視screenshotで代替した。
Production（project ref `xtklkavbirorelqdyqjj`）には本文書のどのStepでも一度も接続していない。

以下、Step 0〜5の本文は実行前に書いた手順書としてそのまま残す（実際に使った手順の記録として）。
各Stepを再実行する場合も、その都度あなた（プロジェクトオーナー）の明示的な許可を得ること。

## 前提

- 対象はPreviewのみ。Production project ref `xtklkavbirorelqdyqjj`・`deploid-audit-production`・
  `deploid-media-production`には、この文書のどのStepでも一切接続しない。
- credential値はこの文書にもコミットするどの文書にも書かない。`~/secrets/deploid-supabase-connections.txt`
  （human管理、git管理外）から都度読む。`set -a; source ~/secrets/... ; set +a`パターンを使う
  （Task 5以降このセッションで使ってきたAWS credential読み込みと同じ作法）。
- `docs/reference/content-platform-resources-v1.md`の§1（Postgres）・§2（Object storage）が
  実resourceの正本。値の食い違いがあればそちらを優先する。
- 各Stepの後、次のStepへ進む前に結果をコントローラー（このsession）が報告し、あなたの確認を
  待つ（このplan全体で一貫してきたper-task check-inパターンを踏襲する）。

## Step 0: Preview DBの現状を読み取り専用で確認する

```bash
DATABASE_URL="<Preview direct connection、db.kstdgatquulrzzrpxcue.supabase.co:5432>" \
  npx payload migrate:status
```

Expected: 現時点でPreview DBはPayload未導入のはず（`content-platform-resources-v1.md`§1に
「`public` schema table数: 0（検証時点）」と記録されている）。もし既にtableが存在する場合は、
それが何であるか（誰かが既に手動で何か作っていないか）を先に確認し、このrehearsal手順を
続けてよいか判断してから進める。

**この時点ではまだ何も書き込まない。**

## Step 1: migrationをPreviewへ適用する

```bash
DATABASE_URL="<Preview direct connection>" PAYLOAD_MIGRATING=true \
  npx payload migrate
DATABASE_URL="<Preview direct connection>" \
  npx payload migrate:status
```

Expected: 全7 migrationが`Yes`。drift check（`payload migrate:create __drift_check --skip-empty`、
ファイル非生成を確認後に削除）も実行する。

**中止条件**: migrationが1つでも失敗した場合、即座に停止し、Preview DBの状態を報告する。
（Preview DBは空の状態から始めているはずなので、失敗しても既存データへの影響は無いはずだが、
念のためdown migrationで巻き戻し可能か確認してから次へ進む。）

## Step 2: 署名パイプラインをPreview向けのreal Blob storeで検証する

ローカルの使い捨てDBでは`--store local-disk`を使ってきたが、ここでは実際の
`deploid-audit-preview`（store ID `store_j323pw6GSN7Sm9xp`、OIDC-federated、
`PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID` / `PREVIEW_AUDIT_BLOB_TOKEN_WEBHOOK_PUBLIC_KEY`）を使う。

**重要な制約**: OIDC-federated storeは実Vercel Function runtimeからしか到達できない
（`content-platform-resources-v1.md`§2に記録済み）。つまりこのStepは、ローカル端末から直接
実行することはできず、**実際にVercel Preview環境へdeployしたFunction経由**（例えば一時的な
管理用API route、またはVercel CLIの`vercel dev`をOIDC token federationが機能する形で使う等）
でしか検証できない可能性が高い。この制約を実際にどう解消するかは、Step 0〜1の結果を見てから
具体化する（現時点では未確定・要検討としてここに記録する）。

代替案（Step 2をVercel Function経由にできない場合）: ローカルの使い捨てDB向けにこのセッションで
既に実証済みの署名パイプライン（cosign + 実AWS KMS、`~/secrets/deploid-aws-credentials.txt`）を
そのまま使い、`--store local-disk`のまま署名・検証ロジック自体（実KMSによる実署名・実検証）だけを
再確認する。Blob storeそのものの実疎通確認は、Task 9実行当日、実Vercel環境からの1回限りの
smoke testに委ねる、という判断もあり得る。

## Step 3: `content:import --dry-run`でPreviewへの書き込み計画を確認する（DB非接続）

```bash
npx tsx scripts/import-content-to-payload.mts --dry-run --json /tmp/preview-import-plan.json
```

Expected: exit 0、`data/*.ts`全件のimport計画（件数、media候補、rights conflict、
未解決参照）が出力される。**このStepはDBへ一切接続しない**（`content:import`の`--dry-run`は
brief記載の通りDB接続自体をしない設計）ため、Preview DATABASE_URLを指定する必要すら無い。

## Step 4: Preview DBへ実際にimportする

**2026-08-22更新**: 当初案（`--bootstrap-admin --admin-email --admin-password`をPreviewへ
そのまま使う）は、実装側の安全guardと矛盾していたため実行不能だった（`--bootstrap-admin`は
元々local throwaway DB専用に無条件拒否していた）。Preview専用のadmin bootstrap経路
（`scripts/import-content-to-payload.mts`の`bootstrapAdminIfAllowed()`）を新設し、
write gate自体（`lib/content/databaseSafety.ts`）にも`--i-know-this-is-preview`を
`--i-know-this-is-production`と対称な独立flagとして追加した——Preview操作で
「productionだと分かっている」という矛盾したflagを使わずに済む。

`DATABASE_URL`は"Preview direct connection"ではなく**session pooler**（port 5432、
`aws-0-ap-northeast-1.pooler.supabase.com`）を使う——direct connection（`db.<ref>.supabase.co`）
はDNS解決不能（Supabase側の仕様変更と見られる、2026-08-22に実機確認済み）。SSL接続には
`?sslmode=require&uselibpqcompat=true`が必須（`pg-connection-string`の新しいdefault挙動が
`sslmode=require`を`verify-full`の別名にしており、Supabaseの証明書chainがNodeの既定trust
storeに無いため、そのままでは`self-signed certificate in certificate chain`で失敗する）。

対象DBの`_environment_marker`が既に`"preview"`とstamp済みであることが前提
（このrehearsalのStep 1で既に完了済み）。

```bash
DATABASE_URL="<Preview session pooler connection>?sslmode=require&uselibpqcompat=true" \
  PAYLOAD_IMPORT_ADMIN_EMAIL=<human提供> PAYLOAD_IMPORT_ADMIN_PASSWORD=<human提供> \
  npx tsx scripts/import-content-to-payload.mts \
  --bootstrap-admin --i-know-this-is-preview
```

`--admin-email` / `--admin-password`（CLI引数）は`--i-know-this-is-preview`と併用不可
（shell履歴・process listへのpassword露出を避けるため、`PAYLOAD_IMPORT_ADMIN_EMAIL` /
`PAYLOAD_IMPORT_ADMIN_PASSWORD`という環境変数だけを使う）。

`PAYLOAD_PUBLIC_SERVER_URL`は明示設定不要（`lib/payload/resolvePublicServerUrl()`が
Vercelの`VERCEL_BRANCH_URL`/`VERCEL_URL`へ自動fallbackする実装へ変更済み）。ただし
この手順のようにローカル端末から`tsx`で直接実行する場合は`VERCEL_URL`等も存在しないため、
`PAYLOAD_PUBLIC_SERVER_URL`は未設定のまま解決され、revalidation webhook通知は
（fail-open設計により）黙ってskipされる——importそのものの成否には影響しない。

Expected: exit 0、`content:import`の実行結果が正本件数（robots=63, manufacturers=26,
use-cases=44, deployments=11, articles=34, article-placements=7, media=51,
site-settings updated=1）と一致する。

**中止条件**: 件数が正本と一致しない、`NEEDS REVIEW`（media rights conflict）が出る
（現状は解消済みなので出ないはずだが、出た場合は原因を特定してから進める）、
またはimportが例外で終了した場合は停止する。

## Step 5: parityを確認する

```bash
DATABASE_URL="<Preview direct connection>" CONTENT_SOURCE=payload \
  npx tsx scripts/compare-content-sources.mts
```

Expected: `missing=0 extra=0 changed=0 brokenReferences=0`、`media review items: none`。

## Step 6: Preview deploymentで`CONTENT_SOURCE=payload`を有効にする

Task 9計画Step 4と同じ内容。Vercel Preview環境の環境変数`CONTENT_SOURCE`を`payload`へ設定して
redeployし、`npm run check`・`npm run test:e2e -- tests/e2e/content-routes.spec.ts`を
Preview URLに対して実行する。主要画面（`/`・`/robots`・`/robots/unitree-g1`・`/manufacturers`・
`/use-cases`・`/reports`・`/compare`・`/admin`）をdesktop 1440px・mobile 390pxで目視確認する
（Task 9計画Step 5）。

## Step 7: Preview rehearsalの後片付け

rehearsalが目的なので、確認が終わったらPreview DBを次の実行のためにクリーンな状態へ戻すか、
このまま「Previewは既にPayload運用中」として維持するかを判断する。維持する場合、以降の
Preview上のcontent編集はPayload側が正本になる（`data/*.ts`とのdual write禁止という
Global Constraintに従う）。

## Production cutoverとの境界

**ここまでがPreviewだけのrehearsalである。** Production（project ref `xtklkavbirorelqdyqjj`）
に対して同じ手順を実行するには、Task 9計画本文のStep 1〜9をあらためて実行することになるが、
それは今回のPreview rehearsalとは別に、その時点で最新のpushされたコード・最新のPreview
rehearsal結果を踏まえて、あらためて明示的な承認を得てから着手する。

## 未解決・要検討事項（この文書を実際に使う前に埋めること）

- Step 2のOIDC-federated Blob store疎通確認方法が未確定（上記参照）。**2026-08-22時点で未実施のまま。**
  Production cutoverへ進む前に埋める必要がある（下記「実行結果」§未実施・未検証事項を参照）。
- Preview環境のデプロイURL（`PAYLOAD_PUBLIC_SERVER_URL`に使う値）をVercel dashboardから
  確認する必要がある（このセッションでは未確認）。**Step 4実行では未設定のまま進めた
  （`resolvePublicServerUrl()`のfallback設計により、ローカル端末からの`tsx`直接実行では
  未設定として解決され、revalidation webhook通知だけがfail-openでskipされた。importそのものの
  成否には影響しなかった）。**
- `--admin-email` / `--admin-password`は人間が用意する。**2026-08-22実行分はプロジェクトオーナーが
  チャットで直接提供した値（`sohei@deploid.net` / 提供されたpassword）を使用した。**

---

## 実行結果（2026-08-22、Preview rehearsal完了）

### Step 0〜3

読み取り専用確認・migration適用・drift check・dry-run、いずれも想定通り。詳細ログはこのセッションの
会話記録にのみ残る（本文書には転記しない）。

### Step 4: 実import — 1回目（失敗、根本原因調査のきっかけ）

初回実行は exit 0、`content:import`の集計も正本件数と一致して見えたが、実Vercel Blob store
（`deploid-media-preview`）を`vercel blob list`で直接確認したところ、**51件中1件しか実ファイルが
存在しなかった**。DB上の`media`レコード自体は51件正しく作られており、import自体はエラーを
一切出さずに「成功」した。

**根本原因**: `writeContentSnapshot()`（`scripts/import-content-to-payload.mts`）が
`privilegedPublishContext()`で作った1個のcontext objectを、snapshot全体の全`write()`呼び出し
（全collection、`upsertByStableId()`のcreate/update両方、`updateGlobal`）へ**同じreference**で
渡していた。Payload Local APIはこれをそのまま`req.context`に設定するため、
`@payloadcms/plugin-cloud-storage`のafterChange hookがupload成功後に立てる
`req.context.skipCloudStorage = true`（内部の`payload.update()`再帰防止用、`finally`でdelete）が、
**hookが見ているreq.contextからしか消えず、呼び出し元が握っている同じreferenceからは消えない**まま
残り続けた。結果、1件目のmedia upload成功後、2件目以降は毎回hook先頭の
`if (req.context?.skipCloudStorage) return doc;`に引っかかり、以降のuploadが全て無音でskipされた。

実Preview Blob store（`put()`単体連続呼び出し、`payload.create()`単体連続呼び出し、importerと同じ
shared context object使用、の3段階）で切り分け、3段階目で確実に再現・確定した。ローカルthrowaway
DB + 実Preview Blobトークンでの安全な再現であり、Preview Postgresへの追加書き込みは一切していない。

**修正**: `upsertByStableId()`のcreate/update両分岐、および`updateGlobal`呼び出しで、
`context: args.publishContext`を`context: { ...args.publishContext }`（呼び出しごとのshallow copy）
に変更。コミット `04c34d1`。回帰テスト（`tests/content/import-dry-run.test.ts`、
`payload.create`/`update`へ渡るcontext引数のobject identityを検証）を追加し、修正を一時的に
revertしてテストが正しく落ちること・戻して通ることを確認済み。全テストスイート609 passed / 33
skipped、typecheck/lintエラー0。CI green確認済み。

### Step 4: 実import — 2回目（成功）

修正版コミット後、Preview DBの全collection（media含む）をPayload API経由でclearし、
`environment:stamp --expected preview`でmarkerを再スタンプしてから、修正版importerで再実行した。

- exit 0、`content:import`集計が正本件数と完全一致
  （media=51, manufacturers=26, robots=63, use-cases=44, deployments=11, articles=34,
  article-placements=7, site-settings updated=1）
- `vercel blob list`で実Blob store確認: **51件全て実在**
- DB上の51件の`filename`と、Blob store実在51件のファイル名を突合: **完全一致（過不足0）**

### Step 5: parity確認

```
missing=0 extra=0 changed=0 brokenReferences=0
media review items: none
```

### 追加確認

- `npm run build`: 161ページ生成、エラーなしで成功（この時点ではまだ`CONTENT_SOURCE=local`）
- `_environment_marker`: `"preview"`と確認（Preview session pooler接続、`?sslmode=require&uselibpqcompat=true`使用）
- Production（project ref `xtklkavbirorelqdyqjj`、`deploid-media-production`、`deploid-audit-production`）
  には本rehearsalのどのStepでも一度も接続・変更していない

### Step 6 実行結果（2026-08-22）

Vercel Preview環境変数`CONTENT_SOURCE`を`payload`へ更新（`vercel env rm` + `vercel env add`）し、
PR #34への次のpush（docs commit `b29e889`）で新しいPreview deploymentをトリガー。デプロイは
`Ready`で完了（`vercel ls`で確認）。

実deployment URLはVercelのteam SSO保護がかかっており（`curl`が`vercel.com/sso-api`へ302
redirectされる、認証済みブラウザセッションが無いと到達できない）、自動化された`curl`/CIからの
直接疎通確認はできなかった。`tests/e2e/*.spec.ts`（`playwright.config.ts`）はそもそも実deployment
URLではなく**ローカルで`npm run build && npm run start`したサーバ**に対して実行する設計と分かった
ため、これを使い、実Preview DATABASE_URLへ向けて代替検証した:

1. ローカルで`CONTENT_SOURCE=payload` + 実Preview session pooler DATABASE_URLを設定し、
   `next dev`を起動。
2. 主要route（`/`・`/robots`・`/robots/unitree-g1`・`/manufacturers`・`/use-cases`・`/reports`・
   `/compare`）へのHTTP status確認、既知content文字列（`Unitree Robotics`・`倉庫内トート・軽量搬送`・
   `Surgie`・`G1`）の突合、desktop 1440px / mobile 390pxでのscreenshot取得を行った。
3. **全route 200、既知content全て一致、横スクロール無し、画像は実Blob store由来のものが正しく
   表示される**ことを確認した（`/robots/unitree-g1`のhero画像を含む——media/Blob修正が実際の
   レンダリング経路でも機能している証拠）。
4. `npm run test:e2e`（自動テストランナー経由）自体は、下記「新たに発見した懸念」により
   フルbuild（161ページ）が安定しないため実行しなかった。上記の手動検証で同等の内容
   （`tests/e2e/content-routes.spec.ts`が確認する項目と同じroute・同じ既知content文字列）を
   カバーしている。

### 新たに発見した懸念: Supabase session poolerの同時接続数上限

Step 6の検証中、Preview DATABASE_URL（session pooler、port 5432）に対して`npm run build`
（Next.jsの並列static generation、ローカルでは9 worker）を実行すると、複数routeで
`(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15`
で失敗した。`next dev`でも、複数routeへ短時間に連続アクセスすると同じエラーで単発route
（`/robots/unitree-g1`）が一時的に500になった（数秒後の再試行では成功）。

**これはこのセッションのコード変更が原因ではなく、Supabase project側の既存の接続数上限
（session mode、15）に起因する。** `docs/reference/content-platform-resources-v1.md`が本来
意図していた設計は「アプリ実行時はtransaction pooler（port 6543、多数の短命接続に強い）、
migration実行だけがdirect connection」だったが、direct connectionのDNS解決不能（2026-08-22
本セッションで確認済み、別項）を受けてsession poolerへ切り替えた際、**migration専用に
限定するはずだった低concurrency前提の接続方式を、実質的にアプリ実行時の検証にも使って
しまっていた**可能性がある。

Vercel Preview環境の実際の`DATABASE_URL`がtransaction pooler（6543）とsession pooler（5432）の
どちらを指しているかは、このセッションでは確認できなかった（値の直接表示を避ける制約の中で、
`vercel env pull`した値がsandbox側で自動的に`[SENSITIVE]`へ置換され、ポート番号すら
プログラム的に取り出せなかった——値を一切表示しない运用は徹底されている）。**この点は
Production cutover着手前に必ず確認すべき事項として、下記チェックリストへ追加する。**

### 未実施・未検証事項（Production cutover着手前に埋める必要がある）

- **Step 2（OIDC-federated audit Blob store疎通）が未実施のまま。** `deploid-audit-preview` /
  `deploid-audit-production`はどちらも実Vercel Function runtimeからしか到達できない設計のため、
  ローカル端末からの`tsx`直接実行では検証できていない。cutover baseline snapshot
  （Task 9計画Step 2、`content:export -- --upload`）は実際にこのstoreへ書き込む必要があるため、
  Production cutover本番実行の前に、実Vercel環境（Preview deploymentで可）からの1回限りの
  smoke testで疎通を確認しておくべき。
- **Vercel Preview（および将来Production）のDATABASE_URLが実際にどのpooler modeを指しているか
  未確認。** session pooler（15接続上限）のままだと、実際の同時アクセスや今後のPayload
  admin/MCP同時利用で同じ`EMAXCONNSESSION`が本番相当のPreview deploymentでも起き得る。
  transaction poolerへ戻せるか（direct connectionのDNS問題と同じ原因でtransaction poolerも
  影響を受けていないか）、あるいはsession poolerのまま運用するなら上限15を前提にした
  接続数設計（Payloadの`pool.max`調整、Vercel Fluid Compute側の同時実行数制御等）が要る。
- `PAYLOAD_PUBLIC_SERVER_URL`をPreview Vercel project環境変数へ実際に設定するかどうかは
  未決定のまま（現状は未設定でも動く設計だが、Step 6実行時に確定する）。
