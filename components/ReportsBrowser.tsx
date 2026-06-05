'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { NewsBentoCard } from '@/components/NewsBentoCard';
import { NewsCard } from '@/components/NewsCard';
import { SearchInput } from '@/components/SearchInput';
import { TagChip } from '@/components/TagChip';
import { BentoGrid } from '@/components/ui/bento-grid';
import { Marquee } from '@/components/ui/marquee';
import type { Report, ReportCategory } from '@/data/types';
import { reportCategoryLabels, reportTypeLabels } from '@/lib/labels';
import { filterReports } from '@/lib/reportFilters';
import { getFeaturedReport, getReportCategory } from '@/lib/reportDisplay';
import { createReportSearchDocument } from '@/lib/search';
import { getReportTagOptions, normalizeTagKey } from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { getReportTypeTone } from '@/lib/visualSemantics';

const categoryOptions: Array<{ value: ReportCategory | 'all'; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'tech', label: reportCategoryLabels.tech },
  { value: 'business', label: reportCategoryLabels.business },
  { value: 'deployment', label: reportCategoryLabels.deployment },
  { value: 'policy', label: reportCategoryLabels.policy },
  { value: 'entertainment', label: reportCategoryLabels.entertainment },
];

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const { getParam, updateParams } = useUrlFilters();

  const filters = useMemo(() => {
    const catParam = getParam('category');
    const topicParam = getParam('tag');
    const queryParam = getParam('q') ?? '';
    return {
      type: 'all' as const,
      category: (categoryOptions.find((o) => o.value === catParam)?.value ?? 'all') as ReportCategory | 'all',
      topic: topicParam ? normalizeTagKey(topicParam) : null,
      query: queryParam,
    };
  }, [getParam]);

  const topicOptions = useMemo(() => getReportTagOptions(reports), [reports]);
  const searchDocuments = useMemo(
    () => new Map(reports.map((r) => [r.slug, createReportSearchDocument(r)])),
    [reports],
  );

  const filtered = useMemo(
    () => filterReports({ reports, searchDocuments, filters }),
    [reports, searchDocuments, filters],
  );

  const isFiltered = filters.category !== 'all' || !!filters.topic || !!filters.query;

  const featuredReport = useMemo(() => getFeaturedReport(reports), [reports]);

  // フィーチャー帯: featured 1件 + それ以外の最新2件
  const bentoReports = useMemo(() => {
    if (!featuredReport) return [];
    const rest = reports
      .filter((r) => r.slug !== featuredReport.slug)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 2);
    return [featuredReport, ...rest];
  }, [reports, featuredReport]);

  // グリッド表示: フィーチャー帯に使った3件を除いた残り
  const gridReports = useMemo(() => {
    if (isFiltered) return filtered;
    const bentoSlugs = new Set(bentoReports.map((r) => r.slug));
    return reports
      .filter((r) => !bentoSlugs.has(r.slug))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [reports, filtered, bentoReports, isFiltered]);

  // 速報マーキー用: 全件最新順
  const marqueeItems = useMemo(
    () => [...reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [reports],
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ── 速報マーキー ── */}
      {marqueeItems.length > 0 && (
        <div className="border-b border-border bg-background py-2">
          <Marquee pauseOnHover repeat={3} className="[--duration:50s] [--gap:2rem]">
            {marqueeItems.map((r) => (
              <Link
                key={r.slug}
                href={`/reports/${r.slug}`}
                className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <TagChip tone={getReportTypeTone(r.type)} className="text-[10px]">
                  {reportTypeLabels[r.type]}
                </TagChip>
                <span className="whitespace-nowrap">{r.titleJa ?? r.title}</span>
              </Link>
            ))}
          </Marquee>
        </div>
      )}

      {/* ── ヘッダー（タイトル + フィルタ） ── */}
      <div className="border-b border-border bg-card">
        <div className="site-container py-8">
          <Breadcrumbs items={[{ label: uiText.reports.breadcrumb }]} />
          <h1 className="mb-3 text-2xl font-semibold text-foreground">{uiText.reports.title}</h1>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            ヒューマノイド関連の最新情報を、技術・ビジネス・導入事例・政策・エンタメの軸で整理する一次情報ハブ。
          </p>

          {/* カテゴリタブ */}
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="カテゴリ">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={filters.category === opt.value}
                onClick={() => updateParams({ category: opt.value === 'all' ? null : opt.value, tag: null })}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
                  filters.category === opt.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* タグフィルター */}
          {topicOptions.length > 0 && (
            <FilterChipGroup
              options={topicOptions}
              value={filters.topic}
              onChange={(nextTopic) => updateParams({ tag: nextTopic })}
              allowDeselect
              onClear={() => updateParams({ tag: null })}
              ariaLabel={uiText.filters.reportTopics}
              className="mb-4"
            />
          )}

          {/* 検索 */}
          <SearchInput
            value={filters.query}
            onChange={(q) => updateParams({ q: q || null }, 'replace')}
            placeholder={uiText.searchPlaceholders.reports}
            className="max-w-xl"
            inputClassName="py-2.5"
          />
        </div>
      </div>

      <div className="site-container py-8 min-h-[60vh]">
        <div className="grid grid-cols-12 gap-6">

          {/* ── メインコンテンツ ── */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* フィーチャー帯（フィルタ未適用時のみ表示） */}
            {!isFiltered && bentoReports.length > 0 && (
              <section>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Featured
                </p>
                <BentoGrid className="auto-rows-auto gap-4">
                  {bentoReports.map((r, i) => (
                    <NewsBentoCard
                      key={r.slug}
                      report={r}
                      featured={i === 0}
                      className={i === 0 ? 'md:col-span-2' : 'md:col-span-1'}
                    />
                  ))}
                </BentoGrid>
              </section>
            )}

            {/* 記事グリッド */}
            {gridReports.length > 0 && (
              <section>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {isFiltered ? '検索結果' : 'Latest'}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gridReports.map((r) => (
                    <NewsCard key={r.slug} report={r} />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && isFiltered && (
              <EmptyState message={uiText.emptyStates.reports} />
            )}
          </div>

          {/* ── サイドバー ── */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-6 space-y-4">

              {/* カテゴリ別件数 */}
              <div className="border border-border bg-card p-4">
                <h3 className="mb-3 border-b border-border pb-2 text-xs font-semibold text-foreground">
                  カテゴリ
                </h3>
                <nav className="space-y-1">
                  {categoryOptions.filter((o) => o.value !== 'all').map((opt) => {
                    const count = reports.filter(
                      (r) => getReportCategory(r) === opt.value,
                    ).length;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateParams({ category: opt.value === 'all' ? null : opt.value, tag: null })}
                        className={`flex w-full items-center justify-between py-1.5 text-xs transition-colors ${
                          filters.category === opt.value
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="tabular-nums">{count}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* 関連ツール */}
              <div className="border border-border bg-card p-4">
                <h3 className="mb-3 border-b border-border pb-2 text-xs font-semibold text-foreground">
                  {uiText.comparison.relatedTools}
                </h3>
                <nav className="space-y-2">
                  {[
                    { href: '/guides', label: uiText.guides.title },
                    { href: '/use-cases', label: uiText.useCases.title },
                    { href: '/compare', label: uiText.compare.title },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center justify-between border-b border-border py-1.5 text-xs text-foreground/80 hover:text-foreground"
                    >
                      <span>{label}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </nav>
              </div>

              {/* お問い合わせ CTA */}
              <div className="border border-border bg-muted p-4">
                <h3 className="mb-2 text-xs font-semibold text-foreground">
                  {uiText.comparison.contactConsultation}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  {uiText.comparison.contactDescription}
                </p>
                <Link
                  href="/contact"
                  className="block w-full bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {uiText.common.contact}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
