import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowed = new Set(['lib/data/localContentSnapshot.ts']);
const roots = ['components', 'lib', 'scripts', 'src', 'tests'];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs']);
const valueImport =
  /import\s+(?!type\b)[^;]*from\s+['"](?:@\/data\/|\.\.\/data\/|\.\.\/\.\.\/data\/)(articles|articlePlacements|deployments|manufacturers|robots|useCases)(?:\.ts)?['"]/g;

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(absolute);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

const violations = roots
  .flatMap((directory) => filesUnder(path.join(root, directory)))
  .flatMap((absolute) => {
    const relative = path.relative(root, absolute);
    if (allowed.has(relative)) return [];
    valueImport.lastIndex = 0;
    return valueImport.test(fs.readFileSync(absolute, 'utf8')) ? [relative] : [];
  });

// 今回の事故の根本原因は「汎用search documentの再利用」だった。
// lib/search.ts の create*SearchDocument() は詳細ページ向けで本文を含むため、
// catalog VM がこれを使うと本文が searchText へ連結されてclientへ渡る。機械的に止める。
// 対象は components/** ・ lib/** ・ src/**（lib/search.ts 自身を除く）。Task 8 で全面適用した。
// lib/searchIndex.ts（MiniSearch）は対象外。索引する文字列は catalog searchText に変えてある。
const searchModuleImport =
  /import\s+(?!type\b)[^;]*from\s+['"](?:@\/lib\/search|\.\.?\/(?:\.\.\/)?search)(?:\.ts)?['"]/g;
const searchBoundaryRoots = ['components', 'lib', 'src'];
const searchBoundaryExempt = new Set(['lib/search.ts']);

const searchViolations = searchBoundaryRoots
  .flatMap((directory) => filesUnder(path.join(root, directory)))
  .flatMap((absolute) => {
    const relative = path.relative(root, absolute);
    if (searchBoundaryExempt.has(relative)) return [];
    searchModuleImport.lastIndex = 0;
    return searchModuleImport.test(fs.readFileSync(absolute, 'utf8')) ? [relative] : [];
  });

if (violations.length > 0) {
  console.error(`Direct data value imports are not allowed:\n${violations.map((file) => `  - ${file}`).join('\n')}`);
  process.exitCode = 1;
}

if (searchViolations.length > 0) {
  console.error(
    `components/** and lib/** must not value-import lib/search.ts (lib/searchIndex.ts may):\n${searchViolations
      .map((file) => `  - ${file}`)
      .join('\n')}`,
  );
  process.exitCode = 1;
}

if (violations.length === 0 && searchViolations.length === 0) {
  console.log('[data-boundaries] OK');
}
