/**
 * Payload content source（`docs/plans/content-platform-migration-plan-v1.md` Task 4 Step 6）。
 *
 * 各collectionへ `where` / `limit` / `page` / `sort` / `depth: 0` を明示してqueryする。
 * `depth: 0` なのでrelationshipは内部id（DB PK）で返る。collection別mapper
 * （`lib/content/payloadMappers.ts`）がcanonical domain型へ変換し、内部id → `stableId` の
 * 解決も行う（暗黙の型castで済ませない）。
 *
 * Payloadの `_status`（draft|published）+ `lifecycleStatus`（active|archived）とdomainの
 * `publishStatus`（draft|published|archived）の対応はTask 3の表（`payloadMappers.ts` 冒頭）どおり。
 * ここでは読み取り側として、渡された `publishStatuses` をその逆写像で `where` へ翻訳する。
 *
 * `limit: 500` 相当の全件取得は `readSnapshot()`（管理処理専用）だけに限定する。
 * `limit` 未指定の公開runtime queryは、明示的な `page` ループ（1ページ `RUNTIME_PAGE_SIZE` 件）で
 * 取得する。
 */
import { getPayload, type Payload, type Where } from 'payload';
import payloadConfig from '@/payload.config';
import {
  type ArticlePlacementSourceQuery,
  type ArticleSourceQuery,
  type ContentSnapshot,
  type DeploymentSourceQuery,
  type DistributorSourceQuery,
  type FullContentSource,
  type LookupQuery,
  type ManufacturerSourceQuery,
  type MediaSourceQuery,
  type RobotSeriesSourceQuery,
  type RobotSourceQuery,
  type UseCaseSourceQuery,
} from './contracts';
import type {
  Article,
  ArticlePlacement,
  ArticlePlacementSlot,
  DeploymentSite,
  Distributor,
  Id,
  Manufacturer,
  MediaAsset,
  PublishStatus,
  Robot,
  RobotSeries,
  Slug,
  UseCase,
} from './domainTypes';
import {
  createRelationshipResolutionCache,
  mapPayloadArticlePlacementToDomain,
  mapPayloadArticleToDomain,
  mapPayloadDeploymentToDomain,
  mapPayloadDistributorToDomain,
  mapPayloadManufacturerToDomain,
  mapPayloadMediaToDomain,
  mapPayloadRobotSeriesToDomain,
  mapPayloadRobotToDomain,
  mapPayloadUseCaseToDomain,
  resolveStableIdToRelationshipId,
  type RelationshipResolutionCache,
} from './payloadMappers';

/** 公開runtime queryで `limit` 未指定のときの1ページ件数。全件取得は明示的なpageループで行う。 */
const RUNTIME_PAGE_SIZE = 100;
/** `readSnapshot()`（管理処理専用）の1ページ件数。 */
const SNAPSHOT_PAGE_SIZE = 500;
/** pageループの暴走防止。到達したら設計上の想定を超えているので落とす。 */
const MAX_PAGES = 200;

const ALL_PUBLISH_STATUSES: readonly PublishStatus[] = ['draft', 'published', 'archived'];

/** `SiteSettings.articleIndexPlacementLimits` が持つべきslot。1つでも欠けたら移行未完了として落とす。 */
const ARTICLE_PLACEMENT_SLOTS: readonly ArticlePlacementSlot[] = ['hero', 'feature'];

/**
 * `readSnapshot()` が全読み取りを載せるtransactionの最小 `req`（必須修正5）。Payload Local APIは
 * `req` の部分オブジェクトを受け取り `transactionID` を引き継ぐ（`publishApprovedVersion()` と同じ形）。
 */
interface SnapshotReadRequest {
  transactionID: string | number;
}

type ContentCollectionSlug =
  | 'robots'
  | 'robot-series'
  | 'manufacturers'
  | 'distributors'
  | 'use-cases'
  | 'deployments'
  | 'articles'
  | 'article-placements'
  | 'media';

/** どのdocにも一致しない `where`（relationship filterの参照先が存在しない場合などに使う）。 */
const MATCHES_NOTHING: Where = { stableId: { equals: '__deploid_no_such_stable_id__' } };

/**
 * domainの `publishStatus` 集合 → Payloadの `_status` / `lifecycleStatus` へ翻訳する
 * （`domainStatusToPayload` の逆向き・集合版）。
 */
function publishStatusWhere(statuses: readonly PublishStatus[]): Where {
  if (statuses.length === 0) return MATCHES_NOTHING;
  const clauses: Where[] = statuses.map((status): Where => {
    switch (status) {
      case 'draft':
        return { _status: { equals: 'draft' } };
      case 'published':
        return { and: [{ _status: { equals: 'published' } }, { lifecycleStatus: { equals: 'active' } }] };
      case 'archived':
        return { and: [{ _status: { equals: 'published' } }, { lifecycleStatus: { equals: 'archived' } }] };
    }
  });
  return clauses.length === 1 ? clauses[0] : { or: clauses };
}

function andWhere(clauses: (Where | undefined)[]): Where {
  const present = clauses.filter((clause): clause is Where => clause !== undefined);
  if (present.length === 0) return {};
  return present.length === 1 ? present[0] : { and: present };
}

/**
 * contract levelのsortをPayloadのsortへ翻訳する。domainの `id` はPayloadの `stableId`。
 * 二次keyに常に `stableId` を足して、同値時の並びを決定的にする（local sourceと同じ規則）。
 */
function toPayloadSort(sort: string): string[] {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  const payloadField = field === 'id' ? 'stableId' : field;
  const primary = descending ? `-${payloadField}` : payloadField;
  return payloadField === 'stableId' ? [primary] : [primary, 'stableId'];
}

interface PayloadFindArgs {
  collection: ContentCollectionSlug;
  where: Where;
  sort: string[];
  limit?: number;
  page?: number;
}

interface PayloadFindResult {
  docs: unknown[];
  hasNextPage: boolean;
}

/**
 * `limit` 指定時はその1ページだけ、未指定時は明示的な `page` ループで条件に合う全件を取る。
 * `limit` / `page` / `sort` / `depth` はすべて明示し、Payloadの暗黙defaultへ委ねない。
 */
async function findDocs(payload: Payload, args: PayloadFindArgs, pageSize: number): Promise<unknown[]> {
  if (args.limit !== undefined) {
    const result = (await payload.find({
      collection: args.collection,
      where: args.where,
      limit: args.limit,
      page: args.page ?? 1,
      sort: args.sort,
      depth: 0,
      overrideAccess: true,
      pagination: true,
    })) as unknown as PayloadFindResult;
    return result.docs;
  }

  const docs: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = (await payload.find({
      collection: args.collection,
      where: args.where,
      limit: pageSize,
      page,
      sort: args.sort,
      depth: 0,
      overrideAccess: true,
      pagination: true,
    })) as unknown as PayloadFindResult;
    docs.push(...result.docs);
    if (!result.hasNextPage) return docs;
  }
  throw new Error(
    `payload-source-page-limit-exceeded: ${args.collection} returned more than ${MAX_PAGES * pageSize} documents`,
  );
}

export interface PayloadContentSourceOptions {
  /** テストや既存requestのinstance再利用向け。未指定なら `payload.config.ts` から生成する。 */
  payload?: Payload | Promise<Payload>;
}

export function createPayloadContentSource(options: PayloadContentSourceOptions = {}): FullContentSource {
  let instance: Promise<Payload> | undefined;

  const client = async (): Promise<Payload> => {
    if (options.payload) return options.payload;
    instance ??= getPayload({ config: payloadConfig });
    return instance;
  };

  /** stableId → Payload内部id。relationship filterはこの解決を経てから `where` に載せる。 */
  const internalId = async (
    payload: Payload,
    collection: ContentCollectionSlug,
    stableId: Id | undefined,
  ): Promise<string | number | undefined> => {
    if (!stableId) return undefined;
    return resolveStableIdToRelationshipId(payload, collection, stableId);
  };

  /**
   * relationship filterの参照先が存在しない場合は「一致0件」であって「filter無し」ではない。
   * `undefined` を返して `where` から落とすと全件返ってしまうため、明示的に区別する。
   */
  const relationshipWhere = async (
    payload: Payload,
    collection: ContentCollectionSlug,
    field: string,
    stableId: Id | undefined,
    operator: 'equals' | 'in',
  ): Promise<Where | undefined | 'no-match'> => {
    if (stableId === undefined) return undefined;
    const resolved = await internalId(payload, collection, stableId);
    if (resolved === undefined) return 'no-match';
    return operator === 'in' ? { [field]: { in: [resolved] } } : { [field]: { equals: resolved } };
  };

  /** `relationshipWhere` の結果をまとめる。1つでも `no-match` があれば全体が0件。 */
  const combineWhere = (base: (Where | undefined)[], relationships: (Where | undefined | 'no-match')[]): Where => {
    if (relationships.includes('no-match')) return MATCHES_NOTHING;
    return andWhere([...base, ...relationships.filter((clause): clause is Where | undefined => clause !== 'no-match')]);
  };

  const idsWhere = (ids: readonly Id[] | undefined): Where | undefined =>
    ids === undefined ? undefined : { stableId: { in: [...ids] } };

  /** 各mapperが受け取るdoc型（mapper側の内部型をそのまま使い、ここで別定義しない）。 */
  type DocOf<TMapper extends (doc: never, ...rest: never[]) => unknown> = Parameters<TMapper>[0];

  /** doc配列 → domain配列。relationship解決cacheは1回の読み取りの中だけで共有する。 */
  const mapAll = async <TRecord>(
    docs: unknown[],
    map: (doc: never, payload: Payload, cache: RelationshipResolutionCache) => Promise<TRecord> | TRecord,
  ): Promise<TRecord[]> => {
    if (docs.length === 0) return [];
    const payload = await client();
    const cache = createRelationshipResolutionCache();
    const mapped: TRecord[] = [];
    for (const doc of docs) {
      mapped.push(await map(doc as never, payload, cache));
    }
    return mapped;
  };

  /** ID / slug / previousSlug の単発解決に共通の形。 */
  const findOne = async <TRecord>(
    collection: ContentCollectionSlug,
    where: Where,
    map: (doc: never, payload: Payload, cache: RelationshipResolutionCache) => Promise<TRecord> | TRecord,
  ): Promise<TRecord | null> => {
    const payload = await client();
    const docs = await findDocs(payload, { collection, where, sort: ['stableId'], limit: 1, page: 1 }, RUNTIME_PAGE_SIZE);
    if (docs.length === 0) return null;
    const [record] = await mapAll(docs, map);
    return record ?? null;
  };

  const bySlugWhere = (slug: Slug, lookup: LookupQuery): Where =>
    andWhere([{ slug: { equals: slug } }, publishStatusWhere(lookup.publishStatuses)]);

  const byPreviousSlugWhere = (slug: Slug, lookup: LookupQuery): Where =>
    andWhere([{ previousSlugs: { equals: slug } }, publishStatusWhere(lookup.publishStatuses)]);

  const byIdWhere = (id: Id, lookup: LookupQuery): Where =>
    andWhere([{ stableId: { equals: id } }, publishStatusWhere(lookup.publishStatuses)]);

  const mapRobot = (doc: never, payload: Payload, cache: RelationshipResolutionCache) =>
    mapPayloadRobotToDomain(doc as DocOf<typeof mapPayloadRobotToDomain>, payload, cache);
  const mapRobotSeries = (doc: never, payload: Payload, cache: RelationshipResolutionCache) =>
    mapPayloadRobotSeriesToDomain(doc as DocOf<typeof mapPayloadRobotSeriesToDomain>, payload, cache);
  const mapDistributor = (doc: never, payload: Payload, cache: RelationshipResolutionCache) =>
    mapPayloadDistributorToDomain(doc as DocOf<typeof mapPayloadDistributorToDomain>, payload, cache);
  const mapUseCase = (doc: never, payload: Payload, cache: RelationshipResolutionCache) =>
    mapPayloadUseCaseToDomain(doc as DocOf<typeof mapPayloadUseCaseToDomain>, payload, cache);
  const mapDeployment = (doc: never, payload: Payload, cache: RelationshipResolutionCache) =>
    mapPayloadDeploymentToDomain(doc as DocOf<typeof mapPayloadDeploymentToDomain>, payload, cache);
  const mapArticle = (doc: never, payload: Payload, cache: RelationshipResolutionCache) =>
    mapPayloadArticleToDomain(doc as DocOf<typeof mapPayloadArticleToDomain>, payload, cache);
  const mapPlacement = (doc: never, payload: Payload, cache: RelationshipResolutionCache) =>
    mapPayloadArticlePlacementToDomain(doc as DocOf<typeof mapPayloadArticlePlacementToDomain>, payload, cache);
  const mapManufacturer = (doc: never) =>
    mapPayloadManufacturerToDomain(doc as DocOf<typeof mapPayloadManufacturerToDomain>);
  const mapMedia = (doc: never) => mapPayloadMediaToDomain(doc as DocOf<typeof mapPayloadMediaToDomain>);

  /**
   * `SiteSettings` global の生doc。
   *
   * 必須修正4-4（remediation group 2）: **ローカル定数へfallbackしない**。以前は
   * `settings.dataAsOf ?? siteMeta.dataAsOf` と `?? DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS` で
   * 欠落を埋めていたが、それではPayloadに値が無いことをparityが検出できない
   * （fallbackが常に正解を返すため、`import → export → parity` が構造的に必ず通る）。
   * Payloadを正本にした以上、値が無いのは「移行が完了していない」状態なので、
   * 黙って埋めずに `site-settings-not-migrated` で落とす。
   */
  const readSiteSettingsDocument = async (req?: SnapshotReadRequest): Promise<{
    dataAsOf?: string | null;
    articleIndexPlacementLimits?: Partial<Record<ArticlePlacementSlot, number | null>> | null;
  }> => {
    const payload = await client();
    const global = await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
      ...(req ? { req: req as never } : {}),
    });
    return global as {
      dataAsOf?: string | null;
      articleIndexPlacementLimits?: Partial<Record<ArticlePlacementSlot, number | null>> | null;
    };
  };

  const requireSiteSettings = async (req?: SnapshotReadRequest): Promise<ContentSnapshot['siteSettings']> => {
    const settings = await readSiteSettingsDocument(req);
    if (typeof settings.dataAsOf !== 'string' || settings.dataAsOf.length === 0) {
      throw new Error(
        'site-settings-not-migrated: the site-settings global has no dataAsOf value. ' +
          'Payload is the source of truth for site settings — run content:import / content:restore ' +
          'to populate it instead of relying on a local constant.',
      );
    }
    return { dataAsOf: settings.dataAsOf };
  };

  const requirePlacementLimits = async (req?: SnapshotReadRequest): Promise<Record<ArticlePlacementSlot, number>> => {
    const settings = await readSiteSettingsDocument(req);
    const limits = settings.articleIndexPlacementLimits;
    const missing = ARTICLE_PLACEMENT_SLOTS.filter((slot) => typeof limits?.[slot] !== 'number');
    if (missing.length > 0) {
      throw new Error(
        `site-settings-not-migrated: the site-settings global has no articleIndexPlacementLimits.${missing.join(' / ')} ` +
          'value. Payload is the source of truth for site settings — run content:import / content:restore ' +
          'to populate it instead of relying on a local constant.',
      );
    }
    return Object.fromEntries(ARTICLE_PLACEMENT_SLOTS.map((slot) => [slot, limits?.[slot] as number])) as Record<
      ArticlePlacementSlot,
      number
    >;
  };

  const listDocs = async (
    collection: ContentCollectionSlug,
    where: Where,
    sort: string,
    limit: number | undefined,
    page: number | undefined,
  ): Promise<unknown[]> => {
    const payload = await client();
    return findDocs(payload, { collection, where, sort: toPayloadSort(sort), limit, page }, RUNTIME_PAGE_SIZE);
  };

  const source: FullContentSource = {
    // ── robots ────────────────────────────────────────────────────────────
    async listRobots(query: RobotSourceQuery): Promise<Robot[]> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'manufacturers', 'manufacturerId', query.manufacturerId, 'equals'),
          await relationshipWhere(payload, 'robot-series', 'seriesId', query.seriesId, 'equals'),
        ],
      );
      return mapAll(await listDocs('robots', where, query.sort, query.limit, query.page), mapRobot);
    },
    findRobotById: (id, lookup) => findOne('robots', byIdWhere(id, lookup), mapRobot),
    findRobotBySlug: (slug, lookup) => findOne('robots', bySlugWhere(slug, lookup), mapRobot),
    findRobotByPreviousSlug: (slug, lookup) => findOne('robots', byPreviousSlugWhere(slug, lookup), mapRobot),

    // ── robotSeries ───────────────────────────────────────────────────────
    async listRobotSeries(query: RobotSeriesSourceQuery): Promise<RobotSeries[]> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [await relationshipWhere(payload, 'manufacturers', 'manufacturerId', query.manufacturerId, 'equals')],
      );
      return mapAll(await listDocs('robot-series', where, query.sort, query.limit, query.page), mapRobotSeries);
    },
    findRobotSeriesById: (id, lookup) => findOne('robot-series', byIdWhere(id, lookup), mapRobotSeries),
    findRobotSeriesBySlug: (slug, lookup) => findOne('robot-series', bySlugWhere(slug, lookup), mapRobotSeries),
    findRobotSeriesByPreviousSlug: (slug, lookup) =>
      findOne('robot-series', byPreviousSlugWhere(slug, lookup), mapRobotSeries),

    // ── manufacturers ─────────────────────────────────────────────────────
    async listManufacturers(query: ManufacturerSourceQuery): Promise<Manufacturer[]> {
      const where = andWhere([
        publishStatusWhere(query.publishStatuses),
        idsWhere(query.ids),
        query.country === undefined ? undefined : { country: { equals: query.country } },
      ]);
      return mapAll(await listDocs('manufacturers', where, query.sort, query.limit, query.page), mapManufacturer);
    },
    findManufacturerById: (id, lookup) => findOne('manufacturers', byIdWhere(id, lookup), mapManufacturer),
    findManufacturerBySlug: (slug, lookup) => findOne('manufacturers', bySlugWhere(slug, lookup), mapManufacturer),
    findManufacturerByPreviousSlug: (slug, lookup) =>
      findOne('manufacturers', byPreviousSlugWhere(slug, lookup), mapManufacturer),

    // ── distributors ──────────────────────────────────────────────────────
    async listDistributors(query: DistributorSourceQuery): Promise<Distributor[]> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'manufacturers', 'handledManufacturerIds', query.handledManufacturerId, 'in'),
          await relationshipWhere(payload, 'robots', 'handledRobotIds', query.handledRobotId, 'in'),
        ],
      );
      return mapAll(await listDocs('distributors', where, query.sort, query.limit, query.page), mapDistributor);
    },
    findDistributorById: (id, lookup) => findOne('distributors', byIdWhere(id, lookup), mapDistributor),
    findDistributorBySlug: (slug, lookup) => findOne('distributors', bySlugWhere(slug, lookup), mapDistributor),
    findDistributorByPreviousSlug: (slug, lookup) =>
      findOne('distributors', byPreviousSlugWhere(slug, lookup), mapDistributor),

    // ── useCases ──────────────────────────────────────────────────────────
    async listUseCases(query: UseCaseSourceQuery): Promise<UseCase[]> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'robots', 'candidateRobots.robotId', query.candidateRobotId, 'in'),
          await relationshipWhere(payload, 'robot-series', 'candidateRobots.seriesId', query.candidateSeriesId, 'in'),
        ],
      );
      return mapAll(await listDocs('use-cases', where, query.sort, query.limit, query.page), mapUseCase);
    },
    findUseCaseById: (id, lookup) => findOne('use-cases', byIdWhere(id, lookup), mapUseCase),
    findUseCaseBySlug: (slug, lookup) => findOne('use-cases', bySlugWhere(slug, lookup), mapUseCase),
    findUseCaseByPreviousSlug: (slug, lookup) => findOne('use-cases', byPreviousSlugWhere(slug, lookup), mapUseCase),

    // ── deployments ───────────────────────────────────────────────────────
    async listDeployments(query: DeploymentSourceQuery): Promise<DeploymentSite[]> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'manufacturers', 'manufacturerId', query.manufacturerId, 'equals'),
          await relationshipWhere(payload, 'robots', 'robotId', query.robotId, 'equals'),
          await relationshipWhere(payload, 'use-cases', 'relatedUseCaseIds', query.relatedUseCaseId, 'in'),
        ],
      );
      return mapAll(await listDocs('deployments', where, query.sort, query.limit, query.page), mapDeployment);
    },
    findDeploymentById: (id, lookup) => findOne('deployments', byIdWhere(id, lookup), mapDeployment),
    findDeploymentBySlug: (slug, lookup) => findOne('deployments', bySlugWhere(slug, lookup), mapDeployment),
    findDeploymentByPreviousSlug: (slug, lookup) =>
      findOne('deployments', byPreviousSlugWhere(slug, lookup), mapDeployment),

    // ── articles ──────────────────────────────────────────────────────────
    async listArticles(query: ArticleSourceQuery): Promise<Article[]> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'robots', 'relatedRobotIds', query.relatedRobotId, 'in'),
          await relationshipWhere(payload, 'manufacturers', 'relatedManufacturerIds', query.relatedManufacturerId, 'in'),
          await relationshipWhere(payload, 'use-cases', 'relatedUseCaseIds', query.relatedUseCaseId, 'in'),
        ],
      );
      return mapAll(await listDocs('articles', where, query.sort, query.limit, query.page), mapArticle);
    },
    findArticleById: (id, lookup) => findOne('articles', byIdWhere(id, lookup), mapArticle),
    findArticleBySlug: (slug, lookup) => findOne('articles', bySlugWhere(slug, lookup), mapArticle),
    findArticleByPreviousSlug: (slug, lookup) => findOne('articles', byPreviousSlugWhere(slug, lookup), mapArticle),

    // ── articlePlacements ─────────────────────────────────────────────────
    async listArticlePlacements(query: ArticlePlacementSourceQuery): Promise<ArticlePlacement[]> {
      const payload = await client();
      const where = combineWhere(
        [
          publishStatusWhere(query.publishStatuses),
          idsWhere(query.ids),
          query.surface === undefined ? undefined : { surface: { equals: query.surface } },
          query.slot === undefined ? undefined : { slot: { equals: query.slot } },
        ],
        [await relationshipWhere(payload, 'articles', 'articleId', query.articleId, 'equals')],
      );
      return mapAll(await listDocs('article-placements', where, query.sort, query.limit, query.page), mapPlacement);
    },
    findArticlePlacementById: (id, lookup) => findOne('article-placements', byIdWhere(id, lookup), mapPlacement),

    // ── media ─────────────────────────────────────────────────────────────
    async listMedia(query: MediaSourceQuery): Promise<MediaAsset[]> {
      // `media` は `_status` / `lifecycleStatus` を持たない（uploadの実体そのもの）。
      const where = andWhere([idsWhere(query.ids)]);
      return mapAll(await listDocs('media', where, query.sort, query.limit, query.page), mapMedia);
    },
    findMediaById: (id) => findOne('media', { stableId: { equals: id } }, mapMedia),

    // ── SiteSettings global ───────────────────────────────────────────────
    readArticleIndexPlacementLimits: () => requirePlacementLimits(),
    readSiteSettings: () => requireSiteSettings(),

    // ── 管理処理専用 ───────────────────────────────────────────────────────
    /**
     * import / export / parity / 横断validation用の全件読み出し。**ページからは到達できない**
     * （`ContentRepository` はこのメソッドを型として持たない）。`limit: 500` の全件取得を
     * 許すのはこの経路だけ。全 `publishStatus`（draft含む）を対象にする。
     */
    async readSnapshot(): Promise<ContentSnapshot> {
      const payload = await client();
      const statusWhere = publishStatusWhere(ALL_PUBLISH_STATUSES);
      const snapshotDocs = async (collection: ContentCollectionSlug, where: Where, sort: string[]) =>
        findDocs(payload, { collection, where, sort }, SNAPSHOT_PAGE_SIZE);

      const [
        robotDocs,
        robotSeriesDocs,
        distributorDocs,
        manufacturerDocs,
        useCaseDocs,
        deploymentDocs,
        articleDocs,
        placementDocs,
        mediaDocs,
      ] = await Promise.all([
        snapshotDocs('robots', statusWhere, ['stableId']),
        snapshotDocs('robot-series', statusWhere, ['stableId']),
        snapshotDocs('distributors', statusWhere, ['stableId']),
        snapshotDocs('manufacturers', statusWhere, ['stableId']),
        snapshotDocs('use-cases', statusWhere, ['stableId']),
        snapshotDocs('deployments', statusWhere, ['stableId']),
        snapshotDocs('articles', statusWhere, ['stableId']),
        snapshotDocs('article-placements', statusWhere, ['stableId']),
        snapshotDocs('media', {}, ['stableId']),
      ]);

      const [
        robots,
        robotSeries,
        distributors,
        manufacturers,
        useCases,
        deployments,
        articles,
        articlePlacements,
        media,
        articleIndexPlacementLimits,
        siteSettings,
      ] = await Promise.all([
        mapAll<Robot>(robotDocs, mapRobot),
        mapAll<RobotSeries>(robotSeriesDocs, mapRobotSeries),
        mapAll<Distributor>(distributorDocs, mapDistributor),
        mapAll<Manufacturer>(manufacturerDocs, mapManufacturer),
        mapAll<UseCase>(useCaseDocs, mapUseCase),
        mapAll<DeploymentSite>(deploymentDocs, mapDeployment),
        mapAll<Article>(articleDocs, mapArticle),
        mapAll<ArticlePlacement>(placementDocs, mapPlacement),
        mapAll<MediaAsset>(mediaDocs, mapMedia),
        source.readArticleIndexPlacementLimits(),
        source.readSiteSettings(),
      ]);

      return {
        robots,
        robotSeries,
        distributors,
        manufacturers,
        useCases,
        deployments,
        articles,
        articlePlacements,
        articleIndexPlacementLimits,
        media,
        siteSettings,
      };
    },
  };

  return source;
}
