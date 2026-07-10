import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { CardGridSkeleton } from '@/components/CardGridSkeleton';
import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { RobotsBrowser } from '@/components/RobotsBrowser';
import { getManufacturers, getRobots } from '@/lib/data';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { createPageMetadata } from '@/lib/metadata';
import {
  getRobotFilterOptions,
  normalizeRobotFilters,
} from '@/lib/robotFilters';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

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

  const robots = getRobots();
  const manufacturers = getManufacturers();

  return (
    <RobotsBrowser
      robots={robots}
      manufacturers={manufacturers}
      initialFilters={{ industry, manufacturer, availability, query }}
    />
  );
}

async function RobotsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const robots = getRobots();
  const manufacturers = getManufacturers();
  const params = await pickSearchParams(searchParams, [
    'industry',
    'manufacturer',
    'availability',
    'q',
  ] as const);
  const filterOptions = getRobotFilterOptions(robots);
  const filters = normalizeRobotFilters({
    industry: params.industry,
    manufacturer: params.manufacturer,
    availability: params.availability,
    query: params.q,
    manufacturers,
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
