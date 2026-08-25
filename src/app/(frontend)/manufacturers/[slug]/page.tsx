import { cacheLife, cacheTag } from 'next/cache';
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
import { createArticleCatalogItems } from '@/lib/viewModels/articles';
import { SourceList } from '@/components/SourceList';
import { contentTags } from '@/lib/content/cacheTags';
import type { SlugResolution } from '@/lib/content/contracts';
import type { ContentRepository } from '@/lib/content/createContentRepository';
import { resolveDraftAwarePageData } from '@/lib/content/draftAwarePageData';
import type { Manufacturer } from '@/lib/content/domainTypes';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { withMeasuredLogoAspect } from '@/lib/manufacturerLogoEnrich';
import { sortRobots } from '@/lib/display';
import { shouldIndexPublishedRecord } from '@/lib/indexing';
import { breadcrumbJsonLd, manufacturerJsonLd } from '@/lib/jsonLd';
import { createPageMetadata } from '@/lib/metadata';
import { uiText } from '@/lib/uiText';
import { createRobotCatalogItems, type RobotCatalogItem } from '@/lib/viewModels/robots';

export async function generateStaticParams() {
  const repository = await getContentRepository();
  const manufacturers = await repository.listAllPublishedManufacturers();
  const params = manufacturers.map((manufacturer) => ({ slug: manufacturer.slug }));
  return params.length > 0 || process.env.CI !== 'true' ? params : [{ slug: '__ci_empty__' }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // fix round 1: 別途uncachedなrepository呼び出しをここで行うと、本体page（'use cache'）と
  // generateMetadataでcache有無が食い違い、Cache Componentsが
  // "generateMetadata depends on uncached data when the rest of the route does not" として
  // build失敗させる（CONTENT_SOURCE=payload構成で実機確認済み）。同じcached関数を共有する。
  const { data, isDraftPreview } = await resolveDraftAwarePageData(
    slug,
    getCachedManufacturerDetailData,
    getDraftManufacturerDetailData,
  );
  const manufacturer = data.kind === 'found' ? data.manufacturer : undefined;
  const seo = manufacturer?.seo;
  const title =
    seo?.metaTitle ?? (manufacturer ? (manufacturer.nameJa ?? manufacturer.name) : 'Manufacturer');

  return createPageMetadata({
    title,
    description: seo?.metaDescription ?? manufacturer?.description,
    path: manufacturer ? `/manufacturers/${manufacturer.slug}` : undefined,
    noindex: isDraftPreview || (manufacturer ? !shouldIndexPublishedRecord(manufacturer) : seo?.noindex),
  });
}

type ManufacturerDetailData =
  | { kind: 'redirect'; redirectTo: string }
  | { kind: 'not-found' }
  | {
      kind: 'found';
      manufacturer: Manufacturer;
      robotCount: number;
      robotItems: RobotCatalogItem[];
      displayedReportItems: ReturnType<typeof createArticleCatalogItems>;
      sections: ManufacturerDetailSectionLink[];
      manufacturerName: string;
    };

/**
 * データ取得だけを`'use cache'`にする（Task 7 Step 3）。`notFound()` / `permanentRedirect()`は
 * Next.jsのnavigation制御なので、cacheされた関数の外（呼び出し元の`ManufacturerDetailPage`）で
 * 判断する——`/robots` の `CachedRobotsList` と同じ「データ取得はcache、制御フローは外」という
 * 既存パターンをdynamic route detailページへ適用したもの。
 *
 * Manufacturer詳細の依存表（`lib/content/cacheDependencies.ts`）:
 * manufacturers, robots, articles, useCases。
 *
 * **`distributors` / `robotSeries` / `media` は含めない（fix round 1 / Critical 2）。**
 * brief Step 3の依存表はこの3つも挙げているが、このページが実際に呼ぶrepositoryメソッド
 * （`resolveManufacturerDetailBySlug` / `listRobotsByManufacturerId` /
 * `listArticlesForManufacturerId` / `listAllPublishedArticles` / `listAllPublishedUseCases`）は
 * どれもこの3 collectionを読まない——画面に出る「取扱代理店」は
 * `Manufacturer.domesticDistributors` という別の埋め込みfieldで、`Distributor` collectionとは
 * 無関係。以前は`cacheTag(contentTags.distributors)`のような、Step 5.5の「全collectionに
 * 最低1 consumer」を機械的に満たすための見せかけの紐付けを足していた（reviewerのCritical指摘で
 * 発覚、ユーザー承認済み）。`distributors` / `robotSeries` / `media` に実consumerが無いことは
 * `lib/content/cacheDependencies.ts` の `KNOWN_GAPS` に明示的に扱う。
 */
async function getCachedManufacturerDetailData(slug: string): Promise<ManufacturerDetailData> {
  'use cache';
  cacheLife('hours');
  cacheTag(contentTags.manufacturers);
  cacheTag(contentTags.robots);
  cacheTag(contentTags.articles);
  cacheTag(contentTags.useCases);

  const repository = await getContentRepository();
  return buildManufacturerDetailData(repository, await repository.resolveManufacturerDetailBySlug(slug));
}

/**
 * Draft Mode専用のuncached経路（task7-draft-mode-wiring-brief.md）。`'use cache'`を**持たない**
 * ——draft modeが有効かつ`getActivePreviewSession()`検証済みの場合だけ、
 * `resolveDraftAwarePageData()`経由で呼ばれる。共有cacheへ絶対に載らない。
 */
async function getDraftManufacturerDetailData(slug: string): Promise<ManufacturerDetailData> {
  const repository = await getContentRepository();
  return buildManufacturerDetailData(repository, await repository.resolveManufacturerDraftDetailBySlug(slug));
}

/**
 * notFound/redirect判定・関連データの組み立てなど、cache有無に依存しない部分の共通ロジック
 * （task7-draft-mode-wiring-brief.md: cached経路とdraft経路でロジックを二重化しない）。
 */
async function buildManufacturerDetailData(
  repository: ContentRepository,
  resolution: SlugResolution<Manufacturer>,
): Promise<ManufacturerDetailData> {
  const { record: manufacturerRaw, redirectTo } = resolution;
  if (redirectTo) return { kind: 'redirect', redirectTo };
  if (!manufacturerRaw) return { kind: 'not-found' };
  const manufacturer = withMeasuredLogoAspect(manufacturerRaw);

  const [robotsRaw, reports, allArticles, useCases] = await Promise.all([
    repository.listRobotsByManufacturerId(manufacturer.id),
    repository.listArticlesForManufacturerId(manufacturer.id),
    repository.listAllPublishedArticles(),
    repository.listAllPublishedUseCases(),
  ]);
  const robots = sortRobots(robotsRaw, 'name', [manufacturer]);
  const robotItems = createRobotCatalogItems(robots, [manufacturer], useCases);
  const sampleReports = allArticles
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

  return {
    kind: 'found',
    manufacturer,
    robotCount: robots.length,
    robotItems,
    displayedReportItems: createArticleCatalogItems(displayedReports),
    sections,
    manufacturerName,
  };
}

export default async function ManufacturerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await resolveDraftAwarePageData(slug, getCachedManufacturerDetailData, getDraftManufacturerDetailData);
  if (data.kind === 'redirect') permanentRedirect(`/manufacturers/${data.redirectTo}`);
  if (data.kind === 'not-found') notFound();
  const { manufacturer, robotCount, robotItems, displayedReportItems, sections, manufacturerName } = data;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={manufacturerJsonLd(manufacturer)} />
      <JsonLd
        data={breadcrumbJsonLd([
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

        <ManufacturerDetailHero manufacturer={manufacturer} />

        <ManufacturerFactSheet manufacturer={manufacturer} robotCount={robotCount} />

        <ManufacturerDetailSection
          id="robots"
          title={uiText.manufacturers.robotsSection}
          action={
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {uiText.manufacturers.models(robotCount)}
            </span>
          }
        >
          <ManufacturerRobotsGrid items={robotItems} />
        </ManufacturerDetailSection>

        {displayedReportItems.length > 0 && (
          <ManufacturerDetailSection
            id="reports"
            title={uiText.manufacturers.relatedReports}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {displayedReportItems.map((report) => (
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
