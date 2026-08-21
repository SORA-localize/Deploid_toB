import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import type { ContentSnapshot, ContentSource, FullContentSource } from '@/lib/content/contracts';
import { createContentRepository } from '@/lib/content/createContentRepository';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { createInMemoryContentSource, createLocalContentSource } from '@/lib/content/localSource';
import { createPayloadContentSource } from '@/lib/content/payloadSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { privilegedPublishContext } from '@/lib/payload/publishAuthorization';
import { siteMeta } from '@/lib/site';

/**
 * Task 4 Step 1 / Step 8: **同じcontract suiteをlocal sourceとPayload sourceへparameterizeして
 * 実行する**。Payload側は実Payload Local API + local throwaway Postgresへ、local側と同じ
 * fixture snapshotをseedしてから同じ期待値で検証する。
 *
 * DBは他の `tests/content/*.test.ts` と同じく、ambient `DATABASE_URL` が指すlocal throwaway
 * Postgresを使う（`testDbGuard.ts` のhost gate + dev DB名gate）。実行例:
 *   `DATABASE_URL=postgresql://<user>@127.0.0.1:5432/deploid_task4_test PAYLOAD_SECRET=<any> \
 *      npx vitest run tests/content/repository.contract.test.ts`
 */
const PASSWORD = 'Str0ngPassw0rd!23';
const OWNER_EMAIL = 'contract-owner@example.com';

const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

const SOURCES = [
  {
    title: 'Fixture source',
    url: 'https://example.com/fixture',
    checkedAt: '2026-01-01',
    reliability: 'official' as const,
  },
];

/**
 * 契約検証用のfixture。両source（local in-memory / Payload）へ同じ内容を入れる。
 * `published` / `archived` / `draft` の3状態、`previousSlugs`、robots↔robotSeriesのslug namespace
 * 共有、関連ID（1:1 / hasMany / array内relationship）をすべて含む。
 */
const FIXTURE: ContentSnapshot = {
  manufacturers: [
    {
      id: 'fx-mfr-alpha',
      slug: 'fx-mfr-alpha',
      previousSlugs: ['fx-mfr-alpha-old'],
      summary: 'Alpha manufacturer fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-01',
      reliability: 'official',
      sources: SOURCES,
      name: 'Alpha Robotics',
      companyType: 'manufacturer',
      companyStatus: 'active',
      country: 'Japan',
      website: 'https://example.com/alpha',
      description: 'Alpha description.',
      japanPresence: 'office',
      featuredRank: 1,
    },
    {
      id: 'fx-mfr-beta',
      slug: 'fx-mfr-beta',
      summary: 'Beta manufacturer fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-02',
      reliability: 'reported',
      sources: SOURCES,
      name: 'Beta Robotics',
      companyType: 'manufacturer',
      companyStatus: 'active',
      country: 'United States',
      website: 'https://example.com/beta',
      description: 'Beta description.',
      japanPresence: 'none',
    },
    {
      id: 'fx-mfr-draft',
      slug: 'fx-mfr-draft',
      summary: 'Draft manufacturer fixture.',
      publishStatus: 'draft',
      updatedAt: '2026-01-03',
      reliability: 'estimated',
      sources: SOURCES,
      name: 'Draft Robotics',
      companyType: 'manufacturer',
      companyStatus: 'stealth',
      country: 'Japan',
      website: 'https://example.com/draft',
      description: 'Draft description.',
      japanPresence: 'unknown',
    },
  ],
  robotSeries: [
    {
      id: 'fx-series-one',
      slug: 'fx-series-one',
      previousSlugs: ['fx-series-one-old'],
      summary: 'Series fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-04',
      reliability: 'official',
      sources: SOURCES,
      name: 'Alpha Series One',
      manufacturerId: 'fx-mfr-alpha',
      description: 'Series description.',
    },
  ],
  robots: [
    {
      id: 'fx-robot-a',
      slug: 'fx-robot-a',
      previousSlugs: ['fx-robot-a-old'],
      summary: 'Robot A fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-05',
      reliability: 'official',
      sources: SOURCES,
      name: 'Alpha One',
      manufacturerId: 'fx-mfr-alpha',
      seriesId: 'fx-series-one',
      category: 'humanoid',
      description: 'Robot A description.',
      featuredRank: 1,
      deploymentStage: 'pilot',
      specs: {},
      procurementModels: ['inquiry'],
      japanAvailability: 'inquiry-required',
      comparison: { strengths: [], constraints: [], bestFit: [], notFit: [] },
    },
    {
      id: 'fx-robot-b',
      slug: 'fx-robot-b',
      summary: 'Robot B fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-06',
      reliability: 'reported',
      sources: SOURCES,
      name: 'Beta One',
      manufacturerId: 'fx-mfr-beta',
      category: 'mobile-manipulator',
      description: 'Robot B description.',
      deploymentStage: 'production',
      specs: {},
      procurementModels: ['purchase'],
      japanAvailability: 'unavailable',
      comparison: { strengths: [], constraints: [], bestFit: [], notFit: [] },
    },
    {
      id: 'fx-robot-archived',
      slug: 'fx-robot-archived',
      previousSlugs: ['fx-robot-archived-old'],
      summary: 'Archived robot fixture.',
      publishStatus: 'archived',
      updatedAt: '2026-01-07',
      reliability: 'reported',
      sources: SOURCES,
      name: 'Alpha Zero',
      manufacturerId: 'fx-mfr-alpha',
      category: 'humanoid',
      description: 'Archived robot description.',
      deploymentStage: 'discontinued',
      supersededById: 'fx-robot-a',
      specs: {},
      procurementModels: ['not-for-sale'],
      japanAvailability: 'unavailable',
      comparison: { strengths: [], constraints: [], bestFit: [], notFit: [] },
    },
    {
      id: 'fx-robot-draft',
      slug: 'fx-robot-draft',
      summary: 'Draft robot fixture.',
      publishStatus: 'draft',
      updatedAt: '2026-01-08',
      reliability: 'estimated',
      sources: SOURCES,
      name: 'Draft One',
      manufacturerId: 'fx-mfr-beta',
      category: 'other',
      description: 'Draft robot description.',
      deploymentStage: 'concept',
      specs: {},
      procurementModels: ['inquiry'],
      japanAvailability: 'unknown',
      comparison: { strengths: [], constraints: [], bestFit: [], notFit: [] },
    },
  ],
  distributors: [
    {
      id: 'fx-dist-one',
      slug: 'fx-dist-one',
      previousSlugs: ['fx-dist-one-old'],
      summary: 'Distributor fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-09',
      reliability: 'official',
      sources: SOURCES,
      name: 'Alpha Japan Distribution',
      providerType: 'reseller',
      handledManufacturerIds: ['fx-mfr-alpha'],
      handledRobotIds: ['fx-robot-a'],
      acquisitionMethods: ['purchase', 'inquiry'],
    },
  ],
  useCases: [
    {
      id: 'fx-usecase-one',
      slug: 'fx-usecase-one',
      previousSlugs: ['fx-usecase-one-old'],
      summary: 'Use case fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-10',
      reliability: 'official',
      sources: SOURCES,
      title: 'Warehouse handling',
      maturityLevel: 'pilot-phase',
      buyerReadiness: 'requires-poc',
      environment: 'indoor-controlled',
      requiredCapabilities: ['mobility', 'manipulation'],
      primaryIndustry: 'logistics',
      industryTags: ['logistics'],
      taskTags: ['material-handling'],
      atAGlance: { whereFits: 'A', whereDoesNotFit: 'B', mustBeTrue: 'C' },
      overview: 'Overview.',
      whyItMatters: 'Why it matters.',
      capabilityNotes: {},
      environmentRequirements: 'Requirements.',
      whyHardToday: 'Hard today.',
      japanDeploymentConditions: 'Conditions.',
      candidateRobots: [
        { robotId: 'fx-robot-a', fit: 'strong', basis: 'product-capability', reason: 'Robot A fits.' },
        { seriesId: 'fx-series-one', fit: 'possible', basis: 'market-signal', reason: 'Series fits.' },
      ],
    },
    {
      id: 'fx-usecase-two',
      slug: 'fx-usecase-two',
      summary: 'Second use case fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-11',
      reliability: 'reported',
      sources: SOURCES,
      title: 'Facility patrol',
      maturityLevel: 'early-stage',
      buyerReadiness: 'limited-today',
      environment: 'mixed',
      requiredCapabilities: ['mobility'],
      primaryIndustry: 'facility-management',
      industryTags: ['facility-management'],
      taskTags: ['patrol'],
      atAGlance: { whereFits: 'A', whereDoesNotFit: 'B', mustBeTrue: 'C' },
      overview: 'Overview.',
      whyItMatters: 'Why it matters.',
      capabilityNotes: {},
      environmentRequirements: 'Requirements.',
      whyHardToday: 'Hard today.',
      japanDeploymentConditions: 'Conditions.',
      candidateRobots: [],
    },
    {
      id: 'fx-usecase-draft',
      slug: 'fx-usecase-draft',
      summary: 'Draft use case fixture.',
      publishStatus: 'draft',
      updatedAt: '2026-01-13',
      reliability: 'estimated',
      sources: SOURCES,
      title: 'Draft use case',
      maturityLevel: 'early-stage',
      buyerReadiness: 'limited-today',
      environment: 'outdoor',
      requiredCapabilities: ['mobility'],
      primaryIndustry: 'construction',
      industryTags: ['construction'],
      taskTags: ['inspection'],
      atAGlance: { whereFits: 'A', whereDoesNotFit: 'B', mustBeTrue: 'C' },
      overview: 'Draft overview.',
      whyItMatters: 'Draft why it matters.',
      capabilityNotes: {},
      environmentRequirements: 'Draft requirements.',
      whyHardToday: 'Draft hard today.',
      japanDeploymentConditions: 'Draft conditions.',
      candidateRobots: [],
    },
  ],
  deployments: [
    {
      id: 'fx-deploy-one',
      slug: 'fx-deploy-one',
      previousSlugs: ['fx-deploy-one-old'],
      summary: 'Deployment fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-12',
      reliability: 'official',
      sources: SOURCES,
      manufacturerId: 'fx-mfr-alpha',
      robotId: 'fx-robot-a',
      customer: 'Fixture Logistics',
      country: 'Japan',
      location: { lat: 35.68, lng: 139.76 },
      status: 'pilot',
      startedAt: '2026-01',
      relatedUseCaseIds: ['fx-usecase-one'],
    },
  ],
  articles: [
    {
      id: 'fx-article-new',
      slug: 'fx-article-new',
      previousSlugs: ['fx-article-new-old'],
      summary: 'Newer article fixture.',
      publishStatus: 'published',
      updatedAt: '2026-02-02',
      reliability: 'official',
      sources: SOURCES,
      title: 'Newer article',
      category: 'news',
      type: 'analysis',
      section: 'deployment',
      publishedAt: '2026-02-01',
      whyItMatters: 'Matters.',
      relatedRobotIds: ['fx-robot-a'],
      relatedManufacturerIds: ['fx-mfr-alpha'],
      relatedUseCaseIds: ['fx-usecase-one'],
      body: 'Body text.',
    },
    {
      id: 'fx-article-old',
      slug: 'fx-article-old',
      summary: 'Older article fixture.',
      publishStatus: 'published',
      updatedAt: '2026-01-02',
      reliability: 'reported',
      sources: SOURCES,
      title: 'Older article',
      category: 'analysis',
      type: 'market-analysis',
      section: 'business',
      publishedAt: '2026-01-01',
      whyItMatters: 'Matters.',
      relatedRobotIds: [],
      relatedManufacturerIds: ['fx-mfr-beta'],
      relatedUseCaseIds: [],
      body: 'Body text.',
    },
    {
      id: 'fx-article-draft',
      slug: 'fx-article-draft',
      summary: 'Draft article fixture.',
      publishStatus: 'draft',
      updatedAt: '2026-03-02',
      reliability: 'estimated',
      sources: SOURCES,
      title: 'Draft article',
      category: 'news',
      type: 'news-brief',
      section: 'digest',
      publishedAt: '2026-03-01',
      whyItMatters: 'Matters.',
      relatedRobotIds: ['fx-robot-a'],
      relatedManufacturerIds: [],
      relatedUseCaseIds: [],
      body: 'Body text.',
    },
  ],
  articlePlacements: [
    {
      id: 'reports-index:hero:fx-article-new',
      surface: 'reports-index',
      slot: 'hero',
      articleId: 'fx-article-new',
      order: 1,
      kind: 'editorial',
      publishStatus: 'published',
    },
    {
      id: 'reports-index:feature:fx-article-old',
      surface: 'reports-index',
      slot: 'feature',
      articleId: 'fx-article-old',
      order: 10,
      kind: 'editorial',
      publishStatus: 'published',
    },
  ],
  articleIndexPlacementLimits: { hero: 5, feature: 2 },
  media: [
    {
      id: 'fx-media-one',
      filename: 'fx-media-one.png',
      url: '/media/fx-media-one.png',
      alt: 'Fixture pixel',
      mimeType: 'image/png',
      rights: { status: 'own', sourceType: 'own', checkedAt: '2026-01-01' },
    },
  ],
  // 必須修正4-4: local定数と**区別できる値**にする。Payload sourceがローカル定数へfallbackすると
  // ここが `siteMeta.dataAsOf` になって落ちる（同じ値だとfallbackを検出できない）。
  siteSettings: { dataAsOf: 'fixture-data-as-of-2026-03' },
};

/** Payloadの `_status` / `lifecycleStatus`（`domainStatusToPayload` と同じ表）。 */
function payloadStatusFields(status: 'draft' | 'published' | 'archived') {
  if (status === 'draft') return { _status: 'draft' as const, lifecycleStatus: 'active' as const };
  if (status === 'published') return { _status: 'published' as const, lifecycleStatus: 'active' as const };
  return { _status: 'published' as const, lifecycleStatus: 'archived' as const };
}

const CONTENT_COLLECTIONS = [
  'article-placements',
  'articles',
  'deployments',
  'use-cases',
  'distributors',
  'robots',
  'robot-series',
  'manufacturers',
  'media',
] as const;

async function seedPayloadFixture(payload: Payload, user: Parameters<typeof payload.create>[0]['user']): Promise<void> {
  const internalIds = new Map<string, string | number>();
  const relate = (stableId: string | undefined) => (stableId ? internalIds.get(stableId) : undefined);

  const create = async (collection: (typeof CONTENT_COLLECTIONS)[number], stableId: string, data: Record<string, unknown>) => {
    const doc = await payload.create({
      collection,
      overrideAccess: true,
      user,
      data: data as never,
      // 必須修正1-4/1-6: published/archived な fixture を作るのは import/restore と同じ
      // 特権経路。通常のupdateで `_status: 'published'` を送る経路は publish gate が拒否する。
      context: privilegedPublishContext({
        runId: 'repository-contract-fixture',
        actorId: String((user as { id?: string | number } | null)?.id ?? 'unknown'),
        reason: 'repository contract test fixture seed',
      }),
    });
    internalIds.set(stableId, (doc as { id: string | number }).id);
  };

  const baseRecord = (record: {
    id: string;
    slug: string;
    previousSlugs?: string[];
    summary: string;
    publishStatus: 'draft' | 'published' | 'archived';
    reliability: string;
    sources: unknown[];
  }) => ({
    stableId: record.id,
    slug: record.slug,
    previousSlugs: record.previousSlugs,
    summary: record.summary,
    reliability: record.reliability,
    sources: record.sources,
    ...payloadStatusFields(record.publishStatus),
  });

  for (const manufacturer of FIXTURE.manufacturers) {
    await create('manufacturers', manufacturer.id, {
      ...baseRecord(manufacturer),
      name: manufacturer.name,
      companyType: manufacturer.companyType,
      companyStatus: manufacturer.companyStatus,
      country: manufacturer.country,
      website: manufacturer.website,
      description: manufacturer.description,
      japanPresence: manufacturer.japanPresence,
      featuredRank: manufacturer.featuredRank,
    });
  }

  for (const series of FIXTURE.robotSeries) {
    await create('robot-series', series.id, {
      ...baseRecord(series),
      name: series.name,
      manufacturerId: relate(series.manufacturerId),
      description: series.description,
    });
  }

  for (const robot of FIXTURE.robots) {
    await create('robots', robot.id, {
      ...baseRecord(robot),
      name: robot.name,
      manufacturerId: relate(robot.manufacturerId),
      seriesId: relate(robot.seriesId),
      category: robot.category,
      description: robot.description,
      featuredRank: robot.featuredRank,
      deploymentStage: robot.deploymentStage,
      supersededById: relate(robot.supersededById),
      specs: robot.specs,
      procurementModels: robot.procurementModels,
      japanAvailability: robot.japanAvailability,
      comparison: robot.comparison,
    });
  }

  for (const distributor of FIXTURE.distributors) {
    await create('distributors', distributor.id, {
      ...baseRecord(distributor),
      name: distributor.name,
      providerType: distributor.providerType,
      handledManufacturerIds: distributor.handledManufacturerIds.map(relate),
      handledRobotIds: distributor.handledRobotIds?.map(relate),
      acquisitionMethods: distributor.acquisitionMethods,
    });
  }

  for (const useCase of FIXTURE.useCases) {
    await create('use-cases', useCase.id, {
      ...baseRecord(useCase),
      title: useCase.title,
      maturityLevel: useCase.maturityLevel,
      buyerReadiness: useCase.buyerReadiness,
      environment: useCase.environment,
      requiredCapabilities: useCase.requiredCapabilities,
      primaryIndustry: useCase.primaryIndustry,
      industryTags: useCase.industryTags,
      taskTags: useCase.taskTags,
      atAGlance: useCase.atAGlance,
      overview: useCase.overview,
      whyItMatters: useCase.whyItMatters,
      environmentRequirements: useCase.environmentRequirements,
      whyHardToday: useCase.whyHardToday,
      japanDeploymentConditions: useCase.japanDeploymentConditions,
      candidateRobots: useCase.candidateRobots.map((candidate) => ({
        robotId: relate(candidate.robotId),
        seriesId: relate(candidate.seriesId),
        fit: candidate.fit,
        basis: candidate.basis,
        reason: candidate.reason,
      })),
    });
  }

  for (const deployment of FIXTURE.deployments) {
    await create('deployments', deployment.id, {
      ...baseRecord(deployment),
      manufacturerId: relate(deployment.manufacturerId),
      robotId: relate(deployment.robotId),
      customer: deployment.customer,
      country: deployment.country,
      location: deployment.location,
      status: deployment.status,
      startedAt: deployment.startedAt,
      relatedUseCaseIds: deployment.relatedUseCaseIds?.map(relate),
    });
  }

  for (const article of FIXTURE.articles) {
    await create('articles', article.id, {
      ...baseRecord(article),
      title: article.title,
      category: article.category,
      type: article.type,
      section: article.section,
      publishedAt: article.publishedAt,
      whyItMatters: article.whyItMatters,
      relatedRobotIds: article.relatedRobotIds.map(relate),
      relatedManufacturerIds: article.relatedManufacturerIds.map(relate),
      relatedUseCaseIds: article.relatedUseCaseIds.map(relate),
      body: article.type === 'manufacturer-guide' ? undefined : article.body,
    });
  }

  for (const placement of FIXTURE.articlePlacements) {
    await create('article-placements', placement.id, {
      stableId: placement.id,
      slug: placement.id,
      surface: placement.surface,
      slot: placement.slot,
      articleId: relate(placement.articleId),
      order: placement.order,
      kind: placement.kind,
      ...payloadStatusFields(placement.publishStatus),
    });
  }

  for (const asset of FIXTURE.media) {
    await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { stableId: asset.id, alt: asset.alt, rights: asset.rights },
      file: { data: ONE_PX_PNG, mimetype: 'image/png', name: asset.filename, size: ONE_PX_PNG.byteLength },
    });
  }

  // 必須修正4（remediation group 2）: `site-settings` global もfixtureの一部としてseedする。
  // Payload sourceはもうローカル定数へfallbackしないので、seedしなければ
  // `site-settings-not-migrated` で落ちる（＝この seed が無いことが検出される）。
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    user,
    data: {
      dataAsOf: FIXTURE.siteSettings.dataAsOf,
      articleIndexPlacementLimits: { ...FIXTURE.articleIndexPlacementLimits },
    } as never,
    context: privilegedPublishContext({
      runId: 'repository-contract-fixture',
      actorId: String((user as { id?: string | number } | null)?.id ?? 'unknown'),
      reason: 'repository contract test fixture seed (site settings)',
    }),
  });
}

let resolvePayloadSource!: (payload: Payload) => void;
const payloadReady = new Promise<Payload>((resolve) => {
  resolvePayloadSource = resolve;
});

let payload: Payload;

beforeAll(async () => {
  assertLocalThrowawayDatabase('tests/content/repository.contract.test.ts');
  payload = await getPayload({ config });

  for (const collection of CONTENT_COLLECTIONS) {
    await payload.delete({ collection, where: {}, overrideAccess: true });
  }
  await payload.delete({ collection: 'content-route-registry', where: {}, overrideAccess: true });
  await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

  // 1人目のadminはbootstrapでplatform-adminへ強制される（Task 2）。publish gateは
  // publish遷移にcontent-publisher以上を要求するため、seedはこのuserとして行う。
  await payload.create({
    collection: 'admins',
    overrideAccess: false,
    data: { email: OWNER_EMAIL, password: PASSWORD, role: 'content-reader' },
  });
  const { user: owner } = await payload.login({
    collection: 'admins',
    data: { email: OWNER_EMAIL, password: PASSWORD },
  });
  if (!owner) throw new Error('failed to log in as the fixture owner');

  await seedPayloadFixture(payload, owner);
  resolvePayloadSource(payload);
}, 120_000);

afterAll(async () => {
  await payload?.destroy();
});

describe('ContentRepository contract', () => {
  it('resolves stable IDs and previous slugs', async () => {
    const repository = createContentRepository(createLocalContentSource());
    const [robot] = await repository.listRobots({ limit: 1 });
    expect((await repository.getRobotById(robot.id))?.id).toBe(robot.id);
    expect((await repository.resolveRobotDetailBySlug(robot.slug)).record?.id)
      .toBe(robot.id);
  });

  it('does not expose readSnapshot to repository callers', () => {
    const repository = createContentRepository(createLocalContentSource());
    expect('readSnapshot' in repository).toBe(false);
  });

  /**
   * 必須修正4-4/4-5（remediation group 2）: 以前ここには「Payload sourceのfallback定数と
   * localの値が一致すること」を確かめるtestがあった。そのfallback自体が欠陥
   * （Payloadに値が無くてもparityが通ってしまう）だったので撤去し、代わりに
   * **local sourceがlocalの値を読むこと**だけを固定する。Payload側の値はPayloadが正本で、
   * 欠落時は `site-settings-not-migrated` で落ちる（`site-settings-migration.test.ts`）。
   */
  it('reads the local placement limits and dataAsOf from the local data source only', async () => {
    const local = createLocalContentSource();
    expect(await local.readArticleIndexPlacementLimits()).toEqual(localContentSnapshot.articleIndexPlacementLimits);
    expect(await local.readSiteSettings()).toEqual({ dataAsOf: siteMeta.dataAsOf });
  });
});

const SOURCE_CASES: Array<{ name: string; createSource: () => FullContentSource }> = [
  { name: 'local', createSource: () => createInMemoryContentSource(FIXTURE) },
  { name: 'payload', createSource: () => createPayloadContentSource({ payload: payloadReady }) },
];

describe.each(SOURCE_CASES)('ContentRepository contract against the $name source', ({ createSource }) => {
  const repository = createContentRepository(createSource());

  // ── robots ──────────────────────────────────────────────────────────────
  it('lists only published robots', async () => {
    const robots = await repository.listRobots();
    expect(robots.map((robot) => robot.id)).toEqual(['fx-robot-a', 'fx-robot-b']);
  });

  it('drops the four removed Robot fields on both sources', async () => {
    const robot = await repository.getRobotById('fx-robot-a');
    expect(robot).not.toBeNull();
    for (const removed of ['buyerReadiness', 'marketAvailability', 'safetyNote', 'vendorRiskNote']) {
      expect(Object.hasOwn(robot as object, removed)).toBe(false);
    }
  });

  it('maps publishStatus identically for published / archived / draft robots', async () => {
    expect((await repository.getRobotDetailById('fx-robot-a'))?.publishStatus).toBe('published');
    expect((await repository.getRobotDetailById('fx-robot-archived'))?.publishStatus).toBe('archived');
    // draft はどのサーフェスにも出さない（detail集合にも入らない）。
    expect(await repository.getRobotDetailById('fx-robot-draft')).toBeNull();
    expect(await repository.getRobotById('fx-robot-archived')).toBeNull();
  });

  it('resolves robot detail slugs, previous slugs, and archived records', async () => {
    expect((await repository.resolveRobotDetailBySlug('fx-robot-a')).record?.id).toBe('fx-robot-a');
    expect((await repository.resolveRobotDetailBySlug('fx-robot-a-old')).redirectTo).toBe('fx-robot-a');
    expect((await repository.resolveRobotDetailBySlug('fx-robot-archived')).record?.id).toBe('fx-robot-archived');
    expect(await repository.resolveRobotDetailBySlug('fx-robot-nonexistent')).toEqual({});
  });

  /**
   * task7-draft-mode-wiring-brief.md: Draft Mode配線の要——`resolveRobotDetailBySlug`
   * （通常経路）は`'draft'`を一切見せない一方、`resolveRobotDraftDetailBySlug`
   * （draft mode有効 + session検証済みの場合だけpageのuncached経路から呼ぶ）は見せる。
   * どちらもpublished/archivedの可視性は変えない。
   */
  it('resolves draft-only robots only through resolveRobotDraftDetailBySlug, never through the normal detail resolver', async () => {
    expect(await repository.resolveRobotDetailBySlug('fx-robot-draft')).toEqual({});

    expect((await repository.resolveRobotDraftDetailBySlug('fx-robot-draft')).record?.id).toBe('fx-robot-draft');
    // draft-aware経路もpublished/archivedはそのまま解決する（draftだけに限定されるわけではない）。
    expect((await repository.resolveRobotDraftDetailBySlug('fx-robot-a')).record?.id).toBe('fx-robot-a');
    expect((await repository.resolveRobotDraftDetailBySlug('fx-robot-archived')).record?.id).toBe('fx-robot-archived');
    expect((await repository.resolveRobotDraftDetailBySlug('fx-robot-a-old')).redirectTo).toBe('fx-robot-a');
    expect(await repository.resolveRobotDraftDetailBySlug('fx-robot-nonexistent')).toEqual({});
  });

  it('applies explicit limit / page / sort to robot lists', async () => {
    expect((await repository.listRobots({ limit: 1, page: 1, sort: 'name' })).map((robot) => robot.id)).toEqual([
      'fx-robot-a',
    ]);
    expect((await repository.listRobots({ limit: 1, page: 2, sort: 'name' })).map((robot) => robot.id)).toEqual([
      'fx-robot-b',
    ]);
    expect((await repository.listRobots({ sort: '-name' })).map((robot) => robot.id)).toEqual([
      'fx-robot-b',
      'fx-robot-a',
    ]);
  });

  it('filters robots by manufacturer and resolves related robots in the given order', async () => {
    expect((await repository.listRobotsByManufacturerId('fx-mfr-alpha')).map((robot) => robot.id)).toEqual([
      'fx-robot-a',
    ]);
    // 関連欄は archived を残し（設計 §6.5-1）、存在しないidは落とし、渡した順序を保つ。
    const related = await repository.listRelatedRobots(['fx-robot-archived', 'fx-robot-a', 'fx-robot-missing']);
    expect(related.map((robot) => robot.id)).toEqual(['fx-robot-archived', 'fx-robot-a']);
  });

  it('keeps relation ids as stable ids, not internal database ids', async () => {
    const robot = await repository.getRobotById('fx-robot-a');
    expect(robot?.manufacturerId).toBe('fx-mfr-alpha');
    expect(robot?.seriesId).toBe('fx-series-one');
    expect((await repository.getRobotDetailById('fx-robot-archived'))?.supersededById).toBe('fx-robot-a');
  });

  // ── robotSeries ─────────────────────────────────────────────────────────
  it('lists, gets, and slug-resolves robot series', async () => {
    expect((await repository.listRobotSeries()).map((series) => series.id)).toEqual(['fx-series-one']);
    expect((await repository.getRobotSeriesById('fx-series-one'))?.manufacturerId).toBe('fx-mfr-alpha');
    expect((await repository.resolveRobotSeriesBySlug('fx-series-one')).record?.id).toBe('fx-series-one');
    expect((await repository.resolveRobotSeriesBySlug('fx-series-one-old')).redirectTo).toBe('fx-series-one');
    expect((await repository.listRobotSeriesByManufacturerId('fx-mfr-alpha')).map((series) => series.id)).toEqual([
      'fx-series-one',
    ]);
  });

  it('resolves the shared /robots/[slug] namespace across robots and robot series', async () => {
    expect(await repository.resolveRobotNamespaceBySlug('fx-robot-a')).toMatchObject({ kind: 'robot' });
    expect(await repository.resolveRobotNamespaceBySlug('fx-series-one')).toMatchObject({ kind: 'robot-series' });
    expect(await repository.resolveRobotNamespaceBySlug('fx-robot-a-old')).toMatchObject({
      kind: 'redirect',
      redirectTo: 'fx-robot-a',
      target: 'robot',
    });
    expect(await repository.resolveRobotNamespaceBySlug('fx-series-one-old')).toMatchObject({
      kind: 'redirect',
      redirectTo: 'fx-series-one',
      target: 'robot-series',
    });
    expect(await repository.resolveRobotNamespaceBySlug('fx-nothing')).toEqual({ kind: 'not-found' });
  });

  it('resolves the shared /robots/[slug] namespace for draft-only robots only through resolveRobotNamespaceDraftBySlug', async () => {
    expect(await repository.resolveRobotNamespaceBySlug('fx-robot-draft')).toEqual({ kind: 'not-found' });
    expect(await repository.resolveRobotNamespaceDraftBySlug('fx-robot-draft')).toMatchObject({ kind: 'robot' });
    // published robots / series still resolve through the draft-aware namespace method.
    expect(await repository.resolveRobotNamespaceDraftBySlug('fx-robot-a')).toMatchObject({ kind: 'robot' });
    expect(await repository.resolveRobotNamespaceDraftBySlug('fx-series-one')).toMatchObject({ kind: 'robot-series' });
    expect(await repository.resolveRobotNamespaceDraftBySlug('fx-nothing')).toEqual({ kind: 'not-found' });
  });

  // ── manufacturers ───────────────────────────────────────────────────────
  it('lists published manufacturers and resolves slugs and related ids', async () => {
    expect((await repository.listManufacturers()).map((manufacturer) => manufacturer.id)).toEqual([
      'fx-mfr-alpha',
      'fx-mfr-beta',
    ]);
    expect(await repository.getManufacturerById('fx-mfr-draft')).toBeNull();
    expect((await repository.getManufacturerBySlug('fx-mfr-beta'))?.id).toBe('fx-mfr-beta');
    expect((await repository.resolveManufacturerDetailBySlug('fx-mfr-alpha-old')).redirectTo).toBe('fx-mfr-alpha');
    expect(
      (await repository.listRelatedManufacturers(['fx-mfr-beta', 'fx-mfr-alpha'])).map((manufacturer) => manufacturer.id),
    ).toEqual(['fx-mfr-beta', 'fx-mfr-alpha']);
  });

  it('resolves a draft-only manufacturer only through resolveManufacturerDraftDetailBySlug', async () => {
    expect(await repository.resolveManufacturerDetailBySlug('fx-mfr-draft')).toEqual({});
    expect((await repository.resolveManufacturerDraftDetailBySlug('fx-mfr-draft')).record?.id).toBe('fx-mfr-draft');
    expect((await repository.resolveManufacturerDraftDetailBySlug('fx-mfr-alpha')).record?.id).toBe('fx-mfr-alpha');
    expect(await repository.resolveManufacturerDraftDetailBySlug('fx-mfr-nonexistent')).toEqual({});
  });

  // ── distributors ────────────────────────────────────────────────────────
  it('lists distributors and filters them by handled manufacturer and robot', async () => {
    expect((await repository.listDistributors()).map((distributor) => distributor.id)).toEqual(['fx-dist-one']);
    expect((await repository.getDistributorById('fx-dist-one'))?.handledManufacturerIds).toEqual(['fx-mfr-alpha']);
    expect((await repository.resolveDistributorDetailBySlug('fx-dist-one-old')).redirectTo).toBe('fx-dist-one');
    expect((await repository.listDistributorsForManufacturerId('fx-mfr-alpha')).map((d) => d.id)).toEqual([
      'fx-dist-one',
    ]);
    expect((await repository.listDistributorsForRobotId('fx-robot-a')).map((d) => d.id)).toEqual(['fx-dist-one']);
    expect(await repository.listDistributorsForManufacturerId('fx-mfr-beta')).toEqual([]);
  });

  // ── useCases ────────────────────────────────────────────────────────────
  it('lists use cases and filters by candidate robot and series', async () => {
    expect((await repository.listUseCases()).map((useCase) => useCase.id)).toEqual([
      'fx-usecase-one',
      'fx-usecase-two',
    ]);
    expect((await repository.listUseCasesForRobotId('fx-robot-a')).map((useCase) => useCase.id)).toEqual([
      'fx-usecase-one',
    ]);
    expect((await repository.listUseCasesForSeriesId('fx-series-one')).map((useCase) => useCase.id)).toEqual([
      'fx-usecase-one',
    ]);
    expect((await repository.listUseCasesForRobotId('fx-robot-b'))).toEqual([]);
    expect((await repository.resolveUseCaseDetailBySlug('fx-usecase-one-old')).redirectTo).toBe('fx-usecase-one');
    expect((await repository.listRelatedUseCases(['fx-usecase-two', 'fx-usecase-one'])).map((u) => u.id)).toEqual([
      'fx-usecase-two',
      'fx-usecase-one',
    ]);
  });

  it('resolves a draft-only use case only through resolveUseCaseDraftDetailBySlug', async () => {
    expect(await repository.resolveUseCaseDetailBySlug('fx-usecase-draft')).toEqual({});
    expect((await repository.resolveUseCaseDraftDetailBySlug('fx-usecase-draft')).record?.id).toBe(
      'fx-usecase-draft',
    );
    expect((await repository.resolveUseCaseDraftDetailBySlug('fx-usecase-one')).record?.id).toBe('fx-usecase-one');
    expect(await repository.resolveUseCaseDraftDetailBySlug('fx-usecase-nonexistent')).toEqual({});
  });

  it('keeps candidateRobots evidence semantics (robotId / seriesId are stable ids)', async () => {
    const useCase = await repository.getUseCaseById('fx-usecase-one');
    expect(useCase?.candidateRobots.map((candidate) => [candidate.robotId, candidate.seriesId, candidate.fit])).toEqual([
      ['fx-robot-a', undefined, 'strong'],
      [undefined, 'fx-series-one', 'possible'],
    ]);
  });

  // ── deployments ─────────────────────────────────────────────────────────
  it('lists deployments and filters by manufacturer, robot, and use case', async () => {
    expect((await repository.listDeployments()).map((deployment) => deployment.id)).toEqual(['fx-deploy-one']);
    expect((await repository.listDeploymentsForManufacturerId('fx-mfr-alpha')).map((d) => d.id)).toEqual([
      'fx-deploy-one',
    ]);
    expect((await repository.listDeploymentsForRobotId('fx-robot-a')).map((d) => d.id)).toEqual(['fx-deploy-one']);
    expect((await repository.listDeploymentsForUseCaseId('fx-usecase-one')).map((d) => d.id)).toEqual([
      'fx-deploy-one',
    ]);
    expect(await repository.listDeploymentsForUseCaseId('fx-usecase-two')).toEqual([]);
    expect((await repository.getDeploymentById('fx-deploy-one'))?.relatedUseCaseIds).toEqual(['fx-usecase-one']);
  });

  // ── articles ────────────────────────────────────────────────────────────
  it('lists published articles newest first and resolves slugs and relations', async () => {
    expect((await repository.listArticles()).map((article) => article.id)).toEqual([
      'fx-article-new',
      'fx-article-old',
    ]);
    expect(await repository.getArticleById('fx-article-draft')).toBeNull();
    expect((await repository.resolveArticleDetailBySlug('fx-article-new-old')).redirectTo).toBe('fx-article-new');
    expect((await repository.listArticlesForRobotId('fx-robot-a')).map((article) => article.id)).toEqual([
      'fx-article-new',
    ]);
    expect((await repository.listArticlesForManufacturerId('fx-mfr-beta')).map((article) => article.id)).toEqual([
      'fx-article-old',
    ]);
    expect((await repository.listArticlesForUseCaseId('fx-usecase-one')).map((article) => article.id)).toEqual([
      'fx-article-new',
    ]);
  });

  it('resolves a draft-only article only through resolveArticleDraftDetailBySlug', async () => {
    expect(await repository.resolveArticleDetailBySlug('fx-article-draft')).toEqual({});
    expect((await repository.resolveArticleDraftDetailBySlug('fx-article-draft')).record?.id).toBe(
      'fx-article-draft',
    );
    expect((await repository.resolveArticleDraftDetailBySlug('fx-article-new')).record?.id).toBe('fx-article-new');
    expect(await repository.resolveArticleDraftDetailBySlug('fx-article-nonexistent')).toEqual({});
  });

  // ── articlePlacements ───────────────────────────────────────────────────
  it('lists article placements by surface and slot, ordered by order', async () => {
    expect((await repository.listArticlePlacements()).map((placement) => placement.id)).toEqual([
      'reports-index:hero:fx-article-new',
      'reports-index:feature:fx-article-old',
    ]);
    expect(
      (await repository.listArticlePlacements({ surface: 'reports-index', slot: 'hero' })).map(
        (placement) => placement.articleId,
      ),
    ).toEqual(['fx-article-new']);
    expect((await repository.getArticlePlacementById('reports-index:feature:fx-article-old'))?.order).toBe(10);
    expect(await repository.getArticleIndexPlacementLimits()).toEqual(FIXTURE.articleIndexPlacementLimits);
  });

  // ── media / siteSettings ────────────────────────────────────────────────
  it('lists media with rights metadata and reads site settings', async () => {
    const media = await repository.listMedia();
    expect(media.map((asset) => asset.id)).toEqual(['fx-media-one']);
    expect(media[0]?.alt).toBe('Fixture pixel');
    expect(media[0]?.rights.status).toBe('own');
    expect((await repository.getMediaById('fx-media-one'))?.filename).toContain('fx-media-one');
    expect((await repository.getSiteSettings()).dataAsOf).toBe(FIXTURE.siteSettings.dataAsOf);
  });

  // ── snapshot（管理処理専用） ─────────────────────────────────────────────
  it('exposes a full snapshot through the snapshot source only', async () => {
    const snapshot = await createSource().readSnapshot();
    expect(snapshot.robots.map((robot) => robot.id).sort()).toEqual([
      'fx-robot-a',
      'fx-robot-archived',
      'fx-robot-b',
      'fx-robot-draft',
    ]);
    expect(snapshot.manufacturers).toHaveLength(3);
    expect(snapshot.robotSeries).toHaveLength(1);
    expect(snapshot.distributors).toHaveLength(1);
    expect(snapshot.useCases).toHaveLength(3);
    expect(snapshot.deployments).toHaveLength(1);
    expect(snapshot.articles).toHaveLength(3);
    expect(snapshot.articlePlacements).toHaveLength(2);
    expect(snapshot.media).toHaveLength(1);
    expect(snapshot.articleIndexPlacementLimits).toEqual(FIXTURE.articleIndexPlacementLimits);
    expect(snapshot.siteSettings.dataAsOf).toBe(FIXTURE.siteSettings.dataAsOf);
  });
});

/**
 * task7-draft-mode-wiring-brief.md 検証項目: 「既存publishedへの未承認draft更新」
 * （brief必須修正1で明記された2つのdraftシナリオのうち、まだcoverしていなかった方）。
 *
 * Payloadのdraft機構では、公開中documentへ`draft: true`のupdateを保存しても main table row
 * （通常のfindが見る場所）は書き換わらず、新しいdraft versionは`_versions`テーブルにだけ
 * 追加される（`lib/payload/access.ts`の`isDraftSave`コメント、`payloadSource.ts`の
 * `PayloadFindArgs.draft`コメント参照）。このシナリオは「一度もpublishされていない新規
 * document」（`fx-robot-draft`等、`describe.each(SOURCE_CASES)`内でcover済み）とは別物で、
 * `draft: true`を渡さない通常の`where`句だけでは検出できない——実際にPayloadへ
 * `payload.update({..., draft: true})`を発行して確かめない限り、テストとして無意味になる
 * （fixtureのJSON定義だけでは再現できない）。
 *
 * localには「公開中documentの上に積まれた未承認draft」というversionの概念自体が無いため、
 * このシナリオはPayload sourceでのみ意味を持つ（`describe.each(SOURCE_CASES)`には含めない）。
 */
describe('draft-aware resolution over a pending (unapproved) draft update on top of a published document (Payload only)', () => {
  const PUBLISHED_NAME = 'Alpha One'; // FIXTURE.robots[0]（fx-robot-a）のpublished名。
  const PENDING_DRAFT_NAME = 'Pending Draft Name (unapproved)';
  let internalRobotId: string | number;

  beforeAll(async () => {
    const { docs } = await payload.find({
      collection: 'robots',
      where: { stableId: { equals: 'fx-robot-a' } },
      overrideAccess: true,
      limit: 1,
      depth: 0,
    });
    const doc = docs[0] as { id: string | number } | undefined;
    if (!doc) throw new Error('fx-robot-a fixture not found — did seedPayloadFixture run in the outer beforeAll?');
    internalRobotId = doc.id;

    // `draft: true`かつ`_status: 'published'`を送らない = isDraftSave。publish gate
    // （`createPublishGateHook`）はcontent-publisher以上のroleもapproval contextも要求しない
    // ——通常のdraft-writerによるdraft保存と同じ形（`lib/payload/access.ts`参照）。
    await payload.update({
      collection: 'robots',
      id: internalRobotId,
      draft: true,
      overrideAccess: true,
      data: { name: PENDING_DRAFT_NAME },
    });
  });

  it('keeps the normal (non-draft) detail resolver showing the published content, unaffected by the pending draft', async () => {
    const repository = createContentRepository(createPayloadContentSource({ payload: payloadReady }));
    const resolved = await repository.resolveRobotDetailBySlug('fx-robot-a');
    expect(resolved.record?.name).toBe(PUBLISHED_NAME);
    expect(resolved.record?.name).not.toBe(PENDING_DRAFT_NAME);
  });

  it('shows the pending draft content only through resolveRobotDraftDetailBySlug', async () => {
    const repository = createContentRepository(createPayloadContentSource({ payload: payloadReady }));
    const resolved = await repository.resolveRobotDraftDetailBySlug('fx-robot-a');
    expect(resolved.record?.name).toBe(PENDING_DRAFT_NAME);
  });

  it('does not leak the pending draft into getRobotById / getRobotDetailById (published/detail-only accessors)', async () => {
    const repository = createContentRepository(createPayloadContentSource({ payload: payloadReady }));
    expect((await repository.getRobotById('fx-robot-a'))?.name).toBe(PUBLISHED_NAME);
    expect((await repository.getRobotDetailById('fx-robot-a'))?.name).toBe(PUBLISHED_NAME);
  });

  it('does not leak the pending draft into resolveRobotNamespaceBySlug (non-draft namespace resolver)', async () => {
    const repository = createContentRepository(createPayloadContentSource({ payload: payloadReady }));
    const resolved = await repository.resolveRobotNamespaceBySlug('fx-robot-a');
    expect(resolved).toMatchObject({ kind: 'robot' });
    if (resolved.kind === 'robot') expect(resolved.robot.name).toBe(PUBLISHED_NAME);
  });

  it('shows the pending draft through resolveRobotNamespaceDraftBySlug', async () => {
    const repository = createContentRepository(createPayloadContentSource({ payload: payloadReady }));
    const resolved = await repository.resolveRobotNamespaceDraftBySlug('fx-robot-a');
    expect(resolved).toMatchObject({ kind: 'robot' });
    if (resolved.kind === 'robot') expect(resolved.robot.name).toBe(PENDING_DRAFT_NAME);
  });
});

describe('listAllPublishedRobots() safety pagination-walk (Task 6 Step 2)', () => {
  // `RUNTIME_PAGE_SIZE` / `LIST_ALL_PAGE_SIZE` は両方とも100。テストはそれに合わせて組む。
  function makeRobot(id: string, manufacturerId: string): ContentSnapshot['robots'][number] {
    return {
      id,
      slug: id,
      summary: `${id} fixture.`,
      publishStatus: 'published',
      updatedAt: '2026-01-01',
      reliability: 'official',
      sources: SOURCES,
      name: id,
      manufacturerId,
      category: 'humanoid',
      description: `${id} description.`,
      deploymentStage: 'pilot',
      specs: {},
      procurementModels: ['inquiry'],
      japanAvailability: 'inquiry-required',
      comparison: { strengths: [], constraints: [], bestFit: [], notFit: [] },
    };
  }

  function makeManufacturer(id: string): ContentSnapshot['manufacturers'][number] {
    return {
      id,
      slug: id,
      summary: `${id} fixture.`,
      publishStatus: 'published',
      updatedAt: '2026-01-01',
      reliability: 'official',
      sources: SOURCES,
      name: id,
      companyType: 'manufacturer',
      companyStatus: 'active',
      country: 'Japan',
      website: `https://example.com/${id}`,
      description: `${id} description.`,
      japanPresence: 'office',
    };
  }

  function snapshotWithRobots(count: number): ContentSnapshot {
    const manufacturer = makeManufacturer('fx-listall-mfr');
    const robots = Array.from({ length: count }, (_, i) =>
      makeRobot(`fx-listall-robot-${String(i).padStart(4, '0')}`, manufacturer.id),
    );
    return { ...FIXTURE, manufacturers: [manufacturer], robots, robotSeries: [], distributors: [] };
  }

  it.each([101, 188])(
    'returns all %d published robots from the local source with displayed count === totalDocs',
    async (count) => {
      const source = createInMemoryContentSource(snapshotWithRobots(count));
      const repository = createContentRepository(source);
      const all = await repository.listAllPublishedRobots();
      expect(all).toHaveLength(count);
      expect(new Set(all.map((robot) => robot.id)).size).toBe(count);
      const page = await source.listRobotsPage({ sort: 'id', publishStatuses: ['published'], page: 1, limit: 1 });
      expect(all.length).toBe(page.totalDocs);
    },
  );

  it('returns all published robots from the Payload source (end-to-end wiring)', async () => {
    const repository = createContentRepository(createPayloadContentSource({ payload: payloadReady }));
    const all = await repository.listAllPublishedRobots();
    // FIXTUREのpublished robotsは fx-robot-a / fx-robot-b の2件（archived/draftは含まれない）。
    expect(all.map((robot) => robot.id).sort()).toEqual(['fx-robot-a', 'fx-robot-b']);
  });

  /**
   * ここから下は、実DB側で「読み取り中にtotalDocsが変わる」「pageをまたいで重複idが出る」を
   * 再現するのが難しい（正確なタイミング制御が要る）ため、`ContentSource` を最小限だけ実装した
   * fakeで安全条件そのものを固定する。repository層のロジックだけを対象にした単体テスト。
   */
  function fakeRobotsSource(pages: readonly { docs: Array<{ id: string }>; totalDocs: number }[]): ContentSource {
    let call = 0;
    return {
      listRobotsPage: async () => {
        const page = pages[Math.min(call, pages.length - 1)];
        call += 1;
        return page as never;
      },
    } as unknown as ContentSource;
  }

  const robotDocs = (ids: string[]) => ids.map((id) => ({ id }));

  it('retries once when totalDocs drifts mid-read, then succeeds if it settles', async () => {
    const page1 = { docs: robotDocs(Array.from({ length: 100 }, (_, i) => `r${i}`)), totalDocs: 150 };
    const page2Drift = { docs: robotDocs(Array.from({ length: 50 }, (_, i) => `r${100 + i}`)), totalDocs: 160 };
    const retryPage1 = { docs: robotDocs(Array.from({ length: 100 }, (_, i) => `r${i}`)), totalDocs: 160 };
    const retryPage2 = { docs: robotDocs(Array.from({ length: 60 }, (_, i) => `r${100 + i}`)), totalDocs: 160 };
    const repository = createContentRepository(fakeRobotsSource([page1, page2Drift, retryPage1, retryPage2]));
    const all = await repository.listAllPublishedRobots();
    expect(all).toHaveLength(160);
  });

  it('fails with unstable-pagination when totalDocs keeps drifting after 1 retry', async () => {
    const page1 = { docs: robotDocs(Array.from({ length: 100 }, (_, i) => `r${i}`)), totalDocs: 150 };
    const page2DriftA = { docs: robotDocs(Array.from({ length: 50 }, (_, i) => `r${100 + i}`)), totalDocs: 160 };
    const retryPage1 = { docs: robotDocs(Array.from({ length: 100 }, (_, i) => `r${i}`)), totalDocs: 170 };
    const page2DriftB = { docs: robotDocs(Array.from({ length: 70 }, (_, i) => `r${100 + i}`)), totalDocs: 180 };
    const repository = createContentRepository(
      fakeRobotsSource([page1, page2DriftA, retryPage1, page2DriftB]),
    );
    await expect(repository.listAllPublishedRobots()).rejects.toThrow('unstable-pagination');
  });

  it('rejects a duplicate stable id seen across a page boundary', async () => {
    const page1 = { docs: robotDocs(Array.from({ length: 100 }, (_, i) => `r${i}`)), totalDocs: 101 };
    // page境界で同じidが再度出現するケース（sort不安定・並び替え中の再取得などを想定）。
    const page2 = { docs: robotDocs(['r99']), totalDocs: 101 };
    const repository = createContentRepository(fakeRobotsSource([page1, page2]));
    await expect(repository.listAllPublishedRobots()).rejects.toThrow('list-all-duplicate-id');
  });

  it('refuses a partial result when the fetched count never reaches totalDocs', async () => {
    const page1 = { docs: robotDocs(Array.from({ length: 100 }, (_, i) => `r${i}`)), totalDocs: 101 };
    // 2ページ目が totalDocs 通りの1件を返さず、totalDocsは変わらないまま収集が止まる。
    const page2 = { docs: [] as Array<{ id: string }>, totalDocs: 101 };
    const repository = createContentRepository(fakeRobotsSource([page1, page2]));
    await expect(repository.listAllPublishedRobots()).rejects.toThrow('list-all-incomplete');
  });

  it('fails fast with list-all-safety-limit-exceeded instead of silently truncating past 500', async () => {
    const page1 = { docs: robotDocs(Array.from({ length: 100 }, (_, i) => `r${i}`)), totalDocs: 501 };
    const repository = createContentRepository(fakeRobotsSource([page1]));
    await expect(repository.listAllPublishedRobots()).rejects.toThrow('list-all-safety-limit-exceeded');
  });
});

describe('local and Payload sources agree on the same fixture', () => {
  /**
   * **Task 4で申し送った既知の差異は、Task 5のschema変更で解消済み**。
   *
   * 当初、local `data/*.ts` の `publishedAt` / `checkedAt` / `nextReviewBy` は日付のみの文字列
   * （`ISODate`、例 `2026-02-01`）なのに、Payloadの `type: 'date'` field はPostgres `timestamptz`
   * として保存しISO instantで返していた。書き込み側のprocess timezoneでその日の0時と解釈される
   * ため、**import時とserve時のtimezoneが違うと暦日がずれる**（import: 開発者のJSTマシン /
   * serve: VercelのUTC → `2026-02-01` が `2026-01-31T15:00:00.000Z` になり、UTCで読むと1月31日）。
   * Task 4はこれを正規化して比較で回避し、恒久対応を「schema側でdate-onlyのeditorial fieldを
   * `text` にする」としてTask 5へ申し送っていた。
   *
   * Task 5で実際にその変更を入れた（`lib/payload/access.ts` の `sourcesField()` /
   * `rightsMetaField()` / `nextReviewBy`、`collections/Articles.ts` の `publishedAt`、
   * `collections/Manufacturers.ts` / `collections/Media.ts` の `checkedAt`。migration
   * `20260812_080919_date_only_content_fields_to_text`）。したがって今は**正規化なしで
   * 生の文字列がそのまま一致する**。この testはその回帰ガードで、`date` へ戻すと落ちる。
   */
  it('keeps date-only editorial fields byte-identical across both sources', async () => {
    const [payloadArticle] = await createPayloadContentSource({ payload: payloadReady }).listArticles({
      ids: ['fx-article-new'],
      sort: 'id',
      publishStatuses: ['published'],
    });
    const [localArticle] = await createInMemoryContentSource(FIXTURE).listArticles({
      ids: ['fx-article-new'],
      sort: 'id',
      publishStatuses: ['published'],
    });
    expect(localArticle.publishedAt).toBe('2026-02-01');
    expect(payloadArticle.publishedAt).toBe('2026-02-01');
    expect(payloadArticle.sources[0]?.checkedAt).toBe(localArticle.sources[0]?.checkedAt);
  });

  it('produces the same robots (ids, publishStatus, relations, removed fields)', async () => {
    const project = async (source: FullContentSource) =>
      (await source.readSnapshot()).robots
        .map((robot) => ({
          id: robot.id,
          slug: robot.slug,
          previousSlugs: robot.previousSlugs ?? undefined,
          publishStatus: robot.publishStatus,
          manufacturerId: robot.manufacturerId,
          seriesId: robot.seriesId,
          supersededById: robot.supersededById,
          removedFields: ['buyerReadiness', 'marketAvailability', 'safetyNote', 'vendorRiskNote'].filter((field) =>
            Object.hasOwn(robot, field),
          ),
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

    const [local, fromPayload] = await Promise.all([
      project(createInMemoryContentSource(FIXTURE)),
      project(createPayloadContentSource({ payload: payloadReady })),
    ]);
    expect(fromPayload).toEqual(local);
  });

  it('produces the same articles (order, publishStatus, relations, published date)', async () => {
    const project = async (source: FullContentSource) => {
      const repository = createContentRepository(source);
      return (await repository.listArticles()).map((article) => ({
        id: article.id,
        publishStatus: article.publishStatus,
        // Task 5 で `publishedAt` を `text` にしたため、正規化なしの生の値で比較できる。
        publishedAt: article.publishedAt,
        relatedRobotIds: article.relatedRobotIds,
        relatedManufacturerIds: article.relatedManufacturerIds,
        relatedUseCaseIds: article.relatedUseCaseIds,
      }));
    };

    const [local, fromPayload] = await Promise.all([
      project(createInMemoryContentSource(FIXTURE)),
      project(createPayloadContentSource({ payload: payloadReady })),
    ]);
    expect(fromPayload).toEqual(local);
  });
});

describe('getContentRepository source selection', () => {
  const withEnv = async (env: Record<string, string | undefined>, run: () => Promise<void>) => {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) vi.stubEnv(key, '');
      else vi.stubEnv(key, value);
    }
    // `vi.stubEnv(key, '')` は空文字を入れるため、未設定を再現するには delete が要る。
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
    }
    try {
      await run();
    } finally {
      vi.unstubAllEnvs();
    }
  };

  it('fails when CONTENT_SOURCE is unset', async () => {
    await withEnv({ CONTENT_SOURCE: undefined, VERCEL_ENV: undefined }, async () => {
      await expect(getContentRepository()).rejects.toThrow('CONTENT_SOURCE must be local or payload');
    });
  });

  it('fails on an unknown CONTENT_SOURCE instead of falling back to local', async () => {
    await withEnv({ CONTENT_SOURCE: 'Local', VERCEL_ENV: undefined }, async () => {
      await expect(getContentRepository()).rejects.toThrow('CONTENT_SOURCE must be local or payload; received Local');
    });
  });

  it('fails for production + local without the rollback flag', async () => {
    await withEnv(
      { CONTENT_SOURCE: 'local', VERCEL_ENV: 'production', ALLOW_LOCAL_CONTENT_ROLLBACK: undefined },
      async () => {
        await expect(getContentRepository()).rejects.toThrow(
          'local content is disabled in production outside the approved rollback window',
        );
      },
    );
  });

  it('allows production + local only during the approved rollback window', async () => {
    await withEnv(
      { CONTENT_SOURCE: 'local', VERCEL_ENV: 'production', ALLOW_LOCAL_CONTENT_ROLLBACK: 'true' },
      async () => {
        const repository = await getContentRepository();
        expect((await repository.listRobots({ limit: 1 })).length).toBe(1);
      },
    );
  });

  it('returns a repository for each valid source name', async () => {
    await withEnv({ CONTENT_SOURCE: 'local', VERCEL_ENV: 'preview' }, async () => {
      expect(typeof (await getContentRepository()).listRobots).toBe('function');
    });
    await withEnv({ CONTENT_SOURCE: 'payload', VERCEL_ENV: 'preview' }, async () => {
      expect(typeof (await getContentRepository()).listRobots).toBe('function');
    });
  });
});
