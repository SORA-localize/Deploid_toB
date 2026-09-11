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
import { applyAdminFieldLabels, deploymentsFieldLabels, deploymentsLocationFieldLabels } from '../lib/payload/adminFieldLabels';
import { partitionFieldsByName, withSidebarPosition } from '../lib/payload/adminFieldLayout';
import { ADMIN_PUBLISH_INTENT_FIELD } from '../lib/payload/adminPublishIntent';
import { deploymentStatusSelectOptions } from '../lib/payload/adminSelectLabels';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain, resolveRelationshipToStableId } from '../lib/content/payloadMappers';
import type { DeploymentSite } from '../lib/content/domainTypes';
import { contentPublishAdminComponents } from '../lib/payload/adminPublishComponents';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

interface DeploymentCandidate {
  stableId?: string;
  slug?: string;
  summary?: string;
  sources?: unknown[];
  manufacturerId?: unknown;
  customer?: string;
  country?: string;
  location?: DeploymentSite['location'];
  status?: DeploymentSite['status'];
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

async function mapDeploymentCandidateToDomain(candidate: DeploymentCandidate, payload: import('payload').Payload): Promise<Partial<DeploymentSite>> {
  const manufacturerId = await resolveRelationshipToStableId(payload, 'manufacturers', candidate.manufacturerId as never);
  return {
    id: candidate.stableId,
    slug: candidate.slug,
    summary: candidate.summary,
    sources: (candidate.sources as DeploymentSite['sources']) ?? [],
    publishStatus: payloadStatusToDomain(candidate),
    manufacturerId,
    customer: candidate.customer,
    country: candidate.country,
    location: candidate.location,
    status: candidate.status,
  };
}

function validateDeploymentForPublish(deployment: Partial<DeploymentSite>): void {
  assertBaseRecordPublishable(deployment as DeploymentSite);
  const missing: string[] = [];
  if (!deployment.manufacturerId) missing.push('manufacturerId');
  if (!deployment.customer) missing.push('customer');
  if (!deployment.country) missing.push('country');
  if (!deployment.location) missing.push('location');
  if (!deployment.status) missing.push('status');
  if (missing.length > 0) {
    throw new PublishValidationError(missing, 'deployments');
  }
}

/**
 * T5（`docs/archive/admin-layout-rollout-plan-v1.md`、設計は
 * `docs/decisions/admin-field-layout-v1.md` §3 Deployments）: 運用頻度で2層に分けた配置
 * （fieldが少ないため2 tab構成——Distributorsと同じ形）。名前の集合はこのファイル内で
 * 閉じており、抜けがあれば起動時にthrowする。
 */
const SIDEBAR_FIELD_NAMES = ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'] as const;
const BASIC_INFO_TAB_FIELD_NAMES = [
  'manufacturerId',
  'customer',
  'siteName',
  'country',
  'location',
  'status',
  'relatedUseCaseIds',
  'summary',
] as const;
const SOURCES_SEO_TAB_FIELD_NAMES = ['sources', 'reliability', 'heroImage', 'seo'] as const;

/** Homeワールドマップの arc（manufacturer HQ → 導入拠点）根拠データ。 */
const deploymentsAllFields = applyAdminFieldLabels(
  [
      ...baseContentFields(),
      ...baseRecordContentFields(),
      { name: 'manufacturerId', type: 'relationship', relationTo: 'manufacturers', required: true },
      { name: 'customer', type: 'text', required: true },
      { name: 'siteName', type: 'text' },
      { name: 'country', type: 'text', required: true },
      {
        name: 'location',
        type: 'group',
        fields: applyAdminFieldLabels(
          [
            { name: 'lat', type: 'number', required: true },
            { name: 'lng', type: 'number', required: true },
          ],
          deploymentsLocationFieldLabels,
        ),
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        options: deploymentStatusSelectOptions,
        // `enumName` は必須（Task 4で発見したTask 3のschema欠陥の修正）。
        // postgres adapterはenum型名を `enum_<table>_<field>` で決めるため、drafts機構の
        // `_status`（先頭のアンダースコアが落ちて `enum_deployments_status`）と、この
        // 独自field `status` の enum名が衝突する。衝突時は片方（draft|published）だけが
        // 生成され、`status` 列までその型になるため、`announced` / `pilot` 等の実値が
        // Postgresのenum制約で拒否される（`invalid input value for enum
        // enum_deployments_status: "pilot"`）。domain・API上のfield名 `status` と
        // `DeploymentSite.status` の意味は変えず、DB上のenum型名だけを分離する。
        enumName: 'enum_deployments_site_status',
      },
      { name: 'relatedUseCaseIds', type: 'relationship', relationTo: 'use-cases', hasMany: true },
    ],
  deploymentsFieldLabels,
);

const { matched: sidebarFields, rest: afterSidebar } = partitionFieldsByName(deploymentsAllFields, SIDEBAR_FIELD_NAMES);
const { matched: basicInfoTabFields, rest: afterBasicInfo } = partitionFieldsByName(afterSidebar, BASIC_INFO_TAB_FIELD_NAMES);
const { matched: sourcesSeoTabFields, rest: unplacedFields } = partitionFieldsByName(afterBasicInfo, SOURCES_SEO_TAB_FIELD_NAMES);

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
    `Deployments admin field layout: unplaced field(s) — add to a tab/sidebar name list: ${unexpectedlyUnplacedFields
      .map((f) => (f as { name?: string }).name)
      .join(', ')}`,
  );
}

export const Deployments: CollectionConfig = {
  slug: 'deployments',
  // 公開サイトの表記に合わせる（lib/uiText.ts の useCases.deployments = '導入事例'）。
  labels: { singular: { ja: '導入事例', en: 'Deployment' }, plural: { ja: '導入事例', en: 'Deployments' } },
  admin: { useAsTitle: 'customer', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...unplacedFields,
    ...withSidebarPosition(sidebarFields),
    {
      type: 'tabs',
      tabs: [
        { label: { ja: '基本情報', en: 'Basic info' }, fields: basicInfoTabFields },
        { label: { ja: '出典・SEO', en: 'Sources & SEO' }, fields: sourcesSeoTabFields },
      ],
    },
  ],
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      createPublishGateHook({
        collectionSlug: 'deployments',
        mapToDomain: (candidate, req) => mapDeploymentCandidateToDomain(candidate as DeploymentCandidate, req.payload),
        validateForPublish: (domain) => validateDeploymentForPublish(domain as Partial<DeploymentSite>),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'deployments' }),
    ],
    // Task 7 Step 3: publish後にpublicキャッシュを無効化する通知。
    afterChange: [createRevalidationAfterChangeHook('deployments')],
  },
};
