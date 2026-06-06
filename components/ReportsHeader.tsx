'use client';

import { ArrowUp } from 'lucide-react';
import { PageTabBar } from '@/components/PageTabBar';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { scrollToPageTop } from '@/lib/scroll';
import { REPORT_CATEGORY_TABS } from '@/lib/reportCategories';
import { uiText } from '@/lib/uiText';
import { useActiveReportCategory } from '@/lib/useActiveReportCategory';
import { useStickyScroll } from '@/lib/useStickyScroll';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { REPORT_PAGE_PARAM } from '@/lib/reportPagination';

export function ReportsHeader() {
  const activeCategory = useActiveReportCategory();
  const { updateParams } = useUrlFilters();
  const isStuck = useStickyScroll();

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
          <button
            type="button"
            onClick={scrollToPageTop}
            className="shrink-0 text-primary transition-colors hover:text-brand-hover"
            aria-label="ページ先頭に戻る"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </StickyPageHeader>
  );
}
