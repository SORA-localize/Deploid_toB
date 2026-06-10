import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ChevronRight, Clock, User } from 'lucide-react';
import { ArticleToc } from '@/components/ArticleToc';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Markdown } from '@/components/Markdown';
import { RelatedLinkList } from '@/components/RelatedLinkList';
import { SourceList } from '@/components/SourceList';
import { TagChip } from '@/components/TagChip';
import {
  getRelatedGuides,
  getRelatedManufacturers,
  getRelatedRobots,
  getRelatedUseCases,
  getReportBySlug,
  getReports,
} from '@/lib/data';
import { reportTypeLabels } from '@/lib/labels';
import { extractH2Headings } from '@/lib/markdownHeadings';
import { uiText } from '@/lib/uiText';
import { getReportTypeTone } from '@/lib/visualSemantics';

export function generateStaticParams() {
  return getReports().map((report) => ({ slug: report.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = getReportBySlug(slug);
  const seo = report?.seo;
  return {
    title: seo?.metaTitle ?? (report ? (report.titleJa ?? report.title) : 'Report'),
    description: seo?.metaDescription ?? report?.summary,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = getReportBySlug(slug);
  if (!report) notFound();

  const robots = getRelatedRobots(report.relatedRobotSlugs);
  const manufacturers = getRelatedManufacturers(report.relatedManufacturerSlugs);
  const useCases = getRelatedUseCases(report.relatedUseCaseSlugs);
  const guides = getRelatedGuides(report.relatedGuideSlugs ?? []);

  const hasTakeaways = (report.keyTakeaways ?? []).length > 0;
  const hasBody = (report.body ?? '').trim().length > 0;
  const bodyHeadings = hasBody ? extractH2Headings(report.body!) : [];

  const toc = [
    ...(hasTakeaways ? [{ label: uiText.reports.keyTakeaways, href: '#takeaways' }] : []),
    ...(hasBody
      ? [
          { label: '本文', href: '#body' },
          ...bodyHeadings.map((h) => ({ label: h.text, href: `#${h.id}` })),
        ]
      : []),
    ...(robots.length > 0 ? [{ label: '関連ロボット', href: '#related-robots' }] : []),
    ...(manufacturers.length > 0
      ? [{ label: '関連メーカー', href: '#related-manufacturers' }]
      : []),
    ...(useCases.length > 0 ? [{ label: '関連用途', href: '#related-use-cases' }] : []),
    ...(guides.length > 0 ? [{ label: '関連ガイド', href: '#related-guides' }] : []),
    { label: uiText.common.resources, href: '#sources' },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── ヒーロー + ヘッダー（統合） ── */}
      {report.heroImage ? (
        <div className="relative w-full overflow-hidden bg-muted min-h-[400px] sm:min-h-[500px] md:min-h-[580px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.heroImage.src}
            alt={report.heroImage.alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
          />
          {report.heroImage.credit && (
            <p className="absolute bottom-2 right-3 z-10 text-[10px] text-white/50">
              © {report.heroImage.credit}
            </p>
          )}

          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="site-container pt-4 sm:pt-5">
              <nav className="flex items-center gap-1 text-xs sm:gap-2">
                <Link href="/" className="text-white/60 hover:text-white">{uiText.common.home}</Link>
                <ChevronRight className="h-3 w-3 text-white/40" />
                <Link href="/reports" className="text-white/60 hover:text-white">{uiText.reports.breadcrumb}</Link>
                <ChevronRight className="h-3 w-3 text-white/40" />
                <span className="line-clamp-1 text-white/80">{report.titleJa ?? report.title}</span>
              </nav>
            </div>
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-end">
            <div className="site-container pb-8 sm:pb-10">
              <div className="mb-2 text-xs font-medium text-white/70">
                {reportTypeLabels[report.type]}
              </div>
              <h1 className="mb-3 text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-white">
                {report.titleJa ?? report.title}
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
                <TagChip tone={getReportTypeTone(report.type)} className="py-1 font-medium">
                  {reportTypeLabels[report.type]}
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
        </div>
      ) : (
        <div className="border-b border-border bg-card">
          <div className="site-container py-6">
            <Breadcrumbs
              items={[
                { label: uiText.reports.breadcrumb, path: '/reports' },
                { label: report.titleJa ?? report.title },
              ]}
            />
            <div className="mb-3 text-xs font-medium text-muted-foreground">
              {reportTypeLabels[report.type]}
            </div>
            <h1 className="mb-4 max-w-4xl text-2xl md:text-3xl font-semibold leading-tight text-foreground">
              {report.titleJa ?? report.title}
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
              <TagChip tone={getReportTypeTone(report.type)} className="py-1 font-medium">
                {reportTypeLabels[report.type]}
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
      )}

      {/* ── 本文エリア ── */}
      <div className="site-container py-8">
        <div className="grid grid-cols-12 gap-6">

          {/* TOC（左） */}
          <div className="col-span-2 hidden lg:block">
            <ArticleToc items={toc} backHref="/reports" backLabel={uiText.reports.breadcrumb} />
          </div>

          {/* メインコンテンツ */}
          <div className="col-span-12 space-y-6 lg:col-span-7">

            {/* 要点（TL;DR） */}
            {hasTakeaways && (
              <div id="takeaways" className="scroll-mt-site-header border border-border bg-card p-6">
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
              </div>
            )}

            {/* 本文（Markdown） */}
            {hasBody && (
              <div id="body" className="scroll-mt-site-header border border-border bg-card p-6 md:p-8">
                <Markdown source={report.body!} />
              </div>
            )}

            {/* タグゾーン（本文の下） */}
            {report.tags.length > 0 && (
              <div className="border border-border bg-card px-6 py-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  タグ
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag) => (
                    <TagChip key={tag} kind="report" value={tag} className="py-1" />
                  ))}
                </div>
              </div>
            )}

            {/* 関連（種別ごとに分割） */}
            {robots.length > 0 && (
              <RelatedLinkList
                id="related-robots"
                title="関連ロボット"
                items={robots.map((r) => ({
                  href: `/robots/${r.slug}`,
                  title: r.nameJa ?? r.name,
                  description: r.summary,
                }))}
              />
            )}
            {manufacturers.length > 0 && (
              <RelatedLinkList
                id="related-manufacturers"
                title="関連メーカー"
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
                title="関連用途"
                items={useCases.map((u) => ({
                  href: `/use-cases/${u.slug}`,
                  title: u.titleJa ?? u.title,
                }))}
              />
            )}
            {guides.length > 0 && (
              <RelatedLinkList
                id="related-guides"
                title="関連ガイド"
                items={guides.map((g) => ({
                  href: `/guides/${g.slug}`,
                  title: g.titleJa ?? g.title,
                  description: g.summary,
                }))}
              />
            )}

            {/* 出典 */}
            <div id="sources" className="scroll-mt-site-header">
              <SourceList sources={report.sources} />
            </div>
          </div>

          {/* サイドバー（右） */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-site-header-gap space-y-4">
              <div className="border border-border bg-muted p-4">
                <h3 className="mb-2 text-xs font-semibold text-foreground">
                  情報提供・取材相談
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  導入事例や一次情報の提供、取材のご相談はこちら。
                </p>
                <Link
                  href="/contact"
                  className="block w-full bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  お問い合わせ
                </Link>
              </div>

              <div className="border border-border bg-card p-4">
                <h3 className="mb-3 border-b border-border pb-2 text-xs font-semibold text-foreground">
                  関連ツール
                </h3>
                <nav className="space-y-2">
                  {[
                    { href: '/robots', label: 'ロボットを探す' },
                    { href: '/compare', label: '機種を比較する' },
                    { href: '/guides', label: '導入ガイドを読む' },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center justify-between border-b border-border py-1.5 text-xs text-foreground/80 last:border-0 hover:text-foreground"
                    >
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
