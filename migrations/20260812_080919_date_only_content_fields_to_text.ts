import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * 日付のみのコンテンツ日付（`sources[].publishedAt` / `sources[].checkedAt` /
 * `nextReviewBy` / `heroImage.rights.checkedAt` / `domesticDistributors[].checkedAt` /
 * `articles.publishedAt` / `media.rights.checkedAt`）を `timestamptz` から `varchar` へ移す。
 * 対象は本体7 collection + versions table + `media` の計61列。
 *
 * Task 5（importer / parity）を実データへ流して見つかった、Task 3 schema の2つの欠陥を直す。
 *
 * 1. **import が通らない**: 出典の公開日には月精度の値がある（`data/robots.ts` / `data/useCases.ts`
 *    に `'2025-05'` / `'2025-11'` の3件）。Postgres は
 *    `invalid input syntax for type timestamp with time zone: "2025-05"` で拒否する。
 *    importer 側で `'2025-05-01'` へ丸める案は採らない。出典の「公開日は2025年5月（日は不明）」
 *    という事実主張を書き換えることになり、Global Constraint（sources の意味を変えない）に反する。
 *    しかも `Date.parse('2025-05') === Date.parse('2025-05-01')` なので **parity 比較でも
 *    検出できない**（サイレントな損失そのもの）。
 *
 * 2. **timezone で暦日がずれる**: `timestamptz` 列へ日付のみの文字列を書くと、Postgres は
 *    **書き込んだ session の timezone** の 0 時として解釈する。JST の開発機で import すると
 *    `'2026-07-16'` が `2026-07-15T15:00:00Z` になり、UTC で動く Vercel で読むと前日になる。
 *    import 時と serve 時の timezone が違うと、公開画面の日付が1日ずれる。
 *
 * `collections/Deployments.ts` の `startedAt`（`'2024-01'` を持つため Task 3 時点で既に `text`）と
 * 同じ判断を、日付のみの editorial field 全部へ広げたもの。暦日は instant ではないので、
 * 文字列としてそのまま持つのが正しい表現。
 *
 * **`down()` は「対象列に値が1件も無い」ときだけ可逆**
 * （`docs/reference/database-migration-runbook-v1.md` §4「一方向migration」）。
 * 理由と復旧手順は `down()` 直前のコメントを参照。
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "manufacturers_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "manufacturers_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "manufacturers_domestic_distributors" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "manufacturers" ALTER COLUMN "next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "manufacturers" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_manufacturers_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_manufacturers_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_manufacturers_v_version_domestic_distributors" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_manufacturers_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "_manufacturers_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "distributors_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "distributors_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "distributors" ALTER COLUMN "next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "distributors" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_distributors_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_distributors_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_distributors_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "_distributors_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "robot_series_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "robot_series_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "robot_series" ALTER COLUMN "next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "robot_series" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_robot_series_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_robot_series_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_robot_series_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "_robot_series_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "robots_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "robots_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "robots" ALTER COLUMN "next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "robots" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_robots_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_robots_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_robots_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "_robots_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "use_cases_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "use_cases_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "use_cases" ALTER COLUMN "next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "use_cases" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_use_cases_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_use_cases_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_use_cases_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "_use_cases_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "deployments_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "deployments_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "deployments" ALTER COLUMN "next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "deployments" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_deployments_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_deployments_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "articles_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "articles_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "articles" ALTER COLUMN "next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "articles" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "articles" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_articles_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE varchar;
  ALTER TABLE "_articles_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE varchar;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE varchar;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_published_at" SET DATA TYPE varchar;
  ALTER TABLE "media" ALTER COLUMN "rights_checked_at" SET DATA TYPE varchar;`)
}

/**
 * **一方向migration（対象列にデータが入った後は巻き戻せない）。**
 *
 * `20260812_014819_deployment_status_enum` と違い、こちらは**失敗する行より成功する行のほうが
 * 危険**なので、guard の条件を「変換できない行があるか」ではなく「対象列に値があるか」にしている。
 *
 * - 月精度の値（`'2025-05'`）を持つ行は `varchar` → `timestamptz` の cast で
 *   `invalid input syntax for type timestamp with time zone` を出し、transaction ごと落ちる。
 *   これは（うるさいだけで）安全側の失敗。
 * - **危険なのは cast に成功する行のほう**。`'2026-07-16'` は問題なく変換されるが、その値は
 *   「巻き戻しを実行した session の timezone の 0 時」になる。JST で `migrate:down` を打てば
 *   `2026-07-15T15:00:00Z` として保存され、`up()` がまさに取り除いた timezone ずれが
 *   **エラーも警告も無しに再導入される**。しかも down() 自体は成功したように見える。
 *
 * よって「変換できる行だけ通す」guard は誤りで、**対象列に非NULL値が1つでもあれば止める**。
 *
 * 復旧手順（このmigrationより前へ戻す必要が本当にある場合）:
 * 1. まず戻す必要性を再確認する。`up()` は列の型を広げるだけで、既存の完全な ISO 日付も
 *    そのまま文字列として通る。通常このmigrationを巻き戻す理由は無い。
 * 2. content を退避する。Task 5 以降は content level の export が使える:
 *      npm run content:export -- --source payload --out backup.json
 *    （table 単位の `pg_dump --data-only` でもよい。手順は
 *    `docs/reference/database-migration-runbook-v1.md` §4「巻き戻し前のbackup / restore」。
 *    versions table を取り忘れないこと）。
 * 3. 対象 collection の行を空にする（`media` を含む。versions table も空になる）。
 * 4. `npm run payload:migrate:down` を実行する。
 * 5. 再度 up する場合は `npm run payload:migrate` のあと、2 で退避した snapshot を
 *    `npm run content:restore -- --input backup.json` で入れ直す。
 */
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  DECLARE populated bigint;
  BEGIN
    SELECT count(*) INTO populated FROM (
      SELECT 1 FROM "manufacturers_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "manufacturers_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "manufacturers_domestic_distributors" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "manufacturers" WHERE "next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "manufacturers" WHERE "hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_manufacturers_v_version_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_manufacturers_v_version_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_manufacturers_v_version_domestic_distributors" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_manufacturers_v" WHERE "version_next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_manufacturers_v" WHERE "version_hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "distributors_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "distributors_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "distributors" WHERE "next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "distributors" WHERE "hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_distributors_v_version_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_distributors_v_version_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_distributors_v" WHERE "version_next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_distributors_v" WHERE "version_hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robot_series_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robot_series_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robot_series" WHERE "next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robot_series" WHERE "hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robot_series_v_version_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robot_series_v_version_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robot_series_v" WHERE "version_next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robot_series_v" WHERE "version_hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robots_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robots_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robots" WHERE "next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "robots" WHERE "hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robots_v_version_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robots_v_version_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robots_v" WHERE "version_next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_robots_v" WHERE "version_hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "use_cases_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "use_cases_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "use_cases" WHERE "next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "use_cases" WHERE "hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_use_cases_v_version_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_use_cases_v_version_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_use_cases_v" WHERE "version_next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_use_cases_v" WHERE "version_hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "deployments_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "deployments_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "deployments" WHERE "next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "deployments" WHERE "hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_deployments_v_version_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_deployments_v_version_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_deployments_v" WHERE "version_next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_deployments_v" WHERE "version_hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "articles_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "articles_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "articles" WHERE "next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "articles" WHERE "hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "articles" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_articles_v_version_sources" WHERE "published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_articles_v_version_sources" WHERE "checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_articles_v" WHERE "version_next_review_by" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_articles_v" WHERE "version_hero_image_rights_checked_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "_articles_v" WHERE "version_published_at" IS NOT NULL
      UNION ALL
      SELECT 1 FROM "media" WHERE "rights_checked_at" IS NOT NULL
    ) t;
    IF populated > 0 THEN
      RAISE EXCEPTION 'migration 20260812_080919_date_only_content_fields_to_text: down() is one-way once date-only content values exist (% row(s) across the 61 converted columns). Casting them back to timestamptz would silently re-anchor each calendar date to midnight in the session timezone, reintroducing the off-by-one-day drift this migration removed.', populated
        USING HINT = 'Back up first: npm run content:export -- --source payload --out backup.json (or pg_dump --data-only, procedure: database-migration-runbook-v1.md section 4). Then empty the affected collections, re-run payload:migrate:down, and restore with npm run content:restore -- --input backup.json. See the comment above down() in this migration file.';
    END IF;
  END $$;`)

  // 生成された down() は `USING` 節を持たず、**空DBでも実行できない**
  // （`column "published_at" cannot be cast automatically to type timestamp with time zone`）。
  // `docs/reference/database-migration-runbook-v1.md` §4「既知の生成物バグ」と同種のため、
  // varchar → timestamptz の明示 cast を足してある。これで「対象列が空」という可逆条件を
  // 満たすときは実際に巻き戻せる（上の guard が、満たさないときを止める）。
  await db.execute(sql`
   ALTER TABLE "manufacturers_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "manufacturers_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "manufacturers_domestic_distributors" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "manufacturers" ALTER COLUMN "next_review_by" SET DATA TYPE timestamp(3) with time zone USING "next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "manufacturers" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_manufacturers_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_manufacturers_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_manufacturers_v_version_domestic_distributors" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_manufacturers_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE timestamp(3) with time zone USING "version_next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "_manufacturers_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "version_hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "distributors_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "distributors_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "distributors" ALTER COLUMN "next_review_by" SET DATA TYPE timestamp(3) with time zone USING "next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "distributors" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_distributors_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_distributors_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_distributors_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE timestamp(3) with time zone USING "version_next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "_distributors_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "version_hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "robot_series_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "robot_series_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "robot_series" ALTER COLUMN "next_review_by" SET DATA TYPE timestamp(3) with time zone USING "next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "robot_series" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_robot_series_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_robot_series_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_robot_series_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE timestamp(3) with time zone USING "version_next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "_robot_series_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "version_hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "robots_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "robots_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "robots" ALTER COLUMN "next_review_by" SET DATA TYPE timestamp(3) with time zone USING "next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "robots" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_robots_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_robots_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_robots_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE timestamp(3) with time zone USING "version_next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "_robots_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "version_hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "use_cases_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "use_cases_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "use_cases" ALTER COLUMN "next_review_by" SET DATA TYPE timestamp(3) with time zone USING "next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "use_cases" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_use_cases_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_use_cases_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_use_cases_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE timestamp(3) with time zone USING "version_next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "_use_cases_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "version_hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "deployments_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "deployments_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "deployments" ALTER COLUMN "next_review_by" SET DATA TYPE timestamp(3) with time zone USING "next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "deployments" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_deployments_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_deployments_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE timestamp(3) with time zone USING "version_next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "_deployments_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "version_hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "articles_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "articles_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "articles" ALTER COLUMN "next_review_by" SET DATA TYPE timestamp(3) with time zone USING "next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "articles" ALTER COLUMN "hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "articles" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_articles_v_version_sources" ALTER COLUMN "published_at" SET DATA TYPE timestamp(3) with time zone USING "published_at"::timestamp(3) with time zone;
  ALTER TABLE "_articles_v_version_sources" ALTER COLUMN "checked_at" SET DATA TYPE timestamp(3) with time zone USING "checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_next_review_by" SET DATA TYPE timestamp(3) with time zone USING "version_next_review_by"::timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_hero_image_rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "version_hero_image_rights_checked_at"::timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_published_at" SET DATA TYPE timestamp(3) with time zone USING "version_published_at"::timestamp(3) with time zone;
  ALTER TABLE "media" ALTER COLUMN "rights_checked_at" SET DATA TYPE timestamp(3) with time zone USING "rights_checked_at"::timestamp(3) with time zone;`)
}
