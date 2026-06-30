import type {
  CandidateEvidenceBasis,
  DeploymentSite,
  UseCase,
  UseCaseCandidateRobot,
} from '../data/types.ts';
import { uiText } from './uiText.ts';

export const publicUseCaseCandidateBases = [
  'deployment',
  'official-use-case',
  'adjacent-deployment',
] as const satisfies readonly CandidateEvidenceBasis[];

const publicUseCaseCandidateBasisSet = new Set<CandidateEvidenceBasis>(publicUseCaseCandidateBases);

export function isPublicUseCaseCandidateBasis(basis: CandidateEvidenceBasis): boolean {
  return publicUseCaseCandidateBasisSet.has(basis);
}

export interface CandidateEvidenceLink {
  href: string;
  label: string;
}

export interface UseCaseCandidateEvidenceViewModel {
  reason: string;
  evidenceLinks: CandidateEvidenceLink[];
}

export interface UseCaseCardEvidenceSummary {
  label: string;
  tone: 'success' | 'info' | 'neutral';
}

export type DeploymentResolver = (id: string) => DeploymentSite | undefined;
export type RobotManufacturerNameResolver = (robotId: string) => string | undefined;

function formatDeploymentEvidenceLabel() {
  return '導入事例';
}

function formatSourceEvidenceLabel(manufacturerName?: string) {
  return manufacturerName ? `メーカーHP：${manufacturerName}` : 'メーカーHP';
}

export function getUseCaseCandidateEvidenceViewModel(
  candidate: UseCaseCandidateRobot,
  resolveDeployment: DeploymentResolver,
  resolveRobotManufacturerName?: RobotManufacturerNameResolver,
): UseCaseCandidateEvidenceViewModel {
  const deploymentEvidenceLinks = (candidate.evidenceDeploymentIds ?? []).flatMap((deploymentId) => {
    const deployment = resolveDeployment(deploymentId);
    const source = deployment?.sources[0];
    if (!deployment || !source) return [];
    return [
      {
        href: source.url,
        label: formatDeploymentEvidenceLabel(),
      },
    ];
  });
  const sourceEvidenceLinks = (candidate.evidenceSourceUrls ?? []).map((url) => ({
    href: url,
    label: formatSourceEvidenceLabel(resolveRobotManufacturerName?.(candidate.robotId)),
  }));

  return {
    reason: candidate.reason,
    evidenceLinks: [...deploymentEvidenceLinks, ...sourceEvidenceLinks],
  };
}

export function getUseCaseCandidateEvidenceByRobotId(
  useCase: UseCase,
  resolveDeployment: DeploymentResolver,
  resolveRobotManufacturerName?: RobotManufacturerNameResolver,
) {
  return Object.fromEntries(
    useCase.candidateRobots.map((candidate) => [
      candidate.robotId,
      getUseCaseCandidateEvidenceViewModel(
        candidate,
        resolveDeployment,
        resolveRobotManufacturerName,
      ),
    ]),
  );
}

export function getUseCaseCardEvidenceSummary({
  hasDeployments,
}: {
  hasDeployments: boolean;
}): UseCaseCardEvidenceSummary | undefined {
  if (hasDeployments) return { label: uiText.useCases.evidenceSummary.deployment, tone: 'success' };
  return undefined;
}
