import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload_mcp_api_keys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"label" varchar,
  	"description" varchar,
  	"manufacturers_find" boolean DEFAULT false,
  	"manufacturers_create" boolean DEFAULT false,
  	"manufacturers_update" boolean DEFAULT false,
  	"manufacturers_delete" boolean DEFAULT false,
  	"distributors_find" boolean DEFAULT false,
  	"distributors_create" boolean DEFAULT false,
  	"distributors_update" boolean DEFAULT false,
  	"distributors_delete" boolean DEFAULT false,
  	"robot_series_find" boolean DEFAULT false,
  	"robot_series_create" boolean DEFAULT false,
  	"robot_series_update" boolean DEFAULT false,
  	"robot_series_delete" boolean DEFAULT false,
  	"robots_find" boolean DEFAULT false,
  	"robots_create" boolean DEFAULT false,
  	"robots_update" boolean DEFAULT false,
  	"robots_delete" boolean DEFAULT false,
  	"use_cases_find" boolean DEFAULT false,
  	"use_cases_create" boolean DEFAULT false,
  	"use_cases_update" boolean DEFAULT false,
  	"use_cases_delete" boolean DEFAULT false,
  	"deployments_find" boolean DEFAULT false,
  	"deployments_create" boolean DEFAULT false,
  	"deployments_update" boolean DEFAULT false,
  	"deployments_delete" boolean DEFAULT false,
  	"articles_find" boolean DEFAULT false,
  	"articles_create" boolean DEFAULT false,
  	"articles_update" boolean DEFAULT false,
  	"articles_delete" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_admins_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // 既知の生成物バグ（docs/reference/database-migration-runbook-v1.md「既知の生成物バグ」節、
  // Payload/drizzle-kit @payload@3.87.1）への手当て。`DROP TABLE ... CASCADE` が
  // payload_locked_documents_rels / payload_preferences_rels の該当FK制約を副作用として
  // 既に削除するため、生成された直後の明示的な2本の `ALTER TABLE ... DROP CONSTRAINT` は
  // 「既に無い制約を消そうとして `does not exist` で失敗する」。CASCADEが安全に肩代わりして
  // いるので、その2行だけを取り除く（DROP INDEX / DROP COLUMNはconstraintの有無に依存しない
  // ためそのまま残す）。隔離DBでdown→up round-tripを実行して確認済み。
  await db.execute(sql`
   ALTER TABLE "payload_mcp_api_keys" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_mcp_api_keys" CASCADE;
  DROP INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
  DROP INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_mcp_api_keys_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "payload_mcp_api_keys_id";`)
}
