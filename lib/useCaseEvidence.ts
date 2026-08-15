import type {
  CandidateEvidenceBasis,
  DeploymentSite,
  Source,
  UseCase,
  UseCaseCandidateRobot,
} from '@/lib/content/domainTypes';
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
  const manufacturerName = candidate.robotId ? resolveRobotManufacturerName?.(candidate.robotId) : undefined;
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
  // `seriesId` 候補（robotIdを持たない）はrobotId単位のこのmapへは載らない（DEC-S08、series単位の
  // 候補UIはこのヘルパーの対象外）。
  return Object.fromEntries(
    useCase.candidateRobots
      .filter((candidate): candidate is UseCaseCandidateRobot & { robotId: string } => candidate.robotId !== undefined)
      .map((candidate) => [
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
