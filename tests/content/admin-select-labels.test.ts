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
import { articlePlacementSlotSelectOptions, collectSelectFieldSnapshots } from '@/lib/payload/adminSelectLabels';
import { imageRoleLabels } from '@/lib/labels';

/**
 * T5完了条件（`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md`）:
 * - 対象selectすべてにja/en両方のラベルがある
 * - select fieldごとに値集合が変わっていないこと（refactor前のvalue集合を固定して比較）
 * - `ArticlePlacements.slot`が`imageRoleLabels.hero`を再利用していないこと
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

/**
 * refactor前（2026-09-05時点、plain string配列だった頃）の値集合。1件でも増減したら
 * 気づけるように、path単位で固定する（T5完了条件）。
 */
const EXPECTED_VALUES: Record<string, string[]> = {
  // 共有field（access.ts）。全collectionへ`...baseContentFields()`/`...baseRecordContentFields()`
  // で展開されるため、9対象それぞれのpathの下に同じ値集合で現れる。
  lifecycleStatus: ['active', 'archived'],
  reliability: ['verified', 'official', 'reported', 'estimated'],
  'sources.reliability': ['verified', 'official', 'reported', 'estimated'],
  'heroImage.rights.status': [
    'own',
    'licensed',
    'commercial-permitted',
    'reference-attributed',
    'permission-requested',
    'prototype-only',
    'blocked',
  ],
  'heroImage.rights.sourceType': ['own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown'],

  // Manufacturers
  companyType: ['manufacturer', 'distributor', 'integrator', 'ai-os', 'research'],
  companyStatus: ['active', 'stealth', 'acquired', 'inactive'],
  japanPresence: ['office', 'distributor', 'partner', 'remote', 'none', 'unknown'],

  // Distributors
  providerType: ['maker-direct', 'reseller', 'other'],
  acquisitionMethods: ['purchase', 'lease', 'raas', 'subscription', 'inquiry'],

  // Deployments
  status: ['announced', 'pilot', 'production', 'ended', 'unknown'],

  // Robots
  category: ['humanoid', 'general-purpose-robot', 'upper-body-humanoid', 'mobile-manipulator', 'other'],
  deploymentStage: ['concept', 'prototype', 'pilot', 'limited-production', 'production', 'internal-use', 'discontinued'],
  procurementModels: ['purchase', 'lease', 'raas', 'subscription', 'partner-program', 'not-for-sale', 'inquiry'],
  'priceOffers.channel': ['manufacturer-public', 'authorized-distributor-public'],
  'priceOffers.taxStatus': ['included', 'excluded', 'unknown'],
  'loadRatings.scope': ['single-arm', 'dual-arm', 'whole-body', 'carrier', 'manufacturer-wording'],
  'loadRatings.rating': ['rated', 'maximum', 'unspecified'],
  japanAvailability: ['official-japan', 'distributor-japan', 'inquiry-required', 'import-only', 'unavailable', 'unknown'],

  // UseCases
  maturityLevel: ['early-stage', 'pilot-phase', 'production-ready'],
  buyerReadiness: ['initial-adoption', 'requires-poc', 'limited-today'],
  environment: ['indoor-controlled', 'indoor-semi-controlled', 'outdoor', 'mixed', 'hazardous'],
  requiredCapabilities: ['mobility', 'manipulation', 'perception', 'autonomy', 'communication', 'data-capture', 'integration'],
  'candidateRobots.fit': ['strong', 'possible', 'watch'],
  'candidateRobots.basis': [
    'deployment',
    'adjacent-deployment',
    'official-use-case',
    'product-capability',
    'market-signal',
    'editorial-watch',
  ],

  // Articles
  'articles.category': ['news', 'interview', 'company-report', 'analysis', 'policy'],
  type: [
    'analysis',
    'deployment-report',
    'interview',
    'event-report',
    'policy-update',
    'case-study',
    'news-brief',
    'tech-update',
    'market-analysis',
    'manufacturer-guide',
    'robot-guide',
    'basics-guide',
  ],
  section: ['digest', 'deployment', 'business', 'tech', 'policy', 'entertainment'],
  contentKind: ['editorial', 'sample', 'sponsored'],

  // ArticlePlacements
  surface: ['reports-index'],
  slot: ['hero', 'feature'],
  kind: ['editorial', 'sample', 'sponsored', 'house'],
};

describe('adminSelectLabels: 対象selectのoptionsが機械検出できる範囲で健全であること', () => {
  it.each(TARGETS)('$name: 全selectのoptionsにja/en両方のラベルがある', ({ fields }) => {
    const snapshots = collectSelectFieldSnapshots(fields);
    const withGaps = snapshots.filter((s) => s.unlabeledValues.length > 0);
    expect(withGaps).toEqual([]);
  });

  it.each(TARGETS)('$name: 各selectの値集合がrefactor前から変わっていない', ({ name, fields }) => {
    const snapshots = collectSelectFieldSnapshots(fields);
    for (const snapshot of snapshots) {
      // `category`のように複数collectionで同名だが意味が異なるfieldがあるため、
      // Articlesの`category`だけ専用keyで区別する（他は現状name単位で衝突しない）。
      const key = name === 'articles' && snapshot.path === 'category' ? 'articles.category' : snapshot.path;
      const expected = EXPECTED_VALUES[key];
      expect(expected, `${name}: ${key} の期待値がテストに定義されていない`).toBeDefined();
      expect(new Set(snapshot.values), `${name}: ${key}`).toEqual(new Set(expected));
    }
  });

  it('ArticlePlacements.slot は imageRoleLabels.hero を再利用していない（意味の異なるラベルの誤流用防止）', () => {
    const heroOption = articlePlacementSlotSelectOptions.find((o) => typeof o !== 'string' && o.value === 'hero');
    expect(heroOption).toBeDefined();
    const ja = typeof heroOption !== 'string' && heroOption ? (heroOption.label as { ja: string }).ja : undefined;
    expect(ja).not.toBe(imageRoleLabels.hero);
  });

  it('未ラベルのoptionがあれば実際に検出される（この安全網自体が機能する証明）', () => {
    const fields: Field[] = [
      {
        name: 'demo',
        type: 'select',
        options: [
          { value: 'labeled', label: { ja: 'ラベル済み', en: 'Labeled' } },
          'forgotten',
        ],
      },
    ];
    const [snapshot] = collectSelectFieldSnapshots(fields);
    expect(snapshot.unlabeledValues).toEqual(['forgotten']);
  });
});
