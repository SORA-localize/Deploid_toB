import type { ServerProps } from 'payload';
import { Link } from '@payloadcms/ui';
import { asAdminUser, isContentDraftWriterOrAboveUser } from '@/lib/payload/access';
import { adminPublishMessageKey } from '@/lib/payload/adminPublishMessages';

/**
 * `payload.config.ts`の`admin.components.afterNavLinks`に登録するnavリンク。
 * `content-draft-writer`未満のロールには何も描画しない（`/admin/draft-list`自体も
 * `DraftListView.tsx`がserver側で同じ判定をブロックするので、ここは主に発見しやすさの制御）。
 */
export function DraftListNavLink({ user, i18n }: ServerProps) {
  if (!isContentDraftWriterOrAboveUser(asAdminUser(user ?? null))) return null;

  const label = (i18n.t as unknown as (key: string) => string)(adminPublishMessageKey('draft-list-nav-label'));

  return (
    <Link href="/admin/draft-list" className="nav__link">
      {label}
    </Link>
  );
}

export default DraftListNavLink;
