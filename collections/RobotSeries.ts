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
  PublishValidationError, } from '../lib/payload/access';
import { applyAdminFieldLabels, robotSeriesFieldLabels } from '../lib/payload/adminFieldLabels';
import { createRouteRegistryHooks } from '../lib/payload/routeRegistry';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain, resolveRelationshipToStableId } from '../lib/content/payloadMappers';
import type { RobotSeries } from '../lib/content/domainTypes';
import { contentPublishAdminComponents } from '../lib/payload/adminPublishComponents';
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
    throw new PublishValidationError(missing, 'robot-series');
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
  admin: { useAsTitle: 'name', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: applyAdminFieldLabels(
    [
      ...baseContentFields(),
      ...baseRecordContentFields(),
      { name: 'name', type: 'text', required: true },
      { name: 'nameJa', type: 'text' },
      {
        name: 'manufacturerId',
        type: 'relationship',
        required: true,
        relationTo: 'manufacturers',
      },
      { name: 'description', type: 'textarea' },
      {
        name: 'images',
        type: 'json',
        // JSON形の内訳: role名（hero/transparent/side/inOperation/scale/endEffector/mobility）を
        // キーに、それぞれ`heroImage`と同じ形のImageAssetオブジェクトを持つ（省略可）。
        // `lib/robotMedia.ts`の`ROBOT_IMAGE_ROLE_ORDER`と対応（Robots.imagesと同じ形式）。
        admin: {
          description: {
            ja: '画像（role別、いずれも任意）。現状、robot-seriesを単体で表示するページが無いため、公開ページには表示されません。',
            en: 'Images by role (all optional). Not shown on any public page yet — there is currently no dedicated page for a robot series on its own.',
          },
        },
      },
      { name: 'industryTags', type: 'text', hasMany: true },
      { name: 'taskTags', type: 'text', hasMany: true },
    ],
    robotSeriesFieldLabels,
  ),
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
