import type {
  CompanyStatus,
  CompanyType,
  DeploymentStage,
  GuideStage,
  JapanAvailability,
  JapanPresence,
  Manufacturer,
  ReportType,
  Robot,
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

export const deploymentStageOrder: DeploymentStage[] = [
  'production',
  'limited-production',
  'pilot',
  'concept',
  'prototype',
  'internal-use',
  'discontinued',
];

export const japanPresenceOrder: JapanPresence[] = [
  'office',
  'distributor',
  'partner',
  'remote',
  'none',
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

export const manufacturerCountryOrder = [
  'Japan',
  'USA',
  'China',
  'Germany',
  'Canada',
  'Spain',
  'Norway',
] as const;

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

// ─── ロボット並び替え ────────────────────────────────────────────

export type RobotSortKey = 'stage' | 'japan' | 'name';

export function sortRobots(robots: Robot[], sort: RobotSortKey): Robot[] {
  const stageIndex = new Map(deploymentStageOrder.map((s, i) => [s, i]));
  const availIndex = new Map(japanAvailabilityOrder.map((s, i) => [s, i]));

  return [...robots].sort((a, b) => {
    if (sort === 'stage') {
      const stageDiff =
        (stageIndex.get(a.deploymentStage) ?? 99) -
        (stageIndex.get(b.deploymentStage) ?? 99);
      if (stageDiff !== 0) return stageDiff;
      const availDiff =
        (availIndex.get(a.japanAvailability) ?? 99) -
        (availIndex.get(b.japanAvailability) ?? 99);
      if (availDiff !== 0) return availDiff;
      return a.name.localeCompare(b.name, 'en');
    }
    if (sort === 'japan') {
      const availDiff =
        (availIndex.get(a.japanAvailability) ?? 99) -
        (availIndex.get(b.japanAvailability) ?? 99);
      if (availDiff !== 0) return availDiff;
      return a.name.localeCompare(b.name, 'en');
    }
    // 'name'
    return a.name.localeCompare(b.name, 'en');
  });
}

// ─── メーカー並び替え ────────────────────────────────────────────

export type ManufacturerSortKey = 'japan' | 'name' | 'founded';

export function sortManufacturers(
  manufacturers: Manufacturer[],
  sort: ManufacturerSortKey,
): Manufacturer[] {
  const presenceIndex = new Map(japanPresenceOrder.map((s, i) => [s, i]));

  return [...manufacturers].sort((a, b) => {
    if (sort === 'japan') {
      const presenceDiff =
        (presenceIndex.get(a.japanPresence) ?? 99) -
        (presenceIndex.get(b.japanPresence) ?? 99);
      if (presenceDiff !== 0) return presenceDiff;
      return a.name.localeCompare(b.name, 'en');
    }
    if (sort === 'founded') {
      const aYear = a.foundedYear ?? 9999;
      const bYear = b.foundedYear ?? 9999;
      if (aYear !== bYear) return aYear - bYear;
      return a.name.localeCompare(b.name, 'en');
    }
    // 'name'
    return a.name.localeCompare(b.name, 'en');
  });
}
