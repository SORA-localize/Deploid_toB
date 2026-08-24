/**
 * content sourceの契約（`docs/plans/content-platform-migration-plan-v1.md` Task 4 Step 3）。
 *
 * 2つのinterfaceに分ける:
 * - `ContentSource`      : 公開runtime（ページ）用。query単位で必要な分だけ取る。
 * - `ContentSnapshotSource`: import / export / parity / 横断validation用。全件を1度に読む。
 *
 * **ページ処理から `readSnapshot()` を呼べない依存方向にする**（brief Step 3）。その担保は
 * 「規約」ではなく型と依存方向:
 * 1. `createContentRepository(source: ContentSource)` は引数を `ContentSource` としてのみ受ける。
 *    実体（local / Payload source）は両方を実装するが、repositoryはsnapshot側のメソッドを
 *    型として見えない位置に置く。
 * 2. `getContentRepository()`（= ページ側の唯一の入口）が返す `ContentRepository` に
 *    `readSnapshot()` は存在しない。ページはrepository経由でしかcontentへ到達できない。
 * 3. `scripts/check-data-import-boundaries.mjs` が `src/**` / `components/**` からの
 *    `lib/content/localSource` / `lib/content/payloadSource` の直接importを機械的に禁止する
 *    （snapshot側の唯一の入手経路がこの2ファイルのfactoryのため、これを塞げばページからは
 *    `readSnapshot()` へ到達できない）。
 *
 * このファイルはtypeとごく少数の定数だけを持ち、local / Payloadどちらの実装にも依存しない。
 */
import type {
  Article,
  ArticlePlacement,
  ArticlePlacementSlot,
  ArticlePlacementSurface,
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

/**
 * 管理処理（import / export / parity / 横断validation）専用の全件スナップショット。
 * 公開コンテンツ9 collection + `SiteSettings` global を持つ。`admins` は認証専用のため含めない
 * （brief Step 6の契約表）。
 */
export interface ContentSnapshot {
  robots: Robot[];
  robotSeries: RobotSeries[];
  distributors: Distributor[];
  manufacturers: Manufacturer[];
  useCases: UseCase[];
  deployments: DeploymentSite[];
  articles: Article[];
  articlePlacements: ArticlePlacement[];
  articleIndexPlacementLimits: Record<ArticlePlacementSlot, number>;
  media: MediaAsset[];
  siteSettings: {
    /** `lib/site.ts` の `siteMeta.dataAsOf`（掲載件数が正しい時点）。 */
    dataAsOf: string;
  };
}

/**
 * 必須修正4-4/4-5（remediation group 2）: ここには**既定値定数を置かない**。
 *
 * 以前は `DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS`（`data/articlePlacements.ts` の複製）があり、
 * Payload sourceが `SiteSettings` global に値が無いときそこへfallbackしていた。その結果
 * 「Payloadに値が無い」状態でも `import → export → parity` が必ず通り、SiteSettingsの移行漏れを
 * 検出できなかった。値の正本は source ごとに1つだけ:
 *
 * - local source  → `data/articlePlacements.ts` / `lib/site.ts`（`lib/data/localContentSnapshot.ts` 経由）
 * - Payload source → `site-settings` global（欠落時は `site-settings-not-migrated` で失敗する）
 *
 * 共有既定値を復活させると、この検出可能性がそのまま失われる。
 */

/** `-` 前置で降順。sortはfield裏付けのあるものだけを許す（local配列順は両sourceで再現できないため契約に含めない）。 */
export type ContentSort<TField extends string> = TField | `-${TField}`;

export type RobotSortField = 'id' | 'slug' | 'name' | 'updatedAt' | 'featuredRank';
export type ManufacturerSortField = 'id' | 'slug' | 'name' | 'updatedAt' | 'featuredRank';
export type RobotSeriesSortField = 'id' | 'slug' | 'name' | 'updatedAt';
export type DistributorSortField = 'id' | 'slug' | 'name' | 'updatedAt';
export type UseCaseSortField = 'id' | 'slug' | 'title' | 'updatedAt';
export type DeploymentSortField = 'id' | 'slug' | 'customer' | 'startedAt' | 'updatedAt';
export type ArticleSortField = 'id' | 'slug' | 'title' | 'publishedAt' | 'updatedAt';
export type ArticlePlacementSortField = 'id' | 'order' | 'slot' | 'surface';
export type MediaSortField = 'id' | 'filename';

/**
 * source levelのquery共通部。`publishStatuses` と `sort` は必須で、暗黙のdefaultを持たない
 * （brief Step 6: Payloadへは `where` / `limit` / `page` / `sort` / `depth: 0` を明示する）。
 * `limit` 省略は「条件に合う全件」を意味し、実装は明示的なpageループで取得する
 * （`limit: 500` 相当の暗黙全件取得は `readSnapshot()` だけに許す）。
 */
export interface BaseSourceQuery<TSortField extends string> {
  publishStatuses: readonly PublishStatus[];
  sort: ContentSort<TSortField>;
  limit?: number;
  /** 1始まり。`limit` を指定したときだけ意味を持つ。 */
  page?: number;
  /** 指定したstable IDのみ。並び順の保持はrepository側の責務。 */
  ids?: readonly Id[];
}

/**
 * ID / slug 単発解決の絞り込み。listと同じ `publishStatuses` の意味を持つ。
 *
 * `publishStatuses` に `'draft'` を含めることもできる（Draft Mode配線、`task7-draft-mode-wiring
 * -brief.md`）。これは`createContentRepository.ts`の`resolve*DraftDetailBySlug`系メソッド専用の
 * 意味で、通常の`resolve*DetailBySlug`（published(+archived))は`'draft'`を一切含めない
 * ——draft mode無効時のPublishStatusの意味は変えないという制約はここで担保される。
 *
 * `ContentSource`実装はこれを次のように解釈する:
 * - Payload source: `lookup.publishStatuses.includes('draft')` なら`payload.find()`/
 *   `findByID()`へ`draft: true`を渡す（Payloadの`queryDrafts`機構——公開中documentの上に
 *   積まれた未承認draft versionも含めて「最新version」を返す。main rowの`_status`だけを見る
 *   `where`句では、公開中documentへの未承認draft更新を拾えない——`payloadSource.ts`冒頭の
 *   `wantsDraft`のコメント参照）。
 * - Local source: `data/*.ts`は元々`publishStatus: 'draft'`のfixtureを含んでおり
 *   （`PublishStatus`型自体がdraftを含む）、既存の`matchesStatus`フィルタが素通しで対応する。
 *   追加の分岐は不要。
 */
export interface LookupQuery {
  publishStatuses: readonly PublishStatus[];
}

export interface RobotSourceQuery extends BaseSourceQuery<RobotSortField> {
  manufacturerId?: Id;
  seriesId?: Id;
}

export interface ManufacturerSourceQuery extends BaseSourceQuery<ManufacturerSortField> {
  country?: string;
}

export interface RobotSeriesSourceQuery extends BaseSourceQuery<RobotSeriesSortField> {
  manufacturerId?: Id;
}

export interface DistributorSourceQuery extends BaseSourceQuery<DistributorSortField> {
  handledManufacturerId?: Id;
  handledRobotId?: Id;
}

export interface UseCaseSourceQuery extends BaseSourceQuery<UseCaseSortField> {
  /** `candidateRobots[].robotId` に一致するもの。 */
  candidateRobotId?: Id;
  /** `candidateRobots[].seriesId` に一致するもの（DEC-S08）。 */
  candidateSeriesId?: Id;
}

export interface DeploymentSourceQuery extends BaseSourceQuery<DeploymentSortField> {
  manufacturerId?: Id;
  robotId?: Id;
  relatedUseCaseId?: Id;
}

export interface ArticleSourceQuery extends BaseSourceQuery<ArticleSortField> {
  relatedRobotId?: Id;
  relatedManufacturerId?: Id;
  relatedUseCaseId?: Id;
}

export interface ArticlePlacementSourceQuery extends BaseSourceQuery<ArticlePlacementSortField> {
  surface?: ArticlePlacementSurface;
  slot?: ArticlePlacementSlot;
  articleId?: Id;
}

/** `MediaAsset` は `publishStatus` / `slug` を持たない（アップロード実体そのもの）。 */
export interface MediaSourceQuery {
  sort: ContentSort<MediaSortField>;
  limit?: number;
  page?: number;
  ids?: readonly Id[];
}

/**
 * 1ページ分の結果 + そのクエリ時点での `totalDocs`（Task 6 Step 2: `listAllPublished*()` の
 * 安全なpagination-walk用）。`docs.length` は必ずしも `totalDocs` と一致しない
 * （`docs` はこのページだけ、`totalDocs` は条件に合う全件数）。
 *
 * repository層（`createContentRepository.ts`）はこの `totalDocs` を毎ページ比較して、
 * 読み取り中に対象集合が変化していないかを検査する。`ContentSource.list*()`（配列だけを返す）
 * では検査に必要な情報が失われるため、`list*Page()` を別メソッドとして持つ
 * （既存 `list*()` の返り値型は変えない）。
 */
export interface SourcePage<T> {
  docs: T[];
  totalDocs: number;
}

/**
 * 公開runtime用のsource契約。9 collection（`admins` を除く）へ同じ粒度で
 * list / findById / findBySlug（+ slug redirect解決用の findByPreviousSlug）を定義する。
 * `publishStatus` の意味づけ（一覧はpublishedのみ / 詳細はpublished+archived）は
 * **repository側の責務**で、sourceは渡された `publishStatuses` をそのまま物理queryへ翻訳する。
 */
export interface ContentSource {
  listRobots(query: RobotSourceQuery): Promise<Robot[]>;
  /**
   * `listRobots` と同じ絞り込み・並び順で1ページ分 + `totalDocs` を返す（Task 6 Step 2）。
   * `listAllPublishedRobots()`（repository層）の安全なpagination-walkだけが呼ぶ。
   * `query.limit` は必須（ページサイズ）、`query.page` 省略時は1ページ目。
   */
  listRobotsPage(query: RobotSourceQuery & { limit: number }): Promise<SourcePage<Robot>>;
  findRobotById(id: Id, lookup: LookupQuery): Promise<Robot | null>;
  findRobotBySlug(slug: Slug, lookup: LookupQuery): Promise<Robot | null>;
  findRobotByPreviousSlug(slug: Slug, lookup: LookupQuery): Promise<Robot | null>;

  listRobotSeries(query: RobotSeriesSourceQuery): Promise<RobotSeries[]>;
  findRobotSeriesById(id: Id, lookup: LookupQuery): Promise<RobotSeries | null>;
  findRobotSeriesBySlug(slug: Slug, lookup: LookupQuery): Promise<RobotSeries | null>;
  findRobotSeriesByPreviousSlug(slug: Slug, lookup: LookupQuery): Promise<RobotSeries | null>;

  listManufacturers(query: ManufacturerSourceQuery): Promise<Manufacturer[]>;
  listManufacturersPage(query: ManufacturerSourceQuery & { limit: number }): Promise<SourcePage<Manufacturer>>;
  findManufacturerById(id: Id, lookup: LookupQuery): Promise<Manufacturer | null>;
  findManufacturerBySlug(slug: Slug, lookup: LookupQuery): Promise<Manufacturer | null>;
  findManufacturerByPreviousSlug(slug: Slug, lookup: LookupQuery): Promise<Manufacturer | null>;

  listDistributors(query: DistributorSourceQuery): Promise<Distributor[]>;
  findDistributorById(id: Id, lookup: LookupQuery): Promise<Distributor | null>;
  findDistributorBySlug(slug: Slug, lookup: LookupQuery): Promise<Distributor | null>;
  findDistributorByPreviousSlug(slug: Slug, lookup: LookupQuery): Promise<Distributor | null>;

  listUseCases(query: UseCaseSourceQuery): Promise<UseCase[]>;
  listUseCasesPage(query: UseCaseSourceQuery & { limit: number }): Promise<SourcePage<UseCase>>;
  findUseCaseById(id: Id, lookup: LookupQuery): Promise<UseCase | null>;
  findUseCaseBySlug(slug: Slug, lookup: LookupQuery): Promise<UseCase | null>;
  findUseCaseByPreviousSlug(slug: Slug, lookup: LookupQuery): Promise<UseCase | null>;

  listDeployments(query: DeploymentSourceQuery): Promise<DeploymentSite[]>;
  findDeploymentById(id: Id, lookup: LookupQuery): Promise<DeploymentSite | null>;
  findDeploymentBySlug(slug: Slug, lookup: LookupQuery): Promise<DeploymentSite | null>;
  findDeploymentByPreviousSlug(slug: Slug, lookup: LookupQuery): Promise<DeploymentSite | null>;

  listArticles(query: ArticleSourceQuery): Promise<Article[]>;
  listArticlesPage(query: ArticleSourceQuery & { limit: number }): Promise<SourcePage<Article>>;
  findArticleById(id: Id, lookup: LookupQuery): Promise<Article | null>;
  findArticleBySlug(slug: Slug, lookup: LookupQuery): Promise<Article | null>;
  findArticleByPreviousSlug(slug: Slug, lookup: LookupQuery): Promise<Article | null>;

  listArticlePlacements(query: ArticlePlacementSourceQuery): Promise<ArticlePlacement[]>;
  findArticlePlacementById(id: Id, lookup: LookupQuery): Promise<ArticlePlacement | null>;

  listMedia(query: MediaSourceQuery): Promise<MediaAsset[]>;
  findMediaById(id: Id): Promise<MediaAsset | null>;

  /** `reports` index の hero / feature 上限。`ContentSnapshot` と同じ値を返す。 */
  readArticleIndexPlacementLimits(): Promise<Record<ArticlePlacementSlot, number>>;
  readSiteSettings(): Promise<ContentSnapshot['siteSettings']>;
}

/**
 * import / export / parity / 横断validation専用。**ページ処理はこのinterfaceへ到達できない**
 * （ファイル冒頭の依存方向を参照）。
 */
export interface ContentSnapshotSource {
  readSnapshot(): Promise<ContentSnapshot>;
}

/** local / Payloadの実体はどちらも両方を実装する。管理系ツールだけがこの型を受け取る。 */
export type FullContentSource = ContentSource & ContentSnapshotSource;

/** `previousSlugs` ヒット時の301用（現行 `lib/data.ts` の `SlugResolution` と同じ意味）。 */
export interface SlugResolution<T> {
  record?: T;
  /** `previousSlugs` にヒットした場合の正規slug。呼び出し側（詳細ページ）が301する（設計 §3-3）。 */
  redirectTo?: string;
}
