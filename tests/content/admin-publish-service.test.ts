import { randomUUID } from 'node:crypto';
import type { Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { ADMIN_PUBLISH_INTENT_PARAM } from '@/lib/payload/adminPublishIntent';
import { publishFromAdmin } from '@/lib/payload/publishFromAdmin';

/**
 * Admin公開UIのservice（`docs/plans/admin-publish-ui-plan-v1.md` Task 4）。
 *
 * ## このsuiteが本当に確かめたいこと
 *
 * 「A保存 → B保存 → Aの公開が409」だけでは**tokenの価値を何も証明しない**。
 * tokenが無くても `assertApprovedVersionIsStillLatest`（`publishApprovedVersion.ts:126,148`）が
 * 同じ409相当を出すため、そのテストはtokenを消しても緑のままになる。
 *
 * 固定すべきは「**Bの内容が公開されないこと**」で、かつ**token照合を外すと赤転すること**。
 * 後者は `npm run check` では回せないので、実装を一時的に壊して確認する手順を
 * 計画のTask 4 Step 2に記載してある。
 *
 * もう一つの必須項目が**成功パスのhash一致**。serviceが `findVersions` で計算したhashと、
 * `publishApprovedVersion` が `findVersionByID` で再計算するhashが実Postgres上でズレると、
 * **全ての公開が409になり、しかも利用者には「別の人が保存しました」と誤表示される**。
 * 単体テストでは決して見つからない種類の不一致なので、実DBで1件通す。
 */
const PASSWORD = 'Str0ngPassw0rd!23';
const COLLECTION = 'manufacturers';

/** 公開に必要な項目を満たす最小のmanufacturer（`validateManufacturerForPublish`）。 */
const completeData = (stableId: string) => ({
  stableId,
  slug: stableId,
  lifecycleStatus: 'active',
  summary: 'Fixture manufacturer for admin publish service tests.',
  reliability: 'official',
  nextReviewBy: '2027-01-01',
  sources: [{ title: 'Official', url: 'https://example.com/a', checkedAt: '2026-01-01', reliability: 'official' }],
  name: 'Alpha Robotics',
  companyType: 'manufacturer',
  companyStatus: 'active',
  country: 'Japan',
  // `validateManufacturerForPublish`（collections/Manufacturers.ts:18-29）が要求する6項目を満たす。
  // 欠けると publish-validation-failed で止まる（＝gateが効いている証拠だが、
  // 成功パスのテストとしては fixture 側の不備になる）。
  japanPresence: 'distributor',
  website: 'https://example.com/alpha',
  description: 'Fixture manufacturer used by the admin publish service tests.',
});

let payload: Payload;
let publisher: Record<string, unknown> & { id: string | number };
let writer: Record<string, unknown> & { id: string | number };

/** 公開意図つきのdraft保存（＝UIのフェーズ①相当）。hookが読むのは searchParams。 */
async function saveDraftWithIntent(docId: string | number, token: string | null, data: Record<string, unknown> = {}) {
  await payload.update({
    collection: COLLECTION,
    id: docId,
    data: { ...data, _status: 'draft' } as never,
    draft: true,
    overrideAccess: true,
    user: publisher as never,
    // route/UIではHTTPのquery paramだが、Local APIからは req 経由で同じ形を渡す。
    req: { searchParams: new URLSearchParams(token ? `${ADMIN_PUBLISH_INTENT_PARAM}=${token}` : '') } as never,
  });
}

async function latestVersionToken(docId: string | number): Promise<unknown> {
  const { docs } = await payload.findVersions({
    collection: COLLECTION,
    where: { parent: { equals: docId } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
    depth: 0,
  });
  return (docs[0] as unknown as { version: Record<string, unknown> })?.version?.adminPublishIntentToken;
}

async function readMainRow(stableId: string) {
  const { docs } = await payload.find({
    collection: COLLECTION,
    where: { stableId: { equals: stableId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return docs[0] as unknown as { id: string | number; _status?: string; name?: string } | undefined;
}

beforeAll(async () => {
  assertLocalThrowawayDatabase('tests/content/admin-publish-service.test.ts');
  const { getPayload } = await import('payload');
  const { default: config } = await import('@/payload.config');
  payload = await getPayload({ config });

  await payload.delete({ collection: COLLECTION, where: {}, overrideAccess: true });
  await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

  // 1人目はbootstrapで platform-admin へ昇格する。以降は明示的にroleを付ける。
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

describe('publishFromAdmin — 成功パス', () => {
  it('自分のtokenが最新versionに残っていれば公開でき、hashが実DB上で一致する', async () => {
    const stableId = `svc-ok-${randomUUID().slice(0, 8)}`;
    const created = await payload.create({
      collection: COLLECTION,
      data: { ...completeData(stableId), _status: 'draft' } as never,
      draft: true,
      overrideAccess: true,
      user: publisher as never,
    });

    const token = randomUUID();
    await saveDraftWithIntent(created.id, token);
    expect(await latestVersionToken(created.id)).toBe(token);

    // ここでthrowするなら、serviceのhashと publishApprovedVersion のhashがズレている。
    // その場合の実害は「全公開が409になり『別の人が保存しました』と誤表示される」。
    const result = await publishFromAdmin({
      payload,
      collection: COLLECTION,
      id: created.id,
      publishIntentToken: token,
      publisherUser: publisher,
    });

    expect(result.canonicalHash).toEqual(expect.any(String));
    expect((await readMainRow(stableId))?._status).toBe('published');
  }, 60_000);
});

describe('publishFromAdmin — 競合（tokenの存在価値）', () => {
  it('Bが後から保存したとき、Aの公開は止まり、かつBの内容が公開されない', async () => {
    const stableId = `svc-race-${randomUUID().slice(0, 8)}`;
    const created = await payload.create({
      collection: COLLECTION,
      data: { ...completeData(stableId), _status: 'draft' } as never,
      draft: true,
      overrideAccess: true,
      user: publisher as never,
    });

    // ① Aが公開意図つきで保存
    const tokenA = randomUUID();
    await saveDraftWithIntent(created.id, tokenA, { name: 'Content by A' });

    // ② Bが割り込んで保存（通常のSave Draft = paramなし）
    await saveDraftWithIntent(created.id, null, { name: 'Content by B' });
    expect(await latestVersionToken(created.id)).toBeNull();

    // ③ AがAのtokenで公開しようとする
    await expect(
      publishFromAdmin({
        payload,
        collection: COLLECTION,
        id: created.id,
        publishIntentToken: tokenA,
        publisherUser: publisher,
      }),
    ).rejects.toThrow(/publish-candidate-replaced/);

    // ④ **ここが本質**: Bの内容が公開されていないこと。
    //    単に409になるだけならtokenが無くても起きる。Bの内容が漏れないことがtokenの価値。
    const main = await readMainRow(stableId);
    expect(main?._status).not.toBe('published');
    expect(main?.name).not.toBe('Content by B');
  }, 60_000);

  it('公開済みdocumentに対して競合が起きても、公開中の内容は元のまま残る', async () => {
    const stableId = `svc-keep-${randomUUID().slice(0, 8)}`;
    const created = await payload.create({
      collection: COLLECTION,
      data: { ...completeData(stableId), _status: 'draft' } as never,
      draft: true,
      overrideAccess: true,
      user: publisher as never,
    });

    // まず正規に公開しておく
    const first = randomUUID();
    await saveDraftWithIntent(created.id, first, { name: 'Published content' });
    await publishFromAdmin({
      payload,
      collection: COLLECTION,
      id: created.id,
      publishIntentToken: first,
      publisherUser: publisher,
    });
    expect((await readMainRow(stableId))?.name).toBe('Published content');

    // Aが編集して保存 → Bが割り込む → Aの公開は失敗
    const tokenA = randomUUID();
    await saveDraftWithIntent(created.id, tokenA, { name: 'Draft by A' });
    await saveDraftWithIntent(created.id, null, { name: 'Draft by B' });

    await expect(
      publishFromAdmin({
        payload,
        collection: COLLECTION,
        id: created.id,
        publishIntentToken: tokenA,
        publisherUser: publisher,
      }),
    ).rejects.toThrow(/publish-candidate-replaced/);

    // draft=true 保存なので公開中のmain rowは動かない。既存の公開内容が残る。
    const main = await readMainRow(stableId);
    expect(main?._status).toBe('published');
    expect(main?.name).toBe('Published content');
  }, 60_000);
});

describe('publishFromAdmin — 停止条件', () => {
  it('通常のSave Draftが作ったversion（token null）は公開候補にならない', async () => {
    const stableId = `svc-null-${randomUUID().slice(0, 8)}`;
    const created = await payload.create({
      collection: COLLECTION,
      data: { ...completeData(stableId), _status: 'draft' } as never,
      draft: true,
      overrideAccess: true,
      user: publisher as never,
    });
    await saveDraftWithIntent(created.id, null);

    await expect(
      publishFromAdmin({
        payload,
        collection: COLLECTION,
        id: created.id,
        publishIntentToken: randomUUID(),
        publisherUser: publisher,
      }),
    ).rejects.toThrow(/publish-candidate-replaced/);
  }, 60_000);

  it('存在しないdocumentは publish-not-found（例外任せにしない）', async () => {
    await expect(
      publishFromAdmin({
        payload,
        collection: COLLECTION,
        id: 999_999_999,
        publishIntentToken: randomUUID(),
        publisherUser: publisher,
      }),
    ).rejects.toThrow(/publish-not-found/);
  }, 60_000);

  it('publisherでなければ publish-role-required', async () => {
    const stableId = `svc-role-${randomUUID().slice(0, 8)}`;
    const created = await payload.create({
      collection: COLLECTION,
      data: { ...completeData(stableId), _status: 'draft' } as never,
      draft: true,
      overrideAccess: true,
      user: publisher as never,
    });
    const token = randomUUID();
    await saveDraftWithIntent(created.id, token);

    await expect(
      publishFromAdmin({
        payload,
        collection: COLLECTION,
        id: created.id,
        publishIntentToken: token,
        publisherUser: writer,
      }),
    ).rejects.toThrow(/publish-role-required/);
  }, 60_000);
});
