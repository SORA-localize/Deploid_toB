import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowed = new Set(['lib/data/localContentSnapshot.ts']);
const roots = ['components', 'lib', 'scripts', 'src'];
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

if (violations.length > 0) {
  console.error(`Direct data value imports are not allowed:\n${violations.map((file) => `  - ${file}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('[data-boundaries] OK');
}
