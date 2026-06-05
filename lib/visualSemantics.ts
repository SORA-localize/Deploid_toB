import type {
  BuyerReadiness,
  CompanyStatus,
  DeploymentStage,
  DeploymentStatus,
  GuideStage,
  JapanAvailability,
  JapanPresence,
  PublishStatus,
  Reliability,
  ReportType,
  RightsStatus,
  UseCaseMaturity,
} from '@/data/types';
import type { TagKind } from '@/lib/tagRegistry';

export type VisualTone =
  | 'neutral'
  | 'brand'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'unknown'
  | 'favorite';

export const visualToneSoftClassNames = {
  neutral: 'border-tone-neutral-border bg-tone-neutral-bg text-tone-neutral-text',
  brand: 'border-tone-brand-border bg-tone-brand-bg text-tone-brand-text',
  info: 'border-tone-info-border bg-tone-info-bg text-tone-info-text',
  success: 'border-tone-success-border bg-tone-success-bg text-tone-success-text',
  warning: 'border-tone-warning-border bg-tone-warning-bg text-tone-warning-text',
  danger: 'border-tone-danger-border bg-tone-danger-bg text-tone-danger-text',
  unknown: 'border-tone-unknown-border bg-tone-unknown-bg text-tone-unknown-text',
  favorite: 'border-tone-favorite-border bg-tone-favorite-bg text-tone-favorite-text',
} as const satisfies Record<VisualTone, string>;

export const visualToneTextClassNames = {
  neutral: 'text-tone-neutral-text',
  brand: 'text-tone-brand-text',
  info: 'text-tone-info-text',
  success: 'text-tone-success-text',
  warning: 'text-tone-warning-text',
  danger: 'text-tone-danger-text',
  unknown: 'text-tone-unknown-text',
  favorite: 'text-tone-favorite-text',
} as const satisfies Record<VisualTone, string>;

export const visualToneSolidClassNames = {
  neutral: 'border-tone-neutral-text bg-tone-neutral-text text-background',
  brand: 'border-tone-brand-solid bg-tone-brand-solid text-brand-foreground',
  info: 'border-tone-info-solid bg-tone-info-solid text-white',
  success: 'border-tone-success-solid bg-tone-success-solid text-white',
  warning: 'border-tone-warning-solid bg-tone-warning-solid text-foreground',
  danger: 'border-tone-danger-solid bg-tone-danger-solid text-white',
  unknown: 'border-tone-unknown-text bg-tone-unknown-text text-background',
  favorite: 'border-tone-favorite-solid bg-tone-favorite-solid text-foreground',
} as const satisfies Record<VisualTone, string>;

export function getVisualToneClassName(tone: VisualTone) {
  return visualToneSoftClassNames[tone];
}

export function getVisualToneTextClassName(tone: VisualTone) {
  return visualToneTextClassNames[tone];
}

export function getVisualToneSolidClassName(tone: VisualTone) {
  return visualToneSolidClassNames[tone];
}

export const publishStatusTones = {
  draft: 'unknown',
  published: 'success',
  archived: 'neutral',
} as const satisfies Record<PublishStatus, VisualTone>;

export const reliabilityTones = {
  verified: 'success',
  official: 'brand',
  reported: 'info',
  estimated: 'warning',
} as const satisfies Record<Reliability, VisualTone>;

export const rightsStatusTones = {
  own: 'success',
  licensed: 'success',
  'commercial-permitted': 'success',
  'reference-attributed': 'info',
  'permission-requested': 'warning',
  'prototype-only': 'unknown',
  blocked: 'danger',
} as const satisfies Record<RightsStatus, VisualTone>;

export const deploymentStageTones = {
  concept: 'unknown',
  prototype: 'info',
  pilot: 'warning',
  'limited-production': 'success',
  production: 'success',
  'internal-use': 'unknown',
  discontinued: 'danger',
} as const satisfies Record<DeploymentStage, VisualTone>;

export const buyerReadinessTones = {
  'initial-adoption': 'info',
  'requires-poc': 'warning',
  'limited-today': 'unknown',
} as const satisfies Record<BuyerReadiness, VisualTone>;

export const japanAvailabilityTones = {
  'official-japan': 'success',
  'distributor-japan': 'success',
  'inquiry-required': 'warning',
  'import-only': 'info',
  unavailable: 'danger',
  unknown: 'unknown',
} as const satisfies Record<JapanAvailability, VisualTone>;

export const companyStatusTones = {
  active: 'success',
  stealth: 'unknown',
  acquired: 'info',
  inactive: 'danger',
} as const satisfies Record<CompanyStatus, VisualTone>;

export const japanPresenceTones = {
  office: 'success',
  distributor: 'success',
  partner: 'brand',
  remote: 'info',
  none: 'danger',
  unknown: 'unknown',
} as const satisfies Record<JapanPresence, VisualTone>;

export const guideStageTones = {
  learn: 'info',
  evaluate: 'warning',
  act: 'brand',
} as const satisfies Record<GuideStage, VisualTone>;

export const reportTypeTones = {
  analysis: 'brand',
  'deployment-report': 'success',
  interview: 'info',
  'event-report': 'neutral',
  'policy-update': 'warning',
  'case-study': 'success',
  'news-brief': 'neutral',
  'tech-update': 'info',
  'market-analysis': 'brand',
} as const satisfies Record<ReportType, VisualTone>;

export const useCaseMaturityTones = {
  'early-stage': 'unknown',
  'pilot-phase': 'warning',
  'production-ready': 'success',
} as const satisfies Record<UseCaseMaturity, VisualTone>;

export const deploymentStatusTones = {
  announced: 'info',
  pilot: 'warning',
  production: 'success',
  ended: 'neutral',
  unknown: 'unknown',
} as const satisfies Record<DeploymentStatus, VisualTone>;

export const tagKindTones = {
  report: 'neutral',
  'guide-topic': 'brand',
  industry: 'info',
  task: 'neutral',
} as const satisfies Record<TagKind, VisualTone>;

export const getPublishStatusTone = (status: PublishStatus) => publishStatusTones[status];
export const getReliabilityTone = (reliability: Reliability) => reliabilityTones[reliability];
export const getRightsStatusTone = (status: RightsStatus) => rightsStatusTones[status];
export const getDeploymentStageTone = (stage: DeploymentStage) => deploymentStageTones[stage];
export const getBuyerReadinessTone = (readiness: BuyerReadiness) => buyerReadinessTones[readiness];
export const getJapanAvailabilityTone = (availability: JapanAvailability) =>
  japanAvailabilityTones[availability];
export const getCompanyStatusTone = (status: CompanyStatus) => companyStatusTones[status];
export const getJapanPresenceTone = (presence: JapanPresence) => japanPresenceTones[presence];
export const getGuideStageTone = (stage: GuideStage) => guideStageTones[stage];
export const getReportTypeTone = (type: ReportType) => reportTypeTones[type];
export const getUseCaseMaturityTone = (maturity: UseCaseMaturity) =>
  useCaseMaturityTones[maturity];
export const getDeploymentStatusTone = (status: DeploymentStatus) => deploymentStatusTones[status];
export const getTagKindTone = (kind: TagKind) => tagKindTones[kind];
