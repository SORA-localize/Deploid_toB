import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ReportsBrowser } from '@/components/ReportsBrowser';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { getArticleIndexPlacementReports } from '@/lib/articlePlacements';
import { createArticleCatalogItems } from '@/lib/viewModels/articles';
import { ARTICLE_PAGE_PARAM } from '@/lib/articlePagination';
import { toInitialSearch } from '@/lib/catalog/urlSearch';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = createPageMetadata({
  title: 'ニュース・解説',
  description:
    'ヒューマノイドロボットのニュース、メーカー解説、ロボット解説を、導入判断に必要な観点で整理した情報ハブ。',
  path: '/reports',
});

async function ReportsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const repository = await getContentRepository();
  const [articles, placements, limits] = await Promise.all([
    repository.listAllPublishedArticles(),
    repository.listArticlePlacements({ surface: 'reports-index' }),
    repository.getArticleIndexPlacementLimits(),
  ]);
  const reports = createArticleCatalogItems(articles);
  const params = await pickSearchParams(searchParams, ['kind', 'q', ARTICLE_PAGE_PARAM]);
  // getArticleIndexPlacementReports は { id, publishedAt } を要求する generic なので VM をそのまま渡せる。
  const { heroReports, featureReports } = getArticleIndexPlacementReports({
    articles: reports,
    placements,
    limits,
  });

  return (
    <ReportsBrowser
      reports={reports}
      heroReports={heroReports}
      featureReports={featureReports}
      initialSearch={toInitialSearch(params)}
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
