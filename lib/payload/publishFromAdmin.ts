import type { Payload } from 'payload';
import { assertLatestVersionMatchesPublishIntent } from './adminPublishIntent';
import {
  type ApprovableCollectionSlug,
  type PublishApprovedVersionResult,
  computeCanonicalHash,
  publishApprovedVersion,
} from './publishApprovedVersion';
import type { AuthenticatedAdminUser } from './access';

/**
 * Admin UIの公開クリックを受ける service（`docs/plans/admin-publish-ui-plan-v1.md` Task 4）。
 *
 * UIは「下書き保存 → 公開」の2リクエストで動く。①の保存が作ったversionにだけ
 * 公開意図tokenが刻まれているので、ここでは**最新versionがそのtokenを持つときだけ**
 * 公開へ進む。最新を無条件に公開すると、①と②の間に別の利用者が保存したとき
 * **その人の内容が公開クリックした人の操作として公開される**。
 *
 * 競合防御は2層。
 * 1. ここでのtoken照合 —— routeがversionを選ぶ前に割り込まれた場合
 * 2. `publishApprovedVersion` の `assertApprovedVersionIsStillLatest`（`:126`, `:148`）
 *    —— versionを選んだ後に割り込まれた場合
 *
 * **hashはここで計算して渡す。** `publishApprovedVersion` は同じversionを
 * `findVersionByID({ depth: 0 })` で読み直して再計算し、一致しなければ
 * `publish-hash-mismatch` で止める。したがってここの読み方（`findVersions` + `depth: 0`）が
 * ズレると**全ての公開が失敗する**ので、`depth: 0` を省略しないこと。
 */

export interface PublishFromAdminArgs {
  payload: Payload;
  collection: ApprovableCollectionSlug;
  /** Payload内部のdocument id（admin UIが持っている値）。`stableId` ではない。 */
  id: string | number;
  publishIntentToken: string;
  publisherUser: AuthenticatedAdminUser | (Record<string, unknown> & { id: string | number });
}

export async function publishFromAdmin(args: PublishFromAdminArgs): Promise<PublishApprovedVersionResult> {
  const { payload, collection, id, publishIntentToken, publisherUser } = args;

  // `publishApprovedVersion` は stableId を要求するので、内部idから引き直す。
  // `disableErrors: true` でPayloadのNotFound例外を抑え、こちらのerror codeへ揃える
  // （例外任せにすると不正idが500へ落ちる）。
  const doc = (await payload.findByID({
    collection,
    id,
    depth: 0,
    draft: true,
    overrideAccess: true,
    disableErrors: true,
  })) as unknown as { stableId?: string } | null;

  const stableId = doc?.stableId;
  if (!stableId) {
    throw new Error(`publish-not-found: no ${collection} document with id "${String(id)}"`);
  }

  const { docs: versions } = await payload.findVersions({
    collection,
    where: { parent: { equals: id } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const latest = versions[0] as unknown as { id: string | number; version: Record<string, unknown> } | undefined;
  if (!latest) {
    throw new Error(`publish-not-found: ${collection} document "${stableId}" has no version to publish`);
  }

  // 最新versionがこの公開要求の保存で作られたものか。違えば誰かが割り込んでいる。
  assertLatestVersionMatchesPublishIntent(latest, publishIntentToken);

  return publishApprovedVersion({
    payload,
    collection,
    stableId,
    approvedVersionId: latest.id,
    approvalManifestHash: computeCanonicalHash(latest.version),
    publisherUser,
  });
}
