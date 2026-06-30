import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { UseCasesBrowser } from '@/components/UseCasesBrowser';
import { getDeploymentsForUseCase, getUseCases } from '@/lib/data';
import { createPageMetadata } from '@/lib/metadata';
import { createUseCaseSearchIndex, searchUseCaseSlugs } from '@/lib/searchIndex';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';
import {
  getTagLabel,
  getUseCaseDomainOptions,
  getUseCaseIndustryTagOptions,
  getUseCaseTaskTagOptions,
} from '@/lib/tags';
import { getUseCaseFilterResult, normalizeUseCaseFilters } from '@/lib/useCaseFilters';
import { getUseCaseCardEvidenceSummary } from '@/lib/useCaseEvidence';

const defaultTitle = '用途から探す';
const defaultDescription =
  'やりたい作業の得意分野・業種・タスクから現実的なヒューマノイドの適用機会を探す。ベンダー名ではなく現場の課題から始めます。';

function resolveFilters(
  useCases: ReturnType<typeof getUseCases>,
  params: { industry: string | null; task: string | null; domain: string | null; q: string | null },
) {
  return normalizeUseCaseFilters({
    industry: params.industry,
    task: params.task,
    domain: params.domain,
    query: params.q,
    industryValues: getUseCaseIndustryTagOptions(useCases).map((option) => option.value),
    taskValues: getUseCaseTaskTagOptions(useCases).map((option) => option.value),
    domainValues: getUseCaseDomainOptions(useCases).map((option) => option.value),
  });
}

export async function generateMetadata({ searchParams }: { searchParams: RouteSearchParams }) {
  const params = await pickSearchParams(searchParams, ['industry', 'task', 'domain', 'q'] as const);
  const useCases = getUseCases();
  const filters = resolveFilters(useCases, params);
  const matchedSlugs = searchUseCaseSlugs(createUseCaseSearchIndex(useCases), filters.query);
  const { filtered } = getUseCaseFilterResult(useCases, filters, matchedSlugs);

  const tagLabels = [
    filters.domain ? getTagLabel(filters.domain, 'use-case-domain') : null,
    filters.industry ? getTagLabel(filters.industry, 'industry') : null,
    filters.task ? getTagLabel(filters.task, 'task') : null,
  ].filter((label): label is string => Boolean(label));

  return createPageMetadata({
    title: tagLabels.length > 0 ? `${tagLabels.join('×')} × ヒューマノイド活用事例` : defaultTitle,
    description:
      tagLabels.length > 0
        ? `${tagLabels.join('×')}領域でヒューマノイドが適用できる業務・候補ロボットを整理する。`
        : defaultDescription,
    path: '/use-cases',
    noindex: filtered.length === 0,
  });
}

async function UseCasesContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const params = await pickSearchParams(searchParams, ['industry', 'task', 'domain', 'q'] as const);
  const useCases = getUseCases();
  const cardEvidenceByUseCaseId = Object.fromEntries(
    useCases.map((useCase) => [
      useCase.id,
      getUseCaseCardEvidenceSummary(useCase, {
        hasDeployments: getDeploymentsForUseCase(useCase.id).length > 0,
      }),
    ]),
  );
  return (
    <UseCasesBrowser
      useCases={useCases}
      initialFilters={resolveFilters(useCases, params)}
      cardEvidenceByUseCaseId={cardEvidenceByUseCaseId}
    />
  );
}

export default function UseCasesPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <UseCasesContent searchParams={searchParams} />
    </Suspense>
  );
}
