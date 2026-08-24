/**
 * Cutover後も残るcanonical runtime型（`docs/plans/content-platform-migration-plan-v1.md` Task 3）。
 * `data/types.ts` は移行期間だけのlegacy compatibility境界であり、いずれ削除される想定のため、
 * このファイルは `data/types.ts` の型を一切importしない（意図的な重複。§正本主義の例外として、
 * 移行完了までの間だけ両方に同じ語彙を持つコストを許容する）。
 *
 * 例外は `lib/tagRegistry.ts` / `lib/specSchema.ts`。これらは `data/*.ts` ではなく恒久的な
 * レジストリであり、cutover後も唯一の正本であり続けるため、そのままimportする。
 *
 * Task 4以降のrepository・Payload mapper・view modelは必ずこのファイルの型を使う
 * （`data/types.ts` を直接使わない）。
 *
 * `Robot` はDEC-S05・S06（`robot-data-import-plan-v1.md`）で削除された
 * `buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote` を持たない。
 */
import type { RobotSpecsFromSchema, SpecKey } from '@/lib/specSchema';
import type { TagValue } from '@/lib/tagRegistry';

export type Id = string;
export type Slug = string;
export type ISODate = string;

/** 意味は不変（Global Constraints）。 */
export type PublishStatus = 'draft' | 'published' | 'archived';

export type Reliability = 'verified' | 'official' | 'reported' | 'estimated';

export interface Source {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: ISODate;
  checkedAt: ISODate;
  reliability: Reliability;
  note?: string;
}

export type RightsStatus =
  | 'own'
  | 'licensed'
  | 'commercial-permitted'
  | 'reference-attributed'
  | 'permission-requested'
  | 'prototype-only'
  | 'blocked';

export type MediaSourceType =
  | 'own'
  | 'manufacturer-official'
  | 'partner-official'
  | 'press-release'
  | 'third-party'
  | 'unknown';

export interface RightsMeta {
  status: RightsStatus;
  sourceType: MediaSourceType;
  checkedAt: ISODate;
  rightsHolder?: string;
  licenseUrl?: string;
  permissionNote?: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  rights: RightsMeta;
  aspectRatio?: number;
}

export interface ManufacturerLogos {
  symbol?: ImageAsset;
  wordmark?: ImageAsset;
  combined?: ImageAsset;
}

export type ImageRole =
  | 'hero'
  | 'transparent'
  | 'side'
  | 'inOperation'
  | 'scale'
  | 'endEffector'
  | 'mobility';

export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  noindex?: boolean;
}

export interface BaseRecord {
  /** 不変ID。参照（*Id / *Ids）はすべてこれを指す。Payload側では `stableId` fieldに対応する。 */
  id: Id;
  slug: Slug;
  previousSlugs?: Slug[];
  summary: string;
  publishStatus: PublishStatus;
  updatedAt: ISODate;
  reliability: Reliability;
  sources: Source[];
  nextReviewBy?: ISODate;
  heroImage?: ImageAsset;
  seo?: SeoFields;
}

export type CompanyType = 'manufacturer' | 'distributor' | 'integrator' | 'ai-os' | 'research';
export type CompanyStatus = 'active' | 'stealth' | 'acquired' | 'inactive';
export type JapanPresence = 'office' | 'distributor' | 'partner' | 'remote' | 'none' | 'unknown';

export interface DomesticDistributor {
  name: string;
  website?: string;
  sourceUrl?: string;
  checkedAt?: ISODate;
  note?: string;
}

export interface Manufacturer extends BaseRecord {
  name: string;
  nameJa?: string;
  companyType: CompanyType;
  companyStatus: CompanyStatus;
  country: string;
  hqCity?: string;
  headquarters?: { lat: number; lng: number };
  foundedYear?: number;
  website: string;
  logos?: ManufacturerLogos;
  contactUrl?: string;
  description: string;
  japanPresence: JapanPresence;
  domesticDistributors?: DomesticDistributor[];
  distributorNote?: string;
  supportNote?: string;
  procurementNote?: string;
  vendorRiskNote?: string;
  featuredRank?: number;
}

/**
 * ★2026-08-08新設（`data-architecture-redesign-v1.md` §4-1）。国内の提供事業者（代理店・直販窓口）。
 * 多対多で `manufacturers` / `robots` を扱う。
 */
export type DistributorProviderType = 'maker-direct' | 'reseller' | 'other';
export type DistributorAcquisitionMethod = 'purchase' | 'lease' | 'raas' | 'subscription' | 'inquiry';

export interface Distributor extends BaseRecord {
  name: string;
  nameJa?: string;
  website?: string;
  providerType: DistributorProviderType;
  handledManufacturerIds: Id[];
  handledRobotIds?: Id[];
  acquisitionMethods: DistributorAcquisitionMethod[];
  inquiryUrl?: string;
  note?: string;
}

/**
 * ★2026-08-08新設（DEC-S08）。製品ファミリ。スペックも価格も持たない
 * （`deploymentStage` と `specs` に答えが存在しないため）。買えるのは `Robot`（構成）のほう。
 */
export interface RobotSeries extends BaseRecord {
  name: string;
  nameJa?: string;
  manufacturerId: Id;
  description?: string;
  images?: Partial<Record<ImageRole, ImageAsset>>;
  industryTags?: TagValue<'industry'>[];
  taskTags?: TagValue<'task'>[];
}

export type RobotCategory =
  | 'humanoid'
  | 'general-purpose-robot'
  | 'upper-body-humanoid'
  | 'mobile-manipulator'
  | 'other';

export type MobilityType = 'biped' | 'wheeled' | 'wheel-legged' | 'hybrid' | 'stationary' | 'unknown';

export type DeploymentStage =
  | 'concept'
  | 'prototype'
  | 'pilot'
  | 'limited-production'
  | 'production'
  | 'internal-use'
  | 'discontinued';

/** `Robot` からは削除済み（DEC-S05）。`UseCase.buyerReadiness` はこの値を引き続き使う。 */
export type BuyerReadiness = 'initial-adoption' | 'requires-poc' | 'limited-today';

export type JapanAvailability =
  | 'official-japan'
  | 'distributor-japan'
  | 'inquiry-required'
  | 'import-only'
  | 'unavailable'
  | 'unknown';

export type ProcurementModel =
  | 'purchase'
  | 'lease'
  | 'raas'
  | 'subscription'
  | 'partner-program'
  | 'not-for-sale'
  | 'inquiry';

/** 項目メタ（ラベル・単位・グループ）の正本は `lib/specSchema.ts`。値だけこの型に入る。 */
export type RobotSpecs = RobotSpecsFromSchema;

export interface ComparisonProfile {
  strengths: string[];
  constraints: string[];
  bestFit: string[];
  notFit: string[];
}

export type RobotPriceChannel = 'manufacturer-public' | 'authorized-distributor-public';

export interface RobotPriceOffer {
  channel: RobotPriceChannel;
  display: string;
  amount?: number;
  currency?: string;
  taxStatus?: 'included' | 'excluded' | 'unknown';
  variant?: string;
  sellerName?: string;
  sourceUrl: string;
}

export type RobotLoadScope = 'single-arm' | 'dual-arm' | 'whole-body' | 'carrier' | 'manufacturer-wording';
export type RobotLoadRatingKind = 'rated' | 'maximum' | 'unspecified';

export interface RobotLoadRating {
  scope: RobotLoadScope;
  rating: RobotLoadRatingKind;
  kg: number;
  condition?: string;
  variant?: string;
  sourceUrl: string;
}

export type RobotEvidenceField = SpecKey | 'priceOffers' | 'loadRatings';
export type RobotFieldEvidence = Partial<Record<RobotEvidenceField, string[]>>;

/**
 * 削除4フィールド（`buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote`）を
 * 持たない。`comparison` は `/compare` が実表示に使うため維持する（brief）。
 */
export interface Robot extends BaseRecord {
  name: string;
  nameJa?: string;
  manufacturerId: Id;
  /** 構成が割れるファミリのみ設定する任意参照（DEC-S08）。`/robots/[slug]` namespaceを RobotSeries と共有する。 */
  seriesId?: Id;
  category: RobotCategory;
  description: string;
  featuredRank?: number;
  deploymentStage: DeploymentStage;
  supersededById?: Id;
  specs: RobotSpecs;
  procurementModels: ProcurementModel[];
  priceOffers?: RobotPriceOffer[];
  loadRatings?: RobotLoadRating[];
  fieldEvidence?: RobotFieldEvidence;
  usageExampleSourceUrls?: string[];
  japanAvailability: JapanAvailability;
  distributorJapan?: string;
  supportNote?: string;
  images?: Partial<Record<ImageRole, ImageAsset>>;
  industryTags?: TagValue<'industry'>[];
  taskTags?: TagValue<'task'>[];
  /** @deprecated `/compare` の作り替えが決まるまで維持する（削除しない）。 */
  comparison: ComparisonProfile;
}

export type UseCaseMaturity = 'early-stage' | 'pilot-phase' | 'production-ready';

export type OperatingEnvironment = 'indoor-controlled' | 'indoor-semi-controlled' | 'outdoor' | 'mixed' | 'hazardous';

export type Capability =
  | 'mobility'
  | 'manipulation'
  | 'perception'
  | 'autonomy'
  | 'communication'
  | 'data-capture'
  | 'integration';

export interface UseCaseAtAGlance {
  whereFits: string;
  whereDoesNotFit: string;
  mustBeTrue: string;
}

export interface UseCaseCapabilityNotes {
  mobility?: string;
  manipulation?: string;
  perception?: string;
  autonomy?: string;
  communication?: string;
  integration?: string;
}

export type CandidateFit = 'strong' | 'possible' | 'watch';

export type CandidateEvidenceBasis =
  | 'deployment'
  | 'adjacent-deployment'
  | 'official-use-case'
  | 'product-capability'
  | 'market-signal'
  | 'editorial-watch';

/** `robotId` または `seriesId` のどちらか一方だけを持つ（DEC-S08）。 */
export interface UseCaseCandidateRobot {
  robotId?: Id;
  seriesId?: Id;
  fit: CandidateFit;
  basis: CandidateEvidenceBasis;
  evidenceDeploymentIds?: Id[];
  evidenceSourceUrls?: string[];
  reason: string;
}

export interface UseCase extends BaseRecord {
  title: string;
  titleJa?: string;
  subtitle?: string;
  maturityLevel: UseCaseMaturity;
  buyerReadiness: BuyerReadiness;
  environment: OperatingEnvironment;
  requiredCapabilities: Capability[];
  primaryIndustry: TagValue<'industry'>;
  industryTags: TagValue<'industry'>[];
  taskTags: TagValue<'task'>[];
  atAGlance: UseCaseAtAGlance;
  overview: string;
  whyItMatters: string;
  capabilityNotes: UseCaseCapabilityNotes;
  environmentRequirements: string;
  whyHardToday: string;
  japanDeploymentConditions: string;
  candidateRobots: UseCaseCandidateRobot[];
}

export type ArticleCategory = 'news' | 'interview' | 'company-report' | 'analysis' | 'policy';

export type ArticleType =
  | 'analysis'
  | 'deployment-report'
  | 'interview'
  | 'event-report'
  | 'policy-update'
  | 'case-study'
  | 'news-brief'
  | 'tech-update'
  | 'market-analysis'
  | 'manufacturer-guide'
  | 'robot-guide'
  | 'basics-guide';

export type ArticleSection = 'digest' | 'deployment' | 'business' | 'tech' | 'policy' | 'entertainment';

export type ArticleContentKind = 'editorial' | 'sample' | 'sponsored';

interface ArticleCommon extends BaseRecord {
  title: string;
  titleJa?: string;
  category: ArticleCategory;
  contentKind?: ArticleContentKind;
  publishedAt: ISODate;
  author?: string;
  industryTags?: TagValue<'industry'>[];
  regionTags?: TagValue<'region'>[];
  themeTags?: TagValue<'theme'>[];
  whyItMatters: string;
  keyTakeaways?: string[];
  featured?: boolean;
  section: ArticleSection;
  relatedRobotIds: Id[];
  relatedManufacturerIds: Id[];
  relatedUseCaseIds: Id[];
}

export type TemplatedArticleType = 'manufacturer-guide';

export interface StandardArticle extends ArticleCommon {
  type: Exclude<ArticleType, TemplatedArticleType>;
  body?: string;
}

export type ManufacturerGuideDeploymentCategory =
  | 'researchEducation'
  | 'exhibitionDemo'
  | 'poc'
  | 'internalTrial'
  | 'commercial';

export type ManufacturerGuideDeploymentEvidence = 'confirmed' | 'limited' | 'none';

export interface ManufacturerGuideDeploymentItem {
  evidence: ManufacturerGuideDeploymentEvidence;
  body: string;
  sourceUrls?: string[];
}

export type ManufacturerGuideProcurementChannelKind = 'official-direct' | 'domestic-distributor' | 'consultation';

export interface ManufacturerGuideProcurementChannel {
  kind: ManufacturerGuideProcurementChannelKind;
  name: string;
  url: string;
  role: string;
}

export interface ManufacturerGuideLineupRow {
  robotId: Id;
  roleLabel: string;
}

export interface ManufacturerGuideFaqItem {
  question: string;
  answer: string;
}

export interface ManufacturerGuideVideo {
  platform: 'youtube';
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
}

export interface ManufacturerGuideContent {
  companyOverview: string;
  productLineup: string;
  lineup: ManufacturerGuideLineupRow[];
  videos?: ManufacturerGuideVideo[];
  history: string;
  deploymentIntro: string;
  deploymentStatus: Record<ManufacturerGuideDeploymentCategory, ManufacturerGuideDeploymentItem>;
  procurementChannels: ManufacturerGuideProcurementChannel[];
  japanProcurement: string;
  faq: ManufacturerGuideFaqItem[];
}

export interface ManufacturerGuideArticle extends ArticleCommon {
  type: 'manufacturer-guide';
  manufacturerGuideContent: ManufacturerGuideContent;
  keyTakeaways?: string[];
}

export type Article = StandardArticle | ManufacturerGuideArticle;

export type ArticlePlacementSurface = 'reports-index';
export type ArticlePlacementSlot = 'hero' | 'feature';
export type ArticlePlacementKind = 'editorial' | 'sample' | 'sponsored' | 'house';

export interface ArticlePlacementSponsor {
  name: string;
  url?: string;
  disclosure?: string;
  campaignId?: string;
}

/**
 * 現行 `ArticlePlacement` はidを持たない。Payload側では `stableId` を
 * `surface:slot:articleId` から決定的に生成する（brief）。BaseRecordの一部（`updatedAt` 等）は
 * placementの性質上使わないため継承しない。
 */
export interface ArticlePlacement {
  id: Id;
  surface: ArticlePlacementSurface;
  slot: ArticlePlacementSlot;
  articleId: Id;
  order: number;
  kind?: ArticlePlacementKind;
  sponsor?: ArticlePlacementSponsor;
  publishStatus: PublishStatus;
}

export type DeploymentStatus = 'announced' | 'pilot' | 'production' | 'ended' | 'unknown';

export interface DeploymentSite extends BaseRecord {
  manufacturerId: Id;
  robotId?: Id;
  customer: string;
  siteName?: string;
  country: string;
  location: { lat: number; lng: number };
  status: DeploymentStatus;
  startedAt?: ISODate;
  relatedUseCaseIds?: Id[];
}

/**
 * Payloadの `Media` collection（アップロード実体）に対応するcanonical型。
 * 既存 `ImageAsset` とは別物（`ImageAsset` は各レコードへの埋め込み参照 + rights）。
 * `stableId` は正規化した既存 `src` から決定的に生成する（brief）。
 */
export interface MediaAsset {
  id: Id;
  filename: string;
  url: string;
  alt: string;
  mimeType?: string;
  filesize?: number;
  width?: number;
  height?: number;
  rights: RightsMeta;
}
