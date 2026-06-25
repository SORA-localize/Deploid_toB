import type { ArticlePlacement, ArticlePlacementSlot } from './types';

export const articleIndexPlacementLimits: Record<ArticlePlacementSlot, number> = {
  hero: 5,
  feature: 2,
};

// Reports page curation slots. Sponsored placements should be represented here,
// not embedded in presentation components.
// hero/feature は publishedAt の新しい順（同日付はファイル内の登場順）で並べる。
// 並び替えは記事追加のたびに見直す。
export const articlePlacements: ArticlePlacement[] = [
  // ── hero スロット（左カルーセル） ──
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'pudu-d7-industrial-semi-humanoid-2026',
    order: 1,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'nvidia-halos-robotics-safety-2026',
    order: 2,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'robot-com-rnoid-workplace-humanoid-2026',
    order: 3,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'io-ai-teleoperation-training-shenzhen-2026',
    order: 4,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'hero',
    articleId: 'unitree-r1-global-lineup-2026',
    order: 5,
    kind: 'editorial',
  },
  // ── feature スロット（右カード列） ──
  {
    surface: 'reports-index',
    slot: 'feature',
    articleId: 'dobot-atom-max-rtj-japan-2026',
    order: 10,
    kind: 'editorial',
  },
  {
    surface: 'reports-index',
    slot: 'feature',
    articleId: 'vindynamics-vinrobotics-debut-2026',
    order: 20,
    kind: 'editorial',
  },
];
