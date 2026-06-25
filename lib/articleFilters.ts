import type { Article, ArticleSection, ArticleType } from '@/data/types';
import { matchesTag } from '@/lib/tags';

export interface ArticleFilters {
  type?: ArticleType | 'all';
  section?: ArticleSection | 'all';
  /** kind:'industry' の value。null/未指定で業種絞り込みなし。 */
  industry?: string | null;
  /** kind:'region' の value。 */
  region?: string | null;
  /** kind:'theme' の value（記事の主ファセット）。 */
  theme?: string | null;
}

/**
 * 記事の構造化ファセット（type/section/industry/region/theme）で絞り込む。
 * フリーテキスト検索は別軸（lib/searchIndex.ts の MiniSearch）で行い、
 * その結果 slug 集合を matchedSlugs として論理積で渡す。null は「クエリなし＝全件通過」。
 */
export function filterArticles({
  reports,
  filters,
  matchedSlugs,
}: {
  reports: readonly Article[];
  filters: ArticleFilters;
  matchedSlugs?: ReadonlySet<string> | null;
}) {
  return reports.filter((r) => {
    if (filters.type && filters.type !== 'all' && r.type !== filters.type) return false;
    const section = filters.section ?? 'all';
    if (section !== 'all' && r.section !== section) return false;
    if (!matchesTag(r.industryTags ?? [], filters.industry)) return false;
    if (!matchesTag(r.regionTags ?? [], filters.region)) return false;
    if (!matchesTag(r.themeTags, filters.theme)) return false;
    if (matchedSlugs && !matchedSlugs.has(r.slug)) return false;
    return true;
  });
}
