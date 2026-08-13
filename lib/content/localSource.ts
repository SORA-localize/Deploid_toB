/**
 * local content source（`docs/plans/content-platform-migration-plan-v1.md` Task 4 Step 4）。
 *
 * 現行 `data/*.ts` の配列をメモリ上でqueryし、同時に管理処理向け `readSnapshot()` を提供する。
 * `lib/site.ts` の `dataAsOf` もsnapshotへ含める。
 *
 * **local（`data/*.ts`）を知っているのは、このファイルと `lib/data/localContentSnapshot.ts`
 * （配列をvalue importしてよい唯一のファイル＝`scripts/check-data-import-boundaries.mjs` の
 * allowlist）だけ**。移行完了後（Task 9）にこの2つと `data/*.ts` をまとめて削除できるようにする。
 * `lib/content/` の他のファイルはlegacy型（`data/types.ts`）を一切知らない。
 *
 * legacy型 → canonical domain型（`lib/content/domainTypes.ts`）の変換もここで行う。特に
 * `Robot` からはDEC-S05 / S06で削除された4フィールド
 * （`buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote`）を落とし、
 * Payload sourceと同じ形にそろえる（brief Step 8）。
 */
import type {
  Article as LegacyArticle,
  ArticlePlacement as LegacyArticlePlacement,
  DeploymentSite as LegacyDeploymentSite,
  Manufacturer as LegacyManufacturer,
  Robot as LegacyRobot,
  UseCase as LegacyUseCase,
} from '@/data/types';
import { localContentSnapshot, type LocalContentSnapshot } from '@/lib/data/localContentSnapshot';
import type {
  ArticlePlacementSortField,
  ArticlePlacementSourceQuery,
  ArticleSortField,
  ArticleSourceQuery,
  ContentSnapshot,
  DeploymentSortField,
  DeploymentSourceQuery,
  DistributorSortField,
  DistributorSourceQuery,
  FullContentSource,
  LookupQuery,
  ManufacturerSortField,
  ManufacturerSourceQuery,
  MediaSortField,
  MediaSourceQuery,
  RobotSeriesSortField,
  RobotSeriesSourceQuery,
  RobotSortField,
  RobotSourceQuery,
  UseCaseSortField,
  UseCaseSourceQuery,
} from './contracts';
import type {
  Article,
  ArticlePlacement,
  DeploymentSite,
  Distributor,
  Id,
  MediaAsset,
  Manufacturer,
  PublishStatus,
  Robot,
  RobotSeries,
  Slug,
  UseCase,
} from './domainTypes';

// ─── legacy（`data/types.ts`） → canonical domain（`domainTypes.ts`） ─────────
// spread（`...record`）で済ませず全フィールドを明示する。削除4フィールドの落とし漏れや、
// legacy側にだけ存在するfield（`Manufacturer.logo`）の混入を型で検出できるようにするため。

/**
 * local `data/*.ts` は任意配列を「fieldごと省略」でも「空配列」でも書ける（実データに
 * `industryTags: []` が存在する）。Payload側は `optionalArray`（`payloadMappers.ts`）で
 * 空配列を `undefined` へ寄せているため、local側も同じ規則にそろえないとTask 5のparity比較が
 * 「local `[]` vs Payload `undefined`」を差分として出す（実測9件）。「値なし」の表現を
 * 両source同じ1つ（`undefined`）にする。domain型が必須にしている配列
 * （`Article.relatedRobotIds` など）には使わない。
 */
function optionalArray<T>(value: readonly T[] | undefined): T[] | undefined {
  return value && value.length > 0 ? [...value] : undefined;
}

function toDomainRobot(robot: LegacyRobot): Robot {
  return {
    id: robot.id,
    slug: robot.slug,
    previousSlugs: optionalArray(robot.previousSlugs),
    summary: robot.summary,
    publishStatus: robot.publishStatus,
    updatedAt: robot.updatedAt,
    reliability: robot.reliability,
    sources: robot.sources,
    nextReviewBy: robot.nextReviewBy,
    heroImage: robot.heroImage,
    seo: robot.seo,
    name: robot.name,
    nameJa: robot.nameJa,
    manufacturerId: robot.manufacturerId,
    // `seriesId` はDEC-S08で新設。local `data/robots.ts` は未対応のため常にundefined。
    seriesId: undefined,
    category: robot.category,
    description: robot.description,
    featuredRank: robot.featuredRank,
    deploymentStage: robot.deploymentStage,
    supersededById: robot.supersededById,
    specs: robot.specs,
    procurementModels: robot.procurementModels,
    priceOffers: optionalArray(robot.priceOffers),
    loadRatings: optionalArray(robot.loadRatings),
    fieldEvidence: robot.fieldEvidence,
    usageExampleSourceUrls: optionalArray(robot.usageExampleSourceUrls),
    japanAvailability: robot.japanAvailability,
    distributorJapan: robot.distributorJapan,
    supportNote: robot.supportNote,
    images: robot.images,
    industryTags: optionalArray(robot.industryTags),
    taskTags: optionalArray(robot.taskTags),
    comparison: robot.comparison,
    // `buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote` は
    // canonical `Robot` に存在しない（DEC-S05 / S06）。ここで意図的に落とす。
  };
}

function toDomainManufacturer(manufacturer: LegacyManufacturer): Manufacturer {
  return {
    id: manufacturer.id,
    slug: manufacturer.slug,
    previousSlugs: optionalArray(manufacturer.previousSlugs),
    summary: manufacturer.summary,
    publishStatus: manufacturer.publishStatus,
    updatedAt: manufacturer.updatedAt,
    reliability: manufacturer.reliability,
    sources: manufacturer.sources,
    nextReviewBy: manufacturer.nextReviewBy,
    heroImage: manufacturer.heroImage,
    seo: manufacturer.seo,
    name: manufacturer.name,
    nameJa: manufacturer.nameJa,
    companyType: manufacturer.companyType,
    companyStatus: manufacturer.companyStatus,
    country: manufacturer.country,
    hqCity: manufacturer.hqCity,
    headquarters: manufacturer.headquarters,
    foundedYear: manufacturer.foundedYear,
    website: manufacturer.website,
    // legacy `logo`（単体ロゴ、@deprecated）はcanonical `Manufacturer` にもPayload
    // `collections/Manufacturers.ts` にも存在しない（Task 3）。ここでは落とす。
    logos: manufacturer.logos,
    contactUrl: manufacturer.contactUrl,
    description: manufacturer.description,
    japanPresence: manufacturer.japanPresence,
    domesticDistributors: optionalArray(manufacturer.domesticDistributors),
    distributorNote: manufacturer.distributorNote,
    supportNote: manufacturer.supportNote,
    procurementNote: manufacturer.procurementNote,
    vendorRiskNote: manufacturer.vendorRiskNote,
    featuredRank: manufacturer.featuredRank,
  };
}

function toDomainUseCase(useCase: LegacyUseCase): UseCase {
  return {
    id: useCase.id,
    slug: useCase.slug,
    previousSlugs: optionalArray(useCase.previousSlugs),
    summary: useCase.summary,
    publishStatus: useCase.publishStatus,
    updatedAt: useCase.updatedAt,
    reliability: useCase.reliability,
    sources: useCase.sources,
    nextReviewBy: useCase.nextReviewBy,
    heroImage: useCase.heroImage,
    seo: useCase.seo,
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
    candidateRobots: useCase.candidateRobots.map((candidate) => ({
      robotId: candidate.robotId,
      // legacy側に `seriesId` は無い（DEC-S08で新設）。
      seriesId: undefined,
      fit: candidate.fit,
      basis: candidate.basis,
      evidenceDeploymentIds: optionalArray(candidate.evidenceDeploymentIds),
      evidenceSourceUrls: optionalArray(candidate.evidenceSourceUrls),
      reason: candidate.reason,
    })),
  };
}

function toDomainDeployment(deployment: LegacyDeploymentSite): DeploymentSite {
  return {
    id: deployment.id,
    slug: deployment.slug,
    previousSlugs: optionalArray(deployment.previousSlugs),
    summary: deployment.summary,
    publishStatus: deployment.publishStatus,
    updatedAt: deployment.updatedAt,
    reliability: deployment.reliability,
    sources: deployment.sources,
    nextReviewBy: deployment.nextReviewBy,
    heroImage: deployment.heroImage,
    seo: deployment.seo,
    manufacturerId: deployment.manufacturerId,
    robotId: deployment.robotId,
    customer: deployment.customer,
    siteName: deployment.siteName,
    country: deployment.country,
    location: deployment.location,
    status: deployment.status,
    startedAt: deployment.startedAt,
    relatedUseCaseIds: optionalArray(deployment.relatedUseCaseIds),
  };
}

function toDomainArticle(article: LegacyArticle): Article {
  const common = {
    id: article.id,
    slug: article.slug,
    previousSlugs: optionalArray(article.previousSlugs),
    summary: article.summary,
    publishStatus: article.publishStatus,
    updatedAt: article.updatedAt,
    reliability: article.reliability,
    sources: article.sources,
    nextReviewBy: article.nextReviewBy,
    heroImage: article.heroImage,
    seo: article.seo,
    title: article.title,
    titleJa: article.titleJa,
    category: article.category,
    contentKind: article.contentKind,
    publishedAt: article.publishedAt,
    author: article.author,
    industryTags: optionalArray(article.industryTags),
    regionTags: optionalArray(article.regionTags),
    themeTags: optionalArray(article.themeTags),
    whyItMatters: article.whyItMatters,
    keyTakeaways: optionalArray(article.keyTakeaways),
    featured: article.featured,
    section: article.section,
    relatedRobotIds: article.relatedRobotIds,
    relatedManufacturerIds: article.relatedManufacturerIds,
    relatedUseCaseIds: article.relatedUseCaseIds,
  };

  if (article.type === 'manufacturer-guide') {
    return { ...common, type: 'manufacturer-guide', manufacturerGuideContent: article.manufacturerGuideContent };
  }
  return { ...common, type: article.type, body: article.body };
}

/**
 * legacy `ArticlePlacement` は `id` も `publishStatus` も持たない。
 * - `id`: Payload側の `stableId` と同じ規則 `surface:slot:articleId` で決定的に生成する（Task 3）。
 * - `publishStatus`: localのplacementは「存在＝掲載中」の運用なので `published` とする。
 */
export function localArticlePlacementId(placement: {
  surface: string;
  slot: string;
  articleId: string;
}): Id {
  return `${placement.surface}:${placement.slot}:${placement.articleId}`;
}

function toDomainArticlePlacement(placement: LegacyArticlePlacement): ArticlePlacement {
  return {
    id: localArticlePlacementId(placement),
    surface: placement.surface,
    slot: placement.slot,
    articleId: placement.articleId,
    order: placement.order,
    kind: placement.kind,
    sponsor: placement.sponsor,
    publishStatus: 'published',
  };
}

export function toDomainContentSnapshot(snapshot: LocalContentSnapshot): ContentSnapshot {
  return {
    robots: snapshot.robots.map(toDomainRobot),
    robotSeries: [...snapshot.robotSeries],
    distributors: [...snapshot.distributors],
    manufacturers: snapshot.manufacturers.map(toDomainManufacturer),
    useCases: snapshot.useCases.map(toDomainUseCase),
    deployments: snapshot.deployments.map(toDomainDeployment),
    articles: snapshot.articles.map(toDomainArticle),
    articlePlacements: snapshot.articlePlacements.map(toDomainArticlePlacement),
    articleIndexPlacementLimits: { ...snapshot.articleIndexPlacementLimits },
    media: [...snapshot.media],
    siteSettings: { dataAsOf: snapshot.siteSettings.dataAsOf },
  };
}

// ─── メモリ上のquery engine ─────────────────────────────────────────────

type SortValue = string | number | undefined;

/**
 * `undefined` は昇順で最後（Postgresの `NULLS LAST` 既定と同じ）。降順は全体を反転するため
 * `undefined` が先頭に来る（Postgresの `DESC` 既定と同じ）。文字列比較はcode unit順で、
 * `C` collationのPostgres側と揃える（`localeCompare` は使わない）。
 */
function compareSortValues(a: SortValue, b: SortValue): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const left = String(a);
  const right = String(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortRecords<T extends { id: Id }, TField extends string>(
  records: T[],
  sort: string,
  valueOf: (record: T, field: TField) => SortValue,
): T[] {
  const descending = sort.startsWith('-');
  const field = (descending ? sort.slice(1) : sort) as TField;
  return [...records].sort((a, b) => {
    const primary = compareSortValues(valueOf(a, field), valueOf(b, field));
    if (primary !== 0) return descending ? -primary : primary;
    // 二次keyは常に昇順のid（Payload側も `[primary, 'stableId']` で同じ形にする）。
    return compareSortValues(a.id, b.id);
  });
}

function applyPaging<T>(records: T[], limit: number | undefined, page: number | undefined): T[] {
  if (limit === undefined) return records;
  const currentPage = page ?? 1;
  const start = (currentPage - 1) * limit;
  return records.slice(start, start + limit);
}

function matchesStatus(record: { publishStatus: PublishStatus }, statuses: readonly PublishStatus[]): boolean {
  return statuses.includes(record.publishStatus);
}

function matchesIds(record: { id: Id }, ids: readonly Id[] | undefined): boolean {
  return ids === undefined || ids.includes(record.id);
}

const robotSortValue = (robot: Robot, field: RobotSortField): SortValue => {
  switch (field) {
    case 'id': return robot.id;
    case 'slug': return robot.slug;
    case 'name': return robot.name;
    case 'updatedAt': return robot.updatedAt;
    case 'featuredRank': return robot.featuredRank;
  }
};

const manufacturerSortValue = (manufacturer: Manufacturer, field: ManufacturerSortField): SortValue => {
  switch (field) {
    case 'id': return manufacturer.id;
    case 'slug': return manufacturer.slug;
    case 'name': return manufacturer.name;
    case 'updatedAt': return manufacturer.updatedAt;
    case 'featuredRank': return manufacturer.featuredRank;
  }
};

const robotSeriesSortValue = (series: RobotSeries, field: RobotSeriesSortField): SortValue => {
  switch (field) {
    case 'id': return series.id;
    case 'slug': return series.slug;
    case 'name': return series.name;
    case 'updatedAt': return series.updatedAt;
  }
};

const distributorSortValue = (distributor: Distributor, field: DistributorSortField): SortValue => {
  switch (field) {
    case 'id': return distributor.id;
    case 'slug': return distributor.slug;
    case 'name': return distributor.name;
    case 'updatedAt': return distributor.updatedAt;
  }
};

const useCaseSortValue = (useCase: UseCase, field: UseCaseSortField): SortValue => {
  switch (field) {
    case 'id': return useCase.id;
    case 'slug': return useCase.slug;
    case 'title': return useCase.title;
    case 'updatedAt': return useCase.updatedAt;
  }
};

const deploymentSortValue = (deployment: DeploymentSite, field: DeploymentSortField): SortValue => {
  switch (field) {
    case 'id': return deployment.id;
    case 'slug': return deployment.slug;
    case 'customer': return deployment.customer;
    case 'startedAt': return deployment.startedAt;
    case 'updatedAt': return deployment.updatedAt;
  }
};

const articleSortValue = (article: Article, field: ArticleSortField): SortValue => {
  switch (field) {
    case 'id': return article.id;
    case 'slug': return article.slug;
    case 'title': return article.title;
    case 'publishedAt': return article.publishedAt;
    case 'updatedAt': return article.updatedAt;
  }
};

const articlePlacementSortValue = (placement: ArticlePlacement, field: ArticlePlacementSortField): SortValue => {
  switch (field) {
    case 'id': return placement.id;
    case 'order': return placement.order;
    case 'slot': return placement.slot;
    case 'surface': return placement.surface;
  }
};

const mediaSortValue = (media: MediaAsset, field: MediaSortField): SortValue => {
  switch (field) {
    case 'id': return media.id;
    case 'filename': return media.filename;
  }
};

function findBySlug<T extends { slug: Slug; publishStatus: PublishStatus }>(
  records: readonly T[],
  slug: Slug,
  lookup: LookupQuery,
): T | null {
  return records.find((record) => record.slug === slug && matchesStatus(record, lookup.publishStatuses)) ?? null;
}

function findByPreviousSlug<T extends { previousSlugs?: Slug[]; publishStatus: PublishStatus }>(
  records: readonly T[],
  slug: Slug,
  lookup: LookupQuery,
): T | null {
  return (
    records.find(
      (record) => record.previousSlugs?.includes(slug) && matchesStatus(record, lookup.publishStatuses),
    ) ?? null
  );
}

function findById<T extends { id: Id; publishStatus: PublishStatus }>(
  records: readonly T[],
  id: Id,
  lookup: LookupQuery,
): T | null {
  return records.find((record) => record.id === id && matchesStatus(record, lookup.publishStatuses)) ?? null;
}

/**
 * canonical domain型のsnapshotをそのまま持つin-memory source。
 * `createLocalContentSource()` の実装本体であり、contract test（両source同一suite）が
 * fixture snapshotを流し込むためにも使う。
 */
export function createInMemoryContentSource(snapshot: ContentSnapshot): FullContentSource {
  const {
    robots,
    robotSeries,
    distributors,
    manufacturers,
    useCases,
    deployments,
    articles,
    articlePlacements,
    media,
  } = snapshot;

  return {
    async listRobots(query: RobotSourceQuery): Promise<Robot[]> {
      const filtered = robots.filter(
        (robot) =>
          matchesStatus(robot, query.publishStatuses) &&
          matchesIds(robot, query.ids) &&
          (query.manufacturerId === undefined || robot.manufacturerId === query.manufacturerId) &&
          (query.seriesId === undefined || robot.seriesId === query.seriesId),
      );
      return applyPaging(sortRecords(filtered, query.sort, robotSortValue), query.limit, query.page);
    },
    async findRobotById(id, lookup) {
      return findById(robots, id, lookup);
    },
    async findRobotBySlug(slug, lookup) {
      return findBySlug(robots, slug, lookup);
    },
    async findRobotByPreviousSlug(slug, lookup) {
      return findByPreviousSlug(robots, slug, lookup);
    },

    async listRobotSeries(query: RobotSeriesSourceQuery): Promise<RobotSeries[]> {
      const filtered = robotSeries.filter(
        (series) =>
          matchesStatus(series, query.publishStatuses) &&
          matchesIds(series, query.ids) &&
          (query.manufacturerId === undefined || series.manufacturerId === query.manufacturerId),
      );
      return applyPaging(sortRecords(filtered, query.sort, robotSeriesSortValue), query.limit, query.page);
    },
    async findRobotSeriesById(id, lookup) {
      return findById(robotSeries, id, lookup);
    },
    async findRobotSeriesBySlug(slug, lookup) {
      return findBySlug(robotSeries, slug, lookup);
    },
    async findRobotSeriesByPreviousSlug(slug, lookup) {
      return findByPreviousSlug(robotSeries, slug, lookup);
    },

    async listManufacturers(query: ManufacturerSourceQuery): Promise<Manufacturer[]> {
      const filtered = manufacturers.filter(
        (manufacturer) =>
          matchesStatus(manufacturer, query.publishStatuses) &&
          matchesIds(manufacturer, query.ids) &&
          (query.country === undefined || manufacturer.country === query.country),
      );
      return applyPaging(sortRecords(filtered, query.sort, manufacturerSortValue), query.limit, query.page);
    },
    async findManufacturerById(id, lookup) {
      return findById(manufacturers, id, lookup);
    },
    async findManufacturerBySlug(slug, lookup) {
      return findBySlug(manufacturers, slug, lookup);
    },
    async findManufacturerByPreviousSlug(slug, lookup) {
      return findByPreviousSlug(manufacturers, slug, lookup);
    },

    async listDistributors(query: DistributorSourceQuery): Promise<Distributor[]> {
      const filtered = distributors.filter(
        (distributor) =>
          matchesStatus(distributor, query.publishStatuses) &&
          matchesIds(distributor, query.ids) &&
          (query.handledManufacturerId === undefined ||
            distributor.handledManufacturerIds.includes(query.handledManufacturerId)) &&
          (query.handledRobotId === undefined ||
            (distributor.handledRobotIds?.includes(query.handledRobotId) ?? false)),
      );
      return applyPaging(sortRecords(filtered, query.sort, distributorSortValue), query.limit, query.page);
    },
    async findDistributorById(id, lookup) {
      return findById(distributors, id, lookup);
    },
    async findDistributorBySlug(slug, lookup) {
      return findBySlug(distributors, slug, lookup);
    },
    async findDistributorByPreviousSlug(slug, lookup) {
      return findByPreviousSlug(distributors, slug, lookup);
    },

    async listUseCases(query: UseCaseSourceQuery): Promise<UseCase[]> {
      const filtered = useCases.filter(
        (useCase) =>
          matchesStatus(useCase, query.publishStatuses) &&
          matchesIds(useCase, query.ids) &&
          (query.candidateRobotId === undefined ||
            useCase.candidateRobots.some((candidate) => candidate.robotId === query.candidateRobotId)) &&
          (query.candidateSeriesId === undefined ||
            useCase.candidateRobots.some((candidate) => candidate.seriesId === query.candidateSeriesId)),
      );
      return applyPaging(sortRecords(filtered, query.sort, useCaseSortValue), query.limit, query.page);
    },
    async findUseCaseById(id, lookup) {
      return findById(useCases, id, lookup);
    },
    async findUseCaseBySlug(slug, lookup) {
      return findBySlug(useCases, slug, lookup);
    },
    async findUseCaseByPreviousSlug(slug, lookup) {
      return findByPreviousSlug(useCases, slug, lookup);
    },

    async listDeployments(query: DeploymentSourceQuery): Promise<DeploymentSite[]> {
      const filtered = deployments.filter(
        (deployment) =>
          matchesStatus(deployment, query.publishStatuses) &&
          matchesIds(deployment, query.ids) &&
          (query.manufacturerId === undefined || deployment.manufacturerId === query.manufacturerId) &&
          (query.robotId === undefined || deployment.robotId === query.robotId) &&
          (query.relatedUseCaseId === undefined ||
            (deployment.relatedUseCaseIds?.includes(query.relatedUseCaseId) ?? false)),
      );
      return applyPaging(sortRecords(filtered, query.sort, deploymentSortValue), query.limit, query.page);
    },
    async findDeploymentById(id, lookup) {
      return findById(deployments, id, lookup);
    },
    async findDeploymentBySlug(slug, lookup) {
      return findBySlug(deployments, slug, lookup);
    },
    async findDeploymentByPreviousSlug(slug, lookup) {
      return findByPreviousSlug(deployments, slug, lookup);
    },

    async listArticles(query: ArticleSourceQuery): Promise<Article[]> {
      const filtered = articles.filter(
        (article) =>
          matchesStatus(article, query.publishStatuses) &&
          matchesIds(article, query.ids) &&
          (query.relatedRobotId === undefined || article.relatedRobotIds.includes(query.relatedRobotId)) &&
          (query.relatedManufacturerId === undefined ||
            article.relatedManufacturerIds.includes(query.relatedManufacturerId)) &&
          (query.relatedUseCaseId === undefined || article.relatedUseCaseIds.includes(query.relatedUseCaseId)),
      );
      return applyPaging(sortRecords(filtered, query.sort, articleSortValue), query.limit, query.page);
    },
    async findArticleById(id, lookup) {
      return findById(articles, id, lookup);
    },
    async findArticleBySlug(slug, lookup) {
      return findBySlug(articles, slug, lookup);
    },
    async findArticleByPreviousSlug(slug, lookup) {
      return findByPreviousSlug(articles, slug, lookup);
    },

    async listArticlePlacements(query: ArticlePlacementSourceQuery): Promise<ArticlePlacement[]> {
      const filtered = articlePlacements.filter(
        (placement) =>
          matchesStatus(placement, query.publishStatuses) &&
          matchesIds(placement, query.ids) &&
          (query.surface === undefined || placement.surface === query.surface) &&
          (query.slot === undefined || placement.slot === query.slot) &&
          (query.articleId === undefined || placement.articleId === query.articleId),
      );
      return applyPaging(sortRecords(filtered, query.sort, articlePlacementSortValue), query.limit, query.page);
    },
    async findArticlePlacementById(id, lookup) {
      return findById(articlePlacements, id, lookup);
    },

    async listMedia(query: MediaSourceQuery): Promise<MediaAsset[]> {
      const filtered = media.filter((asset) => matchesIds(asset, query.ids));
      return applyPaging(sortRecords(filtered, query.sort, mediaSortValue), query.limit, query.page);
    },
    async findMediaById(id) {
      return media.find((asset) => asset.id === id) ?? null;
    },

    async readArticleIndexPlacementLimits() {
      return { ...snapshot.articleIndexPlacementLimits };
    },
    async readSiteSettings() {
      return { ...snapshot.siteSettings };
    },

    /** 管理処理（import / export / parity / 横断validation）専用。ページからは到達できない。 */
    async readSnapshot(): Promise<ContentSnapshot> {
      return {
        robots: [...robots],
        robotSeries: [...robotSeries],
        distributors: [...distributors],
        manufacturers: [...manufacturers],
        useCases: [...useCases],
        deployments: [...deployments],
        articles: [...articles],
        articlePlacements: [...articlePlacements],
        articleIndexPlacementLimits: { ...snapshot.articleIndexPlacementLimits },
        media: [...media],
        siteSettings: { ...snapshot.siteSettings },
      };
    },
  };
}

/**
 * 現行 `data/*.ts` を読むlocal source。テストは `snapshot` を差し替えてfixtureで実行できる。
 */
export function createLocalContentSource(snapshot: LocalContentSnapshot = localContentSnapshot): FullContentSource {
  return createInMemoryContentSource(toDomainContentSnapshot(snapshot));
}
