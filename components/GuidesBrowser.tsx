'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { Guide, GuideStage } from '@/data/types';
import { guideStageLabels } from '@/lib/labels';

const stageOrder: GuideStage[] = ['learn', 'evaluate', 'act'];

export function GuidesBrowser({ guides }: { guides: Guide[] }) {
  const [stage, setStage] = useState<'all' | GuideStage>('all');
  const [topic, setTopic] = useState<string | null>(null);

  const topics = useMemo(() => Array.from(new Set(guides.flatMap((g) => g.topics))), [guides]);
  const featured = guides.find((g) => g.order === 1) ?? guides[0];

  const filtered = guides.filter(
    (g) => (stage === 'all' || g.stage === stage) && (!topic || g.topics.includes(topic)),
  );

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumbs items={[{ label: 'Guides' }]} />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Guides</h1>
          <p className="text-sm text-neutral-600 max-w-3xl mb-6 leading-relaxed">
            ヒューマノイド導入を「知る・判断する・動く」で理解するための常設ガイド。調達・TCO・安全・PoC・ベンダー評価を体系的に整理します。
          </p>

          <div className="flex items-center gap-2 mb-4">
            {(['all', ...stageOrder] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide transition-colors ${
                  stage === s
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-500'
                }`}
              >
                {s === 'all' ? 'All' : guideStageLabels[s]}
              </button>
            ))}
          </div>

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
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {featured && stage === 'all' && !topic && (
          <div className="border border-neutral-300 bg-white p-6 mb-6">
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-3 pb-2 border-b border-neutral-200">
              Featured Guide
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3 leading-tight">
              {featured.titleJa ?? featured.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-neutral-600 mb-4 pb-4 border-b border-neutral-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {featured.updatedAt}
              </span>
              {featured.readingTimeMinutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {featured.readingTimeMinutes} min
                </span>
              )}
              <span className="px-2 py-1 bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium">
                {guideStageLabels[featured.stage]}
              </span>
            </div>
            <p className="text-sm text-neutral-700 mb-6 leading-relaxed">{featured.summary}</p>
            <Link
              href={`/guides/${featured.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium uppercase tracking-wider transition-colors"
            >
              Read Guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {stageOrder.map((s) => {
          const items = filtered.filter((g) => g.stage === s);
          if (items.length === 0) return null;
          return (
            <div key={s} className="mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-3 px-1">
                {guideStageLabels[s]}
              </h3>
              <div className="space-y-2">
                {items.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="block border border-neutral-300 bg-white p-4 hover:border-neutral-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 mb-2 leading-tight">
                          {guide.titleJa ?? guide.title}
                        </h4>
                        <p className="text-xs text-neutral-600 mb-3 leading-relaxed">{guide.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500 mb-2">
                          <span>{guide.updatedAt}</span>
                          {guide.readingTimeMinutes && <span>{guide.readingTimeMinutes} min</span>}
                          {guide.relatedRobotSlugs.length > 0 && (
                            <span>{guide.relatedRobotSlugs.length} robots</span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {guide.topics.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 border border-neutral-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="border border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
            条件に合うガイドがありません。
          </div>
        )}
      </div>
    </div>
  );
}
