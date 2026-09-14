import type { AdminViewServerProps } from 'payload';
import { Gutter } from '@payloadcms/ui';
import { asAdminUser, isContentDraftWriterOrAboveUser, isContentPublisherOrAboveUser } from '@/lib/payload/access';
import { adminPublishMessageKey, type AdminPublishMessageKey } from '@/lib/payload/adminPublishMessages';
import { listDraftDocumentsForAdmin } from '@/lib/payload/listDraftDocumentsForAdmin';
import { DraftListTable } from './DraftListTable';

/**
 * `/admin/draft-list` のroot view（`payload.config.ts`の`admin.components.views.draftList`）。
 *
 * Server Componentなので`initPageResult.req.payload`/`req.user`をそのまま使える
 * （API routeと違い`getPayload()`を自前で呼ぶ必要が無い）。
 *
 * role判定はここ（server側）で行う。`PublishFromApproval.tsx`が「`hasPublishPermission`は
 * 当てにならないのでroleで判定する」としているのと同じ理由で、client側だけの判定に
 * しない——公開操作UI自体を権限の無い利用者へ最初から渡さない。
 */
export async function DraftListView({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult;
  const user = asAdminUser(req.user);

  const translate = (code: AdminPublishMessageKey, vars?: Record<string, string | undefined>) =>
    (req.i18n.t as unknown as (key: string, vars?: Record<string, unknown>) => string)(adminPublishMessageKey(code), vars);

  if (!isContentDraftWriterOrAboveUser(user)) {
    return (
      <Gutter>
        <h1>{translate('draft-list-heading')}</h1>
        <p>{translate('draft-list-no-permission')}</p>
      </Gutter>
    );
  }

  const items = await listDraftDocumentsForAdmin({ payload: req.payload });
  const canPublish = isContentPublisherOrAboveUser(user);

  return (
    <Gutter>
      <h1>{translate('draft-list-heading')}</h1>
      <DraftListTable initialItems={items} canPublish={canPublish} />
    </Gutter>
  );
}

export default DraftListView;
