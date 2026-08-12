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
  ImageAsset,
  Manufacturer,
  ManufacturerGuideContent,
  MediaAsset,
  PublishStatus,
  Reliability,
  Robot,
  RobotSeries,
  SeoFields,
  Source,
  StandardArticle,
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

/**
 * `depth: 0` でqueryすると relationship は内部id のまま返るため、docごとに `findByID` が要る。
 * 一覧・snapshotではこれがN+1になるので、1回の読み取り処理の中で内部id → stableId を使い回す
 * ためのcacheを渡せるようにする（Task 4 Step 6）。cacheは短命（1 query / 1 snapshot分）で、
 * プロセス全体で保持しない＝Payload側の更新を跨いで古い値を返さない。
 */
export interface RelationshipResolutionCache {
  entries: Map<string, string | undefined>;
}

export function createRelationshipResolutionCache(): RelationshipResolutionCache {
  return { entries: new Map() };
}

export async function resolveRelationshipToStableId(
  payload: Payload,
  collection: string,
  value: RelationshipValue,
  cache?: RelationshipResolutionCache,
): Promise<string | undefined> {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'object') {
    if (value.stableId) return value.stableId;
    return resolveRelationshipToStableId(payload, collection, value.id, cache);
  }
  const cacheKey = `${collection}:${value}`;
  if (cache?.entries.has(cacheKey)) return cache.entries.get(cacheKey);
  const doc = await payload.findByID({ collection: collection as never, id: value, depth: 0, overrideAccess: true });
  const stableId = (doc as unknown as { stableId?: string })?.stableId;
  cache?.entries.set(cacheKey, stableId);
  return stableId;
}

export async function resolveRelationshipsToStableIds(
  payload: Payload,
  collection: string,
  values: RelationshipValue[] | undefined,
  cache?: RelationshipResolutionCache,
): Promise<string[]> {
  if (!values) return [];
  const resolved = await Promise.all(values.map((value) => resolveRelationshipToStableId(payload, collection, value, cache)));
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

/**
 * Payloadは未入力のhasMany field / arrayを `[]`（または `null`）で返すが、local `data/*.ts` は
 * その場合fieldごと省く（`previousSlugs?: Slug[]` などdomain型が任意にしている理由）。
 * 「値なし」の表現を1つ（`undefined`）に寄せて、両sourceのdomain値を一致させる
 * （そろえないとTask 5のparity diffが全レコードで空配列 vs undefinedを検出してしまう）。
 * domain型が必須配列にしているfield（`Article.relatedRobotIds` など）には使わない。
 */
function optionalArray<T>(value: T[] | null | undefined): T[] | undefined {
  return value && value.length > 0 ? value : undefined;
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
export async function mapPayloadRobotToDomain(doc: RobotPayloadDoc, payload: Payload, cache?: RelationshipResolutionCache): Promise<Robot> {
  const [manufacturerId, seriesId, supersededById] = await Promise.all([
    resolveRelationshipToStableId(payload, 'manufacturers', doc.manufacturerId, cache),
    resolveRelationshipToStableId(payload, 'robot-series', doc.seriesId, cache),
    resolveRelationshipToStableId(payload, 'robots', doc.supersededById, cache),
  ]);

  if (!manufacturerId) {
    throw new Error(`robot-missing-manufacturer: robot "${doc.stableId}" has no resolvable manufacturerId`);
  }

  return {
    id: doc.stableId,
    slug: doc.slug,
    previousSlugs: optionalArray(doc.previousSlugs),
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
    priceOffers: optionalArray(doc.priceOffers),
    loadRatings: optionalArray(doc.loadRatings),
    fieldEvidence: doc.fieldEvidence,
    usageExampleSourceUrls: optionalArray(doc.usageExampleSourceUrls),
    japanAvailability: doc.japanAvailability ?? 'unknown',
    distributorJapan: doc.distributorJapan,
    supportNote: doc.supportNote,
    images: doc.images,
    industryTags: optionalArray(doc.industryTags),
    taskTags: optionalArray(doc.taskTags),
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
    previousSlugs: optionalArray(doc.previousSlugs),
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
    domesticDistributors: optionalArray(doc.domesticDistributors as Manufacturer['domesticDistributors']),
    distributorNote: doc.distributorNote as string | undefined,
    supportNote: doc.supportNote as string | undefined,
    procurementNote: doc.procurementNote as string | undefined,
    vendorRiskNote: doc.vendorRiskNote as string | undefined,
    featuredRank: doc.featuredRank as number | undefined,
  };
}

// ─── Task 4 Step 6: 残る7 collectionのmapper ────────────────────────────────
// いずれも「Payload doc → canonical domain型」を明示的に組み立てる（`as Robot` 等の
// 暗黙castで済ませない）。relationshipは `depth: 0` の内部idで来るため、必ず stableId へ解決する。

/** 全content collectionが共有する `BaseRecord` 部分。 */
interface BaseRecordPayloadDoc extends PayloadStatusFields {
  stableId: string;
  slug: string;
  previousSlugs?: string[] | null;
  summary?: string;
  updatedAt?: string;
  reliability?: Reliability;
  sources?: Source[];
  nextReviewBy?: string;
  heroImage?: ImageAsset;
  seo?: SeoFields;
}

function mapBaseRecord(doc: BaseRecordPayloadDoc) {
  return {
    id: doc.stableId,
    slug: doc.slug,
    previousSlugs: optionalArray(doc.previousSlugs),
    summary: doc.summary ?? '',
    publishStatus: payloadStatusToDomain(doc),
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
    reliability: doc.reliability ?? ('reported' as const),
    sources: mapSources(doc.sources),
    nextReviewBy: doc.nextReviewBy,
    heroImage: doc.heroImage,
    seo: doc.seo,
  };
}

interface RobotSeriesPayloadDoc extends BaseRecordPayloadDoc {
  name?: string;
  nameJa?: string;
  manufacturerId?: RelationshipValue;
  description?: string;
  images?: RobotSeries['images'];
  industryTags?: RobotSeries['industryTags'];
  taskTags?: RobotSeries['taskTags'];
}

export async function mapPayloadRobotSeriesToDomain(
  doc: RobotSeriesPayloadDoc,
  payload: Payload,
  cache?: RelationshipResolutionCache,
): Promise<RobotSeries> {
  const manufacturerId = await resolveRelationshipToStableId(payload, 'manufacturers', doc.manufacturerId, cache);
  if (!manufacturerId) {
    throw new Error(`robot-series-missing-manufacturer: robot-series "${doc.stableId}" has no resolvable manufacturerId`);
  }
  return {
    ...mapBaseRecord(doc),
    name: doc.name ?? '',
    nameJa: doc.nameJa,
    manufacturerId,
    description: doc.description,
    images: doc.images,
    industryTags: optionalArray(doc.industryTags),
    taskTags: optionalArray(doc.taskTags),
  };
}

interface DistributorPayloadDoc extends BaseRecordPayloadDoc {
  name?: string;
  nameJa?: string;
  website?: string;
  providerType?: Distributor['providerType'];
  handledManufacturerIds?: RelationshipValue[];
  handledRobotIds?: RelationshipValue[];
  acquisitionMethods?: Distributor['acquisitionMethods'];
  inquiryUrl?: string;
  note?: string;
}

export async function mapPayloadDistributorToDomain(
  doc: DistributorPayloadDoc,
  payload: Payload,
  cache?: RelationshipResolutionCache,
): Promise<Distributor> {
  const [handledManufacturerIds, handledRobotIds] = await Promise.all([
    resolveRelationshipsToStableIds(payload, 'manufacturers', doc.handledManufacturerIds, cache),
    resolveRelationshipsToStableIds(payload, 'robots', doc.handledRobotIds, cache),
  ]);
  return {
    ...mapBaseRecord(doc),
    name: doc.name ?? '',
    nameJa: doc.nameJa,
    website: doc.website,
    providerType: doc.providerType ?? 'other',
    handledManufacturerIds,
    handledRobotIds: doc.handledRobotIds ? handledRobotIds : undefined,
    acquisitionMethods: doc.acquisitionMethods ?? [],
    inquiryUrl: doc.inquiryUrl,
    note: doc.note,
  };
}

interface UseCaseCandidatePayloadRow {
  robotId?: RelationshipValue;
  seriesId?: RelationshipValue;
  fit: UseCase['candidateRobots'][number]['fit'];
  basis: UseCase['candidateRobots'][number]['basis'];
  evidenceDeploymentIds?: RelationshipValue[];
  evidenceSourceUrls?: string[];
  reason: string;
}

interface UseCasePayloadDoc extends BaseRecordPayloadDoc {
  title?: string;
  titleJa?: string;
  subtitle?: string;
  maturityLevel?: UseCase['maturityLevel'];
  buyerReadiness?: UseCase['buyerReadiness'];
  environment?: UseCase['environment'];
  requiredCapabilities?: UseCase['requiredCapabilities'];
  primaryIndustry?: UseCase['primaryIndustry'];
  industryTags?: UseCase['industryTags'];
  taskTags?: UseCase['taskTags'];
  atAGlance?: UseCase['atAGlance'];
  overview?: string;
  whyItMatters?: string;
  capabilityNotes?: UseCase['capabilityNotes'];
  environmentRequirements?: string;
  whyHardToday?: string;
  japanDeploymentConditions?: string;
  candidateRobots?: UseCaseCandidatePayloadRow[];
}

export async function mapPayloadUseCaseToDomain(
  doc: UseCasePayloadDoc,
  payload: Payload,
  cache?: RelationshipResolutionCache,
): Promise<UseCase> {
  const candidateRobots = await Promise.all(
    (doc.candidateRobots ?? []).map(async (candidate) => {
      const [robotId, seriesId, evidenceDeploymentIds] = await Promise.all([
        resolveRelationshipToStableId(payload, 'robots', candidate.robotId, cache),
        resolveRelationshipToStableId(payload, 'robot-series', candidate.seriesId, cache),
        resolveRelationshipsToStableIds(payload, 'deployments', candidate.evidenceDeploymentIds, cache),
      ]);
      return {
        robotId,
        seriesId,
        fit: candidate.fit,
        basis: candidate.basis,
        evidenceDeploymentIds: candidate.evidenceDeploymentIds ? evidenceDeploymentIds : undefined,
        evidenceSourceUrls: candidate.evidenceSourceUrls,
        reason: candidate.reason,
      };
    }),
  );

  return {
    ...mapBaseRecord(doc),
    title: doc.title ?? '',
    titleJa: doc.titleJa,
    subtitle: doc.subtitle,
    maturityLevel: doc.maturityLevel ?? 'early-stage',
    buyerReadiness: doc.buyerReadiness ?? 'requires-poc',
    environment: doc.environment ?? 'mixed',
    requiredCapabilities: doc.requiredCapabilities ?? [],
    primaryIndustry: doc.primaryIndustry as UseCase['primaryIndustry'],
    industryTags: doc.industryTags ?? [],
    taskTags: doc.taskTags ?? [],
    atAGlance: doc.atAGlance ?? { whereFits: '', whereDoesNotFit: '', mustBeTrue: '' },
    overview: doc.overview ?? '',
    whyItMatters: doc.whyItMatters ?? '',
    capabilityNotes: doc.capabilityNotes ?? {},
    environmentRequirements: doc.environmentRequirements ?? '',
    whyHardToday: doc.whyHardToday ?? '',
    japanDeploymentConditions: doc.japanDeploymentConditions ?? '',
    candidateRobots,
  };
}

interface DeploymentPayloadDoc extends BaseRecordPayloadDoc {
  manufacturerId?: RelationshipValue;
  robotId?: RelationshipValue;
  customer?: string;
  siteName?: string;
  country?: string;
  location?: DeploymentSite['location'];
  status?: DeploymentSite['status'];
  startedAt?: string;
  relatedUseCaseIds?: RelationshipValue[];
}

export async function mapPayloadDeploymentToDomain(
  doc: DeploymentPayloadDoc,
  payload: Payload,
  cache?: RelationshipResolutionCache,
): Promise<DeploymentSite> {
  const [manufacturerId, robotId, relatedUseCaseIds] = await Promise.all([
    resolveRelationshipToStableId(payload, 'manufacturers', doc.manufacturerId, cache),
    resolveRelationshipToStableId(payload, 'robots', doc.robotId, cache),
    resolveRelationshipsToStableIds(payload, 'use-cases', doc.relatedUseCaseIds, cache),
  ]);
  if (!manufacturerId) {
    throw new Error(`deployment-missing-manufacturer: deployment "${doc.stableId}" has no resolvable manufacturerId`);
  }
  return {
    ...mapBaseRecord(doc),
    manufacturerId,
    robotId,
    customer: doc.customer ?? '',
    siteName: doc.siteName,
    country: doc.country ?? '',
    location: doc.location ?? { lat: 0, lng: 0 },
    status: doc.status ?? 'unknown',
    startedAt: doc.startedAt,
    relatedUseCaseIds: doc.relatedUseCaseIds ? relatedUseCaseIds : undefined,
  };
}

interface ArticlePayloadDoc extends BaseRecordPayloadDoc {
  title?: string;
  titleJa?: string;
  category?: Article['category'];
  type?: Article['type'];
  section?: Article['section'];
  contentKind?: Article['contentKind'];
  publishedAt?: string;
  author?: string;
  industryTags?: Article['industryTags'];
  regionTags?: Article['regionTags'];
  themeTags?: Article['themeTags'];
  whyItMatters?: string;
  keyTakeaways?: string[];
  featured?: boolean;
  relatedRobotIds?: RelationshipValue[];
  relatedManufacturerIds?: RelationshipValue[];
  relatedUseCaseIds?: RelationshipValue[];
  body?: string;
  manufacturerGuideContent?: ManufacturerGuideContent;
}

export async function mapPayloadArticleToDomain(
  doc: ArticlePayloadDoc,
  payload: Payload,
  cache?: RelationshipResolutionCache,
): Promise<Article> {
  const [relatedRobotIds, relatedManufacturerIds, relatedUseCaseIds] = await Promise.all([
    resolveRelationshipsToStableIds(payload, 'robots', doc.relatedRobotIds, cache),
    resolveRelationshipsToStableIds(payload, 'manufacturers', doc.relatedManufacturerIds, cache),
    resolveRelationshipsToStableIds(payload, 'use-cases', doc.relatedUseCaseIds, cache),
  ]);

  const common = {
    ...mapBaseRecord(doc),
    title: doc.title ?? '',
    titleJa: doc.titleJa,
    category: doc.category ?? 'news',
    contentKind: doc.contentKind,
    publishedAt: doc.publishedAt ?? '',
    author: doc.author,
    industryTags: optionalArray(doc.industryTags),
    regionTags: optionalArray(doc.regionTags),
    themeTags: optionalArray(doc.themeTags),
    whyItMatters: doc.whyItMatters ?? '',
    keyTakeaways: optionalArray(doc.keyTakeaways),
    featured: doc.featured,
    section: doc.section ?? 'digest',
    relatedRobotIds,
    relatedManufacturerIds,
    relatedUseCaseIds,
  };

  // `Article` は判別可能union（`StandardArticle | ManufacturerGuideArticle`）。
  // `type` で分岐して本文モデルを決める（castで潰さない）。
  if (doc.type === 'manufacturer-guide') {
    if (!doc.manufacturerGuideContent) {
      throw new Error(`article-missing-guide-content: article "${doc.stableId}" is a manufacturer-guide without manufacturerGuideContent`);
    }
    return { ...common, type: 'manufacturer-guide', manufacturerGuideContent: doc.manufacturerGuideContent };
  }
  return { ...common, type: (doc.type ?? 'analysis') as StandardArticle['type'], body: doc.body };
}

interface ArticlePlacementPayloadDoc extends PayloadStatusFields {
  stableId: string;
  surface?: ArticlePlacement['surface'];
  slot?: ArticlePlacement['slot'];
  articleId?: RelationshipValue;
  order?: number;
  kind?: ArticlePlacement['kind'];
  sponsor?: ArticlePlacement['sponsor'];
}

export async function mapPayloadArticlePlacementToDomain(
  doc: ArticlePlacementPayloadDoc,
  payload: Payload,
  cache?: RelationshipResolutionCache,
): Promise<ArticlePlacement> {
  const articleId = await resolveRelationshipToStableId(payload, 'articles', doc.articleId, cache);
  if (!articleId) {
    throw new Error(`article-placement-missing-article: placement "${doc.stableId}" has no resolvable articleId`);
  }
  return {
    id: doc.stableId,
    surface: doc.surface ?? 'reports-index',
    slot: doc.slot ?? 'hero',
    articleId,
    order: doc.order ?? 0,
    kind: doc.kind,
    // Payloadの `sponsor` group は未入力でも空objectで返るため、実質未設定なら落とす。
    sponsor: doc.sponsor?.name ? doc.sponsor : undefined,
    publishStatus: payloadStatusToDomain(doc),
  };
}

interface MediaPayloadDoc {
  stableId: string;
  filename?: string | null;
  url?: string | null;
  alt?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  rights?: MediaAsset['rights'];
}

/** `Media` はuploadの実体そのもの。`publishStatus` / `slug` を持たない。 */
export function mapPayloadMediaToDomain(doc: MediaPayloadDoc): MediaAsset {
  return {
    id: doc.stableId,
    filename: doc.filename ?? '',
    url: doc.url ?? '',
    alt: doc.alt ?? '',
    mimeType: doc.mimeType ?? undefined,
    filesize: doc.filesize ?? undefined,
    width: doc.width ?? undefined,
    height: doc.height ?? undefined,
    rights: doc.rights ?? { status: 'blocked', sourceType: 'unknown', checkedAt: '' },
  };
}

export type { Article, ArticlePlacement, DeploymentSite, Distributor, RobotSeries, UseCase };
