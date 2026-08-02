// scripts/check-client-bundle-content.mjs
import fs from 'node:fs';
import path from 'node:path';
import { localContentSnapshot } from '../lib/data/localContentSnapshot.ts';

const MAX_DISTINCT_SLUGS_PER_CHUNK = 5;
const MAX_CHUNK_BYTES = 340_000;
const chunkDir = '.next/static/chunks';

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
  if (bytes > MAX_CHUNK_BYTES) {
    failures.push(`${file}: ${bytes} bytes (limit ${MAX_CHUNK_BYTES})`);
  }
}

if (failures.length > 0) {
  console.error(`[bundle-content] violations:\n${failures.map((line) => `  - ${line}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('[bundle-content] OK');
}
