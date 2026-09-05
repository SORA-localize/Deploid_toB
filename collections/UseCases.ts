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
import {
  applyAdminFieldLabels,
  useCasesAtAGlanceFieldLabels,
  useCasesCandidateRobotsFieldLabels,
  useCasesCapabilityNotesFieldLabels,
  useCasesFieldLabels,
} from '../lib/payload/adminFieldLabels';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain } from '../lib/content/payloadMappers';
import type { UseCase } from '../lib/content/domainTypes';
import { contentPublishAdminComponents } from '../lib/payload/adminPublishComponents';
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
    throw new PublishValidationError(missing, 'use-cases');
  }
}

export const UseCases: CollectionConfig = {
  slug: 'use-cases',
  admin: { useAsTitle: 'title', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: applyAdminFieldLabels(
    [
      ...baseContentFields(),
      ...baseRecordContentFields(),
      { name: 'title', type: 'text', required: true },
      { name: 'titleJa', type: 'text' },
      { name: 'subtitle', type: 'text' },
      {
        name: 'maturityLevel',
        type: 'select',
        required: true,
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
        required: true,
        options: ['indoor-controlled', 'indoor-semi-controlled', 'outdoor', 'mixed', 'hazardous'],
      },
      {
        name: 'requiredCapabilities',
        type: 'select',
        required: true,
        hasMany: true,
        options: ['mobility', 'manipulation', 'perception', 'autonomy', 'communication', 'data-capture', 'integration'],
      },
      { name: 'primaryIndustry', type: 'text', required: true },
      { name: 'industryTags', type: 'text', hasMany: true },
      { name: 'taskTags', type: 'text', hasMany: true },
      {
        name: 'atAGlance',
        type: 'group',
        fields: applyAdminFieldLabels(
          [
            { name: 'whereFits', type: 'textarea' },
            { name: 'whereDoesNotFit', type: 'textarea' },
            { name: 'mustBeTrue', type: 'textarea' },
          ],
          useCasesAtAGlanceFieldLabels,
        ),
      },
      { name: 'overview', type: 'textarea', required: true },
      { name: 'whyItMatters', type: 'textarea', required: true },
      {
        name: 'capabilityNotes',
        type: 'group',
        fields: applyAdminFieldLabels(
          [
            { name: 'mobility', type: 'textarea' },
            { name: 'manipulation', type: 'textarea' },
            { name: 'perception', type: 'textarea' },
            { name: 'autonomy', type: 'textarea' },
            { name: 'communication', type: 'textarea' },
            { name: 'integration', type: 'textarea' },
          ],
          useCasesCapabilityNotesFieldLabels,
        ),
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
        fields: applyAdminFieldLabels(
          [
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
          useCasesCandidateRobotsFieldLabels,
        ),
      },
    ],
    useCasesFieldLabels,
  ),
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
