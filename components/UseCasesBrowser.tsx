'use client';

import { useMemo } from 'react';
import type { ActiveFilterChip } from '@/components/ActiveFilterChips';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { FacetFilterBar } from '@/components/FacetFilterBar';
import { SearchInput } from '@/components/SearchInput';
import { UseCaseCard } from '@/components/UseCaseCard';
import { UseCasesHeader } from '@/components/UseCasesHeader';
import type { UseCase } from '@/data/types';
import { USE_CASE_FACETS } from '@/lib/facetConfig';
import { createUseCaseSearchIndex, searchUseCaseSlugs } from '@/lib/searchIndex';
import { getTagLabel } from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import type { UseCaseCardEvidenceSummary } from '@/lib/useCaseEvidence';
import {
  getUseCaseFilterResult,
  type UseCaseFilters,
} from '@/lib/useCaseFilters';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';

interface UseCasesBrowserProps {
  useCases: UseCase[];
  initialFilters: UseCaseFilters;
  cardEvidenceByUseCaseId: Record<string, UseCaseCardEvidenceSummary | undefined>;
}

export function UseCasesBrowser({
  useCases,
  initialFilters,
  cardEvidenceByUseCaseId,
}: UseCasesBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const { query } = initialFilters;

  const facetValues = useMemo(
    () => ({
      domain: initialFilters.domain,
      industry: initialFilters.industry,
      task: initialFilters.task,
    }),
    [initialFilters.domain, initialFilters.industry, initialFilters.task],
  );
  const searchIndex = useMemo(() => createUseCaseSearchIndex(useCases), [useCases]);
  const matchedSlugs = useMemo(() => searchUseCaseSlugs(searchIndex, query), [searchIndex, query]);

  const { filtered, active } = useMemo(
    () => getUseCaseFilterResult(useCases, initialFilters, matchedSlugs),
    [useCases, initialFilters, matchedSlugs],
  );

  const activeChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    if (initialFilters.domain) {
      chips.push({
        key: 'domain',
        label: getTagLabel(initialFilters.domain, 'use-case-domain'),
        onRemove: () => updateParams({ domain: null }),
      });
    }
    if (initialFilters.industry) {
      chips.push({
        key: 'industry',
        label: getTagLabel(initialFilters.industry, 'industry'),
        onRemove: () => updateParams({ industry: null }),
      });
    }
    if (initialFilters.task) {
      chips.push({
        key: 'task',
        label: getTagLabel(initialFilters.task, 'task'),
        onRemove: () => updateParams({ task: null }),
      });
    }
    return chips;
  }, [initialFilters, updateParams]);

  const onFacetChange = (key: string, value: string | null) => updateParams({ [key]: value });

  return (
    <div className="min-h-screen bg-background">
      <UseCasesHeader activeChips={activeChips} />

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

          <FacetFilterBar
            items={useCases}
            facets={USE_CASE_FACETS}
            values={facetValues}
            matchedSlugs={matchedSlugs}
            resultCount={filtered.length}
            active={active}
            idPrefix="use-case"
            showChips={false}
            onChange={onFacetChange}
          />
        </div>
      </div>

      <div className="site-container py-5 min-h-[60vh]">
        <div className="mb-4 px-1">
          <h3 className="text-sm font-semibold text-foreground">
            {uiText.useCases.all}
          </h3>
        </div>

        <div className="grid auto-rows-fr grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((u) => (
            <UseCaseCard key={u.id} useCase={u} evidenceSummary={cardEvidenceByUseCaseId[u.id]} />
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState message={uiText.emptyStates.useCases} />
        )}
      </div>
    </div>
  );
}
