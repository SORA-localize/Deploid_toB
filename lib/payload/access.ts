import type { Access, Field, PayloadRequest } from 'payload';

/**
 * 正式な role enum は4値だけ。旧称 `editor` / `publisher` / `admin` は表示ラベルに限り、
 * 保存値・API入力には使わない（`docs/plans/content-platform-migration-plan-v1.md` Task 2）。
 * `collections/Admins.ts` はこの型を re-export するだけにし、正本はここへ一本化する
 * （9+ collection の access control が同じ enum を分岐条件にするため）。
 */
export type AdminRole = 'content-reader' | 'content-draft-writer' | 'content-publisher' | 'platform-admin';

export const CONTENT_ROLES: readonly AdminRole[] = [
  'content-reader',
  'content-draft-writer',
  'content-publisher',
  'platform-admin',
];

export interface AuthenticatedAdminUser {
  id: string | number;
  role?: AdminRole;
}

export function asAdminUser(user: PayloadRequest['user']): AuthenticatedAdminUser | null {
  if (!user) return null;
  return user as unknown as AuthenticatedAdminUser;
}

export function isPlatformAdminUser(user: AuthenticatedAdminUser | null): boolean {
  return Boolean(user && user.role === 'platform-admin');
}

export function isContentPublisherOrAboveUser(user: AuthenticatedAdminUser | null): boolean {
  return Boolean(user && (user.role === 'content-publisher' || user.role === 'platform-admin'));
}

export function isContentDraftWriterOrAboveUser(user: AuthenticatedAdminUser | null): boolean {
  return Boolean(
    user &&
      (user.role === 'content-draft-writer' || user.role === 'content-publisher' || user.role === 'platform-admin'),
  );
}

/**
 * §3のRBAC表（read列）: published文書は誰でも読める。draft/archivedを含む全件は認証済みなら
 * role問わず読める（content-readerも含む＝レビュー・プレビュー用途）。
 */
export const publishedOrAuthenticated: Access = ({ req }) => {
  const user = asAdminUser(req.user);
  if (user) return true;
  return { _status: { equals: 'published' } };
};

/**
 * §3のRBAC表（create draft / update draft列）: content-draft-writer以上。
 * publish/unpublishへの遷移そのものは、ここではなく `createPublishGateHook` の
 * `beforeChange` が別途検査する（`_status` はPayloadのdraft機構が管理するfieldで、
 * create/update access単体では「published送信を拒否」を表現しにくいため）。
 */
export const canWriteDraft: Access = ({ req }) => isContentDraftWriterOrAboveUser(asAdminUser(req.user));

/** §3のRBAC表（delete列）: platform-adminだけ。 */
export const isPlatformAdmin: Access = ({ req }) => isPlatformAdminUser(asAdminUser(req.user));

/** 全content collectionで共通のaccess object（brief Step 3）。 */
export const contentCollectionAccess = {
  read: publishedOrAuthenticated,
  create: canWriteDraft,
  update: canWriteDraft,
  delete: isPlatformAdmin,
};

/** 全content collectionで共通のversions設定（brief Step 3）。保持ポリシーの詳細は §D 参照。 */
export const contentVersionsConfig = {
  drafts: true,
  maxPerDoc: 50,
} as const;

/**
 * 全content collection共通のbase field（brief Step 3）。`stableId` は既存 `data/*.ts` の
 * 不変 `id` をそのまま保持する（Payload内部idを公開参照に使わない）。`lifecycleStatus` は
 * Payload `_status`（draft|published）だけでは表せない `archived` を表現するための追加軸。
 */
export function baseContentFields(): Field[] {
  return [
    { name: 'stableId', type: 'text', required: true, unique: true, index: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'previousSlugs', type: 'text', hasMany: true },
    {
      name: 'lifecycleStatus',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ];
}

/** 全content collection共通の `Source[]`（BaseRecord）。`reliability` の意味は `data/types.ts` と不変。 */
export function sourcesField(): Field {
  return {
    name: 'sources',
    type: 'array',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'url', type: 'text', required: true },
      { name: 'publisher', type: 'text' },
      { name: 'publishedAt', type: 'date' },
      { name: 'checkedAt', type: 'date', required: true },
      {
        name: 'reliability',
        type: 'select',
        required: true,
        options: ['verified', 'official', 'reported', 'estimated'],
      },
      { name: 'note', type: 'textarea' },
    ],
  };
}

/**
 * `imageAssetField()`（`heroImage` 等、BaseRecordの任意field）専用。Payloadの `group` は
 * 「groupごと未設定」を表現できず、中の leaf fieldが `required: true` だと親groupが常に
 * 必須になってしまう（`heroImage` 自体が任意のはずなのに、非draft保存のたびに
 * `rights.status` 等が無いと弾かれる）。BaseRecord全体の方針
 * （`stableId` / `slug` 以外はPayload schema levelでは必須にせず、公開時のcustom
 * validatorへ委ねる）に合わせ、ここも非必須にする。`Media`（常に実体を伴うupload）は
 * 別途 `collections/Media.ts` に独立定義した `rights` groupを使い、そちらは必須のままにする。
 */
function rightsMetaField(name: string): Field {
  return {
    name,
    type: 'group',
    fields: [
      {
        name: 'status',
        type: 'select',
        options: [
          'own',
          'licensed',
          'commercial-permitted',
          'reference-attributed',
          'permission-requested',
          'prototype-only',
          'blocked',
        ],
      },
      {
        name: 'sourceType',
        type: 'select',
        options: ['own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown'],
      },
      { name: 'checkedAt', type: 'date' },
      { name: 'rightsHolder', type: 'text' },
      { name: 'licenseUrl', type: 'text' },
      { name: 'permissionNote', type: 'textarea' },
    ],
  };
}

/** `ImageAsset`（`lib/content/domainTypes.ts`）に対応するgroup field。 */
export function imageAssetField(name: string): Field {
  return {
    name,
    type: 'group',
    fields: [
      { name: 'src', type: 'text' },
      { name: 'alt', type: 'text' },
      { name: 'credit', type: 'text' },
      { name: 'sourceUrl', type: 'text' },
      rightsMetaField('rights'),
      { name: 'aspectRatio', type: 'number' },
    ],
  };
}

/** `SeoFields`（`lib/content/domainTypes.ts`）。 */
export function seoField(): Field {
  return {
    name: 'seo',
    type: 'group',
    fields: [
      { name: 'metaTitle', type: 'text' },
      { name: 'metaDescription', type: 'textarea' },
      { name: 'noindex', type: 'checkbox' },
    ],
  };
}

/**
 * BaseRecordのうち `stableId` / `slug` / `previousSlugs` / `lifecycleStatus` 以外
 * （`summary` / `reliability` / `sources` / `nextReviewBy` / `heroImage` / `seo`）。
 * 個別collectionの `fields` へ `...baseRecordContentFields()` で展開する。
 */
export function baseRecordContentFields(): Field[] {
  return [
    { name: 'summary', type: 'textarea' },
    {
      name: 'reliability',
      type: 'select',
      options: ['verified', 'official', 'reported', 'estimated'],
    },
    sourcesField(),
    { name: 'nextReviewBy', type: 'date' },
    imageAssetField('heroImage'),
    seoField(),
  ];
}

interface PublishTransitionCandidate {
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
  [key: string]: unknown;
}

/**
 * publish/unpublishはPayloadの独立したcapabilityではなく、update内の `_status` 状態遷移
 * （brief Step 4）。access（create/update）だけでは「draft writerがpublished送信」を防げないため、
 * beforeChangeでcandidate（= update時はoriginalDocとdataのマージ、create時はdataそのもの）を見て
 * 役割を検査する。`lifecycleStatus` のarchive/restoreも同じ2 roleだけに許可する。
 *
 * `validateForPublish` は公開へ遷移する場合だけ呼ぶ（draftは不完全レコードのまま保存できる）。
 */
export function createPublishGateHook<TDoc extends PublishTransitionCandidate>(options: {
  mapToDomain: (candidate: TDoc, req: PayloadRequest) => Promise<unknown>;
  validateForPublish: (domain: unknown) => void;
}) {
  return async function publishGate({
    data,
    originalDoc,
    operation,
    req,
  }: {
    data: Partial<TDoc>;
    originalDoc?: TDoc;
    operation: 'create' | 'update';
    req: PayloadRequest;
  }): Promise<Partial<TDoc>> {
    const candidate = (operation === 'update' ? { ...originalDoc, ...data } : data) as TDoc;
    const user = asAdminUser(req.user);
    const canPublish = isContentPublisherOrAboveUser(user);

    const willBePublished = candidate?._status === 'published';
    const wasPublished = originalDoc?._status === 'published';
    const isPublishOrUnpublishTransition = willBePublished !== wasPublished;

    if (isPublishOrUnpublishTransition && !canPublish) {
      throw new Error('publish-role-required');
    }

    const willBeArchived = candidate?.lifecycleStatus === 'archived';
    const wasArchived = originalDoc?.lifecycleStatus === 'archived';
    if (willBeArchived !== wasArchived && !canPublish) {
      throw new Error('archive-role-required');
    }

    if (willBePublished) {
      const domain = await options.mapToDomain(candidate, req);
      options.validateForPublish(domain);
    }

    return data;
  };
}

/**
 * 各collectionの公開必須fieldのbase部分（BaseRecordに対応）。個別collectionは
 * これに固有の必須項目を追加する。draftでは呼ばれない（`createPublishGateHook` 参照）。
 */
export function assertBaseRecordPublishable(domain: {
  id?: string;
  slug?: string;
  summary?: string;
  sources?: unknown[];
}): void {
  const missing: string[] = [];
  if (!domain.id) missing.push('id');
  if (!domain.slug) missing.push('slug');
  if (!domain.summary) missing.push('summary');
  if (!domain.sources || domain.sources.length === 0) missing.push('sources');
  if (missing.length > 0) {
    throw new Error(`publish-validation-failed: missing ${missing.join(', ')}`);
  }
}

/**
 * versions maxPerDoc(50) 到達前に古いversionをprivate audit archiveへ export し、
 * 監査ログ（`payload.logger`）へ actor・件数・version IDを残す（brief Step 3）。
 * Payloadはversion pruning自体へのhook拡張点を公開していないため、これは
 * 「Payloadが次の保存でpruneする前に前倒しで退避する」ベストエフォート実装であり、
 * 実削除そのものをinterceptしてはいない。private audit blob（`PRODUCTION_AUDIT_BLOB_TOKEN_*` /
 * `PREVIEW_AUDIT_BLOB_TOKEN_*`）とKMS署名鍵（`SNAPSHOT_SIGNING_KEY`）は
 * `docs/reference/content-platform-resources-v1.md` により後続taskでruntime envへ配線される
 * 前提のため、未設定環境（local/CI）ではexportをskipし、その旨を監査ログへ記録するだけに留める。
 */
export function createVersionRetentionAfterChangeHook(options: { collectionSlug: string; archiveThreshold?: number }) {
  const threshold = options.archiveThreshold ?? 45; // maxPerDoc(50) の手前で前倒しにする安全マージン
  return async function archiveOldVersionsIfNeeded({
    doc,
    req,
  }: {
    doc: { id: string | number };
    req: PayloadRequest;
  }): Promise<void> {
    try {
      const { totalDocs } = await req.payload.countVersions({
        collection: options.collectionSlug as never,
        where: { parent: { equals: doc.id } },
        req,
        overrideAccess: true,
      });

      if (totalDocs < threshold) return;

      const { docs: oldest } = await req.payload.findVersions({
        collection: options.collectionSlug as never,
        where: { parent: { equals: doc.id } },
        sort: 'createdAt',
        limit: totalDocs - threshold + 1,
        req,
        overrideAccess: true,
        depth: 0,
      });

      const versionIds = oldest.map((version) => version.id);
      const archived = await exportVersionsToAuditArchive({
        collectionSlug: options.collectionSlug,
        docId: doc.id,
        versions: oldest,
      });

      req.payload.logger.info({
        msg: 'version-retention-archive',
        collection: options.collectionSlug,
        docId: doc.id,
        actorId: asAdminUser(req.user)?.id ?? 'system',
        versionIds,
        archived,
      });
    } catch (error) {
      // 監査archiveの失敗で本編集を止めない（afterChangeなので既にcommit済み）。
      // ログにだけ残し、運用側が別途確認できるようにする。
      req.payload.logger.error({
        msg: 'version-retention-archive-failed',
        collection: options.collectionSlug,
        docId: doc.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

async function exportVersionsToAuditArchive(payload: {
  collectionSlug: string;
  docId: string | number;
  versions: unknown[];
}): Promise<boolean> {
  const storeId =
    process.env.VERCEL_ENV === 'production'
      ? process.env.PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID
      : process.env.PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID;

  if (!storeId) {
    // local / CI: private audit blob store未配線。exportをskipした事実だけ呼び出し側でログする。
    return false;
  }

  // TODO(content-platform-migration Task 5/9): OIDC-federated token交換とcosign(SNAPSHOT_SIGNING_KEY)
  // 署名の実装は、それらのcredentialがruntime envへ配線される後続taskで行う
  // （`docs/reference/content-platform-resources-v1.md` #4）。ここでは配線済みかどうかの判定と
  // 監査ログへの記録までを行い、署名なしでの書き込みは行わない。
  void payload;
  return false;
}
