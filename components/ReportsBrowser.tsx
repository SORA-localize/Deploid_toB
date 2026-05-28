'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { Report, ReportType } from '@/data/types';
import { reportTypeLabels } from '@/lib/labels';

const typeOrder: ReportType[] = [
  'analysis',
  'deployment-report',
  'interview',
  'event-report',
  'policy-update',
  'case-study',
  'news-brief',
];

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const [type, setType] = useState<'all' | ReportType>('all');
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const topics = useMemo(() => Array.from(new Set(reports.flatMap((r) => r.tags))), [reports]);

  const filtered = reports.filter((r) => {
    if (type !== 'all' && r.type !== type) return false;
    if (topic && !r.tags.includes(topic)) return false;
    if (query) {
      const q = query.toLowerCase();
      const hit =
        (r.titleJa ?? '').toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.whyItMatters.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });

  const featured = reports.find((r) => r.featured);
  const latest = filtered.filter((r) => !r.featured);
  const active = type !== 'all' || topic || query;

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumbs items={[{ label: 'Reports' }]} />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Reports</h1>
          <p className="text-sm text-neutral-600 max-w-3xl mb-6 leading-relaxed">
            市場動向・導入レポート・政策・取材・分析を、買い手の意思決定に必要な観点で整理する一次情報ハブ。
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', ...typeOrder] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  type === t
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
                }`}
              >
                {t === 'all' ? 'All' : reportTypeLabels[t]}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="タイトル・トピック・キーワードで検索"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(topic === t ? null : t)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    topic === t
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            {featured && !active && (
              <div className="border border-neutral-300 bg-white p-6 mb-6">
                <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-3 pb-2 border-b border-neutral-200">
                  Featured Report
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3 leading-tight">
                  {featured.titleJa ?? featured.title}
                </h2>
                <p className="text-sm text-neutral-700 mb-4 leading-relaxed">{featured.summary}</p>
                <div className="border-l-4 border-neutral-900 bg-neutral-50 p-4 mb-4">
                  <p className="text-xs font-semibold text-neutral-900 mb-1">Why it matters</p>
                  <p className="text-sm text-neutral-700 leading-relaxed">{featured.whyItMatters}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-600 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {featured.publishedAt}
                  </span>
                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200">
                    {reportTypeLabels[featured.type]}
                  </span>
                </div>
                <Link
                  href={`/reports/${featured.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium uppercase tracking-wider transition-colors"
                >
                  Read Report
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4 px-1">
              Latest
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
                        <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {reportTypeLabels[report.type]}
                        </span>
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
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 border border-neutral-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="border border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
                条件に合う記事がありません。
              </div>
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
