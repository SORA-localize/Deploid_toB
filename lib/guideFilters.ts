import type { Guide, GuideStage } from '@/data/types';
import { guideStageOrder } from '@/lib/display';
import { matchesTag, normalizeTagKey } from '@/lib/tags';
import { isOneOf } from '@/lib/typeGuards';

export function normalizeGuideFilters({
  stage,
  topic,
}: {
  stage: string | null | undefined;
  topic: string | null | undefined;
}) {
  return {
    stage: isOneOf(stage, guideStageOrder) ? stage : ('all' as const),
    topic: topic ? normalizeTagKey(topic) : null,
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
