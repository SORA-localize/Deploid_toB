import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ReportsBrowser } from '@/components/ReportsBrowser';
import { getArticles } from '@/lib/data';
import { ARTICLE_PAGE_PARAM } from '@/lib/articlePagination';
import { ARTICLE_FACETS } from '@/lib/facetConfig';
import { normalizeArticleSectionParam } from '@/lib/articleSections';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = createPageMetadata({
  title: '記事',
  description:
    '市場動向・導入レポート・政策・取材・分析を、買い手の意思決定に必要な観点で整理する一次情報ハブ。',
  path: '/reports',
});

async function ReportsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const reports = getArticles();
  const facetKeys = ARTICLE_FACETS.map((facet) => facet.key);
  const params = await pickSearchParams(searchParams, [
    'section',
    'q',
    ARTICLE_PAGE_PARAM,
    ...facetKeys,
  ]);
  const activeSection = normalizeArticleSectionParam(params.section);
  const facetValues = Object.fromEntries(facetKeys.map((key) => [key, params[key]]));

  return (
    <ReportsBrowser
      reports={reports}
      activeSection={activeSection}
      initialFilters={{ query: params.q ?? '', facetValues }}
      initialPageParam={params[ARTICLE_PAGE_PARAM]}
    />
  );
}

export default function ReportsPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}
