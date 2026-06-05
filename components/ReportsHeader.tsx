'use client';

import { PageTabBar } from '@/components/PageTabBar';
import { REPORT_CATEGORY_TABS } from '@/lib/reportCategories';
import { uiText } from '@/lib/uiText';
import { useActiveReportCategory } from '@/lib/useActiveReportCategory';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { REPORT_PAGE_PARAM } from '@/lib/reportPagination';

export function ReportsHeader() {
  const activeCategory = useActiveReportCategory();
  const { updateParams } = useUrlFilters();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="site-container">
        <PageTabBar
          tabs={REPORT_CATEGORY_TABS}
          activeValue={activeCategory}
          onSelect={(value) =>
            updateParams({
              category: value === 'all' ? null : value,
              [REPORT_PAGE_PARAM]: null,
            })
          }
          ariaLabel={uiText.reports.breadcrumb}
        />
      </div>
    </div>
  );
}
