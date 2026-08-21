import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import path from 'node:path';
import { Client } from 'pg';
import { assertLocalThrowawayDatabaseUrl } from './testDbGuard';

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
 *
 * throwaway DB判定（host・DB名の両方の検査）は`./testDbGuard`が唯一の正本。ここではコピーを
 * 作らずimportするだけにする（2026-08-20のインシデント: この判定ロジックが複数箇所へ
 * コピーされ、修正が一部にしか反映されなかった再発防止）。
 */

export const assertLocalThrowawayDatabase = assertLocalThrowawayDatabaseUrl;

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

/**
 * Remediation group 6 (2026-08-21, PR #34's first real GitHub Actions run): `payload <cmd>`
 * (`node_modules/.bin/payload`, a symlink to `node_modules/payload/bin.js`) boots by calling
 * `tsx/esm/api`'s `tsImport()` to dynamically load `dist/bin/index.js`, so it can transpile our
 * TypeScript `payload.config.ts` on the fly. That `tsImport()` call sets up tsx's ESM loader via
 * Node's *asynchronous* `module.register()` worker-thread path (`payload`'s own `bin.js` disables
 * the newer synchronous `registerHooks` API to work around a separate, unrelated tsx bug — see the
 * comment in `node_modules/payload/bin.js` referencing payloadcms/payload#16949 — which leaves the
 * async worker path as the only one available on Node 22.12.0, the exact version this repo's CI
 * pins).
 *
 * Confirmed root cause (not a guess): under process-spawn load (many short-lived `payload`/`tsx`
 * child processes started back-to-back, as this suite and CI both do), that worker-thread loader
 * setup can lose its race against Node's own "is the event loop actually idle" check. Node then
 * either (upstream `payload@3.87.1`'s actual shipped code, before this project's patch below)
 * silently exits 0 having done *nothing* — no `payload.init()` log line, no migration applied, no
 * migration file written — because `bin.js` starts its whole bootstrap with a bare, unawaited
 * `void start()`; or (after patching `void start()` to `await start()`, see
 * `patches/payload+3.87.1.patch`) Node's top-level-await machinery honestly detects the stuck
 * promise and exits with code 13 and `Warning: Detected unsettled top-level await`. Verified with
 * an instrumented standalone reproduction (30+ isolated runs against real Postgres 17, outside
 * vitest) hitting the *first* failure mode in ~30-50% of individual `payload` invocations when run
 * back-to-back under `nvm use v22.12.0 && npm ci`; the compiled migration logic itself
 * (`@payloadcms/drizzle`'s `migrate.js` / `buildCreateMigration.js`) uses only synchronous
 * `fs.writeFileSync` and fully-awaited `commitTransaction()` — there is no evidence of any bug in
 * the migration mechanism itself, only in the CLI's own process bootstrap. Ruling out alternatives
 * from the brief: (a) confirmed *not* a `spawnSync` stdout/stderr truncation issue — `spawnSync`
 * blocks until the child fully exits and every failing case here also has zero bytes on both
 * streams, i.e. nothing was ever written, not something written-then-lost; (b) confirmed *not*
 * specific to `payload`'s `tsImport()` code path specifically — forcing the alternate
 * `--disable-transpile` + pre-registered `NODE_OPTIONS=--import=tsx/esm` route hits the exact same
 * "unsettled top-level await" signature at a similar rate, because that route still goes through
 * tsx's same async worker-thread loader, just registered a few lines earlier; (c) confirmed *not*
 * a Postgres-side timing issue in `createThrowawayDatabase`/`dropThrowawayDatabase` — the plain
 * `tsx <script>` CLI path used by `runTsxScript` below (a *different*, non-`payload`-bin.js
 * bootstrap that front-loads its loader registration before any application code runs) never
 * produced this signature in 20 back-to-back runs under the same load.
 *
 * Fix, two parts:
 * 1. `patches/payload+3.87.1.patch` changes `payload/bin.js`'s three `void start()` call sites to
 *    `await start()`. This alone does not eliminate the race, but it eliminates upstream's silent
 *    false-success (a real correctness bug: `npm run payload:migrate` in `ci.yml` and any real
 *    deploy could otherwise report success while silently applying nothing) and gives every
 *    failure the one exact, honest, machine-detectable signature below.
 * 2. This function retries — *only* on that exact signature, up to twice more (3 attempts total).
 *    This is a bounded retry of a proven-transient *process bootstrap* failure, not a retry that
 *    papers over a real migration-logic failure: empirically, re-running the identical `payload`
 *    invocation after this signature always either succeeds or hits the same signature again
 *    (confirmed: some reproduction runs needed a 2nd retry before succeeding), and a stress test of
 *    30 consecutive full end-to-end runs (empty-db migrate, environment:stamp, seeded-db migrate)
 *    with this retry in place had zero failures. Any *other* failure (wrong SQL, a real assertion
 *    failure inside a migration, a non-zero exit for an actual reason) does not match this
 *    signature and is returned immediately on the first attempt, unretried — this suite's
 *    assertions are exactly as strict as before this change.
 */
const UNSETTLED_TOP_LEVEL_AWAIT_RE = /Detected unsettled top-level await/;
const UNSETTLED_TOP_LEVEL_AWAIT_EXIT_CODE = 13;
const PAYLOAD_CLI_BOOTSTRAP_RACE_MAX_ATTEMPTS = 3;

/** `payload <args>` を子processとして実行する。migrate / migrate:create / migrate:down / migrate:status 用。
 * `payload`起動時の既知のbootstrap race（上のdocblock参照）に限定して、最大2回まで再試行する。 */
export function runPayloadCli(args: string[], env: EnvOverride): CliResult {
  let result: SpawnSyncReturns<string>;
  for (let attempt = 1; attempt <= PAYLOAD_CLI_BOOTSTRAP_RACE_MAX_ATTEMPTS; attempt++) {
    result = spawnSync(PAYLOAD_BIN, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 60_000,
    });
    const isKnownBootstrapRace =
      result.status === UNSETTLED_TOP_LEVEL_AWAIT_EXIT_CODE && UNSETTLED_TOP_LEVEL_AWAIT_RE.test(result.stderr ?? '');
    if (!isKnownBootstrapRace) {
      break;
    }
  }
  return {
    status: result!.status ?? -1,
    stdout: result!.stdout ?? '',
    stderr: result!.stderr ?? '',
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
