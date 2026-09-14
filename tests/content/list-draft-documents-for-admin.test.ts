import { randomUUID } from 'node:crypto';
import type { Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { listDraftDocumentsForAdmin } from '@/lib/payload/listDraftDocumentsForAdmin';
import { bulkPublishFromAdmin } from '@/lib/payload/bulkPublishFromAdmin';

/**
 * `/admin/draft-list` が拾うべき3パターンを区別できるかを確認する。
 *
 * `lib/payload/listDraftDocumentsForAdmin.ts` のコメントの通り、`draft: true` を付けた
 * `find`は「一度もpublishされていないdraft」と「publish済みだが未反映の編集があるdraft」の
 * 両方を拾い、「完全にpublish済みで未反映の編集が無いもの」は拾わない、という区別が本質。
 * ここを間違えると一覧が実態とずれる。
 */
const PASSWORD = 'Str0ngPassw0rd!23';

const completeManufacturerData = (stableId: string, overrides: Record<string, unknown> = {}) => ({
  stableId,
  slug: stableId,
  lifecycleStatus: 'active',
  summary: 'Fixture manufacturer for draft-list tests.',
  reliability: 'official',
  nextReviewBy: '2027-01-01',
  sources: [{ title: 'Official', url: 'https://example.com/a', checkedAt: '2026-01-01', reliability: 'official' }],
  name: 'Alpha Robotics',
  companyType: 'manufacturer',
  companyStatus: 'active',
  country: 'Japan',
  japanPresence: 'distributor',
  website: 'https://example.com/alpha',
  description: 'Fixture manufacturer used by the draft-list tests.',
  ...overrides,
});

let payload: Payload;
let publisher: Record<string, unknown> & { id: string | number };

async function createDraftManufacturer(data: Record<string, unknown>) {
  return payload.create({
    collection: 'manufacturers',
    data: { ...data, _status: 'draft' } as never,
    draft: true,
    overrideAccess: true,
    user: publisher as never,
  });
}

beforeAll(async () => {
  assertLocalThrowawayDatabase('tests/content/list-draft-documents-for-admin.test.ts');
  const { getPayload } = await import('payload');
  const { default: config } = await import('@/payload.config');
  payload = await getPayload({ config });

  await payload.delete({ collection: 'manufacturers', where: {}, overrideAccess: true });
  await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

  await payload.create({
    collection: 'admins',
    data: { email: 'publisher@example.invalid', password: PASSWORD, role: 'content-publisher' } as never,
    overrideAccess: true,
  });
  const p = await payload.login({ collection: 'admins', data: { email: 'publisher@example.invalid', password: PASSWORD } });
  publisher = p.user as never;
}, 120_000);

afterAll(async () => {
  await payload?.destroy();
});

describe('listDraftDocumentsForAdmin', () => {
  it('一度もpublishされていないdraftを拾う', async () => {
    const stableId = `list-never-published-${randomUUID().slice(0, 8)}`;
    await createDraftManufacturer(completeManufacturerData(stableId, { name: 'Never Published Co' }));

    const items = await listDraftDocumentsForAdmin({ payload });
    expect(items.find((i) => i.stableId === stableId)).toMatchObject({
      collection: 'manufacturers',
      title: 'Never Published Co',
    });
  }, 60_000);

  it('publish済みだが未反映の編集があるdraftを拾う', async () => {
    const stableId = `list-edited-after-publish-${randomUUID().slice(0, 8)}`;
    const created = await createDraftManufacturer(completeManufacturerData(stableId, { name: 'Edited After Publish Co' }));

    const [publishResult] = await bulkPublishFromAdmin({
      payload,
      items: [{ collection: 'manufacturers', id: created.id }],
      publisherUser: publisher,
    });
    expect(publishResult).toMatchObject({ ok: true });

    // publish済みのdocumentへ、さらに未反映の編集をdraftとして重ねる。
    await payload.update({
      collection: 'manufacturers',
      id: created.id,
      data: { ...completeManufacturerData(stableId, { name: 'Edited After Publish Co (v2)' }), _status: 'draft' } as never,
      draft: true,
      overrideAccess: true,
      user: publisher as never,
    });

    const items = await listDraftDocumentsForAdmin({ payload });
    expect(items.find((i) => i.stableId === stableId)).toMatchObject({
      collection: 'manufacturers',
      title: 'Edited After Publish Co (v2)',
    });
  }, 60_000);

  it('完全にpublish済みで未反映の編集が無いものは拾わない', async () => {
    const stableId = `list-fully-published-${randomUUID().slice(0, 8)}`;
    const created = await createDraftManufacturer(completeManufacturerData(stableId, { name: 'Fully Published Co' }));

    const [publishResult] = await bulkPublishFromAdmin({
      payload,
      items: [{ collection: 'manufacturers', id: created.id }],
      publisherUser: publisher,
    });
    expect(publishResult).toMatchObject({ ok: true });

    const items = await listDraftDocumentsForAdmin({ payload });
    expect(items.find((i) => i.stableId === stableId)).toBeUndefined();
  }, 60_000);
});
