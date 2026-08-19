import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { ManufacturerCardGridSkeleton } from '@/components/ManufacturerCardGridSkeleton';
import { ManufacturersBrowser } from '@/components/ManufacturersBrowser';
import { contentTags } from '@/lib/content/cacheTags';
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

async function createManufacturerItems() {
  const repository = await getContentRepository();
  const [manufacturers, robots] = await Promise.all([
    repository.listAllPublishedManufacturers(),
    repository.listAllPublishedRobots(),
  ]);
  return createManufacturerCatalogItems(manufacturers.map(withMeasuredLogoAspect), robots);
}

/**
 * Manufacturer一覧の依存表（`lib/content/cacheDependencies.ts`）: manufacturers, robots。
 * briefの依存表は`manufacturers, media`だが、`media`は含めない——`Media` collectionは
 * サイト上のどのpageからも読まれていない（fix round 1 / Critical 2と同じ理由、`KNOWN_GAPS`
 * 参照）。代わりに実装（`createManufacturerItems`）が実際に読む`listAllPublishedRobots`
 * （cardへ機種数を埋め込む、`createManufacturerCatalogItems`）を足す。
 */
async function CachedManufacturersList({ initialSearch }: { initialSearch: ReturnType<typeof toInitialSearch> }) {
  'use cache';
  cacheLife('hours');
  cacheTag(contentTags.manufacturers);
  cacheTag(contentTags.robots);

  const items = await createManufacturerItems();

  return <ManufacturersBrowser items={items} initialSearch={initialSearch} />;
}

async function ManufacturersContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const params = await pickSearchParams(searchParams, ['country', 'route', 'q'] as const);
  return <CachedManufacturersList initialSearch={toInitialSearch(params)} />;
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
