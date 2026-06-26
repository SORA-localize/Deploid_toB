import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { GuidesBrowser } from '@/components/GuidesBrowser';
import { ComingSoonGate } from '@/components/ComingSoonGate';
import { getGuides } from '@/lib/data';
import { getGuideFilterOptions, normalizeGuideFilters } from '@/lib/guideFilters';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = createPageMetadata({
  title: 'ガイド',
  description:
    'ヒューマノイド導入を知る・判断する・動くで理解する常設ガイド。調達・TCO・安全・PoC・ベンダー評価を体系化。',
  path: '/guides',
});

async function GuidesContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const guides = getGuides();
  const params = await pickSearchParams(searchParams, ['stage', 'topic'] as const);
  const filterOptions = getGuideFilterOptions(guides);

  return (
    <ComingSoonGate storageKey="coming-soon:guides" title="導入ガイドは近日公開予定です">
      <GuidesBrowser
        guides={guides}
        initialFilters={normalizeGuideFilters({
          stage: params.stage,
          topic: params.topic,
          topicValues: filterOptions.topics.map((option) => option.value),
        })}
      />
    </ComingSoonGate>
  );
}

export default function GuidesPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <GuidesContent searchParams={searchParams} />
    </Suspense>
  );
}
