'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { ManufacturerCard } from '@/components/ManufacturerCard';
import { ManufacturersHeader } from '@/components/ManufacturersHeader';
import { SelectControl } from '@/components/SelectControl';
import { SearchInput } from '@/components/SearchInput';
import type { Manufacturer, Robot } from '@/data/types';
import {
  filterManufacturers,
  getManufacturerFilterOptions,
  groupRobotsByManufacturer,
  normalizeManufacturerFilters,
} from '@/lib/manufacturerFilters';
import { manufacturerConsultationRouteLabels } from '@/lib/manufacturerDisplay';
import { uiText } from '@/lib/uiText';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';

interface ManufacturersBrowserProps {
  manufacturers: Manufacturer[];
  robots: Robot[];
  initialFilters: ReturnType<typeof normalizeManufacturerFilters>;
}

export function ManufacturersBrowser({ manufacturers, robots, initialFilters }: ManufacturersBrowserProps) {
  const { updateParams } = useUrlParamUpdater();

  const robotsByManufacturer = useMemo(() => groupRobotsByManufacturer(robots), [robots]);
  const filterOptions = useMemo(() => getManufacturerFilterOptions(manufacturers), [manufacturers]);
  const filters = initialFilters;

  const countryOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allRegions },
      ...filterOptions.countries.map((value) => ({ value, label: value })),
    ],
    [filterOptions.countries],
  );
  const consultationRouteOptions = useMemo(
    () => [
      { value: 'all', label: 'すべての相談ルート' },
      ...filterOptions.consultationRoutes.map((value) => ({
        value,
        label: manufacturerConsultationRouteLabels[value],
      })),
    ],
    [filterOptions.consultationRoutes],
  );

  const filtered = useMemo(
    () => filterManufacturers({ manufacturers, robotsByManufacturer, filters }),
    [manufacturers, robotsByManufacturer, filters],
  );

  const activeChips = useMemo(() => {
    const chips: import('@/components/ActiveFilterChips').ActiveFilterChip[] = [];
    if (filters.country !== 'all') {
      chips.push({ key: 'country', label: filters.country, onRemove: () => updateParams({ country: null }) });
    }
    if (filters.consultationRoute !== 'all') {
      const label = manufacturerConsultationRouteLabels[filters.consultationRoute as keyof typeof manufacturerConsultationRouteLabels] ?? filters.consultationRoute;
      chips.push({ key: 'consultationRoute', label, onRemove: () => updateParams({ route: null }) });
    }
    return chips;
  }, [filters, updateParams]);

  return (
    <div className="min-h-screen bg-background">
      <ManufacturersHeader activeChips={activeChips} />

      <div className="site-container py-5">
        <Breadcrumbs items={[{ label: uiText.manufacturers.breadcrumb }]} />
        <PageListHeader
          title={uiText.manufacturers.title}
          description={uiText.manufacturers.description}
          action={
            <SearchInput
              value={filters.query}
              onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
              placeholder={uiText.searchPlaceholders.manufacturers}
            />
          }
        />

        <div className="sm:flex sm:items-end gap-4 mb-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl sm:shrink-0">
            <SelectControl
              id="manufacturer-country"
              label={uiText.filters.region}
              value={filters.country}
              onChange={(nextCountry) =>
                updateParams({ country: nextCountry === 'all' ? null : nextCountry })
              }
              options={countryOptions}
              searchable
            />
            <SelectControl
              id="manufacturer-consultation-route"
              label={uiText.filters.consultationRoute}
              value={filters.consultationRoute}
              onChange={(nextRoute) =>
                updateParams({ route: nextRoute === 'all' ? null : nextRoute })
              }
              options={consultationRouteOptions}
              searchable
            />
          </div>
          <p className="mt-3 sm:mt-0 sm:ml-auto shrink-0 whitespace-nowrap text-xs text-muted-foreground text-right sm:text-left">
            {uiText.common.results(
              filtered.length,
              filters.country !== 'all' || filters.consultationRoute !== 'all' || filters.query !== '',
            )}
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message={uiText.emptyStates.manufacturers} variant="muted" size="large" />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((manufacturer) => (
              <ManufacturerCard
                key={manufacturer.id}
                manufacturer={manufacturer}
                robots={robotsByManufacturer.get(manufacturer.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
