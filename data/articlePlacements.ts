import type { ArticlePlacement, ArticlePlacementSlot } from './types';

export const articleIndexPlacementLimits: Record<ArticlePlacementSlot, number> = {
  hero: 5,
  feature: 2,
};

// Reports page curation slots. Sponsored placements should be represented here,
// not embedded in presentation components.
export const articlePlacements: ArticlePlacement[] = [
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'bmw-figure-deployment',
    order: 10,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'gxo-digit-100k-totes',
    order: 20,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'onex-neo-preorder',
    order: 30,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'sample-atlas-factory-demo',
    order: 40,
    kind: 'sample',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'sample-tesla-optimus-production',
    order: 50,
    kind: 'sample',
  },
  {
    surface: 'reports-index',
    slot: 'feature',
    articleId: 'sample-japan-robot-regulation',
    order: 10,
    kind: 'sample',
  },
  {
    surface: 'reports-index',
    slot: 'feature',
    articleId: 'sample-unitree-viral',
    order: 20,
    kind: 'sample',
  },
];
