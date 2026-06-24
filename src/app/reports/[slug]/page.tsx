import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Calendar, Clock, User } from 'lucide-react';
import { ArticleRelatedSidebar } from '@/components/ArticleRelatedSidebar';
import { ArticleToc } from '@/components/ArticleToc';
import { BudouXText } from '@/components/BudouXText';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { Markdown } from '@/components/Markdown';
import { RelatedLinkList } from '@/components/RelatedLinkList';
import { SourceList } from '@/components/SourceList';
import { TagChip } from '@/components/TagChip';
import { ActiveSectionProvider } from '@/lib/activeSectionContext';
import {
  getArticles,
  getRelatedGuides,
  getRelatedManufacturers,
  getRelatedRobots,
  getRelatedUseCases,
  resolveArticleDetailBySlug,
} from '@/lib/data';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonLd';
import { articleTypeLabels } from '@/lib/labels';
import { extractH2Headings } from '@/lib/markdownHeadings';
import { getDisplayableAsset } from '@/lib/media';
import { shouldIndexArticle } from '@/lib/indexing';
import { createPageMetadata } from '@/lib/metadata';
import { getRobotRelatedTitle } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';
import { getArticleTypeTone } from '@/lib/visualSemantics';

export function generateStaticParams() {
  return getArticles().map((report) => ({ slug: report.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: report } = resolveArticleDetailBySlug(slug);
  const seo = report?.seo;
  // sample（UI確認用データ）は検索に載せない（§11.9）
  const noindex = report ? !shouldIndexArticle(report) : seo?.noindex;
  const title = seo?.metaTitle ?? (report ? (report.titleJa ?? report.title) : 'Article');

  return createPageMetadata({
    title,
    description: seo?.metaDescription ?? report?.summary,
    path: report ? `/reports/${report.slug}` : undefined,
    image: getDisplayableAsset(report?.heroImage)?.src,
    type: 'article',
    noindex,
  });
}

function ReportSidebarContent() {
  return (
    <div className="space-y-6">
      <section className="border-y border-border py-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {uiText.reports.sidebarPressContactTitle}
        </h3>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {uiText.reports.sidebarPressContactDescription}
        </p>
        <Link
          href="/contact"
          className="block w-full bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {uiText.reports.sidebarContactCta}
        </Link>
      </section>

      <section className="border-y border-border py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {uiText.reports.sidebarToolsTitle}
        </h3>
        <nav className="divide-y divide-border">
          {[
            { href: '/robots', label: uiText.reports.sidebarToolFindRobots },
            { href: '/compare', label: uiText.reports.sidebarToolCompare },
            { href: '/guides', label: uiText.reports.sidebarToolGuides },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between py-2 text-xs text-foreground/80 transition-colors hover:text-foreground"
            >
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: report, redirectTo } = resolveArticleDetailBySlug(slug);
  if (redirectTo) permanentRedirect(`/reports/${redirectTo}`);
  if (!report) notFound();

  const robots = getRelatedRobots(report.relatedRobotIds);
  const manufacturers = getRelatedManufacturers(report.relatedManufacturerIds);
  const useCases = getRelatedUseCases(report.relatedUseCaseIds);
  const guides = getRelatedGuides(report.relatedGuideIds ?? []);

  const hasTakeaways = (report.keyTakeaways ?? []).length > 0;
  const hasBody = (report.body ?? '').trim().length > 0;
  const bodyHeadings = hasBody ? extractH2Headings(report.body!) : [];
  const heroImage = getDisplayableAsset(report.heroImage);
  const hasRelated = robots.length > 0 || manufacturers.length > 0 || useCases.length > 0 || guides.length > 0;
  const reportTitle = report.titleJa ?? report.title;
  const breadcrumbItems = [
    { label: uiText.reports.breadcrumb, path: '/reports' },
    { label: reportTitle },
  ];

  const toc = [
    ...(hasTakeaways ? [{ label: uiText.reports.keyTakeaways, href: '#takeaways' }] : []),
    ...(hasBody
      ? [
          { label: uiText.reports.body, href: '#body' },
          ...bodyHeadings.map((h) => ({ label: h.text, href: `#${h.id}` })),
        ]
      : []),
    ...(hasRelated ? [{ label: uiText.reports.relatedInfo, href: '#related' }] : []),
  ];
  const tocIds = toc.map((item) => item.href.replace('#', ''));

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={articleJsonLd(report)} />
      <JsonLd
        data={breadcrumbJsonLd([
          ...breadcrumbItems.map((item) => ({
            name: item.label,
            path: item.path ?? `/reports/${report.slug}`,
          })),
        ])}
      />

      {/* ── ヒーロー + ヘッダー（統合） ── */}
      {heroImage ? (
        <header className="border-b border-border bg-background">
          <div className="site-container pt-4 sm:pt-5">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <figure className="relative overflow-hidden bg-muted min-h-[400px] sm:min-h-[500px] md:min-h-[580px]">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
            />
            {heroImage.credit && (
              <p className="pointer-events-none absolute bottom-2 right-3 z-10 text-[10px] text-white/50">
                © {heroImage.credit}
              </p>
            )}

            <div className="relative z-10 flex min-h-[400px] items-end sm:min-h-[500px] md:min-h-[580px]">
              <div className="site-container pb-8 sm:pb-10">
                <div className="mb-2 text-xs font-medium text-white/70">
                  {articleTypeLabels[report.type]}
                </div>
                <h1 className="mb-3 text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-white">
                  <BudouXText text={reportTitle} />
                </h1>
                <p className="mb-4 text-sm sm:text-base leading-relaxed text-white/80">
                  {report.summary}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {report.publishedAt}
                  </span>
                  {report.readingTimeMin && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {uiText.common.readingMinutes(report.readingTimeMin)}
                    </span>
                  )}
                  <TagChip tone={getArticleTypeTone(report.type)} className="py-1 font-medium">
                    {articleTypeLabels[report.type]}
                  </TagChip>
                  {report.author && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {report.author}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </figure>
        </header>
      ) : (
        <header className="border-b border-border bg-card">
          <div className="site-container py-6">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mb-3 text-xs font-medium text-muted-foreground">
              {articleTypeLabels[report.type]}
            </div>
            <h1 className="mb-4 max-w-4xl text-2xl md:text-3xl font-semibold leading-tight text-foreground">
              <BudouXText text={reportTitle} />
            </h1>
            <p className="mb-5 max-w-3xl text-sm leading-relaxed text-foreground/80">
              {report.summary}
            </p>
            <div className="flex flex-wrap items-center gap-5 border-b border-border pb-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {report.publishedAt}
              </span>
              {report.readingTimeMin && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {uiText.common.readingMinutes(report.readingTimeMin)}
                </span>
              )}
              <TagChip tone={getArticleTypeTone(report.type)} className="py-1 font-medium">
                {articleTypeLabels[report.type]}
              </TagChip>
              {report.author && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {report.author}
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── 本文エリア ── */}
      <div className="site-container-content py-8">
        {/* scrollspy を1回だけ計算し、TOC と関連サイドバーで共有する */}
        <ActiveSectionProvider ids={tocIds}>
        <div className="grid grid-cols-12 gap-6">

          {/* TOC（左） */}
          <div className="col-span-2 hidden lg:row-span-2 lg:block">
            <ArticleToc items={toc} backHref="/reports" backLabel={uiText.reports.breadcrumb} />
          </div>

          {/* メインコンテンツ */}
          <div className="col-span-12 lg:col-start-3 lg:col-span-7">

            {/* 要点（TL;DR） */}
            {hasTakeaways && (
              <section
                id="takeaways"
                className={`scroll-mt-site-header pt-6 pb-8 ${
                  hasBody ? 'border-b border-border' : ''
                }`}
              >
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {uiText.reports.keyTakeaways}
                </h2>
                <ul className="space-y-2.5 text-sm text-foreground/80">
                  {(report.keyTakeaways ?? []).map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 text-primary">▸</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 本文（Markdown） */}
            {hasBody && (
              <section id="body" className="scroll-mt-site-header pt-6 pb-8">
                <Markdown source={report.body!} />
              </section>
            )}
          </div>

          {/* 本文後のメタ・関連情報 */}
          <div className="col-span-12 lg:col-start-3 lg:row-start-2 lg:col-span-7">
            {/* 記事メタ（本文の終端） */}
            <section className="border-y border-border py-6">
              <div className="space-y-6">
                {report.tags.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {uiText.reports.tags}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.tags.map((tag) => (
                        <TagChip key={tag} kind="article" value={tag} className="py-1" />
                      ))}
                    </div>
                  </div>
                )}

                <SourceList
                  sources={report.sources}
                  className="scroll-mt-site-header"
                  titleVariant="meta"
                />
              </div>
            </section>

            {hasRelated && (
              <section id="related" className="scroll-mt-site-header mt-12 border-t-2 border-border pt-8 pb-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {uiText.reports.relatedInfo}
                </h2>
                <div className="space-y-4">
                  {robots.length > 0 && (
                    <RelatedLinkList
                      id="related-robots"
                      title={uiText.reports.relatedRobots}
                      titleLevel="h3"
                      items={robots.map((r) => ({
                        href: `/robots/${r.slug}`,
                        title: getRobotRelatedTitle(r),
                        description: r.summary,
                      }))}
                    />
                  )}
                  {manufacturers.length > 0 && (
                    <RelatedLinkList
                      id="related-manufacturers"
                      title={uiText.reports.relatedManufacturers}
                      titleLevel="h3"
                      items={manufacturers.map((m) => ({
                        href: `/manufacturers/${m.slug}`,
                        title: m.nameJa ?? m.name,
                        description: m.summary,
                      }))}
                    />
                  )}
                  {useCases.length > 0 && (
                    <RelatedLinkList
                      id="related-use-cases"
                      title={uiText.reports.relatedUseCases}
                      titleLevel="h3"
                      items={useCases.map((u) => ({
                        href: `/use-cases/${u.slug}`,
                        title: u.titleJa ?? u.title,
                      }))}
                    />
                  )}
                  {guides.length > 0 && (
                    <RelatedLinkList
                      id="related-guides"
                      title={uiText.reports.relatedGuides}
                      titleLevel="h3"
                      items={guides.map((g) => ({
                        href: `/guides/${g.slug}`,
                        title: g.titleJa ?? g.title,
                        description: g.summary,
                      }))}
                    />
                  )}
                </div>
              </section>
            )}
          </div>

          {/* サイドバー（右） */}
          <div className="col-span-12 lg:col-start-10 lg:row-start-2 lg:col-span-3">
            <div className="lg:hidden">
              <ReportSidebarContent />
            </div>
            <ArticleRelatedSidebar
              enabled={hasRelated}
              revealId="related"
              sectionIds={tocIds}
              className="top-site-header-gap hidden lg:sticky lg:block"
            >
              <ReportSidebarContent />
            </ArticleRelatedSidebar>
          </div>
        </div>
        </ActiveSectionProvider>
      </div>
    </div>
  );
}
