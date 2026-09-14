import type { Payload } from 'payload';
import type { AuthenticatedAdminUser } from './access';
import { mapPublishError } from './adminPublishErrors';
import type { AdminPublishErrorCode } from './adminPublishMessages';
import type { BulkPublishItemInput } from './parseBulkPublishRequest';
import { type ApprovableCollectionSlug, computeCanonicalHash, publishApprovedVersion } from './publishApprovedVersion';

/**
 * `/admin/draft-list` の「選択したN件を公開」が呼ぶservice。
 *
 * `publishFromAdmin.ts`（単発publish）と同じ「stableId解決 → 最新version取得 → hash計算 →
 * `publishApprovedVersion()`」を1件ずつ繰り返す。**`publishFromAdmin.ts`自体は変更しない**
 * （そのfileのdocblockが警告する通り、read手順はhash一致のために正確である必要があり、
 * 単発経路と共有helperへ括り出すと単発側の挙動まで一緒に動く余地ができる）。
 *
 * ## 公開意図token（`adminPublishIntentToken`）を照合しない理由
 *
 * このtokenは「編集フォームで①下書き保存→②公開クリックの間に、別の保存が割り込む」という
 * 単発publish特有の競合を防ぐためのものであり、①の直後にしか意味を持たない。一覧から選んで
 * 即座に公開するこのフローには対応する①が無い。`publishApprovedVersion()`自身が持つ
 * ロック＋トランザクション内二重チェック（承認したversionがまだchain headかを、書き込み直前に
 * もう一度確認する）だけで、「読んでから公開するまでの間に内容が変わった」ケースは
 * 完全に検出できる——検出した場合は`publish-stale-approval`として、そのitemだけ失敗させる。
 *
 * ## 逐次処理（`for...of`）にした理由
 *
 * `publishApprovedVersion()`はitemごとに独自のDBトランザクション＋document write lockを取る。
 * 手動の管理操作で複数トランザクションを同時に開くと、Postgres接続プールへの圧力が増す
 * （このrepoは`EMAXCONNSESSION`の実例を`isDatabaseConnectionError`で明示的に扱っている）。
 * 各itemのlockはdocument単位で他item と競合しないため並行化しても正しさは保てるが、
 * 手動操作の速度より接続プールの安定を優先し、あえて1件ずつ処理する。
 */

export interface BulkPublishItemSuccess {
  collection: ApprovableCollectionSlug;
  id: string | number;
  ok: true;
  documentId: string | number;
}

export interface BulkPublishItemFailure {
  collection: ApprovableCollectionSlug;
  id: string | number;
  ok: false;
  error: AdminPublishErrorCode;
  fields?: string[];
}

export type BulkPublishItemResult = BulkPublishItemSuccess | BulkPublishItemFailure;

export interface BulkPublishFromAdminArgs {
  payload: Payload;
  items: BulkPublishItemInput[];
  publisherUser: AuthenticatedAdminUser | (Record<string, unknown> & { id: string | number });
  /**
   * **TOCTOU回帰テスト専用**の差し込み口（`publishApprovedVersion.ts`の`onApprovalVerified`と
   * 同じ思想）。指定した1件（`collection`+`id`が一致するitem）の承認確認直後だけhookを呼ぶ。
   * 本番の呼び出し側は渡さない。
   */
  onApprovalVerifiedForTesting?: {
    collection: ApprovableCollectionSlug;
    id: string | number;
    hook: () => Promise<void>;
  };
}

async function publishOneItem(
  payload: Payload,
  item: BulkPublishItemInput,
  publisherUser: BulkPublishFromAdminArgs['publisherUser'],
  onApprovalVerified: (() => Promise<void>) | undefined,
): Promise<BulkPublishItemResult> {
  try {
    const doc = (await payload.findByID({
      collection: item.collection,
      id: item.id,
      depth: 0,
      draft: true,
      overrideAccess: true,
      disableErrors: true,
    })) as unknown as { stableId?: string } | null;

    const stableId = doc?.stableId;
    if (!stableId) {
      throw new Error(`publish-not-found: no ${item.collection} document with id "${String(item.id)}"`);
    }

    const { docs: versions } = await payload.findVersions({
      collection: item.collection,
      where: { parent: { equals: item.id } },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    const latest = versions[0] as unknown as { id: string | number; version: Record<string, unknown> } | undefined;
    if (!latest) {
      throw new Error(`publish-not-found: ${item.collection} document "${stableId}" has no version to publish`);
    }

    const result = await publishApprovedVersion({
      payload,
      collection: item.collection,
      stableId,
      approvedVersionId: latest.id,
      approvalManifestHash: computeCanonicalHash(latest.version),
      publisherUser,
      onApprovalVerified,
    });

    return { collection: item.collection, id: item.id, ok: true, documentId: result.documentId };
  } catch (error) {
    const [, body] = mapPublishError(error);
    return { collection: item.collection, id: item.id, ok: false, error: body.error, fields: body.fields };
  }
}

export async function bulkPublishFromAdmin(args: BulkPublishFromAdminArgs): Promise<BulkPublishItemResult[]> {
  const { payload, items, publisherUser, onApprovalVerifiedForTesting } = args;
  const results: BulkPublishItemResult[] = [];

  for (const item of items) {
    const matchesTestHook =
      onApprovalVerifiedForTesting &&
      onApprovalVerifiedForTesting.collection === item.collection &&
      String(onApprovalVerifiedForTesting.id) === String(item.id);
    const onApprovalVerified = matchesTestHook ? onApprovalVerifiedForTesting.hook : undefined;

    results.push(await publishOneItem(payload, item, publisherUser, onApprovalVerified));
  }

  return results;
}
