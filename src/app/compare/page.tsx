import { CompareClient } from '@/components/CompareClient';
import { getManufacturers, getRobots } from '@/lib/data';
import { normalizeCompareRobotIds } from '@/lib/compareParams';
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

  return (
    <CompareClient
      robots={robots}
      manufacturers={manufacturers}
      selectedIds={selectedIds}
    />
  );
}
