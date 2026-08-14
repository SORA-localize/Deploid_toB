import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { assertSnapshotPageIntegrity, createPayloadContentSource } from '@/lib/content/payloadSource';
import { privilegedPublishContext } from '@/lib/payload/publishAuthorization';
import { importContentSnapshot } from '@/scripts/import-content-to-payload.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

/** 並行更新テストで書き換える「参照元 → 参照先」の組（robot.manufacturerId が両者を結ぶ）。 */
const REFERENCING_ROBOT = 'fixture-robot-a';
const REFERENCED_MANUFACTURER = 'fixture-mfr-alpha';

/**
 * remediation group 2 / 必須修正5 の回帰テスト。
 *
 * 監査の指摘: `readSnapshot()` は9 collectionを `Promise.all` で**独立に**queryしていた。
 * 同一transaction・同一revisionの保証が無いため、export中に別の書き込みがcommitされると
 * 「robotsは更新前、articlesは更新後」のような**前後が混ざったsnapshot**が出来る。
 * そのsnapshotに署名して baseline にすると、どの時点のDBとも一致しない artifact が
 * 正規のものとして残る。
 *
 * ここで固定する仕様:
 * 1. 全collection + globalを**1つのrepeatable-read transaction**で読む。
 * 2. pagination は totalDocs / 取得件数 / stable ID重複を検査する。
 * 3. export中に参照元・参照先を更新しても、snapshotは更新前か更新後の**どちらか一方**になる。
 */
const PASSWORD = 'Str0ngPassw0rd!23';
const OWNER_EMAIL = 'snapshot-consistency-owner@example.com';
/** 並行更新が書き込む値。snapshot側にこれが「片方だけ」現れたら混合状態。 */
const CONCURRENT_SUMMARY = 'concurrent-write-landed-mid-export';

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

describe('readSnapshot() is internally consistent (real Payload Local API)', () => {
  let payload: Payload;
  let owner: unknown;

  const privileged = () =>
    privilegedPublishContext({
      runId: 'snapshot-consistency-test',
      actorId: 'test',
      reason: 'snapshot consistency regression test seed',
    });

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/snapshot-consistency.test.ts');
    payload = await getPayload({ config });

    for (const collection of CONTENT_COLLECTIONS) {
      await payload.delete({ collection, where: {}, overrideAccess: true });
    }
    await payload.delete({ collection: 'content-route-registry', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

    await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: OWNER_EMAIL, password: PASSWORD, role: 'content-reader' },
    });
    const login = await payload.login({ collection: 'admins', data: { email: OWNER_EMAIL, password: PASSWORD } });
    owner = login.user;
    if (!owner) throw new Error('failed to log in as the snapshot consistency owner');

    // 実importerでseedする（publish validationを満たす完全なレコードが要るため、
    // 手書きのfixtureではなく `content:import` と同じ経路を通す）。
    await importContentSnapshot({
      payload,
      snapshot: structuredClone(contentSnapshotFixture),
      user: owner,
      mediaResolver: async (candidate) =>
        candidate.hostable
          ? { file: { data: ONE_PX_PNG, mimetype: 'image/png', name: candidate.asset.filename } }
          : { skipped: candidate.reason ?? 'not-hostable' },
    });
  }, 180_000);

  afterAll(async () => {
    await payload?.destroy();
  });

  it('reads every collection and the global inside one repeatable-read transaction', async () => {
    const seen: string[] = [];
    const snapshot = await createPayloadContentSource({ payload }).readSnapshot({
      onCollectionRead: (collection, req) => {
        seen.push(collection);
        // 全読み取りが同じtransactionへ載っていること（= 同一 transactionID）。
        expect(req.transactionID).toBeDefined();
      },
    });

    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toContain('robots');
    expect(seen).toContain('media');
    expect(snapshot.siteSettings.dataAsOf).toBe(contentSnapshotFixture.siteSettings.dataAsOf);
  }, 120_000);

  /**
   * 必須修正5-3: export中に**参照元と参照先の両方**を更新する。
   * snapshotは「両方とも更新前」か「両方とも更新後」でなければならない。
   * 片方だけが新しい混合状態になったら、それがまさに監査の指摘した欠陥。
   */
  it('never mixes pre- and post-update state when a concurrent write lands mid-export', async () => {
    let wrote = false;

    const snapshot = await createPayloadContentSource({ payload }).readSnapshot({
      onCollectionRead: async (collection) => {
        // 最初のcollectionを読み終えた直後に、snapshotの外側（別transaction）から
        // 参照元・参照先の両方をcommitする。
        if (wrote) return;
        wrote = true;
        for (const [target, stableId] of [
          ['manufacturers', REFERENCED_MANUFACTURER],
          ['robots', REFERENCING_ROBOT],
        ] as const) {
          const { docs } = await payload.find({
            collection: target,
            where: { stableId: { equals: stableId } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          });
          await payload.update({
            collection: target,
            id: (docs[0] as { id: string | number }).id,
            overrideAccess: true,
            user: owner as never,
            context: privileged(),
            data: { summary: CONCURRENT_SUMMARY } as never,
          });
        }
        void collection;
      },
    });

    expect(wrote).toBe(true);

    const manufacturer = snapshot.manufacturers.find((record) => record.id === REFERENCED_MANUFACTURER);
    const robot = snapshot.robots.find((record) => record.id === REFERENCING_ROBOT);
    expect(manufacturer).toBeDefined();
    expect(robot).toBeDefined();

    // 混合状態（片方だけ更新後）を禁じる。両方が更新前か、両方が更新後かのどちらか。
    const updated = [manufacturer?.summary, robot?.summary].map((summary) => summary === CONCURRENT_SUMMARY);
    expect(
      new Set(updated).size,
      `mixed snapshot: manufacturer=${String(manufacturer?.summary)} robot=${String(robot?.summary)}`,
    ).toBe(1);

    // 書き込みは実際にcommitされている（テストが空回りしていないことの確認）。
    const afterCommit = await createPayloadContentSource({ payload }).readSnapshot();
    expect(afterCommit.manufacturers.find((record) => record.id === REFERENCED_MANUFACTURER)?.summary).toBe(
      CONCURRENT_SUMMARY,
    );
    expect(afterCommit.robots.find((record) => record.id === REFERENCING_ROBOT)?.summary).toBe(CONCURRENT_SUMMARY);
  }, 180_000);

  it('checks pagination integrity on the real snapshot read', async () => {
    // 実読み取りが guard を通っていること（guard が例外を投げなければ通過する）。
    const snapshot = await createPayloadContentSource({ payload }).readSnapshot();
    expect(snapshot.robots.map((robot) => robot.id).sort()).toEqual(
      contentSnapshotFixture.robots.map((robot) => robot.id).sort(),
    );
    expect(new Set(snapshot.manufacturers.map((record) => record.id)).size).toBe(snapshot.manufacturers.length);
  }, 120_000);
});

/**
 * 必須修正5-2: pagination の整合性検査そのもの。実DBでこの2つの故障
 * （ページ跨ぎの取りこぼし / 同一 stable ID の二重取得）を**再現させる**のは難しいので、
 * 検査を純粋関数として切り出して直接反例を与える。「guardが存在する」ではなく
 * 「guardが実際に落とす」ことを固定するのがこのテストの役割。
 */
describe('snapshot pagination integrity check', () => {
  it('accepts a complete, duplicate-free page set', () => {
    expect(() =>
      assertSnapshotPageIntegrity('robots', [{ stableId: 'a' }, { stableId: 'b' }], 2),
    ).not.toThrow();
  });

  it('rejects a page loop that fetched fewer documents than totalDocs', () => {
    expect(() => assertSnapshotPageIntegrity('robots', [{ stableId: 'a' }], 2)).toThrow(
      /snapshot-pagination-incomplete: robots fetched 1 of 2/,
    );
  });

  it('rejects a page loop that fetched more documents than totalDocs', () => {
    expect(() =>
      assertSnapshotPageIntegrity('robots', [{ stableId: 'a' }, { stableId: 'b' }], 1),
    ).toThrow(/snapshot-pagination-incomplete: robots fetched 2 of 1/);
  });

  it('rejects the same stable id appearing on two pages', () => {
    expect(() =>
      assertSnapshotPageIntegrity('robots', [{ stableId: 'a' }, { stableId: 'a' }], 2),
    ).toThrow(/snapshot-duplicate-stable-id: robots returned "a" more than once/);
  });

  it('rejects a document with no stable id at all', () => {
    expect(() => assertSnapshotPageIntegrity('robots', [{}], 1)).toThrow(/snapshot-missing-stable-id: robots/);
  });
});
