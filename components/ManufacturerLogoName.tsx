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
  const fallback = name.trim().slice(0, 2).toUpperCase();

  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      {displayLogo ? (
        <span
          className={`inline-flex shrink-0 items-center justify-center border border-neutral-200 bg-white ${frameClassName}`}
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
          className={`inline-flex shrink-0 items-center justify-center border border-neutral-300 bg-white text-[10px] font-semibold text-neutral-500 ${frameClassName}`}
        >
          {fallback}
        </span>
      ) : null}
      <span className={`min-w-0 truncate ${textClassName}`}>{name}</span>
    </span>
  );
}
