import type { CollectionBeforeChangeHook, Field } from 'payload';

/**
 * Admin公開UIの競合制御marker（`docs/plans/admin-publish-ui-plan-v1.md` Task 1）。
 *
 * ## 何のためにあるか
 *
 * Admin の Publish は「下書き保存 → 公開」の2リクエストに分かれる。その間に別の利用者が
 * 保存すると、公開routeが取得する「最新version」は**別人のもの**になり、
 * Bの内容がAの操作として公開されてしまう。
 *
 * そこで公開クリックごとにtokenを発行し、下書き保存が作ったversionへ刻む。routeは
 * 最新versionのtokenが自分の発行したものと一致するときだけ公開へ進む。
 *
 * **これは認可情報ではない。** 公開権限は `publishApprovedVersion()` と publish gate が
 * 判定する。ここが担うのは「どの保存要求が作ったversionか」の識別だけ。
 *
 * ## なぜquery paramで運ぶのか（form dataではなく）
 *
 * `admin: { hidden: true }` のfieldは**描画されないだけで値はform stateに載る**
 * （`@payloadcms/ui/dist/forms/fieldSchemasToFormState/addFieldStatePromise.js:74-88`。
 * 「Short-circuit hidden fields to prevent recursing and **rendering**」とあり、
 * `fieldState.value = data[field.name]` を設定してからreturnする）。
 *
 * したがってtokenを `submit({ overrides })` で送ると、一度Publishした後のform stateが
 * tokenを保持し、**その後の通常のSave Draftがそれを再送する**。hookが `data` を見る設計だと
 * 「Save Draftしただけのversionが公開可能になる」ため、tokenの前提そのものが崩れる。
 *
 * query paramなら token は form state に一切入らないので、この経路が**原理的に消える**。
 * よってhookは `req.searchParams` だけを見て、`data` に載っている値は**信用しない**。
 */

/** version / main row に保存されるfield名。 */
export const ADMIN_PUBLISH_INTENT_FIELD = 'adminPublishIntentToken';

/** 下書き保存のURLへ付けるquery param名。hookはこれだけを読む。 */
export const ADMIN_PUBLISH_INTENT_PARAM = 'adminPublishIntent';

/** 一致しなかったときのerror code。routeはこれを409へ写像する。 */
export const PUBLISH_CANDIDATE_REPLACED = 'publish-candidate-replaced';

const denyWrite = () => false;

/**
 * 全content collectionへ足すfield。
 *
 * `access.create` / `access.update` を常に false にして、**値を書けるのを下の
 * `clearUnclaimedAdminPublishIntent` hookだけに閉じる**（hookはaccessを経由しない）。
 * API clientがtokenを直接差し込む経路をここで塞ぐ。
 */
export function adminPublishIntentField(): Field {
  return {
    name: ADMIN_PUBLISH_INTENT_FIELD,
    type: 'text',
    admin: {
      hidden: true,
      description:
        'Admin公開UIの競合制御marker（lib/payload/adminPublishIntent.ts）。運用メタデータで、' +
        'コンテンツではない。値はhookだけが書き、公開時にcanonical contentから除外される。',
    },
    access: {
      create: denyWrite,
      update: denyWrite,
    },
  };
}

/** `req.searchParams` を持たない経路（Local API / import / restore）でも安全に読む。 */
function readIntentParam(req: unknown): string | null {
  const searchParams = (req as { searchParams?: URLSearchParams } | undefined)?.searchParams;
  if (!searchParams || typeof searchParams.get !== 'function') return null;
  return searchParams.get(ADMIN_PUBLISH_INTENT_PARAM);
}

/**
 * 全content collection共通の `beforeChange` hook。
 *
 * query paramがあればtokenを保存し、無ければ **必ず `null`** を書く。`data` に載っている
 * 値は読まない——form stateの再送（上記docblock）を無視するため。
 *
 * `content:import` / `content:restore` などLocal API経由の書き込みはHTTP requestを持たず
 * `searchParams` が無いので、常に `null` になる。ここでthrowするとimport全体が壊れるため、
 * 欠落は失敗ではなく「tokenなし」として扱う。
 */
export const clearUnclaimedAdminPublishIntent: CollectionBeforeChangeHook = ({ data, req }) => ({
  ...data,
  [ADMIN_PUBLISH_INTENT_FIELD]: readIntentParam(req),
});

/**
 * 最新versionが「この公開要求が作ったもの」であることを確認する。
 *
 * fail-closed: 保存側・期待側のどちらかが空（null / undefined / 空文字）なら一致とみなさない。
 * 通常のSave Draftが作ったversionはhookが `null` を書いているので、公開候補にならない。
 */
export function assertLatestVersionMatchesPublishIntent(
  latestVersion: { version?: Record<string, unknown> } | null | undefined,
  expectedToken: string | null | undefined,
): void {
  const stored = latestVersion?.version?.[ADMIN_PUBLISH_INTENT_FIELD];
  const storedToken = typeof stored === 'string' ? stored : '';

  if (!expectedToken || !storedToken || storedToken !== expectedToken) {
    throw new Error(
      `${PUBLISH_CANDIDATE_REPLACED}: the newest version was not created by this publish request. ` +
        'Someone else saved in the meantime, or the draft was saved without a publish intent. Reload and retry.',
    );
  }
}
