'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { FilterSelect } from '@/components/FilterSelect';
import { RobotCard } from '@/components/RobotCard';
import { SearchInput } from '@/components/SearchInput';
import type { JapanAvailability, Manufacturer, Robot } from '@/data/types';
import {
  isPreReleaseDeploymentStage,
  japanAvailabilityOrder,
  sortByDisplayOrder,
  sortRobots,
} from '@/lib/display';
import { japanAvailabilityLabels } from '@/lib/labels';
import { createRobotSearchDocument, matchesSearchDocument } from '@/lib/search';
import {
  getRobotIndustryTagOptions,
  getRobotTaskTagOptions,
  matchesTag,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface RobotsBrowserProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

export function RobotsBrowser({ robots, manufacturers }: RobotsBrowserProps) {
  const { getParam, updateParams } = useUrlFilters();

  const manufacturerBySlug = useMemo(
    () => new Map(manufacturers.map((m) => [m.slug, m])),
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

  const avails = useMemo(
    () =>
      sortByDisplayOrder(
        Array.from(new Set(robots.map((r) => r.japanAvailability))),
        japanAvailabilityOrder,
      ),
    [robots],
  );

  const industryParam = getParam('industry');
  const taskParam = getParam('task');
  const manufacturerParam = getParam('manufacturer');
  const mfg = manufacturerParam && manufacturerBySlug.has(manufacturerParam) ? manufacturerParam : 'all';
  const availabilityParam = getParam('availability');
  const avail =
    availabilityParam && avails.includes(availabilityParam as JapanAvailability)
      ? (availabilityParam as JapanAvailability)
      : 'all';
  const release = getParam('release') === 'pre' ? 'pre' : 'active';
  const query = getParam('q') ?? '';

  const industryOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allIndustries },
      ...getRobotIndustryTagOptions(robots).map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [robots],
  );
  const taskOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTasks },
      ...getRobotTaskTagOptions(robots).map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [robots],
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
      ...avails.map((value) => ({ value, label: japanAvailabilityLabels[value] })),
    ],
    [avails],
  );

  const releaseCandidates = useMemo(() => {
    const filtered = robots.filter((r) => {
      const industryOk = matchesTag(r.industryTags ?? [], industryParam);
      const taskOk = matchesTag(r.taskTags ?? [], taskParam);
      const mfgOk = mfg === 'all' || r.manufacturerSlug === mfg;
      const availOk = avail === 'all' || r.japanAvailability === avail;
      const queryOk = matchesSearchDocument(query, searchDocuments.get(r.slug));
      return industryOk && taskOk && mfgOk && availOk && queryOk;
    });
    return sortRobots(filtered, 'stage');
  }, [robots, industryParam, taskParam, mfg, avail, query, searchDocuments]);

  const activeRobots = useMemo(
    () => releaseCandidates.filter((r) => !isPreReleaseDeploymentStage(r.deploymentStage)),
    [releaseCandidates],
  );
  const preReleaseRobots = useMemo(
    () => releaseCandidates.filter((r) => isPreReleaseDeploymentStage(r.deploymentStage)),
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
            導入判断に必要なヒューマノイド機種のカタログ。業種・タスク・メーカー・国内入手性で絞り込み、現場に合う候補を探せます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
            placeholder="機種名・メーカー・用途キーワードで検索"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            id="robot-industry"
            label={uiText.filters.industry}
            value={industryParam ?? 'all'}
            onChange={(v) => updateParams({ industry: v === 'all' ? null : v })}
            options={industryOptions}
          />
          <FilterSelect
            id="robot-task"
            label={uiText.filters.task}
            value={taskParam ?? 'all'}
            onChange={(v) => updateParams({ task: v === 'all' ? null : v })}
            options={taskOptions}
          />
          <FilterSelect
            id="robot-manufacturer"
            label={uiText.filters.manufacturer}
            value={mfg}
            onChange={(v) => updateParams({ manufacturer: v === 'all' ? null : v })}
            options={manufacturerOptions}
          />
          <FilterSelect
            id="robot-availability"
            label={uiText.filters.availability}
            value={avail}
            onChange={(v) => updateParams({ availability: v === 'all' ? null : v })}
            options={availabilityOptions}
          />
        </div>

        <div className="mb-6">
          <FilterChipGroup
            options={releaseOptions}
            value={release}
            onChange={(nextRelease) =>
              updateParams({ release: nextRelease === 'active' ? null : nextRelease })
            }
            ariaLabel={uiText.filters.releaseStatus}
            buttonClassName="px-3 py-1.5 text-xs"
          />
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
              const manufacturer = manufacturerBySlug.get(robot.manufacturerSlug);
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
