import { UseCasesBrowser } from '@/components/UseCasesBrowser';
import { getUseCases } from '@/lib/data';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';
import { getTagLabel } from '@/lib/tags';
import { getUseCaseFilterResult, normalizeUseCaseFilters } from '@/lib/useCaseFilters';

const defaultTitle = '用途から探す';
const defaultDescription =
  '業種・ワークフロー・タスクから現実的なヒューマノイドの適用機会を探す。ベンダー名ではなく現場の課題から始めます。';

export async function generateMetadata({ searchParams }: { searchParams: RouteSearchParams }) {
  const params = await pickSearchParams(searchParams, ['mode', 'industry', 'task', 'q'] as const);
  const filters = normalizeUseCaseFilters({
    mode: params.mode,
    industry: params.industry,
    task: params.task,
    query: params.q,
  });
  const { filtered } = getUseCaseFilterResult(getUseCases(), filters);

  const tagLabel = filters.industry
    ? getTagLabel(filters.industry, 'industry')
    : filters.task
      ? getTagLabel(filters.task, 'task')
      : null;

  return createPageMetadata({
    title: tagLabel ? `${tagLabel} × ヒューマノイド活用事例` : defaultTitle,
    description: tagLabel
      ? `${tagLabel}領域でヒューマノイドが適用できる業務・候補ロボットを整理する。`
      : defaultDescription,
    path: '/use-cases',
    noindex: filtered.length === 0,
  });
}

export default async function UseCasesPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  const params = await pickSearchParams(searchParams, ['mode', 'industry', 'task', 'q'] as const);
  return (
    <UseCasesBrowser
      useCases={getUseCases()}
      initialFilters={normalizeUseCaseFilters({
        mode: params.mode,
        industry: params.industry,
        task: params.task,
        query: params.q,
      })}
    />
  );
}
