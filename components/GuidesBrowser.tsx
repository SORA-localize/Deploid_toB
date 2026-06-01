'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { TagChip } from '@/components/TagChip';
import type { Guide, GuideStage } from '@/data/types';
import { guideStageOrder } from '@/lib/display';
import { filterGuides } from '@/lib/guideFilters';
import { guideStageLabels } from '@/lib/labels';
import { getGuideTopicOptions, getTagLabel, normalizeTagKey } from '@/lib/tags';
import { isOneOf } from '@/lib/typeGuards';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

const stageOptions: Array<{ value: 'all' | GuideStage; label: string }> = [
  { value: 'all', label: uiText.common.all },
  ...guideStageOrder.map((value) => ({ value, label: guideStageLabels[value] })),
];

export function GuidesBrowser({ guides }: { guides: Guide[] }) {
  const { getParam, updateParams } = useUrlFilters();

  const filters = useMemo(() => {
    const stageParam = getParam('stage');
    const topicParam = getParam('topic');
    return {
      stage: isOneOf(stageParam, guideStageOrder) ? stageParam : ('all' as const),
      topic: topicParam ? normalizeTagKey(topicParam) : null,
    };
  }, [getParam]);

  const topicOptions = useMemo(() => getGuideTopicOptions(guides), [guides]);
  const featured = guides.find((g) => g.order === 1) ?? guides[0];

  const filtered = useMemo(
    () => filterGuides({ guides, filters }),
    [guides, filters],
  );

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumbs items={[{ label: uiText.guides.breadcrumb }]} />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">{uiText.guides.title}</h1>
          <p className="text-sm text-neutral-600 max-w-3xl mb-6 leading-relaxed">
            ヒューマノイド導入を「知る・判断する・動く」で理解するための常設ガイド。調達・TCO・安全・PoC・ベンダー評価を体系的に整理します。
          </p>

          <FilterChipGroup
            options={stageOptions}
            value={filters.stage}
            onChange={(nextStage) => updateParams({ stage: nextStage === 'all' ? null : nextStage })}
            ariaLabel={uiText.filters.guideStage}
            className="mb-4"
            buttonClassName="px-4 py-2.5 text-xs font-medium"
          />

          <FilterChipGroup
            options={topicOptions}
            value={filters.topic}
            onChange={(nextTopic) => updateParams({ topic: nextTopic })}
            allowDeselect
            onClear={() => updateParams({ topic: null })}
            ariaLabel={uiText.filters.guideTopics}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 min-h-[60vh]">
        {featured && filters.stage === 'all' && !filters.topic && (
          <div className="border border-neutral-300 bg-white p-6 mb-6">
            <div className="text-xs text-neutral-500 font-medium mb-3 pb-2 border-b border-neutral-200">
              {uiText.guides.featured}
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
                  {uiText.common.readingMinutes(featured.readingTimeMinutes)}
                </span>
              )}
              <TagChip className="py-1 text-neutral-800 font-medium">
                {guideStageLabels[featured.stage]}
              </TagChip>
            </div>
            <p className="text-sm text-neutral-700 mb-6 leading-relaxed">{featured.summary}</p>
            <Link
              href={`/guides/${featured.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium transition-colors"
            >
              {uiText.guides.read}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {guideStageOrder.map((s) => {
          const items = filtered.filter((g) => g.stage === s);
          if (items.length === 0) return null;
          return (
            <div key={s} className="mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3 px-1">
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
                          {guide.readingTimeMinutes && (
                            <span>{uiText.common.readingMinutes(guide.readingTimeMinutes)}</span>
                          )}
                          {guide.relatedRobotSlugs.length > 0 && (
                            <span>{uiText.guides.relatedRobotsCount(guide.relatedRobotSlugs.length)}</span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {guide.topics.slice(0, 3).map((t) => (
                            <TagChip key={t}>{getTagLabel(t, 'guide-topic')}</TagChip>
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
          <EmptyState message={uiText.emptyStates.guides} />
        )}
      </div>
    </div>
  );
}
