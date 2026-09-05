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
  manufacturersDomesticDistributorsFieldLabels,
  manufacturersFieldLabels,
  manufacturersHeadquartersFieldLabels,
} from '../lib/payload/adminFieldLabels';
import { partitionFieldsByName, withSidebarPosition } from '../lib/payload/adminFieldLayout';
import {
  manufacturerCompanyStatusSelectOptions,
  manufacturerCompanyTypeSelectOptions,
  manufacturerJapanPresenceSelectOptions,
} from '../lib/payload/adminSelectLabels';
import { ADMIN_PUBLISH_INTENT_FIELD } from '../lib/payload/adminPublishIntent';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { mapPayloadManufacturerToDomain } from '../lib/content/payloadMappers';
import type { Manufacturer } from '../lib/content/domainTypes';
import { contentPublishAdminComponents } from '../lib/payload/adminPublishComponents';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

function validateManufacturerForPublish(manufacturer: Manufacturer): void {
  assertBaseRecordPublishable(manufacturer);
  const missing: string[] = [];
  if (!manufacturer.name) missing.push('name');
  if (!manufacturer.country) missing.push('country');
  if (!manufacturer.companyType) missing.push('companyType');
  if (!manufacturer.japanPresence) missing.push('japanPresence');
  if (!manufacturer.website) missing.push('website');
  if (!manufacturer.description) missing.push('description');
  if (missing.length > 0) {
    throw new PublishValidationError(missing, 'manufacturers');
  }
}

/**
 * Task 6 POC（`docs/decisions/admin-field-layout-v1.md`）: 運用頻度で3層に分けた配置。
 * `sidebar`はTier3（滅多に触らない運用メタ）、tabはTier1（基本情報）→Tier2（画像・出典）→
 * Tier3（国内取引・レガシー）の順。**名前の集合はこのファイル内で閉じており、
 * 抜けがあれば`assertAllManufacturersFieldsArePlaced`が起動時に検出する**。
 */
const SIDEBAR_FIELD_NAMES = ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'featuredRank', 'nextReviewBy'] as const;
const BASIC_INFO_TAB_FIELD_NAMES = [
  'name',
  'nameJa',
  'summary',
  'description',
  'country',
  'hqCity',
  'headquarters',
  'foundedYear',
  'companyType',
  'companyStatus',
  'japanPresence',
  'website',
  'contactUrl',
] as const;
const MEDIA_AND_SOURCES_TAB_FIELD_NAMES = ['heroImage', 'logos', 'sources', 'reliability', 'seo'] as const;
const LEGACY_DISTRIBUTION_TAB_FIELD_NAMES = [
  'domesticDistributors',
  'distributorNote',
  'supportNote',
  'procurementNote',
  'vendorRiskNote',
] as const;

const manufacturersAllFields = applyAdminFieldLabels(
  [
    ...baseContentFields(),
    ...baseRecordContentFields(),
    { name: 'name', type: 'text', required: true },
    { name: 'nameJa', type: 'text' },
    {
      name: 'companyType',
      type: 'select',
      required: true,
      options: manufacturerCompanyTypeSelectOptions,
    },
    {
      name: 'companyStatus',
      type: 'select',
      defaultValue: 'active',
      options: manufacturerCompanyStatusSelectOptions,
    },
    { name: 'country', type: 'text', required: true },
    { name: 'hqCity', type: 'text' },
    {
      name: 'headquarters',
      type: 'group',
      fields: applyAdminFieldLabels(
        [
          { name: 'lat', type: 'number' },
          { name: 'lng', type: 'number' },
        ],
        manufacturersHeadquartersFieldLabels,
      ),
    },
    { name: 'foundedYear', type: 'number' },
    { name: 'website', type: 'text', required: true },
    {
      name: 'logos',
      type: 'json',
      admin: { description: 'ManufacturerLogos（symbol/wordmark/combined、それぞれImageAsset形）。' },
    },
    { name: 'contactUrl', type: 'text' },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'japanPresence',
      type: 'select',
      required: true,
      options: manufacturerJapanPresenceSelectOptions,
    },
    {
      name: 'domesticDistributors',
      type: 'array',
      admin: {
        description:
          '移行完了後に削除予定（data-architecture-redesign-v1.md §11: distributors collectionへ移す）。当面は表示互換のため残す。',
      },
      fields: applyAdminFieldLabels(
        [
          { name: 'name', type: 'text', required: true },
          { name: 'website', type: 'text' },
          { name: 'sourceUrl', type: 'text' },
          { name: 'checkedAt', type: 'text', admin: { description: '日付のみの値。timestamptz にすると import 時の server TZ で日付がずれるため text（Task 5、詳細は lib/payload/access.ts の sourcesField）。' } },
          { name: 'note', type: 'textarea' },
        ],
        manufacturersDomesticDistributorsFieldLabels,
      ),
    },
    { name: 'distributorNote', type: 'textarea' },
    { name: 'supportNote', type: 'textarea' },
    { name: 'procurementNote', type: 'textarea' },
    { name: 'vendorRiskNote', type: 'textarea' },
    { name: 'featuredRank', type: 'number' },
  ],
  manufacturersFieldLabels,
);

const { matched: sidebarFields, rest: afterSidebar } = partitionFieldsByName(manufacturersAllFields, SIDEBAR_FIELD_NAMES);
const { matched: basicInfoTabFields, rest: afterBasicInfo } = partitionFieldsByName(afterSidebar, BASIC_INFO_TAB_FIELD_NAMES);
const { matched: mediaTabFields, rest: afterMedia } = partitionFieldsByName(afterBasicInfo, MEDIA_AND_SOURCES_TAB_FIELD_NAMES);
const { matched: legacyTabFields, rest: unplacedFields } = partitionFieldsByName(afterMedia, LEGACY_DISTRIBUTION_TAB_FIELD_NAMES);

/**
 * `unplacedFields`は`admin.hidden`な`adminPublishIntentField()`だけのはず
 * （表示場所を持たない）。それ以外が残っていたら、上記4つの名前リストへの追加漏れ——
 * 編集画面のどこにも表示されない field が生まれるので、起動時に気づけるようにする。
 */
const unexpectedlyUnplacedFields = unplacedFields.filter(
  (field) => (field as { name?: string }).name !== ADMIN_PUBLISH_INTENT_FIELD,
);
if (unexpectedlyUnplacedFields.length > 0) {
  throw new Error(
    `Manufacturers admin field layout: unplaced field(s) — add to a tab/sidebar name list: ${unexpectedlyUnplacedFields
      .map((f) => (f as { name?: string }).name)
      .join(', ')}`,
  );
}

export const Manufacturers: CollectionConfig = {
  slug: 'manufacturers',
  admin: { useAsTitle: 'name', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...unplacedFields,
    ...withSidebarPosition(sidebarFields),
    {
      type: 'tabs',
      tabs: [
        { label: { ja: '基本情報', en: 'Basic info' }, fields: basicInfoTabFields },
        { label: { ja: '画像・出典', en: 'Media & sources' }, fields: mediaTabFields },
        { label: { ja: '国内取引（レガシー）', en: 'Domestic distribution (legacy)' }, fields: legacyTabFields },
      ],
    },
  ],
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      createPublishGateHook({
        collectionSlug: 'manufacturers',
        mapToDomain: async (candidate) => mapPayloadManufacturerToDomain(candidate as never),
        validateForPublish: (domain) => validateManufacturerForPublish(domain as Manufacturer),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'manufacturers' }),
    ],
    // Task 7 Step 3: publish後にpublicキャッシュを無効化する通知。
    afterChange: [createRevalidationAfterChangeHook('manufacturers')],
  },
};
