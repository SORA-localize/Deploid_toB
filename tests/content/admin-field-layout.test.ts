import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';
import { Articles } from '@/collections/Articles';
import { Robots } from '@/collections/Robots';
import { ADMIN_PUBLISH_INTENT_FIELD } from '@/lib/payload/adminPublishIntent';

/**
 * `docs/plans/admin-layout-rollout-plan-v1.md` T1〜T7完了条件（レビュー指摘#3）:
 * 起動時の「振り分け漏れ」throw（`unplacedFields`が空であること）は
 * 「置き場所がゼロ」しか検出できない。誤配置・重複登録・順序違い・sidebar付け忘れは
 * 検出できないため、実際のcollection定義（`Robots.fields`等）を直接読み、設計
 * （`docs/decisions/admin-field-layout-v1.md` §3）どおりの配置になっているかを
 * データ駆動で検査する。1タスク＝`LAYOUT_FIXTURES`へ1エントリを追加する形にし、
 * 既存エントリは変更しない。
 */

function fieldName(field: Field): string | undefined {
  return (field as Field & { name?: string }).name;
}

function isSidebarPositioned(field: Field): boolean {
  return (field as Field & { admin?: { position?: string } }).admin?.position === 'sidebar';
}

function isHidden(field: Field): boolean {
  return (field as Field & { admin?: { hidden?: boolean } }).admin?.hidden === true;
}

interface RawTab {
  label?: { ja?: string; en?: string };
  fields: Field[];
}

function findTabsField(fields: Field[]): { tabs: RawTab[] } | undefined {
  return fields.find((f) => (f as Field & { type?: string }).type === 'tabs') as
    | { tabs: RawTab[] }
    | undefined;
}

interface ExpectedTab {
  labelJa: string;
  labelEn: string;
  fieldNames: readonly string[];
}

interface LayoutFixture {
  name: string;
  fields: Field[];
  sidebarFieldNames: readonly string[];
  tabs: readonly ExpectedTab[];
}

const LAYOUT_FIXTURES: readonly LayoutFixture[] = [
  {
    name: 'robots',
    fields: Robots.fields,
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'featuredRank', 'nextReviewBy', 'supersededById'],
    tabs: [
      {
        labelJa: '基本情報',
        labelEn: 'Basic info',
        fieldNames: [
          'name',
          'nameJa',
          'manufacturerId',
          'seriesId',
          'category',
          'description',
          'deploymentStage',
          'japanAvailability',
          'distributorJapan',
          'summary',
        ],
      },
      {
        labelJa: 'スペック・価格',
        labelEn: 'Specs & pricing',
        fieldNames: ['specs', 'procurementModels', 'priceOffers', 'loadRatings', 'fieldEvidence', 'usageExampleSourceUrls', 'supportNote'],
      },
      {
        labelJa: '画像・出典・比較',
        labelEn: 'Media, sources & comparison',
        fieldNames: ['images', 'industryTags', 'taskTags', 'sources', 'reliability', 'heroImage', 'seo', 'comparison'],
      },
    ],
  },
  {
    name: 'articles',
    fields: Articles.fields,
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy', 'featured'],
    tabs: [
      {
        labelJa: '本文',
        labelEn: 'Body',
        fieldNames: ['title', 'titleJa', 'summary', 'whyItMatters', 'keyTakeaways', 'body'],
      },
      {
        labelJa: '分類・関連',
        labelEn: 'Classification & related',
        fieldNames: [
          'category',
          'type',
          'section',
          'contentKind',
          'publishedAt',
          'author',
          'industryTags',
          'regionTags',
          'themeTags',
          'relatedRobotIds',
          'relatedManufacturerIds',
          'relatedUseCaseIds',
        ],
      },
      {
        labelJa: '画像・出典・特殊コンテンツ',
        labelEn: 'Media, sources & special content',
        fieldNames: ['heroImage', 'sources', 'reliability', 'seo', 'manufacturerGuideContent'],
      },
    ],
  },
];

describe('adminFieldLayout: sidebar/tabsへの振り分けが設計通りで、漏れ・重複・順序違いが無い', () => {
  it.each(LAYOUT_FIXTURES)('$name: sidebar field名の集合が設計と一致する（重複無し）', ({ fields, sidebarFieldNames }) => {
    const sidebarNames = fields.filter(isSidebarPositioned).map(fieldName);
    expect(new Set(sidebarNames)).toEqual(new Set(sidebarFieldNames));
    expect(sidebarNames.length).toBe(sidebarFieldNames.length);
  });

  it.each(LAYOUT_FIXTURES)('$name: tabのja/en labelと順序が設計と一致する', ({ fields, tabs }) => {
    const tabsField = findTabsField(fields);
    expect(tabsField).toBeDefined();
    expect(tabsField?.tabs.map((t) => ({ ja: t.label?.ja, en: t.label?.en }))).toEqual(
      tabs.map((t) => ({ ja: t.labelJa, en: t.labelEn })),
    );
  });

  it.each(LAYOUT_FIXTURES)('$name: 各tabのfield名と順序が設計と一致する', ({ fields, tabs }) => {
    const tabsField = findTabsField(fields);
    const actual = tabsField?.tabs.map((t) => t.fields.map(fieldName));
    expect(actual).toEqual(tabs.map((t) => [...t.fieldNames]));
  });

  it.each(LAYOUT_FIXTURES)(
    '$name: visible field集合（sidebar+tabs）に漏れ・重複が無い',
    ({ fields, sidebarFieldNames, tabs }) => {
      const sidebarNames = fields.filter(isSidebarPositioned).map(fieldName);
      const tabsField = findTabsField(fields);
      const tabFieldNames = tabsField?.tabs.flatMap((t) => t.fields.map(fieldName)) ?? [];
      const combined = [...sidebarNames, ...tabFieldNames];
      const expectedCombined = [...sidebarFieldNames, ...tabs.flatMap((t) => t.fieldNames)];
      expect(new Set(combined)).toEqual(new Set(expectedCombined));
      expect(combined.length).toBe(expectedCombined.length);
    },
  );

  it.each(LAYOUT_FIXTURES)('$name: hiddenなadminPublishIntentフィールドは保持されている', ({ fields }) => {
    const hasHiddenIntent = fields.some((f) => fieldName(f) === ADMIN_PUBLISH_INTENT_FIELD && isHidden(f));
    expect(hasHiddenIntent).toBe(true);
  });
});
