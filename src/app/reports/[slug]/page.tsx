import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { ArticleToc } from '@/components/ArticleToc';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { Markdown } from '@/components/Markdown';
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
  const hasRelated =
    robots.length > 0 || manufacturers.length > 0 || useCases.length > 0 || guides.length > 0;

  const toc = [
    { label: uiText.reports.whyItMatters, href: '#why' },
    ...(hasTakeaways ? [{ label: uiText.reports.keyTakeaways, href: '#takeaways' }] : []),
    ...(hasBody ? [{ label: '本文', href: '#body' }] : []),
    ...(hasRelated ? [{ label: '関連', href: '#related' }] : []),
    { label: uiText.common.resources, href: '#sources' },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── ヒーロー画像（全幅） ── */}
      {report.heroImage && (
        <div className="relative h-56 w-full overflow-hidden bg-muted sm:h-72 md:h-96">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.heroImage.src}
            alt={report.heroImage.alt}
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
          />
          {report.heroImage.credit && (
            <p className="absolute bottom-2 right-3 text-[10px] text-white/50">
              © {report.heroImage.credit}
            </p>
          )}
        </div>
      )}

      {/* ── ヘッダー ── */}
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
          <h1 className="mb-4 max-w-4xl text-3xl font-semibold leading-tight text-foreground">
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

      {/* ── 本文エリア ── */}
      <div className="site-container py-8">
        <div className="grid grid-cols-12 gap-6">

          {/* TOC（左） */}
          <div className="col-span-2 hidden lg:block">
            <ArticleToc items={toc} backHref="/reports" backLabel={uiText.reports.breadcrumb} />
          </div>

          {/* メインコンテンツ */}
          <div className="col-span-12 space-y-6 lg:col-span-7">

            {/* なぜ重要か */}
            <div id="why" className="scroll-mt-6 border-l-4 border-primary bg-card p-5">
              <p className="mb-2 text-xs font-semibold text-foreground">
                {uiText.reports.whyItMatters}
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">{report.whyItMatters}</p>
            </div>

            {/* 要点（TL;DR） */}
            {hasTakeaways && (
              <div id="takeaways" className="scroll-mt-6 border border-border bg-card p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">
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

            {/* 本文 */}
            {hasBody && (
              <div id="body" className="scroll-mt-6 border border-border bg-card p-6 md:p-8">
                <Markdown source={report.body!} />
              </div>
            )}

            {/* 関連リンク */}
            {hasRelated && (
              <div id="related" className="scroll-mt-6 border border-border bg-card p-6">
                <h2 className="mb-4 border-b border-border pb-2 text-sm font-semibold text-foreground">
                  関連
                </h2>
                <div className="space-y-2">
                  {robots.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/robots/${r.slug}`}
                      className="flex items-center justify-between border-b border-border py-2 text-xs text-foreground/80 hover:text-foreground"
                    >
                      <span>{r.nameJa ?? r.name}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                  {manufacturers.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/manufacturers/${m.slug}`}
                      className="flex items-center justify-between border-b border-border py-2 text-xs text-foreground/80 hover:text-foreground"
                    >
                      <ManufacturerLogoName
                        name={m.nameJa ?? m.name}
                        logo={m.logo}
                        frameClassName="h-4 w-4"
                        imageClassName="h-3 w-3"
                      />
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                  {useCases.map((u) => (
                    <Link
                      key={u.slug}
                      href={`/use-cases/${u.slug}`}
                      className="flex items-center justify-between border-b border-border py-2 text-xs text-foreground/80 hover:text-foreground"
                    >
                      <span>{u.titleJa ?? u.title}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                  {guides.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guides/${g.slug}`}
                      className="flex items-center justify-between py-2 text-xs text-foreground/80 hover:text-foreground"
                    >
                      <span>{g.titleJa ?? g.title}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 出典 */}
            <div id="sources" className="scroll-mt-6">
              <SourceList sources={report.sources} />
            </div>
          </div>

          {/* サイドバー（右） */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-6 space-y-4">
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
                      <ArrowRight className="h-3 w-3" />
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
