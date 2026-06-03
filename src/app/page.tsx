import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { FeaturedRobotsGrid } from '@/components/FeaturedRobotsGrid';
import { HomeContentNavigator } from '@/components/HomeContentNavigator';
import { ManufacturerWorldMap } from '@/components/ManufacturerWorldMap';
import { RobotCard } from '@/components/RobotCard';
import { TagChip } from '@/components/TagChip';
import {
  getGuideBySlug,
  getGuides,
  getManufacturers,
  getManufacturerForRobot,
  getReports,
  getRobots,
  getDeploymentsForManufacturer,
} from '@/lib/data';
import { reportTypeLabels } from '@/lib/labels';
import { getDisplayableAsset } from '@/lib/media';
import { getTagLabel } from '@/lib/tags';

export default function HomePage() {
  const featured = getGuideBySlug('decision-variables') ?? getGuides()[0];
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
      deployments: getDeploymentsForManufacturer(manufacturer.slug).map((d) => ({
        lat: d.location.lat,
        lng: d.location.lng,
        customer: d.customer,
        status: d.status,
      })),
    }];
  });

  // 注目ロボット：更新日の新しい順に3件
  const featuredRobots = [...getRobots()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  const robotPreviewAssets = featuredRobots.flatMap((robot) => {
    const asset = getDisplayableAsset(robot.images?.hero ?? robot.heroImage);
    return asset ? [{ src: asset.src, alt: asset.alt, label: robot.name }] : [];
  });

  const manufacturerPreviewAssets = manufacturers.flatMap((manufacturer) => {
    const asset = getDisplayableAsset(manufacturer.logo);
    return asset ? [{ src: asset.src, alt: asset.alt, label: manufacturer.nameJa ?? manufacturer.name }] : [];
  }).slice(0, 7);

  const guidePreviewAssets = featuredRobots.flatMap((robot) => {
    const asset = getDisplayableAsset(
      robot.images?.inOperation ??
      robot.images?.scale ??
      robot.images?.hero ??
      robot.heroImage,
    );
    return asset ? [{ src: asset.src, alt: asset.alt, label: robot.name }] : [];
  });

  // 最新記事：公開日の新しい順に3件
  const latestReports = [...getReports()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  const manufacturerBySlug = Object.fromEntries(
    manufacturers.map((m) => [m.slug, m])
  );

  return (
    <>
      <ManufacturerWorldMap
        manufacturers={mapPoints}
        heading={"日本の未来を\nヒューマノイドと共に\n切り開く。"}
        subcopy={"技術の理解から調達の実務まで、実装に必要なプロセスをすべて体系化。\n職種を問わず、社会実装に挑むすべての人が参照できる実践ガイドです。"}
      />

      <div className="site-container py-12">
      <HomeContentNavigator
        robotAssets={robotPreviewAssets}
        manufacturerAssets={manufacturerPreviewAssets}
        guideAssets={guidePreviewAssets}
      />

      {featuredRobots.length > 0 && (
        <FeaturedRobotsGrid
          robots={featuredRobots}
          manufacturerBySlug={manufacturerBySlug}
        />
      )}

      {latestReports.length > 0 && (
        <section className="py-16 border-b border-border">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-semibold text-foreground">最新記事</h2>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              すべて見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestReports.map((report) => (
              <Link
                key={report.slug}
                href={`/reports/${report.slug}`}
                className="border border-border bg-card p-6 hover:border-ring transition-colors"
              >
                <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                  <TagChip>
                    {reportTypeLabels[report.type]}
                  </TagChip>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {report.publishedAt}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 leading-tight">
                  {report.titleJa ?? report.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-3">
                  {report.summary}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-foreground">
                  続きを読む
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured && (
        <section className="py-16 border-b border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-8">注目の導入ガイド</h2>
          <div className="border border-border bg-card">
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {featured.titleJa ?? featured.title}
                  </h3>
                  <p className="text-muted-foreground">{featured.summary}</p>
                </div>
                <Link
                  href={`/guides/${featured.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors ml-6"
                >
                  続きを読む
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex gap-2 mt-4">
                {featured.topics.slice(0, 3).map((topic) => (
                  <TagChip key={topic} className="py-1">
                    {getTagLabel(topic, 'guide-topic')}
                  </TagChip>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">このサイトについて</h2>
          <p className="text-muted-foreground mb-6 max-w-3xl">
            本ポータルは、日本企業の設備投資担当者・技術責任者を対象に、ヒューマノイドロボット導入に関する客観的な情報を提供します。
            特定メーカーの販売促進を目的とせず、導入判断に必要な技術情報・調達プロセス・リスク評価の枠組みを提示します。
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-foreground hover:text-foreground/80"
          >
            詳しく見る
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}
