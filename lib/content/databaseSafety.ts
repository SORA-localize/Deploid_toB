/**
 * destructiveなPostgres操作（全件delete、`CREATE DATABASE`/`DROP DATABASE`、`content:import`/
 * `content:restore`のupsert等）が対象DBを判定するための、**唯一の**分類ロジック。
 *
 * 2026-08-20のインシデント: `tests/content/*.test.ts`が使っていたthrowaway DB guard
 * （`assertLocalThrowawayDatabaseUrl`）は当初hostしか見ておらず、`.env.local`の既定
 * `DATABASE_URL`がlocalhost上の`deploid_dev`（developerの永続devDB）を指していたため、
 * 明示的なDATABASE_URL指定を忘れたtest実行がそのままdeploid_devへ破壊的操作を行い、
 * 実データが失われた。host基準だけでは「localhost上の共有DB」を安全とみなしてしまうため、
 * DB名も見るallowlist方式（`test`/`throwaway`/`e2e`を含むかどうか）に直した。
 *
 * その後の外部監査で、**この判定ロジックがtest suite側にしか無く**、実際に破壊的な書き込みを
 * 行う`scripts/import-content-to-payload.mts`（`assertWritableDatabase`）と
 * `scripts/restore-preflight.mts`（`assertRestoreInputModeAllowed`）が、同種のhost-onlyな
 * 脆弱性を持ったまま残っていることが判明した。この module へ**分類ロジックの実体**を1箇所へ
 * 抽出し、test（常に拒否・flagによる迂回なし）とCLIスクリプト（明示的な確認flagによる迂回を
 * 許す）の両方がここからimportする。
 *
 * ## test向けとCLI向けで意図的に意味が異なる点
 *
 * - test suite（`tests/content/testDbGuard.ts`経由）: destructiveなtest操作は「常に」throwaway
 *   DBだけを対象にする。`deploid_dev`等は**flagで迂回できない**——test実行がうっかり本物の
 *   devDBを壊すことは、どんな理由であれ正当化されない。
 * - CLIスクリプト（`content:import` / `content:restore`）: `deploid_dev`（developerの永続local
 *   dev DB）へ書き込むこと自体は、`data/*.ts`からdeploid_devを再同期する正当な開発フローで
 *   あり得る。よってCLI側は「local + throwaway名: 無条件許可」「local + 非throwaway名:
 *   明示的な確認flagを要求する」「remote: `--i-know-this-is-production`を要求する」の3分岐で、
 *   flagさえ立てれば書き込める（test suiteの全件削除とは性質が違う）。
 */

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** 既知の共有/永続DB名。allowlistパターンへの偶然の一致に関わらず常に non-throwaway 扱いにする。 */
const KNOWN_NON_THROWAWAY_DATABASE_NAMES = new Set(['deploid_dev', 'postgres']);

/** throwaway用途だと名前から明示的に読み取れる場合だけ throwaway 扱いにする（大文字小文字は無視）。 */
const THROWAWAY_DATABASE_NAME_PATTERN = /test|throwaway|e2e/i;

export interface DatabaseUrlClassification {
  /** `DATABASE_URL` のhostname。 */
  host: string;
  /** pathnameの先頭`/`を除いたDB名。 */
  databaseName: string;
  /** hostが既知のlocal host（`localhost` / `127.0.0.1` / `::1`）かどうか。 */
  isLocalHost: boolean;
  /**
   * DB名がthrowaway用途だと明示的に読み取れるか（`test`/`throwaway`/`e2e`を含む）。
   * `deploid_dev`・`postgres`等の既知の非throwaway名は、たとえ将来このpatternへ偶然
   * マッチしても常に`false`になる。
   */
  looksLikeThrowawayName: boolean;
}

/**
 * 任意のPostgres接続URL文字列に対する純粋な分類。副作用なし、`process.env`を読まない。
 * 呼び出し側（test向け厳格版・CLI向け緩和版）がこの結果を見て許可/拒否を決める。
 */
export function classifyDatabaseUrl(raw: string): DatabaseUrlClassification {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`DATABASE_URL is not a valid connection URL: ${raw.slice(0, 20)}...`);
  }

  const host = url.hostname;
  // pathnameは先頭に`/`を含む（例: `/deploid_dev`）。
  const databaseName = url.pathname.replace(/^\//, '');
  const isLocalHost = LOCAL_DATABASE_HOSTS.has(host);
  const looksLikeThrowawayName =
    !KNOWN_NON_THROWAWAY_DATABASE_NAMES.has(databaseName) && THROWAWAY_DATABASE_NAME_PATTERN.test(databaseName);

  return { host, databaseName, isLocalHost, looksLikeThrowawayName };
}

/**
 * test suite向けの厳格版。host・DB名の両方を検査し、throwaway用途だと明示的に読み取れない
 * 限り常に拒否する。flagによる迂回は無い（`tests/content/testDbGuard.ts`が公開する
 * `assertLocalThrowawayDatabaseUrl`はこの関数のalias）。
 *
 * `callerFile`はエラーメッセージにだけ使う（どのsuiteが拒否したかを分かりやすくする）。
 */
export function assertStrictThrowawayDatabaseUrl(callerFile: string, raw: string | undefined): void {
  if (!raw) {
    throw new Error(`DATABASE_URL is not set. ${callerFile} runs destructive operations and must only ever run against a local throwaway Postgres.`);
  }

  const { host, databaseName, isLocalHost, looksLikeThrowawayName } = classifyDatabaseUrl(raw);

  if (!isLocalHost) {
    throw new Error(
      `Refusing to run ${callerFile} against DATABASE_URL host "${host}". This suite runs destructive ` +
        `operations and only runs against a local throwaway Postgres (host in ${[...LOCAL_DATABASE_HOSTS].join(', ')}), ` +
        'never against a shared/managed database.',
    );
  }

  if (!looksLikeThrowawayName) {
    throw new Error(
      `Refusing to run ${callerFile} against database "${databaseName}". This suite runs destructive operations ` +
        'and only runs against a database whose name is explicitly throwaway (must contain "test", "throwaway", ' +
        `or "e2e"; localhost alone is not sufficient — "${databaseName}" may be a shared/persistent database such ` +
        'as the developer\'s local dev DB). Use a DATABASE_URL like ' +
        '"postgresql://.../deploid_<task>_test" or "...deploid_<task>_throwaway".',
    );
  }
}

/** 既定の確認flag名。`--i-know-this-is-production`と紛らわしくない、独立した名前にしてある。 */
export const PERSISTENT_LOCAL_DATABASE_CONFIRMATION_FLAG = 'i-know-this-is-a-persistent-local-database';
export const PRODUCTION_CONFIRMATION_FLAG = 'i-know-this-is-production';
/**
 * 2026-08-22（Preview rehearsal中の外部レビュー指摘）: remote host全般への書き込みには
 * 元々`--i-know-this-is-production`しか無かった。Previewへ書き込む場合でもこの
 * flagを渡す必要があり、名前が実際の対象と矛盾する（「これはproductionだと分かっている」と
 * 明示的に主張することになる）——将来の誤操作（本当にPreviewのつもりでこのflagへ慣れてしまい、
 * 実際にproductionを指している時にも機械的に付ける)を誘発しかねない。remote hostの許可を
 * `--i-know-this-is-production`と`--i-know-this-is-preview`の2つへ分け、Previewの操作では
 * 後者だけで完結するようにする。
 */
export const PREVIEW_CONFIRMATION_FLAG = 'i-know-this-is-preview';

export interface AssertWritableDatabaseUrlArgs {
  raw: string | undefined;
  /** エラーメッセージにだけ使う。どのスクリプトが拒否したかを分かりやすくする。 */
  callerFile: string;
  /** `--i-know-this-is-production` が渡されたか。remote hostの書き込みを明示的に許可する。 */
  confirmedProduction: boolean;
  /**
   * `--i-know-this-is-preview` が渡されたか。remote hostの書き込みを明示的に許可する
   * （`confirmedProduction`と同格の代替——「productionだと申告する」flagを、実際には
   * Previewに対して使わせないための分離）。
   */
  confirmedPreview: boolean;
  /**
   * `--i-know-this-is-a-persistent-local-database` が渡されたか。throwaway用途だと
   * 読み取れないlocal DB（`deploid_dev`等）への書き込みを明示的に許可する。
   */
  confirmedPersistentLocalDatabase: boolean;
}

/**
 * CLIスクリプト（`content:import` / `content:restore`）向けの緩和版。destructiveな
 * upsertを行う前のwritability gate。3分岐:
 *
 * 1. remote host: `confirmedProduction`（`--i-know-this-is-production`）または
 *    `confirmedPreview`（`--i-know-this-is-preview`）のどちらかが無ければ拒否する。
 *    （remote host全般の許可という役割自体は変更しない。Task 9 cutoverの既存挙動＋
 *    Preview向けの対称な追加。）
 * 2. local host + throwaway名: 無条件で許可する。（変更しない。CI・使い捨てDBでの通常運用。）
 * 3. local host + 非throwaway名（`deploid_dev`等）: `confirmedPersistentLocalDatabase`
 *    （`--i-know-this-is-a-persistent-local-database`）が無ければ拒否する。
 *    ここが2026-08-20の外部監査が指摘した抜け穴の修正箇所——以前は「local hostなら
 *    無条件で許可」だったため、`.env.local`の既定`DATABASE_URL`（`deploid_dev`）へ
 *    明示指定を忘れたまま`content:import`を実行すると、確認なしにdeploid_devへ
 *    destructiveなupsertが走った。
 */
export function assertWritableDatabaseUrl(args: AssertWritableDatabaseUrlArgs): void {
  const { raw, callerFile, confirmedProduction, confirmedPreview, confirmedPersistentLocalDatabase } = args;
  if (!raw) throw new Error(`DATABASE_URL is not set. ${callerFile} needs an explicit target database.`);

  const { host, databaseName, isLocalHost, looksLikeThrowawayName } = classifyDatabaseUrl(raw);

  if (!isLocalHost) {
    if (confirmedProduction || confirmedPreview) return;
    throw new Error(
      `Refusing to write to DATABASE_URL host "${host}". ${callerFile} performs destructive upserts. ` +
        `Pass --${PRODUCTION_CONFIRMATION_FLAG} to target Production (Task 9 cutover only), or ` +
        `--${PREVIEW_CONFIRMATION_FLAG} to target Preview.`,
    );
  }

  if (looksLikeThrowawayName) return;
  if (confirmedPersistentLocalDatabase) return;

  throw new Error(
    `Refusing to write to database "${databaseName}" at host "${host}". ${callerFile} performs destructive ` +
      'upserts and this database name is not recognizably throwaway (does not contain "test", "throwaway", or ' +
      '"e2e") — it may be a known persistent database such as the developer\'s local dev DB (deploid_dev). ' +
      `If this write is intentional (e.g. re-syncing deploid_dev from data/*.ts), pass ` +
      `--${PERSISTENT_LOCAL_DATABASE_CONFIRMATION_FLAG} to confirm.`,
  );
}
