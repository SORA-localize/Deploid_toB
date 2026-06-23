/**
 * Next.js data model v1.
 *
 * Historical reference only. Do not copy this file to `data/types.ts`.
 * The current source of truth is `data/types.ts`; CMS-specific schemas should
 * be derived from the current source, not from this planning snapshot.
 */
import type { RobotSpecsFromSchema } from '@/lib/specSchema';
import type { TagValue } from '@/lib/tagRegistry';

/** 不変の安定ID。外部キー・一意性・将来のCMSレコードキーに使う。発番後は二度と変えない。 */
export type Id = string;
/** 公開URLのパスセグメント。可変（変更時は旧値を previousSlugs に追記して301で保護）。 */
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
  | 'transparent'  // 背景透過・全身正面（カード用）
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
  /** 不変ID。参照（*Id / *Ids）はすべてこれを指す。作成時は id === slug で発番する。 */
  id: Id;
  slug: Slug;
  /** slug変更時の旧slug（追記のみ）。詳細ページが301リダイレクト元として解決する。 */
  previousSlugs?: Slug[];
  summary: string;
  publishStatus: PublishStatus;
  updatedAt: ISODate;
  reliability: Reliability;
  sources: Source[];
  /** 次回事実確認の目安日。超過は validate が warning で知らせる（鮮度管理）。 */
  nextReviewBy?: ISODate;
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
  // 関連は逆向き(Robot.manufacturerId / Article.relatedManufacturerIds)で導出する。
  // robotIds / handledRobotIds / relatedReportIds は持たない。
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

/**
 * スペック値。項目の定義（キー・ラベル・単位・グループ）の正本は lib/specSchema.ts。
 * 項目追加は specSchema に1行追加すれば型・スペック表・validate が自動追従する（設計 §8）。
 * 値は各ロボットに個別。不明値はキーごと省略する（UIが「要確認」を表示）。
 */
export type RobotSpecs = RobotSpecsFromSchema;

export interface ComparisonProfile {
  strengths: string[];
  constraints: string[];
  bestFit: string[];
  notFit: string[];
}

export interface Robot extends BaseRecord {
  name: string;
  nameJa?: string;
  manufacturerId: Id;
  category: RobotCategory;
  description: string;
  /** 将来の掲載提携・有料スポンサード枠のための優先順位。値が小さいほど上位。未設定は非スポンサード扱い。 */
  featuredRank?: number;
  deploymentStage: DeploymentStage;
  buyerReadiness: BuyerReadiness;
  /** 提供終了（archived）時の後継機。詳細・関連欄で「後継機: X」導線を出す。 */
  supersededById?: Id;
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
  // 関連は逆向き(UseCase.candidateRobots[].robotId / Guide.relatedRobotIds /
  // Article.relatedRobotIds)で導出する。
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
  relatedRobotIds: Id[];
  relatedUseCaseIds: Id[];
  // 関連articlesは Article.relatedGuideIds で逆引きする。
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

export type CandidateFit = 'strong' | 'possible' | 'watch';

export interface UseCaseCandidateRobot {
  robotId: Id;
  fit: CandidateFit;
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
  relatedGuideIds: Id[];
  // 関連articlesは Article.relatedUseCaseIds で逆引きする。
}

/**
 * 記事種別の第一軸（設計 §7-1）。編集者が必ず1つ指定する主分類。
 * ニュースメディアとしての役割（速報〜分析）を表す。
 * type（フォーマット）・section（サブジェクト・タブ）は当面併存し、
 * category へのUI一本化は別フェーズで判断する。
 */
export type ArticleCategory =
  | 'news'           // 業界最新情報・発表まとめ（速報。whyItMatters 必須は他と同じ）
  | 'interview'      // 取材記事・インタビュー
  | 'company-report' // 企業レポート（動向・決算・戦略）
  | 'analysis'       // 分析・市場考察・導入事例の読み解き
  | 'policy';        // 政策・規制アップデート

export type ArticleType =
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
 * UI専用の 'all' は含めない（lib/articleSections.ts の ArticleSectionFilter 側で付与）。
 */
export type ArticleSection =
  | 'deployment'
  | 'business'
  | 'tech'
  | 'policy'
  | 'entertainment';

export type ArticleContentKind = 'editorial' | 'sample' | 'sponsored';

export interface Article extends BaseRecord {
  title: string;
  titleJa?: string;
  /** 第一軸の記事種別（必須）。一覧の絞り込み・編集方針の基準になる。 */
  category: ArticleCategory;
  type: ArticleType;
  /** editorial が通常記事。sample はUI確認用公開データとして sources 空を許容する。 */
  contentKind?: ArticleContentKind;
  publishedAt: ISODate;
  author?: string;
  tags: TagValue<'article'>[];
  whyItMatters: string;
  keyTakeaways?: string[];
  /** 記事本文（Markdown）。空ならレポート本文セクションは描画されない。 */
  body?: string;
  featured?: boolean;
  /** 記事タブの分類（サブジェクト）。type とは独立した必須フィールド。 */
  section: ArticleSection;
  /** 目安読了時間（分）。未設定時は非表示。 */
  readingTimeMin?: number;
  relatedRobotIds: Id[];
  relatedManufacturerIds: Id[];
  relatedUseCaseIds: Id[];
  relatedGuideIds?: Id[];
}

export type ArticlePlacementSurface = 'reports-index';
export type ArticlePlacementSlot = 'hero' | 'feature';
export type ArticlePlacementKind = 'editorial' | 'sample' | 'sponsored' | 'house';

export interface ArticlePlacementSponsor {
  name: string;
  url?: string;
  disclosure?: string;
  campaignId?: string;
}

export interface ArticlePlacement {
  surface: ArticlePlacementSurface;
  slot: ArticlePlacementSlot;
  articleId: Id;
  order: number;
  kind?: ArticlePlacementKind;
  sponsor?: ArticlePlacementSponsor;
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
  /** arc 始点＝メーカー（data/manufacturers.ts の id） */
  manufacturerId: Id;
  /** 導入ロボット（data/robots.ts の id、判明していれば） */
  robotId?: Id;
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
  articles: Article[];
}
