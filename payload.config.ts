import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Admins } from './collections/Admins';

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

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Admins],
  editor: lexicalEditor(),
  secret: requireEnv('PAYLOAD_SECRET'),
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URL'),
    },
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
