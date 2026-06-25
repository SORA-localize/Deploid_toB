import type { UseCase } from '@/data/types';
import {
  buyerReadinessLabels,
  capabilityLabels,
  maturityLabels,
  operatingEnvironmentLabels,
} from '@/lib/labels';
import { getTagLabel } from '@/lib/tags';
import { uiText } from '@/lib/uiText';

export interface UseCaseFactRow {
  key: string;
  label: string;
  value: string;
}

export function getUseCaseDomainLabel(
  useCase: UseCase,
  options: { includeSecondaryDomains?: boolean } = {},
) {
  const primaryLabel = getTagLabel(useCase.primaryDomain, 'use-case-domain');
  if (!options.includeSecondaryDomains) return primaryLabel;

  const secondaryLabels = (useCase.secondaryDomains ?? []).map((domain) =>
    getTagLabel(domain, 'use-case-domain'),
  );
  if (secondaryLabels.length === 0) return primaryLabel;

  return `${primaryLabel}（＋${secondaryLabels.join('、')}）`;
}

export function getUseCaseSummaryFacts(useCase: UseCase): UseCaseFactRow[] {
  return [
    {
      key: 'domain',
      label: uiText.useCases.overviewFields.domain,
      value: getUseCaseDomainLabel(useCase),
    },
    {
      key: 'maturity',
      label: uiText.useCases.overviewFields.maturity,
      value: maturityLabels[useCase.maturityLevel],
    },
    {
      key: 'buyer-readiness',
      label: uiText.useCases.overviewFields.buyerReadiness,
      value: buyerReadinessLabels[useCase.buyerReadiness],
    },
  ];
}

export function getUseCaseOverviewFacts(useCase: UseCase): UseCaseFactRow[] {
  return [
    {
      key: 'domain',
      label: uiText.useCases.overviewFields.domain,
      value: getUseCaseDomainLabel(useCase, { includeSecondaryDomains: true }),
    },
    {
      key: 'maturity',
      label: uiText.useCases.overviewFields.maturity,
      value: maturityLabels[useCase.maturityLevel],
    },
    {
      key: 'buyer-readiness',
      label: uiText.useCases.overviewFields.buyerReadiness,
      value: buyerReadinessLabels[useCase.buyerReadiness],
    },
    {
      key: 'environment',
      label: uiText.useCases.overviewFields.environment,
      value: operatingEnvironmentLabels[useCase.environment],
    },
    {
      key: 'required-capabilities',
      label: uiText.useCases.overviewFields.requiredCapabilities,
      value: useCase.requiredCapabilities.map((capability) => capabilityLabels[capability]).join(', '),
    },
  ];
}
