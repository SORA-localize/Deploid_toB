import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ReportsBrowser } from '@/components/ReportsBrowser';
import { getArticles } from '@/lib/data';
import { ARTICLE_PAGE_PARAM } from '@/lib/articlePagination';
import { normalizeArticleShelfParam } from '@/lib/articleShelves';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = createPageMetadata({
  title: 'ニュース・解説',
  description:
    'ヒューマノイドロボットのニュース、メーカー解説、ロボット解説を、導入判断に必要な観点で整理した情報ハブ。',
  path: '/reports',
});

async function ReportsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const reports = getArticles();
  const params = await pickSearchParams(searchParams, ['kind', 'q', ARTICLE_PAGE_PARAM]);
  const activeShelf = normalizeArticleShelfParam(params.kind);

  return (
    <ReportsBrowser
      reports={reports}
      activeShelf={activeShelf}
      initialQuery={params.q ?? ''}
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
