import { readdir, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  cosignAvailable,
  mkdtempDir,
  removeTempDir,
  signManifest,
  verifyManifestSignature,
  withTempDir,
  type CutoverBaselineManifest,
} from '@/scripts/export-content-snapshot.mts';
import { countRecords } from '@/scripts/compare-content-sources.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

/**
 * 必須修正11-1 / 11-2（remediation group 3）。
 *
 * brief の要求:
 * 1. snapshot / 署名の一時 directory は mkdtemp で 0700 相当とし、finally で必ず削除する
 * 2. 平文 snapshot、公開鍵 temp、bundle を /tmp へ残さない
 *
 * 修正前は `path.join(os.tmpdir(), \`deploid-snapshot-${process.pid}-${Date.now()}\`)` を
 * `mkdir` していた——名前が予測可能で、mode は umask 任せ、しかも**一度も削除していなかった**。
 * 平文 snapshot（全 content record）と cosign bundle と公開鍵が /tmp に残り続けていた。
 */

const listDeploidTempDirs = async (): Promise<string[]> =>
  (await readdir(os.tmpdir())).filter((entry) => entry.startsWith('deploid-'));

describe('temp directory creation (必須修正11-1)', () => {
  it('creates an unpredictable directory under the OS temp root with 0700', async () => {
    const dir = await mkdtempDir();
    try {
      expect(path.dirname(dir)).toBe(os.tmpdir());
      // `deploid-snapshot-<pid>-<millis>` のような推測可能な名前ではない。
      expect(path.basename(dir)).toMatch(/^deploid-snapshot-[A-Za-z0-9]{6}$/);
      const mode = (await stat(dir)).mode & 0o777;
      expect(mode).toBe(0o700);
    } finally {
      await removeTempDir(dir);
    }
  });

  it('removes the directory even when the work inside it throws', async () => {
    let captured = '';
    await expect(
      withTempDir(async (dir) => {
        captured = dir;
        await writeFile(path.join(dir, 'snapshot.json'), 'plaintext snapshot');
        throw new Error('signing failed');
      }),
    ).rejects.toThrow(/signing failed/);

    expect(captured).not.toBe('');
    await expect(stat(captured)).rejects.toThrow();
  });

  it('is safe to remove a directory that is already gone', async () => {
    const dir = await mkdtempDir();
    await removeTempDir(dir);
    await expect(removeTempDir(dir)).resolves.toBeUndefined();
  });
});

const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

describe.skipIf(!canSignForReal)('signing leaves nothing behind (必須修正11-2)', () => {
  const manifest: CutoverBaselineManifest = {
    provenance: {
      sourceKind: 'payload',
      environment: 'local-throwaway',
      databaseResourceId: 'localhost:5432/throwaway',
      auditBlobStoreId: 'local-throwaway-no-audit-store',
      schemaVersion: 'test',
      baselineRunId: 'baseline-temp-hygiene-test',
      baselineGeneration: 1,
    },
    storage: { provider: 'local-disk', bucket: '/tmp', storeId: null, objectKey: 'k.json', versionId: null },
    mediaInventory: [],
    sha256: 'd'.repeat(64),
    signature: { algorithm: 'cosign', keyId: 'k', detachedSignatureObjectKey: 'k.json.cosign.bundle' },
    recordCounts: countRecords(contentSnapshotFixture) as CutoverBaselineManifest['recordCounts'],
    exportedAt: '2026-08-15T00:00:00.000Z',
    exportedBy: 'temp-hygiene-test',
  };

  /**
   * 署名と検証を1往復して、`/tmp` の `deploid-*` エントリが**1件も増えていない**ことを見る。
   * 平文 manifest / bundle / 公開鍵 PEM のどれが残っても、この検査は落ちる。
   */
  it('leaves no plaintext document, bundle or public key in the OS temp root', async () => {
    const before = new Set(await listDeploidTempDirs());

    const envelope = await signManifest(manifest);
    expect(await verifyManifestSignature(envelope)).toMatchObject({ verified: true });

    const after = await listDeploidTempDirs();
    expect(after.filter((entry) => !before.has(entry))).toEqual([]);
  }, 180_000);
});
