import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { CompareClient } from '@/components/CompareClient';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { toInitialSearch } from '@/lib/catalog/urlSearch';
import { createPageMetadata } from '@/lib/metadata';
import { createCompareManufacturerViewModel, createCompareRobotViewModel } from '@/lib/viewModels/compare';

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
  const repository = await getContentRepository();
  const [robotsRaw, manufacturersRaw] = await Promise.all([
    repository.listAllPublishedRobots(),
    repository.listAllPublishedManufacturers(),
  ]);
  const robots = robotsRaw.map(createCompareRobotViewModel);
  const manufacturers = manufacturersRaw.map(createCompareManufacturerViewModel);
  const { compare, view } = await searchParams;

  return (
    <CompareClient
      robots={robots}
      manufacturers={manufacturers}
      initialSearch={toInitialSearch({ compare: compare ?? null, view: view ?? null })}
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
