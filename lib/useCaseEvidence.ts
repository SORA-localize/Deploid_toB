import type {
  CandidateEvidenceBasis,
  DeploymentSite,
  Source,
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
export type SourceResolver = (url: string) => Source | undefined;

function formatSourceEvidenceLabel(source: Source | undefined, manufacturerName?: string) {
  const name = source?.publisher ?? source?.title ?? manufacturerName;
  return name ? `メーカーHP：${name}` : 'メーカーHP';
}

export function getUseCaseCandidateEvidenceViewModel(
  candidate: UseCaseCandidateRobot,
  resolveDeployment: DeploymentResolver,
  resolveRobotManufacturerName?: RobotManufacturerNameResolver,
  resolveSource?: SourceResolver,
): UseCaseCandidateEvidenceViewModel {
  const deploymentEvidenceLinks = (candidate.evidenceDeploymentIds ?? []).flatMap((deploymentId) => {
    const deployment = resolveDeployment(deploymentId);
    const source = deployment?.sources[0];
    if (!deployment || !source) return [];
    return [{ href: source.url, label: '導入事例' }];
  });
  const manufacturerName = resolveRobotManufacturerName?.(candidate.robotId);
  const sourceEvidenceLinks = (candidate.evidenceSourceUrls ?? []).map((url) => ({
    href: url,
    label: formatSourceEvidenceLabel(resolveSource?.(url), manufacturerName),
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
  const sourceByUrl = new Map(useCase.sources.map((s) => [s.url, s]));
  const resolveSource: SourceResolver = (url) => sourceByUrl.get(url);
  return Object.fromEntries(
    useCase.candidateRobots.map((candidate) => [
      candidate.robotId,
      getUseCaseCandidateEvidenceViewModel(
        candidate,
        resolveDeployment,
        resolveRobotManufacturerName,
        resolveSource,
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
