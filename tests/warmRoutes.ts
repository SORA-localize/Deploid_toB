/**
 * e2e 開始前に各 route を1回ずつ順番に叩いて温めておく。
 *
 * 対象は単一の `next start` プロセスで、PPR の初回レンダリングは route ごとに実費がかかる。
 * 温めずに走らせると、複数 worker が同じ重い route へ同時に初回アクセスした時だけ
 * SSR が詰まり、**毎回別のテストで** `page.goto` が navigation timeout する
 * （テストを59件へ増やした 2026-08-03 に、3回に1回の頻度で再現）。
 * テスト対象の挙動とは無関係な失敗なので、原因側を潰す。
 *
 * timeout を延ばして隠すのではなく、初回コストを計測前に払い切る方針。
 */
const ROUTES = [
  '/',
  '/robots',
  '/robots/fixture-robot-a',
  '/manufacturers',
  '/manufacturers/fixture-mfr-alpha',
  '/use-cases',
  '/use-cases/fixture-usecase-one',
  '/reports',
  '/compare',
  '/privacy',
];

export default async function warmRoutes() {
  const baseURL = 'http://127.0.0.1:3399';

  for (const route of ROUTES) {
    const startedAt = Date.now();
    const response = await fetch(`${baseURL}${route}`);
    // 本文を読み切るまでがレンダリング。ヘッダだけでは温まらない。
    await response.text();
    const elapsed = Date.now() - startedAt;

    if (!response.ok) {
      throw new Error(`[warm] ${route} responded ${response.status}`);
    }
    if (elapsed > 3000) {
      console.log(`[warm] ${route} ${elapsed}ms`);
    }
  }
}
