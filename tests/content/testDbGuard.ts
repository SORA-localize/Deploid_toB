/**
 * destructiveなPostgres操作（全件delete、`CREATE DATABASE`/`DROP DATABASE`等）を行う
 * test suite全部が使う、throwaway DB判定のtest向けエントリポイント。
 *
 * remediation group 4（2026-08-20の外部監査）: 判定ロジックの**実体**は
 * `lib/content/databaseSafety.ts`（test/scriptsどちらからもimportできる非testモジュール）へ
 * 移した。このファイルは、その中の「test向けの厳格版」（`deploid_dev`等は常に拒否、
 * flagによる迂回なし）をtest suite向けの名前でre-exportするだけにする（ロジックの二重化を
 * 避ける）。以前の事故直後の初回修正で、この判定ロジックが
 * `tests/content/admin-access.test.ts`・`tests/content/migrationTestSupport.ts`・
 * `tests/integration/mcpIntegrationSupport.ts`の3箇所に別々にコピーされていたことが分かり
 * （2箇所しか修正が反映されず、残り2箇所は旧host-onlyロジックのまま取り残された）、
 * 外部レビューで指摘された。その後さらに、実際に破壊的な書き込みを行う
 * `scripts/import-content-to-payload.mts` / `scripts/restore-preflight.mts`が、
 * 同種のhost-onlyな脆弱性を持ったまま残っていることが別の外部監査で指摘され、
 * `lib/content/databaseSafety.ts`への抽出に至った。
 *
 * **この判定ロジックの実体は`lib/content/databaseSafety.ts`だけに置き、他の全ファイルは
 * ここ（か、そちらを直接）からimportする**（コピーを作らない）。
 */
import { assertStrictThrowawayDatabaseUrl } from '../../lib/content/databaseSafety';

/**
 * 任意のPostgres接続URL文字列に対する判定本体。host・DB名の両方を検査する。
 * `callerFile`はエラーメッセージにだけ使う（どのsuiteが拒否したかを分かりやすくする）。
 */
export function assertLocalThrowawayDatabaseUrl(callerFile: string, raw: string | undefined): void {
  assertStrictThrowawayDatabaseUrl(callerFile, raw);
}

/** 現在のprocessの`DATABASE_URL`（1つの共有throwaway DBへ直接destructive操作をするsuite用）。 */
export function assertLocalThrowawayDatabase(callerFile: string): void {
  assertLocalThrowawayDatabaseUrl(callerFile, process.env.DATABASE_URL);
}
