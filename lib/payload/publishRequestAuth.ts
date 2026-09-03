import type { Payload } from 'payload';
import { type AuthenticatedAdminUser, isContentPublisherOrAboveUser } from './access';

/**
 * Admin公開UIのrequest受け入れ判定（`docs/plans/admin-publish-ui-plan-v1.md` Task 3）。
 *
 * ## なぜroute側でoriginを見るのか
 *
 * `payload.config.ts` は `csrf` を設定していない。`payload/dist/auth/extractJWT.js:21` は
 * `csrf.length === 0` のとき **Origin を検証せずcookieを受け入れる**。
 * 公開は権限のある破壊的操作なので、ここだけはrequest自身の値で同一originを確かめる。
 *
 * 環境変数由来のallowlist（`resolvePublicServerUrl()` 等）は**使わない**。undefinedを返しうるうえ、
 * Previewではbranch URLを返すのでdeployment固有URLから開いたadminが全て403になる。
 * 本番も独自ドメインなら不一致で、「セキュリティ機構が正規操作を全部拒否する」形で壊れる。
 * request自身の値だけを見れば local / Preview / 本番 / 独自ドメインの全てで追加設定なしに動く。
 *
 * ## 2条件の位置づけ
 *
 * ブラウザ由来のCSRFを実際に塞いでいるのは `Sec-Fetch-Site: same-origin`
 * （このheaderはJSから偽装できない）。`Origin`/`Host` 一致は **defense in depth** であって
 * 必須条件ではない。将来proxy構成を変えたときに何を守っていたのかが分かるよう明記しておく。
 */

export type PublisherAuthResult =
  | { ok: true; user: AuthenticatedAdminUser }
  | { ok: false; status: 401; error: 'unauthenticated' }
  | { ok: false; status: 403; error: 'insufficient-role' };

/** `x-forwarded-host` があればそちらを使う（Vercelでは `host` がinternal値になりうる）。 */
function externalHost(request: Request): string | null {
  return request.headers.get('x-forwarded-host')?.trim() || request.headers.get('host')?.trim() || null;
}

/**
 * 同一originからのbrowser requestだけを通す。
 *
 * `Sec-Fetch-Site` が無い場合も拒否する（非ブラウザclientはこのrouteの想定利用者ではない）。
 * `URL` のparseに失敗しても例外を投げず false を返す。
 */
export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') !== 'same-origin') return false;

  const origin = request.headers.get('origin');
  const host = externalHost(request);
  if (!origin || !host) return false;

  try {
    // `URL.host` はportを含むので、`deploid.net` と `deploid.net:8443` は別originになる。
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * 認証とrole判定を**別々に**返す。
 *
 * 既存の `authenticateDraftWriter`（`lib/content/previewTokens.ts:316`）は未認証と権限不足を
 * どちらも `null` へ畳み込んでいる。それを踏襲すると「ログインしていない」と
 * 「権限が足りない」を利用者へ出し分けられないので、ここでは区別する。
 *
 * `payload.auth()` がthrowした場合も401へ倒す。session storeの不調で500を返すより、
 * 「認証できなかった」として扱うほうが呼び出し側の分岐が単純になる。
 */
export async function authenticatePublisher(
  request: Request,
  payload: Payload,
): Promise<PublisherAuthResult> {
  let user: AuthenticatedAdminUser | null = null;
  try {
    const result = await payload.auth({ headers: request.headers });
    user = (result?.user ?? null) as AuthenticatedAdminUser | null;
  } catch {
    return { ok: false, status: 401, error: 'unauthenticated' };
  }

  if (!user) return { ok: false, status: 401, error: 'unauthenticated' };
  if (!isContentPublisherOrAboveUser(user)) return { ok: false, status: 403, error: 'insufficient-role' };

  return { ok: true, user };
}
