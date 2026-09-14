import { randomUUID } from 'node:crypto';
import type { Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { bulkPublishFromAdmin } from '@/lib/payload/bulkPublishFromAdmin';

/**
 * `/admin/draft-list`の「選択したN件を公開」が呼ぶservice。
 *
 * `tests/content/admin-publish-service.test.ts`（単発publish）と同じ実DB前提だが、
 * ここで固定すべきはbulk特有の性質——**1件の失敗が他のitemへ波及しないこと**
 * （各itemが自分のトランザクションで完結する）と、**バッチ内の1件だけ競合させても
 * 他itemは無事に公開されること**（`publishApprovedVersion()`自身のロック＋二重チェックが
 * item単位で独立して効くこと）。
 */
const PASSWORD = 'Str0ngPassw0rd!23';

const completeManufacturerData = (stableId: string, overrides: Record<string, unknown> = {}) => ({
  stableId,
  slug: stableId,
  lifecycleStatus: 'active',
  summary: 'Fixture manufacturer for bulk publish tests.',
  reliability: 'official',
  nextReviewBy: '2027-01-01',
  sources: [{ title: 'Official', url: 'https://example.com/a', checkedAt: '2026-01-01', reliability: 'official' }],
  name: 'Alpha Robotics',
  companyType: 'manufacturer',
  companyStatus: 'active',
  country: 'Japan',
  japanPresence: 'distributor',
  website: 'https://example.com/alpha',
  description: 'Fixture manufacturer used by the bulk publish tests.',
  ...overrides,
});

const completeDeploymentData = (stableId: string, manufacturerId: string | number) => ({
  stableId,
  slug: stableId,
  lifecycleStatus: 'active',
  summary: 'Fixture deployment for bulk publish tests.',
  reliability: 'official',
  sources: [{ title: 'Official', url: 'https://example.com/d', checkedAt: '2026-01-01', reliability: 'official' }],
  manufacturerId,
  customer: 'Fixture Customer',
  country: 'Japan',
  location: { lat: 35.0, lng: 139.0 },
  status: 'pilot',
});

let payload: Payload;
let publisher: Record<string, unknown> & { id: string | number };
let writer: Record<string, unknown> & { id: string | number };

async function createDraftManufacturer(data: Record<string, unknown>) {
  return payload.create({
    collection: 'manufacturers',
    data: { ...data, _status: 'draft' } as never,
    draft: true,
    overrideAccess: true,
    user: publisher as never,
  });
}

async function createDraftDeployment(data: Record<string, unknown>) {
  return payload.create({
    collection: 'deployments',
    data: { ...data, _status: 'draft' } as never,
    draft: true,
    overrideAccess: true,
    user: publisher as never,
  });
}

async function readMainRow(collection: 'manufacturers' | 'deployments', stableId: string) {
  const { docs } = await payload.find({
    collection,
    where: { stableId: { equals: stableId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return docs[0] as unknown as { id: string | number; _status?: string; name?: string } | undefined;
}

beforeAll(async () => {
  assertLocalThrowawayDatabase('tests/content/bulk-publish-from-admin.test.ts');
  const { getPayload } = await import('payload');
  const { default: config } = await import('@/payload.config');
  payload = await getPayload({ config });

  await payload.delete({ collection: 'manufacturers', where: {}, overrideAccess: true });
  await payload.delete({ collection: 'deployments', where: {}, overrideAccess: true });
  await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

  await payload.create({
    collection: 'admins',
    data: { email: 'boot@example.invalid', password: PASSWORD, role: 'platform-admin' } as never,
    overrideAccess: true,
  });
  await payload.create({
    collection: 'admins',
    data: { email: 'publisher@example.invalid', password: PASSWORD, role: 'content-publisher' } as never,
    overrideAccess: true,
  });
  await payload.create({
    collection: 'admins',
    data: { email: 'writer@example.invalid', password: PASSWORD, role: 'content-draft-writer' } as never,
    overrideAccess: true,
  });

  const p = await payload.login({ collection: 'admins', data: { email: 'publisher@example.invalid', password: PASSWORD } });
  const w = await payload.login({ collection: 'admins', data: { email: 'writer@example.invalid', password: PASSWORD } });
  publisher = p.user as never;
  writer = w.user as never;
}, 120_000);

afterAll(async () => {
  await payload?.destroy();
});

describe('bulkPublishFromAdmin — 成功パス', () => {
  it('コレクションをまたいだ複数itemを1回の呼び出しで公開できる', async () => {
    const mfrStableId = `bulk-ok-mfr-${randomUUID().slice(0, 8)}`;
    const mfr = await createDraftManufacturer(completeManufacturerData(mfrStableId));
    const depStableId = `bulk-ok-dep-${randomUUID().slice(0, 8)}`;
    const dep = await createDraftDeployment(completeDeploymentData(depStableId, mfr.id));

    const results = await bulkPublishFromAdmin({
      payload,
      items: [
        { collection: 'manufacturers', id: mfr.id },
        { collection: 'deployments', id: dep.id },
      ],
      publisherUser: publisher,
    });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.ok)).toBe(true);
    expect((await readMainRow('manufacturers', mfrStableId))?._status).toBe('published');
    expect((await readMainRow('deployments', depStableId))?._status).toBe('published');
  }, 60_000);
});

describe('bulkPublishFromAdmin — 部分失敗', () => {
  it('1件が公開要件を満たさなくても、他のitemは公開される（トランザクションが独立している）', async () => {
    const okStableId = `bulk-part-ok-${randomUUID().slice(0, 8)}`;
    const ok = await createDraftManufacturer(completeManufacturerData(okStableId));
    // `description`を欠いた不完全なdraft。draft保存はfield検証を飛ばすので作成自体は通る。
    const badStableId = `bulk-part-bad-${randomUUID().slice(0, 8)}`;
    const bad = await createDraftManufacturer(completeManufacturerData(badStableId, { description: undefined }));

    const results = await bulkPublishFromAdmin({
      payload,
      items: [
        { collection: 'manufacturers', id: bad.id },
        { collection: 'manufacturers', id: ok.id },
      ],
      publisherUser: publisher,
    });

    const badResult = results.find((r) => r.id === bad.id);
    const okResult = results.find((r) => r.id === ok.id);
    expect(badResult).toMatchObject({ ok: false, error: 'publish-validation-failed' });
    expect(okResult).toMatchObject({ ok: true });
    expect((await readMainRow('manufacturers', badStableId))?._status).not.toBe('published');
    expect((await readMainRow('manufacturers', okStableId))?._status).toBe('published');
  }, 60_000);

  it('存在しないidを含んでいても、他のitemは公開される', async () => {
    const okStableId = `bulk-notfound-ok-${randomUUID().slice(0, 8)}`;
    const ok = await createDraftManufacturer(completeManufacturerData(okStableId));

    const results = await bulkPublishFromAdmin({
      payload,
      items: [
        { collection: 'manufacturers', id: 999_999_999 },
        { collection: 'manufacturers', id: ok.id },
      ],
      publisherUser: publisher,
    });

    expect(results.find((r) => r.id === 999_999_999)).toMatchObject({ ok: false, error: 'publish-not-found' });
    expect(results.find((r) => r.id === ok.id)).toMatchObject({ ok: true });
  }, 60_000);

  it('publisher未満のroleでは全item が publish-role-required になる', async () => {
    const stableId = `bulk-role-${randomUUID().slice(0, 8)}`;
    const created = await createDraftManufacturer(completeManufacturerData(stableId));

    const results = await bulkPublishFromAdmin({
      payload,
      items: [{ collection: 'manufacturers', id: created.id }],
      publisherUser: writer,
    });

    expect(results[0]).toMatchObject({ ok: false, error: 'publish-role-required' });
    expect((await readMainRow('manufacturers', stableId))?._status).not.toBe('published');
  }, 60_000);
});

// 「バッチ内の1件だけ承認後に割り込まれる」レースの専用テストは意図的に置いていない。
// `pg_advisory_xact_lock`（`lib/payload/publishLock.ts`）はtransaction終了まで保持されるため、
// 同じ document への割り込み書き込みをテストの中で同期的に起こそうとすると、その書き込み自体が
// 同じlockを取ろうとして**自己デッドロックする**（実装のバグではなく、lockが正しく同一document
// への書き込みを直列化している証拠——実際にこの方法で書いてみて60秒タイムアウトで確認した）。
// 一方、`bulkPublishFromAdmin`は単発publishのような「事前に発行されたtoken」を持たず、
// 常にitem処理の直前に最新versionを読むため、`admin-publish-service.test.ts`が使う
// 「A保存→B保存→Aが古いtokenで公開」という決定的な順序だけでは再現できない
// （読み直す時点で常に最新を拾ってしまう）。true concurrencyでしか再現できず、
// タイミング依存で不安定なテストになるため書かない。
// 保護の中身（承認したversionがまだchain headかをlock内で再確認する）自体は
// `publishApprovedVersion()`の既存テストで確認済み。ここで確認しているのは
// bulk特有の性質——1件の失敗（validation-failed / not-found、上記）が他item に
// 波及しないこと——であり、その保証はitemごとに独立したtry/catchという実装から
// 失敗理由によらず成り立つ。
