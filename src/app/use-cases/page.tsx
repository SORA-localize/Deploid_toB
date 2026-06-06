import { Suspense } from 'react';
import { ComingSoonOverlay } from '@/components/ComingSoonOverlay';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { UseCasesBrowser } from '@/components/UseCasesBrowser';
import { getUseCases } from '@/lib/data';

export const metadata = {
  title: '用途から探す',
  description:
    '業種・ワークフロー・タスクから現実的なヒューマノイドの適用機会を探す。ベンダー名ではなく現場の課題から始めます。',
};

export default function UseCasesPage() {
  return (
    <ComingSoonOverlay>
      <Suspense fallback={<PageSuspenseFallback />}>
        <UseCasesBrowser useCases={getUseCases()} />
      </Suspense>
    </ComingSoonOverlay>
  );
}
