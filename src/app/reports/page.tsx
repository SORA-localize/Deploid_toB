import { ReportsBrowser } from '@/components/ReportsBrowser';
import { getArticles } from '@/lib/data';
import { ARTICLE_PAGE_PARAM } from '@/lib/articlePagination';
import { normalizeArticleSectionParam } from '@/lib/articleSections';
import { createPageMetadata } from '@/lib/metadata';
import { pickSearchParams, type RouteSearchParams } from '@/lib/searchParams';

export const metadata = createPageMetadata({
  title: '記事',
  description:
    '市場動向・導入レポート・政策・取材・分析を、買い手の意思決定に必要な観点で整理する一次情報ハブ。',
  path: '/reports',
});

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: RouteSearchParams;
}) {
  const reports = getArticles();
  const params = await pickSearchParams(searchParams, ['section', ARTICLE_PAGE_PARAM] as const);
  const activeSection = normalizeArticleSectionParam(params.section);

  return (
    <ReportsBrowser
      reports={reports}
      activeSection={activeSection}
      initialPageParam={params[ARTICLE_PAGE_PARAM]}
    />
  );
}
