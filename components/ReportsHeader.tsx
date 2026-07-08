'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { ARTICLE_SHELF_TABS, type ArticleShelf } from '@/lib/articleShelves';
import { uiText } from '@/lib/uiText';

interface ReportsHeaderProps {
  activeShelf: ArticleShelf;
  tabs?: readonly PageTab<ArticleShelf>[];
  onShelfSelect: (value: ArticleShelf) => void;
}

export function ReportsHeader({
  activeShelf,
  tabs = ARTICLE_SHELF_TABS,
  onShelfSelect,
}: ReportsHeaderProps) {
  return (
    <ContextualPageHeader>
      <PageTabBar
        tabs={tabs}
        activeValue={activeShelf}
        onSelect={onShelfSelect}
        ariaLabel={uiText.reports.breadcrumb}
      />
    </ContextualPageHeader>
  );
}
