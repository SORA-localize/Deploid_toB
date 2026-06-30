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
import { sortRobots } from '@/lib/display';
import { getDisplayableAsset } from '@/lib/media';
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
      logoSrc: getDisplayableAsset(manufacturer.logo)?.src,
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
  const homeUseCases = getUseCases();

  // HomeContentNavigator 用プレビュー画像。表示可否は data 側の rights と lib/media.ts で管理し、
  // ここではローカルに存在する表示可能アセットだけを参照する。
  const robotPreviewAssets = [
    { src: '/images/robots/mentee-menteebotv3-hero.jpg', alt: 'MenteeBot humanoid robot', label: 'MenteeBot', objectPosition: 'center' },
  ];

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
