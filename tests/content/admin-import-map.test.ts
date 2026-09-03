import { describe, expect, it } from 'vitest';
import {
  PUBLISHABLE_COLLECTION_FILES,
  checkAdminImportMap,
  findAdminImportMapViolations,
} from '../../scripts/check-admin-import-map.mjs';

/**
 * Admin公開ボタンの配線検査（`docs/plans/admin-publish-ui-plan-v1.md` Task 6）。
 *
 * ## なぜこの検査自体をテストするのか
 *
 * この配線の失敗は**全て silent fallback** —— collectionの指定漏れも importMap のキー欠落も、
 * 標準の PublishButton（`createPublishGateHook` に弾かれて `Something went wrong.` を出す方）へ
 * 静かに戻るだけで、build も typecheck も e2e 以外のテストも緑のまま通る。
 * 検査が唯一の歯止めなので、**検査が本当に赤くなること**をここで固定する。
 */

const HEALTHY = {
  componentsModule: [
    "export const PUBLISH_BUTTON_COMPONENT_PATH =",
    "  '@/components/admin/PublishFromApproval#PublishFromApproval';",
    'export const contentPublishAdminComponents = {',
    '  edit: { PublishButton: PUBLISH_BUTTON_COMPONENT_PATH },',
    '};',
  ].join('\n'),
  importMap: '"@/components/admin/PublishFromApproval#PublishFromApproval": X,',
  collections: {
    'collections/Manufacturers.ts':
      "  admin: { useAsTitle: 'name', components: contentPublishAdminComponents },",
  },
};

describe('壊れ方を検出できること', () => {
  it('健全な組み合わせは violation ゼロ', () => {
    expect(findAdminImportMapViolations(HEALTHY)).toEqual([]);
  });

  it('collectionが共有定数を渡していなければ、そのファイルを名指しで報告する', () => {
    const violations = findAdminImportMapViolations({
      ...HEALTHY,
      collections: { 'collections/Articles.ts': "  admin: { useAsTitle: 'title' }," },
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.path).toBe('collections/Articles.ts');
  });

  it('importMapのキーが無ければ報告し、再生成コマンドを案内する', () => {
    const violations = findAdminImportMapViolations({ ...HEALTHY, importMap: '{}' });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.path).toBe('src/app/(payload)/admin/importMap.js');
    expect(violations[0]?.problem).toContain('generate:importmap');
  });

  it('component pathを変えたのにimportMapを再生成していない場合を捕まえる', () => {
    // 「片方だけ直す」が最も起きやすい壊し方。キーの完全一致で見ているので検出できる。
    const violations = findAdminImportMapViolations({
      ...HEALTHY,
      componentsModule: HEALTHY.componentsModule.replace('PublishFromApproval#', 'PublishFromApprovalV2#'),
    });
    expect(violations.map((v) => v.path)).toContain('src/app/(payload)/admin/importMap.js');
  });

  it('定数は残したまま PublishButton への割り当てだけ消した場合も捕まえる', () => {
    const violations = findAdminImportMapViolations({
      ...HEALTHY,
      componentsModule: HEALTHY.componentsModule.replace(
        '  edit: { PublishButton: PUBLISH_BUTTON_COMPONENT_PATH },',
        '  edit: {},',
      ),
    });
    expect(violations.map((v) => v.path)).toContain('lib/payload/adminPublishComponents.ts');
  });

  it('pathリテラルを読み取れない場合は、他を検査せず即座に報告する', () => {
    // 読み取れないまま先へ進むと、キー比較が空文字になり **常に緑** になってしまう。
    const violations = findAdminImportMapViolations({ ...HEALTHY, componentsModule: 'export const X = 1;' });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.problem).toContain('PUBLISH_BUTTON_COMPONENT_PATH');
  });
});

describe('実際のrepositoryに対して', () => {
  it('公開できる7つのcollectionを対象にしている（article-placementsは除く）', () => {
    // `article-placements` は `ApprovableCollectionSlug` の外で publish 経路自体が無い。
    // 誤って足すと、押しても必ず失敗するボタンが出る。
    expect(PUBLISHABLE_COLLECTION_FILES).toHaveLength(7);
    expect(PUBLISHABLE_COLLECTION_FILES).not.toContain('collections/ArticlePlacements.ts');
  });

  it('配線が今この時点で成立している', async () => {
    await expect(checkAdminImportMap(process.cwd())).resolves.toEqual([]);
  });
});
