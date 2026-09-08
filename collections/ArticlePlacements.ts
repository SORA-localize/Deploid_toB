import type { CollectionConfig } from 'payload';
import {
  baseContentFields,
  contentCollectionAccess,
  contentCollectionBeforeOperationHooks,
  contentVersionsConfig,
  createPublishGateHook,
  createVersionRetentionGuardBeforeChangeHook,
  PublishValidationError, } from '../lib/payload/access';
import {
  applyAdminFieldLabels,
  articlePlacementsFieldLabels,
  articlePlacementsSponsorFieldLabels,
} from '../lib/payload/adminFieldLabels';
import { partitionFieldsByName, withSidebarPosition } from '../lib/payload/adminFieldLayout';
import { ADMIN_PUBLISH_INTENT_FIELD } from '../lib/payload/adminPublishIntent';
import {
  articlePlacementKindSelectOptions,
  articlePlacementSlotSelectOptions,
  articlePlacementSurfaceSelectOptions,
} from '../lib/payload/adminSelectLabels';
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
    throw new PublishValidationError(missing, 'article-placements');
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
 * T7（`docs/archive/admin-layout-rollout-plan-v1.md`、設計は
 * `docs/decisions/admin-field-layout-v1.md` §3 ArticlePlacements）: fieldが少ないため
 * tabsは作らない——sidebar（運用メタ）とそれ以外（通常領域、縦並びのまま）の2層のみ。
 * 名前の集合はこのファイル内で閉じており、抜けがあれば起動時にthrowする。
 */
const SIDEBAR_FIELD_NAMES = ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus'] as const;
const PLAIN_FIELD_NAMES = ['surface', 'slot', 'articleId', 'order', 'kind', 'sponsor'] as const;

/**
 * `ArticlePlacement`（現行）はidを持たない。`stableId` は import時に `surface:slot:articleId` から
 * 決定的に生成する（brief）。`slug` / `previousSlugs` はこのcollectionに公開URLの概念が無いため
 * 意味を持たないが、他content collectionとのschema一貫性のため `baseContentFields()` をそのまま
 * 再利用し、`slug` には `stableId` と同じ値を書く（importer側の責務。ここでは強制しない）。
 */
const articlePlacementsAllFields = applyAdminFieldLabels(
  [
      ...baseContentFields(),
      {
        name: 'surface',
        type: 'select',
        required: true,
        options: articlePlacementSurfaceSelectOptions,
      },
      {
        name: 'slot',
        type: 'select',
        required: true,
        options: articlePlacementSlotSelectOptions,
      },
      { name: 'articleId', type: 'relationship', relationTo: 'articles', required: true },
      { name: 'order', type: 'number', required: true },
      {
        name: 'kind',
        type: 'select',
        options: articlePlacementKindSelectOptions,
      },
      {
        name: 'sponsor',
        type: 'group',
        fields: applyAdminFieldLabels(
          [
            { name: 'name', type: 'text' },
            { name: 'url', type: 'text' },
            { name: 'disclosure', type: 'text' },
            { name: 'campaignId', type: 'text' },
          ],
          articlePlacementsSponsorFieldLabels,
        ),
      },
    ],
  articlePlacementsFieldLabels,
);

const { matched: sidebarFields, rest: afterSidebar } = partitionFieldsByName(articlePlacementsAllFields, SIDEBAR_FIELD_NAMES);
const { matched: plainFields, rest: unplacedFields } = partitionFieldsByName(afterSidebar, PLAIN_FIELD_NAMES);

/**
 * `unplacedFields`は`admin.hidden`な`adminPublishIntentField()`だけのはず
 * （表示場所を持たない）。それ以外が残っていたら、上記2つの名前リストへの追加漏れ——
 * 編集画面のどこにも表示されない field が生まれるので、起動時に気づけるようにする
 * （T1〜T6と同じ機械検出。ここではtabsを作らないため、2つ目の分類先が「通常領域」になる）。
 */
const unexpectedlyUnplacedFields = unplacedFields.filter(
  (field) => (field as { name?: string }).name !== ADMIN_PUBLISH_INTENT_FIELD,
);
if (unexpectedlyUnplacedFields.length > 0) {
  throw new Error(
    `ArticlePlacements admin field layout: unplaced field(s) — add to a sidebar/plain name list: ${unexpectedlyUnplacedFields
      .map((f) => (f as { name?: string }).name)
      .join(', ')}`,
  );
}

export const ArticlePlacements: CollectionConfig = {
  slug: 'article-placements',
  // 本番サイトに対応する単一の名称は無い内部運用concept（記事をどの枠に置くかの設定）。
  // 既存field label（surface=「掲載面」、slot=「掲載枠」）に合わせた admin専用の名称。
  labels: { singular: { ja: '記事掲載枠', en: 'Article placement' }, plural: { ja: '記事掲載枠', en: 'Article placements' } },
  admin: { useAsTitle: 'stableId' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  // tabsは作らない（fieldが少ないため）——sidebar以外はplainFieldsとして通常領域に縦並びのまま残す。
  fields: [...unplacedFields, ...withSidebarPosition(sidebarFields), ...plainFields],
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
