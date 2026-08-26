// scripts/check-client-bundle-content.mjs
import fs from 'node:fs';
import path from 'node:path';
const MAX_CHUNK_BYTES = 340_000;
const chunkDir = '.next/static/chunks';

/**
 * `MAX_CHUNK_BYTES` はこのサイト自身が書くclient componentの肥大化を検出するための上限
 * （Phase 1〜7 client-boundaries refactorの一部）。Task 2（Payload統合）以降、
 * `/admin/[[...segments]]` は Payload純正の管理画面バンドル（lexical richtext editorなど、
 * サードパーティ）を読み込み、単体で340,000 bytesを超えるchunkを複数含む。これはこのサイトの
 * コードが肥大化したのではなく、Payloadという別systemを個別budgetで管理する対象にした結果
 * （`scripts/check-client-budgets.mjs` の `/admin/[[...segments]]` row が実際の予算）。
 *
 * frontendのどのrouteからも読み込まれず、`/admin/**` からしか読み込まれないchunkだけを
 * このサイズ上限の対象から除外する。frontend routeが1つでも共有していれば、
 * 通常通りこの上限の対象にする。
 */
function adminOnlyChunkFiles() {
  const statsPath = '.next/diagnostics/route-bundle-stats.json';
  if (!fs.existsSync(statsPath)) return new Set();
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));

  const adminChunks = new Set();
  const frontendChunks = new Set();
  for (const entry of stats) {
    const target = entry.route.startsWith('/admin') ? adminChunks : frontendChunks;
    for (const chunk of entry.firstLoadChunkPaths) target.add(chunk);
  }

  return new Set([...adminChunks].filter((chunk) => !frontendChunks.has(chunk)));
}

const adminOnlyChunks = adminOnlyChunkFiles();

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.name.endsWith('.js') ? [absolute] : [];
  });
}

const failures = [];
for (const file of walk(chunkDir)) {
  const bytes = fs.statSync(file).size;
  if (bytes > MAX_CHUNK_BYTES && !adminOnlyChunks.has(file)) {
    failures.push(`${file}: ${bytes} bytes (limit ${MAX_CHUNK_BYTES})`);
  }
}

if (failures.length > 0) {
  console.error(`[bundle-content] violations:\n${failures.map((line) => `  - ${line}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('[bundle-content] OK');
}
