import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { NewsCardGridSkeleton } from '@/components/NewsCardGridSkeleton';

export default function Loading() {
  return (
    <ListPageSkeletonShell>
      <NewsCardGridSkeleton gridClassName="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" />
    </ListPageSkeletonShell>
  );
}
