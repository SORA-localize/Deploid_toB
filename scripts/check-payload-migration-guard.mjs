import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `scripts/**` が Payload へ接続する前に `PAYLOAD_MIGRATING=true` を立てていることを機械で保証する。
 *
 * なぜ要るか: `getPayload()` は `NODE_ENV !== 'production'` かつ adapter が `push: false` でない限り、
 * dev-mode schema push を走らせて**実際に DDL を実行する**
 * （`@payloadcms/db-postgres` の `connect.js`: `PAYLOAD_MIGRATING !== 'true'` のとき `pushDevSchema`）。
 * `payload.config.ts` は `push:` を指定していないので、このフラグだけが歯止めになる。
 *
 * 2026-09-01 の監査で、`verify-content-snapshot.mts` / `verify-content-conservation.mts` /
 * `compare-content-sources.mts` の3本にこのフラグが無いことが分かった。前2本は
 * `docs/reference/content-restore-runbook-v1.md` が**本番に対して実行するよう案内している**
 * 復旧手順の一部で、実行すると本番 schema が書き換わり得た。export / import / stamp / seed /
 * migration-cli には最初から入っていたので、これは「人が気をつける」方式の取りこぼしだった。
 * 同じ取りこぼしを二度起こさないためのチェック。
 *
 * 判定は source text ベース。`connect()` 時にフラグが読まれるため、代入が動的 import より前に
 * ありさえすればよく、行順の厳密な検証まではしない（するとフラグを立てる位置の正当な多様性
 * ——module 冒頭 / DB identity assertion の直後——を弾いてしまう）。
 */

/**
 * migration の実行そのものが仕事で、将来 push を許す判断があり得る script。
 * 現状はどれも代入を持っているので violation にはならないが、
 * 「例外はここに明示する」形を先に用意しておく（既存 boundary checker と同じ方針）。
 */
const ALLOWED_WITHOUT_GUARD = new Set([]);

const SOURCE_EXTENSIONS = new Set(['.js', '.mjs', '.ts', '.mts']);
const SCRIPTS_DIRECTORY = 'scripts';

const normalize = (filePath) => filePath.split(path.sep).join('/').replace(/^\.\//, '');

/** `import type { Payload } from 'payload'` のような型だけの参照は接続しない。 */
const TYPE_ONLY_CLAUSE = /^\s*type\b/;

export function findPayloadMigrationGuardViolations(files) {
  const violations = [];
  for (const file of files) {
    const filePath = normalize(file.path);
    if (!filePath.startsWith(`${SCRIPTS_DIRECTORY}/`)) continue;
    if (ALLOWED_WITHOUT_GUARD.has(filePath)) continue;

    const reasons = [];

    // 静的・動的を問わず `payload` 本体、`payload.config`、`payloadSource` の**値**参照を探す。
    const staticImport = /(?:import|export)\s+([\s\S]*?)\s+from\s+(['"])([^'"]+)\2/g;
    for (const match of file.source.matchAll(staticImport)) {
      const [, clause, , specifier] = match;
      if (TYPE_ONLY_CLAUSE.test(clause)) continue;
      if (/^payload$/.test(specifier)) reasons.push(`static import of '${specifier}'`);
      else if (/payload\.config/.test(specifier)) reasons.push(`static import of '${specifier}'`);
      else if (/payloadSource/.test(specifier)) reasons.push(`static import of '${specifier}'`);
    }

    const dynamicImport = /import\s*\(\s*(['"])([^'"]+)\1\s*\)/g;
    for (const match of file.source.matchAll(dynamicImport)) {
      const specifier = match[2];
      if (/^payload$/.test(specifier)) reasons.push(`dynamic import of '${specifier}'`);
      else if (/payload\.config/.test(specifier)) reasons.push(`dynamic import of '${specifier}'`);
      else if (/payloadSource/.test(specifier)) reasons.push(`dynamic import of '${specifier}'`);
    }

    if (reasons.length === 0) continue;
    if (/process\.env\.PAYLOAD_MIGRATING\s*=\s*(['"])true\1/.test(file.source)) continue;

    violations.push({ path: filePath, reasons: [...new Set(reasons)] });
  }
  return violations;
}

async function collectScriptFiles(root, relative = SCRIPTS_DIRECTORY) {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      files.push(...(await collectScriptFiles(root, path.join(relative, entry.name))));
      continue;
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;
    const filePath = path.join(relative, entry.name);
    files.push({ path: normalize(filePath), source: await readFile(path.join(root, filePath), 'utf8') });
  }
  return files;
}

export async function checkPayloadMigrationGuard(root = process.cwd()) {
  return findPayloadMigrationGuardViolations(await collectScriptFiles(root));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const violations = await checkPayloadMigrationGuard();
  if (violations.length > 0) {
    for (const violation of violations) {
      process.stderr.write(
        `[payload-migration-guard] ${violation.path} reaches Payload (${violation.reasons.join(', ')}) ` +
          "without setting process.env.PAYLOAD_MIGRATING = 'true'; it can trigger a dev-mode schema push (real DDL).\n",
      );
    }
    process.exitCode = 1;
  } else {
    process.stdout.write('[payload-migration-guard] OK\n');
  }
}
