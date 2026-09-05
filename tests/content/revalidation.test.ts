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
import { getPayload, type Payload, type PayloadRequest } from 'payload';
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
import {
  buildNotifyHeaders,
  createRevalidationAfterChangeHook,
  createSettingsRevalidationAfterChangeHook,
  isDraftSave,
  notifyRevalidationAfterCommit,
} from '../../lib/payload/revalidationHook';

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

/**
 * 2026-09-04、admin公開UIの受け入れ確認がここで詰まった件の回帰テスト。
 *
 * 公開自体は成功しているのに、Preview のページがいつまでも古いままだった。原因は
 * **Vercelの Deployment Protection が、サーバーが自分自身へ送る再検証POSTを弾いていた**こと。
 * 実測した応答は我々のrouteの `{"error":"unauthorized"}` ではなく Vercel 自身の
 * `{"error":{"message":"Protected deployment"},"protection":{"vercel_auth_enabled":true}}` だった。
 *
 * このhookはfail-openなので公開はブロックされず、**キャッシュだけが静かに古くなる**。
 * 本番（`deploid.net`）は保護が無いので同じPOSTが我々のrouteへ届く（実測で確認済み）。
 * つまりPreview限定の問題だが、その結果「公開がページに反映されることをPreviewで確認できない」
 * という検証上の穴になっていた。
 */
describe('再検証POSTのheader', () => {
  const ORIGINAL = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    else process.env.VERCEL_AUTOMATION_BYPASS_SECRET = ORIGINAL;
  });

  it('bypass secretが無ければ署名headerだけを送る（本番はこちら）', () => {
    delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    const headers = buildNotifyHeaders('sig-1');
    expect(headers['content-type']).toBe('application/json');
    expect(headers[REVALIDATE_SIGNATURE_HEADER]).toBe('sig-1');
    expect(headers['x-vercel-protection-bypass']).toBeUndefined();
  });

  it('bypass secretがあればprotection bypass headerを添える（Preview）', () => {
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = 'bypass-secret-value';
    const headers = buildNotifyHeaders('sig-2');
    expect(headers['x-vercel-protection-bypass']).toBe('bypass-secret-value');
    // bypass用cookieを残さない。残すとこのserver間POSTの副作用が後続へ漏れる。
    expect(headers['x-vercel-set-bypass-cookie']).toBe('false');
    // 署名は依然として必須。bypassはあくまでVercelの前段を通すためのもので、
    // routeの認可を置き換えるものではない。
    expect(headers[REVALIDATE_SIGNATURE_HEADER]).toBe('sig-2');
  });
})

/**
 * 2026-09-05、admin公開UIの受け入れ確認中に見つかった不具合の回帰テスト
 * （`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 2）。
 *
 * 公開UIは「①draft保存（`_status: 'draft'`のHTTP PATCH）→②公開（Local API経由）」の
 * 2段構え。`createRevalidationAfterChangeHook`は`req.context?.deferRevalidationUntilCommit`
 * だけを見ており、これはLocal API経由の公開処理（`publishApprovedVersion.ts:176`）でしか
 * 設定されない。①のdraft保存はHTTP PATCHなのでこの値を持たず、**1公開クリックで通知が
 * 2回**（draft保存時・公開時）発生していた。1回目は非公開contentに対する無駄な通知であるだけで
 * なく、同じcollectionのタグを**公開前に**無効化してしまう。
 *
 * `isDraftSave`は純粋関数（`doc`の`_status`だけを見る）なので、実DB・実Payloadを使わず
 * 単体でテストできる。
 */
describe('isDraftSave（draft保存では再検証通知を送らないための判定）', () => {
  it.each([
    ['draft', false, false],
    ['published', true, false],
  ])('_status=%sのとき、isDraftSaveは%sを返す', (status, expectedNotify) => {
    // `expectedNotify`は「通知すべきか」なので、isDraftSaveの期待値はその否定。
    expect(isDraftSave({ _status: status })).toBe(!expectedNotify);
  });

  it('_statusフィールドが無いdocument（Mediaのような非versioned collection）は常にfalse', () => {
    // draftの概念自体が無いので、これまでどおり毎回通知する。
    expect(isDraftSave({ name: 'a.png' })).toBe(false);
  });

  it('null/非objectのdocでも例外を投げずfalseを返す', () => {
    expect(isDraftSave(null)).toBe(false);
    expect(isDraftSave(undefined)).toBe(false);
    expect(isDraftSave('not-an-object')).toBe(false);
  });
});

describe('afterChangeフックのdraft抑制（8ケース、実Postgres不要）', () => {
  // `notifyRevalidation`はモジュール内部関数でexportされていないため、実際に`fetch`が
  // 呼ばれたかどうかで間接的に検証する。`REVALIDATION_SECRET`/`PAYLOAD_PUBLIC_SERVER_URL`を
  // 有効な値にしておかないと、`notifyRevalidation`は`fetch`へ到達する前に
  // `missing-secret`/`missing-base-url`でreturnしてしまい、「draft保存だから0回」なのか
  // 「そもそも設定が無いから0回」なのか区別できなくなる。
  const originalSecret = process.env.REVALIDATION_SECRET;
  const originalUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL;

  beforeAll(() => {
    process.env.REVALIDATION_SECRET = 'hook-draft-suppress-test-secret';
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3399';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.REVALIDATION_SECRET;
    else process.env.REVALIDATION_SECRET = originalSecret;
    if (originalUrl === undefined) delete process.env.PAYLOAD_PUBLIC_SERVER_URL;
    else process.env.PAYLOAD_PUBLIC_SERVER_URL = originalUrl;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const fakeReq = () =>
    ({ context: {}, payload: { logger: { warn: vi.fn(), info: vi.fn() } } }) as unknown as PayloadRequest;

  function stubFetchOk() {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response));
  }

  it('7 content collection相当: draft保存では通知しない（0回）', async () => {
    stubFetchOk();
    const hook = createRevalidationAfterChangeHook('manufacturers');
    const req = fakeReq();
    await hook({ doc: { _status: 'draft' }, req, operation: 'update' } as never);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('7 content collection相当: Admin公開（published）では通知する（1回）', async () => {
    stubFetchOk();
    const hook = createRevalidationAfterChangeHook('manufacturers');
    const req = fakeReq();
    await hook({ doc: { _status: 'published' }, req, operation: 'update' } as never);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('ArticlePlacements相当: draft保存では通知しない（0回）', async () => {
    stubFetchOk();
    // `RevalidatableCollectionSlug`に'article-placements'相当が無ければcastで通す。
    const hook = createRevalidationAfterChangeHook('robots');
    const req = fakeReq();
    await hook({ doc: { _status: 'draft' }, req, operation: 'update' } as never);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('ArticlePlacements相当: published書き込みでは通知する（1回）', async () => {
    stubFetchOk();
    const hook = createRevalidationAfterChangeHook('robots');
    const req = fakeReq();
    await hook({ doc: { _status: 'published' }, req, operation: 'update' } as never);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Media相当（非versioned、_statusフィールド自体が無い）: 変更のたび通知する（1回）', async () => {
    stubFetchOk();
    const hook = createRevalidationAfterChangeHook('robots');
    const req = fakeReq();
    await hook({ doc: { filename: 'a.png' }, req, operation: 'update' } as never);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('SiteSettings相当: draft保存では通知しない（0回）', async () => {
    stubFetchOk();
    const hook = createSettingsRevalidationAfterChangeHook();
    const req = fakeReq();
    await hook({ doc: { _status: 'draft' }, req } as never);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('SiteSettings相当: published保存では通知する（1回）', async () => {
    stubFetchOk();
    const hook = createSettingsRevalidationAfterChangeHook();
    const req = fakeReq();
    await hook({ doc: { _status: 'published' }, req } as never);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deferRevalidationUntilCommitがtrueなら、_statusに関わらず通知しない（既存の公開経路優先）', async () => {
    stubFetchOk();
    const hook = createRevalidationAfterChangeHook('manufacturers');
    const req = { ...fakeReq(), context: { deferRevalidationUntilCommit: true } } as unknown as PayloadRequest;
    await hook({ doc: { _status: 'published' }, req, operation: 'update' } as never);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('notifyRevalidationAfterCommit（結果の型、公開UIがtoastを出し分けるために必要）', () => {
  const originalSecret = process.env.REVALIDATION_SECRET;
  const originalUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL;
  const fakePayload = { logger: { warn: vi.fn(), info: vi.fn() } } as unknown as Payload;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalSecret === undefined) delete process.env.REVALIDATION_SECRET;
    else process.env.REVALIDATION_SECRET = originalSecret;
    if (originalUrl === undefined) delete process.env.PAYLOAD_PUBLIC_SERVER_URL;
    else process.env.PAYLOAD_PUBLIC_SERVER_URL = originalUrl;
  });

  it('secret未設定ならmissing-secretを返す（fetchは呼ばない）', async () => {
    delete process.env.REVALIDATION_SECRET;
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3399';
    vi.stubGlobal('fetch', vi.fn());
    const result = await notifyRevalidationAfterCommit('manufacturers', fakePayload);
    expect(result).toEqual({ status: 'missing-secret' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('base URLが解決できないならmissing-base-urlを返す', async () => {
    process.env.REVALIDATION_SECRET = 'x';
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    vi.stubGlobal('fetch', vi.fn());
    const result = await notifyRevalidationAfterCommit('manufacturers', fakePayload);
    expect(result).toEqual({ status: 'missing-base-url' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('応答が200ならokを返す', async () => {
    process.env.REVALIDATION_SECRET = 'x';
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3399';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response));
    const result = await notifyRevalidationAfterCommit('manufacturers', fakePayload);
    expect(result).toEqual({ status: 'ok' });
  });

  it('応答が非2xxならnon-okとhttpStatusを返す', async () => {
    process.env.REVALIDATION_SECRET = 'x';
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3399';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response));
    const result = await notifyRevalidationAfterCommit('manufacturers', fakePayload);
    expect(result).toEqual({ status: 'non-ok', httpStatus: 401 });
  });

  it('fetch自体が失敗したらunreachableとerrorを返す', async () => {
    process.env.REVALIDATION_SECRET = 'x';
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3399';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const result = await notifyRevalidationAfterCommit('manufacturers', fakePayload);
    expect(result).toEqual({ status: 'unreachable', error: 'network down' });
  });
});
