import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User } from 'lucide-react';
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
  const reportTitle = report.titleJa ?? report.title;
  const breadcrumbItems = [
    { label: uiText.reports.breadcrumb, path: '/reports' },
    { label: reportTitle },
  ];

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
        <header className="border-b border-border bg-background">
          <div className="site-container pt-4 sm:pt-5">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <figure className="relative overflow-hidden bg-muted min-h-[400px] sm:min-h-[500px] md:min-h-[580px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.heroImage.src}
              alt={report.heroImage.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
            />
            {report.heroImage.credit && (
              <p className="pointer-events-none absolute bottom-2 right-3 z-10 text-[10px] text-white/50">
                © {report.heroImage.credit}
              </p>
            )}

            <div className="relative z-10 flex min-h-[400px] items-end sm:min-h-[500px] md:min-h-[580px]">
              <div className="site-container pb-8 sm:pb-10">
                <div className="mb-2 text-xs font-medium text-white/70">
                  {reportTypeLabels[report.type]}
                </div>
                <h1 className="mb-3 text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-white">
                  {reportTitle}
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
          </figure>
        </header>
      ) : (
        <header className="border-b border-border bg-card">
          <div className="site-container py-6">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mb-3 text-xs font-medium text-muted-foreground">
              {reportTypeLabels[report.type]}
            </div>
            <h1 className="mb-4 max-w-4xl text-2xl md:text-3xl font-semibold leading-tight text-foreground">
              {reportTitle}
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
        </header>
      )}

      {/* ── 本文エリア ── */}
      <div className="site-container-content py-8">
        <div className="grid grid-cols-12 gap-6">

          {/* TOC（左） */}
          <div className="col-span-2 hidden lg:block">
            <ArticleToc items={toc} backHref="/reports" backLabel={uiText.reports.breadcrumb} />
          </div>

          {/* メインコンテンツ */}
          <div className="col-span-12 lg:col-span-7">

            {/* 要点（TL;DR） */}
            {hasTakeaways && (
              <section id="takeaways" className="scroll-mt-site-header border-b border-border pt-6 pb-8">
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
              <section id="body" className="scroll-mt-site-header border-b border-border pt-6 pb-8">
                <Markdown source={report.body!} />
              </section>
            )}

            {/* タグゾーン（本文の下） */}
            {report.tags.length > 0 && (
              <section className="border-b border-border pt-6 pb-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  タグ
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag) => (
                    <TagChip key={tag} kind="report" value={tag} className="py-1" />
                  ))}
                </div>
              </section>
            )}

            {/* 関連（種別ごとに分割） */}
            {robots.length > 0 && (
              <div className="mt-6">
                <RelatedLinkList
                  id="related-robots"
                  title="関連ロボット"
                  items={robots.map((r) => ({
                    href: `/robots/${r.slug}`,
                    title: r.nameJa ?? r.name,
                    description: r.summary,
                  }))}
                />
              </div>
            )}
            {manufacturers.length > 0 && (
              <div className="mt-6">
                <RelatedLinkList
                  id="related-manufacturers"
                  title="関連メーカー"
                  items={manufacturers.map((m) => ({
                    href: `/manufacturers/${m.slug}`,
                    title: m.nameJa ?? m.name,
                    description: m.summary,
                  }))}
                />
              </div>
            )}
            {useCases.length > 0 && (
              <div className="mt-6">
                <RelatedLinkList
                  id="related-use-cases"
                  title="関連用途"
                  items={useCases.map((u) => ({
                    href: `/use-cases/${u.slug}`,
                    title: u.titleJa ?? u.title,
                  }))}
                />
              </div>
            )}
            {guides.length > 0 && (
              <div className="mt-6">
                <RelatedLinkList
                  id="related-guides"
                  title="関連ガイド"
                  items={guides.map((g) => ({
                    href: `/guides/${g.slug}`,
                    title: g.titleJa ?? g.title,
                    description: g.summary,
                  }))}
                />
              </div>
            )}

            {/* 出典（wrapper div 削除 — SourceList が id="sources" を保持） */}
            <SourceList
              sources={report.sources}
              className="scroll-mt-site-header mt-6 pt-6 border-t border-border"
            />
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
