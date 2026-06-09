/**
 * Next.js data model v1.
 *
 * Copy this file to `data/types.ts` when the Next.js project is created.
 * The first implementation should keep data in `data/*.ts` and import these
 * types from `data/types.ts`. CMS-specific schemas should be derived from
 * this file later, not the other way around.
 */
import type { TagValue } from '@/lib/tagRegistry';

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
  /** 本社のおおよその座標。Homeのワールドマップ描画用（任意・装飾用途）。 */
  headquarters?: { lat: number; lng: number };
  foundedYear?: number;
  website: string;
  logo?: ImageAsset;
  contactUrl?: string;
  description: string;
  japanPresence: JapanPresence;
  domesticDistributors?: DomesticDistributor[];
  distributorNote?: string;
  supportNote?: string;
  procurementNote?: string;
  vendorRiskNote?: string;
  // 関連は逆向き(Robot.manufacturerSlug / Report.relatedManufacturerSlugs)で導出する。
  // robotSlugs / handledRobotSlugs / relatedReportSlugs は持たない。
  /** 将来の掲載提携・有料スポンサード枠のための優先順位。値が小さいほど上位。未設定は非スポンサード扱い。 */
  featuredRank?: number;
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
  /** 将来の掲載提携・有料スポンサード枠のための優先順位。値が小さいほど上位。未設定は非スポンサード扱い。 */
  featuredRank?: number;
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
  // 関連は逆向き(UseCase.candidateRobotSlugs / Guide.relatedRobotSlugs /
  // Report.relatedRobotSlugs)で導出する。
  /** 業種タグ（lib/tagRegistry.ts の kind:'industry' のvalue）。未設定=調査中扱い。 */
  industryTags?: TagValue<'industry'>[];
  /** タスクタグ（lib/tagRegistry.ts の kind:'task' のvalue）。未設定=調査中扱い。 */
  taskTags?: TagValue<'task'>[];
  comparison: ComparisonProfile;
}

export type GuideStage = 'learn' | 'evaluate' | 'act';

export interface Guide extends BaseRecord {
  title: string;
  titleJa?: string;
  description: string;
  stage: GuideStage;
  order: number;
  topics: TagValue<'guide-topic'>[];
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
  industryTags: TagValue<'industry'>[];
  taskTags: TagValue<'task'>[];
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
  | 'news-brief'
  | 'tech-update'
  | 'market-analysis';

/**
 * 記事のサブジェクト（何の話か）＝記事タブの分類。
 * type（フォーマット：どう書かれたか）とは独立した軸で、記事ごとに編集者が明示指定する。
 * UI専用の 'all' は含めない（lib/reportSections.ts の ReportSectionFilter 側で付与）。
 */
export type ReportSection =
  | 'deployment'
  | 'business'
  | 'tech'
  | 'policy'
  | 'entertainment';

export type ReportContentKind = 'editorial' | 'sample' | 'sponsored';

export interface Report extends BaseRecord {
  title: string;
  titleJa?: string;
  type: ReportType;
  /** editorial が通常記事。sample はUI確認用公開データとして sources 空を許容する。 */
  contentKind?: ReportContentKind;
  publishedAt: ISODate;
  author?: string;
  tags: TagValue<'report'>[];
  whyItMatters: string;
  keyTakeaways?: string[];
  /** 記事本文（Markdown）。空ならレポート本文セクションは描画されない。 */
  body?: string;
  featured?: boolean;
  /** 記事タブの分類（サブジェクト）。type とは独立した必須フィールド。 */
  section: ReportSection;
  /** 目安読了時間（分）。未設定時は非表示。 */
  readingTimeMin?: number;
  relatedRobotSlugs: Slug[];
  relatedManufacturerSlugs: Slug[];
  relatedUseCaseSlugs: Slug[];
  relatedGuideSlugs?: Slug[];
}

export type ReportPlacementSurface = 'reports-index';
export type ReportPlacementSlot = 'hero' | 'feature';
export type ReportPlacementKind = 'editorial' | 'sample' | 'sponsored' | 'house';

export interface ReportPlacementSponsor {
  name: string;
  url?: string;
  disclosure?: string;
  campaignId?: string;
}

export interface ReportPlacement {
  surface: ReportPlacementSurface;
  slot: ReportPlacementSlot;
  reportSlug: Slug;
  order: number;
  kind?: ReportPlacementKind;
  sponsor?: ReportPlacementSponsor;
}

export type DeploymentStatus =
  | 'announced' // 発表のみ
  | 'pilot' // 実証・PoC
  | 'production' // 本番運用
  | 'ended' // 終了
  | 'unknown';

/**
 * 実在の導入事例。Homeワールドマップの「メーカーHQ→導入先」arc 描画の根拠データ。
 * 所在地・導入主体・段階は必ず一次/信頼できる二次出典で裏取りし sources に残す（AI生成値の混入防止）。
 * location は導入拠点のおおよその座標（番地レベルは不要）。
 */
export interface DeploymentSite extends BaseRecord {
  /** arc 始点＝メーカー（data/manufacturers.ts の slug） */
  manufacturerSlug: Slug;
  /** 導入ロボット（data/robots.ts の slug、判明していれば） */
  robotSlug?: Slug;
  /** 導入先の企業/組織名（例: BMW、GXO） */
  customer: string;
  /** 拠点名（例: Spartanburg Plant） */
  siteName?: string;
  /** 導入先の国 */
  country: string;
  /** arc 終点＝導入拠点のおおよその座標 */
  location: { lat: number; lng: number };
  /** 導入の段階 */
  status: DeploymentStatus;
  /** 開始/発表時期（YYYY または YYYY-MM） */
  startedAt?: ISODate;
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
