import type { CollectionConfig } from 'payload';
import {
  assertBaseRecordPublishable,
  baseContentFields,
  baseRecordContentFields,
  contentCollectionAccess,
  contentVersionsConfig,
  createPublishGateHook,
  createVersionRetentionAfterChangeHook,
} from '../lib/payload/access';
import { payloadStatusToDomain, resolveRelationshipToStableId } from '../lib/content/payloadMappers';
import type { DeploymentSite } from '../lib/content/domainTypes';

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
    throw new Error(`publish-validation-failed: deployments missing ${missing.join(', ')}`);
  }
}

/** Homeワールドマップの arc（manufacturer HQ → 導入拠点）根拠データ。 */
export const Deployments: CollectionConfig = {
  slug: 'deployments',
  admin: { useAsTitle: 'customer' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...baseContentFields(),
    ...baseRecordContentFields(),
    { name: 'manufacturerId', type: 'relationship', relationTo: 'manufacturers' },
    { name: 'robotId', type: 'relationship', relationTo: 'robots' },
    { name: 'customer', type: 'text' },
    { name: 'siteName', type: 'text' },
    { name: 'country', type: 'text' },
    {
      name: 'location',
      type: 'group',
      fields: [
        { name: 'lat', type: 'number', required: true },
        { name: 'lng', type: 'number', required: true },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: ['announced', 'pilot', 'production', 'ended', 'unknown'],
    },
    { name: 'startedAt', type: 'text' },
    { name: 'relatedUseCaseIds', type: 'relationship', relationTo: 'use-cases', hasMany: true },
  ],
  hooks: {
    beforeChange: [
      createPublishGateHook({
        mapToDomain: (candidate, req) => mapDeploymentCandidateToDomain(candidate as DeploymentCandidate, req.payload),
        validateForPublish: (domain) => validateDeploymentForPublish(domain as Partial<DeploymentSite>),
      }),
    ],
    afterChange: [createVersionRetentionAfterChangeHook({ collectionSlug: 'deployments' })],
  },
};
