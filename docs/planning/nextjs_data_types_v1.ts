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
}

/** ロボットの画像スロット。詳細ページのカルーセルで6スロット固定で使う。
 *  写真が無いスロットは empty state（役割名のラベル）になる。 */
export type ImageRole =
  | 'hero'         // 全身正面
  | 'side'         // 側面
  | 'inOperation'  // 稼働中（実環境）
  | 'scale'        // スケール比較（人/物）
  | 'endEffector'  // ハンド・把持部
  | 'mobility';    // 脚・足・車輪

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
  logo?: ImageAsset;
  contactUrl?: string;
  description: string;
  japanPresence: JapanPresence;
  distributorNote?: string;
  supportNote?: string;
  procurementNote?: string;
  vendorRiskNote?: string;
  featuredRank?: number;
  // 関連は逆向き(Robot.manufacturerSlug / Report.relatedManufacturerSlugs)で導出する。
  // robotSlugs / handledRobotSlugs / relatedReportSlugs は持たない。
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
  /** 役割別の参考画像（詳細ページのカルーセル）。hero が未設定なら BaseRecord.heroImage を hero に昇格して使う。 */
  images?: Partial<Record<ImageRole, ImageAsset>>;
  featuredRank?: number;
  /** 業種タグ（lib/tagRegistry.ts の kind:'industry' のvalue）。未設定=調査中扱い。 */
  industryTags?: string[];
  /** タスクタグ（lib/tagRegistry.ts の kind:'task' のvalue）。未設定=調査中扱い。 */
  taskTags?: string[];
  // 関連は逆向き(UseCase.candidateRobotSlugs / Guide.relatedRobotSlugs /
  // Report.relatedRobotSlugs)で導出する。
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
  /** 記事本文（Markdown）。空ならガイド本文セクションは描画されない。 */
  body?: string;
  relatedRobotSlugs: Slug[];
  relatedUseCaseSlugs: Slug[];
  // 関連reportsは Report.relatedGuideSlugs で逆引きする。
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
  // 関連reportsは Report.relatedUseCaseSlugs で逆引きする。
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
  /** 記事本文（Markdown）。空ならレポート本文セクションは描画されない。 */
  body?: string;
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
