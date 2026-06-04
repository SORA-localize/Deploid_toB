import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { ManufacturerRobotsGrid } from '@/components/ManufacturerRobotsGrid';
import { RobotCard } from '@/components/RobotCard';
import {
  getManufacturerBySlug,
  getManufacturers,
  getReportsForManufacturer,
  getRobotsByManufacturerSlug,
} from '@/lib/data';
import { TBD_LABEL } from '@/lib/labels';
import { getDomesticDistributorDisplay } from '@/lib/manufacturerDisplay';
import { uiText } from '@/lib/uiText';

export function generateStaticParams() {
  return getManufacturers().map((manufacturer) => ({ slug: manufacturer.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manufacturer = getManufacturerBySlug(slug);
  const seo = manufacturer?.seo;
  return {
    title:
      seo?.metaTitle ?? (manufacturer ? (manufacturer.nameJa ?? manufacturer.name) : 'Manufacturer'),
    description: seo?.metaDescription ?? manufacturer?.description,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function ManufacturerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manufacturer = getManufacturerBySlug(slug);
  if (!manufacturer) notFound();

  const robots = getRobotsByManufacturerSlug(manufacturer.slug);
  const reports = getReportsForManufacturer(manufacturer.slug);
  const domesticDistributor = getDomesticDistributorDisplay(manufacturer);

  return (
    <div className="min-h-screen bg-background">
      <div className="site-container py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: uiText.manufacturers.breadcrumb, path: '/manufacturers' },
            { label: manufacturer.nameJa ?? manufacturer.name },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 mb-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>プロフィール</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-4 sm:text-3xl">
              <ManufacturerLogoName
                name={manufacturer.nameJa ?? manufacturer.name}
                logo={manufacturer.logo}
                frameClassName="h-9 w-9"
                imageClassName="h-7 w-7"
              />
            </h1>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">{manufacturer.description}</p>
            <div className="flex gap-4 text-xs flex-wrap">
              {domesticDistributor.hasDistributor && (
                <div className="px-3 py-1.5 bg-muted border border-border text-foreground/80">
                  国内代理店: {domesticDistributor.label}
                </div>
              )}
              {manufacturer.supportNote && (
                <div className="px-3 py-1.5 bg-muted border border-border text-foreground/80">
                  サポート: {manufacturer.supportNote}
                </div>
              )}
              {manufacturer.vendorRiskNote && (
                <div className="px-3 py-1.5 bg-muted border border-border text-foreground/80">
                  継続性: {manufacturer.vendorRiskNote}
                </div>
              )}
            </div>
          </div>

          <div className="border border-border bg-muted p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {uiText.manufacturers.factSheet}
            </h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-4 py-2 border-b border-border">
                <dt className="text-muted-foreground">所在地</dt>
                <dd className="text-right text-foreground">
                  {manufacturer.hqCity ? `${manufacturer.hqCity}, ${manufacturer.country}` : manufacturer.country}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2 border-b border-border">
                <dt className="text-muted-foreground">設立</dt>
                <dd className="text-right text-foreground">{manufacturer.foundedYear ?? TBD_LABEL}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2 border-b border-border">
                <dt className="text-muted-foreground">取扱ロボット</dt>
                <dd className="text-right text-foreground">{robots.length}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">国内代理店</dt>
                <dd className="text-right text-foreground">
                  {domesticDistributor.hasDistributor ? (
                    <span className="inline-flex flex-col items-end gap-1">
                      {domesticDistributor.distributors.map((distributor) =>
                        distributor.website ? (
                          <a
                            key={distributor.name}
                            href={distributor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 hover:text-muted-foreground"
                          >
                            {distributor.name}
                          </a>
                        ) : (
                          <span key={distributor.name}>{distributor.name}</span>
                        ),
                      )}
                    </span>
                  ) : (
                    <Link href="/contact" className="text-accent-blue-pale hover:text-accent-blue-pale-hover">
                      問い合わせ
                    </Link>
                  )}
                </dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2 mt-6 sm:flex-row">
              <a
                href={manufacturer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-card border border-border hover:bg-muted text-xs text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
                {uiText.common.website}
              </a>
              <Link
                href="/contact"
                className="flex-1 text-center px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                {uiText.common.contact}
              </Link>
            </div>
          </div>
        </div>

        <div>

          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-foreground">取扱ロボット</h2>
            <span className="px-3 py-1.5 bg-muted border border-border text-foreground/80 text-xs whitespace-nowrap">
              {uiText.manufacturers.models(robots.length)}
            </span>
          </div>

          <ManufacturerRobotsGrid
            robots={robots}
            manufacturer={manufacturer}
          />
        </div>


        {reports.length > 0 && (
          <div className="mt-12 border border-border bg-muted p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">関連記事</h3>
            <div className="space-y-3">
              {reports.map((report) => (
                <Link
                  key={report.slug}
                  href={`/reports/${report.slug}`}
                  className="flex flex-col gap-3 p-3 bg-card border border-border hover:border-foreground/40 transition-colors sm:flex-row sm:items-start"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {report.titleJa ?? report.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{report.summary}</p>
                  </div>
                  <div className="text-xs text-muted-foreground sm:whitespace-nowrap">{report.publishedAt}</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
