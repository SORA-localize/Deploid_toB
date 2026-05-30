'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { FilterSelect } from '@/components/FilterSelect';
import { RobotCard } from '@/components/RobotCard';
import { SearchInput } from '@/components/SearchInput';
import type { JapanAvailability, Manufacturer, Robot, RobotCategory } from '@/data/types';
import {
  isPreReleaseDeploymentStage,
  japanAvailabilityOrder,
  robotCategoryOrder,
  sortByDisplayOrder,
} from '@/lib/display';
import { japanAvailabilityLabels, robotCategoryLabels } from '@/lib/labels';
import { createRobotSearchDocument, matchesSearchDocument } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface RobotsBrowserProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

export function RobotsBrowser({ robots, manufacturers }: RobotsBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();

  const manufacturerBySlug = useMemo(
    () => new Map(manufacturers.map((manufacturer) => [manufacturer.slug, manufacturer])),
    [manufacturers],
  );
  const searchDocuments = useMemo(
    () =>
      new Map(
        robots.map((robot) => [
          robot.slug,
          createRobotSearchDocument(robot, manufacturerBySlug.get(robot.manufacturerSlug)),
        ]),
      ),
    [robots, manufacturerBySlug],
  );
  const manufacturerFor = (slug: string) => manufacturerBySlug.get(slug);

  const types = useMemo(
    () => sortByDisplayOrder(Array.from(new Set(robots.map((r) => r.category))), robotCategoryOrder),
    [robots],
  );
  const avails = useMemo(
    () =>
      sortByDisplayOrder(
        Array.from(new Set(robots.map((r) => r.japanAvailability))),
        japanAvailabilityOrder,
      ),
    [robots],
  );
  const typeParam = getParam('type');
  const type =
    typeParam && types.includes(typeParam as RobotCategory) ? typeParam as RobotCategory : 'all';
  const manufacturerParam = getParam('manufacturer');
  const mfg = manufacturerParam && manufacturerBySlug.has(manufacturerParam) ? manufacturerParam : 'all';
  const availabilityParam = getParam('availability');
  const avail =
    availabilityParam && avails.includes(availabilityParam as JapanAvailability)
      ? availabilityParam as JapanAvailability
      : 'all';
  const release = getParam('release') === 'pre' ? 'pre' : 'active';
  const query = getParam('q') ?? '';

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTypes },
      ...types.map((value) => ({ value, label: robotCategoryLabels[value] })),
    ],
    [types],
  );
  const manufacturerOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allManufacturers },
      ...[...manufacturers]
        .sort((a, b) => a.name.localeCompare(b.name, 'en'))
        .map((manufacturer) => ({
          value: manufacturer.slug,
          label: manufacturer.name,
        })),
    ],
    [manufacturers],
  );
  const availabilityOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allStatus },
      ...avails.map((value) => ({ value, label: japanAvailabilityLabels[value] })),
    ],
    [avails],
  );

  const releaseCandidates = useMemo(() => {
    return [...robots]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((r) => {
        const typeOk = type === 'all' || r.category === type;
        const mfgOk = mfg === 'all' || r.manufacturerSlug === mfg;
        const availOk = avail === 'all' || r.japanAvailability === avail;
        const queryOk = matchesSearchDocument(query, searchDocuments.get(r.slug));
        return typeOk && mfgOk && availOk && queryOk;
      });
  }, [robots, type, mfg, avail, query, searchDocuments]);
  const activeRobots = useMemo(
    () => releaseCandidates.filter((robot) => !isPreReleaseDeploymentStage(robot.deploymentStage)),
    [releaseCandidates],
  );
  const preReleaseRobots = useMemo(
    () => releaseCandidates.filter((robot) => isPreReleaseDeploymentStage(robot.deploymentStage)),
    [releaseCandidates],
  );
  const filtered = release === 'active' ? activeRobots : preReleaseRobots;
  const releaseOptions: Array<{ value: 'active' | 'pre'; label: string }> = [
    { value: 'active', label: uiText.robots.activeModels(activeRobots.length) },
    { value: 'pre', label: uiText.robots.preReleaseModels(preReleaseRobots.length) },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs items={[{ label: uiText.robots.breadcrumb }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{uiText.robots.title}</h1>
          <p className="text-sm text-neutral-600 max-w-3xl">
            導入判断に必要なヒューマノイド機種のカタログ。メーカー、国内入手性、提供段階で絞り込み、現場に合う候補を探せます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder="機種名・メーカー・用途キーワードで検索"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
          <FilterSelect
            id="robot-type"
            label={uiText.filters.robotType}
            value={type}
            onChange={(nextType) => updateParams({ type: nextType === 'all' ? null : nextType })}
            options={typeOptions}
          />
          <FilterSelect
            id="robot-manufacturer"
            label={uiText.filters.manufacturer}
            value={mfg}
            onChange={(nextMfg) =>
              updateParams({ manufacturer: nextMfg === 'all' ? null : nextMfg })
            }
            options={manufacturerOptions}
          />
          <FilterSelect
            id="robot-availability"
            label={uiText.filters.availability}
            value={avail}
            onChange={(nextAvail) =>
              updateParams({ availability: nextAvail === 'all' ? null : nextAvail })
            }
            options={availabilityOptions}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <FilterChipGroup
            options={releaseOptions}
            value={release}
            onChange={(nextRelease) =>
              updateParams({ release: nextRelease === 'active' ? null : nextRelease })
            }
            ariaLabel={uiText.filters.releaseStatus}
            buttonClassName="px-3 py-1.5 text-xs"
          />
          <div className="text-xs text-neutral-500">{uiText.robots.sortByLatestRelease}</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            message="条件に合う機種がありません。フィルタを調整してください。"
            variant="muted"
            size="large"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((robot) => {
              const manufacturer = manufacturerFor(robot.manufacturerSlug);
              return (
                <RobotCard
                  key={robot.slug}
                  robot={robot}
                  manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                  manufacturerLogo={manufacturer?.logo}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
