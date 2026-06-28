import type {
  BuyerReadiness,
  CandidateFit,
  Capability,
  CompanyStatus,
  CompanyType,
  ContactInquiryType,
  DeploymentStage,
  DeploymentStatus,
  ImageRole,
  JapanAvailability,
  JapanPresence,
  MobilityType,
  OperatingEnvironment,
  ProcurementModel,
  Reliability,
  ArticleSection,
  ArticleCategory,
  ArticleType,
  RobotCategory,
  UseCaseMaturity,
  UseCaseCapabilityNotes,
} from '@/data/types';

export const TBD_LABEL = '要確認';

/** 詳細ページのカルーセルで固定表示する画像スロットの順序。 */
export const imageRoleOrder: ImageRole[] = [
  'hero',
  'transparent',
  'side',
  'inOperation',
  'scale',
  'endEffector',
  'mobility',
];

/** カルーセルのempty state（写真未投入時のラベル）と、タブ表記。 */
export const imageRoleLabels: Record<ImageRole, string> = {
  hero: 'メイン画像',
  transparent: '背景透過',
  side: '側面',
  inOperation: '稼働シーン',
  scale: 'サイズ比較',
  endEffector: 'ハンド・把持部',
  mobility: '移動機構',
};

export const buyerReadinessLabels: Record<BuyerReadiness, string> = {
  'initial-adoption': '初期導入向き',
  'requires-poc': '要PoC',
  'limited-today': '現時点では限定的',
};

export const candidateFitLabels: Record<CandidateFit, string> = {
  strong: '導入事例あり',
  possible: '根拠あり',
  watch: '要確認',
};

export const deploymentStageLabels: Record<DeploymentStage, string> = {
  concept:              '構想段階',
  prototype:            '試作段階',
  pilot:                '実証展開中',
  'limited-production': '限定販売中',
  production:           '量産・商用化',
  'internal-use':       '自社利用のみ',
  discontinued:         '生産終了',
};

export const deploymentStatusLabels: Record<DeploymentStatus, string> = {
  announced: '発表のみ',
  pilot:     '実証・PoC中',
  production: '本番運用中',
  ended:     '終了',
  unknown:   '不明',
};

export const robotCategoryLabels: Record<RobotCategory, string> = {
  humanoid: 'ヒューマノイド',
  'general-purpose-robot': '汎用ロボット',
  'upper-body-humanoid': '上半身型',
  'mobile-manipulator': '移動マニピュレータ',
  other: 'その他',
};

export const japanAvailabilityLabels: Record<JapanAvailability, string> = {
  'official-japan':    '国内正規販売あり',
  'distributor-japan': '国内代理店あり',
  'inquiry-required':  '要問い合わせ',
  'import-only':       '個人輸入のみ',
  unavailable:         '国内未対応',
  unknown:             '情報なし',
};

export const procurementLabels: Record<ProcurementModel, string> = {
  purchase: '買い切り',
  lease: 'リース',
  raas: 'RaaS',
  subscription: 'サブスク',
  'partner-program': '提携/実証',
  'not-for-sale': '一般販売なし',
  inquiry: '問い合わせ',
};

export const mobilityLabels: Record<MobilityType, string> = {
  biped: '二足',
  wheeled: '車輪',
  hybrid: 'ハイブリッド',
  stationary: '据置',
};

export const companyTypeLabels: Record<CompanyType, string> = {
  manufacturer: 'メーカー',
  distributor: '代理店',
  integrator: 'SIer',
  'ai-os': 'AI/OS',
  research: '研究組織',
};

export const companyStatusLabels: Record<CompanyStatus, string> = {
  active: '稼働中',
  stealth: 'ステルス',
  acquired: '買収済み',
  inactive: '非活動',
};

export const japanPresenceLabels: Record<JapanPresence, string> = {
  office: '日本拠点あり',
  distributor: '国内代理店あり',
  partner: '国内パートナーあり',
  remote: '海外から対応',
  none: '国内体制なし',
  unknown: '要確認',
};

export const articleCategoryLabels: Record<ArticleCategory, string> = {
  news: 'ニュース',
  interview: 'インタビュー',
  'company-report': '企業レポート',
  analysis: '分析',
  policy: '政策・規制',
};

export const articleTypeLabels: Record<ArticleType, string> = {
  analysis: '分析',
  'deployment-report': '導入レポート',
  interview: '取材',
  'event-report': 'イベント',
  'policy-update': '政策/規制',
  'case-study': '事例',
  'news-brief': 'ニュースメモ',
  'tech-update': 'テックアップデート',
  'market-analysis': '市場分析',
};

export const articleSectionLabels: Record<ArticleSection, string> = {
  deployment: '導入・事例',
  business: '市場・動向',
  tech: '技術・製品',
  policy: '政策・規制',
  entertainment: '話題・その他',
};

export const maturityLabels: Record<UseCaseMaturity, string> = {
  'early-stage': '初期検討',
  'pilot-phase': 'PoC・実証',
  'production-ready': '実運用候補',
};

export const operatingEnvironmentLabels: Record<OperatingEnvironment, string> = {
  'indoor-controlled': '屋内（管理環境）',
  'indoor-semi-controlled': '屋内（半管理環境）',
  outdoor: '屋外',
  mixed: '混在環境',
  hazardous: '危険環境',
};

export const capabilityLabels: Record<Capability, string> = {
  mobility: '移動',
  manipulation: 'マニピュレーション',
  perception: '知覚',
  autonomy: '自律',
  communication: 'コミュニケーション',
  'data-capture': 'データ取得',
  integration: '連携',
};

export const useCaseCapabilityNoteLabels: Array<[keyof UseCaseCapabilityNotes, string]> = [
  ['mobility', '移動'],
  ['manipulation', 'マニピュレーション'],
  ['perception', '知覚'],
  ['autonomy', '自律 / 遠隔操作'],
  ['communication', 'コミュニケーション'],
  ['integration', '連携'],
];

export const reliabilityLabels: Record<Reliability, string> = {
  verified: '直接確認',
  official: '公式情報',
  reported: '報道/調査',
  estimated: '推定',
};

export const contactInquiryTypeOptions: ReadonlyArray<{ value: ContactInquiryType; label: string }> = [
  { value: 'data-correction',       label: '情報提供・修正' },
  { value: 'listing-request',       label: '掲載相談' },
  { value: 'interview-request',     label: '取材相談' },
  { value: 'adoption-consultation', label: '導入相談' },
  { value: 'other',                 label: 'その他' },
];
