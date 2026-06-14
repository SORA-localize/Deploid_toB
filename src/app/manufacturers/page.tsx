import { ManufacturersBrowser } from '@/components/ManufacturersBrowser';
import { getManufacturers, getRobots } from '@/lib/data';
import {
  getManufacturerFilterOptions,
  normalizeManufacturerFilters,
} from '@/lib/manufacturerFilters';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = {
  title: 'メーカー',
  description:
    'ヒューマノイド開発企業のディレクトリ。地域と相談ルートから、日本で検討しやすい企業を確認できます。',
  alternates: {
    canonical: '/manufacturers',
  },
};

export default async function ManufacturersPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  const manufacturers = getManufacturers();
  const robots = getRobots();
  const params = await pickSearchParams(searchParams, ['country', 'route', 'q'] as const);
  const filterOptions = getManufacturerFilterOptions(manufacturers);
  const filters = normalizeManufacturerFilters({
    country: params.country,
    consultationRoute: params.route,
    query: params.q,
    countries: filterOptions.countries,
    consultationRoutes: filterOptions.consultationRoutes,
  });

  return (
    <ManufacturersBrowser
      manufacturers={manufacturers}
      robots={robots}
      initialFilters={filters}
    />
  );
}
