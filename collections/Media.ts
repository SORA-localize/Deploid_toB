import type { Access, CollectionConfig } from 'payload';
import { asAdminUser, isContentDraftWriterOrAboveUser, isPlatformAdmin } from '../lib/payload/access';
import { applyAdminFieldLabels, mediaFieldLabels, rightsMetaFieldLabels } from '../lib/payload/adminFieldLabels';
import { rightsSourceTypeSelectOptions, rightsStatusSelectOptions } from '../lib/payload/adminSelectLabels';
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
  admin: {
    useAsTitle: 'alt',
    description: {
      ja: 'ここでアップロードすると公開URLが発行されます。そのURLを他collection（Manufacturers.logos、Robots.images、heroImage等）の画像fieldへ手動で貼り付けて使います。このcollection自体をURL以外の形で参照している箇所はありません。',
      en: 'Uploading here issues a public URL. Paste that URL into another collection’s image field (Manufacturers.logos, Robots.images, heroImage, etc.) to use it. Nothing references this collection except by copying that URL.',
    },
  },
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
  fields: applyAdminFieldLabels(
    [
      { name: 'stableId', type: 'text', required: true, unique: true, index: true },
      { name: 'alt', type: 'text', required: true },
      {
        name: 'rights',
        type: 'group',
        admin: {
          description: {
            ja: 'この権利情報はこのMediaレコード自身にのみ保存され、貼り付け先の画像field（heroImage.rights等）へは自動連携されません。表示可否は貼り付け先に入力した rights.status で判定されるため、貼り付け先でも同じ内容を入力してください。',
            en: 'This rights info is stored only on this Media record and is not copied automatically into the image field where the URL gets pasted (e.g. heroImage.rights). Display eligibility is judged from the rights.status entered at the paste destination, so enter the same info there too.',
          },
        },
        fields: applyAdminFieldLabels(
          [
            {
              name: 'status',
              type: 'select',
              required: true,
              options: rightsStatusSelectOptions,
            },
            {
              name: 'sourceType',
              type: 'select',
              required: true,
              options: rightsSourceTypeSelectOptions,
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
          rightsMetaFieldLabels,
        ),
      },
      { name: 'credit', type: 'text' },
      { name: 'sourceUrl', type: 'text' },
    ],
    mediaFieldLabels,
  ),
};
