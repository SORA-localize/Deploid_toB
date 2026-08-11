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
import { createRouteRegistryHooks } from '../lib/payload/routeRegistry';
import { mapPayloadRobotToDomain } from '../lib/content/payloadMappers';
import type { Robot } from '../lib/content/domainTypes';

function validateRobotForPublish(robot: Robot): void {
  assertBaseRecordPublishable(robot);
  const missing: string[] = [];
  if (!robot.name) missing.push('name');
  if (!robot.manufacturerId) missing.push('manufacturerId');
  if (!robot.category) missing.push('category');
  if (!robot.deploymentStage) missing.push('deploymentStage');
  if (!robot.japanAvailability) missing.push('japanAvailability');
  if (missing.length > 0) {
    throw new Error(`publish-validation-failed: robots missing ${missing.join(', ')}`);
  }
}

const routeRegistryHooks = createRouteRegistryHooks('robots');

/**
 * `data/types.ts` の旧 `Robot` interfaceをimportせず独立schemaとして書く（brief）。
 * 2026-08-09に削除された4フィールド（DEC-S05・S06、`robot-data-import-plan-v1.md`）:
 * `buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote` は含めない。
 * `comparison` は `/compare` が実表示に使うため維持する。
 */
export const Robots: CollectionConfig = {
  slug: 'robots',
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
      required: false,
    },
    {
      name: 'seriesId',
      type: 'relationship',
      relationTo: 'robot-series',
      required: false,
    },
    {
      name: 'category',
      type: 'select',
      options: ['humanoid', 'general-purpose-robot', 'upper-body-humanoid', 'mobile-manipulator', 'other'],
    },
    { name: 'description', type: 'textarea' },
    { name: 'featuredRank', type: 'number' },
    {
      name: 'deploymentStage',
      type: 'select',
      options: ['concept', 'prototype', 'pilot', 'limited-production', 'production', 'internal-use', 'discontinued'],
    },
    {
      name: 'supersededById',
      type: 'relationship',
      relationTo: 'robots',
      required: false,
    },
    {
      name: 'specs',
      type: 'json',
      admin: { description: 'RobotSpecs。項目定義（単位・ラベル・グループ）の正本は lib/specSchema.ts。' },
    },
    {
      name: 'procurementModels',
      type: 'select',
      hasMany: true,
      options: ['purchase', 'lease', 'raas', 'subscription', 'partner-program', 'not-for-sale', 'inquiry'],
    },
    {
      name: 'priceOffers',
      type: 'array',
      fields: [
        {
          name: 'channel',
          type: 'select',
          required: true,
          options: ['manufacturer-public', 'authorized-distributor-public'],
        },
        { name: 'display', type: 'text', required: true },
        { name: 'amount', type: 'number' },
        { name: 'currency', type: 'text' },
        { name: 'taxStatus', type: 'select', options: ['included', 'excluded', 'unknown'] },
        { name: 'variant', type: 'text' },
        { name: 'sellerName', type: 'text' },
        { name: 'sourceUrl', type: 'text', required: true },
      ],
    },
    {
      name: 'loadRatings',
      type: 'array',
      fields: [
        {
          name: 'scope',
          type: 'select',
          required: true,
          options: ['single-arm', 'dual-arm', 'whole-body', 'carrier', 'manufacturer-wording'],
        },
        { name: 'rating', type: 'select', required: true, options: ['rated', 'maximum', 'unspecified'] },
        { name: 'kg', type: 'number', required: true },
        { name: 'condition', type: 'text' },
        { name: 'variant', type: 'text' },
        { name: 'sourceUrl', type: 'text', required: true },
      ],
    },
    {
      name: 'fieldEvidence',
      type: 'json',
      admin: { description: 'RobotFieldEvidence。specSchemaのkey / priceOffers / loadRatings → sourceUrl[]。' },
    },
    { name: 'usageExampleSourceUrls', type: 'text', hasMany: true },
    {
      name: 'japanAvailability',
      type: 'select',
      options: ['official-japan', 'distributor-japan', 'inquiry-required', 'import-only', 'unavailable', 'unknown'],
    },
    { name: 'distributorJapan', type: 'text' },
    { name: 'supportNote', type: 'textarea' },
    {
      name: 'images',
      type: 'json',
      admin: { description: 'Partial<Record<ImageRole, ImageAsset>>。' },
    },
    { name: 'industryTags', type: 'text', hasMany: true },
    { name: 'taskTags', type: 'text', hasMany: true },
    {
      name: 'comparison',
      type: 'group',
      admin: { description: '@deprecated。/compare の作り替えが決まるまで維持する（削除しない）。' },
      fields: [
        { name: 'strengths', type: 'text', hasMany: true },
        { name: 'constraints', type: 'text', hasMany: true },
        { name: 'bestFit', type: 'text', hasMany: true },
        { name: 'notFit', type: 'text', hasMany: true },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      createPublishGateHook({
        mapToDomain: (candidate, req) => mapPayloadRobotToDomain(candidate as never, req.payload),
        validateForPublish: (domain) => validateRobotForPublish(domain as Robot),
      }),
    ],
    afterChange: [...routeRegistryHooks.afterChange, createVersionRetentionAfterChangeHook({ collectionSlug: 'robots' })],
    beforeDelete: routeRegistryHooks.beforeDelete,
  },
};
