import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `_environment_marker` へ「最後に適用した baseline の世代」を記録する3列を足す
 * （remediation group 2 review fix round 1 / Important #1）。
 *
 * 必須修正6-3は「baseline generation/run ID」を**無条件の**書き込み前チェックとして挙げ、
 * 6-10 の目的も「古い正規 artifact への rollback/replay を防ぐため」と明記している。
 * ところが `--expected-baseline-run-id` は操作者が渡したときだけ照合される任意フラグで、
 * `baselineGeneration` は署名・記録・表示されるだけで**何とも比較されていなかった**
 * （署名でカバーする側は完成しているのに、強制する側が運用任せに落ちていた）。
 *
 * 「このDBがこれまでに適用した最大世代」を残せば、それより古い世代の artifact は
 * **署名が本物でも**拒否できる。置き場所を `_environment_marker` にしたのは、この行が既に
 * 「このDBが何者か」を持つ唯一の singleton であり、content collection ではないため
 * parity（`compareSnapshots`）にも現れないから。
 *
 * 同一世代の再適用は許す（restore が途中失敗した後のやり直しは正当な操作であり、
 * 6-10 が防ぎたいのは巻き戻しであって retry ではない）。
 *
 * **`down()` は「対象列に値が1件も無い」ときだけ可逆**
 * （`docs/reference/database-migration-runbook-v1.md` §4「一方向migration」）。
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_environment_marker" ADD COLUMN "last_restored_baseline_generation" numeric;
  ALTER TABLE "_environment_marker" ADD COLUMN "last_restored_baseline_run_id" varchar;
  ALTER TABLE "_environment_marker" ADD COLUMN "last_restored_at" varchar;`)
}

/**
 * **この3列を落とすと replay 防御そのものが消える。** 巻き戻した直後は「これまでに適用した
 * 最大世代」が未知になるため、古い正規 baseline の再適用を拒否できなくなる（しかも `down()` は
 * 成功したように見え、次の restore が黙って通る）。
 *
 * よって「対象列に非NULL値が1つでもあれば止める」guard を置く。まだ一度も restore していない
 * DB（CI の drift check や新規環境の up/down round-trip 検証）でだけ巻き戻せる。
 *
 * 値が入った DB を本当に巻き戻す必要が出た場合は、まず現在値を控えて
 * （`SELECT last_restored_baseline_generation, last_restored_baseline_run_id FROM "_environment_marker"`）
 * 明示的に NULL にしてから `payload:migrate:down` を実行し、巻き戻し後に運用記録として保管すること。
 */
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  DECLARE populated bigint;
  BEGIN
    SELECT count(*) INTO populated FROM (
      SELECT 1 FROM "_environment_marker" WHERE "last_restored_baseline_generation" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_environment_marker" WHERE "last_restored_baseline_run_id" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_environment_marker" WHERE "last_restored_at" IS NOT NULL
    ) AS populated_cells;

    IF populated > 0 THEN
      RAISE EXCEPTION 'refusing to drop the restore ledger: % populated cell(s) would be destroyed, and with them the ability to reject a replayed older baseline. Record the current values and NULL them explicitly first (see this migration''s down() docblock).', populated;
    END IF;
  END $$;

   ALTER TABLE "_environment_marker" DROP COLUMN "last_restored_baseline_generation";
  ALTER TABLE "_environment_marker" DROP COLUMN "last_restored_baseline_run_id";
  ALTER TABLE "_environment_marker" DROP COLUMN "last_restored_at";`)
}
