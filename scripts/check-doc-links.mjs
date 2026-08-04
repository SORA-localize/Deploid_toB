import fs from 'node:fs';
import path from 'node:path';

/**
 * Markdown のローカルリンクが実在するかを検査する。
 *
 * 外部URLは対象外。到達性はネットワークとその時の相手次第で、PR gate に混ぜると
 * 自分のコードと無関係に赤くなる（外部 source link は `check:source-links` として
 * scheduled workflow に分けてある。同じ理由）。
 *
 * `docs/archive/` は検査対象だが**警告のみ**で落とさない。archive は内容凍結の棚
 * （`ai/rules/80-doc-governance.md`）で、リンク切れを直すには凍結を破るしかない。
 * 落とすと「直せないのに赤い gate」になり、無視されるようになる。
 */

const root = process.cwd();
const starts = ['README.md', 'AGENTS.md', 'CLAUDE.md', 'docs', 'ai'];
const frozen = 'docs/archive/';

function markdownFiles(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  if (fs.statSync(absolute).isFile()) {
    return absolute.endsWith('.md') ? [absolute] : [];
  }
  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .flatMap((entry) => markdownFiles(path.join(target, entry.name)));
}

const failures = [];
const frozenFailures = [];

for (const file of starts.flatMap(markdownFiles)) {
  const relative = path.relative(root, file);
  const body = fs.readFileSync(file, 'utf8');
  // フェンス内はコード例。存在しないパスを例示することがあるので検査しない。
  const prose = body.replace(/```[\s\S]*?```/g, '');

  for (const match of prose.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, '');
    if (/^(https?:|mailto:|#)/.test(raw)) continue;

    const withoutAnchor = decodeURIComponent(raw.split('#')[0]);
    if (!withoutAnchor) continue;

    const target = path.resolve(path.dirname(file), withoutAnchor);
    if (fs.existsSync(target)) continue;

    const entry = `${relative} -> ${raw}`;
    if (relative.startsWith(frozen)) {
      frozenFailures.push(entry);
    } else {
      failures.push(entry);
    }
  }
}

if (frozenFailures.length > 0) {
  console.warn(
    `[docs] ${frozenFailures.length} broken link(s) in ${frozen} (frozen shelf, not enforced)`,
  );
}

if (failures.length > 0) {
  console.error(
    `[docs] broken local links:\n${failures.map((item) => `  - ${item}`).join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log('[docs] local links: OK');
}
