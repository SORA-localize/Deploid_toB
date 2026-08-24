/**
 * `preview_nonces` テーブルのdrizzle定義（`docs/plans/content-platform-migration-plan-v1.md`
 * Task 7 Step 4）。Draft Mode preview tokenのnonce台帳。`lib/content/previewTokens.ts` が
 * `UPDATE ... WHERE nonce = $1 AND used = false ... RETURNING id` という単一SQL文で
 * 「未使用→使用済み」への原子的遷移を行うために生SQLで読み書きする（read-then-writeの
 * 2ステップにすると同じnonceの2重消費を防げないため、Payload collection化しない）。
 *
 * **`payload.config.ts` の `afterSchemaInit` でこのtableを宣言する理由**: Payload collection
 * ではない生tableをmigrationだけで作ると、`getPayload()` のdev-mode schema auto-push
 * （drizzle-kitの宣言的push——現在のPayload設定が「知っている」schemaにDBを合わせ込む）が
 * このtableを「未知のtable」として見なし、**pushのたびに削除する**（実機で確認済み:
 * `tests/content/*.test.ts` がdev-modeで `getPayload()` を呼ぶたびに `preview_nonces` が
 * 消えていた）。`afterSchemaInit` で宣言に加えることで、push・migrate:create双方から
 * 「このtableは意図された構成の一部」として扱われる。
 */
import { boolean, index, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import type { PostgresSchemaHook } from '@payloadcms/drizzle/postgres';

export const previewNoncesTable = pgTable(
  'preview_nonces',
  {
    id: serial('id').primaryKey(),
    nonce: varchar('nonce').notNull(),
    used: boolean('used').notNull().default(false),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('preview_nonces_nonce_idx').on(table.nonce),
    index('preview_nonces_expires_at_idx').on(table.expiresAt),
  ],
);

export const withPreviewNonceSchema: PostgresSchemaHook = ({ schema }) => ({
  ...schema,
  tables: { ...schema.tables, preview_nonces: previewNoncesTable },
});
