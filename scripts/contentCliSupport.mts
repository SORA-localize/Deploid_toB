/**
 * Task 5 の5つの content script（import / compare / export・restore / verify-snapshot /
 * verify-conservation）が共有する CLI ヘルパ。
 *
 * **なぜ独立ファイルなのか**: これらを `compare-content-sources.mts` に置いていたところ、
 * `compare` の CLI が `deriveMediaFromSnapshot` を得るために
 * `import-content-to-payload.mts` を動的 import し、その `import-content-to-payload.mts` が
 * ヘルパ目当てに `compare-content-sources.mts` を静的 import していたため循環になった。
 * `compare` 側は `await main()`（top-level await）の最中で、まだ評価が完了していない。
 * そこへ循環で戻るため ESM が解決できず、`Detected unsettled top-level await` で
 * **exit 13 のまま何も出力せずに死ぬ**（実際に発生し、この抽出の直接のきっかけになった）。
 * 依存の向きを「5 script → このファイル」の一方向だけにして構造的に断つ。
 */
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `--` 区切り・`--flag value` / `--flag=value` / boolean flag を扱う最小限のパーサ。
 * `npm run x -- --flag v` と、`tests/content/migrationTestSupport.ts` の
 * `runTsxScript(script, args)`（`script -- ...args` の形で余分な `--` が入る）の両方を受ける。
 */
export function parseArgs(argv: readonly string[]): Map<string, string | true> {
  const args = new Map<string, string | true>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--' || !token.startsWith('--')) continue;
    const body = token.slice(2);
    const equals = body.indexOf('=');
    if (equals >= 0) {
      args.set(body.slice(0, equals), body.slice(equals + 1));
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      args.set(body, next);
      index += 1;
    } else {
      args.set(body, true);
    }
  }
  return args;
}

/** `tsx scripts/x.mts` として直接起動されたか（他 script から import されただけなら false）。 */
export function isDirectRun(moduleUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(path.resolve(entry));
  } catch {
    return false;
  }
}

/**
 * CLI の終了処理。`getPayload()` が張った Postgres pool は `payload.destroy()` のあとも
 * open handle を残すことがあり（実測: import 完了後にプロセスが終了せずぶら下がる）、
 * `tsx script.mts` がハングして CI / 手動実行のどちらも止まる。書き出しを flush してから
 * 明示的に exit する。
 */
export async function exitCli(code?: number): Promise<never> {
  const status = code ?? process.exitCode ?? 0;
  await new Promise<void>((resolve) => {
    if (process.stdout.write('')) resolve();
    else process.stdout.once('drain', () => resolve());
  });
  process.exit(status);
}
