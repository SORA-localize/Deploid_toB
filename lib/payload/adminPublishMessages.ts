/**
 * Admin公開UIの表示文言（`docs/plans/admin-publish-ui-plan-v1.md` Task 5）。
 *
 * ## なぜerror codeの一覧をここに置くのか
 *
 * `t()` は**キーが無くてもthrowしない**。`@payloadcms/translations/dist/utilities/init.js`
 * の `getTranslationString` は見つからないとキー文字列をそのまま返すので、翻訳を1件書き忘れると
 * 編集者に `deploidPublish:publish-stale-approval` が表示される。「Something went wrong.」を
 * 潰すのがこの計画の目的なので、それでは意味がない。
 *
 * そこで `AdminPublishErrorCode` を唯一の正本にし、
 * - routeが返すcodeはこのunionに縛られる（`AdminPublishErrorBody.error`）
 * - 各localeの表は `Record<MessageKey, string>` なので**1件でも欠けると `npm run typecheck` が落ちる**
 *
 * ランタイム検査ではなく型で閉じているので、追加漏れは実行前に分かる。
 *
 * ## localeについて
 *
 * `payload.config.ts` は `supportedLanguages` を絞っていないため、adminの言語はブラウザ設定で
 * `ja` にも `en` にもなる。両方を必ず用意する（`fallbackLanguage` の既定は `en`）。
 */

/** namespace。Payloadの組み込みキーと衝突しないようプロジェクト名を冠する。 */
export const ADMIN_PUBLISH_I18N_NAMESPACE = 'deploidPublish';

/**
 * `/api/admin/publish` が返しうるerror codeの全て。
 * 前段（origin・認証・body検証）とpublish処理（`mapPublishError`）の両方を含む。
 */
export const ADMIN_PUBLISH_ERROR_CODES = [
  // route前段
  'cross-origin-request-rejected',
  'unauthenticated',
  'insufficient-role',
  'body-too-large',
  'malformed-body',
  'unsupported-collection',
  'invalid-id',
  'missing-publish-intent-token',
  // publish処理
  'publish-validation-failed',
  'validation-failed',
  'publish-candidate-replaced',
  'publish-stale-approval',
  'publish-hash-mismatch',
  'publish-role-required',
  'archive-role-required',
  'publish-not-found',
  'publish-temporarily-unavailable',
  'publish-internal-error',
] as const;

export type AdminPublishErrorCode = (typeof ADMIN_PUBLISH_ERROR_CODES)[number];

/** routeを経由しない、client側だけで起きる通知。 */
export const ADMIN_PUBLISH_NOTICE_CODES = [
  'publish-succeeded',
  /** fetch自体が失敗した。公開できたか**分からない**ので409とは別文言にする。 */
  'publish-unknown-outcome',
  /** 検証エラーだが `fields` が空。`{{fields}}` を空欄で見せないための代替。 */
  'publish-missing-fields-unknown',
] as const;

export type AdminPublishNoticeCode = (typeof ADMIN_PUBLISH_NOTICE_CODES)[number];

export type AdminPublishMessageKey = AdminPublishErrorCode | AdminPublishNoticeCode;

/** `t()` に渡す完全修飾キー。 */
export function adminPublishMessageKey(code: AdminPublishMessageKey): string {
  return `${ADMIN_PUBLISH_I18N_NAMESPACE}:${code}`;
}

/**
 * 文言は「何が起きたか」ではなく「次に何をすればよいか」まで書く。
 * 500番台以外はほぼ全て編集者自身が解消できるため。
 */
const ja: Record<AdminPublishMessageKey, string> = {
  'cross-origin-request-rejected':
    '別サイトからの操作として拒否されました。管理画面を開き直してからもう一度お試しください。',
  unauthenticated: 'ログインの有効期限が切れています。再ログインしてから公開してください。',
  'insufficient-role': '公開の権限がありません。公開担当者に依頼してください。',
  'body-too-large': '送信データが大きすぎます。ページを再読み込みしてやり直してください。',
  'malformed-body': '送信データが壊れています。ページを再読み込みしてやり直してください。',
  'unsupported-collection': 'このコレクションはこのボタンから公開できません。',
  'invalid-id': '対象のドキュメントを特定できませんでした。ページを再読み込みしてください。',
  'missing-publish-intent-token': '公開要求が不完全です。ページを再読み込みしてもう一度お試しください。',
  'publish-validation-failed': '公開に必要な項目が未入力です: {{fields}}',
  'validation-failed': '入力内容に不備があります: {{fields}}',
  'publish-missing-fields-unknown': '入力内容に不備があります。必須項目を確認してください。',
  'publish-candidate-replaced':
    '公開しようとした内容が別の保存に置き換わりました。ページを再読み込みして内容を確認してから、もう一度公開してください。',
  'publish-stale-approval':
    '他の変更が先に保存されました。ページを再読み込みして内容を確認してから、もう一度公開してください。',
  'publish-hash-mismatch': '公開の直前に内容が変わりました。ページを再読み込みしてもう一度公開してください。',
  'publish-role-required': '公開の権限がありません。公開担当者に依頼してください。',
  'archive-role-required': '過去バージョンを整理する権限がありません。管理者に依頼してください。',
  'publish-not-found': '対象が見つかりませんでした。削除された可能性があります。一覧に戻って確認してください。',
  'publish-temporarily-unavailable': '一時的に公開できませんでした。少し待ってからもう一度お試しください。',
  'publish-internal-error': '公開に失敗しました。時間をおいて再試行し、続くようなら管理者に連絡してください。',
  'publish-succeeded': '公開しました。',
  'publish-unknown-outcome':
    '通信が中断したため、公開できたかどうか確認できませんでした。ページを再読み込みして状態を確認してください。',
};

const en: Record<AdminPublishMessageKey, string> = {
  'cross-origin-request-rejected':
    'Rejected as a cross-site request. Reopen the admin panel and try again.',
  unauthenticated: 'Your session has expired. Sign in again before publishing.',
  'insufficient-role': 'You do not have permission to publish. Ask a publisher to do it.',
  'body-too-large': 'The request was too large. Reload the page and try again.',
  'malformed-body': 'The request was malformed. Reload the page and try again.',
  'unsupported-collection': 'This collection cannot be published from this button.',
  'invalid-id': 'Could not identify the document. Reload the page.',
  'missing-publish-intent-token': 'The publish request was incomplete. Reload the page and try again.',
  'publish-validation-failed': 'Required fields are missing: {{fields}}',
  'validation-failed': 'Some fields are invalid: {{fields}}',
  'publish-missing-fields-unknown': 'Some fields are invalid. Check the required fields.',
  'publish-candidate-replaced':
    'Another save replaced the content you tried to publish. Reload the page, review the content, then publish again.',
  'publish-stale-approval':
    'Another change was saved first. Reload the page, review the content, then publish again.',
  'publish-hash-mismatch': 'The content changed just before publishing. Reload the page and publish again.',
  'publish-role-required': 'You do not have permission to publish. Ask a publisher to do it.',
  'archive-role-required': 'You do not have permission to prune old versions. Ask an administrator.',
  'publish-not-found': 'The document was not found. It may have been deleted. Go back to the list and check.',
  'publish-temporarily-unavailable': 'Publishing is temporarily unavailable. Wait a moment and try again.',
  'publish-internal-error': 'Publishing failed. Try again later, and contact an administrator if it persists.',
  'publish-succeeded': 'Published.',
  'publish-unknown-outcome':
    'The connection was interrupted, so we could not confirm whether publishing succeeded. Reload the page to check.',
};

/** `payload.config.ts` の `i18n.translations` へそのまま渡す。 */
export const adminPublishTranslations = {
  en: { [ADMIN_PUBLISH_I18N_NAMESPACE]: en },
  ja: { [ADMIN_PUBLISH_I18N_NAMESPACE]: ja },
};
