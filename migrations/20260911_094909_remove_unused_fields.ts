import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "deployments" DROP CONSTRAINT "deployments_robot_id_id_robots_id_fk";
  
  ALTER TABLE "_deployments_v" DROP CONSTRAINT "_deployments_v_version_robot_id_id_robots_id_fk";
  
  DROP INDEX "deployments_robot_id_idx";
  DROP INDEX "_deployments_v_version_version_robot_id_idx";
  ALTER TABLE "manufacturers" DROP COLUMN "distributor_note";
  ALTER TABLE "manufacturers" DROP COLUMN "support_note";
  ALTER TABLE "manufacturers" DROP COLUMN "procurement_note";
  ALTER TABLE "manufacturers" DROP COLUMN "vendor_risk_note";
  ALTER TABLE "manufacturers" DROP COLUMN "featured_rank";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_distributor_note";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_support_note";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_procurement_note";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_vendor_risk_note";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_featured_rank";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_src";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_alt";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_credit";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_source_url";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_rights_status";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_rights_source_type";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_rights_checked_at";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_rights_rights_holder";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_rights_license_url";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_rights_permission_note";
  ALTER TABLE "use_cases" DROP COLUMN "hero_image_aspect_ratio";
  ALTER TABLE "use_cases" DROP COLUMN "buyer_readiness";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_src";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_alt";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_credit";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_source_url";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_rights_status";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_rights_source_type";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_rights_checked_at";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_rights_rights_holder";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_rights_license_url";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_rights_permission_note";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_hero_image_aspect_ratio";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_buyer_readiness";
  ALTER TABLE "deployments" DROP COLUMN "robot_id_id";
  ALTER TABLE "deployments" DROP COLUMN "started_at";
  ALTER TABLE "_deployments_v" DROP COLUMN "version_robot_id_id";
  ALTER TABLE "_deployments_v" DROP COLUMN "version_started_at";
  ALTER TABLE "articles" DROP COLUMN "why_it_matters";
  ALTER TABLE "articles" DROP COLUMN "featured";
  ALTER TABLE "_articles_v" DROP COLUMN "version_why_it_matters";
  ALTER TABLE "_articles_v" DROP COLUMN "version_featured";
  DROP TYPE "public"."enum_use_cases_hero_image_rights_status";
  DROP TYPE "public"."enum_use_cases_hero_image_rights_source_type";
  DROP TYPE "public"."enum_use_cases_buyer_readiness";
  DROP TYPE "public"."enum__use_cases_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__use_cases_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__use_cases_v_version_buyer_readiness";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_use_cases_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_use_cases_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_use_cases_buyer_readiness" AS ENUM('initial-adoption', 'requires-poc', 'limited-today');
  CREATE TYPE "public"."enum__use_cases_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__use_cases_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__use_cases_v_version_buyer_readiness" AS ENUM('initial-adoption', 'requires-poc', 'limited-today');
  ALTER TABLE "manufacturers" ADD COLUMN "distributor_note" varchar;
  ALTER TABLE "manufacturers" ADD COLUMN "support_note" varchar;
  ALTER TABLE "manufacturers" ADD COLUMN "procurement_note" varchar;
  ALTER TABLE "manufacturers" ADD COLUMN "vendor_risk_note" varchar;
  ALTER TABLE "manufacturers" ADD COLUMN "featured_rank" numeric;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_distributor_note" varchar;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_support_note" varchar;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_procurement_note" varchar;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_vendor_risk_note" varchar;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_featured_rank" numeric;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_src" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_alt" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_credit" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_source_url" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_rights_status" "enum_use_cases_hero_image_rights_status";
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_rights_source_type" "enum_use_cases_hero_image_rights_source_type";
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_rights_checked_at" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_rights_rights_holder" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_rights_license_url" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_rights_permission_note" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "hero_image_aspect_ratio" numeric;
  ALTER TABLE "use_cases" ADD COLUMN "buyer_readiness" "enum_use_cases_buyer_readiness";
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_src" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_alt" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_credit" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_source_url" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_rights_status" "enum__use_cases_v_version_hero_image_rights_status";
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_rights_source_type" "enum__use_cases_v_version_hero_image_rights_source_type";
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_rights_checked_at" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_rights_rights_holder" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_rights_license_url" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_rights_permission_note" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_hero_image_aspect_ratio" numeric;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_buyer_readiness" "enum__use_cases_v_version_buyer_readiness";
  ALTER TABLE "deployments" ADD COLUMN "robot_id_id" integer;
  ALTER TABLE "deployments" ADD COLUMN "started_at" varchar;
  ALTER TABLE "_deployments_v" ADD COLUMN "version_robot_id_id" integer;
  ALTER TABLE "_deployments_v" ADD COLUMN "version_started_at" varchar;
  ALTER TABLE "articles" ADD COLUMN "why_it_matters" varchar;
  ALTER TABLE "articles" ADD COLUMN "featured" boolean;
  ALTER TABLE "_articles_v" ADD COLUMN "version_why_it_matters" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_featured" boolean;
  ALTER TABLE "deployments" ADD CONSTRAINT "deployments_robot_id_id_robots_id_fk" FOREIGN KEY ("robot_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deployments_v" ADD CONSTRAINT "_deployments_v_version_robot_id_id_robots_id_fk" FOREIGN KEY ("version_robot_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "deployments_robot_id_idx" ON "deployments" USING btree ("robot_id_id");
  CREATE INDEX "_deployments_v_version_version_robot_id_idx" ON "_deployments_v" USING btree ("version_robot_id_id");`)
}
