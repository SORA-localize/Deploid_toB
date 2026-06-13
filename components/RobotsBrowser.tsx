'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { SelectControl } from '@/components/SelectControl';
import { RobotCard } from '@/components/RobotCard';
import { RobotsHeader } from '@/components/RobotsHeader';
import { SearchInput } from '@/components/SearchInput';
import type { Manufacturer, Robot } from '@/data/types';
import { japanAvailabilityLabels } from '@/lib/labels';
import {
  filterRobots,
  getRobotFilterOptions,
  normalizeRobotFilters,
} from '@/lib/robotFilters';
import { normalizeSearchText } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useFavorites } from '@/lib/useFavorites';

interface RobotsBrowserProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

export function RobotsBrowser({ robots, manufacturers }: RobotsBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();
  const { favorites, toggleFavorite } = useFavorites();

  const manufacturerById = useMemo(
    () => new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer])),
    [manufacturers],
  );
  const filterOptions = useMemo(() => getRobotFilterOptions(robots), [robots]);
  const filters = useMemo(
    () =>
      normalizeRobotFilters({
        industry: getParam('industry'),
        task: getParam('task'),
        manufacturer: getParam('manufacturer'),
        availability: getParam('availability'),
        release: getParam('release'),
        query: getParam('q'),
        manufacturers,
        industryValues: filterOptions.industries.map((option) => option.value),
        taskValues: filterOptions.tasks.map((option) => option.value),
        availabilityValues: filterOptions.availabilityValues,
      }),
    [filterOptions, getParam, manufacturers],
  );

  const industryOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allIndustries },
      ...filterOptions.industries.map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [filterOptions.industries],
  );
  const taskOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTasks },
      ...filterOptions.tasks.map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [filterOptions.tasks],
  );
  const manufacturerOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allManufacturers },
      ...[...manufacturers]
        .sort((a, b) => a.name.localeCompare(b.name, 'en'))
        .map((m) => ({ value: m.id, label: m.name })),
    ],
    [manufacturers],
  );
  const availabilityOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allStatus },
      ...filterOptions.availabilityValues.map((value) => ({ value, label: japanAvailabilityLabels[value] })),
    ],
    [filterOptions.availabilityValues],
  );

  const { activeRobots, preReleaseRobots, filtered } = useMemo(
    () => filterRobots({ robots, manufacturers, filters }),
    [robots, manufacturers, filters],
  );
  const hasActiveFilters =
    normalizeSearchText(filters.query) !== '' ||
    filters.industry !== null ||
    filters.task !== null ||
    filters.manufacturer !== 'all' ||
    filters.availability !== 'all';
  const crossReleaseTotal = activeRobots.length + preReleaseRobots.length;
  const resultCount = hasActiveFilters ? crossReleaseTotal : filtered.length;

  const activeChips = useMemo(() => {
    const chips: import('@/components/ActiveFilterChips').ActiveFilterChip[] = [];
    if (filters.industry) {
      const label = filterOptions.industries.find((o) => o.value === filters.industry)?.label ?? filters.industry;
      chips.push({ key: 'industry', label, onRemove: () => updateParams({ industry: null }) });
    }
    if (filters.task) {
      const label = filterOptions.tasks.find((o) => o.value === filters.task)?.label ?? filters.task;
      chips.push({ key: 'task', label, onRemove: () => updateParams({ task: null }) });
    }
    if (filters.manufacturer !== 'all') {
      const label = manufacturers.find((m) => m.id === filters.manufacturer)?.name ?? filters.manufacturer;
      chips.push({ key: 'manufacturer', label, onRemove: () => updateParams({ manufacturer: null }) });
    }
    if (filters.availability !== 'all') {
      const label = japanAvailabilityLabels[filters.availability as keyof typeof japanAvailabilityLabels] ?? filters.availability;
      chips.push({ key: 'availability', label, onRemove: () => updateParams({ availability: null }) });
    }
    return chips;
  }, [filters, filterOptions, manufacturers, updateParams]);

  const renderRobotGrid = (items: readonly Robot[]) => (
    <div className="robot-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((robot) => {
        const manufacturer = manufacturerById.get(robot.manufacturerId);
        return (
          <RobotCard
            key={robot.slug}
            robot={robot}
            manufacturerName={manufacturer?.name ?? robot.manufacturerId}
            manufacturerLogo={manufacturer?.logo}
            showFavorite={true}
            isFavorite={favorites.includes(robot.id)}
            onFavoriteToggle={toggleFavorite}
          />
        );
      })}
    </div>
  );

  const renderRobotSection = (title: string, items: readonly Robot[]) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-foreground">
          {title}
        </h2>
        {renderRobotGrid(items)}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <RobotsHeader
        activeCount={activeRobots.length}
        preCount={preReleaseRobots.length}
        activeChips={activeChips}
        isCrossReleaseMode={hasActiveFilters}
      />

      <div className="site-container py-5 min-h-[60vh]">
        <Breadcrumbs items={[{ label: uiText.robots.breadcrumb }]} />
        <PageListHeader
          title={uiText.robots.title}
          description={uiText.robots.description}
          action={
            <SearchInput
              value={filters.query}
              onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
              placeholder={uiText.searchPlaceholders.robots}
            />
          }
        />

        <div className="xl:flex xl:items-end xl:justify-between gap-4 mb-5 max-w-4xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:flex-1 xl:min-w-0">
            <SelectControl
              id="robot-industry"
              label={uiText.filters.industry}
              value={filters.industry ?? 'all'}
              onChange={(v) => updateParams({ industry: v === 'all' ? null : v })}
              options={industryOptions}
            />
            <SelectControl
              id="robot-task"
              label={uiText.filters.task}
              value={filters.task ?? 'all'}
              onChange={(v) => updateParams({ task: v === 'all' ? null : v })}
              options={taskOptions}
            />
            <SelectControl
              id="robot-manufacturer"
              label={uiText.filters.manufacturer}
              value={filters.manufacturer}
              onChange={(v) => updateParams({ manufacturer: v === 'all' ? null : v })}
              options={manufacturerOptions}
              searchable
            />
            <SelectControl
              id="robot-availability"
              label={uiText.filters.availability}
              value={filters.availability}
              onChange={(v) => updateParams({ availability: v === 'all' ? null : v })}
              options={availabilityOptions}
            />
          </div>
          <p className="mt-3 xl:mt-0 shrink-0 whitespace-nowrap px-1 text-xs text-muted-foreground">
            {uiText.common.results(resultCount, hasActiveFilters)}
          </p>
        </div>

        {hasActiveFilters ? (
          crossReleaseTotal === 0 ? (
            <EmptyState
              message={uiText.emptyStates.robots}
              variant="muted"
              size="large"
            />
          ) : (
            <div className="space-y-8">
              {renderRobotSection(uiText.robots.activeSection(activeRobots.length), activeRobots)}
              {renderRobotSection(
                uiText.robots.preReleaseSection(preReleaseRobots.length),
                preReleaseRobots,
              )}
            </div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState
            message={uiText.emptyStates.robots}
            variant="muted"
            size="large"
          />
        ) : (
          renderRobotGrid(filtered)
        )}
      </div>
    </div>
  );
}
