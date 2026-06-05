'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { ManufacturersHeader } from '@/components/ManufacturersHeader';
import { FilterSelect } from '@/components/FilterSelect';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { SearchInput } from '@/components/SearchInput';
import type { Manufacturer, Robot } from '@/data/types';
import {
  filterManufacturers,
  getManufacturerFilterOptions,
  groupRobotsByManufacturer,
  normalizeManufacturerFilters,
} from '@/lib/manufacturerFilters';
import {
  getDomesticDistributorDisplay,
  getManufacturerEstablishedRegionLabel,
  getManufacturerConsultationRoute,
  getRepresentativeRobotLabel,
  manufacturerConsultationRouteLabels,
} from '@/lib/manufacturerDisplay';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface ManufacturersBrowserProps {
  manufacturers: Manufacturer[];
  robots: Robot[];
}

export function ManufacturersBrowser({ manufacturers, robots }: ManufacturersBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();
  const [openDistributorSlug, setOpenDistributorSlug] = useState<string | null>(null);

  const robotsByManufacturer = useMemo(() => groupRobotsByManufacturer(robots), [robots]);
  const filterOptions = useMemo(() => getManufacturerFilterOptions(manufacturers), [manufacturers]);
  const filters = useMemo(
    () =>
      normalizeManufacturerFilters({
        country: getParam('country'),
        consultationRoute: getParam('route'),
        query: getParam('q'),
        countries: filterOptions.countries,
        consultationRoutes: filterOptions.consultationRoutes,
      }),
    [filterOptions, getParam],
  );

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

  useEffect(() => {
    function closeDistributorMenu(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest('[data-distributor-menu]')) {
        return;
      }
      setOpenDistributorSlug(null);
    }

    document.addEventListener('pointerdown', closeDistributorMenu);
    return () => document.removeEventListener('pointerdown', closeDistributorMenu);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ManufacturersHeader activeChips={activeChips} />

      <div className="site-container py-8">
        <Breadcrumbs items={[{ label: uiText.manufacturers.breadcrumb }]} />
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {uiText.manufacturers.title}
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            ヒューマノイド開発企業のディレクトリ。地域と相談ルートから、日本で検討しやすい企業を確認できます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={filters.query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder={uiText.searchPlaceholders.manufacturers}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
          <FilterSelect
            id="manufacturer-country"
            label={uiText.filters.region}
            value={filters.country}
            onChange={(nextCountry) =>
              updateParams({ country: nextCountry === 'all' ? null : nextCountry })
            }
            options={countryOptions}
          />
          <FilterSelect
            id="manufacturer-consultation-route"
            label={uiText.filters.consultationRoute}
            value={filters.consultationRoute}
            onChange={(nextRoute) =>
              updateParams({ route: nextRoute === 'all' ? null : nextRoute })
            }
            options={consultationRouteOptions}
          />
        </div>

        <p className="mb-6 text-xs text-muted-foreground">
          {uiText.common.results(
            filtered.length,
            filters.country !== 'all' || filters.consultationRoute !== 'all' || filters.query !== '',
          )}
        </p>

        {filtered.length === 0 ? (
          <EmptyState message={uiText.emptyStates.manufacturers} variant="muted" size="large" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((manufacturer) => {
              const manufacturerRobots = robotsByManufacturer.get(manufacturer.slug) ?? [];
              const consultationRoute = getManufacturerConsultationRoute(manufacturer);
              const domesticDistributor = getDomesticDistributorDisplay(manufacturer);

              return (
                <div key={manufacturer.slug} className="border border-border bg-card overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <h2 className="min-w-0 text-xl font-semibold text-foreground">
                        <a
                          href={manufacturer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex min-w-0 items-center gap-1 text-foreground hover:text-muted-foreground"
                        >
                          <ManufacturerLogoName
                            name={manufacturer.nameJa ?? manufacturer.name}
                            logo={manufacturer.logo}
                            frameClassName="h-10 w-10"
                            imageClassName="h-7 w-7"
                            textClassName="leading-tight"
                          />
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-45 transition-opacity group-hover:opacity-80" />
                        </a>
                      </h2>
                    </div>

                    <div className="space-y-2 text-xs mb-6">
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">設立</span>
                        <span className="ml-4 text-right text-foreground">
                          {getManufacturerEstablishedRegionLabel(manufacturer)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">代表ロボット</span>
                        <span className="ml-4 truncate text-right text-foreground">
                          {getRepresentativeRobotLabel(manufacturerRobots)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">相談ルート</span>
                        <span className="ml-4 text-right text-foreground">
                          {manufacturerConsultationRouteLabels[consultationRoute]}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">国内代理店</span>
                        {domesticDistributor.hasDistributor ? (
                          <div className="relative ml-4 text-right" data-distributor-menu>
                            {domesticDistributor.distributors.length === 1 ? (
                              domesticDistributor.distributors[0].website ? (
                                <a
                                  href={domesticDistributor.distributors[0].website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-normal leading-normal text-foreground hover:text-muted-foreground"
                                >
                                  {domesticDistributor.label}
                                </a>
                              ) : (
                                <span className="text-xs font-normal leading-normal text-foreground">
                                  {domesticDistributor.label}
                                </span>
                              )
                            ) : (
                              <>
                                <button
                                  type="button"
                                  aria-expanded={openDistributorSlug === manufacturer.slug}
                                  aria-haspopup="menu"
                                  className="text-xs font-normal leading-normal text-foreground hover:text-muted-foreground"
                                  onClick={() =>
                                    setOpenDistributorSlug((current) =>
                                      current === manufacturer.slug ? null : manufacturer.slug,
                                    )
                                  }
                                >
                                  {domesticDistributor.label}
                                </button>
                                {openDistributorSlug === manufacturer.slug &&
                                  domesticDistributor.distributors.length > 1 && (
                                    <div
                                      className="absolute right-0 top-6 z-10 min-w-44 border border-border bg-popover text-popover-foreground p-2 text-left shadow-sm"
                                      role="menu"
                                    >
                                      {domesticDistributor.distributors.map((distributor) =>
                                        distributor.website ? (
                                          <a
                                            key={distributor.name}
                                            href={distributor.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            role="menuitem"
                                            className="block py-1 text-xs font-normal text-foreground hover:text-muted-foreground"
                                          >
                                            {distributor.name}
                                          </a>
                                        ) : (
                                          <div
                                            key={distributor.name}
                                            role="menuitem"
                                            className="py-1 text-xs font-normal text-foreground"
                                          >
                                            {distributor.name}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </>
                            )}
                          </div>
                        ) : (
                          <Link
                            href="/contact"
                            className="ml-4 text-right text-xs font-normal text-accent-blue-pale hover:text-accent-blue-pale-hover"
                          >
                            {domesticDistributor.label}
                          </Link>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/manufacturers/${manufacturer.slug}`}
                      className="ml-auto flex w-fit border-b border-foreground pb-0.5 text-xs leading-none text-foreground transition-colors hover:border-foreground/40 hover:text-muted-foreground"
                    >
                      <span>{uiText.common.viewProfile}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
