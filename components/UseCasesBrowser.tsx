'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { HoverCard as HoverCardPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { UseCaseCard } from '@/components/UseCaseCard';
import { UseCasesHeader } from '@/components/UseCasesHeader';
import type { UseCase } from '@/data/types';
import { createUseCaseSearchIndex, searchUseCaseSlugs } from '@/lib/searchIndex';
import { maturityLabels } from '@/lib/labels';
import { SearchInput } from '@/components/SearchInput';
import { toTagOptions } from '@/lib/tags';
import { sortUseCases } from '@/lib/display';
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
const HOVER_OPEN_DELAY_MS = 100;
const HOVER_CLOSE_DELAY_MS = 150;

function chipClassName(selected: boolean) {
  return [
    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
    selected
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  ].join(' ');
}

export function UseCasesBrowser({
  useCases,
  initialFilters,
  cardEvidenceByUseCaseId,
  robotNameById,
}: UseCasesBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const { query, industry: selectedIndustry, task: selectedTask } = initialFilters;
  const tabListRef = useRef<HTMLDivElement>(null);

  const industryTabOptions = useMemo(
    () => toTagOptions(useCases.map((u) => u.primaryIndustry), 'industry'),
    [useCases],
  );

  // Task options + counts per industry, precomputed from all use cases
  const taskDataByIndustry = useMemo(() => {
    const result: Record<
      string,
      { options: ReturnType<typeof toTagOptions>; counts: Record<string, number>; total: number }
    > = {};
    for (const tab of industryTabOptions) {
      const subset = useCases.filter((u) => u.primaryIndustry === tab.value);
      const counts: Record<string, number> = {};
      for (const u of subset) {
        for (const tag of u.taskTags) {
          counts[tag] = (counts[tag] ?? 0) + 1;
        }
      }
      result[tab.value] = {
        options: toTagOptions(subset.flatMap((u) => u.taskTags), 'task'),
        counts,
        total: subset.length,
      };
    }
    return result;
  }, [useCases, industryTabOptions]);

  const byIndustry = useMemo(() => {
    if (!selectedIndustry) return useCases;
    return useCases.filter((u) => u.primaryIndustry === selectedIndustry);
  }, [useCases, selectedIndustry]);

  const searchIndex = useMemo(() => createUseCaseSearchIndex(useCases), [useCases]);
  const matchedSlugs = useMemo(() => searchUseCaseSlugs(searchIndex, query), [searchIndex, query]);

  const filtered = useMemo(() => {
    return byIndustry.filter((u) => {
      if (matchedSlugs && !matchedSlugs.has(u.slug)) return false;
      if (selectedTask && !(u.taskTags as readonly string[]).includes(selectedTask)) return false;
      return true;
    });
  }, [byIndustry, selectedTask, matchedSlugs]);

  const groupedByMaturity = useMemo(() => {
    const entries: [string, UseCase[]][] = [];
    for (const level of MATURITY_ORDER) {
      const items = sortUseCases(filtered.filter((u) => u.maturityLevel === level));
      if (items.length > 0) entries.push([level, items]);
    }
    return entries;
  }, [filtered]);

  const handleChipClick = useCallback(
    (value: string | null) => {
      updateParams({ industry: value, task: null });
    },
    [updateParams],
  );

  const handleTaskSelect = useCallback(
    (industryValue: string, taskValue: string | null) => {
      updateParams({ industry: industryValue, task: taskValue });
    },
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

  const activeIndustryLabel = industryTabOptions.find((t) => t.value === selectedIndustry)?.label;
  const activeTaskLabel = selectedIndustry
    ? taskDataByIndustry[selectedIndustry]?.options.find((t) => t.value === selectedTask)?.label
    : null;

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

          <div
            role="tablist"
            aria-label={uiText.useCases.industryTabsAriaLabel}
            ref={tabListRef}
            className="flex flex-wrap gap-2"
          >
            {/* すべて chip — no popover */}
            <button
              role="tab"
              aria-selected={!selectedIndustry}
              onClick={() => handleChipClick(null)}
              onKeyDown={(e) => handleTabKeyDown(e, 0)}
              className={chipClassName(!selectedIndustry)}
            >
              {uiText.common.allIndustries}
            </button>

            {industryTabOptions.map((tab, index) => {
              const isSelected = tab.value === selectedIndustry;
              const data = taskDataByIndustry[tab.value];

              return (
                <HoverCardPrimitive.Root
                  key={tab.value}
                  openDelay={HOVER_OPEN_DELAY_MS}
                  closeDelay={HOVER_CLOSE_DELAY_MS}
                >
                  <HoverCardPrimitive.Trigger asChild>
                    <button
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => handleChipClick(tab.value)}
                      onKeyDown={(e) => handleTabKeyDown(e, index + 1)}
                      className={chipClassName(isSelected)}
                    >
                      {tab.label}
                    </button>
                  </HoverCardPrimitive.Trigger>

                  <HoverCardPrimitive.Portal>
                    <HoverCardPrimitive.Content
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      className="z-50 min-w-[200px] rounded-lg border border-border bg-card p-1 shadow-md"
                    >
                      <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold text-muted-foreground">
                        {uiText.useCases.industryTasksHeading(tab.label)}
                      </p>

                      <button
                        onClick={() => handleTaskSelect(tab.value, null)}
                        className={[
                          'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                          isSelected && !selectedTask
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-foreground hover:bg-muted',
                        ].join(' ')}
                      >
                        <span>{uiText.common.all}</span>
                        <span className="ml-3 text-xs text-muted-foreground">{data?.total ?? 0}</span>
                      </button>

                      {data?.options.map((task) => {
                        const isActiveTask = isSelected && selectedTask === task.value;
                        const count = data.counts[task.value] ?? 0;
                        return (
                          <button
                            key={task.value}
                            onClick={() => handleTaskSelect(tab.value, task.value)}
                            className={[
                              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                              isActiveTask
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-foreground hover:bg-muted',
                            ].join(' ')}
                          >
                            <span>{task.label}</span>
                            <span className="ml-3 text-xs text-muted-foreground">{count}</span>
                          </button>
                        );
                      })}
                    </HoverCardPrimitive.Content>
                  </HoverCardPrimitive.Portal>
                </HoverCardPrimitive.Root>
              );
            })}
          </div>

          {activeIndustryLabel && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                {activeIndustryLabel}
                {activeTaskLabel && <> · {activeTaskLabel}</>}
              </span>
              <button
                onClick={() => handleChipClick(null)}
                aria-label={uiText.useCases.clearFilterAria}
                className="rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="site-container min-h-[60vh] py-5">
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
                    robotNames={u.candidateRobots
                      .slice(0, 2)
                      .map((r) => robotNameById[r.robotId])
                      .filter((n): n is string => !!n)}
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
