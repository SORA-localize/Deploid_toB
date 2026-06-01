import Link from 'next/link';
import { ArrowRight, Bot, Building2, BookOpen, Calendar } from 'lucide-react';
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

  // 最新記事：公開日の新しい順に3件
  const latestReports = [...getReports()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <>
      <ManufacturerWorldMap
        manufacturers={mapPoints}
        heading="日本企業のためのヒューマノイドロボット導入ポータル"
        subcopy="製造業・物流・建設業向けに、ヒューマノイドロボットの選定から導入までを支援する情報基盤です。技術検証、調達プロセス、国内サポート体制を網羅的に解説します。"
      />

      <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="py-16 border-b border-neutral-200">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-8">主要コンテンツ</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link href="/robots" className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors bg-white">
            <Bot className="w-8 h-8 text-neutral-700 mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">ロボット</h3>
            <p className="text-sm text-neutral-600 mb-4">
              主要なヒューマノイド機種の詳細スペックと導入可能性を、導入判断軸で評価。
            </p>
            <span className="text-sm text-neutral-900 inline-flex items-center gap-1">
              詳しく見る
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link href="/manufacturers" className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors bg-white">
            <Building2 className="w-8 h-8 text-neutral-700 mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">メーカー</h3>
            <p className="text-sm text-neutral-600 mb-4">
              ヒューマノイド開発企業・代理店の事業概要と日本市場での対応状況。
            </p>
            <span className="text-sm text-neutral-900 inline-flex items-center gap-1">
              詳しく見る
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link href="/guides" className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors bg-white">
            <BookOpen className="w-8 h-8 text-neutral-700 mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">導入ガイド</h3>
            <p className="text-sm text-neutral-600 mb-4">
              調達プロセス、技術評価基準、法規制対応など、導入検討に必要な実務知識を体系的に整理。
            </p>
            <span className="text-sm text-neutral-900 inline-flex items-center gap-1">
              詳しく見る
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {featuredRobots.length > 0 && (
        <section className="py-16 border-b border-neutral-200">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900">注目ロボット</h2>
            <Link
              href="/robots"
              className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
            >
              すべて見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredRobots.map((robot) => {
              const manufacturer = getManufacturerForRobot(robot.manufacturerSlug);
              return (
                <RobotCard
                  key={robot.slug}
                  robot={robot}
                  manufacturerName={manufacturer?.name}
                  manufacturerLogo={manufacturer?.logo}
                />
              );
            })}
          </div>
        </section>
      )}

      {latestReports.length > 0 && (
        <section className="py-16 border-b border-neutral-200">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900">最新記事</h2>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
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
                className="border border-neutral-200 bg-white p-6 hover:border-neutral-400 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3 text-xs text-neutral-500">
                  <TagChip>
                    {reportTypeLabels[report.type]}
                  </TagChip>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {report.publishedAt}
                  </span>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2 leading-tight">
                  {report.titleJa ?? report.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-3 leading-relaxed line-clamp-3">
                  {report.summary}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-neutral-900">
                  続きを読む
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured && (
        <section className="py-16 border-b border-neutral-200">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-8">注目の導入ガイド</h2>
          <div className="border border-neutral-200 bg-white">
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {featured.titleJa ?? featured.title}
                  </h3>
                  <p className="text-neutral-600">{featured.summary}</p>
                </div>
                <Link
                  href={`/guides/${featured.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors ml-6"
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
        <div className="border border-neutral-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">このサイトについて</h2>
          <p className="text-neutral-600 mb-6 max-w-3xl">
            本ポータルは、日本企業の設備投資担当者・技術責任者を対象に、ヒューマノイドロボット導入に関する客観的な情報を提供します。
            特定メーカーの販売促進を目的とせず、導入判断に必要な技術情報・調達プロセス・リスク評価の枠組みを提示します。
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-neutral-900 hover:text-neutral-700"
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
