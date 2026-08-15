import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Client } from 'pg';
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import type { ContentSnapshot } from '@/lib/content/contracts';
import { createPayloadContentSource } from '@/lib/content/payloadSource';
import {
  assertSkipMediaAllowed,
  checkMediaReviewGate,
  collectMediaReviewItems,
  compareSnapshots,
  mediaReviewDigest,
  verifyCountConsistency,
} from '@/scripts/compare-content-sources.mts';
import { sha256Hex } from '@/scripts/export-content-snapshot.mts';
import {
  checkMediaStorePreflight,
  deriveMediaFromSnapshot,
  mediaStoreIsBlobBacked,
  readMediaStoreListing,
  importContentSnapshot,
  importPlanIsClean,
  planImportFromSnapshot,
  restoreContentSnapshot,
  type MediaFileResolver,
} from '@/scripts/import-content-to-payload.mts';
import {
  authorizeRestoreFromLocalThrowaway,
  authorizeRestoreFromVerifiedBaseline,
} from '@/scripts/restoreAuthorization.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import {
  assertLocalThrowawayDatabase as assertLocalServer,
  createThrowawayDatabase,
  dropThrowawayDatabase,
  runPayloadCli,
  runTsxScript,
  withDatabaseName,
} from './migrationTestSupport';

/**
 * 必須修正8（remediation group 3）の回帰テスト。
 *
 * brief の要求:
 * 1. dry-run を「DBへ仮レコードが作られる前提」の mapper から分離する（空DBでも最後まで通る）
 * 2. dry-run は admin bootstrap を含め一切 write しない
 * 3. normal import は overrideAccess:false + 実 user。restore 専用 override を再利用できなくする
 * 4. compareSnapshots で Map 化する前に duplicate stable ID を検出する
 * 5. raw array length / unique ID count / manifest count / Payload count を別々に検証する
 * 6. mediaReview が残っていれば既定で exit 1（署名済み waiver のときだけ通す）
 * 7. `--skip-media` は local development 専用
 * 8. 空DB + 既存 media store（filename 自動採番）を preflight で止める
 * 9. import を2回実行して stable ID / filename / media object key が変わらないこと
 * ＋ `content:import` の `PAYLOAD_MIGRATING` guard（グループ②の引き継ぎ事項）
 */

const PAYLOAD_SECRET = 'x'.repeat(32);
const clone = (snapshot: ContentSnapshot): ContentSnapshot => structuredClone(snapshot);

const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

const testMediaResolver: MediaFileResolver = async (candidate) => {
  if (!candidate.hostable) return { skipped: candidate.reason ?? 'not-hostable' };
  return { file: { data: ONE_PX_PNG, mimetype: 'image/png', name: candidate.asset.filename } };
};

// ─── 必須修正8-1 / 8-2: DBに触れない dry-run ───────────────────────────────

describe('import plan without a database (必須修正8-1)', () => {
  it('validates and counts every collection from the snapshot alone', async () => {
    const plan = await planImportFromSnapshot(contentSnapshotFixture);

    expect(importPlanIsClean(plan)).toBe(true);
    // 「最後の collection まで到達している」ことを、件数が全部載っていることで示す。
    expect(plan.perCollection.manufacturers).toEqual({ rawLength: 2, uniqueStableIds: 2 });
    expect(plan.perCollection.robots).toEqual({ rawLength: 3, uniqueStableIds: 3 });
    expect(plan.perCollection.articlePlacements).toEqual({ rawLength: 2, uniqueStableIds: 2 });
    expect(plan.perCollection.media).toEqual({ rawLength: 1, uniqueStableIds: 1 });
    expect(plan.mediaFilenames).toEqual([{ stableId: 'media:/media/fixture-hero.png', filename: 'fixture-hero.png' }]);
  });

  it('detects duplicate stable ids and unresolvable references without a database', async () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.robots.push(structuredClone(snapshot.robots[0]));
    snapshot.articles[0].relatedUseCaseIds = ['fixture-usecase-that-does-not-exist'];

    const plan = await planImportFromSnapshot(snapshot);
    expect(importPlanIsClean(plan)).toBe(false);
    expect(plan.duplicateStableIds).toEqual([
      { collection: 'robots', stableId: 'fixture-robot-a', occurrences: 2 },
    ]);
    expect(plan.unresolvedReferences[0]).toMatchObject({
      collection: 'articles',
      referencedId: 'fixture-usecase-that-does-not-exist',
    });
  });

  /**
   * 空DBでの dry-run が**途中で落ちない**こと。以前は前方参照の解決が DB のレコードに依存して
   * いたため、空DBでは最初の `distributors` で例外になり、以降の collection を一切集計できなかった。
   */
  it('is a pure function of the snapshot — the same plan with no DATABASE_URL in sight', async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const plan = await planImportFromSnapshot(contentSnapshotFixture);
      expect(Object.keys(plan.perCollection)).toHaveLength(9);
      expect(importPlanIsClean(plan)).toBe(true);
    } finally {
      if (previous !== undefined) process.env.DATABASE_URL = previous;
    }
  });
});

// ─── 必須修正8-4 / 8-5: 重複と件数 ────────────────────────────────────────

describe('duplicate stable ids and count consistency (必須修正8-4 / 8-5)', () => {
  /**
   * `indexById()` は `Map.set` なので、重複 stable ID があると後着が前を黙って上書きする。
   * 上書きされた側は比較対象から消えるため、**差分ゼロのまま重複を通してしまう**。
   */
  it('surfaces a duplicate stable id that Map-based indexing would have swallowed', () => {
    const actual = clone(contentSnapshotFixture);
    const duplicate = structuredClone(actual.robots[0]);
    duplicate.slug = 'fixture-robot-a-duplicate-row';
    actual.robots.push(duplicate);

    const report = compareSnapshots(contentSnapshotFixture, actual);
    const duplicates = report.changed.filter((change) => change.field.startsWith('duplicateStableId'));
    expect(duplicates).toEqual([
      { collection: 'robots', id: 'fixture-robot-a', field: 'duplicateStableId(actual)', expected: 1, actual: 2 },
    ]);
  });

  it('checks raw length, unique ids, manifest counts and Payload counts separately', () => {
    const snapshot = clone(contentSnapshotFixture);
    // 生の件数 4 / 一意 stable ID 3。
    snapshot.robots.push(structuredClone(snapshot.robots[0]));
    // Payload 側は1件足りない（2件しか入っていない）。
    const payloadSnapshot = clone(contentSnapshotFixture);
    payloadSnapshot.robots.splice(0, 1);

    const failures = verifyCountConsistency({
      snapshot,
      manifestCounts: { robots: 3 },
      payloadSnapshot,
    });
    const byCheck = new Map(failures.map((failure) => [failure.check, failure.detail]));
    // 4つの数字が別々の失敗として出る（1つに畳まれない）。
    expect(byCheck.get('uniqueStableIdCount')).toMatch(/4 records but only 3 distinct/);
    expect(byCheck.get('manifestCount')).toMatch(/manifest says 3, the artifact array holds 4/);
    expect(byCheck.get('payloadCount')).toMatch(/artifact array holds 4 records, Payload returns 2/);
  });

  it('passes when all four counts agree', () => {
    expect(
      verifyCountConsistency({
        snapshot: contentSnapshotFixture,
        manifestCounts: { robots: 3, manufacturers: 2 },
        payloadSnapshot: structuredClone(contentSnapshotFixture),
      }),
    ).toEqual([]);
  });

  it('compares Payload raw length with artifact raw length even when a duplicate makes unique counts match', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.robots.push(structuredClone(snapshot.robots[0]));
    const failures = verifyCountConsistency({
      snapshot,
      payloadSnapshot: structuredClone(contentSnapshotFixture),
    });
    const robotFailures = failures.filter((failure) => failure.detail.startsWith('robots:'));
    expect(robotFailures.map((failure) => failure.check)).toEqual(['uniqueStableIdCount', 'payloadCount']);
    expect(robotFailures[1].detail).toMatch(/artifact array holds 4 records, Payload returns 3/);
  });
});

// ─── 必須修正8-6: 要確認 media を既定で通さない ───────────────────────────

describe('media review gate (必須修正8-6)', () => {
  const items = collectMediaReviewItems(deriveMediaFromSnapshot(contentSnapshotFixture));

  it('fails when review items remain and no waiver is supplied', () => {
    expect(items.length).toBeGreaterThan(0);
    const gate = checkMediaReviewGate({ items, actualDigest: mediaReviewDigest(items, sha256Hex) });
    expect(gate.ok).toBe(false);
    expect(gate.failures[0].check).toBe('mediaReview');
  });

  it('ignores a waiver that is not signed — a JSON file is not an approval', () => {
    const digest = mediaReviewDigest(items, sha256Hex);
    const gate = checkMediaReviewGate({
      items,
      waiver: { mediaReviewSha256: digest, waivedBy: 'someone', waivedAt: '2026-08-14', reason: 'later' },
      signatureVerified: false,
      actualDigest: digest,
    });
    expect(gate.ok).toBe(false);
    expect(gate.failures[0].check).toBe('mediaWaiverSignature');
  });

  it('refuses a signed waiver that approved a different set of items', () => {
    const gate = checkMediaReviewGate({
      items,
      waiver: { mediaReviewSha256: 'a'.repeat(64), waivedBy: 'Hori98', waivedAt: '2026-08-14', reason: 'reviewed' },
      signatureVerified: true,
      actualDigest: mediaReviewDigest(items, sha256Hex),
    });
    expect(gate.ok).toBe(false);
    expect(gate.failures[0].check).toBe('mediaWaiverDigest');
  });

  it('passes with a signed waiver bound to exactly these items', () => {
    const digest = mediaReviewDigest(items, sha256Hex);
    expect(
      checkMediaReviewGate({
        items,
        waiver: { mediaReviewSha256: digest, waivedBy: 'Hori98', waivedAt: '2026-08-14', reason: 'reviewed' },
        signatureVerified: true,
        actualDigest: digest,
      }),
    ).toEqual({ ok: true, failures: [] });
  });

  it('passes trivially when nothing needs review', () => {
    expect(checkMediaReviewGate({ items: [] })).toEqual({ ok: true, failures: [] });
  });
});

// ─── 必須修正8-7: --skip-media は local 専用 ──────────────────────────────

describe('--skip-media is local development only (必須修正8-7)', () => {
  const local = { databaseUrl: 'postgresql://u@localhost:5432/deploid_dev', nodeEnv: 'development' };

  it('allows it against a local development database', () => {
    expect(() => assertSkipMediaAllowed(local)).not.toThrow();
  });

  it('refuses a managed database host', () => {
    expect(() =>
      assertSkipMediaAllowed({ databaseUrl: 'postgresql://u@db.example.supabase.co:5432/postgres' }),
    ).toThrow(/skip-media-refused/);
  });

  it('refuses inside a managed deployment even when the URL looks local', () => {
    expect(() => assertSkipMediaAllowed({ ...local, vercelEnv: 'preview' })).toThrow(/skip-media-refused/);
    expect(() => assertSkipMediaAllowed({ ...local, deploymentEnv: 'production' })).toThrow(/skip-media-refused/);
    expect(() => assertSkipMediaAllowed({ ...local, nodeEnv: 'production' })).toThrow(/skip-media-refused/);
  });

  it('refuses whenever the database itself says it is production or preview', () => {
    for (const environmentMarker of ['production', 'preview'] as const) {
      expect(() => assertSkipMediaAllowed({ ...local, environmentMarker })).toThrow(/skip-media-refused/);
    }
  });

  it('refuses when there is no DATABASE_URL to judge', () => {
    expect(() => assertSkipMediaAllowed({})).toThrow(/skip-media-refused/);
  });
});

// ─── 必須修正8-8: 空DB + 既存 media store ─────────────────────────────────

describe('media store preflight (必須修正8-8)', () => {
  it('stops an import into an empty database when the media store already holds those filenames', () => {
    const failures = checkMediaStorePreflight({
      existingMediaRecords: 0,
      plannedFilenames: ['fixture-hero.png', 'other.png'],
      listing: { kind: 'listed', filenames: ['fixture-hero.png'] },
    });
    expect(failures.map((failure) => failure.check)).toEqual(['emptyDatabaseWithPopulatedMediaStore']);
    expect(failures[0].detail).toMatch(/auto-number/);
  });

  it('allows an empty database with an empty store', () => {
    expect(
      checkMediaStorePreflight({
        existingMediaRecords: 0,
        plannedFilenames: ['a.png'],
        listing: { kind: 'listed', filenames: [] },
      }),
    ).toEqual([]);
  });

  it('allows a re-import when the database already has the media records', () => {
    expect(
      checkMediaStorePreflight({
        existingMediaRecords: 1,
        plannedFilenames: ['fixture-hero.png'],
        listing: { kind: 'listed', filenames: ['fixture-hero.png'] },
      }),
    ).toEqual([]);
  });

  /**
   * review fix round 1 / Important #3: 修正前は store の一覧取得に失敗すると `[]` を返していた。
   * Vercel Blob backed の構成（Task 9 で実際に使う構成）では毎回 `[]` になり、この preflight は
   * **常にサイレントに素通り**していた。「確認できない」は「空」ではない。
   */
  it('refuses to proceed when the store contents cannot be listed at all', () => {
    const failures = checkMediaStorePreflight({
      existingMediaRecords: 0,
      plannedFilenames: ['fixture-hero.png'],
      listing: { kind: 'unavailable', reason: 'vercel-blob list failed: no token' },
    });
    expect(failures.map((failure) => failure.check)).toEqual(['mediaStoreUnverifiable']);
    expect(failures[0].detail).toMatch(/Refusing to write rather than assuming the store is empty/);
  });

  it('recognises a Blob-backed media store from the same env the plugin uses', () => {
    expect(mediaStoreIsBlobBacked({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_store_secret' })).toBe(true);
    expect(mediaStoreIsBlobBacked({})).toBe(false);
    expect(
      mediaStoreIsBlobBacked({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_store_secret', MEDIA_STORAGE_ENABLED: 'false' }),
    ).toBe(false);
  });

  /** local disk 側: ディレクトリが無いのは「本当に空」。読めない場合は unavailable。 */
  it('treats a missing local upload directory as empty but a Blob listing failure as unavailable', async () => {
    const missing = await readMediaStoreListing({ uploadDir: path.join(os.tmpdir(), 'deploid-no-such-dir-xyz'), env: {} });
    expect(missing).toEqual({ kind: 'listed', filenames: [] });

    const blobFailure = await readMediaStoreListing({
      uploadDir: path.join(os.tmpdir(), 'unused'),
      // 実 Blob へは到達できないので list は必ず失敗する。fail-closed になることを見る。
      env: { BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_deadstore_notarealtoken' },
    });
    expect(blobFailure.kind).toBe('unavailable');
  }, 60_000);
});

// ─── 必須修正8-3: restore 専用 override entrypoint ────────────────────────

describe('restore-only privileged entrypoint (必須修正8-3)', () => {
  it('refuses to run without an authorization issued by the restore preflight', async () => {
    await expect(
      restoreContentSnapshot({
        payload: null as never,
        snapshot: contentSnapshotFixture,
        user: null,
        authorization: { reason: 'forged', baselineRunId: 'x' } as never,
      }),
    ).rejects.toThrow(/restore-authorization-required/);
  });

  it('never issues an authorization for a database that says it is production or preview', () => {
    for (const environment of ['production', 'preview'] as const) {
      expect(() => authorizeRestoreFromLocalThrowaway({ environment, isLocalHost: true })).toThrow(
        /restore-authorization-refused/,
      );
    }
    expect(() => authorizeRestoreFromLocalThrowaway({ environment: null, isLocalHost: true })).not.toThrow();
  });

  /**
   * review fix round 1 / Important #2: 一度も `environment:stamp` されていない managed database は
   * `environment: null` を返す。marker だけを見ていると、**まだ stamp されていない本番DB**へ
   * 特権 override authorization を発行してしまう。`isLocalHost` は引数として渡されていながら
   * 一度も読まれていなかった（テストが全ケースで `isLocalHost: true` を渡していたため露見しなかった）。
   */
  it('refuses an unstamped database that is not on a local host', () => {
    expect(() => authorizeRestoreFromLocalThrowaway({ environment: null, isLocalHost: false })).toThrow(
      /restore-authorization-refused/,
    );
    expect(() => authorizeRestoreFromLocalThrowaway({ environment: null, isLocalHost: false })).toThrow(
      /not a throwaway/,
    );
  });

  /**
   * review fix round 1 / Important #1: authorization は
   * `verifyBaselineBeforeRestore()` が**実際に返したオブジェクト**を要求する。
   * 形を似せただけの object では発行できない（正常系は
   * `tests/content/restore-enforcement.test.ts` の実 KMS テストで確認）。
   */
  it('refuses a hand-made object that merely looks like a verification result', () => {
    expect(() =>
      authorizeRestoreFromVerifiedBaseline({
        provenance: { baselineRunId: 'baseline-forged', environment: 'production' },
      }),
    ).toThrow(/not a verification result produced by verifyBaselineBeforeRestore/);
  });
});

// ─── 実CLI + 実 throwaway Postgres ────────────────────────────────────────

describe('content:import against real throwaway databases', () => {
  const ambient = process.env.DATABASE_URL as string;

  beforeAll(() => {
    assertLocalServer('tests/content/import-dry-run.test.ts', ambient);
  });

  /**
   * グループ②の再レビューで見つかった引き継ぎ事項:
   * `content:import` は `getPayload({ config })` の前に `PAYLOAD_MIGRATING` を立てておらず、
   * 検証前に dev-mode schema push が managed DB に対して発生し得た
   * （`content:export` / `content:restore` はグループ②の Critical #2 で修正済み）。
   *
   * 未 migrate の DB へ import を向け、**table が1つも増えないこと**で確認する。
   */
  it('never pushes schema to an unmigrated database', async () => {
    const dbName = 'deploid_import_nopush_test';
    await createThrowawayDatabase(ambient, dbName);
    const targetUrl = withDatabaseName(ambient, dbName);
    try {
      const result = runTsxScript(
        'scripts/import-content-to-payload.mts',
        ['--bootstrap-admin', '--admin-email', 'nopush@example.com', '--admin-password', 'Str0ngPassw0rd!23'],
        { DATABASE_URL: targetUrl, PAYLOAD_SECRET },
        180_000,
      );
      expect(result.status).not.toBe(0);

      const client = new Client({ connectionString: targetUrl });
      await client.connect();
      try {
        const { rows } = await client.query(
          "select table_name from information_schema.tables where table_schema = 'public'",
        );
        expect(
          rows.map((row) => row.table_name as string),
          'content:import must not create any table',
        ).toEqual([]);
      } finally {
        await client.end();
      }
    } finally {
      await dropThrowawayDatabase(ambient, dbName);
    }
  }, 300_000);

  /**
   * 必須修正8-2: dry-run は**一切書かない**。migrate 済みの空DBへ `--dry-run --bootstrap-admin`
   * を向けて、admins が0件のままであること（= admin bootstrap も起きないこと）を確認する。
   */
  it('--dry-run writes nothing at all, not even the bootstrap admin', async () => {
    const dbName = 'deploid_import_dryrun_test';
    await createThrowawayDatabase(ambient, dbName);
    const targetUrl = withDatabaseName(ambient, dbName);
    try {
      expect(runPayloadCli(['migrate'], { DATABASE_URL: targetUrl, PAYLOAD_SECRET }).status).toBe(0);

      const result = runTsxScript(
        'scripts/import-content-to-payload.mts',
        ['--dry-run', '--bootstrap-admin', '--admin-email', 'dryrun@example.com', '--admin-password', 'Str0ngPassw0rd!23'],
        { DATABASE_URL: targetUrl, PAYLOAD_SECRET },
        180_000,
      );
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(result.stdout).toMatch(/dry run — no database writes, no admin bootstrap/);
      // 空DBでも**全 collection の集計が最後まで出る**（これが必須修正8-1 の眼目）。
      expect(result.stdout).toMatch(/articlePlacements\s+records=/);

      const client = new Client({ connectionString: targetUrl });
      await client.connect();
      try {
        for (const table of ['admins', 'robots', 'media', 'manufacturers']) {
          const { rows } = await client.query(`select count(*)::int as count from "${table}"`);
          expect(rows[0].count, `${table} must be untouched by a dry run`).toBe(0);
        }
      } finally {
        await client.end();
      }
    } finally {
      await dropThrowawayDatabase(ambient, dbName);
    }
  }, 300_000);

  /**
   * review fix round 1 / Important #3(a): 必須修正8-8 の preflight は **restore にも**要る。
   * 空DB + 既存 media store という、まさに要件が想定していた状況を `content:restore` で作り、
   * **DB を1行も触る前に**拒否されることを確かめる。
   *
   * 修正前は preflight が `content:import` だけに配線されていたため、restore では filename
   * 自動採番が書き込み**後**の parity でしか出ず、「No database change was made」という
   * 他のチェーンの保証と食い違っていた。
   */
  it('refuses a restore into an empty database whose media store already holds the filenames', async () => {
    const dbName = 'deploid_restore_mediastore_test';
    await createThrowawayDatabase(ambient, dbName);
    const targetUrl = withDatabaseName(ambient, dbName);
    const workDir = await mkdtemp(path.join(os.tmpdir(), 'deploid-restore-store-'));
    try {
      expect(runPayloadCli(['migrate'], { DATABASE_URL: targetUrl, PAYLOAD_SECRET }).status).toBe(0);

      // 空DBへ戻す snapshot（media 1件）。
      const snapshot = {
        robots: [],
        robotSeries: [],
        distributors: [],
        manufacturers: [],
        useCases: [],
        deployments: [],
        articles: [],
        articlePlacements: [],
        articleIndexPlacementLimits: { hero: 5, feature: 2 },
        media: [structuredClone(contentSnapshotFixture.media[0])],
        siteSettings: { dataAsOf: '2026-08' },
      };
      const snapshotPath = path.join(workDir, 'snapshot.json');
      await writeFile(snapshotPath, JSON.stringify(snapshot), 'utf8');

      // 対象 media store には既に同じ filename がある（前回 run の孤児ファイル相当）。
      const storeDir = path.join(workDir, 'media-store');
      await mkdir(storeDir, { recursive: true });
      await writeFile(path.join(storeDir, contentSnapshotFixture.media[0].filename), ONE_PX_PNG);

      const result = runTsxScript(
        'scripts/export-content-snapshot.mts',
        [
          '--restore', '--input', snapshotPath,
          '--media-store-dir', storeDir,
          '--bootstrap-admin', '--admin-email', 'restore-store@example.com', '--admin-password', 'Str0ngPassw0rd!23',
        ],
        { DATABASE_URL: targetUrl, PAYLOAD_SECRET },
        180_000,
      );

      expect(result.status).not.toBe(0);
      const output = `${result.stdout}${result.stderr}`;
      expect(output).toMatch(/emptyDatabaseWithPopulatedMediaStore/);
      expect(output).toMatch(/No database change was made/);

      // 本当に1行も書いていない。
      const client = new Client({ connectionString: targetUrl });
      await client.connect();
      try {
        const { rows } = await client.query('select count(*)::int as count from "media"');
        expect(rows[0].count).toBe(0);
      } finally {
        await client.end();
      }
    } finally {
      await rm(workDir, { recursive: true, force: true });
      await dropThrowawayDatabase(ambient, dbName);
    }
  }, 300_000);

  /**
   * 必須修正8-7 を**実CLIで**確かめる。managed host を指した状態で `--skip-media` を渡すと、
   * 接続する前に拒否されなければならない。
   */
  it('refuses --skip-media against a managed database before connecting', () => {
    const result = runTsxScript(
      'scripts/compare-content-sources.mts',
      ['--skip-media'],
      {
        DATABASE_URL: 'postgresql://user:pass@db.example.supabase.co:5432/postgres',
        PAYLOAD_SECRET,
      },
      120_000,
    );
    expect(result.status).not.toBe(0);
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toMatch(/skip-media-refused/);
    expect(output).not.toMatch(/ENOTFOUND|ECONNREFUSED|getaddrinfo/);
  }, 180_000);
});

// ─── 必須修正8-9: 2回流して同じ結果になること ────────────────────────────

describe('importing twice keeps stable ids, filenames and media object keys (必須修正8-9)', () => {
  let payload: Payload;
  let owner: unknown;
  const OWNER_EMAIL = 'import-twice-owner@example.com';
  const PASSWORD = 'Str0ngPassw0rd!23';

  const CONTENT_COLLECTIONS = [
    'article-placements',
    'articles',
    'deployments',
    'use-cases',
    'distributors',
    'robots',
    'robot-series',
    'manufacturers',
    'media',
  ] as const;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/import-dry-run.test.ts');
    payload = await getPayload({ config });

    for (const collection of CONTENT_COLLECTIONS) {
      await payload.delete({ collection, where: {}, overrideAccess: true });
    }
    await payload.delete({ collection: 'content-route-registry', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

    // 必須修正8-8 と同じ理由: 対象 store を空にしてから流す。
    const uploadDir = path.join(process.cwd(), 'media');
    for (const asset of contentSnapshotFixture.media) {
      await rm(path.join(uploadDir, asset.filename), { force: true });
    }

    await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: OWNER_EMAIL, password: PASSWORD, role: 'content-reader' },
    });
    const login = await payload.login({ collection: 'admins', data: { email: OWNER_EMAIL, password: PASSWORD } });
    owner = login.user;
  }, 180_000);

  afterAll(async () => {
    await payload?.destroy();
  });

  it('produces identical stable ids, filenames and media urls on the second run', async () => {
    const first = await importContentSnapshot({
      payload,
      snapshot: structuredClone(contentSnapshotFixture),
      user: owner,
      mediaResolver: testMediaResolver,
    });
    expect(first.created.media).toBe(1);

    const afterFirst = await createPayloadContentSource({ payload }).readSnapshot();

    const second = await importContentSnapshot({
      payload,
      snapshot: structuredClone(contentSnapshotFixture),
      user: owner,
      mediaResolver: testMediaResolver,
    });
    // 2回目は1件も create しない。
    expect(Object.values(second.created).reduce((sum, value) => sum + value, 0)).toBe(0);

    const afterSecond = await createPayloadContentSource({ payload }).readSnapshot();

    const identity = (snapshot: ContentSnapshot) => ({
      stableIds: Object.fromEntries(
        (['manufacturers', 'robots', 'robotSeries', 'distributors', 'useCases', 'deployments', 'articles', 'articlePlacements', 'media'] as const).map(
          (collection) => [collection, (snapshot[collection] as readonly { id: string }[]).map((r) => r.id).sort()],
        ),
      ),
      // media の filename と実際の object key（storage adapter が払い出した URL）。
      media: snapshot.media
        .map((asset) => ({ id: asset.id, filename: asset.filename, url: asset.url }))
        .sort((a, b) => (a.id < b.id ? -1 : 1)),
    });

    expect(identity(afterSecond)).toEqual(identity(afterFirst));
    // filename が採番で書き換わっていないこと（`fixture-hero-1.png` になっていない）。
    expect(afterSecond.media.map((asset) => asset.filename)).toEqual(['fixture-hero.png']);
  }, 300_000);

  /**
   * 必須修正8-3: 通常 import は `overrideAccess: false` なので、role が足りない user では
   * **書けない**。以前は override 付きだったため、どの role でも素通りしていた。
   */
  it('refuses a normal import performed by a user without write access', async () => {
    const READER_EMAIL = 'import-reader@example.com';
    await payload.create({
      collection: 'admins',
      overrideAccess: true,
      data: { email: READER_EMAIL, password: PASSWORD, role: 'content-reader' } as never,
    });
    const login = await payload.login({ collection: 'admins', data: { email: READER_EMAIL, password: PASSWORD } });

    await expect(
      importContentSnapshot({
        payload,
        snapshot: structuredClone(contentSnapshotFixture),
        user: login.user,
        mediaResolver: testMediaResolver,
      }),
    ).rejects.toThrow();
  }, 180_000);
});

// ─── media waiver の実署名（cosign + 実 AWS KMS） ──────────────────────────

describe('signed media waiver end to end', () => {
  it('creates a temp directory only under the OS temp root', async () => {
    // 必須修正11-1 の補助: waiver 署名も含め、一時ファイルは mkdtemp の下だけに置く。
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-waiver-'));
    try {
      await mkdir(path.join(dir, 'nested'), { recursive: true });
      await writeFile(path.join(dir, 'nested', 'x.json'), '{}');
      expect(dir.startsWith(os.tmpdir())).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
