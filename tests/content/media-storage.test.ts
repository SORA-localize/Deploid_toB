import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * `Media` collectionのstorage adapter（brief Step 3）: 小さいテスト画像をupload → read → delete
 * し、(a) storageへ保存される、(b) 未認証readがaccess policy（常に公開）どおりになる、
 * (c) delete後にobjectが残らないことを確認する。`BLOB_READ_WRITE_TOKEN` 未設定のlocal/CIでは
 * `@payloadcms/storage-vercel-blob` がlocal storageへfallbackする
 * （`docs/reference/content-platform-resources-v1.md` 「CI/test storageはfake/localを使う」）。
 */
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

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

    // (a) storageへ保存される: filenameとurlが解決できる。
    expect(created.filename).toBeTruthy();
    expect(created.mimeType).toBe('image/png');

    // (b) 未認証readがaccess policyどおりになる: Media.access.read は常に公開なので例外にならない。
    const unauthenticatedRead = await payload.findByID({
      collection: 'media',
      id: created.id,
      overrideAccess: false,
    });
    expect(unauthenticatedRead.id).toBe(created.id);
    expect(unauthenticatedRead.filename).toBe(created.filename);

    // (c) delete後にobjectが残らない。
    await payload.delete({ collection: 'media', id: created.id, overrideAccess: true });

    const { totalDocs } = await payload.count({
      collection: 'media',
      where: { stableId: { equals: 'media-test-1px-png' } },
      overrideAccess: true,
    });
    expect(totalDocs).toBe(0);
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
