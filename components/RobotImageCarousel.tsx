'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CameraOff } from 'lucide-react';
import type { ImageAsset, ImageRole } from '@/data/types';
import { imageRoleLabels, imageRoleOrder } from '@/lib/labels';
import { getDisplayableAsset } from '@/lib/media';
import { uiText } from '@/lib/uiText';

interface RobotImageCarouselProps {
  images?: Partial<Record<ImageRole, ImageAsset>>;
  /** BaseRecord.heroImage を hero スロットへ後方互換でフォールバック */
  fallbackHero?: ImageAsset;
}

export function RobotImageCarousel({ images, fallbackHero }: RobotImageCarouselProps) {
  const [idx, setIdx] = useState(0);
  const resolved: Partial<Record<ImageRole, ImageAsset>> = { ...images };
  if (!resolved.hero && fallbackHero) resolved.hero = fallbackHero;

  const slots = imageRoleOrder;
  const current = slots[idx];
  const img = getDisplayableAsset(resolved[current]);

  return (
    <div className="border border-border overflow-hidden bg-card">
      <div className="relative">
        <div className="aspect-[16/9] bg-muted flex flex-col items-center justify-center text-muted-foreground overflow-hidden">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.src} alt={img.alt} className="w-full h-full object-contain" />
          ) : (
            <>
              <CameraOff className="w-12 h-12 mb-3 opacity-15" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-medium opacity-60">
                {uiText.robots.imageRequested}
              </span>
              <span className="text-[11px] mt-1 opacity-40">
                {imageRoleLabels[current]} {uiText.robots.mainImageMissing}
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => setIdx((i) => (i - 1 + slots.length) % slots.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-card/90 hover:bg-card border border-border transition-colors"
          aria-label="前の画像"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % slots.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-card/90 hover:bg-card border border-border transition-colors"
          aria-label="次の画像"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="flex border-t border-border overflow-x-auto">
        {slots.map((role, i) => {
          const hasImage = Boolean(getDisplayableAsset(resolved[role]));
          return (
            <button
              key={role}
              onClick={() => setIdx(i)}
              className={`flex-1 min-w-fit whitespace-nowrap px-3 py-2 text-[11px] border-r border-border last:border-r-0 transition-colors ${
                i === idx
                  ? 'bg-primary text-primary-foreground'
                  : hasImage
                    ? 'bg-card text-foreground hover:bg-muted'
                    : 'bg-muted text-muted-foreground/70 hover:bg-muted'
              }`}
              title={hasImage ? undefined : '未投入'}
            >
              {imageRoleLabels[role]}
            </button>
          );
        })}
      </div>

      {img?.credit && (
        <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
          {uiText.common.credit}: {img.credit}
          {img.sourceUrl && (
            <>
              {' '}
              <a href={img.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                {uiText.common.source}
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
