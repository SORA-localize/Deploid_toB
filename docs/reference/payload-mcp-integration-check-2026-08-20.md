---
status: reference
updated: 2026-08-20
---

# Payload MCP integration check — 2026-08-20 (Task 8 Step 5)

このファイルは Task 8 brief Step 5 が要求する「実MCP endpointのread/write制約を自動・手動で確認する」
記録。**確認できたことと確認できなかったことを両方、正直に書く**（brief本文の要求どおり）。

## 結論（先に要約）

- **実Payload Local API（`overrideAccess: false`）経由の権限制御は完全に検証済み**
  （`tests/content/mcp-access.test.ts` 51/51 PASS、`tests/content/admin-access.test.ts` 含む）。
  MCP標準tool（find/create/update/delete）は `overrideAccess: false` で
  `payload.create/update/delete/find` を呼ぶだけ（`node_modules/@payloadcms/plugin-mcp` の
  実装で確認済み）なので、この検証は「MCP経由の呼び出しが実際にどう扱われるか」の実体を
  直接証明している。
- **実MCP transport（実HTTP、実`@modelcontextprotocol/sdk`のStreamableHTTPClientTransport、
  実API key認証）での自動E2E検証（`tests/integration/mcp-endpoint.test.ts`）は、
  接続確立（`client.connect()` = initialize handshake）までは複数回安定して成功したが、
  create/update等の実際のtool呼び出しシーケンスを最後まで安定して通す前にPostgres接続が
  `57P01`（`terminating connection due to administrator command`）で切断される事象が
  2回連続で再現し、原因を完全には特定できなかった。このため、実MCP transport越しの
  read/write制約の自動E2E検証は**未完了**。詳細と発見した副産物（`@payloadcms/plugin-mcp`の
  実バグ1件を特定・patch-package修正済み）は下記。
- `codex mcp list` はCLIの動作自体は確認できたが、Deploidの MCP serverをcodexへ登録して
  実際にtoolを呼ぶ手順（brief Step 5後半の項目1〜9）は、上記の不安定性のため実行しなかった
  （不安定な状態で「できたはず」と報告することを避けるため）。

---

## 1. 実施した自動テスト

### 1.1 `tests/content/mcp-access.test.ts`（実Payload Local API、overrideAccess: false）

```
DATABASE_URL=postgresql://hori@localhost:5432/deploid_task8_test（使い捨てlocal Postgres、
  実行直前に payload:migrate でcommitted migrationsを適用したクリーンな状態）
npx vitest run tests/content/mcp-access.test.ts
→ Test Files 1 passed (1) / Tests 51 passed (51)
```

`MCP_EDITABLE_COLLECTIONS`（`lib/payload/mcp.ts`）の7 collection全てについて、
content-draft-writer roleでのcreate draft成功・`_status: published`直接指定の拒否
（create/update両方）・delete拒否、platform-adminでのdelete成功をtable-drivenで確認。
`robots`collectionではbrief Step 1のコード例のシナリオ（draft作成→更新→published拒否→
delete拒否→`publishApprovedVersion()`経由でのみ公開成功）をend-to-endで確認。加えて
`payload-mcp-api-keys`collection自体のaccess（`platform-admin`限定、Task 8の過程で見つけた
fail-open — 下記参照）と、`overrideAccess: true`でcollection accessを迂回しても
`createPublishGateHook`（beforeChange）が単独で公開遷移を拒否することも確認済み。

詳細は `tests/content/mcp-access.test.ts` 本体、および `.superpowers/sdd/
content-platform-migration-plan-v1/task-8-report.md` を参照。

### 1.2 `tests/content/admin-access.test.ts`（拡張済み）

```
npx vitest run tests/content/admin-access.test.ts
→ Test Files 1 passed (1) / Tests 21 passed (21)
```

未認証・content-reader・content-publisherによるadmins CRUD拒否、`selfOrPlatformAdmin`の
実際の挙動（`find`はthrowせず自分の1件だけを返す／`findByID`は他人のdocで404）を追加確認。

### 1.3 `tests/content` 全体（回帰確認）

```
npx vitest run tests/content --exclude "tests/content/migration.test.ts"
→ Test Files 26 passed | 1 skipped (27) / Tests 447 passed | 33 skipped (480)
```

Task 8の変更（MCP plugin追加、`payload-mcp-api-keys`のaccess lockdown、`user`fieldの
`required: false`化）が既存のcontent test群を壊していないことを確認。

### 1.4 `tests/integration/mcp-endpoint.test.ts`（実MCP transport、未完了）

`next dev`を子processとして実際に起動し、実`@modelcontextprotocol/sdk`の
`StreamableHTTPClientTransport`で `/api/mcp` へ接続、`content-draft-writer`役割の
MCP API keyを使ってfind/create/update/delete相当のtoolを呼ぶ設計で実装した
（`npm run test:integration`、`vitest.integration.config.ts`）。

**実際に確認できたこと**:
- `next dev`が使い捨てDBに対して正常に起動し、`/api/mcp`が疎通すること（GET応答:
  未認証は401 `Unauthorized`、認証付きは405 "Method not allowed"のJSON-RPC封筒——
  どちらも実際にレスポンスが返る）。
- 実`StreamableHTTPClientTransport`での`client.connect()`（initialize handshake）が
  複数回、安定して成功すること（「next dev ready + warm-up POST complete」まで到達し、
  接続確立ログが出力される）。

**確認できなかったこと**:
- create/update等の実際のtool呼び出しを含む一連のシーケンスを最後まで安定して完走させること。
  実行のたびに、シーケンスの途中でPostgres接続が`57P01`（`terminating connection due to
  administrator command`）で切断され、以降のtestがカスケード的に失敗する
  （`docs[0]`が見つからない、等の形で表面化）。2回連続で同じ形で再現した。
- 原因は完全には特定できなかった。可能性として検討したが確定に至らなかった仮説:
  同一test file内で複数の`describe`（credential別）が同じ`setupPayload`（Local API接続）を
  共有していること、`afterAll`での`dropThrowawayDatabase()`（`DROP DATABASE ... WITH
  (FORCE)`——名前の通り、接続中のsessionを強制切断する）が想定より早いタイミングで
  発火している可能性、または`next dev`子process側の接続プールのライフサイクルとの
  何らかの競合。断定できる証拠は得られていない。
- コントローラーの指示により、これ以上の`test:integration`再実行による調査は行っていない
  （不安定な状態のまま繰り返し再実行するより、正直に「未完了」と記録することを優先した）。

### 1.5 実施しなかったこと

- `codex mcp list`でDeploidのMCP serverを実際に登録し、brief Step 5後半の項目1〜9
  （published robotのfind件数一致、draft作成、draft更新、`_status: published`拒否、
  delete拒否、admins find/create/update/delete拒否、隔離platform-admin credentialでの
  admin管理、自己昇格等の拒否、cleanup）を実際にcodex CLI経由で1件ずつ実行することは
  行っていない。上記1.4の不安定性がある状態で実行しても、結果の信頼性を主張できないため。
  `codex mcp list`コマンド自体はこの環境で実行可能であることは確認した（既存の別MCP server
  ——`dev3000`・`vercel`等——が登録・表示されることを確認済み）。

---

## 2. Task 8の過程で見つけた実装上の問題（brief範囲外の追加修正、実施済み）

### 2.1 `payload-mcp-api-keys`collectionのfail-open access

`@payloadcms/plugin-mcp`が自動生成する`payload-mcp-api-keys`collectionは既定で`access`を
一切指定せず、Payloadの`defaultAccess`（`Boolean(user)`——なんらかの認証済みuserであれば許可）
だけが効く。`user`fieldにも独自accessが無いため、`content-reader`roleの管理者でも
platform-admin紐づけのMCP API keyを自作でき、MCP越しにplatform-adminとして振る舞えて
しまう（実機で未修正状態を確認済み）。`lib/payload/mcp.ts`の`overrideApiKeyCollection`で
`platform-admin`限定へ修正した。`tests/content/mcp-access.test.ts`で検証済み。

### 2.2 `user_id`列のNOT NULL制約とFKのON DELETE SET NULLの自己矛盾

`payload-mcp-api-keys.user`fieldは既定`required: true`だが、生成されるFKは
`ON DELETE SET NULL`——MCP keyが紐づいているadminを削除しようとすると、
`null value in column "user_id" ... violates not-null constraint`で削除transaction全体が
壊れる（実機で再現・特定済み。admin削除機能そのものが壊れる重大な問題）。
`overrideApiKeyCollection`で`user`fieldを`required: false`へ緩めて解消した。
migration（`migrations/20260819_154647_add_payload_mcp_api_keys.ts`）にも反映済み。

### 2.3 `@payloadcms/plugin-mcp`自体のバグ: `updateResourceTool`が一部collectionで無限ハング

`updateResourceTool`（`node_modules/@payloadcms/plugin-mcp/dist/mcp/tools/resource/
update.js`）は`convertCollectionSchemaToZod()`の戻り値へ無条件で`.partial()`を呼ぶ。
この関数は、collectionのJSON-Schema→Zod変換が失敗した場合（`type: 'json'`fieldを持つ
collection——`robots`/`manufacturers`/`robot-series`/`articles`が該当——で実際に失敗する）、
自身のcatchブロックで`z.record(z.any())`という**`.partial()`を持たないfallback**を返す。
結果、`update`capabilityが有効なMCP API keyでの**あらゆるPOST**（`tools/list`すら含まない、
`initialize`の時点）が`TypeError: convertedFields.partial is not a function`で
例外化し、それが`mcp-handler`内部でunhandled rejectionとして握りつぶされたまま
HTTP応答が永久に返らない（実機で確認: curlで20秒待っても0バイト、`next dev`のログに
`❌ Tool: Update robots Failed to register.`）。

`createResourceTool`は同じfallbackケースで`convertedFields.shape`（undefinedになるだけで
例外化しない）を使っており、この非対称性がバグの実体。`patches/
@payloadcms+plugin-mcp+3.87.1.patch`（`patch-package`、`postinstall`で自動適用）で
`updateResourceTool`を同じ防御的パターンへ修正した。修正後、`curl`での直接確認では
初回POSTが0.1秒で正常応答することを確認済み（`docs/reference/`本ファイル作成の過程で
別途確認、`tests/integration/`の自動テストとは別に手動で再現・修正・検証した）。

この修正は`robots`・`manufacturers`・`robot-series`・`articles`——つまり`MCP_EDITABLE_
COLLECTIONS`の過半数——でMCPの`update`capabilityを実用可能にするために必須。パッチ無しでは
Task 8が意図するeditorial workflow（brief Step 1のコード例が使う`robots`のupdate）自体が
実質的に機能しない。

---

## 3. 未解決の懸念

- `tests/integration/mcp-endpoint.test.ts`の`57P01`切断は、上記2.3のバグとは別の、
  未解明の問題。パッチ適用後も2回連続で再現しており、`test:integration`は現状
  **信頼して緑と主張できる状態ではない**。次にこのファイルへ着手する際は、
  `setupPayload`と`next dev`子processの接続ライフサイクルの分離
  （例: `setupPayload`をtestごとに開閉する、`dropThrowawayDatabase`の前に
  `next dev`の完全終了を厳密に待つ、等）から調査するとよい。
- `@payloadcms/plugin-mcp`のpatchはupstream未報告。`npx patch-package @payloadcms/plugin-mcp
  --create-issue`で issue化する余地がある（このセッションでは未実施）。
