/**
 * `docs/plans/content-platform-migration-plan-v1.md` Task 7 Step 4。
 *
 * Draft Mode有効化の2経路（Payloadログイン済みcontent-draft-writer以上 / 署名付き5分token）と、
 * 有効化後に毎requestで検証する `getActivePreviewSession()` を、実Payload + 実Postgres
 * （throwaway）に対して検証する。
 *
 * **`next/headers` の `draftMode()` をmockする理由**: `draftMode()`/`cookies()` はNext.jsの
 * request-scope（AsyncLocalStorage）の中でしか呼べず、Vitestから素の `Request` を渡して
 * route handlerを直接呼ぶ形（このファイルの手法）では「outside a request scope」で例外になる
 * （実機確認済み）。そのためNextの実際のprerender-bypass cookieの中身はここでは検証できない
 * ——`draftMode().enable()` が「検証が全部通ったときだけ」呼ばれること自体をmockでassertする
 * ことで代替する。実際のHTML出力への反映はPlaywright e2eの領域。
 */
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import {
  getActivePreviewSession,
  isAllowedPreviewRedirect,
  mintPreviewToken,
  mintTokenPreviewSession,
  mintUserPreviewSession,
  PREVIEW_SESSION_COOKIE_NAME,
} from '../../lib/content/previewTokens';

const draftModeState = { enable: vi.fn(), disable: vi.fn() };
vi.mock('next/headers', () => ({
  draftMode: vi.fn(async () => draftModeState),
}));

// mockを設定した後でrouteをimportする（vi.mockはhoistされるため、実際には順序に関わらず有効）。
const enableRoute = await import('../../src/app/api/draft-mode/enable/route');
const disableRoute = await import('../../src/app/api/draft-mode/disable/route');

const PASSWORD = 'Str0ngPassw0rd!23';

describe('isAllowedPreviewRedirect (open redirect防止)', () => {
  it.each([
    '/',
    '/robots',
    '/robots/some-slug',
    '/manufacturers',
    '/manufacturers/acme',
    '/use-cases',
    '/use-cases/x',
    '/reports',
    '/reports/x?utm=1',
  ])('allows %s', (path) => {
    expect(isAllowedPreviewRedirect(path)).toBe(true);
  });

  it.each([
    ['//evil.com', 'protocol-relative'],
    ['//evil.com/robots', 'protocol-relative with allowlisted-looking suffix'],
    ['https://evil.com', 'absolute URL'],
    ['https://evil.com/robots', 'absolute URL with allowlisted-looking path'],
    ['\\\\evil.com', 'backslash'],
    ['/robots/\\evil.com', 'embedded backslash'],
    ['/robots/../../etc/passwd', 'literal traversal'],
    ['/robots/%2e%2e/%2e%2e/etc/passwd', 'single-encoded traversal'],
    ['/robots/%252e%252e/%252e%252e/etc/passwd', 'double-encoded traversal'],
    ['/admin', 'not on the allowlist'],
    ['/robots-secret', 'prefix look-alike without a boundary'],
    ['robots', 'not rooted at /'],
    ['', 'empty string'],
    ['javascript:alert(1)', 'javascript scheme'],
  ])('rejects %s (%s)', (path) => {
    expect(isAllowedPreviewRedirect(path)).toBe(false);
  });
});

describe('Draft Mode enable/disable (real Payload + Postgres)', () => {
  let payload: Payload;
  const originalSecret = process.env.PREVIEW_TOKEN_SECRET;
  const SECRET = 'preview-token-test-secret-do-not-reuse';

  const WRITER_EMAIL = 'draft-mode-writer@example.com';
  const READER_EMAIL = 'draft-mode-reader@example.com';
  let writerToken: string;
  let writerId: string | number;
  let readerId: string | number;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/draft-mode-security.test.ts');
    process.env.PREVIEW_TOKEN_SECRET = SECRET;
    payload = await getPayload({ config });

    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
    const owner = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: 'draft-mode-owner@example.com', password: PASSWORD, role: 'content-reader' },
    });
    const writer = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      user: owner,
      data: { email: WRITER_EMAIL, password: PASSWORD, role: 'content-draft-writer' },
    });
    const reader = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      user: owner,
      data: { email: READER_EMAIL, password: PASSWORD, role: 'content-reader' },
    });
    writerId = (writer as { id: string | number }).id;
    readerId = (reader as { id: string | number }).id;

    const loginResult = await payload.login({ collection: 'admins', data: { email: WRITER_EMAIL, password: PASSWORD } });
    if (!loginResult.token) throw new Error('login did not return a token');
    writerToken = loginResult.token;
  });

  afterAll(async () => {
    process.env.PREVIEW_TOKEN_SECRET = originalSecret;
    await payload?.destroy();
  });

  beforeEach(() => {
    draftModeState.enable.mockClear();
    draftModeState.disable.mockClear();
  });

  function authedRequest(url: string, init: RequestInit = {}): Request {
    return new Request(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `JWT ${writerToken}` },
    });
  }

  // ── 経路1: Payloadログイン済み content-draft-writer以上 ──────────────────────

  it('enables draft mode for an authenticated content-draft-writer', async () => {
    const response = await enableRoute.POST(
      authedRequest('http://localhost/api/draft-mode/enable', {
        method: 'POST',
        body: JSON.stringify({ redirect: '/robots' }),
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/robots');
    expect(response.headers.get('set-cookie')).toContain(PREVIEW_SESSION_COOKIE_NAME);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(draftModeState.enable).toHaveBeenCalledOnce();
  });

  it('rejects an unauthenticated request with no token and no Payload session', async () => {
    const response = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', { method: 'POST', body: JSON.stringify({}) }),
    );
    expect(response.status).toBe(401);
    expect(draftModeState.enable).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a content-reader (below content-draft-writer) even though they are authenticated', async () => {
    const readerLogin = await payload.login({ collection: 'admins', data: { email: READER_EMAIL, password: PASSWORD } });
    if (!readerLogin.token) throw new Error('login did not return a token');
    const response = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', {
        method: 'POST',
        headers: { Authorization: `JWT ${readerLogin.token}` },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(401);
    expect(draftModeState.enable).not.toHaveBeenCalled();
  });

  it('rejects an open-redirect target for the authenticated path (fail-closed, not truncated/sanitized)', async () => {
    const response = await enableRoute.POST(
      authedRequest('http://localhost/api/draft-mode/enable', {
        method: 'POST',
        body: JSON.stringify({ redirect: '//evil.com' }),
      }),
    );
    expect(response.status).toBe(400);
    expect(draftModeState.enable).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  // ── 経路2: 署名付き5分token ──────────────────────────────────────────────

  it('enables draft mode for a valid signed token and redirects to the token-embedded path', async () => {
    const token = await mintPreviewToken({ payload, sub: 'external-viewer@example.com', redirect: '/reports' });
    const response = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', { method: 'POST', body: JSON.stringify({ token }) }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/reports');
    expect(response.headers.get('set-cookie')).toContain(PREVIEW_SESSION_COOKIE_NAME);
    expect(draftModeState.enable).toHaveBeenCalledOnce();
  });

  it('rejects the same token a second time (nonce reuse)', async () => {
    const token = await mintPreviewToken({ payload, sub: 'external-viewer@example.com', redirect: '/reports' });
    const first = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', { method: 'POST', body: JSON.stringify({ token }) }),
    );
    expect(first.status).toBe(303);
    draftModeState.enable.mockClear();

    const second = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', { method: 'POST', body: JSON.stringify({ token }) }),
    );
    expect(second.status).toBe(401);
    expect(draftModeState.enable).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    const eightMinutesAgo = Date.now() - 8 * 60 * 1000;
    const token = await mintPreviewToken({
      payload,
      sub: 'external-viewer@example.com',
      redirect: '/reports',
      now: eightMinutesAgo,
    });
    const response = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', { method: 'POST', body: JSON.stringify({ token }) }),
    );
    expect(response.status).toBe(401);
    expect(draftModeState.enable).not.toHaveBeenCalled();
  });

  it('rejects a token with a tampered payload (signature no longer matches)', async () => {
    const token = await mintPreviewToken({ payload, sub: 'external-viewer@example.com', redirect: '/reports' });
    const [payloadB64, signature] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const tamperedPayload = { ...decoded, sub: 'attacker@example.com' };
    const tamperedB64 = Buffer.from(JSON.stringify(tamperedPayload), 'utf8').toString('base64url');
    const tamperedToken = `${tamperedB64}.${signature}`;

    const response = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', {
        method: 'POST',
        body: JSON.stringify({ token: tamperedToken }),
      }),
    );
    expect(response.status).toBe(401);
    expect(draftModeState.enable).not.toHaveBeenCalled();
  });

  it('rejects a token signed with the wrong secret', async () => {
    process.env.PREVIEW_TOKEN_SECRET = 'a-different-secret';
    const tokenSignedWrong = await mintPreviewToken({ payload, sub: 'x@example.com', redirect: '/reports' });
    process.env.PREVIEW_TOKEN_SECRET = SECRET;

    const response = await enableRoute.POST(
      new Request('http://localhost/api/draft-mode/enable', {
        method: 'POST',
        body: JSON.stringify({ token: tokenSignedWrong }),
      }),
    );
    expect(response.status).toBe(401);
    expect(draftModeState.enable).not.toHaveBeenCalled();
  });

  it('mintPreviewToken itself refuses to mint a token for a non-allowlisted redirect', async () => {
    await expect(
      mintPreviewToken({ payload, sub: 'x@example.com', redirect: 'https://evil.com' }),
    ).rejects.toThrow(/preview-redirect-not-allowed/);
  });

  it('mintPreviewToken caps the TTL at 5 minutes even if a longer ttlMs is requested', async () => {
    const now = Date.now();
    const token = await mintPreviewToken({
      payload,
      sub: 'x@example.com',
      redirect: '/reports',
      now,
      ttlMs: 60 * 60 * 1000, // 1時間を要求しても5分に丸められる
    });
    const [payloadB64] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as { exp: number };
    expect(decoded.exp - now).toBeLessThanOrEqual(5 * 60 * 1000);
  });

  // ── disable: cookieを消すだけでredirectは受け取らない ───────────────────────

  it('disable clears the session cookie and never redirects', async () => {
    const response = await disableRoute.POST();
    expect(response.status).toBe(204);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toContain(`${PREVIEW_SESSION_COOKIE_NAME}=;`);
    expect(draftModeState.disable).toHaveBeenCalledOnce();
  });

  // ── getActivePreviewSession: 毎request検証、権限失効後は既存cookieでも拒否 ──────────

  describe('getActivePreviewSession (draft取得側の毎request検証)', () => {
    it('returns ok for a freshly minted user session', async () => {
      const cookie = mintUserPreviewSession(writerId);
      const result = await getActivePreviewSession(cookie, payload);
      expect(result.ok).toBe(true);
      if (result.ok && result.kind === 'user') {
        expect(result.sub).toBe(String(writerId));
      }
    });

    it('rejects a missing cookie', async () => {
      const result = await getActivePreviewSession(undefined, payload);
      expect(result).toEqual({ ok: false, reason: 'missing' });
    });

    it('rejects a tampered session cookie', async () => {
      const cookie = mintUserPreviewSession(writerId);
      const tampered = `${cookie.slice(0, -2)}00`;
      const result = await getActivePreviewSession(tampered, payload);
      expect(result.ok).toBe(false);
    });

    it('rejects an expired session cookie', async () => {
      const cookie = mintUserPreviewSession(writerId, Date.now() - 2 * 60 * 60 * 1000);
      const result = await getActivePreviewSession(cookie, payload);
      expect(result).toEqual({ ok: false, reason: 'expired' });
    });

    it('rejects a session for a user who no longer has content-draft-writer or above (revoked after the cookie was issued)', async () => {
      const cookie = mintUserPreviewSession(readerId);
      // readerIdはcontent-readerのまま（content-draft-writer未満）なので、cookie自体は
      // 有効でも「毎request再検証」がroleを見て拒否する。
      const result = await getActivePreviewSession(cookie, payload);
      expect(result).toEqual({ ok: false, reason: 'role-revoked-or-insufficient' });
    });

    it('reflects a live role downgrade: a session minted while content-draft-writer is rejected after the role is demoted', async () => {
      const demoted = await payload.create({
        collection: 'admins',
        overrideAccess: true,
        data: { email: 'demote-me@example.com', password: PASSWORD, role: 'content-draft-writer' },
      });
      const demotedId = (demoted as { id: string | number }).id;
      const cookie = mintUserPreviewSession(demotedId);

      const before = await getActivePreviewSession(cookie, payload);
      expect(before.ok).toBe(true);

      await payload.update({
        collection: 'admins',
        id: demotedId,
        overrideAccess: true,
        data: { role: 'content-reader' },
      });

      const after = await getActivePreviewSession(cookie, payload);
      expect(after).toEqual({ ok: false, reason: 'role-revoked-or-insufficient' });
    });

    it('re-reads the user role from the database on every call rather than caching it (draft response must never be shared-cached)', async () => {
      const cookie = mintUserPreviewSession(writerId);
      const spy = vi.spyOn(payload, 'findByID');
      await getActivePreviewSession(cookie, payload);
      await getActivePreviewSession(cookie, payload);
      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });

    it('returns ok for a token-kind session without touching the admins collection', async () => {
      const sessionCookie = mintTokenPreviewSession('viewer@example.com');
      const spy = vi.spyOn(payload, 'findByID');
      const result = await getActivePreviewSession(sessionCookie, payload);
      expect(result).toEqual({ ok: true, kind: 'token', sub: 'viewer@example.com' });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
