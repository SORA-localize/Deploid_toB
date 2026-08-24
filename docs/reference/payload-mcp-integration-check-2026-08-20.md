---
status: reference
updated: 2026-08-20
---

# Payload MCP integration check — 2026-08-20 (Task 8 Step 5)

このファイルは Task 8 brief Step 5 が要求する「実MCP endpointのread/write制約を自動・手動で確認する」
記録。**確認できたことと確認できなかったことを両方、正直に書く**（brief本文の要求どおり）。

## 結論（先に要約）

- **実Payload Local API（`overrideAccess: false`）経由の権限制御は完全に検証済み**
  （`tests/content/mcp-access.test.ts` 51/51 PASS、`tests/content/admin-access.test.ts` 21/21
  PASS）。MCP標準tool（find/create/update/delete）は `overrideAccess: false` で
  `payload.create/update/delete/find` を呼ぶだけ（`node_modules/@payloadcms/plugin-mcp` の
  実装で確認済み）なので、この検証は「MCP経由の呼び出しが実際にどう扱われるか」の実体を
  直接証明している。
- **実MCP transport（実HTTP、実`@modelcontextprotocol/sdk`のStreamableHTTPClientTransport、
  実API key認証）での自動E2E検証（`tests/integration/mcp-endpoint.test.ts`）は
  fix round 2で12/12 PASSを3回連続で確認**。当初の断続的な失敗の真因は、後述する
  `@payloadcms/plugin-mcp`自体の重大バグ（`convertCollectionSchemaToZod()`が生成した
  Zodスキーマを一度も実際には評価していなかった——create/update toolがどのcollectionでも
  送信fieldを全て黙って捨てていた）だった。パッチ適用で解消し、以降は安定して再現しない。
- **`codex mcp list`でのenabled表示確認、および実`codex exec`経由でのbrief Step 5後半
  項目1〜9すべてを実際に完走・記録した**（下記「4. 手動チェック」参照）。

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

### 1.2 `tests/content/admin-access.test.ts`（拡張済み）

```
npx vitest run tests/content/admin-access.test.ts
→ Test Files 1 passed (1) / Tests 21 passed (21)
```

未認証・content-reader・content-publisherによるadmins CRUD拒否、`selfOrPlatformAdmin`の
実際の挙動（`find`はthrowせず自分の1件だけを返す／`findByID`は他人のdocで404）を追加確認。

### 1.3 `tests/content/migration.test.ts`（fix round 1で修正）

```
npx vitest run tests/content/migration.test.ts
→ Test Files 1 passed (1) / Tests 13 passed (13)
```

fix round 1で、Step 3/4/5のfixture-drift検証シナリオがTask 8自身のmigration commitと
前提衝突していた問題を修正済み（詳細は`task-8-report.md`のfix round 1節）。

### 1.4 `tests/content` 全体（回帰確認）

```
npx vitest run tests/content
→ Test Files 27 passed | 1 skipped (28) / Tests 460 passed | 33 skipped (493)
```

### 1.5 `tests/integration/mcp-endpoint.test.ts`（実MCP transport、fix round 2で12/12化）

```
npm run test:integration
→ Test Files 1 passed (1) / Tests 12 passed (12)
```

**3回連続で実行し、3回とも12/12 PASS**（fix round 2、真因特定・修正後）。

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

### 2.3 `@payloadcms/plugin-mcp`自体のバグ1: `updateResourceTool`が一部collectionで無限ハング

`updateResourceTool`（`node_modules/@payloadcms/plugin-mcp/dist/mcp/tools/resource/
update.js`）は`convertCollectionSchemaToZod()`の戻り値へ無条件で`.partial()`を呼ぶ。
この関数は、collectionのJSON-Schema→Zod変換が失敗した場合に、自身のcatchブロックで
`z.record(z.any())`という**`.partial()`を持たないfallback**を返しうる。結果、
`update`capabilityが有効なMCP API keyでの**あらゆるPOST**が
`TypeError: convertedFields.partial is not a function`で例外化し、`mcp-handler`内部で
unhandled rejectionとして握りつぶされたままHTTP応答が永久に返らない（実機で確認:
curlで20秒待っても0バイト）。`createResourceTool`は同じfallbackケースで
`convertedFields.shape`（undefinedになるだけで例外化しない）を使っており、この非対称性が
バグの実体。`patches/@payloadcms+plugin-mcp+3.87.1.patch`で
`updateResourceTool`を同じ防御的パターンへ修正した。

### 2.4 `@payloadcms/plugin-mcp`自体のバグ2（真因、fix round 2で特定・修正）:
`convertCollectionSchemaToZod()`が生成したZodスキーマを一度も評価していなかった

`tests/integration/mcp-endpoint.test.ts`の当初の断続的失敗（「MCP経由でcreate直後に
別接続から見えない」ように見えていた現象）を、`curl`での直接再現に切り分けたところ、
**MCPが返す「作成成功」レスポンス自体に`stableId: null, slug: null, name: null`しか
入っていない**ことが判明した——read visibilityの問題ではなく、**そもそも送信した
field値が一度も保存されていなかった**。

根本原因: `convertCollectionSchemaToZod()`（`node_modules/@payloadcms/plugin-mcp/dist/
utils/schemaConversion/convertCollectionSchemaToZod.js`）は`jsonSchemaToZod()`の出力を
`ts.transpileModule()`でCommonJSへtranspileしたあと、
`new Function('z', 'return ' + transpileResult.outputText)(z)`で評価する。ところが
`ts.transpileModule({module: CommonJS})`は**あらゆる場合に**`"use strict";`という
directive prologueを出力の先頭へ付ける。`return "use strict";\nz.object({...});`は
JavaScript的には「文字列`"use strict"`をreturnして、後続の`z.object({...})`は
到達しないdead code」という意味になる——**collectionの種類によらず常に**、
`convertCollectionSchemaToZod()`は実際にはZodスキーマではなく**文字列
`"use strict"`を返していた**（直接のNode script実行で再現・確認済み: `distributors`
と`robots`の両方で同一の現象を確認）。

この結果、`create*`/`update*` toolの`inputSchema`は実質「collectionのfieldを1つも
知らない」状態になる。`@modelcontextprotocol/sdk`のtool呼び出しは受け取った引数を
`inputSchema`（Zodの`z.object`）で`safeParseAsync`してから実際のhandlerへ渡すため
（`node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js`の
`validateToolInput()`）、Zodの既定動作（`z.object`はスキーマに無いkeyを黙って除去する）
により、`stableId`/`slug`/`name`等**MCPクライアントが送った実際のfield値は
toolのhandlerへ到達する前に消えていた**。

修正: `transpileResult.outputText`から先頭の`"use strict";`directiveを取り除いてから
評価する（`patches/@payloadcms+plugin-mcp+3.87.1.patch`）。修正後、`curl`での直接確認で
`createRobots`に`stableId='probe-fix-verify'`等を送ると、実際に`stableId`
（`"probe-fix-verify"`）が保存されて返ってくることを確認した。副次的に、`lifecycleStatus`
のような**schema上required:trueのfield**がtoolのinput schemaで正しく必須として
検証されるようにもなった（`update.js`の修正だけでは表面化しなかった、より根本的な
不具合が今回初めて可視化された）。

この2つのバグ（2.3・2.4）はどちらも**`robots`・`manufacturers`・`robot-series`・
`articles`に限らず、MCPが公開する全collectionのcreate/update toolに影響する**
（2.4は"use strict"問題なのでcollectionの種類を問わず常に発生し、2.3はさらにその上で
一部collectionをcrash対象にしていた）。修正が無ければ、Task 8が意図するeditorial
workflow（MCP経由でのcontent作成・更新）はどのcollectionでも実質機能しなかった。

---

## 3. `tests/integration/mcp-endpoint.test.ts`の当初の不安定性について（fix round 2で解消）

fix round 1完了時点では、この自動テストは12件中7件PASSで、残り5件
（create直後にfieldが見えない、という形で表面化していたもの）が不安定に失敗していた。
「別接続からのread visibility問題」と当初推測していたが、実際には上記2.4の
バグそのもの（値が保存されていない）が原因であり、read visibilityの問題ではなかった。
fix round 2でこのバグを修正したところ、`npm run test:integration`は**3回連続で
12/12 PASS**した。以前観測していた`57P01`（`terminating connection due to administrator
command`）ログは、この根本原因を修正した後は再現していない——おそらく、値が保存されず
`docs[0]`が`undefined`になったassertion失敗の周辺で、テストの後片付け
（`afterAll`のDB drop等）のタイミングがずれて副次的に出ていたものと考えられるが、
これ以上の追跡は行っていない（再現しなくなったため）。

---

## 4. 手動チェック（brief Step 5後半、`codex` CLI経由で実施）

### 4.1 事前準備

- 使い捨てDB `deploid_task8_manual_check`（`127.0.0.1:5432`）を作成し、committed
  migrationsを適用。
- Local APIで以下を投入:
  - platform-admin（bootstrap強制、`manual-owner@example.com`）
  - content-draft-writer（`manual-writer@example.com`）
  - 通常profile MCP key（`manual-writer`へbind、`robots: {find, create, update}`のみ）
  - 管理用profile MCP key（`manual-owner`へbind、`robots: {find, create, update,
    delete}`、**統合試験専用**）
  - published状態のmanufacturer 1件、robots 2件（`manual-check-robot-1/2`）——findの
    件数一致確認用。
- `next dev`をこのDBに対して起動（`http://127.0.0.1:58300`）。
- `codex mcp add deploid-content-writer --url http://127.0.0.1:58300/api/mcp
  --bearer-token-env-var DEPLOID_MCP_KEY`
- `codex mcp add deploid-content-admin --url http://127.0.0.1:58300/api/mcp
  --bearer-token-env-var DEPLOID_MCP_KEY_ADMIN`

**注記（一時的な環境調整とその復元）**: 手動チェックの実行中、この環境に既存登録されていた
別のMCP server（`dev3000`・`vercel`）がこの端末環境固有の理由で接続不能/未ログイン状態
であり、`codex exec`のMCPセッション初期化が断続的に失敗する（他サーバーの接続エラーに
巻き込まれてこちらのserverのtoolも見えなくなる）ことがあった。これらは**ユーザーの
グローバルcodex設定**（`~/.codex/config.toml`）に属する、Task 8と無関係な既存登録である。
決定論的な結果を得るため、`~/.codex/config.toml`を事前にbackupしたうえで、
`dev3000`（`enabled = false`）と`vercel`プラグイン（`enabled = false`）を**一時的に**
無効化した。手動チェック完了後、以下を実施して**完全に復元した**:
1. `codex mcp remove deploid-content-writer` / `deploid-content-admin`（本チェック用に
   追加した2件を削除）
2. `~/.codex/config.toml`をbackupから復元（`dev3000`のenabled=false行を除去、
   `vercel`プラグインのenabledをtrueへ戻す）
3. 復元後の`codex mcp list`で、`dev3000`・`vercel`が**元通りenabled表示**に戻り、
   Task 8用の2 serverが一覧から消えていることを確認した。
4. `~/.codex/config.toml`は最終的に、本チェック開始前と同じ内容（Task 8の2 serverを
   除く）になっている。

### 4.2 `codex mcp list`

```
Name                    Url                              Bearer Token Env Var  Status   Auth
deploid-content-writer  http://127.0.0.1:58300/api/mcp   DEPLOID_MCP_KEY       enabled  Bearer token
```

`enabled`表示を確認した（brief要求どおり）。

### 4.3 `content-draft-writer` credential（`deploid-content-writer`）での実tool呼び出し

全て `codex exec --approve-for-me` で、1回のexec呼び出しにつき1 tool呼び出しに限定した
プロンプトを与え、実際にcodex agentがMCP toolを呼んだ結果を記録した（`mcp:
deploid-content-writer/<tool> started/completed`のログが実際のtool実行を示す）。

| # | tool | 入力 | 結果 |
|---|------|------|------|
| 1 | `findRobots` | `{"where":"{\"_status\":{\"equals\":\"published\"}}","limit":100}` | `Total: 2 documents`（seedした2件と一致） |
| 2 | `createRobots` | `stableId='test-mcp-endpoint-draft', slug='test-mcp-endpoint-draft', name='MCP Endpoint Test Robot', lifecycleStatus='active', draft=true` | `Resource created successfully` / `"stableId":"test-mcp-endpoint-draft"` `"_status":"draft"`（id=3、全field正しく保存されていることを確認——2.4のバグ修正の直接証拠） |
| 3 | `updateRobots` | `id=3, name='MCP Endpoint Test Robot (updated)', draft=true` | `Document updated successfully` / `"name":"MCP Endpoint Test Robot (updated)"` `"_status":"draft"` |
| 4 | `updateRobots` | `id=3, _status='published'` | 拒否: `Error updating resource in collection "robots": publish-role-required` |
| 5 | `deleteRobots` | `id=3` | tool自体が利用不可（このcredentialにはdelete capabilityが無いため存在しない） |
| 6 | (tool一覧確認) | — | 利用可能tool: `createRobots`, `findRobots`, `updateRobots`のみ。admin関連toolは0件 |

項目1〜6すべてbrief期待どおり。

### 4.4 `platform-admin` credential（`deploid-content-admin`、統合試験専用の隔離key）

| # | tool | 入力 | 結果 |
|---|------|------|------|
| (tool一覧) | — | — | `createRobots`, `deleteRobots`, `findRobots`, `updateRobots`のみ。admin関連toolは0件（platform-admin credentialであってもadmin管理toolはMCPに存在しない、設計どおり） |
| 9 | `deleteRobots` | `id=3` | `Document deleted successfully`（test recordのcleanup成功） |

### 4.5 Admin管理（項目7・8・9のadmin部分）— Local API経由

`admins`はMCPから一切exposeされない設計（`lib/payload/mcp.ts`の
`MCP_EDITABLE_COLLECTIONS`にadminsを含めない）ため、上記4.4で確認したとおりMCP tool
自体が存在しない。admin管理操作はLocal API（`payload.create/update/delete`、
`overrideAccess: false`、`manual-owner@example.com`のplatform-admin session）で
直接検証した:

| # | 操作 | 結果 |
|---|------|------|
| 7 | platform-adminがtest admin作成（`content-reader`） | 成功（id=3、role='content-reader'） |
| 7 | 同じtest adminを`content-draft-writer`へ更新 | 成功 |
| 8a | test admin自身が`platform-admin`へ自己昇格 | 拒否（role変化なし、`content-draft-writer`のまま） |
| 8b | 唯一のplatform-adminが自分自身を`content-reader`へ降格 | 拒否（`platform-admin`のまま） |
| 8c | 唯一のplatform-adminが自分自身を削除 | 拒否（削除されず、1件のまま存在） |
| 9 | platform-adminがtest adminを削除 | 成功、削除後の件数=0 |
| 9 | test robotの残存確認 | 0件（MCP経由で削除済み） |

全5件PASS（`npx vitest run`、実Local API、実DB）。

### 4.6 Cleanup後の状態

- test robot（`test-mcp-endpoint-draft`）: 0件（MCP `deleteRobots`経由で削除）
- test admin（`manual-check-test-admin@example.com`）: 0件（Local API経由で削除）
- `codex mcp`登録: Task 8用の2 serverを削除済み、既存の`dev3000`/`vercel`は元の状態へ復元済み
- 使い捨てDB `deploid_task8_manual_check`: drop済み
- `next dev`（manual check用）: 停止済み

---

## 5. 未解決の懸念

- `@payloadcms/plugin-mcp`へのpatch（`.partial()`防御 + `"use strict"`除去）はupstream
  未報告。`npx patch-package @payloadcms/plugin-mcp --create-issue`でissue化する余地がある。
  特に2.4（"use strict"バグ）はcollectionの種類を問わず常に発生する、影響範囲の広い
  バグなので、優先度は高い。
