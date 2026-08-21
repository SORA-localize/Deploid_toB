/**
 * `payload migrate` / `migrate:create` / `migrate:down` / `migrate:status` の等価物を、
 * `payload`本体のCLI（`node_modules/.bin/payload`、実体は`node_modules/payload/bin.js`）を
 * 経由せずに、`tsx`（`node_modules/.bin/tsx`）から直接起動するためのラッパー。
 *
 * 背景（remediation group 6, 2026-08-21〜）: `payload/bin.js`はTypeScript製の
 * `payload.config.ts`を実行時transpileするために`tsx/esm/api`の`tsImport()`を呼ぶが、
 * これがNode 22.12.0（このrepoのCIが固定するversion）上ではtsxの**非同期
 * worker-thread経由の`module.register()`**を使う経路しか選べない
 * （`payload/bin.js`自身のコメントが、別の無関係なtsxバグ回避のため同期版`registerHooks`を
 * 明示的に無効化しており、その結果Node 22.12.0ではasync workerパスしか残らない）。
 * `payload/bin.js`はこの起動処理全体を一度もawaitされない`void start()`として実行しており
 * （`patches/payload+3.87.1.patch`で`await start()`へ修正済み）、短時間に子processを
 * 連続起動する負荷下では、このworker-thread起動がNodeの「event loopがidleかどうか」判定との
 * 競争に負けることがある。`await`修正後もこの競合そのものは解消せず、Node自身が
 * `Warning: Detected unsettled top-level await`（exit code 13）を出して終了する
 * ——ローカルの静かな開発機では稀にしか踏まないが、GitHub Actionsの共有runner
 * （resource制約が強い）では、同一コマンドを3回連続再試行しても踏み続けるほど頻発した
 * （実測: PR #34のCI run、`migrate:create driftcheck1 --skip-empty`がattempt 1/3・2/3両方で
 * このraceを踏み、3回目も失敗した）。ローカルで`stress-ng --cpu 16 --cpu-load 95`により
 * 意図的にCPU競合を再現したところ、同じ「3回中2回以上racing」というCI相当の頻度で
 * 再現することを確認済み（詳細は`.superpowers/sdd/content-platform-migration-plan-v1/
 * remediation-group6-report.md`）。
 *
 * これに対し、`scripts/stamp-environment.mts`（`tsx <script>`というCLI経由——loader登録が
 * application codeより前、Node起動時の`--import`相当の仕組みで前倒しで一度だけ行われる）は、
 * 同じPR #34のCI runの中で、`payload/bin.js`経由の呼び出しが繰り返しracingしていた
 * まさにその時間帯に、4回とも1回もraceを踏まずに成功している。ローカルの
 * `stress-ng`負荷下でも同様（20回中0回）。つまりtsxのworker-thread loader起動という
 * 重い・racyな処理は、`tsx <script>`というbootstrap経路では**1 process につき1回、
 * application codeが動き出すより前に**前倒しで完了しており、以降の（本scriptを含む）
 * 動的importはその**既に確立済みの**loaderをそのまま再利用するだけで済む——
 * `payload/bin.js`のように、CLIの本処理と同時並行でloader起動そのものを行う必要がない。
 *
 * このscriptは、`payload/dist/bin/migrate.js`（package.jsonの`exports`に含まれない
 * 内部pathのため、`payload`パッケージの公開APIとしてimportできない）を再実装するのではなく、
 * **そのファイルが実際に呼んでいるのと全く同じ、`payload`の公開API**
 * （`payload.init()` → `payload.db.migrate()` / `.createMigration()` / `.migrateDown()` /
 * `.migrateStatus()`）だけを直接呼ぶ。つまり検証対象のmigration機構そのもの
 * （`@payloadcms/drizzle`のmigrate実装）は一切変えていない——変えているのは、
 * その機構を呼び出すためのprocess起動経路（`payload/bin.js`の代わりに`tsx`のCLI）だけ。
 *
 * Usage: `tsx scripts/run-payload-migration-cli.mts -- <command> [args...]`
 *   command: migrate | migrate:create | migrate:down | migrate:status
 *   migrate:create [migrationName] [--skip-empty] [--force-accept-warning]
 *
 * Env vars（`payload.config.ts` / `tests/fixtures/payload-migrations/mcp-fixture.config.ts`
 * 自身が読むものはそのまま——ここで別途処理する必要はない）:
 *   DATABASE_URL, PAYLOAD_SECRET — 必須（`payload.config.ts`の`requireEnv`参照）。
 *   PAYLOAD_CONFIG_PATH — 省略可。省略時は`<repo root>/payload.config.ts`
 *     （`payload`本体の`findConfig()`のこのrepoでの実際の解決結果と同じ——
 *     `tsconfig.json`の`"@payload-config": ["./payload.config.ts"]`で確認済み）。
 *   PAYLOAD_TEST_MIGRATION_DIR — configファイル自身が読む。ここでは何もしない。
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import payload from 'payload';

async function main(): Promise<void> {
  // `runPayloadCli()`は`spawnSync(TSX_BIN, [scriptPath, '--', ...args], ...)`という、
  // このrepoの`runTsxScript()`と同じ呼び出し規約で起動する。その先頭の`--`は
  // シェル/npmの引数分離慣習をそのまま踏襲しているだけで、tsx/Node側では自動的に
  // 取り除かれないため、ここで明示的に無視する。
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  const command = args[0];
  if (!command) {
    console.error(
      'Usage: tsx scripts/run-payload-migration-cli.mts -- <command> [args...]\n' +
        'command: migrate | migrate:create | migrate:down | migrate:status',
    );
    process.exitCode = 1;
    return;
  }

  // `payload migrate` CLI自身が`payload.init()`より前に立てるのと同じフラグ。dev-modeの
  // schema auto-pushを止め、`payload.config.ts`が`PAYLOAD_TEST_MIGRATION_DIR`を
  // 読むタイミングより前に必ず立っている必要がある（configのdynamic importより前）。
  process.env.PAYLOAD_MIGRATING = 'true';

  const configPathRaw = process.env.PAYLOAD_CONFIG_PATH;
  const configPath = configPathRaw
    ? path.isAbsolute(configPathRaw)
      ? configPathRaw
      : path.resolve(process.cwd(), configPathRaw)
    : path.resolve(process.cwd(), 'payload.config.ts');

  const imported = (await import(pathToFileURL(configPath).toString())) as {
    default?: unknown;
  };
  const config = imported.default !== undefined ? await imported.default : imported;

  // `payload/dist/bin/migrate.js`は`...prettySyncLogger`（`loggerDestination`/`loggerOptions`）を
  // ここに追加で渡しているが、実際に確認したところ`payload@3.87.1`の`payload.init()`実装は
  // この2つのkeyをどこでも参照していない（dead option、おそらく旧versionの名残）。かつ
  // `prettySyncLoggerDestination`自体は`payload`パッケージの`exports`に含まれない内部pathの
  // ため、真似して`import`しようとすると`ERR_PACKAGE_PATH_NOT_EXPORTED`で即死する
  // （実機確認済み）。実質的な差は無いため、意図的に省略している。
  await payload.init({
    config: config as Parameters<typeof payload.init>[0]['config'],
    disableDBConnect: command === 'migrate:create',
    disableOnInit: true,
  });

  const adapter = payload.db;
  if (!adapter) {
    throw new Error('No database adapter found');
  }

  switch (command) {
    case 'migrate':
      await adapter.migrate();
      break;
    case 'migrate:create': {
      const migrationName = args[1] && !args[1].startsWith('--') ? args[1] : undefined;
      await adapter.createMigration({
        forceAcceptWarning: args.includes('--force-accept-warning'),
        migrationName,
        payload,
        skipEmpty: args.includes('--skip-empty'),
      });
      break;
    }
    case 'migrate:down':
      await adapter.migrateDown();
      break;
    case 'migrate:status':
      await adapter.migrateStatus();
      break;
    default:
      console.error(`Unknown command: ${command}. migrate | migrate:create | migrate:down | migrate:status`);
      process.exitCode = 1;
      return;
  }

  payload.logger.info('Done.');
  // `payload/bin.js`はmigrate系commandで`payload.destroy()`を呼ばず、プロセス終了に
  // 接続closeを委ねている。このscriptは明示的にcloseする——`main()`のみを実行して即終了する
  // 単発scriptなので、意図しない接続リークを残さないほうが安全なため、あえてbin.jsとは
  // 違う選択をしている。ここでの`await`は通常のDB接続closeであり、tsxのloader起動のような
  // 外部process/worker-thread起動を伴わないため、bin.jsが踏んでいたレースとは無関係。
  await payload.destroy();
}

main()
  .then(() => {
    process.exit(process.exitCode ?? 0);
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
