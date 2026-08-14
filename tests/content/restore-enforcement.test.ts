import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '@/lib/content/contracts';
import { countRecords } from '@/scripts/compare-content-sources.mts';
import {
  assertValidEnvelope,
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
  assertRestoreInputModeAllowed,
  checkImportOutcome,
  checkProvenanceAgainstTarget,
  checkSnapshotIntegrity,
  databaseResourceId,
  isLocalDatabaseHost,
  verifyBaselineBeforeRestore,
  type RestoreTargetIdentity,
} from '@/scripts/restore-preflight.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';
import { runTsxScript } from './migrationTestSupport';

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

const LOCAL_TARGET: RestoreTargetIdentity = {
  environment: 'production',
  databaseResourceId: 'db.example.supabase.co:5432/postgres#prodref',
  schemaVersion: '20260814_020026_site_settings_data_as_of_and_placement_limits',
  auditBlobStoreId: 'store_deploid_audit_production',
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

  it('allows an unsigned raw --input only with an explicit test mode off-localhost', () => {
    expect(() => call({ hasRawInput: true, isLocalHost: false, explicitTestMode: true })).not.toThrow();
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
      created: {},
      updated: {},
    });
    expect(failures.map((failure) => failure.check)).toEqual(['skippedMedia']);
  });

  it('accepts a restore that skipped nothing', () => {
    expect(checkImportOutcome({ skippedMedia: [], created: {}, updated: {} })).toEqual([]);
  });
});

// ─── 必須修正6-10: bare manifest を受け付けない ───────────────────────────

describe('signed baseline envelope (必須修正6-10)', () => {
  const manifest: CutoverBaselineManifest = {
    provenance: MATCHING_PROVENANCE,
    storage: { provider: 'vercel-blob', bucket: 'deploid-audit-production', objectKey: 'k.json', versionId: null },
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
//
// `tests/content/import-parity.test.ts` と同じ条件分岐。cosign バイナリと KMS credential が
// 揃っている環境でだけ実行する（CI では skip される）。
const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

describe.skipIf(!canSignForReal)('signed restore pipeline against the real KMS key', () => {
  const buildBaseline = async (dir: string, provenance = MATCHING_PROVENANCE) => {
    const store = createLocalDiskObjectStore(dir);
    const built = await exportSignedBaseline({
      snapshot: contentSnapshotFixture,
      store,
      exportedBy: 'restore-enforcement-test',
      provenance,
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
      });
      const brokenResult = await verifyBaselineBeforeRestore({
        envelope: brokenBuilt.envelope,
        artifact: await brokenStore.get(brokenBuilt.manifest.storage.objectKey),
        artifactSignatureBundle: await brokenStore.get(brokenBuilt.manifest.signature.detachedSignatureObjectKey),
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
      storage: { provider: 'local-disk', bucket: '/tmp', objectKey: 'k.json', versionId: null },
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
