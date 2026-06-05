'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { NewsCard } from '@/components/NewsCard';
import { NewsHero } from '@/components/NewsHero';
import { Marquee } from '@/components/ui/marquee';
import type { Report, ReportCategory } from '@/data/types';
import { reportCategoryLabels, reportTypeLabels } from '@/lib/labels';
import { filterReports } from '@/lib/reportFilters';
import { getFeaturedReport, getReportCategory } from '@/lib/reportDisplay';
import { createReportSearchDocument } from '@/lib/search';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { cn } from '@/lib/utils';

const CATEGORY_TABS: Array<{ value: ReportCategory | 'all'; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'tech', label: reportCategoryLabels.tech },
  { value: 'business', label: reportCategoryLabels.business },
  { value: 'deployment', label: reportCategoryLabels.deployment },
  { value: 'policy', label: reportCategoryLabels.policy },
  { value: 'entertainment', label: reportCategoryLabels.entertainment },
];

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const { getParam, updateParams } = useUrlFilters();

  const activeCategory = useMemo<ReportCategory | 'all'>(() => {
    const p = getParam('category');
    return (CATEGORY_TABS.find((t) => t.value === p)?.value ?? 'all') as ReportCategory | 'all';
  }, [getParam]);

  const isFiltered = activeCategory !== 'all';

  // 全記事を公開日降順で並べた基準リスト
  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [reports],
  );

  // hero = featured フラグ優先、なければ最新
  const heroReport = useMemo(() => getFeaturedReport(sorted), [sorted]);

  // featured 横一列 = hero の次の3件
  const featuredRow = useMemo(() => {
    if (!heroReport) return sorted.slice(0, 3);
    return sorted.filter((r) => r.slug !== heroReport.slug).slice(0, 3);
  }, [sorted, heroReport]);

  // タブ下の記事グリッド（フィルタ適用）
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
    <div className="min-h-screen bg-background">

      {/* ── ページタイトル・説明 ── */}
      <div className="site-container py-8">
        <Breadcrumbs items={[{ label: uiText.reports.breadcrumb }]} />
        <h1 className="text-2xl font-semibold text-foreground mb-2">{uiText.reports.title}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          ヒューマノイド関連の最新情報ハブ。技術・ビジネス・導入事例・政策・エンタメの軸で整理する一次情報。
        </p>
      </div>

      {/* ── HERO ── */}
      {heroReport && (
        <div className="site-container pb-4">
          <NewsHero report={heroReport} />
        </div>
      )}

      {/* ── ニュース帯（Marquee） ── */}
      <div className="border-y border-border bg-muted/40 py-2">
        <div className="site-container">
          <Marquee pauseOnHover repeat={4} className="[--duration:60s] [--gap:3rem]">
            {sorted.map((r) => (
              <span key={r.slug} className="flex shrink-0 items-center gap-2 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {reportTypeLabels[r.type]}
                </span>
                <span className="text-foreground/70 hover:text-foreground whitespace-nowrap cursor-pointer">
                  {r.titleJa ?? r.title}
                </span>
              </span>
            ))}
          </Marquee>
        </div>
      </div>

      {/* ── Featured 横一列 ── */}
      {featuredRow.length > 0 && (
        <div className="site-container py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {featuredRow.map((r) => (
              <NewsCard key={r.slug} report={r} />
            ))}
          </div>
        </div>
      )}

      {/* ── タブ ── */}
      <div className="border-b border-t border-border bg-background">
        <div className="site-container">
          <div
            className="flex flex-wrap gap-0"
            role="tablist"
            aria-label="カテゴリで絞り込む"
          >
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.value}
                onClick={() =>
                  updateParams({ category: tab.value === 'all' ? null : tab.value })
                }
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeCategory === tab.value
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── タブ内記事グリッド ── */}
      <div className="site-container py-8 min-h-[40vh]">
        {gridReports.length === 0 ? (
          <EmptyState message={uiText.emptyStates.reports} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gridReports.map((r) => (
              <NewsCard key={r.slug} report={r} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
