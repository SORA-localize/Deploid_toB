---
status: reference
updated: 2026-08-22
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
- `npm run build`が実データで成功する

**Preview rehearsalでは確認できていない、Production固有の未検証事項**:

1. **Production Vercel環境変数が現状ほぼ未設定**（下記「Production環境変数の現状」参照）。
   Preview は本セッション中に個別に埋めたが、その作業は**Production環境変数には一切適用していない**。
2. **Step 2（OIDC-federated audit Blob store疎通）が Preview でも未実施のまま**。
   `deploid-audit-production`も同じ制約（実Vercel Function runtimeからしか到達できない）を持つため、
   Production cutover当日に**初めて**疎通確認することになる想定は避けたい。
3. **cosignによる実署名（KMSを使った実際のexport --upload）を、このセッションでは一度も実行していない。**
   Preview/Productionどちらの環境でも、`content:export -- --upload`の実行経路（署名 → private
   Blob storeへの書き込み → 検証）を通しで検証したことがない。Task 5で機構は実装・単体検証済みだが、
   実resourceに対するend-to-end実行は未実施。
4. Production Postgresは **table数0**（本セッションで読み取り専用確認済み、2026-08-22）。
   これはTask 0記録時点と変わっていない——Production は一度もmigrationを適用されていない。

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

- [ ] `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`（または同等の認証手段）が
      Vercel Function runtimeでcosign署名にどう渡る設計かを確認する。未設計なら先に設計する。
- [ ] `BLOB_STORE_ID`がPayload/exportの実行パスで実際に読まれているか
      （`scripts/snapshotObjectStore.mts`のOIDC経路が実際に踏まれる条件）を確認し、Production側で
      設定が要るかどうかを確定する。
- [ ] Step 2相当（OIDC-federated audit Blob store疎通）を、**まずPreviewで**実Vercel Function経由
      （一時的な管理用API routeか、`vercel dev`のOIDC federation）で確認しておく。Production当日に
      これを初めて試す状態を避ける。
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
| 2 | cutover直前export（署名付きartifactをaudit storeへ） | 未実施（上記チェックリスト参照） | end-to-end未検証。Production当日が初回実行にならないようにする |
| 3 | production import・parity | 同じ`content:import`/`content:compare`をPreviewで実証済み（51/51 media含む） | Production DATABASE_URL・env varが揃っていることが前提 |
| 4 | Vercel Previewで`CONTENT_SOURCE=payload`有効化・`npm run check`・E2E | Preview rehearsalのStep 6として未実施のまま残っている | Step 4自体はPreview環境が対象なので、本番着手前にここで一度潰しておける |
| 5 | 主要画面目視確認 | 未実施 | Step 4と同時にPreviewで先に済ませられる |
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

上記チェックリストを埋める作業(特にAWS credential/OIDC疎通の設計確認)を先に行うか、
Task 9計画のStep 1(変更凍結宣言)から着手するか、方針をあなたに確認してから進める。
**Production DBへの書き込み・Production Vercel環境変数の追加は、いずれも個別に明示承認を得てから
実行する。**
