---
title: Content Restore Runbook v1
status: reference
updated: 2026-08-28
---

# Content Restore Runbook v1

`docs/plans/content-platform-migration-plan-v1.md` の Rollback セクションが要求する復旧手順書。
**Task 9 で `CONTENT_SOURCE=local` による rollback 経路が撤去された結果、これが唯一の復旧手順である。**

対象は「Production の Postgres が失われた／壊れた／内容を過去の世代へ戻す必要がある」場合。
署名済み baseline artifact を、migration 済みの空DBへ書き戻し、parity 0差分を確認してから
deploy を切り替える。**SQL の手修正では復旧しない。**

関連: [database-migration-runbook-v1.md](database-migration-runbook-v1.md) /
[content-platform-resources-v1.md](content-platform-resources-v1.md) /
[task9-production-cutover-preflight-v1.md](task9-production-cutover-preflight-v1.md)

---

## 0. この手順を実行してよい条件

すべて満たさない限り開始しない。

- 実行 role が **`platform-admin`** であること。
  `scripts/import-content-to-payload.mts` の `resolveImportUser()` は
  `content-publisher` 以上でログインできれば動くが、復旧は本手順の停止判断・
  environment marker の確認を伴うため `platform-admin` で実行する。
- 戻す先が **空DB**（migration 適用済み・content 0件）であること。
  restore は `content:import` と同じ upsert なので既存行の上へ書けてしまうが、
  本手順は「空DBへ戻す」以外を想定しない。
- 戻す artifact が **Production private audit store** にあり、
  **完了マーカー付き**であること（途中で終わった export は使わない）。

---

## 1. 停止条件（fail-closed。1つでも一致しなければ restore を開始しない）

`scripts/restore-preflight.mts` の `verifyBaselineBeforeRestore()` が、
**DBを1行も触る前に**次を検証する。1つでも失敗したら
`content:restore: refusing to write. No database change was made.` を出して exit 1 する。

| check 名 | 何を止めるか |
|---|---|
| `envelopeSchema` | envelope の形式不正 |
| `manifestSignature` | manifest の署名が本物でない |
| `artifactSignature` | artifact 本体の署名が本物でない |
| `sha256` | manifest 記載の sha256 と artifact 実体の不一致 |
| `baselineCompletion` | 完了マーカーが無い（＝途中で終わった run）／取得できない |
| `snapshotSchema` | snapshot の schema 不正 |
| `recordCounts` | manifest 記載の件数と実体の不一致 |
| `duplicateStableId` / `brokenReference` | stable ID 重複・参照切れ |
| `environmentMarker` | 対象DBの `_environment_marker` と manifest の環境が不一致 |
| `expectedEnvironment` | オペレーターが `--expected-environment` で宣言した環境と不一致 |
| `databaseResourceId` | 対象DBの resource identity と manifest の provenance が不一致 |
| `auditBlobStoreId` / `blobStoreProvenance` / `blobCredential` | artifact の置き場所と credential の identity 不一致 |
| `schemaVersion` | 対象DBの migration 世代と manifest の schema version 不一致 |
| `baselineGeneration` | **戻そうとしている artifact が、そのDBに記録済みの世代より古い**（replay 防止） |
| `baselineRunId` | `--expected-baseline-run-id` 宣言との不一致 |
| `mediaInventory` / `mediaBytes` | media のバイト列・sha256 の不一致 |

計画書 Rollback の要求「署名・hash・environment marker・provider resource ID の
どれかが一致しなければ restore を開始しない」は、上表の
`manifestSignature`/`artifactSignature`・`sha256`・`environmentMarker`・
`databaseResourceId`/`auditBlobStoreId` が担保する。

restore **後**の停止条件もある。

- `skippedMedia` — media が1件でもスキップされたら成功扱いにしない
- `postRestoreParity` — 書き戻した後、**同じ artifact と全collection の parity** を自動実行し、
  `missing/extra/changed/brokenReferences` が0でなければ exit 1 する。
  このときのメッセージは
  `content:restore: NOT successful — the database was modified but does not match the artifact.`
  であり、**DBは既に変更されている**。この状態で deploy を切り替えてはならない（§6へ）。

---

## 2. ⚠️ 最重要の落とし穴 — 公開鍵は `VERCEL_ENV` で選ばれる

`lib/content/cosignVerification.ts` の `verifyBlobWithCosign()` は、
検証に使う公開鍵を次のように選ぶ。

```ts
await writeFile(keyPath, process.env.VERCEL_ENV === 'production' ? PRODUCTION_KEY : PREVIEW_KEY, 'utf8');
```

**復旧作業はオペレーターの端末から実行するため、`VERCEL_ENV` は未設定になる。
その状態では Preview 用の公開鍵が選ばれ、Production の baseline は
`manifestSignature` で必ず失敗する。**

Production baseline を戻すときは、次のどちらかを明示すること。

```bash
export VERCEL_ENV=production
# または、鍵ファイルを明示する
export SNAPSHOT_SIGNING_PUBLIC_KEY_PATH=/path/to/deploid-snapshot-signing-pubkey-production.pem
```

これを忘れた場合の症状は「署名が壊れている」ではなく
「**正しい artifact なのに `FAIL manifestSignature`**」である。artifact を疑う前にここを確認する。

---

## 3. 必要なもの

**バイナリ**

- `cosign`（署名検証に必須。`scripts/fetch-cosign-binary.mjs` が取得するものと同じで可）
- Node.js 22.12.0 以上

**環境変数**

| 変数 | 用途 |
|---|---|
| `DATABASE_URL` | **戻す先**の空DB。ここを間違えると復旧ではなく破壊になる |
| `PAYLOAD_SECRET` | Payload の起動 |
| `VERCEL_ENV=production` または `SNAPSHOT_SIGNING_PUBLIC_KEY_PATH` | §2 |
| `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID` | Production private audit store の読み取り |
| `PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID` | `auditBlobStoreIdFor('production')` が読む store ID |
| `PAYLOAD_IMPORT_ADMIN_EMAIL` / `PAYLOAD_IMPORT_ADMIN_PASSWORD` | 書き込み実行者。`--admin-password` では渡さない（shell history / process list に残るため） |

**成果物**

- 署名済み manifest envelope（`--manifest-out` で出力されたもの）
- envelope が指す artifact 本体・detached signature・完了マーカー（store 上）

---

## 4. 手順

### Step 1. 復旧先の空DBを用意し、migration を適用する

新しい Postgres を用意する（既存 Production DB を上書きしない）。

```bash
export DATABASE_URL='<新しい空DBの接続文字列>'
npm run payload:migrate
npm run payload:migrate:status
```

**期待**: 全 migration が `Yes`。
`content:restore` は `PAYLOAD_MIGRATING=true` を立てて dev-mode schema push を止めるため、
**migration を先に当てていないDBへの restore は「table が無い」で正しく失敗する。**
これは仕様であり、回避してはならない。

### Step 2. 環境 marker を stamp する

```bash
npm run environment:stamp -- --expected production --i-know-this-is-production
```

`--expected` は必須のフラグ形式で、値だけを渡す形（`-- production`）は
`parseExpectedArg()` が受け付けない。`production` を stamp するには
`--i-know-this-is-production` の明示確認も要る。

`_environment_marker.environment` が `production` になっていること。
これが manifest の `provenance.environment` と一致しないと `environmentMarker` で止まる。

### Step 3. 停止条件を通してから restore する

```bash
export VERCEL_ENV=production          # §2。忘れると manifestSignature で必ず落ちる
export PAYLOAD_IMPORT_ADMIN_EMAIL='<platform-admin のメール>'
read -rs PAYLOAD_IMPORT_ADMIN_PASSWORD && export PAYLOAD_IMPORT_ADMIN_PASSWORD

npm run content:restore -- \
  --manifest ./cutover-baseline-manifest.json \
  --expected-environment production \
  --expected-baseline-run-id '<戻す baseline の run ID>' \
  --i-know-this-is-production
```

**`--expected-environment` と `--expected-baseline-run-id` は省略しない。**
省略しても動くが、その2つは「オペレーターが意図した対象を宣言する」ためのもので、
古い artifact を取り違えて replay する事故を止める唯一の宣言的ガードである。

**期待する出力（この行が出るまでDBは1行も変わっていない）**:

```
preflight: manifest signature, artifact signature, sha256, baseline completion, snapshot schema,
record counts, stable ids, references, media inventory (bytes + sha256), environment marker,
database resource, audit store, schema version, blob store identity — all OK
```

続けて restore が走り、最後に parity が自動実行される。

**成功の判定はこの1行だけ**:

```
content:restore: OK — the database matches the artifact on every collection.
```

成功時のみ、この artifact の世代が
`last_restored_baseline_generation` / `last_restored_baseline_run_id` としてDBに記録される。
以後、これより古い世代の artifact は署名が本物でも `baselineGeneration` で拒否される。

### Step 4. 独立に parity を再確認する

restore 内の自動 parity とは別に、明示的に確認する。

```bash
# 全collectionの完全一致
npm run content:verify-snapshot -- --manifest ./cutover-baseline-manifest.json

# stableId 部分集合の保全だけを見る別責務のチェック。
# --stable-id-subset は「このモードを明示する」ための必須フラグで、省略すると起動しない。
npm run content:verify-conservation -- \
  --manifest ./cutover-baseline-manifest.json \
  --stable-id-subset
```

`content:verify-conservation` は完全 parity を見ない（責務が別）。
全collectionの一致が要るときは `content:verify-snapshot` の方を根拠にする。

### Step 5. アプリの deploy を切り替える

**コードは巻き戻さない。** restore した artifact と**同じ migration 世代**のアプリを deploy する。
manifest の `provenance.schemaVersion` と、deploy するコミットの `migrations/` の最新世代が
一致していることを確認してから切り替える。

1. Vercel Production の `DATABASE_URL` を新しいDBへ向ける
2. `CONTENT_SOURCE=payload` であることを確認する（これ以外の値はアプリが起動時に throw する）
3. redeploy する
4. 主要 route を確認する:
   `/` `/robots` `/robots/unitree-g1` `/manufacturers` `/use-cases` `/reports` `/compare`
   `/sitemap.xml` `/admin` — 全て 200 であること
5. DNS を切り替える必要がある場合のみ、上記4が通ってから切り替える

---

## 5. やってはいけないこと

- **SQL による手修正で復旧しない。** 部分的に直したDBは、次回の baseline 世代管理と
  parity の前提を壊す。
- **`--input`（未署名 snapshot）を managed DB へ使わない。**
  `assertRestoreInputModeAllowed()` が localhost の throwaway DB か
  明示的 `--test-mode` 以外を拒否する。拒否を回避するフラグを足さない。
- **既存の Production DB へ上書き restore しない。** 必ず新しい空DBへ戻し、
  deploy の向き先を変えることで切り替える。
- **`--i-know-this-is-a-persistent-local-database` を Production 相手に使わない。**
  これは `deploid_dev` のような throwaway 名でない **localhost** DB のための
  フラグであり、managed DB 向けではない。

---

## 6. restore が途中で失敗した場合

**`refusing to write. No database change was made.` が出た場合**
DBは変更されていない。失敗した check 名（§1の表）を読み、原因を特定してやり直す。
`manifestSignature` の場合はまず §2 を疑う。

**`NOT successful — the database was modified but does not match the artifact.` が出た場合**
**DBは既に変更されている。このDBを deploy 先にしてはならない。**
このDBを破棄し、Step 1 からやり直す。失敗した check（`postRestoreParity` の
`missing/extra/changed/brokenReferences` の内訳、または `skippedMedia`）を記録する。

---

## 7. 未検証事項（この手順書の限界）

正直に記録する。以下は本手順書作成時点で**実機検証されていない**。

- **本手順を Production の実 artifact に対して通しで実行した記録は無い。**
  `tests/content/restore-enforcement.test.ts` と `media-baseline-recovery.test.ts` が
  停止条件と media 復元を検証しているが、これらは実 cosign + 実 AWS KMS 資格情報を要する
  `describe.skipIf(!canSignForReal)` 配下にあり、**CI では実行されていない**。
- §2 の `VERCEL_ENV` による鍵選択は、コードを読んで導出した事実であり、
  Production baseline に対して実際に検証したものではない。
- Blob と DB を跨いだ完全な原子性は未実装（補償削除までは実装済み）。

詳細は
[../plans/content-platform-migration-factual-audit-v1.md](../plans/content-platform-migration-factual-audit-v1.md)
の A-1 / A-4 を参照。**この手順書は「復旧の設計と停止条件の正本」であって、
「復旧が動くことの証明」ではない。**
