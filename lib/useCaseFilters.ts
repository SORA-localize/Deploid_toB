import type { UseCase } from '@/data/types';
import { createUseCaseSearchDocument, matchesSearchDocument } from '@/lib/search';
import { matchesTag, normalizeTagKey } from '@/lib/tags';

export type UseCaseSearchMode = 'industry' | 'task';

export interface UseCaseFilters {
  mode: UseCaseSearchMode;
  industry: string | null;
  task: string | null;
  query: string;
}

export function normalizeUseCaseFilters({
  mode,
  industry,
  task,
  query,
}: {
  mode: string | null | undefined;
  industry: string | null | undefined;
  task: string | null | undefined;
  query: string | null | undefined;
}): UseCaseFilters {
  const normalizedMode: UseCaseSearchMode =
    mode === 'task' || (task && mode !== 'industry') ? 'task' : 'industry';

  return {
    mode: normalizedMode,
    industry: normalizedMode === 'industry' && industry ? normalizeTagKey(industry) : null,
    task: normalizedMode === 'task' && task ? normalizeTagKey(task) : null,
    query: query ?? '',
  };
}

export function getUseCaseFilterResult(
  useCases: readonly UseCase[],
  filters: UseCaseFilters,
) {
  const searchDocuments = new Map(
    useCases.map((useCase) => [useCase.slug, createUseCaseSearchDocument(useCase)]),
  );

  const filtered = useCases.filter((useCase) => {
    if (!matchesSearchDocument(filters.query, searchDocuments.get(useCase.slug))) return false;
    if (!matchesTag(useCase.industryTags, filters.industry)) return false;
    if (!matchesTag(useCase.taskTags, filters.task)) return false;
    return true;
  });

  return {
    filtered,
    featured: filtered.slice(0, 2),
    rest: filtered.slice(2),
    active: Boolean(filters.industry || filters.task || filters.query),
    selectedChip: filters.mode === 'industry' ? filters.industry : filters.task,
  };
}
