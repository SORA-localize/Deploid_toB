'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterSelect } from '@/components/FilterSelect';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { SearchInput } from '@/components/SearchInput';
import { TagChip } from '@/components/TagChip';
import type { Manufacturer, Robot } from '@/data/types';
import {
  filterManufacturers,
  getManufacturerFilterOptions,
  groupRobotsByManufacturer,
  normalizeManufacturerFilters,
} from '@/lib/manufacturerFilters';
import { companyStatusLabels, companyTypeLabels, japanPresenceLabels, TBD_LABEL } from '@/lib/labels';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface ManufacturersBrowserProps {
  manufacturers: Manufacturer[];
  robots: Robot[];
}

export function ManufacturersBrowser({ manufacturers, robots }: ManufacturersBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();

  const robotsByManufacturer = useMemo(() => groupRobotsByManufacturer(robots), [robots]);
  const filterOptions = useMemo(() => getManufacturerFilterOptions(manufacturers), [manufacturers]);
  const filters = useMemo(
    () =>
      normalizeManufacturerFilters({
        country: getParam('country'),
        type: getParam('type'),
        status: getParam('status'),
        query: getParam('q'),
        countries: filterOptions.countries,
        types: filterOptions.types,
        statuses: filterOptions.statuses,
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
  const typeOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTypes },
      ...filterOptions.types.map((value) => ({ value, label: companyTypeLabels[value] })),
    ],
    [filterOptions.types],
  );
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allStatus },
      ...filterOptions.statuses.map((value) => ({ value, label: companyStatusLabels[value] })),
    ],
    [filterOptions.statuses],
  );
  const robotCount = (slug: string) => robotsByManufacturer.get(slug)?.length ?? 0;

  const filtered = useMemo(
    () => filterManufacturers({ manufacturers, robotsByManufacturer, filters }),
    [manufacturers, robotsByManufacturer, filters],
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs items={[{ label: uiText.manufacturers.breadcrumb }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            {uiText.manufacturers.title}
          </h1>
          <p className="text-sm text-neutral-600 max-w-3xl">
            ヒューマノイドの開発企業・代理店のディレクトリ。国・区分・ステータスで絞り込み、日本での供給体制を確認できます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={filters.query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder={uiText.searchPlaceholders.manufacturers}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
          <FilterSelect
            id="manufacturer-country"
            label={uiText.filters.country}
            value={filters.country}
            onChange={(nextCountry) =>
              updateParams({ country: nextCountry === 'all' ? null : nextCountry })
            }
            options={countryOptions}
          />
          <FilterSelect
            id="manufacturer-type"
            label={uiText.filters.companyType}
            value={filters.type}
            onChange={(nextType) => updateParams({ type: nextType === 'all' ? null : nextType })}
            options={typeOptions}
          />
          <FilterSelect
            id="manufacturer-status"
            label={uiText.filters.status}
            value={filters.status}
            onChange={(nextStatus) =>
              updateParams({ status: nextStatus === 'all' ? null : nextStatus })
            }
            options={statusOptions}
          />
        </div>

        <p className="mb-6 text-xs text-neutral-500">
          {uiText.common.results(
            filtered.length,
            filters.country !== 'all' ||
              filters.type !== 'all' ||
              filters.status !== 'all' ||
              filters.query !== '',
          )}
        </p>

        {filtered.length === 0 ? (
          <EmptyState message={uiText.emptyStates.manufacturers} variant="muted" size="large" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((manufacturer) => (
              <div
                key={manufacturer.slug}
                className="border border-neutral-300 bg-neutral-50 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="min-w-0 text-xl font-semibold text-neutral-900">
                      <ManufacturerLogoName
                        name={manufacturer.name.toUpperCase()}
                        logo={manufacturer.logo}
                        frameClassName="h-7 w-7"
                        imageClassName="h-5 w-5"
                      />
                    </h2>
                    <TagChip className="py-1 border-neutral-400 whitespace-nowrap">
                      {companyTypeLabels[manufacturer.companyType]}
                    </TagChip>
                  </div>

                  <div className="space-y-2 text-xs mb-6">
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">所在地</span>
                      <span className="text-neutral-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {manufacturer.hqCity
                          ? `${manufacturer.hqCity}, ${manufacturer.country}`
                          : manufacturer.country}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">取扱機種</span>
                      <span className="text-neutral-900">{robotCount(manufacturer.slug)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">日本での体制</span>
                      <span className="text-neutral-900">
                        {japanPresenceLabels[manufacturer.japanPresence]}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-neutral-500">設立</span>
                      <span className="text-neutral-900">
                        {manufacturer.foundedYear ?? TBD_LABEL}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/manufacturers/${manufacturer.slug}`}
                    className="flex items-center justify-between w-full px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors text-xs text-neutral-900"
                  >
                    <span>{uiText.common.viewProfile}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
