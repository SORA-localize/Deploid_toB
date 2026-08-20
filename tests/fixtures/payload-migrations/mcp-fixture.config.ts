import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { mcpPlugin } from '@payloadcms/plugin-mcp';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { contentCollections, contentGlobals } from '../../../lib/payload/contentSchema';
import { createMediaStoragePlugin } from '../../../lib/payload/mediaStoragePlugin';
import { withPreviewNonceSchema } from '../../../lib/payload/previewNonceSchema';

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
 * **Task 8完了後もbare `mcpPlugin({})` のまま維持する（reviewer指摘で判明、一度
 * `createMcpPlugin()` へ差し替えて壊した経緯がある）**: `tests/content/migration.test.ts` の
 * Step 3/4/5は「まだcommitされていない未来のschema変更」を`migrate:create`が検出できること
 * （drift検出）と、それをapply / down / re-upできることを検証する回帰test。Task 8が実際に
 * `migrations/*_add_payload_mcp_api_keys.ts` を committed migrations へ追加した**後**は、
 * その内容はもう「未来の変更」ではなく「既にcommit済みのbaseline」になる。このfixtureを
 * 本番と同じ `createMcpPlugin()` へ差し替えると、fixtureのschemaとcommitted baselineが
 * 完全に一致してしまい、Step 5aの `migrate:create --skip-empty` は（正しく）差分ゼロ
 * （生成ファイル数0）を返す——ところがStep 5aは「ちょうど1ファイル生成される」ことを
 * 前提にしており、これが `expected +0 to be 1` で落ち、Step 3(apply)・Step 4(down)・
 * Step 4(re-up) までカスケードして壊れる（down が新規batchを持たないため直近の
 * batch全体——初期schema含む——を巻き戻してしまい、seed行を含む全tableが消える）。
 * 実際に`createMcpPlugin()`へ差し替えて確認済み（4/13 fail、`git worktree`でのcrean
 * install 2回で再現）。bare `mcpPlugin({})` を維持する限り、fixtureのschemaは
 * committed baselineに対して常に「まだ無い追加table」を持ち続けるため、drift検出の
 * 前提が壊れない。本番が実際に採用したoptions（`collections` / `overrideApiKeyCollection`）
 * の正しさは、production `payload.config.ts` に対する直接のdrift check
 * （`payload:migrate:create -- __drift_check --skip-empty`、`npm run check`のCI step）と
 * `tests/content/mcp-access.test.ts`が別途担保する——このfixtureの役割はあくまで
 * 「migrationツール自体（generate/apply/down/up/drift検出）が正しく動く」ことの検証に限定する。
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
    // 本番の`payload.config.ts`と揃える（Task 7）。省略すると`preview_nonces`tableの宣言の
    // 有無だけで本番と食い違い、無関係な差分がdrift検出へ混入する（`createMediaStoragePlugin()`
    // と同じ理由、上のdocblock参照）。
    afterSchemaInit: [withPreviewNonceSchema],
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
