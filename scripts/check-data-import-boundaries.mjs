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
// 対象は lib/viewModels/** と lib/catalog/**。Task 8 で components/** と lib/** 全体へ広げる。
const searchModuleImport =
  /import\s+(?!type\b)[^;]*from\s+['"](?:@\/lib\/(?:search|searchIndex)|\.\.?\/(?:\.\.\/)?(?:search|searchIndex))(?:\.ts)?['"]/g;
const searchBoundaryRoots = ['lib/viewModels', 'lib/catalog'];

const searchViolations = searchBoundaryRoots
  .flatMap((directory) => filesUnder(path.join(root, directory)))
  .flatMap((absolute) => {
    searchModuleImport.lastIndex = 0;
    return searchModuleImport.test(fs.readFileSync(absolute, 'utf8'))
      ? [path.relative(root, absolute)]
      : [];
  });

if (violations.length > 0) {
  console.error(`Direct data value imports are not allowed:\n${violations.map((file) => `  - ${file}`).join('\n')}`);
  process.exitCode = 1;
}

if (searchViolations.length > 0) {
  console.error(
    `lib/viewModels/** and lib/catalog/** must not value-import lib/search.ts or lib/searchIndex.ts:\n${searchViolations
      .map((file) => `  - ${file}`)
      .join('\n')}`,
  );
  process.exitCode = 1;
}

if (violations.length === 0 && searchViolations.length === 0) {
  console.log('[data-boundaries] OK');
}
