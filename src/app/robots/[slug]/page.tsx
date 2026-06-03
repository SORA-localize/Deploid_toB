import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { RobotImageCarousel } from '@/components/RobotImageCarousel';
import { SourceList } from '@/components/SourceList';
import {
  getManufacturerForRobot,
  getReportsForRobot,
  getRobotBySlug,
  getRobots,
  getUseCasesForRobot,
} from '@/lib/data';
import { getRobotDetailDecisionRows, getRobotDetailSpecRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

const sections = [
  { label: uiText.common.overview, href: '#overview' },
  { label: uiText.robots.specifications, href: '#specs' },
  { label: uiText.robots.decision, href: '#decision' },
  { label: uiText.robots.applications, href: '#applications' },
  { label: uiText.common.resources, href: '#sources' },
];

export function generateStaticParams() {
  return getRobots().map((robot) => ({ slug: robot.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);
  const seo = robot?.seo;
  return {
    title: seo?.metaTitle ?? (robot ? (robot.nameJa ?? robot.name) : 'Robot'),
    description: seo?.metaDescription ?? robot?.summary,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function RobotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);
  if (!robot) notFound();

  const manufacturer = getManufacturerForRobot(robot.manufacturerSlug);
  const useCases = getUseCasesForRobot(robot.slug);
  const reports = getReportsForRobot(robot.slug);

  const all = getRobots();
  const idx = all.findIndex((r) => r.slug === robot.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const specRows = getRobotDetailSpecRows(robot, manufacturer);
  const decisionRows = getRobotDetailDecisionRows(robot);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="site-container">
          <div className="flex items-center gap-6 py-4 text-xs overflow-x-auto">
            {sections.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap pb-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="site-container py-12">
        <Breadcrumbs
          items={[
            { label: uiText.robots.breadcrumb, path: '/robots' },
            ...(manufacturer
              ? [{ label: manufacturer.name, path: `/manufacturers/${manufacturer.slug}` }]
              : []),
            { label: robot.nameJa ?? robot.name },
          ]}
        />

        <div id="overview" className="mb-8 scroll-mt-6">
          {manufacturer && (
            <Link
              href={`/manufacturers/${manufacturer.slug}`}
              className="mb-3 inline-flex text-xs text-muted-foreground hover:text-foreground"
            >
              <ManufacturerLogoName
                name={manufacturer.name}
                logo={manufacturer.logo}
                frameClassName="h-5 w-5"
                imageClassName="h-4 w-4"
              />
            </Link>
          )}
          <h1 className="text-3xl font-semibold text-foreground mb-3">{robot.nameJa ?? robot.name}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{robot.description}</p>
        </div>

        <div className="mb-12">
          <RobotImageCarousel images={robot.images} fallbackHero={robot.heroImage} />
        </div>

        <div id="specs" className="border border-border bg-muted mb-12 scroll-mt-6">
          <div className="px-6 py-4 border-b border-border bg-card">
            <h2 className="text-sm font-semibold text-foreground">
              {uiText.robots.technicalSpecifications}
            </h2>
          </div>
          <div className="p-6">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border">
                {specRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 text-muted-foreground w-1/3">{row.label}</td>
                    <td className="py-3 text-foreground font-medium">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="decision" className="border border-border bg-muted mb-12 scroll-mt-6">
          <div className="px-6 py-4 border-b border-border bg-card">
            <h2 className="text-sm font-semibold text-foreground">導入判断</h2>
          </div>
          <div className="p-6">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border">
                {decisionRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 text-muted-foreground w-1/3">{row.label}</td>
                    <td className="py-3 text-foreground font-medium">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="applications" className="border border-border bg-muted mb-12 scroll-mt-6">
          <div className="px-6 py-4 border-b border-border bg-card">
            <h2 className="text-sm font-semibold text-foreground">{uiText.robots.applications}</h2>
          </div>
          <div className="p-6">
            <p className="text-xs text-foreground/80 leading-relaxed mb-4">{robot.summary}</p>
            {robot.comparison.bestFit.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-semibold text-foreground">向く用途</h3>
                <ul className="text-xs text-foreground/80 space-y-1">
                  {robot.comparison.bestFit.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {robot.comparison.constraints.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-semibold text-foreground">制約</h3>
                <ul className="text-xs text-foreground/80 space-y-1">
                  {robot.comparison.constraints.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(useCases.length > 0 || reports.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {useCases.map((useCase) => (
                  <Link
                    key={useCase.slug}
                    href={`/use-cases/${useCase.slug}`}
                    className="text-xs px-3 py-1 bg-card border border-border hover:border-foreground/40 transition-colors text-foreground/80"
                  >
                    {useCase.titleJa ?? useCase.title}
                  </Link>
                ))}
                {reports.map((report) => (
                  <Link
                    key={report.slug}
                    href={`/reports/${report.slug}`}
                    className="text-xs px-3 py-1 bg-card border border-border hover:border-foreground/40 transition-colors text-foreground/80"
                  >
                    {report.titleJa ?? report.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <SourceList
          sources={robot.sources}
          className="border border-border bg-muted p-6 scroll-mt-6"
          titleClassName="text-sm font-semibold text-foreground mb-4"
        />

        <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
          {prev ? (
            <Link
              href={`/robots/${prev.slug}`}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              {prev.nameJa ?? prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/robots/${next.slug}`}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {next.nameJa ?? next.name}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
