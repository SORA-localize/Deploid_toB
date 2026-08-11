import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import type { Plugin } from 'payload';

/**
 * public media store（Task 0で確定、`docs/reference/content-platform-resources-v1.md` #2）。
 * `BLOB_READ_WRITE_TOKEN` はVercelが環境（Production/Preview）ごとに自動注入するclassic static
 * tokenで、private audit storeとは別物（private audit tokenをMedia adapterへ渡さない、brief）。
 * local/CIでtokenが無い場合は `token: undefined` によりplugin自体が自動でlocal storageへ
 * fallbackするが、`alwaysInsertFields: true` で環境間のfield差分を無くす（brief:
 * 「schemaへ注入されるfield差分が環境間で変わらない設定にする」）。`MEDIA_STORAGE_ENABLED=false`
 * で明示的に無効化した場合も同様にfieldは残る（adapterを無かったことにしない）。
 *
 * `payload.config.ts`（本番runtime）と `tests/fixtures/payload-migrations/*`（Task 3.5 Step 3 /
 * Task 8のmigration fixture）の両方がこの1箇所を参照する。fixture側がこのpluginを省略すると、
 * `alwaysInsertFields` が追加する `media.prefix` columnの有無だけで本番と食い違い、
 * migration差分に無関係な `DROP COLUMN "prefix"` が混入する（実際に一度発生し、ここへ抽出する
 * 直接のきっかけになった）。
 */
export function createMediaStoragePlugin(): Plugin {
  return vercelBlobStorage({
    enabled: process.env.MEDIA_STORAGE_ENABLED !== 'false',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    alwaysInsertFields: true,
    collections: {
      media: true,
    },
  });
}
