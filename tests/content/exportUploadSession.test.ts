import { describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '@/lib/content/contracts';
import {
  type BaselineProvenance,
  type CutoverBaselineManifest,
  exportSignedBaselineViaUploadSession,
} from '@/scripts/export-content-snapshot.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

/**
 * `exportSignedBaselineViaUploadSession()`（Task 21: CLI export --upload の3段階session route
 * 配線）の回帰テスト。実サーバ・実Blob・実cosign/KMSは使わない——署名は`signArtifact`/
 * `signManifestEnvelope`を差し替えて決定的にし、HTTP呼び出しは`fetchImpl`を差し替えた
 * fake serverで記録する。実route側の詳細な検証ロジック（署名検証・digest照合・並行upload
 * 等）は`tests/content/auditUploadSession.test.ts`が既に担保しているため、ここでは
 * 「CLI側がどの順序でどのrequestを送るか・失敗時にcleanupを呼ぶか」だけを見る。
 */

const PROVENANCE: BaselineProvenance = {
  sourceKind: 'payload',
  environment: 'preview',
  databaseResourceId: 'db.example.internal:5432/deploid',
  auditBlobStoreId: 'audit-store-preview',
  schemaVersion: 'test',
  baselineRunId: 'baseline-upload-session-test',
  baselineGeneration: 3,
};

const CREDENTIALS = { jwt: 'fake-jwt', sharedSecret: 'fake-shared-secret' };
const ENDPOINT = 'https://deploid-example.vercel.app';

const STORE = { provider: 'vercel-blob' as const, bucket: 'store_abc123', storeId: 'abc123' };

const FAKE_SIGNATURE_BUNDLE = Buffer.from('fake-signature-bundle');

function fakeSigners() {
  return {
    signArtifact: async () => FAKE_SIGNATURE_BUNDLE,
    signManifestEnvelope: async (manifest: CutoverBaselineManifest) => ({
      manifest,
      manifestSignature: { algorithm: 'cosign' as const, keyId: 'fake-key', bundleBase64: 'ZmFrZQ==' },
    }),
  };
}

function snapshotWithMedia(media: ContentSnapshot['media']): ContentSnapshot {
  return { ...structuredClone(contentSnapshotFixture), media };
}

const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

interface RecordedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  bodyText?: string;
  bodyByteLength?: number;
}

/**
 * `exportSignedBaselineViaUploadSession`が送るrequestを記録するだけの最小fake。実routeの
 * 検証ロジックは一切再実装しない——固定sessionIdを返し、object/completeは常に成功させる。
 */
function createFakeAuditUploadServer(options: { failOn?: (req: RecordedRequest) => boolean } = {}) {
  const calls: RecordedRequest[] = [];
  const sessionId = 'fake-session-id';

  const fetchImpl: typeof fetch = async (input, init = {}): Promise<Response> => {
    const url = String(input);
    const headers = Object.fromEntries(new Headers(init.headers as HeadersInit).entries());
    const method = init.method ?? 'GET';
    const record: RecordedRequest = { method, url, headers };
    if (typeof init.body === 'string') {
      record.bodyText = init.body;
    } else if (init.body instanceof Uint8Array) {
      record.bodyByteLength = init.body.byteLength;
    }
    calls.push(record);

    if (options.failOn?.(record)) {
      return new Response(JSON.stringify({ error: 'injected-test-failure' }), { status: 500 });
    }

    if (method === 'POST' && url.endsWith('/api/admin/audit-upload/session')) {
      return new Response(JSON.stringify({ sessionId, expiresAt: '2099-01-01T00:00:00.000Z', environment: 'preview' }), {
        status: 201,
      });
    }
    if (method === 'POST' && url.endsWith('/object')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (method === 'POST' && url.endsWith('/complete')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (method === 'DELETE') {
      return new Response(JSON.stringify({ ok: true, removedObjectCount: 0 }), { status: 200 });
    }
    throw new Error(`unexpected fake request: ${method} ${url}`);
  };

  return { fetchImpl, calls, sessionId };
}

describe('exportSignedBaselineViaUploadSession', () => {
  it('signs the manifest before any HTTP call, then creates a session, uploads every object once, and completes', async () => {
    const server = createFakeAuditUploadServer();
    const snapshot = snapshotWithMedia([contentSnapshotFixture.media[0]]);

    const result = await exportSignedBaselineViaUploadSession({
      snapshot,
      store: STORE,
      exportedBy: 'upload-session-test',
      provenance: PROVENANCE,
      resolveMediaBytes: async () => ONE_PX_PNG,
      endpointBaseUrl: ENDPOINT,
      credentials: CREDENTIALS,
      fetchImpl: server.fetchImpl,
      ...fakeSigners(),
    });

    expect(result.sessionId).toBe(server.sessionId);
    expect(result.manifest.storage.provider).toBe('vercel-blob');
    expect(result.manifest.storage.storeId).toBe('abc123');
    expect(result.manifest.mediaInventory).toHaveLength(1);

    // 順序: session create → snapshot object → signature object → media object → complete。
    const methodsAndPaths = server.calls.map((call) => `${call.method} ${new URL(call.url).pathname}`);
    expect(methodsAndPaths).toEqual([
      'POST /api/admin/audit-upload/session',
      `POST /api/admin/audit-upload/session/${server.sessionId}/object`,
      `POST /api/admin/audit-upload/session/${server.sessionId}/object`,
      `POST /api/admin/audit-upload/session/${server.sessionId}/object`,
      `POST /api/admin/audit-upload/session/${server.sessionId}/complete`,
    ]);

    // session createのbodyは署名済みenvelope全体（manifestそのものではない）。
    const sessionCreateBody = JSON.parse(server.calls[0].bodyText!);
    expect(sessionCreateBody.manifest).toBeDefined();
    expect(sessionCreateBody.manifestSignature).toBeDefined();

    // 全requestが同じrequestId・同じ認証headerを持つ(session Step1〜3で同一runとして扱われる条件)。
    const requestIds = new Set(server.calls.map((call) => call.headers['x-audit-upload-request-id']));
    expect(requestIds.size).toBe(1);
    for (const call of server.calls) {
      expect(call.headers.authorization).toBe('JWT fake-jwt');
      expect(call.headers['x-audit-upload-scope']).toBe('fake-shared-secret');
    }

    // completeのbodyはbaselineRunIdだけを持つ(サーバ側がmanifestのprovenanceと照合する)。
    const completeBody = JSON.parse(server.calls.at(-1)!.bodyText!);
    expect(completeBody).toEqual({ baselineRunId: PROVENANCE.baselineRunId });
  });

  it('uploads a content-addressed duplicate media object only once', async () => {
    const server = createFakeAuditUploadServer();
    // 2つのstableIdが同じバイト列を指す(rights違いで2レコードに割れた同一ファイルのケース)。
    const duplicateMedia = [
      { ...contentSnapshotFixture.media[0], id: 'media:/media/a.png', filename: 'a.png' },
      { ...contentSnapshotFixture.media[0], id: 'media:/media/b.png', filename: 'b.png' },
    ];
    const snapshot = snapshotWithMedia(duplicateMedia);

    const result = await exportSignedBaselineViaUploadSession({
      snapshot,
      store: STORE,
      exportedBy: 'upload-session-test',
      provenance: PROVENANCE,
      resolveMediaBytes: async () => ONE_PX_PNG,
      endpointBaseUrl: ENDPOINT,
      credentials: CREDENTIALS,
      fetchImpl: server.fetchImpl,
      ...fakeSigners(),
    });

    // inventoryには両方のstableIdが載るが、objectへのPOSTは同じobjectKeyにつき1回だけ。
    expect(result.manifest.mediaInventory).toHaveLength(2);
    const objectUploadCalls = server.calls.filter((call) => call.url.endsWith('/object'));
    // snapshot本体 + signature bundle + 重複排除後のmedia 1件 = 3件。
    expect(objectUploadCalls).toHaveLength(3);
  });

  it('never calls the endpoint at all when manifest signing fails', async () => {
    const server = createFakeAuditUploadServer();
    const snapshot = snapshotWithMedia([]);

    await expect(
      exportSignedBaselineViaUploadSession({
        snapshot,
        store: STORE,
        exportedBy: 'upload-session-test',
        provenance: PROVENANCE,
        resolveMediaBytes: async () => ONE_PX_PNG,
        endpointBaseUrl: ENDPOINT,
        credentials: CREDENTIALS,
        fetchImpl: server.fetchImpl,
        signArtifact: fakeSigners().signArtifact,
        signManifestEnvelope: async () => {
          throw new Error('manifest signer unavailable');
        },
      }),
    ).rejects.toThrow(/baseline-upload-incomplete: manifest signer unavailable[\s\S]*No session was created/);

    expect(server.calls).toHaveLength(0);
  });

  it('requests session cleanup (DELETE) when an object upload fails mid-run, and surfaces the original error', async () => {
    const server = createFakeAuditUploadServer({
      failOn: (req) => req.method === 'POST' && req.url.endsWith('/object'),
    });
    const snapshot = snapshotWithMedia([]);

    await expect(
      exportSignedBaselineViaUploadSession({
        snapshot,
        store: STORE,
        exportedBy: 'upload-session-test',
        provenance: PROVENANCE,
        resolveMediaBytes: async () => ONE_PX_PNG,
        endpointBaseUrl: ENDPOINT,
        credentials: CREDENTIALS,
        fetchImpl: server.fetchImpl,
        ...fakeSigners(),
      }),
    ).rejects.toThrow(/baseline-upload-incomplete: audit-upload-object-failed[\s\S]*Requested cleanup/);

    const methods = server.calls.map((call) => call.method);
    expect(methods).toContain('DELETE');
    const deleteCall = server.calls.find((call) => call.method === 'DELETE');
    expect(deleteCall?.url).toBe(`${ENDPOINT}/api/admin/audit-upload/session/${server.sessionId}`);
  });

  it('surfaces a clear error and never calls the endpoint when session creation itself fails', async () => {
    const server = createFakeAuditUploadServer({
      failOn: (req) => req.method === 'POST' && req.url.endsWith('/api/admin/audit-upload/session'),
    });
    const snapshot = snapshotWithMedia([]);

    await expect(
      exportSignedBaselineViaUploadSession({
        snapshot,
        store: STORE,
        exportedBy: 'upload-session-test',
        provenance: PROVENANCE,
        resolveMediaBytes: async () => ONE_PX_PNG,
        endpointBaseUrl: ENDPOINT,
        credentials: CREDENTIALS,
        fetchImpl: server.fetchImpl,
        ...fakeSigners(),
      }),
    ).rejects.toThrow(/baseline-upload-incomplete: audit-upload-session-create-failed[\s\S]*No session was created/);

    // sessionが無いままDELETEを呼んではいけない(存在しないsessionIdへcleanupを送らない)。
    const deleteCalls = server.calls.filter((call) => call.method === 'DELETE');
    expect(deleteCalls).toHaveLength(0);
  });
});
