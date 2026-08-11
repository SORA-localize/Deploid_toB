import type { CollectionAfterChangeHook, CollectionBeforeDeleteHook, CollectionConfig } from 'payload';
import type { PayloadRequest } from 'payload';
import { isPlatformAdmin } from './access';

/**
 * `Robot` と `RobotSeries` は同じ `/robots/[slug]` namespaceを共有する（brief）。collectionごとの
 * `unique: true` だけでは、別collection間のslug衝突を防げない。このcollectionが
 * `content_route_registry(namespace, slug, owner_collection, owner_stable_id)` に対応し、
 * `UNIQUE(namespace, slug)` をDB制約（`indexes`）として持つ。
 *
 * `slug` は現行slugだけでなく `previousSlugs` も1行ずつ予約する（brief:
 * 「previousSlugsも予約し、現行slugとの衝突を拒否する」）。ownerが削除されたら
 * `releaseRoute` で current / previous を問わず全行を解放する。
 *
 * このcollectionはadmin UIから直接編集する対象ではない（Robots/RobotSeriesのhookからだけ書く）。
 */
export const RouteRegistryCollection: CollectionConfig = {
  slug: 'content-route-registry',
  admin: { hidden: true, useAsTitle: 'slug' },
  access: {
    read: isPlatformAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  indexes: [{ fields: ['namespace', 'slug'], unique: true }],
  fields: [
    { name: 'namespace', type: 'text', required: true, index: true },
    { name: 'slug', type: 'text', required: true },
    {
      name: 'ownerCollection',
      type: 'select',
      required: true,
      options: ['robots', 'robot-series'],
    },
    { name: 'ownerStableId', type: 'text', required: true, index: true },
  ],
};

export const ROBOT_ROUTE_NAMESPACE = 'robots-slug';

interface ClaimRouteArgs {
  req: PayloadRequest;
  namespace: string;
  slug: string;
  ownerCollection: 'robots' | 'robot-series';
  ownerStableId: string;
}

/**
 * slugを1行claimする。同じ(namespace, slug)がDB unique制約で既に他ownerに取られていれば
 * Payloadがconstraint violationを例外化し、呼び出し元のtransactionごとrollbackする。
 * 同じownerが同じslugを再claimするのは冪等に許可する（no-op）。
 */
export async function claimRoute({ req, namespace, slug, ownerCollection, ownerStableId }: ClaimRouteArgs): Promise<void> {
  const { docs: existing } = await req.payload.find({
    collection: 'content-route-registry',
    where: { namespace: { equals: namespace }, slug: { equals: slug } },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  });

  const existingRow = existing[0];
  if (existingRow) {
    if (existingRow.ownerStableId !== ownerStableId || existingRow.ownerCollection !== ownerCollection) {
      throw new Error(`route-slug-conflict: "${slug}" is already claimed by ${existingRow.ownerCollection}/${existingRow.ownerStableId}`);
    }
    return; // 冪等
  }

  await req.payload.create({
    collection: 'content-route-registry',
    data: { namespace, slug, ownerCollection, ownerStableId },
    req,
    overrideAccess: true,
  });
}

interface MoveRouteArgs {
  req: PayloadRequest;
  namespace: string;
  fromSlug?: string;
  toSlug: string;
  previousSlugs?: string[];
  ownerCollection: 'robots' | 'robot-series';
  ownerStableId: string;
}

/**
 * slug変更をregistryへ反映する。新slugをclaimし、`previousSlugs`（旧slug変更前の値を含む）を
 * すべて予約済みとして残す。`previousSlugs` は追記のみのため、ここでは削除しない。
 */
export async function moveRoute({ req, namespace, toSlug, previousSlugs, ownerCollection, ownerStableId }: MoveRouteArgs): Promise<void> {
  await claimRoute({ req, namespace, slug: toSlug, ownerCollection, ownerStableId });
  for (const previousSlug of previousSlugs ?? []) {
    await claimRoute({ req, namespace, slug: previousSlug, ownerCollection, ownerStableId });
  }
}

interface ReleaseRouteArgs {
  req: PayloadRequest;
  namespace: string;
  ownerStableId: string;
}

/** ownerのdelete時に、current / previous を問わずそのownerが持つ全行を解放する。 */
export async function releaseRoute({ req, namespace, ownerStableId }: ReleaseRouteArgs): Promise<void> {
  await req.payload.delete({
    collection: 'content-route-registry',
    where: { namespace: { equals: namespace }, ownerStableId: { equals: ownerStableId } },
    req,
    overrideAccess: true,
  });
}

/**
 * Task 9.5（シリーズcutover）向けのowner移管。既存行のownerを差し替える。移管元・移管先の
 * 統合testはTask 9.5側で書く（brief）。ここでは移管の最小プリミティブだけを提供する。
 */
export async function transferRouteOwnership(args: {
  req: PayloadRequest;
  namespace: string;
  fromOwnerStableId: string;
  toOwnerCollection: 'robots' | 'robot-series';
  toOwnerStableId: string;
}): Promise<void> {
  const { req, namespace, fromOwnerStableId, toOwnerCollection, toOwnerStableId } = args;
  await req.payload.update({
    collection: 'content-route-registry',
    where: { namespace: { equals: namespace }, ownerStableId: { equals: fromOwnerStableId } },
    data: { ownerCollection: toOwnerCollection, ownerStableId: toOwnerStableId },
    req,
    overrideAccess: true,
  });
}

interface RouteRegistryHookDoc {
  id: string | number;
  stableId?: string;
  slug?: string;
  previousSlugs?: string[] | null;
}

/**
 * Robots / RobotSeries collectionへspreadするhook集合。createでclaim、update時のslug変更で
 * move、deleteでreleaseする。すべて同じ `req` を渡すことで `req.transactionID` を共有し、
 * registry操作と本document操作を同一DB transactionにまとめる。
 */
export function createRouteRegistryHooks(ownerCollection: 'robots' | 'robot-series'): {
  afterChange: CollectionAfterChangeHook[];
  beforeDelete: CollectionBeforeDeleteHook[];
} {
  return {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const current = doc as RouteRegistryHookDoc;
        if (!current.slug || !current.stableId) return;

        if (operation === 'create') {
          await claimRoute({
            req,
            namespace: ROBOT_ROUTE_NAMESPACE,
            slug: current.slug,
            ownerCollection,
            ownerStableId: current.stableId,
          });
          return;
        }

        const previous = previousDoc as RouteRegistryHookDoc | undefined;
        if (previous && previous.slug !== current.slug) {
          await moveRoute({
            req,
            namespace: ROBOT_ROUTE_NAMESPACE,
            fromSlug: previous.slug,
            toSlug: current.slug,
            previousSlugs: current.previousSlugs ?? undefined,
            ownerCollection,
            ownerStableId: current.stableId,
          });
        } else if (current.previousSlugs && current.previousSlugs.length > 0) {
          // slug自体は変わっていないが previousSlugs だけ追記された場合も予約する。
          for (const previousSlug of current.previousSlugs) {
            await claimRoute({
              req,
              namespace: ROBOT_ROUTE_NAMESPACE,
              slug: previousSlug,
              ownerCollection,
              ownerStableId: current.stableId,
            });
          }
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const doc = await req.payload.findByID({
          collection: ownerCollection,
          id,
          req,
          overrideAccess: true,
          depth: 0,
        });
        const stableId = (doc as { stableId?: string } | null)?.stableId;
        if (!stableId) return;
        await releaseRoute({ req, namespace: ROBOT_ROUTE_NAMESPACE, ownerStableId: stableId });
      },
    ],
  };
}
