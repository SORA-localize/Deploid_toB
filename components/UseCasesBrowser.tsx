'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { SearchInput } from '@/components/SearchInput';
import { TagChip } from '@/components/TagChip';
import type { UseCase } from '@/data/types';
import { buyerReadinessLabels, maturityLabels } from '@/lib/labels';
import { createUseCaseSearchDocument, matchesSearchDocument } from '@/lib/search';
import {
  getUseCaseIndustryTagOptions,
  getUseCaseTaskTagOptions,
  matchesTag,
  normalizeTagKey,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import {
  getBuyerReadinessTone,
  getUseCaseMaturityTone,
} from '@/lib/visualSemantics';

type UseCaseSearchMode = 'industry' | 'task';

const modeOptions: Array<{ value: UseCaseSearchMode; label: string }> = [
  { value: 'industry', label: '業種で探す' },
  { value: 'task', label: 'タスクで探す' },
];

export function UseCasesBrowser({ useCases }: { useCases: UseCase[] }) {
  const { getParam, updateParams } = useUrlFilters();
  const modeParam = getParam('mode');
  const industryParam = getParam('industry');
  const taskParam = getParam('task');
  const mode: UseCaseSearchMode = modeParam === 'task' || (taskParam && modeParam !== 'industry') ? 'task' : 'industry';
  const industry = mode === 'industry' && industryParam ? normalizeTagKey(industryParam) : null;
  const task = mode === 'task' && taskParam ? normalizeTagKey(taskParam) : null;
  const query = getParam('q') ?? '';

  const industries = useMemo(() => getUseCaseIndustryTagOptions(useCases), [useCases]);
  const tasks = useMemo(() => getUseCaseTaskTagOptions(useCases), [useCases]);
  const chipOptions = useMemo(
    () => (mode === 'industry' ? industries : tasks),
    [mode, industries, tasks],
  );
  const searchDocuments = useMemo(
    () => new Map(useCases.map((useCase) => [useCase.slug, createUseCaseSearchDocument(useCase)])),
    [useCases],
  );
  const selectedChip = mode === 'industry' ? industry : task;

  const handleModeChange = (nextMode: UseCaseSearchMode) => {
    updateParams({
      mode: nextMode === 'task' ? 'task' : null,
      industry: null,
      task: null,
    });
  };

  const filtered = useCases.filter((u) => {
    if (!matchesSearchDocument(query, searchDocuments.get(u.slug))) return false;
    if (!matchesTag(u.industryTags, industry)) return false;
    if (!matchesTag(u.taskTags, task)) return false;
    return true;
  });

  const featured = filtered.slice(0, 2);
  const rest = filtered.slice(2);
  const active = industry || task || query;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="site-container py-8">
          <Breadcrumbs items={[{ label: uiText.useCases.breadcrumb }]} />
          <h1 className="text-2xl font-semibold text-foreground mb-3">{uiText.useCases.title}</h1>
          <p className="text-sm text-muted-foreground max-w-3xl mb-6 leading-relaxed">
            業種・ワークフロー・タスクから、現実的なヒューマノイドの適用機会を探します。ベンダー名ではなく、現場の課題から始めます。
          </p>

          <div className="max-w-2xl mb-6">
            <SearchInput
              value={query}
              onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
              placeholder={uiText.searchPlaceholders.useCases}
            />
          </div>

          <FilterChipGroup
            options={modeOptions}
            value={mode}
            onChange={handleModeChange}
            ariaLabel={uiText.filters.useCaseMode}
            className="mb-4"
            buttonClassName="px-4 py-2 text-sm"
          />

          <FilterChipGroup
            options={chipOptions}
            value={selectedChip}
            onChange={(value) =>
              mode === 'industry'
                ? updateParams({ mode: null, industry: value, task: null })
                : updateParams({ mode: 'task', industry: null, task: value })
            }
            allowDeselect
            onClear={() =>
              mode === 'industry'
                ? updateParams({ industry: null })
                : updateParams({ task: null, mode: 'task' })
            }
            ariaLabel={mode === 'industry' ? uiText.filters.industryTags : uiText.filters.taskTags}
          />
        </div>
      </div>

      <div className="site-container py-8 min-h-[60vh]">
        {featured.length > 0 && !active && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-4 px-1">
              {uiText.useCases.featured}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featured.map((u) => (
                <Link
                  key={u.slug}
                  href={`/use-cases/${u.slug}`}
                  className="border border-border bg-card p-6 hover:border-foreground/40 transition-colors block"
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
                    {uiText.useCases.candidateRobots(u.candidateRobotSlugs.length)}
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
              key={u.slug}
              href={`/use-cases/${u.slug}`}
              className="block border border-border bg-card p-4 hover:border-foreground/40 transition-colors"
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
                    {uiText.useCases.candidateRobots(u.candidateRobotSlugs.length)}
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
