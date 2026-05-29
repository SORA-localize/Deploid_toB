'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { SearchInput } from '@/components/SearchInput';
import { TagChip } from '@/components/TagChip';
import type { Report, ReportType } from '@/data/types';
import { reportTypeOrder } from '@/lib/display';
import { reportTypeLabels } from '@/lib/labels';
import { createReportSearchDocument, matchesSearchDocument } from '@/lib/search';
import {
  getReportTagOptions,
  getTagLabel,
  matchesTag,
  normalizeTagKey,
} from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

const typeOptions: Array<{ value: 'all' | ReportType; label: string }> = [
  { value: 'all', label: uiText.common.all },
  ...reportTypeOrder.map((value) => ({ value, label: reportTypeLabels[value] })),
];

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const { getParam, updateParams } = useUrlFilters();
  const typeParam = getParam('type');
  const type = typeParam && reportTypeOrder.includes(typeParam as ReportType) ? typeParam as ReportType : 'all';
  const topicParam = getParam('tag');
  const topic = topicParam ? normalizeTagKey(topicParam) : null;
  const query = getParam('q') ?? '';

  const topicOptions = useMemo(() => getReportTagOptions(reports), [reports]);
  const searchDocuments = useMemo(
    () => new Map(reports.map((report) => [report.slug, createReportSearchDocument(report)])),
    [reports],
  );

  const filtered = reports.filter((r) => {
    if (type !== 'all' && r.type !== type) return false;
    if (!matchesTag(r.tags, topic)) return false;
    if (!matchesSearchDocument(query, searchDocuments.get(r.slug))) return false;
    return true;
  });

  const featured = reports.find((r) => r.featured);
  const latest = filtered.filter((r) => !r.featured);
  const active = type !== 'all' || topic || query;

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumbs items={[{ label: uiText.reports.breadcrumb }]} />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">{uiText.reports.title}</h1>
          <p className="text-sm text-neutral-600 max-w-3xl mb-6 leading-relaxed">
            市場動向・導入レポート・政策・取材・分析を、買い手の意思決定に必要な観点で整理する一次情報ハブ。
          </p>

          <FilterChipGroup
            options={typeOptions}
            value={type}
            onChange={(nextType) => updateParams({ type: nextType === 'all' ? null : nextType })}
            ariaLabel={uiText.filters.reportType}
            className="mb-4"
          />

          <div className="mb-4">
            <SearchInput
              value={query}
              onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
              placeholder="タイトル・トピック・キーワードで検索"
              className="max-w-xl"
              inputClassName="py-2.5"
            />
          </div>

          {topicOptions.length > 0 && (
            <FilterChipGroup
              options={topicOptions}
              value={topic}
              onChange={(nextTopic) => updateParams({ tag: nextTopic })}
              allowDeselect
              onClear={() => updateParams({ tag: null })}
              ariaLabel={uiText.filters.reportTopics}
            />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            {featured && !active && (
              <div className="border border-neutral-300 bg-white p-6 mb-6">
                <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-3 pb-2 border-b border-neutral-200">
                  {uiText.reports.featured}
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3 leading-tight">
                  {featured.titleJa ?? featured.title}
                </h2>
                <p className="text-sm text-neutral-700 mb-4 leading-relaxed">{featured.summary}</p>
                <div className="border-l-4 border-neutral-900 bg-neutral-50 p-4 mb-4">
                  <p className="text-xs font-semibold text-neutral-900 mb-1">
                    {uiText.reports.whyItMatters}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">{featured.whyItMatters}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-600 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {featured.publishedAt}
                  </span>
                  <TagChip className="text-neutral-800">{reportTypeLabels[featured.type]}</TagChip>
                </div>
                <Link
                  href={`/reports/${featured.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium uppercase tracking-wider transition-colors"
                >
                  {uiText.reports.read}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4 px-1">
              {uiText.common.latest}
            </h3>
            <div className="space-y-2">
              {(active ? filtered : latest).map((report) => (
                <Link
                  key={report.slug}
                  href={`/reports/${report.slug}`}
                  className="block border border-neutral-300 bg-white p-4 hover:border-neutral-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <TagChip>{reportTypeLabels[report.type]}</TagChip>
                        <span className="text-xs text-neutral-500">{report.publishedAt}</span>
                      </div>
                      <h4 className="font-semibold text-neutral-900 mb-2 leading-tight">
                        {report.titleJa ?? report.title}
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2 leading-relaxed line-clamp-2">
                        {report.summary}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {report.tags.slice(0, 3).map((tag) => (
                          <TagChip key={tag}>{getTagLabel(tag)}</TagChip>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <EmptyState message="条件に合う記事がありません。" />
            )}
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="border border-neutral-300 bg-white p-4">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3 pb-2 border-b border-neutral-200">
                  関連ツール
                </h3>
                <nav className="space-y-2">
                  <Link
                    href="/guides"
                    className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 py-1.5 border-b border-neutral-100"
                  >
                    <span>導入ガイドを読む</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/use-cases"
                    className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 py-1.5 border-b border-neutral-100"
                  >
                    <span>用途から探す</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/compare"
                    className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 py-1.5"
                  >
                    <span>候補機種を比較</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </nav>
              </div>

              <div className="border border-neutral-300 bg-neutral-50 p-4">
                <h3 className="text-xs font-semibold text-neutral-900 mb-2">情報提供・取材相談</h3>
                <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
                  導入事例や一次情報の提供、取材のご相談はこちら。
                </p>
                <Link
                  href="/contact"
                  className="block w-full px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium uppercase tracking-wider transition-colors text-center"
                >
                  お問い合わせ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
