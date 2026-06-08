import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ManufacturerDetailHero } from '@/components/ManufacturerDetailHero';
import { ManufacturerFactSheet } from '@/components/ManufacturerFactSheet';
import { ManufacturerProcurementPanel } from '@/components/ManufacturerProcurementPanel';
import { ManufacturerRobotsGrid } from '@/components/ManufacturerRobotsGrid';
import { SourceList } from '@/components/SourceList';
import {
  getManufacturerBySlug,
  getManufacturers,
  getReportsForManufacturer,
  getRobotsByManufacturerSlug,
} from '@/lib/data';
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
  const sections = [
    { label: uiText.common.overview, href: '#overview' },
    { label: uiText.manufacturers.factSheet, href: '#facts' },
    { label: uiText.manufacturers.robotsSection, href: '#robots' },
    { label: uiText.manufacturers.procurementConsultation, href: '#procurement' },
    ...(reports.length > 0
      ? [{ label: uiText.manufacturers.relatedReports, href: '#reports' }]
      : []),
    { label: uiText.common.resources, href: '#sources' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-[var(--header-h)] z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="site-container">
          <nav
            aria-label={uiText.manufacturers.sectionNavAria}
            className="flex items-center gap-6 overflow-x-auto py-4 text-xs"
          >
            {sections.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap border-b-2 border-transparent pb-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="site-container py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: uiText.manufacturers.breadcrumb, path: '/manufacturers' },
            { label: manufacturer.nameJa ?? manufacturer.name },
          ]}
        />

        <ManufacturerDetailHero manufacturer={manufacturer} robots={robots} />

        <ManufacturerFactSheet manufacturer={manufacturer} robotCount={robots.length} />

        <section id="robots" className="scroll-mt-site-header py-12 border-b border-border">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {uiText.manufacturers.robotsSection}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {uiText.manufacturers.robotsSection}
              </h2>
            </div>
            <span className="px-3 py-1.5 bg-muted border border-border text-foreground/80 text-xs whitespace-nowrap">
              {uiText.manufacturers.models(robots.length)}
            </span>
          </div>

          <ManufacturerRobotsGrid
            robots={robots}
            manufacturer={manufacturer}
          />
        </section>

        <ManufacturerProcurementPanel manufacturer={manufacturer} />

        {reports.length > 0 && (
          <section id="reports" className="scroll-mt-site-header py-12 border-b border-border">
            <div className="mb-6">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {uiText.manufacturers.relatedReports}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {uiText.manufacturers.relatedReports}
              </h2>
            </div>
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
          </section>
        )}

        <div className="py-12">
          <SourceList
            sources={manufacturer.sources}
            className="border border-border bg-card p-6 scroll-mt-site-header"
            titleClassName="text-sm font-semibold text-foreground mb-4"
          />
        </div>
      </div>
    </div>
  );
}
