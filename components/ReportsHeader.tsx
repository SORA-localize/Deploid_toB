'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
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
    <ContextualPageHeader>
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
    </ContextualPageHeader>
  );
}
