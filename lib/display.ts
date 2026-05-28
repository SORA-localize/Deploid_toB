import type { DeploymentStage, GuideStage, ReportType } from '@/data/types';

export const guideStageOrder: GuideStage[] = ['learn', 'evaluate', 'act'];

export const reportTypeOrder: ReportType[] = [
  'analysis',
  'deployment-report',
  'interview',
  'event-report',
  'policy-update',
  'case-study',
  'news-brief',
];

const preReleaseDeploymentStages: DeploymentStage[] = ['concept', 'prototype'];

export function isPreReleaseDeploymentStage(stage: DeploymentStage) {
  return preReleaseDeploymentStages.includes(stage);
}
