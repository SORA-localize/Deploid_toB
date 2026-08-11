import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Admins } from './collections/Admins';
import { ArticlePlacements } from './collections/ArticlePlacements';
import { Articles } from './collections/Articles';
import { Deployments } from './collections/Deployments';
import { Distributors } from './collections/Distributors';
import { Manufacturers } from './collections/Manufacturers';
import { Media } from './collections/Media';
import { RobotSeriesCollection } from './collections/RobotSeries';
import { Robots } from './collections/Robots';
import { UseCases } from './collections/UseCases';
import { SiteSettings } from './globals/SiteSettings';
import { RouteRegistryCollection } from './lib/payload/routeRegistry';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * DATABASE_URL / PAYLOAD_SECRET が欠けたまま起動すると、原因不明のadapter/auth初期化エラーに
 * なる。用途が分かるメッセージで早期に落とす。
 */
function requireEnv(name: 'DATABASE_URL' | 'PAYLOAD_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    const purpose =
      name === 'DATABASE_URL'
        ? 'Postgres (Supabase) connection string used by the postgres-adapter'
        : 'Payload auth/session signing secret';
    throw new Error(
      `${name} is not set. It is required to start Payload (${purpose}). ` +
        'Set it in .env.local for local development, or in the Vercel project Environment ' +
        'Variables for deployed environments. See .env.example and ' +
        'docs/reference/content-platform-resources-v1.md.',
    );
  }
  return value;
}

/**
 * public media store（Task 0で確定、`docs/reference/content-platform-resources-v1.md` #2）。
 * `BLOB_READ_WRITE_TOKEN` はVercelが環境（Production/Preview）ごとに自動注入するclassic static
 * tokenで、private audit storeとは別物（private audit tokenをMedia adapterへ渡さない、brief）。
 * local/CIでtokenが無い場合は `token: undefined` によりplugin自体が自動でlocal storageへ
 * fallbackするが、`alwaysInsertFields: true` で環境間のfield差分を無くす（brief:
 * 「schemaへ注入されるfield差分が環境間で変わらない設定にする」）。`MEDIA_STORAGE_ENABLED=false`
 * で明示的に無効化した場合も同様にfieldは残る（adapterを無かったことにしない）。
 */
const mediaStoragePlugin = vercelBlobStorage({
  enabled: process.env.MEDIA_STORAGE_ENABLED !== 'false',
  token: process.env.BLOB_READ_WRITE_TOKEN,
  alwaysInsertFields: true,
  collections: {
    media: true,
  },
});

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Admins,
    Manufacturers,
    Distributors,
    RobotSeriesCollection,
    Robots,
    UseCases,
    Deployments,
    Articles,
    ArticlePlacements,
    Media,
    RouteRegistryCollection,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: requireEnv('PAYLOAD_SECRET'),
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URL'),
    },
  }),
  plugins: [mediaStoragePlugin],
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
