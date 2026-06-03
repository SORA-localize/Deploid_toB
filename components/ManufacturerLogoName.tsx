import { CameraOff } from 'lucide-react';
import type { ImageAsset } from '@/data/types';
import { getDisplayableAsset } from '@/lib/media';

interface ManufacturerLogoNameProps {
  name: string;
  logo?: ImageAsset;
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
  textClassName?: string;
  showPlaceholder?: boolean;
}

export function ManufacturerLogoName({
  name,
  logo,
  className = '',
  frameClassName = 'h-5 w-5',
  imageClassName = 'h-4 w-4',
  textClassName = '',
  showPlaceholder = true,
}: ManufacturerLogoNameProps) {
  const displayLogo = getDisplayableAsset(logo);

  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      {displayLogo ? (
        <span
          // ロゴは白背景前提のものが多いため、フレームは意図的に白の
          // メディアバックプレートとして残す（ページ/カード面には使わない）。
          className={`inline-flex shrink-0 items-center justify-center border border-border bg-white ${frameClassName}`}
          title={displayLogo.credit}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayLogo.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className={`object-contain ${imageClassName}`}
          />
        </span>
      ) : showPlaceholder ? (
        <span
          aria-hidden="true"
          className={`inline-flex shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground/70 ${frameClassName}`}
          title="Official logo requested"
        >
          <CameraOff className="h-2.5 w-2.5" />
        </span>
      ) : null}
      <span className={`min-w-0 truncate ${textClassName}`}>{name}</span>
    </span>
  );
}
