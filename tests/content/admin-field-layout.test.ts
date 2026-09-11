import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';
import { ArticlePlacements } from '@/collections/ArticlePlacements';
import { Articles } from '@/collections/Articles';
import { Deployments } from '@/collections/Deployments';
import { Distributors } from '@/collections/Distributors';
import { Robots } from '@/collections/Robots';
import { RobotSeriesCollection } from '@/collections/RobotSeries';
import { UseCases } from '@/collections/UseCases';
import { ADMIN_PUBLISH_INTENT_FIELD } from '@/lib/payload/adminPublishIntent';

/**
 * `docs/archive/admin-layout-rollout-plan-v1.md` T1〜T7完了条件（レビュー指摘#3）:
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

function isTabsField(field: Field): boolean {
  return (field as Field & { type?: string }).type === 'tabs';
}

function findTabsField(fields: Field[]): { tabs: RawTab[] } | undefined {
  return fields.find(isTabsField) as { tabs: RawTab[] } | undefined;
}

/** sidebarでもtabsでもhiddenでもない、通常領域にそのまま残るfield（T7のような設計）。 */
function plainFieldNamesOf(fields: Field[]): (string | undefined)[] {
  return fields.filter((f) => !isSidebarPositioned(f) && !isTabsField(f) && !isHidden(f)).map(fieldName);
}

interface ExpectedTab {
  labelJa: string;
  labelEn: string;
  fieldNames: readonly string[];
}

/**
 * `tabs`が空配列の場合はT7（ArticlePlacements）のような「tabsを作らない」設計
 * （レビュー指摘#3の「T7・T8がtabsを持たないこと」の固定）。その場合`plainFieldNames`に
 * 通常領域（sidebarでもtabsでもない、縦並びのまま残るfield）の期待順序を指定する。
 */
interface LayoutFixture {
  name: string;
  fields: Field[];
  sidebarFieldNames: readonly string[];
  tabs: readonly ExpectedTab[];
  plainFieldNames?: readonly string[];
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
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'],
    tabs: [
      {
        labelJa: '本文',
        labelEn: 'Body',
        fieldNames: ['title', 'titleJa', 'summary', 'keyTakeaways', 'body'],
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
  {
    name: 'use-cases',
    fields: UseCases.fields,
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'],
    tabs: [
      {
        labelJa: '基本情報',
        labelEn: 'Basic info',
        fieldNames: [
          'title',
          'titleJa',
          'subtitle',
          'maturityLevel',
          'environment',
          'requiredCapabilities',
          'primaryIndustry',
          'industryTags',
          'taskTags',
          'summary',
          'overview',
          'whyItMatters',
        ],
      },
      {
        labelJa: '詳細分析',
        labelEn: 'Detailed analysis',
        fieldNames: ['atAGlance', 'capabilityNotes', 'environmentRequirements', 'whyHardToday', 'japanDeploymentConditions', 'candidateRobots'],
      },
      {
        labelJa: '出典・SEO',
        labelEn: 'Sources & SEO',
        fieldNames: ['sources', 'reliability', 'seo'],
      },
    ],
  },
  {
    name: 'distributors',
    fields: Distributors.fields,
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'],
    tabs: [
      {
        labelJa: '基本情報',
        labelEn: 'Basic info',
        fieldNames: [
          'name',
          'nameJa',
          'website',
          'providerType',
          'handledManufacturerIds',
          'handledRobotIds',
          'acquisitionMethods',
          'inquiryUrl',
          'summary',
          'note',
        ],
      },
      {
        labelJa: '画像・出典',
        labelEn: 'Media & sources',
        fieldNames: ['heroImage', 'sources', 'reliability', 'seo'],
      },
    ],
  },
  {
    name: 'deployments',
    fields: Deployments.fields,
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'],
    tabs: [
      {
        labelJa: '基本情報',
        labelEn: 'Basic info',
        fieldNames: ['manufacturerId', 'customer', 'siteName', 'country', 'location', 'status', 'relatedUseCaseIds', 'summary'],
      },
      {
        labelJa: '出典・SEO',
        labelEn: 'Sources & SEO',
        fieldNames: ['sources', 'reliability', 'heroImage', 'seo'],
      },
    ],
  },
  {
    name: 'robot-series',
    fields: RobotSeriesCollection.fields,
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy'],
    tabs: [
      {
        labelJa: '基本情報',
        labelEn: 'Basic info',
        fieldNames: ['name', 'nameJa', 'manufacturerId', 'description', 'industryTags', 'taskTags', 'summary'],
      },
      {
        labelJa: '画像・出典',
        labelEn: 'Media & sources',
        fieldNames: ['images', 'sources', 'reliability', 'heroImage', 'seo'],
      },
    ],
  },
  {
    name: 'article-placements',
    fields: ArticlePlacements.fields,
    sidebarFieldNames: ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus'],
    tabs: [],
    plainFieldNames: ['surface', 'slot', 'articleId', 'order', 'kind', 'sponsor'],
  },
];

describe('adminFieldLayout: sidebar/tabsへの振り分けが設計通りで、漏れ・重複・順序違いが無い', () => {
  it.each(LAYOUT_FIXTURES)('$name: sidebar field名の集合が設計と一致する（重複無し）', ({ fields, sidebarFieldNames }) => {
    const sidebarNames = fields.filter(isSidebarPositioned).map(fieldName);
    expect(new Set(sidebarNames)).toEqual(new Set(sidebarFieldNames));
    expect(sidebarNames.length).toBe(sidebarFieldNames.length);
  });

  it.each(LAYOUT_FIXTURES)(
    '$name: tabsが設計通りに存在する、またはtabsを持たない設計ならtabsが存在しないことを確認する',
    ({ fields, tabs }) => {
      const tabsField = findTabsField(fields);
      if (tabs.length === 0) {
        expect(tabsField, 'this collection is designed with no tabs (sidebar + plain fields only)').toBeUndefined();
        return;
      }
      expect(tabsField).toBeDefined();
    },
  );

  it.each(LAYOUT_FIXTURES)('$name: tabのja/en labelと順序が設計と一致する', ({ fields, tabs }) => {
    if (tabs.length === 0) return; // tabsを持たない設計。前のテストでtabs不在を確認済み。
    const tabsField = findTabsField(fields);
    expect(tabsField?.tabs.map((t) => ({ ja: t.label?.ja, en: t.label?.en }))).toEqual(
      tabs.map((t) => ({ ja: t.labelJa, en: t.labelEn })),
    );
  });

  it.each(LAYOUT_FIXTURES)('$name: 各tabのfield名と順序が設計と一致する', ({ fields, tabs }) => {
    if (tabs.length === 0) return; // tabsを持たない設計。次のテストで通常領域の順序を検査する。
    const tabsField = findTabsField(fields);
    const actual = tabsField?.tabs.map((t) => t.fields.map(fieldName));
    expect(actual).toEqual(tabs.map((t) => [...t.fieldNames]));
  });

  it.each(LAYOUT_FIXTURES)(
    '$name: tabsを持たない設計では、通常領域のfield名と順序が設計と一致する',
    ({ fields, tabs, plainFieldNames }) => {
      if (tabs.length > 0) return; // tabsを持つ設計はここでは対象外。
      expect(plainFieldNames, 'a no-tabs fixture must declare plainFieldNames').toBeDefined();
      expect(plainFieldNamesOf(fields)).toEqual([...(plainFieldNames ?? [])]);
    },
  );

  it.each(LAYOUT_FIXTURES)(
    '$name: visible field集合（sidebar+tabsまたはsidebar+通常領域）に漏れ・重複が無い',
    ({ fields, sidebarFieldNames, tabs, plainFieldNames }) => {
      const sidebarNames = fields.filter(isSidebarPositioned).map(fieldName);
      const tabsField = findTabsField(fields);
      const tabFieldNames = tabsField?.tabs.flatMap((t) => t.fields.map(fieldName)) ?? [];
      const plainNames = tabs.length === 0 ? plainFieldNamesOf(fields) : [];
      const combined = [...sidebarNames, ...tabFieldNames, ...plainNames];
      const expectedCombined = [...sidebarFieldNames, ...tabs.flatMap((t) => t.fieldNames), ...(plainFieldNames ?? [])];
      expect(new Set(combined)).toEqual(new Set(expectedCombined));
      expect(combined.length).toBe(expectedCombined.length);
    },
  );

  it.each(LAYOUT_FIXTURES)('$name: hiddenなadminPublishIntentフィールドは保持されている', ({ fields }) => {
    const hasHiddenIntent = fields.some((f) => fieldName(f) === ADMIN_PUBLISH_INTENT_FIELD && isHidden(f));
    expect(hasHiddenIntent).toBe(true);
  });
});
