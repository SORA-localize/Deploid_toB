import type { UseCase } from '@/data/types';
import { createUseCaseSearchDocument, matchesSearchDocument } from '@/lib/search';
import { matchesTag, normalizeTagKey } from '@/lib/tags';

// lib/robotFilters.ts と同じ形（業種・タスクは独立した同時絞り込み軸）に揃える。
// 「モードを選んでから片方だけのタグを出す」設計はrobots/manufacturersと一貫しないため廃止した。
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
  };
}
