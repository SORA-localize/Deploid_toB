import { articleIndexPlacementLimits, articlePlacements } from '@/data/articlePlacements';
import type { Article, ArticlePlacementSlot } from '@/data/types';

const reportsIndexSurface = 'reports-index';

function sortReportsByPublishedAt(reports: readonly Article[]) {
  return [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function getArticlesById(reports: readonly Article[]) {
  return new Map(reports.map((report) => [report.id, report]));
}

function resolvePlacementSlot({
  reports,
  sortedReports,
  usedIds,
  slot,
}: {
  reports: readonly Article[];
  sortedReports: readonly Article[];
  usedIds: Set<string>;
  slot: ArticlePlacementSlot;
}) {
  const limit = articleIndexPlacementLimits[slot];
  const reportsById = getArticlesById(reports);
  const slotReports: Article[] = [];

  articlePlacements
    .filter((placement) => placement.surface === reportsIndexSurface && placement.slot === slot)
    .sort((a, b) => a.order - b.order)
    .forEach((placement) => {
      if (slotReports.length >= limit || usedIds.has(placement.reportId)) return;
      const report = reportsById.get(placement.reportId);
      if (!report) return;
      slotReports.push(report);
      usedIds.add(report.id);
    });

  for (const report of sortedReports) {
    if (slotReports.length >= limit) break;
    if (usedIds.has(report.id)) continue;
    slotReports.push(report);
    usedIds.add(report.id);
  }

  return slotReports;
}

export function getArticleIndexPlacementReports(reports: readonly Article[]) {
  const sortedReports = sortReportsByPublishedAt(reports);
  const usedIds = new Set<string>();

  return {
    heroReports: resolvePlacementSlot({
      reports,
      sortedReports,
      usedIds,
      slot: 'hero',
    }),
    featureReports: resolvePlacementSlot({
      reports,
      sortedReports,
      usedIds,
      slot: 'feature',
    }),
  };
}
