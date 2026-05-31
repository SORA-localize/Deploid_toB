'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, Robot } from '@/data/types';
import { uiText } from '@/lib/uiText';

interface FavoriteCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  onRemove: (slug: string) => void;
  onSelect?: (slug: string) => void;
}

export function FavoriteCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  onRemove,
  onSelect,
}: FavoriteCardProps) {
  return (
    <div className="border border-neutral-300 bg-white p-3 hover:border-neutral-400 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        {onSelect ? (
          <button onClick={() => onSelect(robot.slug)} className="flex-1 min-w-0 text-left hover:underline">
            <h4 className="text-xs font-semibold text-neutral-900 truncate">
              {robot.nameJa ?? robot.name}
            </h4>
          </button>
        ) : (
          <Link href={`/robots/${robot.slug}`} className="flex-1 min-w-0 hover:underline">
            <h4 className="text-xs font-semibold text-neutral-900 truncate">
              {robot.nameJa ?? robot.name}
            </h4>
          </Link>
        )}
        <button
          type="button"
          aria-label={uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)}
          onClick={() => onRemove(robot.slug)}
          className="text-neutral-400 hover:text-neutral-900 flex-shrink-0 p-1 -m-1 rounded-sm hover:bg-neutral-100"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <ManufacturerLogoName
        name={manufacturerName ?? robot.manufacturerSlug}
        logo={manufacturerLogo}
        className="text-xs text-neutral-500"
        frameClassName="h-4 w-4"
        imageClassName="h-3 w-3"
      />
    </div>
  );
}
