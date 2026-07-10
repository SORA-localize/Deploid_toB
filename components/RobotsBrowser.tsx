'use client';

import { useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CardGridSkeleton } from '@/components/CardGridSkeleton';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
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
import { browserFilterGridClassNames, browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { uiText } from '@/lib/uiText';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { useFavorites } from '@/lib/useFavorites';

interface RobotsBrowserProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
  initialFilters: ReturnType<typeof normalizeRobotFilters>;
}

export function RobotsBrowser({ robots, manufacturers, initialFilters }: RobotsBrowserProps) {
  const { updateParams, isPending } = useUrlParamUpdater();
  const { favorites, toggleFavorite } = useFavorites();

  const manufacturerById = useMemo(
    () => new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer])),
    [manufacturers],
  );
  const filterOptions = useMemo(() => getRobotFilterOptions(robots), [robots]);
  const filters = initialFilters;

  // 業種は最頻の絞り込み軸なのでドロップダウンに隠さず、タブとして常時露出する
  // （用途一覧の産業タブと同じ操作感。部品は汎用 PageTabBar を再利用）。
  const industryTabs = useMemo<readonly PageTab<string>[]>(
    () => [
      { value: 'all', label: uiText.common.all },
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
    <div className={browserGridClassNames.robots}>
      {items.map((robot) => {
        const manufacturer = manufacturerById.get(robot.manufacturerId);
        return (
          <RobotCard
            key={robot.id}
            robot={robot}
            manufacturerName={manufacturer?.name ?? robot.manufacturerId}
            manufacturerLogo={manufacturer?.logo}
            showFavorite={true}
            isFavorite={favorites.includes(robot.id)}
            onFavoriteToggle={toggleFavorite}
            mobileVisual
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

  const updateRelease = useCallback(
    (value: 'active' | 'pre') => {
      updateParams({ release: value === 'active' ? null : value });
    },
    [updateParams],
  );

  return (
    <div className="min-h-screen bg-background">
      <RobotsHeader
        activeCount={activeRobots.length}
        preCount={preReleaseRobots.length}
        activeChips={activeChips}
        activeRelease={filters.release === 'pre' ? 'pre' : 'active'}
        onReleaseSelect={updateRelease}
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

        <div className="-mx-4 mb-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
          <PageTabBar
            tabs={industryTabs}
            activeValue={filters.industry ?? 'all'}
            onSelect={(v) => updateParams({ industry: v === 'all' ? null : v })}
            ariaLabel={uiText.useCases.industryTabsAriaLabel}
          />
        </div>

        <div className="xl:flex xl:items-end gap-4 mb-5">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <div className={browserFilterGridClassNames.robots}>
              <SelectControl
                id="robot-task"
                label={uiText.filters.task}
                value={filters.task ?? 'all'}
                onChange={(v) => updateParams({ task: v === 'all' ? null : v })}
                options={taskOptions}
                className="min-w-40 sm:min-w-0"
              />
              <SelectControl
                id="robot-manufacturer"
                label={uiText.filters.manufacturer}
                value={filters.manufacturer}
                onChange={(v) => updateParams({ manufacturer: v === 'all' ? null : v })}
                options={manufacturerOptions}
                searchable
                className="min-w-48 sm:min-w-0"
              />
              <SelectControl
                id="robot-availability"
                label={uiText.filters.availability}
                value={filters.availability}
                onChange={(v) => updateParams({ availability: v === 'all' ? null : v })}
                options={availabilityOptions}
                className="min-w-40 sm:min-w-0"
              />
            </div>
          </div>
          <p className="mt-3 xl:mt-0 xl:ml-auto shrink-0 whitespace-nowrap px-1 text-xs text-muted-foreground text-right xl:text-left">
            {uiText.common.results(resultCount, hasActiveFilters)}
          </p>
        </div>

        {isPending ? (
          <CardGridSkeleton gridClassName={browserGridClassNames.robots} />
        ) : hasActiveFilters ? (
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
