import type { Article, ArticleSection, ArticleType } from '@/data/types';
import { matchesSearchDocument, type SearchDocument } from '@/lib/search';
import { matchesTag } from '@/lib/tags';

export function filterArticles({
  reports,
  searchDocuments,
  filters,
}: {
  reports: readonly Article[];
  searchDocuments: Map<string, SearchDocument>;
  filters: {
    type: ArticleType | 'all';
    section?: ArticleSection | 'all';
    topic: string | null;
    query: string;
  };
}) {
  return reports.filter((r) => {
    if (filters.type !== 'all' && r.type !== filters.type) return false;
    const section = filters.section ?? 'all';
    if (section !== 'all' && r.section !== section) return false;
    if (!matchesTag(r.tags, filters.topic)) return false;
    if (!matchesSearchDocument(filters.query, searchDocuments.get(r.slug))) return false;
    return true;
  });
}
