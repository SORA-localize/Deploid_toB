import type {
  Article,
  ArticlePlacement,
  ArticlePlacementSlot,
  DeploymentSite,
  Manufacturer,
  Robot,
  UseCase,
} from '@/data/types';

export interface ContentSnapshot {
  readonly robots: readonly Robot[];
  readonly manufacturers: readonly Manufacturer[];
  readonly articles: readonly Article[];
  readonly useCases: readonly UseCase[];
  readonly deployments: readonly DeploymentSite[];
  readonly articlePlacements: readonly ArticlePlacement[];
  readonly articleIndexPlacementLimits: Readonly<Record<ArticlePlacementSlot, number>>;
}
