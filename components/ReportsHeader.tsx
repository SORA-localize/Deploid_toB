'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { ARTICLE_SHELF_TABS, type ArticleShelf } from '@/lib/articleShelves';
import { uiText } from '@/lib/uiText';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { ARTICLE_PAGE_PARAM } from '@/lib/articlePagination';

interface ReportsHeaderProps {
  activeShelf: ArticleShelf;
  tabs?: readonly PageTab<ArticleShelf>[];
}

export function ReportsHeader({ activeShelf, tabs = ARTICLE_SHELF_TABS }: ReportsHeaderProps) {
  const { updateParams } = useUrlParamUpdater();

  return (
    <ContextualPageHeader>
      <PageTabBar
        tabs={tabs}
        activeValue={activeShelf}
        onSelect={(value) =>
          updateParams({
            kind: value === 'all' ? null : value,
            [ARTICLE_PAGE_PARAM]: null,
          })
        }
        ariaLabel={uiText.reports.breadcrumb}
      />
    </ContextualPageHeader>
  );
}
