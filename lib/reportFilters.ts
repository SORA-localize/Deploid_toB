import type { Report, ReportSection, ReportType } from '@/data/types';
import { matchesSearchDocument, type SearchDocument } from '@/lib/search';
import { matchesTag } from '@/lib/tags';

export function filterReports({
  reports,
  searchDocuments,
  filters,
}: {
  reports: readonly Report[];
  searchDocuments: Map<string, SearchDocument>;
  filters: {
    type: ReportType | 'all';
    section?: ReportSection | 'all';
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
