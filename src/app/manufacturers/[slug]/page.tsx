import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ManufacturerDetailHero } from '@/components/ManufacturerDetailHero';
import { ManufacturerDetailSection } from '@/components/ManufacturerDetailSection';
import type { ManufacturerDetailSectionLink } from '@/components/ManufacturerDetailSectionNav';
import { ManufacturerDetailStickyHeader } from '@/components/ManufacturerDetailStickyHeader';
import { ManufacturerFactSheet } from '@/components/ManufacturerFactSheet';
import { ManufacturerRobotsGrid } from '@/components/ManufacturerRobotsGrid';
import { NewsCard } from '@/components/NewsCard';
import { SourceList } from '@/components/SourceList';
import {
  getManufacturerBySlug,
  getManufacturers,
  getReportsForManufacturer,
  getReports,
  getRobotsByManufacturerId,
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

  const robots = getRobotsByManufacturerId(manufacturer.id);
  const reports = getReportsForManufacturer(manufacturer.id);
  const sampleReports = getReports()
    .filter((report) => report.contentKind === 'sample')
    .slice(0, 3);
  const displayedReports = reports.length > 0 ? reports : sampleReports;
  const sections: ManufacturerDetailSectionLink[] = [
    { label: uiText.common.overview, href: '#overview' },
    { label: uiText.manufacturers.factSheet, href: '#facts' },
    { label: uiText.manufacturers.robotsSection, href: '#robots', count: robots.length },
    ...(displayedReports.length > 0
      ? [{ label: uiText.manufacturers.relatedReports, href: '#reports', count: displayedReports.length }]
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

      <div className="site-container py-5 sm:py-8">
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

        {displayedReports.length > 0 && (
          <ManufacturerDetailSection
            id="reports"
            eyebrow={uiText.manufacturers.relatedReports}
            title={uiText.manufacturers.relatedReports}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedReports.map((report) => (
                <NewsCard key={report.slug} report={report} />
              ))}
            </div>
          </ManufacturerDetailSection>
        )}

        <div className="py-8">
          <SourceList
            sources={manufacturer.sources}
            className="scroll-mt-site-header"
            titleClassName="text-lg font-semibold text-foreground mb-4"
          />
        </div>
      </div>
    </div>
  );
}
