import type { Report } from '@/data/types';

export function getFeaturedReport(reports: readonly Report[]): Report | undefined {
  return (
    reports.find((r) => r.featured) ??
    [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]
  );
}
