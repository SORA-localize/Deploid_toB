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
} from '../lib/payload/access';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain } from '../lib/content/payloadMappers';
import type { UseCase } from '../lib/content/domainTypes';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

interface UseCaseCandidate {
  stableId?: string;
  slug?: string;
  summary?: string;
  sources?: unknown[];
  title?: string;
  maturityLevel?: UseCase['maturityLevel'];
  environment?: UseCase['environment'];
  requiredCapabilities?: UseCase['requiredCapabilities'];
  primaryIndustry?: UseCase['primaryIndustry'];
  atAGlance?: UseCase['atAGlance'];
  overview?: string;
  whyItMatters?: string;
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

function mapUseCaseCandidateToDomain(candidate: UseCaseCandidate): Partial<UseCase> {
  return {
    id: candidate.stableId,
    slug: candidate.slug,
    summary: candidate.summary,
    sources: (candidate.sources as UseCase['sources']) ?? [],
    publishStatus: payloadStatusToDomain(candidate),
    title: candidate.title,
    maturityLevel: candidate.maturityLevel,
    environment: candidate.environment,
    requiredCapabilities: candidate.requiredCapabilities,
    primaryIndustry: candidate.primaryIndustry,
    overview: candidate.overview,
    whyItMatters: candidate.whyItMatters,
  };
}

function validateUseCaseForPublish(useCase: Partial<UseCase>): void {
  assertBaseRecordPublishable(useCase as UseCase);
  const missing: string[] = [];
  if (!useCase.title) missing.push('title');
  if (!useCase.maturityLevel) missing.push('maturityLevel');
  if (!useCase.environment) missing.push('environment');
  if (!useCase.requiredCapabilities || useCase.requiredCapabilities.length === 0) missing.push('requiredCapabilities');
  if (!useCase.primaryIndustry) missing.push('primaryIndustry');
  if (!useCase.overview) missing.push('overview');
  if (!useCase.whyItMatters) missing.push('whyItMatters');
  if (missing.length > 0) {
    throw new Error(`publish-validation-failed: use-cases missing ${missing.join(', ')}`);
  }
}

export const UseCases: CollectionConfig = {
  slug: 'use-cases',
  admin: { useAsTitle: 'title' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...baseContentFields(),
    ...baseRecordContentFields(),
    { name: 'title', type: 'text' },
    { name: 'titleJa', type: 'text' },
    { name: 'subtitle', type: 'text' },
    {
      name: 'maturityLevel',
      type: 'select',
      options: ['early-stage', 'pilot-phase', 'production-ready'],
    },
    {
      name: 'buyerReadiness',
      type: 'select',
      options: ['initial-adoption', 'requires-poc', 'limited-today'],
      admin: { description: 'Robotsからは削除済み（DEC-S05）。UseCaseには残す。' },
    },
    {
      name: 'environment',
      type: 'select',
      options: ['indoor-controlled', 'indoor-semi-controlled', 'outdoor', 'mixed', 'hazardous'],
    },
    {
      name: 'requiredCapabilities',
      type: 'select',
      hasMany: true,
      options: ['mobility', 'manipulation', 'perception', 'autonomy', 'communication', 'data-capture', 'integration'],
    },
    { name: 'primaryIndustry', type: 'text' },
    { name: 'industryTags', type: 'text', hasMany: true },
    { name: 'taskTags', type: 'text', hasMany: true },
    {
      name: 'atAGlance',
      type: 'group',
      fields: [
        { name: 'whereFits', type: 'textarea' },
        { name: 'whereDoesNotFit', type: 'textarea' },
        { name: 'mustBeTrue', type: 'textarea' },
      ],
    },
    { name: 'overview', type: 'textarea' },
    { name: 'whyItMatters', type: 'textarea' },
    {
      name: 'capabilityNotes',
      type: 'group',
      fields: [
        { name: 'mobility', type: 'textarea' },
        { name: 'manipulation', type: 'textarea' },
        { name: 'perception', type: 'textarea' },
        { name: 'autonomy', type: 'textarea' },
        { name: 'communication', type: 'textarea' },
        { name: 'integration', type: 'textarea' },
      ],
    },
    { name: 'environmentRequirements', type: 'textarea' },
    { name: 'whyHardToday', type: 'textarea' },
    { name: 'japanDeploymentConditions', type: 'textarea' },
    {
      name: 'candidateRobots',
      type: 'array',
      admin: {
        description: '`robotId` または `seriesId` のどちらか一方だけを持つ（DEC-S08）。両方入力しても保存を止めない（domain validatorはTask 4以降で拡張）。',
      },
      fields: [
        { name: 'robotId', type: 'relationship', relationTo: 'robots' },
        { name: 'seriesId', type: 'relationship', relationTo: 'robot-series' },
        { name: 'fit', type: 'select', required: true, options: ['strong', 'possible', 'watch'] },
        {
          name: 'basis',
          type: 'select',
          required: true,
          options: ['deployment', 'adjacent-deployment', 'official-use-case', 'product-capability', 'market-signal', 'editorial-watch'],
        },
        { name: 'evidenceDeploymentIds', type: 'relationship', relationTo: 'deployments', hasMany: true },
        { name: 'evidenceSourceUrls', type: 'text', hasMany: true },
        { name: 'reason', type: 'textarea', required: true },
      ],
    },
  ],
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      createPublishGateHook({
        collectionSlug: 'use-cases',
        mapToDomain: async (candidate) => mapUseCaseCandidateToDomain(candidate as UseCaseCandidate),
        validateForPublish: (domain) => validateUseCaseForPublish(domain as Partial<UseCase>),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'use-cases' }),
    ],
    // Task 7 Step 3: publish後にpublicキャッシュを無効化する通知。
    afterChange: [createRevalidationAfterChangeHook('use-cases')],
  },
};
