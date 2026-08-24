import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { MCP_EDITABLE_COLLECTIONS } from '../../lib/payload/mcp';
import { computeCanonicalHash, publishApprovedVersion } from '../../lib/payload/publishApprovedVersion';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * Task 8 Step 1: MCP経由の呼び出しが実際にRBACで拒否されることを、**実Payload Local API**
 * （`overrideAccess: false`、実Postgres）で証明する。
 *
 * なぜ「MCP transportを経由しない」のに「MCP権限test」と呼べるのか（重要な設計判断）:
 * `node_modules/@payloadcms/plugin-mcp/src/mcp/tools/resource/{create,update,find,delete}.ts`
 * を読むと、標準のfind/create/update/deleteツールはいずれも
 *   `payload.<op>({ ..., overrideAccess: false, user, req })`
 * を呼ぶだけで、独立したpublish/unpublish capabilityや専用の権限チェックを一切持たない
 * （brief / `https://payloadcms.com/docs/plugins/mcp` の警告通り）。`user` は
 * `payload-mcp-api-keys.user`（`admins`への`relationship`、`lib/payload/mcp.ts`の
 * `createMcpPlugin({ userCollection: 'admins' })`）から来る——つまりMCP呼び出しの権限は
 * 100%「bindされたadminのrole」で決まり、Payloadの通常のcollection access /
 * `createPublishGateHook`（`lib/payload/access.ts`）がそのまま適用される。
 * よってこのファイルが `overrideAccess: false` + 各roleのuserで`payload.create/update/delete/find`
 * を直接呼ぶことは、実MCP toolが内部で行う呼び出しと**寸分違わない**。実MCP transport越しの
 * 検証（HTTPのJSON-RPC往復・API key認証・codex CLIとの対話）は別途
 * `tests/integration/mcp-endpoint.test.ts` が担当する——このファイルは「権限の実体」を、
 * あちらは「MCP transportがその実体を迂回しないこと」を証明する、住み分け。
 *
 * `admins`をこの一覧に含めない（`MCP_EDITABLE_COLLECTIONS`に`admins`が無い）ことは
 * `lib/payload/mcp.ts`で静的に保証される。admins自体の実access挙動の調査は
 * `tests/content/admin-access.test.ts`（brief Step 1の該当箇所）に記録する。
 */

const PASSWORD = 'Str0ngPassw0rd!23';

type McpCollectionSlug = (typeof MCP_EDITABLE_COLLECTIONS)[number];

/**
 * 各collectionの**schema level**必須field（`required: true`、arrayの中は除く）だけを補う。
 * publish時必須（`validateForPublish`）はここでは満たさない——このsuiteはdraft保存と
 * access拒否だけを検証するため、公開できる完全なdraftである必要はない
 * （publish自体の完全性検証は`tests/content/publish-gates.test.ts` / `publish-approved-
 * version.test.ts`が担当する）。
 */
const SCHEMA_REQUIRED_EXTRA_FIELDS: Partial<Record<McpCollectionSlug, Record<string, unknown>>> = {
  // `collections/Deployments.ts`: `location.lat` / `location.lng` は `group` 直下で
  // `required: true`。Payloadの`group`は「group自体が未設定」を表現できないため、
  // dataに`location`を渡さない/一部だけ渡すと、draft保存でも必須違反になる。
  deployments: { location: { lat: 35.6762, lng: 139.6503 } },
};

function fixtureData(slug: McpCollectionSlug, stableId: string): Record<string, unknown> {
  return {
    stableId,
    slug: stableId,
    ...(SCHEMA_REQUIRED_EXTRA_FIELDS[slug] ?? {}),
  };
}

async function loginAs(payload: Payload, email: string) {
  const result = await payload.login({ collection: 'admins', data: { email, password: PASSWORD } });
  if (!result.user) throw new Error(`login failed for ${email}`);
  return result.user;
}

describe('MCP-exposed collections: real Payload RBAC (Local API, standing in for MCP tool calls)', () => {
  let payload: Payload;
  let reader: Awaited<ReturnType<typeof loginAs>>;
  let writer: Awaited<ReturnType<typeof loginAs>>;
  let publisher: Awaited<ReturnType<typeof loginAs>>;
  let admin: Awaited<ReturnType<typeof loginAs>>;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/mcp-access.test.ts');
    payload = await getPayload({ config });

    for (const slug of MCP_EDITABLE_COLLECTIONS) {
      await payload.delete({ collection: slug, where: {}, overrideAccess: true });
    }
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

    const owner = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: 'mcp-owner@example.com', password: PASSWORD, role: 'content-reader' },
    });
    expect(owner.role).toBe('platform-admin'); // bootstrap強制

    for (const [email, role] of [
      ['mcp-reader@example.com', 'content-reader'],
      ['mcp-writer@example.com', 'content-draft-writer'],
      ['mcp-publisher@example.com', 'content-publisher'],
    ] as const) {
      await payload.create({
        collection: 'admins',
        overrideAccess: false,
        user: owner,
        data: { email, password: PASSWORD, role },
      });
    }

    reader = await loginAs(payload, 'mcp-reader@example.com');
    writer = await loginAs(payload, 'mcp-writer@example.com');
    publisher = await loginAs(payload, 'mcp-publisher@example.com');
    admin = await loginAs(payload, 'mcp-owner@example.com');
  });

  afterAll(async () => {
    await payload?.destroy();
  });

  it('admins is not among the collections MCP exposes (static, enforced by lib/payload/mcp.ts)', () => {
    expect(MCP_EDITABLE_COLLECTIONS).not.toContain('admins');
    expect(MCP_EDITABLE_COLLECTIONS).not.toContain('media');
    expect(MCP_EDITABLE_COLLECTIONS).not.toContain('content-route-registry');
    expect(MCP_EDITABLE_COLLECTIONS).not.toContain('environment-marker');
  });

  describe.each(MCP_EDITABLE_COLLECTIONS)('%s (an MCP-exposed collection)', (slug) => {
    it('content-draft-writer — the role a normal MCP API key is bound to — can create a draft', async () => {
      const stableId = `mcp-${slug}-draft-ok`;
      const doc = await payload.create({
        collection: slug,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: fixtureData(slug, stableId),
      });
      expect(doc._status).toBe('draft');
    });

    it('content-draft-writer cannot create with _status: published sent directly', async () => {
      const stableId = `mcp-${slug}-create-publish-attempt`;
      // `draft: true` を渡すとPayloadが `_status` を強制的に 'draft' へ上書きするため、ここでは
      // 意図的に渡さない（MCPのcreateツールは既定 `draft: false` — plugin-mcp
      // `src/mcp/tools/resource/create.ts` の `draft: z.boolean().optional().default(false)`
      // ——を渡す構成もありうるので、両方の入口を塞げているか確認する）。
      await expect(
        payload.create({
          collection: slug,
          overrideAccess: false,
          user: writer,
          data: { ...fixtureData(slug, stableId), _status: 'published' } as never,
        }),
      ).rejects.toThrow();

      const { totalDocs } = await payload.count({
        collection: slug,
        where: { stableId: { equals: stableId } },
        overrideAccess: true,
      });
      expect(totalDocs).toBe(0);
    });

    it('content-draft-writer cannot flip an existing draft to _status: published via update', async () => {
      const stableId = `mcp-${slug}-update-publish-attempt`;
      const draft = await payload.create({
        collection: slug,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: fixtureData(slug, stableId),
      });

      await expect(
        payload.update({
          collection: slug,
          id: draft.id,
          overrideAccess: false,
          user: writer,
          data: { _status: 'published' },
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);

      const stillDraft = await payload.findByID({ collection: slug, id: draft.id, overrideAccess: true });
      expect(stillDraft._status).toBe('draft');
    });

    it('content-draft-writer cannot delete', async () => {
      const stableId = `mcp-${slug}-delete-attempt-writer`;
      const draft = await payload.create({
        collection: slug,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: fixtureData(slug, stableId),
      });

      await expect(
        payload.delete({ collection: slug, id: draft.id, overrideAccess: false, user: writer }),
      ).rejects.toThrow();
    });

    it('content-publisher cannot delete (delete is platform-admin only)', async () => {
      const stableId = `mcp-${slug}-delete-attempt-publisher`;
      const draft = await payload.create({
        collection: slug,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: fixtureData(slug, stableId),
      });

      await expect(
        payload.delete({ collection: slug, id: draft.id, overrideAccess: false, user: publisher }),
      ).rejects.toThrow();
    });

    /**
     * `lib/payload/mcp.ts` は `MCP_EDITABLE_COLLECTIONS` の各collectionへ
     * `enabled: { ..., delete: true }` を設定している（= 「deleteツール自体は存在しうる」）。
     * これは実運用ではAPI keyのcheckboxで無効化されている想定だが、**operatorがcheckboxを
     * 誤って有効化しても実際にはPayload access（`isPlatformAdmin`）が拒否する**という
     * 多層防御を、ここで直接証明する（brief: 「機械ゲートの文言と実装の不一致」を繰り返さない）。
     */
    it('platform-admin can delete — the only role for which the MCP delete tool would actually succeed', async () => {
      const stableId = `mcp-${slug}-delete-by-admin`;
      const draft = await payload.create({
        collection: slug,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: fixtureData(slug, stableId),
      });

      await payload.delete({ collection: slug, id: draft.id, overrideAccess: false, user: admin });

      const { totalDocs } = await payload.count({
        collection: slug,
        where: { stableId: { equals: stableId } },
        overrideAccess: true,
      });
      expect(totalDocs).toBe(0);
    });
  });

  /**
   * brief Step 1のコード例が意図するシナリオそのもの（`robots`を使う）。draft-writerに
   * bindされた通常MCP API keyが辿る実際の編集フロー全体を1本の流れとして確認する。
   */
  describe('robots: end-to-end MCP editorial workflow (brief Step 1 scenario)', () => {
    const COMPLETE_ROBOT_DATA = {
      summary: 'Draft robot used for the MCP end-to-end scenario.',
      reliability: 'reported' as const,
      sources: [{ title: 'Official site', url: 'https://example.com', checkedAt: '2026-01-01', reliability: 'official' as const }],
      name: 'Test',
      category: 'humanoid' as const,
      deploymentStage: 'pilot' as const,
      japanAvailability: 'inquiry-required' as const,
    };

    it('runs the full draft → reject-publish → reject-delete → publisher-publishes flow', async () => {
      const [unitree] = (
        await payload.find({ collection: 'manufacturers', overrideAccess: true, limit: 1 })
      ).docs;
      const manufacturerId =
        unitree?.id ??
        (
          await payload.create({
            collection: 'manufacturers',
            overrideAccess: true,
            data: { stableId: 'mcp-e2e-mfr', slug: 'mcp-e2e-mfr', name: 'MCP E2E Manufacturer Co' } as never,
          })
        ).id;

      // 1. draft の作成に成功する。
      const created = await payload.create({
        collection: 'robots',
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { stableId: 'test-mcp-draft-robot', slug: 'test-mcp-draft-robot', manufacturerId, ...COMPLETE_ROBOT_DATA },
      });
      expect(created._status).toBe('draft');

      // 2. draft の更新に成功する。
      const [doc1] = (await payload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-draft-robot' } }, limit: 1, overrideAccess: true })).docs;
      const updated = await payload.update({
        collection: 'robots',
        id: doc1.id,
        data: { name: 'Test 2' },
        draft: true,
        overrideAccess: false,
        user: writer,
      });
      expect(updated.name).toBe('Test 2');

      // 3. _status: published への更新を拒否する。
      const [doc2] = (await payload.find({ collection: 'robots', where: { stableId: { equals: 'test-mcp-draft-robot' } }, limit: 1, overrideAccess: true })).docs;
      await expect(
        payload.update({
          collection: 'robots',
          id: doc2.id,
          data: { _status: 'published' },
          overrideAccess: false,
          user: writer,
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);

      // 4. delete を拒否する。
      await expect(
        payload.delete({ collection: 'robots', id: doc2.id, overrideAccess: false, user: writer }),
      ).rejects.toThrow();

      // 5. content-publisher は同じ draft を published へ昇格できる — ただし正規経路
      // （`publishApprovedVersion()`）を通してのみ。生の `payload.update({ data: { _status:
      // 'published' } } )` は publisher でも拒否される（下の別テストで確認する）ため、ここは
      // 実際に採用されている唯一の公開経路を使う。
      // `depth: 0` が要る。省略するとrelationship field（`manufacturerId`）が展開され、
      // `publishApprovedVersion()` 内部（`findVersionByID({ depth: 0 })`）が計算するhashと
      // 一致しなくなる（publish-approved-version.test.ts / publish-gates.test.ts と同じ注意点）。
      const { docs: versions } = await payload.findVersions({
        collection: 'robots',
        where: { parent: { equals: doc2.id } },
        sort: '-createdAt',
        limit: 1,
        overrideAccess: true,
        depth: 0,
      });
      const approved = versions[0];
      const approvalManifestHash = computeCanonicalHash((approved as unknown as { version: Record<string, unknown> }).version);

      const result = await publishApprovedVersion({
        payload,
        collection: 'robots',
        stableId: 'test-mcp-draft-robot',
        approvedVersionId: approved.id,
        approvalManifestHash,
        publisherUser: publisher,
      });
      expect(result.documentId).toBe(doc2.id);

      const published = await payload.findByID({ collection: 'robots', id: doc2.id, overrideAccess: true });
      expect(published._status).toBe('published');
      expect(published.name).toBe('Test 2');
    });

    it('rejects a raw _status: published update from a content-publisher who bypasses publishApprovedVersion()', async () => {
      const [manufacturer] = (await payload.find({ collection: 'manufacturers', overrideAccess: true, limit: 1 })).docs;
      const draft = await payload.create({
        collection: 'robots',
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { stableId: 'mcp-robot-publisher-raw-update', slug: 'mcp-robot-publisher-raw-update', manufacturerId: manufacturer.id, ...COMPLETE_ROBOT_DATA },
      });

      // 承認済みcontextを持たない直接updateは、role check（canPublish=true）を通っても
      // `readApprovedPublishAuthorization()` が無いため `publish-approval-required` で拒否される
      // （`lib/payload/access.ts` の `createPublishGateHook`）。
      await expect(
        payload.update({
          collection: 'robots',
          id: draft.id,
          overrideAccess: false,
          user: publisher,
          data: { _status: 'published' },
        }),
      ).rejects.toThrow(/publish-approval-required/);
    });

    /**
     * brief: 「承認後に別draftを追加してから古いversion IDを公開するcaseは
     * `approved-version-stale`で拒否」。`tests/content/publish-approved-version.test.ts` は
     * `manufacturers`で確認済みだが、brief Step1のコード例が名指しする`robots`でも同じ挙動を
     * 直接確認する。
     */
    it('rejects publishing a stale approved version on robots (approval superseded by a newer draft)', async () => {
      const [manufacturer] = (await payload.find({ collection: 'manufacturers', overrideAccess: true, limit: 1 })).docs;
      const draft = await payload.create({
        collection: 'robots',
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { stableId: 'mcp-robot-stale-approval', slug: 'mcp-robot-stale-approval', manufacturerId: manufacturer.id, ...COMPLETE_ROBOT_DATA },
      });

      const { docs: versions } = await payload.findVersions({
        collection: 'robots',
        where: { parent: { equals: draft.id } },
        sort: '-createdAt',
        limit: 1,
        overrideAccess: true,
        depth: 0,
      });
      const approvedVersionId = versions[0].id;
      const approvalManifestHash = computeCanonicalHash((versions[0] as unknown as { version: Record<string, unknown> }).version);

      // 承認後に別draftを追加する（statusだけの変更でも新しいversionができる）。
      await payload.update({
        collection: 'robots',
        id: draft.id,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { name: 'Test 2 changed after approval' },
      });

      await expect(
        publishApprovedVersion({
          payload,
          collection: 'robots',
          stableId: 'mcp-robot-stale-approval',
          approvedVersionId,
          approvalManifestHash,
          publisherUser: publisher,
        }),
      ).rejects.toThrow(/publish-stale-approval/);

      const stillDraft = await payload.findByID({ collection: 'robots', id: draft.id, overrideAccess: true });
      expect(stillDraft._status).toBe('draft');
    });
  });

  /**
   * brief: 「collection access と beforeChange のどちらかを外した mutation test でも片方が
   * 拒否を維持する」。Payload Local APIには「hookだけ迂回する」オプションは無い一方、
   * `overrideAccess: true` は collection の `access.update`（`contentCollectionAccess`）を
   * 完全に迂回する。それでも `createPublishGateHook`（beforeChangeフック）だけで
   * 公開遷移が止まることを確認すれば、「access層が万一無効化されても beforeChange
   * が単独でfail-closedを保つ」という多層防御の主張を実際に検証したことになる。
   */
  describe('defense in depth: the beforeChange publish gate holds even when collection access is bypassed', () => {
    it('rejects a reader-role _status: published update even with overrideAccess: true (collection access bypassed)', async () => {
      const [manufacturer] = (await payload.find({ collection: 'manufacturers', overrideAccess: true, limit: 1 })).docs;
      const draft = await payload.create({
        collection: 'robots',
        overrideAccess: true,
        draft: true,
        data: {
          stableId: 'mcp-robot-override-access-bypass',
          slug: 'mcp-robot-override-access-bypass',
          manufacturerId: manufacturer.id,
          summary: 'x',
          reliability: 'reported',
          sources: [{ title: 't', url: 'https://example.com', checkedAt: '2026-01-01', reliability: 'official' }],
          name: 'Test',
          category: 'humanoid',
          deploymentStage: 'pilot',
          japanAvailability: 'inquiry-required',
        },
      });

      // `overrideAccess: true` は `contentCollectionAccess.update`（collection access層）を
      // 完全にスキップする。それでもなお beforeChange の `createPublishGateHook` が
      // reader roleでの公開遷移を拒否することを確認する。
      await expect(
        payload.update({
          collection: 'robots',
          id: draft.id,
          overrideAccess: true,
          user: reader,
          data: { _status: 'published' },
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);

      const stillDraft = await payload.findByID({ collection: 'robots', id: draft.id, overrideAccess: true });
      expect(stillDraft._status).toBe('draft');
    });
  });

  /**
   * `payload-mcp-api-keys`（plugin-mcpが自動生成するAPI key collection自体）のaccess。
   *
   * plugin-mcpの既定（`node_modules/@payloadcms/plugin-mcp/src/collections/
   * createApiKeysCollection.ts`）はこのcollectionへ`access`を一切指定しない。Payloadの
   * `defaultAccess`（`Boolean(user)`）だけが効くと、**あらゆる認証済みadmin**（content-reader
   * ですら）が新しいMCP API keyを自作でき、しかも`user`（keyを紐づけるadmin）fieldにも
   * 独自accessが無いため、任意のadmin id（platform-adminのidを含む）を指定できてしまう——
   * content-readerがplatform-admin紐づけのkeyを自作すれば、MCP越しにplatform-adminとして
   * 振る舞える、という重大なprivilege escalationになる。`lib/payload/mcp.ts`の
   * `overrideApiKeyCollection`でこれを`platform-admin`限定に閉じているので、ここで実際に
   * 効いていることを確認する。
   */
  describe('payload-mcp-api-keys collection itself is platform-admin only (closes a defaultAccess gap)', () => {
    it('rejects a content-draft-writer creating an MCP API key (even bound to themselves)', async () => {
      await expect(
        payload.create({
          collection: 'payload-mcp-api-keys' as never,
          overrideAccess: false,
          user: writer,
          data: { user: writer.id, label: 'rogue key', enableAPIKey: true } as never,
        }),
      ).rejects.toThrow();
    });

    it('rejects a content-publisher creating an MCP API key bound to the platform-admin (impersonation attempt)', async () => {
      await expect(
        payload.create({
          collection: 'payload-mcp-api-keys' as never,
          overrideAccess: false,
          user: publisher,
          data: { user: admin.id, label: 'impersonation attempt', enableAPIKey: true } as never,
        }),
      ).rejects.toThrow();

      const { totalDocs } = await payload.count({ collection: 'payload-mcp-api-keys' as never, overrideAccess: true });
      expect(totalDocs).toBe(0);
    });

    it('lets a platform-admin create and read an MCP API key', async () => {
      const created = await payload.create({
        collection: 'payload-mcp-api-keys' as never,
        overrideAccess: false,
        user: admin,
        data: { user: writer.id, label: 'normal draft-writer key', enableAPIKey: true } as never,
      });
      expect((created as { id: string | number }).id).toBeDefined();

      const found = await payload.findByID({
        collection: 'payload-mcp-api-keys' as never,
        id: (created as { id: string | number }).id,
        overrideAccess: false,
        user: admin,
      });
      expect((found as { user: unknown }).user).toBeTruthy();
    });

    it('rejects a content-reader reading MCP API keys', async () => {
      await expect(
        payload.find({ collection: 'payload-mcp-api-keys' as never, overrideAccess: false, user: reader }),
      ).rejects.toThrow();
    });
  });
});
