'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { ARTICLE_SECTION_TABS, type ArticleSectionFilter } from '@/lib/articleSections';
import { uiText } from '@/lib/uiText';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { ARTICLE_PAGE_PARAM } from '@/lib/articlePagination';

interface ReportsHeaderProps {
  activeSection: ArticleSectionFilter;
  tabs?: readonly PageTab<ArticleSectionFilter>[];
}

export function ReportsHeader({ activeSection, tabs = ARTICLE_SECTION_TABS }: ReportsHeaderProps) {
  const { updateParams } = useUrlParamUpdater();

  return (
    <ContextualPageHeader>
      <PageTabBar
        tabs={tabs}
        activeValue={activeSection}
        onSelect={(value) =>
          updateParams({
            section: value === 'all' ? null : value,
            // 旧 ?category= が残らないよう同時に除去する
            category: null,
            [ARTICLE_PAGE_PARAM]: null,
          })
        }
        ariaLabel={uiText.reports.breadcrumb}
      />
    </ContextualPageHeader>
  );
}
