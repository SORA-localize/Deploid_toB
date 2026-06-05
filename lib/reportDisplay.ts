import type { Report, ReportCategory, ReportType } from '@/data/types';

const typeToCategoryMap: Record<ReportType, ReportCategory> = {
  'tech-update': 'tech',
  analysis: 'tech',
  'market-analysis': 'business',
  interview: 'business',
  'deployment-report': 'deployment',
  'case-study': 'deployment',
  'policy-update': 'policy',
  'event-report': 'entertainment',
  'news-brief': 'entertainment',
};

export function inferCategoryFromType(type: ReportType): ReportCategory {
  return typeToCategoryMap[type];
}

export function getReportCategory(report: Report): ReportCategory {
  return report.category ?? inferCategoryFromType(report.type);
}

export function getFeaturedReport(reports: readonly Report[]): Report | undefined {
  return (
    reports.find((r) => r.featured) ??
    [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]
  );
}
