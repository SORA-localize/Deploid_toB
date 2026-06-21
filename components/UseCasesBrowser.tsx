'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { SearchInput } from '@/components/SearchInput';
import { SelectControl } from '@/components/SelectControl';
import { UseCaseCard } from '@/components/UseCaseCard';
import type { UseCase } from '@/data/types';
import {
  getUseCaseIndustryTagOptions,
  getUseCaseTaskTagOptions,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import {
  getUseCaseFilterResult,
  type UseCaseFilters,
} from '@/lib/useCaseFilters';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';

interface UseCasesBrowserProps {
  useCases: UseCase[];
  initialFilters: UseCaseFilters;
}

// robots/manufacturers と同じ「業種・タスクを独立した2つのドロップダウンで同時に絞り込む」構造に揃える
// （lib/robotFilters.ts・components/RobotsBrowser.tsxを参照）。タグの値自体は
// lib/tagRegistry.ts が唯一の正本で、getUseCaseIndustryTagOptions/getUseCaseTaskTagOptionsがそこから導出する。
export function UseCasesBrowser({ useCases, initialFilters }: UseCasesBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const { query } = initialFilters;

  const industryOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allIndustries },
      ...getUseCaseIndustryTagOptions(useCases).map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [useCases],
  );
  const taskOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allTasks },
      ...getUseCaseTaskTagOptions(useCases).map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [useCases],
  );

  const { filtered, featured, rest, active } = useMemo(
    () => getUseCaseFilterResult(useCases, initialFilters),
    [useCases, initialFilters],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="site-container py-5">
          <Breadcrumbs items={[{ label: uiText.useCases.breadcrumb }]} />
          <PageListHeader
            title={uiText.useCases.title}
            description={uiText.useCases.description}
            className="mb-6"
            action={
              <SearchInput
                value={query}
                onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
                placeholder={uiText.searchPlaceholders.useCases}
              />
            }
          />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
            <SelectControl
              id="use-case-industry"
              label={uiText.filters.industry}
              value={initialFilters.industry ?? 'all'}
              onChange={(v) => updateParams({ industry: v === 'all' ? null : v })}
              options={industryOptions}
            />
            <SelectControl
              id="use-case-task"
              label={uiText.filters.task}
              value={initialFilters.task ?? 'all'}
              onChange={(v) => updateParams({ task: v === 'all' ? null : v })}
              options={taskOptions}
            />
          </div>
        </div>
      </div>

      <div className="site-container py-5 min-h-[60vh]">
        {featured.length > 0 && !active && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 px-1">
              {uiText.useCases.featured}
            </h3>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              {featured.map((u) => (
                <UseCaseCard key={u.id} useCase={u} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-semibold text-foreground">
            {uiText.useCases.all}
          </h3>
          <span className="text-xs text-muted-foreground">
            {uiText.common.results(filtered.length, Boolean(active))}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {(active ? filtered : rest).map((u) => (
            <UseCaseCard key={u.id} useCase={u} />
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState message={uiText.emptyStates.useCases} />
        )}
      </div>
    </div>
  );
}
