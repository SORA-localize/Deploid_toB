import type { CollectionConfig } from 'payload';
import {
  assertBaseRecordPublishable,
  baseContentFields,
  baseRecordContentFields,
  contentCollectionAccess,
  contentCollectionBeforeOperationHooks,
  contentVersionsConfig,
  createPublishGateHook,
  createVersionRetentionGuardBeforeChangeHook,
} from '../lib/payload/access';
import { createRouteRegistryHooks } from '../lib/payload/routeRegistry';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain, resolveRelationshipToStableId } from '../lib/content/payloadMappers';
import type { RobotSeries } from '../lib/content/domainTypes';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

interface RobotSeriesCandidate {
  stableId?: string;
  slug?: string;
  summary?: string;
  sources?: unknown[];
  name?: string;
  manufacturerId?: unknown;
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

async function mapRobotSeriesCandidateToDomain(candidate: RobotSeriesCandidate, payload: import('payload').Payload): Promise<Partial<RobotSeries>> {
  const manufacturerId = await resolveRelationshipToStableId(payload, 'manufacturers', candidate.manufacturerId as never);
  return {
    id: candidate.stableId,
    slug: candidate.slug,
    summary: candidate.summary,
    sources: (candidate.sources as RobotSeries['sources']) ?? [],
    publishStatus: payloadStatusToDomain(candidate),
    name: candidate.name,
    manufacturerId,
  };
}

function validateRobotSeriesForPublish(series: Partial<RobotSeries>): void {
  assertBaseRecordPublishable(series as RobotSeries);
  const missing: string[] = [];
  if (!series.name) missing.push('name');
  if (!series.manufacturerId) missing.push('manufacturerId');
  if (missing.length > 0) {
    throw new Error(`publish-validation-failed: robot-series missing ${missing.join(', ')}`);
  }
}

const routeRegistryHooks = createRouteRegistryHooks('robot-series');

/**
 * スペックも価格も持たない（brief: `deploymentStage` と `specs` に答えが存在しないため）。
 * `/robots/[slug]` namespaceを `Robots` と共有するため、`lib/payload/routeRegistry.ts` の
 * hookをclaim/move/release全てに接続する。
 */
export const RobotSeriesCollection: CollectionConfig = {
  slug: 'robot-series',
  admin: { useAsTitle: 'name' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...baseContentFields(),
    ...baseRecordContentFields(),
    { name: 'name', type: 'text' },
    { name: 'nameJa', type: 'text' },
    {
      name: 'manufacturerId',
      type: 'relationship',
      relationTo: 'manufacturers',
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'images',
      type: 'json',
      admin: { description: 'Partial<Record<ImageRole, ImageAsset>>。' },
    },
    { name: 'industryTags', type: 'text', hasMany: true },
    { name: 'taskTags', type: 'text', hasMany: true },
  ],
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      createPublishGateHook({
        collectionSlug: 'robot-series',
        mapToDomain: (candidate, req) => mapRobotSeriesCandidateToDomain(candidate as RobotSeriesCandidate, req.payload),
        validateForPublish: (domain) => validateRobotSeriesForPublish(domain as Partial<RobotSeries>),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'robot-series' }),
    ],
    // Task 7 Step 3: 既存のroute registry afterChangeへ、revalidation通知を追加する形で足す。
    afterChange: [...routeRegistryHooks.afterChange, createRevalidationAfterChangeHook('robot-series')],
    beforeDelete: routeRegistryHooks.beforeDelete,
  },
};
