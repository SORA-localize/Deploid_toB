'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { REPORT_PAGE_PARAM } from '@/lib/reportPagination';
import { REPORT_CATEGORY_TABS } from '@/lib/reportCategories';
import { uiText } from '@/lib/uiText';
import { useActiveReportCategory } from '@/lib/useActiveReportCategory';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { cn } from '@/lib/utils';

export function ReportsHeader() {
  const activeCategory = useActiveReportCategory();
  const { updateParams } = useUrlFilters();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="site-container pt-4 pb-2">
        <Breadcrumbs items={[{ label: uiText.reports.breadcrumb }]} />
      </div>
      <div className="site-container">
        <div
          className="flex flex-wrap gap-0"
          role="tablist"
          aria-label="カテゴリで絞り込む"
        >
          {REPORT_CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeCategory === tab.value}
              onClick={() =>
                updateParams({
                  category: tab.value === 'all' ? null : tab.value,
                  [REPORT_PAGE_PARAM]: null,
                })
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
