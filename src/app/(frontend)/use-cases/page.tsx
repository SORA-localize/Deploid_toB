import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { UseCaseCardGridSkeleton } from '@/components/UseCaseCardGridSkeleton';
import { UseCasesBrowser } from '@/components/UseCasesBrowser';
import { contentTags } from '@/lib/content/cacheTags';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { createUseCaseCatalogItems } from '@/lib/viewModels/useCases';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { toInitialSearch } from '@/lib/catalog/urlSearch';
import { createPageMetadata } from '@/lib/metadata';
import { createUseCaseSearchIndex, searchUseCaseSlugs } from '@/lib/searchIndex';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';
import { getTagLabel, toTagOptions } from '@/lib/tags';
import { getUseCaseFilterResult, normalizeUseCaseFilters } from '@/lib/useCaseFilters';

const defaultTitle = '用途から探す';
const defaultDescription =
  '産業・現場タスクからヒューマノイドの実適用シーンを探す。実導入事例の有無を明示しています。';

async function buildUseCaseItems() {
  const repository = await getContentRepository();
  const [useCases, robots] = await Promise.all([
    repository.listAllPublishedUseCases(),
    repository.listAllPublishedRobots(),
  ]);
  const deploymentCounts = await Promise.all(
    useCases.map((useCase) => repository.listDeploymentsForUseCaseId(useCase.id)),
  );
  const hasDeploymentsByUseCaseId = new Map(
    useCases.map((useCase, index) => [useCase.id, deploymentCounts[index]!.length > 0]),
  );
  return createUseCaseCatalogItems(useCases, robots, {
    hasDeployments: (useCaseId) => hasDeploymentsByUseCaseId.get(useCaseId) ?? false,
  });
}

function resolveFilters(
  useCases: Awaited<ReturnType<typeof buildUseCaseItems>>,
  params: { industry: string | null; task: string | null; q: string | null },
) {
  return normalizeUseCaseFilters({
    industry: params.industry,
    task: params.task,
    query: params.q,
    industryValues: toTagOptions(
      useCases.flatMap((useCase) => useCase.filter.industryTags),
      'industry',
    ).map((option) => option.value),
    taskValues: toTagOptions(
      useCases.flatMap((useCase) => useCase.filter.taskTags),
      'task',
    ).map((option) => option.value),
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
  const useCases = await buildUseCaseItems();
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
  // UseCase一覧の依存表（`lib/content/cacheDependencies.ts`）。briefの依存表は
  // useCases/mediaのみだが、実装（`buildUseCaseItems`）はcardへrobot名（`robotNames`）と
  // 導入実績有無（`hasDeployments`、`listDeploymentsForUseCaseId`）も埋め込んでいるため、
  // それらのtagも足す（brief: 「各cached関数は実際に読む依存先をすべてtag付けする」）。
  // `media`は含めない——`Media` collectionはサイト上のどのpageからも読まれておらず
  // （fix round 1 / Critical 2と同じ理由）、`KNOWN_GAPS`の既知の例外。
  cacheTag(contentTags.useCases);
  cacheTag(contentTags.robots);
  cacheTag(contentTags.deployments);

  return (
    <UseCasesBrowser
      useCases={await buildUseCaseItems()}
      initialSearch={toInitialSearch({ industry, task, q: query })}
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
