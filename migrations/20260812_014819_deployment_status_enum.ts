import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_deployments_site_status" AS ENUM('announced', 'pilot', 'production', 'ended', 'unknown');
  ALTER TABLE "deployments" ALTER COLUMN "status" SET DATA TYPE "public"."enum_deployments_site_status" USING "status"::text::"public"."enum_deployments_site_status";
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_status" SET DATA TYPE "public"."enum_deployments_site_status" USING "version_status"::text::"public"."enum_deployments_site_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "deployments" ALTER COLUMN "status" SET DATA TYPE "public"."enum_deployments_status" USING "status"::text::"public"."enum_deployments_status";
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_status" SET DATA TYPE "public"."enum__deployments_v_version_status" USING "version_status"::text::"public"."enum__deployments_v_version_status";
  DROP TYPE "public"."enum_deployments_site_status";`)
}
