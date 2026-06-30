import type {
  BuyerReadiness,
  CompanyStatus,
  DeploymentStage,
  DeploymentStatus,
  JapanAvailability,
  JapanPresence,
  PublishStatus,
  Reliability,
  ArticleType,
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
  neutral: 'border-border bg-muted text-muted-foreground',
  brand: 'border-border bg-muted text-foreground',
  info: 'border-border bg-muted text-foreground',
  success: 'border-border bg-muted text-foreground',
  warning: 'border-border bg-muted text-foreground',
  danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  unknown: 'border-border bg-card text-muted-foreground',
  favorite: 'border-border bg-muted text-foreground',
} as const satisfies Record<VisualTone, string>;

export const visualToneTextClassNames = {
  neutral: 'text-muted-foreground',
  brand: 'text-foreground',
  info: 'text-foreground',
  success: 'text-foreground',
  warning: 'text-foreground',
  danger: 'text-destructive',
  unknown: 'text-muted-foreground',
  favorite: 'text-foreground',
} as const satisfies Record<VisualTone, string>;

export const visualToneSolidClassNames = {
  neutral: 'border-primary bg-primary text-primary-foreground',
  brand: 'border-primary bg-primary text-primary-foreground',
  info: 'border-primary bg-primary text-primary-foreground',
  success: 'border-primary bg-primary text-primary-foreground',
  warning: 'border-primary bg-primary text-primary-foreground',
  danger: 'border-destructive bg-destructive text-destructive-foreground',
  unknown: 'border-foreground bg-foreground text-background',
  favorite: 'border-primary bg-primary text-primary-foreground',
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

export const articleTypeTones = {
  analysis: 'brand',
  'deployment-report': 'success',
  interview: 'info',
  'event-report': 'neutral',
  'policy-update': 'warning',
  'case-study': 'success',
  'news-brief': 'neutral',
  'tech-update': 'info',
  'market-analysis': 'brand',
} as const satisfies Record<ArticleType, VisualTone>;

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
  industry: 'info',
  task: 'neutral',
  'use-case-domain': 'brand',
  region: 'info',
  theme: 'neutral',
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
export const getArticleTypeTone = (type: ArticleType) => articleTypeTones[type];
export const getUseCaseMaturityTone = (maturity: UseCaseMaturity) =>
  useCaseMaturityTones[maturity];
export const getDeploymentStatusTone = (status: DeploymentStatus) => deploymentStatusTones[status];
export const getTagKindTone = (kind: TagKind) => tagKindTones[kind];
