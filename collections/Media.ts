import type { Access, CollectionConfig } from 'payload';
import { asAdminUser, isContentDraftWriterOrAboveUser, isPlatformAdmin } from '../lib/payload/access';

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
        { name: 'checkedAt', type: 'text', required: true, admin: { description: '日付のみの値。timestamptz にすると import 時の server TZ で日付がずれるため text（Task 5、詳細は lib/payload/access.ts の sourcesField）。' } },
        { name: 'rightsHolder', type: 'text' },
        { name: 'licenseUrl', type: 'text' },
        { name: 'permissionNote', type: 'textarea' },
      ],
    },
    { name: 'credit', type: 'text' },
    { name: 'sourceUrl', type: 'text' },
  ],
};
