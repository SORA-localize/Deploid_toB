'use client';

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
  // タブ行はミラーを作らず、この要素自体を position:sticky で固定する
  // （RobotsBrowser の主軸タブと同じ考え方）。ContextualPageHeader 経由の追従バーは
  // スクロールするまで DOM に存在せずページ先頭から Tab で到達できなかったため、
  // 積み残し登録簿 #5 対応でこちらへ切り替えた。
  // sticky が効く範囲は containing block（直近の親要素）の高さに制約されるため、
  // ReportsBrowser 側でこのコンポーネントを十分な高さを持つラッパーの直下に置くこと
  // （Breadcrumbs/PageListHeader だけの短い site-container 内に置くとスクロール後
  // すぐ効かなくなる。実測して確認済み）。
  return (
    <div className="page-sticky-tabs site-container sticky top-[var(--header-h)] z-[var(--z-page-sticky)] mb-4 bg-background">
      <div className="page-sticky-tabs-inner overflow-x-auto border-b border-border">
        <PageTabBar
          tabs={tabs}
          activeValue={activeShelf}
          onSelect={onShelfSelect}
          ariaLabel={uiText.reports.breadcrumb}
        />
      </div>
    </div>
  );
}
