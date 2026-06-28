import type { CandidateEvidenceBasis } from '../data/types.ts';

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
