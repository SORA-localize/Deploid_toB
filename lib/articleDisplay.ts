import type { Article } from '@/data/types';

export function getFeaturedArticle(reports: readonly Article[]): Article | undefined {
  return (
    reports.find((r) => r.featured) ??
    [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]
  );
}
