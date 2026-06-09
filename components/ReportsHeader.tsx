'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar } from '@/components/PageTabBar';
import { REPORT_SECTION_TABS } from '@/lib/reportSections';
import { uiText } from '@/lib/uiText';
import { useActiveReportSection } from '@/lib/useActiveReportSection';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { REPORT_PAGE_PARAM } from '@/lib/reportPagination';

export function ReportsHeader() {
  const activeSection = useActiveReportSection();
  const { updateParams } = useUrlFilters();

  return (
    <ContextualPageHeader>
      <PageTabBar
        tabs={REPORT_SECTION_TABS}
        activeValue={activeSection}
        onSelect={(value) =>
          updateParams({
            section: value === 'all' ? null : value,
            // 旧 ?category= が残らないよう同時に除去する
            category: null,
            [REPORT_PAGE_PARAM]: null,
          })
        }
        ariaLabel={uiText.reports.breadcrumb}
      />
    </ContextualPageHeader>
  );
}
