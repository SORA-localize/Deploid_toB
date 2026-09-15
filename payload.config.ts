import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { en } from '@payloadcms/translations/languages/en';
import { ja } from '@payloadcms/translations/languages/ja';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import { Admins } from './collections/Admins';
import { adminPublishTranslations } from './lib/payload/adminPublishMessages';
import { createLivePreviewUrl, PREVIEW_ROOT_BY_COLLECTION } from './lib/payload/adminPreview';
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
    // 一括公開画面（`/admin/draft-list`）。ネイティブの一覧画面には一切手を入れず、
    // 完全に独立したroot viewとして追加する（詳細は`components/admin/DraftListView.tsx`）。
    components: {
      afterNavLinks: ['@/components/admin/DraftListNavLink#DraftListNavLink'],
      views: {
        draftList: {
          Component: '@/components/admin/DraftListView#DraftListView',
          path: '/draft-list',
          exact: true,
        },
      },
    },
    // フロントエンドの詳細ページを持つ4 collection（`adminPreview.ts`の
    // `PREVIEW_ROOT_BY_COLLECTION`）だけで、編集画面の横に実ページをiframeで表示する。
    // URL生成・draft-mode有効化ロジックは既存の`admin.preview`（別タブで開く方）と共有する
    // （`createLivePreviewUrl()`のコメント参照）。
    livePreview: {
      url: createLivePreviewUrl(),
      collections: Object.keys(PREVIEW_ROOT_BY_COLLECTION),
      breakpoints: [
        { name: 'mobile', label: 'モバイル', width: 390, height: 844 },
        { name: 'desktop', label: 'デスクトップ', width: 1440, height: 900 },
      ],
    },
  },
  collections: contentCollections,
  // Admin公開ボタンの文言。`lib/uiText.ts`（公開サイト用）には入れない —— adminはPayload独自の
  // i18nで、公開サイト用の表に混ぜるとSoCが崩れる。キーの網羅は型で保証している
  // （`lib/payload/adminPublishMessages.ts` 参照）。
  //
  // **`supportedLanguages` を明示しないと英語しか使えない。** Payloadの既定は `{ en }` だけで
  // （`payload/dist/config/sanitize.js`）、`i18n.translations` を足しても supported は増えない。
  // 2026-09-03の実装では `ja` の翻訳表を書いたのに `supportedLanguages` を省いていたため、
  // **その表は一度も表示されなかった**（2026-09-04の自己監査で実行時dumpして判明）。
  // 日本語B2Bサイトの運用画面なので既定を `ja` にし、`en` も選べるようにしておく。
  i18n: {
    fallbackLanguage: 'ja',
    supportedLanguages: { en, ja },
    translations: adminPublishTranslations,
  },
  globals: contentGlobals,
  editor: lexicalEditor(),
  secret: requireEnv('PAYLOAD_SECRET'),
  db: postgresAdapter({
    // dev-mode schema auto-push（`pushDevSchema`）を明示的に無効化する。既定では
    // `NODE_ENV !== 'production' && PAYLOAD_MIGRATING !== 'true'` の間ずっと有効で、
    // ローカルdevをPreview/Production DBへ向けたときに実DDLを実行してしまう
    // （実際にPreview DBの`payload_migrations`に`{name:"dev",batch:-1}`という
    // 野良pushの痕跡が複数回残っていたことを確認済み）。schema変更は必ず
    // `payload:migrate:create` → 生成物をレビュー → `payload:migrate` を経由させる
    // （`docs/reference/database-migration-runbook-v1.md`）。これらのCLIコマンドは
    // 別経路（`payload.db.migrate()`等）を直接呼ぶため`push: false`の影響を受けない。
    push: false,
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
    // turbopackIgnore: このpath.resolveの動的引数はNext 16.3のtracerに「プロジェクト全体を
    // トレース対象にする」と判定され、audit-uploadルートのビルド出力を肥大化させていた
    // （実測 297.8 MiB、既存のサイズゲートに抵触）。PAYLOAD_TEST_MIGRATION_DIRは上記の通り
    // テスト専用でデプロイ環境では常にundefinedのため、tracerへの申告を静的に外しても
    // 実行時の分岐そのものは変えない。
    migrationDir: process.env.PAYLOAD_TEST_MIGRATION_DIR
      ? path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PAYLOAD_TEST_MIGRATION_DIR)
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
