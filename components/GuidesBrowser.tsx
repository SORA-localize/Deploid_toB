'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { TagChip } from '@/components/TagChip';
import type { Guide, GuideStage } from '@/data/types';
import { guideStageOrder } from '@/lib/display';
import { guideStageLabels } from '@/lib/labels';
import { getGuideTopicOptions, getTagLabel, matchesTag } from '@/lib/tags';

const stageOptions: Array<{ value: 'all' | GuideStage; label: string }> = [
  { value: 'all', label: 'All' },
  ...guideStageOrder.map((value) => ({ value, label: guideStageLabels[value] })),
];

export function GuidesBrowser({ guides }: { guides: Guide[] }) {
  const [stage, setStage] = useState<'all' | GuideStage>('all');
  const [topic, setTopic] = useState<string | null>(null);

  const topicOptions = useMemo(() => getGuideTopicOptions(guides), [guides]);
  const featured = guides.find((g) => g.order === 1) ?? guides[0];

  const filtered = guides.filter(
    (g) => (stage === 'all' || g.stage === stage) && matchesTag(g.topics, topic),
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

          <FilterChipGroup
            options={stageOptions}
            value={stage}
            onChange={setStage}
            ariaLabel="Guide stage"
            className="mb-4"
            buttonClassName="px-4 py-2.5 text-xs font-medium uppercase tracking-wide"
          />

          <FilterChipGroup
            options={topicOptions}
            value={topic}
            onChange={setTopic}
            allowDeselect
            onClear={() => setTopic(null)}
            ariaLabel="Guide topics"
          />
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
              <TagChip className="py-1 text-neutral-800 font-medium">
                {guideStageLabels[featured.stage]}
              </TagChip>
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

        {guideStageOrder.map((s) => {
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
                            <TagChip key={t}>{getTagLabel(t)}</TagChip>
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
          <EmptyState message="条件に合うガイドがありません。" />
        )}
      </div>
    </div>
  );
}
