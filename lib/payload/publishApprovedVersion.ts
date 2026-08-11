import { createHash } from 'node:crypto';
import type { Payload } from 'payload';
import { type AuthenticatedAdminUser, asAdminUser, isContentPublisherOrAboveUser } from './access';

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
  const { payload, collection, stableId, approvedVersionId, approvalManifestHash, publisherUser } = args;

  const user = asAdminUser(publisherUser as never);
  if (!isContentPublisherOrAboveUser(user)) {
    throw new Error('publish-role-required');
  }

  const { docs: matches } = await payload.find({
    collection,
    where: { stableId: { equals: stableId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    draft: true,
  });
  const doc = matches[0];
  if (!doc) {
    throw new Error(`publish-not-found: no ${collection} document with stableId "${stableId}"`);
  }

  const { docs: latestVersions } = await payload.findVersions({
    collection,
    where: { parent: { equals: doc.id } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
    depth: 0,
  });
  const latestVersion = latestVersions[0];
  if (!latestVersion || String(latestVersion.id) !== String(approvedVersionId)) {
    throw new Error('publish-stale-approval: a newer draft version exists since this approval was granted');
  }

  const approvedVersion = await payload.findVersionByID({
    collection,
    id: String(approvedVersionId),
    overrideAccess: true,
    depth: 0,
  });
  const versionData = (approvedVersion as unknown as { version?: Record<string, unknown> }).version ?? {};

  const actualHash = computeCanonicalHash(versionData);
  if (actualHash !== approvalManifestHash) {
    throw new Error('publish-hash-mismatch: approved version content does not match the approval manifest hash');
  }

  const published = await payload.update({
    collection,
    id: doc.id,
    data: { ...stripSystemFields(versionData), _status: 'published' },
    overrideAccess: false,
    user: publisherUser,
  });

  const { docs: chainHead } = await payload.findVersions({
    collection,
    where: { parent: { equals: doc.id } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
    depth: 0,
  });

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
}
