import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { CompareClient } from '@/components/CompareClient';
import { getManufacturers, getRobots } from '@/lib/data';
import { normalizeCompareRobotIds } from '@/lib/compareParams';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: '比較',
  description: '候補のヒューマノイドロボットを、導入判断変数で横並びに比較できます。',
  path: '/compare',
});

async function CompareContent({
  searchParams,
}: {
  searchParams: Promise<{ compare?: string; view?: string }>;
}) {
  const robots = getRobots();
  const manufacturers = getManufacturers();
  const { compare, view } = await searchParams;
  const selectedIds = normalizeCompareRobotIds(compare, robots);

  return (
    <CompareClient
      robots={robots}
      manufacturers={manufacturers}
      selectedIds={selectedIds}
      initialView={view === 'specs' ? 'specs' : 'visual'}
    />
  );
}

export default function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ compare?: string; view?: string }>;
}) {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <CompareContent searchParams={searchParams} />
    </Suspense>
  );
}
