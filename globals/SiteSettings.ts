import type { GlobalConfig } from 'payload';
import { canWriteDraft, createGlobalPublishGateHook, publishedGlobalOrAuthenticated } from '../lib/payload/access';

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
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'defaultSeo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
      ],
    },
    {
      name: 'announcementBanner',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'message', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
};
