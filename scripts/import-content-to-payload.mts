/**
 * 冪等な content importer（`docs/plans/content-platform-migration-plan-v1.md` Task 5 Step 3）。
 *
 * `ContentSnapshot`（Task 4 の `lib/content/contracts.ts`）を Payload **Local API 経由**で書き込む。
 * Global Constraints の「本番コンテンツを SQL で直接更新しない」に従い、生 SQL は一切発行しない。
 *
 * ## 冪等性
 *
 * collection ごとに `stableId` で1件 `find` し、存在すれば `update`、無ければ `create` する。
 * よって同じ snapshot を何度流しても重複行は増えず、stable ID 集合は変わらない（Step 6）。
 *
 * ## publish status
 *
 * domain の `publishStatus` は書き込み mapper（`lib/content/payloadMappers.ts` の
 * `mapDomain*ToPayload` → `domainStatusToPayload`）が Payload の `_status` + `lifecycleStatus`
 * へ変換する。Payload schema に custom `publishStatus` field は作らない。draft record は
 * `_status: 'draft'`（data 側）と `draft: true`（Local API 引数）を両方指定する（brief Step 3）。
 * 読み取り側（`payloadSource.ts` / `payloadStatusToDomain`）はこの逆写像。
 *
 * ## import 順（brief Step 3）
 *
 *   media → manufacturers → distributors → robot-series → robots → use-cases →
 *   deployments → articles → article-placements → site-settings
 *
 * **この順は3つの前方参照を含む**（brief の列挙をそのまま守った上で、importer 側で解決する）:
 *
 * | 参照 | なぜ前方参照になるか | 対処 |
 * |---|---|---|
 * | `distributors.handledRobotIds → robots` | brief の順で `distributors` が `robots` より先 | 2周目で埋める |
 * | `use-cases.candidateRobots[].evidenceDeploymentIds → deployments` | `deployments.relatedUseCaseIds` と相互参照のため、どちらを先にしても片方が前方参照 | 2周目で埋める |
 * | `robots.supersededById → robots` | 自己参照 | 2周目で埋める |
 *
 * 1周目は該当 field を書かずに作成し、全 collection の作成後に「2周目」で該当レコードだけを
 * update する。前方参照を握り潰さないため、2周目の解決に失敗した参照は例外にする
 * （`payloadMappers.ts` の `assertResolved`）。
 *
 * ## media
 *
 * local `data/*.ts` は `media` collection に相当する配列を持たない。各レコードに埋め込まれた
 * `ImageAsset`（`heroImage` / `images` / `logos`）を **正規化した `src` と rights metadata で
 * 重複排除**して media candidate を作る（brief Step 3）。ローカル画像（`/...`）は実ファイルを
 * upload し、外部画像（`http(s)://`）は rights が確認済みのものだけ取得する。取得不能または
 * 権利未確定の画像は **Media レコードを作らず**、import report の要確認項目
 * （`skippedMedia`）として残す。埋め込み `ImageAsset.src` は書き換えないので、
 * 公開URL・表示は変わらない（Global Constraints）。
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Payload } from 'payload';
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import type { ImageAsset, MediaAsset, PublishStatus, RightsMeta } from '../lib/content/domainTypes.ts';
import {
  createRelationshipIdCache,
  mapDomainArticlePlacementToPayload,
  mapDomainArticleToPayload,
  mapDomainDeploymentToPayload,
  mapDomainDistributorToPayload,
  mapDomainManufacturerToPayload,
  mapDomainMediaToPayload,
  mapDomainRobotSeriesToPayload,
  mapDomainRobotToPayload,
  mapDomainUseCaseToPayload,
  rememberRelationshipId,
  type RelationshipIdCache,
} from '../lib/content/payloadMappers.ts';
import { privilegedPublishContext } from '../lib/payload/publishAuthorization.ts';
import { exitCli, isDirectRun, parseArgs } from './contentCliSupport.mts';

// ─── media 派生（純粋関数。ネットワーク・DBに触れない） ──────────────────────

/**
 * 外部画像を自動で取得・ホストしてよい rights status。ここに無い status
 * （`reference-attributed` / `permission-requested` / `prototype-only` / `blocked` など）の
 * 外部画像は自動取得しない（`ai/rules/40-content-rights.md` の方針。brief Step 3 の
 * 「外部画像は権利確認済みのものだけ取得・保存する」）。
 */
export const AUTO_HOSTABLE_EXTERNAL_RIGHTS: ReadonlySet<RightsMeta['status']> = new Set([
  'own',
  'licensed',
  'commercial-permitted',
]);

export interface MediaCandidate {
  asset: MediaAsset;
  /** 正規化前の元 `src`。ローカル解決・fetch に使う。 */
  src: string;
  /** Media レコードを作ってよいか（rights と参照形式だけで決まる。ネットワークは見ない）。 */
  hostable: boolean;
  /** `hostable === false` の理由。import report の要確認項目に出す。 */
  reason?: string;
  /** この画像を参照している record（`robots/fixture-robot-a.heroImage` 形式）。 */
  usedBy: string[];
}

/** 末尾スラッシュ・クエリ・フラグメントを落として `src` を正規化する。 */
export function normalizeImageSrc(src: string): string {
  const trimmed = src.trim();
  const withoutHash = trimmed.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery.replace(/\/+$/, '');
}

function canonicalRights(rights: RightsMeta | undefined): string {
  if (!rights) return 'none';
  return JSON.stringify({
    status: rights.status,
    sourceType: rights.sourceType,
    checkedAt: rights.checkedAt,
    rightsHolder: rights.rightsHolder ?? null,
    licenseUrl: rights.licenseUrl ?? null,
    permissionNote: rights.permissionNote ?? null,
  });
}

/**
 * `stableId` は正規化した `src` から決定的に生成する（`collections/Media.ts` の契約）。
 * **同じ `src` に異なる rights metadata が付いている場合だけ** rights hash の先頭8桁を
 * 付けて別レコードにする（brief Step 3 の「`src` + rights metadata で正規化・重複排除」）。
 * 通常（rights が1種類）は `media:<正規化src>` のまま読める id になる。
 */
export function mediaStableId(normalizedSrc: string, rightsDiscriminator?: string): string {
  return rightsDiscriminator ? `media:${normalizedSrc}#${rightsDiscriminator}` : `media:${normalizedSrc}`;
}

/**
 * upload の保存名は **src のパス全体**から作る。`media` collection の保存先（local disk も
 * Vercel Blob も）は1つのフラットな名前空間なので、basename だけを使うと
 * `/images/articles/<記事>/hero.jpg` が9記事ぶん全部 `hero.jpg` になり、Payload が
 * `hero-1.jpg` … `hero-8.jpg` へ勝手に採番して parity 差分になる（実測18件）。
 * パス全体を使えば衝突しないので、Payload の自動リネームが起こらず、export した
 * `filename` がそのまま restore でも再現する。
 * rights 違いで同じ src が複数レコードになる場合は discriminator も名前へ入れる。
 */
export function fileNameFromSrc(normalizedSrc: string, rightsDiscriminator?: string): string {
  const withoutProtocol = decodeURIComponent(normalizedSrc.replace(/^https?:\/\//, ''));
  const extension = path.extname(withoutProtocol).toLowerCase();
  const stem = withoutProtocol
    .slice(0, withoutProtocol.length - extension.length)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const base = stem.length > 0 ? stem : 'media';
  return `${base}${rightsDiscriminator ? `-${rightsDiscriminator}` : ''}${extension}`;
}

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export function mimeTypeForFile(fileName: string): string {
  return MIME_TYPES[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream';
}

/** snapshot 内の全 `ImageAsset` を、参照元つきで列挙する。 */
function collectImageAssets(snapshot: ContentSnapshot): Array<{ image: ImageAsset; usedBy: string }> {
  const found: Array<{ image: ImageAsset; usedBy: string }> = [];

  const push = (image: unknown, usedBy: string) => {
    const asset = image as ImageAsset | undefined;
    if (asset && typeof asset === 'object' && typeof asset.src === 'string' && asset.src.length > 0) {
      found.push({ image: asset, usedBy });
    }
  };

  const pushRecordImages = (
    collection: string,
    records: readonly { id: string; heroImage?: ImageAsset }[],
    extra?: (record: never) => Array<{ image: unknown; key: string }>,
  ) => {
    for (const record of records) {
      push(record.heroImage, `${collection}/${record.id}.heroImage`);
      for (const entry of extra?.(record as never) ?? []) {
        push(entry.image, `${collection}/${record.id}.${entry.key}`);
      }
    }
  };

  const imageRecordEntries = (images: Partial<Record<string, ImageAsset>> | undefined, prefix: string) =>
    Object.entries(images ?? {}).map(([role, image]) => ({ image, key: `${prefix}.${role}` }));

  pushRecordImages('manufacturers', snapshot.manufacturers, (record: (typeof snapshot.manufacturers)[number]) =>
    imageRecordEntries(record.logos as Partial<Record<string, ImageAsset>> | undefined, 'logos'),
  );
  pushRecordImages('robotSeries', snapshot.robotSeries, (record: (typeof snapshot.robotSeries)[number]) =>
    imageRecordEntries(record.images, 'images'),
  );
  pushRecordImages('robots', snapshot.robots, (record: (typeof snapshot.robots)[number]) =>
    imageRecordEntries(record.images, 'images'),
  );
  pushRecordImages('distributors', snapshot.distributors);
  pushRecordImages('useCases', snapshot.useCases);
  pushRecordImages('deployments', snapshot.deployments);
  pushRecordImages('articles', snapshot.articles);

  return found;
}

/**
 * レコード内の画像から media candidate を決定的に導出する。**副作用なし**。
 * `content:import` と `content:compare` の両方が同じ関数を使うことで、
 * 「Payload に出来るはずの media」と「実際に出来た media」を同じ規則で突き合わせられる。
 */
export function deriveMediaFromSnapshot(snapshot: ContentSnapshot): MediaCandidate[] {
  const bySrc = new Map<string, Map<string, { image: ImageAsset; usedBy: string[] }>>();

  for (const { image, usedBy } of collectImageAssets(snapshot)) {
    const normalized = normalizeImageSrc(image.src);
    const rightsKey = canonicalRights(image.rights);
    const perSrc = bySrc.get(normalized) ?? new Map();
    const existing = perSrc.get(rightsKey);
    if (existing) {
      existing.usedBy.push(usedBy);
    } else {
      perSrc.set(rightsKey, { image, usedBy: [usedBy] });
    }
    bySrc.set(normalized, perSrc);
  }

  const candidates: MediaCandidate[] = [];
  for (const [normalizedSrc, perRights] of [...bySrc.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const rightsVariants = [...perRights.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const hasRightsConflict = rightsVariants.length > 1;

    for (const [rightsKey, { image, usedBy }] of rightsVariants) {
      const discriminator = hasRightsConflict
        ? createHash('sha256').update(rightsKey).digest('hex').slice(0, 8)
        : undefined;
      const isExternal = /^https?:\/\//i.test(normalizedSrc);
      const rights = image.rights;
      const hostable = isExternal ? Boolean(rights && AUTO_HOSTABLE_EXTERNAL_RIGHTS.has(rights.status)) : true;

      const filename = fileNameFromSrc(normalizedSrc, discriminator);
      candidates.push({
        asset: {
          id: mediaStableId(normalizedSrc, discriminator),
          filename,
          url: normalizedSrc,
          alt: image.alt,
          mimeType: mimeTypeForFile(filename),
          rights: rights ?? { status: 'blocked', sourceType: 'unknown', checkedAt: '' },
        },
        src: normalizedSrc,
        hostable,
        reason: hostable
          ? undefined
          : `external-image-rights-not-auto-hostable (rights.status=${rights?.status ?? 'missing'})`,
        usedBy: [...usedBy].sort(),
      });
    }
  }

  return candidates;
}

// ─── media ファイル解決 ────────────────────────────────────────────────────

export interface ResolvedMediaFile {
  data: Buffer;
  mimetype: string;
  name: string;
}

export type MediaFileResolution = { file: ResolvedMediaFile } | { skipped: string };

export type MediaFileResolver = (candidate: MediaCandidate) => Promise<MediaFileResolution>;

export interface DefaultMediaResolverOptions {
  /** `/images/...` を解決する静的ディレクトリ。既定は `<repo>/public`。 */
  publicDir?: string;
  /** Payload の local disk upload ディレクトリ。既定は `<repo>/media`。restore で使う。 */
  uploadDir?: string;
  /** 外部画像の実 fetch を許すか。既定 false（テスト・オフライン実行を壊さないため）。 */
  allowNetwork?: boolean;
}

/**
 * 既定の解決順:
 * 1. `/api/media/file/<name>` — export 元 Payload の local disk upload（restore 経路）
 * 2. `/...` — repo の `public/` 配下の実ファイル
 * 3. `http(s)://` — rights が自動ホスト可、かつ `allowNetwork` のときだけ fetch
 */
export function createDefaultMediaFileResolver(options: DefaultMediaResolverOptions = {}): MediaFileResolver {
  const publicDir = options.publicDir ?? path.resolve(process.cwd(), 'public');
  const uploadDir = options.uploadDir ?? path.resolve(process.cwd(), 'media');

  return async (candidate) => {
    const source = candidate.src;
    // restore 経路（`snapshot.media` 由来）では export 済みの `filename` をそのまま使う。
    // ここで `src` から derive し直すと、`/api/media/file/<name>` という Payload の URL から
    // 別名を作ってしまい、round-trip で filename が変わる。
    const name = candidate.asset.filename || fileNameFromSrc(normalizeImageSrc(source));
    const mimetype = candidate.asset.mimeType ?? mimeTypeForFile(name);

    const readLocal = async (filePath: string): Promise<MediaFileResolution | undefined> => {
      try {
        return { file: { data: await readFile(filePath), mimetype, name } };
      } catch {
        return undefined;
      }
    };

    if (source.startsWith('/api/media/file/')) {
      const resolved = await readLocal(path.join(uploadDir, decodeURIComponent(source.slice('/api/media/file/'.length))));
      return resolved ?? { skipped: `upload-file-not-found: ${source}` };
    }

    if (source.startsWith('/')) {
      const resolved = (await readLocal(path.join(publicDir, source))) ?? (await readLocal(path.join(uploadDir, name)));
      return resolved ?? { skipped: `local-file-not-found: ${source}` };
    }

    if (!candidate.hostable) return { skipped: candidate.reason ?? 'not-hostable' };
    if (!options.allowNetwork) return { skipped: `network-fetch-disabled: ${source}` };

    try {
      const response = await fetch(source);
      if (!response.ok) return { skipped: `fetch-failed-${response.status}: ${source}` };
      const buffer = Buffer.from(await response.arrayBuffer());
      return { file: { data: buffer, mimetype: response.headers.get('content-type') ?? mimetype, name } };
    } catch (error) {
      return { skipped: `fetch-error: ${source} (${(error as Error).message})` };
    }
  };
}

// ─── importer ────────────────────────────────────────────────────────────

export type ImportCollectionSlug =
  | 'media'
  | 'manufacturers'
  | 'distributors'
  | 'robot-series'
  | 'robots'
  | 'use-cases'
  | 'deployments'
  | 'articles'
  | 'article-placements';

/** brief Step 3 の import 順。依存先を先に import する（前方参照3件は2周目で解決する）。 */
export const IMPORT_ORDER: readonly ImportCollectionSlug[] = [
  'media',
  'manufacturers',
  'distributors',
  'robot-series',
  'robots',
  'use-cases',
  'deployments',
  'articles',
  'article-placements',
];

export interface ImportSkippedMedia {
  stableId: string;
  src: string;
  reason: string;
  usedBy: string[];
}

export interface ImportReport {
  created: Record<string, number>;
  updated: Record<string, number>;
  /** 2周目で前方参照を埋めたレコード数。 */
  deferredReferenceUpdates: Record<string, number>;
  /** Media レコードを作らなかった画像。parity report の要確認項目（brief Step 3）。 */
  skippedMedia: ImportSkippedMedia[];
  /** 同じ `src` に複数の rights metadata が付いていたもの。人間の確認が要る。 */
  mediaRightsConflicts: Array<{ src: string; stableIds: string[] }>;
  siteSettingsUpdated: boolean;
  dryRun: boolean;
}

export interface ImportOptions {
  payload: Payload;
  snapshot: ContentSnapshot;
  /**
   * 書き込みを行う admin。`createPublishGateHook`（Task 3）は `overrideAccess` に関係なく
   * `req.user` の role を見るため、published/archived を書くには content-publisher 以上が要る。
   */
  user: unknown;
  /**
   * 必須修正1-6（remediation group 1）: import / restore は通常のpublish経路とは分離した
   * **特権経路**として扱い、run ID・actor・理由・対象collectionを監査ログへ残す。
   * 省略時はタイムスタンプ由来のrun IDを自動採番する。
   */
  runId?: string;
  reason?: string;
  mediaResolver?: MediaFileResolver;
  /** 書き込まずに create/update の内訳だけ数える。 */
  dryRun?: boolean;
  log?: (line: string) => void;
}

function emptyCounters(): Record<string, number> {
  return Object.fromEntries(IMPORT_ORDER.map((slug) => [slug, 0]));
}

interface UpsertResult {
  id: string | number;
  action: 'created' | 'updated';
}

/**
 * 冪等 upsert の唯一の入口。`content:import`（local TS → Payload）と
 * `content:restore`（snapshot → 空DB）は同じこの関数を通る（brief Step 5）。
 */
async function upsertByStableId(
  payload: Payload,
  collection: ImportCollectionSlug,
  stableId: string,
  data: Record<string, unknown>,
  args: { user: unknown; draft: boolean; file?: ResolvedMediaFile; publishContext: Record<string, unknown> },
): Promise<UpsertResult> {
  const existing = (await payload.find({
    collection: collection as never,
    where: { stableId: { equals: stableId } },
    limit: 1,
    page: 1,
    depth: 0,
    overrideAccess: true,
  })) as unknown as { docs: Array<{ id: string | number; filename?: string | null }> };

  // Payload の `create`/`update` は `draft: true` のとき data を `DraftDataFromCollectionSlug`
  // （全field任意）に狭める判別union overloadを持つため、`draft` が `boolean`（実行時に決まる）
  // だと型が合わない。引数objectを組み立ててから1回だけcastする。
  const current = existing.docs[0];
  if (current) {
    // 既存 media はファイル実体を再 upload しない（同じ bytes を毎回書き直さない）。
    const updateArgs = {
      collection,
      id: current.id,
      data,
      draft: args.draft,
      user: args.user,
      overrideAccess: true,
      context: args.publishContext,
    } as unknown as Parameters<Payload['update']>[0];
    const doc = (await payload.update(updateArgs)) as unknown as { id: string | number };
    return { id: doc.id, action: 'updated' };
  }

  const createArgs = {
    collection,
    data,
    draft: args.draft,
    user: args.user,
    overrideAccess: true,
    context: args.publishContext,
    ...(args.file ? { file: args.file } : {}),
  } as unknown as Parameters<Payload['create']>[0];
  const doc = (await payload.create(createArgs)) as unknown as { id: string | number };
  return { id: doc.id, action: 'created' };
}

async function stableIdExists(payload: Payload, collection: ImportCollectionSlug, stableId: string): Promise<boolean> {
  const result = (await payload.find({
    collection: collection as never,
    where: { stableId: { equals: stableId } },
    limit: 1,
    page: 1,
    depth: 0,
    overrideAccess: true,
  })) as unknown as { docs: unknown[] };
  return result.docs.length > 0;
}

export async function importContentSnapshot(options: ImportOptions): Promise<ImportReport> {
  const { payload, snapshot, user } = options;
  const log = options.log ?? (() => {});
  const dryRun = options.dryRun ?? false;
  // 必須修正1-6: import / restore の特権publish経路。`publishApprovedVersion()` の承認経路とは
  // 別物として publish gate に識別させ、監査ログ（`msg: 'privileged-publish'`）へ残す。
  const runId = options.runId ?? `content-import-${new Date().toISOString()}`;
  const publishContext = privilegedPublishContext({
    runId,
    actorId: String((user as { id?: string | number } | null)?.id ?? 'unknown'),
    reason: options.reason ?? 'content:import / content:restore idempotent upsert',
  });
  const mediaResolver = options.mediaResolver ?? createDefaultMediaFileResolver();
  const cache: RelationshipIdCache = createRelationshipIdCache();

  const report: ImportReport = {
    created: emptyCounters(),
    updated: emptyCounters(),
    deferredReferenceUpdates: emptyCounters(),
    skippedMedia: [],
    mediaRightsConflicts: [],
    siteSettingsUpdated: false,
    dryRun,
  };

  const record = (collection: ImportCollectionSlug, result: UpsertResult, stableId: string) => {
    report[result.action][collection] += 1;
    rememberRelationshipId(cache, collection, stableId, result.id);
  };

  const write = async (
    collection: ImportCollectionSlug,
    stableId: string,
    data: Record<string, unknown>,
    publishStatus: PublishStatus,
    file?: ResolvedMediaFile,
  ) => {
    if (dryRun) {
      const exists = await stableIdExists(payload, collection, stableId);
      report[exists ? 'updated' : 'created'][collection] += 1;
      return;
    }
    // brief Step 3: draft record は `_status: 'draft'`（data 側、mapper が付ける）と
    // `draft: true`（Local API 引数）を両方指定する。
    const result = await upsertByStableId(payload, collection, stableId, data, {
      user,
      draft: publishStatus === 'draft',
      file,
      publishContext,
    });
    record(collection, result, stableId);
  };

  // ── 1. media ────────────────────────────────────────────────────────────
  // snapshot が `media` を持つ場合（export した snapshot からの restore）はそれを、
  // 持たない場合（local TS）はレコード内の `ImageAsset` から導出した candidate を使う。
  const derived = deriveMediaFromSnapshot(snapshot);
  const bySrcCount = new Map<string, string[]>();
  for (const candidate of derived) {
    bySrcCount.set(candidate.src, [...(bySrcCount.get(candidate.src) ?? []), candidate.asset.id]);
  }
  for (const [src, stableIds] of bySrcCount) {
    if (stableIds.length > 1) report.mediaRightsConflicts.push({ src, stableIds: stableIds.sort() });
  }

  const mediaCandidates: MediaCandidate[] =
    snapshot.media.length > 0
      ? snapshot.media.map((asset) => ({
          asset,
          src: asset.url,
          hostable: true,
          usedBy: [],
        }))
      : derived;

  log(`media: ${mediaCandidates.length} candidate(s)`);
  for (const candidate of mediaCandidates) {
    if (!candidate.hostable) {
      report.skippedMedia.push({
        stableId: candidate.asset.id,
        src: candidate.src,
        reason: candidate.reason ?? 'not-hostable',
        usedBy: candidate.usedBy,
      });
      continue;
    }

    const alreadyPresent = await stableIdExists(payload, 'media', candidate.asset.id);
    if (alreadyPresent) {
      // 既存 media は metadata（alt / rights）だけ更新し、ファイル実体は再 upload しない。
      await write('media', candidate.asset.id, mapDomainMediaToPayload(candidate.asset), 'published');
      continue;
    }

    const resolution = await mediaResolver(candidate);
    if ('skipped' in resolution) {
      report.skippedMedia.push({
        stableId: candidate.asset.id,
        src: candidate.src,
        reason: resolution.skipped,
        usedBy: candidate.usedBy,
      });
      continue;
    }
    await write('media', candidate.asset.id, mapDomainMediaToPayload(candidate.asset), 'published', resolution.file);
  }

  // ── 2. manufacturers ────────────────────────────────────────────────────
  log(`manufacturers: ${snapshot.manufacturers.length}`);
  for (const manufacturer of snapshot.manufacturers) {
    await write('manufacturers', manufacturer.id, mapDomainManufacturerToPayload(manufacturer), manufacturer.publishStatus);
  }

  // ── 3. distributors（`handledRobotIds` は前方参照なので2周目） ─────────────
  log(`distributors: ${snapshot.distributors.length}`);
  for (const distributor of snapshot.distributors) {
    const data = await mapDomainDistributorToPayload(distributor, payload, cache, { deferForwardReferences: true });
    await write('distributors', distributor.id, data, distributor.publishStatus);
  }

  // ── 4. robot-series ─────────────────────────────────────────────────────
  log(`robot-series: ${snapshot.robotSeries.length}`);
  for (const series of snapshot.robotSeries) {
    const data = await mapDomainRobotSeriesToPayload(series, payload, cache);
    await write('robot-series', series.id, data, series.publishStatus);
  }

  // ── 5. robots（`supersededById` は自己参照なので2周目） ────────────────────
  log(`robots: ${snapshot.robots.length}`);
  for (const robot of snapshot.robots) {
    const data = await mapDomainRobotToPayload(robot, payload, cache, { deferSelfReferences: true });
    await write('robots', robot.id, data as unknown as Record<string, unknown>, robot.publishStatus);
  }

  // ── 6. use-cases（`evidenceDeploymentIds` は前方参照なので2周目） ──────────
  log(`use-cases: ${snapshot.useCases.length}`);
  for (const useCase of snapshot.useCases) {
    const data = await mapDomainUseCaseToPayload(useCase, payload, cache, { deferForwardReferences: true });
    await write('use-cases', useCase.id, data, useCase.publishStatus);
  }

  // ── 7. deployments ──────────────────────────────────────────────────────
  log(`deployments: ${snapshot.deployments.length}`);
  for (const deployment of snapshot.deployments) {
    const data = await mapDomainDeploymentToPayload(deployment, payload, cache);
    await write('deployments', deployment.id, data, deployment.publishStatus);
  }

  // ── 8. articles ─────────────────────────────────────────────────────────
  log(`articles: ${snapshot.articles.length}`);
  for (const article of snapshot.articles) {
    const data = await mapDomainArticleToPayload(article, payload, cache);
    await write('articles', article.id, data, article.publishStatus);
  }

  // ── 9. article-placements ───────────────────────────────────────────────
  log(`article-placements: ${snapshot.articlePlacements.length}`);
  for (const placement of snapshot.articlePlacements) {
    const data = await mapDomainArticlePlacementToPayload(placement, payload, cache);
    await write('article-placements', placement.id, data, placement.publishStatus);
  }

  // ── 10. 2周目: 前方参照 / 自己参照を埋める ────────────────────────────────
  if (!dryRun) {
    const deferredDistributors = snapshot.distributors.filter((entry) => (entry.handledRobotIds?.length ?? 0) > 0);
    const deferredRobots = snapshot.robots.filter((entry) => Boolean(entry.supersededById));
    const deferredUseCases = snapshot.useCases.filter((entry) =>
      entry.candidateRobots.some((candidate) => (candidate.evidenceDeploymentIds?.length ?? 0) > 0),
    );

    if (deferredDistributors.length + deferredRobots.length + deferredUseCases.length > 0) {
      log(
        `deferred references: distributors=${deferredDistributors.length} robots=${deferredRobots.length} ` +
          `use-cases=${deferredUseCases.length}`,
      );
    }

    for (const distributor of deferredDistributors) {
      const data = await mapDomainDistributorToPayload(distributor, payload, cache);
      await upsertByStableId(payload, 'distributors', distributor.id, data, {
        user,
        draft: distributor.publishStatus === 'draft',
        publishContext,
      });
      report.deferredReferenceUpdates.distributors += 1;
    }
    for (const robot of snapshot.robots.filter((entry) => Boolean(entry.supersededById))) {
      const data = await mapDomainRobotToPayload(robot, payload, cache);
      await upsertByStableId(payload, 'robots', robot.id, data as unknown as Record<string, unknown>, {
        user,
        draft: robot.publishStatus === 'draft',
        publishContext,
      });
      report.deferredReferenceUpdates.robots += 1;
    }
    for (const useCase of deferredUseCases) {
      const data = await mapDomainUseCaseToPayload(useCase, payload, cache);
      await upsertByStableId(payload, 'use-cases', useCase.id, data, {
        user,
        draft: useCase.publishStatus === 'draft',
        publishContext,
      });
      report.deferredReferenceUpdates['use-cases'] += 1;
    }
  }

  // ── 11. site-settings（Global。stableId upsert の対象にしない） ────────────
  //
  // brief Step 3: 「`site-settings` は Global なので `updateGlobal` を使い、stableId upsert の
  // 対象にしない」。
  //
  // 必須修正4-3（remediation group 2）: 以前はここが `data: {}`（= 行を作るだけ）で、
  // snapshot の `siteSettings.dataAsOf` と `articleIndexPlacementLimits` を**一切書いていなかった**。
  // 読み戻し側（`payloadSource.ts`）がローカル定数へfallbackしていたため parity は通ってしまい、
  // 「SiteSettingsが移行されていない」ことが誰にも見えなかった。実際に値を書く。
  if (!dryRun) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        dataAsOf: snapshot.siteSettings.dataAsOf,
        articleIndexPlacementLimits: {
          hero: snapshot.articleIndexPlacementLimits.hero,
          feature: snapshot.articleIndexPlacementLimits.feature,
        },
      } as never,
      user: user as never,
      overrideAccess: true,
      context: publishContext,
    });
  }
  report.siteSettingsUpdated = true;

  return report;
}

export function formatImportReport(report: ImportReport): string {
  const lines: string[] = [];
  lines.push(report.dryRun ? 'content:import (dry run)' : 'content:import');
  for (const collection of IMPORT_ORDER) {
    lines.push(
      `  ${collection.padEnd(20)} created=${report.created[collection]} updated=${report.updated[collection]}` +
        (report.deferredReferenceUpdates[collection]
          ? ` deferredRefUpdates=${report.deferredReferenceUpdates[collection]}`
          : ''),
    );
  }
  lines.push(`  ${'site-settings'.padEnd(20)} updated=${report.siteSettingsUpdated ? 1 : 0}`);

  if (report.mediaRightsConflicts.length > 0) {
    lines.push('', `NEEDS REVIEW — same src with conflicting rights metadata: ${report.mediaRightsConflicts.length}`);
    for (const conflict of report.mediaRightsConflicts) lines.push(`  ${conflict.src} -> ${conflict.stableIds.join(', ')}`);
  }
  if (report.skippedMedia.length > 0) {
    lines.push('', `NEEDS REVIEW — images not imported into the media collection: ${report.skippedMedia.length}`);
    for (const skipped of report.skippedMedia.slice(0, 40)) {
      lines.push(`  ${skipped.src}: ${skipped.reason}${skipped.usedBy.length ? ` (used by ${skipped.usedBy[0]}${skipped.usedBy.length > 1 ? ` +${skipped.usedBy.length - 1}` : ''})` : ''}`);
    }
    if (report.skippedMedia.length > 40) lines.push(`  ... ${report.skippedMedia.length - 40} more`);
  }
  return lines.join('\n');
}

// ─── DB / 認証まわりの共通ヘルパ（restore 側も使う） ─────────────────────────

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * importer は破壊的（既存レコードを update する）。既定では local throwaway Postgres 以外を
 * 拒否し、本番（Supabase）へ流すときだけ `--i-know-this-is-production` を明示的に要求する。
 * Task 9 の cutover はこの flag を意図的に付けて実行する。
 */
export function assertWritableDatabase(args: Map<string, string | true>, callerFile: string): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error(`DATABASE_URL is not set. ${callerFile} needs an explicit target database.`);
  let host: string;
  try {
    host = new URL(raw).hostname;
  } catch {
    throw new Error('DATABASE_URL is not a valid connection URL.');
  }
  if (LOCAL_DATABASE_HOSTS.has(host)) return;
  if (args.has('i-know-this-is-production')) {
    process.stderr.write(`WARNING: writing to non-local database host "${host}" (explicitly confirmed).\n`);
    return;
  }
  throw new Error(
    `Refusing to write to DATABASE_URL host "${host}". ${callerFile} performs destructive upserts. ` +
      'Pass --i-know-this-is-production to target a managed database (Task 9 cutover only).',
  );
}

/**
 * 書き込み用の admin を用意する。publish gate（Task 3）が content-publisher 以上を要求するため、
 * anonymous では published レコードを書けない。
 */
export async function resolveImportUser(
  payload: Payload,
  args: Map<string, string | true>,
): Promise<unknown> {
  const email = (args.get('admin-email') as string | undefined) ?? process.env.PAYLOAD_IMPORT_ADMIN_EMAIL;
  const password = (args.get('admin-password') as string | undefined) ?? process.env.PAYLOAD_IMPORT_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set PAYLOAD_IMPORT_ADMIN_EMAIL and PAYLOAD_IMPORT_ADMIN_PASSWORD (or --admin-email / --admin-password). ' +
        'The importer writes published records and Payload requires a content-publisher (or platform-admin) user.',
    );
  }

  const existing = await payload.find({
    collection: 'admins',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  if (existing.docs.length === 0) {
    const host = new URL(process.env.DATABASE_URL as string).hostname;
    if (!args.has('bootstrap-admin')) {
      throw new Error(`No admin with email "${email}" exists. Pass --bootstrap-admin to create one (local databases only).`);
    }
    if (!LOCAL_DATABASE_HOSTS.has(host)) {
      throw new Error('--bootstrap-admin is only allowed against a local throwaway database.');
    }
    // 1人目の admin は Task 2 の bootstrap で platform-admin へ強制される。
    await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email, password, role: 'content-reader' } as never,
    });
  }

  const { user } = await payload.login({ collection: 'admins', data: { email, password } });
  if (!user) throw new Error(`Failed to log in as "${email}".`);
  return user;
}

/**
 * `--media-dir` は **読み取り元**の upload ディレクトリ（restore 元 store の代わり）。
 * Payload が書き込む先は config 側で決まるため、round-trip では
 * 「source store から読んで、空の target store へ書く」形にできる
 * （実 store が2つある本番と同じ関係を local disk で再現する）。
 */
export function mediaResolverOptionsFromArgs(args: Map<string, string | true>): DefaultMediaResolverOptions {
  const uploadDir = args.get('media-dir');
  const publicDir = args.get('public-dir');
  return {
    allowNetwork: args.has('allow-network-media'),
    ...(typeof uploadDir === 'string' ? { uploadDir: path.resolve(uploadDir) } : {}),
    ...(typeof publicDir === 'string' ? { publicDir: path.resolve(publicDir) } : {}),
  };
}

// ─── CLI ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.has('help')) {
    process.stdout.write(
      [
        'content:import — local TS (`data/*.ts`) の content を Payload へ冪等 upsert する。',
        '',
        '  --dry-run                     書き込まず create/update の内訳だけ出す',
        '  --allow-network-media         rights 確認済みの外部画像を実際に fetch する',
        '  --media-dir <dir>             media のバイト列の読み取り元（restore 元 store 相当）',
        '  --public-dir <dir>            ローカル画像（/images/...）の読み取り元',
        '  --json <path>                 import report を JSON で書き出す',
        '  --admin-email / --admin-password  書き込みに使う admin（env でも可）',
        '  --bootstrap-admin             admin が無い場合に作る（local DB のみ）',
        '  --i-know-this-is-production   local 以外の DATABASE_URL への書き込みを許可する',
        '',
        '空DBへ export 済み snapshot を書き戻すのは content:restore（同じ upsert を使う）。',
        '',
      ].join('\n'),
    );
    return;
  }

  assertWritableDatabase(args, 'scripts/import-content-to-payload.mts');

  const { getPayload } = await import('payload');
  const { default: config } = await import('../payload.config.ts');
  const { createLocalContentSource } = await import('../lib/content/localSource.ts');

  const payload = await getPayload({ config });
  try {
    const user = await resolveImportUser(payload, args);
    const snapshot = await createLocalContentSource().readSnapshot();

    const report = await importContentSnapshot({
      payload,
      snapshot,
      user,
      dryRun: args.has('dry-run'),
      mediaResolver: createDefaultMediaFileResolver(mediaResolverOptionsFromArgs(args)),
      log: (line) => process.stdout.write(`  ${line}\n`),
    });

    process.stdout.write(`\n${formatImportReport(report)}\n`);

    const jsonPath = args.get('json');
    if (typeof jsonPath === 'string') {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      process.stdout.write(`\nwrote JSON report: ${jsonPath}\n`);
    }
  } finally {
    await payload.destroy();
  }
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
