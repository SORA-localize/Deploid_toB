import { matchesCatalogSearch } from '@/lib/catalog/matchSearch';
import { matchesTag, normalizeTagKey } from '@/lib/tags';
import type { UseCaseCatalogItem } from '@/lib/viewModels/useCases';

export interface UseCaseFilters {
  industry: string | null;
  task: string | null;
  query: string;
}

export function normalizeUseCaseFilters({
  industry,
  task,
  query,
  industryValues,
  taskValues,
}: {
  industry: string | null | undefined;
  task: string | null | undefined;
  query: string | null | undefined;
  industryValues: readonly string[];
  taskValues: readonly string[];
}): UseCaseFilters {
  const normalizedIndustry = industry ? normalizeTagKey(industry) : null;
  const normalizedTask = task ? normalizeTagKey(task) : null;

  return {
    industry: normalizedIndustry && industryValues.includes(normalizedIndustry) ? normalizedIndustry : null,
    task: normalizedTask && taskValues.includes(normalizedTask) ? normalizedTask : null,
    query: query ?? '',
  };
}

export function getUseCaseFilterResult(
  useCases: readonly UseCaseCatalogItem[],
  filters: UseCaseFilters,
  matchedSlugs?: ReadonlySet<string> | null,
) {
  const filtered = useCases.filter((useCase) => {
    if (matchedSlugs !== undefined) {
      if (matchedSlugs && !matchedSlugs.has(useCase.slug)) return false;
    } else if (!matchesCatalogSearch(useCase.filter.searchText, filters.query)) {
      return false;
    }
    if (!matchesTag(useCase.filter.industryTags, filters.industry)) return false;
    if (!matchesTag(useCase.filter.taskTags, filters.task)) return false;
    return true;
  });

  return {
    filtered,
    active: Boolean(filters.industry || filters.task || filters.query),
  };
}
