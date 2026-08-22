---
status: reference
updated: 2026-08-21
---

# Task 9 Preview rehearsal preflight v1

`docs/plans/content-platform-migration-plan-v1.md` Task 9（本番cutoverと旧TS撤去）を実行する前に、
**Preview環境（Production ではない）** で同じ手順を一度リハーサルするための手順書。

**この文書は手順の設計のみで、実行はまだしていない。** 2026-08-21時点でこのセッションが行った
検証は全てローカルの使い捨てPostgres限定であり、Preview/Production Supabase・実Vercel Blobには
一度も接続していない。各Stepを実行するには、その都度あなた（プロジェクトオーナー）の明示的な許可を
得ること。特にStep 6以降（Preview DBへの実際の書き込み）は、実行直前にもう一度確認を取ること。

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

- Step 2のOIDC-federated Blob store疎通確認方法が未確定（上記参照）。
- Preview環境のデプロイURL（`PAYLOAD_PUBLIC_SERVER_URL`に使う値）をVercel dashboardから
  確認する必要がある（このセッションでは未確認）。
- `--admin-email` / `--admin-password`は人間が用意する（このセッションでは生成・保持しない）。
