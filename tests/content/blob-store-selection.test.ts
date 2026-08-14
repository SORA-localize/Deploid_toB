import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  baselineCompletionMarkerKey,
  checkBlobStoreSelection,
  createLocalDiskObjectStore,
  createVercelBlobObjectStore,
  encodeUnsignedJwtForTests,
  normalizeBlobStoreId,
  parseVercelOidcEnvironment,
  resolveBlobCredential,
} from '@/scripts/snapshotObjectStore.mts';

/**
 * 必須修正7（remediation group 3）の負テスト。
 *
 * 監査の指摘（コントローラーが実コードで確認済み）:
 * > `createVercelBlobObjectStore(storeName)` の `storeName` 引数は manifest の表示用 bucket 名と
 * > して使われるだけで、実際にどの store へ接続するかの選択には一切関与しない。
 *
 * ここで固定するのは「**credential に紐付いた実 store ID** を取得し、要求された store と
 * 突き合わせ、食い違えば接続しない」こと。実 OIDC federated store（`deploid-audit-*`）は
 * Vercel Function runtime からしか到達できないため、ロジックそのものをここで検証する。
 */

const RW_TOKEN_PRODUCTION = 'vercel_blob_rw_abc123prod_deadbeefcafe';
const RW_TOKEN_PREVIEW = 'vercel_blob_rw_xyz789prev_feedfacecafe';

describe('blob store id derived from the credential (必須修正7-3)', () => {
  it('normalises the `store_` prefix so both spellings compare equal', () => {
    expect(normalizeBlobStoreId('store_abc123prod')).toBe('abc123prod');
    expect(normalizeBlobStoreId('abc123prod')).toBe('abc123prod');
  });

  it('reads the store id out of a classic read/write token', () => {
    const credential = resolveBlobCredential({ BLOB_READ_WRITE_TOKEN: RW_TOKEN_PRODUCTION });
    expect(credential).toMatchObject({ kind: 'read-write-token', storeId: 'abc123prod', environment: null });
  });

  it('refuses a malformed read/write token instead of guessing a store', () => {
    expect(() => resolveBlobCredential({ BLOB_READ_WRITE_TOKEN: 'not-a-blob-token' })).toThrow(
      /blob-credential-unparseable/,
    );
  });

  it('reads the store id and the environment claim from an OIDC credential', () => {
    const credential = resolveBlobCredential({
      VERCEL_OIDC_TOKEN: encodeUnsignedJwtForTests({ environment: 'production', owner_id: 'team_x' }),
      BLOB_STORE_ID: 'store_abc123prod',
    });
    expect(credential).toMatchObject({ kind: 'oidc', storeId: 'abc123prod', environment: 'production' });
  });

  it('does not invent a store id when OIDC is present but BLOB_STORE_ID is not', () => {
    const credential = resolveBlobCredential({
      VERCEL_OIDC_TOKEN: encodeUnsignedJwtForTests({ environment: 'production' }),
    });
    expect(credential).toMatchObject({ kind: 'oidc', storeId: null });
  });

  it('prefers the OIDC credential over an ambient public-media read/write token', () => {
    // `BLOB_READ_WRITE_TOKEN` はこの project では **public media store** の token。
    // private audit store の操作でそれを掴んだら事故なので、OIDC がある環境では OIDC を使う。
    const credential = resolveBlobCredential({
      VERCEL_OIDC_TOKEN: encodeUnsignedJwtForTests({ environment: 'preview' }),
      BLOB_STORE_ID: 'store_xyz789prev',
      BLOB_READ_WRITE_TOKEN: RW_TOKEN_PRODUCTION,
    });
    expect(credential).toMatchObject({ kind: 'oidc', storeId: 'xyz789prev' });
  });

  it('reports no credential at all rather than falling through to an implicit one', () => {
    expect(() => resolveBlobCredential({})).toThrow(/blob-credential-missing/);
  });

  it('reads the environment claim without trusting the signature', () => {
    expect(parseVercelOidcEnvironment(encodeUnsignedJwtForTests({ environment: 'preview' }))).toBe('preview');
    expect(parseVercelOidcEnvironment('garbage')).toBeNull();
    expect(parseVercelOidcEnvironment(encodeUnsignedJwtForTests({ environment: 'staging' }))).toBeNull();
  });
});

describe('store selection cross-check (必須修正7-4 / 7-8)', () => {
  const credential = { kind: 'read-write-token' as const, storeId: 'abc123prod', environment: null, token: RW_TOKEN_PRODUCTION };

  it('accepts a credential whose store id matches the requested store', () => {
    expect(checkBlobStoreSelection({ requestedStoreId: 'store_abc123prod', credential })).toEqual([]);
  });

  it('rejects a credential bound to a different store', () => {
    const failures = checkBlobStoreSelection({ requestedStoreId: 'store_xyz789prev', credential });
    expect(failures.map((failure) => failure.check)).toEqual(['blobStoreId']);
    expect(failures[0].detail).toMatch(/abc123prod/);
  });

  /** Preview / Production の credential 交差（brief 必須修正7-8 の負テスト）。 */
  it('rejects preview credentials aimed at the production audit store, and the reverse', () => {
    const previewCredential = {
      kind: 'oidc' as const,
      storeId: 'xyz789prev',
      environment: 'preview' as const,
      token: 'oidc',
    };
    expect(
      checkBlobStoreSelection({
        requestedStoreId: 'store_abc123prod',
        expectedEnvironment: 'production',
        credential: previewCredential,
      }).map((failure) => failure.check),
    ).toEqual(['blobStoreId', 'blobCredentialEnvironment']);

    const productionCredential = {
      kind: 'oidc' as const,
      storeId: 'abc123prod',
      environment: 'production' as const,
      token: 'oidc',
    };
    expect(
      checkBlobStoreSelection({
        requestedStoreId: 'store_xyz789prev',
        expectedEnvironment: 'preview',
        credential: productionCredential,
      }).map((failure) => failure.check),
    ).toEqual(['blobStoreId', 'blobCredentialEnvironment']);
  });

  /**
   * fail-closed: どの store を選ぶ credential なのか**証明できない**場合は接続しない。
   * ここを「要求された store を使う」で埋めると、cross-check が自分自身との比較になり無意味になる。
   */
  it('refuses when the credential cannot prove which store it selects', () => {
    const failures = checkBlobStoreSelection({
      requestedStoreId: 'store_abc123prod',
      credential: { kind: 'oidc', storeId: null, environment: 'production', token: 'oidc' },
    });
    expect(failures.map((failure) => failure.check)).toEqual(['blobCredentialStoreUnknown']);
  });

  it('refuses a request with no store id at all', () => {
    expect(checkBlobStoreSelection({ requestedStoreId: '', credential }).map((f) => f.check)).toEqual([
      'blobStoreIdMissing',
    ]);
  });
});

describe('the vercel-blob adapter actually selects a store (必須修正7-2)', () => {
  it('refuses to be constructed when the ambient credential belongs to another store', () => {
    expect(() =>
      createVercelBlobObjectStore({
        storeId: 'store_deploid_audit_production',
        displayName: 'deploid-audit-production',
        env: { BLOB_READ_WRITE_TOKEN: RW_TOKEN_PREVIEW },
      }),
    ).toThrow(/blob-store-selection-refused/);
  });

  it('refuses to be constructed with no credential at all instead of calling an implicit-token API', () => {
    expect(() =>
      createVercelBlobObjectStore({ storeId: 'store_abc123prod', displayName: 'deploid-audit-production', env: {} }),
    ).toThrow(/blob-credential-missing/);
  });

  it('exposes the credential-verified store id, not the display name', () => {
    const store = createVercelBlobObjectStore({
      storeId: 'store_abc123prod',
      displayName: 'deploid-audit-production',
      env: { BLOB_READ_WRITE_TOKEN: RW_TOKEN_PRODUCTION },
    });
    expect(store.storeId).toBe('abc123prod');
    expect(store.bucket).toBe('deploid-audit-production');
    // 表示用の参照は URL を返さない（期限の無いリンクをログへ残さない）。
    expect(store.objectReference('k.json')).not.toMatch(/^https?:/);
  });
});

describe('local-disk object store completeness helpers (必須修正7-7)', () => {
  it('reports existence and removes partial objects', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-store-'));
    try {
      const store = createLocalDiskObjectStore(dir);
      expect(store.storeId).toBeNull();
      expect(await store.exists('a/b.json')).toBe(false);
      await store.put('a/b.json', Buffer.from('one'));
      expect(await store.exists('a/b.json')).toBe(true);
      await store.remove('a/b.json');
      expect(await store.exists('a/b.json')).toBe(false);
      // 存在しないキーの削除は成功扱い（失敗した run の後片付けを止めない）。
      await expect(store.remove('a/b.json')).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('derives the completion marker key from the artifact key', () => {
    expect(baselineCompletionMarkerKey('cutover-baseline/x.json')).toBe('cutover-baseline/x.json.complete.json');
  });
});
