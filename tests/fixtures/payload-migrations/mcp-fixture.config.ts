import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { mcpPlugin } from '@payloadcms/plugin-mcp';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { contentCollections, contentGlobals } from '../../../lib/payload/contentSchema';
import { createMediaStoragePlugin } from '../../../lib/payload/mediaStoragePlugin';

/**
 * Task 3.5 Step 3（隔離DBへの「既存schemaを持つDBへ適用できる」検証）と、Task 8 が実際に採用する
 * `@payloadcms/plugin-mcp` の API key collection の migration fixture。
 *
 * これは production の `payload.config.ts` へは一切wireされない、`tests/content/migration.test.ts`
 * 専用のthrowaway config。production configが実際に使う `contentCollections` /
 * `contentGlobals`（`lib/payload/contentSchema.ts`）と `createMediaStoragePlugin()`
 * （`lib/payload/mediaStoragePlugin.ts`）をそのまま再利用し、そこへ `mcpPlugin` を足しただけに
 * することで、ここから生成されるmigrationの差分が本当に「MCP API keys collectionの追加」だけに
 * なるようにしている（brief: 「任意フィールドをcollectionへ足して試験しない」「実採用schema差分
 * だけのmigrationが生成される」）。`createMediaStoragePlugin()` を省略すると
 * `alwaysInsertFields` が追加する `media.prefix` columnの有無だけで本番と食い違い、無関係な
 * `DROP COLUMN "prefix"` が混入する（実際に一度発生した）。
 *
 * `@payloadcms/plugin-mcp` は Task 3.5 時点では devDependency（このfixtureでの検証専用）。
 * Task 8 が実際にMCPサーバーを配線する際は、production dependencyへ昇格し
 * `payload.config.ts` へ組み込む（このfixtureとは別の作業）。
 */
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const migrationDir = process.env.PAYLOAD_TEST_MIGRATION_DIR;
if (!migrationDir) {
  throw new Error(
    'PAYLOAD_TEST_MIGRATION_DIR must be set before loading tests/fixtures/payload-migrations/mcp-fixture.config.ts ' +
      '— tests/content/migration.test.ts sets this to a throwaway directory it creates and destroys per run.',
  );
}

export default buildConfig({
  admin: {
    user: 'admins',
    importMap: {
      baseDir: path.resolve(dirname, '../../..'),
    },
  },
  collections: contentCollections,
  globals: contentGlobals,
  editor: lexicalEditor(),
  // Isolated to this fixture's own throwaway DB/process — never the app's real PAYLOAD_SECRET.
  secret: process.env.PAYLOAD_SECRET ?? 'fixture-secret-tests-fixtures-payload-migrations-only',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    migrationDir,
  }),
  plugins: [createMediaStoragePlugin(), mcpPlugin({})],
  sharp,
  // Payload's default `typescript.outputFile` is `${process.cwd()}/payload-types.ts` — since this
  // fixture's CLI invocations run with cwd = repo root (same as the real payload.config.ts's
  // invocations), an *unset* outputFile here silently overwrites the real, committed
  // `payload-types.ts` with this fixture's MCP-plugin-inclusive types on every test run
  // (confirmed: this happened and got committed once already — the exact same class of
  // fixture→production contamination this file's own module comment already warns about for the
  // DB schema, recurring one layer up in the generated-types artifact). Redirect it into this
  // run's own temp migrationDir so it never touches the real file and gets deleted by the same
  // `fs.rmSync(TMP_ROOT, ...)` cleanup in `tests/content/migration.test.ts`'s `afterAll`.
  typescript: {
    outputFile: path.join(path.dirname(migrationDir), 'fixture-payload-types.ts'),
  },
});
