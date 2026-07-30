import { manufacturerCountryOrder, sortByDisplayOrder } from '@/lib/display';
import { manufacturerConsultationRouteOrder, type ManufacturerConsultationRoute } from '@/lib/manufacturerDisplay';
import { isOneOf } from '@/lib/typeGuards';
import type { ManufacturerCatalogItem } from '@/lib/viewModels/manufacturers';
import { matchesCatalogSearchText } from '@/lib/viewModels/shared';

export function getManufacturerFilterOptions(items: readonly ManufacturerCatalogItem[]) {
  return {
    countries: sortByDisplayOrder(
      Array.from(new Set(items.map((item) => item.filter.country))),
      manufacturerCountryOrder,
    ),
    consultationRoutes: manufacturerConsultationRouteOrder,
  };
}

export function normalizeManufacturerFilters({
  country,
  consultationRoute,
  query,
  countries,
  consultationRoutes,
}: {
  country: string | null | undefined;
  consultationRoute: string | null | undefined;
  query: string | null | undefined;
  countries: readonly string[];
  consultationRoutes: readonly ManufacturerConsultationRoute[];
}) {
  return {
    country: country && countries.includes(country) ? country : 'all',
    consultationRoute: isOneOf(consultationRoute, consultationRoutes) ? consultationRoute : 'all',
    query: query ?? '',
  };
}

export function filterManufacturers({
  items,
  filters,
}: {
  items: readonly ManufacturerCatalogItem[];
  filters: ReturnType<typeof normalizeManufacturerFilters>;
}) {
  const base = items.filter((item) => {
    if (filters.country !== 'all' && item.filter.country !== filters.country) return false;
    if (filters.consultationRoute !== 'all' && item.filter.consultationRoute !== filters.consultationRoute) {
      return false;
    }
    return matchesCatalogSearchText(filters.query, item.filter.searchText);
  });

  return [...base].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' }));
}
