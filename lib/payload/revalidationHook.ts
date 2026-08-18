/**
 * 各collection / globalの `afterChange` から、署名付きで `/api/revalidate-content` へ通知する
 * hook（`docs/plans/content-platform-migration-plan-v1.md` Task 7 Step 3）。
 *
 * **`revalidateTag()` をここで直接呼ばない。** このhookは `payload migrate` / `content:import` /
 * `tests/content/*.test.ts` のようにNext.jsのrequestスコープの外（`getPayload()` を直接呼ぶ
 * 経路）からも実行される。`revalidateTag()`（`next/cache`）はNext.jsのrequestスコープの中でしか
 * 呼べないため、そこで直接呼ぶとそれらの経路をすべて壊す（詳細は `lib/content/cacheTags.ts`）。
 * 代わりに、実際に `revalidateTag()` を呼ぶ唯一の場所（`src/app/api/revalidate-content/route.ts`）
 * へHTTPで通知するだけにする。
 *
 * **fail-open（このhookに限る）。** 通知が失敗しても（Next.jsサーバー未起動、
 * `REVALIDATION_SECRET` 未設定、ネットワーク不通等）、公開そのものはブロックしない
 * ——キャッシュの新鮮さが1回落ちる（次のtime-based revalidateまで古い値が残りうる）だけで、
 * データの正しさや認可には影響しない。認可（`createPublishGateHook`）や監査（version retention
 * guard）のfail-closedとは性質が異なる判断であることを明示するため、ここだけ別扱いにしている。
 */
import type { CollectionAfterChangeHook, GlobalAfterChangeHook, PayloadRequest } from 'payload';
import { computeRevalidationSignature, REVALIDATE_SIGNATURE_HEADER, type RevalidatableCollectionSlug } from '../content/cacheTags';

const NOTIFY_TIMEOUT_MS = 5000;

async function notifyRevalidation(collectionSlug: RevalidatableCollectionSlug, req: PayloadRequest): Promise<void> {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    // secret未設定は「このデプロイではrevalidation webhookをまだ配線していない」状態
    // （ローカル開発・一部テスト環境等）。afterChangeを失敗させない——書き込み自体は
    // 既に成功しており、通知できないことはdata正しさの問題ではないため。
    return;
  }

  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL;
  if (!baseUrl) return;

  const body = JSON.stringify({ collection: collectionSlug });
  const signature = computeRevalidationSignature(body, secret);

  try {
    const response = await fetch(new URL('/api/revalidate-content', baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', [REVALIDATE_SIGNATURE_HEADER]: signature },
      body,
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    });
    if (!response.ok) {
      req.payload.logger.warn({
        msg: 'revalidation-webhook-non-ok-response',
        collection: collectionSlug,
        status: response.status,
      });
    }
  } catch (error) {
    req.payload.logger.warn({
      msg: 'revalidation-webhook-unreachable',
      collection: collectionSlug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** 各content collectionの既存 `hooks.afterChange` 配列へ追加する1エントリ。 */
export function createRevalidationAfterChangeHook(collectionSlug: RevalidatableCollectionSlug): CollectionAfterChangeHook {
  return async ({ doc, req }) => {
    await notifyRevalidation(collectionSlug, req);
    return doc;
  };
}

/** `globals/SiteSettings.ts` の `hooks.afterChange` へ追加する1エントリ。 */
export function createSettingsRevalidationAfterChangeHook(): GlobalAfterChangeHook {
  return async ({ doc, req }) => {
    await notifyRevalidation('site-settings', req);
    return doc;
  };
}
