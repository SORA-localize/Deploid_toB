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
 * versions maxPerDoc(50) 到達で古いversionをprivate audit archiveへ export し、監査ログへ
 * actor・件数・version IDを残す（brief Step 3）。
 *
 * **重要な実装上の制約（コードレビューで発覚、修正済み）**: 当初 `afterChange` hookとして実装したが、
 * それは手遅れだった。Payloadの実削除（`enforceMaxVersions`、`node_modules/payload/dist/versions/
 * saveVersion.js` → `enforceMaxVersions.js`）はcollectionのcustom `afterChange` hookより**前**、
 * core `saveVersion()` の中でPayloadが自前に呼ぶため、`afterChange` の時点では既にpruneが完了して
 * いる。Payloadはversion pruningへのhook拡張点を一切公開していない（`beforeChange` /
 * `afterChange` のどちらでもpruneそのものをinterceptすることはできない）。
 *
 * そこで `beforeChange`（実書き込み・実version作成・pruneより確実に前に実行される。
 * `node_modules/payload/dist/collections/operations/utilities/update.js` で
 * `beforeChange` hookの実行 → 後段で `saveVersion()` 呼び出し、の順序を確認済み）で、
 * 「このupdateで新しいversionが1件増えたら`maxPerDoc`を超えるか」を**事前に**判定し、超える場合に
 * pruneで消える予定のversionをexportしてから書き込みを許可する形へ直した。archiveが実際に成功した
 * 場合のみ静かに進む。**archiveが書けない場合（private audit blob store未配線。現状すべての環境で
 * これに該当 — `docs/reference/content-platform-resources-v1.md` #4よりAWS KMS credentialは
 * まだruntime envに存在しない）は、書き込み自体はブロックしない**（それをやると、docが50版に
 * 達した時点でarchive credentialが後続task（Task 5/9）で配線されるまで一切編集不能になり、
 * 通常の編集業務を止めてしまう。この二択のうち、Task 3の範囲でscopeするべきはこちらではないと
 * 判断した）。代わりに、**info単発ログではなく `payload.logger.error` へ「DATA LOSS」を明示した
 * 単独メッセージで残す**ことで、通常運用のログに紛れて見逃されることを防ぐ。この既知の
 * データロスリスクは `task-3-report.md` の Concerns にも明記し、Task 5/9でarchive credentialが
 * 配線されるまでの受容済みgapとして追跡する。
 */
export function createVersionRetentionGuardBeforeChangeHook(options: { collectionSlug: string; maxPerDoc?: number }) {
  const max = options.maxPerDoc ?? 50;
  return async function guardVersionRetentionBeforeChange<TDoc extends { id?: string | number }>({
    data,
    operation,
    originalDoc,
    req,
  }: {
    data: Partial<TDoc>;
    operation: 'create' | 'update';
    originalDoc?: TDoc;
    req: PayloadRequest;
  }): Promise<Partial<TDoc>> {
    // createは常にversion 0件から始まるためpruneの対象になり得ない。autosave/unpublishは
    // `updateLatestVersion` を使い新規versionを作らないため、そもそも `enforceMaxVersions` が
    // 呼ばれない（`saveVersion.js` 参照）。ここで扱うのは通常のupdate（新規version+1）だけでよい。
    const docId = originalDoc?.id;
    if (operation !== 'update' || docId === undefined) return data;

    try {
      const { totalDocs: currentVersionCount } = await req.payload.countVersions({
        collection: options.collectionSlug as never,
        where: { parent: { equals: docId } },
        req,
        overrideAccess: true,
      });

      const countAfterThisWrite = currentVersionCount + 1;
      if (countAfterThisWrite <= max) return data;

      const overflow = countAfterThisWrite - max;
      const { docs: aboutToBePruned } = await req.payload.findVersions({
        collection: options.collectionSlug as never,
        where: { parent: { equals: docId } },
        sort: 'updatedAt', // 古い順。enforceMaxVersionsが消す対象と同じ選び方（-updatedAtの末尾側）。
        limit: overflow,
        req,
        overrideAccess: true,
        depth: 0,
      });

      const versionIds = aboutToBePruned.map((version) => version.id);
      const actorId = asAdminUser(req.user)?.id ?? 'system';
      const archived = await exportVersionsToAuditArchive({
        collectionSlug: options.collectionSlug,
        docId,
        versions: aboutToBePruned,
      });

      if (archived) {
        req.payload.logger.info({
          msg: 'version-retention-archived-before-prune',
          collection: options.collectionSlug,
          docId,
          actorId,
          versionIds,
        });
      } else {
        // このログの直後、Payload内部のenforceMaxVersionsがこのversionIdsを完全に削除する。
        // exportできなかったので、この時点でこの内容は失われる（Concern、task-3-report.md参照）。
        req.payload.logger.error({
          msg: 'DATA LOSS: pruning version(s) with no audit archive configured (accepted gap until Task 5/9 wires AWS KMS / private audit blob credentials)',
          collection: options.collectionSlug,
          docId,
          actorId,
          versionIds,
        });
      }
    } catch (error) {
      req.payload.logger.error({
        msg: 'version-retention-guard-failed',
        collection: options.collectionSlug,
        docId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return data;
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
    // local / CI / 現状の全環境: private audit blob store未配線。呼び出し側がerrorログで明示する。
    return false;
  }

  // TODO(content-platform-migration Task 5/9): OIDC-federated token交換とcosign(SNAPSHOT_SIGNING_KEY)
  // 署名の実装は、それらのcredentialがruntime envへ配線される後続taskで行う
  // （`docs/reference/content-platform-resources-v1.md` #4）。ここでは配線済みかどうかの判定と
  // 監査ログへの記録までを行い、署名なしでの書き込みは行わない。
  void payload;
  return false;
}
