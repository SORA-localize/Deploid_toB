import type { Manufacturer, Robot } from '@/data/types';
import {
  companyStatusOrder,
  companyTypeOrder,
  manufacturerCountryOrder,
  sortByDisplayOrder,
  sortManufacturers,
} from '@/lib/display';
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
    types: sortByDisplayOrder(
      Array.from(new Set(manufacturers.map((manufacturer) => manufacturer.companyType))),
      companyTypeOrder,
    ),
    statuses: sortByDisplayOrder(
      Array.from(new Set(manufacturers.map((manufacturer) => manufacturer.companyStatus))),
      companyStatusOrder,
    ),
  };
}

export function normalizeManufacturerFilters({
  country,
  type,
  status,
  query,
  countries,
  types,
  statuses,
}: {
  country: string | null | undefined;
  type: string | null | undefined;
  status: string | null | undefined;
  query: string | null | undefined;
  countries: readonly string[];
  types: readonly Manufacturer['companyType'][];
  statuses: readonly Manufacturer['companyStatus'][];
}) {
  return {
    country: country && countries.includes(country) ? country : 'all',
    type: isOneOf(type, types) ? type : 'all',
    status: isOneOf(status, statuses) ? status : 'all',
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
    if (filters.type !== 'all' && manufacturer.companyType !== filters.type) return false;
    if (filters.status !== 'all' && manufacturer.companyStatus !== filters.status) return false;
    return matchesSearchDocument(filters.query, searchDocuments.get(manufacturer.slug));
  });

  return sortManufacturers([...base], 'japan');
}
