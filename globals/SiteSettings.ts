import type { GlobalConfig } from 'payload';
import { canWriteDraft, createGlobalPublishGateHook, publishedGlobalOrAuthenticated } from '../lib/payload/access';
import {
  applyAdminFieldLabels,
  siteSettingsAnnouncementBannerFieldLabels,
  siteSettingsArticleIndexPlacementLimitsFieldLabels,
  siteSettingsDefaultSeoFieldLabels,
  siteSettingsFieldLabels,
} from '../lib/payload/adminFieldLabels';
import { createSettingsRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';

/**
 * サイト全体設定（デフォルトSEO・お知らせバナー）。個別collectionではないため
 * `stableId` / `slug` / `lifecycleStatus` は持たない（globalは常に単一document）。
 * 詳細フィールドは brief に個別指定が無いため、現行 `lib/site.ts` が持つ範囲（サイト全体の
 * メタ情報）に沿った最小構成にとどめる。将来的な拡張はTask 4以降の実利用に合わせて追加する。
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: publishedGlobalOrAuthenticated,
    update: canWriteDraft,
  },
  /**
   * 必須修正1-2（remediation group 1）: `versions: { drafts: true }` のglobalは
   * `_status: 'published'` を含むupdateをそのまま受け付ける。`access.update` だけでは
   * draft-writerのpublishを止められないため、collectionと同じくbeforeChangeのgateで塞ぐ。
   */
  hooks: {
    beforeChange: [createGlobalPublishGateHook({ globalSlug: 'site-settings' })],
    // Task 7 Step 3: publish後にpublicキャッシュを無効化する通知。
    afterChange: [createSettingsRevalidationAfterChangeHook()],
  },
  versions: { drafts: true },
  fields: applyAdminFieldLabels(
    [
      {
        name: 'defaultSeo',
        type: 'group',
        fields: applyAdminFieldLabels(
          [
            { name: 'metaTitle', type: 'text' },
            { name: 'metaDescription', type: 'textarea' },
          ],
          siteSettingsDefaultSeoFieldLabels,
        ),
      },
      {
        name: 'announcementBanner',
        type: 'group',
        fields: applyAdminFieldLabels(
          [
            { name: 'enabled', type: 'checkbox', defaultValue: false },
            { name: 'message', type: 'text' },
            { name: 'url', type: 'text' },
          ],
          siteSettingsAnnouncementBannerFieldLabels,
        ),
      },
      /**
       * 必須修正4-1（remediation group 2）: `dataAsOf` と `articleIndexPlacementLimits` を
       * ここへ持たせ、SiteSettingsを**本当にCMSへ移行する**。
       *
       * これらが無かった間、`lib/content/payloadSource.ts` は
       * `settings.dataAsOf ?? siteMeta.dataAsOf` でローカル定数へfallbackしており、
       * CONTENT_SOURCE=payload でも「Payloadに値が無い」ことをparityが検出できなかった
       * （fallbackが常に正解を返すため、parityが必ず通るtautologyになっていた）。
       *
       * `dataAsOf` が `text` なのは、値が `'2026年7月'` のような**月精度の和文表記**で、
       * ISO日付ではないため（`lib/site.ts` の `siteMeta.dataAsOf`）。`timestamptz` にすると
       * そもそも保存できず、ISO日付へ正規化すると「7月時点」という主張を日付へ書き換えて
       * しまう（`lib/payload/access.ts` の `sourcesField()` と同じ判断）。
       */
      {
        name: 'dataAsOf',
        type: 'text',
        admin: {
          description: {
            ja: '掲載件数が正しい時点（例: 2026年7月）。日精度とは限りません。「/for-manufacturers」ページのデータ基準時点として表示されます。',
            en: 'The point in time the listing counts are accurate as of (e.g. "July 2026"). Day-level precision is not required. Shown as the "data as of" note on the /for-manufacturers page.',
          },
        },
      },
      {
        name: 'articleIndexPlacementLimits',
        type: 'group',
        admin: {
          description: {
            ja: '記事一覧ページのhero/feature枠に掲載する件数の上限。トップページ・記事一覧ページの表示件数に影響します。',
            en: 'Maximum number of articles shown in the hero/feature slots on the article index page. Affects how many items appear on the home page and the article index page.',
          },
        },
        fields: applyAdminFieldLabels(
          [
            { name: 'hero', type: 'number' },
            { name: 'feature', type: 'number' },
          ],
          siteSettingsArticleIndexPlacementLimitsFieldLabels,
        ),
      },
    ],
    siteSettingsFieldLabels,
  ),
};
