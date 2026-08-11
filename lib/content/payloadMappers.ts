/**
 * Payload document ⇄ canonical domain型（`lib/content/domainTypes.ts`）の相互変換。
 * Payloadの `_status`（draft|published）と `lifecycleStatus`（active|archived）から
 * domainの`publishStatus`を、逆にdomainの`publishStatus`から両fieldを導出する（brief表）:
 *
 * | domain      | `_status`   | `lifecycleStatus` |
 * |-------------|-------------|--------------------|
 * | `draft`     | `draft`     | `active`           |
 * | `published` | `published` | `active`           |
 * | `archived`  | `published` | `archived`         |
 *
 * relationship fieldはPayload内部id（DB PK）で保持されるが、domain型は既存 `id`（stableId）で
 * 参照する。`resolveRelationshipToStableId` / `resolveStableIdToRelationshipId` が変換する。
 */
import type { Payload } from 'payload';
import type {
  Article,
  ArticlePlacement,
  DeploymentSite,
  Distributor,
  Manufacturer,
  PublishStatus,
  Robot,
  RobotSeries,
  Source,
  UseCase,
} from './domainTypes';

export interface PayloadStatusFields {
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

export function payloadStatusToDomain(doc: PayloadStatusFields): PublishStatus {
  if (doc.lifecycleStatus === 'archived') return 'archived';
  return doc._status === 'published' ? 'published' : 'draft';
}

export function domainStatusToPayload(status: PublishStatus): { _status: 'draft' | 'published'; lifecycleStatus: 'active' | 'archived' } {
  switch (status) {
    case 'draft':
      return { _status: 'draft', lifecycleStatus: 'active' };
    case 'published':
      return { _status: 'published', lifecycleStatus: 'active' };
    case 'archived':
      return { _status: 'published', lifecycleStatus: 'archived' };
  }
}

/** relationship fieldは `depth` によって内部idそのもの、または展開済みdocのどちらかで来る。 */
type RelationshipValue = string | number | { id: string | number; stableId?: string } | null | undefined;

export async function resolveRelationshipToStableId(payload: Payload, collection: string, value: RelationshipValue): Promise<string | undefined> {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'object') {
    if (value.stableId) return value.stableId;
    return resolveRelationshipToStableId(payload, collection, value.id);
  }
  const doc = await payload.findByID({ collection: collection as never, id: value, depth: 0, overrideAccess: true });
  return (doc as unknown as { stableId?: string })?.stableId;
}

export async function resolveRelationshipsToStableIds(payload: Payload, collection: string, values: RelationshipValue[] | undefined): Promise<string[]> {
  if (!values) return [];
  const resolved = await Promise.all(values.map((value) => resolveRelationshipToStableId(payload, collection, value)));
  return resolved.filter((value): value is string => Boolean(value));
}

export async function resolveStableIdToRelationshipId(payload: Payload, collection: string, stableId: string | undefined): Promise<string | number | undefined> {
  if (!stableId) return undefined;
  const result = (await payload.find({
    collection: collection as never,
    where: { stableId: { equals: stableId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })) as unknown as { docs: Array<{ id: string | number }> };
  return result.docs[0]?.id;
}

export async function resolveStableIdsToRelationshipIds(payload: Payload, collection: string, stableIds: string[] | undefined): Promise<(string | number)[]> {
  if (!stableIds) return [];
  const resolved = await Promise.all(stableIds.map((stableId) => resolveStableIdToRelationshipId(payload, collection, stableId)));
  return resolved.filter((id): id is string | number => id !== undefined);
}

function mapSources(sources: unknown): Source[] {
  if (!Array.isArray(sources)) return [];
  return sources as Source[];
}

interface RobotPayloadDoc extends PayloadStatusFields {
  id: string | number;
  stableId: string;
  slug: string;
  previousSlugs?: string[] | null;
  summary?: string;
  updatedAt?: string;
  reliability?: Robot['reliability'];
  sources?: Source[];
  nextReviewBy?: string;
  heroImage?: Robot['heroImage'];
  seo?: Robot['seo'];
  name?: string;
  nameJa?: string;
  manufacturerId?: RelationshipValue;
  seriesId?: RelationshipValue;
  category?: Robot['category'];
  description?: string;
  featuredRank?: number;
  deploymentStage?: Robot['deploymentStage'];
  supersededById?: RelationshipValue;
  specs?: Robot['specs'];
  procurementModels?: Robot['procurementModels'];
  priceOffers?: Robot['priceOffers'];
  loadRatings?: Robot['loadRatings'];
  fieldEvidence?: Robot['fieldEvidence'];
  usageExampleSourceUrls?: string[];
  japanAvailability?: Robot['japanAvailability'];
  distributorJapan?: string;
  supportNote?: string;
  images?: Robot['images'];
  industryTags?: Robot['industryTags'];
  taskTags?: Robot['taskTags'];
  comparison?: Robot['comparison'];
}

/** relationship内部IDをstableIdへ解決してcanonical `Robot` を返す（brief）。 */
export async function mapPayloadRobotToDomain(doc: RobotPayloadDoc, payload: Payload): Promise<Robot> {
  const [manufacturerId, seriesId, supersededById] = await Promise.all([
    resolveRelationshipToStableId(payload, 'manufacturers', doc.manufacturerId),
    resolveRelationshipToStableId(payload, 'robot-series', doc.seriesId),
    resolveRelationshipToStableId(payload, 'robots', doc.supersededById),
  ]);

  if (!manufacturerId) {
    throw new Error(`robot-missing-manufacturer: robot "${doc.stableId}" has no resolvable manufacturerId`);
  }

  return {
    id: doc.stableId,
    slug: doc.slug,
    previousSlugs: doc.previousSlugs ?? undefined,
    summary: doc.summary ?? '',
    publishStatus: payloadStatusToDomain(doc),
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
    reliability: doc.reliability ?? 'reported',
    sources: mapSources(doc.sources),
    nextReviewBy: doc.nextReviewBy,
    heroImage: doc.heroImage,
    seo: doc.seo,
    name: doc.name ?? '',
    nameJa: doc.nameJa,
    manufacturerId,
    seriesId,
    category: doc.category ?? 'other',
    description: doc.description ?? '',
    featuredRank: doc.featuredRank,
    deploymentStage: doc.deploymentStage ?? 'concept',
    supersededById,
    specs: doc.specs ?? {},
    procurementModels: doc.procurementModels ?? [],
    priceOffers: doc.priceOffers,
    loadRatings: doc.loadRatings,
    fieldEvidence: doc.fieldEvidence,
    usageExampleSourceUrls: doc.usageExampleSourceUrls,
    japanAvailability: doc.japanAvailability ?? 'unknown',
    distributorJapan: doc.distributorJapan,
    supportNote: doc.supportNote,
    images: doc.images,
    industryTags: doc.industryTags,
    taskTags: doc.taskTags,
    comparison: doc.comparison ?? { strengths: [], constraints: [], bestFit: [], notFit: [] },
  };
}

export type RobotPayloadData = Omit<RobotPayloadDoc, 'id' | 'manufacturerId' | 'seriesId' | 'supersededById'> & {
  manufacturerId?: string | number;
  seriesId?: string | number;
  supersededById?: string | number;
};

/** stableId relationshipを内部IDへ解決し、`_status` / `lifecycleStatus` を両方書く（custom `publishStatus` fieldは作らない）。 */
export async function mapDomainRobotToPayload(robot: Robot, payload: Payload): Promise<RobotPayloadData> {
  const [manufacturerId, seriesId, supersededById] = await Promise.all([
    resolveStableIdToRelationshipId(payload, 'manufacturers', robot.manufacturerId),
    resolveStableIdToRelationshipId(payload, 'robot-series', robot.seriesId),
    resolveStableIdToRelationshipId(payload, 'robots', robot.supersededById),
  ]);

  return {
    ...domainStatusToPayload(robot.publishStatus),
    stableId: robot.id,
    slug: robot.slug,
    previousSlugs: robot.previousSlugs,
    summary: robot.summary,
    reliability: robot.reliability,
    sources: robot.sources,
    nextReviewBy: robot.nextReviewBy,
    heroImage: robot.heroImage,
    seo: robot.seo,
    name: robot.name,
    nameJa: robot.nameJa,
    manufacturerId,
    seriesId,
    category: robot.category,
    description: robot.description,
    featuredRank: robot.featuredRank,
    deploymentStage: robot.deploymentStage,
    supersededById,
    specs: robot.specs,
    procurementModels: robot.procurementModels,
    priceOffers: robot.priceOffers,
    loadRatings: robot.loadRatings,
    fieldEvidence: robot.fieldEvidence,
    usageExampleSourceUrls: robot.usageExampleSourceUrls,
    japanAvailability: robot.japanAvailability,
    distributorJapan: robot.distributorJapan,
    supportNote: robot.supportNote,
    images: robot.images,
    industryTags: robot.industryTags,
    taskTags: robot.taskTags,
    comparison: robot.comparison,
  };
}

interface ManufacturerPayloadDoc extends PayloadStatusFields {
  stableId: string;
  slug: string;
  previousSlugs?: string[] | null;
  summary?: string;
  updatedAt?: string;
  reliability?: Manufacturer['reliability'];
  sources?: Source[];
  nextReviewBy?: string;
  heroImage?: Manufacturer['heroImage'];
  seo?: Manufacturer['seo'];
  [key: string]: unknown;
}

export function mapPayloadManufacturerToDomain(doc: ManufacturerPayloadDoc): Manufacturer {
  return {
    id: doc.stableId,
    slug: doc.slug,
    previousSlugs: doc.previousSlugs ?? undefined,
    summary: doc.summary ?? '',
    publishStatus: payloadStatusToDomain(doc),
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
    reliability: doc.reliability ?? 'reported',
    sources: mapSources(doc.sources),
    nextReviewBy: doc.nextReviewBy,
    heroImage: doc.heroImage,
    seo: doc.seo,
    name: (doc.name as string) ?? '',
    nameJa: doc.nameJa as string | undefined,
    companyType: (doc.companyType as Manufacturer['companyType']) ?? 'manufacturer',
    companyStatus: (doc.companyStatus as Manufacturer['companyStatus']) ?? 'active',
    country: (doc.country as string) ?? '',
    hqCity: doc.hqCity as string | undefined,
    headquarters: doc.headquarters as Manufacturer['headquarters'],
    foundedYear: doc.foundedYear as number | undefined,
    website: (doc.website as string) ?? '',
    logos: doc.logos as Manufacturer['logos'],
    contactUrl: doc.contactUrl as string | undefined,
    description: (doc.description as string) ?? '',
    japanPresence: (doc.japanPresence as Manufacturer['japanPresence']) ?? 'unknown',
    domesticDistributors: doc.domesticDistributors as Manufacturer['domesticDistributors'],
    distributorNote: doc.distributorNote as string | undefined,
    supportNote: doc.supportNote as string | undefined,
    procurementNote: doc.procurementNote as string | undefined,
    vendorRiskNote: doc.vendorRiskNote as string | undefined,
    featuredRank: doc.featuredRank as number | undefined,
  };
}

/**
 * 残る collection（RobotSeries / Distributor / UseCase / Deployment / Article /
 * ArticlePlacement / Media）は同じ形の mapper を Task 4 で必要になった時点で追加する。
 * ここでは `Robot` / `Manufacturer` に加えて、relationship解決を要する残りの collection にも
 * 同じ `resolveRelationshipToStableId` / `resolveStableIdToRelationshipId` を再利用できることを
 * 型で示すため、参照専用の型エイリアスだけ残す。
 */
export type { Article, ArticlePlacement, DeploymentSite, Distributor, RobotSeries, UseCase };
