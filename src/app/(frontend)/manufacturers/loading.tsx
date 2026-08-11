import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { ManufacturerCardGridSkeleton } from '@/components/ManufacturerCardGridSkeleton';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';

export default function Loading() {
  return (
    <ListPageSkeletonShell>
      <ManufacturerCardGridSkeleton gridClassName={`mt-8 ${browserGridClassNames.manufacturers}`} />
    </ListPageSkeletonShell>
  );
}
