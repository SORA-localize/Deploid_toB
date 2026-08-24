import { getPayload, type Payload, type PayloadRequest } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { ROBOT_ROUTE_NAMESPACE, transferRouteOwnership } from '../../lib/payload/routeRegistry';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * `Robot` と `RobotSeries` が同じ `/robots/[slug]` namespace を共有すること
 * （brief: `content_route_registry` / `UNIQUE(namespace, slug)`）を実Payload Local APIで検証する。
 */
describe('Route registry (Robots ⇄ RobotSeries slug namespace, real Payload Local API)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/route-registry.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'robots', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'robot-series', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'content-route-registry', where: {}, overrideAccess: true });
  });

  afterAll(async () => {
    await payload?.destroy();
  });

  async function findRegistryRow(slug: string) {
    const { docs } = await payload.find({
      collection: 'content-route-registry',
      where: { namespace: { equals: ROBOT_ROUTE_NAMESPACE }, slug: { equals: slug } },
      overrideAccess: true,
      limit: 1,
    });
    return docs[0];
  }

  it('claims a registry row when a Robot is created', async () => {
    const robot = await payload.create({
      collection: 'robots',
      overrideAccess: true,
      draft: true,
      data: { stableId: 'route-robot-a', slug: 'route-slug-a', name: 'Route Robot A' },
    });
    expect(robot.slug).toBe('route-slug-a');

    const row = await findRegistryRow('route-slug-a');
    expect(row).toBeDefined();
    expect(row?.ownerCollection).toBe('robots');
    expect(row?.ownerStableId).toBe('route-robot-a');
  });

  it('rejects a RobotSeries create that reuses a slug already claimed by a Robot', async () => {
    await expect(
      payload.create({
        collection: 'robot-series',
        overrideAccess: true,
        draft: true,
        data: { stableId: 'route-series-conflict', slug: 'route-slug-a', name: 'Conflicting Series' },
      }),
    ).rejects.toThrow(/route-slug-conflict/);
  });

  it('lets a RobotSeries claim a distinct slug in the same namespace', async () => {
    const series = await payload.create({
      collection: 'robot-series',
      overrideAccess: true,
      draft: true,
      data: { stableId: 'route-series-b', slug: 'route-slug-b', name: 'Route Series B' },
    });
    expect(series.slug).toBe('route-slug-b');

    const row = await findRegistryRow('route-slug-b');
    expect(row?.ownerCollection).toBe('robot-series');
    expect(row?.ownerStableId).toBe('route-series-b');
  });

  it('moves the registry entry on slug rename and reserves the previous slug', async () => {
    const robot = await payload.find({
      collection: 'robots',
      where: { stableId: { equals: 'route-robot-a' } },
      overrideAccess: true,
      limit: 1,
    });
    const robotDoc = robot.docs[0];

    await payload.update({
      collection: 'robots',
      id: robotDoc.id,
      overrideAccess: true,
      data: { slug: 'route-slug-a-renamed', previousSlugs: ['route-slug-a'] },
    });

    const newRow = await findRegistryRow('route-slug-a-renamed');
    expect(newRow?.ownerStableId).toBe('route-robot-a');

    const oldRow = await findRegistryRow('route-slug-a');
    expect(oldRow).toBeDefined();
    expect(oldRow?.ownerStableId).toBe('route-robot-a'); // previousSlugsとして予約されたまま残る

    // 予約済みのslugは他ownerが再claimできない。
    await expect(
      payload.create({
        collection: 'robot-series',
        overrideAccess: true,
        draft: true,
        data: { stableId: 'route-series-reuse-attempt', slug: 'route-slug-a', name: 'Should conflict' },
      }),
    ).rejects.toThrow(/route-slug-conflict/);
  });

  it('releases all registry rows for an owner on delete', async () => {
    const robot = await payload.find({
      collection: 'robots',
      where: { stableId: { equals: 'route-robot-a' } },
      overrideAccess: true,
      limit: 1,
    });
    const robotDoc = robot.docs[0];

    await payload.delete({ collection: 'robots', id: robotDoc.id, overrideAccess: true });

    expect(await findRegistryRow('route-slug-a-renamed')).toBeUndefined();
    expect(await findRegistryRow('route-slug-a')).toBeUndefined();

    // 解放後は別ownerが再claimできる。
    const series = await payload.create({
      collection: 'robot-series',
      overrideAccess: true,
      draft: true,
      data: { stableId: 'route-series-reclaim', slug: 'route-slug-a', name: 'Reclaimed slug' },
    });
    expect(series.slug).toBe('route-slug-a');
  });

  /**
   * 以下は remediation group 1 / 必須修正2 の回帰テスト。
   * 監査で見つかった4件（create時のpreviousSlugs未claim、releaseRouteのownerCollection欠落、
   * transferRouteOwnershipのfromOwnerCollection欠落、previousSlugsの重複・自己衝突未検査）を固定する。
   */
  describe('必須修正2: create時のpreviousSlugs claim', () => {
    it('reserves every previousSlug supplied at create time, not just the current slug', async () => {
      await payload.create({
        collection: 'robots',
        overrideAccess: true,
        draft: true,
        data: {
          stableId: 'prev-claim-robot',
          slug: 'prev-claim-current',
          previousSlugs: ['prev-claim-old-1', 'prev-claim-old-2'],
          name: 'Robot created with previousSlugs',
        },
      });

      expect((await findRegistryRow('prev-claim-current'))?.ownerStableId).toBe('prev-claim-robot');
      expect((await findRegistryRow('prev-claim-old-1'))?.ownerStableId).toBe('prev-claim-robot');
      expect((await findRegistryRow('prev-claim-old-2'))?.ownerStableId).toBe('prev-claim-robot');
    });

    it('prevents another collection from reusing a previousSlug claimed at create time', async () => {
      await expect(
        payload.create({
          collection: 'robot-series',
          overrideAccess: true,
          draft: true,
          data: { stableId: 'prev-claim-series-attempt', slug: 'prev-claim-old-1', name: 'Should conflict' },
        }),
      ).rejects.toThrow(/route-slug-conflict/);
    });
  });

  describe('必須修正2: previousSlugsの重複・自己衝突', () => {
    it('rejects a previousSlugs list that repeats the same slug', async () => {
      await expect(
        payload.create({
          collection: 'robots',
          overrideAccess: true,
          draft: true,
          data: {
            stableId: 'prev-dup-robot',
            slug: 'prev-dup-current',
            previousSlugs: ['prev-dup-old', 'prev-dup-old'],
            name: 'Duplicate previousSlugs',
          },
        }),
      ).rejects.toThrow(/route-previous-slugs-duplicate/);
    });

    it('rejects a previousSlugs list that contains the current slug', async () => {
      await expect(
        payload.create({
          collection: 'robots',
          overrideAccess: true,
          draft: true,
          data: {
            stableId: 'prev-self-robot',
            slug: 'prev-self-current',
            previousSlugs: ['prev-self-current'],
            name: 'Self-colliding previousSlugs',
          },
        }),
      ).rejects.toThrow(/route-previous-slugs-self-collision/);
    });
  });

  describe('必須修正2: ownerCollectionでの限定', () => {
    /**
     * `stableId` は collection ごとに unique なだけなので、Robot と RobotSeries が同じ
     * `stableId` 値を持つことは起こりうる。片方を削除しても、もう片方のrouteは消えてはいけない。
     */
    it('does not release another collection routes that share the same stableId', async () => {
      const robot = await payload.create({
        collection: 'robots',
        overrideAccess: true,
        draft: true,
        data: { stableId: 'shared-stable-id', slug: 'shared-robot-slug', name: 'Robot sharing a stableId' },
      });
      await payload.create({
        collection: 'robot-series',
        overrideAccess: true,
        draft: true,
        data: { stableId: 'shared-stable-id', slug: 'shared-series-slug', name: 'Series sharing a stableId' },
      });

      expect((await findRegistryRow('shared-robot-slug'))?.ownerCollection).toBe('robots');
      expect((await findRegistryRow('shared-series-slug'))?.ownerCollection).toBe('robot-series');

      await payload.delete({ collection: 'robots', id: robot.id, overrideAccess: true });

      expect(await findRegistryRow('shared-robot-slug')).toBeUndefined();
      const survivor = await findRegistryRow('shared-series-slug');
      expect(survivor).toBeDefined();
      expect(survivor?.ownerCollection).toBe('robot-series');
      expect(survivor?.ownerStableId).toBe('shared-stable-id');
    });

    it('transfers ownership only for the named fromOwnerCollection', async () => {
      // robots / robot-series が同じ stableId を持つ状態を作り直す。
      await payload.create({
        collection: 'robots',
        overrideAccess: true,
        draft: true,
        data: { stableId: 'transfer-shared-id', slug: 'transfer-robot-slug', name: 'Transfer source robot' },
      });
      await payload.create({
        collection: 'robot-series',
        overrideAccess: true,
        draft: true,
        data: { stableId: 'transfer-shared-id', slug: 'transfer-series-slug', name: 'Untouched series' },
      });

      const req = { payload } as unknown as PayloadRequest;

      // Robot → RobotSeries。同じ stableId を持つ robot-series 行は巻き込まれない。
      await transferRouteOwnership({
        req,
        namespace: ROBOT_ROUTE_NAMESPACE,
        fromOwnerCollection: 'robots',
        fromOwnerStableId: 'transfer-shared-id',
        toOwnerCollection: 'robot-series',
        toOwnerStableId: 'transfer-target-series',
      });

      const moved = await findRegistryRow('transfer-robot-slug');
      expect(moved?.ownerCollection).toBe('robot-series');
      expect(moved?.ownerStableId).toBe('transfer-target-series');

      const untouched = await findRegistryRow('transfer-series-slug');
      expect(untouched?.ownerCollection).toBe('robot-series');
      expect(untouched?.ownerStableId).toBe('transfer-shared-id');

      // RobotSeries → Robot の逆向きも同じ限定が効く。
      await transferRouteOwnership({
        req,
        namespace: ROBOT_ROUTE_NAMESPACE,
        fromOwnerCollection: 'robot-series',
        fromOwnerStableId: 'transfer-target-series',
        toOwnerCollection: 'robots',
        toOwnerStableId: 'transfer-back-robot',
      });

      const movedBack = await findRegistryRow('transfer-robot-slug');
      expect(movedBack?.ownerCollection).toBe('robots');
      expect(movedBack?.ownerStableId).toBe('transfer-back-robot');

      const stillUntouched = await findRegistryRow('transfer-series-slug');
      expect(stillUntouched?.ownerStableId).toBe('transfer-shared-id');
    });
  });

  describe('必須修正2: 同時claim', () => {
    it('lets only one of two concurrent claims for the same slug succeed', async () => {
      const results = await Promise.allSettled([
        payload.create({
          collection: 'robots',
          overrideAccess: true,
          draft: true,
          data: { stableId: 'race-robot', slug: 'race-slug', name: 'Race robot' },
        }),
        payload.create({
          collection: 'robot-series',
          overrideAccess: true,
          draft: true,
          data: { stableId: 'race-series', slug: 'race-slug', name: 'Race series' },
        }),
      ]);

      const fulfilled = results.filter((result) => result.status === 'fulfilled');
      expect(fulfilled).toHaveLength(1);

      const { docs } = await payload.find({
        collection: 'content-route-registry',
        where: { namespace: { equals: ROBOT_ROUTE_NAMESPACE }, slug: { equals: 'race-slug' } },
        overrideAccess: true,
        limit: 10,
      });
      expect(docs).toHaveLength(1);
    });
  });
});
