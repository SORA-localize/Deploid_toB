import type {
  BuyerReadiness,
  CompanyStatus,
  CompanyType,
  DeploymentStage,
  GuideStage,
  JapanAvailability,
  JapanPresence,
  MobilityType,
  ProcurementModel,
  Reliability,
  ReportType,
  UseCaseMaturity,
} from '@/data/types';

export const buyerReadinessLabels: Record<BuyerReadiness, string> = {
  'initial-adoption': '初期導入向き',
  'requires-poc': '要PoC',
  'limited-today': '現時点では限定的',
};

export const deploymentStageLabels: Record<DeploymentStage, string> = {
  concept: '構想段階',
  prototype: '試作段階',
  pilot: 'PoC / 実証',
  'limited-production': '限定生産',
  production: '本番運用',
  'internal-use': '社内利用中心',
  discontinued: '終了',
};

export const japanAvailabilityLabels: Record<JapanAvailability, string> = {
  'official-japan': '日本正式展開',
  'distributor-japan': '国内代理店あり',
  'inquiry-required': '問い合わせ確認',
  'import-only': '輸入前提',
  unavailable: '国内不可',
  unknown: '要確認',
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

export const guideStageLabels: Record<GuideStage, string> = {
  learn: '知る',
  evaluate: '判断する',
  act: '動く',
};

export const reportTypeLabels: Record<ReportType, string> = {
  analysis: '分析',
  'deployment-report': '導入レポート',
  interview: '取材',
  'event-report': 'イベント',
  'policy-update': '政策/規制',
  'case-study': '事例',
  'news-brief': 'ニュースメモ',
};

export const maturityLabels: Record<UseCaseMaturity, string> = {
  'early-stage': 'Early Stage',
  'pilot-phase': 'Pilot Phase',
  'production-ready': 'Production Ready',
};

export const reliabilityLabels: Record<Reliability, string> = {
  verified: '直接確認',
  official: '公式情報',
  reported: '報道/調査',
  estimated: '推定',
};
