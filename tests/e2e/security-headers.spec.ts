import { expect, test } from '@playwright/test';

/**
 * unit test は「正本の配列に何が入っているか」しか見ない。
 * `next.config.ts` の `headers()` が実際にレスポンスへ載せているかは、こちらでしか分からない。
 * source の書き間違い（`/:path*` を落とす等）はここで初めて赤くなる。
 */
test('serves baseline security headers', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['permissions-policy']).toContain('camera=()');
});

test('serves CSP as report-only and never enforced', async ({ request }) => {
  const headers = (await request.get('/')).headers();

  expect(headers['content-security-policy-report-only']).toContain("default-src 'self'");
  // enforce に切り替わると外部リソースが黙って落ちる。事故で有効化されないよう固定する。
  expect(headers['content-security-policy']).toBeUndefined();
});

test('applies the headers to every route, not just the home page', async ({ request }) => {
  // `source: '/:path*'` の取りこぼしを捕まえる。静的 route と動的 route の両方を見る。
  for (const route of ['/privacy', '/robots', '/robots/unitree-g1', '/sitemap.xml']) {
    const headers = (await request.get(route)).headers();
    expect(headers['x-content-type-options'], `missing on ${route}`).toBe('nosniff');
  }
});
