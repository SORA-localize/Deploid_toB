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
import type { CollectionAfterChangeHook, GlobalAfterChangeHook, Payload, PayloadRequest } from 'payload';
import { computeRevalidationSignature, REVALIDATE_SIGNATURE_HEADER, type RevalidatableCollectionSlug } from '../content/cacheTags';
import { resolvePublicServerUrl } from './resolvePublicServerUrl';

const NOTIFY_TIMEOUT_MS = 5000;

/**
 * この通知は**サーバーが自分自身のpublic URLへ送るHTTPリクエスト**なので、
 * Vercelの Deployment Protection がかかっている環境では route へ届かない。
 *
 * 2026-09-04にPreviewで実測した応答（我々のrouteの `{"error":"unauthorized"}` ではなく
 * **Vercelが返している**ことに注意）:
 *
 * ```
 * {"error":{"message":"Protected deployment","code":"401"},
 *  "protection":{"vercel_auth_enabled":true, ...}}
 * ```
 *
 * このhookはfail-openなので公開自体は成功し、**キャッシュだけが古いまま残る**。
 * 本番（`deploid.net`）は保護が無く同じPOSTが我々のrouteへ届くので、この問題は
 * **Preview限定**だが、その結果「公開がページへ反映されることをPreviewで確認できない」
 * という検証上の穴になる。実際、admin公開UIの受け入れ確認がここで詰まった。
 *
 * `VERCEL_AUTOMATION_BYPASS_SECRET` はProtection Bypass for Automationを有効にすると
 * Vercelが自動注入するsystem env。保護が無い本番では未設定なのでheaderは付かず、無害。
 * `x-vercel-set-bypass-cookie: false` を併せて送り、bypass用cookieを残さない。
 */
export function buildNotifyHeaders(signature: string): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    [REVALIDATE_SIGNATURE_HEADER]: signature,
  };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    headers['x-vercel-protection-bypass'] = bypass;
    headers['x-vercel-set-bypass-cookie'] = 'false';
  }
  return headers;
}

async function notifyRevalidation(collectionSlug: RevalidatableCollectionSlug, req: PayloadRequest): Promise<void> {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    // secret未設定は「このデプロイではrevalidation webhookをまだ配線していない」状態
    // （ローカル開発・一部テスト環境等）。afterChangeを失敗させない——書き込み自体は
    // 既に成功しており、通知できないことはdata正しさの問題ではないため。
    return;
  }

  const baseUrl = resolvePublicServerUrl();
  if (!baseUrl) return;

  const body = JSON.stringify({ collection: collectionSlug });
  const signature = computeRevalidationSignature(body, secret);

  try {
    const response = await fetch(new URL('/api/revalidate-content', baseUrl), {
      method: 'POST',
      headers: buildNotifyHeaders(signature),
      body,
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    });
    if (!response.ok) {
      req.payload.logger.warn({
        msg: 'revalidation-webhook-non-ok-response',
        collection: collectionSlug,
        status: response.status,
      });
    } else {
      // 成功パスのログ。必須修正1（remediation group 5）: 失敗時のwarnしか無いと、
      // 「revalidationが正常に動いているのか、そもそも一度も呼ばれていないのか」を
      // ログだけから区別できない。fail-open設計自体は変えず、可観測性だけを上げる。
      req.payload.logger.info({
        msg: 'revalidation-webhook-notified',
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

/** Publish transaction向け。DB commit後にだけ呼び出し、通知が未commit状態を
 * キャッシュへ反映しないようにする。 */
export async function notifyRevalidationAfterCommit(
  collectionSlug: RevalidatableCollectionSlug,
  payload: Payload,
): Promise<void> {
  await notifyRevalidation(collectionSlug, { payload } as unknown as PayloadRequest);
}

/** 各content collectionの既存 `hooks.afterChange` 配列へ追加する1エントリ。 */
export function createRevalidationAfterChangeHook(collectionSlug: RevalidatableCollectionSlug): CollectionAfterChangeHook {
  return async ({ doc, req }) => {
    if (req.context?.deferRevalidationUntilCommit) return doc;
    await notifyRevalidation(collectionSlug, req);
    return doc;
  };
}

/** `globals/SiteSettings.ts` の `hooks.afterChange` へ追加する1エントリ。 */
export function createSettingsRevalidationAfterChangeHook(): GlobalAfterChangeHook {
  return async ({ doc, req }) => {
    if (req.context?.deferRevalidationUntilCommit) return doc;
    await notifyRevalidation('site-settings', req);
    return doc;
  };
}
