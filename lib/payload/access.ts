import { createHash } from 'node:crypto';
import type { Access, CollectionBeforeOperationHook, Field, FieldAccess, PayloadRequest, Where } from 'payload';
import { adminPublishIntentField } from './adminPublishIntent';
import {
  applyAdminFieldLabels,
  baseContentFieldLabels,
  baseRecordContentFieldLabels,
  imageAssetFieldLabels,
  rightsMetaFieldLabels,
  seoFieldLabels,
  sourcesItemFieldLabels,
} from './adminFieldLabels';
import {
  lifecycleStatusSelectOptions,
  reliabilitySelectOptions,
  rightsSourceTypeSelectOptions,
  rightsStatusSelectOptions,
} from './adminSelectLabels';
import {
  clearDraftIntents,
  readApprovedPublishAuthorization,
  readDraftIntent,
  readPrivilegedPublishAuthorization,
  recordDraftIntent,
} from './publishAuthorization';
import { acquireDocumentWriteLock } from './publishLock';

/** `process.env` そのものではなくテストから差し替え可能な形で受け取るための最小型。 */
export type EnvLike = Record<string, string | undefined>;

/**
 * 必須修正3-2（remediation group 1）: 自動pruneを有効化してよいのは、pruneで消えるversionを
 * **archiveし、署名し、保存し、検証する**経路がすべて配線済みのときだけ。1つでも欠けたら
 * false を返し、`resolveVersionRetention()` がpruneを無効へ倒す。
 *
 * - private audit blob store（`docs/reference/content-platform-resources-v1.md` #4）
 * - archive署名に使うAWS KMS key
 * - 保存後の読み戻し検証を有効化するフラグ
 */
export function isAuditArchiveFullyConfigured(env: EnvLike = process.env): boolean {
  const storeId =
    env.VERCEL_ENV === 'production'
      ? env.PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID
      : env.PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID;

  return Boolean(storeId) && Boolean(env.AUDIT_ARCHIVE_SIGNING_KMS_KEY_ID) && env.AUDIT_ARCHIVE_VERIFICATION_ENABLED === 'true';
}

export interface VersionRetentionResolution {
  /** Payloadの `versions.maxPerDoc`。`0` は無制限（`saveVersion.js` の `max > 0` ガード）。 */
  maxPerDoc: number;
  pruningEnabled: boolean;
  /** なぜこの結論になったかの機械可読な理由。監査ログとテストが読む。 */
  reason: string;
}

/**
 * version保持ポリシーの唯一の解決点（必須修正3-1 / 3-3）。
 *
 * 既定は**無制限保持**。`CONTENT_VERSION_PRUNE_MAX_PER_DOC` を明示的に設定した場合だけprune
 * を検討し、それでも `isAuditArchiveFullyConfigured()` が false なら**無制限へ倒す**
 * （fail-closed）。archive障害時に編集を止めるより履歴を残す方を選ぶ、という必須修正3-3の
 * 判断をここで表現している。
 */
export function resolveVersionRetention(env: EnvLike = process.env): VersionRetentionResolution {
  const requested = env.CONTENT_VERSION_PRUNE_MAX_PER_DOC;
  if (!requested) {
    return { maxPerDoc: 0, pruningEnabled: false, reason: 'pruning-not-requested-unlimited-retention' };
  }

  const parsed = Number.parseInt(requested, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { maxPerDoc: 0, pruningEnabled: false, reason: 'pruning-limit-invalid-unlimited-retention' };
  }

  if (!isAuditArchiveFullyConfigured(env)) {
    return { maxPerDoc: 0, pruningEnabled: false, reason: 'audit-archive-not-configured-unlimited-retention' };
  }

  return { maxPerDoc: parsed, pruningEnabled: true, reason: 'audit-archive-configured' };
}

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
 *
 * 必須修正1-3（remediation group 1）: 匿名の条件は `_status = published` **かつ**
 * `lifecycleStatus = active`。domainの `archived` は
 * （`lib/content/payloadMappers.ts` の表より）`_status: 'published'` + `lifecycleStatus:
 * 'archived'` で表現されるため、`_status` だけを見ていた旧条件では**archivedなdocumentが
 * 匿名のraw API（REST / GraphQL）からそのまま読めていた**。公開停止したはずの内容が
 * URL直叩きで残るのは公開範囲の誤りなので、匿名側で閉じる。
 *
 * archived detail が要る server 側（`lib/content/payloadSource.ts`）は、もともと全queryを
 * `overrideAccess: true` で発行しており、明示的なoverrideとして取得し続ける。
 */
export const publishedOrAuthenticated: Access = ({ req }) => {
  const user = asAdminUser(req.user);
  if (user) return true;
  const publishedAndActive: Where = {
    and: [{ _status: { equals: 'published' } }, { lifecycleStatus: { equals: 'active' } }],
  };
  return publishedAndActive;
};

/**
 * globalには `lifecycleStatus` が無い（`globals/SiteSettings.ts` 参照: globalは常に単一
 * documentでarchiveの概念を持たない）ため、匿名条件は `_status` だけで閉じる。
 */
export const publishedGlobalOrAuthenticated: Access = ({ req }) => {
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

/**
 * 全content collectionで共通のversions設定（brief Step 3）。保持ポリシーの詳細は §D 参照。
 *
 * 必須修正3-1（remediation group 1）: `maxPerDoc: 50` をやめ、既定で**自動pruneを無効**にする
 * （`maxPerDoc: 0` = Payloadの `saveVersion.js` の `max > 0` ガードにより
 * `enforceMaxVersions` が一切呼ばれない）。件数ベースのmaxPerDocは「最低180日保持」を
 * 満たせず、しかも署名済みprivate archiveが未配線のため、50版に達したdocumentの古いversionが
 * **どこにも残らないまま実削除**されていた。保持ポリシーの解決は
 * `resolveVersionRetention()` が一手に引き受ける。
 */
export const contentVersionsConfig: { drafts: true; maxPerDoc: number } = {
  drafts: true,
  maxPerDoc: resolveVersionRetention().maxPerDoc,
};

/**
 * 全content collection共通のbase field（brief Step 3）。`stableId` は既存 `data/*.ts` の
 * 不変 `id` をそのまま保持する（Payload内部idを公開参照に使わない）。`lifecycleStatus` は
 * Payload `_status`（draft|published）だけでは表せない `archived` を表現するための追加軸。
 */
/**
 * 公開要件の不足を、**不足field名を構造として保持したまま**投げる。
 *
 * 従来は9箇所すべてが素の `Error` で、message は2書式あった:
 *   `publish-validation-failed: missing a, b`            （base検査 / この直下）
 *   `publish-validation-failed: <slug> missing a, b`     （collection固有検査）
 *
 * routeがこれを利用者へ「不足項目」として見せるには正規表現でmessageを割るしかなく、
 * 書式が2つあるうえ将来変わりうる。`fields` を持たせて parse を不要にする。
 *
 * **message は従来と1文字も変えない。** 既存テスト（`publish-gates.test.ts` の
 * `/publish-validation-failed/` 等）と、gateの判定ロジックはそのまま。
 */
export class PublishValidationError extends Error {
  readonly fields: string[];

  constructor(fields: string[], scope?: string) {
    super(`publish-validation-failed: ${scope ? `${scope} ` : ''}missing ${fields.join(', ')}`);
    this.name = 'PublishValidationError';
    this.fields = fields;
  }
}

export function baseContentFields(): Field[] {
  return applyAdminFieldLabels(
    [
      // Admin公開UIの競合制御marker（`lib/payload/adminPublishIntent.ts`）。
      // コンテンツではなく運用メタデータで、値を書けるのは同ファイルのhookだけ。
      // `baseContentFields()` を使う全collection（publish gateを持つ8つ）へ一括で入れる:
      // `article-placements` は現状 `ApprovableCollectionSlug` 外だが、同じpublish gateを持ち
      // 将来公開経路が付く可能性があるため、ここだけ除外して不整合を作らない。
      // 未使用のcollectionでは常に `null` になるだけで、公開系・snapshotへは現れない。
      adminPublishIntentField(),
      {
        name: 'stableId',
        type: 'text',
        required: true,
        unique: true,
        index: true,
        access: { update: immutableStableId },
      },
      { name: 'slug', type: 'text', required: true, unique: true, index: true },
      { name: 'previousSlugs', type: 'text', hasMany: true },
      {
        name: 'lifecycleStatus',
        type: 'select',
        required: true,
        defaultValue: 'active',
        options: lifecycleStatusSelectOptions,
      },
    ],
    baseContentFieldLabels,
  );
}

/** Public identity is immutable once a record exists; changing it would orphan
 * relationships and route-registry history. */
export const immutableStableId: FieldAccess = ({ data, doc }) => {
  const incoming = (data as { stableId?: unknown } | undefined)?.stableId;
  const current = (doc as { stableId?: unknown } | undefined)?.stableId;
  if (current !== undefined && incoming !== undefined && incoming !== current) return false;
  return true;
};

/**
 * 全content collection共通の `Source[]`（BaseRecord）。`reliability` の意味は `data/types.ts` と不変。
 *
 * **`publishedAt` は `date` ではなく `text`**（Task 5 で発見したTask 3のschema欠陥の修正）。
 * 現行 `data/*.ts` の出典には月精度の公開日（`'2025-05'` / `'2025-11'`、実データで3件）があり、
 * Postgres の `timestamp with time zone` は `invalid input syntax for type timestamp with time
 * zone: "2025-05"` で拒否する。importer 側で `'2025-05-01'` へ丸めると、出典の「公開日は
 * 2025年5月（日は不明）」という事実主張を「2025年5月1日」に書き換えることになり、
 * Global Constraints の「sources の意味を変えない」に反する。しかも parity 比較は
 * `Date.parse('2025-05') === Date.parse('2025-05-01')` のため差分として出ず、**損失が
 * 検出できない形**になる。`collections/Deployments.ts` の `startedAt`（`'2024-01'` を持つため
 * Task 3時点で `text`）と同じ判断をここにも適用する。
 *
 * **`checkedAt`（この関数の下）・`rightsMetaField()`の`checkedAt`・
 * `baseRecordContentFields()`の`nextReviewBy`・`Manufacturers.domesticDistributors[].checkedAt`・
 * `Articles.publishedAt` も同じ理由で `date` ではなく `text`。** これらは日付のみの値で、
 * `timestamptz` にすると import 時の server TZ 変換で日付がずれる（Task 5で発見）。
 * この一箇所にまとめて書き、各field定義側では繰り返さない（Task 7: 以前は
 * `admin.description` にこの実装理由をそのまま書いていたため、編集者向け画面に
 * `timestamptz` 等の実装用語がそのまま出ていた。ここへ移し、`admin.description` 側は
 * 編集者向けの文言だけにする）。
 */
export function sourcesField(): Field {
  return {
    name: 'sources',
    type: 'array',
    required: true,
    fields: applyAdminFieldLabels(
      [
        { name: 'title', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        { name: 'publisher', type: 'text' },
        {
          name: 'publishedAt',
          type: 'text',
          admin: {
            description: {
              ja: '出典が公開された日付。日が分からない場合は月または年だけでも構いません（例: 2025-05）。出典欄には表示されない社内記録用の項目です。',
              en: 'The date this source was published. Month- or year-only is fine when the exact day is unknown (e.g. 2025-05). Not shown on the public source list — kept for internal reference.',
            },
          },
        },
        {
          name: 'checkedAt',
          type: 'text',
          required: true,
          admin: {
            description: {
              ja: 'この出典を確認した日付。出典欄に「確認 ○○」として表示されます。',
              en: 'The date this source was last checked. Shown on the public source list as "Checked …".',
            },
          },
        },
        {
          name: 'reliability',
          type: 'select',
          required: true,
          options: reliabilitySelectOptions,
        },
        { name: 'note', type: 'textarea' },
      ],
      sourcesItemFieldLabels,
    ),
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
    fields: applyAdminFieldLabels(
      [
        {
          name: 'status',
          type: 'select',
          options: rightsStatusSelectOptions,
        },
        {
          name: 'sourceType',
          type: 'select',
          options: rightsSourceTypeSelectOptions,
        },
        {
          name: 'checkedAt',
          type: 'text',
          admin: {
            description: {
              ja: '画像の権利状況を確認した日付。ページには表示されません（社内の権利管理用）。',
              en: "The date this image's rights status was last confirmed. Not shown publicly — for internal rights tracking.",
            },
          },
        },
        { name: 'rightsHolder', type: 'text' },
        { name: 'licenseUrl', type: 'text' },
        { name: 'permissionNote', type: 'textarea' },
      ],
      rightsMetaFieldLabels,
    ),
  };
}

/** `ImageAsset`（`lib/content/domainTypes.ts`）に対応するgroup field。 */
export function imageAssetField(name: string): Field {
  return {
    name,
    type: 'group',
    fields: applyAdminFieldLabels(
      [
        { name: 'src', type: 'text' },
        { name: 'alt', type: 'text' },
        { name: 'credit', type: 'text' },
        { name: 'sourceUrl', type: 'text' },
        rightsMetaField('rights'),
        { name: 'aspectRatio', type: 'number' },
      ],
      imageAssetFieldLabels,
    ),
  };
}

/** `SeoFields`（`lib/content/domainTypes.ts`）。 */
export function seoField(): Field {
  return {
    name: 'seo',
    type: 'group',
    fields: applyAdminFieldLabels(
      [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'noindex', type: 'checkbox' },
      ],
      seoFieldLabels,
    ),
  };
}

/**
 * BaseRecordのうち `stableId` / `slug` / `previousSlugs` / `lifecycleStatus` 以外
 * （`summary` / `reliability` / `sources` / `nextReviewBy` / `heroImage` / `seo`）。
 * 個別collectionの `fields` へ `...baseRecordContentFields()` で展開する。
 */
export function baseRecordContentFields(): Field[] {
  return applyAdminFieldLabels(
    [
      { name: 'summary', type: 'textarea', required: true },
      {
        name: 'reliability',
        type: 'select',
        options: reliabilitySelectOptions,
      },
      sourcesField(),
      {
        name: 'nextReviewBy',
        type: 'text',
        admin: {
          description: {
            ja: 'この項目の内容を次に見直すべき期限。ページには表示されません（社内のファクトチェック管理用）。',
            en: "The date this record's content should next be reviewed. Not shown publicly — used to schedule internal fact-checks.",
          },
        },
      },
      imageAssetField('heroImage'),
      seoField(),
    ],
    baseRecordContentFieldLabels,
  );
}

interface PublishTransitionCandidate {
  id?: string | number;
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
  [key: string]: unknown;
}

/**
 * 必須修正1（remediation group 1）で全content collectionへ足す `beforeOperation` hook。
 *
 * Payloadは `draft` 引数をoperation引数としてしか持たず、`beforeChange` hookへは渡さない。
 * ここで観測して `req.context` へ控えることで、`createPublishGateHook` が
 * 「公開中のmain rowを書き換えるupdate」と「公開中documentの上へdraftを積むupdate」を
 * 区別できるようにする（区別できないと、draft-writerのdraft保存を一律禁止するか、
 * unpublishを一律許すかの二択になる）。詳細は `lib/payload/publishAuthorization.ts`。
 */
/**
 * documentへ書き込みうるhook operation（`operationToHookOperation`、
 * `node_modules/payload/dist/collections/operations/utilities/types.js`）。
 * この入口で必ず、そのcollectionに溜まっているdraft intentを捨てる。
 *
 * read系（`read` / `count` / `countVersions` 等）を含めないのは、id指定updateの
 * `beforeOperation` → `beforeChange` の**途中**で同じcollectionのreadが走った場合に、
 * 正当なtokenまで消してしまうのを避けるため（消えると draft保存が拒否される方向＝
 * fail-closed ではあるが、機能としては壊れる）。read系はそもそも `beforeChange` へ
 * 到達しないので、孤児を「拾う」側にはならない。
 */
const DRAFT_INTENT_CLEARING_OPERATIONS = new Set(['create', 'update', 'delete', 'restoreVersion']);

export const capturePublishIntentBeforeOperation = (({ args, collection, operation, req }: {
  args: { id?: string | number; draft?: boolean };
  collection: { slug: string };
  operation: string;
  req: PayloadRequest;
}) => {
  if (DRAFT_INTENT_CLEARING_OPERATIONS.has(operation)) {
    // 直前のoperationがaccess拒否等で `beforeChange` へ到達せず残した孤児tokenを、
    // このoperationが拾えないようにする（`restoreVersion` や `where` 指定のbulk updateは
    // 自分ではintentを記録しないため、捨てないと拾えてしまう）。
    clearDraftIntents(req, collection.slug);
  }
  if (operation === 'update' && args?.id !== undefined) {
    recordDraftIntent(req, collection.slug, args.id, args.draft === true);
  }
  return args;
}) as unknown as CollectionBeforeOperationHook;

/** 全content collectionが同じ形で spread する `beforeOperation` 群。 */
export const contentCollectionBeforeOperationHooks: CollectionBeforeOperationHook[] = [
  capturePublishIntentBeforeOperation,
];

/**
 * publish/unpublishはPayloadの独立したcapabilityではなく、update内の `_status` 状態遷移
 * （brief Step 4）。access（create/update）だけでは「draft writerがpublished送信」を防げないため、
 * beforeChangeでcandidate（= update時はoriginalDocとdataのマージ、create時はdataそのもの）を見て
 * 役割を検査する。
 *
 * ## remediation group 1 / 必須修正1 で直した2つのfail-open
 *
 * 1. **状態遷移のときしかroleを見ていなかった**（`willBePublished !== wasPublished`）。
 *    published→published のまま中身を書き換えるupdateは条件がfalseになり、role検査を丸ごと
 *    迂回していた。content-draft-writerが公開済みdocumentの本文を書き換え、
 *    `publishedOrAuthenticated` 経由で即座に一般公開できた。
 * 2. **`originalDoc` を「公開中のmain row」だと誤解していた**。Payloadの `originalDoc` は
 *    `getLatestCollectionVersion()` の結果、つまり**最新version**であって main row ではない
 *    （`node_modules/payload/dist/collections/operations/updateByID.js`）。pending draftが
 *    1件でもあると `originalDoc._status === 'draft'` になるため、公開中documentに対する
 *    通常updateが「draft→draft」に見え、main rowをdraft内容で上書き（＝実質unpublish）
 *    できてしまっていた。
 *
 * そこで、判定の基準を「このwriteの後、**main rowが公開状態になるか**」へ一本化した:
 *
 * - `isDraftSave`（`draft: true` かつ `_status: 'published'` を送っていない）なら、Payloadは
 *   main rowを一切書かず version 行だけ作る（`update.js` の `if (!isSavingDraft) db.updateOne`）。
 *   このときは公開状態が動かないので、draft-writerに許す。
 * - それ以外は main row を書く。書いた結果が published になるなら
 *   **content-publisher以上 かつ 承認context（または import/restore の特権context）** が要る
 *   （必須修正1-4）。公開中のmain rowをdraftへ落とす unpublish は content-publisher以上に限る。
 *
 * `validateForPublish` は main row が公開状態になる場合だけ呼ぶ（draftは不完全レコードのまま
 * 保存できる）。
 */
export function createPublishGateHook<TDoc extends PublishTransitionCandidate>(options: {
  collectionSlug: string;
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
    const docId = operation === 'update' ? originalDoc?.id : undefined;

    // 必須修正1-5: このupdateは（draft保存であれ公開であれ）新しいversionを作る。publish側だけが
    // lockを取る形だとdraft保存が公開処理の検証と書き込みの隙間へ割り込めるため、**versionを作る
    // 側でも同じlockを取る**。以降のmain row読み取りもこのlockの内側で行う。
    if (docId !== undefined) {
      await acquireDocumentWriteLock({
        payload: req.payload,
        transactionID: req.transactionID,
        collectionSlug: options.collectionSlug,
        docId,
      });
    }

    // Payloadの `isSavingDraft` と同じ式（localizationは未使用なので `publishAllLocales` は
    // `!draftArg` に等しく、`draftArg && data._status !== 'published'` へ縮約される）。
    const isDraftSave = operation === 'update' && readDraftIntent(req, options.collectionSlug, docId) && data?._status !== 'published';

    // 公開中かどうかは originalDoc（= 最新version）ではなく main row を直接見る。
    const mainRow = docId === undefined ? undefined : await readMainRow(req, options.collectionSlug, docId);
    const mainRowWasPublished = mainRow?._status === 'published';

    // このwriteの後、main rowが公開状態になるか。draft保存ならmain rowは触られない。
    const mainRowWillBePublished = isDraftSave ? mainRowWasPublished : candidate?._status === 'published';

    if (!isDraftSave && mainRowWillBePublished) {
      if (!canPublish) {
        throw new Error('publish-role-required');
      }

      const privileged = readPrivilegedPublishAuthorization(req, options.collectionSlug);
      if (privileged) {
        // 必須修正1-6: 特権経路（import / restore）は通常publishと分離し、監査ログへ残す。
        req.payload.logger.info({
          msg: 'privileged-publish',
          collection: options.collectionSlug,
          documentId: docId ?? null,
          stableId: (candidate as { stableId?: string }).stableId ?? null,
          runId: privileged.runId,
          actorId: privileged.actorId,
          reason: privileged.reason,
        });
      } else if (!readApprovedPublishAuthorization(req, options.collectionSlug, docId)) {
        // 必須修正1-4: 承認済み公開の唯一の経路は `publishApprovedVersion()`。
        throw new Error('publish-approval-required');
      }
    }

    // unpublish（公開中のmain rowをdraftへ落とす）はcontent-publisher以上に限る。
    if (!isDraftSave && mainRowWasPublished && !mainRowWillBePublished && !canPublish) {
      throw new Error('publish-role-required');
    }

    // archive / restore も main row を書き換える操作のときだけ検査する。
    // 比較元は「いま公開されている状態」= main row（createでは存在しないので originalDoc）。
    if (!isDraftSave) {
      const willBeArchived = candidate?.lifecycleStatus === 'archived';
      const wasArchived = (mainRow ? mainRow.lifecycleStatus : originalDoc?.lifecycleStatus) === 'archived';
      if (willBeArchived !== wasArchived && !canPublish) {
        throw new Error('archive-role-required');
      }
    }

    if (!isDraftSave && candidate?._status === 'published') {
      if (req.context?.skipPublishValidation === true && readPrivilegedPublishAuthorization(req, options.collectionSlug)) {
        return data;
      }
      const domain = await options.mapToDomain(candidate, req);
      options.validateForPublish(domain);
    }

    return data;
  };
}

interface MainRowSnapshot {
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

/**
 * 公開中のmain row（version表ではなくcollection本体のrow）を、いま実行中のtransactionの視点で
 * 読む。Payload自身が `update.js` で同じ `payload.db.findOne({ ..., req })` を使っている。
 * collection hookを再入させないよう、`payload.findByID()` ではなくadapterを直接使う。
 */
async function readMainRow(
  req: PayloadRequest,
  collectionSlug: string,
  docId: string | number,
): Promise<MainRowSnapshot | undefined> {
  const row = await req.payload.db.findOne({
    collection: collectionSlug as never,
    req,
    where: { id: { equals: docId } },
  });
  return (row ?? undefined) as MainRowSnapshot | undefined;
}

/**
 * 必須修正1-2: SiteSettings global 用の publish/unpublish gate。
 *
 * globalには `beforeOperation` hookが無く（`GlobalConfig['hooks']` は
 * beforeValidate/beforeChange/afterChange/beforeRead/afterRead だけ）、collectionのように
 * `draft` 引数を観測できない。そのため global 側は「`_status` を明示的に送るwrite」だけを
 * 見て判定する:
 *
 * - `_status: 'published'` を送る = publish → content-publisher以上
 * - 公開中のglobalへ `_status: 'draft'` を送る = unpublish → content-publisher以上
 * - `_status` を送らない通常のdraft保存 → draft-writer以上（既存の `access.update`）
 *
 * `payload.updateGlobal({ draft: true })` はPayloadが `data._status` を 'draft' へ書き換える
 * ため、公開中globalに対するdraft保存は**unpublishと同じ形**に見える。ここは fail-closed 側へ
 * 倒し、公開中globalへdraftを積むにはcontent-publisher以上を要求する（globalは
 * defaultSeo / announcementBanner の2groupしか無く、運用上の影響が小さいため）。
 */
export function createGlobalPublishGateHook(options: { globalSlug: string }) {
  return async function globalPublishGate({
    data,
    originalDoc,
    req,
  }: {
    data: Record<string, unknown>;
    originalDoc?: Record<string, unknown>;
    req: PayloadRequest;
  }): Promise<Record<string, unknown>> {
    const canPublish = isContentPublisherOrAboveUser(asAdminUser(req.user));
    if (canPublish) return data;

    const requestedStatus = data?._status;
    if (requestedStatus === 'published') {
      throw new Error('publish-role-required');
    }

    const wasPublished =
      ((await req.payload.db.findGlobal({ slug: options.globalSlug, req })) as MainRowSnapshot | undefined)?._status ===
        'published' || originalDoc?._status === 'published';

    if (wasPublished && requestedStatus === 'draft') {
      throw new Error('publish-role-required');
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
    throw new PublishValidationError(missing);
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
  const retention = resolveVersionRetention();
  const max = options.maxPerDoc ?? retention.maxPerDoc;
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
    // 必須修正3-1: pruneが無効（maxPerDoc <= 0）ならPayloadは `enforceMaxVersions` を呼ばない。
    // 消えるversionが存在しないので、archiveの判定もcountVersionsのクエリも不要。
    if (max <= 0) return data;

    // createは常にversion 0件から始まるためpruneの対象になり得ない。autosave/unpublishは
    // `updateLatestVersion` を使い新規versionを作らないため、そもそも `enforceMaxVersions` が
    // 呼ばれない（`saveVersion.js` 参照）。ここで扱うのは通常のupdate（新規version+1）だけでよい。
    const docId = originalDoc?.id;
    if (operation !== 'update' || docId === undefined) return data;

    {
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

      if (!archived.ok) {
        // 必須修正3-2（fail-closed）: ここを通過させるとPayload内部の `enforceMaxVersions` が
        // このversionIdsを完全に削除する。archive・署名・保存・検証のどれかが失敗している以上、
        // pruneを開始してはならない。以前はerrorログを出すだけで書き込みを通し、実際に履歴を
        // 失っていた（remediation group 1 で修正）。
        req.payload.logger.error({
          msg: 'version-retention-blocked: refusing to write because pruning would delete versions that could not be archived',
          collection: options.collectionSlug,
          docId,
          actorId,
          versionIds,
          reason: archived.reason,
        });
        throw new Error(`version-retention-archive-unavailable: ${archived.reason}`);
      }

      req.payload.logger.info({
        msg: 'version-retention-archived-before-prune',
        collection: options.collectionSlug,
        docId,
        actorId,
        versionIds,
        archiveKey: archived.archiveKey,
        archiveDigest: archived.digest,
        signatureKeyId: archived.signatureKeyId,
      });
    }

    return data;
  };
}

export interface AuditArchiveResult {
  ok: boolean;
  /** `ok: false` のときだけ設定される機械可読な理由。 */
  reason?: string;
  /** private audit blob store上のobject key（`ok: true` のときだけ）。 */
  archiveKey?: string;
  /** archive本文のsha256（署名対象）。 */
  digest?: string;
  /** 署名に使ったKMS key id。 */
  signatureKeyId?: string;
}

/**
 * pruneで消える予定のversionを、署名済みprivate audit archiveへ書き出す。
 *
 * 必須修正3-2の要求どおり、**archive → 署名 → 保存 → 検証の4段すべてが成功したときだけ**
 * `ok: true` を返す。どこかで失敗したら `ok: false` を返し、呼び出し側（
 * `createVersionRetentionGuardBeforeChangeHook`）は書き込みごとblockする。
 *
 * 現状、AWS KMS署名鍵とprivate audit blob storeのcredentialは、まだどの環境のruntime envにも
 * 配線されていない（`docs/reference/content-platform-resources-v1.md` #4）。よってこの関数は
 * 実環境では必ず `audit-archive-not-configured` を返す。**未配線を「成功」に丸めない**ことが
 * この関数の一番重要な性質なので、credentialが無い状態で署名なしにobjectを書くフォールバックは
 * 実装しない。実際の署名・保存・検証の配線は Blob/OIDC 系の別remediation groupで行う。
 */
export async function exportVersionsToAuditArchive(args: {
  collectionSlug: string;
  docId: string | number;
  versions: unknown[];
}): Promise<AuditArchiveResult> {
  if (!isAuditArchiveFullyConfigured()) {
    return { ok: false, reason: 'audit-archive-not-configured' };
  }

  // ここから先は credential が揃っている環境でだけ到達する。archive本文とその digest までは
  // 外部依存なしに決定できるので、ここで作る（署名対象を呼び出し側から見えるようにする）。
  const body = JSON.stringify({
    collection: args.collectionSlug,
    docId: String(args.docId),
    exportedAt: new Date().toISOString(),
    versions: args.versions,
  });
  const digest = createHash('sha256').update(body).digest('hex');
  void digest;

  // 署名（AWS KMS）・保存（private blob store）・検証（read-back + 署名検証）は、credentialが
  // runtime envへ配線される別remediation groupで実装する。未実装の段階で `ok: true` を返すと
  // fail-closedが崩れるため、明示的に失敗として返す。
  return { ok: false, reason: 'audit-archive-signing-not-implemented' };
}
