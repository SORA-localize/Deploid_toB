import type { GeneratePreviewURL } from 'payload';
import { asAdminUser, isContentDraftWriterOrAboveUser } from './access';

/**
 * フロントエンドの詳細ページを実際に持つ4 collectionだけをマップする。値は
 * `lib/content/previewTokens.ts` の `ALLOWED_PREVIEW_ROOTS` と完全に一致させること
 * （`tests/content/admin-preview.test.ts` が本物の `isAllowedPreviewRedirect()` を通して
 * ドリフトを検出する）。
 *
 * `distributors` / `robot-series` / `deployments` は `ApprovableCollectionSlug`
 * （`lib/payload/publishApprovedVersion.ts`）に含まれる公開可能collectionだが、対応する
 * フロントエンドページが存在しない。ここに追加しないのは意図的な除外であり、配線し忘れ
 * ではない——Previewボタンを付けても遷移先が無い。
 */
export const PREVIEW_ROOT_BY_COLLECTION = {
  manufacturers: '/manufacturers',
  robots: '/robots',
  'use-cases': '/use-cases',
  articles: '/reports',
} as const;

export type PreviewableCollectionSlug = keyof typeof PREVIEW_ROOT_BY_COLLECTION;

function buildFrontendPath(collection: PreviewableCollectionSlug, doc: Record<string, unknown>): string {
  const root = PREVIEW_ROOT_BY_COLLECTION[collection];
  const slug = typeof doc.slug === 'string' ? doc.slug.trim() : '';
  return slug.length > 0 ? `${root}/${slug}` : root;
}

/**
 * Payload標準の `admin.preview`（`GeneratePreviewURL`）を作るfactory。編集画面に描画される
 * 標準の「Preview」ボタンがこの関数の戻り値を新しいtabで開く。
 *
 * `content-draft-writer` 以上には `/api/draft-mode/enable?redirect=...`（`src/app/api/
 * draft-mode/enable/route.ts` の経路1、ログイン済みPayloadセッションのみでtoken不要）を返す。
 * それ未満のrole（`content-reader`）や未ログインには、draft-mode/enableを叩かせて生の401
 * JSONを見せる代わりに、素の公開済みフロントエンドpathを返す（安全側のフォールバック）。
 */
export function createAdminPreview(collection: PreviewableCollectionSlug): GeneratePreviewURL {
  return (doc, { req }) => {
    const frontendPath = buildFrontendPath(collection, doc);
    const user = asAdminUser(req.user);
    if (isContentDraftWriterOrAboveUser(user)) {
      return `/api/draft-mode/enable?redirect=${encodeURIComponent(frontendPath)}`;
    }
    return frontendPath;
  };
}
