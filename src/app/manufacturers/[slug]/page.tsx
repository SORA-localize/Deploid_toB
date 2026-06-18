import { notFound, permanentRedirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { ManufacturerDetailHero } from '@/components/ManufacturerDetailHero';
import { ManufacturerDetailSection } from '@/components/ManufacturerDetailSection';
import type { ManufacturerDetailSectionLink } from '@/components/ManufacturerDetailSectionNav';
import { ManufacturerDetailStickyHeader } from '@/components/ManufacturerDetailStickyHeader';
import { ManufacturerFactSheet } from '@/components/ManufacturerFactSheet';
import { ManufacturerRobotsGrid } from '@/components/ManufacturerRobotsGrid';
import { NewsCard } from '@/components/NewsCard';
import { SourceList } from '@/components/SourceList';
import {
  resolveManufacturerDetailBySlug,
  getManufacturers,
  getArticlesForManufacturer,
  getArticles,
  getRobotsByManufacturerId,
} from '@/lib/data';
import { sortRobots } from '@/lib/display';
import { breadcrumbJsonLd, manufacturerJsonLd } from '@/lib/jsonLd';
import { createPageMetadata } from '@/lib/metadata';
import { uiText } from '@/lib/uiText';

export function generateStaticParams() {
  return getManufacturers().map((manufacturer) => ({ slug: manufacturer.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: manufacturer } = resolveManufacturerDetailBySlug(slug);
  const seo = manufacturer?.seo;
  const title =
    seo?.metaTitle ?? (manufacturer ? (manufacturer.nameJa ?? manufacturer.name) : 'Manufacturer');

  return createPageMetadata({
    title,
    description: seo?.metaDescription ?? manufacturer?.description,
    path: manufacturer ? `/manufacturers/${manufacturer.slug}` : undefined,
    noindex: seo?.noindex,
  });
}

export default async function ManufacturerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: manufacturer, redirectTo } = resolveManufacturerDetailBySlug(slug);
  if (redirectTo) permanentRedirect(`/manufacturers/${redirectTo}`);
  if (!manufacturer) notFound();

  const robots = sortRobots(getRobotsByManufacturerId(manufacturer.id), 'name', [manufacturer]);
  const reports = getArticlesForManufacturer(manufacturer.id);
  const sampleReports = getArticles()
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
      <JsonLd data={manufacturerJsonLd(manufacturer)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'ホーム', path: '/' },
          { name: uiText.manufacturers.breadcrumb, path: '/manufacturers' },
          { name: manufacturerName, path: `/manufacturers/${manufacturer.slug}` },
        ])}
      />
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {displayedReports.map((report) => (
                <NewsCard key={report.id} report={report} />
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
