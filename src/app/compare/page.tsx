import { CompareClient } from '@/components/CompareClient';
import { CompareSummaryTable } from '@/components/seo/CompareSummaryTable';
import { getManufacturers, getRobots } from '@/lib/data';
import { normalizeCompareRobotIds } from '@/lib/compareParams';
import { sortRobots } from '@/lib/display';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = {
  title: '比較',
  description: '候補のヒューマノイドロボットを、導入判断変数で横並びに比較できます。',
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  const robots = getRobots();
  const manufacturers = getManufacturers();
  const params = await pickSearchParams(searchParams, ['compare'] as const);
  const selectedIds = normalizeCompareRobotIds(params.compare, robots);
  const robotById = new Map(robots.map((robot) => [robot.id, robot]));
  const summaryRobots =
    selectedIds.length > 0
      ? selectedIds.flatMap((id) => {
          const robot = robotById.get(id);
          return robot ? [robot] : [];
        })
      : sortRobots(robots, 'name', manufacturers);

  return (
    <>
      <CompareSummaryTable robots={summaryRobots} manufacturers={manufacturers} />
      <CompareClient
        robots={robots}
        manufacturers={manufacturers}
        selectedIds={selectedIds}
      />
    </>
  );
}
