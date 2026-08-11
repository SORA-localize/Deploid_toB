import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { UseCaseCardGridSkeleton } from '@/components/UseCaseCardGridSkeleton';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';

export default function Loading() {
  return (
    <ListPageSkeletonShell>
      <div className="mt-8">
        <UseCaseCardGridSkeleton gridClassName={browserGridClassNames.useCases} />
      </div>
    </ListPageSkeletonShell>
  );
}
