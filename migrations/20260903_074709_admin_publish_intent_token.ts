import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "manufacturers" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_admin_publish_intent_token" varchar;
  ALTER TABLE "distributors" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_distributors_v" ADD COLUMN "version_admin_publish_intent_token" varchar;
  ALTER TABLE "robot_series" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_robot_series_v" ADD COLUMN "version_admin_publish_intent_token" varchar;
  ALTER TABLE "robots" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_robots_v" ADD COLUMN "version_admin_publish_intent_token" varchar;
  ALTER TABLE "use_cases" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_use_cases_v" ADD COLUMN "version_admin_publish_intent_token" varchar;
  ALTER TABLE "deployments" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_deployments_v" ADD COLUMN "version_admin_publish_intent_token" varchar;
  ALTER TABLE "articles" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_admin_publish_intent_token" varchar;
  ALTER TABLE "article_placements" ADD COLUMN "admin_publish_intent_token" varchar;
  ALTER TABLE "_article_placements_v" ADD COLUMN "version_admin_publish_intent_token" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "manufacturers" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_admin_publish_intent_token";
  ALTER TABLE "distributors" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_distributors_v" DROP COLUMN "version_admin_publish_intent_token";
  ALTER TABLE "robot_series" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_robot_series_v" DROP COLUMN "version_admin_publish_intent_token";
  ALTER TABLE "robots" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_robots_v" DROP COLUMN "version_admin_publish_intent_token";
  ALTER TABLE "use_cases" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_use_cases_v" DROP COLUMN "version_admin_publish_intent_token";
  ALTER TABLE "deployments" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_deployments_v" DROP COLUMN "version_admin_publish_intent_token";
  ALTER TABLE "articles" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_articles_v" DROP COLUMN "version_admin_publish_intent_token";
  ALTER TABLE "article_placements" DROP COLUMN "admin_publish_intent_token";
  ALTER TABLE "_article_placements_v" DROP COLUMN "version_admin_publish_intent_token";`)
}
