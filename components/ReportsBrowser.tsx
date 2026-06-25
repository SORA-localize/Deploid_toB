'use client';

import { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { FacetFilterBar } from '@/components/FacetFilterBar';
import { NewsFeatureCard } from '@/components/NewsFeatureCard';
import { NewsCard } from '@/components/NewsCard';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import { ReportsHeader } from '@/components/ReportsHeader';
import { SearchInput } from '@/components/SearchInput';
import { CardHoverEffect } from '@/components/ui/card-hover-effect';
import type { Article, ArticleSection } from '@/data/types';
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
import { ARTICLE_FACETS } from '@/lib/facetConfig';
import { createArticleSearchIndex, searchArticleSlugs } from '@/lib/searchIndex';
import { uiText } from '@/lib/uiText';
import { ARTICLE_SECTION_TABS, type ArticleSectionFilter } from '@/lib/articleSections';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { cn } from '@/lib/utils';

export interface ReportsFilters {
  /** ファセット選択（URLパラメータ key → 値）。lib/facetConfig.ts の ARTICLE_FACETS が正本。 */
  facetValues: Record<string, string | null>;
  query: string;
}

interface ReportsBrowserProps {
  reports: Article[];
  activeSection: ArticleSectionFilter;
  initialFilters: ReportsFilters;
  initialPageParam: string | null;
}

export function ReportsBrowser({
  reports,
  activeSection,
  initialFilters,
  initialPageParam,
}: ReportsBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const perPage = useArticlesPerPage();
  const gridRef = useRef<HTMLDivElement>(null);
  const { facetValues, query } = initialFilters;

  const sorted = useMemo(() => [...reports].sort(byArticlePublishedDesc), [reports]);

  const { heroReports, featureReports } = useMemo(
    () => getArticleIndexPlacementReports(sorted),
    [sorted],
  );

  // 記事のフリーテキスト検索は MiniSearch（日本語トークナイズ）。クエリ空なら null＝全件通過。
  const searchIndex = useMemo(() => createArticleSearchIndex(reports), [reports]);
  const matchedSlugs = useMemo(() => searchArticleSlugs(searchIndex, query), [searchIndex, query]);

  // section タブで先に母集団を絞る（ファセットの選択肢・件数はこのタブ内で計算する）。
  const sectionScoped = useMemo(
    () => filterArticles({ reports: sorted, section: activeSection }),
    [sorted, activeSection],
  );

  const hasActiveFilters = Boolean(
    query.trim() || ARTICLE_FACETS.some((facet) => facetValues[facet.key]),
  );

  const gridReports = useMemo(
    () =>
      filterArticles({
        reports: sectionScoped,
        facets: ARTICLE_FACETS,
        facetValues,
        matchedSlugs,
      }),
    [sectionScoped, facetValues, matchedSlugs],
  );

  const sectionTabs = useMemo(() => {
    const sectionCountBase = filterArticles({
      reports: sorted,
      facets: ARTICLE_FACETS,
      facetValues,
      matchedSlugs,
    });
    const countBySection = new Map<ArticleSection, number>();

    for (const article of sectionCountBase) {
      countBySection.set(article.section, (countBySection.get(article.section) ?? 0) + 1);
    }

    return ARTICLE_SECTION_TABS.map((tab) => {
      const count = tab.value === 'all'
        ? sectionCountBase.length
        : countBySection.get(tab.value) ?? 0;

      return {
        ...tab,
        count,
        // Keep the current section enabled even when it has 0 results so URL-entered states stay legible.
        disabled: tab.value !== 'all' && tab.value !== activeSection && count === 0,
      };
    });
  }, [sorted, facetValues, matchedSlugs, activeSection]);

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

  // ファセット変更時はページを1に戻す（件数が変わるため）。他ファセットは保持（自動リセットしない）。
  const onFacetChange = (key: string, value: string | null) =>
    updateParams({ [key]: value, [ARTICLE_PAGE_PARAM]: null });

  const updatePage = (page: number) => {
    updateParams({ [ARTICLE_PAGE_PARAM]: page <= 1 ? null : String(page) });
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showHero = activeSection === 'all' && !hasActiveFilters && heroReports.length > 0;

  return (
    <div className="bg-background">
      <ReportsHeader activeSection={activeSection} tabs={sectionTabs} />

      {/* ── 検索 + ファセット絞り込み（設定駆動・件数つき・0件無効化） ── */}
      <div className="border-b border-border bg-card">
        <div className="site-container space-y-3 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <SearchInput
              id="reports-search"
              label={uiText.filters.keywordSearch}
              value={query}
              onChange={(nextQuery) =>
                updateParams({ q: nextQuery, [ARTICLE_PAGE_PARAM]: null }, 'replace')
              }
              placeholder={uiText.searchPlaceholders.reports}
              className="lg:max-w-xs"
            />
            <div className="flex-1">
              <FacetFilterBar
                articles={sectionScoped}
                facets={ARTICLE_FACETS}
                values={facetValues}
                matchedSlugs={matchedSlugs}
                resultCount={gridReports.length}
                active={hasActiveFilters}
                onChange={onFacetChange}
              />
            </div>
          </div>
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
