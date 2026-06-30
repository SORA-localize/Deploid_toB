import type { UseCase } from '@/data/types';
import { createUseCaseSearchDocument, matchesSearchDocument } from '@/lib/search';
import { matchesTag, normalizeTagKey } from '@/lib/tags';
import { USE_CASE_FACETS } from '@/lib/facetConfig';

// lib/robotFilters.ts と同じ形（業種・タスクは独立した同時絞り込み軸）に揃える。
// 「モードを選んでから片方だけのタグを出す」設計はrobots/manufacturersと一貫しないため廃止した。
export interface UseCaseFilters {
  industry: string | null;
  task: string | null;
  domain: string | null;
  query: string;
}

export function normalizeUseCaseFilters({
  industry,
  task,
  domain,
  query,
  industryValues,
  taskValues,
  domainValues,
}: {
  industry: string | null | undefined;
  task: string | null | undefined;
  domain: string | null | undefined;
  query: string | null | undefined;
  industryValues: readonly string[];
  taskValues: readonly string[];
  domainValues: readonly string[];
}): UseCaseFilters {
  const normalizedIndustry = industry ? normalizeTagKey(industry) : null;
  const normalizedTask = task ? normalizeTagKey(task) : null;
  const normalizedDomain = domain ? normalizeTagKey(domain) : null;

  return {
    industry: normalizedIndustry && industryValues.includes(normalizedIndustry) ? normalizedIndustry : null,
    task: normalizedTask && taskValues.includes(normalizedTask) ? normalizedTask : null,
    domain: normalizedDomain && domainValues.includes(normalizedDomain) ? normalizedDomain : null,
    query: query ?? '',
  };
}

export function getUseCaseFilterResult(
  useCases: readonly UseCase[],
  filters: UseCaseFilters,
  matchedSlugs?: ReadonlySet<string> | null,
) {
  const searchDocuments = matchedSlugs === undefined
    ? new Map(useCases.map((useCase) => [useCase.slug, createUseCaseSearchDocument(useCase)]))
    : null;

  const filtered = useCases.filter((useCase) => {
    if (matchedSlugs !== undefined) {
      if (matchedSlugs && !matchedSlugs.has(useCase.slug)) return false;
    } else if (!matchesSearchDocument(filters.query, searchDocuments?.get(useCase.slug))) {
      return false;
    }
    const facetValues = {
      domain: filters.domain,
      industry: filters.industry,
      task: filters.task,
    };
    for (const facet of USE_CASE_FACETS) {
      if (!matchesTag(facet.getValues(useCase), facetValues[facet.key as keyof typeof facetValues])) {
        return false;
      }
    }
    return true;
  });

  return {
    filtered,
    active: Boolean(filters.industry || filters.task || filters.domain || filters.query),
  };
}
