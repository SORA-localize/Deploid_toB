import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { RobotImageCarousel } from '@/components/RobotImageCarousel';
import { RobotDetailStickyHeader } from '@/components/RobotDetailStickyHeader';
import { RobotStickyAside } from '@/components/RobotStickyAside';
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
  { label: uiText.common.overview,     href: '#overview'      },
  { label: '導入判断',                  href: '#decision'      },
  { label: uiText.robots.applications, href: '#applications'  },
  { label: uiText.robots.specifications, href: '#specs'       },
  { label: uiText.common.resources,    href: '#sources'       },
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

      <RobotDetailStickyHeader title={robot.nameJa ?? robot.name} sections={sections} />

      <div className="site-container py-8">
        <Breadcrumbs
          items={[
            { label: uiText.robots.breadcrumb, path: '/robots' },
            ...(manufacturer
              ? [{ label: manufacturer.name, path: `/manufacturers/${manufacturer.slug}` }]
              : []),
            { label: robot.nameJa ?? robot.name },
          ]}
        />

        {/* #overview — グリッド外・全幅 */}
        <div id="overview" className="mt-6 mb-6 scroll-mt-site-header">
          {manufacturer && (
            <Link
              href={`/manufacturers/${manufacturer.slug}`}
              className="mb-2 inline-flex text-xs text-muted-foreground hover:text-foreground"
            >
              <ManufacturerLogoName
                name={manufacturer.name}
                logo={manufacturer.logo}
                frameClassName="h-5 w-5"
                imageClassName="h-4 w-4"
              />
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            {robot.nameJa ?? robot.name}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {robot.description}
          </p>
        </div>

        {/* 2カラムグリッド — カルーセルと右カラムが同じ高さからスタート */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div className="min-w-0">

            {/* Image carousel */}
            <div className="mb-0">
              <RobotImageCarousel images={robot.images} fallbackHero={robot.heroImage} />
            </div>

            {/* #decision ── バイヤー向け情報を上位に */}
            <div id="decision" className="mt-8 py-8 border-b border-border scroll-mt-site-header">
              <h2 className="text-base font-semibold text-foreground mb-4">導入判断</h2>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  {decisionRows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-3 text-muted-foreground w-2/5 sm:w-1/3 align-top">
                        {row.label}
                      </td>
                      <td className="py-3 text-foreground font-medium align-top">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* #applications */}
            <div id="applications" className="py-8 border-b border-border scroll-mt-site-header">
              <h2 className="text-base font-semibold text-foreground mb-4">
                {uiText.robots.applications}
              </h2>
              <div className="space-y-4">
                {robot.comparison.bestFit.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-2">向く用途</h3>
                    <ul className="text-xs text-foreground/80 space-y-1">
                      {robot.comparison.bestFit.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-jade-9 mt-0.5">+</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {robot.comparison.constraints.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-2">制約・向かない用途</h3>
                    <ul className="text-xs text-foreground/80 space-y-1">
                      {robot.comparison.constraints.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-muted-foreground mt-0.5">−</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {robot.comparison.notFit.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-2">不向きな現場</h3>
                    <ul className="text-xs text-foreground/80 space-y-1">
                      {robot.comparison.notFit.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-muted-foreground mt-0.5">×</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(useCases.length > 0 || reports.length > 0) && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    {useCases.map((useCase) => (
                      <Link
                        key={useCase.slug}
                        href={`/use-cases/${useCase.slug}`}
                        className="text-xs px-3 py-1 border border-border hover:border-foreground/40 transition-colors text-foreground/80"
                      >
                        {useCase.titleJa ?? useCase.title}
                      </Link>
                    ))}
                    {reports.map((report) => (
                      <Link
                        key={report.slug}
                        href={`/reports/${report.slug}`}
                        className="text-xs px-3 py-1 border border-border hover:border-foreground/40 transition-colors text-foreground/80"
                      >
                        {report.titleJa ?? report.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* #specs */}
            <div id="specs" className="py-8 border-b border-border scroll-mt-site-header">
              <h2 className="text-base font-semibold text-foreground mb-4">
                {uiText.robots.technicalSpecifications}
              </h2>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  {specRows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-3 text-muted-foreground w-2/5 sm:w-1/3 align-top">
                        {row.label}
                      </td>
                      <td className="py-3 text-foreground font-medium align-top">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* #sources */}
            <SourceList
              id="sources"
              sources={robot.sources}
              className="py-8 border-b border-border scroll-mt-site-header"
              titleClassName="text-sm font-semibold text-foreground mb-4"
            />

            {/* prev / next */}
            <div className="flex items-center justify-between mt-6 pt-0">
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

          {/* ── RIGHT COLUMN — sticky sidebar ──────────── */}
          <RobotStickyAside robot={robot} manufacturer={manufacturer ?? undefined} />

        </div>
      </div>
    </div>
  );
}
