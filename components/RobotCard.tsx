'use client';

import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, Robot } from '@/data/types';
import { getDisplayableAsset } from '@/lib/media';
import { getRobotCardSpecRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

interface RobotCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (slug: string) => void;
}

export function RobotCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  showFavorite = false,
  isFavorite = false,
  onFavoriteToggle,
}: RobotCardProps) {
  const specRows = getRobotCardSpecRows(robot);
  const statusReady =
    robot.deploymentStage === 'production' || robot.deploymentStage === 'limited-production';

  return (
    <div className="border border-neutral-300 bg-neutral-50 overflow-hidden hover:border-neutral-400 hover:-translate-y-1 hover:shadow-md transition-all duration-200 relative">
      {showFavorite && (
        <button
          type="button"
          aria-label={`${robot.nameJa ?? robot.name} を${isFavorite ? 'お気に入りから外す' : 'お気に入りに追加する'}`}
          onClick={(e) => {
            e.preventDefault();
            onFavoriteToggle?.(robot.slug);
          }}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white border border-neutral-300 transition-colors"
        >
          <Star
            className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-400'}`}
          />
        </button>
      )}

      <Link href={`/robots/${robot.slug}`}>
        <div className="aspect-[4/3] bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-xs text-neutral-500 overflow-hidden">
          {(() => {
            const hero = getDisplayableAsset(robot.images?.hero ?? robot.heroImage);
            return hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.src} alt={hero.alt} className="h-full w-full object-contain" />
            ) : (
              uiText.robots.mainImageMissing
            );
          })()}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-neutral-900">{robot.nameJa ?? robot.name}</h3>
          </div>
          <ManufacturerLogoName
            name={manufacturerName ?? robot.manufacturerSlug}
            logo={manufacturerLogo}
            className="mb-1 text-xs text-neutral-500"
            frameClassName="h-4 w-4"
            imageClassName="h-3 w-3"
          />
          <p className="text-xs text-neutral-600 mb-4 leading-relaxed line-clamp-2">{robot.summary}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
            {specRows.map((row) => (
              <div key={row.label}>
                <dt className="text-neutral-500">{row.label}</dt>
                <dd
                  className={
                    row.label === 'ステータス' && statusReady
                      ? 'text-green-700 font-medium'
                      : 'text-neutral-900 font-medium'
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between pt-3 border-t border-neutral-300">
            <span className="text-xs text-neutral-700">
              {uiText.common.viewDetails}
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>
        </div>
      </Link>
    </div>
  );
}
