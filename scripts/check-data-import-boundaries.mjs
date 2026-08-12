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

// content-platform-migration Task 4: ページ処理から `readSnapshot()` へ到達させない。
// snapshot（import / export / parity / 横断validation用の全件読み出し）を持つのは
// `createLocalContentSource()` / `createPayloadContentSource()` が返すsourceだけで、
// `getContentRepository()` が返す `ContentRepository` はこのメソッドを型として持たない。
// よって「アプリ側からsource factoryを直接importしない」を機械的に守れば、ページから
// snapshotへ到達する経路が構造的に存在しなくなる（規約ではなく依存方向で担保する）。
//
// 対象に `lib/**` を含めるのが要（Task 4 review Important #1）。Task 6のview model層は
// `lib/`（`lib/data.ts` / `lib/robotCatalog.ts` / `lib/viewModels/**`）に置かれるため、
// `components/**` と `src/**` だけを見ていると「lib/のmoduleがsourceを直接importして
// `readSnapshot()` の全件をページへ渡す」経路が素通りする。ページ側は狭い
// `ContentRepository` 型しか見ないので、型検査でもこの経路は捕まらない。
// これはGlobal Constraint「Client Componentへraw collection全件を渡さない」が
// 防ごうとしているものそのもの。
//
// 例外は `lib/content/getContentRepository.ts` だけ（source factoryを選ぶのが役目のファイル）。
// 管理系（Task 5以降のimporter / exporter / parity CLI）は `scripts/**` / `tests/**` から
// 直接importしてよいので、この2 rootは対象に含めない。
//
// specifierは末尾segmentで判定する。`@/lib/content/localSource` だけでなく、`lib/` 内から
// 自然に書かれる相対形（`./localSource` / `../content/payloadSource`）も同じ経路であり、
// path前置きで判定すると後者を取りこぼす。型だけのimportはruntimeで `readSnapshot()` へ
// 到達しないため対象外（既存のdata value import gateと同じ扱い）。
const contentSourceImport =
  /import\s+(?!type\b)[^;]*from\s+['"][^'"]*\/(localSource|payloadSource)(?:\.ts)?['"]/g;
const contentSourceBoundaryRoots = ['components', 'lib', 'src'];
const contentSourceAllowed = new Set(['lib/content/getContentRepository.ts']);

const contentSourceViolations = contentSourceBoundaryRoots
  .flatMap((directory) => filesUnder(path.join(root, directory)))
  .flatMap((absolute) => {
    const relative = path.relative(root, absolute);
    if (contentSourceAllowed.has(relative)) return [];
    contentSourceImport.lastIndex = 0;
    return contentSourceImport.test(fs.readFileSync(absolute, 'utf8')) ? [relative] : [];
  });

if (contentSourceViolations.length > 0) {
  console.error(
    'components/**, lib/**, and src/** must reach content only through ' +
      'lib/content/getContentRepository.ts (never lib/content/localSource.ts or payloadSource.ts, ' +
      `which expose readSnapshot()):\n${contentSourceViolations.map((file) => `  - ${file}`).join('\n')}`,
  );
  process.exitCode = 1;
}

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

if (violations.length === 0 && searchViolations.length === 0 && contentSourceViolations.length === 0) {
  console.log('[data-boundaries] OK');
}
