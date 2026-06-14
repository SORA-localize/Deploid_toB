import type { Robot } from '@/data/types';

export const MAX_COMPARE_ROBOTS = 20;

export function normalizeCompareRobotIds(
  compareParam: string | null | undefined,
  robots: readonly Pick<Robot, 'id'>[],
  max = MAX_COMPARE_ROBOTS,
) {
  if (!compareParam) return [];

  const validIds = new Set(robots.map((robot) => robot.id));
  const seen = new Set<string>();

  return compareParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => {
      if (!validIds.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, max);
}
