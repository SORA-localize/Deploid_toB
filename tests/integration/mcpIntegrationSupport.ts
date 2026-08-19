import { type ChildProcessWithoutNullStreams, spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client as PgClient } from 'pg';

/**
 * Task 8 Step 5: `tests/integration/mcp-endpoint.test.ts` 用の下回り。
 *
 * `tests/content/*.test.ts`（Payload Local API + 実Postgres）と違い、このsuiteは
 * 「実MCP transport（実HTTP、実JSON-RPC、実API key認証）が Task 3 の権限表を実際に迂回しない」
 * ことを証明するために、`next dev` を子processとして実際に起動する。`playwright.config.ts` の
 * `webServer`（e2e専用: `next start` + 専用port）と同じ発想を、vitest側で手動実装したもの。
 */

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function assertLocalThrowawayDatabase(callerFile: string, databaseUrl: string | undefined): void {
  if (!databaseUrl) {
    throw new Error(`DATABASE_URL is not set. ${callerFile} creates/drops throwaway Postgres databases and must only ever run against a local Postgres server.`);
  }
  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error(`DATABASE_URL is not a valid connection URL: ${databaseUrl.slice(0, 20)}...`);
  }
  if (!LOCAL_DATABASE_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run ${callerFile} against DATABASE_URL host "${host}". This suite creates/drops a ` +
        `whole Postgres database and only runs against a local throwaway Postgres server (host in ` +
        `${[...LOCAL_DATABASE_HOSTS].join(', ')}), never against a shared/managed database such as Supabase.`,
    );
  }
}

export function withDatabaseName(databaseUrl: string, dbName: string): string {
  const url = new URL(databaseUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

async function withMaintenanceClient<T>(databaseUrl: string, fn: (client: PgClient) => Promise<T>): Promise<T> {
  const client = new PgClient({ connectionString: withDatabaseName(databaseUrl, 'postgres') });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function createThrowawayDatabase(ambientDatabaseUrl: string, dbName: string): Promise<void> {
  await withMaintenanceClient(ambientDatabaseUrl, async (client) => {
    await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  });
}

export async function dropThrowawayDatabase(ambientDatabaseUrl: string, dbName: string): Promise<void> {
  await withMaintenanceClient(ambientDatabaseUrl, async (client) => {
    await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  });
}

const PAYLOAD_BIN = 'node_modules/.bin/payload';

/** `payload migrate` を子processとして、committedされたmigrations/を対象DBへ適用する。 */
export function runPayloadMigrate(databaseUrl: string, payloadSecret: string): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(PAYLOAD_BIN, ['migrate'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, PAYLOAD_SECRET: payloadSecret },
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** 空いているTCP portを1つ確保する。 */
export async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const { port } = address;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('failed to acquire a free port')));
      }
    });
    server.on('error', reject);
  });
}

export interface AppServerHandle {
  process: ChildProcessWithoutNullStreams;
  baseUrl: string;
  logs: string[];
}

/**
 * `next dev` を子processとして起動し、`/api/mcp` が応答するまで待つ。
 * Payload MCP pluginのGETハンドラは常に `{"jsonrpc":"2.0","error":{...,"message":"Method not
 * allowed."},"id":null}` を返す（`node_modules/@payloadcms/plugin-mcp` のdocblockに明記）ため、
 * この応答が返ってきた時点でMCPエンドポイントが実際にmountされ、稼働していると判定できる。
 */
export async function startAppServer(options: {
  port: number;
  databaseUrl: string;
  payloadSecret: string;
  /**
   * 実在するMCP API keyの値。渡された場合、readiness確認の後に**認証付きの**POST
   * `initialize` requestを1回投げてMCPのPOST dispatchコードパスを事前にコンパイルさせる
   * （下のコメント参照）。省略時はwarm-upを行わない。
   */
  warmUpApiKey?: string;
  timeoutMs?: number;
}): Promise<AppServerHandle> {
  const { port, databaseUrl, payloadSecret, warmUpApiKey, timeoutMs = 120_000 } = options;
  const baseUrl = `http://127.0.0.1:${port}`;
  const logs: string[] = [];

  const child = spawn('npx', ['next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PAYLOAD_SECRET: payloadSecret,
      PAYLOAD_PUBLIC_SERVER_URL: baseUrl,
      CONTENT_SOURCE: 'local',
      NODE_ENV: 'development',
    },
  });

  child.stdout.on('data', (chunk: Buffer) => logs.push(chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => logs.push(chunk.toString()));

  const t0 = Date.now();
  const deadline = t0 + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next dev exited early (code ${child.exitCode}). Logs:\n${logs.join('')}`);
    }
    try {
      const res = await fetch(`${baseUrl}/api/mcp`, { method: 'GET' });
      // どんなstatusでも、接続自体ができてbodyが読めればサーバは稼働している。
      await res.text();
      break;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (Date.now() >= deadline) {
    child.kill('SIGTERM');
    throw new Error(`next dev did not become ready within ${timeoutMs}ms. Last error: ${String(lastError)}\nLogs:\n${logs.join('')}`);
  }
  console.log(`[mcpIntegrationSupport] next dev GET-ready after ${Date.now() - t0}ms`);

  // 以前ここに「認証付きPOSTを1回投げてdispatchコードパスをwarm upする」処理があったが、
  // **timeoutを持たない生の`fetch()`が280秒（testのhookTimeout上限）ハングし、テスト全体を
  // 巻き添えにした**（実機で再現・特定済み）。GETは6〜7秒でready化しており、Next.jsは
  // route moduleをmethodごとではなくファイル単位でコンパイルするため「POST側だけ未コンパイル」
  // という当初の仮説はそもそも成立しない。ハングの実際の原因はwarm-up自体の実装
  // （MCP handshakeを正しく踏んでいない生fetch、または長時間のstreaming応答を素朴に
  // `.text()`で待ち切ろうとしたこと）にあると判断し、warm-upは撤去した。
  // 実clientの接続（`connectMcpClient()`）はSDK自身のtimeout機構（`setTimeout`ベースで
  // 実際のHTTP応答を待たずに発火する）を使うため、同じ種類のハングでテストプロセスごと
  // 止まることはない——最悪でも `McpError -32001: Request timed out` で失敗するだけ。
  void warmUpApiKey;

  return { process: child, baseUrl, logs };
}

export async function stopAppServer(handle: AppServerHandle | undefined): Promise<void> {
  if (!handle) return;
  await new Promise<void>((resolve) => {
    handle.process.once('exit', () => resolve());
    handle.process.kill('SIGTERM');
    // next devはSIGTERMだけでは即終了しないことがあるため、保険でSIGKILLも予約する。
    setTimeout(() => {
      if (handle.process.exitCode === null) handle.process.kill('SIGKILL');
      resolve();
    }, 5000);
  });
}

export interface McpTestClient {
  client: Client;
  close: () => Promise<void>;
}

/** 実 `@modelcontextprotocol/sdk` の Streamable HTTP clientでMCP serverへ接続する。 */
export async function connectMcpClient(mcpUrl: string, apiKey: string): Promise<McpTestClient> {
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
  });
  const client = new Client({ name: 'deploid-task8-integration-test', version: '1.0.0' }, { capabilities: {} });
  // 既定は60秒（SDKの `DEFAULT_REQUEST_TIMEOUT_MSEC`）。`next dev` はrouteを初回requestで
  // 遅延コンパイルするため、`startAppServer()` のwarm-upを経ても余裕を持たせておく。
  await client.connect(transport, { timeout: 90_000 });
  return {
    client,
    close: async () => {
      await client.close();
    },
  };
}
