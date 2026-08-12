/**
 * source非依存のcontent repository（`docs/plans/content-platform-migration-plan-v1.md` Task 4 Step 5）。
 *
 * 現行 `lib/data.ts` が持っていた次の意味づけを、物理sourceを知らない形でここへ移す:
 * - published filter（一覧・比較・sitemapは `published` のみ）
 * - archived detail（詳細・関連欄は `published` + `archived`。無言で消さない。設計 §6.5-1）
 * - slug redirect（`previousSlugs` ヒット時は正規slugを `redirectTo` で返し、301は呼び出し側）
 * - ID解決（参照は不変 `id`。公開URLのパス解決だけが `slug`）
 * - 関連解決（`*Ids` の並び順を保持したまま実レコードへ解決する）
 *
 * この関数はpure（`process.env` もI/Oも触らない）。環境によるsource選択は
 * `lib/content/getContentRepository.ts` の責務。引数は `ContentSource` としてのみ受け取るので、
 * 実体が `readSnapshot()` を持っていてもrepository経由では到達できない（brief Step 3）。
 */
import type {
  ArticlePlacementSlot,
  ArticlePlacementSurface,
  Id,
  PublishStatus,
  Robot,
  RobotSeries,
  Slug,
} from './domainTypes';
import type {
  ArticlePlacementSortField,
  ArticleSortField,
  ContentSort,
  ContentSource,
  DeploymentSortField,
  DistributorSortField,
  LookupQuery,
  ManufacturerSortField,
  MediaSortField,
  RobotSeriesSortField,
  RobotSortField,
  SlugResolution,
  UseCaseSortField,
} from './contracts';

/** 一覧・比較・sitemapが見る集合。 */
const PUBLISHED_ONLY: readonly PublishStatus[] = ['published'];
/** 詳細・関連欄が見る集合。`archived` は「提供終了」として残す（設計 §6.5-1）。 */
const DETAIL_VISIBLE: readonly PublishStatus[] = ['published', 'archived'];

const publishedLookup: LookupQuery = { publishStatuses: PUBLISHED_ONLY };
const detailLookup: LookupQuery = { publishStatuses: DETAIL_VISIBLE };

// ─── 現行 `lib/data.ts` と共有するpure helper ────────────────────────────
// `lib/data.ts`（移行期間中はページが直接使い続ける）とrepositoryが同じ述語を使うようにして、
// 「published filter の意味」が2箇所で分岐しないようにする。

export function filterByPublishStatus<T extends { publishStatus: PublishStatus }>(
  items: readonly T[],
  statuses: readonly PublishStatus[],
): T[] {
  return items.filter((item) => statuses.includes(item.publishStatus));
}

export function filterPublished<T extends { publishStatus: PublishStatus }>(items: readonly T[]): T[] {
  return filterByPublishStatus(items, PUBLISHED_ONLY);
}

export function filterVisibleInDetail<T extends { publishStatus: PublishStatus }>(items: readonly T[]): T[] {
  return filterByPublishStatus(items, DETAIL_VISIBLE);
}

/** メモリ上の配列に対するslug解決（現行 `lib/data.ts` の `resolveBySlug` と同じ意味）。 */
export function resolveSlugInRecords<T extends { slug: Slug; previousSlugs?: Slug[] }>(
  records: readonly T[],
  slug: Slug,
): SlugResolution<T> {
  const record = records.find((item) => item.slug === slug);
  if (record) return { record };
  const moved = records.find((item) => item.previousSlugs?.includes(slug));
  return moved ? { redirectTo: moved.slug } : {};
}

/** `ids` の並び順を保持したまま実レコードへ解決する（並び順は編集判断の関連優先度）。 */
export function orderRecordsByIds<T extends { id: Id }>(ids: readonly Id[], records: readonly T[]): T[] {
  const recordById = new Map(records.map((record) => [record.id, record]));
  return ids
    .map((id) => recordById.get(id))
    .filter((record): record is NonNullable<typeof record> => record !== undefined);
}

// ─── repository levelのquery型 ───────────────────────────────────────────
// source levelと違い `publishStatuses` を持たない（published / detailの選択はrepositoryの意味づけ）。
// `sort` は省略時にcollectionごとの決定的なdefaultを使う。

export interface RepositoryListQuery<TSortField extends string> {
  limit?: number;
  /** 1始まり。`limit` を指定したときだけ意味を持つ。 */
  page?: number;
  sort?: ContentSort<TSortField>;
}

export interface RobotListQuery extends RepositoryListQuery<RobotSortField> {
  manufacturerId?: Id;
  seriesId?: Id;
}
export interface ManufacturerListQuery extends RepositoryListQuery<ManufacturerSortField> {
  country?: string;
}
export interface RobotSeriesListQuery extends RepositoryListQuery<RobotSeriesSortField> {
  manufacturerId?: Id;
}
export interface DistributorListQuery extends RepositoryListQuery<DistributorSortField> {
  handledManufacturerId?: Id;
  handledRobotId?: Id;
}
export interface UseCaseListQuery extends RepositoryListQuery<UseCaseSortField> {
  candidateRobotId?: Id;
  candidateSeriesId?: Id;
}
export interface DeploymentListQuery extends RepositoryListQuery<DeploymentSortField> {
  manufacturerId?: Id;
  robotId?: Id;
  relatedUseCaseId?: Id;
}
export interface ArticleListQuery extends RepositoryListQuery<ArticleSortField> {
  relatedRobotId?: Id;
  relatedManufacturerId?: Id;
  relatedUseCaseId?: Id;
}
export interface ArticlePlacementListQuery extends RepositoryListQuery<ArticlePlacementSortField> {
  surface?: ArticlePlacementSurface;
  slot?: ArticlePlacementSlot;
  articleId?: Id;
}
export type MediaListQuery = RepositoryListQuery<MediaSortField>;

/**
 * `/robots/[slug]` は `robots` と `robot-series` で namespaceを共有する（DEC-S08、②Task 4）。
 * どちらとして描くか・301するかを1回の解決で決められる形にする。
 */
export type RobotNamespaceResolution =
  | { kind: 'robot'; robot: Robot }
  | { kind: 'robot-series'; series: RobotSeries }
  | { kind: 'redirect'; redirectTo: Slug; target: 'robot' | 'robot-series' }
  | { kind: 'not-found' };

/**
 * slug解決の共通形。まず可視集合の正規slug、次に `previousSlugs` を見る
 * （現行 `lib/data.ts` の `resolveBySlug` と同じ順序・同じ意味）。
 */
async function resolveSlug<T extends { slug: Slug }>(
  slug: Slug,
  lookup: LookupQuery,
  findBySlug: (slug: Slug, lookup: LookupQuery) => Promise<T | null>,
  findByPreviousSlug: (slug: Slug, lookup: LookupQuery) => Promise<T | null>,
): Promise<SlugResolution<T>> {
  const record = await findBySlug(slug, lookup);
  if (record) return { record };
  const moved = await findByPreviousSlug(slug, lookup);
  return moved ? { redirectTo: moved.slug } : {};
}

export function createContentRepository(source: ContentSource) {
  /** `*Ids` 解決の共通形。sourceへは `ids` filterを渡し、並び順はrepositoryが復元する。 */
  const listByIds = async <T extends { id: Id }>(
    ids: readonly Id[],
    list: (ids: readonly Id[]) => Promise<T[]>,
  ): Promise<T[]> => {
    if (ids.length === 0) return [];
    return orderRecordsByIds(ids, await list(ids));
  };

  return {
    // ── robots ────────────────────────────────────────────────────────────
    listRobots: (query: RobotListQuery = {}) =>
      source.listRobots({ ...query, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    /** 詳細ページ・関連欄の対象（published + archived）。一覧・比較には使わない。 */
    listRobotsForDetail: (query: RobotListQuery = {}) =>
      source.listRobots({ ...query, sort: query.sort ?? 'id', publishStatuses: DETAIL_VISIBLE }),

    getRobotById: (id: Id) => source.findRobotById(id, publishedLookup),
    getRobotDetailById: (id: Id) => source.findRobotById(id, detailLookup),
    getRobotBySlug: (slug: Slug) => source.findRobotBySlug(slug, publishedLookup),

    resolveRobotDetailBySlug: (slug: Slug) =>
      resolveSlug(slug, detailLookup, source.findRobotBySlug.bind(source), source.findRobotByPreviousSlug.bind(source)),

    listRelatedRobots: (ids: readonly Id[]) =>
      listByIds(ids, (resolvedIds) =>
        source.listRobots({ ids: resolvedIds, sort: 'id', publishStatuses: DETAIL_VISIBLE }),
      ),

    listRobotsByManufacturerId: (manufacturerId: Id, query: RobotListQuery = {}) =>
      source.listRobots({ ...query, manufacturerId, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    // ── robotSeries ───────────────────────────────────────────────────────
    listRobotSeries: (query: RobotSeriesListQuery = {}) =>
      source.listRobotSeries({ ...query, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    getRobotSeriesById: (id: Id) => source.findRobotSeriesById(id, publishedLookup),
    getRobotSeriesDetailById: (id: Id) => source.findRobotSeriesById(id, detailLookup),
    getRobotSeriesBySlug: (slug: Slug) => source.findRobotSeriesBySlug(slug, publishedLookup),

    /**
     * `robot-series` 単体のslug解決。`/robots/[slug]` は `robots` と namespaceを共有するため、
     * ページは通常 `resolveRobotNamespaceBySlug` を使う。こちらはseries確定の文脈用。
     */
    resolveRobotSeriesBySlug: (slug: Slug) =>
      resolveSlug(
        slug,
        detailLookup,
        source.findRobotSeriesBySlug.bind(source),
        source.findRobotSeriesByPreviousSlug.bind(source),
      ),

    listRobotSeriesByManufacturerId: (manufacturerId: Id, query: RobotSeriesListQuery = {}) =>
      source.listRobotSeries({
        ...query,
        manufacturerId,
        sort: query.sort ?? 'id',
        publishStatuses: PUBLISHED_ONLY,
      }),

    /**
     * `/robots/[slug]` の解決。優先順位は
     * 1. `robots` の正規slug → 2. `robot-series` の正規slug →
     * 3. `robots` の `previousSlugs` → 4. `robot-series` の `previousSlugs`。
     * 同じslugが両collectionに存在してはならない（`lib/payload/routeRegistry.ts` が構造的に防ぐ）。
     * 万一衝突した場合はrobot優先で描く（既存URLの意味を変えないため）。
     */
    async resolveRobotNamespaceBySlug(slug: Slug): Promise<RobotNamespaceResolution> {
      const robot = await source.findRobotBySlug(slug, detailLookup);
      if (robot) return { kind: 'robot', robot };
      const series = await source.findRobotSeriesBySlug(slug, detailLookup);
      if (series) return { kind: 'robot-series', series };
      const movedRobot = await source.findRobotByPreviousSlug(slug, detailLookup);
      if (movedRobot) return { kind: 'redirect', redirectTo: movedRobot.slug, target: 'robot' };
      const movedSeries = await source.findRobotSeriesByPreviousSlug(slug, detailLookup);
      if (movedSeries) return { kind: 'redirect', redirectTo: movedSeries.slug, target: 'robot-series' };
      return { kind: 'not-found' };
    },

    // ── manufacturers ─────────────────────────────────────────────────────
    listManufacturers: (query: ManufacturerListQuery = {}) =>
      source.listManufacturers({ ...query, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    getManufacturerById: (id: Id) => source.findManufacturerById(id, publishedLookup),
    getManufacturerBySlug: (slug: Slug) => source.findManufacturerBySlug(slug, publishedLookup),

    resolveManufacturerDetailBySlug: (slug: Slug) =>
      resolveSlug(
        slug,
        publishedLookup,
        source.findManufacturerBySlug.bind(source),
        source.findManufacturerByPreviousSlug.bind(source),
      ),

    listRelatedManufacturers: (ids: readonly Id[]) =>
      listByIds(ids, (resolvedIds) =>
        source.listManufacturers({ ids: resolvedIds, sort: 'id', publishStatuses: PUBLISHED_ONLY }),
      ),

    // ── distributors ──────────────────────────────────────────────────────
    listDistributors: (query: DistributorListQuery = {}) =>
      source.listDistributors({ ...query, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    getDistributorById: (id: Id) => source.findDistributorById(id, publishedLookup),
    getDistributorBySlug: (slug: Slug) => source.findDistributorBySlug(slug, publishedLookup),

    resolveDistributorDetailBySlug: (slug: Slug) =>
      resolveSlug(
        slug,
        publishedLookup,
        source.findDistributorBySlug.bind(source),
        source.findDistributorByPreviousSlug.bind(source),
      ),

    listDistributorsForManufacturerId: (manufacturerId: Id, query: DistributorListQuery = {}) =>
      source.listDistributors({
        ...query,
        handledManufacturerId: manufacturerId,
        sort: query.sort ?? 'id',
        publishStatuses: PUBLISHED_ONLY,
      }),

    listDistributorsForRobotId: (robotId: Id, query: DistributorListQuery = {}) =>
      source.listDistributors({
        ...query,
        handledRobotId: robotId,
        sort: query.sort ?? 'id',
        publishStatuses: PUBLISHED_ONLY,
      }),

    // ── useCases ──────────────────────────────────────────────────────────
    listUseCases: (query: UseCaseListQuery = {}) =>
      source.listUseCases({ ...query, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    getUseCaseById: (id: Id) => source.findUseCaseById(id, publishedLookup),
    getUseCaseBySlug: (slug: Slug) => source.findUseCaseBySlug(slug, publishedLookup),

    resolveUseCaseDetailBySlug: (slug: Slug) =>
      resolveSlug(
        slug,
        publishedLookup,
        source.findUseCaseBySlug.bind(source),
        source.findUseCaseByPreviousSlug.bind(source),
      ),

    listUseCasesForRobotId: (robotId: Id, query: UseCaseListQuery = {}) =>
      source.listUseCases({
        ...query,
        candidateRobotId: robotId,
        sort: query.sort ?? 'id',
        publishStatuses: PUBLISHED_ONLY,
      }),

    listUseCasesForSeriesId: (seriesId: Id, query: UseCaseListQuery = {}) =>
      source.listUseCases({
        ...query,
        candidateSeriesId: seriesId,
        sort: query.sort ?? 'id',
        publishStatuses: PUBLISHED_ONLY,
      }),

    listRelatedUseCases: (ids: readonly Id[]) =>
      listByIds(ids, (resolvedIds) =>
        source.listUseCases({ ids: resolvedIds, sort: 'id', publishStatuses: PUBLISHED_ONLY }),
      ),

    // ── deployments ───────────────────────────────────────────────────────
    listDeployments: (query: DeploymentListQuery = {}) =>
      source.listDeployments({ ...query, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    getDeploymentById: (id: Id) => source.findDeploymentById(id, publishedLookup),
    getDeploymentBySlug: (slug: Slug) => source.findDeploymentBySlug(slug, publishedLookup),

    resolveDeploymentDetailBySlug: (slug: Slug) =>
      resolveSlug(
        slug,
        publishedLookup,
        source.findDeploymentBySlug.bind(source),
        source.findDeploymentByPreviousSlug.bind(source),
      ),

    listDeploymentsForManufacturerId: (manufacturerId: Id, query: DeploymentListQuery = {}) =>
      source.listDeployments({
        ...query,
        manufacturerId,
        sort: query.sort ?? 'id',
        publishStatuses: PUBLISHED_ONLY,
      }),

    listDeploymentsForRobotId: (robotId: Id, query: DeploymentListQuery = {}) =>
      source.listDeployments({ ...query, robotId, sort: query.sort ?? 'id', publishStatuses: PUBLISHED_ONLY }),

    listDeploymentsForUseCaseId: (useCaseId: Id, query: DeploymentListQuery = {}) =>
      source.listDeployments({
        ...query,
        relatedUseCaseId: useCaseId,
        sort: query.sort ?? 'id',
        publishStatuses: PUBLISHED_ONLY,
      }),

    // ── articles ──────────────────────────────────────────────────────────
    /** 既定は公開日の新しい順（現行 `getArticles()` の `byArticlePublishedDesc` と同じ意味）。 */
    listArticles: (query: ArticleListQuery = {}) =>
      source.listArticles({ ...query, sort: query.sort ?? '-publishedAt', publishStatuses: PUBLISHED_ONLY }),

    getArticleById: (id: Id) => source.findArticleById(id, publishedLookup),
    getArticleBySlug: (slug: Slug) => source.findArticleBySlug(slug, publishedLookup),

    resolveArticleDetailBySlug: (slug: Slug) =>
      resolveSlug(
        slug,
        publishedLookup,
        source.findArticleBySlug.bind(source),
        source.findArticleByPreviousSlug.bind(source),
      ),

    listArticlesForRobotId: (robotId: Id, query: ArticleListQuery = {}) =>
      source.listArticles({
        ...query,
        relatedRobotId: robotId,
        sort: query.sort ?? '-publishedAt',
        publishStatuses: PUBLISHED_ONLY,
      }),

    listArticlesForManufacturerId: (manufacturerId: Id, query: ArticleListQuery = {}) =>
      source.listArticles({
        ...query,
        relatedManufacturerId: manufacturerId,
        sort: query.sort ?? '-publishedAt',
        publishStatuses: PUBLISHED_ONLY,
      }),

    listArticlesForUseCaseId: (useCaseId: Id, query: ArticleListQuery = {}) =>
      source.listArticles({
        ...query,
        relatedUseCaseId: useCaseId,
        sort: query.sort ?? '-publishedAt',
        publishStatuses: PUBLISHED_ONLY,
      }),

    listRelatedArticles: (ids: readonly Id[]) =>
      listByIds(ids, (resolvedIds) =>
        source.listArticles({ ids: resolvedIds, sort: 'id', publishStatuses: PUBLISHED_ONLY }),
      ),

    // ── articlePlacements ─────────────────────────────────────────────────
    listArticlePlacements: (query: ArticlePlacementListQuery = {}) =>
      source.listArticlePlacements({ ...query, sort: query.sort ?? 'order', publishStatuses: PUBLISHED_ONLY }),

    getArticlePlacementById: (id: Id) => source.findArticlePlacementById(id, publishedLookup),

    getArticleIndexPlacementLimits: () => source.readArticleIndexPlacementLimits(),

    // ── media ─────────────────────────────────────────────────────────────
    listMedia: (query: MediaListQuery = {}) => source.listMedia({ ...query, sort: query.sort ?? 'id' }),

    getMediaById: (id: Id) => source.findMediaById(id),

    listRelatedMedia: (ids: readonly Id[]) =>
      listByIds(ids, (resolvedIds) => source.listMedia({ ids: resolvedIds, sort: 'id' })),

    // ── siteSettings ──────────────────────────────────────────────────────
    getSiteSettings: () => source.readSiteSettings(),
  };
}

/**
 * ページ・view modelが受け取る型。`readSnapshot()` を**持たない**ことがこの型の要点
 * （import / export / parity 専用の全件読み出しへページから到達できないようにする）。
 */
export type ContentRepository = ReturnType<typeof createContentRepository>;
