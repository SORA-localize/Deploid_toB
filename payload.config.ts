import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import { Admins } from './collections/Admins';
import { adminPublishTranslations } from './lib/payload/adminPublishMessages';
import { contentCollections, contentGlobals } from './lib/payload/contentSchema';
import { createMcpPlugin } from './lib/payload/mcp';
import { createMediaStoragePlugin } from './lib/payload/mediaStoragePlugin';
import { withPreviewNonceSchema } from './lib/payload/previewNonceSchema';
import { resolvePublicServerUrl } from './lib/payload/resolvePublicServerUrl';

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
  serverURL: resolvePublicServerUrl(),
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: contentCollections,
  // Admin公開ボタンの文言。`lib/uiText.ts`（公開サイト用）には入れない —— adminはPayload独自の
  // i18nで、言語はブラウザ設定で `ja`/`en` が切り替わる。公開サイト用の表に混ぜると
  // 英語ロケールのadminに日本語が出る。キーの網羅は型で保証している
  // （`lib/payload/adminPublishMessages.ts` 参照）。
  i18n: { translations: adminPublishTranslations },
  globals: contentGlobals,
  editor: lexicalEditor(),
  secret: requireEnv('PAYLOAD_SECRET'),
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URL'),
    },
    // Draft Mode preview tokenのnonce台帳（`lib/payload/previewNonceSchema.ts`）。Payload
    // collectionにしない生tableなので、`afterSchemaInit` で宣言に加えないとdev-mode
    // schema auto-pushのたびに削除される（詳細はそのファイルのコメント参照）。
    afterSchemaInit: [withPreviewNonceSchema],
    // Payload's default resolution (`findMigrationDir`) picks `src/migrations` whenever a `src/`
    // directory exists (it does here, for `src/app/(payload)`), not repo-root `migrations/`.
    // Pin it explicitly so generated migrations land where Task 3.5 commits them
    // (`docs/reference/database-migration-runbook-v1.md`, `git add migrations`).
    //
    // `PAYLOAD_TEST_MIGRATION_DIR` is an escape hatch for `tests/content/migration.test.ts` only
    // (Task 3.5 Step 2's "generate the initial migration against an empty DB" scenario, run
    // repeatedly against throwaway databases) — it redirects generated migration *output* to a
    // temp directory so repeated test runs never write timestamped files into the real, committed
    // `migrations/` directory. Never set in a real deploy environment.
    migrationDir: process.env.PAYLOAD_TEST_MIGRATION_DIR
      ? path.resolve(process.cwd(), process.env.PAYLOAD_TEST_MIGRATION_DIR)
      : path.resolve(dirname, 'migrations'),
  }),
  // MCP pluginはcreateMediaStoragePlugin()の後ろに置く（順序自体に意味は無いが、
  // tests/fixtures/payload-migrations/mcp-fixture.config.ts と同じ並びにして差分を読みやすくする）。
  plugins: [createMediaStoragePlugin(), createMcpPlugin()],
  // Media has no imageSizes/resizeOptions/formatOptions, so Payload's optional Sharp
  // integration is intentionally disabled. Next.js image optimization remains a separate
  // concern and still owns the project's Sharp dependency.
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
