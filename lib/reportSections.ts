import type { ReportSection } from '@/data/types';
import { reportSectionOrder } from '@/lib/display';
import { reportSectionLabels } from '@/lib/labels';

/** UIフィルタ型。データ型 ReportSection に UI 専用の 'all' を加えたもの。 */
export type ReportSectionFilter = ReportSection | 'all';

export interface ReportSectionTab {
  value: ReportSectionFilter;
  label: string;
  description?: string;
}

/** タブごとの説明（ツールチップ）。section 値に紐づく。'all' は説明なし。 */
const reportSectionDescriptions: Record<ReportSection, string> = {
  deployment: '実稼働・PoCの結果、現場導入レポート',
  business: '資金調達、量産、市場予測、価格、業界の動き',
  tech: '新モデル発表、技術デモ、性能分析',
  policy: '法規制、安全基準、行政の動き',
  entertainment: 'バイラル動画、一般向け話題、カルチャー',
};

export const REPORT_SECTION_TABS: ReportSectionTab[] = [
  { value: 'all', label: 'すべて' },
  ...reportSectionOrder.map((value) => ({
    value,
    label: reportSectionLabels[value],
    description: reportSectionDescriptions[value],
  })),
];

export function normalizeReportSectionParam(value: string | null): ReportSectionFilter {
  return REPORT_SECTION_TABS.some((tab) => tab.value === value)
    ? (value as ReportSectionFilter)
    : 'all';
}
