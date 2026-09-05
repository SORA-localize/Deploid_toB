import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';
import { ArticlePlacements } from '@/collections/ArticlePlacements';
import { Articles } from '@/collections/Articles';
import { Deployments } from '@/collections/Deployments';
import { Distributors } from '@/collections/Distributors';
import { Manufacturers } from '@/collections/Manufacturers';
import { Robots } from '@/collections/Robots';
import { RobotSeriesCollection } from '@/collections/RobotSeries';
import { UseCases } from '@/collections/UseCases';
import { SiteSettings } from '@/globals/SiteSettings';
import { applyAdminFieldLabels, collectUnlabeledAdminFieldPaths } from '@/lib/payload/adminFieldLabels';

/**
 * T4完了条件（`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md`）:
 * 対象範囲（公開必須項目を持つ7 collection + ArticlePlacements + SiteSettings、
 * nested/array含む）に未ラベルのfieldが無いこと。hidden fieldは対象外。
 */
const TARGETS: ReadonlyArray<{ name: string; fields: Field[] }> = [
  { name: 'manufacturers', fields: Manufacturers.fields },
  { name: 'distributors', fields: Distributors.fields },
  { name: 'robot-series', fields: RobotSeriesCollection.fields },
  { name: 'robots', fields: Robots.fields },
  { name: 'use-cases', fields: UseCases.fields },
  { name: 'deployments', fields: Deployments.fields },
  { name: 'articles', fields: Articles.fields },
  { name: 'article-placements', fields: ArticlePlacements.fields },
  { name: 'site-settings', fields: SiteSettings.fields },
];

describe('adminFieldLabels: 未ラベルfieldの機械検出', () => {
  it.each(TARGETS)('$name: nested/array を含む対象範囲に未ラベルのfieldが無い', ({ fields }) => {
    expect(collectUnlabeledAdminFieldPaths(fields)).toEqual([]);
  });

  it('admin.hidden なfield（adminPublishIntent）は未ラベル検出の対象外', () => {
    // baseContentFields() が全collectionへ入れる adminPublishIntentField() は
    // `admin.hidden: true` のため、labelが無くてもgapとして出てはならない。
    const gaps = collectUnlabeledAdminFieldPaths(Manufacturers.fields);
    expect(gaps).not.toContain('adminPublishIntent');
  });

  it('未ラベルのfieldがあれば実際に検出される（この安全網自体が機能する証明）', () => {
    const fields = applyAdminFieldLabels(
      [
        { name: 'labeled', type: 'text' },
        { name: 'forgotten', type: 'text' },
      ],
      { labeled: { ja: 'ラベル済み', en: 'Labeled' } },
    );
    expect(collectUnlabeledAdminFieldPaths(fields)).toEqual(['forgotten']);
  });

  it('nested groupの中の未ラベルfieldもdot区切りpathで検出される', () => {
    const fields: Field[] = [
      {
        name: 'group',
        type: 'group',
        label: { ja: 'グループ', en: 'Group' },
        fields: [{ name: 'child', type: 'text' }],
      },
    ];
    expect(collectUnlabeledAdminFieldPaths(fields)).toEqual(['group.child']);
  });
});
