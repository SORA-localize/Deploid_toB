import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ReportsBrowser } from '@/components/ReportsBrowser';
import { getArticles } from '@/lib/data';
import { getArticleIndexPlacementReports } from '@/lib/articlePlacements';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { segmentJapaneseLines } from '@/lib/typography';
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
  const reports = getArticles();
  const params = await pickSearchParams(searchParams, ['kind', 'q', ARTICLE_PAGE_PARAM]);
  const { heroReports, featureReports } = getArticleIndexPlacementReports({
    articles: reports,
    placements: localContentSnapshot.articlePlacements,
    limits: localContentSnapshot.articleIndexPlacementLimits,
  });

  // 分かち書きはserver側で済ませる。clientへ渡るのは文字列配列だけ。
  const titleSegments = Object.fromEntries(
    reports.map((report) => [report.id, segmentJapaneseLines(report.titleJa ?? report.title)]),
  );

  return (
    <ReportsBrowser
      reports={reports}
      heroReports={heroReports}
      featureReports={featureReports}
      titleSegments={titleSegments}
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
