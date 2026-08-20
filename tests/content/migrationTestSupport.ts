import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { Client } from 'pg';

/**
 * `tests/content/migration.test.ts` の共通basement。
 *
 * このsuiteは他の `tests/content/*.test.ts`（Payload Local API越しに1つの共有throwaway DBへ
 * destructiveな操作をする）と違い、複数の**別々のPostgres database**（空DB検証・既存schema検証・
 * driftチェック検証）を自分でcreate/dropする。よって毎回:
 * 1) 実際の `payload migrate*` CLIを子processとして起動する（`DATABASE_URL` / `PAYLOAD_CONFIG_PATH` /
 *    `PAYLOAD_TEST_MIGRATION_DIR` を子processごとに渡す）。
 *    Payloadの `payload.config.ts` は `buildConfig(...)` をimport時に一度だけ評価してmodule
 *    cacheされるため、同一vitest processの中で `process.env.DATABASE_URL` を書き換えても、
 *    既にimport済みの `../../payload.config` は古い接続文字列のままになる。CLIを毎回
 *    別processとして起動すれば、この問題を構造的に避けられる。
 * 2) `CREATE DATABASE` / `DROP DATABASE` はPostgresのmaintenance database（`postgres`）へ`pg`で
 *    直接つなぎ、生成・破棄する。ambient `DATABASE_URL` のhost/port/user/passwordは再利用し
 *    dbname部分だけを差し替える（CI ではpostgres:17 service、ローカルではHomebrewの
 *    postgresql@15、どちらも `postgres` maintenance dbを持つ）。
 */

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * 既知の共有/永続DB名。この関数がチェックするのはambient DATABASE_URL（maintenance接続用に
 * host/port/user/passwordだけ再利用する起点）だが、`tests/content/testDbGuard.ts`と同じ
 * インシデント（host判定だけでは`deploid_dev`のようなlocalhost上の永続DBを弾けない）の
 * 再発防止として、こちらもDB名を検査する（2026-08-20発生）。
 */
const KNOWN_NON_THROWAWAY_DATABASE_NAMES = new Set(['deploid_dev', 'postgres']);
const THROWAWAY_DATABASE_NAME_PATTERN = /test|throwaway|e2e/i;

export function assertLocalThrowawayDatabase(callerFile: string, databaseUrl: string | undefined): void {
  if (!databaseUrl) {
    throw new Error(`DATABASE_URL is not set. ${callerFile} creates/drops throwaway Postgres databases and must only ever run against a local Postgres server.`);
  }
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error(`DATABASE_URL is not a valid connection URL: ${databaseUrl.slice(0, 20)}...`);
  }
  const host = url.hostname;
  if (!LOCAL_DATABASE_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run ${callerFile} against DATABASE_URL host "${host}". This suite creates and drops ` +
        `whole Postgres databases and only runs against a local throwaway Postgres server (host in ` +
        `${[...LOCAL_DATABASE_HOSTS].join(', ')}), never against a shared/managed database such as Supabase.`,
    );
  }
  const databaseName = url.pathname.replace(/^\//, '');
  if (
    KNOWN_NON_THROWAWAY_DATABASE_NAMES.has(databaseName) ||
    !THROWAWAY_DATABASE_NAME_PATTERN.test(databaseName)
  ) {
    throw new Error(
      `Refusing to run ${callerFile} with ambient DATABASE_URL database "${databaseName}". This suite creates ` +
        'and drops whole Postgres databases derived from this connection string and only runs when the ' +
        'ambient database name is explicitly throwaway (must contain "test", "throwaway", or "e2e"; localhost ' +
        `alone is not sufficient — "${databaseName}" may be a shared/persistent database such as the ` +
        "developer's local dev DB).",
    );
  }
}

/** ambient DATABASE_URL のhost/port/user/passwordを維持したまま、dbname部分だけ差し替える。 */
export function withDatabaseName(databaseUrl: string, dbName: string): string {
  const url = new URL(databaseUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

async function withMaintenanceClient<T>(databaseUrl: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: withDatabaseName(databaseUrl, 'postgres') });
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

export interface CliResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** 呼び出し側が渡す部分的なenv override。`process.env` へマージする（`NodeJS.ProcessEnv` は
 * `NODE_ENV` 必須のためoverride用のplain objectには不向き）。 */
export type EnvOverride = Record<string, string | undefined>;

const PAYLOAD_BIN = path.resolve(process.cwd(), 'node_modules/.bin/payload');
const TSX_BIN = path.resolve(process.cwd(), 'node_modules/.bin/tsx');

/** `payload <args>` を子processとして実行する。migrate / migrate:create / migrate:down / migrate:status 用。 */
export function runPayloadCli(args: string[], env: EnvOverride): CliResult {
  const result = spawnSync(PAYLOAD_BIN, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 60_000,
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

/**
 * `tsx <scriptPath> -- <args>` を子processとして実行する。`scripts/stamp-environment.mts` や
 * `scripts/export-content-snapshot.mts`（content:export / content:restore）用。
 *
 * `timeoutMs` は既定30秒。content CLIはPayloadの起動に加えcosign署名（実AWS KMS往復）や
 * 全collectionのparityを行うため、既定では足りないことがある。呼び出し側が延ばせるようにする。
 */
export function runTsxScript(scriptPath: string, args: string[], env: EnvOverride, timeoutMs = 30_000): CliResult {
  const result = spawnSync(TSX_BIN, [scriptPath, '--', ...args], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: timeoutMs,
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}
