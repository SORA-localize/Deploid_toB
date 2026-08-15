import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '@/lib/content/contracts';
import { countRecords } from '@/scripts/compare-content-sources.mts';
import {
  assertValidEnvelope,
  baselineCompletionMarkerKey,
  canonicalJson,
  cosignAvailable,
  createLocalDiskObjectStore,
  exportSignedBaseline,
  signManifest,
  verifyManifestSignature,
  type BaselineProvenance,
  type CutoverBaselineManifest,
  type SignedBaselineEnvelope,
} from '@/scripts/export-content-snapshot.mts';
import { createDefaultMediaFileResolver, resolveWithinRoot } from '@/scripts/import-content-to-payload.mts';
import {
  assertRawInputTargetAllowed,
  assertRestoreInputModeAllowed,
  checkImportOutcome,
  checkProvenanceAgainstTarget,
  checkSnapshotIntegrity,
  databaseResourceId,
  isLocalDatabaseHost,
  verifyBaselineBeforeRestore,
  type RestoreTargetIdentity,
} from '@/scripts/restore-preflight.mts';
import {
  encodeUnsignedJwtForTests,
  resolveBlobCredential,
  type BlobCredential,
} from '@/scripts/snapshotObjectStore.mts';
import { authorizeRestoreFromVerifiedBaseline } from '@/scripts/restoreAuthorization.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';
import { Client } from 'pg';
import {
  assertLocalThrowawayDatabase,
  createThrowawayDatabase,
  dropThrowawayDatabase,
  runPayloadCli,
  runTsxScript,
  withDatabaseName,
} from './migrationTestSupport';

/**
 * remediation group 2 / 必須修正6 の負テスト。
 *
 * 監査の指摘（原文）: 「未署名・改ざん済み・別環境向けの JSON ファイルでも、
 * `--i-know-this-is-production` さえ付ければそのまま managed DB へ書き込める」。
 *
 * brief が要求する負テストをすべてここで固定する:
 * - unsigned raw snapshot を managed DB へ restore できない
 * - 改ざん artifact を DB 変更前に拒否
 * - wrong environment / wrong DB resource / wrong Blob store を拒否
 * - duplicate stable ID を拒否
 * - path traversal を拒否
 * - schema 欠落を拒否
 * - restore 途中失敗後に成功表示しない
 */
const clone = (snapshot: ContentSnapshot): ContentSnapshot => structuredClone(snapshot);

/** fixture の画像は repo に実体を持たないので、baseline へ同梱するテスト用の 1px PNG。 */
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

// `tests/content/import-parity.test.ts` と同じ条件分岐。cosign バイナリと KMS credential が
// 揃っている環境でだけ実署名テストを走らせる（CI では skip される）。
// **file 先頭で定義する**: 下の describe だけでなく、実DB統合テストの `it.skipIf` からも
// 参照するため（module 末尾に置くと collection 時点で TDZ になる）。
const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const LOCAL_TARGET: RestoreTargetIdentity = {
  environment: 'production',
  databaseResourceId: 'db.example.supabase.co:5432/postgres#prodref',
  schemaVersion: '20260814_020026_site_settings_data_as_of_and_placement_limits',
  auditBlobStoreId: 'store_deploid_audit_production',
  lastRestoredBaselineGeneration: null,
  lastRestoredBaselineRunId: null,
  isLocalHost: false,
};

const MATCHING_PROVENANCE: BaselineProvenance = {
  sourceKind: 'payload',
  environment: 'production',
  databaseResourceId: LOCAL_TARGET.databaseResourceId,
  auditBlobStoreId: LOCAL_TARGET.auditBlobStoreId as string,
  schemaVersion: LOCAL_TARGET.schemaVersion,
  baselineRunId: 'baseline-2026-08-14T00:00:00.000Z-abc',
  baselineGeneration: 7,
};

// ─── 必須修正6-1 / 6-2: 入力形式のゲート ──────────────────────────────────

describe('restore input mode (必須修正6-1 / 6-2)', () => {
  const call = (overrides: Partial<Parameters<typeof assertRestoreInputModeAllowed>[0]>) =>
    assertRestoreInputModeAllowed({
      hasManifest: false,
      hasRawInput: false,
      isLocalHost: false,
      explicitTestMode: false,
      ...overrides,
    });

  it('refuses an unsigned raw --input against a managed database', () => {
    expect(() => call({ hasRawInput: true, isLocalHost: false })).toThrow(/restore-raw-input-refused/);
  });

  it('allows an unsigned raw --input against a local throwaway database', () => {
    expect(() => call({ hasRawInput: true, isLocalHost: true })).not.toThrow();
  });

  /**
   * review fix round 1 / Critical #1: `--test-mode` は**単独では効かない**。
   * 効いてしまうと `--input evil.json --test-mode --i-know-this-is-production` で
   * 未署名 JSON を managed production DB へ書き込めてしまい、監査が指摘した穴と
   * 区別が付かない抜け道になる。
   */
  it('refuses --test-mode on its own — the flag alone proves nothing', () => {
    expect(() => call({ hasRawInput: true, isLocalHost: false, explicitTestMode: true })).toThrow(
      /restore-raw-input-refused/,
    );
    expect(() =>
      call({ hasRawInput: true, isLocalHost: false, explicitTestMode: true, nodeEnv: 'production' }),
    ).toThrow(/restore-raw-input-refused/);
  });

  it('accepts --test-mode only under a real test runner (NODE_ENV=test)', () => {
    expect(() =>
      call({ hasRawInput: true, isLocalHost: false, explicitTestMode: true, nodeEnv: 'test' }),
    ).not.toThrow();
  });

  it('refuses NODE_ENV=test without the explicit flag', () => {
    expect(() => call({ hasRawInput: true, isLocalHost: false, nodeEnv: 'test' })).toThrow(
      /restore-raw-input-refused/,
    );
  });

  /**
   * 二段構えの後段。`NODE_ENV` は操作者が立てられるが、`_environment_marker` は
   * `environment:stamp` が書く DB 自身の申告で、restore 側からは偽装できない。
   */
  it('refuses an unsigned input whenever the database says it is production or preview', () => {
    for (const environment of ['production', 'preview'] as const) {
      expect(() => assertRawInputTargetAllowed({ ...LOCAL_TARGET, environment })).toThrow(
        /restore-raw-input-refused/,
      );
    }
    expect(() => assertRawInputTargetAllowed({ ...LOCAL_TARGET, environment: null })).not.toThrow();
  });

  it('allows --manifest against a managed database', () => {
    expect(() => call({ hasManifest: true, isLocalHost: false })).not.toThrow();
  });

  it('refuses both or neither input form', () => {
    expect(() => call({ hasManifest: true, hasRawInput: true })).toThrow(/either --manifest or --input/);
    expect(() => call({})).toThrow(/requires --manifest/);
  });

  it('classifies database hosts the same way the guard does', () => {
    expect(isLocalDatabaseHost('postgresql://u@127.0.0.1:5432/x')).toBe(true);
    expect(isLocalDatabaseHost('postgresql://u@localhost:5432/x')).toBe(true);
    expect(isLocalDatabaseHost('postgresql://u@db.abcdef.supabase.co:5432/postgres')).toBe(false);
  });
});

/**
 * 上のunitと同じgateを、**実際のCLIプロセス**で確かめる。
 *
 * `DATABASE_URL` は解決しない架空のSupabase host（`db.example.supabase.co`）にしてある。
 * gate は `getPayload()` より前に走るので、この test は**どのDBにも接続しない**
 * （接続してしまうなら、それ自体がこの test の失敗）。
 */
describe('content:restore CLI refuses an unsigned input against a managed database', () => {
  it('exits non-zero with restore-raw-input-refused, before any connection', () => {
    const result = runTsxScript(
      'scripts/export-content-snapshot.mts',
      ['--restore', '--input', '/tmp/deploid-nonexistent-snapshot.json', '--i-know-this-is-production'],
      {
        DATABASE_URL: 'postgresql://user:pass@db.example.supabase.co:5432/postgres',
        PAYLOAD_SECRET: 'x'.repeat(32),
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/restore-raw-input-refused/);
    // 「接続できなかった」ではなく「入力形式で拒否した」ことを確かめる。
    expect(`${result.stdout}${result.stderr}`).not.toMatch(/ENOTFOUND|ECONNREFUSED|getaddrinfo/);
  }, 120_000);
});

/**
 * review fix round 1 / Critical #2 の回帰テスト。
 *
 * `getPayload({ config })` は Payload の dev-mode schema push（`pushDevSchema`）を走らせ、
 * **実際に DDL を実行して `payload_migrations` へ `batch: -1` の行を INSERT する**。
 * これが検証より前に起きていたため、「refusing to write. No database change was made.」は
 * 事実に反していた（改ざん envelope でも managed DB へ schema sync が走る）。
 *
 * `scripts/stamp-environment.mts` と同じく `PAYLOAD_MIGRATING = 'true'` を config import より
 * 前に置いて push を止める。**空の（migrate していない）DB へ restore を向けて、
 * table が1つも作られないこと**で確認する — push が走れば全 table が出来てしまうので、
 * これは素通しできない検査になる。
 */
describe('content:restore never pushes schema before verification (Critical #2)', () => {
  const ambient = process.env.DATABASE_URL as string;
  const dbName = 'deploid_restore_nopush_test';

  beforeAll(() => {
    assertLocalThrowawayDatabase('tests/content/restore-enforcement.test.ts', ambient);
  });

  it('leaves an unmigrated target database completely untouched', async () => {
    await createThrowawayDatabase(ambient, dbName);
    const targetUrl = withDatabaseName(ambient, dbName);
    try {
      const snapshotPath = path.join(await mkdtemp(path.join(os.tmpdir(), 'deploid-nopush-')), 'snapshot.json');
      await writeFile(snapshotPath, canonicalJson(contentSnapshotFixture), 'utf8');

      const result = runTsxScript(
        'scripts/export-content-snapshot.mts',
        ['--restore', '--input', snapshotPath, '--bootstrap-admin', '--admin-email', 'nopush@example.com', '--admin-password', 'Str0ngPassw0rd!23'],
        { DATABASE_URL: targetUrl, PAYLOAD_SECRET: 'x'.repeat(32) },
      );
      expect(result.status).not.toBe(0);

      // schema push が走っていたら Payload の table が一式出来ている。
      const client = new Client({ connectionString: targetUrl });
      await client.connect();
      try {
        const { rows } = await client.query(
          "select table_name from information_schema.tables where table_schema = 'public'",
        );
        expect(
          rows.map((row) => row.table_name as string),
          'restore must not create any table before its checks pass',
        ).toEqual([]);
      } finally {
        await client.end();
      }
    } finally {
      await dropThrowawayDatabase(ambient, dbName);
    }
  }, 180_000);
});

/**
 * review fix round 2: **DB側の強制ポイント**を実CLI + 実throwaway Postgres で検証する。
 *
 * round 1 では `assertRawInputTargetAllowed()` と baseline generation ledger の配線を
 * 手動実行でしか確認しておらず、合成した `RestoreTargetIdentity` に対する純粋関数の単体テスト
 * しか無かった。そのため**呼び出し箇所を消してもsuite全体がgreenのまま**という状態で、
 * これはまさに Important #1 が指摘した「署名・記録されるだけで比較されない」パターンの再発だった。
 * この2つは壊れると **fail open**（stamp済みDBでもraw inputが通る / replayが通る）なので、
 * 実際の配線をテストで固定する。
 */
const PAYLOAD_SECRET = 'x'.repeat(32);
const ADMIN_EMAIL = 'restore-integration@example.com';
const ADMIN_PASSWORD = 'Str0ngPassw0rd!23';

/** 最小の有効な snapshot。media も content も持たないので、restore が外部ファイルに依存しない。 */
const EMPTY_SNAPSHOT = {
  robots: [],
  robotSeries: [],
  distributors: [],
  manufacturers: [],
  useCases: [],
  deployments: [],
  articles: [],
  articlePlacements: [],
  articleIndexPlacementLimits: { hero: 5, feature: 2 },
  media: [],
  siteSettings: { dataAsOf: '2026-08' },
};

async function readLedger(databaseUrl: string): Promise<{ environment: string | null; generation: number | null }> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const { rows } = await client.query(
      'select environment, last_restored_baseline_generation from "_environment_marker"',
    );
    if (rows.length === 0) return { environment: null, generation: null };
    return {
      environment: rows[0].environment as string | null,
      generation: rows[0].last_restored_baseline_generation === null
        ? null
        : Number(rows[0].last_restored_baseline_generation),
    };
  } finally {
    await client.end();
  }
}

describe('restore/export enforcement against a real throwaway database', () => {
  const ambient = process.env.DATABASE_URL as string;

  beforeAll(() => {
    assertLocalThrowawayDatabase('tests/content/restore-enforcement.test.ts', ambient);
  });

  /**
   * review fix round 2 / Critical #2 の残り半分。`content:export --source payload` は
   * `readSnapshotFromSource()` 経由で `getPayload()` を呼ぶため、round 1 で
   * `resolveExportProvenance()` の中に置いた guard では**間に合っていなかった**
   * （接続が先、guard が後）。restore 側と同じ方法で確認する。
   */
  it('content:export --source payload never pushes schema to an unmigrated database', async () => {
    const dbName = 'deploid_export_nopush_test';
    await createThrowawayDatabase(ambient, dbName);
    const targetUrl = withDatabaseName(ambient, dbName);
    try {
      const outPath = path.join(await mkdtemp(path.join(os.tmpdir(), 'deploid-export-nopush-')), 'snapshot.json');
      const result = runTsxScript(
        'scripts/export-content-snapshot.mts',
        ['--source', 'payload', '--out', outPath],
        { DATABASE_URL: targetUrl, PAYLOAD_SECRET },
        120_000,
      );
      expect(result.status).not.toBe(0);

      const client = new Client({ connectionString: targetUrl });
      await client.connect();
      try {
        const { rows } = await client.query(
          "select table_name from information_schema.tables where table_schema = 'public'",
        );
        expect(
          rows.map((row) => row.table_name as string),
          'content:export must not create any table',
        ).toEqual([]);
      } finally {
        await client.end();
      }
    } finally {
      await dropThrowawayDatabase(ambient, dbName);
    }
  }, 300_000);

  /**
   * review fix round 2 / Critical #1 の統合テスト。報告書に手動確認として書いていたシナリオを
   * 自動化する: `environment:stamp` で `preview` と刻んだDBは、**localhost であっても**
   * 未署名 raw `--input` を拒否する。`assertRawInputTargetAllowed()` の呼び出しを外すと落ちる。
   */
  it('refuses a raw --input restore against a database stamped preview, even on localhost', async () => {
    const dbName = 'deploid_stamped_refusal_test';
    await createThrowawayDatabase(ambient, dbName);
    const targetUrl = withDatabaseName(ambient, dbName);
    try {
      expect(runPayloadCli(['migrate'], { DATABASE_URL: targetUrl, PAYLOAD_SECRET }).status).toBe(0);
      const stamped = runTsxScript('scripts/stamp-environment.mts', ['--expected', 'preview'], {
        DATABASE_URL: targetUrl,
        PAYLOAD_SECRET,
        DEPLOYMENT_ENV: 'preview',
      });
      expect(stamped.status, `${stamped.stdout}\n${stamped.stderr}`).toBe(0);

      const snapshotPath = path.join(await mkdtemp(path.join(os.tmpdir(), 'deploid-stamped-')), 'snapshot.json');
      await writeFile(snapshotPath, canonicalJson(EMPTY_SNAPSHOT), 'utf8');

      const result = runTsxScript(
        'scripts/export-content-snapshot.mts',
        ['--restore', '--input', snapshotPath, '--bootstrap-admin', '--admin-email', ADMIN_EMAIL, '--admin-password', ADMIN_PASSWORD],
        { DATABASE_URL: targetUrl, PAYLOAD_SECRET },
        120_000,
      );

      expect(result.status).not.toBe(0);
      const output = `${result.stdout}${result.stderr}`;
      expect(output).toMatch(/restore-raw-input-refused/);
      expect(output).toMatch(/identifies itself as "preview"/);
    } finally {
      await dropThrowawayDatabase(ambient, dbName);
    }
  }, 300_000);

  /**
   * review fix round 2 / Important #1 の統合テスト。実CLIを2回呼び、
   * **正規に署名された古い世代の baseline** が操作者フラグ無しで拒否され、
   * ledger が巻き戻らないことを確認する。実 AWS KMS 署名が要るので credential がある環境のみ。
   */
  it.skipIf(!canSignForReal)(
    'records the restored baseline generation and refuses a signed older one afterwards',
    async () => {
      const dbName = 'deploid_generation_ledger_test';
      await createThrowawayDatabase(ambient, dbName);
      const targetUrl = withDatabaseName(ambient, dbName);
      const storeDir = await mkdtemp(path.join(os.tmpdir(), 'deploid-gen-store-'));
      const env = {
        DATABASE_URL: targetUrl,
        PAYLOAD_SECRET,
        PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID: 'store_test_preview',
        PAYLOAD_IMPORT_ADMIN_EMAIL: ADMIN_EMAIL,
        PAYLOAD_IMPORT_ADMIN_PASSWORD: ADMIN_PASSWORD,
      };

      try {
        expect(runPayloadCli(['migrate'], env).status).toBe(0);

        // 1. seed（まだ stamp していないので raw --input が使える）。
        const snapshotPath = path.join(storeDir, 'seed.json');
        await writeFile(snapshotPath, canonicalJson(EMPTY_SNAPSHOT), 'utf8');
        const seeded = runTsxScript(
          'scripts/export-content-snapshot.mts',
          ['--restore', '--input', snapshotPath, '--bootstrap-admin'],
          env,
          180_000,
        );
        expect(seeded.status, `${seeded.stdout}\n${seeded.stderr}`).toBe(0);

        // 2. preview として刻む（ここから ledger の強制が効く）。
        expect(runTsxScript('scripts/stamp-environment.mts', ['--expected', 'preview'], { ...env, DEPLOYMENT_ENV: 'preview' }).status).toBe(0);

        const exportBaseline = (generation: number, manifestOut: string) =>
          runTsxScript(
            'scripts/export-content-snapshot.mts',
            [
              '--source', 'payload', '--upload', '--store', 'local-disk', '--store-dir', storeDir,
              '--manifest-out', manifestOut, '--exported-by', 'ledger-test',
              '--baseline-generation', String(generation),
            ],
            env,
            300_000,
          );

        const gen5Manifest = path.join(storeDir, 'gen5.json');
        const exported5 = exportBaseline(5, gen5Manifest);
        expect(exported5.status, `${exported5.stdout}\n${exported5.stderr}`).toBe(0);

        // 3. generation 5 を restore → 成功し、ledger へ記録される。
        const restored5 = runTsxScript(
          'scripts/export-content-snapshot.mts',
          ['--restore', '--manifest', gen5Manifest],
          env,
          300_000,
        );
        expect(restored5.status, `${restored5.stdout}\n${restored5.stderr}`).toBe(0);
        expect(restored5.stdout).toMatch(/recorded baseline generation 5/);
        expect(await readLedger(targetUrl)).toEqual({ environment: 'preview', generation: 5 });

        // 4. **正規に署名された** generation 2 を作る（署名は本物、世代だけ古い）。
        const gen2Manifest = path.join(storeDir, 'gen2.json');
        const exported2 = exportBaseline(2, gen2Manifest);
        expect(exported2.status, `${exported2.stdout}\n${exported2.stderr}`).toBe(0);

        // 5. 操作者フラグを一切渡さずに restore → 世代チェックだけで拒否されなければならない。
        const replayed = runTsxScript(
          'scripts/export-content-snapshot.mts',
          ['--restore', '--manifest', gen2Manifest],
          env,
          300_000,
        );
        expect(replayed.status).not.toBe(0);
        const output = `${replayed.stdout}${replayed.stderr}`;
        expect(output).toMatch(/FAIL baselineGeneration/);
        expect(output).toMatch(/already restored generation 5/);
        expect(output).toMatch(/No database change was made/);

        // 6. ledger は巻き戻っていない。
        expect(await readLedger(targetUrl)).toEqual({ environment: 'preview', generation: 5 });
      } finally {
        await rm(storeDir, { recursive: true, force: true });
        await dropThrowawayDatabase(ambient, dbName);
      }
    },
    900_000,
  );
});

// ─── 必須修正6-3: 対象DB identity の照合 ──────────────────────────────────

describe('provenance vs the real restore target (必須修正6-3)', () => {
  it('passes when every identity matches', () => {
    expect(checkProvenanceAgainstTarget(MATCHING_PROVENANCE, LOCAL_TARGET)).toEqual([]);
  });

  it('rejects an artifact built for a different environment', () => {
    const provenance = { ...MATCHING_PROVENANCE, environment: 'preview' as const };
    expect(checkProvenanceAgainstTarget(provenance, LOCAL_TARGET).map((failure) => failure.check)).toContain(
      'environmentMarker',
    );
  });

  it('rejects a database with no _environment_marker row at all', () => {
    const target = { ...LOCAL_TARGET, environment: null };
    const failures = checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target);
    expect(failures.map((failure) => failure.check)).toContain('environmentMarker');
    expect(failures.find((failure) => failure.check === 'environmentMarker')?.detail).toMatch(
      /no _environment_marker row/,
    );
  });

  it('rejects a different database resource (wrong Supabase project)', () => {
    const target = { ...LOCAL_TARGET, databaseResourceId: 'db.example.supabase.co:5432/postgres#otherref' };
    expect(checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target).map((failure) => failure.check)).toContain(
      'databaseResourceId',
    );
  });

  it('rejects a different private audit blob store', () => {
    const target = { ...LOCAL_TARGET, auditBlobStoreId: 'store_deploid_audit_preview' };
    expect(checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target).map((failure) => failure.check)).toContain(
      'auditBlobStoreId',
    );
  });

  it('rejects a schema generation mismatch', () => {
    const target = { ...LOCAL_TARGET, schemaVersion: '20260811_153537_initial_schema' };
    expect(checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target).map((failure) => failure.check)).toContain(
      'schemaVersion',
    );
  });

  it('rejects replaying a different baseline than the operator named (必須修正6-10)', () => {
    const failures = checkProvenanceAgainstTarget(MATCHING_PROVENANCE, LOCAL_TARGET, {
      expectedBaselineRunId: 'baseline-2026-01-01T00:00:00.000Z-old',
    });
    expect(failures.map((failure) => failure.check)).toContain('baselineRunId');
  });

  /**
   * review fix round 1 / Important #1: 世代チェックは**無条件**。
   * `--expected-baseline-run-id` を渡さなくても、DBが記録している「これまでに適用した最大世代」
   * より古い artifact は拒否される。
   */
  it('rejects an older baseline generation than the one this database already restored', () => {
    const target = { ...LOCAL_TARGET, lastRestoredBaselineGeneration: 9 };
    const failures = checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target);
    expect(failures.map((failure) => failure.check)).toContain('baselineGeneration');
    expect(failures.find((failure) => failure.check === 'baselineGeneration')?.detail).toMatch(
      /already restored generation 9/,
    );
  });

  it('allows re-applying the same generation only when it is the same baseline run', () => {
    const target = {
      ...LOCAL_TARGET,
      lastRestoredBaselineGeneration: MATCHING_PROVENANCE.baselineGeneration,
      lastRestoredBaselineRunId: MATCHING_PROVENANCE.baselineRunId,
    };
    expect(checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target)).toEqual([]);
  });

  it('rejects a different baseline run that reuses the already-restored generation', () => {
    const target = {
      ...LOCAL_TARGET,
      lastRestoredBaselineGeneration: MATCHING_PROVENANCE.baselineGeneration,
      lastRestoredBaselineRunId: 'baseline-2026-08-14T00:00:00.000Z-other',
    };
    const failures = checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target);
    expect(failures.map((failure) => failure.check)).toContain('baselineRunId');
    expect(failures.find((failure) => failure.check === 'baselineRunId')?.detail).toMatch(/same generation/);
  });

  it('fails closed when an applied generation has no recorded baseline run id', () => {
    const target = {
      ...LOCAL_TARGET,
      lastRestoredBaselineGeneration: MATCHING_PROVENANCE.baselineGeneration,
      lastRestoredBaselineRunId: null,
    };
    const failures = checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target);
    expect(failures.map((failure) => failure.check)).toContain('baselineRunId');
    expect(failures.find((failure) => failure.check === 'baselineRunId')?.detail).toMatch(/does not record the run id/);
  });

  it('allows moving forward to a newer generation', () => {
    const target = { ...LOCAL_TARGET, lastRestoredBaselineGeneration: 1 };
    expect(checkProvenanceAgainstTarget(MATCHING_PROVENANCE, target)).toEqual([]);
  });

  it('rejects an environment the operator did not expect', () => {
    const failures = checkProvenanceAgainstTarget(MATCHING_PROVENANCE, LOCAL_TARGET, {
      expectedEnvironment: 'preview',
    });
    expect(failures.map((failure) => failure.check)).toContain('expectedEnvironment');
  });

  it('never puts credentials into the database resource id', () => {
    const id = databaseResourceId('postgresql://postgres.abcdefgh:sup3r-secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres');
    expect(id).toBe('aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres#abcdefgh');
    expect(id).not.toContain('sup3r-secret');
  });
});

// ─── 必須修正6-3 / 6-5: snapshot 内容の検査 ───────────────────────────────

describe('snapshot integrity before restore (必須修正6-3)', () => {
  const counts = countRecords(contentSnapshotFixture);

  it('passes on the untouched fixture', () => {
    expect(checkSnapshotIntegrity(clone(contentSnapshotFixture), counts)).toEqual([]);
  });

  it('rejects a duplicate stable id', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.robots.push(structuredClone(snapshot.robots[0]));
    const failures = checkSnapshotIntegrity(snapshot, { ...counts, robots: counts.robots + 1 });
    expect(failures.map((failure) => failure.check)).toContain('duplicateStableId');
  });

  it('rejects a broken relationship reference', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.articles[0].relatedUseCaseIds = ['fixture-usecase-that-does-not-exist'];
    const failures = checkSnapshotIntegrity(snapshot, counts);
    expect(failures.map((failure) => failure.check)).toContain('brokenReference');
  });

  it('rejects record counts that disagree with the artifact body', () => {
    const failures = checkSnapshotIntegrity(clone(contentSnapshotFixture), { ...counts, media: counts.media + 1 });
    expect(failures).toEqual([
      { check: 'recordCounts', detail: `media: manifest says ${counts.media + 1}, artifact contains ${counts.media}` },
    ]);
  });
});

// ─── 必須修正6-6: media path traversal ────────────────────────────────────

describe('media resolver path containment (必須修正6-6)', () => {
  it('rejects traversal, absolute paths and encoded traversal', () => {
    const root = '/tmp/deploid-root';
    expect(resolveWithinRoot(root, '../secret.txt')).toBeUndefined();
    expect(resolveWithinRoot(root, 'a/../../secret.txt')).toBeUndefined();
    expect(resolveWithinRoot(root, '/etc/passwd')).toBeUndefined();
    expect(resolveWithinRoot(root, 'nested/ok.png')).toBe(path.join(root, 'nested/ok.png'));
  });

  it('refuses to read a file outside the upload root, however the path is encoded', async () => {
    const base = await mkdtemp(path.join(os.tmpdir(), 'deploid-traversal-'));
    try {
      const uploadDir = path.join(base, 'media');
      await mkdir(uploadDir, { recursive: true });
      // root の**外**に置いた「秘密」。resolver がこれを読めてはいけない。
      await writeFile(path.join(base, 'secret.env'), 'DATABASE_URL=postgresql://stolen', 'utf8');
      await writeFile(path.join(uploadDir, 'legit.png'), 'legit bytes');

      const resolver = createDefaultMediaFileResolver({ uploadDir, publicDir: uploadDir });
      const candidate = (src: string, filename: string) => ({
        asset: {
          id: `media:${src}`,
          filename,
          url: src,
          alt: '',
          mimeType: 'image/png',
          rights: { status: 'own' as const, sourceType: 'own' as const, checkedAt: '2026-01-01' },
        },
        src,
        hostable: true,
        usedBy: [],
      });

      for (const attack of [
        '/api/media/file/../secret.env',
        '/api/media/file/..%2Fsecret.env',
        '/api/media/file/%2e%2e%2fsecret.env',
        '/api/media/file/nested/../../secret.env',
      ]) {
        const resolution = await resolver(candidate(attack, 'stolen.png'));
        expect('skipped' in resolution, `${attack} must not resolve to a file`).toBe(true);
        expect((resolution as { skipped: string }).skipped).toMatch(/media-path-outside-root/);
      }

      // 正当なパスは今までどおり読める（guardが機能を壊していないこと）。
      const ok = await resolver(candidate('/api/media/file/legit.png', 'legit.png'));
      expect('file' in ok).toBe(true);
      expect((ok as { file: { data: Buffer } }).file.data.toString()).toBe('legit bytes');
    } finally {
      await rm(base, { recursive: true, force: true });
    }
  });
});

// ─── 必須修正6-8: 部分 import を成功にしない ──────────────────────────────

describe('restore outcome (必須修正6-8)', () => {
  it('does not call a restore successful when media was skipped', () => {
    const failures = checkImportOutcome({
      skippedMedia: [{ stableId: 'media:/x.png', src: '/x.png', reason: 'local-file-not-found', usedBy: [] }],
    });
    expect(failures.map((failure) => failure.check)).toEqual(['skippedMedia']);
  });

  it('accepts a restore that skipped nothing', () => {
    expect(checkImportOutcome({ skippedMedia: [] })).toEqual([]);
  });
});

// ─── 必須修正6-10: bare manifest を受け付けない ───────────────────────────

describe('signed baseline envelope (必須修正6-10)', () => {
  const manifest: CutoverBaselineManifest = {
    provenance: MATCHING_PROVENANCE,
    storage: {
      provider: 'vercel-blob',
      bucket: 'deploid-audit-production',
      storeId: 'store_deploid_audit_production',
      objectKey: 'k.json',
      versionId: null,
    },
    mediaInventory: [],
    sha256: 'a'.repeat(64),
    signature: { algorithm: 'cosign', keyId: 'arn:aws:kms:x:1:key/2', detachedSignatureObjectKey: 'k.json.cosign.bundle' },
    recordCounts: countRecords(contentSnapshotFixture) as CutoverBaselineManifest['recordCounts'],
    exportedAt: '2026-08-14T00:00:00.000Z',
    exportedBy: 'operator',
  };

  it('rejects a bare manifest — the manifest itself must be signed', () => {
    expect(() => assertValidEnvelope(structuredClone(manifest))).toThrow(/envelope-invalid/);
    expect(() => assertValidEnvelope(structuredClone(manifest))).toThrow(/must be signed/);
  });

  it('rejects an envelope with a malformed signature block', () => {
    for (const mutate of [
      (envelope: SignedBaselineEnvelope) => { (envelope.manifestSignature as { algorithm: string }).algorithm = 'sha256sum'; },
      (envelope: SignedBaselineEnvelope) => { envelope.manifestSignature.bundleBase64 = ''; },
      (envelope: SignedBaselineEnvelope) => { envelope.manifestSignature.keyId = ''; },
    ]) {
      const envelope: SignedBaselineEnvelope = {
        manifest: structuredClone(manifest),
        manifestSignature: { algorithm: 'cosign', keyId: 'k', bundleBase64: 'AAAA' },
      };
      mutate(envelope);
      expect(() => assertValidEnvelope(envelope)).toThrow(/envelope-invalid/);
    }
  });
});

// ─── 実 cosign + 実 AWS KMS 署名でのパイプライン全体 ───────────────────────

describe.skipIf(!canSignForReal)('signed restore pipeline against the real KMS key', () => {
  const buildBaseline = async (dir: string, provenance = MATCHING_PROVENANCE) => {
    const store = createLocalDiskObjectStore(dir);
    const built = await exportSignedBaseline({
      snapshot: contentSnapshotFixture,
      store,
      exportedBy: 'restore-enforcement-test',
      provenance,
      // 必須修正9: fixture の画像は repo に実体が無いので、テスト用の 1px PNG を同梱する。
      resolveMediaBytes: async () => ONE_PX_PNG,
    });
    return { store, ...built };
  };

  const verify = async (args: {
    dir: string;
    envelope: unknown;
    manifest: CutoverBaselineManifest;
    target?: RestoreTargetIdentity;
    expectedBaselineRunId?: string;
  }) => {
    const store = createLocalDiskObjectStore(args.dir);
    const workDir = await mkdtemp(path.join(os.tmpdir(), 'deploid-verify-'));
    return verifyBaselineBeforeRestore({
      envelope: args.envelope,
      artifact: await store.get(args.manifest.storage.objectKey),
      artifactSignatureBundle: await store.get(args.manifest.signature.detachedSignatureObjectKey),
      completionMarker: await store
        .get(baselineCompletionMarkerKey(args.manifest.storage.objectKey))
        .catch(() => null),
      fetchMediaObject: (objectKey) => store.get(objectKey),
      target: args.target ?? LOCAL_TARGET,
      expectedBaselineRunId: args.expectedBaselineRunId,
      workDir,
      writeFile: async (filePath, data) => writeFile(filePath, data),
      joinPath: (...segments) => path.join(...segments),
    });
  };

  it('accepts a freshly signed baseline whose provenance matches the target', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      expect(await verifyManifestSignature(envelope)).toMatchObject({ verified: true });

      const result = await verify({ dir, envelope, manifest });
      expect(result.ok, JSON.stringify('failures' in result ? result.failures : [])).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('rejects a tampered artifact before touching the database', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      const tampered = clone(contentSnapshotFixture);
      tampered.robots[0].slug = 'attacker-controlled-slug';
      await rm(path.join(dir, manifest.storage.objectKey), { force: true });
      await writeFile(path.join(dir, manifest.storage.objectKey), canonicalJson(tampered));

      const result = await verify({ dir, envelope, manifest });
      expect(result.ok).toBe(false);
      expect('failures' in result && result.failures[0].check).toBe('artifactSignature');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('rejects a manifest whose provenance was edited after signing', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      // 攻撃: 正規 artifact はそのまま、manifest の環境だけ書き換える。
      const forged = structuredClone(envelope);
      forged.manifest.provenance.environment = 'preview';

      const result = await verify({ dir, envelope: forged, manifest });
      expect(result.ok).toBe(false);
      expect('failures' in result && result.failures[0].check).toBe('manifestSignature');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('rejects an old but genuinely signed baseline replayed at a newer generation', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-baseline-'));
    try {
      const old = await buildBaseline(dir, {
        ...MATCHING_PROVENANCE,
        baselineRunId: 'baseline-2026-01-01T00:00:00.000Z-old',
        baselineGeneration: 1,
      });
      // 署名は本物。それでもオペレーターが名指しした baseline と違うので通さない。
      const result = await verify({
        dir,
        envelope: old.envelope,
        manifest: old.manifest,
        expectedBaselineRunId: MATCHING_PROVENANCE.baselineRunId,
      });
      expect(result.ok).toBe(false);
      expect('failures' in result && result.failures.map((failure) => failure.check)).toContain('baselineRunId');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('rejects a signed artifact aimed at a different environment / database / audit store', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      for (const [label, target] of [
        ['environment', { ...LOCAL_TARGET, environment: 'preview' as const }],
        ['database', { ...LOCAL_TARGET, databaseResourceId: 'db.example.supabase.co:5432/postgres#other' }],
        ['audit store', { ...LOCAL_TARGET, auditBlobStoreId: 'store_deploid_audit_preview' }],
      ] as const) {
        const result = await verify({ dir, envelope, manifest, target });
        expect(result.ok, `${label} mismatch must be rejected`).toBe(false);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('rejects a signed artifact whose body fails the strict snapshot schema', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-baseline-'));
    try {
      // schema を壊した snapshot に**正規の署名を付けて**署名済み artifact を作る。
      // 署名は通るので、止まるのは schema 検証でなければならない。
      const broken = clone(contentSnapshotFixture) as unknown as Record<string, unknown>;
      delete (broken.siteSettings as Record<string, unknown>).dataAsOf;
      const { envelope, manifest } = await buildBaseline(dir);

      const store = createLocalDiskObjectStore(dir);
      const workDir = await mkdtemp(path.join(os.tmpdir(), 'deploid-verify-'));
      const result = await verifyBaselineBeforeRestore({
        envelope,
        artifact: await store.get(manifest.storage.objectKey),
        artifactSignatureBundle: await store.get(manifest.signature.detachedSignatureObjectKey),
        completionMarker: await store.get(baselineCompletionMarkerKey(manifest.storage.objectKey)).catch(() => null),
        fetchMediaObject: (objectKey) => store.get(objectKey),
        target: LOCAL_TARGET,
        workDir,
        writeFile: async (filePath, data) => writeFile(filePath, data),
        joinPath: (...segments) => path.join(...segments),
      });
      // 正規 artifact なので通る（対照）。
      expect(result.ok).toBe(true);

      // 同じ鍵で「壊れた snapshot」を署名し直したものは schema で落ちる。
      const brokenDir = await mkdtemp(path.join(os.tmpdir(), 'deploid-broken-'));
      const brokenStore = createLocalDiskObjectStore(brokenDir);
      const brokenBuilt = await exportSignedBaseline({
        snapshot: broken as unknown as ContentSnapshot,
        store: brokenStore,
        exportedBy: 'restore-enforcement-test',
        provenance: MATCHING_PROVENANCE,
        resolveMediaBytes: async () => ONE_PX_PNG,
      });
      const brokenResult = await verifyBaselineBeforeRestore({
        envelope: brokenBuilt.envelope,
        artifact: await brokenStore.get(brokenBuilt.manifest.storage.objectKey),
        artifactSignatureBundle: await brokenStore.get(brokenBuilt.manifest.signature.detachedSignatureObjectKey),
        completionMarker: await brokenStore
          .get(baselineCompletionMarkerKey(brokenBuilt.manifest.storage.objectKey))
          .catch(() => null),
        fetchMediaObject: (objectKey) => brokenStore.get(objectKey),
        target: LOCAL_TARGET,
        workDir: await mkdtemp(path.join(os.tmpdir(), 'deploid-verify-')),
        writeFile: async (filePath, data) => writeFile(filePath, data),
        joinPath: (...segments) => path.join(...segments),
      });
      expect(brokenResult.ok).toBe(false);
      expect('failures' in brokenResult && brokenResult.failures[0].check).toBe('snapshotSchema');
      await rm(brokenDir, { recursive: true, force: true });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('signs and verifies a manifest independently of the artifact', async () => {
    const manifest: CutoverBaselineManifest = {
      provenance: MATCHING_PROVENANCE,
      storage: { provider: 'local-disk', bucket: '/tmp', storeId: null, objectKey: 'k.json', versionId: null },
      mediaInventory: [],
      sha256: 'b'.repeat(64),
      signature: { algorithm: 'cosign', keyId: 'k', detachedSignatureObjectKey: 'k.json.cosign.bundle' },
      recordCounts: countRecords(contentSnapshotFixture) as CutoverBaselineManifest['recordCounts'],
      exportedAt: '2026-08-14T00:00:00.000Z',
      exportedBy: 'operator',
    };
    const envelope = await signManifest(manifest);
    expect(await verifyManifestSignature(envelope)).toMatchObject({ verified: true });

    const forged = structuredClone(envelope);
    forged.manifest.provenance.databaseResourceId = 'db.attacker.example:5432/postgres';
    expect((await verifyManifestSignature(forged)).verified).toBe(false);
  }, 180_000);
});

// ─── 必須修正7-4 を preflight chain 全体で検証する（review fix round 1 / Important #5） ───

/**
 * レビュー指摘: `checkBlobStoreAgainstCredential()` が `tests/` から一度も参照されておらず、
 * 7-4 / 7-8 のカバレッジは純粋関数 `checkBlobStoreSelection` に対するものだけだった。
 * 実 KMS を使う `verifyBaselineBeforeRestore` のテストは全て `local-disk` manifest を作るため、
 * この関数は provider 判定で即 short-circuit し、**`verifyBaselineBeforeRestore` から実際に
 * 呼ばれていることすらテストされていなかった**（呼び出しを消してもスイートは green のまま）。
 *
 * ここでは `vercel-blob` の manifest を実 KMS で署名し、artifact / signature / completion marker /
 * media bytes は local-disk store から供給して、**chain 全体**を通す。
 */
describe.skipIf(!canSignForReal)('blob store identity inside the preflight chain (必須修正7-4 / 7-8)', () => {
  const AUDIT_STORE_ID = 'store_abc123prod';
  const RW_TOKEN_MATCHING = 'vercel_blob_rw_abc123prod_deadbeefcafe';
  const RW_TOKEN_OTHER_STORE = 'vercel_blob_rw_xyz789prev_feedfacecafe';

  const BLOB_PROVENANCE: BaselineProvenance = {
    sourceKind: 'payload',
    environment: 'production',
    databaseResourceId: 'db.example.supabase.co:5432/postgres#prodref',
    auditBlobStoreId: AUDIT_STORE_ID,
    schemaVersion: '20260814_020026_site_settings_data_as_of_and_placement_limits',
    baselineRunId: 'baseline-2026-08-15T00:00:00.000Z-blobchain',
    baselineGeneration: 7,
  };

  const BLOB_TARGET: RestoreTargetIdentity = {
    environment: 'production',
    databaseResourceId: BLOB_PROVENANCE.databaseResourceId,
    schemaVersion: BLOB_PROVENANCE.schemaVersion,
    auditBlobStoreId: AUDIT_STORE_ID,
    lastRestoredBaselineGeneration: null,
    lastRestoredBaselineRunId: null,
    isLocalHost: false,
  };

  /**
   * local-disk store へ本物の baseline を作り、その manifest を「vercel-blob に置いてある」形へ
   * 書き換えて**実 KMS で署名し直す**。bytes は local store から供給するので、store 同定以外の
   * 検査はすべて本物どおりに通る。
   */
  const buildBlobBaseline = async (dir: string, overrides: Partial<CutoverBaselineManifest['storage']> = {}) => {
    const store = createLocalDiskObjectStore(dir);
    const built = await exportSignedBaseline({
      snapshot: contentSnapshotFixture,
      store,
      exportedBy: 'blob-chain-test',
      provenance: BLOB_PROVENANCE,
      resolveMediaBytes: async () => ONE_PX_PNG,
    });
    const manifest: CutoverBaselineManifest = {
      ...built.manifest,
      storage: {
        ...built.manifest.storage,
        provider: 'vercel-blob',
        bucket: 'deploid-audit-production',
        storeId: AUDIT_STORE_ID,
        ...overrides,
      },
    };
    return { store, manifest, envelope: await signManifest(manifest) };
  };

  const verifyWithCredential = async (
    dir: string,
    manifest: CutoverBaselineManifest,
    envelope: unknown,
    blobCredential: BlobCredential | null,
  ) => {
    const store = createLocalDiskObjectStore(dir);
    const workDir = await mkdtemp(path.join(os.tmpdir(), 'deploid-blobchain-'));
    try {
      return await verifyBaselineBeforeRestore({
        envelope,
        artifact: await store.get(manifest.storage.objectKey),
        artifactSignatureBundle: await store.get(manifest.signature.detachedSignatureObjectKey),
        completionMarker: await store.get(baselineCompletionMarkerKey(manifest.storage.objectKey)).catch(() => null),
        fetchMediaObject: (objectKey) => store.get(objectKey),
        blobCredential,
        target: BLOB_TARGET,
        workDir,
        writeFile: async (filePath, data) => writeFile(filePath, data),
        joinPath: (...segments) => path.join(...segments),
      });
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  };

  it('accepts a vercel-blob baseline whose credential selects the same store', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-blobchain-store-'));
    try {
      const { manifest, envelope } = await buildBlobBaseline(dir);
      const result = await verifyWithCredential(dir, manifest, envelope, resolveBlobCredential({
        BLOB_READ_WRITE_TOKEN: RW_TOKEN_MATCHING,
      }));
      expect(result.ok, JSON.stringify('failures' in result ? result.failures : [])).toBe(true);

      // review fix round 1 / Important #1 の正常系: **実際の検証結果**からは authorization が出る。
      if (result.ok) {
        expect(() => authorizeRestoreFromVerifiedBaseline(result.verified)).not.toThrow();
        // 同じ内容でも別 object なら出ない（object identity で照合しているため）。
        expect(() => authorizeRestoreFromVerifiedBaseline({ ...result.verified })).toThrow(
          /not a verification result produced by verifyBaselineBeforeRestore/,
        );
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 300_000);

  it('refuses when this run has no blob credential to identify the store with', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-blobchain-store-'));
    try {
      const { manifest, envelope } = await buildBlobBaseline(dir);
      const result = await verifyWithCredential(dir, manifest, envelope, null);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.failures.map((failure) => failure.check)).toContain('blobCredential');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 300_000);

  it('refuses a credential bound to a different store', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-blobchain-store-'));
    try {
      const { manifest, envelope } = await buildBlobBaseline(dir);
      const result = await verifyWithCredential(dir, manifest, envelope, resolveBlobCredential({
        BLOB_READ_WRITE_TOKEN: RW_TOKEN_OTHER_STORE,
      }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.failures.map((failure) => failure.check)).toContain('blobStoreId');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 300_000);

  it('refuses a manifest whose storage store id disagrees with its own provenance', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-blobchain-store-'));
    try {
      // artifact は store A に置かれたと主張しつつ、provenance の audit store は B。
      const { manifest, envelope } = await buildBlobBaseline(dir, { storeId: 'store_someotherstore' });
      const result = await verifyWithCredential(dir, manifest, envelope, resolveBlobCredential({
        BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_someotherstore_deadbeefcafe',
      }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.failures.map((failure) => failure.check)).toContain('blobStoreProvenance');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 300_000);

  /** 必須修正7-8: Preview の OIDC credential で Production の baseline を読もうとした場合。 */
  it('refuses preview OIDC credentials against a production baseline', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-blobchain-store-'));
    try {
      const { manifest, envelope } = await buildBlobBaseline(dir);
      const previewCredential = resolveBlobCredential({
        VERCEL_OIDC_TOKEN: encodeUnsignedJwtForTests({ environment: 'preview' }),
        BLOB_STORE_ID: AUDIT_STORE_ID,
      });
      const result = await verifyWithCredential(dir, manifest, envelope, previewCredential);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.failures.map((failure) => failure.check)).toContain('blobCredentialEnvironment');
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 300_000);
});
