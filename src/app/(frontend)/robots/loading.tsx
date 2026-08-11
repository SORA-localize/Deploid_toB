import { CardGridSkeleton } from '@/components/CardGridSkeleton';
import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';

export default function Loading() {
  return (
    <ListPageSkeletonShell>
      <CardGridSkeleton gridClassName={`mt-8 ${browserGridClassNames.robots}`} />
    </ListPageSkeletonShell>
  );
}
