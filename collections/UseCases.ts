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
import {
  useCaseBuyerReadinessSelectOptions,
  useCaseCandidateRobotBasisSelectOptions,
  useCaseCandidateRobotFitSelectOptions,
  useCaseEnvironmentSelectOptions,
  useCaseMaturityLevelSelectOptions,
  useCaseRequiredCapabilitySelectOptions,
} from '../lib/payload/adminSelectLabels';
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
        options: useCaseMaturityLevelSelectOptions,
      },
      {
        name: 'buyerReadiness',
        type: 'select',
        options: useCaseBuyerReadinessSelectOptions,
        // Robotsからは削除済み（DEC-S05）。UseCaseにはこのfield自体は残すが、
        // 公開UI側の消費箇所が無い状態（下記description参照）。
        admin: {
          description: {
            ja: '導入検討度。現状、公開ページのどこにも表示されていません（社内の分類用）。',
            en: 'Buyer readiness. Not currently shown anywhere on the public site — used for internal classification only.',
          },
        },
      },
      {
        name: 'environment',
        type: 'select',
        required: true,
        options: useCaseEnvironmentSelectOptions,
      },
      {
        name: 'requiredCapabilities',
        type: 'select',
        required: true,
        hasMany: true,
        options: useCaseRequiredCapabilitySelectOptions,
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
        // DEC-S08: `robotId`/`seriesId`はどちらか一方だけを想定した設計だが、両方入力しても
        // 現状の保存処理は止めない（domain validator側での強制はTask 4以降の拡張候補）。
        admin: {
          description: {
            ja: '候補ロボット。用途詳細ページの「候補ロボット」欄に表示されます。ロボット本体か、シリーズかのどちらか一方を選んでください。',
            en: 'Candidate robots. Shown in the "Candidate robots" section of the use case detail page. Choose either a specific robot or a series, not both.',
          },
        },
        fields: applyAdminFieldLabels(
          [
            { name: 'robotId', type: 'relationship', relationTo: 'robots' },
            { name: 'seriesId', type: 'relationship', relationTo: 'robot-series' },
            { name: 'fit', type: 'select', required: true, options: useCaseCandidateRobotFitSelectOptions },
            {
              name: 'basis',
              type: 'select',
              required: true,
              options: useCaseCandidateRobotBasisSelectOptions,
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
