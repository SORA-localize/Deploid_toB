import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertLocalThrowawayDatabase,
  createThrowawayDatabase,
  dropThrowawayDatabase,
  runPayloadCli,
  runTsxScript,
  withDatabaseName,
} from './migrationTestSupport';

/**
 * Task 3.5: Postgres migration の生成・適用・検証（brief Step 2〜5）。
 *
 * 他の `tests/content/*.test.ts` と違い、このsuiteは1つの共有throwaway DBに対する
 * Payload Local API操作ではなく、複数の**独立したPostgres database**を自分でcreate/dropし、
 * 実際の `payload migrate*` CLIを子processとして起動して検証する
 * （`migrationTestSupport.ts` の冒頭コメントに理由を記載: `payload.config.ts` はimport時に
 * 一度だけ評価されmodule cacheされるため、同一process内で`DATABASE_URL`を書き換えても
 * 既存importには反映されない）。
 *
 * `DATABASE_URL` のhostがlocalhost系であることを`assertLocalThrowawayDatabase`で強制する
 * （Production/Preview Supabaseへ接続しない — brief必須要件）。
 */

const AMBIENT_DATABASE_URL = process.env.DATABASE_URL;
const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET ?? 'migration-test-secret-not-for-production-use-000000';

const RUN_ID = randomUUID().slice(0, 8);
const EMPTY_DB_NAME = `deploid_migtest_empty_${RUN_ID}`;
const SEEDED_DB_NAME = `deploid_migtest_seeded_${RUN_ID}`;

const REPO_ROOT = process.cwd();
const REAL_MIGRATIONS_DIR = path.join(REPO_ROOT, 'migrations');
const FIXTURE_CONFIG_PATH = path.join(REPO_ROOT, 'tests/fixtures/payload-migrations/mcp-fixture.config.ts');
const REAL_PAYLOAD_TYPES_PATH = path.join(REPO_ROOT, 'payload-types.ts');
const TMP_ROOT = path.join(REPO_ROOT, 'tests/fixtures/payload-migrations', `.tmp-${RUN_ID}`);
const TMP_EMPTY_DB_MIGRATIONS_DIR = path.join(TMP_ROOT, 'empty-db-migrations');
const TMP_SEEDED_DB_MIGRATIONS_DIR = path.join(TMP_ROOT, 'seeded-db-migrations');

/**
 * Payload/drizzle-kit（このrepoのバージョン: `payload@3.87.1`）が生成する down() migrationの
 * 既知バグへの手当て。詳細と再現手順は `docs/reference/database-migration-runbook-v1.md`
 * 「既知の生成物バグ」節を参照。
 *
 * 症状: 新しいcollectionを追加するmigrationのdown()で、生成順序が
 *   1. `DROP TABLE "<new_table>" CASCADE;` （他tableからの参照FKもCASCADEで一緒に消える）
 *   2. `ALTER TABLE "<other_table>" DROP CONSTRAINT "..._<new_table>_fk";` （もう存在しない）
 * となり、2で `constraint ... does not exist` エラーになる。1のCASCADEが2を既に終わらせている。
 *
 * 対処: 2の行（`<new_table>` を参照するconstraint dropだけ）を取り除く。CASCADEが既に
 * やっているので取り除いても安全 — 後続の DROP INDEX / DROP COLUMN 行は constraint の有無に
 * 依存しないためそのまま残す。
 */
function stripCascadeRedundantDropConstraints(migrationSource: string, newTableName: string): string {
  const pattern = new RegExp(`\\n\\s*ALTER TABLE "[^"]+" DROP CONSTRAINT "[^"]*_${newTableName}_fk";\\n?`, 'g');
  return migrationSource.replace(pattern, '\n');
}

/**
 * `<dir>/index.ts` は `writeMigrationIndex`（`@payloadcms/drizzle`）が毎回書く索引ファイルで、
 * 実際のmigration本体ではない（`readMigrationFiles.js` も `f !== 'index.ts'` で明示的に除外して
 * いる）。素朴に `.endsWith('.ts')` だけで数えると index.ts を1本余分に数えてしまうため、
 * このsuite全体で migration本体だけを数えるときは必ずこれを使う。
 */
function listMigrationFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
}

describe('Postgres migrations (Task 3.5) — isolated throwaway databases only', () => {
  // Regression guard for a real bug this suite caused once already: the fixture config's CLI
  // invocations run with cwd = repo root (same as the real payload.config.ts's invocations), so
  // an unguarded `typescript.outputFile` default (`${cwd}/payload-types.ts`) silently overwrote
  // the real, committed `payload-types.ts` with the MCP-plugin-inclusive fixture's types — the
  // contamination shipped in a commit before being caught. Fixed by giving the fixture its own
  // explicit `typescript.outputFile` inside the per-run temp dir (see
  // `tests/fixtures/payload-migrations/mcp-fixture.config.ts`); this asserts the file this suite
  // must never touch is byte-identical before and after the whole suite runs, so a future fixture
  // (or a future edit to this one) that reintroduces the same class of mistake fails loudly here
  // instead of silently shipping in a commit again.
  let payloadTypesBefore: string;

  beforeAll(() => {
    assertLocalThrowawayDatabase('tests/content/migration.test.ts', AMBIENT_DATABASE_URL);
    fs.mkdirSync(TMP_EMPTY_DB_MIGRATIONS_DIR, { recursive: true });
    fs.mkdirSync(TMP_SEEDED_DB_MIGRATIONS_DIR, { recursive: true });
    payloadTypesBefore = fs.readFileSync(REAL_PAYLOAD_TYPES_PATH, 'utf8');
  });

  afterAll(async () => {
    if (AMBIENT_DATABASE_URL) {
      await dropThrowawayDatabase(AMBIENT_DATABASE_URL, EMPTY_DB_NAME).catch(() => undefined);
      await dropThrowawayDatabase(AMBIENT_DATABASE_URL, SEEDED_DB_NAME).catch(() => undefined);
    }
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  });

  describe('Step 2: generate + apply the initial migration against a fresh empty DB', () => {
    it(
      'generates one migration file, applies it, and migrate:status reports it applied',
      async () => {
        await createThrowawayDatabase(AMBIENT_DATABASE_URL!, EMPTY_DB_NAME);
        const env = {
          DATABASE_URL: withDatabaseName(AMBIENT_DATABASE_URL!, EMPTY_DB_NAME),
          PAYLOAD_SECRET,
          PAYLOAD_TEST_MIGRATION_DIR: TMP_EMPTY_DB_MIGRATIONS_DIR,
        };

        const create = runPayloadCli(['migrate:create', 'initial-schema'], env);
        expect(create.status, `migrate:create failed:\n${create.stdout}\n${create.stderr}`).toBe(0);
        const generated = listMigrationFiles(TMP_EMPTY_DB_MIGRATIONS_DIR);
        expect(generated.length).toBe(1);

        const migrate = runPayloadCli(['migrate'], env);
        expect(migrate.status, `migrate failed:\n${migrate.stdout}\n${migrate.stderr}`).toBe(0);

        const status = runPayloadCli(['migrate:status'], env);
        expect(status.status, status.stderr).toBe(0);
        expect(status.stdout).toMatch(/Yes/);
        expect(status.stdout).not.toMatch(/\bNo\b/);
      },
      60_000,
    );

    it('creates the 10 collection tables, content_route_registry (UNIQUE namespace,slug), and _environment_marker', async () => {
      const client = new Client({ connectionString: withDatabaseName(AMBIENT_DATABASE_URL!, EMPTY_DB_NAME) });
      await client.connect();
      try {
        const { rows } = await client.query<{ table_name: string }>(
          `select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
        );
        const tableNames = rows.map((r) => r.table_name);

        const expectedTables = [
          'admins',
          'manufacturers',
          'distributors',
          'robot_series',
          'robots',
          'use_cases',
          'deployments',
          'articles',
          'article_placements',
          'media',
          'content_route_registry',
          '_environment_marker',
        ];
        for (const expected of expectedTables) {
          expect(tableNames, `missing table "${expected}". Present: ${tableNames.join(', ')}`).toContain(expected);
        }

        const { rows: indexRows } = await client.query<{ indexdef: string }>(
          `select indexdef from pg_indexes where tablename = 'content_route_registry'`,
        );
        const uniqueNamespaceSlug = indexRows.some(
          (r) => /unique/i.test(r.indexdef) && /namespace/.test(r.indexdef) && /slug/.test(r.indexdef),
        );
        expect(uniqueNamespaceSlug, `content_route_registry indexes: ${JSON.stringify(indexRows)}`).toBe(true);
      } finally {
        await client.end();
      }
    });
  });

  describe('environment:stamp — idempotent insert / reject conflicting environment', () => {
    const dbUrl = () => withDatabaseName(AMBIENT_DATABASE_URL!, EMPTY_DB_NAME);

    it('refuses when DEPLOYMENT_ENV does not match --expected, and makes no DB write', () => {
      const result = runTsxScript('scripts/stamp-environment.mts', ['--expected', 'preview'], {
        DATABASE_URL: dbUrl(),
        PAYLOAD_SECRET,
        DEPLOYMENT_ENV: '',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/does not match/);
    });

    it('inserts exactly one row on the first stamp (DEPLOYMENT_ENV matches --expected)', () => {
      const result = runTsxScript('scripts/stamp-environment.mts', ['--expected', 'preview'], {
        DATABASE_URL: dbUrl(),
        PAYLOAD_SECRET,
        DEPLOYMENT_ENV: 'preview',
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(result.stdout).toMatch(/stamped/);
    });

    it('is idempotent: re-running with the same environment is a no-op, exit 0, still exactly one row', async () => {
      const result = runTsxScript('scripts/stamp-environment.mts', ['--expected', 'preview'], {
        DATABASE_URL: dbUrl(),
        PAYLOAD_SECRET,
        DEPLOYMENT_ENV: 'preview',
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(result.stdout).toMatch(/no-op/);

      const client = new Client({ connectionString: dbUrl() });
      await client.connect();
      try {
        const { rows } = await client.query('select environment from _environment_marker');
        expect(rows.length).toBe(1);
        expect(rows[0].environment).toBe('preview');
      } finally {
        await client.end();
      }
    });

    it('refuses to overwrite a conflicting existing row, exit 1, row unchanged', async () => {
      const result = runTsxScript('scripts/stamp-environment.mts', ['--expected', 'production'], {
        DATABASE_URL: dbUrl(),
        PAYLOAD_SECRET,
        DEPLOYMENT_ENV: 'production',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/conflicts/);

      const client = new Client({ connectionString: dbUrl() });
      await client.connect();
      try {
        const { rows } = await client.query('select environment, singleton from _environment_marker');
        expect(rows.length).toBe(1);
        expect(rows[0].environment).toBe('preview');
        expect(Number(rows[0].singleton)).toBe(1);
      } finally {
        await client.end();
      }
    });
  });

  describe('Step 3/4/5: existing-schema DB, real MCP api-key fixture migration, down/up, drift detection', () => {
    const NEW_TABLE_NAME = 'payload_mcp_api_keys';
    let generatedMigrationBasename: string;

    const seededDbUrl = () => withDatabaseName(AMBIENT_DATABASE_URL!, SEEDED_DB_NAME);
    const fixtureEnv = () => ({
      DATABASE_URL: seededDbUrl(),
      PAYLOAD_SECRET,
      PAYLOAD_CONFIG_PATH: FIXTURE_CONFIG_PATH,
      PAYLOAD_TEST_MIGRATION_DIR: TMP_SEEDED_DB_MIGRATIONS_DIR,
    });

    it(
      'Step 3 setup: applies the real committed initial-schema migration to a fresh DB, then seeds a row',
      async () => {
        await createThrowawayDatabase(AMBIENT_DATABASE_URL!, SEEDED_DB_NAME);

        // Apply the *real* committed migrations/ (production config, production dir — no override)
        // so this DB starts in exactly the state a real environment would be in before Task 8 adds
        // MCP support.
        const migrate = runPayloadCli(['migrate'], { DATABASE_URL: seededDbUrl(), PAYLOAD_SECRET });
        expect(migrate.status, `${migrate.stdout}\n${migrate.stderr}`).toBe(0);

        const client = new Client({ connectionString: seededDbUrl() });
        await client.connect();
        try {
          await client.query(
            `insert into manufacturers (stable_id, slug, name) values ('seed-test-manufacturer', 'seed-test-manufacturer', 'Seed Test Manufacturer')`,
          );
        } finally {
          await client.end();
        }

        // migrate:create writes into whatever migrationDir the config points at, and diffs against
        // the *last snapshot file* in that dir — not a live DB introspection (confirmed by reading
        // @payloadcms/drizzle's buildCreateMigration.js). Seed the temp dir with the real committed
        // migration's .ts/.json so the next migrate:create's baseline matches what's actually
        // applied to this DB.
        for (const file of fs.readdirSync(REAL_MIGRATIONS_DIR)) {
          if (file.endsWith('.ts') || file.endsWith('.json')) {
            fs.copyFileSync(path.join(REAL_MIGRATIONS_DIR, file), path.join(TMP_SEEDED_DB_MIGRATIONS_DIR, file));
          }
        }
      },
      60_000,
    );

    it(
      'Step 5a (drift exists): migrate:create --skip-empty against the real MCP plugin fixture generates a migration file (not an arbitrary field)',
      () => {
        const before = listMigrationFiles(TMP_SEEDED_DB_MIGRATIONS_DIR);
        // migrate:create sanitizes the migration name with `name.replace(/\W/g, '_')` — a `-` in
        // the name argument becomes `_` in the actual filename, so match on the sanitized form.
        const result = runPayloadCli(['migrate:create', 'driftcheck1', '--skip-empty'], fixtureEnv());
        expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);

        const after = listMigrationFiles(TMP_SEEDED_DB_MIGRATIONS_DIR);
        const generated = after.filter((f) => !before.includes(f));
        expect(generated.length, 'expected migrate:create to detect drift and write exactly one file').toBe(1);
        generatedMigrationBasename = generated[0];

        const contents = fs.readFileSync(path.join(TMP_SEEDED_DB_MIGRATIONS_DIR, generatedMigrationBasename), 'utf8');
        // Real, minimal diff: only the plugin's own new table + its FK columns on Payload's
        // polymorphic relationship tables. No unrelated collection should be touched (this is what
        // makes it a legitimate "actually adopted schema" fixture rather than an arbitrary field).
        expect(contents).toContain(`CREATE TABLE "${NEW_TABLE_NAME}"`);
        expect(contents).not.toMatch(/DROP TABLE "(?!payload_mcp_api_keys")/);
        expect(contents).not.toContain('media" DROP COLUMN "prefix"');
      },
      30_000,
    );

    it('Step 5b / Step 4 (no drift, empty migration): a second migrate:create --skip-empty now produces no file and exits 0 non-interactively', () => {
      const before = listMigrationFiles(TMP_SEEDED_DB_MIGRATIONS_DIR).length;
      const result = runPayloadCli(['migrate:create', 'driftcheck2', '--skip-empty'], fixtureEnv());
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      const after = listMigrationFiles(TMP_SEEDED_DB_MIGRATIONS_DIR).length;
      expect(after, 'no new file should be written once the fixture matches its last migration snapshot').toBe(before);
    });

    it(
      'Step 3 (apply): applying the generated MCP api-keys migration keeps the pre-existing seeded row intact',
      async () => {
        // Hand-fix a confirmed Payload/drizzle-kit generator bug in this migration's down() before
        // applying (see docs/reference/database-migration-runbook-v1.md "known generator bug"):
        // `DROP TABLE ... CASCADE` already removes FK constraints that other still-existing tables
        // hold against the new table, so the generator's subsequent explicit `DROP CONSTRAINT` for
        // those same names fails with "does not exist". This is a one-time confirmed defect fix for
        // this fixture's generated file, not a change to any committed production migration.
        const migrationPath = path.join(TMP_SEEDED_DB_MIGRATIONS_DIR, generatedMigrationBasename);
        const original = fs.readFileSync(migrationPath, 'utf8');
        const fixed = stripCascadeRedundantDropConstraints(original, NEW_TABLE_NAME);
        expect(fixed).not.toBe(original); // sanity: the known-bad pattern was actually present and stripped
        fs.writeFileSync(migrationPath, fixed);

        const migrate = runPayloadCli(['migrate'], fixtureEnv());
        expect(migrate.status, `${migrate.stdout}\n${migrate.stderr}`).toBe(0);

        const client = new Client({ connectionString: seededDbUrl() });
        await client.connect();
        try {
          const { rows: manufacturerRows } = await client.query(
            `select stable_id, name from manufacturers where stable_id = 'seed-test-manufacturer'`,
          );
          expect(manufacturerRows.length, 'pre-existing seeded row must survive the migration').toBe(1);
          expect(manufacturerRows[0].name).toBe('Seed Test Manufacturer');

          const { rows: tableRows } = await client.query(
            `select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`,
            [NEW_TABLE_NAME],
          );
          expect(tableRows.length).toBe(1);
        } finally {
          await client.end();
        }
      },
      60_000,
    );

    it(
      'Step 4 (down): migrate:down removes only the new migration, keeps the seeded row, table is gone',
      async () => {
        const down = runPayloadCli(['migrate:down'], fixtureEnv());
        expect(down.status, `${down.stdout}\n${down.stderr}`).toBe(0);

        const status = runPayloadCli(['migrate:status'], fixtureEnv());
        expect(status.status, status.stderr).toBe(0);
        expect(status.stdout).toMatch(/initial_schema[\s\S]*Yes/);

        const client = new Client({ connectionString: seededDbUrl() });
        await client.connect();
        try {
          const { rows: tableRows } = await client.query(
            `select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`,
            [NEW_TABLE_NAME],
          );
          expect(tableRows.length, 'the new table must be gone after down').toBe(0);

          const { rows: manufacturerRows } = await client.query(
            `select stable_id from manufacturers where stable_id = 'seed-test-manufacturer'`,
          );
          expect(manufacturerRows.length, 'seeded row must survive rolling back an unrelated later migration').toBe(1);
        } finally {
          await client.end();
        }
      },
      60_000,
    );

    it(
      'Step 4 (re-up): migrate re-applies the migration cleanly, table and seeded row both present',
      async () => {
        const up = runPayloadCli(['migrate'], fixtureEnv());
        expect(up.status, `${up.stdout}\n${up.stderr}`).toBe(0);

        const client = new Client({ connectionString: seededDbUrl() });
        await client.connect();
        try {
          const { rows: tableRows } = await client.query(
            `select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`,
            [NEW_TABLE_NAME],
          );
          expect(tableRows.length).toBe(1);

          const { rows: manufacturerRows } = await client.query(
            `select stable_id from manufacturers where stable_id = 'seed-test-manufacturer'`,
          );
          expect(manufacturerRows.length).toBe(1);
        } finally {
          await client.end();
        }
      },
      60_000,
    );
  });

  it('never writes to the real, committed payload-types.ts (see beforeAll comment)', () => {
    const payloadTypesAfter = fs.readFileSync(REAL_PAYLOAD_TYPES_PATH, 'utf8');
    expect(payloadTypesAfter).toBe(payloadTypesBefore);
  });
});
