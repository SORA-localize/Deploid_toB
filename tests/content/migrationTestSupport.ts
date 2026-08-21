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

const TSX_BIN = path.resolve(process.cwd(), 'node_modules/.bin/tsx');
const MIGRATION_CLI_SCRIPT = path.resolve(process.cwd(), 'scripts/run-payload-migration-cli.mts');

/**
 * Remediation group 6 (2026-08-21, PR #34's first real GitHub Actions run, revised after a second
 * real CI run — see below): `payload <cmd>` (`node_modules/.bin/payload`, a symlink to
 * `node_modules/payload/bin.js`) boots by calling `tsx/esm/api`'s `tsImport()` to dynamically load
 * `dist/bin/index.js`, so it can transpile our TypeScript `payload.config.ts` on the fly. That
 * `tsImport()` call sets up tsx's ESM loader via Node's *asynchronous* `module.register()`
 * worker-thread path (`payload`'s own `bin.js` disables the newer synchronous `registerHooks` API
 * to work around a separate, unrelated tsx bug — see the comment in `node_modules/payload/bin.js`
 * referencing payloadcms/payload#16949 — which leaves the async worker path as the only one
 * available on Node 22.12.0, the exact version this repo's CI pins).
 *
 * Confirmed root cause (not a guess): under process-spawn load (many short-lived `payload`/`tsx`
 * child processes started back-to-back, as this suite and CI both do), that worker-thread loader
 * setup can lose its race against Node's own "is the event loop actually idle" check. Node then
 * either (upstream `payload@3.87.1`'s actual shipped code) silently exits 0 having done *nothing*
 * — no `payload.init()` log line, no migration applied — because `bin.js` starts its whole
 * bootstrap with a bare, unawaited `void start()`; or (after patching `void start()` to
 * `await start()`, see `patches/payload+3.87.1.patch`) Node's top-level-await machinery honestly
 * detects the stuck promise and exits with code 13 and `Warning: Detected unsettled top-level
 * await`.
 *
 * First attempt (superseded): patch `void start()` -> `await start()` (kept — it is a real
 * upstream correctness fix, see the patch file) plus a bounded 3-attempt retry in this function
 * scoped to that exact exit-13 signature. Locally (quiet Homebrew Postgres, back-to-back child
 * process spawns) this reliably passed 12/12 and then 30/30 stress runs. It did **not** hold on
 * GitHub Actions' actual shared runner: PR #34's second real CI run hit the race on
 * `migrate:create driftcheck1 --skip-empty` on attempt 1/3 *and* attempt 2/3 back-to-back,
 * exhausting the retry and failing for real. Reproduced locally too, once contention was made
 * *real* instead of just "many processes on an otherwise-idle 10-core machine": running
 * `stress-ng --cpu 16 --cpu-load 95` in the background (saturating this machine the way a small
 * shared CI runner is saturated by the rest of `npm run check` running concurrently) made
 * `tests/content/migration.test.ts` fail 3 out of 5 consecutive full-file runs with the retry
 * exhausted, matching the CI failure shape exactly. So 3 retries of the *same racy bootstrap* is
 * not a reliable mitigation under real contention — the race can be persistent enough within a
 * short burst that back-to-back retries land in the same bad window.
 *
 * Real fix (this version): stop invoking `payload/bin.js` for `migrate`/`migrate:create`/
 * `migrate:down`/`migrate:status` entirely. `scripts/run-payload-migration-cli.mts` calls the
 * exact same public `payload.db.migrate()` / `.createMigration()` / `.migrateDown()` /
 * `.migrateStatus()` functions that `payload/dist/bin/migrate.js` itself calls (same migration
 * mechanism under test, unchanged), but that script is invoked via `tsx <script>` — the same
 * bootstrap `runTsxScript()` below already uses for `stamp-environment.mts`, which registers tsx's
 * ESM loader once, up front, before any application code runs (closer to Node's own `--import`
 * flag than to a mid-execution `tsImport()` call). This is not a guess: in the *same* PR #34 CI
 * run where `payload/bin.js`-based calls raced repeatedly, all 4 `runTsxScript()`-based
 * `stamp-environment.mts` invocations in that run succeeded cleanly with zero races — direct
 * evidence, from the real failing CI run, not just a local guess. Confirmed again locally under
 * the same `stress-ng --cpu 16 --cpu-load 95` load that reproduced the CI failure: the plain
 * `tsx <script>` bootstrap hit zero "unsettled top-level await" occurrences across the stress
 * testing done for this fix (see the report for exact run counts), while the old `payload/bin.js`
 * path failed 3/5 full-suite runs under identical load.
 *
 * The retry loop below is kept as a defense-in-depth safety net, not the primary mitigation —
 * it now guards a code path (tsx CLI's own loader bootstrap) with no direct evidence of ever
 * racing, rather than the one now known to race persistently under contention.
 */
const UNSETTLED_TOP_LEVEL_AWAIT_RE = /Detected unsettled top-level await/;
const UNSETTLED_TOP_LEVEL_AWAIT_EXIT_CODE = 13;
const MIGRATION_CLI_BOOTSTRAP_RACE_MAX_ATTEMPTS = 3;

/** `payload <args>` の等価物を、`payload/bin.js`ではなく`scripts/run-payload-migration-cli.mts`
 * （`tsx`経由、上のdocblock参照）を通して実行する。migrate / migrate:create / migrate:down /
 * migrate:status 用。defense-in-depthとして、既知のbootstrap raceシグネチャに限定した
 * 再試行（最大2回まで）も残す。 */
export function runPayloadCli(args: string[], env: EnvOverride): CliResult {
  let result: SpawnSyncReturns<string>;
  for (let attempt = 1; attempt <= MIGRATION_CLI_BOOTSTRAP_RACE_MAX_ATTEMPTS; attempt++) {
    result = spawnSync(TSX_BIN, [MIGRATION_CLI_SCRIPT, '--', ...args], {
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
    if (attempt < MIGRATION_CLI_BOOTSTRAP_RACE_MAX_ATTEMPTS) {
      console.warn(
        `[runPayloadCli] known migration CLI bootstrap race (exit ${UNSETTLED_TOP_LEVEL_AWAIT_EXIT_CODE}) hit on attempt ${attempt}/${MIGRATION_CLI_BOOTSTRAP_RACE_MAX_ATTEMPTS} for "${args.join(' ')}", retrying`,
      );
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
