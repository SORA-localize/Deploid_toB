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
    <div className="group border border-neutral-300 bg-neutral-50 overflow-hidden hover:border-neutral-400 hover:-translate-y-1 hover:shadow-md transition-all duration-200 relative flex flex-col h-full">
      {showFavorite && (
        <button
          type="button"
          aria-label={
            isFavorite
              ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
              : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavoriteToggle?.(robot.slug);
          }}
          className="absolute top-3 right-3 z-30 p-1 text-neutral-400 transition-colors hover:text-neutral-700"
        >
          <Star
            className={`w-4 h-4 ${
              isFavorite ? 'fill-yellow-500 text-yellow-500' : ''
            }`}
          />
        </button>
      )}

      <div className="relative z-20 flex flex-col h-full pointer-events-none">
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
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-neutral-900 pointer-events-auto">
              <Link href={`/robots/${robot.slug}`} className="hover:underline">
                {robot.nameJa ?? robot.name}
              </Link>
            </h3>
          </div>
          <div className="pointer-events-auto">
            <ManufacturerLogoName
              name={manufacturerName ?? robot.manufacturerSlug}
              logo={manufacturerLogo}
              className="mb-1 text-xs text-neutral-500"
              frameClassName="h-4 w-4"
              imageClassName="h-3 w-3"
            />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
              {specRows.map((row) => (
                <div key={row.label}>
                  <dt className="text-neutral-500">{row.label}</dt>
                  <dd
                    className={
                      row.label === '段階' && statusReady
                        ? 'text-green-700 font-medium'
                        : 'text-neutral-900 font-medium'
                    }
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-300">
            <span className="text-xs text-neutral-700">
              {uiText.common.viewDetails}
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>
        </div>
      </div>

      <Link
        href={`/robots/${robot.slug}`}
        className="absolute inset-0 z-10"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
