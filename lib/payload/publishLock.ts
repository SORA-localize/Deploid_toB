import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

/**
 * document単位の排他ロック（remediation group 1 / 必須修正1-5）。
 *
 * `pg_advisory_xact_lock` はtransaction終了で自動解放されるので、明示的なunlockもタイムアウトも
 * 要らない。同一transaction（同一session）からの再取得は常に即座に成功するため、
 * `publishApprovedVersion()` が取ったlockを、その中のupdateが起こすpublish gateが
 * 取り直しても自己デッドロックしない。
 *
 * **publish側だけでなく、versionを作る書き込み側（= publish gateを通る全update）でも取る**
 * ことが要点。publish側だけで取っていた版は publish 同士しか直列化できず、lockを取らない
 * draft保存が「承認済みversionがchain headであることの再検証」と「公開update」の隙間へ
 * commitできてしまい、TOCTOUが残っていた（必須修正1-5は「narrowする」ではなく
 * 「なくす」を要求している）。
 *
 * lockを取れない状況（transaction無し / 想定外のadapter）では黙って続行せず落とす。
 * lockが無いということは、この後に読むmain rowの状態も他transactionから動かされうる、
 * ということなので、gateの判断そのものが信用できない（fail-closed）。
 */
export async function acquireDocumentWriteLock(args: {
  /** Payloadは `req.transactionID` を `Promise` で持つことがあるため、そのまま受けてawaitする。 */
  payload: Payload;
  transactionID: string | number | Promise<string | number> | undefined | null;
  collectionSlug: string;
  docId: string | number;
}): Promise<void> {
  const { payload, collectionSlug, docId } = args;
  const transactionID = await args.transactionID;

  if (transactionID === undefined || transactionID === null) {
    throw new Error(
      `publish-lock-unavailable: no active transaction while writing ${collectionSlug}:${docId}; ` +
        'refusing to write without a per-document lock',
    );
  }

  const sessions = (
    payload.db as unknown as {
      sessions?: Record<string, { db?: { execute?: (query: unknown) => Promise<unknown> } }>;
    }
  ).sessions;
  const session = sessions?.[String(transactionID)];
  const sessionDb = session?.db;
  const execute = sessionDb?.execute;

  if (typeof execute !== 'function') {
    throw new Error(
      `publish-lock-unavailable: cannot acquire a per-document lock for ${collectionSlug}:${docId} on this database adapter`,
    );
  }

  await execute.call(sessionDb, sql`SELECT pg_advisory_xact_lock(hashtext(${`${collectionSlug}:${docId}`}))`);
}
