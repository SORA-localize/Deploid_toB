import { UseCasesBrowser } from '@/components/UseCasesBrowser';
import { ComingSoonGate } from '@/components/ComingSoonGate';
import { getUseCases } from '@/lib/data';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';
import { normalizeUseCaseFilters } from '@/lib/useCaseFilters';

export const metadata = createPageMetadata({
  title: '用途から探す',
  description:
    '業種・ワークフロー・タスクから現実的なヒューマノイドの適用機会を探す。ベンダー名ではなく現場の課題から始めます。',
  path: '/use-cases',
});

export default async function UseCasesPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  const params = await pickSearchParams(searchParams, ['mode', 'industry', 'task', 'q'] as const);
  return (
    <ComingSoonGate storageKey="coming-soon:use-cases" title="用途から探すは近日公開予定です">
      <UseCasesBrowser
        useCases={getUseCases()}
        initialFilters={normalizeUseCaseFilters({
          mode: params.mode,
          industry: params.industry,
          task: params.task,
          query: params.q,
        })}
      />
    </ComingSoonGate>
  );
}
