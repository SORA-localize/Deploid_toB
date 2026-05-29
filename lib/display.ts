import type {
  CompanyStatus,
  CompanyType,
  DeploymentStage,
  GuideStage,
  JapanAvailability,
  ReportType,
  RobotCategory,
} from '@/data/types';

export const robotCategoryOrder: RobotCategory[] = [
  'humanoid',
  'general-purpose-robot',
  'upper-body-humanoid',
  'mobile-manipulator',
  'other',
];

export const japanAvailabilityOrder: JapanAvailability[] = [
  'official-japan',
  'distributor-japan',
  'inquiry-required',
  'import-only',
  'unavailable',
  'unknown',
];

export const companyTypeOrder: CompanyType[] = [
  'manufacturer',
  'distributor',
  'integrator',
  'ai-os',
  'research',
];

export const companyStatusOrder: CompanyStatus[] = [
  'active',
  'stealth',
  'acquired',
  'inactive',
];

export const manufacturerCountryOrder = ['Japan', 'USA', 'China', 'Norway'] as const;

export const guideStageOrder: GuideStage[] = ['learn', 'evaluate', 'act'];

export const reportTypeOrder: ReportType[] = [
  'analysis',
  'deployment-report',
  'interview',
  'event-report',
  'policy-update',
  'case-study',
  'news-brief',
];

const preReleaseDeploymentStages: DeploymentStage[] = ['concept', 'prototype'];

export function isPreReleaseDeploymentStage(stage: DeploymentStage) {
  return preReleaseDeploymentStages.includes(stage);
}

export function sortByDisplayOrder<T extends string>(
  values: readonly T[],
  order: readonly string[],
) {
  const orderIndex = new Map(order.map((value, index) => [value, index]));

  return [...values].sort((a, b) => {
    const aIndex = orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b, 'ja');
  });
}
