import type { Manufacturer, Robot } from '@/data/types';
import { isPreReleaseDeploymentStage, japanAvailabilityOrder, sortByDisplayOrder, sortRobots } from '@/lib/display';
import { createRobotSearchDocument, matchesSearchDocument } from '@/lib/search';
import { getRobotIndustryTagOptions, matchesTag, normalizeTagKey } from '@/lib/tags';
import { isOneOf } from '@/lib/typeGuards';

export function getRobotFilterOptions(robots: readonly Robot[]) {
  const availabilityValues = sortByDisplayOrder(
    Array.from(new Set(robots.map((robot) => robot.japanAvailability))),
    japanAvailabilityOrder,
  );

  return {
    industries: getRobotIndustryTagOptions(robots),
    availabilityValues,
  };
}

export function normalizeRobotFilters({
  industry,
  manufacturer,
  availability,
  query,
  manufacturers,
  industryValues,
  availabilityValues,
}: {
  industry: string | null | undefined;
  manufacturer: string | null | undefined;
  availability: string | null | undefined;
  query: string | null | undefined;
  manufacturers: readonly Manufacturer[];
  industryValues: readonly string[];
  availabilityValues: readonly Robot['japanAvailability'][];
}) {
  const manufacturerIds = new Set(manufacturers.map((item) => item.id));
  const normalizedIndustry = industry ? normalizeTagKey(industry) : null;

  return {
    industry:
      normalizedIndustry && industryValues.includes(normalizedIndustry) ? normalizedIndustry : null,
    manufacturer:
      manufacturer && manufacturerIds.has(manufacturer) ? manufacturer : 'all',
    availability: isOneOf(availability, availabilityValues) ? availability : 'all',
    query: query ?? '',
  };
}

type RobotFilters = ReturnType<typeof normalizeRobotFilters>;
type RobotFilterAxis = 'industry' | 'manufacturer' | 'availability';

function buildSearchDocuments(robots: readonly Robot[], manufacturers: readonly Manufacturer[]) {
  const manufacturerById = new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]));
  return new Map(
    robots.map((robot) => [
      robot.slug,
      createRobotSearchDocument(robot, manufacturerById.get(robot.manufacturerId)),
    ]),
  );
}

/** 1体のロボットが現在のフィルタに合致するか。excludeAxis はファセット件数計算用（その軸だけ判定から外す）。 */
function matchesRobotFilters(
  robot: Robot,
  filters: RobotFilters,
  searchDocument: ReturnType<typeof createRobotSearchDocument> | undefined,
  excludeAxis?: RobotFilterAxis,
) {
  if (excludeAxis !== 'industry' && !matchesTag(robot.industryTags ?? [], filters.industry)) return false;
  if (excludeAxis !== 'manufacturer' && filters.manufacturer !== 'all' && robot.manufacturerId !== filters.manufacturer) return false;
  if (excludeAxis !== 'availability' && filters.availability !== 'all' && robot.japanAvailability !== filters.availability) return false;
  return matchesSearchDocument(filters.query, searchDocument);
}

export function filterRobots({
  robots,
  manufacturers,
  filters,
}: {
  robots: readonly Robot[];
  manufacturers: readonly Manufacturer[];
  filters: RobotFilters;
}) {
  const searchDocuments = buildSearchDocuments(robots, manufacturers);
  const filtered = robots.filter((robot) =>
    matchesRobotFilters(robot, filters, searchDocuments.get(robot.slug)),
  );

  // 販売中/開発中は相互排他のビュー（タブ）ではなく、常時表示する2セクション。
  const releaseCandidates = sortRobots([...filtered], 'featured', manufacturers);
  const activeRobots = releaseCandidates.filter(
    (robot) => !isPreReleaseDeploymentStage(robot.deploymentStage),
  );
  const preReleaseRobots = releaseCandidates.filter((robot) =>
    isPreReleaseDeploymentStage(robot.deploymentStage),
  );

  return { activeRobots, preReleaseRobots };
}

/**
 * ファセット件数: 各選択肢について「その軸以外の現在の絞り込み（キーワード検索含む）を
 * 適用した該当数」を返す。`allCount` は各軸の「すべて」選択肢用。
 * industry タグは意図的に非MECE（tagRegistry 参照）のため、1体が複数の選択肢に数えられる。
 */
export function getRobotFacetCounts({
  robots,
  manufacturers,
  filters,
}: {
  robots: readonly Robot[];
  manufacturers: readonly Manufacturer[];
  filters: RobotFilters;
}) {
  const searchDocuments = buildSearchDocuments(robots, manufacturers);
  const candidatesFor = (axis: RobotFilterAxis) =>
    robots.filter((robot) => matchesRobotFilters(robot, filters, searchDocuments.get(robot.slug), axis));

  const countBy = (items: readonly Robot[], getKeys: (robot: Robot) => readonly string[]) => {
    const counts = new Map<string, number>();
    for (const robot of items) {
      // 1体を同じ選択肢に二重加算しない（正規化で同一キーに潰れるタグ対策）
      for (const key of new Set(getKeys(robot))) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return counts;
  };

  const industryCandidates = candidatesFor('industry');
  const manufacturerCandidates = candidatesFor('manufacturer');
  const availabilityCandidates = candidatesFor('availability');

  // 選択肢の value は normalizeTagKey 済み（lib/tags.ts の toTagOptions）なので、集計キーも正規化して揃える
  return {
    industry: {
      counts: countBy(industryCandidates, (robot) => (robot.industryTags ?? []).map(normalizeTagKey)),
      allCount: industryCandidates.length,
    },
    manufacturer: {
      counts: countBy(manufacturerCandidates, (robot) => [robot.manufacturerId]),
      allCount: manufacturerCandidates.length,
    },
    availability: {
      counts: countBy(availabilityCandidates, (robot) => [robot.japanAvailability]),
      allCount: availabilityCandidates.length,
    },
  };
}
