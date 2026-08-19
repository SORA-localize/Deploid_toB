import { randomBytes, randomUUID } from 'node:crypto';
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertLocalThrowawayDatabase,
  connectMcpClient,
  createThrowawayDatabase,
  dropThrowawayDatabase,
  findFreePort,
  runPayloadMigrate,
  startAppServer,
  stopAppServer,
  withDatabaseName,
  type AppServerHandle,
  type McpTestClient,
} from './mcpIntegrationSupport';

/**
 * Task 8 Step 5: 実MCP transport（実HTTP、実JSON-RPC、実API key認証）越しにTask 3の権限表を
 * 検証する。`tests/content/mcp-access.test.ts` が「Payload Local APIレベルで権限が実際に効く」
 * ことを証明しているのに対し、こちらは「その権限が、実際にMCP経由（`next dev` → `/api/mcp` →
 * 実HTTP → 実 `@modelcontextprotocol/sdk` client）で呼んだときも迂回されない」ことを証明する。
 *
 * brief: 「Local API testだけでは実MCP経路のcredential bindingを証明できない」——このsuiteが
 * その隙間を埋める。
 *
 * `npm run test:integration`（`vitest.integration.config.ts`）専用。既定の `npm run test` /
 * `npm run check` からは除外している（`vitest.config.ts`のexclude参照。理由: 実`next dev`
 * serverを毎回起動するため、他のsuiteよりずっと重い）。
 */

const AMBIENT_DATABASE_URL = process.env.DATABASE_URL;
const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET ?? 'mcp-integration-test-secret-not-for-production-000000';
const RUN_ID = randomUUID().slice(0, 8);
const DB_NAME = `deploid_mcp_endpoint_test_${RUN_ID}`;
const PASSWORD = 'Str0ngPassw0rd!23';

function randomApiKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * tool結果の最初のtext contentを返す。`callTool()` の戻り値型は通常の
 * `{content:[...]}` と task-based実行時の `{toolResult:...}` の union だが、本suiteの
 * toolはどれもtask-based（experimental）ではないため、実際には常に前者の形で返る。
 */
function textOf(result: unknown): string {
  const content = (result as { content?: Array<{ type: string; text?: string }> }).content;
  const first = content?.find((c) => c.type === 'text');
  return first?.text ?? '';
}

describe('Real MCP transport (next dev + StreamableHTTPClientTransport) enforces Task 3 RBAC', () => {
  let dbUrl: string;
  let server: AppServerHandle | undefined;
  let setupPayload: Payload;

  let writerAdminId: string | number;
  let platformAdminId: string | number;

  let normalKeyValue: string;
  let deleteEnabledKeyValue: string;
  let adminKeyValue: string;

  beforeAll(async () => {
    const t0 = Date.now();
    const mark = (label: string) => console.log(`[mcp-endpoint.test setup] ${label} at +${Date.now() - t0}ms`);

    assertLocalThrowawayDatabase('tests/integration/mcp-endpoint.test.ts', AMBIENT_DATABASE_URL);
    dbUrl = withDatabaseName(AMBIENT_DATABASE_URL!, DB_NAME);
    await createThrowawayDatabase(AMBIENT_DATABASE_URL!, DB_NAME);
    mark('throwaway DB created');

    const migrate = runPayloadMigrate(dbUrl, PAYLOAD_SECRET);
    if (migrate.status !== 0) {
      throw new Error(`payload migrate failed:\n${migrate.stdout}\n${migrate.stderr}`);
    }
    mark('migrations applied');

    // Bootstrap admins + MCP API keys via Local API against the same throwaway DB. The `next dev`
    // server started below connects to the same DATABASE_URL, so it sees this data immediately —
    // Postgres is the shared source of truth, not something owned by either process.
    //
    // `payload.config.ts` reads `process.env.DATABASE_URL` at *module evaluation* time
    // (`requireEnv('DATABASE_URL')`), which happens once and is cached by Node's ESM loader. A
    // static top-level `import config from '../../payload.config'` would therefore lock in
    // whatever DATABASE_URL was set when this test *file* was first imported (the ambient
    // DATABASE_URL from the shell, not the throwaway `dbUrl` this beforeAll just created) — this
    // was tried and failed with "You are not allowed to perform this action" on the very first
    // admin bootstrap create, because it was silently hitting the wrong (non-empty) database.
    // `tests/content/migrationTestSupport.ts` documents the same root cause for the CLI-based
    // suite. The fix here is the in-process equivalent: set DATABASE_URL to the throwaway value
    // and only *then* import payload.config, dynamically, inside this beforeAll.
    process.env.DATABASE_URL = dbUrl;
    process.env.PAYLOAD_SECRET = PAYLOAD_SECRET;
    const { default: config } = await import('../../payload.config');
    setupPayload = await getPayload({ config });
    mark('setupPayload connected (dev-mode schema push complete)');

    const owner = await setupPayload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: 'mcp-e2e-owner@example.com', password: PASSWORD, role: 'content-reader' },
    });
    expect(owner.role).toBe('platform-admin'); // bootstrap強制
    platformAdminId = owner.id;

    const writer = await setupPayload.create({
      collection: 'admins',
      overrideAccess: false,
      user: owner,
      data: { email: 'mcp-e2e-writer@example.com', password: PASSWORD, role: 'content-draft-writer' },
    });
    writerAdminId = writer.id;

    // 通常profile: content-draft-writerへbind、robotsのfind/create/updateだけ有効。
    normalKeyValue = randomApiKey();
    await setupPayload.create({
      collection: 'payload-mcp-api-keys' as never,
      overrideAccess: false,
      user: owner,
      data: {
        user: writerAdminId,
        label: 'normal draft-writer key (integration test)',
        enableAPIKey: true,
        apiKey: normalKeyValue,
        robots: { find: true, create: true, update: true },
      } as never,
    });

    // 多層防御確認用: 同じdraft-writerへbindされているが、robots.deleteのcheckboxだけ
    // 誤って有効化されている想定のkey。「MCP toolのcheckboxが存在する = 実際に消せる」を
    // 意味しないことを確認する。
    deleteEnabledKeyValue = randomApiKey();
    await setupPayload.create({
      collection: 'payload-mcp-api-keys' as never,
      overrideAccess: false,
      user: owner,
      data: {
        user: writerAdminId,
        label: 'misconfigured delete-enabled draft-writer key (integration test)',
        enableAPIKey: true,
        apiKey: deleteEnabledKeyValue,
        robots: { find: true, delete: true },
      } as never,
    });

    // 管理用profile: platform-adminへbind。統合試験専用（brief: 「統合試験以外で使わない」）。
    adminKeyValue = randomApiKey();
    await setupPayload.create({
      collection: 'payload-mcp-api-keys' as never,
      overrideAccess: false,
      user: owner,
      data: {
        user: platformAdminId,
        label: 'platform-admin key (integration test only)',
        enableAPIKey: true,
        apiKey: adminKeyValue,
        robots: { find: true, create: true, update: true, delete: true },
      } as never,
    });

    mark('admins + MCP API keys bootstrapped');

    const port = await findFreePort();
    server = await startAppServer({ port, databaseUrl: dbUrl, payloadSecret: PAYLOAD_SECRET, warmUpApiKey: normalKeyValue });
    mark('next dev ready + warm-up POST complete');
  }, 280_000);

  afterAll(async () => {
    await stopAppServer(server);
    await setupPayload?.destroy();
    if (AMBIENT_DATABASE_URL) {
      await dropThrowawayDatabase(AMBIENT_DATABASE_URL, DB_NAME).catch(() => undefined);
    }
  }, 60_000);

  it('unauthenticated GET /api/mcp is rejected before reaching MCP dispatch at all', async () => {
    // 実機で確認した挙動（想定と違った点）: plugin-mcpの `getDefaultMcpAccessSettings()`
    // （`node_modules/@payloadcms/plugin-mcp/src/endpoints/mcp.ts`）はAuthorizationヘッダの
    // 検証を、method分岐（GET→405 "Method not allowed" のJSON-RPC封筒を返す
    // `node_modules/mcp-handler`のロジック）より**前**に行う。よって未認証のGETは
    // 405ではなく、Payload自体の401 `UnauthorizedError`（`authentication:mustBeLoggedIn`）で
    // 弾かれる——これ自体、認証なしにMCP dispatchへ一切到達できないことの確認になる。
    const res = await fetch(`${server!.baseUrl}/api/mcp`, { method: 'GET' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(JSON.stringify(body)).toMatch(/unauthorized|logged in/i);
  });

  it('authenticated GET /api/mcp reaches MCP dispatch and gets the documented 405 JSON-RPC envelope', async () => {
    const res = await fetch(`${server!.baseUrl}/api/mcp`, {
      method: 'GET',
      headers: { authorization: `Bearer ${normalKeyValue}` },
    });
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body).toMatchObject({ jsonrpc: '2.0', error: { message: 'Method not allowed.' } });
  });

  describe('normal content-draft-writer credential', () => {
    let mcp: McpTestClient;

    beforeAll(async () => {
      mcp = await connectMcpClient(`${server!.baseUrl}/api/mcp`, normalKeyValue);
    });
    afterAll(async () => {
      await mcp?.close();
    });

    it('tools/list exposes robots find/create/update but not admins or delete', async () => {
      const { tools } = await mcp.client.listTools();
      const names = tools.map((t) => t.name);
      expect(names).toContain('findRobots');
      expect(names).toContain('createRobots');
      expect(names).toContain('updateRobots');
      expect(names).not.toContain('deleteRobots'); // このkeyはdelete capabilityを持たない
      expect(names.some((n) => /admin/i.test(n))).toBe(false);
      expect(names.some((n) => /mcpApiKey|apiKey/i.test(n))).toBe(false);
    });

    it('1. findRobots matches the real DB count', async () => {
      const dbCount = await setupPayload.count({ collection: 'robots', overrideAccess: true });
      const result = await mcp.client.callTool({ name: 'findRobots', arguments: { limit: 100 } });
      const text = textOf(result);
      expect(text).toContain(`Total: ${dbCount.totalDocs} documents`);
    });

    it('2. can create a draft named test-mcp-endpoint-draft', async () => {
      const result = await mcp.client.callTool({
        name: 'createRobots',
        arguments: { stableId: 'test-mcp-endpoint-draft', slug: 'test-mcp-endpoint-draft', name: 'MCP Endpoint Test Robot', draft: true },
      });
      const text = textOf(result);
      expect(text).toContain('Resource created successfully');
      expect(text).toContain('"_status":"draft"');

      // `stableId` はdomainの安定識別子であって Payload の内部id ではないため、
      // `findByID` ではなく `stableId` でのqueryで実際の書き込みを確認する。
      const { docs } = await setupPayload.find({
        collection: 'robots',
        where: { stableId: { equals: 'test-mcp-endpoint-draft' } },
        overrideAccess: true,
        limit: 1,
      });
      expect(docs[0]?._status).toBe('draft');
    });

    it('3. can update that draft (still draft)', async () => {
      const { docs } = await setupPayload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-endpoint-draft' } }, overrideAccess: true, limit: 1 });
      const id = docs[0].id;
      const result = await mcp.client.callTool({
        name: 'updateRobots',
        arguments: { id, name: 'MCP Endpoint Test Robot (updated)', draft: true },
      });
      const text = textOf(result);
      expect(text).toContain('Document updated successfully');

      const reloaded = await setupPayload.findByID({ collection: 'robots', id, overrideAccess: true });
      expect(reloaded._status).toBe('draft');
    });

    it('4. cannot update _status to published (rejected by the real publish gate, not by the MCP tool itself)', async () => {
      const { docs } = await setupPayload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-endpoint-draft' } }, overrideAccess: true, limit: 1 });
      const id = docs[0].id;
      const result = await mcp.client.callTool({
        name: 'updateRobots',
        arguments: { id, _status: 'published' } as never,
      });
      const text = textOf(result);
      expect(text).toMatch(/Error updating resource|publish-role-required|publish-approval-required/);

      const reloaded = await setupPayload.findByID({ collection: 'robots', id, overrideAccess: true });
      expect(reloaded._status).toBe('draft'); // 実際には公開されていない
    });

    it('5. delete tool does not even exist for this credential (no deleteRobots capability enabled)', async () => {
      await expect(mcp.client.callTool({ name: 'deleteRobots', arguments: {} })).rejects.toThrow();
    });

    it('6. admins / payload-mcp-api-keys have no MCP tools at all (excluded entirely, not just access-denied)', async () => {
      await expect(mcp.client.callTool({ name: 'findAdmins', arguments: {} })).rejects.toThrow();
      await expect(mcp.client.callTool({ name: 'findPayloadMcpApiKeys', arguments: {} })).rejects.toThrow();
    });
  });

  describe('misconfigured delete-enabled draft-writer credential (defense in depth)', () => {
    let mcp: McpTestClient;
    beforeAll(async () => {
      mcp = await connectMcpClient(`${server!.baseUrl}/api/mcp`, deleteEnabledKeyValue);
    });
    afterAll(async () => {
      await mcp?.close();
    });

    it('deleteRobots tool exists (checkbox enabled) but the real Payload access still rejects it', async () => {
      const { tools } = await mcp.client.listTools();
      expect(tools.map((t) => t.name)).toContain('deleteRobots');

      const { docs } = await setupPayload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-endpoint-draft' } }, overrideAccess: true, limit: 1 });
      const id = docs[0].id;

      const result = await mcp.client.callTool({ name: 'deleteRobots', arguments: { id } });
      const text = textOf(result);
      expect(text).toContain('Error deleting resource');

      const { totalDocs } = await setupPayload.count({ collection: 'robots', where: { id: { equals: id } }, overrideAccess: true });
      expect(totalDocs).toBe(1); // still there
    });
  });

  describe('platform-admin credential (isolated integration-test-only management key)', () => {
    let mcp: McpTestClient;
    beforeAll(async () => {
      mcp = await connectMcpClient(`${server!.baseUrl}/api/mcp`, adminKeyValue);
    });
    afterAll(async () => {
      await mcp?.close();
    });

    it('7/9. can delete the test record via MCP (platform-admin has real delete access)', async () => {
      const { docs } = await setupPayload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-endpoint-draft' } }, overrideAccess: true, limit: 1 });
      const id = docs[0].id;

      const result = await mcp.client.callTool({ name: 'deleteRobots', arguments: { id } });
      const text = textOf(result);
      expect(text).toContain('Document deleted successfully');

      const { totalDocs } = await setupPayload.count({ collection: 'robots', where: { id: { equals: id } }, overrideAccess: true });
      expect(totalDocs).toBe(0);
    });

    /**
     * brief item 7/8/9（テストadminの作成→非特権role更新→削除、自己昇格・platform-admin付与・
     * 最後のadmin保護の拒否）は、**MCP transportでは検証できない設計上の理由がある**:
     * `admins` はどのMCP API keyにも一切exposeされていない（`lib/payload/mcp.ts`の
     * `MCP_EDITABLE_COLLECTIONS`にadminsが含まれない設計、brief Step 2）。よってこの
     * platform-admin credentialであっても `findAdmins` 等のtool自体が存在しない
     * （直前のdescribeの「6.」で確認済み——同じ理由でここでも成立する）。
     *
     * admin管理はMCPの対象外という設計判断の妥当性そのものは、Local APIレベルで
     * `tests/content/admin-access.test.ts` / `tests/content/mcp-access.test.ts` が検証済み。
     * ここでは「MCP越しにadmin管理ツールへ到達できないこと」自体を実transportで再確認する。
     */
    it('admin management tools are unreachable via MCP even with the platform-admin credential (by design)', async () => {
      const { tools } = await mcp.client.listTools();
      const names = tools.map((t) => t.name);
      expect(names.some((n) => /admin/i.test(n))).toBe(false);

      await expect(mcp.client.callTool({ name: 'createAdmins', arguments: {} })).rejects.toThrow();
    });
  });
});
