import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__audit_upload_sessions_environment" AS ENUM('preview', 'production');
  CREATE TYPE "public"."enum__audit_upload_sessions_status" AS ENUM('pending', 'completed');
  CREATE TABLE "_audit_upload_sessions_allowed_objects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"object_key" varchar NOT NULL,
  	"sha256" varchar,
  	"size" numeric,
  	"uploaded" boolean DEFAULT false NOT NULL,
  	"stable_id" varchar,
  	"filename" varchar,
  	"mime_type" varchar
  );
  
  CREATE TABLE "_audit_upload_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" varchar NOT NULL,
  	"request_id" varchar NOT NULL,
  	"manifest_sha256" varchar NOT NULL,
  	"baseline_object_key" varchar NOT NULL,
  	"baseline_run_id" varchar NOT NULL,
  	"environment" "enum__audit_upload_sessions_environment" NOT NULL,
  	"status" "enum__audit_upload_sessions_status" DEFAULT 'pending' NOT NULL,
  	"expires_at" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "_audit_upload_sessions_id" integer;
  ALTER TABLE "_audit_upload_sessions_allowed_objects" ADD CONSTRAINT "_audit_upload_sessions_allowed_objects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_audit_upload_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_audit_upload_sessions_allowed_objects_order_idx" ON "_audit_upload_sessions_allowed_objects" USING btree ("_order");
  CREATE INDEX "_audit_upload_sessions_allowed_objects_parent_id_idx" ON "_audit_upload_sessions_allowed_objects" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_audit_upload_sessions_session_id_idx" ON "_audit_upload_sessions" USING btree ("session_id");
  CREATE INDEX "_audit_upload_sessions_updated_at_idx" ON "_audit_upload_sessions" USING btree ("updated_at");
  CREATE INDEX "_audit_upload_sessions_created_at_idx" ON "_audit_upload_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_upload_sessions_fk" FOREIGN KEY ("_audit_upload_sessions_id") REFERENCES "public"."_audit_upload_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels__audit_upload_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("_audit_upload_sessions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_audit_upload_sessions_allowed_objects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_audit_upload_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_audit_upload_sessions_allowed_objects" CASCADE;
  DROP TABLE "_audit_upload_sessions" CASCADE;

  DROP INDEX "payload_locked_documents_rels__audit_upload_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "_audit_upload_sessions_id";
  DROP TYPE "public"."enum__audit_upload_sessions_environment";
  DROP TYPE "public"."enum__audit_upload_sessions_status";`)
}
