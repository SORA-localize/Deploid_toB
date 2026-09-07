import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';
import { ArticlePlacements } from '@/collections/ArticlePlacements';
import { Articles } from '@/collections/Articles';
import { Deployments } from '@/collections/Deployments';
import { Distributors } from '@/collections/Distributors';
import { Manufacturers } from '@/collections/Manufacturers';
import { Media } from '@/collections/Media';
import { Robots } from '@/collections/Robots';
import { RobotSeriesCollection } from '@/collections/RobotSeries';
import { UseCases } from '@/collections/UseCases';
import { SiteSettings } from '@/globals/SiteSettings';
import {
  applyAdminFieldLabels,
  collectArrayFieldsMissingRowLabels,
  collectUnlabeledAdminFieldPaths,
} from '@/lib/payload/adminFieldLabels';

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
  { name: 'media', fields: Media.fields },
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

/**
 * T9完了条件（`docs/plans/admin-layout-rollout-plan-v1.md`）: 配列fieldの追加ボタンは
 * Payloadが`labels.singular`から自動生成するため、field単位の`label`とは別に
 * `labels.singular`/`labels.plural`のja/enが揃っていることを検査する。固定件数ではなく
 * 検出ベース——対象collection内のarray fieldが増減しても追従する。
 */
describe('adminFieldLabels: 配列fieldのrow label（追加ボタン文言）の機械検出', () => {
  it.each(TARGETS)('$name: array fieldにlabels.singular/pluralの無いものが無い', ({ fields }) => {
    expect(collectArrayFieldsMissingRowLabels(fields)).toEqual([]);
  });

  it('admin.hidden な配列field（AuditUploadSessions.allowedObjects相当）は対象外', () => {
    const fields: Field[] = [
      {
        name: 'allowedObjects',
        type: 'array',
        admin: { hidden: true },
        fields: [{ name: 'key', type: 'text' }],
      },
    ];
    expect(collectArrayFieldsMissingRowLabels(fields)).toEqual([]);
  });

  it('labelsの無い配列fieldは実際に検出される（この安全網自体が機能する証明）', () => {
    const fields: Field[] = [
      { name: 'items', type: 'array', fields: [{ name: 'value', type: 'text' }] },
    ];
    expect(collectArrayFieldsMissingRowLabels(fields)).toEqual(['items']);
  });

  it('singularのみ・pluralのみでも不足として検出される', () => {
    const singularOnly: Field[] = [
      {
        name: 'items',
        type: 'array',
        labels: { singular: { ja: '項目', en: 'Item' } } as never,
        fields: [{ name: 'value', type: 'text' }],
      },
    ];
    expect(collectArrayFieldsMissingRowLabels(singularOnly)).toEqual(['items']);
  });
});
