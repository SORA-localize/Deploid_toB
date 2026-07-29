import {
  articleIndexPlacementLimits,
  articlePlacements,
} from '@/data/articlePlacements';
import { articles } from '@/data/articles';
import { deployments } from '@/data/deployments';
import { manufacturers } from '@/data/manufacturers';
import { robots } from '@/data/robots';
import { useCases } from '@/data/useCases';
import type { ContentSnapshot } from '@/lib/data/contentSnapshot';

export const localContentSnapshot = {
  robots,
  manufacturers,
  articles,
  useCases,
  deployments,
  articlePlacements,
  articleIndexPlacementLimits,
} as const satisfies ContentSnapshot;
