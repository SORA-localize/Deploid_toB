import type { Article } from '@/data/types';
import { getArticleShelf, type ArticleShelf } from '@/lib/articleShelves';

/**
 * 記事の絞り込み。
 * フリーテキスト検索は別軸（lib/searchIndex.ts の MiniSearch）の結果 slug 集合を matchedSlugs で渡す。
 */
export function filterArticles({
  reports,
  shelf,
  matchedSlugs,
}: {
  reports: readonly Article[];
  shelf?: ArticleShelf;
  matchedSlugs?: ReadonlySet<string> | null;
}) {
  const activeShelf = shelf ?? 'all';
  return reports.filter((article) => {
    if (activeShelf !== 'all' && getArticleShelf(article) !== activeShelf) return false;
    if (matchedSlugs && !matchedSlugs.has(article.slug)) return false;
    return true;
  });
}
