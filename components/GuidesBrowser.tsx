'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { TagChip } from '@/components/TagChip';
import type { Guide, GuideStage } from '@/data/types';
import { guideStageOrder } from '@/lib/display';
import { filterGuides } from '@/lib/guideFilters';
import { guideStageLabels } from '@/lib/labels';
import { getGuideTopicOptions, normalizeTagKey } from '@/lib/tags';
import { isOneOf } from '@/lib/typeGuards';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { getGuideStageTone } from '@/lib/visualSemantics';

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
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="site-container py-5">
          <Breadcrumbs items={[{ label: uiText.guides.breadcrumb }]} />
          <PageListHeader title={uiText.guides.title} description={uiText.guides.description} className="mb-6" />

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

      <div className="site-container py-5 min-h-[60vh]">
        {featured && filters.stage === 'all' && !filters.topic && (
          <div className="card-data p-6 mb-6">
            <div className="text-xs text-muted-foreground font-medium mb-3 pb-2 border-b border-border">
              {uiText.guides.featured}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-3 leading-tight">
              {featured.titleJa ?? featured.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
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
              <TagChip tone={getGuideStageTone(featured.stage)} className="py-1 font-medium">
                {guideStageLabels[featured.stage]}
              </TagChip>
            </div>
            <p className="text-sm text-foreground/80 mb-6 leading-relaxed">{featured.summary}</p>
            <Link
              href={`/guides/${featured.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors"
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
              <h3 className="text-sm font-semibold text-foreground mb-3 px-1">
                {guideStageLabels[s]}
              </h3>
              <div className="space-y-2">
                {items.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/guides/${guide.slug}`}
                    className="card-data block p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-2 leading-tight">
                          {guide.titleJa ?? guide.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{guide.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>{guide.updatedAt}</span>
                          {guide.readingTimeMinutes && (
                            <span>{uiText.common.readingMinutes(guide.readingTimeMinutes)}</span>
                          )}
                          {guide.relatedRobotIds.length > 0 && (
                            <span>{uiText.guides.relatedRobotsCount(guide.relatedRobotIds.length)}</span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {guide.topics.slice(0, 3).map((t) => (
                            <TagChip key={t} kind="guide-topic" value={t} />
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/70 flex-shrink-0 mt-1" />
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
