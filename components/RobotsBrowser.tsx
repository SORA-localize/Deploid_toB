'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { FilterSelect } from '@/components/FilterSelect';
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

  const manufacturerBySlug = useMemo(
    () => new Map(manufacturers.map((manufacturer) => [manufacturer.slug, manufacturer])),
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
        .map((m) => ({ value: m.slug, label: m.name })),
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
  return (
    <div className="min-h-screen bg-background">
      <RobotsHeader activeCount={activeRobots.length} preCount={preReleaseRobots.length} />

      <div className="site-container py-8 min-h-[60vh]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">{uiText.robots.title}</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            導入判断に必要なヒューマノイドロボットのカタログ。業種・タスク・メーカー・国内入手性で絞り込み、現場に合う候補を探せます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={filters.query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder={uiText.searchPlaceholders.robots}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4 relative z-40">
          <FilterSelect
            id="robot-industry"
            label={uiText.filters.industry}
            value={filters.industry ?? 'all'}
            onChange={(v) => updateParams({ industry: v === 'all' ? null : v })}
            options={industryOptions}
          />
          <FilterSelect
            id="robot-task"
            label={uiText.filters.task}
            value={filters.task ?? 'all'}
            onChange={(v) => updateParams({ task: v === 'all' ? null : v })}
            options={taskOptions}
          />
          <FilterSelect
            id="robot-manufacturer"
            label={uiText.filters.manufacturer}
            value={filters.manufacturer}
            onChange={(v) => updateParams({ manufacturer: v === 'all' ? null : v })}
            options={manufacturerOptions}
          />
          <FilterSelect
            id="robot-availability"
            label={uiText.filters.availability}
            value={filters.availability}
            onChange={(v) => updateParams({ availability: v === 'all' ? null : v })}
            options={availabilityOptions}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            message={uiText.emptyStates.robots}
            variant="muted"
            size="large"
          />
        ) : (
          <div className="robot-card-grid grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((robot) => {
              const manufacturer = manufacturerBySlug.get(robot.manufacturerSlug);
              return (
                <RobotCard
                  key={robot.slug}
                  robot={robot}
                  manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                  manufacturerLogo={manufacturer?.logo}
                  showFavorite={true}
                  isFavorite={favorites.includes(robot.slug)}
                  onFavoriteToggle={toggleFavorite}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
