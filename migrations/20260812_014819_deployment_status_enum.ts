import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `deployments.status`（announced|pilot|production|ended|unknown）を、draft機構の `_status`
 * （draft|published）と衝突していた enum 型から分離する。postgres adapterのenum命名規則
 * （`enum_<table>_<field>`、`_status` は先頭の `_` が落ちる）で両者が
 * `enum_deployments_status` に衝突し、生成済みschemaにはdraft/published版だけが残っていたため、
 * `status` 列に実データの値を入れられなかった
 * （`invalid input value for enum enum_deployments_status: "pilot"`）。
 *
 * **`down()` は「実 deployment データが入る前」だけ可逆**（`docs/reference/database-migration-runbook-v1.md`
 * §5 の一方向migration扱い）。理由と復旧手順は `down()` 直前のコメントを参照。
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_deployments_site_status" AS ENUM('announced', 'pilot', 'production', 'ended', 'unknown');
  ALTER TABLE "deployments" ALTER COLUMN "status" SET DATA TYPE "public"."enum_deployments_site_status" USING "status"::text::"public"."enum_deployments_site_status";
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_status" SET DATA TYPE "public"."enum_deployments_site_status" USING "version_status"::text::"public"."enum_deployments_site_status";`)
}

/**
 * **一方向migration（実データ投入後は巻き戻せない）。**
 *
 * 巻き戻し先の `enum_deployments_status` / `enum__deployments_v_version_status` は
 * `('draft','published')` の2値しか持たない（それがまさにこのmigrationが直した欠陥）。
 * よって `announced` / `pilot` / `production` / `ended` / `unknown` を保持したまま
 * 旧型へ戻す方法は存在しない:
 * - 旧型に `ALTER TYPE ... ADD VALUE` で値を足すのは、(1) 旧型は `_status` と共有されており
 *   draft/published以外を許してしまう＝欠陥の再導入、(2) Payloadのmigrationは1 transactionで
 *   走るが、Postgresは同一transaction内で追加したenum値を使えない（`unsafe use of new value`）、
 *   の2点で不可。
 * - 該当行を NULL / 既定値へ潰す方法は、導入実績（`DeploymentSite.status`）の意味を静かに
 *   失わせるためGlobal Constraint（`PublishStatus`・rights・sources・evidence・関連IDの意味を
 *   変えない）に反する。
 *
 * そこで down() は、旧型で表現できない値が1行でも残っていれば**何も壊さずに落ちる**。
 * 素の cast エラー（`invalid input value for enum ...`）ではなく、原因と復旧手順を持つ
 * 例外にする。
 *
 * 復旧手順（このmigrationより前へ戻したい場合）:
 * 1. 戻す必要が本当にあるか確認する。up() は列の型を広げるだけで、既存の
 *    draft/published値も含めて安全に通る。通常このmigrationを巻き戻す理由は無い。
 * 2. どうしても巻き戻すなら、先に deployment データを退避する
 *    （`docs/reference/database-migration-runbook-v1.md` §6 のbackup手順、または
 *    Task 5以降の `export --source payload`）。
 * 3. 退避後に該当行を削除する（`DELETE FROM deployments;` と `DELETE FROM _deployments_v;`。
 *    どちらも空にする必要がある）。
 * 4. `npm run payload:migrate:down` を実行する。
 * 5. 戻したschemaで再度 up する場合は `npm run payload:migrate` を実行し、その後に
 *    2 で退避したデータをimportし直す。
 */
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  DECLARE offending bigint;
  BEGIN
    SELECT count(*) INTO offending FROM (
      SELECT 1 FROM "deployments"
        WHERE "status" IS NOT NULL AND "status"::text NOT IN ('draft', 'published')
      UNION ALL
      SELECT 1 FROM "_deployments_v"
        WHERE "version_status" IS NOT NULL AND "version_status"::text NOT IN ('draft', 'published')
    ) t;
    IF offending > 0 THEN
      RAISE EXCEPTION 'migration 20260812_014819_deployment_status_enum: down() is one-way once real deployment status values exist (% row(s) hold announced/pilot/production/ended/unknown, which the old draft/published-only enum cannot represent)', offending
        USING HINT = 'Export deployments first (database-migration-runbook-v1.md section 6), then DELETE FROM deployments and _deployments_v, then re-run payload:migrate:down. See the comment above down() in this migration file.';
    END IF;
  END $$;
   ALTER TABLE "deployments" ALTER COLUMN "status" SET DATA TYPE "public"."enum_deployments_status" USING "status"::text::"public"."enum_deployments_status";
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_status" SET DATA TYPE "public"."enum__deployments_v_version_status" USING "version_status"::text::"public"."enum__deployments_v_version_status";
  DROP TYPE "public"."enum_deployments_site_status";`)
}
