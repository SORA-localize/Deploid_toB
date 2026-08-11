import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { ROBOT_ROUTE_NAMESPACE } from '../../lib/payload/routeRegistry';
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
});
