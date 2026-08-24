import { getPayload, type Payload, type PayloadRequest } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { computeCanonicalHash, publishApprovedVersion } from '../../lib/payload/publishApprovedVersion';
import { privilegedPublishContext, recordDraftIntent } from '../../lib/payload/publishAuthorization';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * brief Step 4/5/6のRBAC表（5 actor × 6操作）を実Payload Local APIで検証する。代表collectionと
 * して `manufacturers` を使う（他8 content collectionも同じ `createPublishGateHook` /
 * `contentCollectionAccess` を共有するため、schemaレベルの契約は `payload-schema.test.ts` で
 * 別途確認する）。
 */
const PASSWORD = 'Str0ngPassw0rd!23';

const COMPLETE_MANUFACTURER_DATA = {
  summary: 'Draft manufacturer used for publish-gate regression tests.',
  reliability: 'reported' as const,
  sources: [
    {
      title: 'Official site',
      url: 'https://example.com',
      checkedAt: '2026-01-01',
      reliability: 'official' as const,
    },
  ],
  name: 'Gate Test Robotics',
  country: 'Japan',
  companyType: 'manufacturer' as const,
  japanPresence: 'office' as const,
  website: 'https://example.com',
  description: 'A manufacturer fixture used only by publish-gates.test.ts.',
};

async function loginAs(payload: Payload, email: string) {
  const result = await payload.login({ collection: 'admins', data: { email, password: PASSWORD } });
  if (!result.user) throw new Error(`login failed for ${email}`);
  return result.user;
}

/**
 * remediation group 1 / 必須修正1-4 以降、承認済み公開の唯一の経路は `publishApprovedVersion()`。
 * 「publisherがLocal APIで `_status: 'published'` を送る」だけでは公開できないため、テストの
 * 公開はこのヘルパー（= 最新versionを承認扱いにして正規経路へ流す）を通す。
 */
async function publishViaApproval(
  payload: Payload,
  stableId: string,
  publisherUser: Parameters<typeof publishApprovedVersion>[0]['publisherUser'],
) {
  const { docs: found } = await payload.find({
    collection: 'manufacturers',
    where: { stableId: { equals: stableId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    draft: true,
  });
  const { docs: versions } = await payload.findVersions({
    collection: 'manufacturers',
    where: { parent: { equals: found[0].id } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
    depth: 0,
  });
  const latest = versions[0];
  return publishApprovedVersion({
    payload,
    collection: 'manufacturers',
    stableId,
    approvedVersionId: latest.id,
    approvalManifestHash: computeCanonicalHash((latest as unknown as { version: Record<string, unknown> }).version),
    publisherUser,
  });
}

describe('Content collection publish gate (real Payload Local API, manufacturers as representative)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/publish-gates.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'manufacturers', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'article-placements', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'articles', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

    const owner = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: 'gate-owner@example.com', password: PASSWORD, role: 'content-reader' },
    });
    expect(owner.role).toBe('platform-admin'); // bootstrap強制

    for (const [email, role] of [
      ['gate-reader@example.com', 'content-reader'],
      ['gate-writer@example.com', 'content-draft-writer'],
      ['gate-publisher@example.com', 'content-publisher'],
    ] as const) {
      await payload.create({
        collection: 'admins',
        overrideAccess: false,
        user: owner,
        data: { email, password: PASSWORD, role },
      });
    }
  });

  afterAll(async () => {
    await payload?.destroy();
  });

  it('content-reader cannot create a draft', async () => {
    const reader = await loginAs(payload, 'gate-reader@example.com');
    await expect(
      payload.create({
        collection: 'manufacturers',
        overrideAccess: false,
        draft: true,
        user: reader,
        data: { stableId: 'gate-mfr-reader-attempt', slug: 'gate-mfr-reader-attempt', name: 'Should Not Exist' },
      }),
    ).rejects.toThrow();
  });

  it('content-draft-writer can create and update a draft, but cannot publish on create', async () => {
    const writer = await loginAs(payload, 'gate-writer@example.com');

    // draft: true はPayloadが `data._status` を強制的に 'draft' へ上書きしてしまい
    // （`node_modules/payload/dist/collections/operations/create.js`）、この回帰テストの前提
    // （draft-writerが `_status: 'published'` を直接送る経路を拒否する）を検証できなくなるため、
    // ここだけ意図的に `draft` を渡さない。
    await expect(
      payload.create({
        collection: 'manufacturers',
        overrideAccess: false,
        user: writer,
        data: {
          stableId: 'gate-mfr-writer-publish-attempt',
          slug: 'gate-mfr-writer-publish-attempt',
          lifecycleStatus: 'active',
          _status: 'published',
          ...COMPLETE_MANUFACTURER_DATA,
        },
      }),
    ).rejects.toThrow();

    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-writer-draft', slug: 'gate-mfr-writer-draft', ...COMPLETE_MANUFACTURER_DATA },
    });
    expect(draft._status).toBe('draft');

    const updated = await payload.update({
      collection: 'manufacturers',
      id: draft.id,
      overrideAccess: false,
      user: writer,
      data: { description: 'Updated by draft-writer, still a draft.' },
    });
    expect(updated.description).toBe('Updated by draft-writer, still a draft.');

    await expect(
      payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        user: writer,
        data: { _status: 'published' },
      }),
    ).rejects.toThrow();
  });

  it('content-publisher can publish through the approved path and unpublish; incomplete drafts fail the publish gate', async () => {
    const writer = await loginAs(payload, 'gate-writer@example.com');
    const publisher = await loginAs(payload, 'gate-publisher@example.com');

    await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-incomplete', slug: 'gate-mfr-incomplete', summary: 'missing required fields' },
    });

    await expect(publishViaApproval(payload, 'gate-mfr-incomplete', publisher)).rejects.toThrow(
      /publish-validation-failed/,
    );

    const complete = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-complete', slug: 'gate-mfr-complete', ...COMPLETE_MANUFACTURER_DATA },
    });

    await publishViaApproval(payload, 'gate-mfr-complete', publisher);
    const published = await payload.findByID({ collection: 'manufacturers', id: complete.id, overrideAccess: true });
    expect(published._status).toBe('published');
    expect(published.name).toBe(COMPLETE_MANUFACTURER_DATA.name);

    // unpublish（公開を止める方向）はpublisherの通常updateで引き続きできる。
    const unpublished = await payload.update({
      collection: 'manufacturers',
      id: complete.id,
      overrideAccess: false,
      user: publisher,
      data: { _status: 'draft' },
    });
    expect(unpublished._status).toBe('draft');
  });

  it('content-draft-writer cannot unpublish a published document', async () => {
    const writer = await loginAs(payload, 'gate-writer@example.com');
    const publisher = await loginAs(payload, 'gate-publisher@example.com');

    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-unpublish-guard', slug: 'gate-mfr-unpublish-guard', ...COMPLETE_MANUFACTURER_DATA },
    });
    await publishViaApproval(payload, 'gate-mfr-unpublish-guard', publisher);

    await expect(
      payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        user: writer,
        data: { _status: 'draft' },
      }),
    ).rejects.toThrow(/publish-role-required/);
  });

  it('only platform-admin can delete; content-publisher cannot', async () => {
    const owner = await loginAs(payload, 'gate-owner@example.com');
    const publisher = await loginAs(payload, 'gate-publisher@example.com');
    const writer = await loginAs(payload, 'gate-writer@example.com');

    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-delete-target', slug: 'gate-mfr-delete-target', ...COMPLETE_MANUFACTURER_DATA },
    });

    await expect(
      payload.delete({ collection: 'manufacturers', id: draft.id, overrideAccess: false, user: publisher }),
    ).rejects.toThrow();

    await payload.delete({ collection: 'manufacturers', id: draft.id, overrideAccess: false, user: owner });

    const { totalDocs } = await payload.count({
      collection: 'manufacturers',
      where: { stableId: { equals: 'gate-mfr-delete-target' } },
      overrideAccess: true,
    });
    expect(totalDocs).toBe(0);
  });

  it('unauthenticated read is limited to published documents; authenticated read (any role) sees drafts', async () => {
    const reader = await loginAs(payload, 'gate-reader@example.com');
    const writer = await loginAs(payload, 'gate-writer@example.com');

    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-visibility', slug: 'gate-mfr-visibility', ...COMPLETE_MANUFACTURER_DATA },
    });

    await expect(
      payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: false }),
    ).rejects.toThrow();

    const seenByReader = await payload.findByID({
      collection: 'manufacturers',
      id: draft.id,
      overrideAccess: false,
      user: reader,
    });
    expect(seenByReader.id).toBe(draft.id);
  });

  /**
   * remediation group 1 / 必須修正1 の回帰テスト。監査で見つかった fail-open を固定する。
   */
  describe('必須修正1: 公開済みdocumentへの書き込みをfail-closedにする', () => {
    const PUBLISHED_DESCRIPTION = 'Approved description visible to anonymous readers.';

    async function seedPublished(stableId: string) {
      const writer = await loginAs(payload, 'gate-writer@example.com');
      const publisher = await loginAs(payload, 'gate-publisher@example.com');
      const draft = await payload.create({
        collection: 'manufacturers',
        overrideAccess: false,
        draft: true,
        user: writer,
        data: {
          stableId,
          slug: stableId,
          ...COMPLETE_MANUFACTURER_DATA,
          description: PUBLISHED_DESCRIPTION,
        },
      });
      await publishViaApproval(payload, stableId, publisher);
      return { draft, writer, publisher };
    }

    async function readAnonymously(stableId: string) {
      const { docs } = await payload.find({
        collection: 'manufacturers',
        where: { stableId: { equals: stableId } },
        overrideAccess: false,
        limit: 1,
        depth: 0,
      });
      return docs[0];
    }

    it('rejects a content-draft-writer update of a published document and leaves the anonymous view unchanged', async () => {
      const { draft, writer } = await seedPublished('gate-mfr-published-edit');

      await expect(
        payload.update({
          collection: 'manufacturers',
          id: draft.id,
          overrideAccess: false,
          user: writer,
          data: { description: 'draft-writer rewrote live content' },
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);

      const anonymous = await readAnonymously('gate-mfr-published-edit');
      expect(anonymous?.description).toBe(PUBLISHED_DESCRIPTION);
    });

    it('lets a content-draft-writer save a new draft over a published document without changing the published version', async () => {
      const { draft, writer } = await seedPublished('gate-mfr-draft-over-published');

      const saved = await payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { description: 'pending draft, not yet approved' },
      });
      expect(saved._status).toBe('draft');

      // 公開中のmain documentは書き換わっていない。
      const mainRow = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
      expect(mainRow._status).toBe('published');
      expect(mainRow.description).toBe(PUBLISHED_DESCRIPTION);

      const anonymous = await readAnonymously('gate-mfr-draft-over-published');
      expect(anonymous?.description).toBe(PUBLISHED_DESCRIPTION);

      // 変更は新しいdraft versionとして残っている。
      const { docs: versions } = await payload.findVersions({
        collection: 'manufacturers',
        where: { parent: { equals: draft.id } },
        sort: '-createdAt',
        limit: 1,
        overrideAccess: true,
        depth: 0,
      });
      const latest = (versions[0] as unknown as { version: Record<string, unknown> }).version;
      expect(latest._status).toBe('draft');
      expect(latest.description).toBe('pending draft, not yet approved');
    });

    /**
     * `originalDoc` はPayloadの「最新version」であって公開中のmain rowではない。pending draftが
     * 1件でもあると `originalDoc._status` は 'draft' になり、遷移検査だけでは公開状態の変化を
     * 見落とす。この状態でdraft-writerが通常updateすると、公開中のmain rowがdraft内容ごと
     * 上書きされ、実質的にunpublishされてしまっていた。
     */
    it('rejects a content-draft-writer plain update while a pending draft exists (must not silently unpublish)', async () => {
      const { draft, writer } = await seedPublished('gate-mfr-pending-draft');

      await payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { description: 'pending draft' },
      });

      await expect(
        payload.update({
          collection: 'manufacturers',
          id: draft.id,
          overrideAccess: false,
          user: writer,
          data: { description: 'draft-writer promoting their own draft' },
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);

      const mainRow = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
      expect(mainRow._status).toBe('published');
      expect(mainRow.description).toBe(PUBLISHED_DESCRIPTION);

      const anonymous = await readAnonymously('gate-mfr-pending-draft');
      expect(anonymous?.description).toBe(PUBLISHED_DESCRIPTION);
    });

    /**
     * レビュー指摘 #3 の回帰テスト（end-to-end側）。
     *
     * `where` 指定のbulk updateは `beforeOperation` で `args.id` を持たないため draft intent を
     * 何も記録しない。それでもgateは「main rowを書く操作」として扱い、draft-writerを弾かなければ
     * ならない。ここでは、同じrequestに**先行するid指定draft保存のintentが残っている**状況を
     * 作った上で、それでも拒否されることを固定する。
     *
     * なお、この経路のintent残留が現状そのまま悪用できるわけではない: bulk updateの
     * `originalDoc` はmain row（published）なので、Payloadのfield beforeValidateが
     * `data._status` を 'published' で埋め、`isDraftSave` はintentに関係なくfalseになる。
     * つまり今日のfail-closedは**Payload側の実装詳細に助けられた偶然**でもある。
     * その偶然に正しさを依存させないための構造的な担保（intentを使い捨てにする）は
     * `tests/content/publish-authorization.test.ts` が直接固定している。
     */
    it('rejects a draft-writer bulk update of a published document even with a stale draft intent on the request', async () => {
      const { draft, writer } = await seedPublished('gate-mfr-intent-leak');

      // pending draftを作る（これで originalDoc = 最新version は draft になる）。
      await payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { description: 'pending draft used for the intent-leak probe' },
      });

      // 同一requestを使い回すネスト操作を再現する。先行するid指定のdraft保存が
      // draft intentを残した状態を作り、その後 `where` 指定のbulk updateを同じreqで走らせる。
      const transactionID = await payload.db.beginTransaction();
      if (transactionID === null) throw new Error('expected the postgres adapter to support transactions');
      const sharedContext: Record<string, unknown> = { deploidIntentLeakProbe: true };
      const req = { transactionID, context: sharedContext } as unknown as PayloadRequest;
      recordDraftIntent(req, 'manufacturers', draft.id, true);

      const result = (await payload.update({
        collection: 'manufacturers',
        where: { id: { equals: draft.id } },
        overrideAccess: false,
        user: writer,
        req,
        data: { description: 'bulk write riding a stale draft intent' },
      })) as unknown as { docs: unknown[]; errors: unknown[] };

      await payload.db.commitTransaction(transactionID);

      // gateはこのbulk updateを「main rowを書く操作」として扱い、拒否しなければならない。
      expect(result.errors.length).toBeGreaterThan(0);
      expect((result.errors[0] as { message?: string }).message).toMatch(
        /publish-role-required|publish-approval-required/,
      );
      expect(result.docs).toHaveLength(0);

      const mainRow = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
      expect(mainRow._status).toBe('published');
      expect(mainRow.description).toBe(PUBLISHED_DESCRIPTION);

      const anonymous = await readAnonymously('gate-mfr-intent-leak');
      expect(anonymous?.description).toBe(PUBLISHED_DESCRIPTION);
    });

    /**
     * レビュー指摘 #3（fix round 2）の回帰テスト。
     *
     * `beforeOperation` は**access controlより前**に走るので、id指定のupdateが
     * `beforeChange` へ到達せず終わった場合（access拒否、beforeValidateのthrow等）、
     * そのoperationが記録したdraft intentは**誰にも消費されず孤児になる**。
     *
     * その後、同じ `req` で同じdocumentへ別の書き込みが走ると、孤児tokenを拾ってしまう。
     * ここでは `restoreVersion` を使う。`restoreVersion` は collection の `beforeChange` を
     * 走らせる一方、`beforeOperation` の operation は 'restoreVersion' なので自分では
     * intentを記録しない。そして `draft` 引数なしの restore は
     * `db.updateOne` で**main rowを直接書く**（復元元がdraft versionなら `_status: 'draft'`、
     * つまり公開停止）。
     *
     * 孤児tokenを拾うと gate が「draft保存だから公開状態は動かない」と誤認し、
     * content-draft-writer が公開中documentを公開停止できてしまう。
     */
    /**
     * 上のorphanテストの対照実験。孤児tokenが無ければ `restoreVersion` は元々gateに弾かれる。
     * これがpassし、かつorphan有りのテストがfailする、という組み合わせで
     * 「孤児tokenの持ち越しこそが原因」だと特定できる。
     */
    it('rejects a content-draft-writer restoring a version onto a published document (no orphaned intent)', async () => {
      const { draft, writer } = await seedPublished('gate-mfr-restore-baseline');

      await payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { description: 'pending draft for the restore baseline' },
      });
      const { docs: versions } = await payload.findVersions({
        collection: 'manufacturers',
        where: { parent: { equals: draft.id } },
        sort: '-createdAt',
        limit: 1,
        overrideAccess: true,
        depth: 0,
      });

      await expect(
        payload.restoreVersion({
          collection: 'manufacturers',
          id: String(versions[0].id),
          overrideAccess: false,
          user: writer,
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);

      const mainRow = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
      expect(mainRow._status).toBe('published');
      expect(mainRow.description).toBe(PUBLISHED_DESCRIPTION);
    });

    it('does not let an orphaned draft intent from an aborted operation leak into a later write on the same request', async () => {
      const { draft, writer } = await seedPublished('gate-mfr-orphan-intent');
      const reader = await loginAs(payload, 'gate-reader@example.com');

      // 公開中documentの上にpending draftを作る（restore対象）。
      await payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { description: 'pending draft that must not be restorable by a draft writer' },
      });
      const { docs: versions } = await payload.findVersions({
        collection: 'manufacturers',
        where: { parent: { equals: draft.id } },
        sort: '-createdAt',
        limit: 1,
        overrideAccess: true,
        depth: 0,
      });
      const pendingDraftVersionId = versions[0].id;

      // 2つの操作で同じ `req` objectを共有する。孤児tokenが載るのは `req.context` であって
      // DB側ではないので、ここでtransactionを自分で張る必要はない（張っても、①のaccess拒否で
      // Payloadの `killTransaction` がrollbackして `req.transactionID` を消すため、
      // ②は結局自分でtransactionを張り直すことになり、比較条件が増えるだけになる）。
      // 各operationは `initTransaction` で自前のtransactionを持つ。
      const req = { context: { deploidOrphanProbe: true } } as unknown as PayloadRequest;

      // 1) id指定のdraft保存を、access拒否されるuser（content-reader）で走らせる。
      //    `beforeOperation` は走るので intent が記録され、access controlで落ちるため
      //    `beforeChange` は走らず、その intent は消費されないまま残る。
      await expect(
        payload.update({
          collection: 'manufacturers',
          id: draft.id,
          overrideAccess: false,
          draft: true,
          user: reader,
          req,
          data: { description: 'aborted before beforeChange' },
        }),
      ).rejects.toThrow();

      // 2) 同じ `req`（= 同じ `req.context`）で、同じdocumentへ別種の書き込み
      //    （`restoreVersion`）を走らせる。孤児tokenを拾ってはならない
      //    = gateはこれを「main rowを書く操作」として拒否する。
      await expect(
        payload.restoreVersion({
          collection: 'manufacturers',
          id: String(pendingDraftVersionId),
          overrideAccess: false,
          user: writer,
          req,
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);

      const mainRow = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
      expect(mainRow._status).toBe('published');
      expect(mainRow.description).toBe(PUBLISHED_DESCRIPTION);

      const anonymous = await readAnonymously('gate-mfr-orphan-intent');
      expect(anonymous?.description).toBe(PUBLISHED_DESCRIPTION);
    });

    it('rejects a plain content-publisher update that sends _status: published without an approval context', async () => {
      const writer = await loginAs(payload, 'gate-writer@example.com');
      const publisher = await loginAs(payload, 'gate-publisher@example.com');

      const draft = await payload.create({
        collection: 'manufacturers',
        overrideAccess: false,
        draft: true,
        user: writer,
        data: {
          stableId: 'gate-mfr-publisher-direct',
          slug: 'gate-mfr-publisher-direct',
          ...COMPLETE_MANUFACTURER_DATA,
        },
      });

      await expect(
        payload.update({
          collection: 'manufacturers',
          id: draft.id,
          overrideAccess: false,
          user: publisher,
          data: { _status: 'published' },
        }),
      ).rejects.toThrow(/publish-approval-required/);

      const mainRow = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
      expect(mainRow._status).toBe('draft');
    });

    it('rejects a publish attempt that only bypasses access control with overrideAccess', async () => {
      const writer = await loginAs(payload, 'gate-writer@example.com');
      const draft = await payload.create({
        collection: 'manufacturers',
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { stableId: 'gate-mfr-override', slug: 'gate-mfr-override', ...COMPLETE_MANUFACTURER_DATA },
      });

      await expect(
        payload.update({
          collection: 'manufacturers',
          id: draft.id,
          overrideAccess: true,
          data: { _status: 'published' },
        }),
      ).rejects.toThrow(/publish-role-required|publish-approval-required/);
    });
  });

  /**
   * `publish-gates.test.ts` の他のケースは代表collectionとして `manufacturers` を使うが、
   * `manufacturers` は publish gate より前に走る `beforeChange` hookを持たない。
   *
   * `article-placements` は `validateUniqueness` を **gateより前**に置いており、その中で
   * `req.payload.find({ ..., req })` という同一reqのLocal API呼び出しを行う。
   * `createLocalReq()` は呼ばれるたびに `req.context` を新しいobjectへ差し替えるため、
   * 「gateより前にLocal APIを呼ぶhookがあるcollection」では、operationが記録した
   * draft intentがgateへ届くまでの間に別objectへ移ってしまう。
   *
   * このテストは、そういうcollectionでも content-draft-writer の通常のdraft保存が
   * 成立すること（必須修正1-1後段: draft writerの変更は公開中のmain documentへ反映せず、
   * 新しいdraft versionとして保存される）を固定する。
   */
  describe('必須修正1-1: gateより前にLocal APIを呼ぶhookを持つcollectionでもdraft保存が通る', () => {
    it('lets a content-draft-writer save a draft on a published article-placements document', async () => {
      const owner = await loginAs(payload, 'gate-owner@example.com');
      const writer = await loginAs(payload, 'gate-writer@example.com');

      const article = await payload.create({
        collection: 'articles',
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { stableId: 'gate-placement-article', slug: 'gate-placement-article', title: 'Placement fixture article' },
      });

      const placement = await payload.create({
        collection: 'article-placements',
        overrideAccess: false,
        user: owner,
        data: {
          stableId: 'gate-placement-published',
          slug: 'gate-placement-published',
          surface: 'reports-index',
          slot: 'hero',
          articleId: article.id,
          order: 1,
          lifecycleStatus: 'active',
          _status: 'published',
        },
        context: privilegedPublishContext({
          runId: 'test-placement-seed',
          actorId: String(owner.id),
          reason: 'publish-gates regression fixture',
        }),
      });
      expect(placement._status).toBe('published');

      // 公開中placementの上へ、draft-writerが通常どおりdraftを保存できる。
      const saved = await payload.update({
        collection: 'article-placements',
        id: placement.id,
        overrideAccess: false,
        draft: true,
        user: writer,
        data: { order: 2 },
      });
      expect(saved._status).toBe('draft');

      // 公開中のmain rowは動いていない。
      const mainRow = await payload.findByID({
        collection: 'article-placements',
        id: placement.id,
        overrideAccess: true,
      });
      expect(mainRow._status).toBe('published');
      expect(mainRow.order).toBe(1);

      // 変更は新しいdraft versionとして残っている。
      const { docs: versions } = await payload.findVersions({
        collection: 'article-placements',
        where: { parent: { equals: placement.id } },
        sort: '-createdAt',
        limit: 1,
        overrideAccess: true,
        depth: 0,
      });
      const latest = (versions[0] as unknown as { version: Record<string, unknown> }).version;
      expect(latest._status).toBe('draft');
      expect(latest.order).toBe(2);
    });
  });

  describe('必須修正1-3: 匿名readはpublished かつ active のみ', () => {
    it('does not expose archived documents through the anonymous raw API', async () => {
      const owner = await loginAs(payload, 'gate-owner@example.com');

      // archived レコードは import / restore の特権経路からしか生まれない（必須修正1-6）。
      await payload.create({
        collection: 'manufacturers',
        overrideAccess: false,
        user: owner,
        data: {
          stableId: 'gate-mfr-archived',
          slug: 'gate-mfr-archived',
          ...COMPLETE_MANUFACTURER_DATA,
          _status: 'published',
          lifecycleStatus: 'archived',
        },
        context: privilegedPublishContext({
          runId: 'test-archived-seed',
          actorId: String(owner.id),
          reason: 'publish-gates regression fixture',
        }),
      });

      const { docs: anonymous } = await payload.find({
        collection: 'manufacturers',
        where: { stableId: { equals: 'gate-mfr-archived' } },
        overrideAccess: false,
        limit: 1,
        depth: 0,
      });
      expect(anonymous).toHaveLength(0);

      // 認証済みなら（レビュー用途で）引き続き見える。
      const reader = await loginAs(payload, 'gate-reader@example.com');
      const { docs: seenByReader } = await payload.find({
        collection: 'manufacturers',
        where: { stableId: { equals: 'gate-mfr-archived' } },
        overrideAccess: false,
        user: reader,
        limit: 1,
        depth: 0,
      });
      expect(seenByReader).toHaveLength(1);
    });
  });
});
