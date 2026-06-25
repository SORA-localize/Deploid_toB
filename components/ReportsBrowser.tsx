'use client';

import { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { EmptyState } from '@/components/EmptyState';
import { NewsFeatureCard } from '@/components/NewsFeatureCard';
import { NewsCard } from '@/components/NewsCard';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import { ReportsHeader } from '@/components/ReportsHeader';
import { SearchInput } from '@/components/SearchInput';
import { SelectControl } from '@/components/SelectControl';
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
import {
  getArticleIndustryTagOptions,
  getArticleRegionOptions,
  getArticleThemeOptions,
  getTagLabel,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import type { ArticleSectionFilter } from '@/lib/articleSections';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { cn } from '@/lib/utils';

export interface ReportsFilters {
  industry: string | null;
  region: string | null;
  theme: string | null;
  query: string;
}

interface ReportsBrowserProps {
  reports: Article[];
  activeSection: ArticleSectionFilter;
  initialFilters: ReportsFilters;
  initialPageParam: string | null;
}

type FacetKey = 'theme' | 'industry' | 'region';

export function ReportsBrowser({
  reports,
  activeSection,
  initialFilters,
  initialPageParam,
}: ReportsBrowserProps) {
  const { updateParams } = useUrlParamUpdater();
  const perPage = useArticlesPerPage();
  const gridRef = useRef<HTMLDivElement>(null);
  const { industry, region, theme, query } = initialFilters;

  const sorted = useMemo(() => [...reports].sort(byArticlePublishedDesc), [reports]);

  const { heroReports, featureReports } = useMemo(
    () => getArticleIndexPlacementReports(sorted),
    [sorted],
  );

  // 記事のフリーテキスト検索は MiniSearch（日本語トークナイズ）。クエリ空なら null＝全件通過。
  const searchIndex = useMemo(() => createArticleSearchIndex(reports), [reports]);
  const matchedSlugs = useMemo(() => searchArticleSlugs(searchIndex, query), [searchIndex, query]);

  // ファセットの選択肢は実データから導出（lib/tags.ts、件数つき・レジストリ表示順）。
  const themeSelectOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allThemes },
      ...getArticleThemeOptions(reports).map((o) => ({ value: o.value, label: o.label })),
    ],
    [reports],
  );
  const industrySelectOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allIndustries },
      ...getArticleIndustryTagOptions(reports).map((o) => ({ value: o.value, label: o.label })),
    ],
    [reports],
  );
  const regionSelectOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allRegions },
      ...getArticleRegionOptions(reports).map((o) => ({ value: o.value, label: o.label })),
    ],
    [reports],
  );

  const hasActiveFilters = Boolean(query.trim() || industry || region || theme);

  const gridReports = useMemo(
    () =>
      filterArticles({
        reports: sorted,
        filters: { section: activeSection, industry, region, theme },
        matchedSlugs,
      }),
    [sorted, activeSection, industry, region, theme, matchedSlugs],
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

  // ファセット変更時はページを1に戻す（絞り込みで件数が変わるため）。
  const setFacet = (key: FacetKey, value: string) =>
    updateParams({ [key]: value === 'all' ? null : value, [ARTICLE_PAGE_PARAM]: null });

  const activeChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    const push = (key: FacetKey, value: string | null, kind: 'theme' | 'industry' | 'region') => {
      if (!value) return;
      chips.push({
        key,
        label: getTagLabel(value, kind),
        onRemove: () => updateParams({ [key]: null, [ARTICLE_PAGE_PARAM]: null }),
      });
    };
    push('theme', theme, 'theme');
    push('industry', industry, 'industry');
    push('region', region, 'region');
    return chips;
  }, [theme, industry, region, updateParams]);

  const updatePage = (page: number) => {
    updateParams({ [ARTICLE_PAGE_PARAM]: page <= 1 ? null : String(page) });
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showHero = activeSection === 'all' && !hasActiveFilters && heroReports.length > 0;

  return (
    <div className="bg-background">
      <ReportsHeader activeSection={activeSection} />

      {/* ── 検索 + ファセット絞り込み（robots/use-cases と同じ構造） ── */}
      <div className="border-b border-border bg-card">
        <div className="site-container space-y-3 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <SearchInput
              value={query}
              onChange={(nextQuery) =>
                updateParams({ q: nextQuery, [ARTICLE_PAGE_PARAM]: null }, 'replace')
              }
              placeholder={uiText.searchPlaceholders.reports}
              className="lg:max-w-xs"
            />
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <SelectControl
                id="report-theme"
                label={uiText.filters.theme}
                value={theme ?? 'all'}
                onChange={(v) => setFacet('theme', v)}
                options={themeSelectOptions}
              />
              <SelectControl
                id="report-industry"
                label={uiText.filters.industry}
                value={industry ?? 'all'}
                onChange={(v) => setFacet('industry', v)}
                options={industrySelectOptions}
              />
              <SelectControl
                id="report-region"
                label={uiText.filters.region}
                value={region ?? 'all'}
                onChange={(v) => setFacet('region', v)}
                options={regionSelectOptions}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-3">
              <ActiveFilterChips chips={activeChips} />
              <span className="shrink-0 text-xs text-muted-foreground">
                {uiText.common.results(gridReports.length, true)}
              </span>
            </div>
          )}
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
