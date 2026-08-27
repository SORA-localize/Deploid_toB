/**
 * `environment-marker`（table: `_environment_marker`）へ「このDBはpreviewかproductionのどちらか」
 * を1行だけ冪等に書き込む。deploy pipelineが `payload:migrate` の直後、`build` より前に実行する
 * 想定（`docs/reference/database-migration-runbook-v1.md`）。
 *
 * 安全設計:
 * - `DEPLOYMENT_ENV`（deploy pipelineが環境ごとに設定するenv var）と `--expected` が一致しない
 *   限り何もしない。誤ったpipeline設定でproduction DBへ`preview`を書く、または逆方向の事故を
 *   コード上で防ぐ二重チェック。
 * - 既存行が0件なら `{ environment: expected, singleton: 1 }` を作成する。
 * - 既存行が1件で値が一致するなら何もしない（再実行しても安全 = 冪等）。
 * - 既存行が1件で値が違う（反対環境の行が既にある）なら **変更せず** exit 1 する。
 * - 既存行が2件以上（DBのunique制約が壊れていない限り起きない）ならdata corruptionとして
 *   exit 1 する。
 *
 * Usage: `npm run environment:stamp -- --expected preview`
 *
 * Run via `tsx` (see `package.json`'s `environment:stamp` script), not raw
 * `node --experimental-strip-types`: `payload.config.ts` and its transitive imports use
 * extensionless relative specifiers throughout this codebase, which Node's native TS-stripping
 * resolver does not resolve. `payload migrate` itself resolves `payload.config.ts` the same way —
 * via `tsx`'s resolver internally (see `node_modules/payload/bin.js`) — so using `tsx` here keeps
 * this script's module resolution consistent with the Payload CLI it complements.
 */
import { getPayload } from 'payload';
import { assertWritableDatabaseUrl } from '../lib/content/databaseSafety';

/**
 * `getPayload()` normally runs Payload's dev-mode schema auto-push (`pushDevSchema`, via
 * `@payloadcms/drizzle`) unless `NODE_ENV === 'production'`, `payload.config.ts`'s adapter sets
 * `push: false`, or `PAYLOAD_MIGRATING === 'true'` (the flag `payload migrate` itself sets before
 * calling `payload.init`). This script is the deploy pipeline's sibling to `payload migrate` —
 * it must never trigger a schema push of its own (that would defeat this whole task's point:
 * schema changes only via committed, reviewed migrations). Setting this before importing the
 * config guarantees `getPayload()` below skips `pushDevSchema` entirely, matching what
 * `payload migrate` does. (Confirmed necessary: without this, a first `getPayload()` call in a
 * fresh process invokes drizzle-kit's interactive `pushSchema` diff/prompt flow, which hangs
 * forever in a non-interactive deploy pipeline with no stdin.)
 */
process.env.PAYLOAD_MIGRATING = 'true';

import config from '../payload.config';

type Environment = 'preview' | 'production';
const VALID_ENVIRONMENTS: readonly Environment[] = ['preview', 'production'];

function isEnvironment(value: string): value is Environment {
  return (VALID_ENVIRONMENTS as readonly string[]).includes(value);
}

function parseExpectedArg(argv: string[]): Environment {
  const flagIndex = argv.indexOf('--expected');
  const value = flagIndex >= 0 ? argv[flagIndex + 1] : undefined;
  if (!value || !isEnvironment(value)) {
    throw new Error(
      `--expected <preview|production> is required. Got: ${value ?? '(missing)'}. ` +
        'Usage: npm run environment:stamp -- --expected preview',
    );
  }
  return value;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const expected = parseExpectedArg(argv);

  const deploymentEnv = process.env.DEPLOYMENT_ENV;
  if (deploymentEnv !== expected) {
    console.error(
      `[environment:stamp] refusing: DEPLOYMENT_ENV="${deploymentEnv ?? '(unset)'}" does not match ` +
        `--expected "${expected}". This is a deploy-pipeline misconfiguration guard — fix the ` +
        'pipeline env var or the --expected flag before retrying. No database write was made.',
    );
    process.exitCode = 1;
    return;
  }

  // DEPLOYMENT_ENV/--expected only agree on the label. Require the matching
  // target confirmation before opening Payload, so a correctly labelled but
  // wrong managed DATABASE_URL cannot be stamped silently.
  assertWritableDatabaseUrl({
    raw: process.env.DATABASE_URL,
    callerFile: 'scripts/stamp-environment.mts',
    confirmedProduction: expected === 'production' && argv.includes('--i-know-this-is-production'),
    confirmedPreview: expected === 'preview' && argv.includes('--i-know-this-is-preview'),
    confirmedPersistentLocalDatabase: argv.includes('--i-know-this-is-a-persistent-local-database'),
  });

  const payload = await getPayload({ config });
  try {
    const { docs: existing } = await payload.find({
      collection: 'environment-marker',
      limit: 2,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.length === 0) {
      await payload.create({
        collection: 'environment-marker',
        overrideAccess: true,
        data: { environment: expected, singleton: 1 },
      });
      console.log(`[environment:stamp] stamped this database as "${expected}" (1 row inserted).`);
      return;
    }

    if (existing.length > 1) {
      console.error(
        `[environment:stamp] refusing: found ${existing.length} rows in _environment_marker, expected ` +
          'at most 1 (the unique constraint on `singleton` should make this impossible — treat as data ' +
          'corruption and investigate before retrying). No database write was made.',
      );
      process.exitCode = 1;
      return;
    }

    const [row] = existing;
    if (row.environment === expected) {
      console.log(`[environment:stamp] already stamped as "${expected}" — no-op (idempotent).`);
      return;
    }

    console.error(
      `[environment:stamp] refusing: this database is already stamped as "${row.environment}", which ` +
        `conflicts with --expected "${expected}". Not overwriting an existing environment marker — ` +
        'this guard exists specifically to catch a deploy pipeline pointed at the wrong database. ' +
        'No database write was made.',
    );
    process.exitCode = 1;
  } finally {
    await payload.destroy();
  }
}

main()
  .catch((err) => {
    console.error('[environment:stamp] unexpected error:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    // `payload.destroy()` above does not reliably let the Node process exit on its own — the
    // underlying pg pool can leave sockets open past the point all work is done (confirmed: the
    // process hung indefinitely after logging its final message and returning). Payload's own
    // CLI wrapper (`node_modules/payload/dist/bin/index.js`) works around exactly this by calling
    // `process.exit(0)` right after `payload.destroy()` rather than trusting a natural exit; do
    // the same here so a deploy pipeline invoking this script doesn't hang forever on a clean run.
    process.exit(process.exitCode ?? 0);
  });
