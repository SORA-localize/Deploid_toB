import type { Manufacturer, Robot } from '@/data/types';
import {
  manufacturerCountryOrder,
  sortByDisplayOrder,
  sortManufacturers,
} from '@/lib/display';
import {
  getManufacturerConsultationRoute,
  manufacturerConsultationRouteOrder,
} from '@/lib/manufacturerDisplay';
import { createManufacturerSearchDocument, matchesSearchDocument } from '@/lib/search';
import { isOneOf } from '@/lib/typeGuards';

export function groupRobotsByManufacturer(robots: readonly Robot[]) {
  const byManufacturer = new Map<string, Robot[]>();

  robots.forEach((robot) => {
    const existing = byManufacturer.get(robot.manufacturerSlug) ?? [];
    existing.push(robot);
    byManufacturer.set(robot.manufacturerSlug, existing);
  });

  return byManufacturer;
}

export function getManufacturerFilterOptions(manufacturers: readonly Manufacturer[]) {
  return {
    countries: sortByDisplayOrder(
      Array.from(new Set(manufacturers.map((manufacturer) => manufacturer.country))),
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
  consultationRoutes: readonly ReturnType<typeof getManufacturerConsultationRoute>[];
}) {
  return {
    country: country && countries.includes(country) ? country : 'all',
    consultationRoute: isOneOf(consultationRoute, consultationRoutes) ? consultationRoute : 'all',
    query: query ?? '',
  };
}

export function filterManufacturers({
  manufacturers,
  robotsByManufacturer,
  filters,
}: {
  manufacturers: readonly Manufacturer[];
  robotsByManufacturer: Map<string, Robot[]>;
  filters: ReturnType<typeof normalizeManufacturerFilters>;
}) {
  const searchDocuments = new Map(
    manufacturers.map((manufacturer) => [
      manufacturer.slug,
      createManufacturerSearchDocument(
        manufacturer,
        robotsByManufacturer.get(manufacturer.slug) ?? [],
      ),
    ]),
  );

  const base = manufacturers.filter((manufacturer) => {
    if (filters.country !== 'all' && manufacturer.country !== filters.country) return false;
    if (
      filters.consultationRoute !== 'all' &&
      getManufacturerConsultationRoute(manufacturer) !== filters.consultationRoute
    ) {
      return false;
    }
    return matchesSearchDocument(filters.query, searchDocuments.get(manufacturer.slug));
  });

  return sortManufacturers([...base], 'japan');
}
