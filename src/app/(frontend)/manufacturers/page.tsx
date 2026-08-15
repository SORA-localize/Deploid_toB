import { Suspense } from 'react';
import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { ManufacturerCardGridSkeleton } from '@/components/ManufacturerCardGridSkeleton';
import { ManufacturersBrowser } from '@/components/ManufacturersBrowser';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { withMeasuredLogoAspect } from '@/lib/manufacturerLogoEnrich';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { toInitialSearch } from '@/lib/catalog/urlSearch';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';
import { createManufacturerCatalogItems } from '@/lib/viewModels/manufacturers';

export const metadata = createPageMetadata({
  title: 'メーカー',
  description:
    'ヒューマノイド開発企業のディレクトリ。地域と相談ルートから、日本で検討しやすい企業を確認できます。',
  path: '/manufacturers',
});

function ManufacturersPageSkeleton() {
  return (
    <ListPageSkeletonShell>
      <ManufacturerCardGridSkeleton gridClassName={`mt-8 ${browserGridClassNames.manufacturers}`} />
    </ListPageSkeletonShell>
  );
}

async function ManufacturersContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const repository = await getContentRepository();
  const [manufacturers, robots] = await Promise.all([
    repository.listAllPublishedManufacturers(),
    repository.listAllPublishedRobots(),
  ]);
  const items = createManufacturerCatalogItems(manufacturers.map(withMeasuredLogoAspect), robots);
  const params = await pickSearchParams(searchParams, ['country', 'route', 'q'] as const);

  return (
    <ManufacturersBrowser
      items={items}
      initialSearch={toInitialSearch(params)}
    />
  );
}

export default function ManufacturersPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  return (
    <Suspense fallback={<ManufacturersPageSkeleton />}>
      <ManufacturersContent searchParams={searchParams} />
    </Suspense>
  );
}
