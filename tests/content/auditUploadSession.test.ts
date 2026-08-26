import { randomBytes, createHash } from 'node:crypto';
import { getPayload, type Payload } from 'payload';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import {
  authenticateAuditUploadOperator,
  type AuditUploadAuthResult,
} from '@/lib/payload/auditUploadAuth';
import { cleanupAuditUploadSession, cleanupExpiredAuditUploadSessions } from '@/lib/payload/auditUploadCleanup';
import { recordAuditUploadObject, type BlobStoreFactory } from '@/lib/payload/auditUploadObject';
import {
  completeAuditUploadSession,
  createAuditUploadSession,
  type AllowedObjectRecord,
} from '@/lib/payload/auditUploadSession';
import {
  PREVIEW_SIGNING_KEY_ARN,
  canonicalJson,
  cosignAvailable,
  sha256Hex,
  signManifest,
  type CutoverBaselineManifest,
} from '@/scripts/export-content-snapshot.mts';
import {
  encodeUnsignedJwtForTests,
  isAllowedAuditBaselineObjectKey,
  type SnapshotObjectStore,
} from '@/scripts/snapshotObjectStore.mts';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`の回帰テスト。
 *
 * 実Preview/Production・実`deploid-audit-*` Blob storeには一切接続しない（OIDC-federatedで
 * Vercel Function runtimeからしか到達できないため——`createVercelBlobObjectStore`をテストで
 * 直接使わず、`storeFactory`差し替えで fake in-memory store を注入する）。
 *
 * 署名検証だけは実cosignバイナリを要する。実際に**有効な**署名を作るtestだけ実AWS KMS credential
 * （`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`）を要求し、`describe.skipIf`で無い環境では
 * skipする（`tests/content/import-parity.test.ts`の`canSignForReal`と同じ既存pattern）。
 * 署名が**無効**であることを確認するtestはcosignさえあれば動く（AWS不要）。
 */

const PREVIEW_STORE_ID = 'testauditpreviewstorexxxxxxxx';
const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

function testEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return { PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID: PREVIEW_STORE_ID, ...overrides };
}

function previewOidcToken(): string {
  return encodeUnsignedJwtForTests({ environment: 'preview' });
}

function fakeSha256(seed: string): string {
  return createHash('sha256').update(seed).digest('hex');
}

interface FakeStore extends SnapshotObjectStore {
  data: Map<string, Buffer>;
  putCalls: string[];
}

function createFakeBlobStore(): FakeStore {
  const data = new Map<string, Buffer>();
  const putCalls: string[] = [];
  return {
    provider: 'vercel-blob',
    bucket: 'fake-audit-store',
    storeId: PREVIEW_STORE_ID,
    data,
    putCalls,
    async put(objectKey, body) {
      if (data.has(objectKey)) throw new Error(`blob-already-exists: ${objectKey}`);
      data.set(objectKey, Buffer.from(body));
      putCalls.push(objectKey);
      return { versionId: null };
    },
    async get(objectKey) {
      const value = data.get(objectKey);
      if (!value) throw new Error(`blob-object-not-found: ${objectKey}`);
      return value;
    },
    async exists(objectKey) {
      return data.has(objectKey);
    },
    async remove(objectKey) {
      data.delete(objectKey);
    },
    objectReference(objectKey) {
      return `fake://${objectKey}`;
    },
  };
}

function makeStoreFactory(store: SnapshotObjectStore): BlobStoreFactory {
  return () => store;
}

interface BuiltManifest {
  manifest: CutoverBaselineManifest;
  mediaBytes: Buffer;
  snapshotBytes: Buffer;
}

/** 実mediaが1件だけの、`assertValidManifest`を通る最小manifestを作る。 */
function buildTestManifest(overrides: Partial<CutoverBaselineManifest['provenance']> = {}): BuiltManifest {
  const baselineObjectKey = `cutover-baseline/test-${randomBytes(8).toString('hex')}.json`;
  const snapshotBytes = Buffer.from(canonicalJson({ manufacturers: [], robots: [] }), 'utf8');
  const mediaBytes = Buffer.from('fake media bytes for audit-upload session test', 'utf8');
  const mediaSha256 = fakeSha256(mediaBytes.toString());

  const manifest: CutoverBaselineManifest = {
    provenance: {
      sourceKind: 'payload',
      environment: 'preview',
      databaseResourceId: 'test-db-resource',
      auditBlobStoreId: PREVIEW_STORE_ID,
      schemaVersion: 'test-schema-v1',
      baselineRunId: `run-${randomBytes(6).toString('hex')}`,
      baselineGeneration: 1,
      ...overrides,
    },
    storage: {
      provider: 'vercel-blob',
      bucket: 'deploid-audit-preview',
      storeId: PREVIEW_STORE_ID,
      objectKey: baselineObjectKey,
      versionId: null,
    },
    mediaInventory: [
      {
        stableId: 'media:test-asset-1',
        filename: 'test-asset.jpg',
        objectKey: `${baselineObjectKey}.media/${mediaSha256}`,
        sha256: mediaSha256,
        size: mediaBytes.byteLength,
        mimeType: 'image/jpeg',
      },
    ],
    sha256: fakeSha256(snapshotBytes.toString()),
    signature: {
      algorithm: 'cosign',
      keyId: PREVIEW_SIGNING_KEY_ARN,
      detachedSignatureObjectKey: `${baselineObjectKey}.cosign.bundle`,
    },
    recordCounts: {
      manufacturers: 0,
      robots: 0,
      robotSeries: 0,
      distributors: 0,
      useCases: 0,
      deployments: 0,
      articles: 0,
      articlePlacements: 0,
      media: 1,
      siteSettings: 0,
    },
    exportedAt: new Date().toISOString(),
    exportedBy: 'test-suite',
  };

  return { manifest, mediaBytes, snapshotBytes };
}

describe('isAllowedAuditBaselineObjectKey (object key検証)', () => {
  const base = 'cutover-baseline/2026-01-01-abc123.json';

  it('accepts the snapshot object itself', () => {
    expect(isAllowedAuditBaselineObjectKey(base, base)).toBe(true);
  });

  it('accepts the signature bundle key', () => {
    expect(isAllowedAuditBaselineObjectKey(`${base}.cosign.bundle`, base)).toBe(true);
  });

  it('accepts a media key one level under the media prefix', () => {
    expect(isAllowedAuditBaselineObjectKey(`${base}.media/${'a'.repeat(64)}`, base)).toBe(true);
  });

  it('rejects a media key with an extra path segment', () => {
    expect(isAllowedAuditBaselineObjectKey(`${base}.media/sub/${'a'.repeat(64)}`, base)).toBe(false);
  });

  it('rejects ".." in the candidate key', () => {
    expect(isAllowedAuditBaselineObjectKey(`${base}.media/../../etc/passwd`, base)).toBe(false);
  });

  it('rejects an absolute-looking candidate key', () => {
    expect(isAllowedAuditBaselineObjectKey('/etc/passwd', base)).toBe(false);
  });

  it('rejects an unrelated prefix entirely', () => {
    expect(isAllowedAuditBaselineObjectKey('some-other-prefix/file.json', base)).toBe(false);
  });

  it('rejects when the baseline key itself is not under cutover-baseline/', () => {
    expect(isAllowedAuditBaselineObjectKey('anything', 'not-cutover-baseline/x.json')).toBe(false);
  });

  it('rejects the completion marker key (route writes it, client never uploads it)', () => {
    expect(isAllowedAuditBaselineObjectKey(`${base}.complete.json`, base)).toBe(false);
  });
});

describe('authenticateAuditUploadOperator (認証)', () => {
  let payload: Payload;
  const EMAIL = 'audit-upload-test-admin@example.com';
  const PASSWORD = 'Str0ngPassw0rd!23';
  const SCOPE_SECRET = 'test-audit-upload-shared-secret-value';

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/auditUploadSession.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'admins', where: { email: { equals: EMAIL } }, overrideAccess: true });
    await payload.create({
      collection: 'admins',
      overrideAccess: true,
      data: { email: EMAIL, password: PASSWORD, role: 'platform-admin' } as never,
    });
  });

  afterEach(async () => {
    // beforeAllで作ったadminは維持する（各itで使い回す）。
  });

  async function loginHeaders(): Promise<Headers> {
    const result = await payload.login({ collection: 'admins', data: { email: EMAIL, password: PASSWORD } });
    const token = (result as unknown as { token?: string }).token;
    return new Headers({ Authorization: `JWT ${token}` });
  }

  function request(headers: Headers): Request {
    return new Request('http://localhost/api/admin/audit-upload/session', { headers });
  }

  it('refuses when there is no session at all', async () => {
    const result = await authenticateAuditUploadOperator(request(new Headers()), payload, testEnv({ AUDIT_UPLOAD_SHARED_SECRET: SCOPE_SECRET }));
    expect(result).toMatchObject<AuditUploadAuthResult>({ ok: false, reason: 'no-session' });
  });

  it('refuses a logged-in user who is not platform-admin', async () => {
    const readerEmail = 'audit-upload-test-reader@example.com';
    await payload.delete({ collection: 'admins', where: { email: { equals: readerEmail } }, overrideAccess: true });
    await payload.create({
      collection: 'admins',
      overrideAccess: true,
      data: { email: readerEmail, password: PASSWORD, role: 'content-reader' } as never,
    });
    const login = await payload.login({ collection: 'admins', data: { email: readerEmail, password: PASSWORD } });
    const token = (login as unknown as { token?: string }).token;
    const headers = new Headers({ Authorization: `JWT ${token}`, 'x-audit-upload-scope': SCOPE_SECRET });
    const result = await authenticateAuditUploadOperator(request(headers), payload, testEnv({ AUDIT_UPLOAD_SHARED_SECRET: SCOPE_SECRET }));
    expect(result).toMatchObject<AuditUploadAuthResult>({ ok: false, reason: 'not-platform-admin' });
  });

  it('refuses a platform-admin session without the scope header', async () => {
    const headers = await loginHeaders();
    const result = await authenticateAuditUploadOperator(request(headers), payload, testEnv({ AUDIT_UPLOAD_SHARED_SECRET: SCOPE_SECRET }));
    expect(result).toMatchObject<AuditUploadAuthResult>({ ok: false, reason: 'missing-scope-header' });
  });

  it('refuses when the configured secret is missing (misconfiguration, fail-closed)', async () => {
    const headers = await loginHeaders();
    headers.set('x-audit-upload-scope', SCOPE_SECRET);
    const result = await authenticateAuditUploadOperator(request(headers), payload, testEnv({ AUDIT_UPLOAD_SHARED_SECRET: undefined }));
    expect(result).toMatchObject<AuditUploadAuthResult>({ ok: false, reason: 'missing-scope-secret-config' });
  });

  it('refuses a wrong scope secret', async () => {
    const headers = await loginHeaders();
    headers.set('x-audit-upload-scope', 'wrong-secret');
    const result = await authenticateAuditUploadOperator(request(headers), payload, testEnv({ AUDIT_UPLOAD_SHARED_SECRET: SCOPE_SECRET }));
    expect(result).toMatchObject<AuditUploadAuthResult>({ ok: false, reason: 'invalid-scope-secret' });
  });

  it('accepts a platform-admin session with the correct scope secret', async () => {
    const headers = await loginHeaders();
    headers.set('x-audit-upload-scope', SCOPE_SECRET);
    const result = await authenticateAuditUploadOperator(request(headers), payload, testEnv({ AUDIT_UPLOAD_SHARED_SECRET: SCOPE_SECRET }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.operator.role).toBe('platform-admin');
    }
  });
});

describe('createAuditUploadSession — failure paths (実署名不要)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/auditUploadSession.test.ts');
    payload = await getPayload({ config });
  });

  afterEach(async () => {
    await payload.delete({ collection: 'audit-upload-sessions', where: {}, overrideAccess: true });
  });

  it('rejects a malformed envelope and creates no session', async () => {
    const result = await createAuditUploadSession({
      payload,
      rawBody: { not: 'an envelope' },
      requestId: 'req-1',
      oidcToken: previewOidcToken(),
      env: testEnv(),
    });
    expect(result).toMatchObject({ ok: false, reason: 'malformed-envelope' });
    const { totalDocs } = await payload.count({ collection: 'audit-upload-sessions', overrideAccess: true });
    expect(totalDocs).toBe(0);
  });

  it('rejects an envelope with a garbage signature bundle and creates no session', async () => {
    const { manifest } = buildTestManifest();
    const envelope = {
      manifest,
      manifestSignature: { algorithm: 'cosign', keyId: PREVIEW_SIGNING_KEY_ARN, bundleBase64: Buffer.from('not a real bundle').toString('base64') },
    };
    const result = await createAuditUploadSession({
      payload,
      rawBody: envelope,
      requestId: 'req-2',
      oidcToken: previewOidcToken(),
      env: testEnv(),
    });
    expect(result).toMatchObject({ ok: false, reason: 'signature-invalid' });
    const { totalDocs } = await payload.count({ collection: 'audit-upload-sessions', overrideAccess: true });
    expect(totalDocs).toBe(0);
  }, 30_000);

  it.skipIf(!canSignForReal)('rejects when the manifest declares a store id that does not match the credential', async () => {
    const { manifest } = buildTestManifest();
    manifest.storage.storeId = 'some-other-store-entirely';
    const envelope = await signManifest(manifest, PREVIEW_SIGNING_KEY_ARN);
    const result = await createAuditUploadSession({
      payload,
      rawBody: envelope,
      requestId: 'req-3',
      oidcToken: previewOidcToken(),
      env: testEnv(),
    });
    expect(result).toMatchObject({ ok: false, reason: 'store-selection-refused' });
    const { totalDocs } = await payload.count({ collection: 'audit-upload-sessions', overrideAccess: true });
    expect(totalDocs).toBe(0);
  }, 30_000);

  it.skipIf(!canSignForReal)('rejects when the manifest environment does not match the OIDC token claim', async () => {
    const { manifest } = buildTestManifest({ environment: 'production' });
    const envelope = await signManifest(manifest, PREVIEW_SIGNING_KEY_ARN);
    const result = await createAuditUploadSession({
      payload,
      rawBody: envelope,
      // OIDC tokenは"preview"を主張するが、manifestは"production"を主張している。
      requestId: 'req-4',
      oidcToken: previewOidcToken(),
      env: testEnv(),
    });
    expect(result).toMatchObject({ ok: false, reason: 'store-selection-refused' });
    const { totalDocs } = await payload.count({ collection: 'audit-upload-sessions', overrideAccess: true });
    expect(totalDocs).toBe(0);
  }, 30_000);
});

describe.skipIf(!canSignForReal)('createAuditUploadSession — happy path (実cosign + 実AWS KMS)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/auditUploadSession.test.ts');
    payload = await getPayload({ config });
  });

  afterEach(async () => {
    await payload.delete({ collection: 'audit-upload-sessions', where: {}, overrideAccess: true });
  });

  it('creates a session from a validly signed manifest, deriving allowedObjects from it (not client input)', async () => {
    const { manifest } = buildTestManifest();
    const envelope = await signManifest(manifest, PREVIEW_SIGNING_KEY_ARN);

    const result = await createAuditUploadSession({
      payload,
      rawBody: envelope,
      requestId: 'req-happy-1',
      oidcToken: previewOidcToken(),
      env: testEnv(),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { docs } = await payload.find({
      collection: 'audit-upload-sessions',
      where: { sessionId: { equals: result.sessionId } },
      overrideAccess: true,
      limit: 1,
    });
    expect(docs).toHaveLength(1);
    const doc = docs[0] as unknown as {
      baselineRunId: string;
      manifestSha256: string;
      allowedObjects: AllowedObjectRecord[];
    };
    expect(doc.baselineRunId).toBe(manifest.provenance.baselineRunId);
    expect(doc.manifestSha256).toBe(sha256Hex(canonicalJson(manifest)));
    // snapshot + signature bundle + 1 media = 3件。client bodyには存在しない値なので、
    // manifestから機械的に導出されたことの直接証拠になる。
    expect(doc.allowedObjects).toHaveLength(3);
    expect(doc.allowedObjects.map((o) => o.objectKey).sort()).toEqual(
      [manifest.storage.objectKey, manifest.signature.detachedSignatureObjectKey, manifest.mediaInventory[0].objectKey].sort(),
    );
  }, 30_000);
});

/** Step 2/3/cleanupは実署名を要しない——直接sessionを作ってfake storeで検証する。 */
async function createRawSession(
  payload: Payload,
  overrides: { requestId?: string; expiresAt?: string; status?: 'pending' | 'completed'; baselineRunId?: string } = {},
): Promise<{ sessionId: string; docId: string | number; manifest: CutoverBaselineManifest; mediaBytes: Buffer; snapshotBytes: Buffer }> {
  const { manifest, mediaBytes, snapshotBytes } = buildTestManifest();
  const sessionId = randomBytes(32).toString('hex');
  const requestId = overrides.requestId ?? 'req-raw-1';
  const allowedObjects: AllowedObjectRecord[] = [
    { objectKey: manifest.storage.objectKey, sha256: manifest.sha256, size: null, uploaded: false, stableId: null, filename: null, mimeType: null },
    {
      objectKey: manifest.signature.detachedSignatureObjectKey,
      sha256: null,
      size: null,
      uploaded: false,
      stableId: null,
      filename: null,
      mimeType: null,
    },
    ...manifest.mediaInventory.map((entry) => ({
      objectKey: entry.objectKey,
      sha256: entry.sha256,
      size: entry.size,
      uploaded: false,
      stableId: entry.stableId,
      filename: entry.filename,
      mimeType: entry.mimeType,
    })),
  ];
  const doc = await payload.create({
    collection: 'audit-upload-sessions',
    overrideAccess: true,
    data: {
      sessionId,
      requestId,
      manifestSha256: sha256Hex(canonicalJson(manifest)),
      baselineObjectKey: manifest.storage.objectKey,
      baselineRunId: overrides.baselineRunId ?? manifest.provenance.baselineRunId,
      environment: 'preview',
      allowedObjects,
      status: overrides.status ?? 'pending',
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    } as never,
  });
  return { sessionId, docId: (doc as unknown as { id: string | number }).id, manifest, mediaBytes, snapshotBytes };
}

describe('recordAuditUploadObject (Step 2)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/auditUploadSession.test.ts');
    payload = await getPayload({ config });
  });

  afterEach(async () => {
    await payload.delete({ collection: 'audit-upload-sessions', where: {}, overrideAccess: true });
  });

  it('accepts a media upload whose bytes match an allowed sha256/size, and writes it to the store', async () => {
    const { sessionId, mediaBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    const result = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: mediaBytes,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: true });
    expect(store.putCalls).toHaveLength(1);
  });

  it('rejects an upload whose bytes match nothing in the allowed set (digest mismatch)', async () => {
    const { sessionId } = await createRawSession(payload);
    const store = createFakeBlobStore();
    // signature slotはsha256を持たず「まだuploadedでなければ何でも受け付ける」fallbackなので、
    // これを先に埋めておかないと「一致するobjectが無い」状況を作れない
    // （signature slotへ吸われて`ok:true`になってしまう）。
    const fillSignature = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: Buffer.from('fake signature bundle to occupy the slot'),
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(fillSignature).toMatchObject({ ok: true });

    const result = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: Buffer.from('completely unrelated bytes'),
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'object-not-recognized' });
    expect(store.putCalls).toHaveLength(1);
  });

  it('accepts the signature bundle slot by object-key identity (manifest has no pre-declared sha256 for it)', async () => {
    const { sessionId } = await createRawSession(payload);
    const store = createFakeBlobStore();
    const result = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: Buffer.from('a cosign bundle would go here'),
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: true });
  });

  it('rejects an expired session', async () => {
    const { sessionId, mediaBytes } = await createRawSession(payload, { expiresAt: new Date(Date.now() - 1000).toISOString() });
    const store = createFakeBlobStore();
    const result = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: mediaBytes,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'session-not-usable', detail: 'session-expired' });
  });

  it('rejects a request-id that does not match the session', async () => {
    const { sessionId, mediaBytes } = await createRawSession(payload, { requestId: 'req-raw-original' });
    const store = createFakeBlobStore();
    const result = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-different',
      body: mediaBytes,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'session-not-usable', detail: 'request-id-mismatch' });
  });

  it('rejects re-uploading an object that is already marked uploaded (no duplicate write)', async () => {
    const { sessionId, mediaBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    // signature slotを先に埋めておく（理由は上のtestと同じ——埋めておかないと、media再uploadが
    // 「sha256は一致しないがsignature slotがまだ空いている」ことでfallback採用されてしまう）。
    const fillSignature = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: Buffer.from('fake signature bundle to occupy the slot'),
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(fillSignature).toMatchObject({ ok: true });

    const first = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: mediaBytes,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(first).toMatchObject({ ok: true });

    const second = await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: mediaBytes,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(second).toMatchObject({ ok: false, reason: 'object-not-recognized' });
    expect(store.putCalls).toHaveLength(2);
  });

  it('does not lose an update under concurrent uploads of two different objects (atomic per-row update)', async () => {
    const { sessionId, manifest, mediaBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    const snapshotBytes = Buffer.from(canonicalJson({ manufacturers: [], robots: [] }), 'utf8');
    expect(sha256Hex(snapshotBytes)).toBe(manifest.sha256);

    const [resultA, resultB] = await Promise.all([
      recordAuditUploadObject({
        payload,
        sessionId,
        requestId: 'req-raw-1',
        body: mediaBytes,
        oidcToken: previewOidcToken(),
        env: testEnv(),
        storeFactory: makeStoreFactory(store),
      }),
      recordAuditUploadObject({
        payload,
        sessionId,
        requestId: 'req-raw-1',
        body: snapshotBytes,
        oidcToken: previewOidcToken(),
        env: testEnv(),
        storeFactory: makeStoreFactory(store),
      }),
    ]);
    expect(resultA).toMatchObject({ ok: true });
    expect(resultB).toMatchObject({ ok: true });
    expect(store.putCalls).toHaveLength(2);

    const { docs } = await payload.find({
      collection: 'audit-upload-sessions',
      where: { sessionId: { equals: sessionId } },
      overrideAccess: true,
      limit: 1,
    });
    const doc = docs[0] as unknown as { allowedObjects: AllowedObjectRecord[] };
    const uploadedCount = doc.allowedObjects.filter((o) => o.uploaded).length;
    // どちらも書き終わっているはずなので、read-modify-writeの競合で片方が消えていないことを
    // 「上がった件数」で直接確認する（これがレビュー指摘3の回帰テスト）。
    expect(uploadedCount).toBe(2);
  });
});

describe('completeAuditUploadSession (Step 3)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/auditUploadSession.test.ts');
    payload = await getPayload({ config });
  });

  afterEach(async () => {
    await payload.delete({ collection: 'audit-upload-sessions', where: {}, overrideAccess: true });
  });

  async function uploadEverything(
    sessionId: string,
    requestId: string,
    manifest: CutoverBaselineManifest,
    mediaBytes: Buffer,
    snapshotBytes: Buffer,
    store: FakeStore,
  ): Promise<void> {
    for (const body of [snapshotBytes, mediaBytes, Buffer.from('fake signature bundle bytes')]) {
      const result = await recordAuditUploadObject({
        payload,
        sessionId,
        requestId,
        body,
        oidcToken: previewOidcToken(),
        env: testEnv(),
        storeFactory: makeStoreFactory(store),
      });
      expect(result).toMatchObject({ ok: true });
    }
    void manifest;
  }

  it('rejects completion when an object has not been uploaded yet, and writes no marker', async () => {
    const { sessionId, manifest, mediaBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    // snapshotとmediaはuploadするが、signature bundleは上げない。
    for (const body of [Buffer.from(canonicalJson({ manufacturers: [], robots: [] }), 'utf8'), mediaBytes]) {
      await recordAuditUploadObject({
        payload,
        sessionId,
        requestId: 'req-raw-1',
        body,
        oidcToken: previewOidcToken(),
        env: testEnv(),
        storeFactory: makeStoreFactory(store),
      });
    }
    const result = await completeAuditUploadSession({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      baselineRunId: manifest.provenance.baselineRunId,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'objects-missing' });
    expect(store.data.has(`${manifest.storage.objectKey}.complete.json`)).toBe(false);
  });

  it('rejects completion when the request baselineRunId does not match the manifest-derived one', async () => {
    const { sessionId, manifest, mediaBytes, snapshotBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    await uploadEverything(sessionId, 'req-raw-1', manifest, mediaBytes, snapshotBytes, store);

    const result = await completeAuditUploadSession({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      baselineRunId: 'a-different-run-id-entirely',
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'baseline-run-id-mismatch' });
    expect(store.data.has(`${manifest.storage.objectKey}.complete.json`)).toBe(false);
  });

  it('rejects completion when a re-fetched object no longer matches its declared sha256 (TOCTOU)', async () => {
    const { sessionId, manifest, mediaBytes, snapshotBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    await uploadEverything(sessionId, 'req-raw-1', manifest, mediaBytes, snapshotBytes, store);
    // storeの中身を直接改ざんする（TOCTOU攻撃の模擬——アップロード後にobjectが差し替えられた想定）。
    store.data.set(manifest.mediaInventory[0].objectKey, Buffer.from('tampered bytes'));

    const result = await completeAuditUploadSession({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      baselineRunId: manifest.provenance.baselineRunId,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'reverify-failed' });
    expect(store.data.has(`${manifest.storage.objectKey}.complete.json`)).toBe(false);
  });

  it('rejects completion when the uploaded "signature bundle" does not actually verify against the snapshot', async () => {
    // 実装中に見つけた穴の直接回帰: signature slotへ任意バイト列を上げても、Step 3で
    // 実際にcosign検証しない限りcompleteが通ってしまっていた。
    const { sessionId, manifest, mediaBytes, snapshotBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    await uploadEverything(sessionId, 'req-raw-1', manifest, mediaBytes, snapshotBytes, store);

    const result = await completeAuditUploadSession({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      baselineRunId: manifest.provenance.baselineRunId,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    // uploadEverything()は本物のcosign bundleではなく "fake signature bundle bytes" を
    // signature slotへ上げているので、cosign検証は必ず失敗するはず。
    expect(result).toMatchObject({ ok: false, reason: 'reverify-failed' });
    expect(store.data.has(`${manifest.storage.objectKey}.complete.json`)).toBe(false);
  }, 30_000);

  it.skipIf(!canSignForReal)(
    'writes a completion marker matching the existing exporter contract when everything (including a real signature) verifies',
    async () => {
      const { manifest, mediaBytes, snapshotBytes } = buildTestManifest();
      const envelope = await signManifest(manifest, PREVIEW_SIGNING_KEY_ARN);
      const created = await createAuditUploadSession({
        payload,
        rawBody: envelope,
        requestId: 'req-real-1',
        oidcToken: previewOidcToken(),
        env: testEnv(),
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const store = createFakeBlobStore();
      // 実signatureのbundleバイト列を取り出すため、export-content-snapshot.mtsのsignArtifactBuffer
      // 相当の経路は使わず、envelope.manifestSignatureとは別に snapshotへの実署名を作る。
      const { signBlobWithCosign } = await import('@/scripts/export-content-snapshot.mts');
      const { mkdtemp, writeFile: fsWriteFile, readFile } = await import('node:fs/promises');
      const os = await import('node:os');
      const path = await import('node:path');
      const dir = await mkdtemp(path.join(os.tmpdir(), 'audit-upload-test-'));
      const snapshotPath = path.join(dir, 'snapshot.json');
      const bundlePath = path.join(dir, 'snapshot.cosign.bundle');
      await fsWriteFile(snapshotPath, snapshotBytes);
      signBlobWithCosign(snapshotPath, bundlePath, PREVIEW_SIGNING_KEY_ARN);
      const realSignatureBytes = await readFile(bundlePath);

      for (const body of [snapshotBytes, mediaBytes, realSignatureBytes]) {
        const result = await recordAuditUploadObject({
          payload,
          sessionId: created.sessionId,
          requestId: 'req-real-1',
          body,
          oidcToken: previewOidcToken(),
          env: testEnv(),
          storeFactory: makeStoreFactory(store),
        });
        expect(result).toMatchObject({ ok: true });
      }

      const completed = await completeAuditUploadSession({
        payload,
        sessionId: created.sessionId,
        requestId: 'req-real-1',
        baselineRunId: manifest.provenance.baselineRunId,
        oidcToken: previewOidcToken(),
        env: testEnv(),
        storeFactory: makeStoreFactory(store),
      });
      expect(completed).toMatchObject({ ok: true });

      const markerBytes = store.data.get(`${manifest.storage.objectKey}.complete.json`);
      expect(markerBytes).toBeDefined();
      const marker = JSON.parse(markerBytes!.toString('utf8')) as Record<string, unknown>;
      expect(marker.artifactSha256).toBe(manifest.sha256);
      expect(marker.baselineRunId).toBe(manifest.provenance.baselineRunId);
      // 既存exporterと同じ契約: sha256Hex(canonicalJson(mediaInventory))。
      const expectedMediaInventorySha256 = sha256Hex(
        canonicalJson([
          {
            stableId: manifest.mediaInventory[0].stableId,
            filename: manifest.mediaInventory[0].filename,
            objectKey: manifest.mediaInventory[0].objectKey,
            sha256: manifest.mediaInventory[0].sha256,
            size: manifest.mediaInventory[0].size,
            mimeType: manifest.mediaInventory[0].mimeType,
          },
        ]),
      );
      expect(marker.mediaInventorySha256).toBe(expectedMediaInventorySha256);

      // replay防止: 同じsessionへ2回目のcompleteは拒否される。
      const replay = await completeAuditUploadSession({
        payload,
        sessionId: created.sessionId,
        requestId: 'req-real-1',
        baselineRunId: manifest.provenance.baselineRunId,
        oidcToken: previewOidcToken(),
        env: testEnv(),
        storeFactory: makeStoreFactory(store),
      });
      expect(replay).toMatchObject({ ok: false, reason: 'session-not-usable', detail: 'session-already-completed' });
    },
    60_000,
  );
});

describe('cleanupAuditUploadSession (失敗時cleanup)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/auditUploadSession.test.ts');
    payload = await getPayload({ config });
  });

  afterEach(async () => {
    await payload.delete({ collection: 'audit-upload-sessions', where: {}, overrideAccess: true });
  });

  it('removes uploaded objects and deletes the session row', async () => {
    const { sessionId, mediaBytes } = await createRawSession(payload);
    const store = createFakeBlobStore();
    await recordAuditUploadObject({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      body: mediaBytes,
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(store.data.size).toBe(1);

    const result = await cleanupAuditUploadSession({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: true, removedObjectCount: 1 });
    expect(store.data.size).toBe(0);

    const { totalDocs } = await payload.count({ collection: 'audit-upload-sessions', where: { sessionId: { equals: sessionId } }, overrideAccess: true });
    expect(totalDocs).toBe(0);
  });

  it('removes an orphan Blob even when its DB uploaded flag stayed false', async () => {
    const { sessionId, manifest } = await createRawSession(payload);
    const store = createFakeBlobStore();
    // Simulate Blob PUT succeeding immediately before the DB transaction/update
    // rolls back: the allowlisted object exists, but uploaded remains false.
    store.data.set(manifest.storage.objectKey, Buffer.from('orphan snapshot'));
    const result = await cleanupAuditUploadSession({
      payload, sessionId, requestId: 'req-raw-1', oidcToken: previewOidcToken(),
      env: testEnv(), storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: true, removedObjectCount: 0 });
    expect(store.data.size).toBe(0);
  });

  it('batch-cleans expired pending sessions and leaves completed sessions untouched', async () => {
    const { sessionId, manifest } = await createRawSession(payload, { expiresAt: new Date(Date.now() - 1000).toISOString() });
    await createRawSession(payload, { status: 'completed', expiresAt: new Date(Date.now() - 1000).toISOString() });
    const store = createFakeBlobStore();
    store.data.set(manifest.storage.objectKey, Buffer.from('expired orphan'));
    const result = await cleanupExpiredAuditUploadSessions({
      payload, oidcToken: previewOidcToken(), env: testEnv(), storeFactory: makeStoreFactory(store), limit: 10,
    });
    expect(result.scanned).toBe(1);
    expect(result.cleaned).toBe(1);
    expect(result.failed).toEqual([]);
    expect(store.data.size).toBe(0);
    const { totalDocs } = await payload.count({ collection: 'audit-upload-sessions', where: { sessionId: { equals: sessionId } }, overrideAccess: true });
    expect(totalDocs).toBe(0);
  });

  it('refuses to clean up a completed session (never touch a valid baseline)', async () => {
    const { sessionId } = await createRawSession(payload, { status: 'completed' });
    const store = createFakeBlobStore();
    const result = await cleanupAuditUploadSession({
      payload,
      sessionId,
      requestId: 'req-raw-1',
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'session-already-completed' });
  });

  it('refuses cleanup with a mismatched request id', async () => {
    const { sessionId } = await createRawSession(payload, { requestId: 'req-raw-original' });
    const store = createFakeBlobStore();
    const result = await cleanupAuditUploadSession({
      payload,
      sessionId,
      requestId: 'req-raw-different',
      oidcToken: previewOidcToken(),
      env: testEnv(),
      storeFactory: makeStoreFactory(store),
    });
    expect(result).toMatchObject({ ok: false, reason: 'request-id-mismatch' });
  });
});
