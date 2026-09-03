import type { CollectionConfig } from 'payload';
import {
  baseContentFields,
  contentCollectionAccess,
  contentCollectionBeforeOperationHooks,
  contentVersionsConfig,
  createPublishGateHook,
  createVersionRetentionGuardBeforeChangeHook,
} from '../lib/payload/access';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain, resolveRelationshipToStableId } from '../lib/content/payloadMappers';
import type { ArticlePlacement } from '../lib/content/domainTypes';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

interface ArticlePlacementCandidate {
  id?: string | number;
  stableId?: string;
  surface?: ArticlePlacement['surface'];
  slot?: ArticlePlacement['slot'];
  articleId?: unknown;
  order?: number;
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

async function mapArticlePlacementCandidateToDomain(candidate: ArticlePlacementCandidate, payload: import('payload').Payload): Promise<Partial<ArticlePlacement>> {
  const articleId = await resolveRelationshipToStableId(payload, 'articles', candidate.articleId as never);
  return {
    id: candidate.stableId,
    surface: candidate.surface,
    slot: candidate.slot,
    articleId,
    order: candidate.order,
    publishStatus: payloadStatusToDomain(candidate),
  };
}

function validatePlacementForPublish(placement: Partial<ArticlePlacement>): void {
  const missing: string[] = [];
  if (!placement.id) missing.push('stableId');
  if (!placement.surface) missing.push('surface');
  if (!placement.slot) missing.push('slot');
  if (!placement.articleId) missing.push('articleId');
  if (placement.order === undefined || placement.order === null) missing.push('order');
  if (missing.length > 0) {
    throw new Error(`publish-validation-failed: article-placements missing ${missing.join(', ')}`);
  }
}

/**
 * 同じ surface/slot 内の order重複と、同じ記事の重複配置を拒否する（brief）。draft/published
 * どちらでも常に検査する（「不完全レコード」ではなく構造的な一意性制約のため、公開ゲートとは
 * 独立して毎回走らせる）。
 */
async function validateUniqueness({
  data,
  originalDoc,
  operation,
  req,
}: {
  data: Partial<ArticlePlacementCandidate>;
  originalDoc?: ArticlePlacementCandidate;
  operation: 'create' | 'update';
  req: import('payload').PayloadRequest;
}): Promise<Partial<ArticlePlacementCandidate>> {
  const candidate = operation === 'update' ? { ...originalDoc, ...data } : data;
  if (!candidate.surface || !candidate.slot) return data;

  const { docs: siblings } = await req.payload.find({
    collection: 'article-placements',
    where: {
      surface: { equals: candidate.surface },
      slot: { equals: candidate.slot },
      ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
    },
    limit: 1000,
    depth: 0,
    req,
    overrideAccess: true,
  });

  const orderConflict = siblings.some((sibling) => (sibling as ArticlePlacementCandidate).order === candidate.order);
  if (orderConflict && candidate.order !== undefined) {
    throw new Error(`article-placement-order-conflict: order ${candidate.order} already used in ${candidate.surface}/${candidate.slot}`);
  }

  const articleConflict = siblings.some(
    (sibling) => String((sibling as ArticlePlacementCandidate).articleId) === String(candidate.articleId) && candidate.articleId !== undefined,
  );
  if (articleConflict) {
    throw new Error(`article-placement-duplicate-article: article already placed in ${candidate.surface}/${candidate.slot}`);
  }

  return data;
}

/**
 * `ArticlePlacement`（現行）はidを持たない。`stableId` は import時に `surface:slot:articleId` から
 * 決定的に生成する（brief）。`slug` / `previousSlugs` はこのcollectionに公開URLの概念が無いため
 * 意味を持たないが、他content collectionとのschema一貫性のため `baseContentFields()` をそのまま
 * 再利用し、`slug` には `stableId` と同じ値を書く（importer側の責務。ここでは強制しない）。
 */
export const ArticlePlacements: CollectionConfig = {
  slug: 'article-placements',
  admin: { useAsTitle: 'stableId' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...baseContentFields(),
    {
      name: 'surface',
      type: 'select',
      options: ['reports-index'],
    },
    {
      name: 'slot',
      type: 'select',
      options: ['hero', 'feature'],
    },
    { name: 'articleId', type: 'relationship', relationTo: 'articles' },
    { name: 'order', type: 'number' },
    {
      name: 'kind',
      type: 'select',
      options: ['editorial', 'sample', 'sponsored', 'house'],
    },
    {
      name: 'sponsor',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'url', type: 'text' },
        { name: 'disclosure', type: 'text' },
        { name: 'campaignId', type: 'text' },
      ],
    },
  ],
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      validateUniqueness,
      createPublishGateHook({
        collectionSlug: 'article-placements',
        mapToDomain: (candidate, req) => mapArticlePlacementCandidateToDomain(candidate as never, req.payload),
        validateForPublish: (domain) => validatePlacementForPublish(domain as Partial<ArticlePlacement>),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'article-placements' }),
    ],
    // Task 7 Step 3: publish後にpublicキャッシュを無効化する通知。
    afterChange: [createRevalidationAfterChangeHook('article-placements')],
  },
};
