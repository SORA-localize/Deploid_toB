import type { DeploymentStage } from '@/data/types';
import { isPreReleaseDeploymentStage, japanAvailabilityOrder, sortByDisplayOrder } from '@/lib/display';
import { matchesTag, normalizeTagKey, toTagOptions } from '@/lib/tags';
import { isOneOf } from '@/lib/typeGuards';
import type { RobotCatalogItem } from '@/lib/viewModels/robots';
import { matchesCatalogSearchText } from '@/lib/viewModels/shared';

export function getRobotFilterOptions(items: readonly RobotCatalogItem[]) {
  const availabilityValues = sortByDisplayOrder(
    Array.from(new Set(items.map((item) => item.filter.japanAvailability))),
    japanAvailabilityOrder,
  );

  return {
    industries: toTagOptions(
      items.flatMap((item) => item.filter.industryTags),
      'industry',
    ),
    availabilityValues,
  };
}

export function normalizeRobotFilters({
  industry,
  manufacturer,
  availability,
  query,
  items,
  industryValues,
  availabilityValues,
}: {
  industry: string | null | undefined;
  manufacturer: string | null | undefined;
  availability: string | null | undefined;
  query: string | null | undefined;
  items: readonly RobotCatalogItem[];
  industryValues: readonly string[];
  availabilityValues: readonly string[];
}) {
  const manufacturerIds = new Set(items.map((item) => item.filter.manufacturerId));
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

/** 1体のロボットが現在のフィルタに合致するか。excludeAxis はファセット件数計算用（その軸だけ判定から外す）。 */
function matchesRobotFilters(
  item: RobotCatalogItem,
  filters: RobotFilters,
  excludeAxis?: RobotFilterAxis,
) {
  if (excludeAxis !== 'industry' && !matchesTag(item.filter.industryTags, filters.industry)) return false;
  if (
    excludeAxis !== 'manufacturer' &&
    filters.manufacturer !== 'all' &&
    item.filter.manufacturerId !== filters.manufacturer
  ) {
    return false;
  }
  if (
    excludeAxis !== 'availability' &&
    filters.availability !== 'all' &&
    item.filter.japanAvailability !== filters.availability
  ) {
    return false;
  }
  return matchesCatalogSearchText(filters.query, item.filter.searchText);
}

export function filterRobots({
  items,
  filters,
}: {
  items: readonly RobotCatalogItem[];
  filters: RobotFilters;
}) {
  const filtered = items.filter((item) => matchesRobotFilters(item, filters));

  // 販売中/開発中は相互排他のビュー（タブ）ではなく、常時表示する2セクション。
  // items はサーバー側（createRobotCatalogItemsへ渡すrobotsの並び）で既に 'featured' 順に
  // ソート済みという前提。フィルタは相対順序を保つので、ここでは再ソートしない。
  const activeRobots = filtered.filter(
    (item) => !isPreReleaseDeploymentStage(item.filter.deploymentStage as DeploymentStage),
  );
  const preReleaseRobots = filtered.filter((item) =>
    isPreReleaseDeploymentStage(item.filter.deploymentStage as DeploymentStage),
  );

  return { activeRobots, preReleaseRobots };
}

/**
 * ファセット件数: 各選択肢について「その軸以外の現在の絞り込み（キーワード検索含む）を
 * 適用した該当数」を返す。`allCount` は各軸の「すべて」選択肢用。
 * industry タグは意図的に非MECE（tagRegistry 参照）のため、1体が複数の選択肢に数えられる。
 */
export function getRobotFacetCounts({
  items,
  filters,
}: {
  items: readonly RobotCatalogItem[];
  filters: RobotFilters;
}) {
  const candidatesFor = (axis: RobotFilterAxis) =>
    items.filter((item) => matchesRobotFilters(item, filters, axis));

  const countBy = (
    candidates: readonly RobotCatalogItem[],
    getKeys: (item: RobotCatalogItem) => readonly string[],
  ) => {
    const counts = new Map<string, number>();
    for (const item of candidates) {
      // 1体を同じ選択肢に二重加算しない（正規化で同一キーに潰れるタグ対策）
      for (const key of new Set(getKeys(item))) {
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
      counts: countBy(industryCandidates, (item) => item.filter.industryTags.map(normalizeTagKey)),
      allCount: industryCandidates.length,
    },
    manufacturer: {
      counts: countBy(manufacturerCandidates, (item) => [item.filter.manufacturerId]),
      allCount: manufacturerCandidates.length,
    },
    availability: {
      counts: countBy(availabilityCandidates, (item) => [item.filter.japanAvailability]),
      allCount: availabilityCandidates.length,
    },
  };
}
