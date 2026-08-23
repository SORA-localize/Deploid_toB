import type { CollectionConfig, GlobalConfig } from 'payload';
import { Admins } from '../../collections/Admins';
import { ArticlePlacements } from '../../collections/ArticlePlacements';
import { Articles } from '../../collections/Articles';
import { AuditUploadSessionsCollection } from '../../collections/AuditUploadSessions';
import { Deployments } from '../../collections/Deployments';
import { Distributors } from '../../collections/Distributors';
import { EnvironmentMarkerCollection } from '../../collections/EnvironmentMarker';
import { Manufacturers } from '../../collections/Manufacturers';
import { Media } from '../../collections/Media';
import { RobotSeriesCollection } from '../../collections/RobotSeries';
import { Robots } from '../../collections/Robots';
import { UseCases } from '../../collections/UseCases';
import { SiteSettings } from '../../globals/SiteSettings';
import { RouteRegistryCollection } from './routeRegistry';

/**
 * Task 3 が定義した10 collections + Task 3.5 が追加する `content-route-registry` /
 * `environment-marker`。`payload.config.ts`（本番runtime）と、
 * `tests/fixtures/payload-migrations/*`（Task 3.5 Step 3 の「実採用schema」fixture、Task 8の
 * MCP API key migration fixtureの土台）の両方がこの1箇所を参照する。
 *
 * 二重管理をやめる理由: fixture configが本番のcollection一覧を手で複製すると、本番側に
 * collectionを足し忘れたfixtureが「本番には無いtableを消すmigration」を静かに生成しうる
 * （Task 3.5 Step 3 が検証する「既存schemaへの安全な適用」と矛盾する）。1箇所からimportすれば
 * この drift は構造的に起きない。
 */
export const contentCollections: CollectionConfig[] = [
  Admins,
  Manufacturers,
  Distributors,
  RobotSeriesCollection,
  Robots,
  UseCases,
  Deployments,
  Articles,
  ArticlePlacements,
  Media,
  RouteRegistryCollection,
  EnvironmentMarkerCollection,
  AuditUploadSessionsCollection,
];

export const contentGlobals: GlobalConfig[] = [SiteSettings];
