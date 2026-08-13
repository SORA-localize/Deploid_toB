import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS, type ContentSnapshot, type FullContentSource } from '@/lib/content/contracts';
import { createContentRepository } from '@/lib/content/createContentRepository';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { createInMemoryContentSource, createLocalContentSource } from '@/lib/content/localSource';
import { createPayloadContentSource } from '@/lib/content/payloadSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
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
  articleIndexPlacementLimits: { ...DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS },
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
  siteSettings: { dataAsOf: siteMeta.dataAsOf },
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

  it('keeps the Payload fallback placement limits in sync with the local data source', async () => {
    // Payload側の `SiteSettings` global はまだ `articleIndexPlacementLimits` fieldを持たず、
    // `DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS` へfallbackする。片方だけ書き換えられたら落とす。
    expect(DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS).toEqual(localContentSnapshot.articleIndexPlacementLimits);
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
    expect(await repository.getArticleIndexPlacementLimits()).toEqual(DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS);
  });

  // ── media / siteSettings ────────────────────────────────────────────────
  it('lists media with rights metadata and reads site settings', async () => {
    const media = await repository.listMedia();
    expect(media.map((asset) => asset.id)).toEqual(['fx-media-one']);
    expect(media[0]?.alt).toBe('Fixture pixel');
    expect(media[0]?.rights.status).toBe('own');
    expect((await repository.getMediaById('fx-media-one'))?.filename).toContain('fx-media-one');
    expect((await repository.getSiteSettings()).dataAsOf).toBe(siteMeta.dataAsOf);
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
    expect(snapshot.useCases).toHaveLength(2);
    expect(snapshot.deployments).toHaveLength(1);
    expect(snapshot.articles).toHaveLength(3);
    expect(snapshot.articlePlacements).toHaveLength(2);
    expect(snapshot.media).toHaveLength(1);
    expect(snapshot.articleIndexPlacementLimits).toEqual(DEFAULT_ARTICLE_INDEX_PLACEMENT_LIMITS);
    expect(snapshot.siteSettings.dataAsOf).toBe(siteMeta.dataAsOf);
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
