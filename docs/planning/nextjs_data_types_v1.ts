/**
 * Next.js data model v1.
 *
 * Copy this file to `data/types.ts` when the Next.js project is created.
 * The first implementation should keep data in `data/*.ts` and import these
 * types from `data/types.ts`. CMS-specific schemas should be derived from
 * this file later, not the other way around.
 */

export type Slug = string;
export type ISODate = string;

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

export interface ImageAsset {
  src: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
}

export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  noindex?: boolean;
}

export interface BaseRecord {
  slug: Slug;
  summary: string;
  publishStatus: PublishStatus;
  updatedAt: ISODate;
  reliability: Reliability;
  sources: Source[];
  heroImage?: ImageAsset;
  seo?: SeoFields;
}

export type CompanyType =
  | 'manufacturer'
  | 'distributor'
  | 'integrator'
  | 'ai-os'
  | 'research';

export type CompanyStatus = 'active' | 'stealth' | 'acquired' | 'inactive';

export type JapanPresence =
  | 'office'
  | 'distributor'
  | 'partner'
  | 'remote'
  | 'none'
  | 'unknown';

export interface Manufacturer extends BaseRecord {
  name: string;
  nameJa?: string;
  companyType: CompanyType;
  companyStatus: CompanyStatus;
  country: string;
  hqCity?: string;
  foundedYear?: number;
  website: string;
  contactUrl?: string;
  description: string;
  japanPresence: JapanPresence;
  distributorNote?: string;
  supportNote?: string;
  procurementNote?: string;
  vendorRiskNote?: string;
  robotSlugs: Slug[];
  handledRobotSlugs?: Slug[];
  relatedReportSlugs?: Slug[];
}

export type RobotCategory =
  | 'humanoid'
  | 'general-purpose-robot'
  | 'upper-body-humanoid'
  | 'mobile-manipulator'
  | 'other';

export type MobilityType = 'biped' | 'wheeled' | 'hybrid' | 'stationary';

export type DeploymentStage =
  | 'concept'
  | 'prototype'
  | 'pilot'
  | 'limited-production'
  | 'production'
  | 'internal-use'
  | 'discontinued';

export type BuyerReadiness =
  | 'initial-adoption'
  | 'requires-poc'
  | 'limited-today';

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

export interface RobotSpecs {
  heightCm?: number;
  weightKg?: number;
  payloadKg?: number;
  runtimeMin?: number;
  speedMps?: number;
  dof?: number;
  mobility?: MobilityType;
  ipRating?: string;
}

export interface ComparisonProfile {
  strengths: string[];
  constraints: string[];
  bestFit: string[];
  notFit: string[];
}

export interface Robot extends BaseRecord {
  name: string;
  nameJa?: string;
  manufacturerSlug: Slug;
  category: RobotCategory;
  description: string;
  deploymentStage: DeploymentStage;
  buyerReadiness: BuyerReadiness;
  specs: RobotSpecs;
  procurementModels: ProcurementModel[];
  priceNote?: string;
  japanAvailability: JapanAvailability;
  distributorJapan?: string;
  supportNote?: string;
  safetyNote?: string;
  vendorRiskNote?: string;
  useCaseSlugs: Slug[];
  guideSlugs?: Slug[];
  reportSlugs?: Slug[];
  comparison: ComparisonProfile;
}

export type GuideStage = 'learn' | 'evaluate' | 'act';

export interface Guide extends BaseRecord {
  title: string;
  titleJa?: string;
  description: string;
  stage: GuideStage;
  order: number;
  topics: string[];
  targetReaders: string[];
  readingTimeMinutes?: number;
  checklistItems?: string[];
  relatedRobotSlugs: Slug[];
  relatedUseCaseSlugs: Slug[];
  relatedReportSlugs?: Slug[];
}

export type UseCaseMaturity = 'early-stage' | 'pilot-phase' | 'production-ready';

export type OperatingEnvironment =
  | 'indoor-controlled'
  | 'indoor-semi-controlled'
  | 'outdoor'
  | 'mixed'
  | 'hazardous';

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

export interface UseCase extends BaseRecord {
  title: string;
  titleJa?: string;
  subtitle?: string;
  maturityLevel: UseCaseMaturity;
  buyerReadiness: BuyerReadiness;
  environment: OperatingEnvironment;
  requiredCapabilities: Capability[];
  industryTags: string[];
  taskTags: string[];
  atAGlance: UseCaseAtAGlance;
  overview: string;
  whyItMatters: string;
  capabilityNotes: UseCaseCapabilityNotes;
  environmentRequirements: string;
  whyHardToday: string;
  japanDeploymentConditions: string;
  candidateRobotSlugs: Slug[];
  relatedGuideSlugs: Slug[];
  relatedReportSlugs?: Slug[];
}

export type ReportType =
  | 'analysis'
  | 'deployment-report'
  | 'interview'
  | 'event-report'
  | 'policy-update'
  | 'case-study'
  | 'news-brief';

export interface Report extends BaseRecord {
  title: string;
  titleJa?: string;
  type: ReportType;
  publishedAt: ISODate;
  author?: string;
  tags: string[];
  whyItMatters: string;
  keyTakeaways?: string[];
  featured?: boolean;
  relatedRobotSlugs: Slug[];
  relatedManufacturerSlugs: Slug[];
  relatedUseCaseSlugs: Slug[];
  relatedGuideSlugs?: Slug[];
}

export type ContactInquiryType =
  | 'data-correction'
  | 'listing-request'
  | 'interview-request'
  | 'adoption-consultation'
  | 'other';

export interface SiteData {
  robots: Robot[];
  manufacturers: Manufacturer[];
  guides: Guide[];
  useCases: UseCase[];
  reports: Report[];
}
