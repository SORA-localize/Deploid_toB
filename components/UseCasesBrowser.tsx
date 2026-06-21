'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { SearchInput } from '@/components/SearchInput';
import { SelectControl } from '@/components/SelectControl';
import { TagChip } from '@/components/TagChip';
import type { UseCase } from '@/data/types';
import { buyerReadinessLabels, maturityLabels } from '@/lib/labels';
import {
  getUseCaseIndustryTagOptions,
  getUseCaseTaskTagOptions,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import {
  getUseCaseFilterResult,
  type UseCaseFilters,
  type UseCaseSearchMode,
} from '@/lib/useCaseFilters';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import {
  getBuyerReadinessTone,
  getUseCaseMaturityTone,
} from '@/lib/visualSemantics';

const modeOptions: Array<{ value: UseCaseSearchMode; label: string }> = [
  { value: 'task', label: 'タスクで探す' },
  { value: 'industry', label: '業種で探す' },
];

interface UseCasesBrowserProps {
  useCases: UseCase[];
  initialFilters: UseCaseFilters;
}

export function UseCasesBrowser({ useCases, initialFilters }: UseCasesBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const { mode, industry, task, query } = initialFilters;

  const industries = useMemo(() => getUseCaseIndustryTagOptions(useCases), [useCases]);
  const tasks = useMemo(() => getUseCaseTaskTagOptions(useCases), [useCases]);
  const chipOptions = useMemo(
    () => (mode === 'industry' ? industries : tasks),
    [mode, industries, tasks],
  );
  const { filtered, featured, rest, active, selectedChip } = useMemo(
    () => getUseCaseFilterResult(useCases, initialFilters),
    [useCases, initialFilters],
  );

  const handleModeChange = (nextMode: UseCaseSearchMode) => {
    // デフォルトは task なので、task への切替は mode を消すだけで足りる。industry は明示指定が必要。
    updateParams({
      mode: nextMode === 'industry' ? 'industry' : null,
      industry: null,
      task: null,
    });
  };

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

          <SelectControl
            id="use-case-mode"
            label={uiText.filters.useCaseMode}
            value={mode}
            onChange={(v) => handleModeChange(v as UseCaseSearchMode)}
            options={modeOptions}
            className="mb-4 max-w-xs"
          />

          <FilterChipGroup
            options={chipOptions}
            value={selectedChip}
            onChange={(value) =>
              mode === 'industry'
                ? updateParams({ mode: 'industry', industry: value, task: null })
                : updateParams({ mode: 'task', industry: null, task: value })
            }
            allowDeselect
            onClear={() =>
              mode === 'industry'
                ? updateParams({ mode: 'industry', industry: null })
                : updateParams({ task: null, mode: 'task' })
            }
            ariaLabel={mode === 'industry' ? uiText.filters.industryTags : uiText.filters.taskTags}
          />
        </div>
      </div>

      <div className="site-container py-5 min-h-[60vh]">
        {featured.length > 0 && !active && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 px-1">
              {uiText.useCases.featured}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featured.map((u) => (
                <Link
                  key={u.id}
                  href={`/use-cases/${u.slug}`}
                  className="card-data block p-6"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {u.industryTags[0] && (
                      <TagChip kind="industry" value={u.industryTags[0]} />
                    )}
                    <TagChip tone={getUseCaseMaturityTone(u.maturityLevel)}>
                      {maturityLabels[u.maturityLevel]}
                    </TagChip>
                    <TagChip tone={getBuyerReadinessTone(u.buyerReadiness)}>
                      {buyerReadinessLabels[u.buyerReadiness]}
                    </TagChip>
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">{u.titleJa ?? u.title}</h4>
                  <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{u.subtitle ?? u.summary}</p>
                  <div className="text-xs text-muted-foreground">
                    {uiText.useCases.candidateRobots(u.candidateRobotIds.length)}
                  </div>
                </Link>
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

        <div className="space-y-3">
          {(active ? filtered : rest).map((u) => (
            <Link
              key={u.id}
              href={`/use-cases/${u.slug}`}
              className="card-data block p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {u.industryTags[0] && (
                      <TagChip kind="industry" value={u.industryTags[0]} />
                    )}
                    <TagChip tone={getUseCaseMaturityTone(u.maturityLevel)}>
                      {maturityLabels[u.maturityLevel]}
                    </TagChip>
                    <TagChip tone={getBuyerReadinessTone(u.buyerReadiness)}>
                      {buyerReadinessLabels[u.buyerReadiness]}
                    </TagChip>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{u.titleJa ?? u.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                    {u.subtitle ?? u.summary}
                  </p>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {u.taskTags.slice(0, 3).map((t) => (
                      <TagChip key={t} kind="task" value={t} />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {uiText.useCases.candidateRobots(u.candidateRobotIds.length)}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/70 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState message={uiText.emptyStates.useCases} />
        )}
      </div>
    </div>
  );
}
