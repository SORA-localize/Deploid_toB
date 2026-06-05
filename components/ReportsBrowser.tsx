'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { NewsCard } from '@/components/NewsCard';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import { ReportsHeader, CATEGORY_TABS } from '@/components/ReportsHeader';
import type { Report, ReportCategory } from '@/data/types';
import { filterReports } from '@/lib/reportFilters';
import { createReportSearchDocument } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const { getParam } = useUrlFilters();

  const activeCategory = useMemo<ReportCategory | 'all'>(() => {
    const p = getParam('category');
    return (CATEGORY_TABS.find((t) => t.value === p)?.value ?? 'all') as ReportCategory | 'all';
  }, [getParam]);

  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [reports],
  );

  // カルーセル: 最新5件
  const carouselReports = useMemo(() => sorted.slice(0, 5), [sorted]);
  // サイドカード: その次の2件
  const sideReports = useMemo(() => sorted.slice(5, 7), [sorted]);

  const searchDocuments = useMemo(
    () => new Map(reports.map((r) => [r.slug, createReportSearchDocument(r)])),
    [reports],
  );

  const gridReports = useMemo(
    () =>
      filterReports({
        reports: sorted,
        searchDocuments,
        filters: { type: 'all', category: activeCategory, topic: null, query: '' },
      }),
    [sorted, searchDocuments, activeCategory],
  );

  return (
    // App Shell: ビューポート残高を占有し、記事エリアのみスクロール
    <div
      className="flex flex-col overflow-hidden bg-background"
      style={{ height: 'calc(100dvh - var(--header-h))' }}
    >
      {/* ── カテゴリタブ（上部固定） ── */}
      <ReportsHeader />

      {/* ── スクロール可能コンテンツエリア ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── ヒーロー + サイドカード（すべてタブのみ） ── */}
        {activeCategory === 'all' && carouselReports.length > 0 && (
          <div className="site-container py-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* 左: カルーセル (2/3) */}
              <div className="lg:col-span-2">
                <NewsHeroCarousel
                  reports={carouselReports}
                  className="aspect-[16/9] w-full"
                />
              </div>

              {/* 右: サイドカード2件 (1/3) */}
              {sideReports.length > 0 && (
                <div className="hidden lg:flex flex-col gap-4">
                  {sideReports.map((r) => (
                    <NewsCard key={r.slug} report={r} className="flex-1" />
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── 記事グリッド ── */}
        <div className="site-container py-6">
          {gridReports.length === 0 ? (
            <EmptyState message={uiText.emptyStates.reports} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gridReports.map((r) => (
                <NewsCard key={r.slug} report={r} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
