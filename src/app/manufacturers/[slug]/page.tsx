import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ManufacturerDetailHero } from '@/components/ManufacturerDetailHero';
import { ManufacturerDetailSection } from '@/components/ManufacturerDetailSection';
import type { ManufacturerDetailSectionLink } from '@/components/ManufacturerDetailSectionNav';
import { ManufacturerDetailStickyHeader } from '@/components/ManufacturerDetailStickyHeader';
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
  const sections: ManufacturerDetailSectionLink[] = [
    { label: uiText.common.overview, href: '#overview' },
    { label: uiText.manufacturers.factSheet, href: '#facts' },
    { label: uiText.manufacturers.robotsSection, href: '#robots', count: robots.length },
    { label: uiText.manufacturers.procurementConsultation, href: '#procurement' },
    ...(reports.length > 0
      ? [{ label: uiText.manufacturers.relatedReports, href: '#reports', count: reports.length }]
      : []),
    { label: uiText.common.resources, href: '#sources', count: manufacturer.sources.length },
  ];
  const manufacturerName = manufacturer.nameJa ?? manufacturer.name;

  return (
    <div className="min-h-screen bg-background">
      <ManufacturerDetailStickyHeader
        title={manufacturerName}
        sections={sections}
        ariaLabel={uiText.manufacturers.sectionNavAria}
      />

      <div className="site-container py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: uiText.manufacturers.breadcrumb, path: '/manufacturers' },
            { label: manufacturerName },
          ]}
        />

        <ManufacturerDetailHero manufacturer={manufacturer} robots={robots} />

        <ManufacturerFactSheet manufacturer={manufacturer} robotCount={robots.length} />

        <ManufacturerDetailSection
          id="robots"
          eyebrow={uiText.manufacturers.robotsSection}
          title={uiText.manufacturers.robotsSection}
          action={
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {uiText.manufacturers.models(robots.length)}
            </span>
          }
        >
          <ManufacturerRobotsGrid
            robots={robots}
            manufacturer={manufacturer}
          />
        </ManufacturerDetailSection>

        <ManufacturerProcurementPanel manufacturer={manufacturer} />

        {reports.length > 0 && (
          <ManufacturerDetailSection
            id="reports"
            eyebrow={uiText.manufacturers.relatedReports}
            title={uiText.manufacturers.relatedReports}
          >
            <div className="space-y-3">
              {reports.map((report) => (
                <Link
                  key={report.slug}
                  href={`/reports/${report.slug}`}
                  className="flex flex-col gap-3 border-b border-border py-4 transition-colors hover:border-foreground/40 sm:flex-row sm:items-start"
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
          </ManufacturerDetailSection>
        )}

        <div className="py-12">
          <SourceList
            sources={manufacturer.sources}
            className="scroll-mt-site-header"
            titleClassName="text-sm font-semibold text-foreground mb-4"
          />
        </div>
      </div>
    </div>
  );
}
