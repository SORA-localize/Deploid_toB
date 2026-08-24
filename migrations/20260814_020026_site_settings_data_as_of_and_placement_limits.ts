import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `site-settings` global へ `dataAsOf` と `articleIndexPlacementLimits.hero` / `.feature` を足す
 * （remediation group 2 / 必須修正4-2）。
 *
 * 外部監査で見つかった欠陥の schema 側の修正。これらの field が無い間、
 * `lib/content/payloadSource.ts` は `settings.dataAsOf ?? siteMeta.dataAsOf` /
 * `?? DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS` でローカル定数へ fallback しており、
 * **CONTENT_SOURCE=payload でも「Payload に値が無い」ことを parity が検出できなかった**
 * （fallback が常に正解を返すため、import → export → parity が構造的に必ず通る tautology）。
 * 値の正本を Payload へ移すには、まず列がなければ始まらない。
 *
 * `data_as_of` が `varchar` なのは、値が `'2026年7月'` のような**月精度の和文表記**で ISO 日付では
 * ないため（`lib/site.ts` の `siteMeta.dataAsOf`）。`timestamptz` にすると保存できず、ISO 日付へ
 * 正規化すると「7月時点」という主張を特定の日付へ書き換えてしまう。
 * `20260812_080919_date_only_content_fields_to_text` と同じ判断。
 *
 * **`down()` は「対象列に値が1件も無い」ときだけ可逆**
 * （`docs/reference/database-migration-runbook-v1.md` §4「一方向migration」）。理由は `down()` 直前を参照。
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "data_as_of" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "article_index_placement_limits_hero" numeric;
  ALTER TABLE "site_settings" ADD COLUMN "article_index_placement_limits_feature" numeric;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_data_as_of" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_article_index_placement_limits_hero" numeric;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_article_index_placement_limits_feature" numeric;`)
}

/**
 * **`DROP COLUMN` は値をそのまま捨てる。** `up()` が列を足すだけの migration なので巻き戻し自体は
 * 単純だが、巻き戻した瞬間に `dataAsOf` と掲載上限の**唯一の正本が消える**（必須修正4-4 で
 * ローカル定数への fallback を撤去したため、消えたあとに読み戻す先はもう存在しない）。
 * しかも `down()` は成功したように見え、次に site を serve した時点で
 * `site-settings-not-migrated` で初めて気づくことになる。
 *
 * よって「対象列に非NULL値が1つでもあれば止める」guard を置く。空（= まだ import していない
 * DB。CI の drift check や新規環境の up/down round-trip 検証がこれに当たる）でだけ巻き戻せる。
 *
 * 値が入った DB を本当に巻き戻す必要が出た場合の手順:
 * 1. `npm run content:export -- --source payload --out <path>` で現在値を退避する。
 * 2. `site_settings` / `_site_settings_v` の該当列を明示的に NULL にする。
 * 3. `npm run payload:migrate:down` を実行する。
 * 4. 復旧時は 1. の snapshot を `content:restore` で書き戻す。
 */
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  DECLARE populated bigint;
  BEGIN
    SELECT count(*) INTO populated FROM (
      SELECT 1 FROM "site_settings" WHERE "data_as_of" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "site_settings" WHERE "article_index_placement_limits_hero" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "site_settings" WHERE "article_index_placement_limits_feature" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_site_settings_v" WHERE "version_data_as_of" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_site_settings_v" WHERE "version_article_index_placement_limits_hero" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_site_settings_v" WHERE "version_article_index_placement_limits_feature" IS NOT NULL
    ) AS populated_cells;

    IF populated > 0 THEN
      RAISE EXCEPTION 'refusing to drop site-settings columns: % populated cell(s) would be destroyed. Export them with content:export first, then NULL them explicitly (see this migration''s down() docblock).', populated;
    END IF;
  END $$;

   ALTER TABLE "site_settings" DROP COLUMN "data_as_of";
  ALTER TABLE "site_settings" DROP COLUMN "article_index_placement_limits_hero";
  ALTER TABLE "site_settings" DROP COLUMN "article_index_placement_limits_feature";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_data_as_of";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_article_index_placement_limits_hero";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_article_index_placement_limits_feature";`)
}
