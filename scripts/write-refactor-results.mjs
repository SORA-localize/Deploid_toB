import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * 移行前リファクタリング（Phase 1〜7）の結果文書を、実測値から生成する。
 *
 * 手で書いた数字は必ず古くなる。このプロジェクトは計画書の数値が実装とずれる事故を
 * 繰り返しているので、報告の数字は build 成果物と `npm audit` から取る。
 *
 * 実行前に `npm run build` を通しておくこと（`.next/` を読む）。
 */

const root = process.cwd();

/**
 * 2026-07-26 の着手前実測（`docs/reference/refactor-baseline-2026-07-26.md`）。
 *
 * これは **Phase 1〜7 全体の起点**であり、Phase 7 単独の before ではない。
 * 例えば vulnerabilities 13 は Phase 2 の時点で 0 になっている。生成される表にも
 * その旨を書くこと。読み手が最後の phase の成果と誤読する。
 */
const baseline = {
  vulnerabilities: 13,
  homeHtml: 4_206_770,
  embeddedSvg: 4,
  routes: {
    '/reports': 1_121_603,
    '/robots': 923_085,
    '/manufacturers': 910_306,
    '/use-cases': 861_263,
  },
  clientComponents: 63,
  sharedFloor: 591_394,
};

const html = fs.readFileSync('.next/server/app/index.html', 'utf8');
const homeHtml = Buffer.byteLength(html);
const embeddedSvg = (html.match(/data:image\/svg\+xml/g) ?? []).length;
const routeStats = JSON.parse(
  fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'),
);

const auditRun = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd: root,
  encoding: 'utf8',
});
const audit = JSON.parse(auditRun.stdout);
if (!audit.metadata?.vulnerabilities) {
  throw new Error('npm audit metadata is unavailable');
}

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(absolute);
    return /\.(ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

const sourceFiles = ['components', 'lib', 'src'].flatMap((directory) =>
  filesUnder(path.join(root, directory)),
);
const clientComponents = sourceFiles.filter((file) =>
  /^['"]use client['"];?/m.test(fs.readFileSync(file, 'utf8')),
).length;

const routeBytes = Object.fromEntries(
  Object.keys(baseline.routes).map((route) => {
    const item = routeStats.find((entry) => entry.route === route);
    if (!item) throw new Error(`missing route bundle stats: ${route}`);
    return [route, item.firstLoadUncompressedJsBytes];
  }),
);

// 共有フロア = 全 route に共通して現れる chunk。gate と同じ定義にする。
let floorChunks = null;
for (const entry of routeStats) {
  const chunks = new Set(entry.firstLoadChunkPaths);
  floorChunks =
    floorChunks === null
      ? chunks
      : new Set([...floorChunks].filter((chunk) => chunks.has(chunk)));
}
const sharedFloorBytes = [...(floorChunks ?? [])].reduce(
  (total, chunk) => total + fs.statSync(chunk).size,
  0,
);

const percent = (before, after) =>
  `${(((after - before) / before) * 100).toFixed(1)}%`;

const rows = [
  ['Runtime vulnerabilities', baseline.vulnerabilities, audit.metadata.vulnerabilities.total],
  ['Home raw HTML bytes', baseline.homeHtml, homeHtml],
  ['Embedded map SVG data URI occurrences', baseline.embeddedSvg, embeddedSvg],
  ['Shared client floor bytes', baseline.sharedFloor, sharedFloorBytes],
  ...Object.entries(baseline.routes).map(([route, before]) => [
    `${route} first-load JS`,
    before,
    routeBytes[route],
  ]),
  ['Client Components', baseline.clientComponents, clientComponents],
];

const markdown = `---
status: reference
updated: ${new Date().toISOString().slice(0, 10)}
---

# 移行前リファクタリング 実測結果 v1

> このファイルは \`scripts/write-refactor-results.mjs\` が生成する。手で編集しない。
> 数字を更新するなら \`npm run build\` のあとに \`node scripts/write-refactor-results.mjs\`。

## 対象

CMS / DB移行は未実施。\`data/*.ts\` が引き続きデータの正本。

Phase 1（品質ゲート）から Phase 7（設定・セキュリティ・後片付け）までの結果。

## Before / After

**Phase 1〜7 全体**の before / after。before は 2026-07-26 の着手前実測
（[refactor-baseline-2026-07-26.md](refactor-baseline-2026-07-26.md)）であり、
Phase 7 単独の before ではない。例えば vulnerabilities は Phase 2 の時点で 0 になっている。

first-load JS は **共有フロアを含む総量**。gate（\`scripts/check-client-budgets.mjs\`）は
「route固有（総量 − 共有フロア）」と「共有フロア」を別々に測っており、指標が違う。
route ごとの増減を追うときは gate 側の数字を見ること。

| Metric | Before | After | Change |
|---|---:|---:|---:|
${rows.map(([label, before, after]) => `| ${label} | ${before.toLocaleString()} | ${after.toLocaleString()} | ${percent(before, after)} |`).join('\n')}

## 追加したゲート

\`npm run check\` が通す順に:

| Gate | 何を守るか |
|---|---|
| \`validate:data\` | 型・ラベル・参照整合 |
| \`check:data-boundaries\` | components / pages から \`data/*.ts\` を直接読まない |
| \`check:client-imports\` | Client Component の import 経路 |
| \`check:world-map-asset\` | 生成済み world map asset が最新 |
| \`typecheck\` | TypeScript |
| \`lint\` | ESLint（\`--max-warnings 4\`、現状維持が上限） |
| \`check:plan-snippets\` | 計画書のコード例が型検査を通る |
| \`check:dead-code\` | 未使用ファイル・依存（knip） |
| \`check:docs\` | Markdown のローカルリンク |
| \`test\` | unit（Vitest） |
| \`build\` | 本番ビルド |
| \`check:home-payload\` | Home HTML バイト数と埋め込み SVG |
| \`check:bundle-content\` | client bundle の内容 |
| \`check:client-budgets\` | 全 route の client JS と共有フロアの上限 |
| \`test:e2e\` | Playwright（a11y・キーボード・focus・視覚回帰・security header・analytics opt-in） |

**各ゲートは「赤にできること」を確認してから入れている。** 緑しか見ていないゲートは、
動いていることが確認されていないゲートと同じ（2026-08-03 の Phase 1〜6 監査、PR #15）。

## 残っている作業

未完了の項目は [\`../decisions/deferred-work-register-v1.md\`](../decisions/deferred-work-register-v1.md) が唯一の一覧。
**この文書には転記しない**（2か所に置くと必ず片方が腐る）。

CSP は \`Content-Security-Policy-Report-Only\` に留めている。enforce へ上げるのは
互換性を観測してからの別判断。

Payload CMS + managed PostgreSQL 移行は
[\`../plans/content-platform-migration-plan-v1.md\`](../plans/content-platform-migration-plan-v1.md) で別program。
ただし同計画は 2026-07-26 付で、**Phase 3・5・6 が作った層（\`lib/data/\`、\`lib/viewModels/\`、
\`lib/catalog/\`、分割後の \`lib/validation/\`）を反映していない**。着手時に必ず現行実装へ突合すること。
`;

const outPath = 'docs/reference/pre-migration-refactor-results-v1.md';
fs.writeFileSync(path.join(root, outPath), markdown);
console.log(`[refactor-results] wrote ${outPath}`);
