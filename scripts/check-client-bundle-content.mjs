// scripts/check-client-bundle-content.mjs
import fs from 'node:fs';
import path from 'node:path';
import { localContentSnapshot } from '../lib/data/localContentSnapshot.ts';

const MAX_DISTINCT_SLUGS_PER_CHUNK = 5;
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

// data/*.ts の正規の入口から読む。直接 import すると check:data-boundaries に抵触し、
// lib/data.ts は `@/` エイリアスを使うため plain node で解決できない。
// getter（published のみ）ではなく snapshot を使うので、下書きも照合対象に入る。
const { robots, manufacturers, useCases, articles, deployments } = localContentSnapshot;
const slugs = [
  ...robots,
  ...manufacturers,
  ...useCases,
  ...articles,
  ...deployments,
].map((record) => `"${record.slug}"`);

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
  const source = fs.readFileSync(file, 'utf8');
  const hits = slugs.filter((slug) => source.includes(slug)).length;

  if (hits >= MAX_DISTINCT_SLUGS_PER_CHUNK) {
    failures.push(`${file}: ${hits} distinct record slugs (limit ${MAX_DISTINCT_SLUGS_PER_CHUNK - 1})`);
  }
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
