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

const COMPONENTS_MODULE = 'lib/payload/adminPublishComponents.ts';
const IMPORT_MAP = 'src/app/(payload)/admin/importMap.js';
const APPROVABLE_MODULE = 'lib/payload/publishApprovedVersion.ts';
const SHARED_CONST = 'contentPublishAdminComponents';

/**
 * 配線すべきcollectionを**ハードコードせず `ApprovableCollectionSlug` から導出する。**
 *
 * ここに一覧を書き写すと、公開できるcollectionを増やしたときに書き忘れても検査が緑のままになり、
 * 「公開できるはずなのにボタンが出ない」を素通しする。型が正本、これは派生。
 * `article-placements` は `ApprovableCollectionSlug` の外なので自動的に対象外になる。
 */
export function publishableCollectionFiles(approvableSource) {
  const match = approvableSource.match(/type\s+ApprovableCollectionSlug\s*=([^;]+);/);
  if (!match) return null;
  const slugs = [...match[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
  if (slugs.length === 0) return null;
  return slugs.map((slug) => {
    const pascal = slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
    return { slug, path: `collections/${pascal}.ts` };
  });
}

/**
 * @param {{ componentsModule: string, importMap: string, approvableSource: string, collections: Record<string, string | null> }} sources
 * @returns {{ path: string, problem: string }[]}
 */
export function findAdminImportMapViolations(sources) {
  const violations = [];

  // 0. 正本（`ApprovableCollectionSlug`）を読めること。読めないまま先へ進むと
  //    「対象0件なので全部OK」という最悪の緑になる。
  const expected = publishableCollectionFiles(sources.approvableSource);
  if (!expected) {
    violations.push({
      path: APPROVABLE_MODULE,
      problem: 'ApprovableCollectionSlug のunionを読み取れない（対象collectionを導出できない）',
    });
    return violations;
  }

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

  // 4. 公開できる各collectionが共有定数を admin.components へ渡しているか。
  for (const { slug, path: file } of expected) {
    const source = sources.collections[file];
    if (source === undefined || source === null) {
      violations.push({
        path: file,
        problem: `"${slug}" は公開できる想定だが、対応するcollectionファイルが見つからない`,
      });
      continue;
    }
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
  const readOrNull = (relative) => read(relative).catch(() => null);

  const approvableSource = await read(APPROVABLE_MODULE);
  const collections = {};
  for (const { path: file } of publishableCollectionFiles(approvableSource) ?? []) {
    collections[file] = await readOrNull(file);
  }
  return findAdminImportMapViolations({
    componentsModule: await read(COMPONENTS_MODULE),
    importMap: await read(IMPORT_MAP),
    approvableSource,
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
