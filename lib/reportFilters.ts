import type { Report, ReportType } from '@/data/types';
import { matchesSearchDocument } from '@/lib/search';
import { matchesTag } from '@/lib/tags';

export function filterReports({
  reports,
  searchDocuments,
  filters,
}: {
  reports: readonly Report[];
  searchDocuments: Map<string, any>;
  filters: {
    type: ReportType | 'all';
    topic: string | null;
    query: string;
  };
}) {
  return reports.filter((r) => {
    if (filters.type !== 'all' && r.type !== filters.type) return false;
    if (!matchesTag(r.tags, filters.topic)) return false;
    if (!matchesSearchDocument(filters.query, searchDocuments.get(r.slug))) return false;
    return true;
  });
}
