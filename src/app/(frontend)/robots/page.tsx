import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { CardGridSkeleton } from '@/components/CardGridSkeleton';
import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { RobotsBrowser } from '@/components/RobotsBrowser';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { toInitialSearch } from '@/lib/catalog/urlSearch';
import { sortRobots } from '@/lib/display';
import { createPageMetadata } from '@/lib/metadata';
import {
  getRobotFilterOptions,
  normalizeRobotFilters,
} from '@/lib/robotFilters';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

/** 一覧の並び順（'featured'）はここで一度だけ確定させ、以降（filterRobots等）は
 *  相対順序を保つだけにする。VM化でクライアント側はRobot/Manufacturerを持たないため
 *  sortRobots('featured')をここで済ませてからcreateRobotCatalogItemsへ渡す。 */
async function createFeaturedRobotCatalogItems() {
  const repository = await getContentRepository();
  const [manufacturers, robotsRaw, useCases] = await Promise.all([
    repository.listAllPublishedManufacturers(),
    repository.listAllPublishedRobots(),
    repository.listAllPublishedUseCases(),
  ]);
  const robots = sortRobots(robotsRaw, 'featured', manufacturers);
  return createRobotCatalogItems(robots, manufacturers, useCases);
}

export const metadata = createPageMetadata({
  title: 'ロボット',
  description:
    'ヒューマノイドロボットのカタログ。業種・メーカー・国内入手性で絞り込み、導入判断に必要な変数で比較できます。',
  path: '/robots',
});

function RobotsPageSkeleton() {
  return (
    <ListPageSkeletonShell>
      <CardGridSkeleton gridClassName={`mt-8 ${browserGridClassNames.robots}`} />
    </ListPageSkeletonShell>
  );
}

async function CachedRobotsList({
  industry,
  manufacturer,
  availability,
  query,
}: {
  industry: string | null;
  manufacturer: string;
  availability: string;
  query: string;
}) {
  'use cache';
  cacheLife('hours');
  cacheTag('robots-list');

  const items = await createFeaturedRobotCatalogItems();

  return (
    <RobotsBrowser
      items={items}
      initialSearch={toInitialSearch({
        industry,
        manufacturer: manufacturer === 'all' ? null : manufacturer,
        availability: availability === 'all' ? null : availability,
        q: query,
      })}
    />
  );
}

async function RobotsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const items = await createFeaturedRobotCatalogItems();
  const params = await pickSearchParams(searchParams, [
    'industry',
    'manufacturer',
    'availability',
    'q',
  ] as const);
  const filterOptions = getRobotFilterOptions(items);
  const filters = normalizeRobotFilters({
    industry: params.industry,
    manufacturer: params.manufacturer,
    availability: params.availability,
    query: params.q,
    items,
    industryValues: filterOptions.industries.map((option) => option.value),
    availabilityValues: filterOptions.availabilityValues,
  });

  return (
    <CachedRobotsList
      industry={filters.industry}
      manufacturer={filters.manufacturer}
      availability={filters.availability}
      query={filters.query}
    />
  );
}

export default function RobotsPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  return (
    <Suspense fallback={<RobotsPageSkeleton />}>
      <RobotsContent searchParams={searchParams} />
    </Suspense>
  );
}
