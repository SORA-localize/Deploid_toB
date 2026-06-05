import type { ReportCategory } from '@/data/types';
import { reportCategoryLabels } from '@/lib/labels';

export type ReportCategoryFilter = ReportCategory | 'all';

export const REPORT_CATEGORY_TABS: Array<{ value: ReportCategoryFilter; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'tech', label: reportCategoryLabels.tech },
  { value: 'business', label: reportCategoryLabels.business },
  { value: 'deployment', label: reportCategoryLabels.deployment },
  { value: 'policy', label: reportCategoryLabels.policy },
  { value: 'entertainment', label: reportCategoryLabels.entertainment },
];

export function normalizeReportCategoryParam(value: string | null): ReportCategoryFilter {
  return REPORT_CATEGORY_TABS.some((tab) => tab.value === value)
    ? (value as ReportCategoryFilter)
    : 'all';
}
