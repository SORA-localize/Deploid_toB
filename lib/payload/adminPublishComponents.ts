import type { CollectionConfig } from 'payload';

/**
 * 公開できるcollectionのadmin編集画面で、標準のPublishボタンを差し替える
 * （`docs/plans/admin-publish-ui-plan-v1.md` Task 6）。
 *
 * ## なぜ7つのcollectionで共有するのか
 *
 * 各collectionへ手書きすると、1つ書き忘れても**何も起きない**。Payloadは
 * `admin.components.edit.PublishButton` が無ければ標準ボタンを描画し、標準ボタンは
 * `createPublishGateHook` に弾かれて `Something went wrong.` を出す。つまり書き忘れは
 * 「壊れた元の挙動へ静かに戻る」形の失敗になる。定数1つに集約したうえで
 * `scripts/check-admin-import-map.mjs` が配線とimportMapの両方を機械検査する。
 *
 * `article-placements` はここに含めない。`ApprovableCollectionSlug` の外にあり、
 * publish経路自体が無い（計画「スコープの正直な線引き」）。
 */

/**
 * `importMap.js` のキーと一致させる文字列。**ここを変えたら importMap を再生成すること。**
 * ズレると importMap 参照が外れ、やはり標準ボタンへ静かに戻る。
 */
export const PUBLISH_BUTTON_COMPONENT_PATH =
  '@/components/admin/PublishFromApproval#PublishFromApproval';

export const contentPublishAdminComponents: NonNullable<CollectionConfig['admin']>['components'] = {
  edit: { PublishButton: PUBLISH_BUTTON_COMPONENT_PATH },
};
