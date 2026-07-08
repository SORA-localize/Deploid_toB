import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { UseCaseCardGridSkeleton } from '@/components/UseCaseCardGridSkeleton';
import { UseCasesBrowser } from '@/components/UseCasesBrowser';
import { getDeploymentsForUseCase, getRobots, getUseCases } from '@/lib/data';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { createPageMetadata } from '@/lib/metadata';
import { createUseCaseSearchIndex, searchUseCaseSlugs } from '@/lib/searchIndex';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';
import { getTagLabel, getUseCaseIndustryTagOptions, getUseCaseTaskTagOptions } from '@/lib/tags';
import { getUseCaseFilterResult, normalizeUseCaseFilters } from '@/lib/useCaseFilters';
import { getUseCaseCardEvidenceSummary } from '@/lib/useCaseEvidence';

const defaultTitle = '用途から探す';
const defaultDescription =
  '産業・現場タスクからヒューマノイドの実適用シーンを探す。実導入事例の有無を明示しています。';

function resolveFilters(
  useCases: ReturnType<typeof getUseCases>,
  params: { industry: string | null; task: string | null; q: string | null },
) {
  return normalizeUseCaseFilters({
    industry: params.industry,
    task: params.task,
    query: params.q,
    industryValues: getUseCaseIndustryTagOptions(useCases).map((option) => option.value),
    taskValues: getUseCaseTaskTagOptions(useCases).map((option) => option.value),
  });
}

function UseCasesPageSkeleton() {
  return (
    <ListPageSkeletonShell>
      <div className="mt-8">
        <UseCaseCardGridSkeleton gridClassName={browserGridClassNames.useCases} />
      </div>
    </ListPageSkeletonShell>
  );
}

export async function generateMetadata({ searchParams }: { searchParams: RouteSearchParams }) {
  const params = await pickSearchParams(searchParams, ['industry', 'task', 'q'] as const);
  const useCases = getUseCases();
  const filters = resolveFilters(useCases, params);
  const matchedSlugs = searchUseCaseSlugs(createUseCaseSearchIndex(useCases), filters.query);
  const { filtered } = getUseCaseFilterResult(useCases, filters, matchedSlugs);

  const tagLabels = [
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

async function CachedUseCasesList({
  industry,
  task,
  query,
}: {
  industry: string | null;
  task: string | null;
  query: string | null;
}) {
  'use cache';
  cacheLife('hours');
  cacheTag('use-cases-list');

  const useCases = getUseCases();
  const robotNameById = Object.fromEntries(
    getRobots().map((r) => [r.id, r.nameJa ?? r.name]),
  );
  const cardEvidenceByUseCaseId = Object.fromEntries(
    useCases.map((useCase) => [
      useCase.id,
      getUseCaseCardEvidenceSummary({
        hasDeployments: getDeploymentsForUseCase(useCase.id).length > 0,
      }),
    ]),
  );
  return (
    <UseCasesBrowser
      useCases={useCases}
      initialFilters={resolveFilters(useCases, { industry, task, q: query })}
      cardEvidenceByUseCaseId={cardEvidenceByUseCaseId}
      robotNameById={robotNameById}
    />
  );
}

async function UseCasesContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const params = await pickSearchParams(searchParams, ['industry', 'task', 'q'] as const);
  return (
    <CachedUseCasesList industry={params.industry} task={params.task} query={params.q} />
  );
}

export default function UseCasesPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  return (
    <Suspense fallback={<UseCasesPageSkeleton />}>
      <UseCasesContent searchParams={searchParams} />
    </Suspense>
  );
}
