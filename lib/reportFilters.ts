import type { Report, ReportCategory, ReportType } from '@/data/types';
import { getReportCategory } from '@/lib/reportDisplay';
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
    category?: ReportCategory | 'all';
    topic: string | null;
    query: string;
  };
}) {
  return reports.filter((r) => {
    if (filters.type !== 'all' && r.type !== filters.type) return false;
    const cat = filters.category ?? 'all';
    if (cat !== 'all' && getReportCategory(r) !== cat) return false;
    if (!matchesTag(r.tags, filters.topic)) return false;
    if (!matchesSearchDocument(filters.query, searchDocuments.get(r.slug))) return false;
    return true;
  });
}
