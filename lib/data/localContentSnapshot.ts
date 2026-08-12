import {
  articleIndexPlacementLimits,
  articlePlacements,
} from '../../data/articlePlacements.ts';
import { articles } from '../../data/articles.ts';
import { deployments } from '../../data/deployments.ts';
import { manufacturers } from '../../data/manufacturers.ts';
import { robots } from '../../data/robots.ts';
import { useCases } from '../../data/useCases.ts';
import { siteMeta } from '../site.ts';
import type { ContentSnapshot } from './contentSnapshot.ts';

/**
 * `data/*.ts` の配列をvalue importしてよい唯一のファイル
 * （`scripts/check-data-import-boundaries.mjs` の allowlist）。Task 4以降、
 * `lib/content/localSource.ts` がここを唯一の入口としてlocal contentを読む。
 *
 * `robotSeries` / `distributors` / `media` は `data/*.ts` に対応配列が存在しないため空配列。
 * Task 5のimporter以降、実データはPayload側だけが持つ。
 */
export const localContentSnapshot = {
  robots,
  manufacturers,
  articles,
  useCases,
  deployments,
  articlePlacements,
  articleIndexPlacementLimits,
  robotSeries: [],
  distributors: [],
  media: [],
  siteSettings: { dataAsOf: siteMeta.dataAsOf },
} as const satisfies ContentSnapshot;

export type LocalContentSnapshot = ContentSnapshot;
