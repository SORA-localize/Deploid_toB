import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { ManufacturerCardGridSkeleton } from '@/components/ManufacturerCardGridSkeleton';

export default function Loading() {
  return (
    <ListPageSkeletonShell>
      <ManufacturerCardGridSkeleton gridClassName="mt-8 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" />
    </ListPageSkeletonShell>
  );
}
