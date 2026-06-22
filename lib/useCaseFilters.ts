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

  // featuredRank 昇順（未設定は最後）。配列順ではなく明示的な編集ピックで決める（lib/display.tsのfeaturedRank運用と同じ考え方）。
  const sortedByFeaturedRank = [...filtered].sort((a, b) => {
    const aRank = a.featuredRank ?? Number.POSITIVE_INFINITY;
    const bRank = b.featuredRank ?? Number.POSITIVE_INFINITY;
    return aRank - bRank;
  });
  const featured = sortedByFeaturedRank.filter((useCase) => useCase.featuredRank !== undefined).slice(0, 2);
  const featuredIds = new Set(featured.map((useCase) => useCase.id));
  const rest = filtered.filter((useCase) => !featuredIds.has(useCase.id));

  return {
    filtered,
    featured,
    rest,
    active: Boolean(filters.industry || filters.task || filters.query),
  };
}
