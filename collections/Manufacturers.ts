import type { CollectionConfig } from 'payload';
import {
  assertBaseRecordPublishable,
  baseContentFields,
  baseRecordContentFields,
  contentCollectionAccess,
  contentVersionsConfig,
  createPublishGateHook,
  createVersionRetentionGuardBeforeChangeHook,
} from '../lib/payload/access';
import { mapPayloadManufacturerToDomain } from '../lib/content/payloadMappers';
import type { Manufacturer } from '../lib/content/domainTypes';

function validateManufacturerForPublish(manufacturer: Manufacturer): void {
  assertBaseRecordPublishable(manufacturer);
  const missing: string[] = [];
  if (!manufacturer.name) missing.push('name');
  if (!manufacturer.country) missing.push('country');
  if (!manufacturer.companyType) missing.push('companyType');
  if (!manufacturer.japanPresence) missing.push('japanPresence');
  if (!manufacturer.website) missing.push('website');
  if (!manufacturer.description) missing.push('description');
  if (missing.length > 0) {
    throw new Error(`publish-validation-failed: manufacturers missing ${missing.join(', ')}`);
  }
}

export const Manufacturers: CollectionConfig = {
  slug: 'manufacturers',
  admin: { useAsTitle: 'name' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...baseContentFields(),
    ...baseRecordContentFields(),
    { name: 'name', type: 'text' },
    { name: 'nameJa', type: 'text' },
    {
      name: 'companyType',
      type: 'select',
      options: ['manufacturer', 'distributor', 'integrator', 'ai-os', 'research'],
    },
    {
      name: 'companyStatus',
      type: 'select',
      defaultValue: 'active',
      options: ['active', 'stealth', 'acquired', 'inactive'],
    },
    { name: 'country', type: 'text' },
    { name: 'hqCity', type: 'text' },
    {
      name: 'headquarters',
      type: 'group',
      fields: [
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
      ],
    },
    { name: 'foundedYear', type: 'number' },
    { name: 'website', type: 'text' },
    {
      name: 'logos',
      type: 'json',
      admin: { description: 'ManufacturerLogos（symbol/wordmark/combined、それぞれImageAsset形）。' },
    },
    { name: 'contactUrl', type: 'text' },
    { name: 'description', type: 'textarea' },
    {
      name: 'japanPresence',
      type: 'select',
      options: ['office', 'distributor', 'partner', 'remote', 'none', 'unknown'],
    },
    {
      name: 'domesticDistributors',
      type: 'array',
      admin: {
        description:
          '移行完了後に削除予定（data-architecture-redesign-v1.md §11: distributors collectionへ移す）。当面は表示互換のため残す。',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'website', type: 'text' },
        { name: 'sourceUrl', type: 'text' },
        { name: 'checkedAt', type: 'text', admin: { description: '日付のみの値。timestamptz にすると import 時の server TZ で日付がずれるため text（Task 5、詳細は lib/payload/access.ts の sourcesField）。' } },
        { name: 'note', type: 'textarea' },
      ],
    },
    { name: 'distributorNote', type: 'textarea' },
    { name: 'supportNote', type: 'textarea' },
    { name: 'procurementNote', type: 'textarea' },
    { name: 'vendorRiskNote', type: 'textarea' },
    { name: 'featuredRank', type: 'number' },
  ],
  hooks: {
    beforeChange: [
      createPublishGateHook({
        mapToDomain: async (candidate) => mapPayloadManufacturerToDomain(candidate as never),
        validateForPublish: (domain) => validateManufacturerForPublish(domain as Manufacturer),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'manufacturers' }),
    ],
  },
};
