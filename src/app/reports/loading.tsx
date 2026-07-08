import { ListPageSkeletonShell } from '@/components/ListPageSkeletonShell';
import { NewsCardGridSkeleton } from '@/components/NewsCardGridSkeleton';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';

export default function Loading() {
  return (
    <ListPageSkeletonShell>
      <NewsCardGridSkeleton gridClassName={`mt-8 ${browserGridClassNames.reports}`} />
    </ListPageSkeletonShell>
  );
}
