'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar } from '@/components/PageTabBar';
import { ARTICLE_SECTION_TABS } from '@/lib/articleSections';
import { uiText } from '@/lib/uiText';
import { useActiveArticleSection } from '@/lib/useActiveArticleSection';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { ARTICLE_PAGE_PARAM } from '@/lib/articlePagination';

export function ReportsHeader() {
  const activeSection = useActiveArticleSection();
  const { updateParams } = useUrlFilters();

  return (
    <ContextualPageHeader>
      <PageTabBar
        tabs={ARTICLE_SECTION_TABS}
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
