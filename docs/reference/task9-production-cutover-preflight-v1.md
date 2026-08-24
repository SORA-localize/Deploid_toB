---
status: reference
updated: 2026-08-25
---

# Task 9 Production cutover preflight v1

`docs/plans/content-platform-migration-plan-v1.md` Task 9（本番cutoverと旧TS撤去）の Step 1〜9 を
Production（project ref `xtklkavbirorelqdyqjj`）に対して実行する前の、readiness評価と準備手順。

**この文書は設計・preflightのみで、Production への書き込みは一切していない。** 2026-08-22時点で
このセッションが Production に対して行ったのは、読み取り専用の確認（Postgresのtable数、Vercel環境変数の
「名前」の一覧）だけである。実際にStep 1以降へ着手するには、その都度あなた（プロジェクトオーナー）の
明示的な許可を得ること。特にProduction DBへの書き込み・Vercel Production環境変数の追加/変更・
本番importの実行は、実行直前にもう一度確認を取ること。

## 前提: Preview rehearsalで確認できたこと・できていないこと

`docs/reference/task9-preview-rehearsal-preflight-v1.md`（2026-08-22実行完了）で確認できた事項は、
**メカニズムそのもの**が正しく動くことの証明であり、Production固有の状態が同じであることまでは
保証しない。

**Preview rehearsalで確認済み（Production でも同じ実装が動くことの根拠になる）**:

- migration適用（`payload:migrate*` 経由、`bin.js`のrace回避を含む）
- `_environment_marker`によるPreview write gate（`--i-know-this-is-preview`、DB自己申告検証）
- admin bootstrap（`bootstrapAdminIfAllowed()`のfail-closed設計）
- content importの正当性（件数・parity 0差分）
- **media/Blob upload の context object共有バグ**（commit `04c34d1`で修正、51/51件で実証済み）
- `CONTENT_SOURCE=payload`で実Preview deploymentが正しくレンダリングする（Step 6、既知content
  文字列・画像・横スクロール無しを確認済み）

**Preview rehearsalでは確認できていない、Production固有の未検証事項**:

1. **Production Vercel環境変数が現状ほぼ未設定**（下記「Production環境変数の現状」参照）。
   Preview は本セッション中に個別に埋めたが、その作業は**Production環境変数には一切適用していない**。
2. **（解決済み）OIDC-federated audit Blob store疎通の根本原因が判明・実装・Preview実機検証まで完了した。**
   `content:export -- --upload`がCLIスクリプトのまま`process.env.VERCEL_OIDC_TOKEN`を読もうと
   していたのが原因で、Vercel Functionのruntimeでは実際は`x-vercel-oidc-token` request headerで
   tokenが渡される（[Vercel公式docs](https://vercel.com/docs/oidc)で確認）。**「OIDC Federation
   未有効化」という当初の診断は誤りで、dashboard操作は不要だった。** 正しい対応は、署名は従来通り
   CLIで行い、audit Blob storeへのuploadだけをheader経由でtokenを受け取れる専用Vercel Function
   route（3段階session方式）へ分離すること。設計は`task9-audit-upload-endpoint-design-v1.md`、
   POC（cosignバイナリのFunction同梱・実署名の検証・OIDC token経由のBlob access、全て実Preview
   deploymentで成功確認済み）も同文書参照。**route本体は実装済み（commit `3a7b211`）で、CLI配線・
   認証強化・Preview実機検証まで完了している。**
3. **Production resourceに対するcosign実署名付き`content:export -- --upload`は未実施。**
   Previewではsession→object→completeのroute経路を実Blob・実KMSで検証済みだが、Production用の
   環境変数・DB・audit storeを使った実行は、Production設定と明示承認が必要。
4. Production Postgresは **table数0**（本セッションで読み取り専用確認済み、2026-08-22）。
   これはTask 0記録時点と変わっていない——Production は一度もmigrationを適用されていない。
5. **（完全解決・2026-08-23）Supabase session poolerの同時接続数上限（15）問題。** PreviewのDATABASE_URL
   をtransaction pooler（6543）へ実際に更新・redeploy・実機検証まで完了した:
   実deployment上での主要route確認（全200）、24並列リクエスト（全200、エラー無し）、
   ローカル`npm run build`（161ページ、9 worker、成功）、自動E2E（7 passed）。
   詳細は`task9-preview-rehearsal-preflight-v1.md`「pooler mode切替の実施・実機検証」参照。
   **残るのはProduction側のDATABASE_URL設定のみ**（Production環境変数の設定設計の一部として、
   最初からtransaction poolerで設定する）。

## Production環境変数の現状（2026-08-22、読み取り専用確認・名前のみ）

`vercel env ls production` で確認した、Production スコープの環境変数（値は一切表示・取得していない）。

**設定済み**:

- `BLOB_READ_WRITE_TOKEN`（public media store `deploid-media-production`）
- `PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID`
- `PRODUCTION_AUDIT_BLOB_TOKEN_WEBHOOK_PUBLIC_KEY`
- analytics系（`NEXT_PUBLIC_*`、Payload/DBとは無関係）

**Preview には設定されているが、Production には無いもの**（`vercel env ls preview`との比較。
Previewの値と同じ値をそのまま流用してはならない——環境ごとに別々に払い出す必要がある）:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `CONTENT_SOURCE`
- `SNAPSHOT_SIGNING_KMS_KEY_ARN`（Production用の値。§4で払い出し済みの
  `alias/deploid-snapshot-signing`・ARN `arn:aws:kms:ap-northeast-1:866731631468:key/a9c59d6b-b769-47bb-bc65-8ac6ff4782f5`
  は`docs/reference/content-platform-resources-v1.md`に既に記録済みなので、**新規に鍵を作る必要はない**。
  Vercel Production環境変数として設定するだけの作業）
- `PREVIEW_TOKEN_SECRET`（Next.js draft-mode用。命名は"PREVIEW"だがPayloadの環境概念とは無関係で、
  Productionでも同名で必要——別名を作らない）
- `REVALIDATION_SECRET`
- `BLOB_STORE_ID`（Previewでどう使われているか未確定。`scripts/snapshotObjectStore.mts`はOIDC token
  経路で汎用`BLOB_STORE_ID`を読むが、実際のaudit store識別は`resolveExportProvenance()`が
  `_environment_marker`経由で`PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID`/`PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID`
  から解決している。この`BLOB_STORE_ID`が実際に必要か、Previewの過去の設定作業の残留物かは
  このセッションでは確定できなかった——下記チェックリストで実行前に切り分けること）
- AWS credential（`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`）: **Preview環境変数
  一覧にも見当たらなかった**。cosign署名がどうやって`deploid-kms` IAM userのcredentialを得ているか、
  Preview rehearsalでは実際に`content:export -- --upload`を実行していないため未検証。ローカル端末
  からの実行では`~/secrets/deploid-aws-credentials.txt`を都度sourceしていたが、Vercel Function
  runtime上でこれをどう渡す設計なのか（Vercel環境変数として設定するのか、別の認証方式か）を
  Production着手前に確認する必要がある

## Production着手前チェックリスト（すべて読み取り専用または準備作業。DB/contentへの書き込みは含まない）

- [x] **（解決済み）** PreviewのDATABASE_URLをtransaction pooler（6543）へ切替・負荷検証済み。
      Productionは未設定のため、同じ方式で設定する。
- [ ] **（Production設定前）** Vercel ProductionのDATABASE_URLをtransaction pooler（6543）で設定し、
      session pooler（5432、15接続上限）をアプリruntimeに使わないことを確認する。
- [ ] `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`（または同等の認証手段）が
      Vercel Function runtimeでcosign署名にどう渡る設計かを確認する。未設計なら先に設計する。
- [ ] `BLOB_STORE_ID`がPayload/exportの実行パスで実際に読まれているか
      （`scripts/snapshotObjectStore.mts`のOIDC経路が実際に踏まれる条件）を確認し、Production側で
      設定が要るかどうかを確定する。
- [x] ~~Step 2相当（OIDC-federated audit Blob store疎通）を、まずPreviewで実Vercel Function経由で
      確認しておく。~~ **実施済み（2026-08-22〜23）: 根本原因（`process.env`ではなくrequest
      headerでtokenが渡る）を特定し、POCで解決を確認済み。dashboard操作は不要と判明。**
- [x] 3段階session routeを実装し、CLIの`content:export -- --upload`から呼び出せるようにした。
      Preview実機でsession→object→complete、Blob digest突合、completion markerまで確認済み。
- [ ] Production Vercel環境変数を、Preview作業と同じ手順（値は都度その場で払い出し・確認、
      Previewの値を転用しない、`~/secrets/deploid-supabase-connections.txt`のproduction sectionから
      DATABASE_URLを読む）で埋める。この作業自体はTask 9計画のStepではなく、Step 1着手前の準備。
- [ ] `content:export -- --upload`を、実resource（Production Postgres・Production audit Blob
      store・Production KMS鍵）に対して**一度もend-to-endで実行したことがない**ため、Task 9 Step 2
      （cutover直前export）が計画通りに動くことを、Production本番実行の前に一度どこか
      （理想はPreview環境の同経路）で確認しておきたい。

## Task 9計画 Step 1〜9 との対応

計画本文（`docs/plans/content-platform-migration-plan-v1.md` Task 9）のStepそのものは変更しない。
このpreflightは「その計画を実行する準備が整っているか」の評価であり、計画の代替ではない。

| Step | 内容 | Preview rehearsalでの裏付け | Production固有の残作業 |
|---|---|---|---|
| 1 | 変更凍結・rollback window宣言 | — （運用上の合意事項、技術的検証対象外） | Production公開中サイトへの影響があるため、実施タイミングを事前に合意する |
| 2 | cutover直前export（署名付きartifactをaudit storeへ） | **route経路はPreview実機検証済み** | Production用env/resourceでのend-to-end確認が必要 |
| 3 | production import・parity | 同じ`content:import`/`content:compare`をPreviewで実証済み（51/51 media含む） | Production DATABASE_URL・env varが揃っていることが前提 |
| 4 | Vercel Previewで`CONTENT_SOURCE=payload`有効化・`npm run check`・E2E | **完了**（transaction pooler切替後、実deployment・自動E2Eを確認済み） | — |
| 5 | 主要画面目視確認 | **完了**（Step 6の一部として、desktop 1440px / mobile 390pxのscreenshotで確認済み） | — |
| 6 | Production切替 | — | 上記すべてが揃って初めて着手する |
| 7 | rollback window終了後の旧TS削除 | — | Production公開後24時間の安定運用確認が前提 |
| 8 | 最終検証（`npm run check`・`npm audit`・`git diff --check`） | 個別のcheck/testは今回のセッションでも実行済み（609 passed） | Step 7完了後にフルセットを再実行する |
| 9 | commit | — | — |

## 明示的に対象外（計画本文の判断を変更しない）

- source linkの403/410エラー修正: 計画本文の「Task 9着手前の判断」通り、本Taskのscope外のまま。
- version audit archive（KMS署名付きprivate blob store）: 計画本文通り、version pruningは
  無期限disabledのまま進める。
- Payload CMS 3.87.1のnested group draftバグ: 計画本文通り、別remediationへ先送り。

## 次のアクション

**`EMAXCONNSESSION`（session pooler同時接続数上限15）は、Preview rehearsalで実際に短時間アクセス
だけで500を発生させたことが確認されている以上、Production cutoverのblockerとして扱う。**
これが解消されるまで、Task 9計画のStep 1（変更凍結宣言）にも着手しない。解消のために確定すべき
事項（2026-08-22時点、プロジェクトオーナー確認済み）:

1. ~~Preview/Productionの実際のpooler mode（transaction pooler 6543 か session pooler 5432 か）~~
   **解決済み（2026-08-23）: Previewはsession pooler（5432）を使用していた。**
2. ~~transaction poolerへ戻せるか（direct connectionと同じDNS影響を受けていないか）~~
   **解決済み: 戻せる。pooler hostnameは最初からDNS解決できており、direct connectionの
   DNS問題とは無関係だった。同じhostのport切替のみでtransaction pooler（6543）へ接続でき、
   実Payloadクエリ・24並列リクエストでもエラー無しを確認済み。**
3. ~~戻せない場合の、Payload `postgresAdapter`側`pool.max`調整とVercel同時実行数設計~~
   **不要と判明（2.が「戻せる」で解決したため）。**
4. 負荷下（複数route・複数同時アクセス）で500が出ないことの検証 → **transaction poolerで
   確認済み（12並列×2セット、エラー無し）。**

詳細は`task9-preview-rehearsal-preflight-v1.md`「pooler mode切替の実施・実機検証」参照。
**Preview側は完全に完了した**（環境変数更新・redeploy・実route確認・24並列負荷確認・
`npm run build`・自動E2E、全て2026-08-23実施・成功）。migration用DATABASE_URLとVercel
runtime用DATABASE_URLの役割分離も`database-migration-runbook-v1.md`に明文化済み（commit `fb3f2c1`）。

優先順位（2026-08-23更新。1.はPreview側完全解決・Production側のみ残、2.は根本原因判明・
POC成功・route本体実装待ち）:

1. DB接続問題 → **Preview側は解決・実機検証済み。残るのはProduction側のDATABASE_URL設定
   （最初からtransaction poolerで設定する、Production環境変数の設定設計の一部）のみ。**
2. OIDC-federated audit Blob store疎通確認 → **根本原因判明（headerで渡る、dashboard操作は
   不要）・POC成功（`task9-audit-upload-endpoint-design-v1.md`参照）。3段階session route本体の
   実装がまだ残っている（着手には別途承認が要る）。**
3. 1・2が解消してから、Production環境変数の設定設計
4. 最後にTask 9計画Step 1（変更凍結宣言）

**現時点でProduction cutoverへはまだ進めない。** Preview側の実装・検証は完了したが、Production側の
DATABASE_URL・secret・KMS・audit store設定、Production resourceを使った最終export検証が未完了である。

**Production DBへの書き込み・Production Vercel環境変数の追加は、いずれも個別に明示承認を得てから
実行する。**
