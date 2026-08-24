import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * `Media` collectionのstorage adapter（brief Step 3）: 小さいテスト画像をupload → read → delete
 * し、(a) storageへ保存される、(b) 未認証readがaccess policy（常に公開）どおりになる、
 * (c) delete後にobjectが残らないことを確認する。
 *
 * (a)/(c) は当初DBの行（`filename` / row count）しか見ておらず、storage adapter自体が壊れても
 * 検出できなかった（コードレビュー指摘）。実際にobjectが存在する／存在しないことを、
 * 実際に有効なbackendに対して検証する:
 * - `BLOB_READ_WRITE_TOKEN` 未設定（local/CI既定。`docs/reference/content-platform-resources-v1.md`
 *   「CI/test storageはfake/localを使う」）: `@payloadcms/storage-vercel-blob` が自動でlocal
 *   storageへfallbackする（`payload.config.ts` の `mediaStoragePlugin` と同じ判定式）。この場合は
 *   `<repo root>/media/<filename>` の実ファイルの有無とバイト内容を直接確認する。
 * - `BLOB_READ_WRITE_TOKEN` が設定されている場合（実cloud store使用）: `@vercel/blob` の `head()`
 *   で実際にobjectの有無を確認する。
 */
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

// `payload.config.ts` の `mediaStoragePlugin` と同じ有効化判定（`enabled` && `token`）。
const isVercelBlobStorageActive =
  process.env.MEDIA_STORAGE_ENABLED !== 'false' && Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function assertObjectExistsInStorage(doc: { filename?: string | null; url?: string | null }): Promise<void> {
  if (isVercelBlobStorageActive) {
    const { head } = await import('@vercel/blob');
    const result = await head(doc.url as string, { token: process.env.BLOB_READ_WRITE_TOKEN });
    expect(result.size).toBeGreaterThan(0);
    return;
  }

  const localPath = path.join(process.cwd(), 'media', doc.filename as string);
  expect(existsSync(localPath)).toBe(true);
  const [written, stats] = await Promise.all([readFile(localPath), stat(localPath)]);
  expect(stats.size).toBe(ONE_PX_PNG.byteLength);
  expect(written.equals(ONE_PX_PNG)).toBe(true);
}

async function assertObjectAbsentFromStorage(doc: { filename?: string | null; url?: string | null }): Promise<void> {
  if (isVercelBlobStorageActive) {
    const { head, BlobNotFoundError } = await import('@vercel/blob');
    await expect(head(doc.url as string, { token: process.env.BLOB_READ_WRITE_TOKEN })).rejects.toThrow(BlobNotFoundError);
    return;
  }

  const localPath = path.join(process.cwd(), 'media', doc.filename as string);
  expect(existsSync(localPath)).toBe(false);
}

describe('Media collection storage adapter (real Payload Local API)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/media-storage.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'media', where: {}, overrideAccess: true });
  });

  afterAll(async () => {
    await payload?.destroy();
  });

  it('uploads, reads (including unauthenticated), and deletes an object', async () => {
    const created = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: {
        stableId: 'media-test-1px-png',
        alt: 'One transparent test pixel',
        rights: { status: 'own', sourceType: 'own', checkedAt: '2026-01-01' },
      },
      file: {
        data: ONE_PX_PNG,
        mimetype: 'image/png',
        name: 'media-test-1px.png',
        size: ONE_PX_PNG.byteLength,
      },
    });

    // (a) storageへ保存される: DBのfilename/mimeTypeだけでなく、実storage（local fallback or
    // 実cloud store）にobjectそのものが存在し、書き込んだバイト列と一致することを確認する。
    expect(created.filename).toBeTruthy();
    expect(created.mimeType).toBe('image/png');
    await assertObjectExistsInStorage(created);

    // (b) 未認証readがaccess policyどおりになる: Media.access.read は常に公開なので例外にならない。
    const unauthenticatedRead = await payload.findByID({
      collection: 'media',
      id: created.id,
      overrideAccess: false,
    });
    expect(unauthenticatedRead.id).toBe(created.id);
    expect(unauthenticatedRead.filename).toBe(created.filename);

    // (c) delete後にobjectが残らない: DBの行が消えるだけでなく、storage側のobjectも実際に
    // 削除されていることを確認する。
    await payload.delete({ collection: 'media', id: created.id, overrideAccess: true });

    const { totalDocs } = await payload.count({
      collection: 'media',
      where: { stableId: { equals: 'media-test-1px-png' } },
      overrideAccess: true,
    });
    expect(totalDocs).toBe(0);
    await assertObjectAbsentFromStorage(created);
  });

  it('rejects create by a non-authenticated / non-draft-writer actor', async () => {
    await expect(
      payload.create({
        collection: 'media',
        overrideAccess: false,
        data: {
          stableId: 'media-test-reject',
          alt: 'Should not be created',
          rights: { status: 'own', sourceType: 'own', checkedAt: '2026-01-01' },
        },
        file: {
          data: ONE_PX_PNG,
          mimetype: 'image/png',
          name: 'media-test-reject.png',
          size: ONE_PX_PNG.byteLength,
        },
      }),
    ).rejects.toThrow();
  });
});
