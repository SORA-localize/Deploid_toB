import type { Guide, GuideStage } from '@/data/types';
import { matchesTag } from '@/lib/tags';

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
