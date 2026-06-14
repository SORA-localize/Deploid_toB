import type { Article } from '@/data/types';
import { byArticlePublishedDesc } from '@/lib/display';

export function getFeaturedArticle(reports: readonly Article[]): Article | undefined {
  return (
    reports.find((r) => r.featured) ??
    [...reports].sort(byArticlePublishedDesc)[0]
  );
}
