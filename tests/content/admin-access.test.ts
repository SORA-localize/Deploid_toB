import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';

/**
 * `collections/Admins.ts` の access control を、モックではなく実 Payload Local API + 実 Postgres
 * に対して検証する（brief: 「実Payload APIで確認する」）。DATABASE_URL / PAYLOAD_SECRET は
 * このプロセスの環境変数から読む（CIはservice container、ローカルは開発用DBを想定）。
 *
 * テストは意図的に1つの `describe` 内で順番に実行する（vitestはfile内でdefaultで直列実行）。
 * 「admins 0件からの1人目bootstrap」は状態依存で1回しか意味を持たないため、
 * 順序を管理できる構造にしている。
 */

const PASSWORD = 'Str0ngPassw0rd!23';

async function loginAs(payload: Payload, email: string, password: string) {
  const result = await payload.login({
    collection: 'admins',
    data: { email, password },
  });
  if (!result.user) {
    throw new Error(`login failed for ${email}`);
  }
  return result.user;
}

describe('Admins collection access control (real Payload Local API)', () => {
  let payload: Payload;

  beforeAll(async () => {
    payload = await getPayload({ config });
    // 毎回クリーンな状態から始める。既存のadmins docを全消去する（テスト専用DBのみを対象にする前提）。
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
  });

  afterAll(async () => {
    await payload.destroy();
  });

  it('has zero admins before bootstrap', async () => {
    const { totalDocs } = await payload.count({ collection: 'admins', overrideAccess: true });
    expect(totalDocs).toBe(0);
  });

  it('bootstraps exactly one first admin as platform-admin, even if a different role is requested', async () => {
    // 未認証。admins が0件のときだけ許可される唯一のcreateパス。
    // role: 'content-reader' を明示的に送っても、beforeValidate フックが platform-admin へ強制する。
    const created = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: {
        email: 'owner@example.com',
        password: PASSWORD,
        role: 'content-reader',
      },
    });

    expect(created.role).toBe('platform-admin');

    const { totalDocs } = await payload.count({ collection: 'admins', overrideAccess: true });
    expect(totalDocs).toBe(1);
  });

  it('rejects unauthenticated create once at least one admin exists', async () => {
    await expect(
      payload.create({
        collection: 'admins',
        overrideAccess: false,
        data: {
          email: 'intruder@example.com',
          password: PASSWORD,
          role: 'content-draft-writer',
        },
      }),
    ).rejects.toThrow();

    const { totalDocs } = await payload.count({ collection: 'admins', overrideAccess: true });
    expect(totalDocs).toBe(1);
  });

  it('lets a platform-admin create a new admin with an arbitrary role', async () => {
    const platformAdmin = await loginAs(payload, 'owner@example.com', PASSWORD);

    const created = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      user: platformAdmin,
      data: {
        email: 'writer@example.com',
        password: PASSWORD,
        role: 'content-draft-writer',
      },
    });

    expect(created.role).toBe('content-draft-writer');
  });

  it('rejects admin creation by a non-platform-admin (content-draft-writer)', async () => {
    const draftWriter = await loginAs(payload, 'writer@example.com', PASSWORD);

    await expect(
      payload.create({
        collection: 'admins',
        overrideAccess: false,
        user: draftWriter,
        data: {
          email: 'another-writer@example.com',
          password: PASSWORD,
          role: 'content-draft-writer',
        },
      }),
    ).rejects.toThrow();

    const { totalDocs } = await payload.count({ collection: 'admins', overrideAccess: true });
    expect(totalDocs).toBe(2);
  });

  it('rejects a draft-writer self-escalating their own role to platform-admin', async () => {
    const draftWriter = await loginAs(payload, 'writer@example.com', PASSWORD);

    await payload
      .update({
        collection: 'admins',
        id: draftWriter.id,
        overrideAccess: false,
        user: draftWriter,
        data: { role: 'platform-admin' },
      })
      .catch(() => undefined); // フィールド単位で無視される実装・例外を投げる実装の両方を許容する

    const reloaded = await payload.findByID({
      collection: 'admins',
      id: draftWriter.id,
      overrideAccess: true,
    });
    expect(reloaded.role).toBe('content-draft-writer');
  });

  it('rejects a draft-writer escalating a different admin to platform-admin', async () => {
    const platformAdmin = await loginAs(payload, 'owner@example.com', PASSWORD);
    const thirdAdmin = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      user: platformAdmin,
      data: {
        email: 'reader@example.com',
        password: PASSWORD,
        role: 'content-reader',
      },
    });

    const draftWriter = await loginAs(payload, 'writer@example.com', PASSWORD);

    await payload
      .update({
        collection: 'admins',
        id: thirdAdmin.id,
        overrideAccess: false,
        user: draftWriter,
        data: { role: 'platform-admin' },
      })
      .catch(() => undefined);

    const reloaded = await payload.findByID({
      collection: 'admins',
      id: thirdAdmin.id,
      overrideAccess: true,
    });
    expect(reloaded.role).toBe('content-reader');
  });

  it('rejects admin deletion by a non-platform-admin', async () => {
    const draftWriter = await loginAs(payload, 'writer@example.com', PASSWORD);
    const thirdAdmin = await payload.find({
      collection: 'admins',
      where: { email: { equals: 'reader@example.com' } },
      overrideAccess: true,
      limit: 1,
    });
    const thirdAdminId = thirdAdmin.docs[0]?.id;
    expect(thirdAdminId).toBeDefined();

    await expect(
      payload.delete({
        collection: 'admins',
        id: thirdAdminId as string | number,
        overrideAccess: false,
        user: draftWriter,
      }),
    ).rejects.toThrow();
  });

  it('lets a platform-admin delete a non-platform-admin admin', async () => {
    const platformAdmin = await loginAs(payload, 'owner@example.com', PASSWORD);
    const thirdAdmin = await payload.find({
      collection: 'admins',
      where: { email: { equals: 'reader@example.com' } },
      overrideAccess: true,
      limit: 1,
    });
    const thirdAdminId = thirdAdmin.docs[0]?.id;
    expect(thirdAdminId).toBeDefined();

    await payload.delete({
      collection: 'admins',
      id: thirdAdminId as string | number,
      overrideAccess: false,
      user: platformAdmin,
    });

    const { totalDocs } = await payload.count({
      collection: 'admins',
      where: { email: { equals: 'reader@example.com' } },
      overrideAccess: true,
    });
    expect(totalDocs).toBe(0);
  });

  it('rejects demoting the last remaining platform-admin (including self-demotion)', async () => {
    const platformAdmin = await loginAs(payload, 'owner@example.com', PASSWORD);

    await payload
      .update({
        collection: 'admins',
        id: platformAdmin.id,
        overrideAccess: false,
        user: platformAdmin,
        data: { role: 'content-reader' },
      })
      .catch(() => undefined);

    const reloaded = await payload.findByID({
      collection: 'admins',
      id: platformAdmin.id,
      overrideAccess: true,
    });
    expect(reloaded.role).toBe('platform-admin');
  });

  it('rejects deleting the last remaining platform-admin (including self-deletion)', async () => {
    const platformAdmin = await loginAs(payload, 'owner@example.com', PASSWORD);

    await expect(
      payload.delete({
        collection: 'admins',
        id: platformAdmin.id,
        overrideAccess: false,
        user: platformAdmin,
      }),
    ).rejects.toThrow();

    const { totalDocs } = await payload.count({ collection: 'admins', overrideAccess: true });
    expect(totalDocs).toBe(2); // owner (platform-admin) + writer (content-draft-writer)
  });

  it('allows demoting a platform-admin when another platform-admin remains', async () => {
    const platformAdmin = await loginAs(payload, 'owner@example.com', PASSWORD);

    const secondPlatformAdmin = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      user: platformAdmin,
      data: {
        email: 'second-owner@example.com',
        password: PASSWORD,
        role: 'platform-admin',
      },
    });
    expect(secondPlatformAdmin.role).toBe('platform-admin');

    // 2人いる状態なら、片方を降格しても「最後の1人」ではないので許可される。
    const demoted = await payload.update({
      collection: 'admins',
      id: platformAdmin.id,
      overrideAccess: false,
      user: platformAdmin,
      data: { role: 'content-publisher' },
    });
    expect(demoted.role).toBe('content-publisher');

    // これで second-owner が最後の1人になった。降格・削除は再び拒否される。
    await payload
      .update({
        collection: 'admins',
        id: secondPlatformAdmin.id,
        overrideAccess: false,
        user: secondPlatformAdmin,
        data: { role: 'content-reader' },
      })
      .catch(() => undefined);

    const reloaded = await payload.findByID({
      collection: 'admins',
      id: secondPlatformAdmin.id,
      overrideAccess: true,
    });
    expect(reloaded.role).toBe('platform-admin');
  });
});
