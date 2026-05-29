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
  getTagLabel,
  getUseCaseIndustryTagOptions,
  getUseCaseTaskTagOptions,
  matchesTag,
  normalizeTagKey,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

type UseCaseSearchMode = 'industry' | 'task';

const modeOptions: Array<{ value: UseCaseSearchMode; label: string }> = [
  { value: 'industry', label: '業種で探す' },
  { value: 'task', label: 'タスクで探す' },
];

function maturityTone(level: UseCase['maturityLevel']) {
  if (level === 'production-ready') return 'success';
  if (level === 'pilot-phase') return 'warning';
  return 'neutral';
}

function readinessTone(r: UseCase['buyerReadiness']) {
  if (r === 'initial-adoption') return 'info';
  if (r === 'requires-poc') return 'warning';
  return 'neutral';
}

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
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumbs items={[{ label: uiText.useCases.breadcrumb }]} />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">{uiText.useCases.title}</h1>
          <p className="text-sm text-neutral-600 max-w-3xl mb-6 leading-relaxed">
            業種・ワークフロー・タスクから、現実的なヒューマノイドの適用機会を探します。ベンダー名ではなく、現場の課題から始めます。
          </p>

          <div className="max-w-2xl mb-6">
            <SearchInput
              value={query}
              onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
              placeholder="自動化したい作業は？"
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

      <div className="mx-auto max-w-7xl px-6 py-8">
        {featured.length > 0 && !active && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4 px-1">
              {uiText.useCases.featured}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featured.map((u) => (
                <Link
                  key={u.slug}
                  href={`/use-cases/${u.slug}`}
                  className="border border-neutral-300 bg-white p-6 hover:border-neutral-500 transition-colors block"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {u.industryTags[0] && (
                      <TagChip>{getTagLabel(u.industryTags[0])}</TagChip>
                    )}
                    <TagChip tone={maturityTone(u.maturityLevel)}>
                      {maturityLabels[u.maturityLevel]}
                    </TagChip>
                    <TagChip tone={readinessTone(u.buyerReadiness)}>
                      {buyerReadinessLabels[u.buyerReadiness]}
                    </TagChip>
                  </div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-2">{u.titleJa ?? u.title}</h4>
                  <p className="text-sm text-neutral-700 mb-3 leading-relaxed">{u.subtitle ?? u.summary}</p>
                  <div className="text-xs text-neutral-600">
                    {uiText.useCases.candidateRobots(u.candidateRobotSlugs.length)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
            {uiText.useCases.all}
          </h3>
          <span className="text-xs text-neutral-600">
            {uiText.common.results(filtered.length, Boolean(active))}
          </span>
        </div>

        <div className="space-y-3">
          {(active ? filtered : rest).map((u) => (
            <Link
              key={u.slug}
              href={`/use-cases/${u.slug}`}
              className="block border border-neutral-300 bg-white p-4 hover:border-neutral-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {u.industryTags[0] && (
                      <TagChip>{getTagLabel(u.industryTags[0])}</TagChip>
                    )}
                    <TagChip tone={maturityTone(u.maturityLevel)}>
                      {maturityLabels[u.maturityLevel]}
                    </TagChip>
                    <TagChip tone={readinessTone(u.buyerReadiness)}>
                      {buyerReadinessLabels[u.buyerReadiness]}
                    </TagChip>
                  </div>
                  <h4 className="font-semibold text-neutral-900 mb-2">{u.titleJa ?? u.title}</h4>
                  <p className="text-xs text-neutral-600 mb-2 leading-relaxed line-clamp-1">
                    {u.subtitle ?? u.summary}
                  </p>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {u.taskTags.slice(0, 3).map((t) => (
                      <TagChip key={t}>{getTagLabel(t)}</TagChip>
                    ))}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {uiText.useCases.candidateRobots(u.candidateRobotSlugs.length)}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState message="条件に合う用途がありません。" />
        )}
      </div>
    </div>
  );
}
