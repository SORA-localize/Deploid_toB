// scripts/check-client-import-graph.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const roots = ['components', 'lib', 'src'];
const extensions = new Set(['.ts', '.tsx']);
const ignoredExtensions = new Set(['.css', '.json', '.svg', '.png', '.jpg', '.webp']);

/**
 * 判定はspecifier文字列ではなく**解決後のrepo相対パス**で行う。
 * `@/data/robots` も `../../data/robots.ts` も同じ `data/robots.ts` になるため、
 * 書き方の違いで素通りしない。
 */
const forbidden = new Set([
  // budoux の日本語分かち書きモデルは実測263,562バイト。2026-08-02 まで
  // ReportsBrowser -> NewsCard -> BudouXText -> lib/typography 経由で /reports へ
  // 配信されていた。分かち書きは server で済ませ、client へは string[][] を渡す。
  'lib/typography.ts',
]);

const fromPatterns = [
  // import x, { y } from '...'
  /^\s*import\s+(?!type\b)([\s\S]*?)from\s+['"]([^'"]+)['"]/gm,
  // export { y } from '...' / export * from '...' — 再exportもgraphの辺である
  /^\s*export\s+(?!type\b)(\*|\{[\s\S]*?\})\s*from\s+['"]([^'"]+)['"]/gm,
];
// import './side-effect'
const sideEffectPattern = /^\s*import\s+['"]([^'"]+)['"]/gm;

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(absolute);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

/**
 * specifierの末尾`.ts`/`.tsx`を落としてから解決する。
 * この repo は `lib/validation/**`・`lib/data/**` で拡張子付き相対importを使っており
 * （55箇所）、落とさないと `x.ts.ts` を探して null になり**辺が黙って消える**。
 */
function resolveSpecifier(specifier, fromFile) {
  const withoutExtension = specifier.replace(/\.(ts|tsx)$/, '');
  const base = withoutExtension.startsWith('@/')
    ? withoutExtension.slice(2)
    : path.normalize(path.join(path.dirname(path.relative(root, fromFile)), withoutExtension));
  for (const suffix of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (fs.existsSync(path.join(root, base + suffix))) return base + suffix;
  }
  return null;
}

/** `import type` と、named specifier がすべて `type X` のものを除いた値参照。再exportと副作用importも辺として拾う。 */
function valueSpecifiersOf(file) {
  const source = fs.readFileSync(file, 'utf8');
  const specifiers = [];

  for (const pattern of fromPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const [, clause, specifier] = match;
      if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue;
      const braced = clause.match(/\{([\s\S]*?)\}/);
      const outsideBraces = clause.replace(/\{[\s\S]*?\}/, '').trim().replace(/,$/, '');
      const namedValues = braced
        ? braced[1].split(',').map((part) => part.trim()).filter((part) => part && !part.startsWith('type '))
        : [];
      if (outsideBraces || namedValues.length > 0 || !braced) specifiers.push(specifier);
    }
  }

  sideEffectPattern.lastIndex = 0;
  let match;
  while ((match = sideEffectPattern.exec(source)) !== null) {
    const specifier = match[1];
    if (specifier.startsWith('@/') || specifier.startsWith('.')) specifiers.push(specifier);
  }

  return specifiers;
}

const allFiles = roots.flatMap((directory) => filesUnder(path.join(root, directory)));
const clientEntries = allFiles.filter((file) =>
  /^\s*['"]use client['"]/m.test(fs.readFileSync(file, 'utf8')),
);

const failures = [];
const unresolved = new Set();

for (const entry of clientEntries) {
  const seen = new Set();
  const stack = [[entry, [path.relative(root, entry)]]];
  while (stack.length > 0) {
    const [file, chain] = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of valueSpecifiersOf(file)) {
      const resolved = resolveSpecifier(specifier, file);
      if (!resolved) {
        if (!ignoredExtensions.has(path.extname(specifier))) {
          unresolved.add(`${path.relative(root, file)} -> ${specifier}`);
        }
        continue;
      }
      if (forbidden.has(resolved)) {
        failures.push(`${chain.join(' -> ')} -> ${resolved}`);
        continue;
      }
      stack.push([path.join(root, resolved), [...chain, resolved]]);
    }
  }
}

if (failures.length > 0) {
  console.error(
    `[client-imports] 'use client' modules must not reach raw data:\n${failures.map((line) => `  - ${line}`).join('\n')}`,
  );
  process.exitCode = 1;
}

// 解決できないlocal specifierは「違反が無い」ではなく「見えていない」。
// 黙って素通りさせるとgateの意味が消えるため失敗させる。
if (unresolved.size > 0) {
  console.error(
    `[client-imports] unresolved local specifiers (graphの穴):\n${[...unresolved].map((line) => `  - ${line}`).join('\n')}`,
  );
  process.exitCode = 1;
}

if (failures.length === 0 && unresolved.size === 0) {
  console.log(`[client-imports] OK (${clientEntries.length} client entry modules)`);
}
