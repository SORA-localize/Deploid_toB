'use client';

import { PageTabBar } from '@/components/PageTabBar';
import { ScrollToTopIconButton } from '@/components/ScrollToTopIconButton';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { REPORT_CATEGORY_TABS } from '@/lib/reportCategories';
import { uiText } from '@/lib/uiText';
import { useActiveReportCategory } from '@/lib/useActiveReportCategory';
import { useHeaderStickyBarVisibility } from '@/lib/useHeaderStickyBarVisibility';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { REPORT_PAGE_PARAM } from '@/lib/reportPagination';

export function ReportsHeader() {
  const activeCategory = useActiveReportCategory();
  const { updateParams } = useUrlFilters();
  const isStuck = useHeaderStickyBarVisibility();

  return (
    <StickyPageHeader visible={isStuck}>
      <div className="site-container flex items-center">
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
        <div className="ml-auto flex items-center pl-4">
          <ScrollToTopIconButton />
        </div>
      </div>
    </StickyPageHeader>
  );
}
