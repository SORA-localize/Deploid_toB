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
    reportId: 'bmw-figure-deployment',
    order: 10,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    reportId: 'gxo-digit-100k-totes',
    order: 20,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    reportId: 'onex-neo-preorder',
    order: 30,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    reportId: 'sample-atlas-factory-demo',
    order: 40,
    kind: 'sample',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    reportId: 'sample-tesla-optimus-production',
    order: 50,
    kind: 'sample',
  },
  {
    surface: 'reports-index',
    slot: 'feature',
    reportId: 'sample-japan-robot-regulation',
    order: 10,
    kind: 'sample',
  },
  {
    surface: 'reports-index',
    slot: 'feature',
    reportId: 'sample-unitree-viral',
    order: 20,
    kind: 'sample',
  },
];
