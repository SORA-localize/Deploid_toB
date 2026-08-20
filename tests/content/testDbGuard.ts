/**
 * `tests/content/admin-access.test.ts` が確立したguardを共有化したもの。このsuite群
 * （payload-schema以外の `tests/content/*.test.ts`）は実Payload Local API + 実Postgresに対して
 * destructiveな操作（全件delete等）を行うため、DATABASE_URLのhostがlocalhost系でなければ
 * 実行前に例外で止める。ローカルでの実行方法は `admin-access.test.ts` の元コメントを参照。
 *
 * 2026-08-20のインシデント（このguardがhostしか見ておらず、`.env.local`の既定
 * `DATABASE_URL`がlocalhost上の`deploid_dev`（developerの永続devDB）を指していたため、
 * 明示的なDATABASE_URL指定を忘れたtest実行がそのままdeploid_devへ対して破壊的操作を
 * 行い、実データが失われた）を受けて、host判定に加えてDB名も検査するよう強化した。
 * host基準だけでは「localhost上の共有DB」を安全とみなしてしまうため、**DB名が
 * 明示的にthrowaway/test用途だと分かる形（test/throwaway/e2eを含む）でない限り拒否する
 * allowlist方式**にした。既知の非throwaway名（`deploid_dev`等）は、たとえ将来
 * allowlistパターンへ偶然マッチしても常に拒否する。
 */
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** 既知の共有/永続DB名。allowlistパターンへの偶然の一致に関わらず常に拒否する。 */
const KNOWN_NON_THROWAWAY_DATABASE_NAMES = new Set(['deploid_dev', 'postgres']);

/** throwaway用途だと名前から明示的に読み取れる場合だけ許可する（大文字小文字は無視）。 */
const THROWAWAY_DATABASE_NAME_PATTERN = /test|throwaway|e2e/i;

export function assertLocalThrowawayDatabase(callerFile: string): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(`DATABASE_URL is not set. ${callerFile} runs destructive operations and must only ever run against a local throwaway Postgres.`);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`DATABASE_URL is not a valid connection URL: ${raw.slice(0, 20)}...`);
  }

  const host = url.hostname;
  if (!LOCAL_DATABASE_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run ${callerFile} against DATABASE_URL host "${host}". This suite runs destructive ` +
        `operations and only runs against a local throwaway Postgres (host in ${[...LOCAL_DATABASE_HOSTS].join(', ')}), ` +
        'never against a shared/managed database.',
    );
  }

  // pathnameは先頭に`/`を含む（例: `/deploid_dev`）。
  const databaseName = url.pathname.replace(/^\//, '');
  if (
    KNOWN_NON_THROWAWAY_DATABASE_NAMES.has(databaseName) ||
    !THROWAWAY_DATABASE_NAME_PATTERN.test(databaseName)
  ) {
    throw new Error(
      `Refusing to run ${callerFile} against database "${databaseName}". This suite runs destructive operations ` +
        'and only runs against a database whose name is explicitly throwaway (must contain "test", "throwaway", ' +
        `or "e2e"; localhost alone is not sufficient — "${databaseName}" may be a shared/persistent database such ` +
        'as the developer\'s local dev DB). Use a DATABASE_URL like ' +
        '"postgresql://.../deploid_<task>_test" or "...deploid_<task>_throwaway".',
    );
  }
}
