import { reportIndexPlacementLimits, reportPlacements } from '@/data/reportPlacements';
import type { Report, ReportPlacementSlot } from '@/data/types';

const reportsIndexSurface = 'reports-index';

function sortReportsByPublishedAt(reports: readonly Report[]) {
  return [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function getReportsBySlug(reports: readonly Report[]) {
  return new Map(reports.map((report) => [report.slug, report]));
}

function resolvePlacementSlot({
  reports,
  sortedReports,
  usedSlugs,
  slot,
}: {
  reports: readonly Report[];
  sortedReports: readonly Report[];
  usedSlugs: Set<string>;
  slot: ReportPlacementSlot;
}) {
  const limit = reportIndexPlacementLimits[slot];
  const reportsBySlug = getReportsBySlug(reports);
  const slotReports: Report[] = [];

  reportPlacements
    .filter((placement) => placement.surface === reportsIndexSurface && placement.slot === slot)
    .sort((a, b) => a.order - b.order)
    .forEach((placement) => {
      if (slotReports.length >= limit || usedSlugs.has(placement.reportSlug)) return;
      const report = reportsBySlug.get(placement.reportSlug);
      if (!report) return;
      slotReports.push(report);
      usedSlugs.add(report.slug);
    });

  for (const report of sortedReports) {
    if (slotReports.length >= limit) break;
    if (usedSlugs.has(report.slug)) continue;
    slotReports.push(report);
    usedSlugs.add(report.slug);
  }

  return slotReports;
}

export function getReportIndexPlacementReports(reports: readonly Report[]) {
  const sortedReports = sortReportsByPublishedAt(reports);
  const usedSlugs = new Set<string>();

  return {
    heroReports: resolvePlacementSlot({
      reports,
      sortedReports,
      usedSlugs,
      slot: 'hero',
    }),
    featureReports: resolvePlacementSlot({
      reports,
      sortedReports,
      usedSlugs,
      slot: 'feature',
    }),
  };
}
