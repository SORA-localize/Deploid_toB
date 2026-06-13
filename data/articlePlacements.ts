import type { ArticlePlacement, ArticlePlacementSlot } from './types';

export const articleIndexPlacementLimits: Record<ArticlePlacementSlot, number> = {
  hero: 5,
  feature: 2,
};

// Reports page curation slots. Sponsored placements should be represented here,
// not embedded in presentation components.
export const articlePlacements: ArticlePlacement[] = [
  // ── hero スロット（左カルーセル） ──
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
    articleId: 'boston-dynamics-atlas-electric',
    order: 20,
    kind: 'editorial',
  },
  // ── feature スロット（右カード列） ──
  {
    surface: 'reports-index',
    slot: 'feature',
    articleId: 'unitree-g1-price-evaluation',
    order: 10,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'feature',
    articleId: 'onex-neo-preorder',
    order: 20,
    kind: 'editorial',
  },
];
