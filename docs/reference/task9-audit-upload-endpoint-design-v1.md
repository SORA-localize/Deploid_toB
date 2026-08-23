---
status: reference
updated: 2026-08-23
---

# Audit Blob store upload endpoint — 設計書 v1

**この文書は設計のみで、実装はまだ一切していない。** 実装に着手する前に、特に「## 未決事項」の
解決（プロジェクトオーナーの判断が要る）を先に済ませること。

**2026-08-23、プロジェクトオーナー確認済みの実行順序**:

1. この設計書自体はcommitしてよい。
2. **実装前に最小POCを作る**（詳細下記「## POC計画」）。(a) cosignバイナリ同梱を本実装として
   確定する前に、実際にVercel Node Functionで動くかを検証する。
3. POCがPreviewで通った場合のみ、3段階session route本体の実装へ進む。
4. **POCが失敗した場合は、pure-JS再実装ではなく、Option C（外部で検証済みであることを別の署名で
   routeへ委譲する設計）を改めて設計し直す。** 「## 未決事項」の(b)は採用しない。
5. **POC未確認のままroute本体やProduction環境変数設定へ進まない。**

session flow自体は下記の内容で良いが、実装時に必須の追加事項がある（「## session実装時の
追加必須事項」参照）。

## 背景

`docs/reference/task9-preview-rehearsal-preflight-v1.md`「Step 2追試」で、Vercel Functionの
runtimeでは `VERCEL_OIDC_TOKEN` が `process.env` ではなく **`x-vercel-oidc-token` request header**
（[Vercel公式docs](https://vercel.com/docs/oidc)で確認済み）でしか渡らないことが判明した。
現行の `scripts/snapshotObjectStore.mts`（`resolveBlobCredential()`）は `process.env` しか
見ておらず、かつ `scripts/export-content-snapshot.mts` の `--upload` フローは純粋なCLIスクリプト
（`isDirectRun` guard）で、そもそも `Request` オブジェクトに触れる場所が無い。CLI/build/local dev
経路が得られるのは `vercel env pull` 由来の "development" scope tokenで、これは
`deploid-audit-preview`/`deploid-audit-production` のOIDC trustに拒否される（実機確認済み）。

つまり、cutover baseline snapshot（Task 9計画Step 2、`content:export -- --upload`）は
**現状の設計のまま実行しても、audit Blob storeへは構造的に到達できない**。

## 方針: 分割パイプライン（Option A）

- 署名（cosign + AWS KMS credential）は**従来通りCLIで実施**。ここは十分テスト済みで、変更しない。
- **upload だけ**を新設の保護route経由にし、そのroute内で `x-vercel-oidc-token` header を取得して
  OIDC-federatedなBlob writeを行う。
- 単純な「POST body → `put()`」の薄いproxyには**しない**。「署名検証済みartifactだけを受け取る
  専用upload session」として設計する（後述）。

全部Function化（cosignごとVercel Function内で実行）・cosignバイナリをFunctionへ同梱、の2案は
下記「## 未決事項」の理由により今回は採用しない方向で設計している。

## 未決事項（実装着手前に解決必須）

### 最優先: route内での署名検証は技術的に可能か

現行の署名検証（`verifyBlobWithCosign`、`export-content-snapshot.mts:526-564`）は**例外なく
実cosign CLIバイナリを`execFileSync`で呼んでいる**。この codebase 内に pure-JS 検証経路は
一つも存在しない（`verifyCanonicalJson`・`verifyManifestSignature`・`content:verify-snapshot`・
`content:verify-conservation`・restoreのbaseline検証、すべて同じ`execFileSync('cosign', ...)`に
帰着する）。標準のVercel Function runtimeにcosignバイナリは存在しない。

「署名検証前にBlobへ1バイトも書かない」というroute側の必須条件を満たすには、次のいずれかを
選ぶ必要がある。**この選択自体が実装着手のblocker。**

| 選択肢 | 内容 | 懸念 |
|---|---|---|
| (a) cosignバイナリをこのrouteのFunctionへ同梱 | Vercel Functionsは現在package sizeが最大5GBまで対応（cosign単体は数十MB程度）。`vercel.json`のfunction設定でバイナリを含める | Linux runtime向けのstatic buildの入手・動作確認、sandboxがexec許可するかの実機確認が必要。前例が無いため未知数 |
| (b) cosignの署名bundle形式をpure-JS（Node標準`crypto.verify`）で再実装して検証 | KMS keyによる非keyless署名なので、bundle形式（`--new-bundle-format=false`、`base64Signature`フィールドを持つ「旧形式」）が単純なECDSA署名である可能性が高い | 署名対象バイト列・エンコーディングの正確な仕様をcosignのソース/公式docsで裏取りしないまま実装すると、検証ロジック自体に脆弱性を作りかねない（セキュリティクリティカルな箇所）。今回のセッションでは未検証・未確認 |
| (c) 検証はrouteの外（cosignが使える環境）で行い、routeはその結果を別の手段で信頼する | 例: CIジョブが検証してから署名付きrequestを発行する等 | 新しい信頼委譲の問題を作る。「route自身が検証してから書く」というご指摘の趣旨から外れる可能性 |

**推奨: (a)を先に実機検証する。** (b)はセキュリティクリティカルな再実装であり、cosignの
bundle形式を正確に裏取りできない限り着手しない方が安全。(a)が技術的に無理だと判明した場合のみ
(b)を本格検討し、その際は外部レビュー（cosignのbundle形式の第三者検証）を挟む。

## Endpoint設計（"署名検証済みupload session"）

3段階のsession型flowにする。単発POSTで完結させない理由: 1回のHTTPリクエストで
snapshot本体・signature bundle・media（実データでは51件）を全部送ると、リクエストサイズ・
タイムアウト・部分失敗時のロールバック粒度の面で扱いにくい。「まずmanifestを検証してsessionを
確立し、object単位で個別に送る」形にすることで、既存CLIの`exportSignedBaseline()`が持つ
per-object PUTループ・失敗時ロールバック（`written`配列を逆順に`store.remove()`）の構造とも
自然に対応する。

### Step 1: `POST /api/admin/audit-upload/session`

- body: `SignedBaselineEnvelope`（`manifest` + `manifestSignature`）全体。
- 認証（後述「## 認証設計」）を通過したら:
  1. `manifestSignature`を検証する（**上記未決事項の解決策が確定するまでここは実装不能**）。
     検証NGなら即401/422、何も書かない。
  2. 検証OKなら、`manifest`から**許可object一覧**を抽出する: 
     - snapshot object: `manifest.storage.objectKey`・`manifest.sha256`・(size は snapshot bytes 側で別途要求)
     - signature bundle object: `manifest.signature.detachedSignatureObjectKey`
     - media object群: `manifest.mediaInventory[].objectKey`/`sha256`/`size`（既存の`MediaInventoryEntry`）
  3. `checkBlobStoreSelection()`（既存関数、無変更）で `manifest.storage.storeId` と
     `manifest.provenance.environment` を、resolveされたcredentialと照合する。不一致は拒否。
  4. session を作成し、許可object一覧・`manifest`のsha256（session全体のdigestとして）・
     有効期限（例: 30分）を保存する（保存先は「## session状態の保存先」参照）。
  5. session ID（ランダム、推測不能な値）を返す。**この時点ではまだBlobに何も書かない。**

### Step 2: `POST /api/admin/audit-upload/session/:sessionId/object`

- body: 生バイト列（対象は snapshot 本体、signature bundle、または media 1件のいずれか）。
- header または query で対象の `objectKey` を指定させるのではなく、**アップロードされた
  バイト列のsha256を計算し、session保存済みの許可一覧の中から「sha256が一致するもの」を
  route側が特定する**（呼び出し側にobjectKeyを自己申告させない——ここが条件2「任意のobject key
  を書けないようにする」の核心）。一致しなければ拒否。size もこの時点で照合する。
- 一致したら、そのobjectKeyが持つ**固定prefix**（`cutover-baseline/`、media は
  `${objectKey}.media/`）に収まっているかも機械的に再確認する（`resolveWithinRoot`相当の
  文字列ベースの許可prefixチェックを新規実装する——既存の`resolveWithinRoot`はファイルパス用
  なのでBlob object key用に新しく書く。絶対パス的な形・`..`・意図しないprefixを拒否）。
- 全部通ったら、その1リクエストぶんだけ実際に`put()`する。sessionの「アップロード済みobject」
  記録を更新する。
- **このstepは何度でも呼べる**（object数ぶん）。

### Step 3: `POST /api/admin/audit-upload/session/:sessionId/complete`

- sessionが持つ許可object一覧の**全件**がStep 2で実際にアップロード済みであることを確認する。
  1件でも欠けていれば拒否（何も書かない）。
- 全件確認できたら、既存の`BaselineCompletionMarker`と同じ形（`artifactSha256` /
  `signatureSha256` / `mediaInventorySha256` / `baselineRunId` / `completedAt`）で
  completion markerを最後に書く。**これは既存ロジックと同じく「全部揃うまでmarkerを書かない」
  という制約をrouteの外(CLI)ではなくroute自身が強制する**、という違いがある。
- session を破棄（完了済みとしてmark、以降Step 2/3の再利用を拒否 = replay防止）。

### 失敗・timeout時のcleanup

- session有効期限切れ、または明示的な `DELETE /api/admin/audit-upload/session/:sessionId`
  （CLIが異常終了時に呼ぶ）で、そのsessionでStep 2により実際にアップロード済みのobjectを
  全部削除する（既存CLIの逆順rollbackと同じ考え方）。
- 期限切れだが誰も明示的にcleanupを呼ばなかった場合に備え、定期的な掃除の要否は実装時に検討する
  （バッチジョブか、次回session作成時に期限切れ残骸を一掃するlazy cleanupか）。

### session状態の保存先

Vercel FunctionはstatelessなのでStep 1〜3を跨ぐ状態を持たせる場所が要る。新しいPayload
collection（例: `audit-upload-sessions`、`platform-admin`のみアクセス可、TTL/期限切れ管理は
アプリ側ロジックで）に持たせる案が、既存のPostgresをそのまま使えて一番自然。

## 認証設計（条件4対応）

MCP API key単体には依存しない。以下を全部満たすことを要求する。

- **platform-admin相当のscope**を持つ認可情報であること（既存のrole check、`isPlatformAdmin`
  パターンを踏襲）。
- **Task 9 baseline upload専用のscope**を別途持つ（既存のMCP API keyがそのまま使えるとは
  限らない——「編集権限」と「audit storeへの書き込み権限」は別の権限であるべき）。
  既存の`mcp_api_keys` collectionを流用するか、専用collectionを新設するかは実装時に決める。
- **request ID**: Step 1呼び出し時にCLI側が生成したrequest IDをbodyまたはheaderで送り、
  route側がsession作成時に記録・以降のStep 2/3で同じrequest IDが使われていることを確認する
  （operatorの意図しない別runとの混線防止）。
- **manifest digest**: session ID自体をmanifestのsha256から決定的に導出するのではなく、
  session作成時に`manifest`のsha256を記録し、Step 2/3のすべてのアクセスがこのsessionに
  紐づいていることを確認する（すでに上記session設計に含まれる）。
- **リプレイ防止**: 一度completeしたsessionは再利用不可。同じmanifestで再度Step 1を呼んだ場合、
  新しいsessionとして扱うか拒否するかは実装時に決める（cutover baselineは
  `baselineGeneration`で単調増加する設計なので、同一generationの再送は疑わしいものとして
  拒否する方向が安全）。

## oidcTokenOverride（条件5対応）

- `resolveBlobCredential(env: EnvLike = process.env)` の**環境変数経路は無変更**（CLI/build/local
  devはそのまま`process.env.VERCEL_OIDC_TOKEN`を読む）。
- 新しく `resolveBlobCredential(env, oidcTokenOverride?: string)` のように**明示的な追加引数**を
  持たせ、route側だけがこの引数へ `request.headers.get('x-vercel-oidc-token')` の値を渡す。
  env経路より優先する。
- **tokenを`process.env`へ書き込まない・responseへ含めない・`console.log`／loggerへ出さない。**
  既存の`req.payload.logger`呼び出し箇所も含め、実装時にこの制約を明示的にレビューする。

## テスト方針（条件6対応）

- **単体テスト**（実Preview接続不要）: 認証なし→401、署名検証NG→何も書かれない、
  object key/sha256/size不一致→拒否、許可prefix外のkey→拒否、Step 3で欠けているobjectがある→
  拒否・markerが書かれない、session期限切れ→拒否、replay（completeしたsessionの再利用）→拒否。
  Blob呼び出し自体はmockまたはfake storeで検証する（このsessionの他の作業と同様、実ネットワーク
  無しで実行できる範囲は全部これで担保する）。
- **実機確認（Previewのみ、1回、別途明示承認後）**: 署名検証・store ID/environment照合・
  全object・completion marker・失敗時cleanupのすべてを、実Preview deployment + 実
  `deploid-audit-preview`に対して確認する。Productionには一切触れない。

## session実装時の追加必須事項（2026-08-23、プロジェクトオーナー指示）

上記「Endpoint設計」の3段階flowに加えて、実装時は以下を必須とする。

- **session作成はmanifest signature検証成功後にのみ行う。** 検証前にsession自体を作らない
  （検証NGの場合、session IDすら発行しない——「未検証のsessionが後から使われる」余地を作らない）。
- **session objectリストはclient申告値ではなく、署名検証済みmanifestから生成する。** Step 1の
  bodyでclientが「このobjectをuploadさせてほしい」と申告する形にしない。許可object一覧は
  route側が検証済み`manifest`の中身（`storage.objectKey`・`signature.detachedSignatureObjectKey`・
  `mediaInventory[]`）だけから機械的に導出する。
- **complete時に、全objectの実在・digest・sizeを（sessionの内部記録だけでなく）再確認する。**
  Step 2で「アップロードした」と記録した内容を鵜呑みにせず、Step 3の時点で実際にBlobへ
  `head()`等で問い合わせて実在・sha256・sizeを再照合してからmarkerを書く（TOCTOU対策）。
- **marker書き込みは最後の1回だけ。** 二重書き込み・再実行時の上書きを防ぐ（Vercel Blobは
  `allowOverwrite: false`前提を維持する——既存のexport CLIと同じ制約）。
- **`audit-upload-sessions`（またはそれに類するcollection）追加に伴うmigrationは別途レビューする。**
  Task 3.5の既存migration運用（`docs/reference/database-migration-runbook-v1.md`）に従い、
  commitする migration ファイルは実装task内でレビュー対象にする。
- **replay・TTL・cleanupのテストを必須にする。** 「## テスト方針」の単体テスト一覧に、
  期限切れsessionでのStep 2/3拒否、complete済みsessionの再利用拒否、TTL経過後の残骸cleanup
  （lazy/batch いずれの設計でも）を明示的に含める。

## POC計画（実装着手前に必須）

route本体実装ではなく、**最小限のスクラッチ実装**で以下4点だけを実Vercel環境で確認する。
POCのコードはPOC専用であることが分かる形にし、確認が終わったら削除する
（`src/app/api/debug-oidc-check`と同じ運用——一時debug routeとしてcommit→実機確認→削除）。

1. **Linux用cosign binaryをVercel Node Functionへ同梱**できるか（`vercel.json`のfunction設定、
   もしくはNext.jsの`outputFileTracingIncludes`等でbinaryをbundleに含める）。
2. 同梱したbinaryに対して `child_process.execFile('cosign', ['version'], ...)` が実際に
   Vercel Function runtime上で成功するか。
3. **実署名bundle**（このprojectの実KMS鍵で実際に作った`.cosign.bundle`）を使って
   `cosign verify-blob` がFunction内で成功するか（`--insecure-ignore-tlog=true`、既存CLIと
   同じオプション）。
4. `x-vercel-oidc-token` headerの値を明示credentialとして `@vercel/blob` の `head()`/`put()`へ
   渡し、実際に`deploid-audit-preview`への読み書きが成功するか（前回のdebug route調査で
   header自体の存在は未確認のままだった——これも今回のPOCで併せて確認する）。

**POC成功の判定基準**: 上記4点すべてが実Preview deploymentで確認できること。1つでも失敗した場合は
「## 未決事項」の(a)を諦め、pure-JS再実装（非推奨）ではなく **Option C
（外部で検証済みであることを別の署名でrouteへ委譲する設計）を改めて設計し直す**。

## 現状維持される部分（再掲）

- cosign署名・AWS credential・`content:verify-snapshot`/`content:verify-conservation`の検証経路は
  無変更。
- local-throwaway向けの`createLocalDiskObjectStore`経路は無変更。
- CLI単体でのbuild/local実行（`process.env.VERCEL_OIDC_TOKEN`読み取り）は無変更。
