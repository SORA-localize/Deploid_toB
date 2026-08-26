// scripts/check-plan-snippets.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '.plan-snippets';
// `docs/archive/` は実装履歴を保存する場所であり、現行コードと一致しない例を含み得る。
// 型ゲートは、現在実行可能な計画（docs/plans）のみを対象にする。
const planDirs = ['docs/plans'];
const baselinePath = 'scripts/plan-snippet-skip-baseline.json';
const fence = /```(ts|tsx)\n([\s\S]*?)```/g;
// front-matter の `snippetCheck: true` を宣言した計画書だけを対象にする。
const optIn = /^---\n[\s\S]*?^snippetCheck:\s*true\s*$[\s\S]*?^---$/m;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let extracted = 0;
let skipped = 0;
const checkedFiles = [];

for (const planDir of planDirs) {
  for (const name of fs.readdirSync(planDir).filter((file) => file.endsWith('.md'))) {
    const markdown = fs.readFileSync(path.join(planDir, name), 'utf8');
    if (!optIn.test(markdown)) continue;
    checkedFiles.push(name);
    fence.lastIndex = 0;
    let match;
    let index = 0;
    while ((match = fence.exec(markdown)) !== null) {
      const [, language, body] = match;
      index += 1;
      if (body.includes('@plan-check-skip')) {
        skipped += 1;
        continue;
      }
      fs.writeFileSync(path.join(outDir, `${name.replace(/\.md$/, '')}-${index}.${language}`), body);
      extracted += 1;
    }
  }
}

console.log(
  `[plan-snippets] files=${checkedFiles.join(',') || '(none)'} extracted=${extracted} skipped=${skipped}`,
);

// 現行計画が1本もopt-inしていない場合は、検査対象なしとして扱う（履歴archiveは対象外）。
if (checkedFiles.length === 0) {
  console.log('[plan-snippets] no active plan declares `snippetCheck: true`; nothing to check');
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
if (skipped > baseline.skipped) {
  console.error(`[plan-snippets] skip count increased: ${baseline.skipped} -> ${skipped}`);
  process.exitCode = 1;
}

try {
  execFileSync('npx', ['tsc', '--noEmit', '--project', 'tsconfig.plan-snippets.json'], {
    stdio: 'inherit',
  });
} catch {
  process.exitCode = 1;
}
