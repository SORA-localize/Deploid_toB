/**
 * `docs/plans/content-platform-migration-plan-v1.md` Task 7 Step 1・2・5。
 *
 * `/api/revalidate-content` は「署名検証 → collection allowlist検証 → `revalidateTag()`」の
 * 唯一の経路。fail-closed（判断できない入力は401/400で拒否する）と、
 * `revalidateTag(tag, 'max')` の呼び出しそのものが正しいtag・正しい第2引数で行われることを
 * 確認する。
 *
 * **`next/cache`をmockする理由**: `use cache` / `revalidateTag` はNext.jsのビルド済みruntime
 * （SWC/Turbopackの変換 + Cache Componentsの内部store）に依存する機能で、Vitestで素の
 * TypeScriptとしてimportしただけの状態では実際のキャッシュ格納・無効化は再現できない
 * （このため「HTMLが本当にキャッシュから新しい値になる」検証はPlaywright e2e側の責務とし、
 * ここでは「正しいcollectionから正しいtagへ、正しい第2引数で `revalidateTag` が呼ばれるか」を
 * 決定的にassertする）。
 */
import { revalidateTag } from 'next/cache';
import { getPayload, type Payload } from 'payload';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { privilegedPublishContext } from '../../lib/payload/publishAuthorization';
import {
  COLLECTION_TO_TAG_KEY,
  computeRevalidationSignature,
  contentTags,
  REVALIDATE_SIGNATURE_HEADER,
} from '../../lib/content/cacheTags';
import { POST } from '../../src/app/api/revalidate-content/route';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const SECRET = 'revalidation-test-secret-do-not-reuse';

function signedRequest(body: string, secret = SECRET): Request {
  return new Request('http://localhost/api/revalidate-content', {
    method: 'POST',
    headers: { [REVALIDATE_SIGNATURE_HEADER]: computeRevalidationSignature(body, secret) },
    body,
  });
}

describe('POST /api/revalidate-content (signature + allowlist)', () => {
  const originalSecret = process.env.REVALIDATION_SECRET;

  beforeAll(() => {
    process.env.REVALIDATION_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.REVALIDATION_SECRET = originalSecret;
  });

  afterEach(() => {
    vi.mocked(revalidateTag).mockClear();
  });

  it('rejects unsigned revalidation requests', async () => {
    const response = await POST(
      new Request('http://localhost/api/revalidate-content', {
        method: 'POST',
        body: JSON.stringify({ collection: 'robots' }),
      }),
    );
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a request with no signature header at all', async () => {
    const response = await POST(
      new Request('http://localhost/api/revalidate-content', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({ collection: 'robots' }),
      }),
    );
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a tampered body whose signature no longer matches', async () => {
    const body = JSON.stringify({ collection: 'robots' });
    const signature = computeRevalidationSignature(body, SECRET);
    const tamperedBody = JSON.stringify({ collection: 'manufacturers' });
    const response = await POST(
      new Request('http://localhost/api/revalidate-content', {
        method: 'POST',
        headers: { [REVALIDATE_SIGNATURE_HEADER]: signature },
        body: tamperedBody,
      }),
    );
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a signature computed with the wrong secret', async () => {
    const body = JSON.stringify({ collection: 'robots' });
    const response = await POST(signedRequest(body, 'wrong-secret'));
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a non-hex signature header outright (fail-closed on malformed input)', async () => {
    const body = JSON.stringify({ collection: 'robots' });
    const response = await POST(
      new Request('http://localhost/api/revalidate-content', {
        method: 'POST',
        headers: { [REVALIDATE_SIGNATURE_HEADER]: 'not-hex-at-all!!' },
        body,
      }),
    );
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects every request when REVALIDATION_SECRET is unset (fail-closed, not fail-open)', async () => {
    const body = JSON.stringify({ collection: 'robots' });
    const validSignatureUnderCurrentSecret = computeRevalidationSignature(body, SECRET);
    delete process.env.REVALIDATION_SECRET;
    try {
      const response = await POST(
        new Request('http://localhost/api/revalidate-content', {
          method: 'POST',
          headers: { [REVALIDATE_SIGNATURE_HEADER]: validSignatureUnderCurrentSecret },
          body,
        }),
      );
      expect(response.status).toBe(401);
      expect(revalidateTag).not.toHaveBeenCalled();
    } finally {
      process.env.REVALIDATION_SECRET = SECRET;
    }
  });

  it('rejects a properly signed request for a collection not in the allowlist', async () => {
    const body = JSON.stringify({ collection: 'admins' });
    const response = await POST(signedRequest(body));
    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a properly signed request for an empty/missing collection', async () => {
    const response = await POST(signedRequest(JSON.stringify({})));
    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a properly signed request with malformed JSON', async () => {
    const body = '{not json';
    const response = await POST(signedRequest(body));
    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('calls revalidateTag(tag, "max") with the correct tag for every allowlisted collection', async () => {
    for (const [collection, tagKey] of Object.entries(COLLECTION_TO_TAG_KEY)) {
      vi.mocked(revalidateTag).mockClear();
      const body = JSON.stringify({ collection });
      const response = await POST(signedRequest(body));
      expect(response.status, `collection=${collection}`).toBe(200);
      expect(revalidateTag, `collection=${collection}`).toHaveBeenCalledExactlyOnceWith(
        contentTags[tagKey as keyof typeof contentTags],
        'max',
      );
    }
  });
});

/**
 * Step 5: real Payload + real throwaway Postgresに対する end-to-end round trip。
 *
 * `revalidateTag` 自体はmockされているため（Vitest環境ではNextのcache runtimeが動かない）、
 * ここで検証しているのは「HTMLキャッシュが更新されること」ではなく「更新 → 署名付き
 * webhook呼び出し → repositoryが最新値を返すこと」という、実DBに対するpipeline全体の
 * 正しさ。**`vi.waitFor` によるポーリング**は、brief Step 5が明示的に要求している検証形と
 * 同じ形を踏襲する（`revalidateTag(tag, 'max')` はstale-while-revalidate profileの指定であり、
 * 呼び出し直後の1回読みで新しい値になっていることを保証しない契約のため、直後の1回勝負の
 * `toBe()` は書かない）。
 */
describe('publish → signed revalidate-content webhook → repository reflects new value (real Payload + Postgres)', () => {
  let payload: Payload;
  const originalSecret = process.env.REVALIDATION_SECRET;

  let owner: NonNullable<Awaited<ReturnType<Payload['login']>>['user']>;
  const OWNER_EMAIL = 'revalidation-test-owner@example.com';
  const PASSWORD = 'Str0ngPassw0rd!23';

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/revalidation.test.ts');
    process.env.REVALIDATION_SECRET = SECRET;
    payload = await getPayload({ config });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
    // 1人目のadminはbootstrapでplatform-adminへ強制される（Task 2）。publish gateは
    // published mainRowを書くwriteにcontent-publisher以上のroleを要求するため
    // （privilegedPublishContextはこのrole要件自体は免除しない — `lib/payload/access.ts`
    // `createPublishGateHook`参照）、fixture seedはこのuserとして行う。
    await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: OWNER_EMAIL, password: PASSWORD, role: 'content-reader' },
    });
    const loginResult = await payload.login({ collection: 'admins', data: { email: OWNER_EMAIL, password: PASSWORD } });
    if (!loginResult.user) throw new Error('failed to log in as the fixture owner');
    owner = loginResult.user;
  });

  afterAll(async () => {
    process.env.REVALIDATION_SECRET = originalSecret;
    await payload?.destroy();
  });

  async function callWebhook(collection: string): Promise<Response> {
    const body = JSON.stringify({ collection });
    return POST(signedRequest(body));
  }

  async function readRobotName(robotDbId: string | number): Promise<string | undefined> {
    const doc = await payload.findByID({
      collection: 'robots',
      id: robotDbId,
      depth: 0,
      overrideAccess: true,
    });
    return (doc as { name?: string }).name;
  }

  it('reflects an update after the signed webhook call, verified by polling', async () => {
    // publish gate（`lib/payload/access.ts` の `createPublishGateHook`）は published な main row
    // を直接作る通常経路を拒否するため、fixture seedはimport/restoreと同じ特権経路を使う
    // （`tests/content/repository.contract.test.ts` と同じパターン）。
    const uniqueSuffix = Date.now();
    const manufacturer = await payload.create({
      collection: 'manufacturers',
      overrideAccess: true,
      user: owner,
      data: {
        stableId: `revalidation-test-manufacturer-${uniqueSuffix}`,
        slug: `revalidation-test-manufacturer-${uniqueSuffix}`,
        lifecycleStatus: 'active',
        name: 'Revalidation Test Manufacturer',
        summary: 'fixture',
        sources: [{ title: 't', url: 'https://example.com', reliability: 'official', checkedAt: '2026-01-01' }],
        country: 'JP',
        companyType: 'manufacturer',
        japanPresence: 'office',
        website: 'https://example.com',
        description: 'fixture',
        _status: 'published',
      } as never,
      context: privilegedPublishContext({
        runId: 'revalidation-test-fixture',
        actorId: String(owner.id),
        reason: 'revalidation.test.ts fixture seed (manufacturer)',
      }),
    });

    const created = await payload.create({
      collection: 'robots',
      overrideAccess: true,
      user: owner,
      data: {
        stableId: `revalidation-test-robot-${uniqueSuffix}`,
        slug: `revalidation-test-robot-${uniqueSuffix}`,
        lifecycleStatus: 'active',
        name: 'Before Update',
        summary: 'fixture',
        sources: [{ title: 't', url: 'https://example.com', reliability: 'official', checkedAt: '2026-01-01' }],
        manufacturerId: manufacturer.id,
        category: 'humanoid',
        deploymentStage: 'pilot',
        japanAvailability: 'unknown',
        _status: 'published',
      } as never,
      context: privilegedPublishContext({
        runId: 'revalidation-test-fixture',
        actorId: String(owner.id),
        reason: 'revalidation.test.ts fixture seed',
      }),
    });

    const before = await readRobotName(created.id);
    expect(before).toBe('Before Update');

    await payload.update({
      collection: 'robots',
      id: created.id,
      overrideAccess: true,
      user: owner,
      data: { name: 'After Update' } as never,
      context: privilegedPublishContext({
        runId: 'revalidation-test-update',
        actorId: String(owner.id),
        reason: 'revalidation.test.ts fixture update (already published, no state transition)',
      }),
    });

    const webhookResponse = await callWebhook('robots');
    expect(webhookResponse.status).toBe(200);

    await vi.waitFor(
      async () => {
        const after = await readRobotName(created.id);
        expect(after).not.toBe(before);
        expect(after).toBe('After Update');
      },
      { timeout: 5000, interval: 100 },
    );
  });
});
