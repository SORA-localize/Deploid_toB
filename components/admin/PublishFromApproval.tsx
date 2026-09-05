'use client';

import { useCallback, useState } from 'react';
import {
  Button,
  toast,
  useAuth,
  useConfig,
  useDocumentInfo,
  useForm,
  useFormModified,
  useFormProcessing,
  useOperation,
  useRouteCache,
  useTranslation,
} from '@payloadcms/ui';
import { PUBLISH_BUTTON_ID } from '@/lib/payload/adminPublishComponents';
import {
  type AdminPublishMessageKey,
  adminPublishMessageKey,
} from '@/lib/payload/adminPublishMessages';

/**
 * Payload標準の `PublishButton` を置き換える（`docs/plans/admin-publish-ui-plan-v1.md` Task 5）。
 *
 * ## なぜ「保存 → 公開」の2段なのか
 *
 * Payload標準のPublishは `submit({ overrides: { _status: 'published' } })` ——
 * **フォームの現在値を保存する操作そのもの**（`@payloadcms/ui/.../PublishButton/index.js:157`）。
 * fetchを投げるだけのボタンに置き換えると、**編集中の内容が公開されず、しかもエラーにならない**。
 *
 * そこで①Payload標準と同じ形でdraft保存し、②その保存が作ったversionを公開する。
 *
 * ## tokenをquery paramで運ぶ理由
 *
 * `admin: { hidden: true }` のfieldは描画されないだけで**値はform stateに載る**
 * （`fieldSchemasToFormState/addFieldStatePromise.js:74-88`）。`overrides` で渡すと、
 * 一度Publishした後の通常のSave Draftがtokenを再送し、
 * 「Save Draftしただけのversionが公開可能になる」。query paramならform stateに入らない。
 *
 * ## `?draft=true` を省略できない理由
 *
 * DocumentInfoの既定actionには `draft=true` が無い。`_status: 'draft'` だけを送ると
 * **通常のupdate**になり、公開中のdocumentに対しては実質unpublishになりうる。
 */
export function PublishFromApproval() {
  const { id, collectionSlug, setHasPublishedDoc, setUnpublishedVersionCount, setMostRecentVersionIsAutosaved, incrementVersionCount } =
    useDocumentInfo();
  const { user } = useAuth();
  // Payload REST の base path。既定は `/api` だが `routes.api` で変えられるので、
  // ハードコードすると設定変更時に**保存だけが静かに失敗する**。
  const { config } = useConfig();
  const { submit } = useForm();
  const modified = useFormModified();
  const processing = useFormProcessing();
  const operation = useOperation();
  const { clearRouteCache } = useRouteCache();
  const { t } = useTranslation();

  const [inFlight, setInFlight] = useState(false);

  /**
   * `t()` の型は Payload 組み込みキーのunionなので、`payload.config.ts` で足した
   * 独自キーは通らない。castはこの1箇所に閉じ込める。実体は
   * `lib/payload/adminPublishMessages.ts` が `Record<AdminPublishMessageKey, string>` で
   * 全キーの存在を保証している。
   */
  const message = useCallback(
    (code: AdminPublishMessageKey, vars?: Record<string, string | undefined>) =>
      (t as unknown as (key: string, vars?: Record<string, unknown>) => string)(
        adminPublishMessageKey(code),
        vars,
      ),
    [t],
  );

  const role = (user as { role?: string } | null)?.role;
  const canPublish = role === 'content-publisher' || role === 'platform-admin';

  const publish = useCallback(async () => {
    if (!id || !collectionSlug) return;
    setInFlight(true);
    try {
      // 公開クリックごとに新しいtokenを発行する。使い回すと、前回の保存が作ったversionを
      // 誤って公開候補にしてしまう。
      const publishIntentToken = crypto.randomUUID();

      // ① Payload標準と同じ形でdraft保存する。`draft=true` と `skipValidation` は省略禁止。
      const saved = await submit({
        action: `${config.routes.api}/${collectionSlug}/${id}?depth=0&draft=true&adminPublishIntent=${publishIntentToken}`,
        method: 'PATCH',
        overrides: { _status: 'draft' },
        skipValidation: true,
        disableSuccessStatus: true,
      });

      // `submit()` はclient検証失敗・APIエラー・ネットワークエラーで undefined を返しうる。
      // 保存が成立していないのに公開へ進むと、画面と違う内容が公開される。
      if (!saved?.res?.ok) return;

      // ② その保存が作ったversionを公開する。
      const response = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ collection: collectionSlug, id, publishIntentToken }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: AdminPublishMessageKey;
          fields?: string[];
        };
        // codeが読めなければ汎用文言へ倒す。ここでキーをそのまま出すと
        // 「Something went wrong.」を別の呪文に置き換えただけになる。
        let code: AdminPublishMessageKey = body.error ?? 'publish-internal-error';
        // `{{fields}}` を空欄で見せない。検証エラーで不足field名が取れないときは別キーにする。
        if ((code === 'publish-validation-failed' || code === 'validation-failed') && !body.fields?.length) {
          code = 'publish-missing-fields-unknown';
        }
        toast.error(message(code, { fields: body.fields?.join(', ') }));
        return;
      }

      // 呼ばないと公開後も `Status` が "Changed" のまま残る（`Status/index.js:52-58`）。
      setHasPublishedDoc?.(true);
      setUnpublishedVersionCount?.(0);
      setMostRecentVersionIsAutosaved?.(false);
      incrementVersionCount?.();
      clearRouteCache?.();

      // 公開自体は成功している。反映通知（`RevalidationNotifyResult`）の結果だけを見て
      // 文言を出し分ける——`ok`は「タグ無効化を受理した」であって「ページに反映済み」では
      // ないため、`ok`のときも含め常に「公開しました」だけを出し、反映通知が失敗した場合
      // だけ追加で注意を促す（`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 2）。
      const body = (await response.json().catch(() => null)) as {
        revalidation?: { status: 'ok' | 'non-ok' | 'unreachable' | 'missing-secret' | 'missing-base-url' };
      } | null;
      const revalidationStatus = body?.revalidation?.status;
      if (revalidationStatus === 'non-ok' || revalidationStatus === 'unreachable') {
        toast.error(message('publish-succeeded-reflection-failed'));
      } else if (revalidationStatus === 'missing-secret' || revalidationStatus === 'missing-base-url') {
        toast.error(message('publish-succeeded-reflection-not-configured'));
      } else {
        toast.success(message('publish-succeeded'));
      }
    } catch {
      // ネットワーク断は409（他の人が保存した）と区別する。公開できたか不明なので再読込を促す。
      toast.error(message('publish-unknown-outcome'));
    } finally {
      setInFlight(false);
    }
  }, [
    id,
    collectionSlug,
    config.routes.api,
    submit,
    message,
    setHasPublishedDoc,
    setUnpublishedVersionCount,
    setMostRecentVersionIsAutosaved,
    incrementVersionCount,
    clearRouteCache,
  ]);

  // create画面ではidが無く、保存後もこのclosureからは取得できない。
  // 標準のSave Draftで作成させ、id付きのedit画面から公開する。
  if (operation !== 'update' || !id) return null;
  // `hasPublishPermission` は当てにならない（`contentCollectionAccess.update = canWriteDraft`
  // が `data` を見ないため draft-writer でも true になる）。roleで判定する。
  if (!canPublish) return null;

  return (
    // `id` は消さないこと。e2e（`tests/e2e/payload-admin-publish.spec.ts`）はこのidでボタンを掴む。
    // 文言で掴むと、adminの言語が `ja` のとき Payload の「公開時の内容に戻す」と衝突する。
    // Payload自身も `action-revert-to-published` など同じ規約でidを振っている。
    <Button
      buttonStyle="primary"
      disabled={processing || inFlight}
      id={PUBLISH_BUTTON_ID}
      onClick={publish}
      size="medium"
      type="button"
    >
      {modified ? t('version:publishChanges') : t('version:publish')}
    </Button>
  );
}

export default PublishFromApproval;
