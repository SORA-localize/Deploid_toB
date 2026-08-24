/**
 * `ContentSnapshot` の**厳密な runtime schema 検証**
 * （remediation group 2 / 必須修正6-4・6-5）。
 *
 * 監査の指摘: `content:restore` は
 * `JSON.parse(await readFile(inputPath, 'utf8')) as ContentSnapshot` という **bare type cast**
 * だけで受け取っていた。`as` はコンパイル時に消えるので、実行時には**どんな JSON でも**
 * `ContentSnapshot` として通る。壊れた・改ざんされた・別環境向けのファイルが、そのまま
 * managed DB への upsert 入力になっていた。
 *
 * ここは「型が合っていそうならOK」ではなく、**restore の入力として安全か**を判定する層なので、
 * 次を全部拒否する（必須修正6-5）:
 *
 * - unknown field（typoや後方互換のつもりの余計なkeyを黙って捨てない）
 * - 欠落field
 * - 不正enum（`publishStatus` / `reliability` / rights status / category など全union）
 * - 不正日付（`checkedAt` / `publishedAt` / `nextReviewBy` / `startedAt` / `updatedAt`）
 * - 不正collection（top levelのkeyが `ContentSnapshot` の定義と違う）
 * - collection内のduplicate stable ID
 *
 * **unknown field を許さない**のが特に重要。許すと、攻撃者が既知fieldを正規の値のままにして
 * 未知fieldを足した artifact を作れる。importerが将来そのfield名を使い始めた瞬間、
 * 検証を通り抜けた値が書き込まれる。
 */
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import { isSpecKey } from '../lib/specSchema.ts';
import { isRegisteredTag } from '../lib/tagRegistry.ts';

export interface SchemaProblem {
  path: string;
  detail: string;
}

type Check = (value: unknown, path: string, problems: SchemaProblem[]) => void;

interface Field {
  check: Check;
  optional?: true;
}

const req = (check: Check): Field => ({ check });
const opt = (check: Check): Field => ({ check, optional: true });

const fail = (problems: SchemaProblem[], path: string, detail: string) => {
  problems.push({ path, detail });
};

// ─── primitive checks ─────────────────────────────────────────────────────

const text: Check = (value, path, problems) => {
  if (typeof value !== 'string') fail(problems, path, `expected string, got ${describe(value)}`);
};

/** 空文字を許さない text（id / slug / url など「無い」と「空」を区別すべきもの）。 */
const nonEmptyText: Check = (value, path, problems) => {
  if (typeof value !== 'string') return fail(problems, path, `expected string, got ${describe(value)}`);
  if (value.length === 0) fail(problems, path, 'expected a non-empty string');
};

const finiteNumber: Check = (value, path, problems) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(problems, path, `expected a finite number, got ${describe(value)}`);
  }
};

const integer: Check = (value, path, problems) => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    fail(problems, path, `expected an integer, got ${describe(value)}`);
  }
};

const boolean: Check = (value, path, problems) => {
  if (typeof value !== 'boolean') fail(problems, path, `expected boolean, got ${describe(value)}`);
};

/**
 * コンテンツ日付は日精度とは限らない（`'2025-05'` のような月精度、年精度もある。
 * migration `20260812_080919_date_only_content_fields_to_text` の理由そのもの）。
 * よって `YYYY` / `YYYY-MM` / `YYYY-MM-DD` を許し、**暦として存在する日付か**まで見る
 * （`2026-02-31` や `2026-13-01` を通さない）。
 */
const DATE_ONLY = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/;

const contentDate: Check = (value, path, problems) => {
  if (typeof value !== 'string') return fail(problems, path, `expected a date string, got ${describe(value)}`);
  const match = DATE_ONLY.exec(value);
  if (!match) return fail(problems, path, `expected YYYY, YYYY-MM or YYYY-MM-DD, got "${value}"`);
  const [, year, month, day] = match;
  if (month !== undefined) {
    const monthNumber = Number(month);
    if (monthNumber < 1 || monthNumber > 12) return fail(problems, path, `month out of range in "${value}"`);
    if (day !== undefined) {
      const date = new Date(Date.UTC(Number(year), monthNumber - 1, Number(day)));
      if (date.getUTCMonth() !== monthNumber - 1 || date.getUTCDate() !== Number(day)) {
        fail(problems, path, `not a real calendar date: "${value}"`);
      }
    }
  }
};

/** `updatedAt` は日付のみ・ISO instant のどちらも実データに存在するため両方許す。 */
const timestamp: Check = (value, path, problems) => {
  if (typeof value !== 'string') return fail(problems, path, `expected a timestamp string, got ${describe(value)}`);
  if (DATE_ONLY.test(value)) return contentDate(value, path, problems);
  if (Number.isNaN(Date.parse(value))) fail(problems, path, `not a parseable timestamp: "${value}"`);
};

const url: Check = (value, path, problems) => {
  if (typeof value !== 'string') return fail(problems, path, `expected a URL string, got ${describe(value)}`);
  if (value.length === 0) return fail(problems, path, 'expected a non-empty URL');
  // `/images/...` のような site-relative も実データに存在する。絶対URLならparseできることまで見る。
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    try {
      new URL(value);
    } catch {
      fail(problems, path, `not a parseable URL: "${value}"`);
    }
  }
};

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

// ─── combinators ──────────────────────────────────────────────────────────

function enumOf(values: readonly string[]): Check {
  return (value, path, problems) => {
    if (typeof value !== 'string' || !values.includes(value)) {
      fail(problems, path, `expected one of ${values.join(' | ')}, got ${JSON.stringify(value)}`);
    }
  };
}

function arrayOf(item: Check): Check {
  return (value, path, problems) => {
    if (!Array.isArray(value)) return fail(problems, path, `expected array, got ${describe(value)}`);
    value.forEach((entry, index) => item(entry, `${path}[${index}]`, problems));
  };
}

/** unknown key を**必ず**拒否する object 検証（必須修正6-5）。 */
function object(fields: Record<string, Field>): Check {
  return (value, path, problems) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return fail(problems, path, `expected object, got ${describe(value)}`);
    }
    const row = value as Record<string, unknown>;

    for (const key of Object.keys(row)) {
      if (!(key in fields)) fail(problems, `${path}.${key}`, 'unknown field is not allowed');
    }
    for (const [key, field] of Object.entries(fields)) {
      const entry = row[key];
      // `null` は**任意fieldに限り**「値なし」として扱う。
      //
      // domain型（`lib/content/domainTypes.ts`）は任意fieldを `field?: T` と宣言していて
      // `null` を許さないが、Payload source の `readSnapshot()` は空の列を `null` で返すため、
      // **自分たちの正規 export**（`--source payload`）が実測で467個の `null` を含む。
      // ここで `null` を拒否すると、正規の署名済み baseline を restore できなくなる
      // （実際に end-to-end 実行して発覚）。parity 比較も `null` と欠落を同値として扱っており、
      // 「値が無い」という意味は一致している。
      // **必須fieldの `null` は拒否したまま**にする（そちらは本物の欠落なので）。
      if (entry === undefined || (entry === null && field.optional)) {
        if (entry === undefined && !field.optional) fail(problems, `${path}.${key}`, 'required field is missing');
        continue;
      }
      field.check(entry, `${path}.${key}`, problems);
    }
  };
}

/** key集合が固定された `Record`（`deploymentStatus` など）。 */
function recordOf(keys: readonly string[], valueCheck: Check, optionalKeys = false): Check {
  return object(
    Object.fromEntries(keys.map((key) => [key, optionalKeys ? opt(valueCheck) : req(valueCheck)])),
  );
}

/** key が述語を満たす任意集合の `Record`（`specs` / `fieldEvidence`）。 */
function openRecordOf(isValidKey: (key: string) => boolean, valueCheck: Check): Check {
  return (value, path, problems) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return fail(problems, path, `expected object, got ${describe(value)}`);
    }
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (!isValidKey(key)) {
        fail(problems, `${path}.${key}`, 'unknown key is not allowed');
        continue;
      }
      // `object()` と同じ扱い: この Record の要素はすべて任意なので `null` = 値なし。
      if (entry === undefined || entry === null) continue;
      valueCheck(entry, `${path}.${key}`, problems);
    }
  };
}

function tagOf(kind: 'industry' | 'task' | 'region' | 'theme'): Check {
  return (value, path, problems) => {
    if (typeof value !== 'string' || !isRegisteredTag(kind, value)) {
      fail(problems, path, `not a registered ${kind} tag: ${JSON.stringify(value)}`);
    }
  };
}

/** 判別unionを `type` field で分岐する。 */
function discriminated(key: string, variants: Record<string, Check>): Check {
  return (value, path, problems) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return fail(problems, path, `expected object, got ${describe(value)}`);
    }
    const discriminator = (value as Record<string, unknown>)[key];
    if (typeof discriminator !== 'string' || !(discriminator in variants)) {
      return fail(
        problems,
        `${path}.${key}`,
        `expected one of ${Object.keys(variants).join(' | ')}, got ${JSON.stringify(discriminator)}`,
      );
    }
    variants[discriminator](value, path, problems);
  };
}

// ─── domain shapes（`lib/content/domainTypes.ts` に1:1で対応させる） ─────────

const RELIABILITY = ['verified', 'official', 'reported', 'estimated'] as const;
const PUBLISH_STATUS = ['draft', 'published', 'archived'] as const;
const RIGHTS_STATUS = [
  'own',
  'licensed',
  'commercial-permitted',
  'reference-attributed',
  'permission-requested',
  'prototype-only',
  'blocked',
] as const;
const MEDIA_SOURCE_TYPE = [
  'own',
  'manufacturer-official',
  'partner-official',
  'press-release',
  'third-party',
  'unknown',
] as const;
const IMAGE_ROLES = ['hero', 'transparent', 'side', 'inOperation', 'scale', 'endEffector', 'mobility'] as const;

const source = object({
  title: req(nonEmptyText),
  url: req(url),
  publisher: opt(text),
  publishedAt: opt(contentDate),
  checkedAt: req(contentDate),
  reliability: req(enumOf(RELIABILITY)),
  note: opt(text),
});

const rightsMeta = object({
  status: req(enumOf(RIGHTS_STATUS)),
  sourceType: req(enumOf(MEDIA_SOURCE_TYPE)),
  checkedAt: req(contentDate),
  rightsHolder: opt(text),
  licenseUrl: opt(url),
  permissionNote: opt(text),
});

/**
 * 実 `data/*.ts` には **`src` が空文字の `ImageAsset`** が存在する（`robots[].images.*` に
 * 実測で複数件。画像枠だけ用意して実体が未確定のもの）。ここで空を拒否すると実データの
 * restore が構造的に不可能になるため、空は許し、**値があるときだけ**URLとして検証する。
 */
const urlOrEmpty: Check = (value, path, problems) => {
  if (value === '') return;
  url(value, path, problems);
};

const imageAsset = object({
  src: req(urlOrEmpty),
  alt: req(text),
  credit: opt(text),
  sourceUrl: opt(url),
  rights: req(rightsMeta),
  aspectRatio: opt(finiteNumber),
});

const imagesByRole = recordOf(IMAGE_ROLES, imageAsset, true);

const seo = object({
  metaTitle: opt(text),
  metaDescription: opt(text),
  noindex: opt(boolean),
});

/** `BaseRecord`。各collectionはこれに固有fieldを足す。 */
const baseRecordFields: Record<string, Field> = {
  id: req(nonEmptyText),
  slug: req(nonEmptyText),
  previousSlugs: opt(arrayOf(nonEmptyText)),
  summary: req(text),
  publishStatus: req(enumOf(PUBLISH_STATUS)),
  updatedAt: req(timestamp),
  reliability: req(enumOf(RELIABILITY)),
  sources: req(arrayOf(source)),
  nextReviewBy: opt(contentDate),
  heroImage: opt(imageAsset),
  seo: opt(seo),
};

const latLng = object({ lat: req(finiteNumber), lng: req(finiteNumber) });

const manufacturer = object({
  ...baseRecordFields,
  name: req(nonEmptyText),
  nameJa: opt(text),
  companyType: req(enumOf(['manufacturer', 'distributor', 'integrator', 'ai-os', 'research'])),
  companyStatus: req(enumOf(['active', 'stealth', 'acquired', 'inactive'])),
  country: req(nonEmptyText),
  hqCity: opt(text),
  headquarters: opt(latLng),
  foundedYear: opt(integer),
  website: req(url),
  logos: opt(object({ symbol: opt(imageAsset), wordmark: opt(imageAsset), combined: opt(imageAsset) })),
  contactUrl: opt(url),
  description: req(text),
  japanPresence: req(enumOf(['office', 'distributor', 'partner', 'remote', 'none', 'unknown'])),
  domesticDistributors: opt(
    arrayOf(
      object({
        name: req(nonEmptyText),
        website: opt(url),
        sourceUrl: opt(url),
        checkedAt: opt(contentDate),
        note: opt(text),
      }),
    ),
  ),
  distributorNote: opt(text),
  supportNote: opt(text),
  procurementNote: opt(text),
  vendorRiskNote: opt(text),
  featuredRank: opt(integer),
});

const distributor = object({
  ...baseRecordFields,
  name: req(nonEmptyText),
  nameJa: opt(text),
  website: opt(url),
  providerType: req(enumOf(['maker-direct', 'reseller', 'other'])),
  handledManufacturerIds: req(arrayOf(nonEmptyText)),
  handledRobotIds: opt(arrayOf(nonEmptyText)),
  acquisitionMethods: req(arrayOf(enumOf(['purchase', 'lease', 'raas', 'subscription', 'inquiry']))),
  inquiryUrl: opt(url),
  note: opt(text),
});

const robotSeries = object({
  ...baseRecordFields,
  name: req(nonEmptyText),
  nameJa: opt(text),
  manufacturerId: req(nonEmptyText),
  description: opt(text),
  images: opt(imagesByRole),
  industryTags: opt(arrayOf(tagOf('industry'))),
  taskTags: opt(arrayOf(tagOf('task'))),
});

/**
 * `specs` の値は `lib/specSchema.ts` が定義する項目のみ。値そのものの型は項目ごとに
 * number / string と分かれるが、ここでは「未知の項目keyを持ち込まない」ことと
 * 「値がJSONのscalarであること」を担保する（項目別の単位検証は `validate:data` の担当）。
 */
const specValue: Check = (value, path, problems) => {
  if (typeof value === 'number') return finiteNumber(value, path, problems);
  if (typeof value === 'string') return;
  fail(problems, path, `expected number or string spec value, got ${describe(value)}`);
};

const robot = object({
  ...baseRecordFields,
  name: req(nonEmptyText),
  nameJa: opt(text),
  manufacturerId: req(nonEmptyText),
  seriesId: opt(nonEmptyText),
  category: req(
    enumOf(['humanoid', 'general-purpose-robot', 'upper-body-humanoid', 'mobile-manipulator', 'other']),
  ),
  description: req(text),
  featuredRank: opt(integer),
  deploymentStage: req(
    enumOf(['concept', 'prototype', 'pilot', 'limited-production', 'production', 'internal-use', 'discontinued']),
  ),
  supersededById: opt(nonEmptyText),
  specs: req(openRecordOf(isSpecKey, specValue)),
  procurementModels: req(
    arrayOf(enumOf(['purchase', 'lease', 'raas', 'subscription', 'partner-program', 'not-for-sale', 'inquiry'])),
  ),
  priceOffers: opt(
    arrayOf(
      object({
        channel: req(enumOf(['manufacturer-public', 'authorized-distributor-public'])),
        display: req(nonEmptyText),
        amount: opt(finiteNumber),
        currency: opt(text),
        taxStatus: opt(enumOf(['included', 'excluded', 'unknown'])),
        variant: opt(text),
        sellerName: opt(text),
        sourceUrl: req(url),
      }),
    ),
  ),
  loadRatings: opt(
    arrayOf(
      object({
        scope: req(enumOf(['single-arm', 'dual-arm', 'whole-body', 'carrier', 'manufacturer-wording'])),
        rating: req(enumOf(['rated', 'maximum', 'unspecified'])),
        kg: req(finiteNumber),
        condition: opt(text),
        variant: opt(text),
        sourceUrl: req(url),
      }),
    ),
  ),
  fieldEvidence: opt(
    openRecordOf((key) => isSpecKey(key) || key === 'priceOffers' || key === 'loadRatings', arrayOf(url)),
  ),
  usageExampleSourceUrls: opt(arrayOf(url)),
  japanAvailability: req(
    enumOf(['official-japan', 'distributor-japan', 'inquiry-required', 'import-only', 'unavailable', 'unknown']),
  ),
  distributorJapan: opt(text),
  supportNote: opt(text),
  images: opt(imagesByRole),
  industryTags: opt(arrayOf(tagOf('industry'))),
  taskTags: opt(arrayOf(tagOf('task'))),
  comparison: req(
    object({
      strengths: req(arrayOf(text)),
      constraints: req(arrayOf(text)),
      bestFit: req(arrayOf(text)),
      notFit: req(arrayOf(text)),
    }),
  ),
});

const useCase = object({
  ...baseRecordFields,
  title: req(nonEmptyText),
  titleJa: opt(text),
  subtitle: opt(text),
  maturityLevel: req(enumOf(['early-stage', 'pilot-phase', 'production-ready'])),
  buyerReadiness: req(enumOf(['initial-adoption', 'requires-poc', 'limited-today'])),
  environment: req(
    enumOf(['indoor-controlled', 'indoor-semi-controlled', 'outdoor', 'mixed', 'hazardous']),
  ),
  requiredCapabilities: req(
    arrayOf(
      enumOf(['mobility', 'manipulation', 'perception', 'autonomy', 'communication', 'data-capture', 'integration']),
    ),
  ),
  primaryIndustry: req(tagOf('industry')),
  industryTags: req(arrayOf(tagOf('industry'))),
  taskTags: req(arrayOf(tagOf('task'))),
  atAGlance: req(
    object({ whereFits: req(text), whereDoesNotFit: req(text), mustBeTrue: req(text) }),
  ),
  overview: req(text),
  whyItMatters: req(text),
  capabilityNotes: req(
    object({
      mobility: opt(text),
      manipulation: opt(text),
      perception: opt(text),
      autonomy: opt(text),
      communication: opt(text),
      integration: opt(text),
    }),
  ),
  environmentRequirements: req(text),
  whyHardToday: req(text),
  japanDeploymentConditions: req(text),
  candidateRobots: req(
    arrayOf(
      object({
        robotId: opt(nonEmptyText),
        seriesId: opt(nonEmptyText),
        fit: req(enumOf(['strong', 'possible', 'watch'])),
        basis: req(
          enumOf([
            'deployment',
            'adjacent-deployment',
            'official-use-case',
            'product-capability',
            'market-signal',
            'editorial-watch',
          ]),
        ),
        evidenceDeploymentIds: opt(arrayOf(nonEmptyText)),
        evidenceSourceUrls: opt(arrayOf(url)),
        reason: req(text),
      }),
    ),
  ),
});

const deployment = object({
  ...baseRecordFields,
  manufacturerId: req(nonEmptyText),
  robotId: opt(nonEmptyText),
  customer: req(nonEmptyText),
  siteName: opt(text),
  country: req(nonEmptyText),
  location: req(latLng),
  status: req(enumOf(['announced', 'pilot', 'production', 'ended', 'unknown'])),
  startedAt: opt(contentDate),
  relatedUseCaseIds: opt(arrayOf(nonEmptyText)),
});

const ARTICLE_TYPES = [
  'analysis',
  'deployment-report',
  'interview',
  'event-report',
  'policy-update',
  'case-study',
  'news-brief',
  'tech-update',
  'market-analysis',
  'robot-guide',
  'basics-guide',
] as const;

const articleCommonFields: Record<string, Field> = {
  ...baseRecordFields,
  title: req(nonEmptyText),
  titleJa: opt(text),
  category: req(enumOf(['news', 'interview', 'company-report', 'analysis', 'policy'])),
  contentKind: opt(enumOf(['editorial', 'sample', 'sponsored'])),
  publishedAt: req(contentDate),
  author: opt(text),
  industryTags: opt(arrayOf(tagOf('industry'))),
  regionTags: opt(arrayOf(tagOf('region'))),
  themeTags: opt(arrayOf(tagOf('theme'))),
  whyItMatters: req(text),
  keyTakeaways: opt(arrayOf(text)),
  featured: opt(boolean),
  section: req(enumOf(['digest', 'deployment', 'business', 'tech', 'policy', 'entertainment'])),
  relatedRobotIds: req(arrayOf(nonEmptyText)),
  relatedManufacturerIds: req(arrayOf(nonEmptyText)),
  relatedUseCaseIds: req(arrayOf(nonEmptyText)),
};

const manufacturerGuideContent = object({
  companyOverview: req(text),
  productLineup: req(text),
  lineup: req(arrayOf(object({ robotId: req(nonEmptyText), roleLabel: req(text) }))),
  videos: opt(
    arrayOf(
      object({
        platform: req(enumOf(['youtube'])),
        videoId: req(nonEmptyText),
        title: req(text),
        channelName: req(text),
        channelUrl: req(url),
      }),
    ),
  ),
  history: req(text),
  deploymentIntro: req(text),
  deploymentStatus: req(
    recordOf(
      ['researchEducation', 'exhibitionDemo', 'poc', 'internalTrial', 'commercial'],
      object({
        evidence: req(enumOf(['confirmed', 'limited', 'none'])),
        body: req(text),
        sourceUrls: opt(arrayOf(url)),
      }),
    ),
  ),
  procurementChannels: req(
    arrayOf(
      object({
        kind: req(enumOf(['official-direct', 'domestic-distributor', 'consultation'])),
        name: req(text),
        url: req(url),
        role: req(text),
      }),
    ),
  ),
  japanProcurement: req(text),
  faq: req(arrayOf(object({ question: req(text), answer: req(text) }))),
});

/** `Article` は `type` による判別union（standard / manufacturer-guide）。 */
const article = discriminated('type', {
  ...Object.fromEntries(
    ARTICLE_TYPES.map((type) => [
      type,
      object({ ...articleCommonFields, type: req(enumOf([type])), body: opt(text) }),
    ]),
  ),
  'manufacturer-guide': object({
    ...articleCommonFields,
    type: req(enumOf(['manufacturer-guide'])),
    manufacturerGuideContent: req(manufacturerGuideContent),
  }),
});

const articlePlacement = object({
  id: req(nonEmptyText),
  surface: req(enumOf(['reports-index'])),
  slot: req(enumOf(['hero', 'feature'])),
  articleId: req(nonEmptyText),
  order: req(integer),
  kind: opt(enumOf(['editorial', 'sample', 'sponsored', 'house'])),
  sponsor: opt(
    object({ name: req(nonEmptyText), url: opt(url), disclosure: opt(text), campaignId: opt(text) }),
  ),
  publishStatus: req(enumOf(PUBLISH_STATUS)),
});

const mediaAsset = object({
  id: req(nonEmptyText),
  filename: req(nonEmptyText),
  url: req(url),
  alt: req(text),
  mimeType: opt(text),
  filesize: opt(integer),
  width: opt(integer),
  height: opt(integer),
  rights: req(rightsMeta),
});

const snapshot = object({
  robots: req(arrayOf(robot)),
  robotSeries: req(arrayOf(robotSeries)),
  distributors: req(arrayOf(distributor)),
  manufacturers: req(arrayOf(manufacturer)),
  useCases: req(arrayOf(useCase)),
  deployments: req(arrayOf(deployment)),
  articles: req(arrayOf(article)),
  articlePlacements: req(arrayOf(articlePlacement)),
  articleIndexPlacementLimits: req(object({ hero: req(integer), feature: req(integer) })),
  media: req(arrayOf(mediaAsset)),
  siteSettings: req(object({ dataAsOf: req(nonEmptyText) })),
});

/** `ContentSnapshot` の record collection（duplicate ID検査の対象）。 */
export const SNAPSHOT_RECORD_COLLECTIONS = [
  'robots',
  'robotSeries',
  'distributors',
  'manufacturers',
  'useCases',
  'deployments',
  'articles',
  'articlePlacements',
  'media',
] as const;

/** collectionごとのduplicate stable ID（必須修正6-3・6-5）。 */
export function collectDuplicateStableIds(value: ContentSnapshot): SchemaProblem[] {
  const problems: SchemaProblem[] = [];
  for (const collection of SNAPSHOT_RECORD_COLLECTIONS) {
    const seen = new Set<string>();
    for (const record of (value[collection] ?? []) as readonly { id?: unknown }[]) {
      const id = record?.id;
      if (typeof id !== 'string') continue;
      if (seen.has(id)) problems.push({ path: `${collection}`, detail: `duplicate stable id "${id}"` });
      seen.add(id);
    }
  }
  return problems;
}

export class SnapshotSchemaError extends Error {
  readonly problems: readonly SchemaProblem[];

  constructor(problems: readonly SchemaProblem[]) {
    const shown = problems.slice(0, 20).map((problem) => `${problem.path}: ${problem.detail}`);
    super(
      `snapshot-schema-invalid: ${problems.length} problem(s)\n  ${shown.join('\n  ')}` +
        (problems.length > shown.length ? `\n  ... ${problems.length - shown.length} more` : ''),
    );
    this.name = 'SnapshotSchemaError';
    this.problems = problems;
  }
}

/**
 * 厳密な runtime 検証つきで `ContentSnapshot` を得る唯一の入口。
 * `JSON.parse(...) as ContentSnapshot` の代わりにこれを使う（必須修正6-4）。
 */
export function parseContentSnapshot(value: unknown): ContentSnapshot {
  const problems: SchemaProblem[] = [];
  snapshot(value, 'snapshot', problems);
  if (problems.length === 0) problems.push(...collectDuplicateStableIds(value as ContentSnapshot));
  if (problems.length > 0) throw new SnapshotSchemaError(problems);
  return value as ContentSnapshot;
}

/** JSON文字列から直接。restore / verify の入力はすべてこれを通る。 */
export function parseContentSnapshotJson(json: string): ContentSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new SnapshotSchemaError([{ path: 'snapshot', detail: `not valid JSON: ${(error as Error).message}` }]);
  }
  return parseContentSnapshot(parsed);
}
