'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, ManufacturerLogos, Robot } from '@/data/types';
import { uiText } from '@/lib/uiText';

interface FavoriteCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  manufacturerLogos?: ManufacturerLogos;
  onRemove: (id: string) => void;
  onSelect?: (id: string) => void;
}

export function FavoriteCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  manufacturerLogos,
  onRemove,
  onSelect,
}: FavoriteCardProps) {
  return (
    <div className="card-data relative group p-3">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(robot.id)}
          className="absolute inset-0 z-10 w-full h-full cursor-pointer rounded-sm"
          aria-label={robot.nameJa ?? robot.name}
        />
      ) : (
        <Link
          href={`/robots/${robot.slug}`}
          className="absolute inset-0 z-10 w-full h-full cursor-pointer rounded-sm"
          aria-label={robot.nameJa ?? robot.name}
        />
      )}

      <div className="relative z-0 pointer-events-none">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-card-foreground truncate group-hover:underline">
              {robot.nameJa ?? robot.name}
            </h4>
          </div>
        </div>
        <ManufacturerLogoName
          name={manufacturerName ?? robot.manufacturerId}
          logo={manufacturerLogo}
          logos={manufacturerLogos}
          variant="combined"
          className="text-xs text-muted-foreground"
          targetAreaPx={16 * 56}
          maxHeightPx={16}
          maxWidthPx={56}
          hideName
        />
      </div>

      <button
        type="button"
        aria-label={uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(robot.id);
        }}
        className="absolute top-2 right-2 z-20 text-muted-foreground hover:text-foreground flex-shrink-0 p-1 rounded-sm hover:bg-muted transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
