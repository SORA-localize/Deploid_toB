import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
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

describe('Content collection publish gate (real Payload Local API, manufacturers as representative)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/publish-gates.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'manufacturers', where: {}, overrideAccess: true });
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

  it('content-publisher can publish and unpublish; incomplete drafts fail the publish gate', async () => {
    const writer = await loginAs(payload, 'gate-writer@example.com');
    const publisher = await loginAs(payload, 'gate-publisher@example.com');

    const incomplete = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-incomplete', slug: 'gate-mfr-incomplete', summary: 'missing required fields' },
    });

    await expect(
      payload.update({
        collection: 'manufacturers',
        id: incomplete.id,
        overrideAccess: false,
        user: publisher,
        data: { _status: 'published' },
      }),
    ).rejects.toThrow();

    const complete = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { stableId: 'gate-mfr-complete', slug: 'gate-mfr-complete', ...COMPLETE_MANUFACTURER_DATA },
    });

    const published = await payload.update({
      collection: 'manufacturers',
      id: complete.id,
      overrideAccess: false,
      user: publisher,
      data: { _status: 'published' },
    });
    expect(published._status).toBe('published');

    // partial update（必須field以外）でも公開gateが完全なdocを検証することを固定する回帰テスト。
    const partiallyUpdated = await payload.update({
      collection: 'manufacturers',
      id: complete.id,
      overrideAccess: false,
      user: publisher,
      data: { _status: 'published', foundedYear: 2020 },
    });
    expect(partiallyUpdated._status).toBe('published');
    expect(partiallyUpdated.name).toBe(COMPLETE_MANUFACTURER_DATA.name); // 既存値のまま

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
    await payload.update({
      collection: 'manufacturers',
      id: draft.id,
      overrideAccess: false,
      user: publisher,
      data: { _status: 'published' },
    });

    await expect(
      payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        user: writer,
        data: { _status: 'draft' },
      }),
    ).rejects.toThrow();
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
});
