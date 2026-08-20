/**
 * destructiveなPostgres操作（全件delete、`CREATE DATABASE`/`DROP DATABASE`等）を行う
 * test suite全部が使う、**唯一の**throwaway DB判定ロジック。host判定に加えてDB名も検査する。
 *
 * 2026-08-20のインシデント: 当初このguardはhostしか見ておらず、`.env.local`の既定
 * `DATABASE_URL`がlocalhost上の`deploid_dev`（developerの永続devDB）を指していたため、
 * 明示的なDATABASE_URL指定を忘れたtest実行がそのままdeploid_devへ対して破壊的操作を
 * 行い、実データが失われた。host基準だけでは「localhost上の共有DB」を安全とみなして
 * しまうため、**DB名が明示的にthrowaway/test用途だと分かる形（test/throwaway/e2eを含む）
 * でない限り拒否するallowlist方式**にした。既知の非throwaway名（`deploid_dev`等）は、
 * たとえ将来allowlistパターンへ偶然マッチしても常に拒否する。
 *
 * 事故直後の初回修正では、この判定ロジックが`tests/content/admin-access.test.ts`・
 * `tests/content/migrationTestSupport.ts`・`tests/integration/mcpIntegrationSupport.ts`の
 * 3箇所に別々にコピーされていたことが分かり（2箇所しか修正が反映されず、残り2箇所は
 * 旧host-onlyロジックのまま取り残された）、外部レビューで指摘された。以後、
 * **この判定ロジックの実体はこのファイルだけに置き、他の全ファイルはここからimportする**
 * （コピーを作らない）。
 */
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** 既知の共有/永続DB名。allowlistパターンへの偶然の一致に関わらず常に拒否する。 */
const KNOWN_NON_THROWAWAY_DATABASE_NAMES = new Set(['deploid_dev', 'postgres']);

/** throwaway用途だと名前から明示的に読み取れる場合だけ許可する（大文字小文字は無視）。 */
const THROWAWAY_DATABASE_NAME_PATTERN = /test|throwaway|e2e/i;

/**
 * 任意のPostgres接続URL文字列に対する判定本体。host・DB名の両方を検査する。
 * `callerFile`はエラーメッセージにだけ使う（どのsuiteが拒否したかを分かりやすくする）。
 */
export function assertLocalThrowawayDatabaseUrl(callerFile: string, raw: string | undefined): void {
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

/** 現在のprocessの`DATABASE_URL`（1つの共有throwaway DBへ直接destructive操作をするsuite用）。 */
export function assertLocalThrowawayDatabase(callerFile: string): void {
  assertLocalThrowawayDatabaseUrl(callerFile, process.env.DATABASE_URL);
}
