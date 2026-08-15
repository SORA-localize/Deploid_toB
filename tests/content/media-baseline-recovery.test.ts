import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import type { ContentSnapshot } from '@/lib/content/contracts';
import { createPayloadContentSource } from '@/lib/content/payloadSource';
import { compareSnapshots } from '@/scripts/compare-content-sources.mts';
import {
  baselineCompletionMarkerKey,
  canonicalJson,
  cosignAvailable,
  createLocalDiskObjectStore,
  exportSignedBaseline,
  type BaselineProvenance,
} from '@/scripts/export-content-snapshot.mts';
import { createBaselineMediaFileResolver, restoreContentSnapshot } from '@/scripts/import-content-to-payload.mts';
import { checkMediaInventory, verifyBaselineBeforeRestore } from '@/scripts/restore-preflight.mts';
import { authorizeRestoreFromVerifiedBaseline } from '@/scripts/restoreAuthorization.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * 必須修正9（remediation group 3）の回帰テスト。
 *
 * 監査の指摘（原文）:
 * > 現在の署名 snapshot は media metadata しか持たず、画像バイト列の checksum も無い。
 *
 * brief の要求:
 * 1. baseline 単体から media を復元できる方針を実装する（signed inventory に objectKey/sha256/size/mimeType）
 * 2. public media Blob が残っていることだけを復旧前提にしない
 * 3. restore 時に全 media の sha256 を検証する
 * 4. 欠落・改ざん・取得失敗が1件でもあれば exit 1
 * 5. metadata parity だけでなく binary inventory parity も検証する
 */

const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const PNG_SHA256 = createHash('sha256').update(ONE_PX_PNG).digest('hex');

const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const LOCAL_PROVENANCE: BaselineProvenance = {
  sourceKind: 'payload',
  environment: 'local-throwaway',
  databaseResourceId: 'localhost:5432/throwaway',
  auditBlobStoreId: 'local-throwaway-no-audit-store',
  schemaVersion: 'test',
  baselineRunId: 'baseline-media-recovery-test',
  baselineGeneration: 1,
};

// ─── 純粋ロジック: inventory parity と byte 検証 ───────────────────────────

describe('media binary inventory parity (必須修正9-3 / 9-4 / 9-5)', () => {
  const inventoryFor = (snapshot: ContentSnapshot) =>
    snapshot.media.map((asset) => ({
      stableId: asset.id,
      filename: asset.filename,
      objectKey: `baseline.media/${PNG_SHA256}`,
      sha256: PNG_SHA256,
      size: ONE_PX_PNG.byteLength,
      mimeType: asset.mimeType ?? 'image/png',
    }));

  const fetchOk = async () => ONE_PX_PNG;

  it('accepts an inventory that matches the snapshot byte for byte', async () => {
    expect(
      await checkMediaInventory({
        snapshot: contentSnapshotFixture,
        inventory: inventoryFor(contentSnapshotFixture),
        fetchMediaObject: fetchOk,
      }),
    ).toEqual([]);
  });

  it('rejects a snapshot media record with no bytes in the baseline', async () => {
    const failures = await checkMediaInventory({
      snapshot: contentSnapshotFixture,
      inventory: [],
      fetchMediaObject: fetchOk,
    });
    expect(failures.map((failure) => failure.check)).toEqual(['mediaInventory']);
    expect(failures[0].detail).toMatch(/not recoverable from the baseline alone/);
  });

  it('rejects inventory bytes that are not in the snapshot (binary inventory parity)', async () => {
    const inventory = [
      ...inventoryFor(contentSnapshotFixture),
      {
        stableId: 'media:/media/not-in-the-snapshot.png',
        filename: 'not-in-the-snapshot.png',
        objectKey: `baseline.media/${PNG_SHA256}`,
        sha256: PNG_SHA256,
        size: ONE_PX_PNG.byteLength,
        mimeType: 'image/png',
      },
    ];
    const failures = await checkMediaInventory({
      snapshot: contentSnapshotFixture,
      inventory,
      fetchMediaObject: fetchOk,
    });
    expect(failures[0].detail).toMatch(/no record in the snapshot/);
  });

  it('rejects tampered bytes (sha256 mismatch)', async () => {
    const failures = await checkMediaInventory({
      snapshot: contentSnapshotFixture,
      inventory: inventoryFor(contentSnapshotFixture),
      fetchMediaObject: async () => Buffer.from('not the signed image'),
    });
    expect(failures.map((failure) => failure.check)).toEqual(['mediaBytes']);
    expect(failures[0].detail).toMatch(/the signed inventory says/);
  });

  it('rejects bytes that cannot be fetched at all', async () => {
    const failures = await checkMediaInventory({
      snapshot: contentSnapshotFixture,
      inventory: inventoryFor(contentSnapshotFixture),
      fetchMediaObject: async () => {
        throw new Error('blob-object-not-found');
      },
    });
    expect(failures.map((failure) => failure.check)).toEqual(['mediaBytes']);
    expect(failures[0].detail).toMatch(/could not read/);
  });

  it('rejects a size that disagrees with the signed inventory', async () => {
    const inventory = inventoryFor(contentSnapshotFixture).map((entry) => ({ ...entry, size: entry.size + 1 }));
    const failures = await checkMediaInventory({
      snapshot: contentSnapshotFixture,
      inventory,
      fetchMediaObject: fetchOk,
    });
    expect(failures[0].detail).toMatch(/bytes, the signed inventory says/);
  });

  it('rejects a filename that disagrees with the snapshot', async () => {
    const inventory = inventoryFor(contentSnapshotFixture).map((entry) => ({ ...entry, filename: 'renamed.png' }));
    const failures = await checkMediaInventory({
      snapshot: contentSnapshotFixture,
      inventory,
      fetchMediaObject: fetchOk,
    });
    expect(failures[0].detail).toMatch(/differs from the snapshot's/);
  });
});

describe('baseline media resolver (必須修正9-1 / 9-3)', () => {
  const candidate = {
    asset: contentSnapshotFixture.media[0],
    src: contentSnapshotFixture.media[0].url,
    hostable: true,
    usedBy: [],
  };

  it('returns the signed bytes for a known media record', async () => {
    const resolver = createBaselineMediaFileResolver({
      inventory: [
        {
          stableId: candidate.asset.id,
          filename: candidate.asset.filename,
          objectKey: 'k',
          sha256: PNG_SHA256,
          size: ONE_PX_PNG.byteLength,
          mimeType: 'image/png',
        },
      ],
      fetchMediaObject: async () => ONE_PX_PNG,
    });
    const resolution = await resolver(candidate);
    expect('file' in resolution && resolution.file.data.equals(ONE_PX_PNG)).toBe(true);
  });

  /**
   * 必須修正9-4: 欠落・改ざんは **skip ではなく失敗**。skip にすると
   * `checkImportOutcome` 経由の「部分 restore」扱いになるが、そもそも書き込みを始めてはいけない。
   */
  it('throws instead of skipping when the bytes are missing or tampered', async () => {
    const missing = createBaselineMediaFileResolver({ inventory: [], fetchMediaObject: async () => ONE_PX_PNG });
    await expect(missing(candidate)).rejects.toThrow(/baseline-media-missing/);

    const tampered = createBaselineMediaFileResolver({
      inventory: [
        {
          stableId: candidate.asset.id,
          filename: candidate.asset.filename,
          objectKey: 'k',
          sha256: 'f'.repeat(64),
          size: ONE_PX_PNG.byteLength,
          mimeType: 'image/png',
        },
      ],
      fetchMediaObject: async () => ONE_PX_PNG,
    });
    await expect(tampered(candidate)).rejects.toThrow(/baseline-media-digest-mismatch/);
  });
});

// ─── 実 cosign + 実 KMS + 実 Payload/Postgres ─────────────────────────────

describe.skipIf(!canSignForReal)('recovering media from the signed baseline alone', () => {
  let payload: Payload;
  let owner: unknown;
  const OWNER_EMAIL = 'media-recovery-owner@example.com';
  const PASSWORD = 'Str0ngPassw0rd!23';

  const CONTENT_COLLECTIONS = [
    'article-placements',
    'articles',
    'deployments',
    'use-cases',
    'distributors',
    'robots',
    'robot-series',
    'manufacturers',
    'media',
  ] as const;

  const uploadDir = path.join(process.cwd(), 'media');

  const wipeContent = async () => {
    for (const collection of CONTENT_COLLECTIONS) {
      await payload.delete({ collection, where: {}, overrideAccess: true });
    }
    await payload.delete({ collection: 'content-route-registry', where: {}, overrideAccess: true });
    // 「public media store が失われた」状態を作る（必須修正9-2）。
    for (const asset of contentSnapshotFixture.media) {
      await rm(path.join(uploadDir, asset.filename), { force: true });
    }
  };

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/media-baseline-recovery.test.ts');
    payload = await getPayload({ config });
    await wipeContent();
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
    await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: OWNER_EMAIL, password: PASSWORD, role: 'content-reader' },
    });
    const login = await payload.login({ collection: 'admins', data: { email: OWNER_EMAIL, password: PASSWORD } });
    owner = login.user;
  }, 180_000);

  afterAll(async () => {
    await payload?.destroy();
  });

  const buildBaseline = async (dir: string) => {
    const store = createLocalDiskObjectStore(dir);
    const built = await exportSignedBaseline({
      snapshot: contentSnapshotFixture,
      store,
      exportedBy: 'media-recovery-test',
      provenance: LOCAL_PROVENANCE,
      resolveMediaBytes: async () => ONE_PX_PNG,
    });
    return { store, ...built };
  };

  const verify = async (dir: string, envelope: unknown, objectKey: string, signatureKey: string) => {
    const store = createLocalDiskObjectStore(dir);
    const workDir = await mkdtemp(path.join(os.tmpdir(), 'deploid-media-verify-'));
    try {
      return await verifyBaselineBeforeRestore({
        envelope,
        artifact: await store.get(objectKey),
        artifactSignatureBundle: await store.get(signatureKey),
        completionMarker: await store.get(baselineCompletionMarkerKey(objectKey)).catch(() => null),
        fetchMediaObject: (key) => store.get(key),
        target: {
          environment: null,
          databaseResourceId: LOCAL_PROVENANCE.databaseResourceId,
          schemaVersion: LOCAL_PROVENANCE.schemaVersion,
          auditBlobStoreId: LOCAL_PROVENANCE.auditBlobStoreId,
          lastRestoredBaselineGeneration: null,
          lastRestoredBaselineRunId: null,
          isLocalHost: true,
        },
        workDir,
        writeFile: async (filePath, data) => writeFile(filePath, data),
        joinPath: (...segments) => path.join(...segments),
      });
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  };

  it('writes media bytes into the baseline and records them in the signed manifest', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-media-baseline-'));
    try {
      const { manifest, completion } = await buildBaseline(dir);

      expect(manifest.mediaInventory).toEqual([
        {
          stableId: 'media:/media/fixture-hero.png',
          filename: 'fixture-hero.png',
          objectKey: `${manifest.storage.objectKey}.media/${PNG_SHA256}`,
          sha256: PNG_SHA256,
          size: ONE_PX_PNG.byteLength,
          mimeType: 'image/png',
        },
      ]);
      // バイト列が実際に store へ置かれている（metadata だけではない）。
      const stored = await readFile(path.join(dir, manifest.mediaInventory[0].objectKey));
      expect(stored.equals(ONE_PX_PNG)).toBe(true);
      // 必須修正7-7: 全部置き終えた印。
      expect(completion.mediaInventorySha256).toBe(
        createHash('sha256').update(canonicalJson(manifest.mediaInventory)).digest('hex'),
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /**
   * 必須修正9-1/9-2 の本体: **public media store が空でも** baseline だけで media が戻る。
   */
  it('restores media from the baseline when the public media store is gone', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-media-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      await wipeContent();
      expect((await createPayloadContentSource({ payload }).readSnapshot()).media).toEqual([]);

      const verification = await verify(dir, envelope, manifest.storage.objectKey, manifest.signature.detachedSignatureObjectKey);
      expect(verification.ok, JSON.stringify('failures' in verification ? verification.failures : [])).toBe(true);
      if (!verification.ok) return;

      const store = createLocalDiskObjectStore(dir);
      const report = await restoreContentSnapshot({
        payload,
        snapshot: verification.verified.snapshot,
        user: owner,
        authorization: authorizeRestoreFromVerifiedBaseline(verification.verified),
        mediaResolver: createBaselineMediaFileResolver({
          inventory: verification.verified.mediaInventory,
          fetchMediaObject: (key) => store.get(key),
        }),
      });
      expect(report.skippedMedia).toEqual([]);
      expect(report.created.media).toBe(1);

      const actual = await createPayloadContentSource({ payload }).readSnapshot();
      expect(actual.media.map((asset) => asset.filename)).toEqual(['fixture-hero.png']);
      // 復元されたのは **署名済みの bytes そのもの**。
      const restoredBytes = await readFile(path.join(uploadDir, 'fixture-hero.png'));
      expect(createHash('sha256').update(restoredBytes).digest('hex')).toBe(PNG_SHA256);
      expect(compareSnapshots(contentSnapshotFixture, actual)).toEqual({
        missing: [],
        extra: [],
        changed: [],
        brokenReferences: [],
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 300_000);

  it('refuses the whole restore when one media object was tampered with', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-media-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      // store 上のバイト列だけ差し替える（manifest の署名は本物のまま）。
      const objectPath = path.join(dir, manifest.mediaInventory[0].objectKey);
      await rm(objectPath, { force: true });
      await writeFile(objectPath, Buffer.from('replaced image bytes'));

      const verification = await verify(dir, envelope, manifest.storage.objectKey, manifest.signature.detachedSignatureObjectKey);
      expect(verification.ok).toBe(false);
      if (verification.ok) return;
      expect(verification.failures.map((failure) => failure.check)).toContain('mediaBytes');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('refuses the whole restore when one media object is missing', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-media-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      await rm(path.join(dir, manifest.mediaInventory[0].objectKey), { force: true });

      const verification = await verify(dir, envelope, manifest.storage.objectKey, manifest.signature.detachedSignatureObjectKey);
      expect(verification.ok).toBe(false);
      if (verification.ok) return;
      expect(verification.failures.map((failure) => failure.check)).toContain('mediaBytes');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /**
   * 必須修正7-7: completion marker の無い baseline（= 途中で終わった run の残骸）は使わない。
   */
  it('refuses a baseline whose completion marker is missing or belongs to another run', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-media-baseline-'));
    try {
      const { envelope, manifest } = await buildBaseline(dir);
      const markerPath = path.join(dir, baselineCompletionMarkerKey(manifest.storage.objectKey));
      const original = await readFile(markerPath);

      await rm(markerPath, { force: true });
      const withoutMarker = await verify(dir, envelope, manifest.storage.objectKey, manifest.signature.detachedSignatureObjectKey);
      expect(withoutMarker.ok).toBe(false);
      if (!withoutMarker.ok) {
        expect(withoutMarker.failures[0].check).toBe('baselineCompletion');
        expect(withoutMarker.failures[0].detail).toMatch(/never finished uploading/);
      }

      const forged = { ...JSON.parse(original.toString('utf8')), baselineRunId: 'baseline-from-a-different-run' };
      await writeFile(markerPath, canonicalJson(forged));
      const wrongRun = await verify(dir, envelope, manifest.storage.objectKey, manifest.signature.detachedSignatureObjectKey);
      expect(wrongRun.ok).toBe(false);
      if (!wrongRun.ok) expect(wrongRun.failures[0].check).toBe('baselineCompletion');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /**
   * 必須修正7-7 の export 側: media の upload が途中で失敗した run は、
   * **置いた分を消して** completion marker も残さない。
   */
  it('leaves no usable baseline behind when the media upload fails midway', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-media-baseline-'));
    try {
      const store = createLocalDiskObjectStore(dir);
      await expect(
        exportSignedBaseline({
          snapshot: contentSnapshotFixture,
          store,
          exportedBy: 'media-recovery-test',
          provenance: LOCAL_PROVENANCE,
          resolveMediaBytes: async () => {
            throw new Error('media store unreachable');
          },
        }),
      ).rejects.toThrow(/baseline-upload-incomplete/);

      // snapshot も signature も残っていない（後から「使えそうな baseline」に見えない）。
      const { readdir } = await import('node:fs/promises');
      const left = await readdir(path.join(dir, 'cutover-baseline')).catch(() => []);
      expect(left).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);
});
