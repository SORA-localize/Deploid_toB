import type { Article, ArticleSection } from '@/data/types';
import type { FacetConfig } from '@/lib/facetConfig';
import { matchesTag } from '@/lib/tags';

/**
 * 記事の絞り込み。ファセットは `facets`（lib/facetConfig.ts の単一正本）を反復して適用するので、
 * ファセットを増やしても呼び出し側はここを変更しなくてよい。
 * フリーテキスト検索は別軸（lib/searchIndex.ts の MiniSearch）の結果 slug 集合を matchedSlugs で渡す。
 */
export function filterArticles({
  reports,
  section,
  facets,
  facetValues,
  matchedSlugs,
}: {
  reports: readonly Article[];
  section?: ArticleSection | 'all';
  facets?: readonly FacetConfig[];
  facetValues?: Record<string, string | null>;
  matchedSlugs?: ReadonlySet<string> | null;
}) {
  const activeSection = section ?? 'all';
  return reports.filter((article) => {
    if (activeSection !== 'all' && article.section !== activeSection) return false;
    if (facets) {
      for (const facet of facets) {
        if (!matchesTag(facet.getValues(article), facetValues?.[facet.key] ?? null)) return false;
      }
    }
    if (matchedSlugs && !matchedSlugs.has(article.slug)) return false;
    return true;
  });
}
