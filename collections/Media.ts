import type { Access, CollectionConfig } from 'payload';
import { asAdminUser, isContentDraftWriterOrAboveUser, isPlatformAdmin } from '../lib/payload/access';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';

const canWriteMedia: Access = ({ req }) => isContentDraftWriterOrAboveUser(asAdminUser(req.user));

/**
 * public media store（Task 0で確定、`docs/reference/content-platform-resources-v1.md` #2）。
 * ファイル実体は公開URLを持つため、Payload側のread accessも常に公開する（未認証readを拒否しても
 * blob URL自体は公開のままで、保護にならないため）。upload adapterの登録は
 * `payload.config.ts` の `plugins`（`@payloadcms/storage-vercel-blob`）で行い、ここでは
 * collection定義（`upload: true` と付随field）だけを持つ。
 *
 * `stableId` は正規化した既存 `src` から決定的に生成する（brief）。生成ロジック自体は
 * import時（Task 4以降）の責務で、ここではuniqueなidentity fieldとしてのschemaだけ持つ。
 */
export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  admin: { useAsTitle: 'alt' },
  access: {
    read: () => true,
    create: canWriteMedia,
    update: canWriteMedia,
    delete: isPlatformAdmin,
  },
  hooks: {
    // Task 7 Step 3: publish gateを持たない collection（mediaはdraft/publish状態を持たない
    // uploadの実体そのもの）だが、rights/altの変更が埋め込み表示（Robot一覧のサムネ等）に
    // 影響するため、同じ通知を足す。
    afterChange: [createRevalidationAfterChangeHook('media')],
  },
  fields: [
    { name: 'stableId', type: 'text', required: true, unique: true, index: true },
    { name: 'alt', type: 'text', required: true },
    {
      name: 'rights',
      type: 'group',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          options: [
            'own',
            'licensed',
            'commercial-permitted',
            'reference-attributed',
            'permission-requested',
            'prototype-only',
            'blocked',
          ],
        },
        {
          name: 'sourceType',
          type: 'select',
          required: true,
          options: ['own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown'],
        },
        {
          name: 'checkedAt',
          type: 'text',
          required: true,
          // text型の理由: lib/payload/access.ts の sourcesField 冒頭コメント参照
          // （日付のみの値をtimestamptzにするとimport時のserver TZで日付がずれるため）。
          admin: {
            description: {
              ja: 'この画像の権利状況を確認した日付。ページには表示されません（社内の権利管理用）。',
              en: "The date this file's rights status was last confirmed. Not shown publicly — for internal rights tracking.",
            },
          },
        },
        { name: 'rightsHolder', type: 'text' },
        { name: 'licenseUrl', type: 'text' },
        { name: 'permissionNote', type: 'textarea' },
      ],
    },
    { name: 'credit', type: 'text' },
    { name: 'sourceUrl', type: 'text' },
  ],
};
