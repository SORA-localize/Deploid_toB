import { articleIndexPlacementLimits, articlePlacements } from '@/data/articlePlacements';
import type { Article, ArticlePlacementSlot } from '@/data/types';
import { byArticlePublishedDesc } from '@/lib/display';

const reportsIndexSurface = 'reports-index';
const homeFeaturedArticleLimit = 4;

function sortArticlesByPublishedAt(articles: readonly Article[]) {
  return [...articles].sort(byArticlePublishedDesc);
}

function getArticlesById(articles: readonly Article[]) {
  return new Map(articles.map((article) => [article.id, article]));
}

function appendPlacedArticles({
  articlesById,
  selectedArticles,
  usedIds,
  slot,
  limit,
}: {
  articlesById: Map<string, Article>;
  selectedArticles: Article[];
  usedIds: Set<string>;
  slot: ArticlePlacementSlot;
  limit: number;
}) {
  articlePlacements
    .filter((placement) => placement.surface === reportsIndexSurface && placement.slot === slot)
    .sort((a, b) => a.order - b.order)
    .forEach((placement) => {
      if (selectedArticles.length >= limit || usedIds.has(placement.articleId)) return;
      const article = articlesById.get(placement.articleId);
      if (!article) return;
      selectedArticles.push(article);
      usedIds.add(article.id);
    });
}

function appendLatestArticles({
  sortedArticles,
  selectedArticles,
  usedIds,
  limit,
}: {
  sortedArticles: readonly Article[];
  selectedArticles: Article[];
  usedIds: Set<string>;
  limit: number;
}) {
  for (const article of sortedArticles) {
    if (selectedArticles.length >= limit) break;
    if (usedIds.has(article.id)) continue;
    selectedArticles.push(article);
    usedIds.add(article.id);
  }
}

function resolvePlacementSlot({
  articles,
  sortedArticles,
  usedIds,
  slot,
}: {
  articles: readonly Article[];
  sortedArticles: readonly Article[];
  usedIds: Set<string>;
  slot: ArticlePlacementSlot;
}) {
  const limit = articleIndexPlacementLimits[slot];
  const articlesById = getArticlesById(articles);
  const slotArticles: Article[] = [];

  appendPlacedArticles({ articlesById, selectedArticles: slotArticles, usedIds, slot, limit });
  appendLatestArticles({ sortedArticles, selectedArticles: slotArticles, usedIds, limit });

  return slotArticles;
}

export function getArticleIndexPlacementReports(articles: readonly Article[]) {
  const sortedArticles = sortArticlesByPublishedAt(articles);
  const usedIds = new Set<string>();

  return {
    heroReports: resolvePlacementSlot({
      articles,
      sortedArticles,
      usedIds,
      slot: 'hero',
    }),
    featureReports: resolvePlacementSlot({
      articles,
      sortedArticles,
      usedIds,
      slot: 'feature',
    }),
  };
}

export function getHomeFeaturedArticles(articles: readonly Article[]) {
  const sortedArticles = sortArticlesByPublishedAt(articles);
  const articlesById = getArticlesById(articles);
  const selectedArticles: Article[] = [];
  const usedIds = new Set<string>();

  appendPlacedArticles({
    articlesById,
    selectedArticles,
    usedIds,
    slot: 'hero',
    limit: homeFeaturedArticleLimit,
  });
  appendPlacedArticles({
    articlesById,
    selectedArticles,
    usedIds,
    slot: 'feature',
    limit: homeFeaturedArticleLimit,
  });
  appendLatestArticles({
    sortedArticles,
    selectedArticles,
    usedIds,
    limit: homeFeaturedArticleLimit,
  });

  return selectedArticles;
}
