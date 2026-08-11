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
import { payloadStatusToDomain, resolveRelationshipsToStableIds } from '../lib/content/payloadMappers';
import type { Distributor } from '../lib/content/domainTypes';

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
    throw new Error(`publish-validation-failed: distributors missing ${missing.join(', ')}`);
  }
}

export const Distributors: CollectionConfig = {
  slug: 'distributors',
  admin: { useAsTitle: 'name' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...baseContentFields(),
    ...baseRecordContentFields(),
    { name: 'name', type: 'text' },
    { name: 'nameJa', type: 'text' },
    { name: 'website', type: 'text' },
    {
      name: 'providerType',
      type: 'select',
      options: ['maker-direct', 'reseller', 'other'],
    },
    {
      name: 'handledManufacturerIds',
      type: 'relationship',
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
      hasMany: true,
      options: ['purchase', 'lease', 'raas', 'subscription', 'inquiry'],
    },
    { name: 'inquiryUrl', type: 'text' },
    { name: 'note', type: 'textarea' },
  ],
  hooks: {
    beforeChange: [
      createPublishGateHook({
        mapToDomain: (candidate, req) => mapDistributorCandidateToDomain(candidate as DistributorCandidate, req.payload),
        validateForPublish: (domain) => validateDistributorForPublish(domain as Partial<Distributor>),
      }),
    ],
    afterChange: [createVersionRetentionAfterChangeHook({ collectionSlug: 'distributors' })],
  },
};
