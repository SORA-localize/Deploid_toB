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
    articleId: 'jal-haneda-unitree-pilot-2026',
    order: 5,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'figure-botq-production-milestone-2026',
    order: 10,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'bmw-figure-deployment',
    order: 20,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'boston-dynamics-atlas-hyundai-rmac-june2026',
    order: 30,
    kind: 'editorial',
  },
  // ── feature スロット（右カード列） ──
  {
    surface: 'reports-index',
    slot: 'feature',
    articleId: 'unitree-ipo-star-market-june2026',
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
