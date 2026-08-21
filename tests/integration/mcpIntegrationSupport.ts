import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Payload } from 'payload';
import { Client as PgClient } from 'pg';
import { runPayloadCli } from '../content/migrationTestSupport';
import { assertLocalThrowawayDatabaseUrl } from '../content/testDbGuard';

/**
 * Task 8 Step 5: `tests/integration/mcp-endpoint.test.ts` 用の下回り。
 *
 * `tests/content/*.test.ts`（Payload Local API + 実Postgres）と違い、このsuiteは
 * 「実MCP transport（実HTTP、実JSON-RPC、実API key認証）が Task 3 の権限表を実際に迂回しない」
 * ことを証明するために、`next dev` を子processとして実際に起動する。`playwright.config.ts` の
 * `webServer`（e2e専用: `next start` + 専用port）と同じ発想を、vitest側で手動実装したもの。
 *
 * throwaway DB判定は`tests/content/testDbGuard.ts`が唯一の正本。ここではコピーを作らず
 * importするだけにする（2026-08-20のインシデント再発防止、詳細は同ファイル参照）。
 */

export const assertLocalThrowawayDatabase = assertLocalThrowawayDatabaseUrl;

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

/**
 * Task 8 fix round 3: `npm run test:integration` のexit codeが（アサーションは12/12 PASSなのに）
 * 3/3回とも1になる問題の実体を修正する。
 *
 * 根本原因は「teardownの順序（`stopAppServer` → `destroy()` → `dropThrowawayDatabase()`）が
 * 崩れていた」ことでも「`destroy()`のPromiseをawaitし忘れていた」ことでもなかった
 * （どちらも既に正しく実装されていた）。実際に`payload.destroy()`のソース
 * （`node_modules/@payloadcms/drizzle/dist/destroy.js`）を読み、`getPayload()`で取得した
 * インスタンスに対して直接検証したところ、次の2点が判明した:
 *
 * 1. `payload.destroy()` は `this.pool`（`@payloadcms/db-postgres` が保持する生の `pg.Pool`）を
 *    一切 `end()` しない。内部のschema/drizzle参照をクリアするだけで、実際のPostgres
 *    connectionはpool内にidleなまま残り続ける（`payload.destroy()`を呼んだ直後に
 *    `pg_stat_activity`を見ても接続数は減らないことを実機で確認済み）。
 * 2. だからといって`payload.db.pool.end()`を明示的に呼んで待つのも解決策にならない。
 *    `@payloadcms/db-postgres`の`connect.js`内`connectWithReconnect()`は、起動時に
 *    `pool.connect()`したconnectionを**意図的に一度もreleaseしない**（ECONNRESET検知用の
 *    「見張り」connectionとして保持し続ける設計）。そのため`pool.end()`は「全clientが
 *    poolへ返却されるまで待つ」という通常のpg-pool仕様どおり、その見張りconnectionの解放を
 *    永遠に待ち続けてhangする（実機で2分以上hangすることを確認済み——これは exit code 1 より
 *    悪い結果になる）。
 *
 * 実際に起きていた事象は、node-postgres自体が公式docsで明記している既知の挙動だった:
 * `pg.Pool`はidleなclientがfatalな切断（今回のケースでは、teardownの
 * `dropThrowawayDatabase()`自身が発行する`DROP DATABASE ... WITH (FORCE)`がpoolに残っていた
 * idle connectionを強制切断し、`57P01 terminating connection due to administrator command`を
 * 引き起こす）を受け取ると、そのpoolに`error` listenerが1つも登録されていない場合、
 * Node自体への「unhandled 'error' event」としてthrowする
 * （https://node-postgres.com/apis/pool: "you should register a listener on the pool to catch
 * errors... if you don't attach a listener... your program will crash"）。
 * `@payloadcms/db-postgres`の`connect.js`は個々のclientへ`prependListener('error', ...)`を
 * 付けてはいるが、**pool全体に対する`error` listenerは一切登録していない**——このsuiteが
 * 使う`getPayload()`で得たインスタンスのpoolはguardなしのままだった。
 *
 * 修正は「poolを閉じ切るのを待つ」ではなく、node-postgresが要求する標準的な安全策——
 * **poolへ`error` listenerを1つ登録し、teardown中に意図して発生させる切断由来の`error`
 * イベントを、processを巻き込まずに処理する**——である。`beforeAll`で`setupPayload`を
 * 取得した直後に呼び出すことで、テスト実行中〜teardownまでの全期間をこのguardの対象にする。
 */
export function guardPayloadPoolErrors(payload: Payload): void {
  const pool = (payload as unknown as { db?: { pool?: { on: (event: 'error', listener: (err: unknown) => void) => void } } }).db?.pool;
  if (!pool) return;
  pool.on('error', (err: unknown) => {
    const code = (err as { code?: string } | undefined)?.code;
    console.log(`[mcpIntegrationSupport] swallowed expected pool 'error' event during teardown (code: ${code ?? 'unknown'})`);
  });
}

/**
 * `payload migrate` を子processとして、committedされたmigrations/を対象DBへ適用する。
 *
 * Remediation group 6のreview（2026-08-22）で見つかったgap: 以前はここだけ独自に
 * `node_modules/.bin/payload`（実体は`payload/bin.js`）を直接起動しており、
 * `tests/content/migrationTestSupport.ts`の`runPayloadCli()`が塞いだのと全く同じ
 * bootstrap race（`patches/payload+3.87.1.patch`のdocblock参照）をそのまま踏む経路が
 * 残っていた。独自実装を持たず、既にreview済みの`runPayloadCli()`をそのまま再利用する
 * （`tests/content/testDbGuard.ts`の再利用と同じ方針——判定・実行ロジックのコピーを作らない）。
 */
export function runPayloadMigrate(databaseUrl: string, payloadSecret: string): { status: number; stdout: string; stderr: string } {
  return runPayloadCli(['migrate'], { DATABASE_URL: databaseUrl, PAYLOAD_SECRET: payloadSecret });
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
  timeoutMs?: number;
}): Promise<AppServerHandle> {
  const { port, databaseUrl, payloadSecret, timeoutMs = 120_000 } = options;
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

  // このfunctionは以前、readiness確認の後に「認証付きPOSTを1回投げてMCPのPOST dispatch
  // コードパスをwarm upする」処理を持っていたが、**timeoutを持たない生の`fetch()`が280秒
  // （testのhookTimeout上限）ハングし、テスト全体を巻き添えにした**（実機で再現・特定済み）。
  // GETは6〜7秒でready化しており、Next.jsはroute moduleをmethodごとではなくファイル単位で
  // コンパイルするため「POST側だけ未コンパイル」という当初の仮説はそもそも成立しない。
  // ハングの実際の原因はwarm-up自体の実装（MCP handshakeを正しく踏んでいない生fetch、
  // または長時間のstreaming応答を素朴に`.text()`で待ち切ろうとしたこと）にあると判断し、
  // warm-up処理と`warmUpApiKey`引数は完全に撤去した（呼び出し側に引数だけ残して何もしない、
  // という誤誘導を避けるため）。実clientの接続（`connectMcpClient()`）はSDK自身のtimeout機構
  // （`setTimeout`ベースで実際のHTTP応答を待たずに発火する）を使うため、同じ種類のハングで
  // テストプロセスごと止まることはない——最悪でも `McpError -32001: Request timed out` で
  // 失敗するだけ。

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
