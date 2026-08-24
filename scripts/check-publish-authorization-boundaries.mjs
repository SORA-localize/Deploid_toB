import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ISSUER_ENTRYPOINTS = {
  approvedPublishContext: 'lib/payload/publishApprovedVersion.ts',
  privilegedPublishContext: 'scripts/import-content-to-payload.mts',
};

const SOURCE_EXTENSIONS = new Set(['.js', '.mjs', '.ts', '.mts', '.tsx']);
const SKIPPED_DIRECTORIES = new Set(['.git', '.next', 'docs', 'media', 'node_modules', 'public', 'tests']);

const normalize = (filePath) => filePath.split(path.sep).join('/').replace(/^\.\//, '');

export function findPublishAuthorizationBoundaryViolations(files) {
  const violations = [];
  for (const file of files) {
    const filePath = normalize(file.path);
    const issuers = new Set();
    const staticImport = /(?:import|export)\s+([\s\S]*?)\s+from\s+(['"])([^'"]*publishAuthorization(?:\.ts)?)\2/g;
    for (const match of file.source.matchAll(staticImport)) {
      const clause = match[1];
      if (/^\s*\*/.test(clause)) {
        issuers.add('approvedPublishContext');
        issuers.add('privilegedPublishContext');
        continue;
      }
      for (const issuer of Object.keys(ISSUER_ENTRYPOINTS)) {
        if (new RegExp(`\\b${issuer}\\b`).test(clause)) issuers.add(issuer);
      }
    }
    if (/import\s*\(\s*['"][^'"]*publishAuthorization(?:\.ts)?['"]\s*\)/.test(file.source)) {
      issuers.add('approvedPublishContext');
      issuers.add('privilegedPublishContext');
    }

    for (const issuer of issuers) {
      const allowedPath = ISSUER_ENTRYPOINTS[issuer];
      if (filePath !== allowedPath) {
        violations.push({ path: filePath, issuer, allowedPath });
      }
    }
  }
  return violations;
}

async function collectSourceFiles(root, relative = '') {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      files.push(...(await collectSourceFiles(root, path.join(relative, entry.name))));
      continue;
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;
    const filePath = path.join(relative, entry.name);
    files.push({ path: normalize(filePath), source: await readFile(path.join(root, filePath), 'utf8') });
  }
  return files;
}

export async function checkPublishAuthorizationBoundaries(root = process.cwd()) {
  return findPublishAuthorizationBoundaryViolations(await collectSourceFiles(root));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const violations = await checkPublishAuthorizationBoundaries();
  if (violations.length > 0) {
    for (const violation of violations) {
      process.stderr.write(
        `[publish-authorization-boundaries] ${violation.path} imports ${violation.issuer}; ` +
          `only ${violation.allowedPath} may issue it.\n`,
      );
    }
    process.exitCode = 1;
  } else {
    process.stdout.write('[publish-authorization-boundaries] OK\n');
  }
}
