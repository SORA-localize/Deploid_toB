import Link from 'next/link';
import { cacheLife, cacheTag } from 'next/cache';
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
import { contentTags } from '@/lib/content/cacheTags';
import { resolveDraftAwarePageData } from '@/lib/content/draftAwarePageData';
import type { ContentRepository } from '@/lib/content/createContentRepository';
import type { SlugResolution } from '@/lib/content/contracts';
import type { Robot } from '@/lib/content/domainTypes';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { sortRobots } from '@/lib/display';
import { shouldIndexRobot } from '@/lib/indexing';
import { breadcrumbJsonLd, robotJsonLd } from '@/lib/jsonLd';
import { createPageMetadata } from '@/lib/metadata';
import {
  getRobotSpecGroups,
  resolveOfficialUseCasesForRobot,
  resolveRobotUsageExamples,
  resolveSameManufacturerRobots,
} from '@/lib/robotCatalog';
import { getRobotPrimaryImage } from '@/lib/robotMedia';
import { uiText } from '@/lib/uiText';

export async function generateStaticParams() {
  // archived も詳細ページは残す（「提供終了」表示。一覧・比較には出ない）
  const repository = await getContentRepository();
  const robots = await repository.listRobotsForDetail();
  const params = robots.map((robot) => ({ slug: robot.slug }));
  return params.length > 0 || process.env.CI !== 'true' ? params : [{ slug: '__ci_empty__' }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // fix round 1: 別途uncachedなrepository呼び出しをここで行うと、本体page（'use cache'）と
  // generateMetadataでcache有無が食い違い、Cache Componentsが
  // "generateMetadata depends on uncached data when the rest of the route does not" として
  // build失敗させる（CONTENT_SOURCE=payload構成で実機確認済み）。同じcached関数を共有する。
  // draft mode配線後も同様の理由で、本体pageと同じ`resolveDraftAwarePageData`を共有する
  // （`draftMode()`はNext.jsが明示的にサポートするdynamic API——生のuncached呼び出しとは違い、
  // `'use cache'`関数と同居してもCache Componentsのbuild検査には抵触しない）。
  const { data, isDraftPreview } = await resolveDraftAwarePageData(slug, getCachedRobotDetailData, getDraftRobotDetailData);
  const robot = data.kind === 'found' ? data.robot : undefined;
  const seo = robot?.seo;
  // archived（提供終了）は閲覧可能だが検索には載せない（§11.7）。draft preview中も同様にnoindex。
  const noindex = isDraftPreview || (robot ? !shouldIndexRobot(robot) : seo?.noindex);
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

/**
 * notFound/redirect判定・関連データの組み立てなど、cache有無に依存しない部分の共通ロジック
 * （task7-draft-mode-wiring-brief.md: cached経路とdraft経路でロジックを二重化しない）。
 * `resolution`はcached経路（`repository.resolveRobotDetailBySlug`）・draft経路
 * （`repository.resolveRobotDraftDetailBySlug`）のどちらの結果でも受け取れる——両者は同じ
 * `SlugResolution<Robot>`形を返す。
 */
async function buildRobotDetailData(repository: ContentRepository, resolution: SlugResolution<Robot>) {
  const { record: robot, redirectTo } = resolution;
  if (redirectTo) return { kind: 'redirect' as const, redirectTo };
  if (!robot) return { kind: 'not-found' as const };

  // Task 6 fix round 2（reviewer Medium指摘への対応）: 詳細ページ1件ごとに全collectionを
  // 走査しない。「同じ用途の候補ロボットか」「同じメーカーの関連ロボットか」はrobot単位で
  // 絞り込めるため、既存のrepositoryの絞り込みメソッド（`listUseCasesForRobotId` /
  // `listRobotsByManufacturerId`）へ寄せる。前後ナビゲーション用の全ロボット走査
  // （`allRobots` → `sortRobots(..., 'featured', ...)`）は今回のスコープでは対応しない
  // （Task 7のcache導入と合わせて再設計する。task-6-report.md参照）。
  const [successor, manufacturer, manufacturers, useCasesForRobot, sameManufacturerRobots, allRobots] =
    await Promise.all([
      robot.supersededById ? repository.getRobotById(robot.supersededById) : Promise.resolve(undefined),
      repository.getManufacturerById(robot.manufacturerId),
      repository.listAllPublishedManufacturers(),
      repository.listUseCasesForRobotId(robot.id),
      repository.listRobotsByManufacturerId(robot.manufacturerId),
      repository.listAllPublishedRobots(),
    ]);
  const intendedUses = resolveOfficialUseCasesForRobot(robot.id, useCasesForRobot);
  const usageExamples = resolveRobotUsageExamples(robot);
  const specGroups = getRobotSpecGroups(robot);
  const relatedRobots = resolveSameManufacturerRobots(robot, sameManufacturerRobots, manufacturers);

  const all = sortRobots(allRobots, 'featured', manufacturers);
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

  return {
    kind: 'found' as const,
    robot,
    manufacturer,
    successor,
    sections,
    breadcrumbItems,
    previousRobot,
    nextRobot,
    intendedUses,
    usageExamples,
    relatedRobots,
    specGroups,
  };
}

/**
 * データ取得だけを`'use cache'`にする（Task 7 Step 3、`/manufacturers/[slug]`と同じパターン）。
 * `notFound()` / `permanentRedirect()`はcacheされた関数の外（呼び出し元）で判断する。
 *
 * Robot詳細の依存表（`lib/content/cacheDependencies.ts`）: robots, manufacturers, useCases。
 * briefの依存表は`robotSeries`/`media`も挙げるが、このpageはどちらも実際には読まない
 * （`robot.seriesId`はrobot自身のfieldとして既に`robots`タグの範囲内。`media`は
 * `Media` collectionをサイト上のどのpageも読まない——`KNOWN_GAPS`参照）ため含めない
 * （Critical 2と同じ理由——実際に読まないcollectionのtagは足さない）。
 */
async function getCachedRobotDetailData(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag(contentTags.robots);
  cacheTag(contentTags.manufacturers);
  cacheTag(contentTags.useCases);

  const repository = await getContentRepository();
  return buildRobotDetailData(repository, await repository.resolveRobotDetailBySlug(slug));
}

/**
 * Draft Mode専用のuncached経路（task7-draft-mode-wiring-brief.md）。`'use cache'`を**持たない**
 * ——draft modeが有効かつ`getActivePreviewSession()`検証済みの場合だけ、
 * `resolveDraftAwarePageData()`経由で呼ばれる。共有cacheへ絶対に載らない。
 */
async function getDraftRobotDetailData(slug: string) {
  const repository = await getContentRepository();
  return buildRobotDetailData(repository, await repository.resolveRobotDraftDetailBySlug(slug));
}

export default async function RobotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await resolveDraftAwarePageData(slug, getCachedRobotDetailData, getDraftRobotDetailData);
  if (data.kind === 'redirect') permanentRedirect(`/robots/${data.redirectTo}`);
  if (data.kind === 'not-found') notFound();
  const {
    robot,
    manufacturer,
    successor,
    sections,
    breadcrumbItems,
    previousRobot,
    nextRobot,
    intendedUses,
    usageExamples,
    relatedRobots,
    specGroups,
  } = data;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={robotJsonLd(robot, manufacturer ?? undefined)} />
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
