import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FeaturedRobotsGrid } from '@/components/FeaturedRobotsGrid';
import { HomeContentNavigator } from '@/components/HomeContentNavigator';
import { ManufacturerWorldMap } from '@/components/ManufacturerWorldMap';
import { NewsFeatureCard } from '@/components/NewsFeatureCard';
import { TagChip } from '@/components/TagChip';
import {
  getGuideBySlug,
  getGuides,
  getManufacturers,
  getArticles,
  getRobots,
  getDeploymentsForManufacturer,
} from '@/lib/data';
import { getDisplayableAsset } from '@/lib/media';
import { getHomeFeaturedArticles } from '@/lib/articlePlacements';

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
      deployments: getDeploymentsForManufacturer(manufacturer.id).map((d) => ({
        lat: d.location.lat,
        lng: d.location.lng,
        customer: d.customer,
        status: d.status,
      })),
    }];
  });

  // 注目ロボット：更新日の新しい順に3件（FeaturedRobotsGrid用）
  const featuredRobots = [...getRobots()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  // HomeContentNavigator用プレビュー画像 — 手元にある商用許諾済み press kit 素材を静的指定
  const robotPreviewAssets = [
    { src: '/images/robots/agility-digit-hero.jpg', alt: 'Agility Digit 全身', label: 'Digit' },
    { src: '/images/robots/onex-neo-hero.jpg', alt: '1X NEO 全身', label: 'NEO' },
    { src: '/images/robots/agility-digit-inOperation.jpg', alt: 'Digit 稼働中', label: 'Digit in operation' },
    { src: '/images/robots/onex-neo-inOperation.jpg', alt: 'NEO 稼働中', label: 'NEO in operation' },
    { src: '/images/robots/agility-digit-side.jpg', alt: 'Digit 側面', label: 'Digit side' },
    { src: '/images/robots/onex-neo-scale.jpg', alt: 'NEO スケール比較', label: 'NEO scale' },
  ];

  const manufacturerPreviewAssets = [
    { src: '/images/robots/agility-digit-hero.jpg', alt: 'Agility Digit', label: 'Agility Robotics' },
    { src: '/images/robots/onex-neo-hero.jpg', alt: '1X NEO', label: '1X Technologies' },
    { src: '/images/robots/agility-digit-transparent.png', alt: 'Agility Digit 透過', label: 'Digit' },
    { src: '/images/robots/onex-neo-side.jpg', alt: '1X NEO 側面', label: 'NEO side' },
    { src: '/images/robots/agility-digit-endEffector.jpg', alt: 'Digit ハンド', label: 'Digit hand' },
    { src: '/images/robots/onex-neo-inOperation.jpg', alt: 'NEO 稼働中', label: 'NEO in operation' },
  ];

  // ガイドは「実際の導入現場」の記事画像を使い、実用性を伝える
  const guidePreviewAssets = [
    { src: '/images/articles/gxo-digit-100k-totes/hero.jpg', alt: 'GXO倉庫でのDigit導入', label: 'GXO' },
    { src: '/images/articles/jal-haneda-unitree-pilot-2026/hero.jpg', alt: 'JAL羽田でのUnitreeパイロット', label: 'JAL' },
    { src: '/images/articles/boston-dynamics-atlas-hyundai-rmac-june2026/hero.jpg', alt: 'Boston Dynamics Atlas RMAC', label: 'Atlas' },
    { src: '/images/robots/agility-digit-inOperation.jpg', alt: 'Digit 稼働中', label: 'Digit' },
    { src: '/images/robots/onex-neo-inOperation.jpg', alt: 'NEO 稼働中', label: 'NEO' },
  ];

  const homeFeaturedReports = getHomeFeaturedArticles(getArticles());

  const manufacturerById = Object.fromEntries(
    manufacturers.map((m) => [m.id, m])
  );

  return (
    <>
      <ManufacturerWorldMap
        manufacturers={mapPoints}
        heading={"日本の未来を\nヒューマノイドと共に\n切り開く。"}
        subcopy={"技術の理解から調達の実務まで、実装に必要なプロセスをすべて体系化。\n職種を問わず、社会実装に挑むすべての人が参照できる実践ガイドです。"}
      />

      <div className="site-container py-6 sm:py-10">
      <HomeContentNavigator
        robotAssets={robotPreviewAssets}
        manufacturerAssets={manufacturerPreviewAssets}
        guideAssets={guidePreviewAssets}
      />

      {featuredRobots.length > 0 && (
        <FeaturedRobotsGrid
          robots={featuredRobots}
          manufacturerById={manufacturerById}
        />
      )}

      {homeFeaturedReports.length > 0 && (
        <section className="py-8 sm:py-10 border-b border-border">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {homeFeaturedReports.map((report) => (
              <NewsFeatureCard
                key={report.id}
                report={report}
                className="min-h-[220px] sm:min-h-[240px] lg:min-h-[260px]"
              />
            ))}
          </div>
        </section>
      )}

      {featured && (
        <section className="py-8 sm:py-10 border-b border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-4">注目の導入ガイド</h2>
          <div className="border border-border bg-card">
            <div className="p-5 sm:p-6">
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
                  <TagChip key={topic} kind="guide-topic" value={topic} className="py-1" />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-8 sm:py-10">
        <div className="border border-border bg-card p-5 sm:p-6">
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
