import type {
  Article,
  ArticlePlacement,
  ArticlePlacementSlot,
  DeploymentSite,
  Manufacturer,
  Robot,
  UseCase,
} from '@/data/types';
import type { Distributor, MediaAsset, RobotSeries } from '@/lib/content/domainTypes';

/**
 * local（`data/*.ts`）側のsnapshot形。**legacy互換境界**（`data/types.ts`）の型を使う点で、
 * cutover後も残る `lib/content/contracts.ts` の `ContentSnapshot`（canonical domain型）とは別物。
 * `lib/content/localSource.ts` が前者から後者へ変換する（Task 4 Step 4）。
 *
 * `robotSeries` / `distributors` / `media` / `siteSettings` はTask 4で追加した
 * （brief Step 3: 既存を置き換えず、フィールドを足す形で拡張する）。この3 collectionは
 * `data/*.ts` に対応する配列がそもそも存在せず（DEC-S08 / 架構v2 §4-1 / Media collectionは
 * すべてTask 3の新設）、legacy型も持たないため、canonical domain型をそのまま使う。
 * localの実体は空配列で、実データはTask 5のimporter以降にPayload側だけが持つ。
 */
export interface ContentSnapshot {
  readonly robots: readonly Robot[];
  readonly manufacturers: readonly Manufacturer[];
  readonly articles: readonly Article[];
  readonly useCases: readonly UseCase[];
  readonly deployments: readonly DeploymentSite[];
  readonly articlePlacements: readonly ArticlePlacement[];
  readonly articleIndexPlacementLimits: Readonly<Record<ArticlePlacementSlot, number>>;
  readonly robotSeries: readonly RobotSeries[];
  readonly distributors: readonly Distributor[];
  readonly media: readonly MediaAsset[];
  readonly siteSettings: { readonly dataAsOf: string };
}
