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
  const doc = await payload.findByID({
    collection: collection as never,
    id: value,
    depth: 0,
    overrideAccess: true,
    // `stableId` しか読まないので、その1列だけを射影する。`select` を省くと Payload は
    // 全カラムに加えて `_texts` / `_numbers` / `_rels` のサブテーブルまで JOIN する
    // （`@payloadcms/drizzle` の `buildFindManyArgs`: `select ? {} : { numbers, rels, texts }`）。
    // `previousSlugs` が hasMany text なので、全 content collection がこの JOIN に該当していた。
    // `select` 指定時は `id` が無条件で射影へ入るため、明示は不要。
    select: { stableId: true } as never,
  });
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

/**
 * `resolveRelationshipToStableId` の逆向き（stableId → Payload内部id）のcache。
 * Task 5 の importer は 1 record あたり複数 relationship を解決するため、cacheが無いと
 * 同じ参照先を何度も `find` することになる。**hitだけをcacheし、missはcacheしない**
 * （import中に後から作られる参照先を「存在しない」と覚え込まないため）。
 * `RelationshipResolutionCache` と同じく短命（1 import / 1 export分）で、プロセス全体では保持しない。
 */
export interface RelationshipIdCache {
  entries: Map<string, string | number>;
}

export function createRelationshipIdCache(): RelationshipIdCache {
  return { entries: new Map() };
}

/** importerが `create` 直後に内部idをcacheへ入れるための入口（余分な `find` を1回省く）。 */
export function rememberRelationshipId(
  cache: RelationshipIdCache | undefined,
  collection: string,
  stableId: string,
  internalId: string | number,
): void {
  cache?.entries.set(`${collection}:${stableId}`, internalId);
}

export async function resolveStableIdToRelationshipId(
  payload: Payload,
  collection: string,
  stableId: string | undefined,
  cache?: RelationshipIdCache,
): Promise<string | number | undefined> {
  if (!stableId) return undefined;
  const cacheKey = `${collection}:${stableId}`;
  const cached = cache?.entries.get(cacheKey);
  if (cached !== undefined) return cached;
  const result = (await payload.find({
    collection: collection as never,
    where: { stableId: { equals: stableId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    // 読むのは `docs[0].id` だけ。射影の理由は `resolveRelationshipToStableId` と同じ。
    select: { stableId: true } as never,
    // `pagination` を切らないと `findMany` が `count(*)` を別途発行する
    // （`@payloadcms/drizzle` の `findMany`: `if (pagination !== false ...)`）。
    // ここは常に `limit: 1` の存在確認で、総件数を読まないので無駄になる。
    pagination: false,
  })) as unknown as { docs: Array<{ id: string | number }> };
  const id = result.docs[0]?.id;
  if (id !== undefined) rememberRelationshipId(cache, collection, stableId, id);
  return id;
}

export async function resolveStableIdsToRelationshipIds(
  payload: Payload,
  collection: string,
  stableIds: readonly string[] | undefined,
  cache?: RelationshipIdCache,
): Promise<(string | number)[]> {
  if (!stableIds) return [];
  const resolved = await Promise.all(
    stableIds.map((stableId) => resolveStableIdToRelationshipId(payload, collection, stableId, cache)),
  );
  return resolved.filter((id): id is string | number => id !== undefined);
}

/**
 * relationship解決の失敗を「値なし」へ黙って潰さないための検査。importerは参照先を必ず
 * 先にimportしているはずなので（Task 5 Step 3のimport順）、解決できない参照は
 * データ側の壊れた参照であって握り潰してよい欠損ではない。
 */
function assertResolved(
  resolved: string | number | undefined,
  args: { collection: string; stableId: string; field: string; target: string; targetStableId: string },
): string | number | undefined {
  if (resolved !== undefined) return resolved;
  throw new Error(
    `unresolved-relationship: ${args.collection} "${args.stableId}" field "${args.field}" ` +
      `references ${args.target} "${args.targetStableId}", which does not exist in Payload`,
  );
}

async function resolveRequired(
  payload: Payload,
  target: string,
  stableId: string | undefined,
  cache: RelationshipIdCache | undefined,
  context: { collection: string; stableId: string; field: string },
): Promise<string | number | undefined> {
  if (!stableId) return undefined;
  const resolved = await resolveStableIdToRelationshipId(payload, target, stableId, cache);
  return assertResolved(resolved, { ...context, target, targetStableId: stableId });
}

async function resolveAllRequired(
  payload: Payload,
  target: string,
  stableIds: readonly string[] | undefined,
  cache: RelationshipIdCache | undefined,
  context: { collection: string; stableId: string; field: string },
): Promise<(string | number)[] | undefined> {
  if (!stableIds) return undefined;
  const resolved: (string | number)[] = [];
  for (const stableId of stableIds) {
    const id = await resolveRequired(payload, target, stableId, cache, context);
    if (id !== undefined) resolved.push(id);
  }
  return resolved;
}

/**
 * Payloadが返す「未設定」表現をdomain側の1つの表現（`undefined`）へ寄せる（Task 5で発見）。
 *
 * Payloadは未設定の leaf を `null` で返し、`group` field は**中身が全部 `null` のobject**を
 * 返す（`seo: { metaTitle: null, metaDescription: null, noindex: null }`）。これをそのまま
 * domain値へ通すと、local側（fieldごと省略＝`undefined`）と機械的に食い違い、Task 5の
 * parity比較が全レコードで差分を出す（実測: `seo` 178件 / `heroImage` 124件）。
 *
 * 再帰的に `null` → `undefined` にし、値の残らないobjectは丸ごと `undefined` にする。
 * **空配列は保持する**（`comparison.strengths: []` のように「空である」ことに意味がある
 * 必須配列があるため。任意配列は呼び出し側が `optionalArray` で別途落とす）。
 */
function cleanPayloadValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(cleanPayloadValue);
  if (typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const normalized = cleanPayloadValue(entry);
      if (normalized !== undefined) cleaned[key] = normalized;
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return value;
}

/** `group` field（`heroImage` / `seo` / `headquarters` など）用。未設定なら `undefined`。 */
function optionalGroup<T>(value: unknown): T | undefined {
  return cleanPayloadValue(value) as T | undefined;
}

/**
 * Payloadの `array` field の行は自動採番の `id` を持つが、domain型（`Source` /
 * `DomesticDistributor` / `RobotPriceOffer` / `RobotLoadRating`）には存在しない。
 * そのまま通すと **Payload内部IDがdomain値とexport snapshotへ漏れる**（brief Step 4:
 * 「Payload内部ID ... は比較対象から除外する」。実測で649件の差分になった）。行から落とす。
 */
function mapArrayRows<T>(rows: unknown): T[] | undefined {
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return cleanPayloadValue(row) as T;
    const withoutRowId = Object.fromEntries(
      Object.entries(row as Record<string, unknown>).filter(([key]) => key !== 'id'),
    );
    return (cleanPayloadValue(withoutRowId) ?? {}) as T;
  });
}

function mapSources(sources: unknown): Source[] {
  return mapArrayRows<Source>(sources) ?? [];
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
    heroImage: optionalGroup<ImageAsset>(doc.heroImage),
    seo: optionalGroup<SeoFields>(doc.seo),
    name: doc.name ?? '',
    nameJa: doc.nameJa,
    manufacturerId,
    seriesId,
    category: doc.category ?? 'other',
    description: doc.description ?? '',
    featuredRank: doc.featuredRank,
    deploymentStage: doc.deploymentStage ?? 'concept',
    supersededById,
    specs: optionalGroup(doc.specs) ?? {},
    procurementModels: doc.procurementModels ?? [],
    priceOffers: mapArrayRows(doc.priceOffers),
    loadRatings: mapArrayRows(doc.loadRatings),
    fieldEvidence: optionalGroup(doc.fieldEvidence),
    usageExampleSourceUrls: optionalArray(doc.usageExampleSourceUrls),
    japanAvailability: doc.japanAvailability ?? 'unknown',
    distributorJapan: doc.distributorJapan,
    supportNote: doc.supportNote,
    images: optionalGroup(doc.images),
    industryTags: optionalArray(doc.industryTags),
    taskTags: optionalArray(doc.taskTags),
    comparison: optionalGroup(doc.comparison) ?? { strengths: [], constraints: [], bestFit: [], notFit: [] },
  };
}

export type RobotPayloadData = Omit<RobotPayloadDoc, 'id' | 'manufacturerId' | 'seriesId' | 'supersededById'> & {
  manufacturerId?: string | number;
  seriesId?: string | number;
  supersededById?: string | number;
};

/**
 * stableId relationshipを内部IDへ解決し、`_status` / `lifecycleStatus` を両方書く
 * （custom `publishStatus` fieldは作らない）。
 *
 * `supersededById` は `robots` → `robots` の自己参照で、import中は参照先がまだ作られて
 * いないことがある。`options.deferSelfReferences` を立てると `supersededById` を書かずに
 * 返し、importerが全robot作成後の2周目でだけ書き込めるようにする（Task 5 Step 3）。
 */
export async function mapDomainRobotToPayload(
  robot: Robot,
  payload: Payload,
  cache?: RelationshipIdCache,
  options: { deferSelfReferences?: boolean } = {},
): Promise<RobotPayloadData> {
  const context = { collection: 'robots', stableId: robot.id };
  const [manufacturerId, seriesId, supersededById] = await Promise.all([
    resolveRequired(payload, 'manufacturers', robot.manufacturerId, cache, { ...context, field: 'manufacturerId' }),
    resolveRequired(payload, 'robot-series', robot.seriesId, cache, { ...context, field: 'seriesId' }),
    options.deferSelfReferences
      ? Promise.resolve(undefined)
      : resolveRequired(payload, 'robots', robot.supersededById, cache, { ...context, field: 'supersededById' }),
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
    heroImage: optionalGroup<ImageAsset>(doc.heroImage),
    seo: optionalGroup<SeoFields>(doc.seo),
    name: (doc.name as string) ?? '',
    nameJa: doc.nameJa as string | undefined,
    companyType: (doc.companyType as Manufacturer['companyType']) ?? 'manufacturer',
    companyStatus: (doc.companyStatus as Manufacturer['companyStatus']) ?? 'active',
    country: (doc.country as string) ?? '',
    hqCity: doc.hqCity as string | undefined,
    headquarters: optionalGroup<Manufacturer['headquarters']>(doc.headquarters),
    foundedYear: doc.foundedYear as number | undefined,
    website: (doc.website as string) ?? '',
    logos: optionalGroup<Manufacturer['logos']>(doc.logos),
    contactUrl: doc.contactUrl as string | undefined,
    description: (doc.description as string) ?? '',
    japanPresence: (doc.japanPresence as Manufacturer['japanPresence']) ?? 'unknown',
    domesticDistributors: mapArrayRows<NonNullable<Manufacturer['domesticDistributors']>[number]>(doc.domesticDistributors),
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
    heroImage: optionalGroup<ImageAsset>(doc.heroImage),
    seo: optionalGroup<SeoFields>(doc.seo),
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
    images: optionalGroup(doc.images),
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
    handledRobotIds: optionalArray(handledRobotIds),
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
        evidenceDeploymentIds: optionalArray(evidenceDeploymentIds),
        evidenceSourceUrls: optionalArray(candidate.evidenceSourceUrls),
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
    atAGlance: optionalGroup<UseCase['atAGlance']>(doc.atAGlance) ?? { whereFits: '', whereDoesNotFit: '', mustBeTrue: '' },
    overview: doc.overview ?? '',
    whyItMatters: doc.whyItMatters ?? '',
    capabilityNotes: optionalGroup<UseCase['capabilityNotes']>(doc.capabilityNotes) ?? {},
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
    location: optionalGroup<DeploymentSite['location']>(doc.location) ?? { lat: 0, lng: 0 },
    status: doc.status ?? 'unknown',
    startedAt: doc.startedAt,
    relatedUseCaseIds: optionalArray(relatedUseCaseIds),
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
    return { ...common, type: 'manufacturer-guide', manufacturerGuideContent: optionalGroup<ManufacturerGuideContent>(doc.manufacturerGuideContent) as ManufacturerGuideContent };
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
    sponsor: doc.sponsor?.name ? optionalGroup<ArticlePlacement['sponsor']>(doc.sponsor) : undefined,
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
    rights: optionalGroup<MediaAsset['rights']>(doc.rights) ?? { status: 'blocked', sourceType: 'unknown', checkedAt: '' },
  };
}

// ─── Task 5: domain → Payload write shape（読み取りmapperの逆向き） ─────────────
// 読み取り側（`mapPayload*ToDomain`）と1対1で対応させる。`publishStatus` は
// `domainStatusToPayload` で `_status` + `lifecycleStatus` の2fieldへ落とし、Payload schemaに
// custom `publishStatus` fieldを作らない（Task 5 Step 3）。`updatedAt` はPayloadが管理する
// ため書かない（書いてもPayloadに上書きされる。parity比較からも除外する）。
//
// `undefined` の field は Payload の `update` で「変更なし」ではなく「未設定」として扱わせたい
// （importerは常に全fieldを送る＝local側で消えた値がPayload側に残り続けない）。そのため
// 各mapperは domain 型に存在する全fieldを、値が無ければ `undefined` のまま明示的に含める。

/** 全content collection共通のbase部分（`mapBaseRecord` の逆）。 */
function baseRecordToPayload(record: {
  id: string;
  slug: string;
  previousSlugs?: string[];
  summary: string;
  publishStatus: PublishStatus;
  reliability: Reliability;
  sources: Source[];
  nextReviewBy?: string;
  heroImage?: ImageAsset;
  seo?: SeoFields;
}) {
  return {
    ...domainStatusToPayload(record.publishStatus),
    stableId: record.id,
    slug: record.slug,
    previousSlugs: record.previousSlugs,
    summary: record.summary,
    reliability: record.reliability,
    sources: record.sources,
    nextReviewBy: record.nextReviewBy,
    heroImage: record.heroImage,
    seo: record.seo,
  };
}

export function mapDomainManufacturerToPayload(manufacturer: Manufacturer): Record<string, unknown> {
  return {
    ...baseRecordToPayload(manufacturer),
    name: manufacturer.name,
    nameJa: manufacturer.nameJa,
    companyType: manufacturer.companyType,
    companyStatus: manufacturer.companyStatus,
    country: manufacturer.country,
    hqCity: manufacturer.hqCity,
    headquarters: manufacturer.headquarters,
    foundedYear: manufacturer.foundedYear,
    website: manufacturer.website,
    logos: manufacturer.logos,
    contactUrl: manufacturer.contactUrl,
    description: manufacturer.description,
    japanPresence: manufacturer.japanPresence,
    domesticDistributors: manufacturer.domesticDistributors,
    distributorNote: manufacturer.distributorNote,
    supportNote: manufacturer.supportNote,
    procurementNote: manufacturer.procurementNote,
    vendorRiskNote: manufacturer.vendorRiskNote,
    featuredRank: manufacturer.featuredRank,
  };
}

export async function mapDomainRobotSeriesToPayload(
  series: RobotSeries,
  payload: Payload,
  cache?: RelationshipIdCache,
): Promise<Record<string, unknown>> {
  const manufacturerId = await resolveRequired(payload, 'manufacturers', series.manufacturerId, cache, {
    collection: 'robot-series',
    stableId: series.id,
    field: 'manufacturerId',
  });
  return {
    ...baseRecordToPayload(series),
    name: series.name,
    nameJa: series.nameJa,
    manufacturerId,
    description: series.description,
    images: series.images,
    industryTags: series.industryTags,
    taskTags: series.taskTags,
  };
}

/**
 * `handledRobotIds` は `robots` を参照するが、brief Step 3 の import 順では `distributors` が
 * `robots` より先に来る。`options.deferForwardReferences` で1周目は書かずに置き、importerが
 * 全collection作成後の2周目で埋める。
 */
export async function mapDomainDistributorToPayload(
  distributor: Distributor,
  payload: Payload,
  cache?: RelationshipIdCache,
  options: { deferForwardReferences?: boolean } = {},
): Promise<Record<string, unknown>> {
  const context = { collection: 'distributors', stableId: distributor.id };
  const [handledManufacturerIds, handledRobotIds] = await Promise.all([
    resolveAllRequired(payload, 'manufacturers', distributor.handledManufacturerIds, cache, {
      ...context,
      field: 'handledManufacturerIds',
    }),
    options.deferForwardReferences
      ? Promise.resolve(undefined)
      : resolveAllRequired(payload, 'robots', distributor.handledRobotIds, cache, {
          ...context,
          field: 'handledRobotIds',
        }),
  ]);
  return {
    ...baseRecordToPayload(distributor),
    name: distributor.name,
    nameJa: distributor.nameJa,
    website: distributor.website,
    providerType: distributor.providerType,
    handledManufacturerIds,
    handledRobotIds,
    acquisitionMethods: distributor.acquisitionMethods,
    inquiryUrl: distributor.inquiryUrl,
    note: distributor.note,
  };
}

/**
 * `candidateRobots[].evidenceDeploymentIds` は `deployments` を参照し、`deployments` 側は
 * `relatedUseCaseIds` で `use-cases` を参照する（相互参照）。どちらを先に import しても
 * 片方は必ず前方参照になるため、`options.deferForwardReferences` で1周目は evidence を
 * 書かずに置き、importerが2周目で埋める。
 */
export async function mapDomainUseCaseToPayload(
  useCase: UseCase,
  payload: Payload,
  cache?: RelationshipIdCache,
  options: { deferForwardReferences?: boolean } = {},
): Promise<Record<string, unknown>> {
  const context = { collection: 'use-cases', stableId: useCase.id };
  const candidateRobots = [];
  for (const candidate of useCase.candidateRobots) {
    const [robotId, seriesId, evidenceDeploymentIds] = await Promise.all([
      resolveRequired(payload, 'robots', candidate.robotId, cache, { ...context, field: 'candidateRobots.robotId' }),
      resolveRequired(payload, 'robot-series', candidate.seriesId, cache, {
        ...context,
        field: 'candidateRobots.seriesId',
      }),
      options.deferForwardReferences
        ? Promise.resolve(undefined)
        : resolveAllRequired(payload, 'deployments', candidate.evidenceDeploymentIds, cache, {
            ...context,
            field: 'candidateRobots.evidenceDeploymentIds',
          }),
    ]);
    candidateRobots.push({
      robotId,
      seriesId,
      fit: candidate.fit,
      basis: candidate.basis,
      evidenceDeploymentIds,
      evidenceSourceUrls: candidate.evidenceSourceUrls,
      reason: candidate.reason,
    });
  }

  return {
    ...baseRecordToPayload(useCase),
    title: useCase.title,
    titleJa: useCase.titleJa,
    subtitle: useCase.subtitle,
    maturityLevel: useCase.maturityLevel,
    buyerReadiness: useCase.buyerReadiness,
    environment: useCase.environment,
    requiredCapabilities: useCase.requiredCapabilities,
    primaryIndustry: useCase.primaryIndustry,
    industryTags: useCase.industryTags,
    taskTags: useCase.taskTags,
    atAGlance: useCase.atAGlance,
    overview: useCase.overview,
    whyItMatters: useCase.whyItMatters,
    capabilityNotes: useCase.capabilityNotes,
    environmentRequirements: useCase.environmentRequirements,
    whyHardToday: useCase.whyHardToday,
    japanDeploymentConditions: useCase.japanDeploymentConditions,
    candidateRobots,
  };
}

export async function mapDomainDeploymentToPayload(
  deployment: DeploymentSite,
  payload: Payload,
  cache?: RelationshipIdCache,
): Promise<Record<string, unknown>> {
  const context = { collection: 'deployments', stableId: deployment.id };
  const [manufacturerId, robotId, relatedUseCaseIds] = await Promise.all([
    resolveRequired(payload, 'manufacturers', deployment.manufacturerId, cache, { ...context, field: 'manufacturerId' }),
    resolveRequired(payload, 'robots', deployment.robotId, cache, { ...context, field: 'robotId' }),
    resolveAllRequired(payload, 'use-cases', deployment.relatedUseCaseIds, cache, {
      ...context,
      field: 'relatedUseCaseIds',
    }),
  ]);
  return {
    ...baseRecordToPayload(deployment),
    manufacturerId,
    robotId,
    customer: deployment.customer,
    siteName: deployment.siteName,
    country: deployment.country,
    location: deployment.location,
    status: deployment.status,
    startedAt: deployment.startedAt,
    relatedUseCaseIds,
  };
}

export async function mapDomainArticleToPayload(
  article: Article,
  payload: Payload,
  cache?: RelationshipIdCache,
): Promise<Record<string, unknown>> {
  const context = { collection: 'articles', stableId: article.id };
  const [relatedRobotIds, relatedManufacturerIds, relatedUseCaseIds] = await Promise.all([
    resolveAllRequired(payload, 'robots', article.relatedRobotIds, cache, { ...context, field: 'relatedRobotIds' }),
    resolveAllRequired(payload, 'manufacturers', article.relatedManufacturerIds, cache, {
      ...context,
      field: 'relatedManufacturerIds',
    }),
    resolveAllRequired(payload, 'use-cases', article.relatedUseCaseIds, cache, {
      ...context,
      field: 'relatedUseCaseIds',
    }),
  ]);

  const common = {
    ...baseRecordToPayload(article),
    title: article.title,
    titleJa: article.titleJa,
    category: article.category,
    type: article.type,
    section: article.section,
    contentKind: article.contentKind,
    publishedAt: article.publishedAt,
    author: article.author,
    industryTags: article.industryTags,
    regionTags: article.regionTags,
    themeTags: article.themeTags,
    whyItMatters: article.whyItMatters,
    keyTakeaways: article.keyTakeaways,
    featured: article.featured,
    relatedRobotIds,
    relatedManufacturerIds,
    relatedUseCaseIds,
  };

  // `Article` は判別可能union。本文モデルは片方だけを書き、もう片方は明示的に落とす
  // （読み取りmapperが `type` で分岐するため、両方入っていると意味が二重になる）。
  if (article.type === 'manufacturer-guide') {
    return { ...common, body: undefined, manufacturerGuideContent: article.manufacturerGuideContent };
  }
  return { ...common, body: article.body, manufacturerGuideContent: undefined };
}

export async function mapDomainArticlePlacementToPayload(
  placement: ArticlePlacement,
  payload: Payload,
  cache?: RelationshipIdCache,
): Promise<Record<string, unknown>> {
  const articleId = await resolveRequired(payload, 'articles', placement.articleId, cache, {
    collection: 'article-placements',
    stableId: placement.id,
    field: 'articleId',
  });
  return {
    ...domainStatusToPayload(placement.publishStatus),
    stableId: placement.id,
    // `article-placements` は公開URLを持たないが、schema一貫性のため `baseContentFields()` を
    // 共有しており `slug` が `required: true` + `unique`。`stableId` と同じ値を書く
    // （`collections/ArticlePlacements.ts` のコメントが指定する importer 側の責務）。
    slug: placement.id,
    surface: placement.surface,
    slot: placement.slot,
    articleId,
    order: placement.order,
    kind: placement.kind,
    sponsor: placement.sponsor,
  };
}

/** `Media` はuploadの実体。ファイルbytesはimporterが別途 `file` として渡す。 */
export function mapDomainMediaToPayload(asset: MediaAsset): Record<string, unknown> {
  return {
    stableId: asset.id,
    alt: asset.alt,
    rights: asset.rights,
  };
}

export type { Article, ArticlePlacement, DeploymentSite, Distributor, RobotSeries, UseCase };
