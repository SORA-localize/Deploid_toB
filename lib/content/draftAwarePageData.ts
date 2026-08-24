/**
 * Draft Mode配線の共通オーケストレーション（task7-draft-mode-wiring-brief.md）。
 *
 * 4つのdetail page（robots/manufacturers/use-cases/reports）は同じ形の分岐を持つ:
 *
 * 1. draft modeが無効 → 常に`'use cache'`された既存のcached経路。
 * 2. draft modeが有効だが`getActivePreviewSession()`の検証に失敗（cookie無し・期限切れ・
 *    改ざん・role失効） → published-onlyのcached経路へfail-closedでfallback（「見えるはずの
 *    ものが見えない」方向の失敗だけを許す。「見えないはずのものが見える」方向は絶対に許さない）。
 * 3. draft modeが有効かつ検証済みsession → 完全にuncachedなdraft経路。
 *
 * **最重要制約**: draft経路の結果を共有cacheへ絶対に漏らさない。`'use cache'`関数の中では
 * draft判定を分岐できない（Next.jsの永続cache層に乗ってしまい、他のrequest・他のuserへ
 * draft内容が漏れる致命的バグになるため）。このオーケストレーション自体は`'use cache'`ではない
 * 普通の関数として、cached関数の**外側**（page.tsxの`generateMetadata`/default export）から
 * 呼ぶ。`draftMode()`/`cookies()`はNext.jsのrequest scopeでしか呼べないため、この関数もまた
 * request scope内（Server Componentのレンダリング経路）からしか呼べない。
 */
import { cookies, draftMode } from 'next/headers';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { getActivePreviewSession, PREVIEW_SESSION_COOKIE_NAME } from './previewTokens';

export interface DraftAwarePageData<TData> {
  data: TData;
  /**
   * trueなら検証済みsessionの下でdraft内容を表示している。呼び出し側はこれを使って
   * SEO（noindex）を上書きする——draft表示中のページは検索エンジンに影響しないようにする。
   */
  isDraftPreview: boolean;
}

/**
 * @param slug 対象slug。`cachedGetter`/`draftGetter`双方にそのまま渡す。
 * @param cachedGetter 既存の`'use cache'`関数（例: `getCachedRobotDetailData`）。
 * @param draftGetter uncachedなdraft経路（例: `getDraftRobotDetailData` —
 *   `repository.resolveXDraftDetailBySlug`を呼ぶ、`'use cache'`を持たない関数）。
 *   session検証成功時だけ呼ばれる。
 */
export async function resolveDraftAwarePageData<TData>(
  slug: string,
  cachedGetter: (slug: string) => Promise<TData>,
  draftGetter: (slug: string) => Promise<TData>,
): Promise<DraftAwarePageData<TData>> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) {
    return { data: await cachedGetter(slug), isDraftPreview: false };
  }

  // draft modeのcookie自体はあるが、session検証はここから先で行う——
  // 「cookieが存在するだけではdraftを返さない」という`getActivePreviewSession()`の契約どおり、
  // 毎request必ず検証する。
  const payload = await getPayload({ config: payloadConfig });
  const cookieStore = await cookies();
  const session = await getActivePreviewSession(cookieStore.get(PREVIEW_SESSION_COOKIE_NAME)?.value, payload);
  if (!session.ok) {
    return { data: await cachedGetter(slug), isDraftPreview: false };
  }

  return { data: await draftGetter(slug), isDraftPreview: true };
}
