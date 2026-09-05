/**
 * `docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 0 専用の一時routeで、**検証後に
 * 削除する**（`test ! -e src/app/api/admin/debug-db-pool/route.ts` で削除漏れを機械検出する）。
 *
 * ## 何をするrouteか
 *
 * `process.env.DATABASE_URL` を**parseするだけ**で、Postgresへは一切接続しない。
 * host種別とport番号だけを返し、credential（user/password/database名）は一切含めない。
 * `task9-preview-rehearsal-preflight-v1.md`「pooler mode調査・解決」が使った手法をそのまま踏襲する。
 *
 * ## なぜPayload認証で守らないのか
 *
 * このrouteの目的は「PostgresがEMAXCONNSESSIONで到達不能な状況を、DBに接続せずに診断する」こと。
 * `authenticatePublisher()`（`publishRequestAuth.ts`）は内部で`payload.auth()`を呼び、
 * それ自体がDB接続を要求する。DBが枯渇している状況を診断したいのに、診断routeの入口を
 * DB依存の認証で塞ぐと、まさに調べたい状況で診断routeごと使えなくなる本末転倒になる。
 *
 * 代わりに、Vercelの Deployment Protection（`ssoProtection.deploymentType:
 * 'all_except_custom_domains'`、2026-09-04にVercel Project APIで確認済み）が
 * Preview全体を既に保護している。このrouteが追加で公開する情報はport番号とhost種別の
 * 文字列のみで、credentialは含まない。
 */
export async function GET(): Promise<Response> {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return Response.json({ hasDatabaseUrl: false }, { status: 200 });
  }

  let port: string | null = null;
  let hostKind: 'pooler' | 'direct' | 'unknown' = 'unknown';
  let poolerMode: 'session' | 'transaction' | null = null;

  try {
    const url = new URL(raw);
    port = url.port || null;
    if (url.hostname.includes('pooler.supabase.com')) {
      hostKind = 'pooler';
      if (port === '5432') poolerMode = 'session';
      else if (port === '6543') poolerMode = 'transaction';
    } else if (url.hostname.endsWith('.supabase.co')) {
      hostKind = 'direct';
    }
  } catch {
    // parse失敗時もcredentialを含む生文字列は返さない。
    return Response.json({ hasDatabaseUrl: true, parseError: true }, { status: 200 });
  }

  return Response.json(
    { hasDatabaseUrl: true, port, hostKind, poolerMode, vercelEnv: process.env.VERCEL_ENV ?? null },
    { status: 200 },
  );
}
