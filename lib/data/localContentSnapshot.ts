import {
  articleIndexPlacementLimits,
  articlePlacements,
} from '../../data/articlePlacements.ts';
import { articles } from '../../data/articles.ts';
import { deployments } from '../../data/deployments.ts';
import { manufacturers } from '../../data/manufacturers.ts';
import { robots } from '../../data/robots.ts';
import { useCases } from '../../data/useCases.ts';
import type { ContentSnapshot } from './contentSnapshot.ts';

export const localContentSnapshot = {
  robots,
  manufacturers,
  articles,
  useCases,
  deployments,
  articlePlacements,
  articleIndexPlacementLimits,
} as const satisfies ContentSnapshot;
