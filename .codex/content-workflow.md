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
   - **配列型フィールドは全置換される（部分マージ・追記APIは無い）**: Payloadの`update`は、
     渡さなかったtop-levelフィールドは現在値を保持するが、渡した配列型フィールド
     （`array`/`hasMany` relationship）は丸ごと新しい値に置き換わる。「1件だけ追加」のつもりで
     新しい1件だけを渡すと、既存の要素は警告もエラーもなく全て消える。これはDeploid独自の
     不具合ではなくPayload標準仕様で、Admin UI編集フォームは常に現在値を全フィールド
     読み込んでから保存するためこの事故が起きない。**MCP/API経由で配列型フィールドを
     更新するときは、必ず先に`find<Collection>`（`draft: true`）で現在の配列全体を取得し、
     追加・変更後の配列全体を組み立ててから`update`に渡す。**
   - **二次的な保険（未検証）**: Payload公式ドキュメントによれば、Versions機能は
     ドキュメント単位だけでなくフィールド単位・値単位でのロールバックにも対応する
     （https://payloadcms.com/docs/versions/overview）。本プロジェクトも`versions`を
     有効化しているため、上記の事故が起きてもAdmin UIの履歴から該当フィールドだけ復元
     できる可能性が高い。ただし**このプロジェクトで実際に配列フィールド単位の復元操作を
     試したことは無く、確認は取れていない**。事故発生時はまずこの復元経路を試し、
     不可能だった場合はこのファイルの記載を修正すること。
   - 主な配列型フィールド一覧（2026-09-08時点、`collections/`のschemaより。全collection共通で
     `sources`は必須の配列型）:
     - manufacturers: `sources`, `domesticDistributors`
     - distributors: `sources`, `handledManufacturerIds`, `handledRobotIds`, `acquisitionMethods`
     - robot-series: `sources`, `industryTags`, `taskTags`
     - robots: `sources`, `procurementModels`, `priceOffers`, `loadRatings`,
       `usageExampleSourceUrls`, `industryTags`, `taskTags`,
       `comparison.strengths`/`constraints`/`bestFit`/`notFit`
     - use-cases: `sources`, `requiredCapabilities`, `industryTags`, `taskTags`,
       `candidateRobots`（各要素内の`evidenceDeploymentIds`/`evidenceSourceUrls`も配列）
     - deployments: `sources`, `relatedUseCaseIds`
     - articles: `sources`, `industryTags`, `regionTags`, `themeTags`, `keyTakeaways`,
       `relatedRobotIds`, `relatedManufacturerIds`, `relatedUseCaseIds`
4. **domain validation**: `npm run validate:data` は現在`package.json`に存在しない
   （Payload移行時に廃止済み。`docs/plans/content-platform-migration-factual-audit-v1.md`参照）。
   `content:verify-snapshot` / `content:verify-conservation` は署名済みsnapshotや
   baseline manifestを前提にした本番運用向けコマンドで、MCPでdraft編集した直後に
   手元で都度回す粒度のツールではない。publish時の`validateForPublish`チェックも
   Codex自身からは実行できない。したがって draft の時点では、**必須になる想定の
   field（`summary` / `sources` など）が埋まっているかをスキーマと照合して手動で自己点検する
   以外の機械的な検証手段が無い**ことを前提に作業する。
5. **diff要約**: 変更内容（新規 field、変更前後の値、追加した source URL）を日本語で簡潔に
   要約し、人間のレビュー担当へ提示する。
6. **人間のAdmin review**: 要約をもとに、人間（Admin UI にアクセスできる `content-reader` 以上の
   role）が内容を確認する。この時点で MCP 経由の書き込みはこれ以上進めない。
7. **content-publisherが公開**: レビューが完了したら、`content-publisher` 以上の role を持つ
   人間が Admin UI（または承認済み公開の運用手順）を通じて `publishApprovedVersion()` を呼ぶ。
   Codex 自身はこのステップを実行しない（実行しようとしても拒否される設計）。

## articles の category / type / section の使い分け

`articles`の分類は独立した3つのenumで構成されており、初見では区別が付きにくい。新規記事を
作る前に、既存記事を`findArticles`で数件参照して組み合わせパターンを確認すること。

- `category`（news / interview / company-report / analysis / policy）— 記事の性質。
- `type`（analysis / deployment-report / interview / event-report / policy-update /
  case-study / news-brief / tech-update / market-analysis / manufacturer-guide /
  robot-guide / basics-guide）— 記事の型。記事一覧のフィルタ・表示テンプレートに影響する
  （例: `manufacturer-guide`は本文の代わりに`manufacturerGuideContent`が必須）。
- `section`（digest / deployment / business / tech / policy / entertainment）— ホームや
  一覧ページの「棚（shelf）」を決めるタブ分類。`ai/rules/21-data-maintenance-workflow.md`
  G7の`themeTags`/`industryTags`/`regionTags`の軸とは別物なので混同しない。

## MCP credential の扱い

- 通常profile（`content-draft-writer` に bind された key）と管理用profile
  （統合試験専用、`platform-admin` に bind された key）は別々に発行し、別々に保管する。
  管理用profileは統合試験以外で使わない。
- API key の値そのものは Git・チャット・監査 artifact のどこにも書かない。
  `.env.example` にも実値は置かない（`PAYLOAD_MCP_LOCAL_TEST_API_KEY` は
  ローカル検証専用のプレースホルダ変数名で、値は空のまま commit する）。

## 既知の脆弱性クラスとインフラ側の未確認事項

- **`@payloadcms/plugin-mcp`のXSS脆弱性（CVE-2026-34748）**: バージョン管理（versions）を
  有効にしたcollectionに対しcreate/update権限を持つ攻撃者が悪意あるスクリプトを混入させ、
  それを閲覧した別の管理者のブラウザ上で実行させられる脆弱性。**3.78.0未満が対象、
  3.78.0以上で修正済み**（参考: https://security.snyk.io/vuln/SNYK-JS-PAYLOADCMSPLUGINMCP-15873861）。
  2026-09-08時点で本プロジェクトは`3.87.1`を使用しており対象外。ただし「versionsを有効にした
  collectionへ、外部寄りのroleにcreate/update権限を渡す」という構造自体は今回のMCP運用の
  前提そのものなので、**依存バージョンを固定・更新する際はこの脆弱性クラス（対象範囲が
  この構造と一致するCVE）を優先的に確認する**こと。
- **MCPエンドポイント（`https://deploid.net/api/mcp`）のレート制限は未確認**: Payload本体には
  リクエスト回数を制限する機能が組み込まれておらず、コミュニティの推奨はインフラ層
  （Vercel Edge / API Gateway等）での対策。本プロジェクトが実際にレート制限やIP制限を
  かけているかは、このワークフロー文書のスコープ（アプリケーションコード）からは確認できず、
  Vercel側のプロジェクト設定を別途確認する必要がある。

## 参照

- `lib/payload/mcp.ts` — MCP plugin の実際の設定（expose する collection、
  API key collection の access lockdown）。
- `lib/payload/access.ts` — `createPublishGateHook` / `contentCollectionAccess`（実際の gate）。
- `lib/payload/publishApprovedVersion.ts` — 唯一の公開経路。
- `docs/reference/payload-mcp-integration-check-*.md` — 実MCP transport経由での検証記録。
