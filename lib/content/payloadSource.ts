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
  type SourcePage,
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
export interface SnapshotReadRequest {
  transactionID: string | number;
}

/** `site-settings` global の生doc（未移行なら値が欠けうるので、すべて任意 + null許容で受ける）。 */
interface SiteSettingsDocument {
  dataAsOf?: string | null;
  articleIndexPlacementLimits?: Partial<Record<ArticlePlacementSlot, number | null>> | null;
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
  /** 指定するとこの読み取りが `req.transactionID` のtransactionへ載る（`readSnapshot()` 用）。 */
  req?: SnapshotReadRequest;
  /**
   * Draft Mode配線（`LookupQuery.publishStatuses`に`'draft'`が含まれるとき）。`payload.find()`へ
   * そのまま`draft: true`として渡す。
   *
   * これが要る理由: `_status: {equals: 'draft'}`という`where`句だけでは、**公開中documentの上に
   * 積まれた未承認draft更新**を拾えない。Payloadのdraft機構では、公開済みdocumentへ
   * `draft: true`のupdateを保存しても、main table row（通常のfindが見る場所）は書き換わらず
   * `_status: 'published'`のまま残る——新しいdraft versionは`_versions`テーブルにだけ追加される
   * （`node_modules/payload/dist/collections/operations/updateByID.js`、`lib/payload/access.ts`
   * の`isDraftSave`コメント参照）。`draft: true`を渡すと、Payloadは`payload.db.queryDrafts()`
   * （`node_modules/@payloadcms/drizzle/dist/queryDrafts.js`）で`_versions`テーブル側を
   * `latest: true`条件で検索し、documentごとの**最新version**（draftであれpublishedであれ）を
   * 返す——これが唯一、未承認draft更新の実際の中身を読める経路。
   *
   * ブランド新規（一度もpublishされていない）documentは、main rowが最初から`_status: 'draft'`
   * なので`draft: true`を付けなくても`where`だけで見つかるが、`draft: true`を付けても同じ結果に
   * なる（`queryDrafts`は常に`latest: true`のversionを返すため、一度もpublishされていない
   * documentの最新versionはそのdocument自身と同じ）。両方のケースを同じ経路で扱うため常に
   * `draft: true`を渡す。
   */
  draft?: boolean;
}

interface PayloadFindResult {
  docs: unknown[];
  hasNextPage: boolean;
  totalDocs: number;
}

/** `findDocs` がページループで得た結果。`readSnapshot()` は `totalDocs` まで検査する。 */
interface PagedDocs {
  docs: unknown[];
  /** 最終ページ時点でPayloadが報告した総件数。 */
  totalDocs: number;
}

/**
 * 必須修正5-2（remediation group 2）: pagination の整合性検査。
 *
 * ページループは「`hasNextPage` が false になったら完了」としか見ていなかった。ページ跨ぎで
 * 取りこぼしや二重取得が起きても、snapshot はそれを**正しい全件**として出してしまう
 * （欠落は `missing`、重複は同一idの二重出現として、後段のparityやimportを黙って狂わせる）。
 * 全件取得を名乗る以上、件数と一意性は読み取った側が確かめる。
 *
 * 純粋関数として切り出してあるのは、実DBでこの2つの故障を再現させるのが難しく、
 * 「guardが存在する」ではなく「guardが実際に落とす」ことをテストで固定したいため。
 */
export function assertSnapshotPageIntegrity(
  collection: string,
  docs: readonly { stableId?: unknown }[],
  totalDocs: number,
): void {
  if (docs.length !== totalDocs) {
    throw new Error(
      `snapshot-pagination-incomplete: ${collection} fetched ${docs.length} of ${totalDocs} document(s). ` +
        'A page loop that disagrees with totalDocs means documents were added, removed, or skipped mid-read.',
    );
  }

  const seen = new Set<string>();
  for (const doc of docs) {
    const stableId = doc?.stableId;
    if (typeof stableId !== 'string' || stableId.length === 0) {
      throw new Error(`snapshot-missing-stable-id: ${collection} returned a document without a stableId.`);
    }
    if (seen.has(stableId)) {
      throw new Error(
        `snapshot-duplicate-stable-id: ${collection} returned "${stableId}" more than once across pages.`,
      );
    }
    seen.add(stableId);
  }
}

/**
 * `limit` 指定時はその1ページだけ、未指定時は明示的な `page` ループで条件に合う全件を取る。
 * `limit` / `page` / `sort` / `depth` はすべて明示し、Payloadの暗黙defaultへ委ねない。
 */
async function findPagedDocs(payload: Payload, args: PayloadFindArgs, pageSize: number): Promise<PagedDocs> {
  const req = args.req ? { req: args.req as never } : {};

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
      draft: args.draft ?? false,
      ...req,
    })) as unknown as PayloadFindResult;
    return { docs: result.docs, totalDocs: result.totalDocs };
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
      draft: args.draft ?? false,
      ...req,
    })) as unknown as PayloadFindResult;
    docs.push(...result.docs);
    if (!result.hasNextPage) return { docs, totalDocs: result.totalDocs };
  }
  throw new Error(
    `payload-source-page-limit-exceeded: ${args.collection} returned more than ${MAX_PAGES * pageSize} documents`,
  );
}

async function findDocs(payload: Payload, args: PayloadFindArgs, pageSize: number): Promise<unknown[]> {
  return (await findPagedDocs(payload, args, pageSize)).docs;
}

export interface PayloadContentSourceOptions {
  /** テストや既存requestのinstance再利用向け。未指定なら `payload.config.ts` から生成する。 */
  payload?: Payload | Promise<Payload>;
}

export interface SnapshotReadOptions {
  /**
   * **回帰テスト専用**の差し込み口（`tests/content/snapshot-consistency.test.ts`）。
   * 1 collection（または global）を読み終えた直後に呼ばれる。本番の呼び出し側は渡さない。
   * `publishApprovedVersion()` の `onApprovalVerified` と同じ用途・同じ扱い。
   */
  onCollectionRead?: (collection: string, req: SnapshotReadRequest) => void | Promise<void>;
}

/**
 * Payload source は `FullContentSource` に加えて、`readSnapshot()` のテスト用差し込み口を持つ。
 * `ContentSnapshotSource`（source非依存の契約）側は引数なしのままにする。
 */
export type PayloadContentSource = FullContentSource & {
  readSnapshot(options?: SnapshotReadOptions): Promise<ContentSnapshot>;
};

/**
 * 必須修正5-1（remediation group 2）: snapshot中の**すべての**Payload読み取りを同じ
 * transactionへ載せるためのwrapper。
 *
 * `readSnapshot()` 内で `req` を渡し忘れた読み取りが1つでもあると、その読み取りだけが
 * transactionの外（= 別のsnapshot時点）を見る。しかも症状は「たまに参照が壊れたsnapshotが
 * 出来る」という再現しにくい形で、型検査でもテストでも捕まりにくい。
 *
 * mapper（`lib/content/payloadMappers.ts`）は relationship の内部id → stableId 解決のために
 * 自前で `payload.findByID` / `payload.find` を呼ぶ。9つのmapper signatureへ `req` を通す
 * 方式だと「新しいmapperで渡し忘れる」が静かに起こるので、**payload instance側で
 * 構造的に強制する**。ここを通した payload を渡す限り、mapperが何回どこを読んでも
 * 同じtransactionに載る。
 */
function transactionScopedPayload(payload: Payload, req: SnapshotReadRequest): Payload {
  const READ_METHODS = new Set(['find', 'findByID', 'findGlobal', 'findVersions', 'count']);
  return new Proxy(payload, {
    get(target, property) {
      const value = Reflect.get(target, property) as unknown;
      if (typeof value !== 'function') return value;
      const bound = (value as (...args: unknown[]) => unknown).bind(target);
      if (typeof property !== 'string' || !READ_METHODS.has(property)) return bound;
      return (args: Record<string, unknown>) => bound({ ...args, req });
    },
  }) as Payload;
}

/**
 * 必須修正5-1: 全 collection + global を1つの **repeatable read** transactionで読む。
 *
 * 以前は9 collectionを `Promise.all` で独立にqueryしていた。Postgres の既定である
 * READ COMMITTED では文ごとに新しいsnapshotを取るため、export中にcommitされた書き込みが
 * 「あるcollectionには反映済み、別のcollectionには未反映」という形で混ざりうる。
 * repeatable read なら transaction 内の全文が同じDB snapshotを見るので、混合状態が
 * 構造的に起こらない（「double-read/retryで同一revisionを確認する」という代替案は、
 * Payload Local API が transaction を素通しで扱える以上、不要）。
 *
 * `accessMode: 'read only'` も付ける。snapshot読み出しが書き込みを行わないことをDB側で
 * 保証し、将来ここに書き込みが紛れ込んだら即座にエラーになるようにする。
 *
 * 読み取りは `Promise.all` ではなく**直列**に行う。1つのtransactionは1本のconnection上に
 * あり、同じconnectionへ並行してqueryを流すのは pg の想定外
 * （`Calling client.query() when the client is already executing a query`）。
 */
async function withSnapshotTransaction<T>(
  payload: Payload,
  run: (req: SnapshotReadRequest, txPayload: Payload) => Promise<T>,
): Promise<T> {
  const transactionID = await payload.db.beginTransaction({
    isolationLevel: 'repeatable read',
    accessMode: 'read only',
  });
  if (transactionID === null || transactionID === undefined) {
    throw new Error(
      'snapshot-transaction-unavailable: this database adapter does not support transactions, so ' +
        'readSnapshot() cannot guarantee a single consistent revision across collections.',
    );
  }

  const req: SnapshotReadRequest = { transactionID };
  let committed = false;
  try {
    const result = await run(req, transactionScopedPayload(payload, req));
    await payload.db.commitTransaction(transactionID);
    committed = true;
    return result;
  } catch (error) {
    if (!committed) await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}

export function createPayloadContentSource(options: PayloadContentSourceOptions = {}): PayloadContentSource {
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

  /**
   * doc配列 → domain配列。relationship解決cacheは1回の読み取りの中だけで共有する。
   * `scopedPayload` を渡すと mapper の relationship 解決もその transaction へ載る（必須修正5-1）。
   */
  const mapAll = async <TRecord>(
    docs: unknown[],
    map: (doc: never, payload: Payload, cache: RelationshipResolutionCache) => Promise<TRecord> | TRecord,
    scopedPayload?: Payload,
  ): Promise<TRecord[]> => {
    if (docs.length === 0) return [];
    const payload = scopedPayload ?? (await client());
    const cache = createRelationshipResolutionCache();
    const mapped: TRecord[] = [];
    for (const doc of docs) {
      mapped.push(await map(doc as never, payload, cache));
    }
    return mapped;
  };

  /** ID / slug / previousSlug の単発解決に共通の形。`draft`は`wantsDraft(lookup)`から渡す。 */
  const findOne = async <TRecord>(
    collection: ContentCollectionSlug,
    where: Where,
    map: (doc: never, payload: Payload, cache: RelationshipResolutionCache) => Promise<TRecord> | TRecord,
    draft = false,
  ): Promise<TRecord | null> => {
    const payload = await client();
    const docs = await findDocs(
      payload,
      { collection, where, sort: ['stableId'], limit: 1, page: 1, draft },
      RUNTIME_PAGE_SIZE,
    );
    if (docs.length === 0) return null;
    const [record] = await mapAll(docs, map);
    return record ?? null;
  };

  /** `LookupQuery.publishStatuses`に`'draft'`が含まれるか（`PayloadFindArgs.draft`のコメント参照）。 */
  const wantsDraft = (lookup: LookupQuery): boolean => lookup.publishStatuses.includes('draft');

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
  const readSiteSettingsDocument = async (scopedPayload?: Payload): Promise<SiteSettingsDocument> => {
    const payload = scopedPayload ?? (await client());
    const global = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true });
    return global as SiteSettingsDocument;
  };

  const requireSiteSettings = (settings: SiteSettingsDocument): ContentSnapshot['siteSettings'] => {
    if (typeof settings.dataAsOf !== 'string' || settings.dataAsOf.length === 0) {
      throw new Error(
        'site-settings-not-migrated: the site-settings global has no dataAsOf value. ' +
          'Payload is the source of truth for site settings — run content:import / content:restore ' +
          'to populate it instead of relying on a local constant.',
      );
    }
    return { dataAsOf: settings.dataAsOf };
  };

  const requirePlacementLimits = (settings: SiteSettingsDocument): Record<ArticlePlacementSlot, number> => {
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

  /**
   * `listDocs` の1ページ版。`limit` を必須にして常に単一の `payload.find()` 呼び出しに固定し、
   * その呼び出しが報告した `totalDocs` をそのまま返す（Task 6 Step 2: `listAllPublished*()` の
   * 安全なpagination-walkが、ページをまたいで `totalDocs` の変化を検査するために使う）。
   */
  const listDocsPage = async <TRecord>(
    collection: ContentCollectionSlug,
    where: Where,
    sort: string,
    limit: number,
    page: number | undefined,
    map: (doc: never, payload: Payload, cache: RelationshipResolutionCache) => Promise<TRecord> | TRecord,
  ): Promise<SourcePage<TRecord>> => {
    const payload = await client();
    const { docs, totalDocs } = await findPagedDocs(
      payload,
      { collection, where, sort: toPayloadSort(sort), limit, page: page ?? 1 },
      RUNTIME_PAGE_SIZE,
    );
    return { docs: await mapAll(docs, map), totalDocs };
  };

  const source: PayloadContentSource = {
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
    async listRobotsPage(query: RobotSourceQuery & { limit: number }): Promise<SourcePage<Robot>> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'manufacturers', 'manufacturerId', query.manufacturerId, 'equals'),
          await relationshipWhere(payload, 'robot-series', 'seriesId', query.seriesId, 'equals'),
        ],
      );
      return listDocsPage('robots', where, query.sort, query.limit, query.page, mapRobot);
    },
    findRobotById: (id, lookup) => findOne('robots', byIdWhere(id, lookup), mapRobot, wantsDraft(lookup)),
    findRobotBySlug: (slug, lookup) => findOne('robots', bySlugWhere(slug, lookup), mapRobot, wantsDraft(lookup)),
    findRobotByPreviousSlug: (slug, lookup) =>
      findOne('robots', byPreviousSlugWhere(slug, lookup), mapRobot, wantsDraft(lookup)),

    // ── robotSeries ───────────────────────────────────────────────────────
    async listRobotSeries(query: RobotSeriesSourceQuery): Promise<RobotSeries[]> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [await relationshipWhere(payload, 'manufacturers', 'manufacturerId', query.manufacturerId, 'equals')],
      );
      return mapAll(await listDocs('robot-series', where, query.sort, query.limit, query.page), mapRobotSeries);
    },
    findRobotSeriesById: (id, lookup) => findOne('robot-series', byIdWhere(id, lookup), mapRobotSeries, wantsDraft(lookup)),
    findRobotSeriesBySlug: (slug, lookup) =>
      findOne('robot-series', bySlugWhere(slug, lookup), mapRobotSeries, wantsDraft(lookup)),
    findRobotSeriesByPreviousSlug: (slug, lookup) =>
      findOne('robot-series', byPreviousSlugWhere(slug, lookup), mapRobotSeries, wantsDraft(lookup)),

    // ── manufacturers ─────────────────────────────────────────────────────
    async listManufacturers(query: ManufacturerSourceQuery): Promise<Manufacturer[]> {
      const where = andWhere([
        publishStatusWhere(query.publishStatuses),
        idsWhere(query.ids),
        query.country === undefined ? undefined : { country: { equals: query.country } },
      ]);
      return mapAll(await listDocs('manufacturers', where, query.sort, query.limit, query.page), mapManufacturer);
    },
    async listManufacturersPage(
      query: ManufacturerSourceQuery & { limit: number },
    ): Promise<SourcePage<Manufacturer>> {
      const where = andWhere([
        publishStatusWhere(query.publishStatuses),
        idsWhere(query.ids),
        query.country === undefined ? undefined : { country: { equals: query.country } },
      ]);
      return listDocsPage('manufacturers', where, query.sort, query.limit, query.page, mapManufacturer);
    },
    findManufacturerById: (id, lookup) =>
      findOne('manufacturers', byIdWhere(id, lookup), mapManufacturer, wantsDraft(lookup)),
    findManufacturerBySlug: (slug, lookup) =>
      findOne('manufacturers', bySlugWhere(slug, lookup), mapManufacturer, wantsDraft(lookup)),
    findManufacturerByPreviousSlug: (slug, lookup) =>
      findOne('manufacturers', byPreviousSlugWhere(slug, lookup), mapManufacturer, wantsDraft(lookup)),

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
    findDistributorById: (id, lookup) =>
      findOne('distributors', byIdWhere(id, lookup), mapDistributor, wantsDraft(lookup)),
    findDistributorBySlug: (slug, lookup) =>
      findOne('distributors', bySlugWhere(slug, lookup), mapDistributor, wantsDraft(lookup)),
    findDistributorByPreviousSlug: (slug, lookup) =>
      findOne('distributors', byPreviousSlugWhere(slug, lookup), mapDistributor, wantsDraft(lookup)),

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
    async listUseCasesPage(query: UseCaseSourceQuery & { limit: number }): Promise<SourcePage<UseCase>> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'robots', 'candidateRobots.robotId', query.candidateRobotId, 'in'),
          await relationshipWhere(payload, 'robot-series', 'candidateRobots.seriesId', query.candidateSeriesId, 'in'),
        ],
      );
      return listDocsPage('use-cases', where, query.sort, query.limit, query.page, mapUseCase);
    },
    findUseCaseById: (id, lookup) => findOne('use-cases', byIdWhere(id, lookup), mapUseCase, wantsDraft(lookup)),
    findUseCaseBySlug: (slug, lookup) => findOne('use-cases', bySlugWhere(slug, lookup), mapUseCase, wantsDraft(lookup)),
    findUseCaseByPreviousSlug: (slug, lookup) =>
      findOne('use-cases', byPreviousSlugWhere(slug, lookup), mapUseCase, wantsDraft(lookup)),

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
    findDeploymentById: (id, lookup) => findOne('deployments', byIdWhere(id, lookup), mapDeployment, wantsDraft(lookup)),
    findDeploymentBySlug: (slug, lookup) =>
      findOne('deployments', bySlugWhere(slug, lookup), mapDeployment, wantsDraft(lookup)),
    findDeploymentByPreviousSlug: (slug, lookup) =>
      findOne('deployments', byPreviousSlugWhere(slug, lookup), mapDeployment, wantsDraft(lookup)),

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
    async listArticlesPage(query: ArticleSourceQuery & { limit: number }): Promise<SourcePage<Article>> {
      const payload = await client();
      const where = combineWhere(
        [publishStatusWhere(query.publishStatuses), idsWhere(query.ids)],
        [
          await relationshipWhere(payload, 'robots', 'relatedRobotIds', query.relatedRobotId, 'in'),
          await relationshipWhere(payload, 'manufacturers', 'relatedManufacturerIds', query.relatedManufacturerId, 'in'),
          await relationshipWhere(payload, 'use-cases', 'relatedUseCaseIds', query.relatedUseCaseId, 'in'),
        ],
      );
      return listDocsPage('articles', where, query.sort, query.limit, query.page, mapArticle);
    },
    findArticleById: (id, lookup) => findOne('articles', byIdWhere(id, lookup), mapArticle, wantsDraft(lookup)),
    findArticleBySlug: (slug, lookup) => findOne('articles', bySlugWhere(slug, lookup), mapArticle, wantsDraft(lookup)),
    findArticleByPreviousSlug: (slug, lookup) =>
      findOne('articles', byPreviousSlugWhere(slug, lookup), mapArticle, wantsDraft(lookup)),

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
    findArticlePlacementById: (id, lookup) =>
      findOne('article-placements', byIdWhere(id, lookup), mapPlacement, wantsDraft(lookup)),

    // ── media ─────────────────────────────────────────────────────────────
    async listMedia(query: MediaSourceQuery): Promise<MediaAsset[]> {
      // `media` は `_status` / `lifecycleStatus` を持たない（uploadの実体そのもの）。
      const where = andWhere([idsWhere(query.ids)]);
      return mapAll(await listDocs('media', where, query.sort, query.limit, query.page), mapMedia);
    },
    findMediaById: (id) => findOne('media', { stableId: { equals: id } }, mapMedia),

    // ── SiteSettings global ───────────────────────────────────────────────
    async readArticleIndexPlacementLimits(): Promise<Record<ArticlePlacementSlot, number>> {
      return requirePlacementLimits(await readSiteSettingsDocument());
    },
    async readSiteSettings(): Promise<ContentSnapshot['siteSettings']> {
      return requireSiteSettings(await readSiteSettingsDocument());
    },

    // ── 管理処理専用 ───────────────────────────────────────────────────────
    /**
     * import / export / parity / 横断validation用の全件読み出し。**ページからは到達できない**
     * （`ContentRepository` はこのメソッドを型として持たない）。`limit: 500` の全件取得を
     * 許すのはこの経路だけ。全 `publishStatus`（draft含む）を対象にする。
     */
    async readSnapshot(snapshotOptions: SnapshotReadOptions = {}): Promise<ContentSnapshot> {
      const payload = await client();

      return withSnapshotTransaction(payload, async (req, txPayload) => {
        const statusWhere = publishStatusWhere(ALL_PUBLISH_STATUSES);

        /**
         * 1 collectionを全件読み、件数と stable ID の一意性を検査する（必須修正5-2）。
         * `Promise.all` ではなく直列（同一transaction = 同一connection）。
         */
        const snapshotDocs = async (collection: ContentCollectionSlug, where: Where): Promise<unknown[]> => {
          const { docs, totalDocs } = await findPagedDocs(
            txPayload,
            { collection, where, sort: ['stableId'], req },
            SNAPSHOT_PAGE_SIZE,
          );
          assertSnapshotPageIntegrity(collection, docs as readonly { stableId?: unknown }[], totalDocs);
          await snapshotOptions.onCollectionRead?.(collection, req);
          return docs;
        };

        const robotDocs = await snapshotDocs('robots', statusWhere);
        const robotSeriesDocs = await snapshotDocs('robot-series', statusWhere);
        const distributorDocs = await snapshotDocs('distributors', statusWhere);
        const manufacturerDocs = await snapshotDocs('manufacturers', statusWhere);
        const useCaseDocs = await snapshotDocs('use-cases', statusWhere);
        const deploymentDocs = await snapshotDocs('deployments', statusWhere);
        const articleDocs = await snapshotDocs('articles', statusWhere);
        const placementDocs = await snapshotDocs('article-placements', statusWhere);
        // `media` は `_status` / `lifecycleStatus` を持たない（uploadの実体そのもの）。
        const mediaDocs = await snapshotDocs('media', {});

        const settingsDocument = await readSiteSettingsDocument(txPayload);
        await snapshotOptions.onCollectionRead?.('site-settings', req);

        return {
          robots: await mapAll<Robot>(robotDocs, mapRobot, txPayload),
          robotSeries: await mapAll<RobotSeries>(robotSeriesDocs, mapRobotSeries, txPayload),
          distributors: await mapAll<Distributor>(distributorDocs, mapDistributor, txPayload),
          manufacturers: await mapAll<Manufacturer>(manufacturerDocs, mapManufacturer, txPayload),
          useCases: await mapAll<UseCase>(useCaseDocs, mapUseCase, txPayload),
          deployments: await mapAll<DeploymentSite>(deploymentDocs, mapDeployment, txPayload),
          articles: await mapAll<Article>(articleDocs, mapArticle, txPayload),
          articlePlacements: await mapAll<ArticlePlacement>(placementDocs, mapPlacement, txPayload),
          articleIndexPlacementLimits: requirePlacementLimits(settingsDocument),
          media: await mapAll<MediaAsset>(mediaDocs, mapMedia, txPayload),
          siteSettings: requireSiteSettings(settingsDocument),
        };
      });
    },
  };

  return source;
}
