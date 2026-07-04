import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { UseCaseCardGridSkeleton } from '@/components/UseCaseCardGridSkeleton';

export default function Loading() {
  return (
    <ListPageSkeletonShell>
      <div className="mt-8">
        <UseCaseCardGridSkeleton gridClassName="grid auto-rows-fr grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4" />
      </div>
    </ListPageSkeletonShell>
  );
}
