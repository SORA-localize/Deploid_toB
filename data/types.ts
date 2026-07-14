/**
 * Deploid data model.
 * `data/*.ts`, validation, and future CMS schemas derive from these types.
 */
import type { RobotSpecsFromSchema, SpecKey } from '@/lib/specSchema';
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
  /** 実行時にサーバー側で実測して付与される（data/*.ts に手打ちしない）。
   *  lib/data.ts の enrichment 経由でのみ設定される。詳細は lib/imageDimensions.ts 参照。 */
  aspectRatio?: number;
}

/** メーカーロゴの種別。詳細は docs/planning/manufacturer-logo-usage-spec-v1.md 参照。
 *  symbol: アイコン/シンボルマーク（文字を含まない、または文字が主役ではない）
 *  wordmark: 会社名を読ませる横長ワードロゴ
 *  combined: シンボル + ワードロゴの複合ロゴ（公式が1枚のアセットとして提供している場合のみ設定する。
 *    symbolとwordmarkを実装側で合成して combined 相当にすることはしない — 公式が意図しない間隔・比率の
 *    組み合わせを作ってしまうため。symbol/wordmarkしか無いメーカーは、そのままそれぞれのvariantとして扱う） */
export interface ManufacturerLogos {
  symbol?: ImageAsset;
  wordmark?: ImageAsset;
  combined?: ImageAsset;
}

/** ロボット画像の用途。登録・表示可能なroleだけをカルーセルへ並べる。 */
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
  /** @deprecated 種別未分類の1枚ロゴ（後方互換）。logos が存在するメーカーでは表示解決から除外される（lib/manufacturerLogo.ts）。新規データは logos を使う。 */
  logo?: ImageAsset;
  logos?: ManufacturerLogos;
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

export type MobilityType = 'biped' | 'wheeled' | 'wheel-legged' | 'hybrid' | 'stationary' | 'unknown';

/**
 * 調達可能性の実態。deploymentStage が「製品の成熟段階」を表すのに対し、
 * こちらは「いま買えるのか・誰に売っているのか」を表す（factcheck計画 FC-C-003）。
 * 裏取りできるロボットにのみ設定し、不明な場合は未設定のまま（UIは非表示）にする。
 */
export type MarketAvailability =
  | 'enterprise-deployment'
  | 'enterprise-pilot'
  | 'developer-platform'
  | 'research-platform'
  | 'reservation'
  | 'internal-use'
  | 'planned-production'
  | 'company-claimed-delivery'
  | 'unknown';

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

export type RobotPriceChannel = 'manufacturer-public' | 'authorized-distributor-public';

/** メーカーまたは国内正規代理店が公開している価格表記。推測価格は登録しない。 */
export interface RobotPriceOffer {
  channel: RobotPriceChannel;
  /** 公式ページ上の価格を、意味を変えず短く整えた表示。 */
  display: string;
  amount?: number;
  currency?: string;
  taxStatus?: 'included' | 'excluded' | 'unknown';
  variant?: string;
  /** authorized-distributor-public では必須。 */
  sellerName?: string;
  /** 同じRobotのsourcesに存在するURL。 */
  sourceUrl: string;
}

export type RobotLoadScope =
  | 'single-arm'
  | 'dual-arm'
  | 'whole-body'
  | 'carrier'
  | 'manufacturer-wording';

export type RobotLoadRatingKind = 'rated' | 'maximum' | 'unspecified';

/** 対象範囲とrated/maximumを分離した荷重情報。旧payloadKgを自動変換しない。 */
export interface RobotLoadRating {
  scope: RobotLoadScope;
  rating: RobotLoadRatingKind;
  kg: number;
  condition?: string;
  variant?: string;
  /** 同じRobotのsourcesに存在するURL。 */
  sourceUrl: string;
}

export type RobotEvidenceField = SpecKey | 'priceOffers' | 'loadRatings';
export type RobotFieldEvidence = Partial<Record<RobotEvidenceField, string[]>>;

export interface Robot extends BaseRecord {
  name: string;
  nameJa?: string;
  manufacturerId: Id;
  category: RobotCategory;
  description: string;
  /** 将来の掲載提携・有料スポンサード枠のための優先順位。値が小さいほど上位。未設定は非スポンサード扱い。 */
  featuredRank?: number;
  deploymentStage: DeploymentStage;
  /** 調達可能性の実態（出典で裏取りできる場合のみ設定）。未設定はUI非表示。 */
  marketAvailability?: MarketAvailability;
  /** @deprecated 新しい詳細ページでは表示しない。既存データ移行完了まで保持する。 */
  buyerReadiness: BuyerReadiness;
  /** 提供終了（archived）時の後継機。詳細・関連欄で「後継機: X」導線を出す。 */
  supersededById?: Id;
  specs: RobotSpecs;
  procurementModels: ProcurementModel[];
  priceOffers?: RobotPriceOffer[];
  /** @deprecated 新UIはpriceOffersのresolverを使う。全件移行完了まで保持する。 */
  priceNote?: string;
  loadRatings?: RobotLoadRating[];
  /** 仕様・価格・荷重を同じRobotのsources URLへ接続する。 */
  fieldEvidence?: RobotFieldEvidence;
  /** 詳細ページに表示する活用事例。値は同じRobotのsources URL、最大3件。 */
  usageExampleSourceUrls?: string[];
  japanAvailability: JapanAvailability;
  distributorJapan?: string;
  supportNote?: string;
  safetyNote?: string;
  vendorRiskNote?: string;
  /** 役割別の参考画像。表示可能な実画像だけをカード・詳細・比較で使う。 */
  images?: Partial<Record<ImageRole, ImageAsset>>;
  // 関連は逆向き(UseCase.candidateRobots[].robotId /
  // Article.relatedRobotIds)で導出する。
  /** 業種タグ（lib/tagRegistry.ts の kind:'industry' のvalue）。未設定=調査中扱い。 */
  industryTags?: TagValue<'industry'>[];
  /** タスクタグ（lib/tagRegistry.ts の kind:'task' のvalue）。未設定=調査中扱い。 */
  taskTags?: TagValue<'task'>[];
  /** @deprecated 新しい詳細ページでは表示しない。比較画面の移行完了まで保持する。 */
  comparison: ComparisonProfile;
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

export type CandidateEvidenceBasis =
  | 'deployment'
  | 'adjacent-deployment'
  | 'official-use-case'
  | 'product-capability'
  | 'market-signal'
  | 'editorial-watch';

export interface UseCaseCandidateRobot {
  robotId: Id;
  /** strong=実際の導入事例あり（deployments.tsで裏付け） / possible=スペック・位置付けは合うが実証未確認 / watch=初期段階・参考程度 */
  fit: CandidateFit;
  /** fit判断の根拠種別。強い主張ほど deployments.ts の明示idで裏付ける。 */
  basis: CandidateEvidenceBasis;
  /** deployments.ts の id。strong は同じ robotId・useCaseId の published deployment が必須。 */
  evidenceDeploymentIds?: Id[];
  /** 製品能力・市場シグナル等の根拠URL。原則 useCase.sources にも同じURLを載せる。 */
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
  /** 産業タブのグルーピング基準となる単一産業（正本）。lib/tagRegistry.tsの'industry'から選ぶ。 */
  primaryIndustry: TagValue<'industry'>;
  /** 検索・フィルタ用ファセット（複数産業にまたがる場合の補助）。 */
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
  | 'market-analysis'
  | 'manufacturer-guide'
  | 'robot-guide'
  | 'basics-guide';

/**
 * 記事のサブジェクト（何の話か）＝記事タブの分類。
 * type（フォーマット：どう書かれたか）とは独立した軸で、記事ごとに編集者が明示指定する。
 * UI専用の 'all' は含めない（棚タブ側 lib/articleShelves.ts の ArticleShelf で付与）。
 */
export type ArticleSection =
  | 'digest'
  | 'deployment'
  | 'business'
  | 'tech'
  | 'policy'
  | 'entertainment';

export type ArticleContentKind = 'editorial' | 'sample' | 'sponsored';

interface ArticleCommon extends BaseRecord {
  title: string;
  titleJa?: string;
  /** 第一軸の記事種別（必須）。一覧の絞り込み・編集方針の基準になる。 */
  category: ArticleCategory;
  /** editorial が通常記事。sample はUI確認用公開データとして sources 空を許容する。 */
  contentKind?: ArticleContentKind;
  publishedAt: ISODate;
  author?: string;
  /** 業種ファセット（lib/tagRegistry.ts の kind:'industry'）。検索・絞り込み用。未設定=該当なし。 */
  industryTags?: TagValue<'industry'>[];
  /** 地域ファセット（kind:'region'）。未設定=地域非依存。 */
  regionTags?: TagValue<'region'>[];
  /** 記事の論点ファセット（kind:'theme'、任意・0〜4個）。section（主題）と直交する角度。企業・機種はタグにせず relatedManufacturerIds/relatedRobotIds で表す。 */
  themeTags?: TagValue<'theme'>[];
  whyItMatters: string;
  keyTakeaways?: string[];
  featured?: boolean;
  /** 記事タブの分類（サブジェクト）。type とは独立した必須フィールド。 */
  section: ArticleSection;
  relatedRobotIds: Id[];
  relatedManufacturerIds: Id[];
  relatedUseCaseIds: Id[];
}

/**
 * 固定テンプレート本文を持つ記事種別の一覧。新しいテンプレート型（robot-guide 等）を実装したら
 * 必ずここに追加する。追加しないと新種別が StandardArticle（自由記述 body）として通ってしまう。
 */
export type TemplatedArticleType = 'manufacturer-guide';

/** テンプレート種別以外の記事。本文は自由記述の Markdown（`body`）。 */
export interface StandardArticle extends ArticleCommon {
  type: Exclude<ArticleType, TemplatedArticleType>;
  /** 記事本文（Markdown）。空ならレポート本文セクションは描画されない。 */
  body?: string;
}

/**
 * メーカー解説（manufacturer-guide）専用の固定テンプレート型。
 * 見出し・セクション順は lib/manufacturerGuideTemplate.ts の MANUFACTURER_GUIDE_SECTIONS が正本で、
 * 著者はセクションごとの中身（prose と評価/分類データ）だけを埋める。
 * テンプレートの意味づけは docs/planning/editorial_style_guide_v1.md §6-1 を参照。
 */
export type ManufacturerGuideDeploymentCategory =
  | 'researchEducation'
  | 'exhibitionDemo'
  | 'poc'
  | 'internalTrial'
  | 'commercial';

export type ManufacturerGuideDeploymentEvidence = 'confirmed' | 'limited' | 'none';

export interface ManufacturerGuideDeploymentItem {
  /** 視覚表示の正本（confirmed=チェックマーク付き強調 / limited=通常 / none=グレーアウト）。ステータス文言は持たず、何が確認できたかは body に直接書く。 */
  evidence: ManufacturerGuideDeploymentEvidence;
  body: string;
  /** 根拠URL。evidence が 'none' 以外は必須（validate で強制）。記事 sources[] に登録済みのURLと一致させる。 */
  sourceUrls?: string[];
}

export type ManufacturerGuideProcurementChannelKind =
  | 'official-direct'
  | 'domestic-distributor'
  | 'consultation';

/**
 * 購入・導入・相談セクションのチャネル1件。文章だけの窓口説明は禁止で、
 * 窓口は必ずこの構造化リストに載せる。Deploidの問い合わせ窓口はデータに含めず、
 * コンポーネント側で末尾に自動追加する。
 */
export interface ManufacturerGuideProcurementChannel {
  kind: ManufacturerGuideProcurementChannelKind;
  name: string;
  url: string;
  /** 役割の一言（販売のみか、導入支援・保守まで含むか）。読者がどこに相談すべきか判断できる粒度で書く。 */
  role: string;
}

/**
 * 製品ラインナップ表の1行。機体名・リンク・詳細はDB（robotId）から解決し、
 * 「どの検討者に関係するか」の一言と価格目安だけ記事側で編集する。
 */
export interface ManufacturerGuideLineupRow {
  robotId: Id;
  /** 読者向けの位置づけ一言（例: 研究・教育・PoCの標準候補） */
  roleLabel: string;
  /** 価格目安（例: '$13,500〜'）。ロボット詳細の priceNote と矛盾させない。未確認は '要確認' */
  priceLabel: string;
}

export interface ManufacturerGuideFaqItem {
  question: string;
  /** 回答（Markdown可・見出し不可）。既出セクションの要約＋出典済み事実のみで書く。 */
  answer: string;
}

/**
 * 埋め込み動画。ファイルは複製せずYouTube側から配信させる（facadeで遅延読み込み）。
 * 埋め込みが許可されている公式チャンネルの動画のみを対象にする（40-content-rights.md 準拠）。
 */
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
  /** 製品ラインナップ表（DB連携）。製品ラインナップセクション内にカード横スクロール＋表として描画される。 */
  lineup: ManufacturerGuideLineupRow[];
  /** 製品ラインナップセクションに表示する公式動画（任意・0〜数本）。 */
  videos?: ManufacturerGuideVideo[];
  history: string;
  /** 導入実績のリード文（1〜2文）。このメーカーの実績の業界内での位置だけを書く。表の後の要約文は持たない設計。 */
  deploymentIntro: string;
  /** 固定5分類・時系列順。Record なので1分類でも欠けるとコンパイルが通らない。 */
  deploymentStatus: Record<ManufacturerGuideDeploymentCategory, ManufacturerGuideDeploymentItem>;
  /** 購入・導入・相談のチャネルリスト。国内窓口が確認できない場合も公式問い合わせ窓口を必ず載せる。 */
  procurementChannels: ManufacturerGuideProcurementChannel[];
  /** 購入・導入・相談の文章部（確認事項とリスク）。輸出規制・制裁リスト等の調達リスクはここに書く。 */
  japanProcurement: string;
  /** よくある質問。FAQPage 構造化データにも使われる。 */
  faq: ManufacturerGuideFaqItem[];
}

export interface ManufacturerGuideArticle extends ArticleCommon {
  type: 'manufacturer-guide';
  manufacturerGuideContent: ManufacturerGuideContent;
  /** レンダラーが要点(TL;DR)ブロックを持たない設計のため、設定してもレンダリングされない。型で禁止する。 */
  keyTakeaways?: never;
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
  /** この導入事例が裏付けとなる用途（data/useCases.ts の id）。無理な紐付けはしない＝任意項目 */
  relatedUseCaseIds?: Id[];
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
  useCases: UseCase[];
  articles: Article[];
}
