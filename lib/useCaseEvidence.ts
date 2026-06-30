import type {
  CandidateEvidenceBasis,
  CandidateFit,
  DeploymentSite,
  Source,
  UseCase,
  UseCaseCandidateRobot,
} from '../data/types.ts';
import { candidateFitLabels } from './labels.ts';
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

export const candidateEvidenceBasisLabels = {
  deployment: '導入事例あり',
  'official-use-case': '公式用途あり',
  'adjacent-deployment': '隣接実証あり',
  'product-capability': '製品能力のみ',
  'market-signal': '市場シグナル',
  'editorial-watch': '調査待ち',
} as const satisfies Record<CandidateEvidenceBasis, string>;

export interface CandidateEvidenceLink {
  href: string;
  label: string;
}

export interface UseCaseCandidateEvidenceViewModel {
  fit: CandidateFit;
  fitLabel: string;
  basis: CandidateEvidenceBasis;
  reason: string;
  evidenceLinks: CandidateEvidenceLink[];
}

export interface UseCaseCardEvidenceSummary {
  label: string;
  tone: 'success' | 'info' | 'neutral';
}

export type DeploymentResolver = (id: string) => DeploymentSite | undefined;

function formatDeploymentEvidenceLabel(customer: string, siteName?: string) {
  return siteName ? `事例: ${customer} ${siteName}` : `事例: ${customer}`;
}

function formatSourceEvidenceLabel(source: Source | undefined, url: string) {
  return `公式: ${source?.publisher ?? source?.title ?? new URL(url).hostname}`;
}

export function getUseCaseCandidateEvidenceViewModel(
  candidate: UseCaseCandidateRobot,
  sourceByUrl: ReadonlyMap<string, Source>,
  resolveDeployment: DeploymentResolver,
): UseCaseCandidateEvidenceViewModel {
  const deploymentEvidenceLinks = (candidate.evidenceDeploymentIds ?? []).flatMap((deploymentId) => {
    const deployment = resolveDeployment(deploymentId);
    const source = deployment?.sources[0];
    if (!deployment || !source) return [];
    return [
      {
        href: source.url,
        label: formatDeploymentEvidenceLabel(deployment.customer, deployment.siteName),
      },
    ];
  });
  const sourceEvidenceLinks = (candidate.evidenceSourceUrls ?? []).map((url) => ({
    href: url,
    label: formatSourceEvidenceLabel(sourceByUrl.get(url), url),
  }));

  return {
    fit: candidate.fit,
    fitLabel: candidateFitLabels[candidate.fit],
    basis: candidate.basis,
    reason: candidate.reason,
    evidenceLinks: [...deploymentEvidenceLinks, ...sourceEvidenceLinks],
  };
}

export function getUseCaseCandidateEvidenceByRobotId(
  useCase: UseCase,
  resolveDeployment: DeploymentResolver,
) {
  const sourceByUrl = new Map(useCase.sources.map((source) => [source.url, source]));
  return Object.fromEntries(
    useCase.candidateRobots.map((candidate) => [
      candidate.robotId,
      getUseCaseCandidateEvidenceViewModel(candidate, sourceByUrl, resolveDeployment),
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
