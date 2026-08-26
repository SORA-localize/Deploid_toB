import type { ArticlePlacement, ArticlePlacementSlot } from '@/lib/content/domainTypes';
import { byArticlePublishedDesc } from '@/lib/display';

const reportsIndexSurface = 'reports-index';

interface PlacementInput<T> {
  articles: readonly T[];
  placements: readonly ArticlePlacement[];
  limits: Readonly<Record<ArticlePlacementSlot, number>>;
}

/**
 * 配置指定を先に埋め、残りを公開日の新しい順で補う。
 * データを直接読まず引数で受けるのは、client componentからこの関数へ到達しても
 * 全件snapshotがbundleへ入らないようにするため。
 */
export function getArticleIndexPlacementReports<T extends { id: string; publishedAt: string }>({
  articles,
  placements,
  limits,
}: PlacementInput<T>): { heroReports: T[]; featureReports: T[] } {
  const sortedArticles = [...articles].sort(byArticlePublishedDesc);
  const articlesById = new Map(articles.map((article) => [article.id, article]));
  const usedIds = new Set<string>();

  const resolveSlot = (slot: ArticlePlacementSlot): T[] => {
    const limit = limits[slot];
    const slotArticles: T[] = [];

    placements
      .filter((placement) => placement.surface === reportsIndexSurface && placement.slot === slot)
      .sort((a, b) => a.order - b.order)
      .forEach((placement) => {
        if (slotArticles.length >= limit || usedIds.has(placement.articleId)) return;
        const article = articlesById.get(placement.articleId);
        if (!article) return;
        slotArticles.push(article);
        usedIds.add(article.id);
      });

    for (const article of sortedArticles) {
      if (slotArticles.length >= limit) break;
      if (usedIds.has(article.id)) continue;
      slotArticles.push(article);
      usedIds.add(article.id);
    }

    return slotArticles;
  };

  return { heroReports: resolveSlot('hero'), featureReports: resolveSlot('feature') };
}
