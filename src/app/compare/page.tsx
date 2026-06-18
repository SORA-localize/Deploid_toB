import { CompareClient } from '@/components/CompareClient';
import { getManufacturers, getRobots } from '@/lib/data';
import { normalizeCompareRobotIds } from '@/lib/compareParams';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: '比較',
  description: '候補のヒューマノイドロボットを、導入判断変数で横並びに比較できます。',
  path: '/compare',
});

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ compare?: string }>;
}) {
  const robots = getRobots();
  const manufacturers = getManufacturers();
  const { compare } = await searchParams;
  const selectedIds = normalizeCompareRobotIds(compare, robots);

  return (
    <CompareClient
      robots={robots}
      manufacturers={manufacturers}
      selectedIds={selectedIds}
    />
  );
}
