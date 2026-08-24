import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ReportsBrowser } from '@/components/ReportsBrowser';
import { contentTags } from '@/lib/content/cacheTags';
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

/**
 * Report一覧の依存表（`lib/content/cacheDependencies.ts`）: articles, articlePlacements,
 * settings。briefの依存表は`media`も挙げるが、実装は読まない（`KNOWN_GAPS`参照）。
 * 代わりに`getArticleIndexPlacementLimits()`が`site-settings` globalを読むため、`settings`を
 * briefの表どおりではなく実際の依存として足す。
 */
async function CachedReportsList({ initialSearch }: { initialSearch: ReturnType<typeof toInitialSearch> }) {
  'use cache';
  cacheLife('hours');
  cacheTag(contentTags.articles);
  cacheTag(contentTags.articlePlacements);
  cacheTag(contentTags.settings);

  const repository = await getContentRepository();
  const [articles, placements, limits] = await Promise.all([
    repository.listAllPublishedArticles(),
    repository.listArticlePlacements({ surface: 'reports-index' }),
    repository.getArticleIndexPlacementLimits(),
  ]);
  const reports = createArticleCatalogItems(articles);
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
      initialSearch={initialSearch}
    />
  );
}

async function ReportsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const params = await pickSearchParams(searchParams, ['kind', 'q', ARTICLE_PAGE_PARAM]);
  return <CachedReportsList initialSearch={toInitialSearch(params)} />;
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
