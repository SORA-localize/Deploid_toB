'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { NewsFeatureCard } from '@/components/NewsFeatureCard';
import { NewsCard } from '@/components/NewsCard';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import { ReportsHeader } from '@/components/ReportsHeader';
import { CardHoverEffect } from '@/components/ui/card-hover-effect';
import type { Report } from '@/data/types';
import { filterReports } from '@/lib/reportFilters';
import { getReportIndexPlacementReports } from '@/lib/reportPlacements';
import { createReportSearchDocument } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import { useActiveReportCategory } from '@/lib/useActiveReportCategory';

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const activeCategory = useActiveReportCategory();

  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [reports],
  );

  const { heroReports, featureReports } = useMemo(
    () => getReportIndexPlacementReports(sorted),
    [sorted],
  );

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
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">

        {/* ── ヒーロー + フィーチャー枠（すべてタブのみ） ── */}
        {activeCategory === 'all' && heroReports.length > 0 && (
          <div className="site-container py-6">
            {/*
              表示対象は data/reportPlacements.ts の掲載枠で制御する。
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
                    <NewsFeatureCard key={r.slug} report={r} className="flex-1 min-h-0" />
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
            <CardHoverEffect className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gridReports.map((r) => (
                <NewsCard key={r.slug} report={r} />
              ))}
            </CardHoverEffect>
          )}
        </div>

      </div>
    </div>
  );
}
