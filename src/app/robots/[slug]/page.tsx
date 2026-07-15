import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FeaturedRobotCard } from '@/components/FeaturedRobotCard';
import { JsonLd } from '@/components/JsonLd';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { RobotCardRail } from '@/components/RobotCardRail';
import { RobotDetailStickyHeader } from '@/components/RobotDetailStickyHeader';
import { RobotImageCarousel } from '@/components/RobotImageCarousel';
import { RobotSpecExplorer } from '@/components/RobotSpecExplorer';
import { RobotStickyAside } from '@/components/RobotStickyAside';
import { SourceList } from '@/components/SourceList';
import {
  getManufacturerForRobot,
  getManufacturers,
  getOfficialUseCasesForRobot,
  getRelatedRobotsForRobot,
  getRobotById,
  getRobots,
  getRobotsForDetail,
  resolveRobotDetailBySlug,
} from '@/lib/data';
import { sortRobots } from '@/lib/display';
import { shouldIndexRobot } from '@/lib/indexing';
import { breadcrumbJsonLd, robotJsonLd } from '@/lib/jsonLd';
import { createPageMetadata } from '@/lib/metadata';
import {
  getRobotSpecGroups,
  resolveRobotUsageExamples,
} from '@/lib/robotCatalog';
import { getRobotPrimaryImage } from '@/lib/robotMedia';
import { uiText } from '@/lib/uiText';

export function generateStaticParams() {
  // archived も詳細ページは残す（「提供終了」表示。一覧・比較には出ない）
  return getRobotsForDetail().map((robot) => ({ slug: robot.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: robot } = resolveRobotDetailBySlug(slug);
  const seo = robot?.seo;
  // archived（提供終了）は閲覧可能だが検索には載せない（§11.7）
  const noindex = robot ? !shouldIndexRobot(robot) : seo?.noindex;
  const title = seo?.metaTitle ?? (robot ? (robot.nameJa ?? robot.name) : 'Robot');
  const image = robot ? getRobotPrimaryImage(robot)?.src : undefined;

  return createPageMetadata({
    title,
    description: seo?.metaDescription ?? robot?.summary,
    path: robot ? `/robots/${robot.slug}` : undefined,
    image,
    noindex,
  });
}

export default async function RobotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: robot, redirectTo } = resolveRobotDetailBySlug(slug);
  if (redirectTo) permanentRedirect(`/robots/${redirectTo}`);
  if (!robot) notFound();

  const successor = robot.supersededById ? getRobotById(robot.supersededById) : undefined;
  const manufacturer = getManufacturerForRobot(robot.manufacturerId);
  const manufacturers = getManufacturers();
  const intendedUses = getOfficialUseCasesForRobot(robot.id);
  const usageExamples = resolveRobotUsageExamples(robot);
  const specGroups = getRobotSpecGroups(robot);
  const relatedRobots = getRelatedRobotsForRobot(robot);

  const all = sortRobots(getRobots(), 'featured', manufacturers);
  const index = all.findIndex((candidate) => candidate.id === robot.id);
  const previousRobot = index > 0 ? all[index - 1] : null;
  const nextRobot = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const sections = [
    { label: uiText.common.overview, href: '#overview' },
    { label: uiText.robots.detailedSpecifications, href: '#specs' },
    ...(intendedUses.length > 0
      ? [{ label: uiText.robots.intendedUses, href: '#intended-uses' }]
      : []),
    ...(usageExamples.length > 0
      ? [{ label: uiText.robots.usageExamples, href: '#usage-examples' }]
      : []),
    ...(relatedRobots.length > 0
      ? [{ label: uiText.robots.relatedRobots, href: '#related-robots' }]
      : []),
    { label: uiText.common.resources, href: '#sources' },
  ];
  const breadcrumbItems = [
    { label: uiText.robots.breadcrumb, path: '/robots' },
    ...(manufacturer
      ? [{ label: manufacturer.name, path: `/manufacturers/${manufacturer.slug}` }]
      : []),
    { label: robot.nameJa ?? robot.name },
  ];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={robotJsonLd(robot, manufacturer)} />
      <JsonLd
        data={breadcrumbJsonLd(
          breadcrumbItems.map((item) => ({
            name: item.label,
            path: item.path ?? `/robots/${robot.slug}`,
          })),
        )}
      />

      <RobotDetailStickyHeader title={robot.nameJa ?? robot.name} sections={sections} />

      <div className="site-container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        {robot.publishStatus === 'archived' && (
          <div className="mt-6 border border-border bg-muted px-4 py-3 text-xs text-foreground/80">
            <span className="font-semibold text-foreground">{uiText.robots.archivedNotice}</span>
            {uiText.robots.archivedDescription}
            {successor && (
              <>
                {' '}
                {uiText.robots.successor}:{' '}
                <Link
                  href={`/robots/${successor.slug}`}
                  className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                >
                  {successor.nameJa ?? successor.name}
                </Link>
              </>
            )}
          </div>
        )}

        <div id="overview" className="mb-6 mt-6 scroll-mt-site-header">
          {manufacturer && (
            <Link
              href={`/manufacturers/${manufacturer.slug}`}
              className="mb-2 inline-flex text-xs text-muted-foreground hover:text-foreground"
            >
              <ManufacturerLogoName
                name={manufacturer.name}
                logo={manufacturer.logo}
                logos={manufacturer.logos}
                variant="combined"
                targetAreaPx={20 * 96}
                maxHeightPx={20}
                maxWidthPx={96}
                hideName
              />
            </Link>
          )}
          <h1 className="mb-3 text-2xl font-semibold text-foreground md:text-3xl">
            {robot.nameJa ?? robot.name}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{robot.description}</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <div className="min-w-0">
            <RobotImageCarousel robot={robot} />

            <section id="specs" className="scroll-mt-site-header border-b border-border py-10">
              <h2 className="mb-5 text-lg font-semibold text-foreground">
                {uiText.robots.detailedSpecifications}
              </h2>
              <RobotSpecExplorer groups={specGroups} />
            </section>

            {intendedUses.length > 0 && (
              <section
                id="intended-uses"
                className="scroll-mt-site-header border-b border-border py-8"
              >
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="font-semibold">{uiText.robots.intendedUses}：</span>
                  {intendedUses.map((useCase, useCaseIndex) => (
                    <span key={useCase.id}>
                      {useCaseIndex > 0 && <span className="text-muted-foreground"> / </span>}
                      <Link
                        href={useCase.href}
                        className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                      >
                        {useCase.label}
                      </Link>
                    </span>
                  ))}
                </p>
              </section>
            )}

            {usageExamples.length > 0 && (
              <section
                id="usage-examples"
                className="scroll-mt-site-header border-b border-border py-8"
              >
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {uiText.robots.usageExamples}
                </h2>
                <ul className="divide-y divide-border border-y border-border">
                  {usageExamples.map((example) => (
                    <li key={example.url} className="py-4">
                      <a
                        href={example.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 text-sm font-medium leading-relaxed text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                      >
                        {example.title}
                      </a>
                      {(example.publisher || example.publishedAt) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[example.publisher, example.publishedAt].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {relatedRobots.length > 0 && (
              <section
                id="related-robots"
                className="scroll-mt-site-header border-b border-border py-8"
              >
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {uiText.robots.relatedRobots}
                </h2>
                <RobotCardRail ariaLabel={uiText.robots.relatedRobots}>
                  {relatedRobots.map((relatedRobot) => (
                    <FeaturedRobotCard
                      key={relatedRobot.id}
                      robot={relatedRobot}
                      manufacturerName={manufacturer?.name}
                    />
                  ))}
                </RobotCardRail>
              </section>
            )}

            <SourceList
              id="sources"
              sources={robot.sources}
              className="scroll-mt-site-header border-b border-border py-8"
              titleClassName="mb-4 text-lg font-semibold text-foreground"
            />

            {(previousRobot || nextRobot) && (
              <nav
                aria-label="前後のロボット"
                className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-2"
              >
                {previousRobot ? (
                  <Link
                    href={`/robots/${previousRobot.slug}`}
                    className="inline-flex min-w-0 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                      {previousRobot.nameJa ?? previousRobot.name}
                    </span>
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}
                {nextRobot ? (
                  <Link
                    href={`/robots/${nextRobot.slug}`}
                    className="inline-flex min-w-0 items-center justify-start gap-2 text-xs text-muted-foreground hover:text-foreground sm:justify-end sm:text-right"
                  >
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                      {nextRobot.nameJa ?? nextRobot.name}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}
              </nav>
            )}
          </div>

          <RobotStickyAside robot={robot} manufacturer={manufacturer ?? undefined} />
        </div>
      </div>
    </div>
  );
}
