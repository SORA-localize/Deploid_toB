'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { reportCategoryLabels } from '@/lib/labels';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { cn } from '@/lib/utils';
import type { ReportCategory } from '@/data/types';
import { useMemo } from 'react';

export const CATEGORY_TABS: Array<{ value: ReportCategory | 'all'; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'tech', label: reportCategoryLabels.tech },
  { value: 'business', label: reportCategoryLabels.business },
  { value: 'deployment', label: reportCategoryLabels.deployment },
  { value: 'policy', label: reportCategoryLabels.policy },
  { value: 'entertainment', label: reportCategoryLabels.entertainment },
];

export function ReportsHeader() {
  const { getParam, updateParams } = useUrlFilters();

  const activeCategory = useMemo<ReportCategory | 'all'>(() => {
    const p = getParam('category');
    return (CATEGORY_TABS.find((t) => t.value === p)?.value ?? 'all') as ReportCategory | 'all';
  }, [getParam]);

  return (
    <div className="shrink-0 border-b border-border bg-background">
      <div className="site-container pt-4 pb-2">
        <Breadcrumbs items={[{ label: uiText.reports.breadcrumb }]} />
      </div>
      <div className="site-container">
        <div
          className="flex flex-wrap gap-0"
          role="tablist"
          aria-label="カテゴリで絞り込む"
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeCategory === tab.value}
              onClick={() =>
                updateParams({ category: tab.value === 'all' ? null : tab.value })
              }
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeCategory === tab.value
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
