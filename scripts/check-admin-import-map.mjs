import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Admin公開ボタンの配線が生きているかを機械検査する
 * （`docs/plans/admin-publish-ui-plan-v1.md` Task 6）。
 *
 * ## なぜ検査が要るのか
 *
 * この配線は**壊れても何も言わない**。
 * - collectionが `admin.components.edit.PublishButton` を持たなければ、Payloadは標準の
 *   PublishButtonを描画する。標準ボタンは `createPublishGateHook` に弾かれて
 *   `Something went wrong.` を出す ——「直す前の壊れた挙動」へ静かに戻る。
 * - `importMap.js` にキーが無い場合も同じ。`getFromImportMap`
 *   （`payload/dist/bin/generateImportMap/utilities/getFromImportMap.js`）は
 *   `console.error` を出して `undefined` を返すだけで、**buildもテストも赤くならない**。
 *   サーバーログを読んでいる人がいなければ誰も気づかない。
 *
 * 型検査もテストもこの2つを捕まえられないので、専用の検査を `npm run check` に入れている。
 */

/** 公開ボタンを配線すべきcollectionのファイル。`article-placements` はpublish経路自体が無いので除く。 */
export const PUBLISHABLE_COLLECTION_FILES = [
  'collections/Manufacturers.ts',
  'collections/Distributors.ts',
  'collections/RobotSeries.ts',
  'collections/Robots.ts',
  'collections/UseCases.ts',
  'collections/Deployments.ts',
  'collections/Articles.ts',
];

const COMPONENTS_MODULE = 'lib/payload/adminPublishComponents.ts';
const IMPORT_MAP = 'src/app/(payload)/admin/importMap.js';
const SHARED_CONST = 'contentPublishAdminComponents';

/**
 * @param {{ componentsModule: string, importMap: string, collections: Record<string, string> }} sources
 * @returns {{ path: string, problem: string }[]}
 */
export function findAdminImportMapViolations(sources) {
  const violations = [];

  // 1. 共有定数が指すcomponent path（`path#exportName`）を取り出す。
  const pathMatch = sources.componentsModule.match(
    /PUBLISH_BUTTON_COMPONENT_PATH\s*=\s*\r?\n?\s*(['"])([^'"]+)\1/,
  );
  if (!pathMatch) {
    violations.push({
      path: COMPONENTS_MODULE,
      problem: 'PUBLISH_BUTTON_COMPONENT_PATH の文字列リテラルを読み取れない',
    });
    return violations;
  }
  const componentPath = pathMatch[2];

  // 2. 共有定数がその path を実際に PublishButton へ割り当てているか。
  //    定数だけ残して割り当てを消す、という壊し方を捕まえる。
  if (!/PublishButton:\s*PUBLISH_BUTTON_COMPONENT_PATH/.test(sources.componentsModule)) {
    violations.push({
      path: COMPONENTS_MODULE,
      problem: `${SHARED_CONST} が edit.PublishButton へ PUBLISH_BUTTON_COMPONENT_PATH を割り当てていない`,
    });
  }

  // 3. `importMap.js` に `path#exportName` のキーがあるか。
  //    無いと `getFromImportMap` が console.error を出すだけで標準ボタンへ戻る。
  if (!sources.importMap.includes(`"${componentPath}"`)) {
    violations.push({
      path: IMPORT_MAP,
      problem:
        `キー "${componentPath}" が無い。` +
        '`npx payload generate:importmap` を実行して再生成すること',
    });
  }

  // 4. 各collectionが共有定数を admin.components へ渡しているか。
  for (const [file, source] of Object.entries(sources.collections)) {
    if (!new RegExp(`components:\\s*${SHARED_CONST}`).test(source)) {
      violations.push({
        path: file,
        problem: `admin.components に ${SHARED_CONST} を渡していない（標準のPublishButtonに戻る）`,
      });
    }
  }

  return violations;
}

export async function checkAdminImportMap(root = process.cwd()) {
  const read = (relative) => readFile(path.join(root, relative), 'utf8');
  const collections = {};
  for (const file of PUBLISHABLE_COLLECTION_FILES) {
    collections[file] = await read(file);
  }
  return findAdminImportMapViolations({
    componentsModule: await read(COMPONENTS_MODULE),
    importMap: await read(IMPORT_MAP),
    collections,
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const violations = await checkAdminImportMap();
  if (violations.length > 0) {
    for (const violation of violations) {
      process.stderr.write(`[admin-import-map] ${violation.path}: ${violation.problem}\n`);
    }
    process.exitCode = 1;
  } else {
    process.stdout.write('[admin-import-map] OK\n');
  }
}
