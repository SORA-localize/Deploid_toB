import type { CollectionConfig } from 'payload';
import {
  assertBaseRecordPublishable,
  baseContentFields,
  baseRecordContentFields,
  contentCollectionAccess,
  contentCollectionBeforeOperationHooks,
  contentVersionsConfig,
  createPublishGateHook,
  createVersionRetentionGuardBeforeChangeHook,
  PublishValidationError, } from '../lib/payload/access';
import {
  applyAdminFieldLabels,
  robotsComparisonFieldLabels,
  robotsFieldLabels,
  robotsLoadRatingsFieldLabels,
  robotsPriceOffersFieldLabels,
} from '../lib/payload/adminFieldLabels';
import {
  robotCategorySelectOptions,
  robotDeploymentStageSelectOptions,
  robotJapanAvailabilitySelectOptions,
  robotLoadRatingKindSelectOptions,
  robotLoadRatingScopeSelectOptions,
  robotPriceOfferChannelSelectOptions,
  robotPriceOfferTaxStatusSelectOptions,
  robotProcurementModelSelectOptions,
} from '../lib/payload/adminSelectLabels';
import { createRouteRegistryHooks } from '../lib/payload/routeRegistry';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { mapPayloadRobotToDomain } from '../lib/content/payloadMappers';
import type { Robot } from '../lib/content/domainTypes';
import { contentPublishAdminComponents } from '../lib/payload/adminPublishComponents';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

function validateRobotForPublish(robot: Robot): void {
  assertBaseRecordPublishable(robot);
  const missing: string[] = [];
  if (!robot.name) missing.push('name');
  if (!robot.manufacturerId) missing.push('manufacturerId');
  if (!robot.category) missing.push('category');
  if (!robot.deploymentStage) missing.push('deploymentStage');
  if (!robot.japanAvailability) missing.push('japanAvailability');
  if (missing.length > 0) {
    throw new PublishValidationError(missing, 'robots');
  }
}

const routeRegistryHooks = createRouteRegistryHooks('robots');

/**
 * `data/types.ts` の旧 `Robot` interfaceをimportせず独立schemaとして書く（brief）。
 * 2026-08-09に削除された4フィールド（DEC-S05・S06、`robot-data-import-plan-v1.md`）:
 * `buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote` は含めない。
 * `comparison` は `/compare` が実表示に使うため維持する。
 */
export const Robots: CollectionConfig = {
  slug: 'robots',
  admin: { useAsTitle: 'name', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: applyAdminFieldLabels(
    [
      ...baseContentFields(),
      ...baseRecordContentFields(),
      { name: 'name', type: 'text', required: true },
      { name: 'nameJa', type: 'text' },
      {
        name: 'manufacturerId',
        type: 'relationship',
        // `validateRobotForPublish` が公開時に必須としている。元の定義は relationship 一律で
        // `required: false` を明示していたが（`seriesId` / `supersededById` と同じ書き方）、
        // それだと編集画面に必須の印が出ず、公開して初めて不足を知らされる。
        // 下書き保存は `versions.drafts.validate: false` により検証を飛ばすので影響しない。
        required: true,
        relationTo: 'manufacturers',
      },
      {
        name: 'seriesId',
        type: 'relationship',
        relationTo: 'robot-series',
        required: false,
      },
      {
        name: 'category',
        type: 'select',
        required: true,
        options: robotCategorySelectOptions,
      },
      { name: 'description', type: 'textarea' },
      { name: 'featuredRank', type: 'number' },
      {
        name: 'deploymentStage',
        type: 'select',
        required: true,
        options: robotDeploymentStageSelectOptions,
      },
      {
        name: 'supersededById',
        type: 'relationship',
        relationTo: 'robots',
        required: false,
      },
      {
        name: 'specs',
        type: 'json',
        // JSON形はspec項目keyをキーにした値のRecord。項目定義（単位・ラベル・グループ分け）の
        // 正本は lib/specSchema.ts の specSchema 配列——新しい項目を追加する場合はそちらを編集する。
        admin: {
          description: {
            ja: 'スペック値（項目名ごとのオブジェクト）。ロボット詳細ページの「仕様」「技術仕様」「詳細仕様」欄に表示されます。',
            en: 'Spec values, keyed by item name. Shown in the "Specifications" sections of the robot detail page.',
          },
        },
      },
      {
        name: 'procurementModels',
        type: 'select',
        hasMany: true,
        options: robotProcurementModelSelectOptions,
      },
      {
        name: 'priceOffers',
        type: 'array',
        fields: applyAdminFieldLabels(
          [
            {
              name: 'channel',
              type: 'select',
              required: true,
              options: robotPriceOfferChannelSelectOptions,
            },
            { name: 'display', type: 'text', required: true },
            { name: 'amount', type: 'number' },
            { name: 'currency', type: 'text' },
            { name: 'taxStatus', type: 'select', options: robotPriceOfferTaxStatusSelectOptions },
            { name: 'variant', type: 'text' },
            { name: 'sellerName', type: 'text' },
            { name: 'sourceUrl', type: 'text', required: true },
          ],
          robotsPriceOffersFieldLabels,
        ),
      },
      {
        name: 'loadRatings',
        type: 'array',
        fields: applyAdminFieldLabels(
          [
            {
              name: 'scope',
              type: 'select',
              required: true,
              options: robotLoadRatingScopeSelectOptions,
            },
            { name: 'rating', type: 'select', required: true, options: robotLoadRatingKindSelectOptions },
            { name: 'kg', type: 'number', required: true },
            { name: 'condition', type: 'text' },
            { name: 'variant', type: 'text' },
            { name: 'sourceUrl', type: 'text', required: true },
          ],
          robotsLoadRatingsFieldLabels,
        ),
      },
      {
        name: 'fieldEvidence',
        type: 'json',
        // JSON形はspec項目key（lib/specSchema.ts）または`priceOffers`/`loadRatings`のkeyを
        // キーにした、出典URL配列のRecord。
        admin: {
          description: {
            ja: '各スペック項目の根拠となる出典URL。ロボット詳細ページの仕様欄で、各項目に付く出典リンクとして表示されます。',
            en: 'Source URLs backing each spec value. Shown as the citation links attached to each spec row on the robot detail page.',
          },
        },
      },
      { name: 'usageExampleSourceUrls', type: 'text', hasMany: true },
      {
        name: 'japanAvailability',
        type: 'select',
        required: true,
        options: robotJapanAvailabilitySelectOptions,
      },
      { name: 'distributorJapan', type: 'text' },
      { name: 'supportNote', type: 'textarea' },
      {
        name: 'images',
        type: 'json',
        // JSON形の内訳: role名（hero/transparent/side/inOperation/scale/endEffector/mobility）を
        // キーに、それぞれ`heroImage`と同じ形のImageAssetオブジェクトを持つ（省略可）。
        // `lib/robotMedia.ts`の`ROBOT_IMAGE_ROLE_ORDER`と対応。
        admin: {
          description: {
            ja: '画像（role別、いずれも任意）。ロボット詳細ページの画像ギャラリーに表示されます。',
            en: 'Images by role (all optional). Shown in the image gallery on the robot detail page.',
          },
        },
      },
      { name: 'industryTags', type: 'text', hasMany: true },
      { name: 'taskTags', type: 'text', hasMany: true },
      {
        name: 'comparison',
        type: 'group',
        // 非推奨: /compare の作り替えが決まるまで維持する（削除しない）。
        admin: {
          description: {
            ja: '比較情報（強み・制約・向く/向かない用途）。/robots/[slug]ではなく「/compare」ページに表示されます。今後作り替え予定ですが、現時点では入力してください。',
            en: 'Comparison info (strengths / constraints / fit). Shown on the /compare page, not the robot detail page. Scheduled for a future rework, but should still be filled in for now.',
          },
        },
        fields: applyAdminFieldLabels(
          [
            { name: 'strengths', type: 'text', hasMany: true },
            { name: 'constraints', type: 'text', hasMany: true },
            { name: 'bestFit', type: 'text', hasMany: true },
            { name: 'notFit', type: 'text', hasMany: true },
          ],
          robotsComparisonFieldLabels,
        ),
      },
    ],
    robotsFieldLabels,
  ),
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      createPublishGateHook({
        collectionSlug: 'robots',
        mapToDomain: (candidate, req) => mapPayloadRobotToDomain(candidate as never, req.payload),
        validateForPublish: (domain) => validateRobotForPublish(domain as Robot),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'robots' }),
    ],
    // Task 7 Step 3: 既存のroute registry afterChangeへ、revalidation通知を追加する形で足す
    // （上書きしない — `routeRegistryHooks.afterChange` を欠かすとslug解決が壊れる）。
    afterChange: [...routeRegistryHooks.afterChange, createRevalidationAfterChangeHook('robots')],
    beforeDelete: routeRegistryHooks.beforeDelete,
  },
};
