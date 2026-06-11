import { reportIndexPlacementLimits, reportPlacements } from '@/data/reportPlacements';
import type { Report, ReportPlacementSlot } from '@/data/types';

const reportsIndexSurface = 'reports-index';

function sortReportsByPublishedAt(reports: readonly Report[]) {
  return [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function getReportsById(reports: readonly Report[]) {
  return new Map(reports.map((report) => [report.id, report]));
}

function resolvePlacementSlot({
  reports,
  sortedReports,
  usedIds,
  slot,
}: {
  reports: readonly Report[];
  sortedReports: readonly Report[];
  usedIds: Set<string>;
  slot: ReportPlacementSlot;
}) {
  const limit = reportIndexPlacementLimits[slot];
  const reportsById = getReportsById(reports);
  const slotReports: Report[] = [];

  reportPlacements
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

export function getReportIndexPlacementReports(reports: readonly Report[]) {
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
