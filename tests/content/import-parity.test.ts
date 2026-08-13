import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import type { ContentSnapshot } from '@/lib/content/contracts';
import { createPayloadContentSource } from '@/lib/content/payloadSource';
import { siteMeta } from '@/lib/site';
import {
  STRICT_DATE_FIELDS,
  collectMediaReviewItems,
  compareSnapshots,
  countRecords,
  formatMediaReview,
  parityReportIsClean,
} from '@/scripts/compare-content-sources.mts';
import { parseArgs } from '@/scripts/contentCliSupport.mts';
import {
  deriveMediaFromSnapshot,
  importContentSnapshot,
  mediaStableId,
  normalizeImageSrc,
  type MediaFileResolver,
} from '@/scripts/import-content-to-payload.mts';
import {
  assertValidManifest,
  baselineObjectKey,
  canonicalJson,
  cosignAvailable,
  createLocalDiskObjectStore,
  exportSignedBaseline,
  sha256Hex,
  signBlobWithCosign,
  verifyBlobWithCosign,
  type CutoverBaselineManifest,
} from '@/scripts/export-content-snapshot.mts';
import { loadVerifiedArtifact, verifyRecordCounts } from '@/scripts/verify-content-snapshot.mts';
import {
  assertValidIdentityTransfers,
  verifyStableIdConservation,
  type IdentityTransfer,
} from '@/scripts/verify-content-conservation.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

const clone = (snapshot: ContentSnapshot): ContentSnapshot => structuredClone(snapshot);

describe('content source parity', () => {
  it('reports no differences for equivalent snapshots', () => {
    const result = compareSnapshots(
      contentSnapshotFixture,
      structuredClone(contentSnapshotFixture),
    );
    expect(result).toEqual({ missing: [], extra: [], changed: [], brokenReferences: [] });
  });

  it('reports missing and extra records per collection', () => {
    const actual = clone(contentSnapshotFixture);
    const [removed] = actual.robots.splice(2, 1);
    actual.manufacturers.push({ ...actual.manufacturers[0], id: 'fixture-mfr-unexpected', slug: 'fixture-mfr-unexpected' });

    const result = compareSnapshots(contentSnapshotFixture, actual);
    expect(result.missing).toEqual([{ collection: 'robots', id: removed.id }]);
    expect(result.extra).toEqual([{ collection: 'manufacturers', id: 'fixture-mfr-unexpected' }]);
  });

  it('flags slug, previousSlugs, and derived public URL differences as URL-critical', () => {
    const actual = clone(contentSnapshotFixture);
    actual.robots[0].slug = 'fixture-robot-a-renamed';
    actual.manufacturers[0].previousSlugs = ['fixture-mfr-alpha-older', 'fixture-mfr-alpha-old'];

    const result = compareSnapshots(contentSnapshotFixture, actual);
    const critical = result.changed.filter((change) => change.urlCritical);
    expect(critical.map((change) => `${change.collection}/${change.id}:${change.field}`)).toEqual([
      'manufacturers/fixture-mfr-alpha:previousSlugs[0]',
      'manufacturers/fixture-mfr-alpha:previousSlugs[1]',
      'robots/fixture-robot-a:slug',
      'robots/fixture-robot-a:publicUrl',
    ]);
    expect(critical.at(-1)).toMatchObject({
      expected: '/robots/fixture-robot-a',
      actual: '/robots/fixture-robot-a-renamed',
    });
  });

  it('treats relationship arrays as ordered', () => {
    const actual = clone(contentSnapshotFixture);
    actual.articles[0].relatedRobotIds = ['fixture-robot-archived', 'fixture-robot-a'];

    const result = compareSnapshots(contentSnapshotFixture, actual);
    expect(result.changed.map((change) => change.field)).toEqual([
      'relatedRobotIds[0]',
      'relatedRobotIds[1]',
    ]);
  });

  it('compares source url, checkedAt, reliability and image rights metadata', () => {
    const actual = clone(contentSnapshotFixture);
    // fixture は `SOURCES` / `HERO_IMAGE` を複数レコードで共有しており、`structuredClone` は
    // その参照の共有ごと複製する。1レコードだけを変えたいので、まず参照を切り離す。
    actual.robots[0].sources = structuredClone(contentSnapshotFixture.robots[0].sources);
    actual.robots[0].heroImage = structuredClone(contentSnapshotFixture.robots[0].heroImage);
    actual.robots[0].sources[0].url = 'https://example.com/changed';
    actual.robots[0].sources[1].reliability = 'estimated';
    actual.robots[0].heroImage!.rights.status = 'blocked';
    actual.robots[0].specs.heightCm = 999;
    (actual.articles[0] as { body?: string }).body = 'tampered body';

    const result = compareSnapshots(contentSnapshotFixture, actual);
    expect(result.changed.map((change) => change.field).sort()).toEqual([
      'body',
      'heroImage.rights.status',
      'sources[0].url',
      'sources[1].reliability',
      'specs.heightCm',
    ]);
  });

  it('detects broken relationship references on both sides', () => {
    const actual = clone(contentSnapshotFixture);
    actual.articles[0].relatedUseCaseIds = ['fixture-usecase-gone'];

    const result = compareSnapshots(contentSnapshotFixture, actual);
    expect(result.brokenReferences).toEqual([
      {
        collection: 'articles',
        id: 'fixture-article-standard',
        field: 'relatedUseCaseIds[0]',
        referencedCollection: 'useCases',
        referencedId: 'fixture-usecase-gone',
        side: 'actual',
      },
    ]);
  });

  it('ignores updatedAt', () => {
    const actual = clone(contentSnapshotFixture);
    actual.robots[0].updatedAt = '2099-12-31T23:59:59.000Z';
    expect(parityReportIsClean(compareSnapshots(contentSnapshotFixture, actual))).toBe(true);
  });

  /**
   * **日付は厳密な文字列一致で比べる**（instant へ正規化しない）。
   *
   * migration `20260812_080919_date_only_content_fields_to_text` で該当列を `text` にしたため、
   * Payload は書いた文字列をそのまま返す。ここを instant 比較にすると
   * `Date.parse('2025-05') === Date.parse('2025-05-01')` が成立し、**月精度の日付を日精度へ
   * 丸める silent な損失が parity 0 差分になる**。その損失こそ migration が防ぐために
   * 存在するので、緩めた瞬間に落ちるようこの test で固定する。
   */
  it('requires byte-identical content dates', () => {
    const cases: Array<[string, (snapshot: ContentSnapshot) => void]> = [
      [
        'sources[0].checkedAt',
        (snapshot) => {
          snapshot.robots[0].sources = structuredClone(contentSnapshotFixture.robots[0].sources);
          snapshot.robots[0].sources[0].checkedAt = '2026-01-10T00:00:00.000Z';
        },
      ],
      ['publishedAt', (snapshot) => { snapshot.articles[0].publishedAt = '2026-01-19T00:00:00.000Z'; }],
      ['nextReviewBy', (snapshot) => { snapshot.robots[0].nextReviewBy = '2026-07-13T00:00:00.000Z'; }],
    ];

    for (const [field, mutate] of cases) {
      const actual = clone(contentSnapshotFixture);
      mutate(actual);
      const fields = compareSnapshots(contentSnapshotFixture, actual).changed.map((change) => change.field);
      expect(fields, `${field} must be compared as a string, not as an instant`).toContain(field);
    }
  });

  it('treats a month-precision date and its day-precision rounding as different values', () => {
    // まさに importer が黙って丸めたときの形。instant 比較だと同値になってしまう組み合わせ。
    expect(Date.parse('2025-05')).toBe(Date.parse('2025-05-01'));

    const expected = clone(contentSnapshotFixture);
    expected.robots[0].sources = structuredClone(contentSnapshotFixture.robots[0].sources);
    expected.robots[0].sources[0].publishedAt = '2025-05';
    const actual = clone(expected);
    actual.robots[0].sources = structuredClone(expected.robots[0].sources);
    actual.robots[0].sources[0].publishedAt = '2025-05-01';

    expect(compareSnapshots(expected, actual).changed).toEqual([
      {
        collection: 'robots',
        id: 'fixture-robot-a',
        field: 'sources[0].publishedAt',
        expected: '2025-05',
        actual: '2025-05-01',
      },
    ]);
  });

  it('names exactly the fields that must be compared strictly', () => {
    expect([...STRICT_DATE_FIELDS].sort()).toEqual(['checkedAt', 'nextReviewBy', 'publishedAt']);
  });

  it('ignores storage-assigned media attributes but not media rights', () => {
    const actual = clone(contentSnapshotFixture);
    actual.media[0].url = '/api/media/file/fixture-hero.png';
    actual.media[0].filesize = 1234;
    actual.media[0].width = 10;
    expect(parityReportIsClean(compareSnapshots(contentSnapshotFixture, actual))).toBe(true);

    actual.media[0].rights.status = 'blocked';
    expect(compareSnapshots(contentSnapshotFixture, actual).changed).toEqual([
      {
        collection: 'media',
        id: 'media:/media/fixture-hero.png',
        field: 'rights.status',
        expected: 'commercial-permitted',
        actual: 'blocked',
      },
    ]);
  });

  it('counts records per collection', () => {
    expect(countRecords(contentSnapshotFixture)).toEqual({
      manufacturers: 2,
      robots: 3,
      robotSeries: 1,
      distributors: 1,
      useCases: 1,
      deployments: 1,
      articles: 3,
      articlePlacements: 2,
      media: 1,
      siteSettings: 1,
    });
  });
});

describe('CLI argument parsing', () => {
  it('handles --flag value, --flag=value, boolean flags, and a bare --', () => {
    const args = parseArgs(['--', '--source', 'payload', '--out=/tmp/x.json', '--upload']);
    expect(args.get('source')).toBe('payload');
    expect(args.get('out')).toBe('/tmp/x.json');
    expect(args.get('upload')).toBe(true);
    expect(args.has('missing')).toBe(false);
  });
});

describe('media derivation', () => {
  it('normalizes src and derives a deterministic stable id', () => {
    expect(normalizeImageSrc('/images/robots/a.png?v=2#frag')).toBe('/images/robots/a.png');
    expect(mediaStableId('/images/robots/a.png')).toBe('media:/images/robots/a.png');
  });

  it('dedupes by src and marks unconfirmed external images as not hostable', () => {
    const candidates = deriveMediaFromSnapshot(contentSnapshotFixture);
    const bySrc = new Map(candidates.map((candidate) => [candidate.src, candidate]));

    // `HERO_IMAGE` は複数レコードから参照されるが media は1件に畳まれる。
    expect(candidates.filter((candidate) => candidate.src === '/media/fixture-hero.png')).toHaveLength(1);
    expect(bySrc.get('/media/fixture-hero.png')?.hostable).toBe(true);
    expect(bySrc.get('/media/fixture-hero.png')?.usedBy.length).toBeGreaterThan(1);

    // 外部画像で rights.status が `reference-attributed` のものは自動ホストしない。
    const external = bySrc.get('https://cdn.example.com/fixture-side.jpg');
    expect(external?.hostable).toBe(false);
    expect(external?.reason).toContain('reference-attributed');
  });

  it('splits a src into separate candidates when the same file carries conflicting rights', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.manufacturers[1].heroImage = {
      ...structuredClone(snapshot.manufacturers[0].heroImage!),
      rights: { ...snapshot.manufacturers[0].heroImage!.rights, checkedAt: '2026-02-01' },
    };

    const forSrc = deriveMediaFromSnapshot(snapshot).filter((c) => c.src === '/media/fixture-hero.png');
    expect(forSrc).toHaveLength(2);
    expect(new Set(forSrc.map((c) => c.asset.id)).size).toBe(2);
    for (const candidate of forSrc) expect(candidate.asset.id).toMatch(/^media:\/media\/fixture-hero\.png#[0-9a-f]{8}$/);
  });
});

describe('media review items surfaced in the parity report', () => {
  /**
   * brief Step 3: 「取得不能または権利未確定の画像は自動公開せず、**parity reportの
   * 要確認項目として残す**」。フィルタで落として `content:import` の stdout にしか
   * 出ない状態にしない（Task 9 が archive するのは compare の JSON）。
   */
  it('reports unconfirmed-rights external images instead of dropping them', () => {
    const items = collectMediaReviewItems(deriveMediaFromSnapshot(contentSnapshotFixture));
    const unhostable = items.filter((item) => item.kind === 'unhostable-image');

    expect(unhostable).toHaveLength(1);
    expect(unhostable[0]).toMatchObject({
      src: 'https://cdn.example.com/fixture-side.jpg',
      usedBy: ['robots/fixture-robot-a.images.side'],
    });
    expect(unhostable[0].detail).toContain('reference-attributed');
    expect(formatMediaReview(items)).toContain('REVIEW REQUIRED');
  });

  it('reports the same file carrying conflicting rights metadata as duplicate uploads', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.manufacturers[1].heroImage = {
      ...structuredClone(snapshot.manufacturers[0].heroImage!),
      rights: { ...snapshot.manufacturers[0].heroImage!.rights, checkedAt: '2026-02-01' },
    };

    const conflicts = collectMediaReviewItems(deriveMediaFromSnapshot(snapshot)).filter(
      (item) => item.kind === 'conflicting-image-rights',
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].src).toBe('/media/fixture-hero.png');
    expect(conflicts[0].detail).toContain('uploaded 2 times');
  });

  it('says so explicitly when there is nothing to review', () => {
    const snapshot = clone(contentSnapshotFixture);
    // 唯一の外部画像を外すと要確認項目はゼロになる。
    delete snapshot.robots[0].images?.side;
    expect(collectMediaReviewItems(deriveMediaFromSnapshot(snapshot))).toEqual([]);
    expect(formatMediaReview([])).toBe('media review items: none');
  });
});

describe('cutover baseline manifest', () => {
  const validManifest: CutoverBaselineManifest = {
    storage: { provider: 'vercel-blob', bucket: 'deploid-audit-production', objectKey: 'cutover-baseline/x.json', versionId: null },
    sha256: 'a'.repeat(64),
    signature: { algorithm: 'cosign', keyId: 'arn:aws:kms:ap-northeast-1:1:key/2', detachedSignatureObjectKey: 'cutover-baseline/x.json.cosign.bundle' },
    recordCounts: {
      manufacturers: 26,
      robots: 63,
      robotSeries: 0,
      distributors: 0,
      useCases: 44,
      deployments: 11,
      articles: 34,
      articlePlacements: 7,
      media: 61,
      siteSettings: 1,
    },
    exportedAt: '2026-08-12T00:00:00.000Z',
    exportedBy: 'task-9-operator',
  };

  it('accepts a well-formed manifest', () => {
    expect(() => assertValidManifest(structuredClone(validManifest))).not.toThrow();
  });

  it('rejects a manifest missing any required field', () => {
    for (const mutate of [
      (m: CutoverBaselineManifest) => delete (m as Partial<CutoverBaselineManifest>).sha256,
      (m: CutoverBaselineManifest) => { m.sha256 = 'not-a-hash'; },
      (m: CutoverBaselineManifest) => { (m.signature as { algorithm: string }).algorithm = 'shasum'; },
      (m: CutoverBaselineManifest) => { m.signature.detachedSignatureObjectKey = ''; },
      (m: CutoverBaselineManifest) => { (m.storage as { provider: string }).provider = 'dropbox'; },
      (m: CutoverBaselineManifest) => delete (m.recordCounts as Partial<CutoverBaselineManifest['recordCounts']>).media,
      (m: CutoverBaselineManifest) => { m.exportedAt = 'yesterday'; },
      (m: CutoverBaselineManifest) => { m.exportedBy = ''; },
    ]) {
      const candidate = structuredClone(validManifest);
      mutate(candidate);
      expect(() => assertValidManifest(candidate)).toThrow(/manifest-invalid/);
    }
  });

  it('verifies manifest record counts against the artifact body', () => {
    const manifest = structuredClone(validManifest);
    manifest.recordCounts = { ...countRecords(contentSnapshotFixture) } as CutoverBaselineManifest['recordCounts'];
    expect(verifyRecordCounts(manifest, contentSnapshotFixture)).toEqual([]);

    manifest.recordCounts.media += 1;
    expect(verifyRecordCounts(manifest, contentSnapshotFixture)).toEqual([
      { check: 'recordCounts', detail: 'media: manifest says 2, artifact contains 1' },
    ]);
  });

  it('canonicalises JSON so the sha256 does not depend on key order', () => {
    const a = canonicalJson({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } });
    const b = canonicalJson({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 });
    expect(a).toBe(b);
    expect(sha256Hex(a)).toBe(sha256Hex(b));
  });

  it('derives a unique object key per run from the timestamp and hash', () => {
    const first = baselineObjectKey('2026-08-12T00:00:00.000Z', 'a'.repeat(64));
    const second = baselineObjectKey('2026-08-12T00:00:01.000Z', 'a'.repeat(64));
    expect(first).not.toBe(second);
    expect(first.startsWith('cutover-baseline/')).toBe(true);
  });
});

describe('local-disk object store (write-once)', () => {
  it('refuses to overwrite an existing key', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-store-'));
    try {
      const store = createLocalDiskObjectStore(dir);
      await store.put('a/b.json', Buffer.from('one'));
      expect((await store.get('a/b.json')).toString()).toBe('one');
      await expect(store.put('a/b.json', Buffer.from('two'))).rejects.toThrow(/object-key-already-exists/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('stable-id conservation', () => {
  const baseline = contentSnapshotFixture;

  it('passes when every baseline id still exists, even with new records added', () => {
    const current = clone(baseline);
    current.robots.push({ ...current.robots[0], id: 'fixture-robot-new', slug: 'fixture-robot-new' });
    expect(verifyStableIdConservation(baseline, current)).toMatchObject({ ok: true, violations: [] });
  });

  it('fails when a baseline id disappeared without an approved transfer', () => {
    const current = clone(baseline);
    current.robots.splice(1, 1);
    const result = verifyStableIdConservation(baseline, current);
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      { collection: 'robots', stableId: 'fixture-robot-archived', reason: 'missing-from-current' },
    ]);
  });

  it('accepts an approved identity transfer, but not one whose target is also missing', () => {
    const current = clone(baseline);
    current.robots[1].id = 'fixture-robot-merged';
    const transfer: IdentityTransfer = {
      collection: 'robots',
      from: 'fixture-robot-archived',
      to: 'fixture-robot-merged',
      approvedBy: 'Hori98',
      approvedAt: '2026-08-12',
      reason: 'merged into the successor record',
    };
    expect(verifyStableIdConservation(baseline, current, [transfer])).toMatchObject({ ok: true, appliedTransfers: 1 });

    expect(
      verifyStableIdConservation(baseline, current, [{ ...transfer, to: 'fixture-robot-nowhere' }]).violations,
    ).toEqual([
      {
        collection: 'robots',
        stableId: 'fixture-robot-archived',
        reason: 'transfer-target-missing',
        detail: 'approved transfer to "fixture-robot-nowhere" but that id does not exist either',
      },
    ]);
  });

  it('rejects identity transfers without an approval record', () => {
    expect(() => assertValidIdentityTransfers([{ collection: 'robots', from: 'a', to: 'b' }])).toThrow(
      /missing approvedBy, approvedAt, reason/,
    );
  });
});

// ─── cosign + 実 AWS KMS 署名 ──────────────────────────────────────────────
//
// cosign バイナリと `deploid-kms` の credential が両方ある環境でだけ実行する
// （`tests/content/media-storage.test.ts` が実 blob token の有無で分岐するのと同じ方式）。
// CI / 通常の `npm run test` では skip され、署名機構の検証は Task 5 実行時の手動 run と
// task-5-report.md の貼り付け出力が担保する。
const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

describe.skipIf(!canSignForReal)('cosign signing against the real KMS key', () => {
  it('signs a snapshot, verifies it with the documented public key, and rejects tampering', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-sign-'));
    try {
      const blob = path.join(dir, 'snapshot.json');
      const bundle = path.join(dir, 'snapshot.cosign.bundle');
      await writeFile(blob, canonicalJson(contentSnapshotFixture), 'utf8');

      signBlobWithCosign(blob, bundle);
      expect(await verifyBlobWithCosign(blob, bundle)).toMatchObject({ verified: true });

      await writeFile(blob, `${canonicalJson(contentSnapshotFixture)}\n// tampered`, 'utf8');
      expect((await verifyBlobWithCosign(blob, bundle)).verified).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 120_000);

  it('round-trips a signed baseline through the object store and verifies it', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-baseline-'));
    try {
      const store = createLocalDiskObjectStore(dir);
      const { manifest } = await exportSignedBaseline({
        snapshot: contentSnapshotFixture,
        store,
        exportedBy: 'import-parity-test',
      });
      assertValidManifest(manifest);

      // local-disk store は既定で拒否される（本番 baseline は private object store にある）。
      const refused = await loadVerifiedArtifact(manifest);
      expect(refused).toMatchObject({ failures: [{ check: 'storage.provider' }] });

      const loaded = await loadVerifiedArtifact(manifest, { allowLocalStore: true });
      expect('snapshot' in loaded).toBe(true);
      expect(compareSnapshots(contentSnapshotFixture, (loaded as { snapshot: ContentSnapshot }).snapshot)).toEqual({
        missing: [],
        extra: [],
        changed: [],
        brokenReferences: [],
      });

      // artifact を書き換えると sha256 より先に署名検証で落ちる。
      const objectPath = path.join(dir, manifest.storage.objectKey);
      const original = await readFile(objectPath);
      await writeFile(objectPath, Buffer.concat([original, Buffer.from(' ')]));
      expect(await loadVerifiedArtifact(manifest, { allowLocalStore: true })).toMatchObject({
        failures: [{ check: 'signature' }],
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

// ─── 実 Payload Local API へ import して parity を取る ───────────────────────

const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

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

const OWNER_EMAIL = 'import-parity-owner@example.com';
const PASSWORD = 'Str0ngPassw0rd!23';

/** fixture の画像は repo に実体を持たないので、テスト用の 1px PNG を返す resolver を渡す。 */
const testMediaResolver: MediaFileResolver = async (candidate) => {
  if (!candidate.hostable) return { skipped: candidate.reason ?? 'not-hostable' };
  return { file: { data: ONE_PX_PNG, mimetype: 'image/png', name: candidate.asset.filename } };
};

/** Payload 側は `SiteSettings` global に `dataAsOf` field を持たず `lib/site.ts` へ fallback する。 */
const expectedSnapshot: ContentSnapshot = {
  ...structuredClone(contentSnapshotFixture),
  siteSettings: { dataAsOf: siteMeta.dataAsOf },
};

let payload: Payload;
let owner: unknown;

beforeAll(async () => {
  assertLocalThrowawayDatabase('tests/content/import-parity.test.ts');
  payload = await getPayload({ config });

  for (const collection of CONTENT_COLLECTIONS) {
    await payload.delete({ collection, where: {}, overrideAccess: true });
  }
  await payload.delete({ collection: 'content-route-registry', where: {}, overrideAccess: true });
  await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

  // `BLOB_READ_WRITE_TOKEN` の無いlocal/CIでは media が repo直下の `media/` へ落ちる
  // （`lib/payload/mediaStoragePlugin.ts` のfallback）。DBだけ作り直すと**前回runのファイルが
  // 孤児として残り**、Payloadが `fixture-hero.png` → `fixture-hero-1.png` へ自動採番して
  // parityが落ちる。importerのfilenameは「保存先にそのキーが無い」前提で決定的なので、
  // 対象storeを空にしてから流す（本番は新規blob storeなのでこの前提が成り立つ）。
  const uploadDir = path.join(process.cwd(), 'media');
  for (const asset of contentSnapshotFixture.media) {
    await rm(path.join(uploadDir, asset.filename), { force: true });
  }

  await payload.create({
    collection: 'admins',
    overrideAccess: false,
    data: { email: OWNER_EMAIL, password: PASSWORD, role: 'content-reader' },
  });
  const login = await payload.login({ collection: 'admins', data: { email: OWNER_EMAIL, password: PASSWORD } });
  owner = login.user;
  if (!owner) throw new Error('failed to log in as the import owner');
}, 180_000);

afterAll(async () => {
  await payload?.destroy();
});

describe('importContentSnapshot against real Payload', () => {
  it('imports the fixture and reaches full parity with the Payload source', async () => {
    const report = await importContentSnapshot({
      payload,
      snapshot: structuredClone(contentSnapshotFixture),
      user: owner,
      mediaResolver: testMediaResolver,
    });

    expect(report.created).toMatchObject({
      manufacturers: 2,
      'robot-series': 1,
      robots: 3,
      distributors: 1,
      'use-cases': 1,
      deployments: 1,
      articles: 3,
      'article-placements': 2,
      media: 1,
    });
    expect(report.deferredReferenceUpdates).toMatchObject({ robots: 1, 'use-cases': 1, distributors: 1 });

    const actual = await createPayloadContentSource({ payload }).readSnapshot();
    expect(compareSnapshots(expectedSnapshot, actual)).toEqual({
      missing: [],
      extra: [],
      changed: [],
      brokenReferences: [],
    });
  }, 180_000);

  it('is idempotent — a second import updates in place and keeps the same stable id set', async () => {
    const before = await createPayloadContentSource({ payload }).readSnapshot();

    const report = await importContentSnapshot({
      payload,
      snapshot: structuredClone(contentSnapshotFixture),
      user: owner,
      mediaResolver: testMediaResolver,
    });

    expect(Object.values(report.created).reduce((sum, value) => sum + value, 0)).toBe(0);
    expect(report.updated).toMatchObject({ manufacturers: 2, robots: 3, articles: 3, media: 1 });

    const after = await createPayloadContentSource({ payload }).readSnapshot();
    expect(countRecords(after)).toEqual(countRecords(before));
    expect(compareSnapshots(expectedSnapshot, after)).toEqual({
      missing: [],
      extra: [],
      changed: [],
      brokenReferences: [],
    });
  }, 180_000);

  it('keeps draft, published, and archived records distinguishable after import', async () => {
    const actual = await createPayloadContentSource({ payload }).readSnapshot();
    const byId = new Map(actual.robots.map((robot) => [robot.id, robot]));
    expect(byId.get('fixture-robot-a')?.publishStatus).toBe('published');
    expect(byId.get('fixture-robot-archived')?.publishStatus).toBe('archived');
    expect(byId.get('fixture-robot-draft')?.publishStatus).toBe('draft');
  }, 60_000);

  it('records unhostable images as review items instead of importing them', async () => {
    const report = await importContentSnapshot({
      payload,
      snapshot: structuredClone(contentSnapshotFixture),
      user: owner,
      mediaResolver: testMediaResolver,
    });
    // fixture の media 配列は hero だけ。外部の `fixture-side.jpg` は Media にならない。
    const actual = await createPayloadContentSource({ payload }).readSnapshot();
    expect(actual.media.map((asset) => asset.id)).toEqual(['media:/media/fixture-hero.png']);
    expect(report.skippedMedia).toEqual([]);

    // media 配列を持たない snapshot（= local TS 相当）では派生が走り、外部画像が skip される。
    const withoutMedia = { ...structuredClone(contentSnapshotFixture), media: [] };
    const derivedReport = await importContentSnapshot({
      payload,
      snapshot: withoutMedia,
      user: owner,
      mediaResolver: testMediaResolver,
    });
    expect(derivedReport.skippedMedia.map((entry) => entry.src)).toEqual(['https://cdn.example.com/fixture-side.jpg']);
    expect(derivedReport.skippedMedia[0].usedBy).toEqual(['robots/fixture-robot-a.images.side']);
  }, 180_000);
});
