import type { Access, CollectionConfig, FieldAccess, PayloadRequest } from 'payload';

/**
 * 正式な role enum は4値だけ。旧称 `editor` / `publisher` / `admin` は表示ラベルに限り、
 * 保存値・API入力には使わない（`docs/plans/content-platform-migration-plan-v1.md` Task 2）。
 */
export type AdminRole = 'content-reader' | 'content-draft-writer' | 'content-publisher' | 'platform-admin';

interface AuthenticatedAdminUser {
  id: string | number;
  role?: AdminRole;
}

function asAdminUser(user: PayloadRequest['user']): AuthenticatedAdminUser | null {
  if (!user) return null;
  return user as unknown as AuthenticatedAdminUser;
}

function isPlatformAdminUser(user: AuthenticatedAdminUser | null): boolean {
  return Boolean(user && user.role === 'platform-admin');
}

/** admins コレクションの現在の総件数。bootstrap判定に使う。 */
async function countAdmins(req: PayloadRequest): Promise<number> {
  const result = await req.payload.count({
    collection: 'admins',
    overrideAccess: true,
  });
  return result.totalDocs;
}

/**
 * 1人目の管理者作成（bootstrap）は admins が0件の間だけ、未認証でも許可する。
 * admins が1件以上ある場合は platform-admin だけが新規作成できる。
 */
export const canBootstrapFirstAdminOrPlatformAdmin: Access = async ({ req }) => {
  const user = asAdminUser(req.user);
  if (isPlatformAdminUser(user)) return true;
  const total = await countAdmins(req);
  return total === 0;
};

/**
 * 自分自身のレコードは誰でも read/update 対象にできる。platform-admin は全件が対象。
 * それ以外（未認証）は拒否する。
 */
export const selfOrPlatformAdmin: Access = ({ req }) => {
  const user = asAdminUser(req.user);
  if (!user) return false;
  if (isPlatformAdminUser(user)) return true;
  return { id: { equals: user.id } };
};

/**
 * delete は platform-admin だけに許可する。かつ、残っている platform-admin が1人だけの場合は
 * その1件（＝自分自身のはず）を削除対象から除外し、「最後の1人」を消せないようにする。
 */
export const platformAdminExceptLastPlatformAdmin: Access = async ({ req }) => {
  const user = asAdminUser(req.user);
  if (!isPlatformAdminUser(user)) return false;

  const { docs } = await req.payload.find({
    collection: 'admins',
    where: { role: { equals: 'platform-admin' } },
    limit: 2,
    depth: 0,
    overrideAccess: true,
  });

  if (docs.length <= 1) {
    const lastAdminId = docs[0]?.id;
    // platform-admin が理論上0件になることは通常起きないが、安全側でfall throughせず拒否する。
    if (lastAdminId === undefined) return false;
    return { id: { not_equals: lastAdminId } };
  }

  return true;
};

export const isPlatformAdmin: Access = ({ req }) => isPlatformAdminUser(asAdminUser(req.user));

/**
 * role の update は platform-admin だけに許可する。加えて、対象docが現在 platform-admin で、
 * 送信された新しい値が platform-admin ではない（＝降格）場合、それが最後の1人の platform-admin
 * なら拒否する。自分自身を降格するケースも含む（brief: 「自分自身を含む最後のplatform-adminの
 * 削除・降格を拒否する」）。
 */
export const canUpdateRoleUnlessLastPlatformAdmin: FieldAccess = async ({ req, data, doc }) => {
  const user = asAdminUser(req.user);
  if (!isPlatformAdminUser(user)) return false;

  const currentRole = (doc as { role?: AdminRole } | undefined)?.role;
  const incomingRole = (data as { role?: AdminRole } | undefined)?.role;
  const isDemotingFromPlatformAdmin =
    currentRole === 'platform-admin' && incomingRole !== undefined && incomingRole !== 'platform-admin';

  if (!isDemotingFromPlatformAdmin) return true;

  const { totalDocs } = await req.payload.count({
    collection: 'admins',
    where: { role: { equals: 'platform-admin' } },
    overrideAccess: true,
  });

  // 残り1人（＝このdocのはず）を降格させようとしている場合は拒否する。
  return totalDocs > 1;
};

/**
 * role フィールドへ明示的な値を書き込めるのは、bootstrap中（admins 0件）か platform-admin だけ。
 * それ以外のリクエストが送った role は無視され、defaultValue（content-draft-writer）にフォール
 * バックする。1人目を実際に platform-admin へ強制するのは Admins.hooks.beforeValidate。
 */
export const canSetRoleOnBootstrapOrPlatformAdmin: FieldAccess = async ({ req }) => {
  const user = asAdminUser(req.user);
  if (isPlatformAdminUser(user)) return true;
  const total = await countAdmins(req);
  return total === 0;
};

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    // bootstrap時はadmins=0件の場合だけ1人目を作成可能。以後はplatform-adminだけ。
    create: canBootstrapFirstAdminOrPlatformAdmin,
    read: selfOrPlatformAdmin,
    update: selfOrPlatformAdmin,
    delete: platformAdminExceptLastPlatformAdmin,
    unlock: isPlatformAdmin,
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [
      async ({ operation, data, req }) => {
        if (operation !== 'create' || !data) return data;
        const total = await countAdmins(req);
        if (total === 0) {
          // 1人目は必ず platform-admin。role field access とは独立に、ここで強制する。
          return { ...data, role: 'platform-admin' satisfies AdminRole };
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      // 1人目はbeforeValidateでplatform-adminへ強制する。2人目以降の既定値。
      defaultValue: 'content-draft-writer',
      options: [
        { label: 'Content Reader', value: 'content-reader' },
        { label: 'Content Draft Writer', value: 'content-draft-writer' },
        { label: 'Content Publisher', value: 'content-publisher' },
        { label: 'Platform Admin', value: 'platform-admin' },
      ],
      access: {
        create: canSetRoleOnBootstrapOrPlatformAdmin,
        update: canUpdateRoleUnlessLastPlatformAdmin,
      },
    },
  ],
};
