import type { Guide, GuideStage } from '@/data/types';
import { guideStageOrder } from '@/lib/display';
import { getGuideTopicOptions, matchesTag, normalizeTagKey } from '@/lib/tags';
import { isOneOf } from '@/lib/typeGuards';

export function getGuideFilterOptions(guides: readonly Guide[]) {
  return {
    topics: getGuideTopicOptions(guides),
  };
}

export function normalizeGuideFilters({
  stage,
  topic,
  topicValues,
}: {
  stage: string | null | undefined;
  topic: string | null | undefined;
  topicValues: readonly string[];
}) {
  const normalizedTopic = topic ? normalizeTagKey(topic) : null;

  return {
    stage: isOneOf(stage, guideStageOrder) ? stage : ('all' as const),
    topic: normalizedTopic && topicValues.includes(normalizedTopic) ? normalizedTopic : null,
  };
}

export function filterGuides({
  guides,
  filters,
}: {
  guides: readonly Guide[];
  filters: {
    stage: GuideStage | 'all';
    topic: string | null;
  };
}) {
  return guides.filter(
    (g) =>
      (filters.stage === 'all' || g.stage === filters.stage) &&
      matchesTag(g.topics, filters.topic),
  );
}
