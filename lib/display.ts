import type {
  CompanyStatus,
  CompanyType,
  DeploymentStage,
  GuideStage,
  JapanAvailability,
  JapanPresence,
  Article,
  Manufacturer,
  ArticleSection,
  ArticleCategory,
  ArticleType,
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
  'France',
  'Canada',
  'Israel',
  'Spain',
  'Norway',
] as const;

export const guideStageOrder: GuideStage[] = ['learn', 'evaluate', 'act'];

export const articleTypeOrder: ArticleType[] = [
  'analysis',
  'deployment-report',
  'interview',
  'event-report',
  'policy-update',
  'case-study',
  'news-brief',
  'tech-update',
  'market-analysis',
];

/** 記事種別（category・第一軸）の表示順。完全性は articleCategoryLabels(Record) と validate の diff で担保。 */
export const articleCategoryOrder: ArticleCategory[] = [
  'news',
  'interview',
  'company-report',
  'analysis',
  'policy',
];

/** 記事タブ（section）の表示順。完全性は articleSectionLabels(Record) と validate の diff で担保。 */
export const articleSectionOrder: ArticleSection[] = [
  'deployment',
  'business',
  'tech',
  'policy',
  'entertainment',
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

export type RobotSortKey = 'featured' | 'home-featured' | 'stage' | 'japan' | 'name';

function compareNames(a: string, b: string) {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

function compareRobotCatalogNames(
  a: Robot,
  b: Robot,
  manufacturerById?: Map<string, Manufacturer>,
) {
  const aManufacturer = manufacturerById?.get(a.manufacturerId)?.name ?? a.manufacturerId;
  const bManufacturer = manufacturerById?.get(b.manufacturerId)?.name ?? b.manufacturerId;
  const manufacturerDiff = compareNames(aManufacturer, bManufacturer);
  if (manufacturerDiff !== 0) return manufacturerDiff;

  const nameDiff = compareNames(a.name, b.name);
  if (nameDiff !== 0) return nameDiff;
  return compareNames(a.slug, b.slug);
}

export function sortRobots(
  robots: Robot[],
  sort: RobotSortKey,
  manufacturers?: readonly Manufacturer[],
): Robot[] {
  const stageIndex = new Map(deploymentStageOrder.map((s, i) => [s, i]));
  const availIndex = new Map(japanAvailabilityOrder.map((s, i) => [s, i]));
  const manufacturerById = manufacturers
    ? new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]))
    : undefined;

  return [...robots].sort((a, b) => {
    if (sort === 'featured') {
      // featuredRank 昇順（未設定は最後）→ タイブレークは 'name' と完全同一。
      // 値を入れていなければ 'name' と数学的に同じ並びになる。
      const aRank = a.featuredRank ?? Number.POSITIVE_INFINITY;
      const bRank = b.featuredRank ?? Number.POSITIVE_INFINITY;
      if (aRank < bRank) return -1;
      if (aRank > bRank) return 1;
      return compareRobotCatalogNames(a, b, manufacturerById);
    }
    if (sort === 'home-featured') {
      // 1次: featuredRank 昇順（編集ピック。未設定は後ろ）
      const aRank = a.featuredRank ?? Number.POSITIVE_INFINITY;
      const bRank = b.featuredRank ?? Number.POSITIVE_INFINITY;
      if (aRank !== bRank) return aRank - bRank;
      // 2次: deploymentStage（production が最上位）
      const stageDiff =
        (stageIndex.get(a.deploymentStage) ?? Number.MAX_SAFE_INTEGER) -
        (stageIndex.get(b.deploymentStage) ?? Number.MAX_SAFE_INTEGER);
      if (stageDiff !== 0) return stageDiff;
      // 3次: updatedAt 降順（新しいデータを優先）
      return b.updatedAt.localeCompare(a.updatedAt);
    }
    if (sort === 'stage') {
      const stageDiff =
        (stageIndex.get(a.deploymentStage) ?? Number.MAX_SAFE_INTEGER) -
        (stageIndex.get(b.deploymentStage) ?? Number.MAX_SAFE_INTEGER);
      if (stageDiff !== 0) return stageDiff;
      const availDiff =
        (availIndex.get(a.japanAvailability) ?? Number.MAX_SAFE_INTEGER) -
        (availIndex.get(b.japanAvailability) ?? Number.MAX_SAFE_INTEGER);
      if (availDiff !== 0) return availDiff;
      return compareRobotCatalogNames(a, b, manufacturerById);
    }
    if (sort === 'japan') {
      const availDiff =
        (availIndex.get(a.japanAvailability) ?? Number.MAX_SAFE_INTEGER) -
        (availIndex.get(b.japanAvailability) ?? Number.MAX_SAFE_INTEGER);
      if (availDiff !== 0) return availDiff;
      return compareRobotCatalogNames(a, b, manufacturerById);
    }
    // 'name'
    return compareRobotCatalogNames(a, b, manufacturerById);
  });
}

// ─── 記事並び替え ────────────────────────────────────────────────

/** 記事を公開日の新しい順に並べるコンパレータ（正本）。各所での直書きを禁止し本関数を使う。 */
export const byArticlePublishedDesc = (a: Article, b: Article) =>
  b.publishedAt.localeCompare(a.publishedAt);

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
        (presenceIndex.get(a.japanPresence) ?? Number.MAX_SAFE_INTEGER) -
        (presenceIndex.get(b.japanPresence) ?? Number.MAX_SAFE_INTEGER);
      if (presenceDiff !== 0) return presenceDiff;
      return compareNames(a.name, b.name);
    }
    if (sort === 'founded') {
      const aYear = a.foundedYear ?? 9999;
      const bYear = b.foundedYear ?? 9999;
      if (aYear !== bYear) return aYear - bYear;
      return compareNames(a.name, b.name);
    }
    // 'name'
    return compareNames(a.name, b.name);
  });
}
