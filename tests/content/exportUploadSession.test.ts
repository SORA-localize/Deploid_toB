import { describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '@/lib/content/contracts';
import {
  assertAuditUploadEndpointAllowed,
  type BaselineProvenance,
  type CutoverBaselineManifest,
  exportSignedBaselineViaUploadSession,
  mintAuditUploadJwt,
} from '@/scripts/export-content-snapshot.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

/**
 * `exportSignedBaselineViaUploadSession()`（Task 21: CLI export --upload の3段階session route
 * 配線）の回帰テスト。実サーバ・実Blob・実cosign/KMSは使わない——署名は`signArtifact`/
 * `signManifestEnvelope`を差し替えて決定的にし、HTTP呼び出しは`fetchImpl`を差し替えた
 * fake serverで記録する。実route側の詳細な検証ロジック（署名検証・digest照合・並行upload
 * 等）は`tests/content/auditUploadSession.test.ts`が既に担保しているため、ここでは
 * 「CLI側がどの順序でどのrequestを送るか・失敗時にcleanupを呼ぶか」だけを見る。
 *
 * 2026-08-23レビュー指摘2件への回帰テストも持つ:
 * 1. `--audit-upload-endpoint`は任意URLを受け付けない（https必須・userinfo/query/hash拒否・
 *    allowlistされたhost以外拒否・redirect禁止）。
 * 2. `--admin-password`はCLI引数として受け付けない（環境変数か対話入力のみ）。
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
// `assertAuditUploadEndpointAllowed`はfail-closed（allowlist未設定なら常に拒否）なので、
// ENDPOINTを許可するfake allowlistをテスト全体で使う。
const TEST_ENV = { AUDIT_UPLOAD_ALLOWED_PREVIEW_HOST_SUFFIX: '.vercel.app' };

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
  redirect?: RequestRedirect;
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
    const record: RecordedRequest = { method, url, headers, redirect: init.redirect };
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
      env: TEST_ENV,
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
      // レビュー指摘1: 資格情報を積んだrequestがredirectへ黙って従わない。
      expect(call.redirect).toBe('error');
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
      env: TEST_ENV,
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
        env: TEST_ENV,
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
        env: TEST_ENV,
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
        env: TEST_ENV,
        ...fakeSigners(),
      }),
    ).rejects.toThrow(/baseline-upload-incomplete: audit-upload-session-create-failed[\s\S]*No session was created/);

    // sessionが無いままDELETEを呼んではいけない(存在しないsessionIdへcleanupを送らない)。
    const deleteCalls = server.calls.filter((call) => call.method === 'DELETE');
    expect(deleteCalls).toHaveLength(0);
  });

  it('rejects a disallowed endpoint before making any HTTP call (no allowlist configured)', async () => {
    const server = createFakeAuditUploadServer();
    const snapshot = snapshotWithMedia([]);

    await expect(
      exportSignedBaselineViaUploadSession({
        snapshot,
        store: STORE,
        exportedBy: 'upload-session-test',
        provenance: PROVENANCE,
        resolveMediaBytes: async () => ONE_PX_PNG,
        endpointBaseUrl: 'https://totally-unrelated-host.example.com',
        credentials: CREDENTIALS,
        fetchImpl: server.fetchImpl,
        env: TEST_ENV, // configured for .vercel.app only, not this host
        ...fakeSigners(),
      }),
    ).rejects.toThrow(/audit-upload-endpoint-refused/);

    expect(server.calls).toHaveLength(0);
  });
});

describe('assertAuditUploadEndpointAllowed', () => {
  const PREVIEW_ENV = { AUDIT_UPLOAD_ALLOWED_PREVIEW_HOST_SUFFIX: '-soras-projects-bb254ff5.vercel.app' };
  const PRODUCTION_ENV = { AUDIT_UPLOAD_ALLOWED_PRODUCTION_HOST: 'deploid.net' };

  it('accepts a preview host matching the configured suffix', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed(
        'https://deploid-to-o7rlk0bat-soras-projects-bb254ff5.vercel.app',
        'preview',
        PREVIEW_ENV,
      ),
    ).not.toThrow();
  });

  it('accepts the exact configured production host', () => {
    expect(() => assertAuditUploadEndpointAllowed('https://deploid.net', 'production', PRODUCTION_ENV)).not.toThrow();
  });

  it('rejects http (non-https)', () => {
    expect(() => assertAuditUploadEndpointAllowed('http://deploid.net', 'production', PRODUCTION_ENV)).toThrow(
      /audit-upload-endpoint-invalid: must be https/,
    );
  });

  it('rejects userinfo (user:pass@host)', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed('https://attacker:pw@deploid.net', 'production', PRODUCTION_ENV),
    ).toThrow(/userinfo/);
  });

  it('rejects a query string', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed('https://deploid.net/?x=1', 'production', PRODUCTION_ENV),
    ).toThrow(/query string/);
  });

  it('rejects a hash fragment', () => {
    expect(() => assertAuditUploadEndpointAllowed('https://deploid.net/#x', 'production', PRODUCTION_ENV)).toThrow(
      /query string/,
    );
  });

  it('rejects a non-empty path', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed('https://deploid.net/some/path', 'production', PRODUCTION_ENV),
    ).toThrow(/bare origin/);
  });

  it('rejects a production host that is not the exact allowed host', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed('https://deploid.net.attacker.com', 'production', PRODUCTION_ENV),
    ).toThrow(/audit-upload-endpoint-refused/);
  });

  it('rejects a preview host that does not end with the configured suffix', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed('https://evil.example.com', 'preview', PREVIEW_ENV),
    ).toThrow(/audit-upload-endpoint-refused/);
  });

  it('rejects a suffix-spoofing host embedding the suffix mid-string, not as an actual suffix', () => {
    // "ends with" must be a genuine hostname suffix, not merely `.includes(...)`.
    expect(() =>
      assertAuditUploadEndpointAllowed(
        'https://deploid-to-x-soras-projects-bb254ff5.vercel.app.attacker.com',
        'preview',
        PREVIEW_ENV,
      ),
    ).toThrow(/audit-upload-endpoint-refused/);
  });

  it('fails closed when production allowlist is not configured', () => {
    expect(() => assertAuditUploadEndpointAllowed('https://deploid.net', 'production', {})).toThrow(
      /AUDIT_UPLOAD_ALLOWED_PRODUCTION_HOST is not set/,
    );
  });

  it('fails closed when preview allowlist is not configured', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed('https://deploid-to-x-soras-projects-bb254ff5.vercel.app', 'preview', {}),
    ).toThrow(/AUDIT_UPLOAD_ALLOWED_PREVIEW_HOST_SUFFIX is not set/);
  });

  it('always rejects local-throwaway (the real audit store is never wired to it)', () => {
    expect(() =>
      assertAuditUploadEndpointAllowed('https://deploid.net', 'local-throwaway', {
        ...PREVIEW_ENV,
        ...PRODUCTION_ENV,
      }),
    ).toThrow(/audit-upload-endpoint-refused/);
  });
});

describe('mintAuditUploadJwt — CLI-argument password rejection', () => {
  it('refuses --admin-password outright, before touching Payload or stdin', async () => {
    const args = new Map<string, string | true>([
      ['admin-email', 'operator@example.com'],
      ['admin-password', 'hunter2'],
    ]);
    await expect(mintAuditUploadJwt(args)).rejects.toThrow(
      /--admin-password is not accepted here/,
    );
  });

  it('refuses when no email is configured', async () => {
    const args = new Map<string, string | true>();
    const originalEmail = process.env.AUDIT_UPLOAD_ADMIN_EMAIL;
    delete process.env.AUDIT_UPLOAD_ADMIN_EMAIL;
    try {
      await expect(mintAuditUploadJwt(args)).rejects.toThrow(/Set AUDIT_UPLOAD_ADMIN_EMAIL/);
    } finally {
      if (originalEmail !== undefined) process.env.AUDIT_UPLOAD_ADMIN_EMAIL = originalEmail;
    }
  });

  it('refuses when no password is available and stdin is not an interactive TTY (the case under vitest/CI)', async () => {
    const args = new Map<string, string | true>([['admin-email', 'operator@example.com']]);
    const originalPassword = process.env.AUDIT_UPLOAD_ADMIN_PASSWORD;
    delete process.env.AUDIT_UPLOAD_ADMIN_PASSWORD;
    try {
      expect(process.stdin.isTTY).toBeFalsy();
      await expect(mintAuditUploadJwt(args)).rejects.toThrow(
        /AUDIT_UPLOAD_ADMIN_PASSWORD is not set and stdin is not an interactive TTY/,
      );
    } finally {
      if (originalPassword !== undefined) process.env.AUDIT_UPLOAD_ADMIN_PASSWORD = originalPassword;
    }
  });
});
