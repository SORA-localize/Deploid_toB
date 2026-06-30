'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { SelectControl } from '@/components/SelectControl';
import { UseCaseCard } from '@/components/UseCaseCard';
import { UseCasesHeader } from '@/components/UseCasesHeader';
import type { UseCase } from '@/data/types';
import { createUseCaseSearchIndex, searchUseCaseSlugs } from '@/lib/searchIndex';
import { maturityLabels } from '@/lib/labels';
import { SearchInput } from '@/components/SearchInput';
import { toTagOptions } from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import type { UseCaseCardEvidenceSummary } from '@/lib/useCaseEvidence';
import type { UseCaseFilters } from '@/lib/useCaseFilters';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';

interface UseCasesBrowserProps {
  useCases: UseCase[];
  initialFilters: UseCaseFilters;
  cardEvidenceByUseCaseId: Record<string, UseCaseCardEvidenceSummary | undefined>;
  robotNameById: Record<string, string>;
}

const MATURITY_ORDER = ['production-ready', 'pilot-phase', 'early-stage'] as const;

export function UseCasesBrowser({
  useCases,
  initialFilters,
  cardEvidenceByUseCaseId,
  robotNameById,
}: UseCasesBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const { query, industry: selectedIndustry, task: selectedTask } = initialFilters;
  const tabListRef = useRef<HTMLDivElement>(null);

  // Industry tab options derived from primaryIndustry (not industryTags)
  const industryTabOptions = useMemo(
    () => toTagOptions(useCases.map((u) => u.primaryIndustry), 'industry'),
    [useCases],
  );

  // Filter by primaryIndustry exact match
  const byIndustry = useMemo(() => {
    if (!selectedIndustry) return useCases;
    return useCases.filter((u) => u.primaryIndustry === selectedIndustry);
  }, [useCases, selectedIndustry]);

  // Task options from the industry-filtered subset
  const taskOptions = useMemo(
    () => toTagOptions(byIndustry.flatMap((u) => u.taskTags), 'task'),
    [byIndustry],
  );

  const taskSelectOptions = useMemo(
    () => [{ value: '', label: uiText.common.allTasks }, ...taskOptions],
    [taskOptions],
  );

  // Search index + slug set
  const searchIndex = useMemo(() => createUseCaseSearchIndex(useCases), [useCases]);
  const matchedSlugs = useMemo(() => searchUseCaseSlugs(searchIndex, query), [searchIndex, query]);

  // Final filtered list
  const filtered = useMemo(() => {
    return byIndustry.filter((u) => {
      if (matchedSlugs && !matchedSlugs.has(u.slug)) return false;
      if (selectedTask && !(u.taskTags as readonly string[]).includes(selectedTask)) return false;
      return true;
    });
  }, [byIndustry, selectedTask, matchedSlugs]);

  // Maturity-grouped results (most mature first)
  const groupedByMaturity = useMemo(() => {
    const entries: [string, UseCase[]][] = [];
    for (const level of MATURITY_ORDER) {
      const items = filtered.filter((u) => u.maturityLevel === level);
      if (items.length > 0) entries.push([level, items]);
    }
    return entries;
  }, [filtered]);

  const handleIndustryTab = useCallback(
    (value: string | null) => updateParams({ industry: value, task: null }),
    [updateParams],
  );

  const handleTaskChange = useCallback(
    (value: string) => updateParams({ task: value || null }),
    [updateParams],
  );

  const handleTabKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const tabs = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (!tabs) return;
      const count = tabs.length;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        tabs[(currentIndex + 1) % count]?.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        tabs[(currentIndex - 1 + count) % count]?.focus();
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <UseCasesHeader activeChips={[]} />

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

          {/* Industry tabs */}
          <div
            role="tablist"
            aria-label="産業で絞り込む"
            ref={tabListRef}
            className="flex flex-wrap gap-2 mb-4"
          >
            {[{ value: null, label: uiText.common.allIndustries }, ...industryTabOptions].map(
              (tab, index) => {
                const isSelected = (tab.value ?? null) === selectedIndustry;
                return (
                  <button
                    key={tab.value ?? '__all__'}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleIndustryTab(tab.value ?? null)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className={[
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              },
            )}
          </div>

          {/* Task filter */}
          {taskSelectOptions.length > 1 && (
            <div className="max-w-[240px]">
              <SelectControl
                id="use-case-task"
                label={uiText.filters.task}
                value={selectedTask ?? ''}
                options={taskSelectOptions}
                onChange={handleTaskChange}
              />
            </div>
          )}
        </div>
      </div>

      <div className="site-container py-5 min-h-[60vh]">
        {filtered.length === 0 ? (
          <EmptyState message={uiText.emptyStates.useCases} />
        ) : (
          groupedByMaturity.map(([level, cases]) => (
            <section key={level} className="mb-8">
              <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">
                {maturityLabels[level as keyof typeof maturityLabels]}
              </h3>
              <div className="grid auto-rows-fr grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {cases.map((u) => (
                  <UseCaseCard
                    key={u.id}
                    useCase={u}
                    evidenceSummary={cardEvidenceByUseCaseId[u.id]}
                    robotNames={u.candidateRobots.slice(0, 2).map((r) => robotNameById[r.robotId]).filter(Boolean)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
