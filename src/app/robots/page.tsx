import { RobotsBrowser } from '@/components/RobotsBrowser';
import { getManufacturers, getRobots } from '@/lib/data';
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

export default async function RobotsPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
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
    <RobotsBrowser
      robots={robots}
      manufacturers={manufacturers}
      initialFilters={filters}
    />
  );
}
