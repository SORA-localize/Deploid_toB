'use client';

import { useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsCardGridSkeleton } from '@/components/NewsCardGridSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { NewsFeatureCard } from '@/components/NewsFeatureCard';
import { NewsCard } from '@/components/NewsCard';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import { ReportsHeader } from '@/components/ReportsHeader';
import { SearchInput } from '@/components/SearchInput';
import { CardHoverEffect } from '@/components/ui/card-hover-effect';
import type { Article } from '@/data/types';
import { filterArticles } from '@/lib/articleFilters';
import { byArticlePublishedDesc } from '@/lib/display';
import {
  getArticlePageCount,
  getArticlePageItems,
  getArticlePaginationPages,
  normalizeReportPageParam,
  ARTICLE_PAGE_PARAM,
} from '@/lib/articlePagination';
import { useArticlesPerPage } from '@/lib/useArticlesPerPage';
import { getArticleIndexPlacementReports } from '@/lib/articlePlacements';
import { createArticleSearchIndex, searchArticleSlugs } from '@/lib/searchIndex';
import { uiText } from '@/lib/uiText';
import {
  ARTICLE_SHELF_TABS,
  getArticleShelf,
  type ArticleShelf,
} from '@/lib/articleShelves';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { cn } from '@/lib/utils';

interface ReportsBrowserProps {
  reports: Article[];
  activeShelf: ArticleShelf;
  initialQuery: string;
  initialPageParam: string | null;
}

export function ReportsBrowser({
  reports,
  activeShelf,
  initialQuery,
  initialPageParam,
}: ReportsBrowserProps) {
  const { updateParams, isPending } = useUrlParamUpdater();
  const perPage = useArticlesPerPage();
  const gridRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => [...reports].sort(byArticlePublishedDesc), [reports]);

  const { heroReports, featureReports } = useMemo(
    () => getArticleIndexPlacementReports(sorted),
    [sorted],
  );

  const searchIndex = useMemo(() => createArticleSearchIndex(reports), [reports]);
  const matchedSlugs = useMemo(
    () => searchArticleSlugs(searchIndex, initialQuery),
    [searchIndex, initialQuery],
  );

  const hasActiveFilters = Boolean(initialQuery.trim());

  const gridReports = useMemo(
    () => filterArticles({ reports: sorted, shelf: activeShelf, matchedSlugs }),
    [sorted, activeShelf, matchedSlugs],
  );

  const shelfTabs = useMemo(() => {
    const countBase = filterArticles({ reports: sorted, matchedSlugs });
    const countByShelf = new Map<ArticleShelf, number>();
    for (const article of countBase) {
      const shelf = getArticleShelf(article);
      countByShelf.set(shelf, (countByShelf.get(shelf) ?? 0) + 1);
    }
    return ARTICLE_SHELF_TABS.map((tab) => {
      const count = tab.value === 'all' ? countBase.length : (countByShelf.get(tab.value) ?? 0);
      return {
        ...tab,
        count,
        // 0件かつ現在選択中でないタブは disabled（active tab には指定しない）。
        // basics-guide は ARTICLE_SHELF_TABS 側で固定 disabled なのでそちらが優先される。
        disabled: tab.disabled || (tab.value !== 'all' && tab.value !== activeShelf && count === 0),
      };
    });
  }, [sorted, matchedSlugs, activeShelf]);

  const pageCount = getArticlePageCount(gridReports.length, perPage);
  const activePage = useMemo(
    () => normalizeReportPageParam(initialPageParam, pageCount),
    [initialPageParam, pageCount],
  );
  const paginatedReports = useMemo(
    () => getArticlePageItems(gridReports, activePage, perPage),
    [gridReports, activePage, perPage],
  );
  const paginationPages = useMemo(
    () => getArticlePaginationPages(activePage, pageCount),
    [activePage, pageCount],
  );

  const updateShelf = useCallback(
    (value: ArticleShelf) => {
      updateParams({
        kind: value === 'all' ? null : value,
        [ARTICLE_PAGE_PARAM]: null,
      });
    },
    [updateParams],
  );

  const updatePage = (page: number) => {
    updateParams({ [ARTICLE_PAGE_PARAM]: page <= 1 ? null : String(page) });
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showHero = activeShelf === 'all' && !hasActiveFilters && heroReports.length > 0;

  return (
    <div className="bg-background">
      <ReportsHeader activeShelf={activeShelf} tabs={shelfTabs} onShelfSelect={updateShelf} />

      {/* ── 検索 ── */}
      <div className="border-b border-border bg-card">
        <div className="site-container py-4">
          <SearchInput
            id="reports-search"
            label={uiText.filters.keywordSearch}
            value={initialQuery}
            onChange={(nextQuery) =>
              updateParams({ q: nextQuery, [ARTICLE_PAGE_PARAM]: null }, 'replace')
            }
            placeholder={uiText.searchPlaceholders.reports}
            className="w-full sm:w-72 md:w-96"
          />
        </div>
      </div>

      <div>
        {/* ── ヒーロー + フィーチャー枠（フィルタ未適用の「すべて」タブのみ） ── */}
        {showHero && (
          <div className="site-container py-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <NewsHeroCarousel reports={heroReports} className="aspect-[16/9] w-full" />
              </div>
              {featureReports.length > 0 && (
                <div className="hidden lg:flex flex-col gap-4 h-full">
                  {featureReports.map((r) => (
                    <NewsFeatureCard key={r.id} report={r} className="flex-1 min-h-0" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 記事グリッド ── */}
        <div ref={gridRef} className="site-container py-4 scroll-mt-site-header">
          {isPending ? (
            <NewsCardGridSkeleton gridClassName={browserGridClassNames.reports} />
          ) : gridReports.length === 0 ? (
            <EmptyState message={uiText.emptyStates.reports} />
          ) : (
            <div className="space-y-3">
              <CardHoverEffect className={browserGridClassNames.reports}>
                {paginatedReports.map((r) => (
                  <NewsCard key={r.id} report={r} />
                ))}
              </CardHoverEffect>

              {pageCount > 1 && (
                <nav
                  className="flex items-center justify-center gap-3 pt-1"
                  aria-label="記事一覧のページネーション"
                >
                  <button
                    type="button"
                    onClick={() => updatePage(activePage - 1)}
                    disabled={activePage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                    aria-label="前のページ"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => updatePage(page)}
                      aria-current={activePage === page ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-8 min-w-6 items-center justify-center px-1 text-xs font-medium transition-colors',
                        activePage === page
                          ? 'text-foreground underline decoration-2 underline-offset-4'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => updatePage(activePage + 1)}
                    disabled={activePage === pageCount}
                    className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                    aria-label="次のページ"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
