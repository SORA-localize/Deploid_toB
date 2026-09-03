import { describe, expect, it } from 'vitest';
import { authenticatePublisher, isSameOriginRequest } from '@/lib/payload/publishRequestAuth';

/**
 * Admin公開UIのrequest受け入れ判定（`docs/plans/admin-publish-ui-plan-v1.md` Task 3）。
 *
 * ## なぜroute側でoriginを見るのか
 *
 * `payload.config.ts` は `csrf` を設定していない。`payload/dist/auth/extractJWT.js:21` は
 * `csrf.length === 0` のとき **Origin を検証せずcookieを受け入れる**。
 * 公開は権限のある破壊的操作なので、ここだけはrequest自身の値で同一originを確かめる。
 *
 * 環境変数由来のallowlist（`resolvePublicServerUrl()` 等）は使わない。undefinedを返しうるうえ、
 * Previewではbranch URLを返すのでdeployment固有URLから開いたadminが全て403になる。
 * 本番も独自ドメインなら不一致になり、「セキュリティ機構が正規操作を全部拒否する」形で壊れる。
 *
 * ## 2条件の位置づけ
 *
 * ブラウザ由来のCSRFを実際に塞いでいるのは `Sec-Fetch-Site: same-origin` の方
 * （この headerはJSから偽装できない）。`Origin`/`Host` 一致は defense in depth であって
 * 必須条件ではない。将来proxy構成を変えたとき何を守っていたか分かるようここに書いておく。
 */
const req = (headers: Record<string, string>) =>
  new Request('https://deploid.net/api/admin/publish', { method: 'POST', headers });

describe('isSameOriginRequest', () => {
  it('same-originかつOriginとHostが一致すれば通す', () => {
    expect(
      isSameOriginRequest(
        req({ 'sec-fetch-site': 'same-origin', origin: 'https://deploid.net', host: 'deploid.net' }),
      ),
    ).toBe(true);
  });

  it.each([
    ['cross-site', 'cross-site'],
    ['same-site（別subdomain）', 'same-site'],
    ['none（直接遷移）', 'none'],
  ])('Sec-Fetch-Siteが%sなら拒否する', (_label, value) => {
    expect(
      isSameOriginRequest(req({ 'sec-fetch-site': value, origin: 'https://deploid.net', host: 'deploid.net' })),
    ).toBe(false);
  });

  it('Sec-Fetch-Siteが無ければ拒否する（非ブラウザclientを通さない）', () => {
    expect(isSameOriginRequest(req({ origin: 'https://deploid.net', host: 'deploid.net' }))).toBe(false);
  });

  it('Originが無ければ拒否する', () => {
    expect(isSameOriginRequest(req({ 'sec-fetch-site': 'same-origin', host: 'deploid.net' }))).toBe(false);
  });

  it('OriginのホストがHostと違えば拒否する', () => {
    expect(
      isSameOriginRequest(
        req({ 'sec-fetch-site': 'same-origin', origin: 'https://evil.example', host: 'deploid.net' }),
      ),
    ).toBe(false);
  });

  it('x-forwarded-hostをHostより優先する（Vercelのproxy構成）', () => {
    // Vercelでは `host` がinternalな値になることがあり、外から見えるホストは x-forwarded-host。
    expect(
      isSameOriginRequest(
        req({
          'sec-fetch-site': 'same-origin',
          origin: 'https://deploid.net',
          host: 'internal.vercel.invalid',
          'x-forwarded-host': 'deploid.net',
        }),
      ),
    ).toBe(true);
  });

  it('x-forwarded-hostがあるとき、それと不一致なら拒否する', () => {
    expect(
      isSameOriginRequest(
        req({
          'sec-fetch-site': 'same-origin',
          origin: 'https://deploid.net',
          host: 'deploid.net',
          'x-forwarded-host': 'other.example',
        }),
      ),
    ).toBe(false);
  });

  it('Originのport違いを別originとして拒否する', () => {
    expect(
      isSameOriginRequest(
        req({ 'sec-fetch-site': 'same-origin', origin: 'https://deploid.net:8443', host: 'deploid.net' }),
      ),
    ).toBe(false);
  });

  it('壊れたOrigin文字列で例外を投げず拒否する', () => {
    expect(
      isSameOriginRequest(req({ 'sec-fetch-site': 'same-origin', origin: 'not a url', host: 'deploid.net' })),
    ).toBe(false);
  });
});

describe('authenticatePublisher', () => {
  const payloadStub = (user: unknown) => ({ auth: async () => ({ user }) }) as never;

  it('未認証は401 unauthenticated', async () => {
    expect(await authenticatePublisher(req({}), payloadStub(null))).toEqual({
      ok: false,
      status: 401,
      error: 'unauthenticated',
    });
  });

  it('draft-writerは403 insufficient-role（401へ畳み込まない）', async () => {
    // 401と403を区別する。既存の authenticateDraftWriter は両方nullへ潰しており、
    // それを踏襲すると「ログインしていない」と「権限が足りない」を利用者へ出し分けられない。
    expect(await authenticatePublisher(req({}), payloadStub({ id: 1, role: 'content-draft-writer' }))).toEqual({
      ok: false,
      status: 403,
      error: 'insufficient-role',
    });
  });

  it('content-readerも403', async () => {
    expect(await authenticatePublisher(req({}), payloadStub({ id: 1, role: 'content-reader' }))).toEqual({
      ok: false,
      status: 403,
      error: 'insufficient-role',
    });
  });

  it.each([['content-publisher'], ['platform-admin']])('%sはokでuserを返す', async (role) => {
    const result = await authenticatePublisher(req({}), payloadStub({ id: 7, role }));
    expect(result).toMatchObject({ ok: true, user: { id: 7, role } });
  });

  it('roleが未知の値なら403（fail-closed）', async () => {
    expect(await authenticatePublisher(req({}), payloadStub({ id: 1, role: 'superuser' }))).toEqual({
      ok: false,
      status: 403,
      error: 'insufficient-role',
    });
  });

  it('payload.authがthrowしても401へ倒す（500にしない）', async () => {
    const throwing = { auth: async () => { throw new Error('session store unavailable'); } } as never;
    expect(await authenticatePublisher(req({}), throwing)).toEqual({
      ok: false,
      status: 401,
      error: 'unauthenticated',
    });
  });
});
