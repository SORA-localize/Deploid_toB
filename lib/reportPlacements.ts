import { reportIndexPlacementLimits, reportPlacements } from '@/data/reportPlacements';
import type { Report, ReportPlacementSlot } from '@/data/types';

const reportsIndexSurface = 'reports-index';
const homeFeaturedReportLimit = 4;

function sortReportsByPublishedAt(reports: readonly Report[]) {
  return [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function getReportsBySlug(reports: readonly Report[]) {
  return new Map(reports.map((report) => [report.slug, report]));
}

function appendPlacedReports({
  reportsBySlug,
  selectedReports,
  usedSlugs,
  slot,
  limit,
}: {
  reportsBySlug: Map<string, Report>;
  selectedReports: Report[];
  usedSlugs: Set<string>;
  slot: ReportPlacementSlot;
  limit: number;
}) {
  reportPlacements
    .filter((placement) => placement.surface === reportsIndexSurface && placement.slot === slot)
    .sort((a, b) => a.order - b.order)
    .forEach((placement) => {
      if (selectedReports.length >= limit || usedSlugs.has(placement.reportSlug)) return;
      const report = reportsBySlug.get(placement.reportSlug);
      if (!report) return;
      selectedReports.push(report);
      usedSlugs.add(report.slug);
    });
}

function appendLatestReports({
  sortedReports,
  selectedReports,
  usedSlugs,
  limit,
}: {
  sortedReports: readonly Report[];
  selectedReports: Report[];
  usedSlugs: Set<string>;
  limit: number;
}) {
  for (const report of sortedReports) {
    if (selectedReports.length >= limit) break;
    if (usedSlugs.has(report.slug)) continue;
    selectedReports.push(report);
    usedSlugs.add(report.slug);
  }
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

  appendPlacedReports({ reportsBySlug, selectedReports: slotReports, usedSlugs, slot, limit });
  appendLatestReports({ sortedReports, selectedReports: slotReports, usedSlugs, limit });

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

export function getHomeFeaturedReports(reports: readonly Report[]) {
  const sortedReports = sortReportsByPublishedAt(reports);
  const reportsBySlug = getReportsBySlug(reports);
  const selectedReports: Report[] = [];
  const usedSlugs = new Set<string>();

  appendPlacedReports({
    reportsBySlug,
    selectedReports,
    usedSlugs,
    slot: 'hero',
    limit: homeFeaturedReportLimit,
  });
  appendPlacedReports({
    reportsBySlug,
    selectedReports,
    usedSlugs,
    slot: 'feature',
    limit: homeFeaturedReportLimit,
  });
  appendLatestReports({
    sortedReports,
    selectedReports,
    usedSlugs,
    limit: homeFeaturedReportLimit,
  });

  return selectedReports;
}
