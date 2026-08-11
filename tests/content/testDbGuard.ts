/**
 * `tests/content/admin-access.test.ts` が確立したguardを共有化したもの。このsuite群
 * （payload-schema以外の `tests/content/*.test.ts`）は実Payload Local API + 実Postgresに対して
 * destructiveな操作（全件delete等）を行うため、DATABASE_URLのhostがlocalhost系でなければ
 * 実行前に例外で止める。ローカルでの実行方法は `admin-access.test.ts` の元コメントを参照。
 */
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function assertLocalThrowawayDatabase(callerFile: string): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(`DATABASE_URL is not set. ${callerFile} runs destructive operations and must only ever run against a local throwaway Postgres.`);
  }

  let host: string;
  try {
    host = new URL(raw).hostname;
  } catch {
    throw new Error(`DATABASE_URL is not a valid connection URL: ${raw.slice(0, 20)}...`);
  }

  if (!LOCAL_DATABASE_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run ${callerFile} against DATABASE_URL host "${host}". This suite runs destructive ` +
        `operations and only runs against a local throwaway Postgres (host in ${[...LOCAL_DATABASE_HOSTS].join(', ')}), ` +
        'never against a shared/managed database.',
    );
  }
}
