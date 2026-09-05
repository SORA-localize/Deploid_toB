import { randomUUID } from 'node:crypto';
import type { Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { ADMIN_PUBLISH_INTENT_PARAM } from '@/lib/payload/adminPublishIntent';
import type { ApprovableCollectionSlug } from '@/lib/payload/publishApprovedVersion';
import { publishFromAdmin } from '@/lib/payload/publishFromAdmin';
import { restoreContentSnapshot } from '@/scripts/import-content-to-payload.mts';
import { authorizeRestoreFromLocalThrowaway } from '@/scripts/restoreAuthorization.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

/**
 * Admin公開serviceを**公開できる7 collection すべて**に対して1回ずつ通す
 * （2026-09-04の自己監査で見つかったカバレッジの穴）。
 *
 * ## なぜ manufacturers 1件では足りないのか
 *
 * `publishFromAdmin` は `findVersions({ depth: 0 })` で読んだversionからhashを計算し、
 * `publishApprovedVersion` は**同じversionを `findVersionByID({ depth: 0 })` で読み直して
 * 再計算**する（`publishApprovedVersion.ts:139-150`）。この2つの読み方が返す形が
 * 1 byteでもズレると `publish-hash-mismatch` になり、しかも利用者には
 * **「別の人が保存しました」と誤表示される**。
 *
 * 形がズレうるかどうかはfieldの種類に依存する —— richText（`articles`）、
 * relationship、array、group を持つcollectionで初めて出る可能性がある。
 * `admin-publish-service.test.ts` は `manufacturers` しか通しておらず、
 * 残り6 collectionはこの往復を**一度も実行していなかった**。ここで全件通す。
 *
 * fixtureは `contentSnapshotFixture` を使う。公開要件（各collectionの
 * `validateXForPublish`）を満たすdataを手で7組書き起こすより、既に本番相当として
 * 検証されているものを再利用するほうが、fixtureの不備で偽の赤/緑を作る危険が少ない。
 */

const PASSWORD = 'Str0ngPassw0rd!23';

/** collection slug → fixture の stableId。fixtureの先頭documentを使う。 */
const TARGETS: ReadonlyArray<{ collection: ApprovableCollectionSlug; stableId: string }> = [
  { collection: 'manufacturers', stableId: 'fixture-mfr-alpha' },
  { collection: 'distributors', stableId: 'fixture-distributor-one' },
  { collection: 'robot-series', stableId: 'fixture-series-one' },
  { collection: 'robots', stableId: 'fixture-robot-a' },
  { collection: 'use-cases', stableId: 'fixture-usecase-one' },
  { collection: 'deployments', stableId: 'fixture-deployment-one' },
  { collection: 'articles', stableId: 'fixture-article-standard' },
];

let payload: Payload;
let publisher: Record<string, unknown> & { id: string | number };

async function findByStableId(collection: ApprovableCollectionSlug, stableId: string) {
  const { docs } = await payload.find({
    collection,
    where: { stableId: { equals: stableId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return docs[0] as unknown as { id: string | number; _status?: string; summary?: string } | undefined;
}

/** 公開意図つきのdraft保存（＝UIのフェーズ①相当）。hookが読むのは searchParams。 */
async function saveDraftWithIntent(
  collection: ApprovableCollectionSlug,
  docId: string | number,
  token: string,
  data: Record<string, unknown>,
) {
  await payload.update({
    collection,
    id: docId,
    data: { ...data, _status: 'draft' } as never,
    draft: true,
    overrideAccess: true,
    user: publisher as never,
    req: { searchParams: new URLSearchParams(`${ADMIN_PUBLISH_INTENT_PARAM}=${token}`) } as never,
  });
}

beforeAll(async () => {
  assertLocalThrowawayDatabase('tests/content/admin-publish-all-collections.test.ts');
  const { getPayload } = await import('payload');
  const { default: config } = await import('@/payload.config');
  payload = await getPayload({ config });

  await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
  await payload.create({
    collection: 'admins',
    data: { email: 'boot@example.invalid', password: PASSWORD, role: 'platform-admin' } as never,
    overrideAccess: true,
  });
  await payload.create({
    collection: 'admins',
    data: { email: 'publisher@example.invalid', password: PASSWORD, role: 'content-publisher' } as never,
    overrideAccess: true,
  });
  const p = await payload.login({
    collection: 'admins',
    data: { email: 'publisher@example.invalid', password: PASSWORD },
  });
  publisher = p.user as never;

  // 先に空にしてから復元する。前のsuiteが残したcontentの上に重ねると
  // `article-placement-order-conflict`（placementのorder一意制約）で beforeAll ごと落ち、
  // このsuite全体が静かにskipされる（実測）。FKの向きに合わせて子から消す。
  for (const slug of [
    'article-placements', 'articles', 'deployments', 'use-cases',
    'robots', 'robot-series', 'distributors', 'manufacturers',
  ] as const) {
    await payload.delete({ collection: slug, where: {}, overrideAccess: true });
  }

  await restoreContentSnapshot({
    payload,
    snapshot: contentSnapshotFixture,
    user: { id: String(publisher.id), role: 'platform-admin' },
    authorization: authorizeRestoreFromLocalThrowaway({ environment: null, isLocalHost: true }),
  });
}, 180_000);

afterAll(async () => {
  await payload?.destroy();
});

describe('公開できる全collectionで、admin公開が実際に通ること', () => {
  it.each(TARGETS)(
    '$collection: 編集した内容がそのまま公開され、hashが実DB上で一致する',
    async ({ collection, stableId }) => {
      const before = await findByStableId(collection, stableId);
      expect(before, `${collection}/${stableId} が fixture に無い`).toBeDefined();

      // 全content collectionが持つ共通field（`baseRecordContentFields`）を書き換える。
      // 「公開したつもりで古い内容が出ている」を検出できる、collection非依存の目印。
      const editedSummary = `edited-by-admin-publish ${randomUUID()}`;
      const token = randomUUID();
      await saveDraftWithIntent(collection, before!.id, token, { summary: editedSummary });

      // 保存しただけでは main row は変わらない（公開前の状態）。
      const stillOld = await findByStableId(collection, stableId);
      expect(stillOld?.summary).not.toBe(editedSummary);

      // hash不一致ならここが `publish-hash-mismatch` で落ちる。それがこのsuiteの主目的。
      const result = await publishFromAdmin({
        payload,
        collection,
        id: before!.id,
        publishIntentToken: token,
        publisherUser: publisher,
      });
      expect(String(result.documentId)).toBe(String(before!.id));

      const after = await findByStableId(collection, stableId);
      expect(after?._status).toBe('published');
      expect(after?.summary).toBe(editedSummary);
    },
    120_000,
  );

  it('7 collection すべてを対象にしている（ApprovableCollectionSlug と件数が一致）', () => {
    // 型に slug を足してここへ書き忘れると、また「一度も通っていないcollection」が生まれる。
    const slugs: ApprovableCollectionSlug[] = [
      'manufacturers',
      'distributors',
      'robot-series',
      'robots',
      'use-cases',
      'deployments',
      'articles',
    ];
    expect(new Set(TARGETS.map((t) => t.collection))).toEqual(new Set(slugs));
  });
});
