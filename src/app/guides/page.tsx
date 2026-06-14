import { GuidesBrowser } from '@/components/GuidesBrowser';
import { getGuides } from '@/lib/data';
import { normalizeGuideFilters } from '@/lib/guideFilters';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = {
  title: 'ガイド',
  description:
    'ヒューマノイド導入を知る・判断する・動くで理解する常設ガイド。調達・TCO・安全・PoC・ベンダー評価を体系化。',
};

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  const params = await pickSearchParams(searchParams, ['stage', 'topic'] as const);
  return (
    <GuidesBrowser
      guides={getGuides()}
      initialFilters={normalizeGuideFilters({
        stage: params.stage,
        topic: params.topic,
      })}
    />
  );
}
