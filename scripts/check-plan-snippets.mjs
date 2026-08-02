// scripts/check-plan-snippets.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '.plan-snippets';
// 完了した計画は docs/archive/ へ移るが、snippet の型検査はそこでも続ける。
// archive の code 例が実型と食い違ったまま残ると、後から参照した人がそれを写して壊す。
const planDirs = ['docs/plans', 'docs/archive'];
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

// opt-in文書が1本も無い状態でexit 0を返すと、gateは「常に通る」だけの飾りになる。
if (checkedFiles.length === 0) {
  console.error('[plan-snippets] no plan declares `snippetCheck: true`');
  process.exitCode = 1;
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
