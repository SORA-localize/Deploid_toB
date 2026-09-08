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
import { applyAdminFieldLabels, distributorsFieldLabels } from '../lib/payload/adminFieldLabels';
import { partitionFieldsByName, withSidebarPosition } from '../lib/payload/adminFieldLayout';
import { ADMIN_PUBLISH_INTENT_FIELD } from '../lib/payload/adminPublishIntent';
import {
  distributorAcquisitionMethodSelectOptions,
  distributorProviderTypeSelectOptions,
} from '../lib/payload/adminSelectLabels';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain, resolveRelationshipsToStableIds } from '../lib/content/payloadMappers';
import type { Distributor } from '../lib/content/domainTypes';
import { contentPublishAdminComponents } from '../lib/payload/adminPublishComponents';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

interface DistributorCandidate {
  stableId?: string;
  slug?: string;
  summary?: string;
  sources?: unknown[];
  name?: string;
  providerType?: Distributor['providerType'];
  handledManufacturerIds?: unknown[];
  acquisitionMethods?: Distributor['acquisitionMethods'];
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

async function mapDistributorCandidateToDomain(candidate: DistributorCandidate, payload: import('payload').Payload): Promise<Partial<Distributor>> {
  const handledManufacturerIds = await resolveRelationshipsToStableIds(payload, 'manufacturers', candidate.handledManufacturerIds as never);
  return {
    id: candidate.stableId,
    slug: candidate.slug,
    summary: candidate.summary,
    sources: (candidate.sources as Distributor['sources']) ?? [],
    publishStatus: payloadStatusToDomain(candidate),
    name: candidate.name,
    providerType: candidate.providerType,
    handledManufacturerIds,
    acquisitionMethods: candidate.acquisitionMethods,
  };
}

function validateDistributorForPublish(distributor: Partial<Distributor>): void {
  assertBaseRecordPublishable(distributor as Distributor);
  const missing: string[] = [];
  if (!distributor.name) missing.push('name');
  if (!distributor.providerType) missing.push('providerType');
  if (!distributor.handledManufacturerIds || distributor.handledManufacturerIds.length === 0) missing.push('handledManufacturerIds');
  if (!distributor.acquisitionMethods || distributor.acquisitionMethods.length === 0) missing.push('acquisitionMethods');
  if (missing.length > 0) {
    throw new PublishValidationError(missing, 'distributors');
  }
}

/**
 * T4（`docs/plans/admin-layout-rollout-plan-v1.md`、設計は
 * `docs/decisions/admin-field-layout-v1.md` §3 Distributors）: 運用頻度で2層に分けた配置。
 * `sidebar`はTier3（滅多に触らない運用メタ）、tabはTier1（基本情報）→Tier2（画像・出典）の順
 * （fieldが少ないため2 tab構成——Manufacturers/Robots/Articles/UseCasesと違い3つ目のtabは無い）。
 * 名前の集合はこのファイル内で閉じており、抜けがあれば起動時にthrowする。
 */
const SIDEBAR_FIELD_NAMES = ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'] as const;
const BASIC_INFO_TAB_FIELD_NAMES = [
  'name',
  'nameJa',
  'website',
  'providerType',
  'handledManufacturerIds',
  'handledRobotIds',
  'acquisitionMethods',
  'inquiryUrl',
  'summary',
  'note',
] as const;
const MEDIA_AND_SOURCES_TAB_FIELD_NAMES = ['heroImage', 'sources', 'reliability', 'seo'] as const;

const distributorsAllFields = applyAdminFieldLabels(
  [
      ...baseContentFields(),
      ...baseRecordContentFields(),
      { name: 'name', type: 'text', required: true },
      { name: 'nameJa', type: 'text' },
      { name: 'website', type: 'text' },
      {
        name: 'providerType',
        type: 'select',
        required: true,
        options: distributorProviderTypeSelectOptions,
      },
      {
        name: 'handledManufacturerIds',
        type: 'relationship',
        required: true,
        relationTo: 'manufacturers',
        hasMany: true,
      },
      {
        name: 'handledRobotIds',
        type: 'relationship',
        relationTo: 'robots',
        hasMany: true,
      },
      {
        name: 'acquisitionMethods',
        type: 'select',
        required: true,
        hasMany: true,
        options: distributorAcquisitionMethodSelectOptions,
      },
      { name: 'inquiryUrl', type: 'text' },
      { name: 'note', type: 'textarea' },
    ],
  distributorsFieldLabels,
);

const { matched: sidebarFields, rest: afterSidebar } = partitionFieldsByName(distributorsAllFields, SIDEBAR_FIELD_NAMES);
const { matched: basicInfoTabFields, rest: afterBasicInfo } = partitionFieldsByName(afterSidebar, BASIC_INFO_TAB_FIELD_NAMES);
const { matched: mediaTabFields, rest: unplacedFields } = partitionFieldsByName(afterBasicInfo, MEDIA_AND_SOURCES_TAB_FIELD_NAMES);

/**
 * `unplacedFields`は`admin.hidden`な`adminPublishIntentField()`だけのはず
 * （表示場所を持たない）。それ以外が残っていたら、上記3つの名前リストへの追加漏れ——
 * 編集画面のどこにも表示されない field が生まれるので、起動時に気づけるようにする。
 */
const unexpectedlyUnplacedFields = unplacedFields.filter(
  (field) => (field as { name?: string }).name !== ADMIN_PUBLISH_INTENT_FIELD,
);
if (unexpectedlyUnplacedFields.length > 0) {
  throw new Error(
    `Distributors admin field layout: unplaced field(s) — add to a tab/sidebar name list: ${unexpectedlyUnplacedFields
      .map((f) => (f as { name?: string }).name)
      .join(', ')}`,
  );
}

export const Distributors: CollectionConfig = {
  slug: 'distributors',
  // 本番サイトに対応するページ・呼称が無いため(公開側からは未参照。field-to-page-section-map-v1.md参照)、
  // `Manufacturers.domesticDistributors`内で使われている「代理店」表記に合わせた admin専用の名称。
  labels: { singular: { ja: '代理店', en: 'Distributor' }, plural: { ja: '代理店', en: 'Distributors' } },
  admin: { useAsTitle: 'name', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...unplacedFields,
    ...withSidebarPosition(sidebarFields),
    {
      type: 'tabs',
      tabs: [
        { label: { ja: '基本情報', en: 'Basic info' }, fields: basicInfoTabFields },
        { label: { ja: '画像・出典', en: 'Media & sources' }, fields: mediaTabFields },
      ],
    },
  ],
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      createPublishGateHook({
        collectionSlug: 'distributors',
        mapToDomain: (candidate, req) => mapDistributorCandidateToDomain(candidate as DistributorCandidate, req.payload),
        validateForPublish: (domain) => validateDistributorForPublish(domain as Partial<Distributor>),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'distributors' }),
    ],
    // Task 7 Step 3: publish後にpublicキャッシュを無効化する通知。
    afterChange: [createRevalidationAfterChangeHook('distributors')],
  },
};
