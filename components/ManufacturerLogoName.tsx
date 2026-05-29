import type { ImageAsset } from '@/data/types';
import { getDisplayableAsset } from '@/lib/media';

interface ManufacturerLogoNameProps {
  name: string;
  logo?: ImageAsset;
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
  textClassName?: string;
}

export function ManufacturerLogoName({
  name,
  logo,
  className = '',
  frameClassName = 'h-5 w-5',
  imageClassName = 'h-4 w-4',
  textClassName = '',
}: ManufacturerLogoNameProps) {
  const displayLogo = getDisplayableAsset(logo);

  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      {displayLogo && (
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
      )}
      <span className={`min-w-0 truncate ${textClassName}`}>{name}</span>
    </span>
  );
}
