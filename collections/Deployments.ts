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

/** Homeワールドマップの arc（manufacturer HQ → 導入拠点）根拠データ。 */
export const Deployments: CollectionConfig = {
  slug: 'deployments',
  admin: { useAsTitle: 'customer', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: applyAdminFieldLabels(
    [
      ...baseContentFields(),
      ...baseRecordContentFields(),
      { name: 'manufacturerId', type: 'relationship', relationTo: 'manufacturers', required: true },
      { name: 'robotId', type: 'relationship', relationTo: 'robots' },
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
        options: ['announced', 'pilot', 'production', 'ended', 'unknown'],
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
      { name: 'startedAt', type: 'text' },
      { name: 'relatedUseCaseIds', type: 'relationship', relationTo: 'use-cases', hasMany: true },
    ],
    deploymentsFieldLabels,
  ),
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
