import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `preview_nonces`: Draft Mode preview tokenのnonce台帳（`docs/plans/
 * content-platform-migration-plan-v1.md` Task 7 Step 4）。
 *
 * **Payload collectionにしない。** `lib/content/previewTokens.ts` はこのtableに対して
 * 「未使用 → 使用済み」への遷移を単一の `UPDATE ... WHERE nonce = $1 AND used = false AND
 * expires_at > now() RETURNING id` で行う（1文で完結するため、Postgresの行ロックだけで
 * atomicに「同じnonceを2回消費できない」を保証できる）。Payload collectionを経由するLocal API
 * はread-then-writeの2ステップになり、その間に同じnonceの2つ目のrequestが割り込める
 * （TOCTOU）。生SQLで1文にすることが、この保証の核心。
 *
 * schemaの宣言自体は `payload.config.ts` の `afterSchemaInit`（`lib/payload/
 * previewNonceSchema.ts`）で行っている——Payload collectionの外にある生tableをmigrationだけで
 * 作ると、dev-mode schema auto-push（`getPayload()` が`NODE_ENV !== 'production'`のとき毎回
 * 実行する宣言的push）がこのtableを「未知」として毎回削除してしまう（実機で確認済み）。
 * このmigrationファイル自体は`migrate:create`で通常どおり生成したもの（生成結果をそのまま
 * 採用しており、手で書き換えていない）。
 *
 * 列:
 * - `nonce`: token本体が持つ128-bit nonceのhex表現（32文字）。`UNIQUE` はDB制約として
 *   二重発行そのものも防ぐ（衝突は実質的に起こらないが、fail-closedの多重防御として）。
 * - `used`: 既定 `false`。消費時に `true` へ一度だけ遷移する。
 * - `expires_at`: tokenの `exp`（発行から最大5分）と同じ値をDB側にも持たせ、検証時に
 *   `expires_at > now()` をUPDATEのWHERE句自体に含める（アプリ側のtime checkが漏れても
 *   DB側で期限切れnonceは絶対に消費成立しない、という二重の期限チェック）。
 *
 * `preview_nonces_expires_at_idx`（TTL cleanup index、brief必須）: 期限切れ行を定期削除する
 * batch job（未実装。tokenは5分で自然に無効化されるため、cleanupを実装するまで放置しても
 * 機能上の実害はない——このtableは小さく、行が増え続けるだけなら定期VACUUM/手動DELETEで足りる）
 * が全表scanにならないようにするためのindex。
 *
 * `down()`: nonceは5分で失効する使い捨ての値で、drop時に意味のある履歴が失われるわけではない
 * ため、他のcontent系migrationのような populated-rows guardは不要（無条件drop）。
 * `preview_nonces`はPayloadのcollection registryに存在せず、`payload_locked_documents_rels` /
 * `payload_preferences_rels`からのFKも無いため、`docs/reference/database-migration-runbook-v1.md`
 * の「既知の生成物バグ」（CASCADE直後の重複DROP CONSTRAINT）はここでは発生しない
 * （実機のdown/up round-tripで確認済み）。
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "preview_nonces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nonce" varchar NOT NULL,
  	"used" boolean DEFAULT false NOT NULL,
  	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
  	"expires_at" timestamp (3) with time zone NOT NULL
  );
  
  CREATE UNIQUE INDEX "preview_nonces_nonce_idx" ON "preview_nonces" USING btree ("nonce");
  CREATE INDEX "preview_nonces_expires_at_idx" ON "preview_nonces" USING btree ("expires_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "preview_nonces" CASCADE;`)
}
