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
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Payload } from 'payload';
import {
  assertWritableDatabaseUrl,
  classifyDatabaseUrl,
  PERSISTENT_LOCAL_DATABASE_CONFIRMATION_FLAG,
  PREVIEW_CONFIRMATION_FLAG,
  PRODUCTION_CONFIRMATION_FLAG,
} from '../lib/content/databaseSafety.ts';
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
import { collectBrokenReferences } from './compare-content-sources.mts';
import { exitCli, isDirectRun, parseArgs } from './contentCliSupport.mts';
import { readEnvironmentMarker } from './restore-preflight.mts';
import { isRestoreAuthorization, type RestoreAuthorization } from './restoreAuthorization.mts';
import type { MediaInventoryEntry } from './snapshotObjectStore.mts';

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
 * 必須修正6-6（remediation group 2）: media resolver のパスは **realpath / resolve のあとで
 * 許可された root 配下にあること**を確認する。`..`・絶対パス・encoded traversal を拒否する。
 *
 * restore の入力は「外から来た JSON」なので、`media[].url` は攻撃者が選べる。
 * `path.join(uploadDir, decodeURIComponent(...))` は `%2e%2e%2f` を `../` へ復号したうえで
 * join するため、**`uploadDir` の外の任意ファイルを読み出して Media レコードとして
 * DB へ取り込ませる**ことができた（`/api/media/file/..%2f..%2f.env` の形）。
 *
 * `path.resolve` は `..` を畳んでから絶対パスにするので、畳んだ結果が root の下にあるかを
 * 見れば `..` も encoded traversal も同じ1つの判定で塞げる。symlink 経由の脱出も
 * `realpath` で解決してから同じ判定にかける（存在しないパスは realpath できないので、
 * その場合は解決前のパスで判定して「見つからない」として扱う）。
 */
export function resolveWithinRoot(root: string, relativePath: string): string | undefined {
  // 絶対パスは join の左辺を無視させる古典的な経路。明示的に拒否する。
  if (path.isAbsolute(relativePath)) return undefined;
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, relativePath);
  const withSeparator = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  if (candidate !== resolvedRoot && !candidate.startsWith(withSeparator)) return undefined;

  // symlink で root の外へ出ていないか。実在しない場合は realpath できないので、
  // 上の resolve 結果（root 配下であることは確認済み）をそのまま返す。
  try {
    const real = realpathSync(candidate);
    const realRoot = realpathSync(resolvedRoot);
    const realRootWithSeparator = realRoot.endsWith(path.sep) ? realRoot : `${realRoot}${path.sep}`;
    if (real !== realRoot && !real.startsWith(realRootWithSeparator)) return undefined;
    return real;
  } catch {
    return candidate;
  }
}

/**
 * 既定の解決順:
 * 1. `/api/media/file/<name>` — export 元 Payload の local disk upload（restore 経路）
 * 2. `/...` — repo の `public/` 配下の実ファイル
 * 3. `http(s)://` — rights が自動ホスト可、かつ `allowNetwork` のときだけ fetch
 *
 * 1 と 2 はどちらも `resolveWithinRoot()` を通す（必須修正6-6）。
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

    const readLocal = async (filePath: string | undefined): Promise<MediaFileResolution | undefined> => {
      if (filePath === undefined) return undefined;
      try {
        return { file: { data: await readFile(filePath), mimetype, name } };
      } catch {
        return undefined;
      }
    };

    if (source.startsWith('/api/media/file/')) {
      let requested: string;
      try {
        requested = decodeURIComponent(source.slice('/api/media/file/'.length));
      } catch {
        return { skipped: `media-path-undecodable: ${source}` };
      }
      const within = resolveWithinRoot(uploadDir, requested);
      if (within === undefined) return { skipped: `media-path-outside-root: ${source}` };
      const resolved = await readLocal(within);
      return resolved ?? { skipped: `upload-file-not-found: ${source}` };
    }

    if (source.startsWith('/')) {
      // 先頭の `/` は「site root からの相対」であって filesystem の絶対パスではない。
      // `resolveWithinRoot` は絶対パスを拒否するので、ここで相対形へ落としてから渡す。
      let requested: string;
      try {
        requested = decodeURIComponent(source).replace(/^\/+/, '');
      } catch {
        return { skipped: `media-path-undecodable: ${source}` };
      }
      const inPublic = resolveWithinRoot(publicDir, requested);
      const inUpload = resolveWithinRoot(uploadDir, name);
      if (inPublic === undefined && inUpload === undefined) {
        return { skipped: `media-path-outside-root: ${source}` };
      }
      const resolved = (await readLocal(inPublic)) ?? (await readLocal(inUpload));
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
   *
   * 必須修正8-3: **通常 import は `overrideAccess: false`** で走るので、この user の role が
   * そのまま書き込み可否になる（RBAC を迂回しない）。
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
  log?: (line: string) => void;
}

/**
 * 必須修正8-3: restore だけが使う特権経路の引数。`RestoreAuthorization` は
 * `scripts/restoreAuthorization.mts` でしか作れないため、`content:import` の経路からは
 * この関数を呼ぶ引数を用意できない。
 */
export interface RestoreOptions extends ImportOptions {
  authorization: RestoreAuthorization;
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
  args: {
    user: unknown;
    draft: boolean;
    file?: ResolvedMediaFile;
    publishContext: Record<string, unknown>;
    /** 必須修正8-3: 通常 import は `false`。restore（特権経路）だけが `true`。 */
    overrideAccess: boolean;
  },
): Promise<UpsertResult> {
  const existing = (await payload.find({
    collection: collection as never,
    where: { stableId: { equals: stableId } },
    limit: 1,
    page: 1,
    depth: 0,
    overrideAccess: args.overrideAccess,
    user: args.user as never,
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
      overrideAccess: args.overrideAccess,
      // `args.publishContext` を素通しせず shallow copy する理由: 呼び出し元
      // (`writeContentSnapshot()`)はこの object を1個だけ作って全 write() 呼び出しで
      // 使い回す。Payload の Local API はここへ渡した object をそのまま `req.context` に
      // 設定するため、同じ reference を渡すと呼び出しを跨いで汚染が残る。実際に
      // `@payloadcms/plugin-cloud-storage` の afterChange hook が upload 成功後
      // `req.context.skipCloudStorage = true` を立てて `finally` で delete するが、
      // その delete は「そのhookが見ている req.context」に対してだけ効き、外側で
      // 保持している同じ reference からは消えない(実機で確認済み)。結果、1件目の
      // media upload成功後、2件目以降は hook 先頭の `if (req.context?.skipCloudStorage)
      // return doc;` に毎回引っかかり、以降の upload が全て無音でskipされる
      // (DB row自体は作られるので import 自体はerror無しで成功して見える)。
      // 呼び出しごとに新しい object を渡せば、この汚染は次の呼び出しへ伝播しない。
      context: { ...args.publishContext },
    } as unknown as Parameters<Payload['update']>[0];
    const doc = (await payload.update(updateArgs)) as unknown as { id: string | number };
    return { id: doc.id, action: 'updated' };
  }

  const createArgs = {
    collection,
    data,
    draft: args.draft,
    user: args.user,
    overrideAccess: args.overrideAccess,
    // 上の update 分岐と同じ理由(shared context object 汚染対策)。
    context: { ...args.publishContext },
    ...(args.file ? { file: args.file } : {}),
  } as unknown as Parameters<Payload['create']>[0];
  const doc = (await payload.create(createArgs)) as unknown as { id: string | number };
  return { id: doc.id, action: 'created' };
}

async function stableIdExists(
  payload: Payload,
  collection: ImportCollectionSlug,
  stableId: string,
  args: { user: unknown; overrideAccess: boolean },
): Promise<boolean> {
  const result = (await payload.find({
    collection: collection as never,
    where: { stableId: { equals: stableId } },
    limit: 1,
    page: 1,
    depth: 0,
    overrideAccess: args.overrideAccess,
    user: args.user as never,
  })) as unknown as { docs: unknown[] };
  return result.docs.length > 0;
}

/**
 * 通常運用の import（`content:import`）。必須修正8-3 により **`overrideAccess: false`**、
 * つまり Payload の access control と publish gate をそのまま通る。role が足りなければ失敗する。
 */
export async function importContentSnapshot(options: ImportOptions): Promise<ImportReport> {
  return writeContentSnapshot({ ...options, overrideAccess: false });
}

/**
 * 災害復旧の restore（`content:restore`）だけが通る**特権経路**。access control を override する
 * ため、`scripts/restoreAuthorization.mts` でしか作れない `RestoreAuthorization` を要求する
 * （必須修正8-3）。`content:import` の経路にはこの引数を作る材料が無い。
 */
export async function restoreContentSnapshot(options: RestoreOptions): Promise<ImportReport> {
  if (!isRestoreAuthorization(options.authorization)) {
    throw new Error(
      'restore-authorization-required: restoreContentSnapshot() overrides Payload access control and only ' +
        'accepts an authorization issued by scripts/restoreAuthorization.mts (from a verified baseline, or ' +
        'from a database that identifies itself as a local throwaway).',
    );
  }
  return writeContentSnapshot({
    ...options,
    overrideAccess: true,
    reason: options.reason ?? options.authorization.reason,
  });
}

async function writeContentSnapshot(options: ImportOptions & { overrideAccess: boolean }): Promise<ImportReport> {
  const { payload, snapshot, user, overrideAccess } = options;
  const log = options.log ?? (() => {});
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
    // 必須修正8-1/8-2: dry-run はこの関数を通らない（`planImportFromSnapshot()` が担当する）。
    // 「書き込む関数の中の分岐」だった頃は、dry-run でも `payload.find` と admin bootstrap が
    // 走り、空DBでは mapper の参照解決が例外になって全 collection を検証できなかった。
    dryRun: false,
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
    // brief Step 3: draft record は `_status: 'draft'`（data 側、mapper が付ける）と
    // `draft: true`（Local API 引数）を両方指定する。
    const result = await upsertByStableId(payload, collection, stableId, data, {
      user,
      draft: publishStatus === 'draft',
      file,
      publishContext,
      overrideAccess,
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

    const alreadyPresent = await stableIdExists(payload, 'media', candidate.asset.id, { user, overrideAccess });
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
  {
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
        overrideAccess,
      });
      report.deferredReferenceUpdates.distributors += 1;
    }
    for (const robot of snapshot.robots.filter((entry) => Boolean(entry.supersededById))) {
      const data = await mapDomainRobotToPayload(robot, payload, cache);
      await upsertByStableId(payload, 'robots', robot.id, data as unknown as Record<string, unknown>, {
        user,
        draft: robot.publishStatus === 'draft',
        publishContext,
        overrideAccess,
      });
      report.deferredReferenceUpdates.robots += 1;
    }
    for (const useCase of deferredUseCases) {
      const data = await mapDomainUseCaseToPayload(useCase, payload, cache);
      await upsertByStableId(payload, 'use-cases', useCase.id, data, {
        user,
        draft: useCase.publishStatus === 'draft',
        publishContext,
        overrideAccess,
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
  {
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
      overrideAccess,
      // upsertByStableId() と同じ理由(shared context object 汚染対策)。ここは1回しか
      // 呼ばれないので今回のbugの発生源ではないが、`publishContext` を素通しする箇所を
      // 1つも残さない方が将来の事故を防げる。
      context: { ...publishContext },
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

// ─── dry-run（必須修正8-1 / 8-2） ──────────────────────────────────────────

/**
 * 必須修正8-1/8-2: **dry-run を「DBへ仮レコードが作られる前提」から切り離す。**
 *
 * 監査の指摘どおり、以前の dry-run は書き込み関数の中の `if (dryRun)` 分岐で、
 * (a) collection ごとに `payload.find` を撃ち、
 * (b) relationship の解決を **DB に既にあるレコード**へ依存する mapper に任せていた。
 * その結果、空DBに対する dry-run は最初の前方参照で例外になり、「全 collection を最後まで
 * 検証・集計する」という dry-run 本来の目的を果たせなかった。さらに CLI 経路では
 * `resolveImportUser()` が `--bootstrap-admin` で **admin を作成**しており、
 * 「dry-run なのに書き込みがある」状態だった。
 *
 * ここでは snapshot 内の stable ID だけを使った **in-memory plan** を作る。DBにも
 * ネットワークにも触れないので、空DB・DB無しでも全 collection を最後まで検証できる。
 */
export interface ImportPlanCollectionSummary {
  /** 配列の生の要素数（重複を畳む前）。必須修正8-5。 */
  rawLength: number;
  /** 一意な stable ID の数。`rawLength` と違えば重複がある。 */
  uniqueStableIds: number;
}

export interface ImportPlan {
  perCollection: Record<string, ImportPlanCollectionSummary>;
  /** 必須修正8-4: Map 化する前に見つけた重複 stable ID。 */
  duplicateStableIds: Array<{ collection: string; stableId: string; occurrences: number }>;
  /** snapshot 内で解決できない参照（DBを見ずに snapshot だけで判定する）。 */
  unresolvedReferences: Array<{ collection: string; id: string; field: string; referencedId: string }>;
  /** import が作ろうとする media（`ContentSnapshot.media` か、レコード内画像からの派生）。 */
  mediaCandidates: MediaCandidate[];
  /** Media レコードにならない画像（rights 未確定など）。 */
  skippedMedia: ImportSkippedMedia[];
  mediaRightsConflicts: Array<{ src: string; stableIds: string[] }>;
  /** 各 media が使う予定の filename。2回目の import で変わっていないことの検証に使う（8-9）。 */
  mediaFilenames: Array<{ stableId: string; filename: string }>;
}

const PLAN_COLLECTIONS = [
  'manufacturers',
  'robotSeries',
  'robots',
  'distributors',
  'useCases',
  'deployments',
  'articles',
  'articlePlacements',
  'media',
] as const;

/**
 * DB にもネットワークにも触れずに import 計画を組み立てる（必須修正8-1）。
 *
 * `collectBrokenReferences()` は `compare-content-sources.mts` にある参照規則の唯一の実装なので、
 * plan もそれを使う（規則を2箇所に持たない）。両 module は相互 import になるが、互いの参照は
 * **関数呼び出し時**だけで module 評価中には使わないため、ESM の循環解決で問題なく動く。
 *
 * ここを `await import('./compare-content-sources.mts')` にすると **deadlock する**（実測）:
 * `content:import` を直接起動すると、この module の評価は末尾の top-level `await main()` を
 * 含む。その main() の中から compare を動的 import すると、compare の評価はこの module の
 * 評価完了を待ち、こちらは compare の import を待つ——互いに待ち続けて Node が
 * 「unsettled top-level await」で exit 13 になる。静的 import はこの循環を評価順で解く。
 */
export async function planImportFromSnapshot(snapshot: ContentSnapshot): Promise<ImportPlan> {
  const perCollection: Record<string, ImportPlanCollectionSummary> = {};
  const duplicateStableIds: ImportPlan['duplicateStableIds'] = [];

  for (const collection of PLAN_COLLECTIONS) {
    const records = snapshot[collection] as readonly { id: string }[];
    const counts = new Map<string, number>();
    for (const record of records) counts.set(record.id, (counts.get(record.id) ?? 0) + 1);
    perCollection[collection] = { rawLength: records.length, uniqueStableIds: counts.size };
    for (const [stableId, occurrences] of counts) {
      if (occurrences > 1) duplicateStableIds.push({ collection, stableId, occurrences });
    }
  }

  const unresolvedReferences = collectBrokenReferences(snapshot, 'expected').map((broken) => ({
    collection: broken.collection as string,
    id: broken.id,
    field: broken.field,
    referencedId: broken.referencedId,
  }));

  const derived = deriveMediaFromSnapshot(snapshot);
  const mediaCandidates: MediaCandidate[] =
    snapshot.media.length > 0
      ? snapshot.media.map((asset) => ({ asset, src: asset.url, hostable: true, usedBy: [] }))
      : derived;

  const bySrc = new Map<string, string[]>();
  for (const candidate of derived) {
    bySrc.set(candidate.src, [...(bySrc.get(candidate.src) ?? []), candidate.asset.id]);
  }
  const mediaRightsConflicts = [...bySrc.entries()]
    .filter(([, stableIds]) => stableIds.length > 1)
    .map(([src, stableIds]) => ({ src, stableIds: [...stableIds].sort() }));

  return {
    perCollection,
    duplicateStableIds,
    unresolvedReferences,
    mediaCandidates,
    skippedMedia: mediaCandidates
      .filter((candidate) => !candidate.hostable)
      .map((candidate) => ({
        stableId: candidate.asset.id,
        src: candidate.src,
        reason: candidate.reason ?? 'not-hostable',
        usedBy: candidate.usedBy,
      })),
    mediaRightsConflicts,
    mediaFilenames: mediaCandidates
      .map((candidate) => ({ stableId: candidate.asset.id, filename: candidate.asset.filename }))
      .sort((a, b) => (a.stableId < b.stableId ? -1 : a.stableId > b.stableId ? 1 : 0)),
  };
}

export function formatImportPlan(plan: ImportPlan): string {
  const lines = ['content:import (dry run — no database writes, no admin bootstrap)'];
  for (const [collection, summary] of Object.entries(plan.perCollection)) {
    lines.push(
      `  ${collection.padEnd(20)} records=${summary.rawLength} uniqueStableIds=${summary.uniqueStableIds}`,
    );
  }
  lines.push(`  ${'media candidates'.padEnd(20)} ${plan.mediaCandidates.length} (skipped ${plan.skippedMedia.length})`);

  if (plan.duplicateStableIds.length > 0) {
    lines.push('', `FAIL — duplicate stable ids: ${plan.duplicateStableIds.length}`);
    for (const duplicate of plan.duplicateStableIds.slice(0, 40)) {
      lines.push(`  ${duplicate.collection}/${duplicate.stableId} appears ${duplicate.occurrences} times`);
    }
  }
  if (plan.unresolvedReferences.length > 0) {
    lines.push('', `FAIL — references that the snapshot cannot resolve on its own: ${plan.unresolvedReferences.length}`);
    for (const broken of plan.unresolvedReferences.slice(0, 40)) {
      lines.push(`  ${broken.collection}/${broken.id} ${broken.field} -> ${broken.referencedId}`);
    }
  }
  if (plan.skippedMedia.length > 0) {
    lines.push('', `NEEDS REVIEW — images that would not become media records: ${plan.skippedMedia.length}`);
    for (const skipped of plan.skippedMedia.slice(0, 40)) lines.push(`  ${skipped.src}: ${skipped.reason}`);
  }
  return lines.join('\n');
}

export function importPlanIsClean(plan: ImportPlan): boolean {
  return plan.duplicateStableIds.length === 0 && plan.unresolvedReferences.length === 0;
}

// ─── media store preflight（必須修正8-8） ──────────────────────────────────

/**
 * 必須修正8-8: **空DB + 既存 media store** の組合せを検出して止める。
 *
 * importer の filename は「保存先にそのキーがまだ無い」前提で決定的に決まる
 * （`fileNameFromSrc()`）。DB は空なのに store に同名ファイルが残っていると、Payload が
 * `hero.jpg` → `hero-1.jpg` と**自動採番**し、export した filename が再現しなくなる。
 * これは parity 差分としてしか現れないので、事前に検出して止める。
 */
export interface MediaStorePreflightFailure {
  check: string;
  detail: string;
}

/**
 * review fix round 1 / Important #3: 「既存 store の filename 一覧」は**取れなかったことと
 * 空だったことを区別する**。
 *
 * 修正前は `readdir` 失敗時に `[]` を返していたため、Vercel Blob backed の media store
 * （まさに Task 9 で使う構成）では常に「store は空」と判定され、この preflight が
 * **サイレントに素通り**していた。取得できない場合は fail-closed にする。
 */
export type MediaStoreListing =
  | { kind: 'listed'; filenames: readonly string[] }
  | { kind: 'unavailable'; reason: string };

export function checkMediaStorePreflight(args: {
  /** DB に既にある media レコード数。 */
  existingMediaRecords: number;
  /** import / restore が作ろうとする filename。 */
  plannedFilenames: readonly string[];
  /** 対象 media store の現状。 */
  listing: MediaStoreListing;
}): MediaStorePreflightFailure[] {
  // 既に media レコードがある DB は「空DB + 既存 store」ではないので、この検査の対象外。
  if (args.existingMediaRecords > 0) return [];
  if (args.plannedFilenames.length === 0) return [];

  if (args.listing.kind === 'unavailable') {
    return [
      {
        check: 'mediaStoreUnverifiable',
        detail:
          `the database has no media records and the contents of the target media store could not be listed ` +
          `(${args.listing.reason}). Payload auto-numbers uploads whose filename already exists, which silently ` +
          'breaks filename and media object key parity. Refusing to write rather than assuming the store is empty.',
      },
    ];
  }

  const existing = new Set(args.listing.filenames);
  const collisions = args.plannedFilenames.filter((filename) => existing.has(filename));
  if (collisions.length === 0) return [];
  return [
    {
      check: 'emptyDatabaseWithPopulatedMediaStore',
      detail:
        `the database has no media records but the media store already holds ${collisions.length} of the ` +
        `${args.plannedFilenames.length} filenames this run would write (e.g. ${collisions.slice(0, 3).join(', ')}). ` +
        'Payload would auto-number the uploads (name.png -> name-1.png), so filenames and media object keys ' +
        'would stop matching the snapshot. Empty the target store (or point at a fresh one) before writing.',
    },
  ];
}

/** Payload の media storage が Vercel Blob backed か（`lib/payload/mediaStoragePlugin.ts` と同じ条件）。 */
export function mediaStoreIsBlobBacked(env: Record<string, string | undefined> = process.env): boolean {
  return env.MEDIA_STORAGE_ENABLED !== 'false' && Boolean(env.BLOB_READ_WRITE_TOKEN);
}

/**
 * 対象 media store に実在する filename を読む。
 *
 * - Vercel Blob backed（Task 9 の構成）: public media store の token で `list()` する。
 *   失敗したら `unavailable`（fail-closed）。
 * - local disk: `readdir`。**ディレクトリが無い場合だけ**「空」として扱う（それは本当に空だから）。
 *   その他のエラーは `unavailable`。
 */
export async function readMediaStoreListing(options: {
  uploadDir: string;
  env?: Record<string, string | undefined>;
}): Promise<MediaStoreListing> {
  const env = options.env ?? process.env;

  if (mediaStoreIsBlobBacked(env)) {
    try {
      const { list } = await import('@vercel/blob');
      const filenames: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ token: env.BLOB_READ_WRITE_TOKEN, ...(cursor ? { cursor } : {}) });
        for (const blob of page.blobs) filenames.push(path.posix.basename(blob.pathname));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return { kind: 'listed', filenames };
    } catch (error) {
      return { kind: 'unavailable', reason: `vercel-blob list failed: ${(error as Error).message}` };
    }
  }

  try {
    const { readdir } = await import('node:fs/promises');
    return { kind: 'listed', filenames: await readdir(options.uploadDir) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { kind: 'listed', filenames: [] };
    return { kind: 'unavailable', reason: `${options.uploadDir}: ${(error as Error).message}` };
  }
}

/**
 * 空DB + 既存 media store の検査を、**書き込みを始める前に**行う共通ヘルパ。
 * `content:import` と `content:restore` の両方がこれを通る（Important #3 の (a)）。
 */
export async function preflightMediaStore(args: {
  payload: Payload;
  plannedFilenames: readonly string[];
  uploadDir: string;
  env?: Record<string, string | undefined>;
}): Promise<MediaStorePreflightFailure[]> {
  const existing = await args.payload.count({ collection: 'media', overrideAccess: true });
  return checkMediaStorePreflight({
    existingMediaRecords: existing.totalDocs,
    plannedFilenames: args.plannedFilenames,
    listing: await readMediaStoreListing({ uploadDir: args.uploadDir, ...(args.env ? { env: args.env } : {}) }),
  });
}

// ─── baseline 同梱 media からの復元（必須修正9-1 / 9-3） ────────────────────

/**
 * 必須修正9: **署名済み baseline に同梱された media バイト列**から復元する resolver。
 *
 * 既定の resolver（`createDefaultMediaFileResolver`）は public media store / repo の `public/`
 * からファイルを探すので、「public media Blob が生きていること」を復旧の前提にしてしまう（9-2）。
 * こちらは inventory の object key から取り出し、**書き込む直前に sha256 を再検証**する（9-3）。
 * 取得できない・digest が合わないものは skip ではなく **throw** する（9-4: 1件でも欠ければ失敗）。
 */
export function createBaselineMediaFileResolver(args: {
  inventory: readonly MediaInventoryEntry[];
  fetchMediaObject: (objectKey: string) => Promise<Buffer>;
}): MediaFileResolver {
  const byStableId = new Map(args.inventory.map((entry) => [entry.stableId, entry]));
  return async (candidate) => {
    const entry = byStableId.get(candidate.asset.id);
    if (!entry) {
      throw new Error(
        `baseline-media-missing: ${candidate.asset.id} has no bytes in the signed baseline inventory. ` +
          'A baseline that cannot restore its own media is not a baseline (必須修正9-1).',
      );
    }
    const bytes = await args.fetchMediaObject(entry.objectKey);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== entry.sha256) {
      throw new Error(
        `baseline-media-digest-mismatch: ${candidate.asset.id} (${entry.objectKey}) hashes to ${digest}, ` +
          `the signed inventory says ${entry.sha256}.`,
      );
    }
    return { file: { data: bytes, mimetype: entry.mimeType, name: entry.filename } };
  };
}

// ─── DB / 認証まわりの共通ヘルパ（restore 側も使う） ─────────────────────────

/**
 * importer は破壊的（既存レコードを update する）。remediation group 4（2026-08-20の外部監査）
 * 以降、判定ロジックの実体は `lib/content/databaseSafety.ts` の `assertWritableDatabaseUrl`
 * （3分岐: remote host は `--i-know-this-is-production` 必須／local + throwaway 名は無条件許可／
 * local + 非throwaway 名（`deploid_dev` 等）は `--i-know-this-is-a-persistent-local-database`
 * 必須）。以前は「local host なら無条件で許可」だったため、`.env.local` の既定 `DATABASE_URL`
 * （`deploid_dev`）へ明示指定を忘れたまま `content:import` を実行すると確認なしに destructive な
 * upsert が走った——これが2026-08-20のインシデントと同種の脆弱性として外部監査で指摘された。
 */
export function assertWritableDatabase(args: Map<string, string | true>, callerFile: string): void {
  const raw = process.env.DATABASE_URL;
  assertWritableDatabaseUrl({
    raw,
    callerFile,
    confirmedProduction: args.has(PRODUCTION_CONFIRMATION_FLAG),
    confirmedPreview: args.has(PREVIEW_CONFIRMATION_FLAG),
    confirmedPersistentLocalDatabase: args.has(PERSISTENT_LOCAL_DATABASE_CONFIRMATION_FLAG),
  });
  if (raw) {
    const classification = classifyDatabaseUrl(raw);
    if (!classification.isLocalHost) {
      process.stderr.write(`WARNING: writing to non-local database host "${classification.host}" (explicitly confirmed).\n`);
    } else if (!classification.looksLikeThrowawayName) {
      process.stderr.write(
        `WARNING: writing to local database "${classification.databaseName}" whose name is not recognizably ` +
          'throwaway (explicitly confirmed).\n',
      );
    }
  }
}

/**
 * 2026-08-22（外部レビューで発見された穴）: `assertWritableDatabaseUrl()`の`confirmedPreview`
 * 分岐は、接続前の同期的なURL文字列判定だけで動く（DBへまだ繋がっていないため中身を見られない）。
 * そのため`--i-know-this-is-preview`は、それ単体で「本当にPreviewかどうか」を一切検証せず
 * 書き込みを通していた——`bootstrapAdminIfAllowed()`のmarker検証は、対象DBにadminが
 * **まだ無い**（bootstrap）場合にしか呼ばれないため、既にadminが存在する対象（実運用中の
 * Productionはまさにこれに該当する）では一度も経由しない。結果、
 * `DATABASE_URL=<production> --i-know-this-is-preview`（既存adminあり）という組み合わせが、
 * 何の検証もなくcontent upsertまで到達できてしまっていた。
 *
 * `getPayload()`接続後・実際の書き込み（admin解決・content upsert）を行う前に、必ずここで
 * DB自身の`_environment_marker`を検証する。`--i-know-this-is-production`が同時に渡されている
 * 場合はチェックしない（Task 9 cutoverの既存経路・既存挙動を変えない——今回のreviewでも
 * 「production flagの既存動作は維持」と明示されている）。marker が存在しない
 * （一度も`environment:stamp`されていない）場合も、production markerの場合も、どちらも拒否
 * する（fail-closed。`scripts/restoreAuthorization.mts`の`authorizeRestoreFromLocalThrowaway`
 * ・`bootstrapAdminIfAllowed()`と同じ設計方針——未stampの管理DBを「preview だろう」と
 * 楽観的に扱わない）。
 */
export async function assertPreviewWriteConfirmedByMarker(
  payload: Payload,
  args: Map<string, string | true>,
  // `bootstrapAdminIfAllowed()`と同じ理由（そちらのコメント参照）で明示引数にする——
  // testが実Postgres + 実Payloadを使いながら「non-localと判定された場合」の分岐を、
  // `process.env.DATABASE_URL`の値を偽装することなく再現できるようにするため。
  isLocal: boolean,
): Promise<void> {
  if (isLocal) return;
  if (!args.has(PREVIEW_CONFIRMATION_FLAG)) return;
  if (args.has(PRODUCTION_CONFIRMATION_FLAG)) return;

  const marker = await readEnvironmentMarker(payload);
  if (marker?.environment !== 'preview') {
    throw new Error(
      `--${PREVIEW_CONFIRMATION_FLAG} refused: this database's _environment_marker reports ` +
        `"${marker?.environment ?? 'none (never stamped)'}", not "preview". A write authorized only by ` +
        `--${PREVIEW_CONFIRMATION_FLAG} (not --${PRODUCTION_CONFIRMATION_FLAG}) must target a database that has ` +
        'genuinely been stamped Preview (`npm run environment:stamp -- --expected preview`). This refusal is ' +
        'fail-closed on purpose — an unstamped or production-stamped managed database is never treated as Preview.',
    );
  }
}

/**
 * `--bootstrap-admin` が実際に admin を作ってよい対象かどうかを判定して作る。
 *
 * 2026-08-22（Preview rehearsal中に発見したgap）: 元々は`isLocalHost`だけを見ており、
 * local throwaway DB以外では常に拒否していた——安全だが、実Preview環境に対する
 * rehearsalの初回admin作成が構造的に不可能だった（Task9 preflight docのStep 4は
 * `--bootstrap-admin`をPreviewでも使う前提で書かれていたが、このコード側のguardと
 * 矛盾していた）。
 *
 * `--i-know-this-is-production`（`assertWritableDatabase`が要求していた、remote host全般への
 * 書き込み許可フラグ）だけでこの関数の対象を広げてはいけない——「書き込みが許可されている＝
 * admin bootstrapも許可される」という誤った推論を許してしまう。この誤りを構造的に防ぐため、
 * `assertWritableDatabaseUrl()`（`lib/content/databaseSafety.ts`）自体にも同時に
 * `--${PREVIEW_CONFIRMATION_FLAG}`を`--i-know-this-is-production`と対称な独立flagとして
 * 追加した——Previewへの書き込みで「productionだと分かっている」という矛盾したflagを
 * 渡す必要が無くなった。このadmin bootstrap関数は、その`--${PREVIEW_CONFIRMATION_FLAG}`と、
 * **DB自身の申告**
 * （`_environment_marker`、`scripts/restoreAuthorization.mts`の
 * `authorizeRestoreFromLocalThrowaway`と同じ設計方針）の両方を要求する。marker が
 * 存在しない（一度も`environment:stamp`されていない）場合は「これはpreviewだ」という
 * 未検証の申告を信用せずfail-closedで拒否する——未stampの実production DBを誤ってpreview
 * だと申告してしまうケースを防ぐ（`authorizeRestoreFromLocalThrowaway`のdocblockが
 * 指摘する既知の穴と同じ形）。
 *
 * production databaseでは絶対に許可しない（marker.environmentが'production'なら拒否、
 * `--${PREVIEW_CONFIRMATION_FLAG}`をどれだけ渡しても通らない）。
 */
export async function bootstrapAdminIfAllowed(
  payload: Payload,
  args: Map<string, string | true>,
  email: string,
  password: string,
  // 呼び出し側（resolveImportUser）は実際の`classifyDatabaseUrl(process.env.DATABASE_URL).isLocalHost`を
  // 渡す。引数として受け取る形にしているのは、testが実Postgres + 実Payloadを使いながら
  // 「non-localと判定された場合」の分岐を、`process.env.DATABASE_URL`の値を偽装することなく
  // 個別に再現できるようにするため（mockを使わずに実environment-marker行に対して検証する）。
  isLocal: boolean,
): Promise<void> {
  if (!isLocal) {
    if (!args.has(PREVIEW_CONFIRMATION_FLAG)) {
      throw new Error(
        `--bootstrap-admin is only allowed against a local throwaway database, or a database confirmed as ` +
          `Preview via --${PREVIEW_CONFIRMATION_FLAG}.`,
      );
    }
    if (args.has('admin-password')) {
      throw new Error(
        `--admin-password is not allowed together with --${PREVIEW_CONFIRMATION_FLAG} (avoids the password ` +
          'appearing in shell history or the process list on a real environment). Set PAYLOAD_IMPORT_ADMIN_PASSWORD instead.',
      );
    }
    const marker = await readEnvironmentMarker(payload);
    if (marker?.environment !== 'preview') {
      throw new Error(
        `--${PREVIEW_CONFIRMATION_FLAG} refused: this database's _environment_marker reports ` +
          `"${marker?.environment ?? 'none (never stamped)'}", not "preview". Run ` +
          '`npm run environment:stamp -- --expected preview` against this database first if it really is Preview, ' +
          'or double-check DATABASE_URL — this refusal is fail-closed on purpose (an unstamped managed database ' +
          'could just as easily be production).',
      );
    }
  }

  // 1人目の admin は Task 2 の bootstrap（Admins.hooks.beforeValidate）で platform-admin へ
  // 強制される。local / preview どちらの経路でも同じ create を使う——役割の違いは
  // 「書き込み対象DBがlocal throwawayかどうか」の判定だけで、admin作成自体の形は環境非依存。
  await payload.create({
    collection: 'admins',
    overrideAccess: false,
    data: { email, password, role: 'content-reader' } as never,
  });
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
    if (!args.has('bootstrap-admin')) {
      throw new Error(
        `No admin with email "${email}" exists. Pass --bootstrap-admin to create one (local throwaway databases), ` +
          `or --${PREVIEW_CONFIRMATION_FLAG} against a database whose _environment_marker is already stamped "preview".`,
      );
    }
    await bootstrapAdminIfAllowed(payload, args, email, password, classifyDatabaseUrl(process.env.DATABASE_URL as string).isLocalHost);
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
        '  --dry-run                     DBへ一切触れずに snapshot だけで計画を検証・集計する',
        '  --allow-network-media         rights 確認済みの外部画像を実際に fetch する',
        '  --media-dir <dir>             media のバイト列の読み取り元（restore 元 store 相当）',
        '  --media-store-dir <dir>       書き込み先 media store（既定 ./media）。空DB+既存storeを検出する',
        '  --public-dir <dir>            ローカル画像（/images/...）の読み取り元',
        '  --json <path>                 import report を JSON で書き出す',
        '  --admin-email / --admin-password  書き込みに使う admin（env でも可）',
        '  --bootstrap-admin             admin が無い場合に作る（local throwaway DB、または',
        '                                 --i-know-this-is-preview 指定時の stamped Preview DB）',
        '  --i-know-this-is-preview      remote（非local）の DATABASE_URL が Preview であることを明示し、',
        '                                 書き込みを許可する（--i-know-this-is-production の対になる',
        '                                 独立 flag。Preview 操作で production 用 flag を使わずに済む）。',
        '                                 --bootstrap-admin と併用時はさらに、_environment_marker が',
        '                                 実際に "preview" と申告していることを要求する（production は',
        '                                 marker の申告に関わらず常に拒否）。--admin-password とは',
        '                                 併用不可（PAYLOAD_IMPORT_ADMIN_PASSWORD を使うこと）',
        '  --i-know-this-is-production   remote（非local）の DATABASE_URL が Production であることを',
        '                                 明示し、書き込みを許可する（Task 9 cutover 用）',
        '  --i-know-this-is-a-persistent-local-database',
        '                                 throwaway 名でない local DATABASE_URL（例: deploid_dev）',
        '                                 への書き込みを許可する',
        '',
        '空DBへ export 済み snapshot を書き戻すのは content:restore（同じ upsert を使う）。',
        '',
      ].join('\n'),
    );
    return;
  }

  const { createLocalContentSource } = await import('../lib/content/localSource.ts');
  const writeJsonReport = async (value: unknown) => {
    const jsonPath = args.get('json');
    if (typeof jsonPath !== 'string') return;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(jsonPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    process.stdout.write(`\nwrote JSON report: ${jsonPath}\n`);
  };

  // 必須修正8-1/8-2: dry-run は **DB へ一切触れない**。接続すらしないので、
  // admin bootstrap も schema push も起こりようがなく、空DBでも最後まで集計できる。
  if (args.has('dry-run')) {
    const plan = await planImportFromSnapshot(await createLocalContentSource().readSnapshot());
    process.stdout.write(`${formatImportPlan(plan)}\n`);
    await writeJsonReport(plan);
    if (!importPlanIsClean(plan)) {
      process.stderr.write('\ncontent:import --dry-run failed — the snapshot itself is not importable.\n');
      process.exitCode = 1;
    }
    return;
  }

  assertWritableDatabase(args, 'scripts/import-content-to-payload.mts');

  // remediation group 3（グループ②の再レビューで見つかった引き継ぎ事項）:
  // **config を import する前に** dev-mode schema push を止める。
  //
  // `getPayload()` は `NODE_ENV !== 'production'` かつ adapter が `push: false` でない限り
  // `pushDevSchema`（`@payloadcms/drizzle`）を走らせ、実際に DDL を実行して
  // `payload_migrations` へ `batch: -1` の行を INSERT する。`content:export` /
  // `content:restore` は remediation group 2 の Critical #2 でこれを塞いだが、
  // **`content:import` 本体は同じ欠陥を持ったまま**だった——つまり Task 9 の cutover 実行
  // （managed DB に対して `--i-know-this-is-production` 付きで走らせる、まさにこのコマンド）で、
  // 検証より前に managed DB の schema が push され得た。data-loss 警告時の対話 prompt も同じ。
  //
  // `scripts/stamp-environment.mts` が同じ理由で同じ1行を config import の前に置いている。
  process.env.PAYLOAD_MIGRATING = 'true';

  const { getPayload } = await import('payload');
  const { default: config } = await import('../payload.config.ts');

  const payload = await getPayload({ config });
  try {
    await assertPreviewWriteConfirmedByMarker(payload, args, classifyDatabaseUrl(process.env.DATABASE_URL as string).isLocalHost);
    const user = await resolveImportUser(payload, args);
    const snapshot = await createLocalContentSource().readSnapshot();

    // 必須修正8-8: 空DB + 既存 media store の組合せ（filename 自動採番）を先に止める。
    const plan = await planImportFromSnapshot(snapshot);
    const uploadDirArg = args.get('media-store-dir');
    const uploadDir = typeof uploadDirArg === 'string' ? path.resolve(uploadDirArg) : path.resolve(process.cwd(), 'media');
    const storePreflight = await preflightMediaStore({
      payload,
      plannedFilenames: plan.mediaFilenames.map((entry) => entry.filename),
      uploadDir,
    });
    if (storePreflight.length > 0) {
      for (const failure of storePreflight) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);
      process.stderr.write('content:import: refusing to write. No database change was made.\n');
      process.exitCode = 1;
      return;
    }

    const report = await importContentSnapshot({
      payload,
      snapshot,
      user,
      mediaResolver: createDefaultMediaFileResolver(mediaResolverOptionsFromArgs(args)),
      log: (line) => process.stdout.write(`  ${line}\n`),
    });

    process.stdout.write(`\n${formatImportReport(report)}\n`);
    await writeJsonReport(report);
  } finally {
    await payload.destroy();
  }
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
