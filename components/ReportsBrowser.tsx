'use client';

import { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { NewsFeatureCard } from '@/components/NewsFeatureCard';
import { NewsCard } from '@/components/NewsCard';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import { ReportsHeader } from '@/components/ReportsHeader';
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
import { createReportSearchDocument } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import type { ArticleSectionFilter } from '@/lib/articleSections';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { cn } from '@/lib/utils';

interface ReportsBrowserProps {
  reports: Article[];
  activeSection: ArticleSectionFilter;
  initialPageParam: string | null;
}

export function ReportsBrowser({ reports, activeSection, initialPageParam }: ReportsBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const perPage = useArticlesPerPage();
  const gridRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...reports].sort(byArticlePublishedDesc),
    [reports],
  );

  const { heroReports, featureReports } = useMemo(
    () => getArticleIndexPlacementReports(sorted),
    [sorted],
  );

  const searchDocuments = useMemo(
    () => new Map(reports.map((r) => [r.slug, createReportSearchDocument(r)])),
    [reports],
  );

  const gridReports = useMemo(
    () =>
      filterArticles({
        reports: sorted,
        searchDocuments,
        filters: { type: 'all', section: activeSection, topic: null, query: '' },
      }),
    [sorted, searchDocuments, activeSection],
  );
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

  const updatePage = (page: number) => {
    updateParams({
      [ARTICLE_PAGE_PARAM]: page <= 1 ? null : String(page),
    });
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-background">
      <ReportsHeader activeSection={activeSection} />

      <div>

        {/* ── ヒーロー + フィーチャー枠（すべてタブのみ） ── */}
        {activeSection === 'all' && heroReports.length > 0 && (
          <div className="site-container py-4">
            {/*
              表示対象は data/articlePlacements.ts の掲載枠で制御する。
              グリッドの行高さはカルーセルの aspect-ratio で決まる。
              右列は grid の stretch 整列（デフォルト）でその高さに伸び、
              h-full + flex-col でフィーチャー枠に均等分配する。
            */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* 左: カルーセル (2/3) */}
              <div className="lg:col-span-2">
                <NewsHeroCarousel
                  reports={heroReports}
                  className="aspect-[16/9] w-full"
                />
              </div>

              {/* 右: フィーチャー枠 (1/3)、hero と同じ高さに揃える */}
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
          {gridReports.length === 0 ? (
            <EmptyState message={uiText.emptyStates.reports} />
          ) : (
            <div className="space-y-3">
              <CardHoverEffect className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-stretch">
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
