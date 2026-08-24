# Codex Content Workflow (Payload MCP)

このファイルは Codex CLI（または他の MCP client）が Deploid の Payload content を編集するときの
標準手順を固定する（Task 8）。MCP server は `payload.config.ts` に `createMcpPlugin()`
（`lib/payload/mcp.ts`）として組み込まれており、エンドポイントは `/api/mcp`
（`PAYLOAD_PUBLIC_SERVER_URL` と同一origin）。

## 権限モデル（先に理解すること）

MCP 経由の書き込みは、Payload の通常の Local API 呼び出しと**まったく同じ access control**
（`lib/payload/access.ts` の `contentCollectionAccess` / `createPublishGateHook`）を通る。
MCP には独立した「publish」capability は無い。標準の find/create/update/delete ツールが
`overrideAccess: false` で `payload.create/update/delete/find` を呼ぶだけであり、MCP API key に
bind された admin の role がそのまま通常の access control を通る
（`node_modules/@payloadcms/plugin-mcp/src/mcp/tools/resource/*.ts` で確認済み）。

- 通常の Codex 用 MCP API key は `content-draft-writer` role の admin へ bind する。
  draft の作成・更新はできるが、`_status: 'published'` へ直接書き込むことも、delete することも
  **できない**（collection access と `createPublishGateHook` の両方が拒否する）。
- `admins` collection と `payload-mcp-api-keys` collection（MCP API key 自体の管理）は
  MCP から一切 expose しない（`lib/payload/mcp.ts` の `MCP_EDITABLE_COLLECTIONS` に含まれない、
  かつ API key collection 自体の access は `platform-admin` 限定）。admin の作成・削除・role変更や
  MCP key の発行・削除は、Admin UI か Local API から `platform-admin` が直接行う。
- 承認済み内容の公開は `publishApprovedVersion()`（`lib/payload/publishApprovedVersion.ts`）を
  通る経路だけが唯一の手段。MCP 経由でこれを直接呼ぶ手段は無い——人間の `content-publisher` が
  Admin UI（または別途用意する公開UI/CLI、Task 9 想定）で承認・公開する。
- Media の binary upload は本 task では MCP から expose していない。将来 upload tool を明示的に
  許可する場合は、別途レビューのうえ opt-in する。

## 標準ワークフロー（この順序を守る）

```text
schema取得
→ 対象と参照先を検索
→ draft作成/更新
→ domain validation
→ diff要約
→ 人間のAdmin review
→ content-publisherが公開
```

1. **schema取得**: 対象 collection の `find<Collection>` ツール（または人間から渡された
   field 一覧）で現在の field 構成を把握する。`lib/specSchema.ts` / `lib/tagRegistry.ts` など、
   spec key・tag value のレジストリを外れた値を書き込まない。
2. **対象と参照先を検索**: `find<Collection>` で編集対象の既存 document を探す。新規作成の場合は
   `stableId` の衝突が無いか確認する。`manufacturerId` 等の relationship は、対象の
   `stableId` から Payload 内部 id を解決してから渡す（domain の `stableId` を直接
   relationship 値として渡せない）。
3. **draft作成/更新**: `create<Collection>` / `update<Collection>` ツールを **`draft: true`**
   付きで呼ぶ。`_status: 'published'` を送らない（送っても拒否される）。
4. **domain validation**: `npm run validate:data` 相当のチェックは Payload 側では
   publish 時（`validateForPublish`）にしか走らない。draft の時点で、必須になる想定の
   field（`summary` / `sources` など）が埋まっているか、事前に自己点検する。
5. **diff要約**: 変更内容（新規 field、変更前後の値、追加した source URL）を日本語で簡潔に
   要約し、人間のレビュー担当へ提示する。
6. **人間のAdmin review**: 要約をもとに、人間（Admin UI にアクセスできる `content-reader` 以上の
   role）が内容を確認する。この時点で MCP 経由の書き込みはこれ以上進めない。
7. **content-publisherが公開**: レビューが完了したら、`content-publisher` 以上の role を持つ
   人間が Admin UI（または承認済み公開の運用手順）を通じて `publishApprovedVersion()` を呼ぶ。
   Codex 自身はこのステップを実行しない（実行しようとしても拒否される設計）。

## MCP credential の扱い

- 通常profile（`content-draft-writer` に bind された key）と管理用profile
  （統合試験専用、`platform-admin` に bind された key）は別々に発行し、別々に保管する。
  管理用profileは統合試験以外で使わない。
- API key の値そのものは Git・チャット・監査 artifact のどこにも書かない。
  `.env.example` にも実値は置かない（`PAYLOAD_MCP_LOCAL_TEST_API_KEY` は
  ローカル検証専用のプレースホルダ変数名で、値は空のまま commit する）。

## 参照

- `lib/payload/mcp.ts` — MCP plugin の実際の設定（expose する collection、
  API key collection の access lockdown）。
- `lib/payload/access.ts` — `createPublishGateHook` / `contentCollectionAccess`（実際の gate）。
- `lib/payload/publishApprovedVersion.ts` — 唯一の公開経路。
- `docs/reference/payload-mcp-integration-check-*.md` — 実MCP transport経由での検証記録。
