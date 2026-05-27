'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { UseCase } from '@/data/types';
import { buyerReadinessLabels, maturityLabels } from '@/lib/labels';

function maturityClass(level: UseCase['maturityLevel']) {
  if (level === 'production-ready') return 'bg-green-50 text-green-800 border-green-200';
  if (level === 'pilot-phase') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-neutral-50 text-neutral-700 border-neutral-200';
}

function readinessClass(r: UseCase['buyerReadiness']) {
  if (r === 'initial-adoption') return 'bg-blue-50 text-blue-800 border-blue-200';
  if (r === 'requires-poc') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-neutral-50 text-neutral-700 border-neutral-200';
}

export function UseCasesBrowser({ useCases }: { useCases: UseCase[] }) {
  const [mode, setMode] = useState<'industry' | 'task'>('industry');
  const [industry, setIndustry] = useState<string | null>(null);
  const [task, setTask] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const industries = useMemo(
    () => Array.from(new Set(useCases.flatMap((u) => u.industryTags))),
    [useCases],
  );
  const tasks = useMemo(() => Array.from(new Set(useCases.flatMap((u) => u.taskTags))), [useCases]);

  const filtered = useCases.filter((u) => {
    if (query) {
      const q = query.toLowerCase();
      const hit =
        (u.titleJa ?? '').toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        (u.subtitle ?? '').toLowerCase().includes(q) ||
        u.taskTags.some((t) => t.toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (industry && !u.industryTags.includes(industry)) return false;
    if (task && !u.taskTags.includes(task)) return false;
    return true;
  });

  const featured = filtered.slice(0, 2);
  const rest = filtered.slice(2);
  const active = industry || task || query;

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumbs items={[{ label: 'Use Cases' }]} />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">用途から探す</h1>
          <p className="text-sm text-neutral-600 max-w-3xl mb-6 leading-relaxed">
            業種・ワークフロー・タスクから、現実的なヒューマノイドの適用機会を探します。ベンダー名ではなく、現場の課題から始めます。
          </p>

          <div className="max-w-2xl mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="自動化したい作業は？"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('industry')}
              className={`px-4 py-2 text-sm border transition-colors ${
                mode === 'industry'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
              }`}
            >
              業種で探す
            </button>
            <button
              onClick={() => setMode('task')}
              className={`px-4 py-2 text-sm border transition-colors ${
                mode === 'task'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
              }`}
            >
              タスクで探す
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(mode === 'industry' ? industries : tasks).map((chip) => {
              const selected = mode === 'industry' ? industry === chip : task === chip;
              return (
                <button
                  key={chip}
                  onClick={() =>
                    mode === 'industry'
                      ? setIndustry(industry === chip ? null : chip)
                      : setTask(task === chip ? null : chip)
                  }
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    selected
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {featured.length > 0 && !active && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4 px-1">
              Featured Opportunity Areas
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {featured.map((u) => (
                <Link
                  key={u.slug}
                  href={`/use-cases/${u.slug}`}
                  className="border border-neutral-300 bg-white p-6 hover:border-neutral-500 transition-colors block"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {u.industryTags[0] && (
                      <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {u.industryTags[0]}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs border ${maturityClass(u.maturityLevel)}`}>
                      {maturityLabels[u.maturityLevel]}
                    </span>
                    <span className={`px-2 py-0.5 text-xs border ${readinessClass(u.buyerReadiness)}`}>
                      {buyerReadinessLabels[u.buyerReadiness]}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-2">{u.titleJa ?? u.title}</h4>
                  <p className="text-sm text-neutral-700 mb-3 leading-relaxed">{u.subtitle ?? u.summary}</p>
                  <div className="text-xs text-neutral-600">{u.candidateRobotSlugs.length} candidate robots</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">All Use Cases</h3>
          <span className="text-xs text-neutral-600">
            {filtered.length} results{active && ' (filtered)'}
          </span>
        </div>

        <div className="space-y-3">
          {(active ? filtered : rest).map((u) => (
            <Link
              key={u.slug}
              href={`/use-cases/${u.slug}`}
              className="block border border-neutral-300 bg-white p-4 hover:border-neutral-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {u.industryTags[0] && (
                      <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {u.industryTags[0]}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs border ${maturityClass(u.maturityLevel)}`}>
                      {maturityLabels[u.maturityLevel]}
                    </span>
                    <span className={`px-2 py-0.5 text-xs border ${readinessClass(u.buyerReadiness)}`}>
                      {buyerReadinessLabels[u.buyerReadiness]}
                    </span>
                  </div>
                  <h4 className="font-semibold text-neutral-900 mb-2">{u.titleJa ?? u.title}</h4>
                  <p className="text-xs text-neutral-600 mb-2 leading-relaxed line-clamp-1">
                    {u.subtitle ?? u.summary}
                  </p>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {u.taskTags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 border border-neutral-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {u.candidateRobotSlugs.length} candidate robots
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="border border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
            条件に合う用途がありません。
          </div>
        )}
      </div>
    </div>
  );
}
