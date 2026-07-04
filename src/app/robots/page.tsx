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
    'ヒューマノイドロボットのカタログ。業種・タスク・メーカー・国内入手性で絞り込み、導入判断に必要な変数で比較できます。',
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
  task,
  manufacturer,
  availability,
  release,
  query,
}: {
  industry: string | null;
  task: string | null;
  manufacturer: string;
  availability: string;
  release: string;
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
      initialFilters={{ industry, task, manufacturer, availability, release, query }}
    />
  );
}

async function RobotsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const robots = getRobots();
  const manufacturers = getManufacturers();
  const params = await pickSearchParams(searchParams, [
    'industry',
    'task',
    'manufacturer',
    'availability',
    'release',
    'q',
  ] as const);
  const filterOptions = getRobotFilterOptions(robots);
  const filters = normalizeRobotFilters({
    industry: params.industry,
    task: params.task,
    manufacturer: params.manufacturer,
    availability: params.availability,
    release: params.release,
    query: params.q,
    manufacturers,
    industryValues: filterOptions.industries.map((option) => option.value),
    taskValues: filterOptions.tasks.map((option) => option.value),
    availabilityValues: filterOptions.availabilityValues,
  });

  return (
    <CachedRobotsList
      industry={filters.industry}
      task={filters.task}
      manufacturer={filters.manufacturer}
      availability={filters.availability}
      release={filters.release}
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
