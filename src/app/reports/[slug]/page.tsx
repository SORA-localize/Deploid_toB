import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Calendar, User } from 'lucide-react';
import { ArticleRelatedSidebar } from '@/components/ArticleRelatedSidebar';
import { ArticleToc } from '@/components/ArticleToc';
import { BudouXText } from '@/components/BudouXText';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { Markdown } from '@/components/Markdown';
import { RelatedLinkList } from '@/components/RelatedLinkList';
import { FeaturedRobotCard } from '@/components/FeaturedRobotCard';
import { SourceList } from '@/components/SourceList';
import { TagChip } from '@/components/TagChip';
import { SidebarBlock, SidebarDivider } from '@/components/SidebarSection';
import { ActiveSectionProvider } from '@/lib/activeSectionContext';
import {
  getArticles,
  getManufacturerGuideContent,
  getManufacturerForRobot,
  getRelatedManufacturers,
  getRelatedRobots,
  getRelatedUseCases,
  getStandardArticleBody,
  resolveArticleDetailBySlug,
  resolveManufacturerGuideLineup,
} from '@/lib/data';
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '@/lib/jsonLd';
import {
  ARTICLE_SHELF_TABS,
  getArticleCardLabel,
  getArticleShelf,
  getArticleShelfHref,
} from '@/lib/articleShelves';
import { extractH2Headings } from '@/lib/markdownHeadings';
import { MANUFACTURER_GUIDE_SECTIONS } from '@/lib/manufacturerGuideTemplate';
import { getDisplayableAsset } from '@/lib/media';
import { shouldIndexArticle } from '@/lib/indexing';
import { createPageMetadata } from '@/lib/metadata';
import { uiText } from '@/lib/uiText';
import { getArticleTypeTone } from '@/lib/visualSemantics';
import { ManufacturerGuideArticleBody } from '@/components/ManufacturerGuideArticleBody';

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
    <div className="space-y-5">
      <SidebarBlock kicker={uiText.reports.sidebarPressContactTitle} kickerClassName="mb-2">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {uiText.reports.sidebarPressContactDescription}
        </p>
        <Link
          href="/contact"
          className="block w-full bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {uiText.reports.sidebarContactCta}
        </Link>
      </SidebarBlock>

      <SidebarBlock kicker={uiText.reports.sidebarToolsTitle} kickerClassName="mb-3">
        <nav className="divide-y divide-border">
          {[
            { href: '/robots', label: uiText.reports.sidebarToolFindRobots },
            { href: '/compare', label: uiText.reports.sidebarToolCompare },
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
      </SidebarBlock>
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

  // manufacturer-guide は固定テンプレート型で、見出し・目次は MANUFACTURER_GUIDE_SECTIONS を
  // 正本にする（本文markdownの見出しをパースしない）。要点(TL;DR)セクションも持たない設計。
  const guideContent = getManufacturerGuideContent(report);
  const standardBody = getStandardArticleBody(report);
  const isManufacturerGuide = guideContent !== null;
  const hasTakeaways = !isManufacturerGuide && (report.keyTakeaways ?? []).length > 0;
  const hasBody = (standardBody ?? '').trim().length > 0;
  const bodyHeadings = hasBody ? extractH2Headings(standardBody!) : [];
  const heroImage = getDisplayableAsset(report.heroImage);
  const hasRelated = robots.length > 0 || manufacturers.length > 0 || useCases.length > 0;
  const reportTitle = report.titleJa ?? report.title;
  // メーカー解説のH1は、シリーズ名と記事固有のタイトルを視覚的に分ける。
  // reportTitle自体は改変しないため、メタデータ・パンくず・一覧カードは1行表記を維持する。
  const reportHeadingTitle = isManufacturerGuide
    ? reportTitle.replace('｜', '｜\n')
    : reportTitle;
  const shelf = getArticleShelf(report);
  const shelfTab = ARTICLE_SHELF_TABS.find((tab) => tab.value === shelf);
  // 階層はロボット詳細（ホーム > ロボット > メーカー > 機体）と揃えた4階層:
  // ホーム > 記事 > 棚（ニュース/メーカー解説…） > 記事タイトル
  const breadcrumbItems = [
    { label: uiText.reports.breadcrumb, path: '/reports' },
    ...(shelfTab ? [{ label: shelfTab.label, path: getArticleShelfHref(shelf) }] : []),
    { label: reportTitle },
  ];

  const toc = [
    ...(hasTakeaways ? [{ label: uiText.reports.keyTakeaways, href: '#takeaways' }] : []),
    ...(isManufacturerGuide
      ? MANUFACTURER_GUIDE_SECTIONS.filter((section) => section.id !== 'faq' || guideContent!.faq.length > 0).map((section) => ({
          label: section.label,
          href: `#${section.id}`,
        }))
      : []),
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
      {guideContent && guideContent.faq.length > 0 && (
        <JsonLd data={faqPageJsonLd(guideContent.faq)} />
      )}
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
        <header id="report-article-header" className="border-b border-border bg-background">
          <div className="site-container pt-4 sm:pt-5">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <figure className="relative overflow-hidden bg-muted min-h-[min(400px,68vh)] sm:min-h-[min(500px,70vh)] md:min-h-[min(580px,72vh)]">
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

            <div className="relative z-10 flex min-h-[min(400px,68vh)] items-end sm:min-h-[min(500px,70vh)] md:min-h-[min(580px,72vh)]">
              <div className="site-container pb-8 sm:pb-10">
                <div className="mb-2 text-xs font-medium text-white/70">
                  {getArticleCardLabel(report)}
                </div>
                <h1 className="mb-3 text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-white">
                  <BudouXText text={reportHeadingTitle} />
                </h1>
                <p className="mb-4 text-sm sm:text-base leading-relaxed text-white/80">
                  {report.summary}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {report.publishedAt}
                  </span>
                  <TagChip tone={getArticleTypeTone(report.type)} className="py-1 font-medium">
                    {getArticleCardLabel(report)}
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
        <header id="report-article-header" className="border-b border-border bg-card">
          <div className="site-container py-6">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mb-3 text-xs font-medium text-muted-foreground">
              {getArticleCardLabel(report)}
            </div>
            <h1 className="mb-4 max-w-4xl text-2xl md:text-3xl font-semibold leading-tight text-foreground">
              <BudouXText text={reportHeadingTitle} />
            </h1>
            <p className="mb-5 max-w-3xl text-sm leading-relaxed text-foreground/80">
              {report.summary}
            </p>
            <div className="flex flex-wrap items-center gap-5 border-b border-border pb-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {report.publishedAt}
              </span>
              <TagChip tone={getArticleTypeTone(report.type)} className="py-1 font-medium">
                {getArticleCardLabel(report)}
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
                className="scroll-mt-site-header pt-6 pb-8 border-b border-border"
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

            {/* 本文（メーカー解説は固定テンプレート、それ以外はMarkdown） */}
            {guideContent && (
              <section
                id="manufacturer-guide-body"
                className="scroll-mt-site-header pt-6 pb-8 border-b border-border"
              >
                <ManufacturerGuideArticleBody
                  content={guideContent}
                  lineupRows={resolveManufacturerGuideLineup(guideContent)}
                />
              </section>
            )}
            {hasBody && (
              <section id="body" className="scroll-mt-site-header pt-6 pb-8 border-b border-border">
                <Markdown source={standardBody!} />
              </section>
            )}
          </div>

          {/* 本文後のメタ・関連情報 */}
          <div className="col-span-12 lg:col-start-3 lg:row-start-2 lg:col-span-7">
            {/* 記事メタ（本文の終端） */}
            <section className={`py-8 ${hasRelated ? 'border-b border-border' : ''}`}>
              <div className="space-y-6">
                {((report.themeTags?.length ?? 0) > 0 ||
                  (report.industryTags?.length ?? 0) > 0 ||
                  (report.regionTags?.length ?? 0) > 0) && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {uiText.reports.tags}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(report.themeTags ?? []).map((tag) => (
                        <TagChip key={`theme-${tag}`} kind="theme" value={tag} className="py-1" />
                      ))}
                      {(report.industryTags ?? []).map((tag) => (
                        <TagChip key={`industry-${tag}`} kind="industry" value={tag} className="py-1" />
                      ))}
                      {(report.regionTags ?? []).map((tag) => (
                        <TagChip key={`region-${tag}`} kind="region" value={tag} className="py-1" />
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
              <section id="related" className="scroll-mt-site-header py-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {uiText.reports.relatedInfo}
                </h2>
                <div className="space-y-4">
                  {robots.length > 0 && (
                    <section id="related-robots" aria-labelledby="related-robots-heading">
                      <h3 id="related-robots-heading" className="mb-3 text-base font-semibold text-foreground">
                        {uiText.reports.relatedRobots}
                      </h3>
                      <div className="flex gap-3 overflow-x-auto overscroll-x-contain snap-x pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {robots.map((robot) => {
                          const manufacturer = getManufacturerForRobot(robot.manufacturerId);
                          return (
                            <div key={robot.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[22%] xl:w-[18%]">
                              <FeaturedRobotCard robot={robot} manufacturerName={manufacturer?.name} />
                            </div>
                          );
                        })}
                      </div>
                    </section>
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
                </div>
              </section>
            )}
          </div>

          {/* サイドバー（右） */}
          <div className="col-span-12 lg:col-start-10 lg:row-start-1 lg:row-span-2 lg:col-span-3">
            <div className="lg:hidden">
              <ReportSidebarContent />
            </div>
            <ArticleRelatedSidebar
              triggerId="report-article-header"
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
