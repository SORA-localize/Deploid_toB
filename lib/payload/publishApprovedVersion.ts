import { createHash } from 'node:crypto';
import type { Payload, PayloadRequest } from 'payload';
import { type AuthenticatedAdminUser, asAdminUser, isContentPublisherOrAboveUser } from './access';
import { approvedPublishContext } from './publishAuthorization';
import { acquireDocumentWriteLock } from './publishLock';
import { notifyRevalidationAfterCommit } from './revalidationHook';

/**
 * 承認済みdraftの公開を1箇所へ集約する（brief）。Task 6〜9.5は独自のpublish updateを作らず、
 * これを使う。入力はcollection、stableId、承認対象versionのid、承認manifest hash、publisher req。
 *
 * 手順:
 * 1. stableIdからmain documentを解決する。
 * 2. 最新draft versionのidが `approvedVersionId` と一致することを確認する（承認後に別draftが
 *    作られていたら停止する）。
 * 3. 承認versionの全canonical fieldから計算したhashが `approvalManifestHash` と一致することを
 *    確認する（statusだけの更新やhash不一致でも停止する）。
 * 4. 承認versionの全canonical fieldを読み出し、`_status: 'published'` と共にmain documentへ書く。
 * 5. 公開後のcanonical hashとversion chain headを返す。
 */

export type ApprovableCollectionSlug = 'manufacturers' | 'distributors' | 'robot-series' | 'robots' | 'use-cases' | 'deployments' | 'articles';

export interface PublishApprovedVersionArgs {
  payload: Payload;
  collection: ApprovableCollectionSlug;
  stableId: string;
  approvedVersionId: string | number;
  approvalManifestHash: string;
  /** Payload Local APIの慣例（`user` + `overrideAccess`）に合わせ、req全体ではなくuserを渡す。 */
  publisherUser: AuthenticatedAdminUser | (Record<string, unknown> & { id: string | number });
  /**
   * **TOCTOU回帰テスト専用**の差し込み口（`tests/content/publish-approved-version.test.ts`）。
   * 承認確認の直後・公開updateの直前で呼ばれる。本番の呼び出し側は渡さない。
   */
  onApprovalVerified?: () => Promise<void>;
}

export interface PublishApprovedVersionResult {
  canonicalHash: string;
  versionChainHeadId: string | number;
  documentId: string | number;
}

/** 承認manifest hashと同じ計算式。versionのcanonical field（system field除く）をsorted-key JSONにしてsha256。 */
export function computeCanonicalHash(data: Record<string, unknown>): string {
  const canonical = stripSystemFields(data);
  const sorted = sortKeysDeep(canonical);
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}

const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', '_status', 'updatedBy']);

function stripSystemFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SYSTEM_FIELDS.has(key)) continue;
    result[key] = value;
  }
  return result;
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => [key, sortKeysDeep(val)]),
    );
  }
  return value;
}

export async function publishApprovedVersion(args: PublishApprovedVersionArgs): Promise<PublishApprovedVersionResult> {
  const { payload, collection, stableId, approvedVersionId, approvalManifestHash, publisherUser, onApprovalVerified } = args;

  const user = asAdminUser(publisherUser as never);
  if (!isContentPublisherOrAboveUser(user)) {
    throw new Error('publish-role-required');
  }

  const transactionID = await payload.db.beginTransaction();
  if (transactionID === null) {
    throw new Error('publish-transaction-unavailable: this database adapter does not support transactions');
  }
  // Payload Local APIは `req` の部分オブジェクトを受け取り、`transactionID` を引き継ぐ。
  const req = { transactionID } as unknown as PayloadRequest;
  let committed = false;

  try {
    const { docs: matches } = await payload.find({
      collection,
      where: { stableId: { equals: stableId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
      req,
    });
    const doc = matches[0];
    if (!doc) {
      throw new Error(`publish-not-found: no ${collection} document with stableId "${stableId}"`);
    }

    // 必須修正1-5: publish と、versionを作る書き込みの両方が同じlockを取ることで初めて
    // 「承認確認 → 公開update」の間に別versionが割り込めなくなる。
    await acquireDocumentWriteLock({ payload, transactionID, collectionSlug: collection, docId: doc.id });

    const assertApprovedVersionIsStillLatest = async () => {
      const { docs: latestVersions } = await payload.findVersions({
        collection,
        where: { parent: { equals: doc.id } },
        sort: '-createdAt',
        limit: 1,
        overrideAccess: true,
        depth: 0,
        req,
      });
      const latestVersion = latestVersions[0];
      if (!latestVersion || String(latestVersion.id) !== String(approvedVersionId)) {
        throw new Error('publish-stale-approval: a newer draft version exists since this approval was granted');
      }
    };

    await assertApprovedVersionIsStillLatest();

    const approvedVersion = await payload.findVersionByID({
      collection,
      id: String(approvedVersionId),
      overrideAccess: true,
      depth: 0,
      req,
    });
    const versionData = (approvedVersion as unknown as { version?: Record<string, unknown> }).version ?? {};

    const actualHash = computeCanonicalHash(versionData);
    if (actualHash !== approvalManifestHash) {
      throw new Error('publish-hash-mismatch: approved version content does not match the approval manifest hash');
    }

    // TOCTOU回帰テスト専用の差し込み口。本番の呼び出し側は渡さない。
    if (onApprovalVerified) await onApprovalVerified();

    // 必須修正1-5: 書き込む直前に、承認したversionがまだchain headであることを**同じ
    // transactionの中で**もう一度確かめる。PostgresのREAD COMMITTEDでは文ごとに新しい
    // snapshotを取るので、確認と書き込みの隙間にcommitされた別versionもここで見える。
    await assertApprovedVersionIsStillLatest();

    const published = await payload.update({
      collection,
      id: doc.id,
      data: { ...stripSystemFields(versionData), _status: 'published' },
      overrideAccess: false,
      user: publisherUser,
      req,
      context: {
        ...approvedPublishContext({
          collection,
          documentId: String(doc.id),
          approvedVersionId: String(approvedVersionId),
          approvalManifestHash,
          actorId: String(user?.id ?? 'unknown'),
        }),
        deferRevalidationUntilCommit: true,
      },
    });

    const { docs: chainHead } = await payload.findVersions({
      collection,
      where: { parent: { equals: doc.id } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
      depth: 0,
      req,
    });

    await payload.db.commitTransaction(transactionID);
    committed = true;

    await notifyRevalidationAfterCommit(collection, payload);

    payload.logger.info({
      msg: 'publish-approved-version',
      collection,
      stableId,
      documentId: doc.id,
      approvedVersionId,
      actorId: user?.id,
      canonicalHash: actualHash,
    });

    return {
      canonicalHash: computeCanonicalHash(published as unknown as Record<string, unknown>),
      versionChainHeadId: chainHead[0]?.id ?? approvedVersionId,
      documentId: doc.id,
    };
  } catch (error) {
    // commit後（= 公開は成立済み）にログ等で落ちた場合まで rollback を呼ぶと、解決済みsessionを
    // 二重に終了させることになる。commit前に落ちたときだけ巻き戻す。
    if (!committed) await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}
