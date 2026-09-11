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
  useCasesCandidateRobotsRowLabels,
  useCasesCapabilityNotesFieldLabels,
  useCasesFieldLabels,
} from '../lib/payload/adminFieldLabels';
import { partitionFieldsByName, withSidebarPosition } from '../lib/payload/adminFieldLayout';
import { ADMIN_PUBLISH_INTENT_FIELD } from '../lib/payload/adminPublishIntent';
import {
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
import { createAdminPreview } from '../lib/payload/adminPreview';
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

/**
 * T3（`docs/archive/admin-layout-rollout-plan-v1.md`、設計は
 * `docs/decisions/admin-field-layout-v1.md` §3 UseCases）: 運用頻度で3層に分けた配置。
 * `sidebar`はTier3（滅多に触らない運用メタ）、tabはTier1（基本情報）→Tier2（詳細分析）→
 * Tier3（出典・SEO）の順。Manufacturers/Robots/Articles POCと同じ構成——
 * 名前の集合はこのファイル内で閉じており、抜けがあれば起動時にthrowする。
 */
const SIDEBAR_FIELD_NAMES = ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'] as const;
const BASIC_INFO_TAB_FIELD_NAMES = [
  'title',
  'titleJa',
  'subtitle',
  'maturityLevel',
  'environment',
  'requiredCapabilities',
  'primaryIndustry',
  'industryTags',
  'taskTags',
  'summary',
  'overview',
  'whyItMatters',
] as const;
const DETAILED_ANALYSIS_TAB_FIELD_NAMES = [
  'atAGlance',
  'capabilityNotes',
  'environmentRequirements',
  'whyHardToday',
  'japanDeploymentConditions',
  'candidateRobots',
] as const;
const SOURCES_SEO_TAB_FIELD_NAMES = ['sources', 'reliability', 'seo'] as const;

const useCasesAllFields = applyAdminFieldLabels(
  [
      ...baseContentFields(),
      ...baseRecordContentFields({ heroImage: false }),
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
        // `src/app/(frontend)/use-cases/[slug]/page.tsx`の`buildUseCaseDetailData()`は
        // 「seriesId候補はrobotId単位のこのpageではまだ描画対象外」と明記しており、
        // `robotId`を持つ行だけを解決する。`seriesId`だけの行は現状ページに出ない
        // （外部監査で発覚・2026-09-05訂正）。
        labels: useCasesCandidateRobotsRowLabels,
        admin: {
          description: {
            ja: '候補ロボット。用途詳細ページの「候補ロボット」欄に表示されますが、**現状「ロボット本体」を選んだ行だけが表示され、「シリーズ」だけを選んだ行は表示されません**。',
            en: 'Candidate robots. Shown in the "Candidate robots" section of the use case detail page — but currently **only rows with a specific robot render; series-only rows do not appear yet**.',
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
);

const { matched: sidebarFields, rest: afterSidebar } = partitionFieldsByName(useCasesAllFields, SIDEBAR_FIELD_NAMES);
const { matched: basicInfoTabFields, rest: afterBasicInfo } = partitionFieldsByName(afterSidebar, BASIC_INFO_TAB_FIELD_NAMES);
const { matched: detailedAnalysisTabFields, rest: afterDetailedAnalysis } = partitionFieldsByName(
  afterBasicInfo,
  DETAILED_ANALYSIS_TAB_FIELD_NAMES,
);
const { matched: sourcesSeoTabFields, rest: unplacedFields } = partitionFieldsByName(afterDetailedAnalysis, SOURCES_SEO_TAB_FIELD_NAMES);

/**
 * `unplacedFields`は`admin.hidden`な`adminPublishIntentField()`だけのはず
 * （表示場所を持たない）。それ以外が残っていたら、上記4つの名前リストへの追加漏れ——
 * 編集画面のどこにも表示されない field が生まれるので、起動時に気づけるようにする。
 */
const unexpectedlyUnplacedFields = unplacedFields.filter(
  (field) => (field as { name?: string }).name !== ADMIN_PUBLISH_INTENT_FIELD,
);
if (unexpectedlyUnplacedFields.length > 0) {
  throw new Error(
    `UseCases admin field layout: unplaced field(s) — add to a tab/sidebar name list: ${unexpectedlyUnplacedFields
      .map((f) => (f as { name?: string }).name)
      .join(', ')}`,
  );
}

export const UseCases: CollectionConfig = {
  slug: 'use-cases',
  // 公開サイトの表記に合わせる（lib/uiText.ts の useCases.title/breadcrumb = '用途'）。
  labels: { singular: { ja: '用途', en: 'Use case' }, plural: { ja: '用途', en: 'Use cases' } },
  admin: {
    useAsTitle: 'title',
    components: contentPublishAdminComponents,
    preview: createAdminPreview('use-cases'),
  },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...unplacedFields,
    ...withSidebarPosition(sidebarFields),
    {
      type: 'tabs',
      tabs: [
        { label: { ja: '基本情報', en: 'Basic info' }, fields: basicInfoTabFields },
        { label: { ja: '詳細分析', en: 'Detailed analysis' }, fields: detailedAnalysisTabFields },
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
