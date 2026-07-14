import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FeaturedRobotsGrid } from '@/components/FeaturedRobotsGrid';
import { FeaturedUseCasesGrid } from '@/components/FeaturedUseCasesGrid';
import { HomeContentNavigator } from '@/components/HomeContentNavigator';
import { JsonLd } from '@/components/JsonLd';
import { ManufacturerWorldMap } from '@/components/ManufacturerWorldMap';
import { NewsFeatureCard } from '@/components/NewsFeatureCard';
import { NewsHeroCarousel } from '@/components/NewsHeroCarousel';
import {
  getManufacturers,
  getArticles,
  getRobots,
  getUseCases,
  getDeploymentsForManufacturer,
} from '@/lib/data';
import { sortRobots, sortUseCases } from '@/lib/display';
import { getDisplayableAsset } from '@/lib/media';
import { resolveManufacturerLogo } from '@/lib/manufacturerLogo';
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonLd';
import {
  createPageMetadata,
  defaultSiteDescription,
  defaultSiteTitle,
} from '@/lib/metadata';
import { getArticleIndexPlacementReports } from '@/lib/articlePlacements';
import { uiText } from '@/lib/uiText';

export const metadata = createPageMetadata({
  title: defaultSiteTitle,
  description: defaultSiteDescription,
  path: '/',
});

export default function HomePage() {
  const manufacturers = getManufacturers();
  const mapPoints = manufacturers.flatMap((manufacturer) => {
    if (!manufacturer.headquarters) {
      return [];
    }

    return [{
      slug: manufacturer.slug,
      name: manufacturer.nameJa ?? manufacturer.name,
      country: manufacturer.country,
      lat: manufacturer.headquarters.lat,
      lng: manufacturer.headquarters.lng,
      foundedYear: manufacturer.foundedYear,
      logoSrc: resolveManufacturerLogo(manufacturer, 'wordmark').asset?.src,
      deployments: getDeploymentsForManufacturer(manufacturer.id).map((d) => ({
        lat: d.location.lat,
        lng: d.location.lng,
        customer: d.customer,
        status: d.status,
      })),
    }];
  });

  // 注目ロボット：featuredRank（編集ピック）→ deploymentStage → updatedAt の優先順で5件
  const featuredRobots = sortRobots(getRobots(), 'home-featured').slice(0, 5);

  // 用途から探す：用途一覧と同じカードを、Homeではプレビューとして全件表示する。
  const homeUseCases = sortUseCases(getUseCases());

  // HomeContentNavigator 用プレビュー画像の型（component側の PreviewAsset と同形）。
  type PreviewAsset = { src: string; alt: string; label: string; objectPosition?: string };

  // ロボットタブの背景は1枚だけ見せる（サムネ帯は出さない）。機体は編集判断で指名し、
  // 画像パスは直書きせず rights（getDisplayableAsset）を通して解決する。直書きすると
  // rights.status が blocked に変わってもここだけ表示され続けてしまうため。
  // 指名機体が表示不可になった場合は、表示可能な機体の先頭へ自動フォールバックする。
  const HOME_ROBOT_PREVIEW_ID = 'figure-03';
  const resolveRobotPreview = (robot: ReturnType<typeof getRobots>[number]) => {
    const asset = getDisplayableAsset(
      robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage,
    );
    return asset
      ? { src: asset.src, alt: asset.alt, label: robot.nameJa ?? robot.name }
      : undefined;
  };
  const robotPreviewAssets: PreviewAsset[] = (() => {
    const pool = getRobots();
    const pinned = pool.find((robot) => robot.id === HOME_ROBOT_PREVIEW_ID);
    for (const robot of [pinned, ...pool]) {
      const preview = robot && resolveRobotPreview(robot);
      if (preview) return [preview];
    }
    return [];
  })();

  // Unsplash: Jonathan Phillips / https://unsplash.com/photos/fTxWB2uCBz8 / Unsplash License
  const manufacturerPreviewAssets: typeof robotPreviewAssets = [
    { src: '/images/home/manufacturers/office-building-dusk.jpg', alt: 'Modern office building exterior at dusk', label: 'Headquarters', objectPosition: 'center' },
  ];

  // Unsplash: Adrian Sulyok / https://unsplash.com/photos/c_4eaGRDSVU / Unsplash License
  const useCasePreviewAssets: typeof robotPreviewAssets = [
    { src: '/images/home/use-cases/warehouse-workers-aisle.jpg', alt: 'Workers walking through a warehouse aisle', label: 'Warehouse', objectPosition: 'center' },
  ];

  const { heroReports, featureReports } = getArticleIndexPlacementReports(getArticles());

  const manufacturerById = Object.fromEntries(
    manufacturers.map((m) => [m.id, m])
  );

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />

      <ManufacturerWorldMap
        manufacturers={mapPoints}
        heading={uiText.home.worldMap.heading}
        subcopy={uiText.home.worldMap.subcopy}
      />

      <div className="site-container py-6 sm:py-10">
      <HomeContentNavigator
        robotAssets={robotPreviewAssets}
        manufacturerAssets={manufacturerPreviewAssets}
        useCaseAssets={useCasePreviewAssets}
      />

      {featuredRobots.length > 0 && (
        <FeaturedRobotsGrid
          robots={featuredRobots}
          manufacturerById={manufacturerById}
        />
      )}

      {homeUseCases.length > 0 && (
        <FeaturedUseCasesGrid useCases={homeUseCases} />
      )}

      {heroReports.length > 0 && (
        <section className="py-8 sm:py-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">注目記事</h2>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              すべて見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NewsHeroCarousel reports={heroReports} className="aspect-[16/9] w-full" />
            </div>
            {featureReports.length > 0 && (
              <div className="hidden lg:flex flex-col gap-4 h-full">
                {featureReports.map((r) => (
                  <NewsFeatureCard key={r.id} report={r} className="flex-1 min-h-0" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      </div>
    </>
  );
}
