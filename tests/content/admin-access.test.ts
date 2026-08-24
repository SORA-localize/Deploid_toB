import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';

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

/**
 * `beforeAll` は毎回 admins テーブルを全消去してから走る（下記）。この破壊的操作を
 * `npm run test` 経由（＝ `npm run check` 経由）で誤って共有DBに対して実行しないための
 * gateは `./testDbGuard` の `assertLocalThrowawayDatabase`（host・DB名の両方を検査する。
 * 2026-08-20のインシデント以降、host判定だけでは不十分——詳細は同ファイル参照）。
 *
 * ローカルでこのsuiteを走らせるには、`.env.local` の既定 `DATABASE_URL` を一時的に上書きし、
 * DB名にthrowaway用途だと分かる文字列（`test`/`throwaway`/`e2e`）を含む使い捨てlocal Postgres
 * を指す値を渡すこと。例:
 *   `DATABASE_URL=postgresql://postgres:<pw>@127.0.0.1:5433/deploid_admin_access_test PAYLOAD_SECRET=<any> \
 *     npx vitest run tests/content/admin-access.test.ts`
 * `.env.local` の既定DATABASE_URL（`deploid_dev`）に対して直接 `npm run test` / `npm run check` を
 * 実行すると、この gate がすぐに例外を投げて止まる（意図した挙動）。
 */

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
    assertLocalThrowawayDatabase('tests/content/admin-access.test.ts');
    payload = await getPayload({ config });
    // 毎回クリーンな状態から始める。既存のadmins docを全消去する（テスト専用DBのみを対象にする前提）。
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
  });

  afterAll(async () => {
    // beforeAll が assertLocalThrowawayDatabase() や getPayload() で失敗した場合、
    // payload は未代入のまま。その場合は素通りする(destroy対象が無い)。
    await payload?.destroy();
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

  /**
   * Task 8 Step 1: `admins` は MCP から一切exposeしない（`lib/payload/mcp.ts` の
   * `MCP_EDITABLE_COLLECTIONS` に `admins` を含めない）が、その前提として「admins自体の
   * Local API access（`collections/Admins.ts` の `selfOrPlatformAdmin` 等）が実際どう
   * 振る舞うか」を実機で確認しておく必要がある。
   *
   * **実機で確認した挙動（brief Step 1のコード例との相違点）**: brief Step 1のコード例は
   * `payload.find({ collection: 'admins', ..., user: asDraftWriter.user })` が例外を
   * throwすることを期待している。実際には Payload の document-level access は
   * `boolean` を返すか `Where` filter objectを返すかで挙動が変わる:
   *
   * - `selfOrPlatformAdmin` は非platform-adminに対して `{ id: { equals: user.id } }`
   *   という **Where filter** を返す（`false` を返さない）。`find` / `count` はこれを
   *   通常のqueryのように**結果へ適用するだけ**で、例外は投げない——ただし返る行は
   *   「自分自身の1件だけ」になり、他人のadmin情報（email/role等）は一切含まれない。
   * - `findByID` で他人のdocumentを指定すると、その行がWhere filterにマッチしないため
   *   Payloadは `404 NotFound`（`Forbidden`ではない——存在有無を漏らさない設計）を投げる。
   * - `create` / `update` / `delete` は単一document操作で access が `false` を返す
   *   ケースが多く、これらは引き続き例外を投げる（上のテスト群で確認済み）。
   * - 完全に未認証（`user`無し）の場合は `selfOrPlatformAdmin` が `false`（boolean）を
   *   返すため、`find` であっても例外を投げる。
   *
   * つまり「他人のadmin情報が見えない」という**安全性の実質**は満たされているが、brief
   * Step 1のコード例が書く `.rejects.toThrow()` という**字面**は、非platform-adminによる
   * `find`（listクエリ）には当てはまらない。ここでは実質（他人のデータが漏れないこと）を
   * 検証し、字面通りの例外を無理に発生させる設計変更（=安全性を弱めてでも例外を投げさせる）は
   * 行わない。
   */
  describe('admins Local API access — real behavior, including cases the brief code example got wrong', () => {
    let freshReader: Awaited<ReturnType<typeof loginAs>>;
    let freshPublisher: Awaited<ReturnType<typeof loginAs>>;
    let anyOtherAdminId: string | number;

    beforeAll(async () => {
      // このsuite末尾時点の状態: owner@example.com は前のテストでcontent-publisherへ降格済み、
      // second-owner@example.com が唯一のplatform-admin。reader@example.com は削除済みなので、
      // content-reader roleのuserを新しく作る。
      const secondOwner = await loginAs(payload, 'second-owner@example.com', PASSWORD);
      const created = await payload.create({
        collection: 'admins',
        overrideAccess: false,
        user: secondOwner,
        data: { email: 'fresh-reader@example.com', password: PASSWORD, role: 'content-reader' },
      });
      freshReader = await loginAs(payload, 'fresh-reader@example.com', PASSWORD);
      freshPublisher = await loginAs(payload, 'owner@example.com', PASSWORD); // 降格済みでcontent-publisher
      anyOtherAdminId = created.id === secondOwner.id ? created.id : secondOwner.id;
    });

    it('rejects unauthenticated find/count (selfOrPlatformAdmin returns boolean false when there is no user)', async () => {
      await expect(payload.find({ collection: 'admins', overrideAccess: false })).rejects.toThrow();
      await expect(payload.count({ collection: 'admins', overrideAccess: false })).rejects.toThrow();
    });

    it('rejects unauthenticated update/delete', async () => {
      await expect(
        payload.update({ collection: 'admins', id: anyOtherAdminId, overrideAccess: false, data: { role: 'platform-admin' } }),
      ).rejects.toThrow();
      await expect(payload.delete({ collection: 'admins', id: anyOtherAdminId, overrideAccess: false })).rejects.toThrow();
    });

    it('a content-reader find() does not throw, but never returns any admin other than themself', async () => {
      const { docs, totalDocs } = await payload.find({ collection: 'admins', overrideAccess: false, user: freshReader });
      expect(totalDocs).toBe(1);
      expect(docs.map((d) => d.email)).toEqual(['fresh-reader@example.com']);
    });

    it('a content-reader findByID on another admin gets 404 NotFound, not the document', async () => {
      await expect(
        payload.findByID({ collection: 'admins', id: anyOtherAdminId, overrideAccess: false, user: freshReader }),
      ).rejects.toThrow();
    });

    it('rejects admin creation by a content-reader', async () => {
      await expect(
        payload.create({
          collection: 'admins',
          overrideAccess: false,
          user: freshReader,
          data: { email: 'reader-created-intruder@example.com', password: PASSWORD, role: 'content-reader' },
        }),
      ).rejects.toThrow();
    });

    it('rejects admin creation by a content-publisher', async () => {
      await expect(
        payload.create({
          collection: 'admins',
          overrideAccess: false,
          user: freshPublisher,
          data: { email: 'publisher-created-intruder@example.com', password: PASSWORD, role: 'content-reader' },
        }),
      ).rejects.toThrow();
    });

    it('rejects a content-reader updating another admin', async () => {
      await payload
        .update({
          collection: 'admins',
          id: anyOtherAdminId,
          overrideAccess: false,
          user: freshReader,
          data: { role: 'content-reader' },
        })
        .catch(() => undefined);

      const reloaded = await payload.findByID({ collection: 'admins', id: anyOtherAdminId, overrideAccess: true });
      expect(reloaded.role).toBe('platform-admin'); // second-owner@example.com — unchanged
    });

    it('rejects a content-publisher updating another admin', async () => {
      await payload
        .update({
          collection: 'admins',
          id: anyOtherAdminId,
          overrideAccess: false,
          user: freshPublisher,
          data: { role: 'content-reader' },
        })
        .catch(() => undefined);

      const reloaded = await payload.findByID({ collection: 'admins', id: anyOtherAdminId, overrideAccess: true });
      expect(reloaded.role).toBe('platform-admin');
    });

    it('rejects deletion by a content-reader and a content-publisher', async () => {
      await expect(
        payload.delete({ collection: 'admins', id: anyOtherAdminId, overrideAccess: false, user: freshReader }),
      ).rejects.toThrow();
      await expect(
        payload.delete({ collection: 'admins', id: anyOtherAdminId, overrideAccess: false, user: freshPublisher }),
      ).rejects.toThrow();

      const { totalDocs } = await payload.count({
        collection: 'admins',
        where: { id: { equals: anyOtherAdminId } },
        overrideAccess: true,
      });
      expect(totalDocs).toBe(1); // still there
    });
  });
});
