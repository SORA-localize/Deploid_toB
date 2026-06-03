import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Calendar, User } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="site-container py-6">
          <Breadcrumbs
            items={[
              { label: uiText.reports.breadcrumb, path: '/reports' },
              { label: report.titleJa ?? report.title },
            ]}
          />
          <div className="text-xs text-muted-foreground font-medium mb-3">
            {reportTypeLabels[report.type]}
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-4 leading-tight max-w-4xl">
            {report.titleJa ?? report.title}
          </h1>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl mb-5">{report.summary}</p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground pb-5 border-b border-border flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {report.publishedAt}
            </span>
            <TagChip tone={getReportTypeTone(report.type)} className="py-1 font-medium">
              {reportTypeLabels[report.type]}
            </TagChip>
            {report.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {report.author}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="site-container py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="space-y-6">
              <div className="border-l-4 border-primary bg-card p-5">
                <p className="text-xs font-semibold text-foreground mb-1">
                  {uiText.reports.whyItMatters}
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">{report.whyItMatters}</p>
              </div>

              {hasBody && (
                <div className="border border-border bg-card p-6">
                  <Markdown source={report.body!} />
                </div>
              )}

              {hasTakeaways && (
                <div className="border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {uiText.reports.keyTakeaways}
                  </h2>
                  <ul className="space-y-2 text-sm text-foreground/80">
                    {(report.keyTakeaways ?? []).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <SourceList sources={report.sources} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              {hasRelated && (
                <div className="border border-border bg-card p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3 pb-2 border-b border-border">
                    関連
                  </h3>
                  <nav className="space-y-2">
                    {robots.map((r) => (
                      <Link
                        key={r.slug}
                        href={`/robots/${r.slug}`}
                        className="block text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                      >
                        {r.nameJa ?? r.name}
                      </Link>
                    ))}
                    {manufacturers.map((m) => (
                      <Link
                        key={m.slug}
                        href={`/manufacturers/${m.slug}`}
                        className="block text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                      >
                        <ManufacturerLogoName
                          name={m.nameJa ?? m.name}
                          logo={m.logo}
                          frameClassName="h-4 w-4"
                          imageClassName="h-3 w-3"
                        />
                      </Link>
                    ))}
                    {useCases.map((u) => (
                      <Link
                        key={u.slug}
                        href={`/use-cases/${u.slug}`}
                        className="block text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                      >
                        {u.titleJa ?? u.title}
                      </Link>
                    ))}
                    {guides.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/guides/${g.slug}`}
                        className="block text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                      >
                        {g.titleJa ?? g.title}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              <div className="border border-border bg-muted p-4">
                <h3 className="text-xs font-semibold text-foreground mb-2">情報提供・取材相談</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  導入事例や一次情報の提供、取材のご相談はこちら。
                </p>
                <Link
                  href="/contact"
                  className="block w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors text-center"
                >
                  お問い合わせ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
